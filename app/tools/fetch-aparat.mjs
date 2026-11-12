/* Builds the video catalog from the live Aparat API
   Run: node tools/fetch-aparat.mjs
   Source: https://www.aparat.com/api/fa/v1/video/video/show/videohash/:uid/watchtype/embed
   and the related list: /api/fa/v1/video/recom/list_v2/videohash/:uid/watchtype/embed */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const API = 'https://www.aparat.com/api/fa/v1/';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', Accept: 'application/json' };

const SEEDS = {
    frontend: ['sDhK4', 'vzayl84', 'kgxv97t'],
    backend: ['aiwywh1', 'ixw96h0', 'gbbn84d'],
    algorithms: ['ZxA6X', 'r69b2z9', 'yyp41ao'],
    devops: ['kahw96s', 'hkw0442', 'p758592']
};
const RELEVANT = {
    frontend: /html|css|فرانت|جاوا ?اسکریپت|javascript|react|طراحی وب/i,
    backend: /node|نود|بک ?اند|php|api|پایتون|python|لاراول|laravel/i,
    algorithms: /ساختمان داده|الگوریتم/i,
    devops: /داکر|docker|git|گیت|ci\/cd|لینوکس|linux|کوبرنتیز/i
};

async function getJSON(url) {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(url + ' => ' + res.status);
    return res.json();
}

const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const embedOf = (uid) => `https://www.aparat.com/video/video/embed/videohash/${uid}/vt/frame`;

function fromShow(a) {
    return {
        uid: a.uid,
        title: clean(a.title, 120),
        desc: clean(a.description, 180),
        duration: Number(a.duration) || 0,
        poster: a.big_poster || a.medium_poster || '',
        owner: a.owner_username || '',
        sdate: a.sdate || '',
        embed: a.frame_src || embedOf(a.uid)
    };
}
function fromRecom(v) {
    return {
        uid: v.uid,
        title: clean(v.title, 120),
        desc: clean(v.description, 180),
        duration: Number(v.duration) || 0,
        poster: v.big_poster || v.medium_poster || '',
        owner: v.username || v.sender_name || '',
        sdate: v.sdate || '',
        embed: v.frame || embedOf(v.uid)
    };
}

const catalog = {};
for (const [slug, seeds] of Object.entries(SEEDS)) {
    const list = [];
    const seen = new Set();
    const push = (v) => { if (v && v.uid && !seen.has(v.uid) && v.title) { seen.add(v.uid); list.push(v); } };
    for (const uid of seeds) {
        try {
            const j = await getJSON(API + 'video/video/show/videohash/' + uid + '/watchtype/embed');
            push(fromShow(j.data.attributes));
        } catch (e) { console.log('seed fail ' + uid + ': ' + e.message); }
    }
    try {
        const j = await getJSON(API + 'video/recom/list_v2/videohash/' + seeds[0] + '/watchtype/embed');
        const related = (j.data.attributes.video_recom || []).filter((v) => RELEVANT[slug].test(v.title || ''));
        related.slice(0, 3).forEach((v) => push(fromRecom(v)));
    } catch (e) { console.log('recom fail ' + slug + ': ' + e.message); }
    catalog[slug] = list.slice(0, 6);
    console.log(slug + ': ' + catalog[slug].length + ' videos');
}

const total = Object.values(catalog).reduce((n, l) => n + l.length, 0);
if (!total) { console.error('هیچ ویدیویی از آپارات دریافت نشد؛ کاتالوگ قبلی حفظ شد.'); process.exit(1); }
const js = '/* Generated from the live Aparat API at ' + new Date().toISOString() + ' — refresh with node tools/fetch-aparat.mjs */\nwindow.APARAT_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n';
fs.writeFileSync(path.join(ROOT, 'assets/static/data-catalog.js'), js);
console.log('catalog written: ' + total + ' videos');