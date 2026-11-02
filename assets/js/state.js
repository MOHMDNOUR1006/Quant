/**
 * QUANT AI — Zero Trust Architecture & Encrypted State Manager
 * 
 * - Sensitive data is encrypted at rest using Web Crypto API (AES-GCM).
 * - No user data is accepted without external provider verification.
 * - Sessions are created ONLY after cryptographic validation of identity tokens via backend gateway.
 * - All privileged operations pass through the PermissionGateway.
 */

// ─── Cryptography Engine (AES-256-GCM) ────────────────────
const CryptoEngine = {
    async getDerivationKey(password) {
        const enc = new TextEncoder();
        return crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
    },

    async getEncryptionKey(password, salt) {
        const keyMaterial = await this.getDerivationKey(password);
        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    },

    // Generates a device-specific key (since this is client-side local storage protection)
    async getLocalMasterKey() {
        // In a real high-security app, this might be derived from a user pin or biometric,
        // but for transparent local encryption of at-rest localStorage, we use a constant 
        // bound to the origin.
        let saltStr = localStorage.getItem('quant_crypto_salt');
        let salt;
        if (!saltStr) {
            salt = crypto.getRandomValues(new Uint8Array(16));
            localStorage.setItem('quant_crypto_salt', btoa(String.fromCharCode.apply(null, salt)));
        } else {
            const binary = atob(saltStr);
            salt = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                salt[i] = binary.charCodeAt(i);
            }
        }
        return this.getEncryptionKey("quant_local_device_key_v1", salt);
    },

    async encrypt(dataObj) {
        try {
            const key = await this.getLocalMasterKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder();
            const encoded = enc.encode(JSON.stringify(dataObj));
            
            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encoded
            );
            
            // Pack IV and Ciphertext together
            const ivStr = btoa(String.fromCharCode.apply(null, iv));
            const cipherStr = btoa(String.fromCharCode.apply(null, new Uint8Array(ciphertext)));
            return `${ivStr}.${cipherStr}`;
        } catch (e) {
            console.error("Encryption failed", e);
            return null;
        }
    },

    async decrypt(encryptedStr) {
        if (!encryptedStr || !encryptedStr.includes('.')) return null;
        try {
            const [ivStr, cipherStr] = encryptedStr.split('.');
            const ivBinary = atob(ivStr);
            const iv = new Uint8Array(ivBinary.length);
            for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);

            const cipherBinary = atob(cipherStr);
            const ciphertext = new Uint8Array(cipherBinary.length);
            for (let i = 0; i < cipherBinary.length; i++) ciphertext[i] = cipherBinary.charCodeAt(i);

            const key = await this.getLocalMasterKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            
            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decrypted));
        } catch (e) {
            console.error("Decryption failed", e);
            return null;
        }
    }
};

