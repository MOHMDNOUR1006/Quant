/**
 * PermissionCenterView — Zero Trust Gateway & Multi-Level Security Controller.
 */
class PermissionCenterView {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const currentLevel = QuantState.getPermissionLevel();
        const approvalLog = await QuantState.getApprovalLog();
        const alwaysUrls = QuantState.getAlwaysUrls();
        const alwaysPaths = QuantState.getAlwaysPaths();
        const alwaysFiles = QuantState.getAlwaysFiles();

        const isAr = window.i18n.currentLang === 'ar';

        this.container.innerHTML = `
            <div class="permissions-container" style="max-width: 850px; margin: 0 auto;">
                <h2 style="color: var(--primary-color); margin-bottom: 8px;">${isAr ? 'مركز نظام الصلاحيات والأمان' : 'Permission Gateway & Security Center'}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 32px;">${isAr ? 'إدارة مستويات الأمان الاستثنائية للنموذج وسجل الاستئذانات التفاعلية' : 'Manage system access levels, approval history, and persistent rules for the local agent.'}</p>

                <!-- Security Mode Selector -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-bottom: 16px;">${isAr ? 'مستوى أمان وصلاحيات النموذج' : 'Agent Security Level'}</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- Level 1: Strict / High Security -->
                        <label class="glass-card perm-option" style="display: flex; gap: 16px; align-items: flex-start; cursor: pointer; padding: 18px; ${currentLevel === 'strict' ? 'border-color: var(--status-connected); background: rgba(16,185,129,0.06);' : ''}">
                            <input type="radio" name="perm_level" value="strict" ${currentLevel === 'strict' ? 'checked' : ''} style="margin-top: 4px;">
                            <div>
                                <h4 style="margin: 0 0 6px 0; color: var(--status-connected); display: flex; align-items: center; gap: 8px;">
                                    <span>🛡️ ${isAr ? 'الحالة الآمنة جداً (Strict Safe Mode)' : 'Strict Safe Mode'}</span>
                                    <span style="font-size: 0.7rem; background: rgba(16,185,129,0.2); padding: 2px 8px; border-radius: 10px;">${isAr ? 'مستحسن لبيئات الإنتاج' : 'Recommended'}</span>
                                </h4>
                                <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
                                    ${isAr 
                                        ? 'يمنع نهائياً الخروج خارج مسار العمل، يمنع الاتصال بالمواقع الخارجية أو رفع الصور والملفات، ويمنع حذف الملفات تماماً. يُسمح فقط بإنشاء وتعديل ونسخ الملفات داخل المسار وأوامر بسيطة.'
                                        : 'Agent is strictly bound to workspace. External URL connections, uploads, and file deletions are strictly forbidden. File creation, modification, and copying allowed.'
                                    }
                                </p>
                            </div>
                        </label>
                        
                        <!-- Level 2: Medium -->
                        <label class="glass-card perm-option" style="display: flex; gap: 16px; align-items: flex-start; cursor: pointer; padding: 18px; ${currentLevel === 'medium' ? 'border-color: var(--primary-color); background: rgba(140,82,255,0.06);' : ''}">
                            <input type="radio" name="perm_level" value="medium" ${currentLevel === 'medium' ? 'checked' : ''} style="margin-top: 4px;">
                            <div>
                                <h4 style="margin: 0 0 6px 0; color: var(--primary-color);">⚖️ ${isAr ? 'الحالة المتوسطة (Medium Mode)' : 'Medium Security Mode'}</h4>
                                <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
                                    ${isAr 
                                        ? 'يُستأذن المستخدم عند الخروج خارج المسار (بطاقة استئذان: نعم / لا / نعم دائماً للمسار / نعم دائماً للملف). يُستأذن عند حذف الملفات وتنفيذ الأوامر (مثل make). يمنع نهائياً فتح الروابط الخارجية أو رفع الصور والملفات.'
                                        : 'Requests permission when exiting workspace or deleting files. External URLs & uploads forbidden. Execution of commands like `make` requires permission.'
                                    }
                                </p>
                            </div>
                        </label>

                        <!-- Level 3: Freedom / Unsecured -->
                        <label class="glass-card perm-option" style="display: flex; gap: 16px; align-items: flex-start; cursor: pointer; padding: 18px; ${currentLevel === 'freedom' ? 'border-color: var(--secondary-color); background: rgba(255,56,126,0.06);' : ''}">
                            <input type="radio" name="perm_level" value="freedom" ${currentLevel === 'freedom' ? 'checked' : ''} style="margin-top: 4px;">
                            <div>
                                <h4 style="margin: 0 0 6px 0; color: var(--secondary-color);">🔥 ${isAr ? 'المستوى الثالث: انعدام الأمان والحرية المطلقة (Freedom Mode)' : 'Level 3: Freedom / Unrestricted Mode'}</h4>
                                <p style="margin: 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
                                    ${isAr 
                                        ? 'حرية كاملة للذهاب لأي مسار في الجهاز وفعل ما يشاء، عدا رفع الملفات/الصور للخارج أو فتح مواقع معينة فتظهر بطاقة استئذان بـ 3 خيارات (نعم / لا / نعم دائماً لهذا الموقع). ينفذ أي أمر بالترمينال عدا الخطيرة جداً فيُستأذن منها.'
                                        : 'Full access to any local path and command execution. External URL calls & uploads present 3-option consent cards (Yes, No, Always Yes for this site). Suspicious terminal commands prompt user.'
                                    }
                                </p>
                            </div>
                        </label>
                    </div>

                    <div id="perm-save-result" style="display: none; margin-top: 16px; padding: 10px; border-radius: 8px; font-size: 0.85rem;"></div>
                </div>

                <!-- Persistent Approvals (Always Yes Saved Rules) -->
                <div class="glass-card" style="margin-bottom: 24px;">
                    <h3 style="margin-bottom: 16px;">📌 ${isAr ? 'القواعد والمواقع المحفوظة (نعم دائماً)' : 'Saved "Always Yes" Rules'}</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        
                        <div>
                            <strong style="font-size: 0.85rem; color: var(--accent-color);">🌐 ${isAr ? 'المواقع المصرح بها دائماً (Always Allowed URLs):' : 'Saved URLs:'}</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                ${alwaysUrls.length === 0 
                                    ? `<span style="font-size: 0.8rem; color: var(--text-muted);">${isAr ? 'لا توجد مواقع محفوظة حالياً' : 'No saved URLs.'}</span>`
                                    : alwaysUrls.map(u => `
                                        <div style="background: rgba(0,229,255,0.1); border: 1px solid var(--accent-color); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                                            <span>${this.escapeHtml(u)}</span>
                                            <button class="remove-rule-btn" data-type="url" data-val="${this.escapeHtml(u)}" style="background:none; border:none; color: var(--text-muted); cursor:pointer;">✕</button>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>

