/**
 * OnboardingView — Multi-step onboarding with STRICT validation.
 * Rejects underage users (<13) and future dates.
 */
class OnboardingView {
    constructor(container) {
        this.container = container;
        this.step = 1;
        this.totalSteps = 3;
        this.data = {
            name: '',
            age: '',
            dob: '',
            os: '',
            apiBaseUrl: '',
            apiKey: '',
            modelName: ''
        };
    }

    async render() {
        // Pre-fill name from Identity payload if available
        const identity = await QuantState.getIdentity();
        if (identity && identity.displayName && !this.data.name) {
            this.data.name = identity.displayName;
        }

        this.renderStep();
    }

    renderStep() {
        const detectedOS = QuantState.detectOS();

        if (this.step === 1) {
            this.container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 64px);">
                    <div class="glass-card" style="width: 520px; padding: 48px 40px;">
                        ${this.renderProgress()}
                        <h2 style="margin-bottom: 8px;">${window.i18n.t('onboarding.step1_title')}</h2>
                        <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 0.9rem;">${window.i18n.t('onboarding.step1_subtitle')}</p>
                        
                        <div id="onboard-error" style="display: none; background: rgba(239,68,68,0.15); border: 1px solid var(--status-disconnected); color: var(--status-disconnected); padding: 10px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem;"></div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.name_label')}</label>
                            <input type="text" id="ob-name" class="input-control" placeholder="${window.i18n.t('onboarding.name_placeholder')}" value="${this.escapeAttr(this.data.name)}">
                        </div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.dob_label')}</label>
                            <input type="date" id="ob-dob" class="input-control" value="${this.data.dob}">
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${window.i18n.t('onboarding.dob_tip')}</p>
                        </div>

                        <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                            <button id="ob-next-1" class="btn-primary" style="padding: 12px 32px;">${window.i18n.t('onboarding.btn_verify')}</button>
                        </div>
                    </div>
                </div>
            `;
            this.container.querySelector('#ob-next-1').addEventListener('click', () => this.nextStep1());
        } else if (this.step === 2) {
            this.container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 64px);">
                    <div class="glass-card" style="width: 520px; padding: 48px 40px;">
                        ${this.renderProgress()}
                        <h2 style="margin-bottom: 8px;">${window.i18n.t('onboarding.step2_title')}</h2>
                        <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 0.9rem;">${window.i18n.t('onboarding.step2_subtitle')}</p>

                        <div id="onboard-error" style="display: none; background: rgba(239,68,68,0.15); border: 1px solid var(--status-disconnected); color: var(--status-disconnected); padding: 10px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem;"></div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.os_label')} ${detectedOS !== 'Unknown' ? `<span style="color: var(--accent-color); font-size: 0.8rem;"> — Detected: ${detectedOS}</span>` : ''}</label>
                            <select id="ob-os" class="input-control">
                                <option value="" disabled ${detectedOS === 'Unknown' ? 'selected' : ''}>${window.i18n.t('onboarding.os_select')}</option>
                                <option value="Windows" ${detectedOS === 'Windows' ? 'selected' : ''}>Windows</option>
                                <option value="Linux" ${detectedOS === 'Linux' ? 'selected' : ''}>Linux</option>
                                <option value="macOS" ${detectedOS === 'macOS' ? 'selected' : ''}>macOS</option>
                                <option value="Other">Other / Unknown</option>
                            </select>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-top: 16px;">
                            <button id="ob-back-2" class="btn-secondary" style="padding: 12px 32px;">${window.i18n.t('onboarding.btn_back')}</button>
                            <button id="ob-next-2" class="btn-primary" style="padding: 12px 32px;">${window.i18n.t('onboarding.btn_continue')}</button>
                        </div>
                    </div>
                </div>
            `;
            this.container.querySelector('#ob-next-2').addEventListener('click', () => this.nextStep2());
            this.container.querySelector('#ob-back-2').addEventListener('click', () => { this.step = 1; this.renderStep(); });
        } else if (this.step === 3) {
            this.container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 64px);">
                    <div class="glass-card" style="width: 520px; padding: 48px 40px;">
                        ${this.renderProgress()}
                        <h2 style="margin-bottom: 8px;">${window.i18n.t('onboarding.step3_title')}</h2>
                        <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 0.9rem;">${window.i18n.t('onboarding.step3_subtitle')}</p>

