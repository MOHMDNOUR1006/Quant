/**
 * WorkspaceSetupView — Awaits async workspace and env vars.
 */
class WorkspaceSetupView {
    constructor(container) {
        this.container = container;
        this.workspace = null;
        this.envVars = [];
    }

    async render() {
        this.workspace = await QuantState.getWorkspace();
        this.envVars = (await QuantState.getEnvVars()) || [];
        const agentStatus = window.quantAgent?.status || QuantState.getAgentStatus();
        const isNative = !!window.quantAgent?.isNative;

        this.container.innerHTML = `
            <div class="workspace-setup-container" style="max-width: 800px; margin: 0 auto;">
                <h2 style="color: var(--primary-color); margin-bottom: 8px;">Workspace Settings</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">Configure where the local agent is allowed to read, write, and execute files.</p>

                ${agentStatus !== 'connected' ? `
                <div style="background: rgba(245,158,11,0.1); border: 1px solid var(--status-busy); border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--status-busy); box-shadow: 0 0 6px var(--status-busy); flex-shrink: 0;"></div>
                    <span style="font-size: 0.9rem; color: var(--status-busy);">${isNative ? 'Native file bridge is starting.' : 'Agent is not connected. Workspace changes will be applied when the agent connects.'} <a href="#agent" style="color: var(--primary-color);">Setup Agent</a></span>
                </div>
                ` : ''}

                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-bottom: 16px;">Active Directory Bound</h3>
                    <div class="input-group">
                        <label>Workspace Path</label>
                        <div style="display: flex; gap: 16px;">
                            <input type="text" id="ws-path" class="input-control" placeholder="Enter workspace directory path (e.g. /home/user/projects)" style="flex: 1; font-family: monospace;" value="${this.workspace ? this.escapeAttr(this.workspace.path) : ''}">
                            ${isNative ? '<button id="ws-pick-btn" class="btn-secondary" type="button">Browse…</button>' : ''}
                            <button id="ws-save-btn" class="btn-primary">Save</button>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">${isNative ? 'The app can access files in the selected folder. File access is restricted to this folder.' : 'The agent will refuse to interact with files outside this directory unless explicit permission is granted.'}</p>
                    <div id="ws-save-result" style="display: none; margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 0.85rem;"></div>
                </div>

                <div class="glass-card">
                    <h3 style="margin-bottom: 16px;">Environment Variables</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">Set environment variables that the local agent will use during command execution.</p>
                    
                    <div id="env-vars-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                        ${this.envVars.map((v, i) => `
                            <div style="display: flex; gap: 16px;" data-env-index="${i}">
                                <input type="text" class="input-control env-key" value="${this.escapeAttr(v.key)}" style="flex: 1;">
                                <input type="text" class="input-control env-val" value="${this.escapeAttr(v.value)}" style="flex: 2;">
                                <button class="btn-secondary env-remove" style="padding: 0 16px; color: var(--status-disconnected); border-color: var(--status-disconnected);" data-index="${i}">✕</button>
                            </div>
                        `).join('')}
                        <div style="display: flex; gap: 16px;">
                            <input type="text" id="new-env-key" class="input-control" placeholder="Key" style="flex: 1;">
                            <input type="text" id="new-env-val" class="input-control" placeholder="Value" style="flex: 2;">
                            <button id="add-env-btn" class="btn-primary" style="padding: 0 16px;">Add</button>
                        </div>
                    </div>
                    
                    <button id="save-env-btn" class="btn-primary">Save Environment Variables</button>
                    <div id="env-save-result" style="display: none; margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 0.85rem;"></div>
                </div>
            </div>
        `;

        // Bind workspace path save
        this.container.querySelector('#ws-save-btn').addEventListener('click', async () => {
            const path = this.container.querySelector('#ws-path').value.trim();
            const result = this.container.querySelector('#ws-save-result');
            if (!path) {
                result.style.display = 'block';
                result.style.background = 'rgba(239,68,68,0.15)';
                result.style.color = 'var(--status-disconnected)';
                result.textContent = 'Please enter a workspace path.';
                return;
            }
            try {
                if (isNative) await window.quantAgent.setWorkspace(path);
                else await QuantState.saveWorkspace({ path: path, updatedAt: Date.now() });
            } catch (error) {
                result.style.display = 'block';
                result.style.background = 'rgba(239,68,68,0.15)';
                result.style.color = 'var(--status-disconnected)';
                result.textContent = error.message || 'Could not set this workspace.';
                return;
            }
            result.style.display = 'block';
            result.style.background = 'rgba(16,185,129,0.15)';
            result.style.color = 'var(--status-connected)';
            result.textContent = isNative ? 'Workspace folder saved and ready.' : 'Workspace path saved. It will be applied when the agent connects.';
        });

        if (isNative) {
            this.container.querySelector('#ws-pick-btn').addEventListener('click', async () => {
                const result = this.container.querySelector('#ws-save-result');
                try {
                    const selected = await window.quantAgent.pickWorkspace();
                    if (!selected) return;
                    this.container.querySelector('#ws-path').value = selected.workspace;
                    result.style.display = 'block';
                    result.style.background = 'rgba(16,185,129,0.15)';
                    result.style.color = 'var(--status-connected)';
                    result.textContent = 'Workspace selected. The app can now access files inside this folder.';
                } catch (error) {
                    result.style.display = 'block';
                    result.style.background = 'rgba(239,68,68,0.15)';
                    result.style.color = 'var(--status-disconnected)';
                    result.textContent = error.message || 'Could not select this folder.';
                }
            });
        }

        // Bind add env var
        this.container.querySelector('#add-env-btn').addEventListener('click', async () => {
            const key = this.container.querySelector('#new-env-key').value.trim();
            const val = this.container.querySelector('#new-env-val').value.trim();
            if (!key) return;
            this.envVars.push({ key, value: val });
            await QuantState.saveEnvVars(this.envVars);
            this.render(); // Re-render
        });

        // Bind remove env var
        this.container.querySelectorAll('.env-remove').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.envVars.splice(idx, 1);
                await QuantState.saveEnvVars(this.envVars);
                this.render();
            });
        });

        // Bind save env vars
        this.container.querySelector('#save-env-btn').addEventListener('click', async () => {
            const rows = this.container.querySelectorAll('[data-env-index]');
            const vars = [];
            rows.forEach(row => {
                const key = row.querySelector('.env-key').value.trim();
                const val = row.querySelector('.env-val').value.trim();
                if (key) vars.push({ key, value: val });
            });
            await QuantState.saveEnvVars(vars);
            const result = this.container.querySelector('#env-save-result');
            result.style.display = 'block';
            result.style.background = 'rgba(16,185,129,0.15)';
            result.style.color = 'var(--status-connected)';
            result.textContent = 'Environment variables saved.';
        });
    }

    escapeAttr(str) {
        if (!str) return '';
        return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    destroy() {}
}
