/**
 * SubscriptionView — Quant AI Agent Request Specs & Central MN Subscriptions Integration
 */
class SubscriptionView {
    constructor(container) {
        this.container = container;
    }

    async render() {
        let activePlan = 'free';
        let subData = null;
        try {
            subData = await QuantState.fetchLiveSubscription();
            if (subData && subData.plan) {
                activePlan = subData.plan.toLowerCase();
            }
        } catch (e) {}

        const getActiveBadge = (planKey) => {
            if (activePlan === planKey) {
                return `
                    <div style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;">
                        ✓ الخطة المفعّلة حالياً
                    </div>
                `;
            }
            return '';
        };

        this.container.innerHTML = `
            <div style="max-width: 1050px; margin: 0 auto; padding: 24px; direction: rtl; text-align: right;">
                <header style="margin-bottom: 32px; text-align: center;">
                    <h2 style="font-family: var(--font-heading); font-size: 2.5rem; margin-bottom: 12px; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">خطط واشتراكات QUANT AI المنظومة</h2>
                    <p style="color: var(--text-secondary); font-size: 1.05rem; max-width: 680px; margin: 0 auto; line-height: 1.6;">
                        يتم ربط واكتشاف اشتراكك تلقائياً عبر حساب المعرف الموحد بالمركز. تظهر خطتك المفعّلة مباشرة بإطار الحساب الدائري.
                    </p>
                </header>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 40px;">
                    
                    <!-- Free Tier -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: ${activePlan === 'free' ? '#10b981' : 'rgba(255,255,255,0.08)'}; background: rgba(18,15,23,0.8);">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="font-size: 1.3rem; font-weight: 700; color: #94a3b8;">المجاني (Free)</h3>
                            </div>
                            ${getActiveBadge('free')}
                            <div style="font-size: 2.2rem; font-weight: 800; margin: 16px 0; color: white;">0$</div>
                            <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; color: #cbd5e1; font-size: 0.9rem; line-height: 1.8;">
                                <li style="margin-bottom: 8px;">✓ دردشة وسجل محادثات عادية</li>
                                <li style="margin-bottom: 8px; color: #f87171;">✗ 0 طلب لوكيل الذكاء (معطل بالخطة المجانية)</li>
                                <li style="margin-bottom: 8px; color: #f87171;">✗ الجلسات المشتركة والأصدقاء (معطلة)</li>
                                <li style="margin-bottom: 8px; color: #94a3b8;">✗ لا يشمل تحكم سطر الأوامر والملفات</li>
                            </ul>
                        </div>
                        <button class="btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed; width: 100%;">الخطة الافتراضية</button>
                    </div>

                    <!-- Plus Tier -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: ${activePlan === 'plus' ? '#10b981' : 'rgba(59,130,246,0.4)'}; background: rgba(18,15,23,0.9);">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="font-size: 1.3rem; font-weight: 700; color: #60a5fa;">خطة بلس (Plus)</h3>
                            </div>
                            ${getActiveBadge('plus')}
                            <div style="font-size: 2.2rem; font-weight: 800; margin: 16px 0; color: white;">9$<span style="font-size: 0.9rem; color: #94a3b8;">/شهرياً</span></div>
                            <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; color: #e2e8f0; font-size: 0.9rem; line-height: 1.8;">
                                <li style="margin-bottom: 8px; font-weight: 700; color: #60a5fa;">✓ 500 طلب لوكيل الذكاء الاصطناعي</li>
                                <li style="margin-bottom: 8px; font-weight: 700; color: #60a5fa;">✓ ميزة الجلسات المشتركة والأصدقاء</li>
                                <li style="margin-bottom: 8px;">✓ تحليل الملفات حتى 5MB</li>
                                <li style="margin-bottom: 8px; color: #60a5fa;">✓ إطار أزرق متوهج للملف الشخصي</li>
                            </ul>
                        </div>
                        <a href="https://mn-subscriptions.vercel.app/#pricing-section" target="_blank" class="btn-primary" style="text-align: center; text-decoration: none; width: 100%;">
                            ${activePlan === 'plus' ? 'إدارة الاشتراك في المركز' : 'ترقية إلى Plus'}
                        </a>
                    </div>

                    <!-- Pro Tier -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: ${activePlan === 'pro' ? '#10b981' : 'rgba(168,85,247,0.6)'}; background: rgba(18,15,23,0.95); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 12px; left: -30px; background: #a855f7; color: white; padding: 2px 35px; transform: rotate(-45deg); font-size: 0.75rem; font-weight: 800;">PRO</div>
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="font-size: 1.3rem; font-weight: 700; color: #c084fc;">خطة برو (Pro)</h3>
                            </div>
                            ${getActiveBadge('pro')}
                            <div style="font-size: 2.2rem; font-weight: 800; margin: 16px 0; color: white;">19$<span style="font-size: 0.9rem; color: #94a3b8;">/شهرياً</span></div>
                            <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; color: #e2e8f0; font-size: 0.9rem; line-height: 1.8;">
                                <li style="margin-bottom: 8px; font-weight: 700; color: #c084fc;">✓ 2,500 طلب لوكيل الذكاء الاصطناعي</li>
                                <li style="margin-bottom: 8px; font-weight: 700; color: #c084fc;">✓ الجلسات المشتركة والأصدقاء</li>
                                <li style="margin-bottom: 8px;">✓ تحليل الملفات حتى 20MB</li>
                                <li style="margin-bottom: 8px; color: #f59e0b;">✓ إطار متدرج (أزرق - أصفر - أحمر)</li>
                            </ul>
                        </div>
                        <a href="https://mn-subscriptions.vercel.app/#pricing-section" target="_blank" class="btn-primary" style="text-align: center; text-decoration: none; width: 100%; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); border: none;">
                            ${activePlan === 'pro' ? 'إدارة الاشتراك في المركز' : 'ترقية إلى Pro'}
                        </a>
                    </div>

                    <!-- Ultra Tier -->
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; border-color: ${activePlan === 'ultra' ? '#10b981' : 'rgba(245,158,11,0.6)'}; background: rgba(18,15,23,0.95);">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="font-size: 1.3rem; font-weight: 700; color: #fbbf24;">خطة ألترا (Ultra)</h3>
                            </div>
                            ${getActiveBadge('ultra')}
                            <div style="font-size: 2.2rem; font-weight: 800; margin: 16px 0; color: white;">39$<span style="font-size: 0.9rem; color: #94a3b8;">/شهرياً</span></div>
                            <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; color: #e2e8f0; font-size: 0.9rem; line-height: 1.8;">
                                <li style="margin-bottom: 8px; font-weight: 800; color: #fbbf24;">✓ 50,000 طلب لوكيل الذكاء (20 ضعف Pro!)</li>
                                <li style="margin-bottom: 8px; font-weight: 800; color: #fbbf24;">✓ الجلسات المشتركة والأصدقاء</li>
                                <li style="margin-bottom: 8px;">✓ تحليل الملفات حتى 50MB</li>
                                <li style="margin-bottom: 8px; color: #10b981;">✓ إطار طيفي نبضي (أزرق - أصفر - أحمر - أخضر)</li>
                            </ul>
                        </div>
                        <a href="https://mn-subscriptions.vercel.app/#pricing-section" target="_blank" class="btn-primary" style="text-align: center; text-decoration: none; width: 100%; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border: none;">
                            ${activePlan === 'ultra' ? 'إدارة الاشتراك في المركز' : 'ترقية إلى Ultra'}
                        </a>
                    </div>

                </div>

                <div class="glass-card" style="background: rgba(0,0,0,0.4); border-color: rgba(168,85,247,0.3); text-align: center; padding: 24px;">
                    <h4 style="margin-bottom: 8px; color: white;">المركز الموحد لإدارة الفوترة والاشتراكات (MN Subscriptions Hub)</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px; max-width: 700px; margin-left: auto; margin-right: auto;">
                        تتم المعاملات وإدارة الخطط بأمان مشفر عبر حساب Google في المركز الموحد، وتنعكس خطتك تلقائياً هنا وبكافة ألعابك ومنتجاتك بـ Firebase.
                    </p>
                    <button id="sync-sub-btn" class="btn-secondary" style="font-size: 0.85rem; padding: 6px 18px;">
                        🔄 إعادة مزامنة الخطة الآن من المركز
                    </button>
                </div>

            </div>
        `;

        const syncBtn = this.container.querySelector('#sync-sub-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                syncBtn.textContent = 'جاري التحديث والتأكد...';
                try {
                    await QuantState.fetchLiveSubscription(true);
                    window.appRouter.handleRoute();
                } catch (e) {
                    syncBtn.textContent = 'فشل الاتصال بـ Firestore';
                }
            });
        }
    }

    destroy() {}
}

