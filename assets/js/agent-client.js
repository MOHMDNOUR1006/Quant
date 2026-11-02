/**
 * QUANT AI — Zero-Trust JSON-RPC Agent Client & Tool Runtime
 * 
 * - Handles WebSocket communication with local QUANT Rust Agent (ws://127.0.0.1:8081).
 * - Enforces JSON-RPC 2.0 protocol with nonces, pairing tokens, and workspace boundaries.
 * - Decouples AI models (Gemini / Claude / ChatGPT) through a unified Tool Runtime.
 */

class QuantAgentClient {
    constructor() {
        this.ws = null;
        this.url = window.AuthConfig ? window.AuthConfig.LOCAL_AGENT_URL : 'ws://127.0.0.1:8081';
        this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'executing'
        this.pendingRequests = new Map(); // id -> { resolve, reject }
        this.listeners = new Set();
        this.reconnectTimer = null;
        this.token = localStorage.getItem('quant_agent_token') || 'qnt_0d0da3a6091f4f8e988fac390ba05d98';
        this.activeWorkspace = null;
        this.capabilities = null;
    }

    getToken() {
        return this.token || localStorage.getItem('quant_agent_token') || 'qnt_0d0da3a6091f4f8e988fac390ba05d98';
    }

    setToken(token) {
        this.token = token.trim();
        localStorage.setItem('quant_agent_token', this.token);
        if (this.status === 'connected') {
            this.ping();
        } else {
            this.connect();
        }
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this._setStatus('connecting');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = async () => {
                console.log('⚡ QUANT Agent WebSocket Connected to', this.url);
                this._setStatus('connected');
                // Auto ping to verify token & fetch state
                try {
                    const res = await this.ping();
                    if (!res.workspace) {
                        const defaultWs = '/home/mohmad-nour/WebSites/mn-quant';
                        await this.setWorkspace(defaultWs);
                        console.log('📂 Automatically bound workspace:', defaultWs);
                    }
                } catch (err) {
                    console.warn('QUANT Agent Ping/Setup failed:', err.message);
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this._handleRpcResponse(data);
                } catch (e) {
                    console.error('Failed to parse agent JSON-RPC message:', e);
                }
            };

            this.ws.onclose = () => {
                this._setStatus('disconnected');
                this._scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.warn('QUANT Agent WS Error:', err);
                this._setStatus('disconnected');
            };

        } catch (e) {
            console.error('Failed to establish WebSocket connection to QUANT Agent:', e);
            this._setStatus('disconnected');
            this._scheduleReconnect();
        }
    }

    _scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            if (this.status === 'disconnected') {
                this.connect();
            }
        }, 5000); // Retry every 5s
    }

    _setStatus(newStatus) {
        this.status = newStatus;
        this.listeners.forEach(fn => fn(newStatus));

        // Update DOM status indicators if present
        const miniStatus = document.querySelectorAll('.agent-status-mini');
        miniStatus.forEach(el => {
            el.className = `agent-status-mini ${newStatus}`;
            const textEl = el.querySelector('span, .status-text');
            if (textEl) {
                const labels = { connected: 'Agent Connected 🟢', disconnected: 'Agent Disconnected 🔴', busy: 'Busy', executing: 'Executing... ⚡' };
                textEl.textContent = labels[newStatus] || newStatus;
            }
        });
    }

    onStatusChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    sendRpc(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return reject(new Error('Agent WebSocket connection is closed.'));
            }

            const id = 'rpc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            this.pendingRequests.set(id, { resolve, reject });

            const payload = {
                jsonrpc: '2.0',
                id: id,
                method: method,
                params: params,
                auth: {
                    token: this.getToken(),
                    nonce: 'nonce_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
                }
            };

            this.ws.send(JSON.stringify(payload));

            // 15s timeout for RPC calls
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`[Timeout] RPC method '${method}' timed out after 15s.`));
                }
            }, 15000);
        });
    }

    _handleRpcResponse(data) {
        if (!data || !data.id) return;
        const handler = this.pendingRequests.get(data.id);
        if (!handler) return;

        this.pendingRequests.delete(data.id);

        if (data.error) {
            handler.reject(new Error(`[QUANT Agent Error ${data.error.code}] ${data.error.message}`));
        } else {
            handler.resolve(data.result);
        }
    }

    // ─── High-Level Agent Commands ──────────────────────────

    async ping() {
        const res = await this.sendRpc('agent.ping');
        this.activeWorkspace = res.workspace;
        this.capabilities = res.capabilities;
        return res;
    }

    async setWorkspace(path, capabilities) {
        const res = await this.sendRpc('workspace.set', { path, capabilities });
        this.activeWorkspace = res.workspace;
        this.capabilities = res.capabilities;
        return res;
    }

    async listFiles(maxDepth = 3) {
        return await this.sendRpc('workspace.list_files', { max_depth: maxDepth });
    }

    async readFile(path, allowOutside = false) {
        return await this.sendRpc('file.read', { path, allow_outside: allowOutside });
    }

    async writeFile(path, content, allowOutside = false) {
        return await this.sendRpc('file.write', { path, content, allow_outside: allowOutside });
    }

    async copyFile(src, dst, allowOutside = false) {
        return await this.sendRpc('file.copy', { src, dst, allow_outside: allowOutside });
    }

    async deleteFile(path, allowOutside = false) {
        return await this.sendRpc('file.delete', { path, allow_outside: allowOutside });
    }

    async openUrl(url) {
        return await this.sendRpc('net.open_url', { url });
    }

    async uploadExternal(url, payload) {
        return await this.sendRpc('net.upload_external', { url, payload });
    }

    async execCommand(command) {
        this._setStatus('executing');
        try {
            const res = await this.sendRpc('terminal.exec', { command });
            this._setStatus('connected');
            return res;
        } catch (e) {
            this._setStatus('connected');
            throw e;
        }
    }
}

