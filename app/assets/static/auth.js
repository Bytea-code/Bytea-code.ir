const SUPABASE_URL = window.BYTEA_SUPABASE.url;
const SUPABASE_KEY = window.BYTEA_SUPABASE.key;

let db;
let currentUser = null;
let allAdminTasks = [];
let cachedUsersList = [];

function getStatusFarsi(status) {
    switch (status) {
        case 'not_started': return 'شروع نشده';
        case 'pending': return 'در انتظار بررسی ادمین';
        case 'approved_published': return 'تایید و منتشر شده';
        case 'approved_draft': return 'تایید شده (پیش‌نویس)';
        case 'rejected': return 'رد شده / نیاز به اصلاح';
        default: return status;
    }
}

function convertToShamsiString(dateInput) {
    if (!dateInput) return 'تنظیم نشده';
    if (typeof dateInput === 'string' && dateInput.includes('/')) return dateInput;
    try {
        const dateObj = new Date(dateInput);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', calendar: 'persian' };
        let formatted = new Intl.DateTimeFormat('fa-IR', options).format(dateObj);
        let clean = formatted.replace(/٫/g, '/').replace(/\\/g, '/');
        const p2e = s => s.replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
        return p2e(clean);
    } catch (e) {
        return dateInput;
    }
}

function updateLiveClock() {
    const clock = document.getElementById('live-clock');
    if (!clock) return;

    const now = new Date();
    const date = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long', day: 'numeric', month: 'long', calendar: 'persian'
    }).format(now);
    const time = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now);
    clock.textContent = `${date} · ${time}`;
}

function setConnectionStatus(message, state = '') {
    const statusBox = document.getElementById('connection-status');
    if (!statusBox) return;
    statusBox.className = `auth-connection ${state}`.trim();
    statusBox.querySelector('span').textContent = message;
}

function showAuthMessage(message, type = 'error', title) {
    byteaAlert(message, { type, slot: '#slot-login', title });
}

function clearAuthMessage() {
    byteaAlertClear(document.getElementById('slot-login'));
}

// The slot above the panel of the zone the element lives in (for dashboard alerts)
function slotFor(el) {
    const zone = el && el.closest ? el.closest('.zone') : null;
    if (zone) {
        const slot = document.getElementById('slot-' + zone.id.replace(/-zone$/, ''));
        if (slot) return slot;
    }
    return document.getElementById('slot-dashboard');
}

