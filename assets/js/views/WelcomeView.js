/**
 * WelcomeView — Dynamic welcome screen using real user profile data (Async).
 */
class WelcomeView {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const profile = await QuantState.getProfile();
        const identity = await QuantState.getIdentity();
        
        // Fallback cascade: Profile Name -> Identity Display Name -> 'User'
        const name = profile && profile.name ? profile.name : (identity && identity.displayName ? identity.displayName : 'User');
        
        const apiConfigured = await QuantState.getApiConfig() !== null;
        const agentStatus = QuantState.getAgentStatus();

        const apiStatusHtml = apiConfigured
            ? `<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-connected); box-shadow: 0 0 6px var(--status-connected);"></div><span style="color: var(--status-connected); font-size: 0.85rem;">${window.i18n.t('welcome.api_configured')}</span></div>`
            : `<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-busy); box-shadow: 0 0 6px var(--status-busy);"></div><span style="color: var(--status-busy); font-size: 0.85rem;">${window.i18n.t('welcome.api_not_configured')}</span></div>`;

        const agentStatusHtml = agentStatus === 'connected'
            ? `<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-connected); box-shadow: 0 0 6px var(--status-connected);"></div><span style="color: var(--status-connected); font-size: 0.85rem;">${window.i18n.t('welcome.agent_connected')}</span></div>`
            : `<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-disconnected); box-shadow: 0 0 6px var(--status-disconnected);"></div><span style="color: var(--status-disconnected); font-size: 0.85rem;">${window.i18n.t('welcome.agent_not_connected')}</span></div>`;

        this.container.innerHTML = `
            <div class="welcome-container" style="text-align: center; max-width: 800px; margin: 0 auto; padding-top: 8vh;">
                <h1 style="font-size: 2.8rem; margin-bottom: 16px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    ${window.i18n.t('welcome.title')}${this.escapeHtml(name)}
                </h1>
                <p style="font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 48px; line-height: 1.8;">
                    ${window.i18n.t('welcome.subtitle')}
                </p>
                
                <!-- System Status -->
                <div class="glass-card" style="margin-bottom: 32px; display: flex; justify-content: space-around; padding: 20px 32px;">
                    ${agentStatusHtml}
                    ${apiStatusHtml}
                </div>

                <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 48px;">
                    <button class="btn-primary" onclick="window.location.hash='chat'" style="font-size: 1.1rem; padding: 16px 32px;">
                        ${window.i18n.t('welcome.open_workspace')}
                    </button>
                    <button class="btn-secondary" onclick="window.location.hash='downloads'" style="font-size: 1.1rem; padding: 16px 32px;">
                        ${window.i18n.t('welcome.download_agent')}
                    </button>
                </div>

                <div class="glass-card" style="text-align: start; display: flex; gap: 24px;">
                    <div style="flex: 1;">
                        <h3 style="color: var(--accent-color);">${window.i18n.t('welcome.step1_title')}</h3>
                        <p style="font-size: 0.9rem;">${window.i18n.t('welcome.step1_desc')}</p>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="color: var(--primary-color);">${window.i18n.t('welcome.step2_title')}</h3>
                        <p style="font-size: 0.9rem;">${window.i18n.t('welcome.step2_desc')}</p>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="color: var(--secondary-color);">${window.i18n.t('welcome.step3_title')}</h3>
                        <p style="font-size: 0.9rem;">${window.i18n.t('welcome.step3_desc')}</p>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {}
}
