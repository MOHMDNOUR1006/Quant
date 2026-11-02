/**
 * SettingsView — Awaits async API config.
 */
class SettingsView {
    constructor(container) { this.container = container; }

    async render() {
        const currentTheme = QuantState.getTheme(); // Sync
        const particles = QuantState.getParticles(); // Sync
        const apiConfig = await QuantState.getApiConfig(); // Async
        const lang = window.i18n.currentLang;
        const escapeAttr = (value) => String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);

        this.container.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
            <h2 style="color:var(--primary-color);margin-bottom:32px;text-align:start;">${window.i18n.t('settings.title')}</h2>

            <!-- API Configuration -->
            <div class="glass-card" style="margin-bottom:24px;text-align:start;">
                <h3 style="margin-bottom:24px;">${window.i18n.t('onboarding.step3_title')}</h3>
                <div class="input-group">
                    <label>${window.i18n.t('settings.api_provider')}</label>
                    <select id="provider-preset-select" class="input-control" style="margin-bottom:12px;">
                        <option value="gemini" ${!apiConfig || apiConfig.provider === 'gemini' || apiConfig.model?.includes('gemini') || apiConfig.baseUrl?.includes('googleapis') ? 'selected' : ''}>Google Gemini (Recommended / موصى به)</option>
                        <option value="openai" ${apiConfig && (apiConfig.provider === 'openai' || apiConfig.model?.includes('gpt') || apiConfig.baseUrl?.includes('openai.com')) ? 'selected' : ''}>OpenAI (ChatGPT)</option>
                        <option value="anthropic" ${apiConfig && (apiConfig.provider === 'anthropic' || apiConfig.model?.includes('claude') || apiConfig.baseUrl?.includes('anthropic')) ? 'selected' : ''}>Anthropic Claude</option>
                        <option value="custom" ${apiConfig && apiConfig.provider === 'custom' ? 'selected' : ''}>Custom / OpenRouter / Compatible</option>
                        <option value="ollama" ${apiConfig && (apiConfig.provider === 'ollama' || apiConfig.model?.includes('ollama') || apiConfig.baseUrl?.includes('11434')) ? 'selected' : ''}>Local Ollama</option>
                    </select>
                </div>

