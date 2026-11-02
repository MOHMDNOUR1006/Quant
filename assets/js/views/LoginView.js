/**
 * LoginView — Google sign-in backed by Firebase Authentication.
 */
class LoginView {
    constructor(container) {
        this.container = container;
        this.loading = false;
    }

    async render() {
        const lang = window.i18n.currentLang;
        this.container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 64px);">
                <div class="glass-card" style="width: 420px; padding: 40px; text-align: center; position: relative;">
                    <!-- Language Selector in Login Card -->
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
                        <select class="lang-switch-select" onchange="window.i18n.setLanguage(this.value)" style="padding: 4px 8px; font-size: 0.8rem;">
                            <option value="ar" ${lang === 'ar' ? 'selected' : ''}>العربية</option>
                            <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
                            <option value="ja" ${lang === 'ja' ? 'selected' : ''}>にほんご</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <span style="font-family: var(--font-heading); font-size: 36px; font-weight: 800; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Q</span>
                        <span style="font-family: var(--font-heading); font-size: 24px; font-weight: 600; letter-spacing: 3px; margin-left: 8px; color: var(--text-primary);">QUANT AI</span>
                    </div>

                    <h2 style="font-size: 1.4rem; margin-bottom: 8px;">${window.i18n.t('login.title')}</h2>
                    <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 0.9rem;">${window.i18n.t('login.subtitle')}</p>

                    <div id="login-error" style="display: none; background: rgba(239,68,68,0.15); border: 1px solid var(--status-disconnected); color: var(--status-disconnected); padding: 10px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; text-align: start;"></div>
                    
                    <div id="login-actions">
                        <button id="google-login-btn" type="button" class="google-signin-button" style="width: 100%; min-height: 48px;">
                            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" focusable="false">
                                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z"/>
                                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/>
                                <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"/>
                                <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"/>
                            </svg>
                            <span>${lang === 'ar' ? 'المتابعة باستخدام Google' : (lang === 'ja' ? 'Google で続行' : 'Continue with Google')}</span>
                        </button>
                    </div>

                    <div id="login-loader" style="display: none; margin-top: 24px;">
                        <div class="css-loader" style="width: 24px; height: 24px; border-width: 3px; margin: 0 auto;"></div>
                        <p style="margin-top: 12px; font-size: 0.85rem; color: var(--primary-color);">Cryptographic verification in progress...</p>
                    </div>

                    <p style="margin-top: 32px; font-size: 0.8rem; color: var(--text-muted);">
                        ${window.i18n.t('login.policy_text')}
                    </p>
                </div>
            </div>
        `;

        try {
            this.firebaseAuth = await import('../firebase-auth.js');
            this.container.querySelector('#google-login-btn').addEventListener('click', () => this.signIn());
        } catch (error) {
            this.showError('Firebase Authentication could not load. Check the network connection and try again.');
        }
    }

    async signIn() {
        this.setLoading(true);
        this.showError('');
        try {
            let user;
            if (window.quantAgent?.isNative) {
                const clientId = window.AuthConfig?.GOOGLE_DESKTOP_CLIENT_ID?.trim();
                if (!clientId) {
                    throw new Error('أضف معرّف OAuth من نوع Desktop app إلى GOOGLE_DESKTOP_CLIENT_ID في assets/js/config.js ثم أعد بناء التطبيق.');
                }
                const invoke = window.__TAURI__?.core?.invoke;
                const openUrl = window.__TAURI__?.opener?.openUrl;
                if (!invoke || !openUrl) throw new Error('تعذر بدء تسجيل الدخول عبر متصفح النظام.');
                const { authorizationUrl } = await invoke('google_oauth_begin', { clientId });
                await openUrl(authorizationUrl);
                const tokens = await invoke('google_oauth_finish');
                user = await this.firebaseAuth.signInWithGoogleCredential(tokens.idToken, tokens.accessToken);
            } else {
                user = await this.firebaseAuth.signInWithGoogle();
            }
            await QuantState.createFirebaseSession(user);
            const isOnboarded = await QuantState.isOnboarded();
            window.location.hash = isOnboarded ? 'welcome' : 'onboarding';
            await window.appRouter.handleRoute();
        } catch (error) {
            console.error('[MN Quant Google sign-in]', error);
            const messages = {
                'auth/unauthorized-domain': 'أضف نطاق الموقع إلى Firebase Authentication > Settings > Authorized domains.',
                'auth/operation-not-allowed': 'فعّل تسجيل الدخول باستخدام Google في Firebase Authentication > Sign-in method.',
                'auth/popup-blocked': 'اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.',
                'auth/popup-closed-by-user': ''
            };
            const rawMessage = typeof error === 'string'
                ? error
                : (error?.message || (error && typeof error === 'object' ? JSON.stringify(error) : String(error)));
            const errorCode = error?.code;
            const message = Object.prototype.hasOwnProperty.call(messages, errorCode)
                ? messages[errorCode]
                : (rawMessage || 'تعذر تسجيل الدخول باستخدام Google.');
            if (message) this.showError(message);
        } finally {
            this.setLoading(false);
        }
    }

    showError(msg) {
        const err = this.container.querySelector('#login-error');
        if (!err) return;
        if (msg) {
            err.textContent = msg;
            err.style.display = 'block';
        } else {
            err.style.display = 'none';
        }
    }

    setLoading(isLoading) {
        this.loading = isLoading;
        const actions = this.container.querySelector('#login-actions');
        const loader = this.container.querySelector('#login-loader');
        if (actions) actions.style.display = isLoading ? 'none' : 'block';
        if (loader) loader.style.display = isLoading ? 'block' : 'none';
    }

    destroy() {
        this.firebaseAuth = null;
    }
}
