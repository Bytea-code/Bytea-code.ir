/* Render typed error pages (404/403/401/500/offline/soon) */
(function () {
    'use strict';
    const q = new URLSearchParams(location.search);
    const type = q.get('type') || '404';
    const TYPES = {
        '404': { code: '404', title: 'این صفحه در مخزن نیست', desc: 'آدرسی که دنبالش بودی پیدا نشد؛ شاید تایپو باشد یا صفحه جابه‌جا شده باشد.', accent: '--amber', log: ['GET {path}', '404 not_found', 'hint: check the URL or brew a new route'] },
        '403': { code: '403', title: 'دسترسی‌ات به این بخش نیست', desc: 'این بخش فقط برای مدیران است؛ با حساب مدیر وارد شو.', accent: '--window-close', log: ['GET {path}', '403 forbidden', 'hint: admin role required'] },
        '401': { code: '401', title: 'نشست ورودت معتبر نیست', desc: 'نشست قبلی منقضی یا باطل شده است؛ دوباره وارد شو.', accent: '--ink', log: ['GET {path}', '401 unauthorized', 'hint: sign in again'] },
        '500': { code: '500', title: 'سمت سرور چیزی خراب شد', desc: 'خطایی در سرویس رخ داد؛ چند لحظه بعد دوباره تلاش کن.', accent: '--window-close', log: ['GET {path}', '500 internal_error', 'hint: retry in a moment'] },
        'offline': { code: 'OFF', title: 'اتصال اینترنت قطع است', desc: 'شبکه در دسترس نیست؛ اتصال را بررسی کن و دوباره تلاش کن.', accent: '--code-line-number', log: ['net::offline', 'ERR_INTERNET_DISCONNECTED', 'hint: check Wi-Fi / cable'] },
        'soon': { code: '503', title: 'این بخش هنوز دم نکشیده', desc: 'این قابلیت به‌زودی اضافه می‌شود؛ فعلاً چای بنوش.', accent: '--moss', log: ['GET {path}', '503 coming_soon', 'hint: stay curious'] }
    };
    const t = TYPES[type] || TYPES['404'];
    const app = document.body.dataset.app || '';
    const home = document.body.dataset.home || (app ? app + 'index.html' : '../index.html');
    const path = q.get('path') || (type === '404' ? location.pathname : '') || '/unknown';
    const msg = q.get('msg') || '';
    const back = q.get('back') || '';

    document.documentElement.style.setProperty('--path', 'var(' + t.accent + ')');
    document.title = t.code + ' — ' + t.title + ' | بایتی';

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    const rows = t.log.map((ln, i) => {
        const line = ln.replace('{path}', path);
        const cls = i === 1 ? ' class="kw"' : (i === 2 ? ' class="com"' : '');
        return '<div><em>' + String(i + 1).padStart(2, '0') + '</em><span' + cls + '>' + esc(line) + '</span></div>';
    }).join('');

    document.getElementById('err-root').innerHTML = `
        <div class="err-card">
            <img class="logo-img err-logo" src="${esc(app)}assets/img/logo.png" alt="بایتی">
            <div class="loader-steam" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="err-code" dir="ltr">${t.code}</div>
            <h1 class="err-title">${t.title}</h1>
            <p class="err-desc">${t.desc}</p>
            ${msg ? `<p class="err-msg">${esc(msg)}</p>` : ''}
            ${path ? `<code class="err-path">${esc(path)}</code>` : ''}
            <div class="code-window err-window">
                <div class="window-top"><div class="window-dots"><i></i><i></i><i></i></div><span>bytea://error/${type}</span><span class="window-lock">⌘</span></div>
                <div class="code-content" dir="ltr">${rows}</div>
                <div class="code-footer"><span><i class="status-dot"></i> tea spilled, not data</span><span>${type} · UTF-8</span></div>
            </div>
            <div class="err-actions">
                <button type="button" class="btn btn-amber" id="err-retry">تلاش دوباره</button>
                <a class="btn btn-ink" href="${esc(home)}">صفحهٔ اصلی</a>
                <a class="btn btn-ghost" href="${esc(app)}tracks/frontend.html">مسیرهای یادگیری</a>
            </div>
            <div class="err-foot"><a class="foot-mail" href="mailto:contact@bytea-code.ir">contact@bytea-code.ir</a></div>
        </div>`;
    const socialHost = document.querySelector('body > [data-social]');
    if (socialHost) document.querySelector('.err-foot').prepend(socialHost);
    document.getElementById('err-retry').addEventListener('click', () => {
        if (back) location.href = back;
        else if (history.length > 1) history.back();
        else location.reload();
    });
})();