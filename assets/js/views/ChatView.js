class ChatView {
    constructor(container) {
        this.container = container;
        this.messages = [];
        this.apiConfig = null;
        this.profile = null;
        this.attachedFiles = [];
        this.isExecuting = false;
        this.currentAbortController = null;
        this.liveActivityTimer = null;
        this.activeLiveBubble = null;
        this.recognition = null;
        this.isRecording = false;
    }

    async render() {
        this.messages = await QuantState.getChatHistory();
        this.apiConfig = await QuantState.getApiConfig();
        this.profile = await QuantState.getProfile();
        this.identity = await QuantState.getIdentity();
        
        const agentStatus = window.quantAgent ? window.quantAgent.status : 'disconnected';
        const statusLabels = { 
            connected: window.i18n.t('status.connected') + ' 🟢', 
            disconnected: window.i18n.t('status.disconnected') + ' 🔴', 
            busy: window.i18n.t('status.busy'), 
            executing: window.i18n.t('status.executing') 
        };
        const isPublicChat = window.CoopRoomManager && window.CoopRoomManager.isPublicChat;
        const lang = window.i18n.currentLang;
        const activeWs = window.quantAgent && window.quantAgent.activeWorkspace;
        const wsDisplayName = activeWs ? (activeWs.replace(/\\/g, '/').split('/').filter(Boolean).pop() || activeWs) : null;

        this.container.innerHTML = `
            <div class="chat-layout" style="display: flex; flex-direction: column; height: calc(100vh - var(--header-height) - 64px);">
                
                <!-- Agent & AI Model Header -->
                <div class="glass-card" style="padding: 12px 24px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <span>${window.i18n.t('chat.header_title')}</span>
                            ${isPublicChat 
                                ? `<span style="font-size: 0.75rem; background: #2563eb; color: #ffffff; padding: 3px 10px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(37,99,235,0.5);">${window.i18n.t('chat.public_session')}</span>`
                                : `<span style="font-size: 0.75rem; background: rgba(124,111,255,0.2); color: var(--primary-color); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--border-highlight);">${window.i18n.t('chat.private_session')}</span>`
                            }
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span>${window.i18n.t('chat.model_label')} <strong style="color: var(--text-primary);">${this.apiConfig?.model ? this.escapeHtml(this.apiConfig.model) : window.i18n.t('chat.no_model')}</strong></span>
                            <span>|</span>
                            <span>${window.i18n.t('chat.active_workspace')}</span>
                            ${activeWs 
                                ? `<code style="color: var(--accent-color); font-weight: 600;" title="${this.escapeAttr(activeWs)}">📁 ${this.escapeHtml(wsDisplayName)}</code>
                                   <button id="chat-change-ws-btn" class="btn-secondary" style="padding: 2px 8px; font-size: 0.72rem; border-radius: 8px; height: auto;">${window.i18n.t('chat.change_folder')}</button>`
                                : `<span style="color: var(--status-busy); font-style: italic;">${window.i18n.t('chat.no_workspace')}</span>
                                   <button id="chat-pick-ws-btn" class="btn-primary" style="padding: 2px 10px; font-size: 0.75rem; border-radius: 8px; height: auto;">${window.i18n.t('chat.choose_folder')}</button>`
                            }
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${isPublicChat ? `
                            <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-color);">
                                <span style="color: var(--text-muted); font-weight: 600;">🔑 الـ API المستخدم:</span>
                                <select id="chat-api-selector" style="background: transparent; border: none; color: var(--accent-color); font-weight: 600; font-size: 0.8rem; cursor: pointer; outline: none;">
                                    <option value="owner">API صاحب المحادثة (${this.escapeHtml(window.CoopRoomManager?.roomOwner || 'الرئيس')})</option>
                                    <option value="my_own">API الخاص بي</option>
                                </select>
                            </div>
                        ` : ''}

                        <div id="chat-agent-status" class="agent-status-mini ${agentStatus}">
                            <div class="status-dot"></div>
                            <span class="status-text">${statusLabels[agentStatus] || 'Disconnected'}</span>
                        </div>
                    </div>
                </div>

                ${!activeWs ? `
                <!-- No Workspace Alert Banner -->
                <div id="chat-no-ws-banner" style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--status-busy); border-radius: 12px; padding: 10px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">📂</span>
                        <span style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${window.i18n.t('chat.workspace_alert')}</span>
                    </div>
                    <button id="chat-banner-pick-btn" class="btn-primary" style="padding: 4px 12px; font-size: 0.8rem; white-space: nowrap; border-radius: 8px;">${window.i18n.t('chat.choose_folder')}</button>
                </div>
                ` : ''}

                <!-- Quick Local Actions Bar -->
                <div class="glass-card" style="padding: 8px 16px; margin-bottom: 12px; display: flex; gap: 10px; font-size: 0.85rem; align-items: center; flex-wrap: wrap;">
                    <span style="color: var(--text-muted); font-weight: 600;">${window.i18n.t('chat.quick_tools')}</span>
                    <button id="tool-btn-ls" class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;">${window.i18n.t('chat.list_btn')}</button>
                    <button id="tool-btn-ping" class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;">${window.i18n.t('chat.ping_btn')}</button>
                    <button id="tool-btn-folder" class="btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;">${activeWs ? window.i18n.t('chat.change_folder') : window.i18n.t('chat.choose_folder')}</button>
                    <span style="color: var(--text-muted); margin-left: auto; font-size: 0.75rem;">${window.i18n.t('chat.commands_hint')}</span>
                </div>

                <!-- Chat Messages History -->
                <div id="chat-messages" class="chat-history glass-card" style="flex: 1; overflow-y: auto; margin-bottom: 12px; display: flex; flex-direction: column; gap: 16px; padding: 20px;">
                    ${this.messages.length === 0 ? this.renderEmptyState() : this.renderMessages()}
                </div>

                <!-- File Attachments Preview Container -->
                <div id="attached-files-container" style="display: none; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;"></div>

                <!-- Input Area -->
                <div class="chat-input-area glass-card" style="padding: 16px; display: flex; gap: 10px; align-items: flex-end;">
                    
                    <!-- File Upload Button & Hidden Input -->
                    <input type="file" id="chat-file-input" accept="image/*,.pdf,.txt,.js,.ts,.py,.cpp,.rs,.json,.csv,.md,.html,.css" multiple style="display: none;">
                    <button id="chat-attach-btn" class="btn-secondary" title="${window.i18n.t('chat.attach_title')}" style="height: 50px; width: 50px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; padding: 0;">
                        📎
                    </button>

                    <!-- Voice Input Button (Speech-to-Text) -->
                    <button id="chat-voice-btn" class="btn-secondary" title="${window.i18n.t('chat.voice_title')}" style="height: 50px; width: 50px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; padding: 0; transition: all 0.3s;">
                        🎤
                    </button>

                    <div style="flex: 1;">
                        <textarea id="chat-input" class="input-control" placeholder="${window.i18n.t('chat.input_placeholder')}" style="width: 100%; resize: none; height: 50px; margin: 0; display: block; overflow: hidden; font-size: 0.95rem;"></textarea>
                    </div>

                    <!-- Stop Button (Red square, visible while model is running) -->
                    <button id="chat-stop-btn" class="btn-secondary" title="${window.i18n.t('chat.stop_btn')}" style="display: none; height: 50px; padding: 0 16px; align-items: center; justify-content: center; background: rgba(239,68,68,0.2); border-color: var(--status-disconnected); color: #f87171; font-weight: 700; gap: 6px;">
                        <span style="font-size: 16px;">⏹️</span> <span>${window.i18n.t('chat.stop_btn')}</span>
                    </button>
                    
                    <!-- Send Button (Remains active even while model is running) -->
                    <button id="chat-send-btn" class="btn-primary" style="height: 50px; display: flex; align-items: center; justify-content: center; padding: 0 24px; font-weight: 600;">
                        ${window.i18n.t('chat.send_btn')}
                    </button>
                </div>
            </div>
        `;

        // Bind attachment button
        const fileInput = this.container.querySelector('#chat-file-input');
        const attachBtn = this.container.querySelector('#chat-attach-btn');
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Bind Workspace Picking Buttons
        const onSelectFolder = async () => {
            try {
                let res;
                if (window.quantAgent?.isNative) {
                    res = await window.quantAgent.pickWorkspace();
                } else {
                    const entered = prompt(lang === 'ar' ? 'أدخل مسار مجلد المشروع:' : 'Enter project workspace folder path:');
                    if (entered) res = await window.quantAgent.setWorkspace(entered);
                }
                if (res) {
                    await this.render();
                }
            } catch (err) {
                alert(err.message || 'Could not select folder.');
            }
        };

        const pickWsBtn = this.container.querySelector('#chat-pick-ws-btn');
        const changeWsBtn = this.container.querySelector('#chat-change-ws-btn');
        const bannerPickBtn = this.container.querySelector('#chat-banner-pick-btn');
        const toolFolderBtn = this.container.querySelector('#tool-btn-folder');
        if (pickWsBtn) pickWsBtn.addEventListener('click', onSelectFolder);
        if (changeWsBtn) changeWsBtn.addEventListener('click', onSelectFolder);
        if (bannerPickBtn) bannerPickBtn.addEventListener('click', onSelectFolder);
        if (toolFolderBtn) toolFolderBtn.addEventListener('click', onSelectFolder);

        // Bind Voice Input
        const voiceBtn = this.container.querySelector('#chat-voice-btn');
        voiceBtn.addEventListener('click', () => this.toggleVoiceInput());

        // Bind Stop Button
        const stopBtn = this.container.querySelector('#chat-stop-btn');
        stopBtn.addEventListener('click', () => this.stopModelExecution());

        // Bind quick buttons
        this.container.querySelector('#tool-btn-ls').addEventListener('click', () => {
            const input = this.container.querySelector('#chat-input');
            input.value = '/list';
            this.sendMessage();
        });

        this.container.querySelector('#tool-btn-ping').addEventListener('click', async () => {
            try {
                const res = await window.quantAgent.ping();
                alert(`⚡ QUANT Rust Agent Online!\n\nOS: ${res.os} (${res.arch})\nWorkspace: ${res.workspace || 'Bound'}\nCapabilities: Read, Write, Exec, Images`);
            } catch (e) {
                alert(`Agent Disconnected: ${e.message}`);
            }
        });

        // Bind send
        const sendBtn = this.container.querySelector('#chat-send-btn');
        const input = this.container.querySelector('#chat-input');
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
        });
        
        // Scroll to bottom
        const messagesDiv = this.container.querySelector('#chat-messages');
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        files.forEach(file => {
            const reader = new FileReader();
            const isImage = file.type.startsWith('image/');
            
            reader.onload = (e) => {
                this.attachedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    isImage: isImage,
                    dataUrl: e.target.result
                });
                this.renderAttachmentChips();
            };

            if (isImage) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });

        event.target.value = ''; // Reset
    }

    renderAttachmentChips() {
        const container = this.container.querySelector('#attached-files-container');
        if (!container) return;

        if (this.attachedFiles.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = this.attachedFiles.map((file, idx) => `
            <div style="background: rgba(124,111,255,0.15); border: 1px solid var(--border-highlight); border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                <span>${file.isImage ? '🖼️' : '📄'} ${this.escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button class="remove-attach-btn" data-index="${idx}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; padding: 0 4px;">✕</button>
            </div>
        `).join('');

        container.querySelectorAll('.remove-attach-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.attachedFiles.splice(index, 1);
                this.renderAttachmentChips();
            });
        });
    }

    renderEmptyState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 48px; text-align: center;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 24px; opacity: 0.6;">Q</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">${window.i18n.t('chat.empty_title')}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; line-height: 1.7;">
                    ${window.i18n.t('chat.empty_desc')}
                </p>
            </div>
        `;
    }

    renderMessages() {
        const lang = window.i18n.currentLang;
        const defaultSenderName = (this.profile && this.profile.name) || (this.identity && this.identity.displayName) || 'User';
        const defaultSenderAvatar = (this.identity && this.identity.avatarUrl) || '';

        return this.messages.map((msg, idx) => {
            if (msg.role === 'user') {
                const senderName = msg.senderName || defaultSenderName;
                const senderAvatar = msg.senderAvatar || defaultSenderAvatar;
                const initial = senderName.charAt(0).toUpperCase();

                const avatarHtml = senderAvatar 
                    ? `<img src="${senderAvatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-highlight); flex-shrink: 0;" alt="${this.escapeHtml(senderName)}">`
                    : `<div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border: 1px solid var(--border-color); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white;">${initial}</div>`;

                let displayContent = this.escapeHtml(msg.content);

                // Render attached image data as embedded thumbnail images in chat
                displayContent = displayContent.replace(/\[Attached Image Data: (data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+)\]/g, (match, dataUrl) => {
                    return `<br><img src="${dataUrl}" style="max-width:260px; max-height:200px; border-radius:12px; border:1px solid var(--border-highlight); margin-top:8px; display:block; object-fit:cover;">`;
                });

                // Replace heavy file attachment code blocks with interactive collapsible cards!
                displayContent = displayContent.replace(/📄 \*\*File Attachment: ([^\*]+)\*\* \(([^)]+)\)\n\`\`\`(\w*)\n([\s\S]*?)\`\`\`/g, (match, fileName, fileSize, ext, codeText) => {
                    return `
                    <details class="collapsible-file-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-highlight); border-radius: 12px; margin: 10px 0; padding: 10px 14px; font-size: 0.85rem;">
                        <summary style="cursor: pointer; font-weight: 600; color: var(--primary-color); display: flex; align-items: center; justify-content: space-between; user-select: none;">
                            <span>📄 ${fileName} (${fileSize})</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.8;">[ ${lang === 'ar' ? '▼ عرض المحتوى' : '▼ View Content'} ]</span>
                        </summary>
                        <div style="margin-top: 10px; max-height: 350px; overflow-y: auto; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                            <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 0.8rem; color: var(--text-primary);">${codeText}</pre>
                        </div>
                    </details>`;
                });

                return `
                    <div class="message user-msg-container" data-index="${idx}" style="display: flex; gap: 18px; flex-direction: row-reverse; position: relative;">
                        ${avatarHtml}
                        <div class="user-bubble" style="background: var(--bg-surface-hover); padding: 14px 18px; border: 1px solid var(--border-color); max-width: 80%; cursor: context-menu;">
                            <span style="font-size: 0.78rem; color: var(--accent-color); font-weight: 700; display: block; margin-bottom: 6px;">👤 ${this.escapeHtml(senderName)}</span>
                            <div style="margin: 0; white-space: pre-wrap;">${displayContent}</div>
                        </div>
                    </div>
                `;
            } else {
                const bodyHtml = (msg.segments && msg.segments.length)
                    ? this.renderSegments(msg.segments)
                    : this.formatMarkdown(msg.content);
                const durationHtml = Number.isFinite(msg.durationMs)
                    ? `<div class="message-completion-duration">${this.escapeHtml(window.i18n.t('agentcard.working_for', { duration: this.formatWorkingDuration(msg.durationMs) }))}</div>`
                    : '';

                return `
                    <div class="message ai ai-msg-container" style="display: flex; gap: 18px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">Q</div>
                        <div class="assistant-bubble" style="background: rgba(124, 111, 255, 0.1); padding: 16px; border: 1px solid var(--border-highlight); max-width: 85%;">
                            ${durationHtml}
                            <div style="margin: 0; white-space: pre-wrap;">${bodyHtml}</div>
                            
                            <!-- AI Response Action Buttons -->
                            <div style="display: flex; gap: 8px; margin-top: 12px; align-items: center; flex-wrap: wrap;">
                                <button class="ai-copy-btn btn-secondary" data-index="${idx}" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 8px; display: flex; align-items: center; gap: 4px; border-color: var(--border-color);">
                                    📋 <span>${lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                                </button>
                                <button class="ai-share-btn btn-secondary" data-index="${idx}" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 8px; display: flex; align-items: center; gap: 4px; border-color: var(--border-color);">
                                    🔗 <span>${lang === 'ar' ? 'مشاركة' : 'Share'}</span>
                                </button>
                                <button class="ai-retry-btn btn-secondary" data-index="${idx}" style="padding: 4px 10px; font-size: 0.75rem; border-radius: 8px; display: flex; align-items: center; gap: 4px; border-color: var(--border-color);">
                                    🔄 <span>${lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    purgeOldAttachmentContent() {
        if (!this.messages || this.messages.length <= 6) return;
        const purgeCutoffIndex = this.messages.length - 6;

        let modified = false;
        for (let i = 0; i < purgeCutoffIndex; i++) {
            const msg = this.messages[i];
            if (msg.role === 'user' && msg.content) {
                if (msg.content.includes('[Attached Image Data: data:image/')) {
                    msg.content = msg.content.replace(/\[Attached Image Data: data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+\]/g, '[Image Content Purged after 6 turns — Name & Type Retained]');
                    modified = true;
                }
                if (msg.content.includes('📄 **File Attachment:') && msg.content.length > 300) {
                    msg.content = msg.content.replace(/(\`\`\`[\s\S]*?\`\`\`)/g, '```\n[File Content Body Purged after 6 turns — Name & Type Retained]\n```');
                    modified = true;
                }
            }
        }
    }

    // High-Tech Quantum Orbital Thinking Loader
    showQuantumThinkingIndicator(initialStatusText = 'QUANT Core is thinking...') {
        const messagesDiv = this.container.querySelector('#chat-messages');
        const typingEl = document.createElement('div');
        typingEl.id = 'quantum-typing-indicator';
        typingEl.style.cssText = 'display: flex; gap: 16px; padding: 8px 0; margin-top: 8px;';
        typingEl.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">Q</div>
            <div class="quantum-thinking-box">
                <div class="quantum-orb"></div>
                <div style="display: flex; flex-direction: column;">
                    <span id="quantum-status-text" style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary); transition: all 0.3s ease;">${this.escapeHtml(initialStatusText)}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Zero-Trust Sandboxed Execution</span>
                </div>
            </div>
        `;
        messagesDiv.appendChild(typingEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    updateQuantumStatusText(newStatusText) {
        const statusEl = this.container.querySelector('#quantum-status-text');
        if (statusEl) {
            statusEl.textContent = newStatusText;
        }
    }

    hideQuantumThinkingIndicator() {
        const indicator = this.container.querySelector('#quantum-typing-indicator');
        if (indicator) indicator.remove();
    }

    // ─── Live streaming assistant bubble (Claude-style) ───────────────────
    // Creates one DOM bubble for the assistant's current turn and updates it
    // directly as events stream in, instead of re-rendering the whole chat
    // history on every token. `live.segments` accumulates the same ordered
    // [text, tool_card, text, tool_card, ...] structure that gets saved into
    // chat history afterwards, so reopening the conversation later replays
    // the identical layout instead of collapsing to one flat string.
    createLiveAssistantBubble() {
        const messagesDiv = this.container.querySelector('#chat-messages');
        const wrapper = document.createElement('div');
        wrapper.className = 'message ai live-assistant-message';
        wrapper.style.cssText = 'display: flex; gap: 18px;';
        wrapper.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">Q</div>
            <div class="live-bubble-body assistant-bubble" style="background: rgba(124, 111, 255, 0.1); padding: 16px; border: 1px solid var(--border-highlight); max-width: 85%; min-width: 120px;">
                <div class="live-status-row" role="status" aria-live="polite">
                    <span class="live-status-icon-wrap">${this.activityIcon('thinking')}</span>
                    <span class="live-status-label">Thinking</span>
                    <span class="live-status-duration">0s</span>
                </div>
                <div class="live-content-stream" style="margin: 0; white-space: pre-wrap;"></div>
            </div>
        `;
        messagesDiv.appendChild(wrapper);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        const live = {
            wrapper,
            streamEl: wrapper.querySelector('.live-content-stream'),
            bodyEl: wrapper.querySelector('.live-bubble-body'),
            segments: [],          // ordered [{type:'text', text} | {type:'tool', ...}]
            currentTextBuffer: '', // text accumulated since the last tool card
            currentTextEl: null,   // the <span> currently receiving text_delta
            activeCardEl: null,    // DOM node of the tool card currently "in progress"
            startedAt: Date.now(),
            statusIconEl: wrapper.querySelector('.live-status-icon-wrap'),
            statusLabelEl: wrapper.querySelector('.live-status-label'),
            statusDurationEl: wrapper.querySelector('.live-status-duration')
        };
        this.activeLiveBubble = live;
        this.liveActivityTimer = setInterval(() => this.updateLiveDuration(live), 1000);
        return live;
    }

    activityIcon(activity) {
        const icons = {
            thinking: '<svg class="live-status-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.5a4 4 0 0 0-3.8 5.2A3.7 3.7 0 0 0 6 16v2.2A2.8 2.8 0 0 0 8.8 21H10v-4.5a2 2 0 0 0-2-2"/><path d="M15 3.5a4 4 0 0 1 3.8 5.2A3.7 3.7 0 0 1 18 16v2.2a2.8 2.8 0 0 1-2.8 2.8H14v-4.5a2 2 0 0 1 2-2"/><path d="M12 4v16M8 8.5a2.2 2.2 0 0 1 2.2 2.2M16 8.5a2.2 2.2 0 0 0-2.2 2.2M8 16h2M14 16h2"/></svg>',
            editing: '<svg class="live-status-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19.3 8.1a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"/><path d="M13 20h7"/></svg>',
            browsing: '<svg class="live-status-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z"/></svg>',
            working: ''
        };
        return icons[activity] || '';
    }

    formatWorkingDuration(milliseconds) {
        let seconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(seconds / 86400); seconds %= 86400;
        const hours = Math.floor(seconds / 3600); seconds %= 3600;
        const minutes = Math.floor(seconds / 60); seconds %= 60;
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours || days) parts.push(`${hours}h`);
        if (minutes || hours || days) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        return parts.join(' ');
    }

    updateLiveDuration(live) {
        if (!live?.statusDurationEl?.isConnected || live.finishedAt) return;
        live.statusDurationEl.hidden = false;
        live.statusDurationEl.textContent = this.formatWorkingDuration(Date.now() - live.startedAt);
    }

    setLiveActivity(live, activity) {
        if (!live) return;
        live.statusIconEl.innerHTML = this.activityIcon(activity);
        live.statusIconEl.style.display = this.activityIcon(activity) ? 'inline-flex' : 'none';
        live.statusLabelEl.textContent = activity === 'thinking' ? window.i18n.t('agentcard.thinking')
            : activity === 'editing' ? window.i18n.t('agentcard.editing')
            : activity === 'browsing' ? window.i18n.t('agentcard.browsing')
            : '';
    }

    stopLiveActivity(live = this.activeLiveBubble) {
        if (this.liveActivityTimer) clearInterval(this.liveActivityTimer);
        this.liveActivityTimer = null;
        if (this.activeLiveBubble === live) this.activeLiveBubble = null;
    }

    // Routes one streamed event from the provider into the live bubble:
    // appends text as it arrives, and opens/fills a collapsible tool card
    // exactly when the model starts/finishes using a tool — same rhythm as
    // this chat interface narrating "let me check X" then showing the result.
    handleLiveEvent(live, ev) {
        const messagesDiv = this.container.querySelector('#chat-messages');

        if (ev.type === 'text_delta') {
            if (!live.currentTextEl) {
                live.currentTextEl = document.createElement('span');
                live.streamEl.appendChild(live.currentTextEl);
                live.segments.push({ type: 'text', text: '' });
            }
            live.currentTextBuffer += ev.text;
            live.currentTextEl.textContent = live.currentTextBuffer;
            live.segments[live.segments.length - 1].text = live.currentTextBuffer;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

        } else if (ev.type === 'tool_start') {
            const toolName = String(ev.name || '').toLowerCase();
            const activity = /^(write_file|create_file|edit_file|patch_file|delete_file)$/.test(toolName)
                ? 'editing'
                : /^(open_url|web_search|search_web|browser_search|browse_web|fetch_url)$/.test(toolName)
                    ? 'browsing'
                    : 'working';
            this.setLiveActivity(live, activity);
            // Close off the text run so far (formatted, since it's now final).
            if (live.currentTextEl) {
                live.currentTextEl.outerHTML = this.formatMarkdown(live.currentTextBuffer);
            }
            live.currentTextBuffer = '';
            live.currentTextEl = null;

            const card = this.buildToolCard(ev.name, ev.args, 'running');
            live.bodyEl.appendChild(card.el);
            live.activeCardEl = card;
            live.segments.push({ type: 'tool', name: ev.name, args: ev.args, status: 'running', result: null, error: null });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

        } else if (ev.type === 'tool_result') {
            this.setLiveActivity(live, 'thinking');
            const seg = [...live.segments].reverse().find(s => s.type === 'tool' && s.status === 'running');
            if (seg) {
                seg.status = ev.error ? 'error' : 'done';
                seg.result = ev.result;
                seg.error = ev.error;
            }
            if (live.activeCardEl) {
                this.fillToolCardResult(live.activeCardEl, ev.name, ev.args, ev.result, ev.error);
                live.activeCardEl = null;
            }
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

        } else if (ev.type === 'turn_end') {
            // Nothing to do visually — a new text run or tool card will
            // open naturally on the next event if the model continues.
        }
    }

    // Converts the finished live DOM bubble into a normal, static message
    // bubble matching renderMessages()'s usual AI-message markup (copy/
    // share/retry buttons etc.), so behavior after a page refresh is
    // identical to right after streaming completes.
    finalizeLiveMessage(live) {
        const idx = this.messages.length - 1;
        const durationMs = Math.max(0, Date.now() - live.startedAt);
        if (idx >= 0 && this.messages[idx]?.role === 'assistant') {
            this.messages[idx].durationMs = durationMs;
        }
        live.finishedAt = Date.now();
        live.statusDurationEl.hidden = false;
        live.statusDurationEl.textContent = window.i18n.t('agentcard.working_for', { duration: this.formatWorkingDuration(durationMs) });
        this.stopLiveActivity(live);
        live.wrapper.remove();
        this.refreshMessages();
    }

    // ─── Tool card construction ────────────────────────────────────────
    // One card per tool call: a title line (icon + short action label,
    // Claude-style) that's always visible, and a collapsible detail panel
    // (colored diff / command output / file listing) opened on click.
    toolCardMeta(name, args) {
        const t = (key) => window.i18n.t(key);
        switch (name) {
            case 'read_file': return { icon: '📖', label: t('agentcard.reading'), target: args.path };
            case 'write_file': return { icon: '✍️', label: t('agentcard.writing'), target: args.path };
            case 'copy_file': return { icon: '📋', label: t('agentcard.copying'), target: `${args.src} → ${args.dst}` };
            case 'delete_file': return { icon: '🗑️', label: t('agentcard.deleting'), target: args.path };
            case 'list_files': return { icon: '📂', label: t('agentcard.listing'), target: '' };
            case 'exec_command': return { icon: '⚡', label: t('agentcard.executing'), target: args.command };
            case 'open_url': return { icon: '🔗', label: t('agentcard.opening_url'), target: args.url };
            case 'upload_external': return { icon: '☁️', label: t('agentcard.uploading'), target: args.url };
            default: return { icon: '🛠️', label: name, target: '' };
        }
    }

    buildToolCard(name, args, status) {
        const meta = this.toolCardMeta(name, args);
        const el = document.createElement('details');
        el.className = 'agent-tool-card';
        el.dataset.tool = name;
        el.innerHTML = `
            <summary class="agent-tool-card-summary">
                <span class="agent-tool-card-icon">${meta.icon}</span>
                <span class="agent-tool-card-label">${this.escapeHtml(meta.label)}</span>
                ${meta.target ? `<code class="agent-tool-card-target">${this.escapeHtml(meta.target)}</code>` : ''}
                <span class="agent-tool-card-badge status-running">
                    <span class="agent-tool-spinner"></span> ${window.i18n.t('agentcard.in_progress')}
                </span>
            </summary>
            <div class="agent-tool-card-detail"></div>
        `;
        return { el, meta };
    }

    fillToolCardResult(card, name, args, result, error) {
        const el = card.el;
        const badge = el.querySelector('.agent-tool-card-badge');
        const detail = el.querySelector('.agent-tool-card-detail');

        if (error) {
            badge.className = 'agent-tool-card-badge status-error';
            badge.innerHTML = `✕ ${window.i18n.t('agentcard.failed')}`;
            detail.innerHTML = `<pre class="agent-tool-card-error">${this.escapeHtml(error)}</pre>`;
            return;
        }

        badge.className = 'agent-tool-card-badge status-done';

        if (name === 'write_file') {
            const oldC = result?.old_content;
            const newC = result?.new_content ?? args.content ?? '';
            const isNew = result?.is_new_file || oldC === null || oldC === undefined;

            if (isNew) {
                const lineCount = (newC.match(/\n/g) || []).length + (newC ? 1 : 0);
                badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')} · <span class="diff-add-count">+${lineCount}</span>`;
                detail.innerHTML = `<div class="agent-tool-card-file-new-tag">${window.i18n.t('agentcard.new_file')}</div>${this.renderDiffBlock(computeLineDiff('', newC))}`;
            } else {
                const { added, removed, diff } = window.diffCounts(oldC, newC);
                if (added === 0 && removed === 0) {
                    badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')} · ${window.i18n.t('agentcard.no_changes')}`;
                    detail.innerHTML = `<div class="agent-tool-card-nochange">${window.i18n.t('agentcard.no_changes')}</div>`;
                } else {
                    badge.innerHTML = `✓ <span class="diff-add-count">+${added}</span> <span class="diff-del-count">-${removed}</span>`;
                    detail.innerHTML = this.renderDiffBlock(diff);
                }
            }
        } else if (name === 'read_file') {
            const content = result?.content;
            badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')}`;
            detail.innerHTML = result?.is_binary
                ? `<div class="agent-tool-card-nochange">[binary/image content]</div>`
                : `<pre class="agent-tool-card-code">${this.escapeHtml((content || '').slice(0, 4000))}${(content || '').length > 4000 ? '\n… (truncated)' : ''}</pre>`;
        } else if (name === 'exec_command') {
            badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')} · ${window.i18n.t('agentcard.exit_code')} ${result?.exit_code ?? '?'}`;
            const output = (result?.stdout || '') + (result?.stderr ? '\n' + result.stderr : '');
            detail.innerHTML = `
                <div class="agent-tool-card-cmdline">$ ${this.escapeHtml(args.command || '')}</div>
                <pre class="agent-tool-card-code">${this.escapeHtml(output.slice(0, 4000) || 'No output.')}</pre>
            `;
        } else if (name === 'list_files') {
            const files = result?.files || [];
            badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')} · ${files.length}`;
            // Native Rust returns paths as strings; the optional WebSocket agent returns objects.
            detail.innerHTML = `<pre class="agent-tool-card-code">${files.map(f => {
                const path = typeof f === 'string' ? f : (f?.path || '');
                const isDir = typeof f === 'string' ? false : !!f?.is_dir;
                return `${isDir ? '📁' : '📄'} ${this.escapeHtml(path)}`;
            }).join('\n')}</pre>`;
        } else if (name === 'copy_file' || name === 'delete_file') {
            badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')}`;
            detail.innerHTML = `<pre class="agent-tool-card-code">${this.escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
        } else {
            badge.innerHTML = `✓ ${window.i18n.t('agentcard.done')}`;
            detail.innerHTML = `<pre class="agent-tool-card-code">${this.escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
        }
    }

    // Renders a git-style colored diff block from computeLineDiff() output.
    renderDiffBlock(diffLines) {
        const rows = diffLines.map(line => {
            const cls = line.type === 'add' ? 'diff-line-add' : line.type === 'del' ? 'diff-line-del' : 'diff-line-same';
            const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
            return `<div class="diff-line ${cls}"><span class="diff-line-prefix">${prefix}</span>${this.escapeHtml(line.text)}</div>`;
        }).join('');
        return `<div class="agent-tool-card-diff">${rows}</div>`;
    }

    // Re-renders a completed live/historical assistant message's saved
    // segments back into the same text+card layout it had while streaming.
    renderSegments(segments) {
        return segments.map(seg => {
            if (seg.type === 'text') {
                return this.formatMarkdown(seg.text);
            }
            const card = this.buildToolCard(seg.name, seg.args, seg.status);
            const wrapper = document.createElement('div');
            wrapper.appendChild(card.el);
            this.fillToolCardResult(card, seg.name, seg.args, seg.result, seg.error);
            return wrapper.innerHTML;
        }).join('');
    }

    async sendMessage() {
        const input = this.container.querySelector('#chat-input');
        const text = input.value.trim();
        if (!text && this.attachedFiles.length === 0) return;

        const isAr = window.i18n.currentLang === 'ar';
        const profile = (await QuantState.getProfile()) || {};
        const identity = (await QuantState.getIdentity()) || {};
        const activeUserName = profile.name || identity.displayName || 'User';

        // ─── Co-Op Session Interruption / Queue Handling ───
        if (window.CoopRoomManager && window.CoopRoomManager.isActive) {
            const currentRoomUser = window.CoopRoomManager.currentUser || activeUserName;
            if (window.CoopRoomManager.isExecuting && window.CoopRoomManager.activeUser !== currentRoomUser) {
                // Another user is currently executing! Display waiting notice and queue
                const waitingNotice = isAr
                    ? `⏳ انتظر يا ${currentRoomUser}، حتى ينتهي النموذج من أمر صديقك (${window.CoopRoomManager.activeUser}).`
                    : `⏳ Please wait ${currentRoomUser}, until the model finishes processing ${window.CoopRoomManager.activeUser}'s command.`;
                
                this.messages.push({ role: 'assistant', content: waitingNotice });
                await QuantState.saveChatHistory(this.messages);
                this.refreshMessages();

                window.CoopRoomManager.queueTask({ text, files: [...this.attachedFiles], user: currentRoomUser });
                this.attachedFiles = [];
                this.renderAttachmentChips();
                input.value = '';
                return;
            }
            window.CoopRoomManager.isExecuting = true;
            window.CoopRoomManager.activeUser = currentRoomUser;
        }

        this.isExecuting = true;
        this.currentAbortController = new AbortController();
        this.toggleStopButton(true);

        // Compose user message with FULL file content and multi-modal images
        let userMessageContent = text;
        if (this.attachedFiles.length > 0) {
            const attachmentPayloads = this.attachedFiles.map(f => {
                if (f.isImage) {
                    return `🖼️ **Image Attachment: ${f.name}** (${(f.size / 1024).toFixed(1)} KB, Type: ${f.type})\n[Attached Image Data: ${f.dataUrl}]`;
                } else {
                    const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
                    return `📄 **File Attachment: ${f.name}** (${(f.size / 1024).toFixed(1)} KB, Type: ${f.type})\n\`\`\`${ext}\n${f.dataUrl}\n\`\`\``;
                }
            }).join('\n\n');

            userMessageContent = (text ? text + '\n\n' : '') + attachmentPayloads;
        }

        // Add user message with avatar & name metadata
        this.messages.push({ 
            role: 'user', 
            content: userMessageContent,
            senderName: activeUserName,
            senderAvatar: identity.avatarUrl || ''
        });

        const currentAttachments = [...this.attachedFiles];
        this.attachedFiles = [];
        this.renderAttachmentChips();
        input.value = '';
        this.refreshMessages();

        try {
            // ─── Handle Slash Commands (Direct Local Agent Actions) ───
            if (text.startsWith('/')) {
                this.showQuantumThinkingIndicator('Executing Agent Action...');
                let resultText = '';
                try {
                    if (text === '/list' || text === '/ls') {
                        this.updateQuantumStatusText('📖 Reading directory structure...');
                        const res = await QuantToolRuntime.executeToolCall('list_files', { max_depth: 3 });
                        const filesList = Array.isArray(res?.files) ? res.files : [];
                        const formatted = filesList.map(f => {
                            if (typeof f === 'string') return `📄 ${f}`;
                            return `${f.is_dir ? '📁' : '📄'} ${f.path || f.name} ${f.size != null ? `(${f.size} B)` : ''}`;
                        }).join('\n');
                        resultText = `📂 **Workspace Files List** (${res.total ?? filesList.length} entries):\n\n` + (formatted || 'No files found in workspace.');
                    } else if (text.startsWith('/read ')) {
                        const filePath = text.replace('/read ', '').trim();
                        this.updateQuantumStatusText(`📖 Reading file: ${filePath}`);
                        const res = await QuantToolRuntime.executeToolCall('read_file', { path: filePath });
                        resultText = `📄 **File Content: \`${filePath}\`**:\n\`\`\`\n${res.content || '[Binary / Image Content]'}\n\`\`\``;
                    } else if (text.startsWith('/write ')) {
                        const firstSpace = text.indexOf(' ', 7);
                        const filePath = text.substring(7, firstSpace !== -1 ? firstSpace : text.length).trim();
                        const content = firstSpace !== -1 ? text.substring(firstSpace + 1) : '';
                        this.updateQuantumStatusText(`✍️ Writing file: ${filePath}`);
                        const res = await QuantToolRuntime.executeToolCall('write_file', { path: filePath, content: content });
                        resultText = `✅ **File Saved Successfully!** Path: \`${res.path}\` (${res.bytes_written} bytes written).`;
                    } else if (text.startsWith('/exec ')) {
                        const cmd = text.replace('/exec ', '').trim();
                        this.updateQuantumStatusText(`⚡ Running terminal command: ${cmd}`);
                        const res = await QuantToolRuntime.executeToolCall('exec_command', { command: cmd });
                        resultText = `⚡ **Terminal Output** (Exit code: ${res.exit_code}):\n\`\`\`bash\n${res.stdout || res.stderr || 'No output.'}\n\`\`\``;
                    } else {
                        resultText = `Unknown slash command. Supported: \`/list\`, \`/read <path>\`, \`/write <path> <content>\`, \`/exec <cmd>\`.`;
                    }
                } catch (err) {
                    resultText = `❌ **Action Failed:** ${err.message}`;
                }

                this.hideQuantumThinkingIndicator();
                this.messages.push({ role: 'assistant', content: resultText });
                this.purgeOldAttachmentContent();
                await QuantState.saveChatHistory(this.messages);
                this.refreshMessages();

                if (window.CoopRoomManager && window.CoopRoomManager.isPublicChat) {
                    window.CoopRoomManager.broadcast('CHAT_MESSAGE', { messages: this.messages });
                }
                return;
            }

            // ─── API Key Routing & Sharing Controls ───
            // "useOwnerRelay" means: don't touch any API key on this device
            // at all. Instead, relay this turn through the room owner's
            // device via Firebase (see CoopRoomManager.requestOwnerApiCall) —
            // the owner's device is the only place the actual key ever
            // lives, exactly like a tiny remote server.
            let effectiveApiConfig = this.apiConfig;
            let useOwnerRelay = false;
            const apiSel = this.container.querySelector('#chat-api-selector');
            if (apiSel && apiSel.value === 'owner' && window.CoopRoomManager) {
                const isOwner = window.CoopRoomManager.currentUser === window.CoopRoomManager.roomOwner;
                if (!window.CoopRoomManager.sharedApiEnabled && !isOwner) {
                    alert(isAr 
                        ? '⚠️ لم يقم صاحب المحادثة بتفعيل الـ API المشترك بعد. تم استخدام الـ API الخاص بك لتنفيذ الطلب.'
                        : 'Shared API disabled by owner. Using your personal API key.'
                    );
                } else if (!isOwner) {
                    // Sharing IS enabled and this device isn't the owner:
                    // relay through the owner instead of using a local key.
                    useOwnerRelay = true;
                }
                // If this device IS the owner, it just uses its own local
                // apiConfig as normal — no relay needed for its own turns.
            }

            // ─── Multi-Modal / AI Model Execution — Live Streaming Mode ───
            let response = '';

            if (currentAttachments.length > 0) {
                this.showQuantumThinkingIndicator(window.i18n.t('agentcard.thinking'));
                this.updateQuantumStatusText('🔍 Analyzing uploaded files & media...');
                await new Promise(r => setTimeout(r, 600));
            }

            if (useOwnerRelay || (effectiveApiConfig && (effectiveApiConfig.apiKey || effectiveApiConfig.baseUrl?.includes('11434')))) {
                try {
                    const workspace = window.quantAgent?.activeWorkspace || 'Bound Workspace';
                    let workspaceTree = '';
                    if (window.quantAgent?.activeWorkspace && typeof window.quantAgent.listFiles === 'function') {
                        try {
                            const res = await window.quantAgent.listFiles(2);
                            const list = Array.isArray(res?.files) ? res.files : [];
                            if (list.length > 0) {
                                const preview = list.slice(0, 60).map(f => typeof f === 'string' ? f : `${f.is_dir ? '[DIR] ' : ''}${f.path}`).join('\n');
                                workspaceTree = `\nActive Workspace File Tree (${list.length} files detected):\n\`\`\`\n${preview}${list.length > 60 ? '\n...and more files' : ''}\n\`\`\`\n`;
                            }
                        } catch (e) {
                            console.warn('Could not list workspace files for prompt:', e);
                        }
                    }

                    const systemPrompt = `You are QUANT AI, an expert autonomous coding agent & AI pair-programmer modeled after Google DeepMind's Antigravity developer assistant.
You pair-program with the user to inspect code, fix bugs, create features, and execute tasks directly on local project files.

Active Environment:
- User Display Name: "${activeUserName}"
- User OS: ${profile.os || 'Windows'}
- Active Workspace: ${workspace}
${workspaceTree}
Autonomous Multi-Turn Tool Calling Rules:
1. Available Workspace Tools:
   - \`list_files(max_depth)\`: Explore workspace files & directories.
   - \`read_file(path)\`: Read local file content.
   - \`write_file(path, content)\`: Create or overwrite files.
   - \`exec_command(command)\`: Run terminal commands in workspace.
2. CONTINUOUS EXECUTION: You are expected to call multiple tools in succession without stopping until your objective is achieved. For example, read all necessary files one by one, edit or write modified files, and verify via commands.
3. INSPECT BEFORE EDITING: Always read existing file contents before editing or making assertions about code.
4. PROACTIVE WORK: Do not ask the user for permission to read or list files. Inspect files proactively when answering questions or fixing issues.
5. CLEAN CONCLUSION: When all actions are complete, do not call any more tools. Conclude your turn with a clear, concise, and structured summary explaining what was inspected, changed, or fixed.
6. LANGUAGE: Respond naturally in the user's interface language (${window.i18n.currentLang}).`;

                    // Hides the old spinner: from here on, the live bubble
                    // (text streaming in + tool cards as they happen) IS the
                    // "thinking" indicator, exactly like Claude's own chat UI.
                    this.hideQuantumThinkingIndicator();
                    const live = this.createLiveAssistantBubble();

                    if (useOwnerRelay) {
                        // This device never sees or touches an API key —
                        // the owner's device executes the real call and
                        // streams events back over Firebase.
                        response = await window.CoopRoomManager.requestOwnerApiCall(
                            this.messages,
                            systemPrompt,
                            (ev) => this.handleLiveEvent(live, ev)
                        );
                    } else {
                        const provider = window.AIProviderFactory.getProvider(effectiveApiConfig);
                        response = await provider.sendMessage(this.messages, systemPrompt, {
                            signal: this.currentAbortController?.signal,
                            statusCallback: (text) => { /* superseded by onEvent below; kept for BC */ },
                            onEvent: (ev) => this.handleLiveEvent(live, ev)
                        });
                    }

                    // Persist this turn's segments (text + tool cards, in the
                    // exact order they streamed) into chat history, so
                    // reopening the conversation later still shows the same
                    // live-look transcript instead of collapsing to plain text.
                    this.messages.push({ role: 'assistant', content: response, segments: live.segments });
                    this.finalizeLiveMessage(live);
                } catch (err) {
                    this.hideQuantumThinkingIndicator();
                    if (this.activeLiveBubble) {
                        this.stopLiveActivity(this.activeLiveBubble);
                        this.activeLiveBubble.wrapper.remove();
                    }
                    if (err.name === 'AbortError') return;
                    response = `[Connection Error] Could not reach API endpoint: ${err.message}`;
                    this.messages.push({ role: 'assistant', content: response });
                    this.refreshMessages();
                }
            } else {
                this.showQuantumThinkingIndicator(window.i18n.t('agentcard.thinking'));
                await new Promise(r => setTimeout(r, 800));
                if (currentAttachments.length > 0) {
                    response = `📎 **Files Analyzed Successfully!**\n\nI have received ${currentAttachments.length} attachment(s):\n` +
                        currentAttachments.map(f => `- **${f.name}** (${f.type || 'File'}, ${(f.size / 1024).toFixed(1)} KB)`).join('\n') +
                        `\n\nTo perform AI deep code generation or multi-modal analysis, configure your OpenAI / Gemini / Claude API key in **Settings**, or use direct agent commands like \`/list\` or \`/read\`.`;
                } else {
                    response = `Hello ${activeUserName}! I am **QUANT AI**, your local AI platform agent.\n\nYour local Rust Agent is ready at \`127.0.0.1:8081\`.\n\n- Configure your AI model API key in **Settings** to chat with Gemini, Claude, or ChatGPT.\n- Use slash commands like \`/list\` to list workspace files, \`/read <path>\` to inspect local files, or \`/exec <cmd>\` to run terminal commands.`;
                }
                this.hideQuantumThinkingIndicator();
                this.messages.push({ role: 'assistant', content: response });
                this.refreshMessages();
            }

            this.purgeOldAttachmentContent();
            await QuantState.saveChatHistory(this.messages);

            if (window.CoopRoomManager && window.CoopRoomManager.isPublicChat) {
                window.CoopRoomManager.broadcast('CHAT_MESSAGE', { messages: this.messages });
            }

        } finally {
            if (this.activeLiveBubble) this.stopLiveActivity(this.activeLiveBubble);
            this.isExecuting = false;
            this.toggleStopButton(false);
            this.currentAbortController = null;
            if (window.CoopRoomManager && window.CoopRoomManager.isActive) {
                window.CoopRoomManager.finishTask(this);
            }
        }
    }

    refreshMessages() {
        const messagesDiv = this.container.querySelector('#chat-messages');
        if (!messagesDiv) return;

        messagesDiv.innerHTML = this.messages.length === 0 ? this.renderEmptyState() : this.renderMessages();
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        const lang = window.i18n.currentLang;

        // Bind AI Copy Buttons
        messagesDiv.querySelectorAll('.ai-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                const msg = this.messages[idx];
                if (msg) {
                    navigator.clipboard.writeText(msg.content);
                    const span = e.currentTarget.querySelector('span');
                    if (span) {
                        const original = span.textContent;
                        span.textContent = lang === 'ar' ? 'تم النسخ ✓' : 'Copied ✓';
                        setTimeout(() => { span.textContent = original; }, 1800);
                    }
                }
            });
        });

        // Bind AI Share Buttons
        messagesDiv.querySelectorAll('.ai-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                const msg = this.messages[idx];
                if (msg) {
                    this.openShareModal(msg.content);
                }
            });
        });

        // Bind AI Retry Buttons
        messagesDiv.querySelectorAll('.ai-retry-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                if (this.messages[idx]?.role === 'assistant') {
                    this.messages.splice(idx, 1);
                    await QuantState.saveChatHistory(this.messages);
                    this.refreshMessages();
                    
                    const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user');
                    if (lastUserMsg) {
                        const input = this.container.querySelector('#chat-input');
                        input.value = lastUserMsg.content.split('\n\n📄 **File Attachment:')[0].split('\n\n🖼️ **Image Attachment:')[0];
                        this.messages.pop();
                        this.sendMessage();
                    }
                }
            });
        });

        // Bind Right-Click Context Menu for User Messages
        messagesDiv.querySelectorAll('.user-msg-container').forEach(el => {
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const idx = parseInt(el.dataset.index);
                const msg = this.messages[idx];
                if (!msg) return;

                const existingMenu = document.querySelector('#custom-context-menu');
                if (existingMenu) existingMenu.remove();

                const menu = document.createElement('div');
                menu.id = 'custom-context-menu';
                menu.style.cssText = `
                    position: fixed;
                    top: ${e.clientY}px;
                    left: ${e.clientX}px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-highlight);
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 10000;
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 150px;
                    backdrop-filter: blur(12px);
                `;

                menu.innerHTML = `
                    <button id="ctx-copy" style="background:none;border:none;color:var(--text-primary);padding:8px 12px;text-align:start;cursor:pointer;font-size:0.85rem;border-radius:6px;display:flex;align-items:center;gap:8px;">
                        📋 <span>${lang === 'ar' ? 'نسخ النص' : 'Copy Text'}</span>
                    </button>
                    <button id="ctx-edit" style="background:none;border:none;color:var(--accent-color);padding:8px 12px;text-align:start;cursor:pointer;font-size:0.85rem;border-radius:6px;display:flex;align-items:center;gap:8px;">
                        ✏️ <span>${lang === 'ar' ? 'تعديل الرسالة' : 'Edit Message'}</span>
                    </button>
                `;

                document.body.appendChild(menu);

                const closeMenu = () => { menu.remove(); document.removeEventListener('click', closeMenu); };
                setTimeout(() => document.addEventListener('click', closeMenu), 50);

                menu.querySelector('#ctx-copy').addEventListener('click', () => {
                    const cleanText = msg.content.split('\n\n📄 **File Attachment:')[0].split('\n\n🖼️ **Image Attachment:')[0];
                    navigator.clipboard.writeText(cleanText);
                    closeMenu();
                });

                menu.querySelector('#ctx-edit').addEventListener('click', async () => {
                    closeMenu();
                    const warningMsg = lang === 'ar'
                        ? '⚠️ تنبيه التراجع الرقمي:\nتعديل هذه الرسالة سيؤدي إلى حذف جميع الرسائل والردود اللاحقة بعد هذه النقطة وإعادة المحادثة من هذا السطر.\n\nهل ترغب بالمتابعة؟'
                        : '⚠️ Conversation Rewind Warning:\nEditing this message will delete all subsequent messages after this point.\n\nDo you wish to proceed?';

                    if (confirm(warningMsg)) {
                        const rawText = msg.content.split('\n\n📄 **File Attachment:')[0].split('\n\n🖼️ **Image Attachment:')[0];
                        const input = this.container.querySelector('#chat-input');
                        input.value = rawText;

                        this.messages.splice(idx);
                        await QuantState.saveChatHistory(this.messages);
                        this.refreshMessages();
                        input.focus();
                    }
                });
            });
        });
    }

    // ─── Voice Speech-To-Text (MediaRecorder + Smart Multimodal Transcription) ───
    async toggleVoiceInput() {
        const btn = this.container.querySelector('#chat-voice-btn');
        const input = this.container.querySelector('#chat-input');
        const isAr = window.i18n.currentLang === 'ar';

        if (this.isRecording) {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
            return;
        }

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert(isAr 
                    ? '⚠️ البيئة الحالية لا تدعم تسجيل الصوت المباشر.' 
                    : '⚠️ Microphone access is not supported in this environment.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            }).catch(err => {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    throw new Error(isAr 
                        ? 'لم يتم السماح للتطبيق باستخدام الميكروفون. يرجى تفعيل إذن الميكروفون في إعدادات خصوصية Windows.'
                        : 'Microphone permission was denied. Please allow microphone access in Windows Settings.');
                }
                throw new Error(err.message || 'Could not access microphone.');
            });

            this.audioChunks = [];
            let mimeType = 'audio/webm';
            if (typeof MediaRecorder.isTypeSupported === 'function') {
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
                else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            }

            const recorderOptions = {
                mimeType: mimeType,
                audioBitsPerSecond: 24000
            };
            this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    this.audioChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstart = () => {
                this.isRecording = true;
                if (btn) {
                    btn.style.background = 'rgba(239, 68, 68, 0.4)';
                    btn.style.borderColor = 'var(--status-disconnected)';
                    btn.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.6)';
                    btn.title = window.i18n.t('chat.voice_recording');
                    btn.innerHTML = '⏹️';
                }
            };

            this.mediaRecorder.onstop = async () => {
                this.isRecording = false;
                stream.getTracks().forEach(track => track.stop());

                if (btn) {
                    btn.style.background = 'rgba(140, 82, 255, 0.2)';
                    btn.style.borderColor = 'var(--border-color)';
                    btn.style.boxShadow = 'none';
                    btn.title = window.i18n.t('chat.voice_transcribing');
                    btn.innerHTML = '⏳';
                }

                if (this.audioChunks.length === 0) {
                    this.stopVoiceInputUI();
                    return;
                }

                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                try {
                    const effectiveConfig = this.apiConfig || await QuantState.getApiConfig();
                    if (!effectiveConfig || (!effectiveConfig.apiKey && !effectiveConfig.baseUrl?.includes('11434'))) {
                        alert(isAr 
                            ? '💡 يرجى إدخال مفتاح API في الإعدادات لتفعيل تحويل الصوت إلى نص الذكي.'
                            : 'Please configure an API key in Settings for voice transcription.');
                        this.stopVoiceInputUI();
                        return;
                    }

                    const provider = window.AIProviderFactory.getProvider(effectiveConfig);
                    if (typeof provider.transcribeAudio !== 'function') {
                        throw new Error('Current AI provider does not support audio transcription.');
                    }

                    const transcription = await provider.transcribeAudio(audioBlob);
                    if (transcription) {
                        if (input.value) {
                            input.value += ' ' + transcription;
                        } else {
                            input.value = transcription;
                        }
                        input.focus();
                    }
                } catch (err) {
                    console.error('Voice transcription failed:', err);
                    alert((isAr ? 'تعذر تفريغ الصوت: ' : 'Voice transcription failed: ') + err.message);
                } finally {
                    this.stopVoiceInputUI();
                }
            };

            this.mediaRecorder.start(250);
        } catch (err) {
            console.error('Failed to start microphone recording:', err);
            this.stopVoiceInputUI();
            alert(err.message || 'Microphone recording error.');
        }
    }

    stopVoiceInputUI() {
        this.isRecording = false;
        const btn = this.container.querySelector('#chat-voice-btn');
        if (btn) {
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.boxShadow = '';
            btn.style.animation = 'none';
            btn.title = window.i18n.t('chat.voice_title');
            btn.innerHTML = '🎤';
        }
    }

    // ─── Stop Model Execution ───
    stopModelExecution() {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        this.isExecuting = false;
        if (this.activeLiveBubble) this.stopLiveActivity(this.activeLiveBubble);
        this.hideQuantumThinkingIndicator();
        this.toggleStopButton(false);

        const isAr = window.i18n.currentLang === 'ar';
        this.messages.push({ role: 'assistant', content: isAr ? '⏹️ **تم إيقاف عمل النموذج بناءً على طلب المستخدم.**' : '⏹️ **Model execution stopped by user.**' });
        QuantState.saveChatHistory(this.messages);
        this.refreshMessages();
    }

    toggleStopButton(show) {
        const stopBtn = this.container.querySelector('#chat-stop-btn');
        if (stopBtn) {
            stopBtn.style.display = show ? 'flex' : 'none';
        }
    }

    // ─── Share Response Modal ───
    openShareModal(content) {
        const isAr = window.i18n.currentLang === 'ar';
        const cleanContent = content.replace(/```[\s\S]*?```/g, '').substring(0, 500);

        const overlay = document.createElement('div');
        overlay.className = 'share-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(5, 5, 10, 0.85); backdrop-filter: blur(12px);
            z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;
        `;

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = `
            max-width: 480px; width: 100%; background: var(--bg-surface);
            border: 1px solid var(--border-highlight); border-radius: 20px; padding: 24px;
        `;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0;">🔗 ${isAr ? 'مشاركة رد الذكاء الاصطناعي' : 'Share AI Response'}</h3>
                <button id="close-share-modal" style="background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">✕</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- WhatsApp Share -->
                <button id="share-whatsapp" class="btn-secondary" style="padding: 12px; display: flex; align-items: center; gap: 10px; border-color: #25D366; background: rgba(37,211,102,0.1); color: var(--text-primary); font-weight: 600;">
                    <span style="font-size: 20px;">🟢</span> <span>${isAr ? 'مشاركة عبر واتساب (WhatsApp)' : 'Share via WhatsApp'}</span>
                </button>

                <!-- Export as File (.md / .txt) -->
                <button id="share-export-file" class="btn-secondary" style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">📄</span> <span>${isAr ? 'تصدير وتحميل كملف نصي (.md)' : 'Export to File (.md)'}</span>
                </button>

                <!-- Export to Google Drive -->
                <button id="share-gdrive" class="btn-secondary" style="padding: 12px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">☁️</span> <span>${isAr ? 'تصدير وحفظ في Google Drive' : 'Save to Google Drive'}</span>
                </button>

                <!-- Copy Direct -->
                <button id="share-copy-direct" class="btn-primary" style="padding: 12px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span style="font-size: 18px;">📋</span> <span>${isAr ? 'نسخ النص كاملاً' : 'Copy Full Text'}</span>
                </button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        card.querySelector('#close-share-modal').addEventListener('click', close);

        // WhatsApp
        card.querySelector('#share-whatsapp').addEventListener('click', () => {
            const waText = encodeURIComponent(`*QUANT AI Response:*\n\n${content}`);
            window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
            close();
        });

        // Export File
        card.querySelector('#share-export-file').addEventListener('click', () => {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quant_response_${Date.now()}.md`;
            a.click();
            URL.revokeObjectURL(url);
            close();
        });

        // Google Drive Export Simulation
        card.querySelector('#share-gdrive').addEventListener('click', () => {
            alert(isAr 
                ? '☁️ جاري تصدير الملف وتجهيز رابط Google Drive...\nتم إنشاء حزمة المستند بنجاح.'
                : '☁️ Packaging document for Google Drive export...'
            );
            close();
        });

        // Copy Direct
        card.querySelector('#share-copy-direct').addEventListener('click', () => {
            navigator.clipboard.writeText(content);
            alert(isAr ? 'تم نسخ نص الرد بنجاح ✓' : 'Copied ✓');
            close();
        });
    }

    formatMarkdown(text) {
        if (!text) return '';
        let escaped = this.escapeHtml(text);
        escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto; border: 1px solid var(--border-color); margin: 8px 0;"><code>$2</code></pre>');
        escaped = escaped.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: var(--accent-color); font-family: monospace;">$1</code>');
        return escaped;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(str) {
        return String(str || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    destroy() {
        if (this.currentAbortController) this.currentAbortController.abort();
        this.stopLiveActivity();
    }
}
