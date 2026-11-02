document.addEventListener('DOMContentLoaded', () => {
    // ─── Apply saved theme ─────────────────────────────────
    applyTheme(QuantState.getTheme());

    // ─── Define ALL application routes ─────────────────────
    const routes = {
        'login':        { view: LoginView,                title: 'Sign In — QUANT AI' },
        'onboarding':   { view: OnboardingView,           title: 'Setup — QUANT AI' },
        'welcome':      { view: WelcomeView,              title: 'Welcome to QUANT AI' },
        'chat':         { view: ChatView,                 title: 'QUANT Workspace' },
        'history':      { view: ConversationHistoryView,  title: 'Activity History' },
        'agent':        { view: AgentSetupView,           title: 'Agent Configuration' },
        'workspace':    { view: WorkspaceSetupView,       title: 'Workspace Settings' },
        'permissions':  { view: PermissionCenterView,     title: 'Permission Center' },
        'downloads':    { view: DownloadsView,             title: 'Agent & Downloads Center' },
        'profile':      { view: ProfileView,              title: 'User Profile' },
        'subscription': { view: SubscriptionView,         title: 'Plans & Billing' },
        'settings':     { view: SettingsView,             title: 'System Settings' },
        'info':         { view: InfoView,                 title: 'Platform Information' }
    };

    // ─── Initialize Router ─────────────────────────────────
    window.appRouter = new Router(routes);

    // ─── Translate static elements on load ─────────────────
    if (window.i18n) window.i18n.translateDOM();

    // ─── Bind Friends / Co-Op Room Button ──────────────────
    const coopBtn = document.getElementById('top-bar-coop-btn');
    if (coopBtn) {
        coopBtn.addEventListener('click', () => window.CoopRoomManager.openModal());
    }

    // ─── Particles ─────────────────────────────────────────
    if (QuantState.getParticles()) {
        initParticles();
    }

    // ─── Remove global loader ──────────────────────────────
    const dismissLoader = () => {
        const loader = document.getElementById('global-loader');
        if (loader && loader.classList.contains('active')) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.classList.remove('active');
                loader.style.display = 'none';
            }, 500);
        }
    };
    setTimeout(dismissLoader, 1200);
});

// Fallback safety timeout so app never hangs indefinitely on global loader
setTimeout(() => {
    const loader = document.getElementById('global-loader');
    if (loader && loader.classList.contains('active')) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.classList.remove('active');
            loader.style.display = 'none';
        }, 500);
    }
}, 3000);

// ─── Universal FirebaseSync Fallback Layer ──────────────────────
// Guarantees CoopRoomManager works smoothly even if offline, behind a firewall,
// or if the external Firebase CDN script has not resolved yet.
if (!window.FirebaseSync) {
    window.FirebaseSync = {
        async write(roomCode, subPath, value) {
            try {
                localStorage.setItem(`coop_${roomCode}_${subPath}`, JSON.stringify(value));
                window.dispatchEvent(new CustomEvent('coop_sync', { detail: { roomCode, subPath, value } }));
            } catch (e) {}
        },
        async patch(roomCode, subPath, value) {
            try {
                const k = `coop_${roomCode}_${subPath}`;
                const cur = JSON.parse(localStorage.getItem(k) || '{}');
                const next = { ...cur, ...value };
                localStorage.setItem(k, JSON.stringify(next));
                window.dispatchEvent(new CustomEvent('coop_sync', { detail: { roomCode, subPath, value: next } }));
            } catch (e) {}
        },
        async push(roomCode, subPath, value) {
            try {
                const k = `coop_${roomCode}_${subPath}`;
                const list = JSON.parse(localStorage.getItem(k) || '[]');
                list.push({ ...value, ts: Date.now() });
                localStorage.setItem(k, JSON.stringify(list));
                window.dispatchEvent(new CustomEvent('coop_sync', { detail: { roomCode, subPath, value: list } }));
            } catch (e) {}
        },
        async remove(roomCode, subPath = '') {
            try {
                localStorage.removeItem(`coop_${roomCode}_${subPath}`);
            } catch (e) {}
        },
        on(roomCode, subPath, callback) {
            const handler = (e) => {
                if (e.detail?.roomCode === roomCode && e.detail?.subPath === subPath) {
                    callback(e.detail.value);
                }
            };
            window.addEventListener('coop_sync', handler);
            try {
                const initial = localStorage.getItem(`coop_${roomCode}_${subPath}`);
                if (initial) callback(JSON.parse(initial));
            } catch (e) {}
            return () => window.removeEventListener('coop_sync', handler);
        },
        removeOnDisconnect() {}
    };
}