function setButtonLoading(button, loading, loadingText = 'لطفاً صبر کنید...') {
    if (!button) return;
    if (loading) {
        if (!button.dataset.originalContent) button.dataset.originalContent = button.innerHTML;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span><span>${loadingText}</span>`;
    } else {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        if (button.dataset.originalContent) button.innerHTML = button.dataset.originalContent;
    }
}

function normalizeDigits(value) {
    return value
        .replace(/[۰-۹]/g, digit => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)])
        .replace(/[٠-٩]/g, digit => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(digit)]);
}

function bindAction(id, event, handler) {
    const element = document.getElementById(id);
    if (element) element.addEventListener(event, handler);
}

// ===== OTP send cooldown (matches Supabase's 1-minute limit) =====
const OTP_COOLDOWN_SECONDS = 60;
const OTP_UNTIL_KEY = 'bytea-otp-until';
const OTP_EMAIL_KEY = 'bytea-otp-email';
const OTP_NOTE_DEFAULT = 'برای ورود بدون رمز، نام کاربری یا ایمیلت را بنویس و این دکمه را بزن. ارسال هر کد جدید <b>۱ دقیقه</b> زمان می‌برد؛ اگر ایمیل نرسید، پوشه اسپم را چک کن.';
let otpUntil = 0;
let otpTimer = null;
let otpSending = false;
let otpSendDefaultHTML = '';

const faDigits = value => String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);

function renderOtpCooldown() {
    if (otpSending) return;
    const sendButton = document.getElementById('btn-send-otp');
    const resendButton = document.getElementById('btn-resend-otp');
    const cooldownLabel = document.getElementById('otp-cooldown');
    const note = document.getElementById('otp-note');
    if (!sendButton) return;

    const left = Math.max(0, Math.ceil((otpUntil - Date.now()) / 1000));
    if (left > 0) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>ارسال مجدد تا ' + faDigits(left) + ' ثانیهٔ دیگر</span>';
        if (resendButton) {
            resendButton.disabled = true;
            resendButton.textContent = 'ارسال مجدد (' + faDigits(left) + 'ث)';
        }
        if (cooldownLabel) cooldownLabel.textContent = 'کد قبلی هنوز معتبر است؛ ' + faDigits(left) + ' ثانیه تا امکان درخواست کد جدید.';
        if (note) note.innerHTML = 'تا پایان شمارش صبر کن؛ بعد می‌توانی کد جدید بخواهی. اگر ایمیل نرسید، پوشه اسپم را چک کن.';
    } else {
        sendButton.disabled = false;
        if (otpSendDefaultHTML) sendButton.innerHTML = otpSendDefaultHTML;
        if (resendButton) {
            resendButton.disabled = false;
            resendButton.textContent = 'ارسال مجدد کد';
        }
        if (cooldownLabel) cooldownLabel.textContent = 'ایمیل نرسید؟ می‌توانی کد جدید بخواهی.';
        if (note) note.innerHTML = OTP_NOTE_DEFAULT;
    }
}

function ensureOtpTimer() {
    if (otpTimer) return;
    otpTimer = setInterval(() => {
        if (Date.now() >= otpUntil) {
            clearInterval(otpTimer);
            otpTimer = null;
            try { localStorage.removeItem(OTP_UNTIL_KEY); } catch (e) { }
        }
        renderOtpCooldown();
    }, 1000);
}

function startOtpCooldown(seconds) {
    otpUntil = Date.now() + seconds * 1000;
    try { localStorage.setItem(OTP_UNTIL_KEY, String(otpUntil)); } catch (e) { }
    ensureOtpTimer();
    renderOtpCooldown();
}

function clearOtpCooldown() {
    otpUntil = 0;
    if (otpTimer) { clearInterval(otpTimer); otpTimer = null; }
    try {
        localStorage.removeItem(OTP_UNTIL_KEY);
        sessionStorage.removeItem(OTP_EMAIL_KEY);
    } catch (e) { }
    renderOtpCooldown();
}

function setOtpSendBusy(busy) {
    otpSending = busy;
    const sendButton = document.getElementById('btn-send-otp');
    if (!sendButton) return;
    if (busy) {
        sendButton.disabled = true;
        sendButton.setAttribute('aria-busy', 'true');
        sendButton.innerHTML = '<span class="button-spinner" aria-hidden="true"></span><span>در حال ارسال کد...</span>';
    } else {
        sendButton.removeAttribute('aria-busy');
        renderOtpCooldown();
    }
}

// After a page refresh, the pending code and its cooldown are restored
function restoreOtpState() {
    let savedEmail = null;
    let savedUntil = 0;
    try {
        savedEmail = sessionStorage.getItem(OTP_EMAIL_KEY);
        savedUntil = Number(localStorage.getItem(OTP_UNTIL_KEY)) || 0;
    } catch (e) { }

    if (savedEmail) {
        const usernameField = document.getElementById('login-username');
        if (usernameField && !usernameField.value) usernameField.value = savedEmail.replace(/@nova\.local$/i, '');
        const destination = document.getElementById('otp-destination');
        if (destination) destination.textContent = savedEmail;
        document.getElementById('otp-verify-section')?.classList.remove('hidden');
    }

    if (savedUntil > Date.now()) {
        otpUntil = savedUntil;
        ensureOtpTimer();
    } else {
        try { localStorage.removeItem(OTP_UNTIL_KEY); } catch (e) { }
    }
    renderOtpCooldown();
}

function handleForgotPassword() {
    byteaAlert('نام کاربری یا ایمیلت را در کادر بالا بنویس و دکمه «ارسال کد یک‌بارمصرف به ایمیل» را بزن. بعد از ورود با کد، در داشبورد به تب «تغییر رمز عبور» برو و رمز جدید بگذار.', {
        type: 'info', slot: '#slot-login', title: 'بازیابی رمز عبور', sticky: true
    });
    const sendButton = document.getElementById('btn-send-otp');
    if (sendButton) {
        sendButton.classList.remove('otp-pulse');
        void sendButton.offsetWidth;
        sendButton.classList.add('otp-pulse');
    }
    document.getElementById('login-username').focus();
}

// Username/email format is validated before being sent to the service
function getIdentityError(raw) {
    if (!raw) return 'ابتدا نام کاربری یا ایمیل خود را وارد کنید.';
    if (raw.includes('@')) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return 'قالب ایمیل درست نیست؛ مثل example@email.com وارد کن.';
        return null;
    }
    if (!/^[a-z0-9._-]+$/.test(raw)) return 'نام کاربری فقط می‌تواند شامل حروف انگلیسی کوچک، عدد، نقطه، خط تیره و زیرخط باشد.';
    return null;
}

function setupAuthInterface() {
    // Navigation and the mobile menu are handled by bytea.js; here only the login form
    const passwordInput = document.getElementById('login-password');
    const passwordToggle = document.getElementById('toggle-password');
    passwordToggle?.addEventListener('click', () => {
        const shouldShow = passwordInput.type === 'password';
        passwordInput.type = shouldShow ? 'text' : 'password';
        passwordToggle.setAttribute('aria-pressed', String(shouldShow));
        passwordToggle.setAttribute('aria-label', shouldShow ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
        passwordToggle.title = shouldShow ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور';
        passwordInput.focus();
    });

    bindAction('login-form', 'submit', handleLogin);
    bindAction('btn-send-otp', 'click', handleSendOTP);
    bindAction('btn-resend-otp', 'click', handleSendOTP);
    bindAction('btn-forgot', 'click', handleForgotPassword);
    bindAction('btn-verify-otp', 'click', handleVerifyOTP);
    bindAction('btn-cancel-otp', 'click', () => {
        document.getElementById('otp-verify-section').classList.add('hidden');
        document.getElementById('otp-code-input').value = '';
        clearOtpCooldown();
        clearAuthMessage();
        document.getElementById('login-username').focus();
    });

    const sendButton = document.getElementById('btn-send-otp');
    if (sendButton) otpSendDefaultHTML = sendButton.innerHTML;
    restoreOtpState();

    const otpInput = document.getElementById('otp-code-input');
    otpInput?.addEventListener('input', () => {
        otpInput.value = normalizeDigits(otpInput.value).replace(/\D/g, '').slice(0, 6);
        otpInput.removeAttribute('aria-invalid');
    });
    otpInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleVerifyOTP();
        }
    });

    ['login-username', 'login-password'].forEach(id => {
        bindAction(id, 'input', () => document.getElementById(id).removeAttribute('aria-invalid'));
    });

    bindAction('btn-logout', 'click', handleLogout);
    bindAction('btn-create-user', 'click', createNewUser);
    bindAction('btn-create-task', 'click', createNewTask);
    bindAction('btn-change-pass', 'click', changeMemberPassword);
    bindAction('search-input', 'input', searchUserActivity);

    bindAction('tab-member-urgent', 'click', () => switchTab('member-urgent'));
    bindAction('tab-member-current', 'click', () => switchTab('member-current'));
    bindAction('tab-member-archive', 'click', () => switchTab('member-archive'));
    bindAction('tab-member-profile', 'click', () => switchTab('member-profile'));
    bindAction('tab-admin-today', 'click', () => switchTab('admin-today'));
    bindAction('tab-admin-future', 'click', () => switchTab('admin-future'));
    bindAction('tab-admin-expired', 'click', () => switchTab('admin-expired'));
    bindAction('tab-admin-search', 'click', () => switchTab('admin-search'));
    bindAction('tab-admin-manage', 'click', () => {
        switchTab('admin-manage');
        loadUsersManagementSection();
    });

    const year = document.getElementById('auth-year');
    if (year) year.textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
}

async function initializeApp() {
    setupAuthInterface();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    if (new URLSearchParams(location.search).get('denied') === '1') {
        showAuthMessage('استودیو انتشار فقط برای مدیران است؛ با حساب مدیر وارد شو.', 'info');
        try { history.replaceState(null, '', location.pathname); } catch (e) { }
    }

    // The browser bar color is read straight from the --paper token in the main root
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        const paperColor = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
        if (paperColor) themeMeta.setAttribute('content', paperColor);
    }

    if (typeof window.supabase === 'undefined') {
        setConnectionStatus('اتصال به سامانه ورود برقرار نشد', 'offline');
        showAuthMessage('سامانه ورود در دسترس نیست. اتصال اینترنت را بررسی و صفحه را دوباره بارگذاری کنید.');
        return;
    }

    try {
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        setConnectionStatus('سامانه ورود آماده است', 'online');

        const { data: { session }, error: sessionError } = await db.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
            const { data: profile, error: profileError } = await db
                .from('profiles')
                .select('username, role')
                .eq('id', session.user.id)
                .single();

            if (profileError || !profile) throw profileError || new Error('Profile not found');

            currentUser = {
                id: session.user.id,
                username: profile.username,
                role: profile.role,
                email: session.user.email
            };
            showDashboard();
        }
    } catch (error) {
        console.error('خطا در بازیابی نشست:', error);
        const net = /fetch|network/i.test(error && error.message || '');
        location.replace('../error.html?type=' + (net ? 'offline' : '500') + '&msg=' + encodeURIComponent(error && error.message || 'خطای ناشناخته') + '&back=auth.html');
        return;
    }

    const todayField = document.getElementById('single-task-date');
    if (todayField) todayField.value = convertToShamsiString(new Date());
}

initializeApp();

window.checkAndUploadFile = async function (fileInputId, targetInputId, btnId, taskId) {
    const fileInput = document.getElementById(fileInputId);
    const targetInput = document.getElementById(targetInputId);
    const btn = document.getElementById(btnId);

    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const fileSizeInMB = file.size / (1024 * 1024);

    if (fileSizeInMB > 50) {
        byteaAlert('حجم فایل بیش از ۵۰ مگابایت است؛ حجم آن را کاهش دهید یا با مدیر صحبت کنید.', { type: 'warning', slot: slotFor(btn), title: 'فایل بزرگ' });
        fileInput.value = "";
        return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    btn.innerText = '🔄 در حال آپلود فایل...';
    btn.style.pointerEvents = 'none';

    try {
        const { data, error } = await db.storage.from('robo-files').upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });
        if (error) throw error;

        // Create a secure Signed URL valid for 1 year (for private file downloads)
        const { data: signedData, error: signedError } = await db.storage
            .from('robo-files')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 60 seconds * 60 minutes * 24 hours * 365 days

        if (signedError) throw signedError;

        targetInput.value = signedData.signedUrl;
        btn.innerText = '✅ آپلود موفقیت‌آمیز بود';
        btn.style.borderColor = 'var(--moss)';
        btn.style.color = 'var(--moss)';
    } catch (err) {
        byteaAlert('خطا در آپلود: ' + err.message, { type: 'error', slot: slotFor(btn), title: 'آپلود ناموفق' });
        btn.innerText = '📁 انتخاب و آپلود مستقیم فایل در سرور';
        btn.style.pointerEvents = 'auto';
    }
}

function showDashboard() {
    document.getElementById('auth-panel').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('member-tabs').classList.add('hidden');
    document.getElementById('admin-tabs').classList.add('hidden');
    document.getElementById('user-welcome').textContent = `${currentUser.username} · ${currentUser.role === 'admin' ? 'مدیر' : 'عضو'}`;
    const eyebrow = document.getElementById('dashboard-eyebrow');
    if (eyebrow) eyebrow.textContent = currentUser.role === 'admin' ? 'admin dashboard' : 'member dashboard';

    if (currentUser.role === 'admin') {
        document.getElementById('admin-tabs').classList.remove('hidden');
        const studioBtn = document.getElementById('btn-studio');
        if (studioBtn) studioBtn.classList.remove('hidden');
        const q = new URLSearchParams(location.search);
        if (q.get('next') === 'studio' && q.get('denied') !== '1') {
            // Hand the session over via the fragment (browser-side only; never sent to the server)
            (async () => {
                let frag = '';
                try {
                    const { data } = await db.auth.getSession();
                    if (data.session) {
                        frag = '#handoff=' + encodeURIComponent(btoa(JSON.stringify({
                            access_token: data.session.access_token,
                            refresh_token: data.session.refresh_token
                        })));
                    }
                } catch (e) { }
                location.replace('../tracks/studio.html?via=auth' + frag);
            })();
            return;
        }
        switchTab('admin-today');
        fetchAdminDataFromServer();
    } else {
        document.getElementById('member-tabs').classList.remove('hidden');
        switchTab('member-urgent');
        loadMemberData();
    }

    window.scrollTo(0, 0);
}

// Login errors split by cause: username/password, network, rate limit or server
function getLoginErrorMessage(error) {
    const message = error?.message || '';
    const status = error?.status || 0;
    if (/invalid login credentials/i.test(message)) {
        return { title: 'نام کاربری یا رمز اشتباه', message: 'نام کاربری یا رمز عبور درست نیست. هر دو را دوباره بررسی کن؛ اگر رمزت را فراموش کرده‌ای، از «ارسال کد یک‌بارمصرف به ایمیل» استفاده کن و بعد از ورود، در تب «تغییر رمز عبور» رمز جدید بگذار.' };
    }
    if (/email not confirmed/i.test(message)) {
        return { title: 'ایمیل تأیید نشده', message: 'ایمیل این حساب هنوز تأیید نشده است؛ با کد یک‌بارمصرف وارد شو یا با مدیر انجمن در تماس باش.' };
    }
    if (/failed to fetch|network|load failed/i.test(message)) {
        return { title: 'مشکل اینترنت', message: 'اتصال به سامانه برقرار نشد. اینترنتت را بررسی کن و دوباره تلاش کن.' };
    }
    if (/too many requests|rate limit/i.test(message)) {
        return { title: 'تلاش بیش از حد', message: 'تعداد تلاش‌های ورود زیاد است. چند دقیقه صبر کن و دوباره تلاش کن.' };
    }
    if (status >= 500 || /internal|server error|unexpected/i.test(message)) {
        return { title: 'خطای سرور', message: 'سمت سرور مشکلی پیش آمد. چند لحظه بعد دوباره تلاش کن؛ اگر تکرار شد به مدیر انجمن خبر بده.' };
    }
    return { title: 'ورود ناموفق', message: 'ورود انجام نشد. اطلاعات را بررسی و دوباره تلاش کن؛ در صورت تکرار، با کد یک‌بارمصرف وارد شو.' };
}

// Error messages specific to "send OTP" — must not be confused with login errors
function getOtpSendErrorMessage(error) {
    const message = error?.message || '';
    if (/signups not allowed|user not found|invalid email|unable to validate email/i.test(message)) return 'این کاربر یا ایمیل در سامانه ثبت نشده است.';
    if (/security purposes|once every|after \d+ seconds|rate limit|too many requests/i.test(message)) return 'کد به‌تازگی ارسال شده؛ شمارش معکوس زیر کادر کد را ببین و پس از پایان آن، کد جدید بخواه.';
    if (/email not confirmed/i.test(message)) return 'ایمیل این حساب هنوز تأیید نشده است؛ اول ورود با رمز را انجام بده.';
    if (/failed to fetch|network/i.test(message)) return 'اتصال به سامانه برقرار نشد. اینترنت را بررسی و دوباره تلاش کنید.';
    return 'ارسال کد انجام نشد. لطفاً چند لحظه بعد دوباره تلاش کنید.';
}

async function handleLogin(event) {
    event?.preventDefault();
    const usernameField = document.getElementById('login-username');
    const passwordField = document.getElementById('login-password');
    const loginButton = document.getElementById('btn-login');
    const usernameInput = usernameField.value.trim().toLowerCase();
    const pass = passwordField.value;

    clearAuthMessage();
    usernameField.removeAttribute('aria-invalid');
    passwordField.removeAttribute('aria-invalid');

    if (!usernameInput || !pass) {
        showAuthMessage('نام کاربری و رمز عبور را کامل وارد کنید.', 'warning', 'اطلاعات ناقص');
        if (!usernameInput) usernameField.setAttribute('aria-invalid', 'true');
        if (!pass) passwordField.setAttribute('aria-invalid', 'true');
        (usernameInput ? passwordField : usernameField).focus();
        return;
    }

    const identityError = getIdentityError(usernameInput);
    if (identityError) {
        showAuthMessage(identityError, 'warning', 'نام کاربری نامعتبر');
        usernameField.setAttribute('aria-invalid', 'true');
        usernameField.focus();
        return;
    }

    if (!db) {
        showAuthMessage('سامانه ورود هنوز آماده نیست. صفحه را دوباره بارگذاری کنید.');
        return;
    }

    const email = usernameInput.includes('@') ? usernameInput : `${usernameInput}@nova.local`;
    setButtonLoading(loginButton, true, 'در حال بررسی اطلاعات...');

    try {
        const { data: authData, error: authError } = await db.auth.signInWithPassword({
            email,
            password: pass
        });

        if (authError) {
            console.error('خطای Auth:', authError.message);
            const info = getLoginErrorMessage(authError);
            showAuthMessage(info.message, 'error', info.title);
            if (/invalid login credentials/i.test(authError.message || '')) usernameField.setAttribute('aria-invalid', 'true');
            passwordField.setAttribute('aria-invalid', 'true');
            passwordField.focus();
            return;
        }

        const authUser = authData.user;
        const { data: profileData, error: profileError } = await db
            .from('profiles')
            .select('role, username')
            .eq('id', authUser.id)
            .single();

        if (profileError || !profileData) {
            console.error('خطای پروفایل:', profileError);
            await db.auth.signOut();
            showAuthMessage('حساب شما یافت شد، اما پروفایل کاربری برای آن ثبت نشده است. با مدیر انجمن در تماس باشید.');
            return;
        }

        currentUser = {
            id: authUser.id,
            username: profileData.username,
            role: profileData.role,
            email: authUser.email
        };
        showDashboard();
    } catch (error) {
        console.error('خطای غیرمنتظره در ورود:', error);
        const info = getLoginErrorMessage(error);
        showAuthMessage(info.message, 'error', info.title);
    } finally {
        setButtonLoading(loginButton, false);
    }
}

async function handleLogout() {
    const logoutButton = document.getElementById('btn-logout');
    setButtonLoading(logoutButton, true, 'در حال خروج...');

    try {
        const { error } = await db.auth.signOut();
        if (error) throw error;

        currentUser = null;
        document.getElementById('main-dashboard').classList.add('hidden');
        document.getElementById('auth-panel').classList.remove('hidden');
        document.getElementById('login-form').reset();
        document.getElementById('otp-code-input').value = '';
        document.getElementById('otp-verify-section').classList.add('hidden');
        clearOtpCooldown();
        showAuthMessage('با موفقیت از حساب خارج شدید.', 'success');
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('خطا در خروج:', error);
        byteaAlert('خروج از حساب انجام نشد. لطفاً دوباره تلاش کنید.', { type: 'error', slot: '#slot-dashboard' });
    } finally {
        setButtonLoading(logoutButton, false);
    }
}

function switchTab(tabId) {
    byteaAlertClear(document.getElementById('main-dashboard'));
    document.querySelectorAll('.zone').forEach(z => z.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const zone = document.getElementById(tabId + '-zone');
    if (zone) zone.classList.remove('hidden');
    const btn = document.getElementById('tab-' + tabId);
    if (btn) btn.classList.add('active');
}

async function changeMemberPassword() {
    const newPass = document.getElementById('member-new-pass').value;
    if (!newPass || newPass.length < 6) return byteaAlert('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.', { type: 'warning', slot: '#slot-member-profile' });

    const { error } = await db.auth.updateUser({ password: newPass });
    if (!error) {
        byteaAlert('رمز عبور با موفقیت بروزرسانی شد.', { type: 'success', slot: '#slot-member-profile' });
        document.getElementById('member-new-pass').value = '';
    } else {
        byteaAlert('خطا در تغییر رمز: ' + error.message, { type: 'error', slot: '#slot-member-profile', title: 'تغییر رمز ناموفق' });
    }
}

// Map username to the internal email; same as password login and account creation
function getFormattedEmail() {
    const rawInput = document.getElementById('login-username').value.trim().toLowerCase();
    if (!rawInput) return null;
    return rawInput.includes('@') ? rawInput : `${rawInput}@nova.local`;
}

async function handleSendOTP() {
    const email = getFormattedEmail();
    const usernameField = document.getElementById('login-username');
    clearAuthMessage();

    const identityError = getIdentityError((usernameField.value || '').trim().toLowerCase());
    if (identityError || !email) {
        showAuthMessage(identityError || 'ابتدا نام کاربری یا ایمیل خود را وارد کنید.', 'warning', 'اطلاعات ناقص');
        usernameField.setAttribute('aria-invalid', 'true');
        usernameField.focus();
        return;
    }

    if (!db) {
        showAuthMessage('سامانه ورود هنوز آماده نیست. صفحه را دوباره بارگذاری کنید.');
        return;
    }

    if (otpUntil > Date.now()) {
        const left = Math.ceil((otpUntil - Date.now()) / 1000);
        showAuthMessage('کد قبلی هنوز فعال است؛ ' + faDigits(left) + ' ثانیه صبر کن و بعد دوباره درخواست بده.', 'warning', 'کد قبلی هنوز فعال است');
        return;
    }

    setOtpSendBusy(true);

    try {
        const { error } = await db.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
        });

        if (error) {
            const rawMessage = error.message || '';
            const rateLimited = /security purposes|once every|after \d+ seconds|rate limit|too many requests/i.test(rawMessage);
            if (rateLimited) {
                // The server says the previous code is still active; resume the countdown from there
                const match = rawMessage.match(/after (\d+) seconds/i);
                startOtpCooldown(match ? Math.max(1, parseInt(match[1], 10)) : OTP_COOLDOWN_SECONDS);
                try { sessionStorage.setItem(OTP_EMAIL_KEY, email); } catch (e) { }
                document.getElementById('otp-destination').textContent = email;
                document.getElementById('otp-verify-section').classList.remove('hidden');
                showAuthMessage(getOtpSendErrorMessage(error), 'warning', 'کد قبلی هنوز فعال است');
            } else {
                showAuthMessage(getOtpSendErrorMessage(error), 'error', 'ارسال کد ناموفق');
            }
            return;
        }

        try { sessionStorage.setItem(OTP_EMAIL_KEY, email); } catch (e) { }
        startOtpCooldown(OTP_COOLDOWN_SECONDS);
        document.getElementById('otp-destination').textContent = email;
        document.getElementById('otp-verify-section').classList.remove('hidden');
        document.getElementById('otp-code-input').value = '';
        showAuthMessage('کد تأیید ۶ رقمی ارسال شد. کد را در بخش پایین وارد کنید.', 'success');
        document.getElementById('otp-code-input').focus();
    } catch (error) {
        console.error('خطا در ارسال OTP:', error);
        showAuthMessage('ارسال کد انجام نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.', 'error', 'مشکل اینترنت');
    } finally {
        setOtpSendBusy(false);
    }
}

// Code-verification errors split by cause: invalid code, network, rate limit or server
function getOtpVerifyErrorMessage(error) {
    const message = error?.message || '';
    const status = error?.status || 0;
    if (/expired|invalid|token/i.test(message)) {
        return { title: 'کد نامعتبر', message: 'کد واردشده اشتباه یا منقضی است. با «ارسال مجدد کد» یک کد تازه بگیر و دوباره وارد کن.' };
    }
    if (/failed to fetch|network|load failed/i.test(message)) {
        return { title: 'مشکل اینترنت', message: 'اتصال به سامانه برقرار نشد. اینترنتت را بررسی کن و دوباره تلاش کن.' };
    }
    if (/too many requests|rate limit/i.test(message)) {
        return { title: 'تلاش بیش از حد', message: 'تعداد تلاش‌ها زیاد است؛ کمی صبر کن و دوباره کد را وارد کن.' };
    }
    if (status >= 500 || /internal|server error|unexpected/i.test(message)) {
        return { title: 'خطای سرور', message: 'سمت سرور مشکلی پیش آمد. چند لحظه بعد دوباره تلاش کن.' };
    }
    return { title: 'تأیید ناموفق', message: 'کد تأیید نشد. کد را دوباره بررسی کن یا کد جدید بگیر.' };
}

async function handleVerifyOTP() {
    const email = getFormattedEmail();
    const otpInput = document.getElementById('otp-code-input');
    const verifyButton = document.getElementById('btn-verify-otp');
    const token = normalizeDigits(otpInput.value.trim());

    clearAuthMessage();
    otpInput.removeAttribute('aria-invalid');

    if (!email) {
        showAuthMessage('نام کاربری یا ایمیل مشخص نیست. آن را دوباره وارد کنید.');
        document.getElementById('login-username').focus();
        return;
    }

    if (!/^\d{6}$/.test(token)) {
        showAuthMessage('کد تأیید باید دقیقاً ۶ رقم باشد.');
        otpInput.setAttribute('aria-invalid', 'true');
        otpInput.focus();
        return;
    }

    if (!db) {
        showAuthMessage('سامانه ورود هنوز آماده نیست. صفحه را دوباره بارگذاری کنید.');
        return;
    }

    setButtonLoading(verifyButton, true, 'در حال تأیید...');

    try {
        const { error } = await db.auth.verifyOtp({ email, token, type: 'email' });
        if (error) throw error;

        clearOtpCooldown();
        showAuthMessage('کد تأیید شد. در حال ورود به پنل...', 'success');
        setTimeout(() => window.location.reload(), 700);
    } catch (error) {
        console.error('خطا در تأیید OTP:', error);
        const info = getOtpVerifyErrorMessage(error);
        showAuthMessage(info.message, 'error', info.title);
        otpInput.setAttribute('aria-invalid', 'true');
        otpInput.focus();
        otpInput.select();
    } finally {
        setButtonLoading(verifyButton, false);
    }
}

function escapeHTML(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

async function loadUsersManagementSection() {
    const select = document.getElementById('select-task-user');
    const tableBody = document.getElementById('admin-users-table-body');
    const lastSelectedUser = select ? select.value : '';

    const { data: users, error } = await db.from('profiles').select('id, username, role, job_title');
    if (error) {
        console.error('خطا در دریافت لیست کاربران:', error);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="4" class="users-empty-state">دریافت لیست اعضا انجام نشد. لطفاً دوباره تلاش کنید.</td></tr>';
        }
        return;
    }

    cachedUsersList = users || [];

    if (select) {
        select.innerHTML = '<option value="">انتخاب عضو انجمن...</option>';
        cachedUsersList.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            select.appendChild(option);
        });
        if (lastSelectedUser) select.value = lastSelectedUser;
    }

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!cachedUsersList.length) {
        tableBody.innerHTML = '<tr><td colspan="4" class="users-empty-state">هنوز عضوی ثبت نشده است.</td></tr>';
        return;
    }

    cachedUsersList.forEach(user => {
        const isAdmin = user.role === 'admin';
        const username = user.username || 'بدون نام';
        const avatar = Array.from(username.trim())[0] || 'b';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="نام کاربری">
                <div class="user-identity">
                    <span class="user-avatar" aria-hidden="true">${escapeHTML(avatar)}</span>
                    <strong class="user-name" dir="auto">${escapeHTML(username)}</strong>
                </div>
            </td>
            <td data-label="نقش">
                <div class="role-cell">
                    <span class="role-badge ${isAdmin ? 'admin' : 'member'}">
                        ${isAdmin
                            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>مدیر'
                            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>عضو'}
                    </span>
                    ${currentUser && currentUser.role === 'admin' ? `
                    <select class="role-select" data-action="edit-role" aria-label="تغییر نقش ${escapeHTML(username)}">
                        <option value="member" ${isAdmin ? '' : 'selected'}>عضو</option>
                        <option value="admin" ${isAdmin ? 'selected' : ''}>مدیر</option>
                    </select>` : ''}
                </div>
            </td>
            <td data-label="عنوان شغلی / مسئولیت">
                <div class="job-cell">
                    <span class="job-text ${user.job_title ? '' : 'empty'}">${escapeHTML(user.job_title || 'تعریف نشده')}</span>
                    <button class="user-icon-button" type="button" data-action="edit-job" aria-label="ویرایش مسئولیت ${escapeHTML(username)}" title="ویرایش مسئولیت">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                    </button>
                </div>
            </td>
            <td data-label="عملیات">
                <button class="user-action-button" type="button" data-action="reset-password">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M15 7l2 2M18 4l2 2"/></svg>
                    <span>تغییر رمز</span>
                </button>
            </td>
        `;

        row.querySelector('[data-action="edit-job"]').addEventListener('click', () => {
            editMemberJob(user.id, user.job_title || '');
        });
        const roleSelect = row.querySelector('[data-action="edit-role"]');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                updateMemberRole(user.id, username, roleSelect.value, roleSelect);
            });
        }
        row.querySelector('[data-action="reset-password"]').addEventListener('click', () => {
            resetUserPasswordPrompt(user.id, username);
        });
        tableBody.appendChild(row);
    });
}