                        <div style="margin-top: 8px;">
                            <strong style="font-size: 0.85rem; color: var(--primary-color);">📁 ${isAr ? 'المسارات المصرح بها دائماً (Saved Paths):' : 'Saved Paths:'}</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                ${alwaysPaths.length === 0 
                                    ? `<span style="font-size: 0.8rem; color: var(--text-muted);">${isAr ? 'لا توجد مسارات محفوظة حالياً' : 'No saved paths.'}</span>`
                                    : alwaysPaths.map(p => `
                                        <div style="background: rgba(140,82,255,0.1); border: 1px solid var(--primary-color); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                                            <span>${this.escapeHtml(p)}</span>
                                            <button class="remove-rule-btn" data-type="path" data-val="${this.escapeHtml(p)}" style="background:none; border:none; color: var(--text-muted); cursor:pointer;">✕</button>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>

                        <div style="margin-top: 8px;">
                            <strong style="font-size: 0.85rem; color: var(--secondary-color);">📄 ${isAr ? 'الملفات المصرح بها دائماً (Saved Files):' : 'Saved Files:'}</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                ${alwaysFiles.length === 0 
                                    ? `<span style="font-size: 0.8rem; color: var(--text-muted);">${isAr ? 'لا توجد ملفات محفوظة حالياً' : 'No saved files.'}</span>`
                                    : alwaysFiles.map(f => `
                                        <div style="background: rgba(255,56,126,0.1); border: 1px solid var(--secondary-color); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
                                            <span>${this.escapeHtml(f)}</span>
                                            <button class="remove-rule-btn" data-type="file" data-val="${this.escapeHtml(f)}" style="background:none; border:none; color: var(--text-muted); cursor:pointer;">✕</button>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Gateway Approval Log -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 16px;">📜 ${isAr ? 'سجل طلبات واستئذانات البوابة' : 'Gateway Approval History'}</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${approvalLog.length === 0 
                            ? `<div style="text-align: center; padding: 32px; color: var(--text-muted);">
                                    <p style="margin: 0;">${isAr ? 'لا يوجد سجل استئذانات بعد.' : 'No approval history yet.'}</p>
                               </div>`
                            : approvalLog.map(entry => `
                                <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid var(--border-color); align-items: center;">
                                    <span style="font-family: monospace; color: var(--accent-color); font-size: 0.85rem;">${this.escapeHtml(entry.command)}</span>
                                    <span style="color: ${entry.approved ? 'var(--status-connected)' : 'var(--status-disconnected)'}; font-size: 0.85rem; font-weight: 600;">${entry.approved ? (isAr ? 'تمت الموافقة ✓' : 'Approved ✓') : (isAr ? 'مرفوض ✕' : 'Denied ✕')} (${this.timeAgo(entry.timestamp)})</span>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;

        // Bind radios
        this.container.querySelectorAll('input[name="perm_level"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const level = e.target.value;
                QuantState.savePermissionLevel(level);
                const result = this.container.querySelector('#perm-save-result');
                result.style.display = 'block';
                result.style.background = 'rgba(16,185,129,0.15)';
                result.style.color = 'var(--status-connected)';
                result.textContent = isAr 
                    ? `تم تغيير مستوى الأمان والصلاحيات إلى: ${level === 'freedom' ? 'انعدام الأمان والحرية المطلقة' : level === 'medium' ? 'الحالة المتوسطة' : 'الحالة الآمنة جداً'}`
                    : `Permission level updated to: ${level.toUpperCase()}`;

                setTimeout(() => this.render(), 800);
            });
        });

        // Bind rule removers
        this.container.querySelectorAll('.remove-rule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const val = e.currentTarget.dataset.val;
                if (type === 'url') QuantState.removeAlwaysUrl(val);
                if (type === 'path') QuantState.removeAlwaysPath(val);
                if (type === 'file') QuantState.removeAlwaysFile(val);
                this.render();
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    timeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }

    destroy() {}
}

