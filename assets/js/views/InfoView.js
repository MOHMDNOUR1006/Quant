class InfoView {
    constructor(container) {
        this.container = container;
    }

    render() {
        this.container.innerHTML = `
            <div class="info-container" style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 48px;">
                    <div style="font-size: 64px; margin-bottom: 16px; color: var(--primary-color);">
                        <i class="icon-q"></i>
                    </div>
                    <h1 style="margin-bottom: 8px;">QUANT AI Platform</h1>
                    <p style="color: var(--text-secondary);">Version 3.1.0-stable</p>
                </div>

                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-bottom: 16px;">About</h3>
                    <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 16px;">
                        QUANT AI is a premium frontend interface designed to interact with the local QUANT Agent daemon. 
                        It acts as a sophisticated dashboard bridging the gap between natural language interaction and system-level execution.
                    </p>
                    <p style="color: var(--text-secondary); line-height: 1.8;">
                        This platform does not execute filesystem operations directly. Instead, it securely communicates with the local agent running on your host machine to compile code, manage memory, or edit files.
                    </p>
                </div>

                <div class="glass-card" style="display: flex; flex-direction: column; gap: 16px;">
                    <h3 style="margin-bottom: 8px;">System Architecture</h3>
                    
                    <div style="display: flex; gap: 16px; align-items: center; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <div style="font-size: 24px; color: var(--accent-color);">UI</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 4px 0;">Frontend Presentation Layer</h4>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Vanilla JS, CSS Variables, Glassmorphism UI</p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: center; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <div style="font-size: 24px; color: var(--primary-color);">WS</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 4px 0;">Encrypted WebSocket Gateway</h4>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Handles telemetry, status updates, and command dispatches.</p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: center; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <div style="font-size: 24px; color: var(--secondary-color);">OS</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 4px 0;">QUANT Local Agent</h4>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Native binary running on Host OS for filesystem/terminal operations.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {}
}