// Kept for compatibility with older callers
window.loadUsersToSelect = loadUsersManagementSection;

window.resetUserPasswordPrompt = async function (userId, username) {
    const newPass = prompt(`رمز عبور جدید را برای کاربر "${username}" وارد کنید (حداقل ۶ کاراکتر):`);
    if (!newPass) return;
    if (newPass.length < 6) return byteaAlert('رمز عبور باید حداقل ۶ کاراکتر باشد.', { type: 'warning', slot: '#slot-members' });

    try {
        const { data, error } = await db.functions.invoke('admin-change-password', {
            body: { userId: userId, newPassword: newPass }
        });

        if (error) {
            byteaAlert('خطا در تغییر رمز: ' + error.message, { type: 'error', slot: '#slot-members', title: 'تغییر رمز ناموفق' });
        } else {
            byteaAlert(`رمز عبور کاربر "${username}" با موفقیت تغییر یافت.`, { type: 'success', slot: '#slot-members' });
        }
    } catch (err) {
        byteaAlert('خطای اتصال: ' + err.message, { type: 'error', slot: '#slot-members' });
    }
}

async function createNewUser() {
    const usernameInput = document.getElementById('new-user-name').value.trim().toLowerCase();
    const password = document.getElementById('new-user-pass').value;
    const role = document.getElementById('new-user-role').value;
    
    // Read the responsibility/job-title field value
    const jobTitleInput = document.getElementById('new-user-job');
    const jobTitle = jobTitleInput ? jobTitleInput.value.trim() : '';

    // 1. Validate the inputs (errors out when empty)
    if (!usernameInput || !password) {
        return byteaAlert('نام کاربری و رمز عبور را مشخص کنید.', { type: 'warning', slot: '#slot-create-user' });
    }

    if (!jobTitle) {
        return byteaAlert('لطفاً عنوان شغلی / مسئولیت کاربر را وارد کنید.', { type: 'warning', slot: '#slot-create-user' });
    }

    const email = usernameInput.includes('@') ? usernameInput : `${usernameInput}@nova.local`;

    try {
        // 2. Send the credentials to the Auth system
        const { data: authData, error: authError } = await db.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: usernameInput, role: role, job_title: jobTitle }
            }
        });

        if (authError) return byteaAlert('خطا در ایجاد کاربر: ' + authError.message, { type: 'error', slot: '#slot-create-user', title: 'ساخت حساب ناموفق' });

        // 3. Insert directly into the profiles table
        if (authData && authData.user) {
            const { error: profileError } = await db
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    username: usernameInput,
                    role: role,
                    job_title: jobTitle
                });

            if (profileError) {
                console.error('خطا در ثبت جدول پروفایل:', profileError);
            }
        }

        byteaAlert(`حساب "${usernameInput}" با موفقیت ایجاد شد.`, { type: 'success', slot: '#slot-create-user' });

        // Clear the inputs after a successful insert
        document.getElementById('new-user-name').value = '';
        document.getElementById('new-user-pass').value = '';
        if (jobTitleInput) jobTitleInput.value = '';

        // Reload the users list
        loadUsersManagementSection();
    } catch (e) {
        byteaAlert('خطای غیرمنتظره: ' + e.message, { type: 'error', slot: '#slot-create-user' });
    }
}
// Switch to sequential multi-task mode (several tasks for one person without resetting the menu)
async function createNewTask() {
    const userId = document.getElementById('select-task-user').value;
    const title = document.getElementById('single-task-title').value.trim();
    const taskType = document.getElementById('single-task-type').value;
    const shamsiDateValue = document.getElementById('single-task-date').value.trim();

    if (!userId || !title || !shamsiDateValue) {
        return byteaAlert('تکمیل تمامی فیلدها اجباری است.', { type: 'warning', slot: '#slot-create-task' });
    }

    const { error } = await db.from('robo_tasks').insert({
        user_id: userId, // this id is now the user's UUID from the profiles table
        title: title,
        task_type: taskType,
        due_date: shamsiDateValue,
        status: 'not_started'
    });

    if (!error) {
        byteaAlert('تسک با موفقیت ثبت شد.', { type: 'success', slot: '#slot-create-task' });
        document.getElementById('single-task-title').value = '';
        document.getElementById('single-task-date').value = convertToShamsiString(new Date());
        if (currentUser.role === 'admin') fetchAdminDataFromServer();
    } else {
        byteaAlert('خطایی در دیتابیس رخ داد: ' + error.message, { type: 'error', slot: '#slot-create-task', title: 'ثبت تسک ناموفق' });
    }
}

