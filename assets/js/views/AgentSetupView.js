/**
 * AgentSetupView — Live Agent Configuration & Token Pairing
 */
class AgentSetupView {
    constructor(container) {
        this.container = container;
        this.statusListener = null;
    }

    async render() {
        const detectedOS = QuantState.detectOS();
        const profile = await QuantState.getProfile();
        const userOS = profile ? profile.os : detectedOS;
        const agentStatus = window.quantAgent ? window.quantAgent.status : 'disconnected';
        const savedToken = window.quantAgent ? window.quantAgent.getToken() : '';
        const isNative = !!window.quantAgent?.isNative;
        const statusLabels = { connected: isNative ? 'App Connected' : 'Connected', disconnected: 'Not Connected', busy: 'Busy', executing: 'Executing', waiting: 'Waiting' };

        this.container.innerHTML = `
            <div class="agent-setup-container" style="max-width: 800px; margin: 0 auto;">
                <h2 style="color: var(--primary-color); margin-bottom: 8px;">Agent Configuration</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Manage your local system connection and capabilities.</p>

                <div class="glass-card" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px;">
                        <div>
                            <h3 style="margin: 0;">Status Monitor</h3>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                Operating System: ${userOS} 
                                ${detectedOS !== 'Unknown' 
                                    ? '<span style="color: var(--accent-color);">(Detected via UserAgent)</span>' 
                                    : '<span style="color: var(--status-busy);">(Set during onboarding)</span>'}
                            </span>
                        </div>
                        <div class="agent-status-mini ${agentStatus}">
                            <div class="status-dot"></div>
                            <span>${statusLabels[agentStatus] || 'Not Connected'}</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                            <button id="reconnect-agent-btn" class="btn-primary" style="flex: 1;">${isNative ? 'Choose Workspace Folder' : 'Connect / Retry Local Daemon'}</button>
                        <button id="ping-agent-btn" class="btn-secondary" style="flex: 1;">Check Connection (Ping)</button>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; text-align: center;">${isNative ? 'The Rust agent is built into this app. Choose a workspace folder to enable local file tools.' : 'Requires QUANT Agent binary running on <code style="color: var(--accent-color);">127.0.0.1:8081</code>. <a href="#downloads" style="color: var(--primary-color);">Download & Run Agent</a>'}</p>

                    ${isNative ? '<p style="color: var(--text-secondary);">The selected directory is the security boundary for local file operations.</p>' : `
                        <h4>First-Time Setup Instructions</h4>
                        <ol style="margin-left: 20px; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.8;">
                            <li>Download or compile the agent binary from the <a href="#downloads" style="color: var(--primary-color);">Downloads Center</a>.</li>
                            <li>Run <code style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px; color: var(--accent-color);">./quant-agent</code> in your terminal.</li>
                            <li>Copy the generated pairing token printed in terminal.</li>
                            <li>Paste it below to securely pair this browser session.</li>
                        </ol>
                    `}
                </div>

                <div class="glass-card" style="${isNative ? 'display:none;' : ''}">
                    <h3 style="margin-bottom: 16px;">Agent Pairing</h3>
                    <div class="input-group">
                        <label>Secure Authentication Token</label>
                        <div style="display: flex; gap: 16px;">
                            <input type="password" id="agent-token" class="input-control" placeholder="qnt_..." value="${savedToken}" style="flex: 1;">
                            <button id="pair-agent-btn" class="btn-primary">Pair Agent</button>
                        </div>
                    </div>
                    <div id="pair-result" style="display: none; margin-top: 12px; padding: 12px; border-radius: 8px; font-size: 0.85rem;"></div>
                </div>
            </div>
        `;

        // Bind reconnect
        this.container.querySelector('#reconnect-agent-btn').addEventListener('click', () => {
            if (isNative) {
                window.quantAgent.pickWorkspace().catch((error) => {
                    const result = this.container.querySelector('#pair-result');
                    result.style.display = 'block';
                    result.textContent = error.message;
                });
            } else {
                window.quantAgent.connect();
            }
        });

        // Bind ping
        this.container.querySelector('#ping-agent-btn').addEventListener('click', async () => {
            const result = this.container.querySelector('#pair-result');
            result.style.display = 'block';
            result.style.background = 'rgba(124,111,255,0.1)';
            result.style.color = 'var(--text-secondary)';
            result.textContent = 'Pinging local agent...';

            try {
                const res = await window.quantAgent.ping();
                result.style.background = 'rgba(16,185,129,0.15)';
                result.style.color = 'var(--status-connected)';
                result.innerHTML = `🟢 Agent Active! OS: <strong>${res.os} (${res.arch})</strong> | Active Workspace: <code>${res.workspace || 'None set'}</code>`;
            } catch (err) {
                result.style.background = 'rgba(239,68,68,0.15)';
                result.style.color = 'var(--status-disconnected)';
                result.textContent = `❌ Connection Error: ${err.message}`;
            }
        });

        // Bind pairing token save
        this.container.querySelector('#pair-agent-btn').addEventListener('click', async () => {
            const token = this.container.querySelector('#agent-token').value.trim();
            const result = this.container.querySelector('#pair-result');

            if (!token) {
                result.style.display = 'block';
                result.style.background = 'rgba(239,68,68,0.15)';
                result.style.color = 'var(--status-disconnected)';
                result.textContent = 'Please enter a token.';
                return;
            }

            window.quantAgent.setToken(token);
            result.style.display = 'block';
            result.style.background = 'rgba(124,111,255,0.1)';
            result.style.color = 'var(--text-secondary)';
            result.textContent = 'Token saved! Verifying connection with local daemon...';

            try {
                const res = await window.quantAgent.ping();
                result.style.background = 'rgba(16,185,129,0.15)';
                result.style.color = 'var(--status-connected)';
                result.innerHTML = `🎉 Successfully Paired with QUANT Rust Core! OS: <strong>${res.os} (${res.arch})</strong>`;
            } catch (err) {
                result.style.background = 'rgba(239,68,68,0.15)';
                result.style.color = 'var(--status-disconnected)';
                result.textContent = `Connection failed: ${err.message}. Ensure the agent is running in terminal.`;
            }
        });

        // Listen for live status changes
        this.statusListener = (status) => {
            const dots = this.container.querySelectorAll('.agent-status-mini');
            dots.forEach(el => {
                el.className = `agent-status-mini ${status}`;
                const label = el.querySelector('span');
                if (label) label.textContent = statusLabels[status] || status;
            });
        };
        window.quantAgent.onStatusChange(this.statusListener);
    }

    destroy() {}
}