// ─── Co-Op Shared Session Manager (الأصدقاء / الجلسة المشتركة) ───
// Synced live across devices via Firebase Realtime Database (see
// firebase-sync.js). Every other file (ChatView.js etc.) still calls the
// exact same methods/properties as before — only the transport underneath
// changed from BroadcastChannel/localStorage to a real cross-device backend.
const CoopRoomManager = {
    isActive: false,
    isPublicChat: false,
    roomCode: '',
    roomOwner: '',
    roomOwnerAvatar: '',
    currentUser: '',
    currentUserAvatar: '',
    members: [],
    sharedApiEnabled: false,
    allowedUsersForApi: [],
    isExecuting: false,
    activeUser: '',
    taskQueue: [],
    waitingOverlay: null,

    _memberKey: null,          // this device's own key under /members/{key}
    _unsubMembers: null,
    _unsubRoomMeta: null,
    _unsubChat: null,
    _unsubSession: null,

    async init() {
        const profile = (await QuantState.getProfile()) || {};
        const identity = (await QuantState.getIdentity()) || {};
        this.currentUser = profile.name || identity.displayName || 'مستخدم';
        this.currentUserAvatar = identity.avatarUrl || '';

        if (!this.roomCode) {
            this.roomCode = 'qnt_coop_' + Math.random().toString(36).substring(2, 9);
            this.roomOwner = this.currentUser;
            this.roomOwnerAvatar = this.currentUserAvatar;
        }
    },

    // ─── Firebase-backed persistence ───────────────────────────────────
    // "saveRoomState" now only writes the room's shared metadata (owner,
    // API sharing settings, public/private flag). Member presence is
    // handled separately via /members/{key} nodes so one member joining
    // or leaving doesn't require rewriting the whole member list (and so
    // disconnect cleanup — see removeOnDisconnect — works per-member).
    async saveRoomState() {
        await window.FirebaseSync.write(this.roomCode, 'meta', {
            roomOwner: this.roomOwner,
            roomOwnerAvatar: this.roomOwnerAvatar,
            sharedApiEnabled: this.sharedApiEnabled,
            allowedUsersForApi: this.allowedUsersForApi,
            isPublicChat: this.isPublicChat
        });
    },

    // Kept for API compatibility with any old caller; state now streams in
    // live via subscribeToRoom() instead of being fetched once.
    loadRoomState() {
        return null;
    },

    // "broadcast" keeps its old name/signature so ChatView.js needs zero
    // changes, but now actually reaches other devices via Firebase.
    broadcast(type, payload = {}) {
        if (type === 'CHAT_MESSAGE') {
            window.FirebaseSync.write(this.roomCode, 'chat_state', payload);
        } else if (type === 'ROOM_STATE_UPDATE') {
            this.saveRoomState();
        } else if (type === 'SESSION_STARTED') {
            window.FirebaseSync.write(this.roomCode, 'session', { started: true });
        }
        // MEMBER_JOINED is handled directly in handleIncomingLink via
        // registerMember(), since it needs a disconnect-cleanup hook.
    },

    // ─── Live subscriptions ─────────────────────────────────────────────
    // Wires up all real-time listeners for this room. Safe to call once
    // per room join (owner or friend side) — un-subscribes any previous
    // listeners first so re-entering a room doesn't double-fire.
    subscribeToRoom() {
        this.unsubscribeFromRoom();

        this._unsubMembers = window.FirebaseSync.on(this.roomCode, 'members', (membersObj) => {
            this.members = membersObj ? Object.values(membersObj) : [];
            this.updateOwnerModalMembers();
        });

        this._unsubRoomMeta = window.FirebaseSync.on(this.roomCode, 'meta', (meta) => {
            if (!meta) return;
            this.roomOwner = meta.roomOwner ?? this.roomOwner;
            this.roomOwnerAvatar = meta.roomOwnerAvatar ?? this.roomOwnerAvatar;
            this.sharedApiEnabled = !!meta.sharedApiEnabled;
            this.allowedUsersForApi = meta.allowedUsersForApi || [];
            this.isPublicChat = !!meta.isPublicChat;
        });

        this._unsubChat = window.FirebaseSync.on(this.roomCode, 'chat_state', (chatState) => {
            const msgs = chatState?.messages;
            if (msgs && window.appRouter?.currentView instanceof ChatView) {
                window.appRouter.currentView.messages = msgs;
                QuantState.saveChatHistory(msgs);
                window.appRouter.currentView.refreshMessages();
            }
        });

        this._unsubSession = window.FirebaseSync.on(this.roomCode, 'session', (session) => {
            if (session?.started && !this.isActive) {
                this.isPublicChat = true;
                this.isActive = true;
                if (this.waitingOverlay) {
                    this.waitingOverlay.remove();
                    this.waitingOverlay = null;
                }
                window.location.hash = 'chat';
                if (window.appRouter?.currentView?.render) {
                    window.appRouter.currentView.render();
                }
            }
        });
    },

    unsubscribeFromRoom() {
        [this._unsubMembers, this._unsubRoomMeta, this._unsubChat, this._unsubSession, this._unsubApiRequests]
            .forEach(unsub => { if (unsub) unsub(); });
        this._unsubMembers = this._unsubRoomMeta = this._unsubChat = this._unsubSession = this._unsubApiRequests = null;
    },

    // ─── Shared-API relay (Option B: the key never leaves the owner's device) ───
    // The owner's device is the only one that ever reads apiConfig.apiKey and
    // calls provider.sendMessage(). A friend's device never touches the key —
    // it only writes a request node and listens for streamed response events
    // written back by the owner. This makes the owner's browser tab act like
    // a tiny relay, using the Firebase room itself as the transport instead
    // of running a real backend server.

    // Called once by the OWNER (the device that actually holds the API key)
    // right after opening/joining the room, so it can serve any friend's
    // relayed requests for as long as its tab stays open.
    listenForApiRequests() {
        if (this._unsubApiRequests) return; // already listening
        this._unsubApiRequests = window.FirebaseSync.on(this.roomCode, 'api_requests', async (requestsObj) => {
            if (!requestsObj) return;
            for (const [requestId, req] of Object.entries(requestsObj)) {
                if (req.status !== 'pending') continue; // already being served or done
                if (this.currentUser !== this.roomOwner) return; // safety: only the owner ever serves
                this._serveApiRequest(requestId, req);
            }
        });
    },

    // Runs on the OWNER's device: executes the actual provider.sendMessage()
    // call locally (the API key stays in this device's memory the whole
    // time) and streams every onEvent back into Firebase as it happens, so
    // the requesting friend sees the same live typing + tool cards.
    async _serveApiRequest(requestId, req) {
        // Claim it immediately so a second onValue firing (or a second
        // owner tab) doesn't double-serve the same request.
        await window.FirebaseSync.patch(this.roomCode, `api_requests/${requestId}`, { status: 'serving' });

        const apiConfig = await QuantState.getApiConfig();
        if (!apiConfig || !apiConfig.apiKey) {
            await window.FirebaseSync.write(this.roomCode, `api_responses/${requestId}`, {
                done: true, error: 'Owner has no API key configured.', events: []
            });
            return;
        }

        let eventSeq = 0;
        const pushEvent = async (ev) => {
            await window.FirebaseSync.write(this.roomCode, `api_responses/${requestId}/events/${eventSeq}`, ev);
            eventSeq++;
        };

        try {
            const provider = window.AIProviderFactory.getProvider(apiConfig);
            const responseText = await provider.sendMessage(req.messages, req.systemPrompt, {
                onEvent: (ev) => pushEvent(ev)
            });
            await window.FirebaseSync.patch(this.roomCode, `api_responses/${requestId}`, { done: true, finalText: responseText });
        } catch (e) {
            await window.FirebaseSync.patch(this.roomCode, `api_responses/${requestId}`, { done: true, error: e.message });
        } finally {
            await window.FirebaseSync.patch(this.roomCode, `api_requests/${requestId}`, { status: 'done' });
        }
    },

    // Called by a FRIEND's device (via ChatView.js) instead of calling
    // provider.sendMessage() directly. Writes the request, then streams
    // back events as the owner's device produces them — resolves once the
    // owner's relay marks the response done.
    requestOwnerApiCall(messages, systemPrompt, onEvent) {
        return new Promise((resolve, reject) => {
            const requestId = 'req_' + Math.random().toString(36).substring(2, 10);

            window.FirebaseSync.write(this.roomCode, `api_requests/${requestId}`, {
                status: 'pending',
                requester: this.currentUser,
                messages,
                systemPrompt
            });
            // Safety net: if this device disconnects (closed tab, lost
            // network) before the owner finishes responding, Firebase
            // itself cleans up the orphaned request/response nodes instead
            // of leaving them stuck forever.
            window.FirebaseSync.removeOnDisconnect(this.roomCode, `api_requests/${requestId}`);
            window.FirebaseSync.removeOnDisconnect(this.roomCode, `api_responses/${requestId}`);

            let seenEventCount = 0;
            const unsub = window.FirebaseSync.on(this.roomCode, `api_responses/${requestId}`, (resp) => {
                if (!resp) return;

                const events = resp.events ? Object.values(resp.events) : [];
                for (; seenEventCount < events.length; seenEventCount++) {
                    onEvent(events[seenEventCount]);
                }

                if (resp.done) {
                    unsub();
                    window.FirebaseSync.remove(this.roomCode, `api_requests/${requestId}`);
                    window.FirebaseSync.remove(this.roomCode, `api_responses/${requestId}`);
                    if (resp.error) reject(new Error(resp.error));
                    else resolve(resp.finalText || '');
                }
            });
        });
    },

    // Registers this device as a live member under /coop_rooms/{code}/members/{key}.
    // removeOnDisconnect means Firebase's own servers clean this entry up
    // the moment this device disconnects (closed tab, lost network, crash)
    // — the owner's list updates live without needing the friend to do
    // anything on the way out.
    async registerMember(memberInfo) {
        const key = 'm_' + Math.random().toString(36).substring(2, 10);
        this._memberKey = key;
        await window.FirebaseSync.write(this.roomCode, `members/${key}`, memberInfo);
        window.FirebaseSync.removeOnDisconnect(this.roomCode, `members/${key}`);
    },

    async openModal() {
        await this.init();
        this.isActive = true;

        if (!this.members.some(m => m.name === this.currentUser)) {
            this.members = [{
                name: this.currentUser,
                avatar: this.currentUserAvatar,
                isOwner: true,
                status: 'ready'
            }];
        }

        try {
            await this.registerMember({
                name: this.currentUser,
                avatar: this.currentUserAvatar,
                isOwner: true,
                status: 'ready'
            });
            await this.saveRoomState();
            this.subscribeToRoom();
            this.listenForApiRequests();
        } catch (err) {
            console.warn('[CoopRoomManager] Room registration warning:', err);
        }

        const isAr = window.i18n.currentLang === 'ar';
        const roomUrl = `${window.location.origin}${window.location.pathname}#coop?room=${this.roomCode}`;

        const overlay = document.createElement('div');
        overlay.id = 'coop-owner-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(5, 5, 10, 0.85); backdrop-filter: blur(12px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;
        `;

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = `
            max-width: 560px; width: 100%; background: var(--bg-surface);
            border: 1px solid var(--border-highlight); border-radius: 20px; padding: 28px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        `;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: var(--primary-color); display: flex; align-items: center; gap: 8px;">
                    <span>👥 ${isAr ? 'إعداد الجلسة الجماعية العامة' : 'Public Co-Op Session Setup'}</span>
                </h3>
                <button id="close-coop-modal" style="background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">✕</button>
            </div>

            <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 20px; line-height: 1.5;">
                ${isAr 
                    ? 'انسخ الرابط وأرسله لأصدقائك. سيتلقى أصدقاؤك رسالة الموافقة وعند دخولهم سيظهرون فوراً في القائمة أدناه، وبعدها اضغط (تأكيد واستمرار) للانطلاق سوياً.'
                    : 'Copy & share the invite link. Friends will confirm entry and wait until you click Confirm & Start.'
                }
            </p>

            <!-- Invite Link Card -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">🔗 ${isAr ? 'رابط المحادثة الجماعية:' : 'Public Session Link:'}</span>
                    <button id="copy-coop-link" class="btn-secondary" style="padding: 4px 12px; font-size: 0.75rem;">📋 ${isAr ? 'نسخ الرابط' : 'Copy Link'}</button>
                </div>
                <code style="font-size: 0.8rem; color: var(--accent-color); word-break: break-all; display: block; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 6px;">${roomUrl}</code>
            </div>

            <!-- Members List -->
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: var(--text-primary); display: flex; justify-content: space-between; align-items: center;">
                    <span>👥 ${isAr ? 'الأصدقاء المسجلون حالياً:' : 'Registered Friends:'}</span>
                    <span id="registered-count-badge" style="font-size: 0.8rem; background: rgba(0,229,255,0.2); color: var(--accent-color); padding: 2px 8px; border-radius: 10px;">${this.members.length} ${isAr ? 'مسجلين' : 'registered'}</span>
                </h4>
                <div id="coop-modal-members-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 160px; overflow-y: auto;">
                    ${this.renderMembersListHtml()}
                </div>
            </div>

            <!-- Shared API Key Protection Control -->
            <div style="background: rgba(140,82,255,0.08); border: 1px solid var(--border-highlight); border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">🔑 ${isAr ? 'تفعيل الـ API المشترك (Shared Owner API)' : 'Share My API Key'}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${isAr ? 'عند إيقافه، يُجبر كل صديق على استخدام الـ API الخاص به.' : 'When disabled, friends must use their own API key.'}</span>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" id="toggle-shared-api" ${this.sharedApiEnabled ? 'checked' : ''}>
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.2); transition: .4s; border-radius: 24px;"></span>
                    </label>
                </div>
            </div>

            <button id="start-coop-session-btn" class="btn-primary" style="width: 100%; padding: 14px; font-weight: 700; font-size: 1rem;">
                🚀 ${isAr ? 'تأكيد واستمرار (بدء المحادثة الجماعية)' : 'Confirm & Start Session'}
            </button>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        card.querySelector('#close-coop-modal').addEventListener('click', close);

        card.querySelector('#copy-coop-link').addEventListener('click', (e) => {
            navigator.clipboard.writeText(roomUrl);
            e.currentTarget.textContent = isAr ? 'تم النسخ ✓' : 'Copied ✓';
            setTimeout(() => { e.currentTarget.textContent = isAr ? '📋 نسخ الرابط' : 'Copy Link'; }, 1800);
        });

        // API Toggle
        card.querySelector('#toggle-shared-api').addEventListener('change', (e) => {
            this.sharedApiEnabled = e.target.checked;
            if (this.sharedApiEnabled) {
                this.promptSelectApiFriends();
            }
            this.saveRoomState();
        });

        // Confirm & Start
        card.querySelector('#start-coop-session-btn').addEventListener('click', async () => {
            this.isPublicChat = true;
            await this.saveRoomState();
            this.broadcast('SESSION_STARTED');
            close();
            window.location.hash = 'chat';
            if (window.appRouter?.currentView?.render) {
                window.appRouter.currentView.render();
            }
        });
    },

    renderMembersListHtml() {
        const isAr = window.i18n.currentLang === 'ar';
        return this.members.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(0,0,0,0.25); border-radius: 10px; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${m.avatar 
                        ? `<img src="${m.avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">`
                        : `<div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white;">${(m.name || 'U').charAt(0).toUpperCase()}</div>`
                    }
                    <span style="font-weight: 600; font-size: 0.88rem;">${this.escapeHtml(m.name)}</span>
                </div>
                ${m.isOwner 
                    ? `<span style="font-size: 0.7rem; background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${isAr ? 'رئيس المحادثة' : 'Room Owner'}</span>`
                    : `<span style="font-size: 0.7rem; color: var(--status-connected); font-weight: 600;">✓ ${isAr ? 'تم التسجيل' : 'Registered'}</span>`
                }
            </div>
        `).join('');
    },

    updateOwnerModalMembers() {
        const listEl = document.getElementById('coop-modal-members-list');
        const badgeEl = document.getElementById('registered-count-badge');
        if (listEl) listEl.innerHTML = this.renderMembersListHtml();
        if (badgeEl) badgeEl.textContent = `${this.members.length} ${window.i18n.currentLang === 'ar' ? 'مسجلين' : 'registered'}`;
    },

    promptSelectApiFriends() {
        const isAr = window.i18n.currentLang === 'ar';
        const friends = this.members.filter(m => !m.isOwner);

        if (friends.length === 0) {
            alert(isAr ? 'تم تفعيل الـ API المشترك. سيتمكن الأصدقاء القادمون من استخدامه.' : 'Shared API enabled.');
            this.allowedUsersForApi = this.members.map(m => m.name);
            return;
        }

        const choices = friends.map(f => f.name).join('\n- ');
        if (confirm(isAr 
            ? `تأكيد تفعيل الـ API المشترك للأصدقاء في الغرفة:\n\n- ${choices}\n\nهل تعطي الإذن لهؤلاء الأصدقاء بشرع استخدام الـ API الخاص بك؟`
            : `Allow these friends to use your API key?\n\n- ${choices}`
        )) {
            this.allowedUsersForApi = this.members.map(m => m.name);
        }
    },

    // ─── Friend Joining Flow ───
    // The friend's roomCode comes from the shared URL, so this device never
    // needs to guess it or read it from its own localStorage (which, being
    // per-device, would always be empty for the joining device anyway).
    async handleIncomingLink(code) {
        await this.init();
        this.roomCode = code;

        // Pull the current owner/room meta once up front so the join-consent
        // modal can show the real owner name immediately, then start the
        // live subscription so everything (including this same meta) keeps
        // updating afterwards.
        await new Promise((resolve) => {
            const unsub = window.FirebaseSync.on(this.roomCode, 'meta', (meta) => {
                if (meta) {
                    this.roomOwner = meta.roomOwner;
                    this.roomOwnerAvatar = meta.roomOwnerAvatar;
                    this.sharedApiEnabled = !!meta.sharedApiEnabled;
                    this.allowedUsersForApi = meta.allowedUsersForApi || [];
                }
                unsub();
                resolve();
            });
        });

        const isAr = window.i18n.currentLang === 'ar';
        const ownerTitle = this.roomOwner || 'رئيس المحادثة';

        // Display Join Consent Modal
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(5, 5, 10, 0.88); backdrop-filter: blur(14px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;
        `;

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = `
            max-width: 480px; width: 100%; background: var(--bg-surface);
            border: 1px solid var(--border-highlight); border-radius: 20px; padding: 28px; text-align: center;
        `;

        card.innerHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(140,82,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px auto; border: 1px solid var(--border-highlight);">👥</div>
            <h3 style="margin: 0 0 12px 0; color: var(--text-primary); font-size: 1.15rem;">
                ${isAr ? 'دعوة للانضمام إلى محادثة جماعية' : 'Public Co-Op Session Invite'}
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px; background: rgba(0,0,0,0.25); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
                ${isAr 
                    ? `الآن، هل أنت موافق على دخول المحادثة الجماعية مع <strong style="color: var(--accent-color);">${this.escapeHtml(ownerTitle)}</strong>؟`
                    : `Do you agree to join the public chat session with <strong style="color: var(--accent-color);">${this.escapeHtml(ownerTitle)}</strong>?`
                }
            </p>
            <div style="display: flex; gap: 12px;">
                <button id="agree-join-btn" class="btn-primary" style="flex: 1; padding: 12px; font-weight: 700;">
                    ✓ ${isAr ? 'موافق ودخول' : 'Agree & Join'}
                </button>
                <button id="decline-join-btn" class="btn-secondary" style="flex: 1; padding: 12px;">
                    ${isAr ? 'إلغاء' : 'Cancel'}
                </button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        card.querySelector('#decline-join-btn').addEventListener('click', () => {
            overlay.remove();
            window.location.hash = 'welcome';
        });

        card.querySelector('#agree-join-btn').addEventListener('click', async () => {
            overlay.remove();

            // Register this device as a live member. registerMember() also
            // arms Firebase's removeOnDisconnect, so if this friend closes
            // their tab or loses connection, their entry disappears from
            // the owner's list automatically — no manual leave step needed.
            const myInfo = { name: this.currentUser, avatar: this.currentUserAvatar, isOwner: false, status: 'ready' };
            await this.registerMember(myInfo);

            // Now subscribe live: this is what makes the owner's screen
            // update the moment this friend registers, and what lets this
            // friend's screen react the moment the owner clicks Start.
            this.subscribeToRoom();

            // Display Waiting Screen
            this.showWaitingScreen(ownerTitle);
        });
    },

    showWaitingScreen(ownerName) {
        const isAr = window.i18n.currentLang === 'ar';
        this.waitingOverlay = document.createElement('div');
        this.waitingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(5, 5, 10, 0.92); backdrop-filter: blur(16px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center;
        `;

        this.waitingOverlay.innerHTML = `
            <div class="glass-card" style="max-width: 460px; width: 100%; padding: 36px; border-color: var(--status-connected);">
                <div style="font-size: 48px; margin-bottom: 16px; color: var(--status-connected); animation: pulse 1.5s infinite;">✓</div>
                <h3 style="margin: 0 0 12px 0; color: var(--status-connected); font-size: 1.2rem;">
                    ${isAr ? 'أنت الآن مسجل بنجاح!' : 'Successfully Registered!'}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin: 0 0 20px 0;">
                    ${isAr 
                        ? `في انتظار انطلاق رئيس المحادثة (<strong style="color: var(--text-primary);">${this.escapeHtml(ownerName)}</strong>) للبدء...`
                        : `Waiting for the room owner (<strong style="color: var(--text-primary);">${this.escapeHtml(ownerName)}</strong>) to start the session...`
                    }
                </p>
                <div class="quantum-thinking-box" style="margin: 0 auto; justify-content: center;">
                    <div class="quantum-orb"></div>
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${isAr ? 'الاتصال بالجلسة نشط 🟢' : 'Session connection active 🟢'}</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.waitingOverlay);
    },

    queueTask(task) {
        this.taskQueue.push(task);
    },

    async finishTask(chatView) {
        this.isExecuting = false;
        this.activeUser = '';

        if (this.taskQueue.length > 0 && chatView) {
            const nextTask = this.taskQueue.shift();
            this.currentUser = nextTask.user;
            this.activeUser = nextTask.user;
            this.isExecuting = true;

            const input = chatView.container.querySelector('#chat-input');
            if (input) {
                input.value = nextTask.text;
                chatView.attachedFiles = nextTask.files || [];
                await chatView.sendMessage();
            }
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.CoopRoomManager = CoopRoomManager;

// ─── Theme System ──────────────────────────────────────────
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-theme', 'light-theme', 'neon-theme');

    if (theme === 'light') {
        body.classList.add('light-theme');
    } else if (theme === 'neon') {
        body.classList.add('neon-theme');
    } else {
        body.classList.add('dark-theme');
    }
}

// ─── Particle System ───────────────────────────────────────
function initParticles() {
    const container = document.getElementById('particle-container');
    if (!container) return;
    container.innerHTML = ''; // Clear existing

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(particle);
    }
}

function destroyParticles() {
    const container = document.getElementById('particle-container');
    if (container) container.innerHTML = '';
}