function isPastDeadline(shamsiDateStr) {
    if (!shamsiDateStr || !shamsiDateStr.includes('/')) return false;
    try {
        const todayStr = convertToShamsiString(new Date());
        return todayStr > shamsiDateStr;
    } catch (e) { return false; }
}

// Helper to open/close a member's task panel (accordion)
window.toggleTaskFold = function (id) {
    const el = document.getElementById(`fold-body-${id}`);
    if (el) el.classList.toggle('hidden');
}

async function loadMemberData() {
    const { data: tasks } = await db.from('robo_tasks').select('*').eq('user_id', currentUser.id).order('due_date', { ascending: true });

    const listUrgent = document.getElementById('list-urgent');
    const listCurrent = document.getElementById('list-current');
    const listArchive = document.getElementById('list-archive');

    listUrgent.innerHTML = ''; listCurrent.innerHTML = ''; listArchive.innerHTML = '';
    const todayShamsi = convertToShamsiString(new Date());

    tasks?.forEach(task => {
        const isOverdue = isPastDeadline(task.due_date);
        const typeLabel = task.task_type || 'ویدیو';
        const farsiStatus = getStatusFarsi(task.status);

        let itemHtml = `<div class="task-item">
                ${task.has_blue_dot ? '<span class="dot dot-blue"></span>' : ''}
                ${task.has_red_dot ? '<span class="dot dot-red"></span>' : ''}
                
                <!-- Clickable header that opens the task-completion section -->
                <div class="task-header-click" onclick="toggleTaskFold('${task.id}')">
                    <h4><span class="task-badge">${typeLabel}</span> ${task.title} <i class="fa fa-chevron-down" style="font-size:11px; margin-right:5px; color:var(--muted);"></i></h4>
                    <div style="font-size:13px; color:var(--muted);">📅 مهلت نهایی (شمسی): <strong style="color:var(--ink);">${task.due_date}</strong> | وضعیت: <span style="color:var(--amber);">${farsiStatus}</span></div>
                </div>`;

        if (task.status === 'rejected' && task.admin_comment) {
            itemHtml += `<div class="msg-box">⚠️ علت رد فعالیت توسط ادمین: ${task.admin_comment}</div>`;
        }

        // The content box that opens when a task is clicked
        itemHtml += `<div id="fold-body-${task.id}" class="task-body-fold hidden">`;

        if ((task.status === 'not_started' || task.status === 'rejected') && !isOverdue) {
            itemHtml += `
                    <input type="text" id="utitle-${task.id}" placeholder="عنوان اختصاصی مطلب شما">
                    <div class="warn-box">کاهش حجم ویدیو آنلاین یا استخراج صوت در صورت نیاز فراموش نشود. حداکثر حجم فایل ۵۰ مگابایت است.</div>
                    <textarea id="ucontent-${task.id}" placeholder="کپشن مورد نظر شما..."></textarea>
                    <div class="file-upload-wrapper">
                        <input type="file" id="file-picker-${task.id}" style="display:none;" onchange="checkAndUploadFile('file-picker-${task.id}', 'ufile-${task.id}', 'up-btn-${task.id}', '${task.id}')">
                        <label id="up-btn-${task.id}" class="file-upload-btn" for="file-picker-${task.id}">📁 انتخاب و آپلود مستقیم فایل در سرور</label>
                    </div>
                    <input type="text" id="ufile-${task.id}" value="" placeholder="لینک فایل آپلود شده (در صورت وجود)" readonly style="background:var(--paper-2); color:var(--amber-tag-text);">
                    <button onclick="submitTask('${task.id}')">ارسال فعالیت جهت بررسی ادمین</button>
                `;
        } else if (task.status === 'approved_published' || task.status === 'approved_draft') {
            itemHtml += `<p style="color: var(--moss); font-size:13px;">✓ این فعالیت تایید شده و غیرقابل ویرایش است.</p>`;
        } else if (isOverdue && task.status !== 'approved_published') {
            itemHtml += `<p style="color: var(--danger); font-size:13px;">⚠️ مهلت ارسال این فعالیت به پایان رسیده است.</p>`;
        }

        itemHtml += `</div></div>`;

        if (task.status === 'approved_published' || task.status === 'approved_draft' || (isOverdue && task.status !== 'rejected')) {
            listArchive.innerHTML += itemHtml;
        } else if (task.due_date === todayShamsi || task.status === 'rejected' || task.is_extended) {
            listUrgent.innerHTML += itemHtml;
        } else {
            listCurrent.innerHTML += itemHtml;
        }
    });
}

