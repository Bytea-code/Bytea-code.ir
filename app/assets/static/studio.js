/* Bytea publishing studio — editing, live preview, queue, and one-click publish
   Publish targets: local draft / project folder (File System Access) / GitHub (Contents API) */
(async function () {
    'use strict';
    const H = window.ByteaHighlight;
    const esc = H.esc;
    const P = window.ByteaPublish;
    const C = window.ByteaComponents;
    const PATH_NAMES = { frontend: 'فرانت‌اند', backend: 'بک‌اند', algorithms: 'الگوریتم و داده', devops: 'ابزار و دواپس' };
    const PATH_TOKENS = { frontend: '--path-frontend', backend: '--path-backend', algorithms: '--path-algorithms', devops: '--path-devops' };
    const KIND_FA = { article: 'مقاله', template: 'قالب', video: 'ویدیو' };
    const GH_KEY = 'bytea-gh-config';
    const HISTORY_KEY = 'bytea-pub-history';
    const DATA_PATH = 'app/assets/static/data-extra.js';
    const $ = (id) => document.getElementById(id);
    const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

    let working = JSON.parse(JSON.stringify(P.merged()));
    let mode = 'article';
    let editingId = null;
    let previewMode = 'component';
    let lastDeleted = null;
    let dirHandle = null;
    let sharedToken = '';

    /* ---------- Access gate: admins only, even via a direct URL ---------- */
    const deny = (denied) => location.replace('../auth/auth.html?next=studio' + (denied ? '&denied=1' : ''));
    if (!window.supabase || !window.BYTEA_SUPABASE) {
        document.getElementById('gate-text').textContent = 'سامانه ورود در دسترس نیست؛ صفحه را دوباره بارگذاری کن.';
        return;
    }
    const sb = window.supabase.createClient(window.BYTEA_SUPABASE.url, window.BYTEA_SUPABASE.key);
    let session = null;
    try { session = (await sb.auth.getSession()).data.session; } catch (e) { session = null; }
    if (!session) {
        // Session handed over from login (fragment; no server and no shared storage)
        const handoff = new URLSearchParams(location.hash.replace(/^#/, '')).get('handoff');
        if (handoff) {
            try {
                const payload = JSON.parse(atob(decodeURIComponent(handoff)));
                const r = await sb.auth.setSession(payload);
                if (!r.error && r.data.session) session = r.data.session;
            } catch (e) { }
            try { history.replaceState(null, '', location.pathname + location.search); }
            catch (e) { if (location.hash) location.hash = ''; }
        }
    }
    if (!session) {
        // If we came back from login and no session is visible, show a message instead of a redirect loop
        if (new URLSearchParams(location.search).get('via') === 'auth') {
            document.querySelector('.gate-spin').style.display = 'none';
            document.getElementById('gate-text').textContent = 'نشست ورود در این صفحه دیده نشد. اگر سایت را با file:// باز کرده‌ای، سایت را روی هاست یا localhost اجرا کن؛ یا از دکمهٔ استودیو در داشبورد وارد شو.';
            const link = document.getElementById('gate-link');
            if (link) link.hidden = false;
            return;
        }
        return deny(false);
    }
    let profile = null;
    let profileError = null;
    try {
        const res = await sb.from('profiles').select('username, role').eq('id', session.user.id);
        profileError = res.error || null;
        profile = res.data && res.data[0] ? res.data[0] : null;
    } catch (e) { profileError = e; }
    if (profileError) {
        location.replace('../error.html?type=500&msg=' + encodeURIComponent('خواندن پروفایل انجام نشد: ' + (profileError.message || profileError)) + '&back=studio.html');
        return;
    }
    if (!profile || profile.role !== 'admin') return deny(true);
    document.getElementById('gate').hidden = true;
    document.querySelector('main').hidden = false;
    document.querySelector('footer').hidden = false;
    document.getElementById('studio-user').innerHTML = '<span class="su-name"></span><span class="su-role">· مدیر</span>';
    document.querySelector('#studio-user .su-name').textContent = profile.username;
    document.getElementById('studio-logout').addEventListener('click', async () => {
        await sb.auth.signOut();
        location.replace('../../index.html');
    });

    /* ---------- Shared admin key (RLS-protected table, no file in the repo) ---------- */
    async function loadSharedSecret() {
        const st = $('gh-shared-status');
        try {
            const { data, error } = await sb.from('studio_secrets').select('value').eq('key', 'github_pat').maybeSingle();
            if (error) throw error;
            sharedToken = data && data.value ? data.value : '';
            st.className = 'run-status' + (sharedToken ? ' ok' : '');
            st.innerHTML = '<i></i>' + (sharedToken ? 'کلید مشترک ادمین‌ها: موجود' : 'کلید مشترک: هنوز ذخیره نشده');
        } catch (e) {
            st.className = 'run-status busy';
            st.innerHTML = '<i></i>جدول رازها آماده نیست؛ SQL ابزار را یک‌بار اجرا کن';
        }
    }
    $('gh-save-shared').addEventListener('click', async () => {
        const v = $('gh-token').value.trim();
        if (!v) { toast('اول کلید را در فیلد کلید بچسبان، بعد ذخیرهٔ مشترک را بزن.'); return; }
        const { error } = await sb.from('studio_secrets').upsert({ key: 'github_pat', value: v, updated_at: new Date().toISOString() });
        if (error) { toast('ذخیره نشد: ' + error.message); return; }
        sharedToken = v;
        $('gh-token').value = '';
        loadSharedSecret();
        toast('کلید مشترک ذخیره شد؛ از این پس هر ادمین با یک کلیک منتشر می‌کند.');
    });

    /* ---------- Toast with an action ---------- */
    let toastTimer;
    function toast(text, actionLabel, actionFn) {
        document.querySelector('.toast')?.remove();
        clearTimeout(toastTimer);
        const el = document.createElement('div');
        el.className = 'toast';
        el.append(document.createTextNode(text));
        if (actionLabel) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = actionLabel;
            b.addEventListener('click', () => { actionFn(); el.remove(); });
            el.appendChild(b);
        }
        document.body.appendChild(el);
        toastTimer = setTimeout(() => el.remove(), actionLabel ? 6000 : 2600);
    }

    /* ---------- Save / export ---------- */
    function save() {
        try {
            localStorage.setItem(P.key, JSON.stringify(working));
        } catch (e) { /* private browsing mode */ }
        $('output-file').value = P.serialize(working);
        renderItems();
        renderStats();
    }
    function renderStats() {
        const n = (k) => (working[k] || []).length;
        $('studio-stats').innerHTML =
            `<span class="path-tag">${fa(n('articles'))} مقاله</span>` +
            `<span class="path-tag">${fa(n('templates'))} قالب</span>` +
            `<span class="path-tag">${fa(n('videos'))} ویدیو</span>` +
            `<span class="tpl-tag run">پیش‌نویس محلی فعال</span>`;
        $('q-stats').textContent = `${fa(n('articles') + n('templates') + n('videos'))} آیتم در صف`;
    }

    /* ---------- Form ---------- */
    function parseDuration(v) {
        const m = String(v).trim().match(/^(\d+):(\d{1,2})$/);
        if (m) return Number(m[1]) * 60 + Number(m[2]);
        return Number(String(v).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;
    }
    function aparatUid(v) {
        const m = String(v).match(/aparat\.com\/v\/([A-Za-z0-9]{4,12})/);
        if (m) return m[1];
        return /^[A-Za-z0-9]{4,12}$/.test(String(v).trim()) ? String(v).trim() : '';
    }
    function readForm() {
        const base = {
            id: $('f-id').value.trim() || editingId || (mode + '-' + Date.now().toString(36)),
            path: $('f-path').value,
            title: $('f-title').value.trim()
        };
        if (mode === 'article') {
            return { ...base, kind: 'article', excerpt: $('f-excerpt').value.trim(), author: $('f-author').value.trim(), minutes: $('f-minutes').value.trim() || '۵', body: $('f-body').value };
        }
        if (mode === 'template') {
            const expected = $('f-expected').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
                const m = l.match(/^\[(ok|warn|error)\]\s*(.*)$/);
                return { time: '00:00:0' + i, level: m ? m[1] : '', text: m ? m[2] : l };
            });
            return { ...base, kind: 'template', desc: $('f-desc').value.trim(), lang: $('f-lang').value, runnable: $('f-runnable').checked, code: $('f-code').value, expected, notes: $('f-notes').value.split('\n').map((l) => l.trim()).filter(Boolean) };
        }
        const uid = aparatUid($('f-url').value);
        return { ...base, kind: 'video', uid, owner: $('f-owner').value.trim(), duration: parseDuration($('f-duration').value), desc: $('f-desc-v').value.trim(), poster: $('f-poster').value.trim(), embed: uid ? 'https://www.aparat.com/video/video/embed/videohash/' + uid + '/vt/frame' : '', sdate: 'تازه‌منتشرشده' };
    }
    function validate(item) {
        if (!item.title) return 'عنوان را بنویس.';
        if (mode === 'template' && !item.code.trim()) return 'کد قالب خالی است.';
        if (mode === 'template' && item.runnable && !/<html[\s>]/i.test(item.code) && !/<!DOCTYPE/i.test(item.code)) return 'برای اجرای زنده، کد باید یک سند HTML کامل باشد.';
        if (mode === 'video' && !item.uid) return 'لینک یا شناسهٔ آپارات معتبر نیست.';
        return '';
    }

    /* ---------- Studio code editor ---------- */
    const codeArea = $('f-code');
    function syncCode() {
        const code = codeArea.value;
        $('s-highlight').innerHTML = H.paint(code, $('f-lang').value) + '\n';
        $('s-gutter').innerHTML = Array.from({ length: code.split('\n').length }, (_, i) => '<div>' + String(i + 1).padStart(2, '0') + '</div>').join('');
        syncCodeScroll();
    }
    function syncCodeScroll() {
        $('s-highlight').scrollTop = codeArea.scrollTop;
        $('s-highlight').scrollLeft = codeArea.scrollLeft;
        $('s-gutter').scrollTop = codeArea.scrollTop;
    }
    codeArea.addEventListener('scroll', syncCodeScroll);
    codeArea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            codeArea.setRangeText('  ', codeArea.selectionStart, codeArea.selectionEnd, 'end');
            syncCode();
        }
    });

    /* ---------- Markdown toolbar ---------- */
    const MD_SNIPPETS = {
        h2: ['\n## عنوان بخش\n', 4, 10],
        list: ['\n- مورد اول\n- مورد دوم\n', 3, 9],
        tip: ['\n> نکتهٔ منتور: ', 14, 14],
        code: ['\n```js\n', 6, 6]
    };
    document.querySelectorAll('.md-tools [data-md]').forEach((b) => b.addEventListener('click', () => {
        const ta = $('f-body');
        const [text, selStart, selEnd] = MD_SNIPPETS[b.dataset.md];
        const at = ta.selectionStart;
        ta.setRangeText(text, at, ta.selectionEnd, 'end');
        if (b.dataset.md === 'code') ta.setRangeText('\n```\n', ta.selectionStart, ta.selectionStart, 'end');
        ta.focus();
        ta.setSelectionRange(at + selStart, at + selEnd);
        updateBodyCount();
        preview();
    }));
    function updateBodyCount() {
        const words = $('f-body').value.trim().split(/\s+/).filter(Boolean).length;
        $('body-count').textContent = `${fa(words)} واژه · ~${fa(Math.max(1, Math.round(words / 180)))} دقیقه`;
    }

    /* ---------- Preview ---------- */
    function preview() {
        const item = readForm();
        const box = $('preview-box');
        const link = $('preview-link');
        box.style.setProperty('--path', 'var(' + PATH_TOKENS[item.path] + ')');
        $('pv-run-btn').hidden = mode !== 'template';
        if (mode === 'article') {
            box.innerHTML = item.title ? C.articleRow(item, 1, '#') : '<p class="videos-empty">عنوان را بنویس تا کامپوننت ساخته شود.</p>';
        } else if (mode === 'template') {
            box.innerHTML = item.title && item.code ? C.tplCard(item, '#') : '<p class="videos-empty">عنوان و کد را بنویس تا کارت قالب ساخته شود.</p>';
        } else {
            const dur = fa(Math.floor(item.duration / 60)) + ':' + fa(String(item.duration % 60).padStart(2, '0'));
            box.innerHTML = item.uid ? `
                <div class="video-card studio-video-card">
                    <div class="poster live">
                        ${item.poster ? `<img class="poster-img" src="${esc(item.poster)}" alt="">` : ''}
                        <span class="poster-tag">${esc(PATH_NAMES[item.path])}</span>
                        <span class="poster-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>
                        <span class="poster-time">${dur}</span>
                    </div>
                    <div class="video-card-body">
                        <span class="vc-title">${esc(item.title || 'بدون عنوان')}</span>
                        <span class="vc-desc">${esc(item.desc)}</span>
                    </div>
                </div>`
                : '<p class="videos-empty">لینک آپارات را بچسبان تا کارت ساخته شود.</p>';
        }
        const inQueue = (working[mode + 's'] || []).some((x) => x.id === item.id);
        const fullURL = mode === 'video'
            ? 'videos.html#path=' + item.path + '&v=' + encodeURIComponent(item.uid)
            : 'view.html?type=' + mode + '&path=' + item.path + '&id=' + encodeURIComponent(item.id);
        link.hidden = !inQueue;
        link.href = fullURL;
        link.textContent = 'باز کردن در تب تازه';
        const full = $('preview-full');
        full.hidden = previewMode !== 'full';
        box.hidden = previewMode !== 'component';
        $('studio-run-area').hidden = !(previewMode === 'run' && mode === 'template');
        if (previewMode === 'full' && inQueue && full.dataset.src !== fullURL) {
            full.dataset.src = fullURL;
            full.src = fullURL;
        }
        if (previewMode === 'run' && mode === 'template') runInStudio();
    }
    document.querySelectorAll('.preview-modes [data-pv]').forEach((b) => b.addEventListener('click', () => {
        previewMode = b.dataset.pv;
        document.querySelectorAll('.preview-modes [data-pv]').forEach((x) => x.classList.toggle('active', x === b));
        preview();
    }));

    /* ---------- Run inside the studio ---------- */
    function studioLog(level, text) {
        const pane = $('studio-console');
        pane.querySelector('.console-empty')?.remove();
        const div = document.createElement('div');
        div.className = 'cl ' + level;
        div.textContent = text;
        pane.appendChild(div);
        pane.scrollTop = pane.scrollHeight;
    }
    window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d || d.__byteaTpl !== 1 || !e.source || e.source !== $('studio-run').contentWindow) return;
        if (d.level === 'ready') {
            $('s-run-status').className = 'run-status ok';
            $('s-run-status').innerHTML = '<i></i>اجرا شد';
            return;
        }
        studioLog(d.level === 'log' ? '' : d.level, d.text);
    });
    function runInStudio() {
        const code = codeArea.value;
        if (!code.trim()) return;
        $('studio-console').innerHTML = '<span class="console-empty">کنسول استودیو…</span>';
        $('s-run-status').className = 'run-status busy';
        $('s-run-status').innerHTML = '<i></i>در حال اجرا…';
        $('studio-run').srcdoc = window.ByteaRunnerHook(code);
    }
    $('s-run').addEventListener('click', runInStudio);

    /* ---------- Queue ---------- */
    function itemState(x) {
        const { idx, kind, ...rest } = x;
        const pub = (window.BYTEA_EXTRA || {})[kind + 's'] || [];
        const found = pub.find((p) => p.id === x.id);
        if (!found) return 'new';
        const { kind: pk, ...prest } = found;
        return JSON.stringify(prest) === JSON.stringify(rest) ? '' : 'edited';
    }
    function renderItems() {
        const q = $('q-search').value.trim();
        const kind = $('q-kind').value;
        const all = [
            ...(working.articles || []).map((x, i) => ({ ...x, kind: 'article', idx: i })),
            ...(working.templates || []).map((x, i) => ({ ...x, kind: 'template', idx: i })),
            ...(working.videos || []).map((x, i) => ({ ...x, kind: 'video', idx: i }))
        ].filter((x) => (kind === 'all' || x.kind === kind) && (!q || (x.title + ' ' + (x.desc || '') + ' ' + (x.excerpt || '')).includes(q)));
        $('items-list').innerHTML = all.length ? all.map((x) => {
            const st = itemState(x);
            const len = (working[x.kind + 's'] || []).length;
            return `
            <div class="item-row" data-kind="${x.kind}" data-id="${esc(x.id)}">
                <span class="kind-badge ${x.kind}">${KIND_FA[x.kind]}</span>
                ${st ? `<span class="item-badge ${st}">${st === 'new' ? 'جدید' : 'ویرایش‌شده'}</span>` : ''}
                <span class="item-title">${esc(x.title)}</span>
                <span class="item-path">${esc(PATH_NAMES[x.path] || x.path)}</span>
                <span class="item-order">
                    <button type="button" class="bar-btn item-up" aria-label="بالا" ${x.idx === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="bar-btn item-down" aria-label="پایین" ${x.idx === len - 1 ? 'disabled' : ''}>↓</button>
                </span>
                <button type="button" class="bar-btn item-dup">تکثیر</button>
                <button type="button" class="bar-btn item-edit">ویرایش</button>
                <button type="button" class="bar-btn item-del">حذف</button>
            </div>`;
        }).join('')
            : '<p class="videos-empty">چیزی مطابق فیلتر نیست؛ اولین محتوایت را بساز.</p>';
    }
    $('q-search').addEventListener('input', renderItems);
    $('q-kind').addEventListener('change', renderItems);

    function loadIntoForm(x) {
        mode = x.kind;
        editingId = x.id;
        syncTabs();
        $('f-path').value = x.path;
        $('f-id').value = x.id;
        $('f-title').value = x.title;
        if (x.kind === 'article') {
            $('f-author').value = x.author || '';
            $('f-minutes').value = x.minutes || '۵';
            $('f-excerpt').value = x.excerpt || '';
            $('f-body').value = x.body || '';
            updateBodyCount();
        } else if (x.kind === 'template') {
            $('f-desc').value = x.desc || '';
            $('f-lang').value = x.lang || 'html';
            $('f-runnable').checked = !!x.runnable;
            $('f-code').value = x.code || '';
            $('f-expected').value = (x.expected || []).map((l) => (l.level ? '[' + l.level + '] ' : '') + l.text).join('\n');
            $('f-notes').value = (x.notes || []).join('\n');
            syncCode();
        } else {
            $('f-url').value = x.uid ? 'https://www.aparat.com/v/' + x.uid : '';
            $('f-owner').value = x.owner || '';
            $('f-duration').value = x.duration || '';
            $('f-desc-v').value = x.desc || '';
            $('f-poster').value = x.poster || '';
        }
        $('add-btn').textContent = 'به‌روزرسانی آیتم';
        preview();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function syncTabs() {
        document.querySelectorAll('.studio-tabs .filter-chip').forEach((b) => {
            const on = b.dataset.mode === mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
        document.querySelectorAll('.s-group').forEach((g) => { g.hidden = g.dataset.group !== mode; });
    }

    $('items-list').addEventListener('click', (e) => {
        const row = e.target.closest('.item-row');
        if (!row) return;
        const kind = row.dataset.kind, id = row.dataset.id;
        const key = kind + 's';
        const arr = working[key] || [];
        const at = arr.findIndex((x) => x.id === id);
        if (at < 0) return;
        if (e.target.closest('.item-del')) {
            lastDeleted = { key, at, item: arr[at] };
            arr.splice(at, 1);
            save(); preview();
            toast('حذف شد.', 'بازگردانی', () => {
                working[lastDeleted.key].splice(Math.min(lastDeleted.at, working[lastDeleted.key].length), 0, lastDeleted.item);
                save(); preview();
            });
            return;
        }
        if (e.target.closest('.item-dup')) {
            const copy = JSON.parse(JSON.stringify(arr[at]));
            copy.id = kind + '-' + Date.now().toString(36);
            copy.title = copy.title + ' (کپی)';
            arr.splice(at + 1, 0, copy);
            save(); preview();
            toast('یک نسخهٔ کپی ساخته شد.');
            return;
        }
        if (e.target.closest('.item-up') && at > 0) { [arr[at - 1], arr[at]] = [arr[at], arr[at - 1]]; save(); return; }
        if (e.target.closest('.item-down') && at < arr.length - 1) { [arr[at + 1], arr[at]] = [arr[at], arr[at + 1]]; save(); return; }
        if (e.target.closest('.item-edit')) loadIntoForm({ ...arr[at], kind });
    });

    /* ---------- JSON import/export ---------- */
    $('export-queue').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(working, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bytea-queue.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('صف به‌صورت JSON دریافت شد.');
    });
    $('import-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            for (const key of ['articles', 'templates', 'videos']) {
                if (!Array.isArray(data[key])) continue;
                working[key] = working[key] || [];
                for (const item of data[key]) {
                    if (!item || !item.id || !item.title) continue;
                    const at = working[key].findIndex((x) => x.id === item.id);
                    if (at >= 0) working[key][at] = item; else working[key].push(item);
                }
            }
            save(); preview();
            toast('صف از JSON ادغام شد.');
        } catch (err) {
            toast('فایل JSON معتبر نیست.');
        }
        e.target.value = '';
    });

    /* ---------- Publish ---------- */
    function pubStatus(text, cls) {
        $('pub-status').className = 'run-status' + (cls ? ' ' + cls : '');
        $('pub-status').innerHTML = '<i></i>' + esc(text);
    }
    function history() {
        try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; }
    }
    function renderHistory() {
        const h = history();
        $('pub-history').innerHTML = h.length ? '<h4>آخرین انتشارها</h4>' + h.slice(0, 5).map((x) =>
            `<div class="pub-row"><span class="pub-where ${x.target}">${x.target === 'github' ? 'گیت‌هاب' : x.target === 'folder' ? 'پوشهٔ پروژه' : 'محلی'}</span><span class="pub-msg">${esc(x.message)}</span><time>${esc(x.at)}</time>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">کامیت</a>` : ''}</div>`
        ).join('') : '';
    }
    function pushHistory(entry) {
        const h = history();
        h.unshift(entry);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 12))); } catch (e) { }
        renderHistory();
    }
    const nowFa = () => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

    $('pub-local').addEventListener('click', () => {
        save();
        pubStatus('روی همین دستگاه منتشر شد', 'ok');
        pushHistory({ target: 'local', at: nowFa(), message: fa((working.articles || []).length + (working.templates || []).length + (working.videos || []).length) + ' آیتم در پیش‌نویس محلی' });
        toast('انتشار محلی انجام شد؛ صفحات سایت را تازه کن.');
    });

    $('pub-folder').addEventListener('click', async () => {
        if (!window.showDirectoryPicker) {
            pubStatus('مرورگر از نوشتن در پوشه پشتیبانی نمی‌کند؛ از گیت‌هاب یا کپی فایل استفاده کن', 'busy');
            toast('این مرورگر File System Access ندارد؛ کروم دسکتاپ پشتیبانی می‌کند.');
            return;
        }
        try {
            pubStatus('در حال نوشتن در پوشه…', 'busy');
            dirHandle = dirHandle || await window.showDirectoryPicker({ mode: 'readwrite' });
            let dir = dirHandle;
            for (const part of ['assets', 'static']) dir = await dir.getDirectoryHandle(part, { create: true });
            const fh = await dir.getFileHandle('data-extra.js', { create: true });
            const w = await fh.createWritable();
            await w.write(P.serialize(working));
            await w.close();
            pubStatus('فایل داده در پوشهٔ پروژه نوشته شد', 'ok');
            pushHistory({ target: 'folder', at: nowFa(), message: 'data-extra.js در پوشهٔ پروژه' });
            toast('کنار پروژه منتشر شد؛ سایت را تازه کن.');
        } catch (err) {
            pubStatus('نوشتن در پوشه انجام نشد: ' + (err.name === 'AbortError' ? 'انتخاب لغو شد' : err.message), 'busy');
        }
    });

    function ghConfig() {
        try { return JSON.parse(localStorage.getItem(GH_KEY) || '{}'); } catch (e) { return {}; }
    }
    function loadGhForm() {
        const c = ghConfig();
        $('gh-owner').value = c.owner || '';
        $('gh-repo').value = c.repo || '';
        $('gh-branch').value = c.branch || 'main';
        $('gh-dir').value = c.dir || '';
    }
    $('gh-save').addEventListener('click', () => {
        const c = { owner: $('gh-owner').value.trim(), repo: $('gh-repo').value.trim(), branch: $('gh-branch').value.trim() || 'main', dir: $('gh-dir').value.trim().replace(/^\/+|\/+$/g, '') };
        try { localStorage.setItem(GH_KEY, JSON.stringify(c)); } catch (e) { }
        toast('تنظیمات مخزن در مرورگر خودت ذخیره شد.');
    });
    function b64utf8(text) {
        const bytes = new TextEncoder().encode(text);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        return btoa(bin);
    }
    $('pub-github').addEventListener('click', async () => {
        const c = { owner: $('gh-owner').value.trim(), repo: $('gh-repo').value.trim(), branch: $('gh-branch').value.trim() || 'main', dir: $('gh-dir').value.trim().replace(/^\/+|\/+$/g, ''), token: $('gh-token').value.trim() || sharedToken };
        if (!c.owner || !c.repo || !c.token) {
            pubStatus('مالک مخزن، نام مخزن و کلید (مشترک یا شخصی) را کامل کن', 'busy');
            toast('کلید مشترک هنوز ذخیره نشده؛ یک ادمین آن را ذخیره کند یا کلید شخصی بده.');
            return;
        }
        const path = (c.dir ? c.dir + '/' : '') + DATA_PATH;
        const api = 'https://api.github.com/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
        const headers = { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' };
        const btn = $('pub-github');
        btn.disabled = true;
        pubStatus('در حال کامیت روی گیت‌هاب…', 'busy');
        try {
            let sha;
            const get = await fetch(api + '?ref=' + encodeURIComponent(c.branch), { headers });
            if (get.ok) sha = (await get.json()).sha;
            else if (get.status !== 404) throw new Error(get.status === 401 ? 'توکن معتبر نیست (401)' : get.status === 404 ? 'مخزن یا مسیر پیدا نشد (404)' : 'خطای گیت‌هاب ' + get.status);
            const message = 'bytea studio: publish ' + fa((working.articles || []).length) + ' articles, ' + fa((working.templates || []).length) + ' templates, ' + fa((working.videos || []).length) + ' videos';
            const put = await fetch(api, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, content: b64utf8(P.serialize(working)), branch: c.branch, ...(sha ? { sha } : {}) })
            });
            const pj = await put.json().catch(() => ({}));
            if (!put.ok) throw new Error(put.status === 401 ? 'توکن معتبر نیست (401)' : put.status === 404 ? 'مخزن/شاخه پیدا نشد یا توکن دسترسی ندارد (404)' : put.status === 409 ? 'تداخل نسخه؛ دوباره بزن (409)' : (pj.message || 'خطای گیت‌هاب ' + put.status));
            pubStatus('روی گیت‌هاب کامیت شد؛ Pages خودش منتشر می‌کند', 'ok');
            pushHistory({ target: 'github', at: nowFa(), message, url: pj.commit && pj.commit.html_url });
            toast('انتشار روی گیت‌هاب انجام شد ☕');
        } catch (err) {
            pubStatus('انتشار ناموفق: ' + err.message, 'busy');
            toast('انتشار ناموفق: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });

    /* ---------- Backups ---------- */
    $('copy-file').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText($('output-file').value); toast('فایل کپی شد.'); }
        catch (e) { $('output-file').select(); document.execCommand('copy'); toast('فایل کپی شد.'); }
    });
    $('download-file').addEventListener('click', () => {
        const blob = new Blob([$('output-file').value], { type: 'text/javascript' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'data-extra.js';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('فایل دریافت شد.');
    });
    $('reset-draft').addEventListener('click', () => {
        try { localStorage.removeItem(P.key); } catch (e) { }
        working = JSON.parse(JSON.stringify(window.BYTEA_EXTRA || { articles: [], templates: [], videos: [] }));
        save(); preview();
        pubStatus('به نسخهٔ منتشرشده برگشتی');
        toast('پیش‌نویس محلی پاک شد.');
    });

    /* ---------- Form events ---------- */
    document.querySelectorAll('.studio-tabs .filter-chip').forEach((b) => b.addEventListener('click', () => {
        mode = b.dataset.mode;
        editingId = null;
        $('add-btn').textContent = 'افزودن به صف';
        syncTabs();
        preview();
    }));
    $('studio-form').addEventListener('input', () => {
        if (mode === 'template') syncCode();
        if (mode === 'article') updateBodyCount();
        preview();
    });
    $('studio-form').addEventListener('submit', (e) => e.preventDefault());
    $('f-lang').addEventListener('change', syncCode);
    $('add-btn').addEventListener('click', () => {
        const item = readForm();
        const err = validate(item);
        if (err) { toast(err); return; }
        const key = mode + 's';
        working[key] = working[key] || [];
        const at = working[key].findIndex((x) => x.id === item.id);
        if (at >= 0) working[key][at] = item; else working[key].push(item);
        editingId = item.id;
        $('f-id').value = item.id;
        $('add-btn').textContent = 'به‌روزرسانی آیتم';
        save(); preview();
        toast('به صف اضافه شد؛ پیش‌نمایش محلی زنده است.');
    });
    $('clear-form-btn').addEventListener('click', () => {
        $('studio-form').reset();
        editingId = null;
        $('add-btn').textContent = 'افزودن به صف';
        syncCode(); updateBodyCount(); preview();
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); $('pub-local').click(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('add-btn').click(); }
    });

    /* ---------- Boot ---------- */
    syncTabs();
    syncCode();
    updateBodyCount();
    loadGhForm();
    loadSharedSecret();
    renderHistory();
    save();
    preview();
})();