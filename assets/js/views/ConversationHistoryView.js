/**
 * ConversationHistoryView — Displays real conversation logs and activity history.
 */
class ConversationHistoryView {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const history = await QuantState.getChatHistory();
        const lang = window.i18n.currentLang;
        const isAr = lang === 'ar';

        this.container.innerHTML = `
            <div class="history-container" style="max-width: 1000px; margin: 0 auto; padding-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="color: var(--primary-color); margin: 0 0 6px 0;">${isAr ? 'سجل العمليات والمحادثات' : 'Activity & Chat History'}</h2>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${isAr ? 'استعراض كافة الأسئلة والردود السابقة المخزنة محلياً' : 'Browse all previously stored questions and responses'}</span>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="window.location.hash='chat'" style="padding: 8px 18px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                            <span>💬</span> <span>${isAr ? 'فتح مساحة الدردشة' : 'Open Workspace Chat'}</span>
                        </button>
                        ${history.length > 0 ? `<button id="clear-history-btn" class="btn-secondary" style="color: var(--status-disconnected); border-color: var(--status-disconnected); padding: 8px 14px; font-size: 0.85rem;">${isAr ? 'مسح السجل' : 'Clear All'}</button>` : ''}
                    </div>
                </div>

                <div class="history-list" style="display: flex; flex-direction: column; gap: 16px;">
                    ${history.length === 0 ? this.renderEmptyState(isAr) : this.renderHistory(history, isAr)}
                </div>
            </div>
        `;

        // Bind clear
        const clearBtn = this.container.querySelector('#clear-history-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                const confirmMsg = isAr ? 'هل أنت متأكد من حذف سجل المحادثة والعمليات بالكامل؟' : 'Are you sure you want to permanently delete all chat history?';
                if (confirm(confirmMsg)) {
                    await QuantState.clearChatHistory();
                    this.render();
                }
            });
        }
    }

    renderEmptyState(isAr) {
        return `
            <div class="glass-card" style="text-align: center; padding: 64px 32px; border-radius: 16px;">
                <div style="font-size: 40px; margin-bottom: 16px;">📜</div>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">${isAr ? 'لا يوجد سجل نشاط حتى الآن' : 'No activity yet'}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">${isAr ? 'سوف تظهر رسائلك وعملياتك السابقة هنا بمجرد التحدث مع الذكاء الاصطناعي.' : 'Your conversation history will appear here after you start chatting.'}</p>
                <button class="btn-primary" onclick="window.location.hash='chat'" style="padding: 12px 28px; border-radius: 10px; font-weight: 600;">${isAr ? 'بدء محادثة الآن 🚀' : 'Start a Conversation 🚀'}</button>
            </div>
        `;
    }

    renderHistory(messages, isAr) {
        const userMessages = messages.filter(m => m.role === 'user');
        const aiMessages = messages.filter(m => m.role === 'assistant');

        // Render summary card + recent message items
        let itemsHtml = '';
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const isUser = msg.role === 'user';
            const rawContent = (msg.content || '').replace(/\[Attached Image Data: [^\]]+\]/g, '[صورة]').slice(0, 180);
            const preview = this.escapeHtml(rawContent) + (msg.content && msg.content.length > 180 ? '...' : '');

            itemsHtml += `
                <div class="glass-card" style="padding: 14px 18px; border-radius: 12px; border-left: 4px solid ${isUser ? 'var(--primary-color)' : 'var(--accent-color)'}; display: flex; flex-direction: column; gap: 6px; cursor: pointer;" onclick="window.location.hash='chat'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: ${isUser ? 'var(--primary-color)' : 'var(--accent-color)'};">
                            ${isUser ? (isAr ? '👤 رسالتك' : '👤 You') : (isAr ? '🤖 QUANT AI' : '🤖 QUANT AI')}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">#${i + 1}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-primary); line-height: 1.5; white-space: pre-wrap;">${preview || (isAr ? '(لا يوجد محتوى نصي)' : '(Empty content)')}</div>
                </div>
            `;
        }

        return `
            <!-- Overview Summary Card -->
            <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-radius: 14px; border-color: var(--border-highlight); margin-bottom: 8px;">
                <div>
                    <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: var(--text-primary);">${isAr ? 'الجلسة الحالية' : 'Current Session'}</h3>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${userMessages.length} ${isAr ? 'رسالة مرسلة' : 'messages sent'} • ${aiMessages.length} ${isAr ? 'رد مستلم' : 'responses received'}</span>
                </div>
                <button class="btn-primary" onclick="window.location.hash='chat'" style="padding: 8px 18px; font-size: 0.88rem; border-radius: 8px;">
                    ${isAr ? 'متابعة المحادثة 💬' : 'View in Chat 💬'}
                </button>
            </div>

            <!-- List of conversation messages -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${itemsHtml}
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