window.submitTask = async function (taskId) {
    const uTitle = document.getElementById(`utitle-${taskId}`).value.trim();
    const uContent = document.getElementById(`ucontent-${taskId}`).value.trim();
    const uFile = document.getElementById(`ufile-${taskId}`).value.trim();

    if (!uContent) return byteaAlert('وارد کردن کپشن برای ارسال تسک الزامی است.', { type: 'warning', slot: slotFor(document.getElementById(`ucontent-${taskId}`)) });

    await db.from('robo_tasks').update({
        user_id: currentUser.id,
        user_title: uTitle || 'فعالیت بی‌نام',
        task_content: uContent,
        file_url: uFile || null,
        status: 'pending',
        has_blue_dot: false,
        has_red_dot: false
    }).eq('id', taskId);

    byteaAlert('فعالیت با موفقیت برای مدیریت ارسال شد.', { type: 'success', slot: slotFor(document.getElementById(`ucontent-${taskId}`)) });
    loadMemberData();
}

async function fetchAdminDataFromServer() {
    try {
        // 1. Fetch all tasks
        const { data: tasks, error: tasksError } = await db
            .from('robo_tasks')
            .select('*')
            .order('due_date', { ascending: true });

        if (tasksError) throw tasksError;

        // 2. Fetch all profiles to resolve user names
        const { data: profiles, error: profilesError } = await db
            .from('profiles')
            .select('id, username');

        if (profilesError) throw profilesError;

        // Build a fast id -> username map
        const profileMap = {};
        profiles?.forEach(p => {
            profileMap[p.id] = p.username;
        });

        // 3. Join task data with the user name
        allAdminTasks = (tasks || []).map(task => ({
            ...task,
            profiles: {
                username: profileMap[task.user_id] || 'ناشناس'
            }
        }));

        // 4. Refresh the UI
        loadAdminData();

    } catch (error) {
        console.error("خطا در دریافت تسک‌های ادمین:", error.message || error);
    }
}