// ─── Centralized Permission Gateway ────────────────────────
const PermissionGateway = {
    async checkPrivilege(operation, details = {}) {
        let level = QuantState.getPermissionLevel();
        // Map old legacy levels if any
        if (level === 'autonomous') level = 'freedom';
        if (level === 'readonly') level = 'strict';
        
        // Zero Trust: if no session, block
        if (!(await QuantState.isLoggedIn())) {
            throw new Error("UNAUTHORIZED: No cryptographically verified session exists.");
        }

        const activeWs = window.quantAgent?.activeWorkspace || (window.quantAgent?.isNative ? '' : '/home/mohmad-nour/WebSites/mn-quant');
        const isOutsidePath = (targetPath) => {
            if (!targetPath) return false;
            const target = String(targetPath).replace(/\\/g, '/').replace(/\/+$/, '');
            // Relative tool paths resolve inside the selected workspace. Native
            // Rust commands enforce this boundary again before touching disk.
            if (!/^(?:[a-z]:\/|\/\/|\/)/i.test(target)) return target === '..' || target.startsWith('../');
            if (!activeWs) return true;
            const root = String(activeWs).replace(/\\/g, '/').replace(/\/+$/, '');
            const comparableTarget = target.toLowerCase();
            const comparableRoot = root.toLowerCase();
            return comparableTarget !== comparableRoot && !comparableTarget.startsWith(`${comparableRoot}/`);
        };

        // 1. LEVEL 3: FREEDOM (انعدام الأمان / المستوى الثالث)
        if (level === 'freedom') {
            // URL or External Upload require permission with 3 choices unless saved in always_urls
            if (operation === 'OPEN_URL' || operation === 'UPLOAD_EXTERNAL') {
                const targetUrl = details.url || details.target || '';
                const domain = this.extractDomain(targetUrl);
                
                const alwaysUrls = QuantState.getAlwaysUrls();
                if (alwaysUrls.includes(domain) || alwaysUrls.includes(targetUrl)) {
                    return true; // Approved automatically
                }

                const choice = await this.promptModal({
                    title: '🌐 طلب اتصال خارجي / رفع ملفات',
                    badge: 'المستوى الثالث: انعدام الأمان',
                    message: `النموذج يحاول ${operation === 'OPEN_URL' ? 'فتح موقع خارجي' : 'رفع ملفات أو صور خارج الإدارة'}:\n\n` +
                             `الموقع Target URL: ${targetUrl}`,
                    options: [
                        { id: 'yes', label: 'نعم (Yes)', class: 'btn-primary' },
                        { id: 'no', label: 'لا (No)', class: 'btn-secondary' },
                        { id: 'always_site', label: 'نعم دائماً لهذا الموقع بالتحديد', class: 'btn-secondary' }
                    ]
                });

                if (choice === 'always_site') {
                    QuantState.addAlwaysUrl(domain);
                    QuantState.logApproval(`${operation}: ${targetUrl}`, true);
                    return true;
                } else if (choice === 'yes') {
                    QuantState.logApproval(`${operation}: ${targetUrl}`, true);
                    return true;
                } else {
                    QuantState.logApproval(`${operation}: ${targetUrl}`, false);
                    throw new Error(`PERMISSION DENIED: Connection to ${targetUrl} rejected by user.`);
                }
            }

            // Terminal Execution: All commands allowed EXCEPT suspicious/dangerous commands
            if (operation === 'EXECUTE') {
                const cmd = details.command || '';
                const isDangerous = /(^|\s)(sudo|rm\s+-rf|mkfs|dd|fdisk|reboot|shutdown|chmod\s+-R\s+777|format)($|\s)/i.test(cmd);
                if (isDangerous) {
                    const choice = await this.promptModal({
                        title: '⚠️ تحذير: أمر تنفيذي خطير في الترمينال',
                        badge: 'المستوى الثالث: انعدام الأمان',
                        message: `النموذج يحاول تنفيذ أمر قد يكون خطيراً:\n\n\`${cmd}\`\n\nهل تعطي الموافقة لتنفيذه؟`,
                        options: [
                            { id: 'yes', label: 'نعم (تأكيد التشغيل)', class: 'btn-primary' },
                            { id: 'no', label: 'لا (إلغاء)', class: 'btn-secondary' }
                        ]
                    });
                    if (choice === 'yes') {
                        QuantState.logApproval(`EXECUTE (Dangerous): ${cmd}`, true);
                        return true;
                    } else {
                        QuantState.logApproval(`EXECUTE (Dangerous): ${cmd}`, false);
                        throw new Error(`PERMISSION DENIED: Execution of dangerous command rejected.`);
                    }
                }
                return true; // All other terminal commands allowed freely
            }

            // Freedom level allows any path navigation freely
            return true;
        }

        // 2. LEVEL 2: MEDIUM (الحالة المتوسطة)
        if (level === 'medium') {
            // Opening URLs forbidden completely
            if (operation === 'OPEN_URL') {
                throw new Error("PERMISSION DENIED: Opening external URLs is strictly forbidden in Medium Security Mode.");
            }
            // Uploading files/images externally forbidden completely
            if (operation === 'UPLOAD_EXTERNAL') {
                throw new Error("PERMISSION DENIED: Uploading files or images externally is strictly forbidden in Medium Security Mode.");
            }

            // Deleting files requires permission
            if (operation === 'DELETE') {
                const filePath = details.path || '';
                const choice = await this.promptModal({
                    title: '🗑️ طلب حذف ملف',
                    badge: 'الحالة المتوسطة',
                    message: `النموذج يحاول حذف الملف أو المجلد:\n\n\`${filePath}\`\n\nهل توافق على حذف هذا الملف؟`,
                    options: [
                        { id: 'yes', label: 'نعم (حذف)', class: 'btn-primary' },
                        { id: 'no', label: 'لا (إلغاء)', class: 'btn-secondary' }
                    ]
                });
                if (choice === 'yes') {
                    QuantState.logApproval(`DELETE: ${filePath}`, true);
                    return true;
                } else {
                    QuantState.logApproval(`DELETE: ${filePath}`, false);
                    throw new Error(`PERMISSION DENIED: File deletion rejected by user.`);
                }
            }

            // Outside path access requires permission with 4 choices
            if (details.path && isOutsidePath(details.path)) {
                const targetPath = details.path;
                const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/')) || targetPath;

                const alwaysPaths = QuantState.getAlwaysPaths();
                const alwaysFiles = QuantState.getAlwaysFiles();

                if (alwaysPaths.includes(parentDir) || alwaysFiles.includes(targetPath)) {
                    return true;
                }

                const choice = await this.promptModal({
                    title: '📁 طلب خروج خارج مسار العمل',
                    badge: 'الحالة المتوسطة',
                    message: `النموذج يحاول الوصول لمسار خارج مجلد العمل الرئيسي:\n\n\`${targetPath}\``,
                    options: [
                        { id: 'yes', label: 'نعم (Yes)', class: 'btn-primary' },
                        { id: 'no', label: 'لا (No)', class: 'btn-secondary' },
                        { id: 'always_path', label: 'نعم دائماً لهذا المسار', class: 'btn-secondary' },
                        { id: 'always_file', label: 'نعم دائماً لهذا الملف', class: 'btn-secondary' }
                    ]
                });

                if (choice === 'always_path') {
                    QuantState.addAlwaysPath(parentDir);
                    QuantState.logApproval(`PATH: ${targetPath}`, true);
                    return true;
                } else if (choice === 'always_file') {
                    QuantState.addAlwaysFile(targetPath);
                    QuantState.logApproval(`FILE: ${targetPath}`, true);
                    return true;
                } else if (choice === 'yes') {
                    QuantState.logApproval(`PATH: ${targetPath}`, true);
                    return true;
                } else {
                    QuantState.logApproval(`PATH: ${targetPath}`, false);
                    throw new Error(`PERMISSION DENIED: Out-of-workspace path access rejected.`);
                }
            }

            // Terminal commands (make, etc.) require permission
            if (operation === 'EXECUTE') {
                const cmd = details.command || '';
                const choice = await this.promptModal({
                    title: '⚡ طلب تنفيذ أمر في الترمينال',
                    badge: 'الحالة المتوسطة',
                    message: `النموذج يطلب تنفيذ أمر الترمينال التالي:\n\n\`${cmd}\``,
                    options: [
                        { id: 'yes', label: 'نعم (تنفيذ)', class: 'btn-primary' },
                        { id: 'no', label: 'لا (رفض)', class: 'btn-secondary' }
                    ]
                });
                if (choice === 'yes') {
                    QuantState.logApproval(`EXECUTE: ${cmd}`, true);
                    return true;
                } else {
                    QuantState.logApproval(`EXECUTE: ${cmd}`, false);
                    throw new Error(`PERMISSION DENIED: Terminal execution rejected by user.`);
                }
            }

            return true;
        }

        // 3. LEVEL 1: STRICT / SAFE (الحالة الآمنة جداً)
        if (level === 'strict' || level === 'safe') {
            // Strictly forbidden from exiting workspace
            if (details.path && isOutsidePath(details.path)) {
                throw new Error("PERMISSION DENIED: Exiting the workspace directory is strictly forbidden in Safe Mode.");
            }
            // Opening URLs forbidden
            if (operation === 'OPEN_URL') {
                throw new Error("PERMISSION DENIED: Connecting to external websites is strictly forbidden in Safe Mode.");
            }
            // Uploading files externally forbidden
            if (operation === 'UPLOAD_EXTERNAL') {
                throw new Error("PERMISSION DENIED: External uploading is strictly forbidden in Safe Mode.");
            }
            // Deleting files forbidden
            if (operation === 'DELETE') {
                throw new Error("PERMISSION DENIED: File deletion is strictly forbidden in Safe Mode.");
            }
            // Executing arbitrary commands forbidden except basic whitelisted ones
            if (operation === 'EXECUTE') {
                const cmd = (details.command || '').trim();
                const isWhitelisted = /^(ls|dir|pwd|echo|whoami)\b/i.test(cmd);
                if (!isWhitelisted) {
                    throw new Error(`PERMISSION DENIED: Executing arbitrary commands like '${cmd}' is forbidden in Safe Mode.`);
                }
            }

            return true;
        }

        return true;
    },

    extractDomain(url) {
        try {
            if (!url.startsWith('http')) url = 'http://' + url;
            const parsed = new URL(url);
            return parsed.hostname;
        } catch (e) {
            return url;
        }
    },

    promptModal({ title, badge, message, options }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'perm-modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(5, 5, 10, 0.85);
                backdrop-filter: blur(12px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.25s ease;
            `;

            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.cssText = `
                max-width: 520px;
                width: 100%;
                background: var(--bg-surface);
                border: 1px solid var(--border-highlight);
                border-radius: 20px;
                padding: 28px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            `;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${title}</h3>
                    <span style="font-size: 0.75rem; background: rgba(140,82,255,0.2); color: var(--primary-color); padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-highlight); font-weight: 600;">${badge}</span>
                </div>
                <p style="color: var(--text-secondary); white-space: pre-wrap; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5; background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">${message}</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${options.map(opt => `
                        <button class="${opt.class}" data-id="${opt.id}" style="padding: 12px 18px; text-align: center; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;">
                            ${opt.label}
                        </button>
                    `).join('')}
                </div>
            `;

            overlay.appendChild(card);
            document.body.appendChild(overlay);

            card.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    overlay.remove();
                    resolve(id);
                });
            });
        });
    }
};

