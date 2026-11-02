/**
 * ProfileView — Shows only real verified user data (Async).
 */
class ProfileView {
    constructor(container) { this.container = container; }

    async render() {
        const profile = await QuantState.getProfile();
        const identity = await QuantState.getIdentity();
        const session = await QuantState._loadSecure('quant_secure_session');
        const chat = await QuantState.getChatHistory();
        const uMsgs = chat.filter(m => m.role === 'user').length;
        const aMsgs = chat.filter(m => m.role === 'assistant').length;
        const apiConfig = await QuantState.getApiConfig();

        if (!profile || !identity) {
            this.container.innerHTML = `<div class="glass-card" style="max-width:600px;margin:0 auto;text-align:center;padding:64px;"><h3 style="color:var(--text-secondary)">${window.i18n.t('profile.not_found')}</h3><p style="color:var(--text-muted)">${window.i18n.t('profile.not_found_desc')}</p><button class="btn-primary" onclick="window.location.hash='onboarding'" style="margin-top:16px">${window.i18n.t('profile.start_onboarding')}</button></div>`;
            return;
        }

        const name = profile.name || identity.displayName;
        const plan = (identity.plan || 'free').toLowerCase();
        const esc = (t) => { if(!t) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; };

        // Avatar with Tier Border
        const avatarHtml = window.MNEcosystemAuth 
            ? window.MNEcosystemAuth.renderAvatarHTML({
                photoURL: identity.avatarUrl || '',
                displayName: name,
                plan: plan,
                size: 110
            })
            : `<div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));display:flex;justify-content:center;align-items:center;font-size:48px;font-family:var(--font-heading);font-weight:700;">${name.charAt(0).toUpperCase()}</div>`;

        const planBadgeColors = {
            plus: 'background: rgba(37,99,235,0.2); color: #60a5fa; border: 1px solid rgba(37,99,235,0.4);',
            pro: 'background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.4);',
            ultra: 'background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4);',
            free: 'background: rgba(100,116,139,0.2); color: #94a3b8; border: 1px solid rgba(100,116,139,0.4);'
        };

        this.container.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
            <div class="glass-card" style="display:flex;gap:32px;align-items:center;margin-bottom:32px;text-align:start;">
                <div style="flex-shrink:0;">
                    ${avatarHtml}
                </div>
                <div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
                        <h2 style="margin:0;font-size:2rem;">${esc(name)}</h2>
                        <span style="font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:12px; ${planBadgeColors[plan] || planBadgeColors.free}">
                            خطة ${plan.toUpperCase()}
                        </span>
                    </div>
                    <p style="color:var(--text-muted);margin-bottom:4px;font-size:0.9rem;">${esc(session ? session.email : '')}</p>
                    <p style="color:var(--primary-color);margin-bottom:16px;font-weight:500;">${window.i18n.t('profile.verified_session')}</p>
                    <div style="display:flex;gap:16px;">
                        <button id="edit-profile-btn" class="btn-primary" style="padding:8px 16px;font-size:0.9rem;">${window.i18n.t('profile.edit_btn')}</button>
                        <button id="logout-btn" class="btn-secondary" style="padding:8px 16px;font-size:0.9rem;color:var(--status-disconnected);border-color:var(--status-disconnected);">${window.i18n.t('profile.logout_btn')}</button>
                    </div>
                </div>
            </div>

            <div id="edit-panel" class="glass-card" style="display:none;margin-bottom:24px;text-align:start;">
                <h3 style="margin-bottom:16px;">${window.i18n.t('profile.edit_title')}</h3>
                <div class="input-group"><label>${window.i18n.t('profile.edit_name')}</label><input type="text" id="edit-name" class="input-control" value="${profile.name ? profile.name.replace(/"/g,'&quot;') : ''}"></div>
                <div style="display:flex;gap:16px;">
                    <div class="input-group" style="flex:1;"><label>${window.i18n.t('profile.edit_age')}</label><input type="number" id="edit-age" class="input-control" value="${profile.age}" min="13" max="150" readonly style="opacity: 0.6;"></div>
                    <div class="input-group" style="flex:2;"><label>${window.i18n.t('profile.edit_dob')}</label><input type="date" id="edit-dob" class="input-control" value="${profile.dob}" readonly style="opacity: 0.6;"></div>
                </div>
                <div class="input-group"><label>${window.i18n.t('profile.edit_os')}</label>
                    <select id="edit-os" class="input-control">
                        <option value="Windows" ${profile.os==='Windows'?'selected':''}>Windows</option>
                        <option value="Linux" ${profile.os==='Linux'?'selected':''}>Linux</option>
                        <option value="macOS" ${profile.os==='macOS'?'selected':''}>macOS</option>
                        <option value="Other" ${profile.os==='Other'?'selected':''}>Other</option>
                    </select>
                </div>
                <div style="display:flex;gap:12px;"><button id="save-profile-btn" class="btn-primary">${window.i18n.t('profile.save')}</button><button id="cancel-edit-btn" class="btn-secondary">${window.i18n.t('profile.cancel')}</button></div>
                <div id="edit-result" style="display:none;margin-top:12px;padding:10px;border-radius:8px;font-size:0.85rem;"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;text-align:start;">
                <div class="glass-card">
                    <h3 style="margin-bottom:16px;">${window.i18n.t('profile.stats_title')}</h3>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);font-size:0.9rem;">${window.i18n.t('profile.stats_sent')}</span><span style="color:var(--accent-color);font-weight:600;">${uMsgs}</span></div><div style="width:100%;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;"><div style="width:${uMsgs>0?Math.min(uMsgs,100):0}%;height:100%;background:var(--accent-color);transition:width 0.5s;"></div></div></div>
                        <div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:var(--text-secondary);font-size:0.9rem;">${window.i18n.t('profile.stats_received')}</span><span style="color:var(--primary-color);font-weight:600;">${aMsgs}</span></div><div style="width:100%;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;"><div style="width:${aMsgs>0?Math.min(aMsgs,100):0}%;height:100%;background:var(--primary-color);transition:width 0.5s;"></div></div></div>
                    </div>
                </div>
                <div class="glass-card">
                    <h3 style="margin-bottom:16px;">${window.i18n.t('profile.details_title')}</h3>
                    <div style="display:flex;flex-direction:column;gap:12px;font-size:0.9rem;">
                        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;"><span style="color:var(--text-secondary)">${window.i18n.t('profile.details_source')}</span><span>${esc(session ? 'Google / Firebase Auth' : 'Unknown')}</span></div>
                        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;"><span style="color:var(--text-secondary)">${window.i18n.t('profile.details_os')}</span><span>${esc(profile.os)}</span></div>
                        <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:8px;"><span style="color:var(--text-secondary)">${window.i18n.t('profile.details_age')}</span><span>${profile.age}</span></div>
                        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">${window.i18n.t('profile.details_api')}</span><span style="color:${apiConfig?'var(--status-connected)':'var(--status-disconnected)'}">${apiConfig?window.i18n.t('profile.api_set'):window.i18n.t('profile.api_unset')}</span></div>
                    </div>
                </div>
            </div>
        </div>`;

        this.container.querySelector('#edit-profile-btn').addEventListener('click',()=>{const p=this.container.querySelector('#edit-panel');p.style.display=p.style.display==='none'?'block':'none';});
        this.container.querySelector('#cancel-edit-btn').addEventListener('click',()=>{this.container.querySelector('#edit-panel').style.display='none';});
        this.container.querySelector('#save-profile-btn').addEventListener('click', async ()=>{
            const n=this.container.querySelector('#edit-name').value.trim();
            if(!n) return;
            await QuantState.saveProfile({...profile, name:n, os:this.container.querySelector('#edit-os').value});
            this.render();
        });
        this.container.querySelector('#logout-btn').addEventListener('click', async ()=>{if(confirm(window.i18n.t('profile.signout_confirm'))) await QuantState.logout();});
    }
    destroy() {}
}