function loadAdminData() {
    const todayShamsi = convertToShamsiString(new Date());

    const listToday = document.getElementById('list-admin-today');
    const listFuture = document.getElementById('list-admin-future');
    const listExpired = document.getElementById('list-admin-expired');

    if (!listToday || !listFuture || !listExpired) return;

    listToday.innerHTML = ''; listFuture.innerHTML = ''; listExpired.innerHTML = '';

    allAdminTasks.forEach(task => {
        const isOverdue = isPastDeadline(task.due_date);
        const targetUsername = task.profiles?.username || 'ناشناس';
        const typeLabel = task.task_type || 'ویدیو';
        const farsiStatus = getStatusFarsi(task.status);

        let itemHtml = `<div class="card" style="padding:15px; border-color: var(--line);" id="admin-card-${task.id}">
                <div class="task-meta"><span class="admin-username-badge">عضو: ${targetUsername}</span> | <span class="task-badge" id="badge-val-${task.id}">${typeLabel}</span> <strong id="title-val-${task.id}">تسک: ${task.title}</strong></div>
                <div class="task-meta" style="margin-top:5px; margin-bottom:5px;">📅 مهلت تحویل: <strong style="color:var(--amber);" id="date-val-${task.id}">${task.due_date}</strong> | وضعیت: <span style="color:var(--amber-tag-text);">${farsiStatus}</span></div>`;

        if (task.status === 'pending' || task.status === 'approved_published' || task.status === 'approved_draft' || task.status === 'rejected') {
            if (task.user_title || task.task_content || task.file_url) {
                itemHtml += `
                        <div class="msg-box" style="background: var(--paper); margin-bottom: 10px; color: var(--ink); border-color: var(--line);">
                            <strong>عنوان کاربر:</strong> ${task.user_title || 'بدون عنوان'}<br>
                            <strong>فایل پیوست سرور:</strong> ${task.file_url ? `<a href="${task.file_url}" target="_blank" style="color:var(--moss); font-weight:bold;">📥 مشاهده فایل ضمیمه</a>` : 'فایلی آپلود نشده'}<br>
                            <strong>کپشن ارسالی کاربر (برای کپی روی متن کلیک کنید):</strong>
                            <div class="selectable-caption" title="کلیک کنید تا کل متن انتخاب شود" onclick="document.execCommand('selectAll',false,null)">${task.task_content || 'بدون کپشن'}</div>
                        </div>
                    `;
            }
        }

        itemHtml += `
                <div id="edit-box-${task.id}" class="edit-task-box hidden">
                    <label style="font-size:11px; color:var(--muted);">عنوان جدید تسک:</label>
                    <input type="text" id="edit-title-${task.id}" value="${task.title}">
                    
                    <label style="font-size:11px; color:var(--muted);">نوع جدید فعالیت:</label>
                    <select id="edit-type-${task.id}">
                        <option value="ویدیو" ${typeLabel === 'ویدیو' ? 'selected' : ''}>ویدیو</option>
                        <option value="پادکست" ${typeLabel === 'پادکست' ? 'selected' : ''}>پادکست</option>
                        <option value="پوستر" ${typeLabel === 'پوستر' ? 'selected' : ''}>پوستر / اینفوگرافیک</option>
                        <option value="متن" ${typeLabel === 'متن' ? 'selected' : ''}>متن</option>
                    </select>

                    <label style="font-size:11px; color:var(--muted);">تغییر مستقیم تاریخ مهلت شمسی (فرمت: yyyy/mm/dd):</label>
                    <input type="text" id="edit-date-${task.id}" value="${task.due_date}">
                    
                    <div style="display:flex; gap:5px;">
                        <button class="btn-small" style="background:var(--moss)" onclick="saveEditedTask('${task.id}')">💾 ثبت نهایی تغییرات</button>
                        <button class="btn-small" style="background:var(--muted)" onclick="toggleEditForm('${task.id}')">لغو</button>
                    </div>
                </div>
            `;

        itemHtml += `<div class="btn-group">`;
        if (task.status === 'pending') {
            itemHtml += `
                    <button class="btn-small" style="background:var(--moss)" onclick="reviewTask('${task.id}', 'approved_published')">تایید و انتشار</button>
                    <button class="btn-small" style="background:var(--amber)" onclick="reviewTask('${task.id}', 'approved_draft')">تایید پیش‌نویس</button>
                    <button class="btn-small" style="background:var(--danger)" onclick="rejectPrompt('${task.id}')">❌ رد کردن با دلیل</button>
                `;
        } else {
            itemHtml += `<button class="btn-small" style="background:var(--ink-2);" onclick="reviewTask('${task.id}', 'pending')">↩ برگشت به وضعیت بررسی</button>`;
        }

        itemHtml += `<button class="btn-small" style="background-color: var(--amber); color:var(--white);" onclick="toggleEditForm('${task.id}')">✏️ ویرایش تسک</button>`;
        itemHtml += `<button class="btn-small" style="background-color: var(--danger);" onclick="deleteTaskFromServer('${task.id}')">🗑️ حذف کامل تسک</button>`;
        itemHtml += `</div>`;

        if (isOverdue && task.status !== 'approved_published' && task.status !== 'approved_draft') {
            itemHtml += `
                    <div style="margin-top:10px; border-top:1px solid var(--line); padding-top:10px;">
                        <input type="text" id="extend-${task.id}" placeholder="مثال: 1405/04/20" style="width:70%; display:inline-block; margin-bottom:0; padding:6px; direction:ltr; text-align:right;">
                        <button class="btn-small" style="width:25%;" onclick="extendTask('${task.id}')">تمدید</button>
                    </div>
                `;
            listExpired.innerHTML += itemHtml;
        } else if (task.due_date === todayShamsi || task.status === 'pending' || task.status === 'approved_published' || task.status === 'approved_draft' || task.status === 'rejected') {
            listToday.innerHTML += itemHtml;
        } else {
            listFuture.innerHTML += itemHtml;
        }
    });
}