// Tauri desktop build uses the Rust backend in-process. The hosted website
// retains its optional WebSocket agent so the browser version still works.
class QuantNativeAgentClient {
    constructor() {
        this.native = true;
        this.isNative = true;
        this.url = 'native://rust';
        this.status = 'disconnected';
        this.listeners = new Set();
        this.activeWorkspace = null;
        this.capabilities = null;
    }

    invoke(command, args = {}) {
        const invoke = window.__TAURI__?.core?.invoke;
        if (!invoke) return Promise.reject(new Error('MN Quant native bridge is unavailable.'));
        return invoke(command, args);
    }

    _setStatus(status) {
        this.status = status;
        this.listeners.forEach(listener => listener(status));
        document.querySelectorAll('.agent-status-mini').forEach(el => {
            el.className = `agent-status-mini ${status}`;
            const label = el.querySelector('span, .status-text');
            if (label) label.textContent = status === 'connected' ? 'App Connected 🟢' : status;
        });
    }

    onStatusChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getToken() { return 'native-app'; }

    async connect() {
        this._setStatus('connecting');
        try {
            const info = await this.ping();
            this._setStatus('connected');
            const saved = await QuantState.getWorkspace();
            if (!info.workspace && saved?.path) {
                try { await this.setWorkspace(saved.path); }
                catch (error) { console.warn('Saved native workspace is unavailable; select a new folder.', error); }
            }
        } catch (error) {
            console.error('MN Quant Rust bridge could not start:', error);
            this._setStatus('disconnected');
        }
    }

    async ping() {
        const info = await this.invoke('agent_ping');
        this.activeWorkspace = info.workspace || null;
        this.capabilities = info.capabilities;
        return info;
    }

    async setWorkspace(path) {
        const info = await this.invoke('workspace_set', { path });
        this.activeWorkspace = info.workspace;
        this.capabilities = info.capabilities;
        await QuantState.saveWorkspace({ path: info.workspace, updatedAt: Date.now() });
        this._setStatus('connected');
        return info;
    }

    async pickWorkspace() {
        const open = window.__TAURI__?.dialog?.open;
        if (!open) throw new Error('Folder selection is unavailable in this build.');
        const selected = await open({ directory: true, multiple: false, title: 'Choose the folder QUANT may access' });
        if (!selected) return null;
        return this.setWorkspace(selected);
    }

    async listFiles(maxDepth = 3) { return this.invoke('workspace_list_files', { maxDepth }); }
    async readFile(path) { return this.invoke('file_read', { path }); }
    async writeFile(path, content) { return this.invoke('file_write', { path, content }); }
    async copyFile(src, dst) { return this.invoke('file_copy', { src, dst }); }
    async deleteFile(path) { return this.invoke('file_delete', { path }); }
    async openUrl(url) {
        const openUrl = window.__TAURI__?.opener?.openUrl;
        if (!openUrl) throw new Error('Opening external links is unavailable in this build.');
        await openUrl(url);
        return { success: true, url };
    }
    async uploadExternal() { throw new Error('External file upload is not available in the native bridge yet.'); }
    async execCommand(command) {
        this._setStatus('executing');
        try { return await this.invoke('terminal_exec', { command }); }
        finally { this._setStatus('connected'); }
    }
}

