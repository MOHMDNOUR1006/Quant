/**
 * QUANT AI — SPA Router with Zero-Trust Authentication Guard
 * 
 * Routes are gated: unauthenticated users see Login only.
 * Checks are completely asynchronous due to encrypted state.
 */
class Router {
    constructor(routes) {
        this.routes = routes;
        this.viewContainer = document.getElementById('view-container');
        this.titleElement = document.getElementById('top-bar-title');
        this.currentView = null;
        this.currentRoute = null;
        this.navigationVersion = 0;
        this.publicRoutes = ['login', 'onboarding']; // No sidebar for these
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());

        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.getAttribute('data-route');
                window.location.hash = route === 'welcome' ? '' : route;
            });
        });

        this.handleRoute();
    }

    async handleRoute() {
        const navigationVersion = ++this.navigationVersion;
        const rawHref = window.location.href;
        let coopRoomId = null;

        // Parse room ID from URL hash or query params
        const roomMatch = rawHref.match(/[?&#]room=([a-zA-Z0-9_-]+)/);
        if (roomMatch) {
            coopRoomId = roomMatch[1];
            sessionStorage.setItem('pending_coop_room', coopRoomId);
        } else {
            coopRoomId = sessionStorage.getItem('pending_coop_room');
        }

        let hash = window.location.hash.slice(1) || 'welcome';
        if (hash.includes('coop?room=')) {
            hash = 'chat';
        }

        // ─── Zero-Trust Auth Guard (Async) ────────────────────────
        const isLoggedIn = await QuantState.isLoggedIn();
        if (navigationVersion !== this.navigationVersion) return;
        let isOnboarded = false;
        
        if (!isLoggedIn) {
            hash = 'login';
        } else {
            isOnboarded = await QuantState.isOnboarded();
            if (navigationVersion !== this.navigationVersion) return;
            if (!isOnboarded && hash !== 'onboarding') {
                hash = 'onboarding';
            }
        }

        // Normalize unknown routes
        if (!this.routes[hash]) {
            hash = isLoggedIn ? (coopRoomId ? 'chat' : 'welcome') : 'login';
        }

        // If user is authenticated and room ID exists
        if (isLoggedIn && isOnboarded && coopRoomId && window.CoopRoomManager) {
            sessionStorage.removeItem('pending_coop_room');
            hash = 'chat';
            setTimeout(() => window.CoopRoomManager.handleIncomingLink(coopRoomId), 600);
        }

        const isPublic = this.publicRoutes.includes(hash);
        const viewClass = this.routes[hash].view;
        const title = this.routes[hash].title;

        // ─── Toggle Sidebar & Header visibility ────────────────
        const sidebar = document.getElementById('sidebar');
        const topBar = document.querySelector('.top-bar');
        if (sidebar) sidebar.style.display = isPublic ? 'none' : '';
        if (topBar) topBar.style.display = isPublic ? 'none' : '';

        // ─── Update Nav UI ─────────────────────────────────────
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-route') === hash) {
                item.classList.add('active');
            }
        });


        if (this.titleElement) this.titleElement.textContent = title;
        if (window.i18n) window.i18n.translateDOM();

        // ─── Update Agent Status in sidebar ────────────────────
        this.updateSidebarAgentStatus();

        // ─── Transition out ────────────────────────────────────
        if (this.currentView) {
            this.viewContainer.classList.add('fade-out');
            await this.sleep(300);
            if (navigationVersion !== this.navigationVersion) return;
            if (this.currentView.destroy) this.currentView.destroy();
        } else {
            this.viewContainer.classList.add('fade-out');
        }

        // ─── Render new view ───────────────────────────────────
        this.currentRoute = hash;
        this.currentView = new viewClass(this.viewContainer);
        try {
            if (this.currentView.render.constructor.name === "AsyncFunction") {
                await this.currentView.render();
            } else {
                this.currentView.render();
            }
        } catch (renderError) {
            console.error(`[Router Error] Rendering route "${hash}" failed:`, renderError);
            const isAr = window.i18n?.currentLang === 'ar';
            this.viewContainer.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 48px 24px; max-width: 600px; margin: 40px auto; border-radius: 16px;">
                    <h3 style="color: var(--status-disconnected); margin-bottom: 12px;">⚠️ ${isAr ? 'تعذر تحميل هذه الصفحة' : 'Failed to load this view'}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">${renderError.message || renderError}</p>
                    <button class="btn-primary" onclick="window.location.hash='welcome';" style="padding: 10px 24px; border-radius: 8px;">${isAr ? 'العودة للرئيسية' : 'Back to Home'}</button>
                </div>
            `;
        }
        if (navigationVersion !== this.navigationVersion) return;

        // Firebase-backed chrome is secondary. Do not block navigation or
        // language changes on subscription/avatar network requests.
        if (!isPublic) this.refreshAuthenticatedChrome(navigationVersion);

        // ─── Transition in ─────────────────────────────────────
        requestAnimationFrame(() => {
            this.viewContainer.classList.remove('fade-out');
            this.viewContainer.classList.add('fade-in');
            setTimeout(() => this.viewContainer.classList.remove('fade-in'), 300);
        });
    }

    async rerenderCurrentView() {
        const route = this.routes[this.currentRoute];
        if (!route || !this.viewContainer) return;

        const navigationVersion = ++this.navigationVersion;
        if (this.currentView?.destroy) this.currentView.destroy();
        this.currentView = new route.view(this.viewContainer);

        try {
            await this.currentView.render();
        } catch (error) {
            console.error('Could not refresh the current view after changing language:', error);
            return;
        }

        if (navigationVersion !== this.navigationVersion) return;
        requestAnimationFrame(() => {
            this.viewContainer.classList.remove('fade-out');
            this.viewContainer.classList.add('fade-in');
            setTimeout(() => this.viewContainer.classList.remove('fade-in'), 300);
        });
    }

    refreshAuthenticatedChrome(navigationVersion) {
        Promise.allSettled([
            this.updateSidebarSubscriptionBadge(),
            this.updateHeaderAvatar()
        ]).then(() => {
            if (navigationVersion === this.navigationVersion) {
                this.updateSidebarAgentStatus();
            }
        });
    }

    updateSidebarAgentStatus() {
        const statusEl = document.querySelector('.sidebar-footer .agent-status-mini');
        if (!statusEl) return;
        const status = QuantState.getAgentStatus();
        ['connected', 'disconnected', 'busy', 'executing', 'waiting'].forEach(s => statusEl.classList.remove(s));
        statusEl.classList.add(status);
        const label = statusEl.querySelector('span');
        if (label) {
            label.textContent = window.i18n.t(`status.${status}`);
        }
    }


    async updateSidebarSubscriptionBadge() {
        const subNavBadge = document.querySelector('.nav-links a[data-route="subscription"] span:last-child');
        if (!subNavBadge) return;
        
        const plan = await QuantState.getSubscriptionPlan();
        const badgeColors = {
            plus: 'background: #2563eb; color: white;',
            pro: 'background: linear-gradient(135deg, #a855f7, #ef4444); color: white;',
            ultra: 'background: linear-gradient(135deg, #f59e0b, #10b981); color: white;',
            free: 'background: #475569; color: #cbd5e1;'
        };
        subNavBadge.style.cssText = `font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; margin-left: 8px; font-weight: 800; ${badgeColors[plan] || badgeColors.free}`;
        subNavBadge.textContent = plan.toUpperCase();
    }

    async updateHeaderAvatar() {
        const avatarEl = document.querySelector('.user-avatar');
        if (!avatarEl) return;
        
        try {
            await QuantState.fetchLiveSubscription();
        } catch (e) {}

        const identity = await QuantState.getIdentity();
        
        if (identity && (identity.displayName || identity.email)) {
            const plan = (identity.plan || 'free').toLowerCase();
            if (window.MNEcosystemAuth) {
                avatarEl.innerHTML = window.MNEcosystemAuth.renderAvatarHTML({
                    photoURL: identity.avatarUrl || '',
                    displayName: identity.displayName || identity.email,
                    plan: plan,
                    size: 38,
                    onClickStr: "window.location.hash='profile'"
                });
            } else {
                const borderMap = {
                    plus: 'border: 2.5px solid #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.5);',
                    pro: 'border: 3px solid #f59e0b; box-shadow: 0 0 12px rgba(245,158,11,0.5);',
                    ultra: 'border: 3.5px solid #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.6);',
                    free: 'border: 1.5px solid #475569;'
                };
                const styleStr = borderMap[plan] || borderMap.free;
                if (identity.avatarUrl) {
                    avatarEl.innerHTML = `<img src="${identity.avatarUrl}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; ${styleStr} cursor: pointer;" onclick="window.location.hash='profile'" alt="Avatar">`;
                } else {
                    const initial = (identity.displayName || 'U').charAt(0).toUpperCase();
                    avatarEl.innerHTML = `<div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); ${styleStr} display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; cursor: pointer;" onclick="window.location.hash='profile'">${initial}</div>`;
                }
            }
        } else {
            avatarEl.innerHTML = `<div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-hover); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-muted); cursor: pointer;" onclick="window.location.hash='login'">?</div>`;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