// ─── Global State Manager (Encrypted) ──────────────────────
const QuantState = {
    _subscriptionCache: null,
    _subscriptionCacheTtlMs: 30000,

    async _saveSecure(key, dataObj) {
        const encrypted = await CryptoEngine.encrypt(dataObj);
        if (encrypted) localStorage.setItem(key, encrypted);
    },
    
    async _loadSecure(key) {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return await CryptoEngine.decrypt(raw);
    },


    // ─── Session / Auth ────────────────────────────────────────
    async isLoggedIn() {
        try {
            const { getCurrentUser } = await import('./firebase-auth.js');
            const user = await getCurrentUser();
            if (!user) {
                localStorage.removeItem('quant_secure_session');
                localStorage.removeItem('quant_identity');
                this._subscriptionCache = null;
                return false;
            }
            const identity = await this.getIdentity();
            if (!identity || identity.uid !== user.uid) await this.createFirebaseSession(user);
            return true;
        } catch (error) {
            console.error('Firebase Auth state could not be restored:', error);
            return false;
        }
    },
    
    async createFirebaseSession(user) {
        const plan = 'free';
        await this._saveSecure('quant_secure_session', {
            userId: user.uid,
            email: user.email || '',
            authProvider: 'google.com',
            verified: true,
            createdAt: Date.now()
        });

        await this._saveSecure('quant_identity', {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (user.email || '').split('@')[0],
            avatarUrl: user.photoURL || '',
            plan: plan
        });
        await this.fetchLiveSubscription();
    },

    async fetchLiveSubscription(forceRefresh = false) {
        const { getCurrentUser, getSubscriptionForCurrentUser } = await import('./firebase-auth.js');
        const user = await getCurrentUser();
        if (!user) {
            this._subscriptionCache = null;
            localStorage.removeItem('quant_secure_session');
            localStorage.removeItem('quant_identity');
            return { plan: 'free', status: 'inactive' };
        }

        if (!forceRefresh && this._subscriptionCache
            && this._subscriptionCache.uid === user.uid
            && Date.now() - this._subscriptionCache.fetchedAt < this._subscriptionCacheTtlMs) {
            return this._subscriptionCache.value;
        }

        try {
            const sub = await getSubscriptionForCurrentUser(user.uid);
            const identity = (await this.getIdentity()) || {};
            identity.uid = user.uid;
            identity.email = user.email || identity.email || '';
            identity.displayName = user.displayName || identity.displayName || identity.email.split('@')[0];
            identity.avatarUrl = user.photoURL || identity.avatarUrl || '';
            identity.plan = sub.plan || 'free';
            await this._saveSecure('quant_identity', identity);
            this._subscriptionCache = { uid: user.uid, fetchedAt: Date.now(), value: sub };
            return sub;
        } catch (error) {
            console.warn('Subscription lookup failed; using the free plan until Firebase is reachable:', error);
            const identity = (await this.getIdentity()) || {};
            identity.uid = user.uid;
            identity.plan = 'free';
            await this._saveSecure('quant_identity', identity);
            const fallback = { plan: 'free', status: 'unavailable' };
            this._subscriptionCache = { uid: user.uid, fetchedAt: Date.now(), value: fallback };
            return fallback;
        }
    },

    async getSubscriptionPlan() {
        const subscription = await this.fetchLiveSubscription();
        return (subscription && subscription.plan) ? subscription.plan.toLowerCase() : 'free';
    },

    async logout() {
        try {
            const { signOutCurrentUser } = await import('./firebase-auth.js');
            await signOutCurrentUser();
        } catch (error) {
            console.warn('Firebase sign-out could not complete:', error);
        }
        localStorage.removeItem('quant_secure_session');
        localStorage.removeItem('quant_identity');
        this._subscriptionCache = null;
        localStorage.removeItem('quant_profile');
        localStorage.removeItem('quant_api_config');
        localStorage.removeItem('quant_workspace');
        localStorage.removeItem('quant_permissions');
        localStorage.removeItem('quant_chat_history');
        localStorage.removeItem('quant_approval_log');
        localStorage.removeItem('quant_always_urls');
        localStorage.removeItem('quant_always_paths');
        localStorage.removeItem('quant_always_files');
        window.location.hash = '';
        window.location.reload();
    },

    async getIdentity() {
        return await this._loadSecure('quant_identity');
    },


    // ─── Onboarding / Profile ──────────────────────────────────
    async isOnboarded() {
        return (await this._loadSecure('quant_profile')) !== null;
    },
    
    async saveProfile(profileObj) {
        await this._saveSecure('quant_profile', profileObj);
    },
    
    async getProfile() {
        return await this._loadSecure('quant_profile');
    },

    // ─── Standard Getters/Setters ──────────────────────────────
    async getApiConfig() { return await this._loadSecure('quant_api_config'); },
    async saveApiConfig(config) {
        const encrypted = await CryptoEngine.encrypt(config);
        if (!encrypted) throw new Error('Could not encrypt the API settings in this browser.');
        localStorage.setItem('quant_api_config', encrypted);
    },
    
    async getChatHistory() { return (await this._loadSecure('quant_chat_history')) || []; },
    async saveChatHistory(messages) { await this._saveSecure('quant_chat_history', messages); },
    async clearChatHistory() { localStorage.removeItem('quant_chat_history'); },
    
    async getWorkspace() { return await this._loadSecure('quant_workspace'); },
    async saveWorkspace(ws) { await this._saveSecure('quant_workspace', ws); },

    // Synchronous preferences
    getTheme() { return localStorage.getItem('quant_theme') || 'dark'; },
    saveTheme(theme) { localStorage.setItem('quant_theme', theme); },
    getParticles() { const val = localStorage.getItem('quant_particles'); return val === null ? true : val === 'true'; },
    saveParticles(enabled) { localStorage.setItem('quant_particles', String(enabled)); },
    getPermissionLevel() { return localStorage.getItem('quant_permissions') || 'strict'; },
    savePermissionLevel(level) { localStorage.setItem('quant_permissions', level); },
    getAgentStatus() { return 'disconnected'; },

    // ─── Saved Permission Rules (Always Yes) ───────────────────
    getAlwaysUrls() {
        try { return JSON.parse(localStorage.getItem('quant_always_urls') || '[]'); } catch(e) { return []; }
    },
    addAlwaysUrl(url) {
        const urls = this.getAlwaysUrls();
        if (!urls.includes(url)) { urls.push(url); localStorage.setItem('quant_always_urls', JSON.stringify(urls)); }
    },
    removeAlwaysUrl(url) {
        const urls = this.getAlwaysUrls().filter(u => u !== url);
        localStorage.setItem('quant_always_urls', JSON.stringify(urls));
    },

    getAlwaysPaths() {
        try { return JSON.parse(localStorage.getItem('quant_always_paths') || '[]'); } catch(e) { return []; }
    },
    addAlwaysPath(p) {
        const paths = this.getAlwaysPaths();
        if (!paths.includes(p)) { paths.push(p); localStorage.setItem('quant_always_paths', JSON.stringify(paths)); }
    },
    removeAlwaysPath(p) {
        const paths = this.getAlwaysPaths().filter(x => x !== p);
        localStorage.setItem('quant_always_paths', JSON.stringify(paths));
    },

    getAlwaysFiles() {
        try { return JSON.parse(localStorage.getItem('quant_always_files') || '[]'); } catch(e) { return []; }
    },
    addAlwaysFile(f) {
        const files = this.getAlwaysFiles();
        if (!files.includes(f)) { files.push(f); localStorage.setItem('quant_always_files', JSON.stringify(files)); }
    },
    removeAlwaysFile(f) {
        const files = this.getAlwaysFiles().filter(x => x !== f);
        localStorage.setItem('quant_always_files', JSON.stringify(files));
    },

    // Async Approval Log
    async getApprovalLog() { return (await this._loadSecure('quant_approval_log')) || []; },
    async logApproval(command, approved) {
        const log = await this.getApprovalLog();
        log.unshift({ command, approved, timestamp: Date.now() });
        if (log.length > 50) log.pop();
        await this._saveSecure('quant_approval_log', log);
    },

    // OS Detection
    detectOS() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win')) return 'Windows';
        if (ua.includes('linux')) return 'Linux';
        if (ua.includes('mac')) return 'macOS';
        return 'Unknown';
    }
};

window.CryptoEngine = CryptoEngine;
window.PermissionGateway = PermissionGateway;
window.QuantState = QuantState;