window.toggleEditForm = function (taskId) {
    const box = document.getElementById(`edit-box-${taskId}`);
    box.classList.toggle('hidden');
}

window.saveEditedTask = async function (taskId) {
    const newTitle = document.getElementById(`edit-title-${taskId}`).value.trim();
    const newType = document.getElementById(`edit-type-${taskId}`).value;
    const newDate = document.getElementById(`edit-date-${taskId}`).value.trim();
    const slot = slotFor(document.getElementById(`admin-card-${taskId}`));

    if (!newTitle || !newDate) return byteaAlert('فیلدها نباید خالی باشند.', { type: 'warning', slot });

    const { error } = await db.from('robo_tasks').update({
        title: newTitle,
        task_type: newType,
        due_date: newDate
    }).eq('id', taskId);

    if (!error) {
        byteaAlert('تسک با موفقیت ویرایش و بروزرسانی شد.', { type: 'success', slot });
        fetchAdminDataFromServer();
    } else {
        byteaAlert('خطا در اعمال تغییرات: ' + error.message, { type: 'error', slot, title: 'ویرایش ناموفق' });
    }
}

window.reviewTask = async function (taskId, newStatus) {
    const slot = slotFor(document.getElementById(`admin-card-${taskId}`));
    await db.from('robo_tasks').update({ status: newStatus }).eq('id', taskId);
    byteaAlert('وضعیت تسک به‌روزرسانی شد.', { type: 'success', slot });
    fetchAdminDataFromServer();
}

