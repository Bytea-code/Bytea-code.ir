/* ============================================================
   bytea.js — the single logic file of the site
   Sections: syntax highlighting -> navigation/reveal -> publish layer & showcase page
   -> video archive -> template runner -> index join form
   Data lives separately: data-catalog.js (Aparat) and data-extra.js (publications)
   ============================================================ */
window.BYTEA_SUPABASE = {
    url: 'https://srfrzrdfeuprjfzsklxi.supabase.co',
    key: 'sb_publishable_5jWoi-g_R6d0CGqrDPYugg_kghdZZ8-'
};
/* Syntax highlighting — single source for the runner, previews and the builder */
(function (g) {
    'use strict';
    const RULES = {
        html: [
            ['com', /<!--[\s\S]*?-->/],
            ['str', /"[^"\n]*"|'[^'\n]*'/],
            ['tag', /<\/?[a-zA-Z][\w-]*|\/?>/],
            ['attr', /[a-zA-Z-]+(?==)/],
            ['kw', /<!DOCTYPE[^>]*>/i]
        ],
        css: [
            ['com', /\/\*[\s\S]*?\*\//],
            ['str', /"[^"\n]*"|'[^'\n]*'/],
            ['kw', /@[\w-]+|!important/],
            ['num', /#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?(px|rem|em|s|ms|%|vh|vw|fr|deg)?/],
            ['attr', /[a-z-]+(?=\s*:)/],
            ['fn', /[a-z-]+(?=\()/]
        ],
        js: [
            ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
            ['str', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/],
            ['kw', /\b(const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|from|default|async|await|try|catch|throw|switch|case|break|continue|typeof|instanceof|this|null|undefined|true|false)\b/],
            ['num', /\b\d+(\.\d+)?\b/],
            ['fn', /[A-Za-z_$][\w$]*(?=\s*\()/]
        ],
        php: [
            ['com', /\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//],
            ['str', /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/],
            ['kw', /\b(function|return|if|else|elseif|foreach|as|while|for|new|class|public|private|protected|static|try|catch|throw|use|echo|print|require|require_once|include|include_once|array|isset|empty|true|false|null|die|exit)\b/],
            ['var', /\$[A-Za-z_]\w*/],
            ['num', /\b\d+(\.\d+)?\b/],
            ['fn', /[A-Za-z_]\w*(?=\s*\()/],
            ['tag', /<\?php|\?>/]
        ],
        yaml: [
            ['com', /#[^\n]*/],
            ['str', /"[^"\n]*"|'[^'\n]*'/],
            ['kw', /\b(true|false|null|on|off|yes|no)\b/],
            ['attr', /^\s*[\w.-]+(?=:)/m],
            ['num', /\b\d+(\.\d+)?\b/],
            ['tag', /\$\{\{[\s\S]*?\}\}/]
        ],
        docker: [
            ['com', /#[^\n]*/],
            ['str', /"[^"\n]*"|'[^'\n]*'/],
            ['kw', /^(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL|AS)\b/m],
            ['num', /\b\d+(\.\d+)?\b/],
            ['var', /\$\{?\w+\}?/]
        ],
        sql: [
            ['com', /--[^\n]*/],
            ['str', /'[^'\n]*'/],
            ['kw', /\b(SELECT|FROM|WHERE|CREATE|INDEX|ON|EXPLAIN|ANALYZE|AND|OR|ORDER|BY|INSERT|INTO|VALUES|JOIN|LEFT|GROUP|LIMIT)\b/i],
            ['num', /\b\d+\b/]
        ],
        bash: [
            ['com', /#[^\n]*/],
            ['str', /"[^"\n]*"|'[^'\n]*'/],
            ['kw', /^\s*(git|docker|npm|node|cd|echo|curl)\b/m],
            ['fn', /\$\(.*?\)/]
        ],
        http: [
            ['kw', /^(GET|POST|PUT|PATCH|DELETE|HTTP\/[\d.]+)\b/m],
            ['num', /\b[1-5]\d\d\b/],
            ['str', /"[^"\n]*"/],
            ['attr', /^[\w-]+(?=:)/m]
        ]
    };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    function paint(code, lang) {
        const rules = (RULES[lang] || RULES.js).map(([cls, re]) => [cls, new RegExp(re.source, re.flags.includes('m') ? 'gm' : 'g')]);
        const master = new RegExp(rules.map(([, re]) => '(' + re.source + ')').join('|'), 'g');
        let out = '', last = 0, m;
        while ((m = master.exec(code))) {
            out += esc(code.slice(last, m.index));
            let cls = 'str';
            for (let i = 0; i < rules.length; i++) if (m[i + 1] !== undefined) { cls = rules[i][0]; break; }
            out += '<span class="tk-' + cls + '">' + esc(m[0]) + '</span>';
            last = m.index + m[0].length;
            if (!m[0].length) master.lastIndex++;
        }
        return out + esc(code.slice(last));
    }
    g.ByteaHighlight = { paint, esc };
})(typeof window !== 'undefined' ? window : globalThis);
/* ---------- In-page alerts: a replacement for the native alert ----------
   byteaAlert(message, {type, slot, title, sticky, duration})
   Box above the related panel, a close cross, a progress bar for success,
   colors fully from root tokens -> consistent with the light/dark theme */
(function (g) {
    'use strict';
    const TYPES = {
        error: {
            title: 'خطا',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>'
        },
        success: {
            title: 'انجام شد',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m8.3 12.3 2.5 2.5 4.9-5.4"/></svg>'
        },
        warning: {
            title: 'توجه',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.2 2.9 19h18.2Z"/><path d="M12 9.5v4.2"/><path d="M12 16.6v.2"/></svg>'
        },
        info: {
            title: 'یادآوری',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.9"/><path d="M12 7.6v.2"/></svg>'
        }
    };

    function dismiss(el) {
        if (!el || el.dataset.closing) return;
        el.dataset.closing = '1';
        el.style.height = el.offsetHeight + 'px';
        void el.offsetHeight;
        el.classList.add('ba-out');
        el.style.height = '0px';
        setTimeout(() => el.remove(), 340);
    }

    function make(message, opts) {
        const type = TYPES[opts.type] ? opts.type : 'error';
        const t = TYPES[type];
        const auto = opts.sticky ? 0 : (opts.duration != null ? opts.duration : (type === 'success' ? 6000 : 0));
        const el = document.createElement('div');
        el.className = 'ba-alert ba-' + type;
        el.setAttribute('role', type === 'error' ? 'alert' : 'status');
        el.innerHTML =
            '<span class="ba-icon" aria-hidden="true">' + t.icon + '</span>' +
            '<div class="ba-body"><strong class="ba-title"></strong><p class="ba-text"></p></div>' +
            '<button type="button" class="ba-close" aria-label="بستن پیام" title="بستن"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
            (auto ? '<i class="ba-progress" style="animation-duration:' + auto + 'ms"></i>' : '');
        el.querySelector('.ba-title').textContent = opts.title || t.title;
        el.querySelector('.ba-text').textContent = message;
        el.querySelector('.ba-close').addEventListener('click', () => dismiss(el));
        if (auto) {
            const bar = el.querySelector('.ba-progress');
            bar.addEventListener('animationend', () => dismiss(el));
            el.addEventListener('mouseenter', () => { bar.style.animationPlayState = 'paused'; });
            el.addEventListener('mouseleave', () => { bar.style.animationPlayState = 'running'; });
        }
        return el;
    }

    g.byteaAlert = function (message, opts = {}) {
        const slot = typeof opts.slot === 'string' ? document.querySelector(opts.slot) : opts.slot;
        const el = make(message, opts);
        if (slot) {
            slot.querySelectorAll('.ba-alert').forEach(a => a.remove());
            slot.appendChild(el);
        } else {
            let stack = document.getElementById('ba-stack');
            if (!stack) {
                stack = document.createElement('div');
                stack.id = 'ba-stack';
                document.body.appendChild(stack);
            }
            stack.appendChild(el);
        }
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return el;
    };
    g.byteaAlertClear = function (scope) {
        (scope || document).querySelectorAll('.ba-alert').forEach(dismiss);
    };
})(typeof window !== 'undefined' ? window : globalThis);
/* Shared page behaviors: menu, year, progressive reveal */
(function () {
    'use strict';

    const burger = document.querySelector('.burger');
    const menu = document.getElementById('mobileMenu');

    // Theme toggle: sun <-> moon with an animated morph
    const rootEl = document.documentElement;
    const syncThemeMeta = () => {
        const m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', getComputedStyle(rootEl).getPropertyValue('--paper').trim());
    };
    const themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'theme-toggle';
    themeBtn.id = 'theme-toggle';
    themeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><mask id="tt-cut"><rect width="24" height="24" fill="white"/><circle class="tt-cut" cx="17" cy="7" r="6.5" fill="black"/></mask></defs><g class="tt-rays"><path d="M12 1.5v2.5M12 20v2.5M1.5 12h2.5M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></g><circle class="tt-core" cx="12" cy="12" r="7" mask="url(#tt-cut)"/><g class="tt-stars" fill="currentColor"><circle cx="19" cy="8.5" r=".9"/><circle cx="15" cy="3.8" r=".7"/></g></svg>';
    const cta = document.querySelector('.nav-cta');
    if (cta) cta.insertBefore(themeBtn, cta.querySelector('.burger'));
    else { themeBtn.classList.add('theme-toggle-floating'); document.body.appendChild(themeBtn); }
    const syncThemeLabel = () => themeBtn.setAttribute('aria-label', rootEl.getAttribute('data-theme') === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک');
    themeBtn.addEventListener('click', () => {
        const next = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        rootEl.setAttribute('data-theme', next);
        try { localStorage.setItem('bytea-theme', next); } catch (e) { }
        syncThemeLabel();
        syncThemeMeta();
    });
    syncThemeLabel();
    syncThemeMeta();

    // Loading screen: fade out after load + a safety net for slow JavaScript
    const loader = document.getElementById('bytea-loader');
    if (loader) {
        let finished = false;
        const done = () => {
            if (finished) return;
            finished = true;
            loader.classList.add('done');
            setTimeout(() => loader.remove(), 500);
        };
        if (document.readyState === 'complete') setTimeout(done, 200);
        else window.addEventListener('load', () => setTimeout(done, 200));
        setTimeout(done, 4500);
    }
    if (burger && menu) {
        burger.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
        });
        menu.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                menu.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const year = document.getElementById('year');
    if (year) {
        year.textContent = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(new Date());
    }

    const navEl = document.querySelector('.nav');
    if (navEl) {
        const onScroll = () => navEl.classList.toggle('scrolled', window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // Slogan marquee like a news ticker: continuous with no gap at any width
    const stripTrack = document.querySelector('.strip-track');
    if (stripTrack) {
        const groups = [...stripTrack.querySelectorAll('.strip-group')];
        if (groups.length >= 2) {
            const base = groups[0].innerHTML;
            const sizeStrip = () => {
                groups.forEach((g) => { g.innerHTML = base; });
                const gw = groups[0].getBoundingClientRect().width || 1;
                const reps = Math.max(1, Math.ceil(window.innerWidth / gw));
                if (reps > 1) groups.forEach((g) => { g.innerHTML = base.repeat(reps); });
                const width = groups[0].getBoundingClientRect().width;
                stripTrack.style.animationDuration = Math.max(12, Math.round(width / 70)) + 's';
            };
            sizeStrip();
            let rt;
            window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(sizeStrip, 200); });
        }
    }

    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.style.transitionDelay = (en.target.dataset.delay || 0) + 'ms';
                    en.target.classList.add('in');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: .12 });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('in'));
    }
})();
/* Publish layer: merge the published file + local draft, inject items into track pages,
   and render the showcase page (view.html) for new items */
(function () {
    'use strict';
    const H = window.ByteaHighlight;
    const esc = H.esc;
    const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const KEY = 'bytea-extra-draft';

    const published = window.BYTEA_EXTRA || { articles: [], templates: [], videos: [] };
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { draft = null; }
    const merged = draft || published;
    window.BYTEA_EXTRA_MERGED = merged;
    window.ByteaPublish = {
        key: KEY,
        merged: () => merged,
        serialize: (set) => '/* Generated by the Bytea publishing studio — copy this file over assets/static/data-extra.js */\nwindow.BYTEA_EXTRA = ' + JSON.stringify(set, null, 2) + ';\n'
    };

    const PATH_NAMES = { frontend: 'فرانت‌اند', backend: 'بک‌اند', algorithms: 'الگوریتم و داده', devops: 'ابزار و دواپس' };
    const PATH_TOKENS = { frontend: '--path-frontend', backend: '--path-backend', algorithms: '--path-algorithms', devops: '--path-devops' };
    const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
    const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

    /* ---------- Component factory (same language as the track pages) ---------- */
    function articleRow(a, idx, href) {
        return `<a class="article-row" href="${esc(href)}">
            <span class="article-no">${fa(idx).padStart(2, '۰')}</span>
            <span class="article-main">
                <h3>${esc(a.title)}</h3>
                <p>${esc(a.excerpt || '')}</p>
                <span class="article-meta">
                    <span>${CLOCK} ${esc(a.minutes || '۵')} دقیقه مطالعه</span>
                    <span>${esc(a.author || 'عضو انجمن')}</span>
                </span>
            </span>
            <span class="article-go">${ARROW}</span>
        </a>`;
    }
    function tplCard(t, href) {
        const ext = { html: 'html', css: 'css', js: 'js', php: 'php', yaml: 'yml', docker: 'Dockerfile' }[t.lang] || t.lang;
        const rows = (t.code || '').split('\n').slice(0, 7).map((ln, i) =>
            `<div><em>${String(i + 1).padStart(2, '0')}</em>${H.paint(ln, t.lang) || '&nbsp;'}</div>`).join('');
        const live = t.runnable
            ? `<iframe srcdoc="${esc(t.code)}" sandbox="allow-scripts" loading="lazy" tabindex="-1" aria-hidden="true" title="پیش‌نمایش ${esc(t.title)}" hidden></iframe>`
            : '';
        return `<article class="tpl-card">
            <div class="tpl-preview tpl-preview-code">
                <div class="code-window tpl-window">
                    <div class="window-top"><div class="window-dots"><i></i><i></i><i></i></div><span>${esc(t.slug || t.id)}.${ext}</span><span class="window-lock">⌘</span></div>
                    <div class="code-content" dir="ltr">${rows}</div>
                    <div class="code-footer"><span><i class="status-dot"></i> ${t.runnable ? 'ready to run' : 'server-side'}</span><span>${esc(t.lang)} · UTF-8</span></div>
                </div>
                ${live}
                <div class="tpl-view-switch" role="group" aria-label="نمایش قالب">
                    <button type="button" class="active" data-tplview="code">کد</button>
                    ${t.runnable ? '<button type="button" data-tplview="live">پیش‌نمایش</button>' : ''}
                </div>
            </div>
            <div class="tpl-body">
                <h3>${esc(t.title)}</h3>
                <p>${esc(t.desc || '')}</p>
                <div class="tpl-tags">
                    <span class="tpl-tag">${esc(t.lang)}</span>
                    <span class="tpl-tag ${t.runnable ? 'run' : 'server'}">${t.runnable ? 'قابل اجرا در مرورگر' : 'اجرای سمت سرور'}</span>
                </div>
                <div class="tpl-foot">
                    <a href="${esc(href)}">باز کردن و اجرا ${ARROW}</a>
                    <span>${t.runnable ? 'Run + Preview + Console' : 'کد + خروجی سرور'}</span>
                </div>
            </div>
        </article>`;
    }
    window.ByteaComponents = { articleRow, tplCard };

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-tplview]');
        if (!b) return;
        const wrap = b.closest('.tpl-preview');
        wrap.querySelectorAll('[data-tplview]').forEach((x) => x.classList.toggle('active', x === b));
        const win = wrap.querySelector('.tpl-window');
        const fr = wrap.querySelector('iframe');
        if (win) win.hidden = b.dataset.tplview !== 'code';
        if (fr) fr.hidden = b.dataset.tplview !== 'live';
    });

    /* ---------- Injection into track pages ---------- */
    const path = document.body.dataset.path;
    if (path) {
        const arts = (merged.articles || []).filter((a) => a.path === path);
        const tpls = (merged.templates || []).filter((t) => t.path === path);
        const list = document.querySelector('.article-list');
        if (list && arts.length) {
            const base = list.querySelectorAll('.article-row').length;
            list.insertAdjacentHTML('beforeend', arts.map((a, i) => articleRow(a, base + i + 1, 'view.html?type=article&path=' + path + '&id=' + encodeURIComponent(a.id))).join(''));
        }
        const grid = document.querySelector('.tpl-grid');
        if (grid && tpls.length) {
            grid.insertAdjacentHTML('beforeend', tpls.map((t) => tplCard(t, 'view.html?type=template&path=' + path + '&id=' + encodeURIComponent(t.id))).join(''));
        }
        document.querySelectorAll('.meta-chip').forEach((chip) => {
            const i = chip.querySelector('i');
            if (!i) return;
            const txt = chip.textContent;
            if (txt.includes('مقاله')) i.textContent = fa(document.querySelectorAll('.article-row').length);
            if (txt.includes('قالب آماده')) i.textContent = fa(document.querySelectorAll('.tpl-card').length);
            if (txt.includes('ویدیوی آپارات')) i.textContent = fa((window.APARAT_CATALOG ? (window.APARAT_CATALOG[path] || []).length : 0) + (merged.videos || []).filter((v) => v.path === path).length);
        });
    }

    /* ---------- Showcase page for new items ---------- */
    if (document.body.dataset.view) {
        const q = new URLSearchParams(location.search);
        const type = q.get('type'), id = q.get('id'), p = q.get('path') || 'frontend';
        const root = document.getElementById('view-root');
        const item = (merged[type === 'article' ? 'articles' : 'templates'] || []).find((x) => x.id === id);
        document.documentElement.style.setProperty('--path', 'var(' + (PATH_TOKENS[p] || '--amber') + ')');
        if (!item) {
            location.replace('../error.html?type=404&msg=' + encodeURIComponent('آیتم «' + (id || '') + '» در فایل انتشار پیدا نشد.') + '&back=' + encodeURIComponent(p + '.html'));
            return;
        } else if (type === 'article') {
            document.title = item.title + ' — بایتی';
            root.innerHTML = `
                <section class="article-hero"><div class="wrap">
                    <nav class="crumb"><a href="../../index.html">خانه</a>${ARROW}<a href="${p}.html">${esc(PATH_NAMES[p] || p)}</a>${ARROW}<b>مقاله</b></nav>
                    <span class="path-tag">${esc(PATH_NAMES[p] || p)}</span>
                    <h1>${esc(item.title)}</h1>
                    <div class="article-byline">
                        <span><span class="byline-avatar">${esc((item.author || 'ع')[0])}</span> ${esc(item.author || 'عضو انجمن')}</span>
                        <span>${CLOCK} ${esc(item.minutes || '۵')} دقیقه مطالعه</span>
                    </div>
                </div></section>
                <div class="wrap"><article class="prose">${markdown(item.body || '')}</article>
                <nav class="article-nav"><a href="${p}.html"><small>بازگشت</small><b>صفحهٔ مسیر ${esc(PATH_NAMES[p] || p)}</b></a></nav></div>`;
        } else {
            document.title = item.title + ' — قالب آمادهٔ بایتی';
            const outputCol = item.runnable ? `
                <div class="runner-col">
                    <div><div class="pane-head"><span>پیش‌نمایش زنده</span><small>iframe sandbox</small></div>
                    <iframe id="preview-frame" class="preview-frame" sandbox="allow-scripts" title="پیش‌نمایش اجرای کد"></iframe></div>
                    <div><div class="pane-head"><span>کنسول</span><small>خروجی console کد</small></div>
                    <pre id="console-pane" class="console-pane dark-scroll"></pre></div>
                </div>` : `
                <div class="runner-col">
                    <div class="server-note"><span>این کد (${esc(item.lang)}) سمت سرور اجرا می‌شود؛ با زدن اجرا، خروجی مورد انتظار را می‌بینی.</span></div>
                    <div><div class="pane-head"><span>خروجی مورد انتظار سرور</span><small>شبیه‌سازی اجرای واقعی</small></div>
                    <pre id="expected-pane" class="expected-pane dark-scroll"></pre></div>
                </div>`;
            root.innerHTML = `
                <div class="wrap">
                    <div class="tpl-hero">
                        <nav class="crumb"><a href="../../index.html">خانه</a>${ARROW}<a href="${p}.html">${esc(PATH_NAMES[p] || p)}</a>${ARROW}<b>قالب آماده</b></nav>
                        <h1>${esc(item.title)}</h1>
                        <p class="desc">${esc(item.desc || '')}</p>
                        <div class="tpl-badges">
                            <span class="path-tag">${esc(PATH_NAMES[p] || p)}</span>
                            <span class="tpl-tag">${esc(item.lang)}</span>
                            <span class="tpl-tag ${item.runnable ? 'run' : 'server'}">${item.runnable ? 'قابل اجرا و تست در مرورگر' : 'اجرای سمت سرور + خروجی مورد انتظار'}</span>
                        </div>
                    </div>
                    <div class="runner-grid">
                        <div class="runner-col">
                            <div class="editor-bar">
                                <button type="button" id="run-btn" class="btn btn-amber">${item.runnable ? 'اجرا و تست' : 'اجرا و دیدن خروجی'}</button>
                                <button type="button" id="reset-btn" class="bar-btn">بازنشانی</button>
                                <button type="button" id="copy-btn" class="bar-btn">کپی کد</button>
                                <span id="run-status" class="run-status"><i></i>آماده</span>
                            </div>
                            <div class="code-window runner-window">
                                <div class="window-top"><div class="window-dots"><i></i><i></i><i></i></div><span>${esc(item.slug || item.id)}.${{ html: 'html', css: 'css', js: 'js', php: 'php', yaml: 'yml', docker: 'Dockerfile' }[item.lang] || item.lang}</span><span class="window-lock">⌘</span></div>
                                <div class="code-surface">
                                    <div class="gutter" id="code-gutter" aria-hidden="true"></div>
                                    <pre id="code-highlight" class="dark-scroll" aria-hidden="true"></pre>
                                    <textarea id="code-area" class="dark-scroll" spellcheck="false" aria-label="ویرایشگر کد قالب"></textarea>
                                </div>
                                <div class="code-footer"><span><i class="status-dot"></i> ${item.runnable ? 'ready to run' : 'server-side'}</span><span>${esc(item.lang)} · UTF-8</span></div>
                            </div>
                        </div>
                        ${outputCol}
                    </div>
                    ${item.notes && item.notes.length ? `<section class="tpl-notes"><h2>یادداشت‌های نویسنده</h2><ul>${item.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}
                </div>
                <script type="application/json" id="tpl-data">${JSON.stringify({ slug: item.id, lang: item.lang, runnable: !!item.runnable, code: item.code || '', expected: item.expected || [] }).replace(/</g, '\\u003c')}</script>`;
            const s = document.createElement('script');
            s.src = '../assets/static/template.js';
            document.body.appendChild(s);
        }
    }

    /* ---------- Lightweight markdown for article bodies ---------- */
    function markdown(src) {
        const lines = String(src).split('\n');
        const out = [];
        let para = [], list = [], code = null, lang = 'js';
        const flushP = () => { if (para.length) { out.push('<p>' + esc(para.join(' ')) + '</p>'); para = []; } };
        const flushL = () => { if (list.length) { out.push('<ul>' + list.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>'); list = []; } };
        for (const ln of lines) {
            if (code !== null) {
                if (/^```/.test(ln)) { out.push('<pre class="code-block dark-scroll">' + H.paint(code.join('\n'), lang) + '</pre>'); code = null; }
                else code.push(ln);
                continue;
            }
            if (/^```/.test(ln)) { flushP(); flushL(); lang = ln.slice(3).trim() || 'js'; code = []; continue; }
            if (/^##\s+/.test(ln)) { flushP(); flushL(); out.push('<h2>' + esc(ln.replace(/^##\s+/, '')) + '</h2>'); continue; }
            if (/^>\s+/.test(ln)) { flushP(); flushL(); out.push('<div class="tip-box"><span><b>نکته:</b> ' + esc(ln.replace(/^>\s+/, '')) + '</span></div>'); continue; }
            if (/^-\s+/.test(ln)) { flushP(); list.push(ln.replace(/^-\s+/, '')); continue; }
            if (!ln.trim()) { flushP(); flushL(); continue; }
            flushL(); para.push(ln.trim());
        }
        if (code !== null) out.push('<pre class="code-block dark-scroll">' + H.paint(code.join('\n'), lang) + '</pre>');
        flushP(); flushL();
        return out.join('\n');
    }
})();
/* Unified Aparat video archive for all tracks; filter via #path=
   The catalog is built from the live Aparat API (tools/fetch-aparat.mjs)
   Playback uses the official Aparat embed player */
(function () {
    'use strict';
    if (!document.getElementById('video-grid')) return;

    const PATHS = {
        frontend: { name: 'فرانت‌اند', token: '--path-frontend' },
        backend: { name: 'بک‌اند', token: '--path-backend' },
        algorithms: { name: 'الگوریتم و داده', token: '--path-algorithms' },
        devops: { name: 'ابزار و دواپس', token: '--path-devops' }
    };

    const CATALOG = window.APARAT_CATALOG || {};
    const catalogFlat = Object.entries(CATALOG).flatMap(([path, list]) => list.map((v) => ({ ...v, path })));
    const extraVideos = ((window.BYTEA_EXTRA_MERGED || {}).videos || [])
        .filter((v) => v && v.uid && !catalogFlat.some((c) => c.uid === v.uid));
    const VIDEOS = [...catalogFlat, ...extraVideos];

    const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    const dur = (sec) => {
        const m = Math.floor(sec / 60), s = sec % 60;
        return fa(m) + ':' + fa(String(s).padStart(2, '0'));
    };

    const grid = document.getElementById('video-grid');
    const count = document.getElementById('video-count');
    const search = document.getElementById('video-search');
    const chips = [...document.querySelectorAll('.filter-chip')];
    const dialog = document.getElementById('player-dialog');
    const frame = document.getElementById('player-frame');
    const link = document.getElementById('player-link');

    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const param = (k) => hashParams.get(k) || params.get(k);
    let activePath = PATHS[param('path')] ? param('path') : 'all';
    let query = '';

    function posterHTML(v) {
        return `<div class="poster live">
            ${v.poster ? `<img class="poster-img" src="${esc(v.poster)}" alt="" loading="lazy">` : ''}
            <span class="poster-tag">${esc(PATHS[v.path].name)}</span>
            <span class="poster-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>
            <span class="poster-time">${dur(v.duration)}</span>
        </div>`;
    }

    function render() {
        const list = VIDEOS.filter((v) =>
            (activePath === 'all' || v.path === activePath) &&
            (!query || (v.title + ' ' + v.desc + ' ' + v.owner).includes(query))
        );
        chips.forEach((c) => c.classList.toggle('active', c.dataset.path === activePath));
        grid.innerHTML = list.map((v) => `
            <button type="button" class="video-card" data-uid="${esc(v.uid)}" style="--path:var(${PATHS[v.path].token})">
                ${posterHTML(v)}
                <div class="video-card-body">
                    <span class="vc-title">${esc(v.title)}</span>
                    <span class="vc-desc">${esc(v.desc)}</span>
                    <div class="video-card-meta">
                        <span class="path-tag">${esc(PATHS[v.path].name)}</span>
                        <span>${esc(v.owner)}</span>
                        <span>${dur(v.duration)}</span>
                    </div>
                </div>
            </button>`).join('');
        grid.querySelectorAll('.poster-img').forEach((img) => {
            img.addEventListener('error', () => img.remove(), { once: true });
        });
        count.textContent = list.length
            ? `${fa(list.length)} ویدیو از آپارات${activePath !== 'all' ? ' · مسیر ' + PATHS[activePath].name : ' · همهٔ مسیرها'}${query ? ' · جستجو: «' + query + '»' : ''}`
            : 'ویدیویی مطابق فیلتر فعلی پیدا نشد.';
        if (!list.length) grid.innerHTML = '<p class="videos-empty">چای بریز، فیلتر را عوض کن؛ اینجا چیزی نیست. ☕</p>';
    }

    function setURL() {
        const p = new URLSearchParams();
        if (activePath !== 'all') p.set('path', activePath);
        if (dialog.open && frame.dataset.uid) p.set('v', frame.dataset.uid);
        history.replaceState(null, '', location.pathname + location.search + (p.toString() ? '#' + p.toString() : ''));
    }

    function openPlayer(uid) {
        const v = VIDEOS.find((x) => x.uid === uid);
        if (!v) return;
        frame.dataset.uid = v.uid;
        frame.src = v.embed;
        link.href = 'https://www.aparat.com/v/' + v.uid;
        document.getElementById('player-title').textContent = v.title;
        document.getElementById('player-desc').textContent = v.desc;
        document.getElementById('player-meta').innerHTML =
            `<span class="path-tag" style="--path:var(${PATHS[v.path].token})">${esc(PATHS[v.path].name)}</span>
             <span class="path-tag" style="--path:var(${PATHS[v.path].token})">${esc(v.owner)}</span>
             <span class="path-tag" style="--path:var(${PATHS[v.path].token})">${dur(v.duration)}</span>
             <span class="path-tag" style="--path:var(${PATHS[v.path].token})">${esc(v.sdate)}</span>`;
        if (!dialog.open) dialog.showModal();
        setURL();
    }

    chips.forEach((c) => c.addEventListener('click', () => {
        activePath = c.dataset.path;
        render();
        setURL();
    }));

    search.addEventListener('input', () => { query = search.value.trim(); render(); });

    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.video-card');
        if (card) openPlayer(card.dataset.uid);
    });

    document.getElementById('player-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { frame.src = 'about:blank'; delete frame.dataset.uid; setURL(); });

    render();
    const deep = param('v');
    if (deep && VIDEOS.some((v) => v.uid === deep)) openPlayer(deep);
})();
/* Ready-made template runner: live editor, sandboxed run and server output */
(function () {
    'use strict';
    const HOOK = `<script>(function(){
  var send=function(level,args){try{parent.postMessage({__byteaTpl:1,level:level,text:Array.prototype.map.call(args,function(a){try{return typeof a==='object'?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(' ')},'*')}catch(e){}};
  ['log','info','warn','error'].forEach(function(k){var orig=console[k];console[k]=function(){send(k==='info'?'log':k,arguments);orig&&orig.apply(console,arguments)}});
  window.addEventListener('error',function(e){send('error',[e.message])});
  window.addEventListener('unhandledrejection',function(e){send('error',['Promise: '+e.reason])});
  document.addEventListener('DOMContentLoaded',function(){parent.postMessage({__byteaTpl:1,level:'ready',text:''},'*')});
})();<\/script>`;

    function withHook(code) {
        if (/<head[^>]*>/i.test(code)) return code.replace(/<head[^>]*>/i, (m) => m + HOOK);
        return HOOK + code;
    }

    window.ByteaRunnerHook = withHook;
    if (!document.getElementById('tpl-data')) return;

    const data = JSON.parse(document.getElementById('tpl-data').textContent);
    const area = document.getElementById('code-area');
    const highlight = document.getElementById('code-highlight');
    const gutter = document.getElementById('code-gutter');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-btn');
    const status = document.getElementById('run-status');
    const preview = document.getElementById('preview-frame');
    const consolePane = document.getElementById('console-pane');
    const expectedPane = document.getElementById('expected-pane');

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

    /* ---------- Syntax highlighting (shared highlight.js source) ---------- */
    const paint = window.ByteaHighlight.paint;

    /* ---------- Editor synchronization ---------- */
    function sync() {
        const code = area.value;
        highlight.innerHTML = paint(code, data.lang) + '\n';
        const lines = code.split('\n').length;
        gutter.innerHTML = Array.from({ length: lines }, (_, i) => '<div>' + String(i + 1).padStart(2, '0') + '</div>').join('');
        syncScroll();
    }

    function syncScroll() {
        highlight.scrollTop = area.scrollTop;
        highlight.scrollLeft = area.scrollLeft;
        gutter.scrollTop = area.scrollTop;
    }

    area.addEventListener('input', sync);
    area.addEventListener('scroll', syncScroll);
    area.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = area.selectionStart;
            area.setRangeText('  ', s, area.selectionEnd, 'end');
            sync();
        }
    });

    /* ---------- Status and toast ---------- */
    function setStatus(text, mode) {
        status.className = 'run-status' + (mode ? ' ' + mode : '');
        status.innerHTML = '<i></i>' + esc(text);
    }

    let toastTimer;
    function toast(text) {
        document.querySelector('.toast')?.remove();
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = text;
        document.body.appendChild(el);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.remove(), 2200);
    }

    /* ---------- Console ---------- */
    function clearConsole() {
        if (consolePane) consolePane.innerHTML = '<span class="console-empty">کنسول خالی است؛ خروجی کد اینجا می‌نشیند.</span>';
    }

    function logLine(level, text) {
        if (!consolePane) return;
        consolePane.querySelector('.console-empty')?.remove();
        const div = document.createElement('div');
        div.className = 'cl ' + level;
        div.textContent = text;
        consolePane.appendChild(div);
        consolePane.scrollTop = consolePane.scrollHeight;
    }

    window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d || d.__byteaTpl !== 1) return;
        if (d.level === 'ready') { setStatus('اجرا شد؛ پیش‌نمایش زنده است', 'ok'); return; }
        logLine(d.level === 'log' ? '' : d.level, d.text);
    });

    /* ---------- Expected server-side output ---------- */
    let expectedTimer;
    function runExpected() {
        clearTimeout(expectedTimer);
        expectedPane.innerHTML = '';
        setStatus('در حال اجرای سمت سرور…', 'busy');
        data.expected.forEach((line, i) => {
            expectedTimer = setTimeout(() => {
                const div = document.createElement('div');
                div.className = 'cl ' + (line.level || '');
                const t = document.createElement('time');
                t.textContent = line.time || '00:00:0' + i;
                const span = document.createElement('span');
                span.textContent = line.text;
                div.append(t, span);
                expectedPane.appendChild(div);
                expectedPane.scrollTop = expectedPane.scrollHeight;
                if (i === data.expected.length - 1) setStatus('خروجی سرور آماده است', 'ok');
            }, 160 * (i + 1));
        });
    }

    /* ---------- Run ---------- */
    function run() {
        if (data.runnable) {
            clearConsole();
            logLine('sys', 'sandbox: executing ' + data.slug + ' …');
            setStatus('در حال اجرا…', 'busy');
            preview.srcdoc = withHook(area.value);
        } else {
            runExpected();
        }
    }

    runBtn.addEventListener('click', run);

    resetBtn.addEventListener('click', () => {
        clearTimeout(expectedTimer);
        area.value = data.code;
        sync();
        if (data.runnable) {
            clearConsole();
            preview.srcdoc = 'about:blank';
        } else if (expectedPane) {
            expectedPane.innerHTML = '<div class="cl sys"><time>--:--:--</time><span>برای دیدن خروجی، دکمهٔ اجرا را بزن.</span></div>';
        }
        setStatus('کد به حالت اول برگشت');
        toast('کد بازنشانی شد');
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(area.value);
            toast('کد در کلیپ‌بورد کپی شد');
        } catch (e) {
            area.select();
            document.execCommand('copy');
            toast('کد کپی شد');
        }
    });

    /* ---------- Boot ---------- */
    area.value = data.code;
    sync();
    if (data.runnable) {
        clearConsole();
        run();
    } else {
        expectedPane.innerHTML = '<div class="cl sys"><time>--:--:--</time><span>این کد سمت سرور اجرا می‌شود؛ خروجی مورد انتظار پس از اجرا اینجا نمایش داده می‌شود.</span></div>';
        setStatus('آمادهٔ اجرا');
    }
})();
(function () {
    'use strict';
    const form = document.getElementById('joinForm');
    const msgSlot = document.getElementById('slot-join');
    if (!form || !msgSlot) return;
    const nameInput = document.getElementById('join-name');
    const netInput = document.getElementById('join-network');
    const netBtn = document.getElementById('join-net-btn');
    const netLabel = document.getElementById('join-net-label');
    const netMenu = document.getElementById('join-net-menu');
    const idInput = document.getElementById('join-id');
    const prefixEl = document.getElementById('join-prefix');
    const linkInput = document.getElementById('join-link');
    const submitBtn = document.getElementById('join-submit');
    const successBox = document.getElementById('join-success');
    if (!nameInput || !netInput || !netBtn || !netMenu || !idInput || !prefixEl || !linkInput || !submitBtn || !successBox) return;

    const NET = { telegram: { prefix: 't.me/', label: 'تلگرام' }, shad: { prefix: 'shad.ir/', label: 'شاد' }, eitaa: { prefix: 'eitaa.com/', label: 'ایتا' } };
    const WEB3FORMS_KEY = 'b88779ab-ad0a-4b3c-b611-3042033b6495';

    /* ---------- Custom network dropdown ---------- */
    const options = [...netMenu.querySelectorAll('[role="option"]')];
    const openMenu = (open) => {
        netMenu.hidden = !open;
        netBtn.setAttribute('aria-expanded', String(open));
        if (open) (options.find((o) => o.getAttribute('aria-selected') === 'true') || options[0]).focus();
    };
    const pick = (value) => {
        if (!NET[value]) return;
        netInput.value = value;
        netLabel.textContent = NET[value].label;
        prefixEl.textContent = NET[value].prefix;
        options.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.value === value)));
        openMenu(false);
        netBtn.focus();
    };
    netBtn.addEventListener('click', () => openMenu(netMenu.hidden));
    netBtn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(true); }
    });
    options.forEach((o) => {
        o.addEventListener('click', () => pick(o.dataset.value));
        o.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(o.dataset.value); }
            if (e.key === 'Escape') openMenu(false);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const i = options.indexOf(o);
                options[(i + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length].focus();
            }
        });
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.join-net')) openMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !netMenu.hidden) openMenu(false); });
    prefixEl.textContent = NET[netInput.value] ? NET[netInput.value].prefix : NET.telegram.prefix;

    /* ---------- ID and link ---------- */
    const cleanId = (v) => {
        let s = String(v).trim().replace(/^@+/, '');
        s = s.replace(/^https?:\/\//i, '');
        for (const d of Object.values(NET)) {
            if (s.toLowerCase().startsWith(d.prefix)) { s = s.slice(d.prefix.length); break; }
        }
        return s.replace(/^@+/, '').replace(/\/+$/, '').trim();
    };
    const fail = (text, focusEl) => {
        byteaAlert(text, { type: 'error', slot: msgSlot, title: 'عضویت انجام نشد' });
        if (focusEl) focusEl.focus();
    };

    /* ---------- Submit to Web3Forms ---------- */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        byteaAlertClear(msgSlot);
        const name = nameInput.value.trim();
        const id = cleanId(idInput.value);
        if (!name) return fail('نامت را بنویس.', nameInput);
        if (!id || /[\s@]/.test(id)) return fail('آیدی معتبر نیست — فقط خود آیدی را بنویس.', idInput);
        const net = NET[netInput.value] || NET.telegram;
        const link = 'https://' + net.prefix + id;
        linkInput.value = link;
        idInput.value = id;
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ارسال…';
        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: 'عضویت جدید بایتی',
                    from_name: 'bytea site',
                    name: name,
                    network: net.label,
                    social_id: id,
                    link: link,
                    message: 'نام: ' + name + '\nشبکه: ' + net.label + '\nآیدی: ' + id + '\nلینک: ' + link
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) throw new Error(data.message || 'خطای ارسال');
            document.getElementById('js-name').textContent = name;
            document.getElementById('js-net').textContent = net.label;
            document.getElementById('js-link').textContent = link;
            form.hidden = true;
            successBox.hidden = false;
        } catch (err) {
            fail('ارسال انجام نشد: ' + (err.message || 'اتصال را بررسی کن') + ' — دوباره تلاش کن.', submitBtn);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'عضویت';
        }
    });

    document.getElementById('js-copy').addEventListener('click', async () => {
        const link = document.getElementById('js-link').textContent;
        try { await navigator.clipboard.writeText(link); } catch (e) {
            const r = document.createRange(); r.selectNodeContents(document.getElementById('js-link'));
            const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
            document.execCommand('copy'); sel.removeAllRanges();
        }
        const btn = document.getElementById('js-copy');
        btn.textContent = 'کپی شد ✓';
        setTimeout(() => { btn.textContent = 'کپی لینک'; }, 1800);
    });
    document.getElementById('js-again').addEventListener('click', () => {
        successBox.hidden = true;
        form.hidden = false;
        form.reset();
        netInput.value = 'telegram';
        netLabel.textContent = NET.telegram.label;
        prefixEl.textContent = NET.telegram.prefix;
        options.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.value === 'telegram')));
        byteaAlertClear(msgSlot);
        nameInput.focus();
    });
})();

/* Session-aware navigation: when a member is signed in, the "member login" button becomes "my panel" */
(function () {
    'use strict';
    const links = document.querySelectorAll('[data-auth-link]');
    if (!links.length) return;
    const original = new Map();
    links.forEach((link) => original.set(link, { html: link.innerHTML, cls: link.className, label: link.getAttribute('aria-label'), title: link.title }));
    function readSession() {
        try {
            const ref = new URL(window.BYTEA_SUPABASE.url).hostname.split('.')[0];
            const raw = localStorage.getItem('sb-' + ref + '-auth-token');
            if (raw) return JSON.parse(raw);
        } catch (e) { }
        return null;
    }
    function update() {
        const session = readSession();
        const user = session && session.user;
        links.forEach((link) => {
            const o = original.get(link);
            if (!user) {
                link.innerHTML = o.html;
                link.className = o.cls;
                if (o.label === null) link.removeAttribute('aria-label'); else link.setAttribute('aria-label', o.label);
                link.title = o.title;
                return;
            }
            const meta = user.user_metadata || {};
            const name = meta.username || meta.name || (user.email || '').split('@')[0] || 'عضو';
            link.classList.remove('btn', 'btn-ink');
            link.classList.add('nav-account');
            link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span class="nav-account-name"></span><small>پنل من</small>';
            link.querySelector('.nav-account-name').textContent = name;
            link.setAttribute('aria-label', 'پنل ' + name);
            link.title = 'ورود به پنل ' + name;
        });
    }
    update();
    // Back/forward restores the page from bfcache with the old DOM, so re-check the session on every show
    window.addEventListener('pageshow', (e) => { if (e.persisted) update(); });
})();

/* Community social layer: the bottom-most footer layer on every page (Shad and Rubika) */
(function () {
    'use strict';
    const hosts = document.querySelectorAll('[data-social]');
    if (!hosts.length) return;
    const NETWORKS = [
        { key: 'shad', name: 'شاد', handle: 'shad.ir/bytea_code', url: 'https://shad.ir/bytea_code', logo: 'social-shad.svg' },
        { key: 'rubika', name: 'روبیکا', handle: 'rubika.ir/bytea_code', url: 'https://rubika.ir/bytea_code', logo: 'social-rubika.svg' }
    ];
    hosts.forEach((host) => {
        if (host.dataset.socialReady) return;
        host.dataset.socialReady = '1';
        const base = host.dataset.base || '';
        let html = '<div class="social-tiles">';
        NETWORKS.forEach((net) => {
            html += '<a class="social-tile social-' + net.key + '" href="' + net.url + '" target="_blank" rel="noopener noreferrer" title="' + net.name + ' — ' + net.handle + '" aria-label="بایتی در ' + net.name + ' (باز شدن در تب جدید)">'
                + '<span class="social-logo"><img src="' + base + 'assets/img/' + net.logo + '" alt="" loading="lazy"></span>'
                + '<svg class="social-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>'
                + '</a>';
        });
        html += '</div>';
        host.innerHTML = html;
    });
})();