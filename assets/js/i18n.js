/**
 * QUANT AI — Internationalization & Translation Engine
 * 
 * Languages supported:
 * - English (en)
 * - Arabic (ar)
 * - Japanese - Hiragana only (ja)
 */

const QuantTranslations = {
    ar: {
        // Navigation & General UI
        "nav.home": "الرئيسية",
        "nav.chat": "مساحة المحادثة",
        "nav.history": "سجل العمليات",
        "nav.agent": "إعداد العميل",
        "nav.workspace": "مساحة المجلدات",
        "nav.permissions": "مركز الصلاحيات",
        "nav.downloads": "مركز التحميلات",
        "nav.profile": "الملف الشخصي",
        "nav.subscription": "الاشتراكات",
        "nav.settings": "الإعدادات",
        "nav.info": "المعلومات",
        "status.connected": "العميل متصل",
        "status.disconnected": "العميل غير متصل",
        "status.busy": "العميل مشغول",
        "status.executing": "جاري التنفيذ...",
        "status.waiting": "قيد الانتظار...",
        "status.unknown": "غير معروف",

        // Login
        "login.title": "دخول مساحة العمل",
        "login.subtitle": "سجل دخولك عبر أحد مزودي الهوية المعتمدين.",
        "login.policy_text": "نظام الحماية Zero-Trust مفعل.<br>كل الجلسات تتطلب التحقق الرقمي.",

        // Onboarding
        "onboarding.progress": "الخطوة {step} من {total}",
        "onboarding.step1_title": "إعداد الهوية الشخصية",
        "onboarding.step1_subtitle": "أكمل بياناتك الشخصية لتفعيل مساحة العمل الخاصة بك.",
        "onboarding.name_label": "الاسم التعريفي (مطلوب)",
        "onboarding.name_placeholder": "كيف تود أن يناديك QUANT؟",
        "onboarding.dob_label": "تاريخ الميلاد (مطلوب)",
        "onboarding.dob_tip": "يجب أن تكون بعمر 13 عاماً أو أكثر لاستخدام هذه الخدمة.",
        "onboarding.btn_verify": "التحقق من الهوية",
        "onboarding.step2_title": "بيئة نظام التشغيل",
        "onboarding.step2_subtitle": "قمنا بتحديد نظام تشغيل جهازك. يرجى التأكيد أو التعديل.",
        "onboarding.os_label": "نظام التشغيل المكتشف",
        "onboarding.os_select": "اختر نظام التشغيل",
        "onboarding.btn_back": "رجوع",
        "onboarding.btn_continue": "متابعة",
        "onboarding.step3_title": "إعدادات واجهة برمجة التطبيقات (API)",
        "onboarding.step3_subtitle": "قم بربط نموذج الذكاء الاصطناعي الخاص بك. يمكنك تعديل هذا لاحقاً من الإعدادات.",
        "onboarding.api_url": "عنوان رابط الـ API",
        "onboarding.api_key": "مفتاح الـ API",
        "onboarding.api_model": "اسم النموذج (Model)",
        "onboarding.btn_skip": "تخطي الآن",
        "onboarding.btn_finish": "إنهاء الإعداد",
        "onboarding.loader_text": "جاري بناء مساحة عملك الآمنة...",

        // Welcome
        "welcome.title": "مرحباً بك من جديد، ",
        "welcome.subtitle": "مساحة عمل الذكاء الاصطناعي المحلية والآمنة الخاصة بك جاهزة الآن.",
        "welcome.open_workspace": "فتح مساحة العمل",
        "welcome.download_agent": "تحميل العميل المحلي",
        "welcome.step1_title": "1. تثبيت العميل",
        "welcome.step1_desc": "قم بتحميل وتشغيل عميل QUANT المحلي على جهازك الشخصي.",
        "welcome.step2_title": "2. إعداد المجلدات",
        "welcome.step2_desc": "حدد مجلدات العمل الخاصة بك وصلاحيات التشغيل والأمان.",
        "welcome.step3_title": "3. بدء الاستخدام",
        "welcome.step3_desc": "تفاعل مع ملفاتك المحلية وقم بتشغيل الأوامر عبر هذه الواجهة الفريدة.",
        "welcome.api_configured": "الـ API مهيأ",
        "welcome.api_not_configured": "الـ API غير مهيأ — قم بالإعداد الآن",
        "welcome.agent_connected": "العميل متصل",
        "welcome.agent_not_connected": "العميل غير متصل — قم بإعداده الآن",

        // Profile
        "profile.title": "الملف الشخصي",
        "profile.not_found": "الملف الشخصي غير موجود",
        "profile.not_found_desc": "يرجى إكمال خطوات الإعداد أولاً.",
        "profile.start_onboarding": "ابدأ الإعداد",
        "profile.verified_session": "جلسة عمل مؤمنة ومحققة رقمياً",
        "profile.edit_btn": "تعديل الملف",
        "profile.logout_btn": "تسجيل الخروج",
        "profile.edit_title": "تعديل الملف الشخصي",
        "profile.edit_name": "الاسم التعريفي",
        "profile.edit_age": "السن",
        "profile.edit_dob": "تاريخ الميلاد",
        "profile.edit_os": "نظام التشغيل",
        "profile.save": "حفظ التغييرات",
        "profile.cancel": "إلغاء",
        "profile.stats_title": "إحصائيات الاستخدام",
        "profile.stats_sent": "الرسائل المرسلة",
        "profile.stats_received": "ردود الذكاء الاصطناعي",
        "profile.details_title": "تفاصيل الحساب",
        "profile.details_source": "مصدر التحقق",
        "profile.details_os": "نظام التشغيل",
        "profile.details_age": "السن",
        "profile.details_api": "حالة الـ API",
        "profile.api_set": "مهيأ",
        "profile.api_unset": "غير مهيأ",
        "profile.signout_confirm": "هل أنت متأكد من تسجيل الخروج؟ سيتم مسح بيانات الجلسة المحلية بالكامل نهائياً.",

        // Settings
        "settings.title": "إعدادات النظام",
        "settings.theme_label": "مظهر الواجهة",
        "settings.theme_dark": "الوضع الداكن الفاخر",
        "settings.theme_light": "الوضع المضيء الكلاسيكي",
        "settings.theme_neon": "وضع النيون الإلكتروني",
        "settings.particles_label": "جزيئات الخلفية المتحركة",
        "settings.particles_on": "تفعيل الحركة",
        "settings.particles_off": "تعطيل الحركة",
        "settings.lang_label": "لغة النظام",
        "settings.save": "حفظ الإعدادات",
        "settings.saved_msg": "تم حفظ الإعدادات بنجاح!",
        "settings.api_provider": "اختر مزود الذكاء الاصطناعي",
        "settings.gemini_model": "اختر نموذج Google Gemini",
        "settings.gemini_official": "النماذج الرسمية المدعومة والسريعة",
        "settings.custom_model": "تخصيص يدوي لاسم النموذج",
        "settings.clear": "تفريغ",
        "settings.data_management": "إدارة البيانات والذاكرة",
        "settings.clear_cache": "مسح التخزين المؤقت",
        "settings.clear_cache_desc": "إزالة الردود المخزنة مؤقتاً والملفات المؤقتة.",
        "settings.delete_history": "حذف سجل المحادثات",
        "settings.delete_history_desc": "مسح سجل وسياق المحادثات بالكامل نهائياً.",
        "settings.delete_all": "حذف السجل بالكامل",
        "settings.theme_engine": "محرك المظهر والسمة",
        "settings.theme_desc": "اختر النمط البصري المفضل لديك.",
        "settings.lang_desc": "حدد لغة واجهة النظام والمحادثة.",
        "settings.particles_desc": "تفعيل الرسوم المتحركة في الخلفية.",

        // Chat View & Antigravity Workspace
        "chat.header_title": "مساحة عمل QUANT AI",
        "chat.public_session": "👥 محادثة جماعية مشتركة",
        "chat.private_session": "🔒 مساحة خاصة",
        "chat.active_workspace": "مجلد العمل النشط:",
        "chat.no_workspace": "لم يتم اختيار مجلد",
        "chat.choose_folder": "📂 اختيار مجلد العمل",
        "chat.change_folder": "تغيير المجلد",
        "chat.model_label": "النموذج:",
        "chat.no_model": "الوضع المحلي المباشر",
        "chat.quick_tools": "⚡ إجراءات وأدوات سريعة لمجلد العمل:",
        "chat.list_btn": "📂 استعراض الملفات (/list)",
        "chat.ping_btn": "⚡ اختبار العميل المحلي",
        "chat.commands_hint": "الأوامر المتاحة: <code>/list</code>, <code>/read &lt;file&gt;</code>, <code>/write &lt;file&gt; &lt;text&gt;</code>, <code>/exec &lt;cmd&gt;</code>",
        "chat.input_placeholder": "اسأل الذكاء الاصطناعي، اطلب فحص وتعديل ملفاتك، أو اكتب أوامر مثل /list...",
        "chat.attach_title": "إرفاق ملف أو صورة",
        "chat.voice_title": "تحويل الكلام إلى نص (إملاء صوتي)",
        "chat.voice_recording": "🔴 جارٍ الاستماع والتسجيل... اضغط للإيقاف والتحويل",
        "chat.voice_transcribing": "⚡ جارٍ تحويل الصوت إلى نص...",
        "chat.stop_btn": "إيقاف",
        "chat.send_btn": "إرسال",
        "chat.empty_title": "مساحة البرمجة والذكاء الاصطناعي QUANT",
        "chat.empty_desc": "اختر مجلد مشروعك ودع النموذج يستكشف ملفاتك ويبرمج معك وينفذ المهام كـ Antigravity تماماً.<br>جرب إرفاق ملفات أو استخدام أوامر مثل: <code style='color:var(--accent-color);'>/list</code> أو <code style='color:var(--accent-color);'>/read src/main.rs</code>.",
        "chat.workspace_alert": "📂 لم تقم بتحديد مجلد العمل بعد. اضغط هنا لاختيار مجلد المشروع لكي يتمكن الذكاء الاصطناعي من رؤية وقراءة ملفاتك.",
        "chat.copied": "تم النسخ ✨",
        "chat.copy": "نسخ",
        "chat.share": "مشاركة",
        "chat.coop_btn": "👥 الأصدقاء / الجلسة المشتركة",

        // Other views title updates
        "title.welcome": "مرحباً بك في QUANT AI",
        "title.chat": "مساحة عمل QUANT",
        "title.history": "سجل العمليات والنشاط",
        "title.agent": "إعداد العميل المحلي",
        "title.workspace": "إعدادات مساحة العمل",
        "title.permissions": "مركز التحكم بالصلاحيات",
        "title.downloads": "مركز تحميل العميل والملفات",
        "title.profile": "الملف الشخصي للمستخدم",
        "title.subscription": "الخطط والاشتراكات المتاحة",
        "title.settings": "إعدادات النظام المتقدمة",
        "title.info": "معلومات منصة QUANT AI",

        // Live Agent Action Cards (streaming tool-call UI)
        "agentcard.reading": "قراءة الملف",
        "agentcard.writing": "تعديل الملف",
        "agentcard.creating": "إنشاء الملف",
        "agentcard.deleting": "حذف الملف",
        "agentcard.copying": "نسخ الملف",
        "agentcard.listing": "استعراض الملفات",
        "agentcard.executing": "تنفيذ أمر طرفية",
        "agentcard.opening_url": "فتح رابط",
        "agentcard.uploading": "رفع بيانات خارجية",
        "agentcard.thinking": "التفكير",
        "agentcard.editing": "التعديل",
        "agentcard.browsing": "التصفح",
        "agentcard.working_for": "جارٍ العمل منذ {duration}",
        "agentcard.in_progress": "جارٍ التنفيذ...",
        "agentcard.done": "تم",
        "agentcard.failed": "فشل",
        "agentcard.lines_added": "سطر مضاف",
        "agentcard.lines_removed": "سطر محذوف",
        "agentcard.new_file": "ملف جديد",
        "agentcard.view_details": "عرض التفاصيل",
        "agentcard.hide_details": "إخفاء التفاصيل",
        "agentcard.no_changes": "لا يوجد تغيير في المحتوى",
        "agentcard.command_label": "الأمر",
        "agentcard.exit_code": "رمز الخروج",
        "agentcard.output_label": "المخرجات"
    },
    en: {
        // Navigation & General UI
        "nav.home": "Home",
        "nav.chat": "Chat Workspace",
        "nav.history": "History",
        "nav.agent": "Agent Setup",
        "nav.workspace": "Workspace",
        "nav.permissions": "Permissions",
        "nav.downloads": "Downloads",
        "nav.profile": "Profile",
        "nav.subscription": "Subscriptions",
        "nav.settings": "Settings",
        "nav.info": "Info",
        "status.connected": "Agent Connected",
        "status.disconnected": "Agent Not Connected",
        "status.busy": "Agent Busy",
        "status.executing": "Executing...",
        "status.waiting": "Waiting...",
        "status.unknown": "Unknown",

        // Login
        "login.title": "Access Workspace",
        "login.subtitle": "Authenticate via secure identity provider.",
        "login.policy_text": "Zero-Trust Architecture enforced.<br>All sessions require backend validation.",

        // Onboarding
        "onboarding.progress": "Step {step} of {total}",
        "onboarding.step1_title": "Identity Configuration",
        "onboarding.step1_subtitle": "Complete your profile to unlock the workspace.",
        "onboarding.name_label": "Display Name (Required)",
        "onboarding.name_placeholder": "How should QUANT address you?",
        "onboarding.dob_label": "Date of Birth (Required)",
        "onboarding.dob_tip": "Must be 13 years or older to use this service.",
        "onboarding.btn_verify": "Verify Identity",
        "onboarding.step2_title": "System Environment",
        "onboarding.step2_subtitle": "We detected your operating system. Confirm or change below.",
        "onboarding.os_label": "Operating System",
        "onboarding.os_select": "Select your OS",
        "onboarding.btn_back": "Back",
        "onboarding.btn_continue": "Continue",
        "onboarding.step3_title": "API Configuration",
        "onboarding.step3_subtitle": "Connect your AI model endpoint. You can update this later in Settings.",
        "onboarding.api_url": "API Base URL",
        "onboarding.api_key": "API Key",
        "onboarding.api_model": "Model Name",
        "onboarding.btn_skip": "Skip for Now",
        "onboarding.btn_finish": "Complete Setup",
        "onboarding.loader_text": "BUILDING YOUR WORKSPACE SECURELY...",

        // Welcome
        "welcome.title": "Welcome back, ",
        "welcome.subtitle": "Your premium, privacy-first local AI workspace is ready.",
        "welcome.open_workspace": "Open Workspace",
        "welcome.download_agent": "Download Agent",
        "welcome.step1_title": "1. Install Agent",
        "welcome.step1_desc": "Download and run the local QUANT Agent on your machine.",
        "welcome.step2_title": "2. Configure Workspace",
        "welcome.step2_desc": "Set up your local directory permissions and execution boundaries.",
        "welcome.step3_title": "3. Begin Operations",
        "welcome.step3_desc": "Interact with your local files and execute commands through this interface.",
        "welcome.api_configured": "API Configured",
        "welcome.api_not_configured": "API Not Configured — Set up now",
        "welcome.agent_connected": "Agent Connected",
        "welcome.agent_not_connected": "Agent Not Connected — Setup Agent",

        // Profile
        "profile.title": "User Profile",
        "profile.not_found": "Profile not found",
        "profile.not_found_desc": "Complete onboarding first.",
        "profile.start_onboarding": "Start Onboarding",
        "profile.verified_session": "Cryptographically Verified Session",
        "profile.edit_btn": "Edit Profile",
        "profile.logout_btn": "Sign Out",
        "profile.edit_title": "Edit Profile",
        "profile.edit_name": "Display Name",
        "profile.edit_age": "Age",
        "profile.edit_dob": "Date of Birth",
        "profile.edit_os": "OS",
        "profile.save": "Save",
        "profile.cancel": "Cancel",
        "profile.stats_title": "Usage Statistics",
        "profile.stats_sent": "Messages Sent",
        "profile.stats_received": "AI Responses",
        "profile.details_title": "Account Details",
        "profile.details_source": "Identity Source",
        "profile.details_os": "OS",
        "profile.details_age": "Age",
        "profile.details_api": "API",
        "profile.api_set": "Configured",
        "profile.api_unset": "Not Set",
        "profile.signout_confirm": "Sign out? All local session data will be permanently wiped.",

        // Settings
        "settings.title": "System Settings",
        "settings.theme_label": "Interface Appearance",
        "settings.theme_dark": "Premium Dark Mode",
        "settings.theme_light": "Classic Light Mode",
        "settings.theme_neon": "Cyberpunk Neon Mode",
        "settings.particles_label": "Animated Background Particles",
        "settings.particles_on": "Enable Animation",
        "settings.particles_off": "Disable Animation",
        "settings.lang_label": "System Language",
        "settings.save": "Save Settings",
        "settings.saved_msg": "Settings saved successfully!",
        "settings.api_provider": "Select AI Provider Preset",
        "settings.gemini_model": "Select Google Gemini Model",
        "settings.gemini_official": "Official & Fast Supported Models",
        "settings.custom_model": "Custom Model Override",
        "settings.clear": "Clear",
        "settings.data_management": "Data Management & Cache",
        "settings.clear_cache": "Clear Local Cache",
        "settings.clear_cache_desc": "Removes cached responses and temporary assets.",
        "settings.delete_history": "Delete Chat History",
        "settings.delete_history_desc": "Permanently deletes all conversation logs and context.",
        "settings.delete_all": "Delete All History",
        "settings.theme_engine": "Theme Engine",
        "settings.theme_desc": "Choose the visual presentation style.",
        "settings.lang_desc": "Choose system interface language.",
        "settings.particles_desc": "Enable background ambient animations.",

        // Chat View & Antigravity Workspace
        "chat.header_title": "QUANT AI Workspace",
        "chat.public_session": "👥 Public Co-Op Session",
        "chat.private_session": "🔒 Private Workspace",
        "chat.active_workspace": "Active Workspace:",
        "chat.no_workspace": "No workspace folder selected",
        "chat.choose_folder": "📂 Open Workspace Folder",
        "chat.change_folder": "Change Folder",
        "chat.model_label": "Model:",
        "chat.no_model": "Direct Local Mode",
        "chat.quick_tools": "⚡ Quick Local Workspace Actions:",
        "chat.list_btn": "📂 List Files (/list)",
        "chat.ping_btn": "⚡ Ping Agent",
        "chat.commands_hint": "Available: <code>/list</code>, <code>/read &lt;file&gt;</code>, <code>/write &lt;file&gt; &lt;text&gt;</code>, <code>/exec &lt;cmd&gt;</code>",
        "chat.input_placeholder": "Ask AI, instruct to inspect or edit files, or use commands like /list...",
        "chat.attach_title": "Attach file or image",
        "chat.voice_title": "Voice Input (Speech-to-Text)",
        "chat.voice_recording": "🔴 Listening and recording... Click to stop and transcribe",
        "chat.voice_transcribing": "⚡ Transcribing speech...",
        "chat.stop_btn": "Stop",
        "chat.send_btn": "Send",
        "chat.empty_title": "QUANT AI Coding Environment",
        "chat.empty_desc": "Select a workspace folder to let the AI explore, write, and execute code just like Antigravity.<br>Try attaching files or running commands like: <code style='color:var(--accent-color);'>/list</code> or <code style='color:var(--accent-color);'>/read src/main.rs</code>.",
        "chat.workspace_alert": "📂 No workspace folder selected yet. Click here to choose a project folder so the AI can inspect and edit your files.",
        "chat.copied": "Copied ✨",
        "chat.copy": "Copy",
        "chat.share": "Share",
        "chat.coop_btn": "👥 Friends / Co-Op Session",

        // Other views title updates
        "title.welcome": "Welcome to QUANT AI",
        "title.chat": "QUANT Workspace",
        "title.history": "Activity History",
        "title.agent": "Agent Configuration",
        "title.workspace": "Workspace Settings",
        "title.permissions": "Permission Center",
        "title.downloads": "Agent & Downloads Center",
        "title.profile": "User Profile",
        "title.subscription": "Plans & Billing",
        "title.settings": "System Settings",
        "title.info": "Platform Information",

        // Live Agent Action Cards (streaming tool-call UI)
        "agentcard.reading": "Reading file",
        "agentcard.writing": "Editing file",
        "agentcard.creating": "Creating file",
        "agentcard.deleting": "Deleting file",
        "agentcard.copying": "Copying file",
        "agentcard.listing": "Listing files",
        "agentcard.executing": "Running terminal command",
        "agentcard.opening_url": "Opening link",
        "agentcard.uploading": "Uploading external data",
        "agentcard.thinking": "Thinking",
        "agentcard.editing": "Editing",
        "agentcard.browsing": "Browsing",
        "agentcard.working_for": "Working for {duration}",
        "agentcard.in_progress": "In progress...",
        "agentcard.done": "Done",
        "agentcard.failed": "Failed",
        "agentcard.lines_added": "lines added",
        "agentcard.lines_removed": "lines removed",
        "agentcard.new_file": "New file",
        "agentcard.view_details": "View details",
        "agentcard.hide_details": "Hide details",
        "agentcard.no_changes": "No content changes",
        "agentcard.command_label": "Command",
        "agentcard.exit_code": "Exit code",
        "agentcard.output_label": "Output"
    },
    ja: {
        // Navigation & General UI (Hiragana Only)
        "nav.home": "ほーむ",
        "nav.chat": "ちゃっと わーくすぺーす",
        "nav.history": "りれき",
        "nav.agent": "えーじぇんと せってい",
        "nav.workspace": "わーくすぺーす",
        "nav.permissions": "けんげん せんたー",
        "nav.downloads": "だうんろーど",
        "nav.profile": "ぷろふぃーる",
        "nav.subscription": "さぶすくりぷしょん",
        "nav.settings": "せってい",
        "nav.info": "じょうほう",
        "status.connected": "えーじぇんと せつぞくちゅう",
        "status.disconnected": "えーじぇんと みせつぞく",
        "status.busy": "えーじぇんと いそがしい",
        "status.executing": "じっこうちゅう...",
        "status.waiting": "たいきちゅう...",
        "status.unknown": "ふめい",

        // Login
        "login.title": "わーくすぺーすへ ログイン",
        "login.subtitle": "あんぜんな にんしょうで ログインしてください。",
        "login.policy_text": "ぜろ とらすと ほごが ゆうこうです。<br>すべての セッションで にんしょうが ひつようです。",

        // Onboarding
        "onboarding.progress": "すてっぷ {step} / {total}",
        "onboarding.step1_title": "ぷろふぃーるの せってい",
        "onboarding.step1_subtitle": "わーくすぺーすを ひらくために ぷろふぃーるを かんせいさせてください。",
        "onboarding.name_label": "ひょうじ めい (ひつよう)",
        "onboarding.name_placeholder": "なんとお呼びしましょうか？",
        "onboarding.dob_label": "たんじょうび (ひつよう)",
        "onboarding.dob_tip": "このサービスは 13さい以上の かたのみ ご利用いただけます。",
        "onboarding.btn_verify": "にんしょうする",
        "onboarding.step2_title": "しすてむ かんきょう",
        "onboarding.step2_subtitle": "お使いの しすてむを けんしゅつしました。かくにん または へんこうしてください。",
        "onboarding.os_label": "けんしゅつされた おーえす",
        "onboarding.os_select": "おーえすを えらんでください",
        "onboarding.btn_back": "もどる",
        "onboarding.btn_continue": "すすむ",
        "onboarding.step3_title": "えーぴーあい せってい",
        "onboarding.step3_subtitle": "えーあい もでるの えんどぽいんとを せつぞくします。あとで せっていから へんこうできます。",
        "onboarding.api_url": "えーぴーあい うらる",
        "onboarding.api_key": "えーぴーあい きー",
        "onboarding.api_model": "もでる めい",
        "onboarding.btn_skip": "いまは すきっぷする",
        "onboarding.btn_finish": "せっていを かんりょうする",
        "onboarding.loader_text": "わーくすぺーすを あんぜんに 構築しています...",

        // Welcome
        "welcome.title": "おかえりなさい、",
        "welcome.subtitle": "あんぜんで ぷらいばしー重視の えーあい わーくすぺーすの じゅんびが できました。",
        "welcome.open_workspace": "わーくすぺーすを ひらく",
        "welcome.download_agent": "えーじぇんとを だうんろーど",
        "welcome.step1_title": "1. えーじぇんとの インストール",
        "welcome.step1_desc": "ろーかる えーじぇんとを だうんろーどして 実行します。",
        "welcome.step2_title": "2. わーくすぺーすの せってい",
        "welcome.step2_desc": "ろーかる フォルダの けんげんと ほごを せっていします。",
        "welcome.step3_title": "3. りようを はじめる",
        "welcome.step3_desc": "ろーかる ファイルと つながり、コマンドを 実行します。",
        "welcome.api_configured": "えーぴーあい せっていずみ",
        "welcome.api_not_configured": "えーぴーあい みせってい — せっていする",
        "welcome.agent_connected": "えーじぇんと せつぞくちゅう",
        "welcome.agent_not_connected": "えーじぇんと みせつぞく — せっていする",

        // Profile
        "profile.title": "ぷろふぃーる",
        "profile.not_found": "ぷろふぃーるが 見つかりません",
        "profile.not_found_desc": "さいしょに せっていを かんりょうさせてください。",
        "profile.start_onboarding": "せっていを はじめる",
        "profile.verified_session": "にんしょうされた セッション",
        "profile.edit_btn": "へんしゅうする",
        "profile.logout_btn": "さいんあうと",
        "profile.edit_title": "ぷろふぃーるの へんしゅう",
        "profile.edit_name": "ひょうじ めい",
        "profile.edit_age": "ねんれい",
        "profile.edit_dob": "たんじょうび",
        "profile.edit_os": "おーえす",
        "profile.save": "ほぞんする",
        "profile.cancel": "きゃんせる",
        "profile.stats_title": "りよう とうけい",
        "profile.stats_sent": "そうしん メッセージ",
        "profile.stats_received": "えーあいの へんとう",
        "profile.details_title": "あかうんと しょうさい",
        "profile.details_source": "にんしょう もと",
        "profile.details_os": "おーえす",
        "profile.details_age": "ねんれい",
        "profile.details_api": "えーぴーあい",
        "profile.api_set": "せっていずみ",
        "profile.api_unset": "みせってい",
        "profile.signout_confirm": "さいんあうと しますか？ すべての セッションデータが きえます。",

        // Settings
        "settings.title": "しすてむ せってい",
        "settings.theme_label": "てーま",
        "settings.theme_dark": "だーく もーど",
        "settings.theme_light": "らいと もーど",
        "settings.theme_neon": "ねおん もーど",
        "settings.particles_label": "はいけいの あにめーしょん",
        "settings.particles_on": "ゆうこう",
        "settings.particles_off": "むこう",
        "settings.lang_label": "げんご",
        "settings.save": "せっていを ほぞん",
        "settings.saved_msg": "せっていを ほぞんしました！",
        "settings.api_provider": "AIぷろばいだー せんたく",
        "settings.gemini_model": "Google Gemini もでる せんたく",
        "settings.gemini_official": "こうしき こうそく もでる",
        "settings.custom_model": "もでるめいしてん",
        "settings.clear": "くりあ",
        "settings.data_management": "でーた かんり",
        "settings.clear_cache": "きゃっしゅ さくじょ",
        "settings.clear_cache_desc": "いちじてきな でーたを けします。",
        "settings.delete_history": "りれき さくじょ",
        "settings.delete_history_desc": "すべての かいわ りれきを けします。",
        "settings.delete_all": "すべて さくじょ",
        "settings.theme_engine": "てーま えんじん",
        "settings.theme_desc": "すきな デザインを えらんでください。",
        "settings.lang_desc": "しすてむの げんごを えらんでください。",
        "settings.particles_desc": "はいけい あにめーしょんの ゆうこうか。",

        // Chat View & Antigravity Workspace
        "chat.header_title": "QUANT AI わーくすぺーす",
        "chat.public_session": "👥 きょうゆう せっしょん",
        "chat.private_session": "🔒 ぷらいべーと せっしょん",
        "chat.active_workspace": "げんざいの ふぉるだー:",
        "chat.no_workspace": "ふぉるだーが えらばれていません",
        "chat.choose_folder": "📂 ふぉるだーを えらぶ",
        "chat.change_folder": "ふぉるだーを へんこう",
        "chat.model_label": "もでる:",
        "chat.no_model": "ろーかる もーど",
        "chat.quick_tools": "⚡ わーくすぺーす つーる:",
        "chat.list_btn": "📂 ふぁいる いちらん (/list)",
        "chat.ping_btn": "⚡ えーじぇんと てすと",
        "chat.commands_hint": "つかえる こまんど: <code>/list</code>, <code>/read &lt;file&gt;</code>, <code>/write &lt;file&gt; &lt;text&gt;</code>, <code>/exec &lt;cmd&gt;</code>",
        "chat.input_placeholder": "AIにしつもん、ふぁいるのかくにん・へんしゅう、または /list こまんど...",
        "chat.attach_title": "ふぁいる または がぞうを てんぷ",
        "chat.voice_title": "おんせいにゅうりょく",
        "chat.voice_recording": "🔴 ろくおんちゅう... くりっくで ていし",
        "chat.voice_transcribing": "⚡ もじにおこしちゅう...",
        "chat.stop_btn": "ていし",
        "chat.send_btn": "そうしん",
        "chat.empty_title": "QUANT AI かいはつ かんきょう",
        "chat.empty_desc": "わーくすぺーす ふぉるだーを えらぶと、AIが ふぁいるを よんで こーどを かいてくれます。<br><code style='color:var(--accent-color);'>/list</code> や <code style='color:var(--accent-color);'>/read src/main.rs</code> を ためしてください。",
        "chat.workspace_alert": "📂 まだ わーくすぺーす ふぉるだーが えらばれていません。ここを くりっくして ふぉるだーを えらんでください。",
        "chat.copied": "こぴーしました ✨",
        "chat.copy": "こぴー",
        "chat.share": "しぇあ",
        "chat.coop_btn": "👥 ともだち / きょうゆう",

        // Other views title updates
        "title.welcome": "QUANT AIへ ようこそ",
        "title.chat": "QUANT わーくすぺーす",
        "title.history": "りれき",
        "title.agent": "えーじぇんと せってい",
        "title.workspace": "わーくすぺーす せってい",
        "title.permissions": "けんげん せんたー",
        "title.downloads": "だうんろーど せんたー",
        "title.profile": "ぷろふぃーる",
        "title.subscription": "ぷらん",
        "title.settings": "しすてむ せってい",
        "title.info": "しすてむ じょうほう",

        "agentcard.reading": "ふぁいるを よんでいます",
        "agentcard.writing": "ふぁいるを へんこうしています",
        "agentcard.creating": "ふぁいるを さくせいしています",
        "agentcard.deleting": "ふぁいるを さくじょしています",
        "agentcard.copying": "ふぁいるを こぴーしています",
        "agentcard.listing": "ふぁいるを ひょうじしています",
        "agentcard.executing": "こまんどを じっこうしています",
        "agentcard.opening_url": "りんくを ひらいています",
        "agentcard.uploading": "でーたを あっぷろーどしています",
        "agentcard.thinking": "かんがえちゅう",
        "agentcard.editing": "へんしゅうちゅう",
        "agentcard.browsing": "けんさくちゅう",
        "agentcard.working_for": "さぎょうじかん {duration}",
        "agentcard.in_progress": "じっこうちゅう...",
        "agentcard.done": "かんりょう",
        "agentcard.failed": "しっぱい",
        "agentcard.lines_added": "ぎょう ついか",
        "agentcard.lines_removed": "ぎょう さくじょ",
        "agentcard.new_file": "あたらしい ふぁいる",
        "agentcard.view_details": "しょうさいを みる",
        "agentcard.hide_details": "しょうさいを かくす",
        "agentcard.no_changes": "へんこう なし",
        "agentcard.command_label": "こまんど",
        "agentcard.exit_code": "しゅうりょう こーど",
        "agentcard.output_label": "しゅつりょく"
    }
};

