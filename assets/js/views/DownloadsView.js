/**
 * DownloadsView — Downloads & Agent Binary Manager
 */
class DownloadsView {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const profile = await QuantState.getProfile();
        const userOS = profile ? profile.os : QuantState.detectOS();
        const agentStatus = window.quantAgent ? window.quantAgent.status : 'disconnected';

        if (window.quantAgent?.isNative) {
            this.container.innerHTML = `
                <div class="downloads-container" style="max-width: 900px; margin: 0 auto;">
                    <h2 style="color: var(--primary-color); margin-bottom: 8px;">MN Quant Native App</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">The Rust workspace agent is built into this application. No separate daemon download or localhost connection is needed.</p>
                    <div class="glass-card">
                        <h3>Local workspace</h3>
                        <p style="color: var(--text-secondary);">${window.quantAgent.activeWorkspace ? 'Connected to ' + this.escapeHtml(window.quantAgent.activeWorkspace) : 'Choose a workspace folder before using local file tools.'}</p>
                        <a href="#workspace" class="btn-primary" style="display:inline-block;text-decoration:none;padding:10px 16px;">Choose Workspace</a>
                    </div>
                </div>`;
            return;
        }

        this.container.innerHTML = `
            <div class="downloads-container" style="max-width: 1000px; margin: 0 auto;">
                <h2 style="color: var(--primary-color); margin-bottom: 8px;">Agent & Downloads Center</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Download the local QUANT Agent binary for Linux or Windows to pair with this web platform.</p>
                
                ${userOS !== 'Unknown' ? `<div style="background: rgba(124,111,255,0.1); border: 1px solid var(--border-highlight); border-radius: 8px; padding: 12px 20px; margin-bottom: 24px; font-size: 0.9rem; color: var(--text-secondary);">Detected OS: <strong style="color: var(--primary-color);">${userOS}</strong> — QUANT Agent for Linux binary is ready for download!</div>` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 48px;">
                    <!-- Linux Download -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: var(--primary-color);">
                        <div style="background: var(--primary-color); color: white; font-size: 0.75rem; font-weight: 600; padding: 4px 12px; border-radius: 4px; align-self: flex-start; margin-bottom: 12px;">READY TO DOWNLOAD</div>
                        <div>
                            <div style="font-size: 48px; margin-bottom: 16px; color: var(--accent-color);">🐧</div>
                            <h3>QUANT Agent for Linux</h3>
                            <p style="font-size: 0.9rem; color: var(--text-muted);">Standalone x86_64 Executable Binary (Tokio + Tungstenite Zero-Trust Daemon)</p>
                            <ul style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; padding-left: 20px;">
                                <li>Version: <span style="color: var(--status-connected);">1.0.0 Stable</span></li>
                                <li>Architecture: x86_64 Linux</li>
                                <li>File: <code style="font-size: 0.8rem; color: var(--accent-color);">quant-agent-linux-x64</code></li>
                            </ul>
                            <div style="background: rgba(16,185,129,0.1); border: 1px solid var(--status-connected); border-radius: 8px; padding: 10px; font-size: 0.8rem; color: var(--status-connected); margin-bottom: 16px;">
                                ✅ Pre-compiled binary hosted in <code style="color: var(--text-primary);">assets/downloads/quant-agent-linux-x64</code> ready for distribution.
                            </div>
                        </div>
                        <a href="assets/downloads/quant-agent-linux-x64" download="quant-agent-linux-x64" class="btn-primary" style="width: 100%; text-align: center; text-decoration: none; display: block; padding: 12px 0;">
                            📥 Download Agent for Linux (x64)
                        </a>
                    </div>

                    <!-- Windows Download -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; opacity: 0.8;">
                        <div>
                            <div style="font-size: 48px; margin-bottom: 16px; color: var(--secondary-color);">🪟</div>
                            <h3>QUANT Agent for Windows</h3>
                            <p style="font-size: 0.9rem; color: var(--text-muted);">Windows 10 / 11 support.</p>
                            <ul style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; padding-left: 20px;">
                                <li>Version: <span style="color: var(--text-muted);">1.0.0 (Source Ready)</span></li>
                                <li>Architecture: x64 Windows (.exe)</li>
                                <li>Build Command: <code style="font-size: 0.8rem;">cargo build --release --target x86_64-pc-windows-gnu</code></li>
                            </ul>
                            <div style="background: rgba(245,158,11,0.1); border: 1px solid var(--status-busy); border-radius: 8px; padding: 10px; font-size: 0.8rem; color: var(--status-busy); margin-bottom: 16px;">
                                ⚙ Windows binary source is cross-platform compatible. Compile using cargo on Windows.
                            </div>
                        </div>
                        <button class="btn-secondary" style="width: 100%; opacity: 0.7;" disabled>Windows Build Guide</button>
                    </div>
                </div>

                <!-- Live Diagnostics -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 16px;">Live Connection Diagnostics</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; font-family: monospace; font-size: 0.9rem; background: var(--bg-base); padding: 16px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>WebSocket Gateway (127.0.0.1:8081):</span>
                            <span style="color: ${agentStatus === 'connected' ? 'var(--status-connected)' : 'var(--status-disconnected)'};">${agentStatus.toUpperCase()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Active Workspace:</span>
                            <span style="color: var(--accent-color);">${(window.quantAgent && window.quantAgent.activeWorkspace) || 'Bound to Daemon'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Pairing Token Saved:</span>
                            <span style="color: var(--text-muted);">${(window.quantAgent && window.quantAgent.getToken()) ? 'Yes (Encrypted LocalStorage)' : 'No'}</span>
                        </div>
                    </div>
                </div>

                <!-- Launch Instructions -->
                <div class="glass-card" style="margin-top: 24px;">
                    <h3 style="margin-bottom: 16px;">How to Run Downloaded Binary on Linux</h3>
                    <div style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <h4 style="color: var(--accent-color); margin-bottom: 8px;">Run downloaded file:</h4>
                        <code style="display: block; padding: 12px; background: var(--bg-base); border-radius: 4px; font-size: 0.85rem; color: var(--text-secondary);">
                            # Make file executable and run:<br>
                            chmod +x quant-agent-linux-x64<br>
                            ./quant-agent-linux-x64
                        </code>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">Copy the generated token into <a href="#agent" style="color: var(--primary-color);">Agent Setup</a>.</p>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = value || '';
        return element.innerHTML;
    }

    destroy() {}
}