                        <div id="onboard-error" style="display: none; background: rgba(239,68,68,0.15); border: 1px solid var(--status-disconnected); color: var(--status-disconnected); padding: 10px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem;"></div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.api_url')}</label>
                            <input type="url" id="ob-api-url" class="input-control" placeholder="https://api.example.com/v1">
                        </div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.api_key')}</label>
                            <input type="password" id="ob-api-key" class="input-control" placeholder="sk-...">
                        </div>

                        <div class="input-group">
                            <label>${window.i18n.t('onboarding.api_model')}</label>
                            <input type="text" id="ob-model" class="input-control" placeholder="e.g. gpt-4o, claude-sonnet-4, gemini-pro">
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-top: 16px;">
                            <button id="ob-back-3" class="btn-secondary" style="padding: 12px 32px;">${window.i18n.t('onboarding.btn_back')}</button>
                            <div style="display: flex; gap: 12px;">
                                <button id="ob-skip-3" class="btn-secondary" style="padding: 12px 24px; font-size: 0.9rem;">${window.i18n.t('onboarding.btn_skip')}</button>
                                <button id="ob-finish" class="btn-primary" style="padding: 12px 32px;">${window.i18n.t('onboarding.btn_finish')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.container.querySelector('#ob-finish').addEventListener('click', () => this.finishOnboarding(false));
            this.container.querySelector('#ob-skip-3').addEventListener('click', () => this.finishOnboarding(true));
            this.container.querySelector('#ob-back-3').addEventListener('click', () => { this.step = 2; this.renderStep(); });
        }
    }

    renderProgress() {
        const pct = (this.step / this.totalSteps) * 100;
        return `
            <div style="margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${window.i18n.t('onboarding.progress', { step: this.step, total: this.totalSteps })}</span>
                    <span style="font-size: 0.8rem; color: var(--primary-color);">${Math.round(pct)}%</span>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.3); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;
    }

    nextStep1() {
        const name = this.container.querySelector('#ob-name').value.trim();
        const dobStr = this.container.querySelector('#ob-dob').value;
        const err = this.container.querySelector('#onboard-error');

        if (!name) { err.textContent = 'Display Name cannot be empty.'; err.style.display = 'block'; return; }
        if (!dobStr) { err.textContent = 'Date of Birth is required.'; err.style.display = 'block'; return; }

        // Strict Date Validation
        const dob = new Date(dobStr);
        const today = new Date();
        
        if (dob > today) {
            err.textContent = 'Date of Birth cannot be in the future.';
            err.style.display = 'block';
            return;
        }

        // Calculate exact age
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age < 13) {
            err.textContent = 'SECURITY POLICY: You must be at least 13 years old to use this service. Access denied.';
            err.style.display = 'block';
            return;
        }
        if (age > 150) {
            err.textContent = 'Please enter a valid Date of Birth.';
            err.style.display = 'block';
            return;
        }

        this.data.name = name;
        this.data.dob = dobStr;
        this.data.age = age;
        
        err.style.display = 'none';
        this.step = 2;
        this.renderStep();
    }

    nextStep2() {
        const os = this.container.querySelector('#ob-os').value;
        const err = this.container.querySelector('#onboard-error');

        if (!os) { err.textContent = 'Please select your operating system.'; err.style.display = 'block'; return; }

        this.data.os = os;
        this.step = 3;
        this.renderStep();
    }

    async finishOnboarding(skippedApi) {
        if (!skippedApi) {
            const apiUrl = this.container.querySelector('#ob-api-url').value.trim();
            const apiKey = this.container.querySelector('#ob-api-key').value.trim();
            const model = this.container.querySelector('#ob-model').value.trim();
            const err = this.container.querySelector('#onboard-error');

            if (!apiUrl || !apiKey || !model) { 
                err.textContent = 'Please complete all API fields or click "Skip for Now".'; 
                err.style.display = 'block'; 
                return; 
            }

            await QuantState.saveApiConfig({ baseUrl: apiUrl, apiKey: apiKey, model: model });
        }

        // Save profile (encrypted)
        await QuantState.saveProfile({
            name: this.data.name,
            age: this.data.age,
            dob: this.data.dob,
            os: this.data.os,
            createdAt: Date.now()
        });

        // Show completion loader then navigate
        this.container.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: calc(100vh - 64px);">
                <div class="css-loader"></div>
                <p class="loader-text" style="margin-top: 24px;">${window.i18n.t('onboarding.loader_text')}</p>
            </div>
        `;

        setTimeout(() => {
            window.location.hash = 'welcome';
            window.appRouter.handleRoute();
        }, 1800);
    }

    escapeAttr(str) {
        if (!str) return '';
        return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    destroy() {}
}