// Global Singleton Agent Client
const isTauriRuntime = !!window.__TAURI__?.core?.invoke;
window.quantAgent = isTauriRuntime ? new QuantNativeAgentClient() : new QuantAgentClient();

// Auto connect on page load
document.addEventListener('DOMContentLoaded', () => {
    window.quantAgent.connect();
});

// ─── Unified QUANT Tool Runtime ─────────────────────────────
const QuantToolRuntime = {
    /**
     * Executes an AI-requested tool with Zero-Trust Permission Check.
     */
    async executeToolCall(toolName, params = {}) {
        if (window.quantAgent.status !== 'connected') {
            throw new Error(window.quantAgent.isNative
                ? 'The MN Quant native bridge is not ready yet. Try again in a moment.'
                : 'Local QUANT Agent is not connected. Please launch quant-agent on your machine.');
        }

        // Auto-ensure active workspace is bound
        let activeWs = window.quantAgent.activeWorkspace;
        if (!window.quantAgent.activeWorkspace) {
            if (window.quantAgent.isNative) {
                const savedWorkspace = await QuantState.getWorkspace();
                if (savedWorkspace?.path) {
                    await window.quantAgent.setWorkspace(savedWorkspace.path);
                } else {
                    const selected = await window.quantAgent.pickWorkspace();
                    if (!selected) throw new Error('Choose a workspace folder before allowing file access.');
                }
            } else {
                activeWs = '/home/mohmad-nour/WebSites/mn-quant';
                await window.quantAgent.setWorkspace(activeWs);
            }
        }

        console.log(`🛠️ [Tool Runtime] Requesting tool execution: ${toolName}`, params);

        switch (toolName) {
            case 'list_files':
                await PermissionGateway.checkPrivilege('READ', { operation: 'List Files' });
                return await window.quantAgent.listFiles(params.max_depth || 3);

            case 'read_file':
                await PermissionGateway.checkPrivilege('READ', { path: params.path });
                return await window.quantAgent.readFile(params.path, true);

            case 'write_file': {
                await PermissionGateway.checkPrivilege('WRITE', { path: params.path });

                // Capture the previous content BEFORE overwriting, purely so
                // the chat UI can render a colored diff card (git-style
                // +added / -removed lines). This doesn't change the wire
                // protocol with the Rust agent at all — file.read/file.write
                // are both already-existing RPC calls, just sequenced here.
                let oldContent = null;
                let isNewFile = true;
                try {
                    const existing = await window.quantAgent.readFile(params.path, true);
                    oldContent = existing?.content ?? null;
                    isNewFile = false;
                } catch (e) {
                    // File genuinely doesn't exist yet (or isn't readable as
                    // text) — that's fine, it just means this is a create,
                    // not an edit. We don't want a read failure to block the
                    // write itself, so we swallow it here.
                    isNewFile = true;
                }

                const writeResult = await window.quantAgent.writeFile(params.path, params.content, true);
                return {
                    ...writeResult,
                    old_content: oldContent,
                    new_content: params.content,
                    is_new_file: isNewFile
                };
            }

            case 'copy_file':
                await PermissionGateway.checkPrivilege('COPY', { src: params.src, dst: params.dst, path: params.dst });
                return await window.quantAgent.copyFile(params.src, params.dst, true);

            case 'delete_file':
                await PermissionGateway.checkPrivilege('DELETE', { path: params.path });
                return await window.quantAgent.deleteFile(params.path, true);

            case 'open_url':
                await PermissionGateway.checkPrivilege('OPEN_URL', { url: params.url });
                return await window.quantAgent.openUrl(params.url);

            case 'upload_external':
                await PermissionGateway.checkPrivilege('UPLOAD_EXTERNAL', { url: params.url, file: params.file });
                return await window.quantAgent.uploadExternal(params.url, params.payload);

            case 'exec_command':
                await PermissionGateway.checkPrivilege('EXECUTE', { command: params.command });
                return await window.quantAgent.execCommand(params.command);

            default:
                throw new Error(`Unknown tool requested: ${toolName}`);
        }
    }
};

window.QuantToolRuntime = QuantToolRuntime;