                <!-- Gemini Models Preset Dropdown -->
                <div id="gemini-dropdown-group" class="input-group" style="display:${!apiConfig || apiConfig.provider === 'gemini' || apiConfig.model?.includes('gemini') || apiConfig.baseUrl?.includes('googleapis') ? 'block' : 'none'};margin-bottom:16px;">
                    <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span>${window.i18n.t('settings.gemini_model')}</span>
                        <span style="font-size:0.75rem;color:var(--text-muted);">${window.i18n.t('settings.gemini_official')}</span>
                    </label>
                    <select id="gemini-model-select" class="input-control" style="border-radius:10px;background:var(--bg-surface-hover);color:var(--text-primary);transition:var(--transition-normal);">
                        <option value="gemini-4-argon" ${apiConfig?.model === 'gemini-4-argon' ? 'selected' : ''}>gemini-4-argon (${lang === 'ar' ? 'استدلال فائق متقدم (الأحدث)' : 'Advanced Reasoning (Latest)'})</option>
                        <option value="gemini-3.8-flash" ${!apiConfig || apiConfig?.model === 'gemini-3.8-flash' ? 'selected' : ''}>gemini-3.8-flash (${lang === 'ar' ? 'موصى به / سريع وذكي' : 'Recommended / Fast & Smart'})</option>
                        <option value="gemini-3.5-flash-lite" ${apiConfig?.model === 'gemini-3.5-flash-lite' ? 'selected' : ''}>gemini-3.5-flash-lite (${lang === 'ar' ? 'خفيف واقتصادي' : 'Lightweight / Cost efficient'})</option>
                        <option value="gemini-3.1-pro-preview" ${apiConfig?.model === 'gemini-3.1-pro-preview' ? 'selected' : ''}>gemini-3.1-pro-preview (${lang === 'ar' ? 'استدلال عميق' : 'Deep reasoning'})</option>
                        <option value="gemini-2.5-flash" ${apiConfig?.model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (${lang === 'ar' ? 'فائق السرعة' : 'Ultra Fast'})</option>
                        <option value="gemini-2.5-pro" ${apiConfig?.model === 'gemini-2.5-pro' ? 'selected' : ''}>gemini-2.5-pro (${lang === 'ar' ? 'برمجة واستدلال' : 'Coding & Reasoning'})</option>
                        <option value="gemini-2.0-flash" ${apiConfig?.model === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (${lang === 'ar' ? 'خفيف وسريع' : 'Fast & Lightweight'})</option>
                        <option value="gemini-1.5-flash" ${apiConfig?.model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash (${lang === 'ar' ? 'توافق كلاسيكي مستقر' : 'Classic Stable'})</option>
                        <option value="gemini-1.5-pro" ${apiConfig?.model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (${lang === 'ar' ? 'استدلال كلاسيكي' : 'Classic Pro'})</option>
                    </select>
                </div>

                <div class="input-group"><label>${window.i18n.t('onboarding.api_url')}</label><input type="url" id="set-api-url" class="input-control" placeholder="https://generativelanguage.googleapis.com" value="${escapeAttr(apiConfig?.baseUrl || 'https://generativelanguage.googleapis.com')}"></div>
                <div class="input-group"><label>${window.i18n.t('onboarding.api_key')} <span style="color:var(--text-muted);font-size:0.8em;">(${lang === 'ar' ? 'اختياري لـ Ollama' : 'optional for Ollama'})</span></label><input type="password" id="set-api-key" class="input-control" placeholder="AIzaSy..."></div>
                
                <!-- Custom Model Input + Clear Button -->
                <div class="input-group">
                    <label style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span>${window.i18n.t('onboarding.api_model')}</span>
                        <span style="font-size:0.75rem;color:var(--text-muted);">${window.i18n.t('settings.custom_model')}</span>
                    </label>
                    <div style="display:flex;gap:8px;">
                        <input type="text" id="set-api-model" class="input-control" placeholder="e.g. gemini-3.8-flash, gemini-4-argon, gpt-4o" value="${escapeAttr(apiConfig?.model || 'gemini-3.8-flash')}" style="flex:1;">
                        <button id="clear-model-btn" class="btn-secondary" style="padding:0 18px;font-size:0.85rem;height:46px;white-space:nowrap;border-radius:10px;border-color:var(--border-color);display:flex;align-items:center;gap:6px;">
                            <span>🧹</span> <span>${window.i18n.t('settings.clear')}</span>
                        </button>
                    </div>
                </div>

                <button id="save-api-btn" class="btn-primary" style="margin-top:8px;">${window.i18n.t('settings.save')}</button>
                <div id="api-result" style="display:none;margin-top:12px;padding:10px;border-radius:8px;font-size:0.85rem;"></div>
            </div>

            <!-- Interface Preferences -->
            <div class="glass-card" style="margin-bottom:24px;text-align:start;">
                <h3 style="margin-bottom:24px;">${window.i18n.t('settings.theme_label')}</h3>
                
                <!-- System Language -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div><h4 style="margin:0 0 4px 0;">${window.i18n.t('settings.lang_label')}</h4><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${window.i18n.t('settings.lang_desc')}</p></div>
                    <select id="settings-lang-select" class="input-control lang-switch-select" style="width:200px;">
                        <option value="ar" ${lang==='ar'?'selected':''}>العربية</option>
                        <option value="en" ${lang==='en'?'selected':''}>English</option>
                        <option value="ja" ${lang==='ja'?'selected':''}>にほんご</option>
                    </select>
                </div>

                <!-- Theme -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div><h4 style="margin:0 0 4px 0;">${window.i18n.t('settings.theme_engine')}</h4><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${window.i18n.t('settings.theme_desc')}</p></div>
                    <select id="theme-select" class="input-control" style="width:200px;">
                        <option value="dark" ${currentTheme==='dark'?'selected':''}>${window.i18n.t('settings.theme_dark')}</option>
                        <option value="neon" ${currentTheme==='neon'?'selected':''}>${window.i18n.t('settings.theme_neon')}</option>
                        <option value="light" ${currentTheme==='light'?'selected':''}>${window.i18n.t('settings.theme_light')}</option>
                    </select>
                </div>
                
                <!-- Particles -->
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><h4 style="margin:0 0 4px 0;">${window.i18n.t('settings.particles_label')}</h4><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${window.i18n.t('settings.particles_desc')}</p></div>
                    <label style="position:relative;display:inline-block;width:52px;height:28px;cursor:pointer;">
                        <input type="checkbox" id="particle-toggle" ${particles?'checked':''} style="opacity:0;width:0;height:0;">
                        <span id="toggle-track" style="position:absolute;top:0;left:0;right:0;bottom:0;background:${particles?'var(--primary-color)':'var(--border-color)'};border-radius:28px;transition:var(--transition-normal);"></span>
                        <span id="toggle-thumb" style="position:absolute;height:22px;width:22px;left:3px;bottom:3px;background:white;border-radius:50%;transition:var(--transition-normal);transform:translateX(${particles?'24px':'0'});"></span>
                    </label>
                </div>
            </div>

            <!-- Data Management -->
            <div class="glass-card" style="text-align:start;">
                <h3 style="margin-bottom:24px;">${window.i18n.t('settings.data_management')}</h3>
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:16px;margin-bottom:16px;">
                    <div><h4 style="margin:0 0 4px 0;">${window.i18n.t('settings.clear_cache')}</h4><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${window.i18n.t('settings.clear_cache_desc')}</p></div>
                    <button id="clear-cache-btn" class="btn-secondary" style="padding:8px 16px;font-size:0.9rem;">${window.i18n.t('settings.clear_cache')}</button>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><h4 style="margin:0 0 4px 0;color:var(--status-disconnected);">${window.i18n.t('settings.delete_history')}</h4><p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${window.i18n.t('settings.delete_history_desc')}</p></div>
                    <button id="delete-history-btn" class="btn-secondary" style="padding:8px 16px;font-size:0.9rem;color:var(--status-disconnected);border-color:var(--status-disconnected);">${window.i18n.t('settings.delete_all')}</button>
                </div>
            </div>
        </div>`;

        // Fill the secret through the input property so it is never interpolated into HTML.
        this.container.querySelector('#set-api-key').value = apiConfig?.apiKey || '';

        // Lang change
        this.container.querySelector('#settings-lang-select').addEventListener('change',(e)=>{
            window.i18n.setLanguage(e.target.value);
        });

        // Theme change
        this.container.querySelector('#theme-select').addEventListener('change',(e)=>{
            const t=e.target.value;
            QuantState.saveTheme(t);
            applyTheme(t);
        });

        // Particle toggle
        const ptoggle = this.container.querySelector('#particle-toggle');
        ptoggle.addEventListener('change',()=>{
            const on=ptoggle.checked;
            QuantState.saveParticles(on);
            this.container.querySelector('#toggle-track').style.background=on?'var(--primary-color)':'var(--border-color)';
            this.container.querySelector('#toggle-thumb').style.transform=`translateX(${on?'24px':'0'})`;
            if(on) initParticles(); else destroyParticles();
        });

        // Provider Preset selector logic
        const providerSelect = this.container.querySelector('#provider-preset-select');
        const urlInput = this.container.querySelector('#set-api-url');
        const modelInput = this.container.querySelector('#set-api-model');
        const geminiDropdownGroup = this.container.querySelector('#gemini-dropdown-group');
        const geminiModelSelect = this.container.querySelector('#gemini-model-select');
        const clearModelBtn = this.container.querySelector('#clear-model-btn');

        // Gemini dropdown change
        geminiModelSelect.addEventListener('change', (e) => {
            modelInput.value = e.target.value;
        });

        // Clear button listener
        clearModelBtn.addEventListener('click', () => {
            modelInput.value = '';
            if (geminiDropdownGroup.style.display !== 'none') {
                modelInput.value = geminiModelSelect.value;
            }
        });

        providerSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'gemini') {
                geminiDropdownGroup.style.display = 'block';
                urlInput.value = 'https://generativelanguage.googleapis.com';
                modelInput.value = geminiModelSelect.value || 'gemini-3.8-flash';
            } else {
                geminiDropdownGroup.style.display = 'none';
                if (val === 'openai') {
                    urlInput.value = 'https://api.openai.com/v1';
                    modelInput.value = 'gpt-4o';
                } else if (val === 'anthropic') {
                    urlInput.value = 'https://api.anthropic.com';
                    modelInput.value = 'claude-3-5-sonnet-20241022';
                } else if (val === 'ollama') {
                    urlInput.value = 'http://localhost:11434';
                    modelInput.value = 'llama3';
                }
            }
        });

        // Save API config
        this.container.querySelector('#save-api-btn').addEventListener('click', async ()=>{
            const provider=providerSelect.value;
            const url=this.container.querySelector('#set-api-url').value.trim();
            const key=this.container.querySelector('#set-api-key').value.trim();
            let model=this.container.querySelector('#set-api-model').value.trim();
            
            // If custom text input is empty but gemini dropdown is visible, use dropdown value
            if (!model && provider === 'gemini') {
                model = geminiModelSelect.value;
            }

            const r=this.container.querySelector('#api-result');
            if(!url||!model||(provider !== 'ollama' && !key)){
                r.style.display='block';r.style.background='rgba(239,68,68,0.15)';r.style.color='var(--status-disconnected)';
                r.textContent=provider === 'ollama' ? 'Base URL and model are required.' : 'Base URL, API key, and model are required.';
                return;
            }
            try {
                await QuantState.saveApiConfig({provider:provider,baseUrl:url,apiKey:key,model:model});
                r.style.display='block';r.style.background='rgba(16,185,129,0.15)';r.style.color='var(--status-connected)';
                r.textContent=window.i18n.t('settings.saved_msg');
            } catch (error) {
                r.style.display='block';r.style.background='rgba(239,68,68,0.15)';r.style.color='var(--status-disconnected)';
                r.textContent=error.message || 'Could not save API settings.';
            }
        });

        // Clear cache
        this.container.querySelector('#clear-cache-btn').addEventListener('click',()=>{
            alert('Cache cleared (no cached data exists in this session).');
        });

        // Delete history
        this.container.querySelector('#delete-history-btn').addEventListener('click', async ()=>{
            if(confirm('Permanently delete all chat history?')){
                await QuantState.clearChatHistory();
                alert('Chat history deleted.');
            }
        });
    }
    destroy() {}
}