window.rejectPrompt = async function (taskId) {
    const comment = prompt('لطفاً دلیل و پیام رد کردن این فعالیت را بنویسید:');
    if (comment) {
        const slot = slotFor(document.getElementById(`admin-card-${taskId}`));
        await db.from('robo_tasks').update({
            status: 'rejected',
            admin_comment: comment,
            has_red_dot: true
        }).eq('id', taskId);
        byteaAlert('فعالیت رد شد و علت آن ثبت گردید.', { type: 'info', slot });
        fetchAdminDataFromServer();
    }
}

window.extendTask = async function (taskId) {
    const extendValue = document.getElementById(`extend-${taskId}`).value.trim();
    const slot = slotFor(document.getElementById(`admin-card-${taskId}`));
    if (!extendValue) return byteaAlert('لطفاً تاریخ تمدید جدید شمسی را وارد کنید.', { type: 'warning', slot });
    await db.from('robo_tasks').update({ due_date: extendValue, is_extended: true, status: 'not_started' }).eq('id', taskId);
    byteaAlert('تسک تمدید شد.', { type: 'success', slot });
    fetchAdminDataFromServer();
}

window.deleteTaskFromServer = async function (taskId) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    const slot = slotFor(document.getElementById(`admin-card-${taskId}`));
    const { error } = await db.from('robo_tasks').delete().eq('id', taskId);
    if (!error) { byteaAlert('تسک با موفقیت حذف گردید.', { type: 'success', slot }); fetchAdminDataFromServer(); }
}

async function searchUserActivity() {
    const term = document.getElementById('search-input').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    if (!term) { resultsDiv.innerHTML = ''; return; }

    const { data: user } = await db.from('profiles').select('id').eq('username', term).single();
    if (!user) { resultsDiv.innerHTML = 'کاربری با این نام پیدا نشد.'; return; }

    const { data: tasks } = await db.from('robo_tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
    resultsDiv.innerHTML = `<h4>تعداد فعالیت‌ها: ${tasks?.length || 0}</h4>`;
    tasks?.forEach(t => {
        const farsiStatus = getStatusFarsi(t.status);
        resultsDiv.innerHTML += `<div style="padding:8px; border-bottom:1px solid var(--line);">• ${t.title} [نوع: ${t.task_type || 'ویدیو'}] [تاریخ: ${t.due_date}] [وضعیت: ${farsiStatus}]</div>`;
    });
}

window.editMemberJob = async function (userId, currentJob) {
    const newJob = prompt('عنوان شغلی / مسئولیت جدید کاربر را وارد کنید:', currentJob);
    if (newJob === null || newJob.trim() === '') return;

    // Update the database
    const { error } = await db
        .from('profiles')
        .update({ job_title: newJob.trim() })
        .eq('id', userId);

    if (error) {
        byteaAlert('خطا در ذخیره در دیتابیس: ' + error.message, { type: 'error', slot: '#slot-members', title: 'ذخیره ناموفق' });
    } else {
        byteaAlert('مسئولیت کاربر با موفقیت در دیتابیس ذخیره شد.', { type: 'success', slot: '#slot-members' });
        // Re-read the table from the database to confirm the write
        loadUsersManagementSection();
    }
};

window.updateMemberRole = async function (userId, username, newRole, selectEl) {
    if (!currentUser || currentUser.role !== 'admin') {
        byteaAlert('فقط مدیر می‌تواند نقش‌ها را تغییر دهد.', { type: 'error', slot: '#slot-members' });
        loadUsersManagementSection();
        return;
    }
    if (userId === currentUser.id) {
        byteaAlert('برای امنیت انجمن، نقش خودت را نمی‌توانی تغییر دهی.', { type: 'warning', slot: '#slot-members' });
        loadUsersManagementSection();
        return;
    }
    if (newRole !== 'admin' && newRole !== 'member') return;
    const label = newRole === 'admin' ? 'مدیر' : 'عضو';
    if (!confirm(`نقش «${username}» به «${label}» تغییر کند؟`)) {
        loadUsersManagementSection();
        return;
    }
    if (selectEl) selectEl.disabled = true;
    const { error } = await db
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
    if (error) {
        byteaAlert('خطا در تغییر نقش: ' + error.message, { type: 'error', slot: '#slot-members', title: 'تغییر نقش ناموفق' });
    } else {
        byteaAlert(`نقش «${username}» به «${label}» تغییر کرد.`, { type: 'success', slot: '#slot-members' });
    }
    loadUsersManagementSection();
};