class QuantI18n {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && QuantTranslations[urlLang]) {
            this.currentLang = urlLang;
            localStorage.setItem('mn_lang', urlLang);
            if (window.location.protocol !== 'file:') {
                try {
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                } catch (e) {}
            }
        } else {
            this.currentLang = localStorage.getItem('mn_lang') || 'ar';
        }
        this.applyLanguageProperties(this.currentLang);
        this.setupLinkPropagation();
    }

    t(key, replacements = {}) {
        const langDict = QuantTranslations[this.currentLang] || QuantTranslations['ar'];
        let text = langDict[key] || QuantTranslations['en'][key] || key;
        
        for (const [placeholder, val] of Object.entries(replacements)) {
            text = text.replace(`{${placeholder}}`, val);
        }
        return text;
    }

    setLanguage(lang) {
        if (!QuantTranslations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('mn_lang', lang);
        
        this.applyLanguageProperties(lang);

        // Translate static elements in DOM
        this.translateDOM();

        // Trigger dynamic router view re-rendering to update the currently visible view instantly
        if (window.appRouter && typeof window.appRouter.rerenderCurrentView === 'function') {
            window.appRouter.rerenderCurrentView();
        }
    }

    setupLinkPropagation() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href) {
                const hrefAttr = anchor.getAttribute('href');
                if (!hrefAttr || hrefAttr.startsWith('#') || hrefAttr.startsWith('mailto:') || hrefAttr.startsWith('tel:') || hrefAttr.startsWith('javascript:')) {
                    return;
                }
                try {
                    const url = new URL(anchor.href, window.location.href);
                    
                    const isEcosystem = url.host.includes('vercel.app') || 
                                        url.host.includes('localhost') || 
                                        url.host.includes('127.0.0.1') ||
                                        window.location.protocol === 'file:';
                    
                    const isRelative = hrefAttr.startsWith('.') || 
                                       hrefAttr.startsWith('/') ||
                                       !hrefAttr.includes('://');

                    if ((isEcosystem || isRelative) && this.currentLang) {
                        url.searchParams.set('lang', this.currentLang);
                        anchor.href = url.toString();
                    }
                } catch (err) {
                    // Ignore errors
                }
            }
        }, { capture: true });
    }

    applyLanguageProperties(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        
        // Font adjustments
        if (lang === 'ja') {
            document.body.style.fontFamily = "'Outfit', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif";
        } else if (lang === 'ar') {
            document.body.style.fontFamily = "'Outfit', 'Inter', sans-serif"; // Fits premium Outfit font
        } else {
            document.body.style.fontFamily = "'Outfit', 'Inter', sans-serif";
        }
    }

    translateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password' || el.type === 'url')) {
                el.placeholder = translation;
            } else {
                if (translation.includes('<br>') || translation.includes('<span>') || translation.includes('</')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Translate Co-Op Button text
        const coopSpan = document.querySelector('#top-bar-coop-btn span');
        if (coopSpan) {
            coopSpan.textContent = this.currentLang === 'ar' ? 'الأصدقاء / الجلسة المشتركة' : (this.currentLang === 'ja' ? 'ともだち / きょうゆう' : 'Friends / Co-Op Session');
        }

        // Always synchronize all language switcher select elements
        const switchers = document.querySelectorAll('.lang-switch-select, #settings-lang-select, #lang-switcher');
        switchers.forEach(sw => {
            sw.value = this.currentLang;
        });

        // Translate page titles in router mapping if initialized
        if (window.appRouter && window.appRouter.routes) {
            for (const [routeKey, routeVal] of Object.entries(window.appRouter.routes)) {
                routeVal.title = this.t(`title.${routeKey}`);
            }
            const currentRoute = window.appRouter.currentRoute || (window.location.hash.slice(1) ? window.location.hash.slice(1).split('?')[0] : 'welcome');
            if (window.appRouter.routes[currentRoute]) {
                const titleStr = window.appRouter.routes[currentRoute].title;
                document.title = titleStr;
                const titleEl = document.getElementById('top-bar-title');
                if (titleEl) {
                    titleEl.textContent = titleStr;
                }
            }
        }
    }
}

window.i18n = new QuantI18n();
