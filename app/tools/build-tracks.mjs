/* Builder for Bytea learning-track pages — output: static HTML
   Run: node tools/build-tracks.mjs */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const out = (p, s) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('✓ ' + p); };
const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۳۴۵۶۷۸۹'[d]);
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/static/data-catalog.js'), 'utf8')
    .replace(/^[\s\S]*?window\.APARAT_CATALOG = /, '').replace(/;\s*$/, ''));
const faDur = (sec) => { const m = Math.floor(sec / 60), s = sec % 60; return fa(m) + ':' + fa(String(s).padStart(2, '0')); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

/* Syntax highlighting from the single bytea.js source (highlight section) */
const byteaSrc = fs.readFileSync(path.join(ROOT, 'assets/static/bytea.js'), 'utf8');
new Function(byteaSrc.slice(byteaSrc.indexOf('(function (g) {'), byteaSrc.indexOf('/* Shared page behaviors')))();
const paint = (code, lang) => globalThis.ByteaHighlight.paint(code, lang);

/* ---------- Track data ---------- */
const PATHS = [
    {
        slug: 'frontend', no: '۰۱', name: 'فرانت‌اند', en: 'front-end path', token: '--path-frontend', hours: '۲۴',
        lead: 'از اولین دیو تا کامپوننت قابل تست؛ مسیری که با HTML و CSS ساخت‌یافته شروع می‌شود، با JavaScript مدرن جان می‌گیرد و با React و مدیریت وضعیت به پروژهٔ واقعی می‌رسد.',
        feature: { title: 'شروع مسیر فرانت: از اولین دیو تا اولین کامپوننت', desc: 'نقشهٔ راه مسیر فرانت‌اند بایتی؛ چه چیزی به چه دردی می‌خورد و از کجا شروع کنیم.', duration: '۰۴:۱۲' },
        roadmap: [
            { title: 'HTML را یاد بگیر؛ اسکلت هر صفحه', desc: 'تگ‌ها، ساختار سند، هدینگ‌ها، لینک، تصویر و فرم مقدماتی. هدف: بتوانی یک صفحهٔ سادهٔ معنایی بنویسی.', links: [{ t: 'ویدیوهای فرانت‌اند', href: 'videos.html#path=frontend' }] },
            { title: 'CSS را تمام کن؛ ظاهر و چیدمان', desc: 'رنگ، فونت، باکس‌مدل، Flexbox و Grid و ریسپانسیو. هدف: هر چیدمانی را بدون حدس‌زدن بسازی.', links: [{ t: 'مقالهٔ Grid یا Flexbox', href: 'articles/frontend/grid-vs-flexbox.html' }, { t: 'ویدیوهای فرانت‌اند', href: 'videos.html#path=frontend' }] },
            { title: 'JavaScript را شروع کن؛ جانِ صفحه', desc: 'متغیر، تابع، شرط، حلقه، DOM و رویدادها. هدف: صفحه‌ات به کلیک و تایپ کاربر جواب بدهد.', links: [{ t: 'ویدیوهای فرانت‌اند', href: 'videos.html#path=frontend' }] },
            { title: 'یک فرم دسترس‌پذیر بساز', desc: 'برچسب واقعی، اعلام خطا و مدیریت فوکوس؛ فرم اولین چیزی است که یک کاربر واقعی لمس می‌کند.', links: [{ t: 'مقالهٔ فرم دسترس‌پذیر', href: 'articles/frontend/accessible-forms.html' }] },
            { title: 'با قالب‌های آماده تمرین کن', desc: 'کد آماده را اجرا کن، بخوان و تغییر بده؛ بهترین راه تبدیل دانش به مهارت.', links: [{ t: 'قالب کارت ورود', href: 'templates/frontend/glass-login.html' }, { t: 'قالب ناوبری چسبان', href: 'templates/frontend/sticky-nav.html' }] },
            { title: 'React و پروژهٔ پایانی', desc: 'کامپوننت و مدیریت وضعیت را یاد بگیر و یک سایت شخصی کامل بساز؛ پروژه را به‌عنوان تسک هفتگی در پنل تحویل بده.', links: [{ t: 'مقالهٔ وضعیت در React', href: 'articles/frontend/react-state.html' }, { t: 'ورود به پنل و تحویل پروژه', href: '../auth/auth.html' }] }
        ],
        articles: [
            {
                slug: 'grid-vs-flexbox', title: 'Grid یا Flexbox؛ کدام را کجا استفاده کنیم؟',
                excerpt: 'تفاوت واقعی این دو، «سختی» نیست؛ بُعد چیدمان است. با یک قانون سرانگشتی و دو مثال، انتخاب را برای همیشه یاد بگیر.',
                author: 'سارا احمدی', date: '۱۲ مهر ۱۴۰۵', minutes: '۶',
                blocks: [
                    { p: 'هر بار که یک چیدمان جدید می‌سازیم، همین سؤال برمی‌گردد: Grid بزنم یا Flex؟ جواب کوتاه این است که Flex برای چیدمان یک‌بعدی است (یک ردیف یا یک ستون) و Grid برای چیدمان دوبعدی (ردیف و ستون با هم). اما جواب کاربردی‌تر این است: از محتوا شروع کن، نه از ابزار.' },
                    { h2: 'یک بعد در برابر دو بعد' },
                    { p: 'وقتی آیتم‌ها فقط در یک جهت جریان دارند — مثل نوار ناوبری، ردیف دکمه‌ها یا لیست برچسب‌ها — Flexbox عالی است: اندازه‌ها را بر اساس محتوا تنظیم می‌کند و فاصله‌ها را با gap مدیریت می‌کند. اما وقتی باید هم‌زمان ردیف و ستون را کنترل کنی — مثل گالری کارت‌ها یا چیدمان کل صفحه — Grid به تو اجازه می‌دهد ترک‌ها را یک‌بار تعریف کنی و آیتم‌ها را در نواحی بنشانی.' },
                    { code: '.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n  gap: 1.1rem;\n}\n\n.toolbar {\n  display: flex;\n  align-items: center;\n  gap: .6rem;\n}', lang: 'css' },
                    { h2: 'قانون سرانگشتی' },
                    { ul: ['اگر فقط جهت و فاصله مهم است → Flexbox.', 'اگر جای دقیق آیتم در ردیف و ستون مهم است → Grid.', 'اگر ریسپانسیو بدون مدیاکوئری می‌خواهی → Grid با auto-fit و minmax.', 'این دو رقیب نیستند؛ یک صفحهٔ خوب معمولاً هر دو را با هم دارد.'] },
                    { tip: 'گرید را برای «ساختار صفحه» و فلکس را برای «چیدمان داخل کامپوننت» نگه دار؛ این تقسیم کار، کد را خوانا نگه می‌دارد.' }
                ]
            },
            {
                slug: 'accessible-forms', title: 'فرم دسترس‌پذیر: برچسب، خطا و فوکوس',
                excerpt: 'سه چیزی که یک فرم را از «کارکننده» به «قابل استفاده برای همه» تبدیل می‌کند؛ با کد آماده و چک‌لیست کوتاه.',
                author: 'سارا احمدی', date: '۲۸ مهر ۱۴۰۵', minutes: '۷',
                blocks: [
                    { p: 'فرم‌ها اولین جایی هستند که دسترس‌پذیری خودش را نشان می‌دهد: کاربری که با کیبورد کار می‌کند، کاربری که صفحه‌خوان دارد، و کاربری که روی موبایل با انگشت اشاره تایپ می‌کند. خبر خوب این است که با سه تصمیم ساده، بیشتر راه را رفته‌ای.' },
                    { h2: 'برچسب واقعی، نه placeholder' },
                    { p: 'placeholder بعد از اولین تایپ ناپدید می‌شود و کنتراست پایینی دارد؛ هرگز جای label را نمی‌گیرد. label را با for به id ورودی وصل کن تا کلیک روی برچسب، فیلد را فعال کند و صفحه‌خوان نام فیلد را بخواند.' },
                    { code: '<label for="email">ایمیل</label>\n<input id="email" type="email"\n       aria-describedby="email-error"\n       autocomplete="email">', lang: 'html' },
                    { h2: 'خطا را اعلام کن، نه فقط رنگی' },
                    { p: 'پیام خطا باید به فیلد مرتبط باشد (aria-describedby)، هنگام ظهور اعلام شود (role="alert" یا aria-live) و فقط به رنگ قرمز متکی نباشد؛ متن خطا باید بگوید چه چیزی اشتباه است و چگونه درست می‌شود.' },
                    { ul: ['فوکوس را بعد از submit ناموفق روی اولین فیلد خطادار ببر.', 'حلقهٔ فوکوس (focus ring) را حذف نکن؛ فقط قشنگ‌ترش کن.', 'برای فیلدهای اجباری از required استفاده کن، نه فقط ستارهٔ تزئینی.'] },
                    { tip: 'یک بار فرمت را فقط با کیبورد (Tab و Enter) پر کن؛ هر جا گیر کردی، یک باگ دسترس‌پذیری پیدا کرده‌ای.' }
                ]
            },
            {
                slug: 'react-state', title: 'وضعیت در React: کجا نگه داریم و کجا نه؟',
                excerpt: 'بیشتر باگ‌های وضعیت، باگِ «جای اشتباه» هستند؛ نه باگِ منطق. قانون مالکیت وضعیت را با مثال یاد بگیر.',
                author: 'سارا احمدی', date: '۵ آبان ۱۴۰۵', minutes: '۸',
                blocks: [
                    { p: 'وقتی یک کامپوننت هم دادهٔ سرور را نگه می‌دارد، هم وضعیت باز بودن منو را، هم متن جستجو را، دیر یا زود چیزی همگام‌سازی نمی‌شود. راه‌حل، کتابخانهٔ جدید نیست؛ تفکیک نوع وضعیت است.' },
                    { h2: 'وضعیت سرور در برابر وضعیت UI' },
                    { p: 'داده‌ای که از API می‌آید «وضعیت سرور» است: مالک آن سرور است و تو فقط کشی از آن را داری؛ ابزارهایی مثل React Query یا SWR همین را مدیریت می‌کنند. اما باز بودن مودال، تب فعال و متن تایپ‌شده «وضعیت UI» است و جای طبیعی‌اش state محلی کامپوننت است.' },
                    { code: '// وضعیت UI: محلی و ساده\nconst [open, setOpen] = useState(false);\n\n// وضعیت سرور: کش همگام‌شونده\nconst { data, isLoading } = useQuery({\n  queryKey: ["tasks"],\n  queryFn: fetchTasks,\n});', lang: 'js' },
                    { h2: 'قانون مالکیت' },
                    { ul: ['وضعیت را در پایین‌ترین کامپوننتی نگه دار که به آن نیاز دارد؛ فقط وقتی لازم شد بالا ببر.', 'چیزی که از props قابل محاسبه است، وضعیت جدا نمی‌خواهد.', 'وضعیت سرور را در useState کپی نکن؛ منبع دوم، باگ دوم می‌سازد.'] },
                    { tip: 'قبل از افزودن هر useState بپرس: «این داده از کجا می‌آید و چه کسی مالک آن است؟» اگر جواب «سرور» بود، از کش استفاده کن.' }
                ]
            }
        ],
        templates: [
            {
                slug: 'glass-login', title: 'کارت ورود شیشه‌ای', lang: 'html', runnable: true,
                desc: 'فرم ورود با افکت شیشه‌ای، گرادیان چندتوقفی و نمایش/پنهان‌سازی رمز؛ کاملاً واکنش‌گرا و بدون وابستگی.',
                notes: ['یک فایل HTML مستقل است؛ کافی است ذخیره و در مرورگر باز کنی.', 'رنگ‌ها در متغیرهای CSS خود قالب تعریف شده‌اند تا تغییر تم یک‌جا انجام شود.', 'دکمهٔ چشم، نوع input را بین password و text جابه‌جا می‌کند و aria-pressed را همگام نگه می‌دارد.'],
                code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ورود | کارت شیشه‌ای</title>
<style>
  :root {
    --bg-a: #1d1a33; --bg-b: #43265c; --bg-c: #7a3b52;
    --glass: rgba(255, 255, 255, .09);
    --stroke: rgba(255, 255, 255, .22);
    --text: #f4eefc; --muted: #bdb3d6; --accent: #ffb45c;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    min-height: 100vh; display: grid; place-items: center;
    font-family: Vazirmatn, system-ui, sans-serif; color: var(--text);
    background: linear-gradient(135deg, var(--bg-a), var(--bg-b) 55%, var(--bg-c));
  }
  .card {
    width: min(360px, calc(100% - 40px)); padding: 28px 26px;
    border: 1px solid var(--stroke); border-radius: 20px;
    background: var(--glass); backdrop-filter: blur(18px);
    box-shadow: 0 30px 60px -30px rgba(0, 0, 0, .6);
  }
  h1 { font-size: 1.3rem; margin-bottom: 6px; }
  p.sub { color: var(--muted); font-size: .8rem; margin-bottom: 20px; }
  label { display: block; font-size: .75rem; margin: 12px 0 6px; color: var(--muted); }
  .wrap { position: relative; }
  input {
    width: 100%; padding: 11px 12px; border-radius: 11px;
    border: 1px solid var(--stroke); background: rgba(255, 255, 255, .07);
    color: var(--text); font-family: inherit; font-size: .85rem; outline: none;
  }
  input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255, 180, 92, .25); }
  .eye {
    position: absolute; left: 8px; top: 50%; translate: 0 -50%;
    border: 0; background: none; color: var(--muted); cursor: pointer; font-size: .9rem;
  }
  button.submit {
    width: 100%; margin-top: 20px; padding: 12px; border: 0; border-radius: 11px;
    background: linear-gradient(120deg, var(--accent), #ff8f6b);
    color: #2b1608; font-family: inherit; font-weight: 700; font-size: .9rem; cursor: pointer;
    transition: transform .15s;
  }
  button.submit:hover { transform: translateY(-2px); }
  .msg { margin-top: 12px; font-size: .72rem; color: var(--accent); min-height: 1em; }
</style>
</head>
<body>
  <form class="card" id="f">
    <h1>خوش برگشتی ☕</h1>
    <p class="sub">برای ادامه وارد حسابت شو.</p>
    <label for="u">نام کاربری</label>
    <input id="u" autocomplete="username" placeholder="مثلاً rayan">
    <label for="p">رمز عبور</label>
    <div class="wrap">
      <input id="p" type="password" autocomplete="current-password" placeholder="••••••••">
      <button type="button" class="eye" id="eye" aria-label="نمایش رمز" aria-pressed="false">👁</button>
    </div>
    <button class="submit" type="submit">ورود به پنل</button>
    <p class="msg" id="msg" role="status"></p>
  </form>
<script>
  var eye = document.getElementById('eye');
  var pass = document.getElementById('p');
  eye.addEventListener('click', function () {
    var show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    eye.textContent = show ? '🙈' : '👁';
    eye.setAttribute('aria-pressed', String(show));
  });
  document.getElementById('f').addEventListener('submit', function (e) {
    e.preventDefault();
    var u = document.getElementById('u').value.trim();
    document.getElementById('msg').textContent = u
      ? 'سلام ' + u + '! این یک پیش‌نمایش است؛ احراز هویت واقعی سمت سرور انجام می‌شود.'
      : 'نام کاربری را وارد کن.';
  });
</script>
</body>
</html>`
            },
            {
                slug: 'sticky-nav', title: 'ناوبری چسبان با منوی موبایل', lang: 'html', runnable: true,
                desc: 'هدر چسبان با بلور پس‌زمینه، منوی همبرگری و هایلایت خودکار بخش فعال هنگام اسکرول؛ بدون هیچ کتابخانه‌ای.',
                notes: ['با IntersectionObserver بخش فعال را تشخیص می‌دهد؛ در مرورگرهای قدیمی همهٔ لینک‌ها عادی کار می‌کنند.', 'ارتفاع هدر در متغیر --nav-h تعریف شده تا anchorها زیر آن فرود بیایند.', 'منوی موبایل با کلیک روی لینک بسته می‌شود و aria-expanded همگام می‌ماند.'],
                code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ناوبری چسبان</title>
<style>
  :root { --nav-h: 60px; --paper: #f6efe4; --ink: #181310; --amber: #c87b2c; --line: rgba(24,19,16,.14); }
  * { box-sizing: border-box; margin: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: Vazirmatn, system-ui, sans-serif; background: var(--paper); color: var(--ink); }
  header {
    position: sticky; top: 0; z-index: 10; height: var(--nav-h);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; background: rgba(246, 239, 228, .85);
    backdrop-filter: blur(10px); border-bottom: 1px solid var(--line);
  }
  .logo { font-weight: 800; }
  nav { display: flex; gap: 4px; }
  nav a {
    padding: 8px 12px; border-radius: 9px; text-decoration: none;
    color: var(--ink); font-size: .82rem; transition: background .2s;
  }
  nav a.active { background: var(--ink); color: var(--paper); }
  .burger { display: none; border: 1px solid var(--line); background: none; border-radius: 9px; padding: 8px 10px; cursor: pointer; }
  section { min-height: 70vh; padding: calc(var(--nav-h) + 30px) 24px 40px; scroll-margin-top: var(--nav-h); }
  section:nth-child(odd) { background: rgba(200, 123, 44, .08); }
  h2 { margin-bottom: 10px; }
  p { color: #3d342c; max-width: 60ch; line-height: 1.9; font-size: .9rem; }
  @media (max-width: 640px) {
    .burger { display: block; }
    nav {
      position: absolute; top: var(--nav-h); right: 0; left: 0;
      flex-direction: column; background: var(--paper);
      border-bottom: 1px solid var(--line); padding: 10px 16px; display: none;
    }
    nav.open { display: flex; }
  }
</style>
</head>
<body>
<header>
  <span class="logo">bytea ☕</span>
  <nav id="nav">
    <a href="#one" class="active">بخش یک</a>
    <a href="#two">بخش دو</a>
    <a href="#three">بخش سه</a>
  </nav>
  <button class="burger" id="burger" aria-expanded="false" aria-controls="nav">☰</button>
</header>
<section id="one"><h2>بخش یک</h2><p>اسکرول کن؛ لینک فعال در هدر خودش عوض می‌شود. این رفتار با IntersectionObserver ساخته شده و هزینهٔ محاسباتی ناچیزی دارد.</p></section>
<section id="two"><h2>بخش دو</h2><p>هدر چسبان است و پس‌زمینه‌اش بلور دارد؛ محتوا زیر آن رد می‌شود ولی خوانایی لینک‌ها حفظ می‌ماند.</p></section>
<section id="three"><h2>بخش سه</h2><p>در موبایل، منو جمع می‌شود و با همبرگر باز می‌شود؛ کلیک روی هر لینک، منو را می‌بندد.</p></section>
<script>
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  ['one', 'two', 'three'].forEach(function (id) { io.observe(document.getElementById(id)); });
</script>
</body>
</html>`
            }
        ]
    },
    {
        slug: 'backend', no: '۰۲', name: 'بک‌اند', en: 'back-end path', token: '--path-backend', hours: '۳۰',
        lead: 'APIهایی که دوام می‌آورند؛ از Node.js و الگوهای طراحی تا مدل‌سازی پایگاه‌داده و احراز هویت. اینجا یاد می‌گیری سمت سرور را مثل یک محصول نگه‌داری‌پذیر بسازی.',
        feature: { title: 'طراحی API روی کاغذ، قبل از اولین خط کد', desc: 'منابع، فعل‌ها و کدهای وضعیت؛ جلسهٔ طراحی که خروجی‌اش یک قرارداد خوانا است.', duration: '۰۷:۴۰' },
        roadmap: [
            { title: 'Node.js و HTTP؛ سمت سرور را بشناس', desc: 'درخواست/پاسخ، متدها، کدهای وضعیت و اولین سرور ساده. هدف: بفهمی مرورگر و سرور چگونه حرف می‌زنند.', links: [{ t: 'ویدیوهای بک‌اند', href: 'videos.html#path=backend' }] },
            { title: 'یک REST API تمیز طراحی کن', desc: 'منابع اسم باشند و فعل‌ها HTTP؛ قرارداد را قبل از کد بنویس تا شش ماه بعد هم خوانا بماند.', links: [{ t: 'مقالهٔ طراحی API', href: 'articles/backend/rest-api-design.html' }] },
            { title: 'پایگاه‌داده و ایندکس', desc: 'جدول، کوئری و ایندکس؛ اول اندازه بگیر، بعد بهینه کن. هدف: داده‌ات سریع و درست بماند.', links: [{ t: 'مقالهٔ ایندکس پایگاه‌داده', href: 'articles/backend/db-indexes.html' }, { t: 'ویدیوهای بک‌اند', href: 'videos.html#path=backend' }] },
            { title: 'احراز هویت با JWT', desc: 'توکن، انقضا و بررسی امضا؛ سه اشتباه رایج را یاد بگیر تا امنیت را سوراخ نکنی.', links: [{ t: 'مقالهٔ JWT', href: 'articles/backend/jwt-auth.html' }] },
            { title: 'کد آمادهٔ سرور را اجرا و تحلیل کن', desc: 'router با اعتبارسنجی و اتصال امن PDO؛ خروجی مورد انتظار سرور را قدم‌به‌قدم ببین.', links: [{ t: 'قالب مسیر Express', href: 'templates/backend/express-route.html' }, { t: 'قالب اتصال PDO', href: 'templates/backend/pdo-connect.html' }] },
            { title: 'پروژهٔ پایانی: API کامل با احراز هویت', desc: 'یک API تسک با دیتابیس و ورود بساز و در پنل به‌عنوان تسک هفتگی تحویل بده.', links: [{ t: 'ورود به پنل و تحویل پروژه', href: '../auth/auth.html' }] }
        ],
        articles: [
            {
                slug: 'rest-api-design', title: 'API ای که شش ماه بعد هم خوانا بماند',
                excerpt: 'قرارداد API را قبل از کد بنویس؛ منابع اسم باشند، فعل‌ها HTTP باشد و خطاها ساختار داشته باشند.',
                author: 'نیما رستمی', date: '۱۰ مهر ۱۴۰۵', minutes: '۷',
                blocks: [
                    { p: 'بدترین APIها آن‌هایی نیستند که کند هستند؛ آن‌هایی هستند که هر endpoint یک ساز می‌زند: یک‌جا /getUsers، جای دیگر /user/create و جای سوم /delete_task. شش ماه بعد، خود نویسنده هم باید حدس بزند. راه‌حل، یکنواختی قراردادی است.' },
                    { h2: 'منابع، نه فعل‌ها' },
                    { p: 'در REST، URL نام یک منبع است (اسم، جمع) و فعلِ کار را متد HTTP می‌گوید. این تقسیم کار باعث می‌شود مسیرها قابل حدس باشند و کلاینت بدون خواندن مستندات، ساختار را بفهمد.' },
                    { code: 'GET    /api/tasks          # فهرست\nPOST   /api/tasks          # ایجاد\nGET    /api/tasks/42       # یک تسک\nPATCH  /api/tasks/42       # ویرایش جزئی\nDELETE /api/tasks/42       # حذف', lang: 'http' },
                    { h2: 'کدهای وضعیت، زبان مشترک' },
                    { ul: ['200 برای موفقیت معمولی، 201 برای ایجاد منبع.', '400 خطای ورودی کاربر، 401 نبود احراز هویت، 403 نبود دسترسی.', '404 منبع نیست، 409 تعارض (مثلاً ایمیل تکراری).', '500 یعنی تقصیر سرور است؛ هرگز خطای کاربر را 500 برنگردان.'] },
                    { tip: 'بدنهٔ خطا را هم استاندارد کن: { "error": { "code", "message", "fields" } } تا کلاینت بتواند خطا را به‌صورت ماشین‌خوان پردازش کند.' }
                ]
            },
            {
                slug: 'jwt-auth', title: 'JWT: سه اشتباه رایج که هنوز تکرار می‌شوند',
                excerpt: 'توکن در localStorage، انقضای بی‌نهایت و اعتماد به payload بدون بررسی امضا؛ سه تله‌ای که تقریباً هر پروژه‌ای یک‌بار در آن می‌افتد.',
                author: 'نیما رستمی', date: '۲۴ مهر ۱۴۰۵', minutes: '۸',
                blocks: [
                    { p: 'JWT ابزار خوبی است وقتی درست استفاده شود: یک توکن امضاشده که سرور بدون مراجعه به دیتابیس می‌تواند اعتبارش را بررسی کند. اما همین «بدون دیتابیس» بودن، مسئولیت‌هایی می‌آورد که اگر نادیده بگیری، امنیت را سوراخ می‌کند.' },
                    { h2: 'اشتباه اول: توکن در localStorage' },
                    { p: 'هر اسکریپتی که روی صفحه اجرا شود (حتی یک کتابخانهٔ آلوده) می‌تواند localStorage را بخواند. برای اپ‌های مرورگری، کوکی HttpOnly و Secure انتخاب امن‌تری است چون جاوااسکریپت به آن دسترسی ندارد؛ در عوض باید مراقب CSRF باشی (SameSite=Strict یا Lax کمک می‌کند).' },
                    { code: '// سمت سرور: همیشه امضا و انقضا را بررسی کن\nconst payload = jwt.verify(token, SECRET, {\n  algorithms: ["HS256"],   // اجازهٔ none نده\n  maxAge: "15m",\n});', lang: 'js' },
                    { h2: 'اشتباه دوم و سوم' },
                    { ul: ['توکن بلندمدت بدون چرخش: access token کوتاه (۱۵ دقیقه) + refresh token چرخشی بساز.', 'اعتماد به payload بدون verify: اول امضا، بعد خواندن claims.', 'logout سمت کلاینت کافی نیست؛ refresh را سمت سرور باطل کن.'] },
                    { tip: 'الگوریتم را در verify صریح قفل کن؛ پذیرفتن هر الگوریتمی که توکن ادعا می‌کند، دروازهٔ حملهٔ «alg: none» است.' }
                ]
            },
            {
                slug: 'db-indexes', title: 'ایندکس پایگاه‌داده: کی و روی کدام ستون؟',
                excerpt: 'ایندکس سرعت خواندن را می‌خرد و به نوشتن مالیات می‌دهد؛ با EXPLAIN یاد بگیر کجا بگذاری و کجا نگذاری.',
                author: 'نیما رستمی', date: '۳ آبان ۱۴۰۵', minutes: '۶',
                blocks: [
                    { p: 'ایندکس مثل فهرست آخر کتاب است: پیدا کردن یک ردیف را از «ورق زدن همهٔ صفحه‌ها» به «رفتن مستقیم به صفحهٔ درست» تبدیل می‌کند. اما هر فهرست، هزینهٔ نگه‌داری دارد؛ هر INSERT و UPDATE باید فهرست‌ها را هم به‌روز کند.' },
                    { h2: 'اول اندازه بگیر، بعد ایندکس بزن' },
                    { p: 'قبل از افزودن ایندکس، کوئری کند را با EXPLAIN ببین: اگر Seq Scan روی جدول بزرگ می‌بینی و شرط WHERE روی ستون خاصی فیلتر می‌کند، آن ستون کاندید ایندکس است. ایندکس روی ستونی که در WHERE یا JOIN نیست، تقریباً همیشه هدر دادن است.' },
                    { code: 'EXPLAIN ANALYZE\nSELECT * FROM tasks\nWHERE owner_id = 42 AND status = \'open\'\nORDER BY due_date;', lang: 'sql' },
                    { h2: 'قانون سه‌تایی' },
                    { ul: ['ایندکس مرکب را به ترتیب «برابری اول، بازه آخر» بچین: (owner_id, status, due_date).', 'ستون‌های کم‌تنوع (مثل boolean) به‌تنهایی ایندکس خوبی نیستند.', 'ایندکس‌های استفاده‌نشده را دوره‌ای پاک کن؛ هر کدام مالیات نوشتن می‌دهند.'] },
                    { tip: 'ایندکس را مثل کش ببین: اول کوئری واقعی را اندازه بگیر، بعد بهینه کن؛ حدس زدن ایندکس، گران‌ترین نوع حدس است.' }
                ]
            }
        ],
        templates: [
            {
                slug: 'express-route', title: 'مسیر Express با اعتبارسنجی ورودی', lang: 'js', runnable: false,
                desc: 'یک router تمیز برای منابع تسک: اعتبارسنجی بدنه، کدهای وضعیت درست و middleware خطای مرکزی.',
                notes: ['این کد سمت سرور (Node.js) اجرا می‌شود؛ مرورگر محیط اجرای آن نیست، بنابراین خروجی مورد انتظار سرور نمایش داده می‌شود.', 'الگوی error-handler مرکزی باعث می‌شود همهٔ خطاها یک شکل JSON داشته باشند.', 'اعتبارسنجی دستی نگه داشته شده تا وابستگی اضافه نشود؛ در پروژهٔ واقعی zod یا joi گزینه‌های خوبی‌اند.'],
                expected: [
                    { time: '12:04:01', text: 'POST /api/tasks  body={"title":"تمرین Grid"}' },
                    { time: '12:04:01', level: 'ok', text: '201 Created  {"id":43,"title":"تمرین Grid","status":"open"}' },
                    { time: '12:04:09', text: 'POST /api/tasks  body={"title":""}' },
                    { time: '12:04:09', level: 'warn', text: '400 Bad Request  {"error":{"code":"VALIDATION","fields":{"title":"عنوان الزامی است"}}}' },
                    { time: '12:04:17', text: 'GET /api/tasks/43' },
                    { time: '12:04:17', level: 'ok', text: '200 OK  {"id":43,"title":"تمرین Grid","status":"open"}' }
                ],
                code: `const express = require("express");
const router = express.Router();

// منبع in-memory برای نمونه؛ در پروژهٔ واقعی جای آن دیتابیس است
const tasks = new Map();
let nextId = 1;

function validateTask(body) {
  const fields = {};
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    fields.title = "عنوان الزامی است";
  }
  return Object.keys(fields).length ? fields : null;
}

router.post("/tasks", (req, res) => {
  const fields = validateTask(req.body);
  if (fields) {
    return res.status(400).json({ error: { code: "VALIDATION", fields } });
  }
  const task = { id: nextId++, title: req.body.title.trim(), status: "open" };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

router.get("/tasks/:id", (req, res) => {
  const task = tasks.get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: { code: "NOT_FOUND" } });
  res.json(task);
});

// middleware خطای مرکزی: همهٔ خطاها یک شکل دارند
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "خطای سرور" } });
});

module.exports = router;`
            },
            {
                slug: 'pdo-connect', title: 'اتصال امن PHP به MySQL با PDO', lang: 'php', runnable: false,
                desc: 'اتصال PDO با حالت خطای exception، کوئری آماده (prepared) و پارامترهای bind شده؛ خداحافظی با تزریق SQL.',
                notes: ['PHP سمت سرور اجرا می‌شود؛ خروجی که می‌بینی شبیه‌سازی اجرای واقعی روی سرور است.', 'هرگز مقادیر را مستقیم داخل رشتهٔ SQL نچسبان؛ prepare + execute این کار را امن می‌کند.', 'اطلاعات اتصال را از محیط (getenv) بخوان، نه از کد committed.'],
                expected: [
                    { time: '12:06:02', text: '$ php pdo-connect.php' },
                    { time: '12:06:02', level: 'ok', text: 'اتصال PDO برقرار شد (mysql:host=localhost;dbname=bytea)' },
                    { time: '12:06:02', text: 'اجرای کوئری آماده با پارامتر :status = "open"' },
                    { time: '12:06:03', level: 'ok', text: 'array(2) { [0]=> ["id"=>42, "title"=>"تمرین Grid"] [1]=> ["id"=>43, "title"=>"تمرین Flex"] }' },
                    { time: '12:06:03', level: 'ok', text: 'اتصال بسته شد؛ ۲ ردیف بازگردانده شد.' }
                ],
                code: `<?php
declare(strict_types=1);

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=utf8mb4',
    getenv('DB_HOST') ?: 'localhost',
    getenv('DB_NAME') ?: 'bytea'
);

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, getenv('DB_USER') ?: 'root', getenv('DB_PASS') ?: '', $options);
    echo "اتصال PDO برقرار شد\\n";

    $stmt = $pdo->prepare('SELECT id, title FROM tasks WHERE status = :status ORDER BY id');
    $stmt->execute(['status' => 'open']);
    $rows = $stmt->fetchAll();

    var_export($rows);
    echo "\\n" . count($rows) . " ردیف بازگردانده شد.\\n";
} catch (PDOException $e) {
    // لاگ سمت سرور؛ هرگز جزئیات اتصال را به کاربر نشان نده
    error_log($e->getMessage());
    http_response_code(500);
    echo 'خطای پایگاه‌داده؛ بعداً دوباره تلاش کنید.';
} finally {
    $pdo = null;
}`
            }
        ]
    },
    {
        slug: 'algorithms', no: '۰۳', name: 'الگوریتم و داده', en: 'algorithms path', token: '--path-algorithms', hours: '۲۰',
        lead: 'فکر کردن قبل از تایپ کردن؛ ساختمان داده‌های پرکاربرد، تحلیل پیچیدگی و تمرین‌های حل مسئلهٔ گروهی. مسیری که به تو «چرا»ی هر راه‌حل را یاد می‌دهد.',
        feature: { title: 'پیچیدگی را با چشم ببین: رشد تابع‌ها روی نمودار', desc: 'چرا حلقهٔ تودرتو دشمن پنهان است؟ رسم زندهٔ O(n)، O(n log n) و O(n²).', duration: '۰۶:۵۲' },
        roadmap: [
            { title: 'پیچیدگی زمانی؛ قبل از تایپ فکر کن', desc: 'O(1) تا O(n²) را با چشم ببین؛ بفهم چرا حلقهٔ تودرتو روی دادهٔ بزرگ دشمن است.', links: [{ t: 'مقالهٔ پیچیدگی زمانی', href: 'articles/algorithms/big-o.html' }, { t: 'ویدیوهای الگوریتم', href: 'videos.html#path=algorithms' }] },
            { title: 'هش‌مپ؛ معاوضهٔ حافظه با زمان', desc: 'Map و object، جستجوی O(1) و تله‌های برخورد؛ مسئلهٔ two-sum را از O(n²) به O(n) برسان.', links: [{ t: 'مقالهٔ هش‌مپ', href: 'articles/algorithms/hashmap.html' }] },
            { title: 'بازگشتی فکر کردن', desc: 'حالت پایه، قدم کوچک‌تر و ترکیب؛ سه سؤالی که قبل از نوشتن هر تابع بازگشتی باید جواب بدهی.', links: [{ t: 'مقالهٔ بازگشت', href: 'articles/algorithms/recursion.html' }] },
            { title: 'الگوریتم را زنده ببین', desc: 'quicksort و جستجوی دودویی را قدم‌به‌قدم اجرا کن تا اجرای الگوریتم در headت جا بیفتد.', links: [{ t: 'ویژوالایزر QuickSort', href: 'templates/algorithms/quicksort-visual.html' }, { t: 'جستجوی دودویی', href: 'templates/algorithms/binary-search.html' }] },
            { title: 'تمرین گروهی حل مسئله', desc: 'در جلسات گروهی، مسئله را بلند فکر کن و راه‌حل دیگران را نقد کن؛ سریع‌ترین راه رشد.', links: [{ t: 'ویدیوهای الگوریتم', href: 'videos.html#path=algorithms' }] },
            { title: 'چالش هفتگی پنل', desc: 'هر هفته یک چالش جدید در پنل ابلاغ می‌شود؛ حل کن، تحویل بده و بازخورد منتور را بگیر.', links: [{ t: 'ورود به پنل', href: '../auth/auth.html' }] }
        ],
        articles: [
            {
                slug: 'big-o', title: 'پیچیدگی زمانی را با چشم ببین: O(n) در برابر O(n²)',
                excerpt: 'پیچیدگی، ریاضی ترسناک نیست؛ توصیفِ «با بزرگ شدن ورودی چه بلایی سر زمان می‌آید» است. با نمودار و مثال.',
                author: 'مریم کاویانی', date: '۱۵ مهر ۱۴۰۵', minutes: '۶',
                blocks: [
                    { p: 'وقتی می‌گوییم یک الگوریتم O(n²) است، یعنی اگر ورودی ده برابر شود، زمان تقریباً صد برابر می‌شود. همین یک جمله، بیشترِ تصمیم‌های عملکردی را توضیح می‌دهد: حلقهٔ تودرتو روی دادهٔ بزرگ، بدهیِ پنهان است.' },
                    { h2: 'رشد یعنی چه' },
                    { code: '// O(n): یک عبور\nfor (const x of arr) sum += x;\n\n// O(n²): عبور تودرتو\nfor (const x of arr)\n  for (const y of arr)\n    if (x + y === target) pairs++;', lang: 'js' },
                    { p: 'برای n=1000، حلقهٔ اول هزار قدم برمی‌دارد و حلقهٔ دوم یک میلیون قدم. روی کاغذ هر دو «کار می‌کنند»؛ در production فقط اولی زنده می‌ماند.' },
                    { h2: 'جدول سرانگشتی' },
                    { ul: ['O(1): دسترسی به ایندکس آرایه یا کلید هش‌مپ.', 'O(log n): جستجوی دودویی؛ هر قدم نصف می‌کند.', 'O(n log n): مرتب‌سازی‌های خوب مثل merge sort.', 'O(n²): حلقهٔ تودرتو روی همان داده؛ زنگ خطر برای n بزرگ.'] },
                    { tip: 'قبل از بهینه‌کردن کد، اندازهٔ ورودی واقعی را بپرس؛ O(n²) روی n=50 کاملاً قابل قبول است.' }
                ]
            },
            {
                slug: 'hashmap', title: 'هش‌مپ؛ سریع‌ترین دوست شما و تله‌هایش',
                excerpt: 'چرا جستجو در Map متوسط O(1) است، چه وقت بدترین حالت می‌شود و کجاها نباید از هش‌مپ استفاده کنی.',
                author: 'مریم کاویانی', date: '۳۰ مهر ۱۴۰۵', minutes: '۷',
                blocks: [
                    { p: 'هش‌مپ (در جاوااسکریپت: Map و object) ایدهٔ ساده‌ای دارد: کلید را با تابع هش به یک شماره تبدیل کن و آن شماره را به خانهٔ آرایه نگاشت کن. نتیجه: پیدا کردن یک کلید، بدون گشتن میان بقیهٔ کلیدها.' },
                    { h2: 'چرا متوسط O(1) است' },
                    { code: 'const seen = new Map();\nfor (const x of arr) {\n  if (seen.has(target - x)) return true; // two-sum در O(n)\n  seen.set(x, true);\n}', lang: 'js' },
                    { p: 'مسئلهٔ کلاسیک two-sum با حلقهٔ تودرتو O(n²) است؛ با هش‌مپ، هر عنصر فقط یک‌بار دیده می‌شود و مکملش در O(1) جستجو می‌شود: کل مسئله O(n). این «معاوضهٔ حافظه با زمان» است.' },
                    { h2: 'تله‌ها' },
                    { ul: ['برخورد (collision): اگر هش‌ها بد توزیع شوند، زنجیره‌ها بلند می‌شوند و بدترین حالت O(n) می‌شود.', 'ترتیب: object ترتیب کلیدهای عددی را عوض می‌کند؛ Map ترتیب درج را نگه می‌دارد.', 'کلیدهای مرکب: object کلید را به رشته تبدیل می‌کند؛ Map هر چیزی (حتی object) را کلید می‌پذیرد.'] },
                    { tip: 'هر وقت دیدی دنبال «آیا این مقدار را قبلاً دیده‌ام؟» می‌گردی، اول به هش‌مپ فکر کن؛ معمولاً همان معاوضهٔ حافظه/زمان جواب است.' }
                ]
            },
            {
                slug: 'recursion', title: 'بازگشتی فکر کردن: سه سؤال قبل از نوشتن تابع',
                excerpt: 'بازگشت، «تابعی که خودش را صدا می‌زند» نیست؛ یک قرارداد است: حالت پایه، قدم کوچک‌تر و اعتماد به فراخوانی.',
                author: 'مریم کاویانی', date: '۷ آبان ۱۴۰۵', minutes: '۸',
                blocks: [
                    { p: 'بیشتر آدم‌ها با بازگشت مشکل دارند چون سعی می‌کنند کل درخت فراخوانی را در headشان اجرا کنند. راه درست، فکر کردن قراردادی است: فرض کن فراخوانیِ کوچک‌تر درست کار می‌کند؛ تو فقط یک قدم را بنویس.' },
                    { h2: 'سه سؤال' },
                    { ul: ['حالت پایه چیست؟ کوچک‌ترین ورودی که جوابش بدیهی است.', 'قدم کوچک‌تر چیست؟ چگونه ورودی را به همان حالت نزدیک می‌کنم؟', 'ترکیب چیست؟ جوابِ قدمِ کوچک‌تر را چگونه به جواب فعلی تبدیل می‌کنم؟'] },
                    { code: 'function depth(node) {\n  if (!node) return 0;              // حالت پایه\n  return 1 + Math.max(              // ترکیب\n    depth(node.left),               // قدم کوچک‌تر\n    depth(node.right)\n  );\n}', lang: 'js' },
                    { h2: 'پناهگاه حافظه' },
                    { p: 'هر فراخوانی یک قاب روی پشته می‌گذارد؛ بازگشت عمیق یعنی پشتهٔ عمیق و خطر stack overflow. اگر عمق به اندازهٔ ورودی رشد می‌کند (مثل لیست پیوندی بلند)، نسخهٔ حلقه‌ای یا بازگشت دنباله‌ای (tail) بنویس.' },
                    { tip: 'بازگشت را اول روی کاغذ با n=3 اجرا کن؛ اگر سه قدم اول درست بود، قرارداد درست است.' }
                ]
            }
        ],
        templates: [
            {
                slug: 'quicksort-visual', title: 'مرتب‌سازی سریع با نمایش زنده', lang: 'html', runnable: true,
                desc: 'ویژوالایزر quicksort: میله‌ها، پیوت رنگی و سرعت قابل تنظیم؛ الگوریتم را با چشم ببین تا در headت اجرا شود.',
                notes: ['دکمهٔ «اجرا» آرایهٔ تصادفی را مرتب می‌کند؛ «آرایهٔ جدید» داده را عوض می‌کند.', 'اسلایدر سرعت، تأخیر هر مقایسه را تنظیم می‌کند؛ برای کلاس درس سرعت کم را پیشنهاد می‌کنیم.', 'پیوت نارنجی و بازهٔ فعال روشن‌تر نمایش داده می‌شود.'],
                code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ویژوالایزر QuickSort</title>
<style>
  :root { --bg: #141110; --bar: #5d5b6c; --pivot: #e7a44f; --done: #7e9b68; --text: #d9d2c7; }
  * { box-sizing: border-box; margin: 0; }
  body { background: var(--bg); color: var(--text); font-family: Vazirmatn, system-ui, sans-serif; padding: 20px; }
  h1 { font-size: 1rem; margin-bottom: 4px; }
  p { font-size: .72rem; color: #8e847a; margin-bottom: 14px; }
  .stage { display: flex; align-items: flex-end; gap: 4px; height: 220px; padding: 10px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; }
  .bar { flex: 1; background: var(--bar); border-radius: 4px 4px 0 0; transition: height .12s; }
  .bar.pivot { background: var(--pivot); }
  .bar.done { background: var(--done); }
  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 14px; }
  button { border: 0; border-radius: 9px; padding: 9px 16px; font-family: inherit; font-weight: 700; cursor: pointer; background: var(--pivot); color: #2b1608; }
  button.ghost { background: none; color: var(--text); border: 1px solid rgba(255,255,255,.2); }
  label { font-size: .72rem; display: flex; gap: 8px; align-items: center; }
  input[type=range] { accent-color: var(--pivot); }
  #log { margin-top: 10px; font-size: .7rem; color: #8e847a; min-height: 1.2em; }
</style>
</head>
<body>
<h1>QuickSort زنده</h1>
<p>پیوت نارنجی است؛ میله‌های سبز در جای نهایی‌اند.</p>
<div class="stage" id="stage"></div>
<div class="controls">
  <button id="run">اجرا</button>
  <button id="shuffle" class="ghost">آرایهٔ جدید</button>
  <label>سرعت <input id="speed" type="range" min="10" max="240" value="90"></label>
</div>
<p id="log"></p>
<script>
  var stage = document.getElementById('stage');
  var log = document.getElementById('log');
  var arr = [], bars = [], busy = false;
  function delay() { return new Promise(function (r) { setTimeout(r, 250 - Number(document.getElementById('speed').value)); }); }
  function draw() {
    stage.innerHTML = '';
    bars = arr.map(function (v) {
      var b = document.createElement('div');
      b.className = 'bar'; b.style.height = (v * 2) + 'px';
      stage.appendChild(b); return b;
    });
  }
  function shuffle() {
    if (busy) return;
    arr = Array.from({ length: 28 }, function () { 10 + Math.floor(Math.random() * 95); });
    draw(); log.textContent = 'آرایهٔ تازه آماده است.';
  }
  async function qs(lo, hi) {
    if (lo >= hi) { if (bars[lo]) bars[lo].classList.add('done'); return; }
    var p = arr[hi], i = lo;
    bars[hi].classList.add('pivot');
    log.textContent = 'پیوت = ' + p + ' در بازهٔ [' + lo + ',' + hi + ']';
    for (var j = lo; j < hi; j++) {
      await delay();
      if (arr[j] < p) { var t = arr[i]; arr[i] = arr[j]; arr[j] = t; bars[i].style.height = arr[i] * 2 + 'px'; bars[j].style.height = arr[j] * 2 + 'px'; i++; }
    }
    var t2 = arr[i]; arr[i] = arr[hi]; arr[hi] = t2;
    bars[i].style.height = arr[i] * 2 + 'px'; bars[hi].style.height = arr[hi] * 2 + 'px';
    bars[hi].classList.remove('pivot'); bars[i].classList.add('done');
    await qs(lo, i - 1); await qs(i + 1, hi);
  }
  document.getElementById('run').addEventListener('click', async function () {
    if (busy) return; busy = true;
    await qs(0, arr.length - 1);
    bars.forEach(function (b) { b.classList.add('done'); });
    log.textContent = 'مرتب شد؛ مقایسه‌ها را دیدی، حالا الگوریتم را می‌شناسی.';
    busy = false;
  });
  document.getElementById('shuffle').addEventListener('click', shuffle);
  shuffle();
</script>
</body>
</html>`
            },
            {
                slug: 'binary-search', title: 'جستجوی دودویی قدم‌به‌قدم', lang: 'html', runnable: true,
                desc: 'آرایهٔ مرتب، هدف دلخواه و نمایش زندهٔ lo/mid/hi؛ هر قدم نصف شدن بازه را روی چیپ‌ها می‌بینی.',
                notes: ['عدد هدف را عوض کن و «قدم بعد» را بزن؛ بازهٔ فعال و mid رنگی می‌شوند.', 'لاگ پایین، تعداد قدم‌ها را می‌شمارد تا شهود log n ساخته شود.', 'اگر هدف موجود نباشد، الگوریتم با بازهٔ خالی تمام می‌شود و پیام درست می‌دهد.'],
                code: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>جستجوی دودویی</title>
<style>
  :root { --bg: #141110; --text: #d9d2c7; --dim: #5d5b6c; --amber: #e7a44f; --moss: #7e9b68; }
  * { box-sizing: border-box; margin: 0; }
  body { background: var(--bg); color: var(--text); font-family: Vazirmatn, system-ui, sans-serif; padding: 20px; }
  h1 { font-size: 1rem; margin-bottom: 12px; }
  .row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .chip { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 9px; border: 1px solid rgba(255,255,255,.14); font-family: monospace; font-size: .8rem; color: var(--dim); }
  .chip.in { color: var(--text); border-color: rgba(231,164,79,.5); }
  .chip.mid { background: var(--amber); color: #2b1608; border-color: var(--amber); font-weight: 700; }
  .chip.hit { background: var(--moss); color: #10200c; border-color: var(--moss); }
  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  input { width: 80px; padding: 8px; border-radius: 9px; border: 1px solid rgba(255,255,255,.2); background: none; color: var(--text); font-family: monospace; }
  button { border: 0; border-radius: 9px; padding: 9px 16px; background: var(--amber); color: #2b1608; font-family: inherit; font-weight: 700; cursor: pointer; }
  button.ghost { background: none; color: var(--text); border: 1px solid rgba(255,255,255,.2); }
  #log { margin-top: 12px; font-size: .72rem; color: #8e847a; min-height: 1.4em; }
</style>
</head>
<body>
<h1>جستجوی دودویی روی آرایهٔ مرتب</h1>
<div class="row" id="row"></div>
<div class="controls">
  <label>هدف: <input id="target" type="number" value="37"></label>
  <button id="step">قدم بعد</button>
  <button id="reset" class="ghost">شروع دوباره</button>
</div>
<p id="log"></p>
<script>
  var arr = [2, 5, 8, 12, 16, 23, 37, 41, 50, 58, 63, 71, 80, 84, 92];
  var lo, hi, steps, found;
  var row = document.getElementById('row');
  var log = document.getElementById('log');
  function draw(mid, hit) {
    row.innerHTML = '';
    arr.forEach(function (v, i) {
      var c = document.createElement('div');
      c.className = 'chip' + (i >= lo && i <= hi ? ' in' : '') + (i === mid ? ' mid' : '') + (hit && i === mid ? ' hit' : '');
      c.textContent = v;
      row.appendChild(c);
    });
  }
  function reset() {
    lo = 0; hi = arr.length - 1; steps = 0; found = false;
    draw(-1, false);
    log.textContent = 'بازهٔ اولیه: [0,' + hi + '] — هدف را وارد کن و قدم بزن.';
  }
  document.getElementById('step').addEventListener('click', function () {
    if (found || lo > hi) { log.textContent = 'جستجو تمام شده؛ شروع دوباره را بزن.'; return; }
    var target = Number(document.getElementById('target').value);
    var mid = Math.floor((lo + hi) / 2);
    steps++;
    if (arr[mid] === target) { found = true; draw(mid, true); log.textContent = 'پیدا شد در ایندکس ' + mid + ' با ' + steps + ' قدم (log₂ 15 ≈ 4).'; return; }
    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
    draw(mid, false);
    log.textContent = 'قدم ' + steps + ': mid=' + mid + ' (' + arr[mid] + ') → بازهٔ جدید [' + lo + ',' + hi + ']';
    if (lo > hi) log.textContent += ' — بازه خالی شد؛ هدف موجود نیست.';
  });
  document.getElementById('reset').addEventListener('click', reset);
  reset();
</script>
</body>
</html>`
            }
        ]
    },
    {
        slug: 'devops', no: '۰۴', name: 'ابزار و دواپس', en: 'devops path', token: '--path-devops', hours: '۱۸',
        lead: 'کدت را به دست کاربر برسان؛ Git و کار تیمی، تست خودکار و کیفیت کد، و CI/CD با داکر. مسیری که فاصلهٔ «روی ماشین من کار می‌کند» تا production را پر می‌کند.',
        feature: { title: 'Git تیمی بدون ترس: برنچ، ری‌بیس و نجات کامیت', desc: 'گردش کار روزانهٔ یک تیم کوچک و ابزارهای نجات وقتی چیزی خراب می‌شود.', duration: '۰۸:۴۷' },
        roadmap: [
            { title: 'Git و کار تیمی بدون ترس', desc: 'برنچ کوچک، پیام کامیت درست، ری‌بیس و سه ابزار نجات؛ گردش کار روزانهٔ یک تیم.', links: [{ t: 'مقالهٔ Git تیمی', href: 'articles/devops/git-team.html' }, { t: 'ویدیوهای دواپس', href: 'videos.html#path=devops' }] },
            { title: 'تست خودکار؛ هرم تست', desc: 'واحد زیاد، یکپارچه متوسط، سرتاسر کم؛ اولین تست معنادار را روی تابعی بنویس که دیروز باگ داشت.', links: [{ t: 'مقالهٔ هرم تست', href: 'articles/devops/testing-pyramid.html' }] },
            { title: 'CI/CD با GitHub Actions', desc: 'هر پوش لینت و تست شود و main خودکار مستقر؛ اصل شکست سریع را در خط لوله رعایت کن.', links: [{ t: 'مقالهٔ CI/CD', href: 'articles/devops/ci-cd.html' }] },
            { title: 'قالب‌های آمادهٔ خط لوله و داکر', desc: 'ورک‌فلو CI و Dockerfile چندمرحله‌ای را بردار، بخوان و برای پروژهٔ خودت شخصی‌سازی کن.', links: [{ t: 'قالب ورک‌فلو CI', href: 'templates/devops/ci-workflow.html' }, { t: 'قالب Dockerfile', href: 'templates/devops/dockerfile.html' }] },
            { title: 'انتشار واقعی؛ مثل خود بایتی', desc: 'پروژه‌ات را روی GitHub Pages منتشر کن؛ همین سایتی که می‌بینی، بدون بک‌اند و با همین روش منتشر شده است.', links: [{ t: 'ویدیوهای دواپس', href: 'videos.html#path=devops' }] },
            { title: 'پروژهٔ پایانی: خط لولهٔ کامل', desc: 'برای یک مخزن واقعی CI راه بینداز و خروجی سبز را به‌عنوان تسک هفتگی در پنل تحویل بده.', links: [{ t: 'ورود به پنل و تحویل پروژه', href: '../auth/auth.html' }] }
        ],
        articles: [
            {
                slug: 'git-team', title: 'Git تیمی بدون ترس: برنچ، ری‌بیس و پیام کامیت',
                excerpt: 'یک گردش کار روزانهٔ ساده، قانون پیام کامیت و سه ابزار نجات که هر عضوی باید بلد باشد.',
                author: 'آرش پناهی', date: '۱۸ مهر ۱۴۰۵', minutes: '۷',
                blocks: [
                    { p: 'ترس از Git معمولاً از یک تجربهٔ بد می‌آید: یک merge conflict حل‌نشده یا یک push اشتباه. راه‌حل، حفظ کردن صد دستور نیست؛ داشتن یک گردش کار پیش‌فرض و دانستن سه ابزار نجات است.' },
                    { h2: 'گردش کار روزانه' },
                    { code: 'git switch -c feat/better-tea   # برنچ کوچک و کوتاه‌عمر\n# ... تغییرات ...\ngit add -p                    # مرور تکه‌تکهٔ تغییرات\ngit commit -m "feat: افزودن دم‌کردن دوم"\ngit pull --rebase origin main   # تاریخ خطی\ngit push -u origin feat/better-tea', lang: 'bash' },
                    { h2: 'پیام کامیت، نامه به آینده' },
                    { ul: ['خط اول کوتاه و امری: «feat: …»، «fix: …»، «refactor: …».', 'بدنه توضیح دهد «چرا»، نه «چه»؛ چه را diff می‌گوید.', 'کامیت‌های کوچک و قابل بازگشت؛ هر کامیت یک تصمیم.'] },
                    { tip: 'سه ابزار نجات: git reflog (تاریخچهٔ اشاره‌گرها)، git stash (کنار گذاشتن موقت) و git switch --detach (بازدید بدون تغییر). با این‌ها تقریباً هیچ چیزی برای همیشه گم نمی‌شود.' }
                ]
            },
            {
                slug: 'testing-pyramid', title: 'هرم تست و اولین تست شما',
                excerpt: 'چرا تست واحد زیاد، تست یکپارچه متوسط و تست سرتاسر کم؟ و چگونه اولین تست معنادار را همین امروز بنویسی.',
                author: 'آرش پناهی', date: '۲ آبان ۱۴۰۵', minutes: '۶',
                blocks: [
                    { p: 'هرم تست یک قانون بودجه است: تست‌های واحد ارزان و سریع‌اند، پس زیاد بنویس؛ تست‌های یکپارچه گران‌ترند، پس متوسط؛ تست‌های سرتاسر کند و شکننده‌اند، پس فقط برای جریان‌های حیاتی. وارونه کردن هرم یعنی CI کند و دیروقت‌فهمیدن باگ‌ها.' },
                    { h2: 'سه لایه' },
                    { ul: ['واحد: یک تابع یا ماژول، بدون شبکه و دیتابیس؛ میلی‌ثانیه‌ای.', 'یکپارچه: چند ماژول با هم، مثلاً router + دیتابیس آزمایشی.', 'سرتاسر: مرورگر واقعی و جریان کامل؛ فقط مسیرهای حیاتی.'] },
                    { code: 'test("validateTask عنوان خالی را رد می‌کند", () => {\n  const fields = validateTask({ title: "  " });\n  expect(fields).toEqual({ title: "عنوان الزامی است" });\n});', lang: 'js' },
                    { h2: 'چه چیزی را تست کنیم' },
                    { p: 'تست خوب، رفتار را قفل می‌کند نه پیاده‌سازی را: ورودی/خروجی و حالت‌های مرزی (خالی، null، مرز عدد). اگر با هر ریفکتورِ بی‌تغییرِ رفتار، تست می‌شکند، تست به جزئیات چسبیده است.' },
                    { tip: 'اولین تست را روی تابعی بنویس که دیروز باگ داشت؛ هم ارزش فوری دارد هم انگیزهٔ ادامه.' }
                ]
            },
            {
                slug: 'ci-cd', title: 'CI/CD با GitHub Actions: از پوش تا استقرار',
                excerpt: 'یک خط لولهٔ حداقلی که هر پوش را لینت و تست می‌کند و شاخهٔ main را خودکار مستقر می‌کند؛ با اصل شکست سریع.',
                author: 'آرش پناهی', date: '۹ آبان ۱۴۰۵', minutes: '۸',
                blocks: [
                    { p: 'CI/CD یعنی هیچ تغییری بدون ماشینِ بررسی وارد نشود و هیچ انتشاری دستی و استرس‌زا نباشد. خوشبختانه یک فایل YAML کوچک، بیشترِ این وعده را محقق می‌کند.' },
                    { h2: 'خط لولهٔ حداقلی' },
                    { code: 'name: ci\non: [push, pull_request]\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 20, cache: npm }\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test', lang: 'yaml' },
                    { h2: 'شکست سریع، ارزان‌ترین شکست' },
                    { p: 'ارزان‌ترین و سریع‌ترین بررسی را اول بگذار (لینت قبل از تست، تست واحد قبل از یکپارچه). هرچه زودتر قرمز شود، هزینهٔ اصلاح کمتر است. کش کردن npm هم زمان صف را نصف می‌کند.' },
                    { tip: 'استقرار را به یک job جدا با environment محافظت‌شده ببر؛ این‌طور تأیید انسانی و rollback تمیز، بخشی از خط لوله می‌شود نه یک تصمیم لحظه‌ای.' }
                ]
            }
        ],
        templates: [
            {
                slug: 'ci-workflow', title: 'ورک‌فلو CI برای لینت و تست', lang: 'yaml', runnable: false,
                desc: 'فایل آمادهٔ GitHub Actions با کش npm، ترتیب شکست سریع و job استقرار محافظت‌شده برای main.',
                notes: ['این فایل در runner گیت‌هاب اجرا می‌شود، نه در مرورگر؛ خروجی نمایش‌داده‌شده لاگ مورد انتظار job است.', 'ترتیب stepها عمداً لینت → تست واحد → تست یکپارچه است تا ارزان‌ترین بررسی اول شکست بخورد.', 'job استقرار فقط روی main و با environment تولید اجرا می‌شود.'],
                expected: [
                    { time: '09:12:00', text: 'Run npm ci' },
                    { time: '09:12:14', level: 'ok', text: 'added 214 packages in 12s (cache hit)' },
                    { time: '09:12:15', text: 'Run npm run lint' },
                    { time: '09:12:19', level: 'ok', text: '✔ 0 problems (0 errors, 0 warnings)' },
                    { time: '09:12:20', text: 'Run npm test' },
                    { time: '09:12:31', level: 'ok', text: 'Tests: 48 passed, 48 total — Time: 9.4s' },
                    { time: '09:12:32', level: 'ok', text: 'Job quality succeeded; deploy queued for main.' }
                ],
                code: `name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint        # ارزان‌ترین بررسی، اول
      - run: npm test            # واحد + یکپارچه

  deploy:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production      # تأیید انسانی + تاریخچهٔ استقرار
    steps:
      - uses: actions/checkout@v4
      - run: npm ci --omit=dev
      - run: npm run build
      - run: ./scripts/deploy.sh`
            },
            {
                slug: 'dockerfile', title: 'Dockerfile چندمرحله‌ای برای اپ Node', lang: 'docker', runnable: false,
                desc: 'بیلد چندمرحله‌ای: ایمیج نهایی فقط خروجیِ اجرا را دارد؛ کش لایه‌ها، کاربر غیرroot و healthcheck.',
                notes: ['داکر روی میزبان اجرا می‌شود؛ خروجی اینجا لاگ مورد انتظار بیلد و اجرای کانتینر است.', 'مرحلهٔ build وابستگی‌های dev را دارد؛ مرحلهٔ final فقط npm ci --omit=dev می‌زند.', 'اجرا با کاربر غیرroot و healthcheck، حداقلِ امنیت و observability است.'],
                expected: [
                    { time: '11:20:01', text: '$ docker build -t bytea/api .' },
                    { time: '11:20:04', text: '[build 4/6] RUN npm ci' },
                    { time: '11:20:19', text: '[build 6/6] RUN npm run build' },
                    { time: '11:20:26', level: 'ok', text: '[final 3/5] COPY --from=build /app/dist ./dist' },
                    { time: '11:20:31', level: 'ok', text: 'writing image sha256:9f2c…  done in 30.2s' },
                    { time: '11:20:40', text: '$ docker run -p 3000:3000 bytea/api' },
                    { time: '11:20:41', level: 'ok', text: 'listening on :3000 — healthcheck: healthy' }
                ],
                code: `# مرحلهٔ بیلد: همهٔ وابستگی‌ها و کامپایل
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# مرحلهٔ نهایی: فقط خروجیِ اجرا
FROM node:20-alpine AS final
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && addgroup -S app && adduser -S app -G app
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]`
            }
        ]
    }
];

/* ---------- Shared fragments ---------- */
const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    playStroke: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6 3 12l5 6M16 6l5 6-5 6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5h-6c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3z"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'
};

function head(base, title, desc, extra = []) {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl" class="bytea-scroll">
<head>
<script>(function(){try{var t=localStorage.getItem('bytea-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="theme-color" content="#F6EFE4">
<link rel="icon" href="${base}assets/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${base}assets/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="${base}assets/favicon/favicon-16x16.png">
<link rel="apple-touch-icon" href="${base}assets/favicon/apple-touch-icon.png">
<link rel="manifest" href="${base}assets/favicon/site.webmanifest">
<meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${base}assets/style/style.css">
<link rel="stylesheet" href="${base}assets/style/tracks.css">
${extra.map((c) => `<link rel="stylesheet" href="${base}assets/style/${c}">`).join('\n')}
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>`;
}

function nav(base, bodyAttr = '') {
    const home = base + '../';
    const links = [['#about', 'درباره'], ['#tracks', 'مسیرها'], ['#events', 'رویدادها'], ['#mentors', 'منتورها'], ['#faq', 'پرسش‌ها']];
    return `
<body${bodyAttr}>
<div class="bytea-loader" id="bytea-loader" aria-hidden="true">
    <div class="loader-card">
        <div class="loader-steam"><i></i><i></i><i></i></div>
        <img class="logo-img loader-mark" src="${base}assets/img/logo.png" alt="">
        <div class="loader-word">bytea</div>
        <div class="loader-bar"><i></i></div>
        <div class="loader-note mono">brewing the page…</div>
    </div>
</div>
<noscript><style>.bytea-loader{display:none}</style></noscript>

<header class="nav">
    <div class="wrap nav-in">
        <a href="${home}index.html" class="logo" aria-label="بایتی">
            <img class="logo-img" src="${base}assets/img/logo.png" alt="بایتی">
            <span class="logo-text"><b>bytea</b><small>انجمن کدنویسی</small></span>
        </a>
        <nav class="nav-links" aria-label="ناوبری اصلی">
            ${links.map(([h, t]) => `<a href="${home}index.html${h}">${t}</a>`).join('\n            ')}
        </nav>
        <div class="nav-cta">
            <a href="${base}auth/auth.html" class="btn btn-ink" data-auth-link>ورود اعضا</a>
            <button class="burger" aria-label="منو" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
        </div>
    </div>
    <div class="mobile-menu" id="mobileMenu">
        <div class="wrap">
            ${links.map(([h, t]) => `<a href="${home}index.html${h}">${t}</a>`).join('\n            ')}
            <a href="${base}auth/auth.html" class="btn btn-ink" data-auth-link>ورود اعضا</a>
        </div>
    </div>
</header>`;
}

function footer(base) {
    const home = base + '../';
    return `
<footer>
    <div class="wrap">
        <div class="foot-grid">
            <div class="foot-brand">
                <a href="${home}index.html" class="logo"><img class="logo-img" src="${base}assets/img/logo.png" alt="بایتی"><span class="logo-text"><b>bytea</b><small>انجمن کدنویسی</small></span></a>
                <p>انجمن باز کدنویسی و آموزش برنامه‌نویسی. کد را با هم می‌نویسیم، با هم می‌خوانیم و با هم بهتر می‌کنیم.</p>
            </div>
            <div class="foot-col">
                <h4>مسیرها</h4>
                ${PATHS.map((p) => `<a href="${base}tracks/${p.slug}.html">${p.name}</a>`).join('\n                ')}
            </div>
            <div class="foot-col">
                <h4>یادگیری</h4>
                <a href="${base}tracks/videos.html">آرشیو ویدیوها</a>
                <a href="${home}index.html#tracks">نقشهٔ مسیرها</a>
                <a href="${home}index.html#faq">پرسش‌های متداول</a>
            </div>
            <div class="foot-col">
                <h4>انجمن</h4>
                <a href="${home}index.html#about">دربارهٔ ما</a>
                <a href="${home}index.html#mentors">منتورها</a>
                <a class="foot-mail" href="mailto:contact@bytea-code.ir">contact@bytea-code.ir</a>
            </div>
        </div>
        <div class="foot-bottom">
            <span>© <span id="year">۱۴۰۵</span> بایتی — ساخته‌شده با چای و کمی ریفکتور.<span class="foot-social" data-social data-base="${base}"></span></span>
            <span class="mono">refactor the feature</span>
        </div>
    </div>
</footer>
<script src="${base}assets/static/data-extra.js"></script>
<script src="${base}assets/static/bytea.js"></script>`;
}

const crumb = (items) => `<nav class="crumb" aria-label="مسیر صفحه">${items.map((it, i) =>
    (it.href ? `<a href="${it.href}">${esc(it.t)}</a>` : `<b>${esc(it.t)}</b>`) + (i < items.length - 1 ? ICONS.arrow : '')
).join('')}</nav>`;

/* ---------- Track roadmap ---------- */
function roadmapSection(p) {
    const steps = p.roadmap.map((s, i) => `
                <li class="roadmap-step" data-reveal data-delay="${i * 60}">
                    <span class="roadmap-no">${fa(i + 1)}</span>
                    <div class="roadmap-body">
                        <h3>${esc(s.title)}</h3>
                        <p>${esc(s.desc)}</p>
                        <div class="roadmap-links">
                            ${s.links.map((l) => `<a href="${l.href}">${esc(l.t)} ${ICONS.arrow}</a>`).join('\n                            ')}
                        </div>
                    </div>
                </li>`).join('');
    return `
    <section class="page-sec" id="roadmap" style="--path:var(${p.token})">
        <div class="wrap">
            <div class="sec-row" data-reveal>
                <div>
                    <span class="eyebrow">learning roadmap</span>
                    <h2>نقشهٔ راه این مسیر</h2>
                    <p>به‌ترتیب شماره‌ها جلو برو؛ هر قدم به منبعِ همین مسیر وصل است. بعد از هر قدم، تسک هفتگی پنل را انجام بده.</p>
                </div>
            </div>
            <ol class="roadmap-list">${steps}
            </ol>
        </div>
    </section>`;
}

/* ---------- Track page ---------- */
function pathPage(p) {
    const base = '../';
    const feat = (CATALOG[p.slug] || [])[0];
    const tplCards = p.templates.map((t) => {
        const ext = { html: 'html', css: 'css', js: 'js', php: 'php', yaml: 'yml', docker: 'Dockerfile' }[t.lang] || t.lang;
        const rows = t.code.split('\n').slice(0, 7).map((ln, i) =>
            `<div><em>${String(i + 1).padStart(2, '0')}</em>${paint(ln, t.lang) || '&nbsp;'}</div>`).join('');
        const live = t.runnable
            ? `<iframe srcdoc="${esc(t.code)}" sandbox="allow-scripts" loading="lazy" tabindex="-1" aria-hidden="true" title="پیش‌نمایش ${esc(t.title)}" hidden></iframe>`
            : '';
        return `
                <article class="tpl-card" data-reveal>
                    <div class="tpl-preview tpl-preview-code">
                        <div class="code-window tpl-window">
                            <div class="window-top"><div class="window-dots"><i></i><i></i><i></i></div><span>${t.slug}.${ext}</span><span class="window-lock">⌘</span></div>
                            <div class="code-content" dir="ltr">${rows}</div>
                            <div class="code-footer"><span><i class="status-dot"></i> ${t.runnable ? 'ready to run' : 'server-side'}</span><span>${t.lang} · UTF-8</span></div>
                        </div>
                        ${live}
                        <div class="tpl-view-switch" role="group" aria-label="نمایش قالب">
                            <button type="button" class="active" data-tplview="code">کد</button>
                            ${t.runnable ? '<button type="button" data-tplview="live">پیش‌نمایش</button>' : ''}
                        </div>
                    </div>
                    <div class="tpl-body">
                        <h3>${esc(t.title)}</h3>
                        <p>${esc(t.desc)}</p>
                        <div class="tpl-tags">
                            <span class="tpl-tag">${t.lang}</span>
                            <span class="tpl-tag ${t.runnable ? 'run' : 'server'}">${t.runnable ? 'قابل اجرا در مرورگر' : 'اجرای سمت سرور'}</span>
                        </div>
                        <div class="tpl-foot">
                            <a href="templates/${p.slug}/${t.slug}.html">باز کردن و اجرا ${ICONS.arrow}</a>
                            <span>${t.runnable ? 'Run + Preview + Console' : 'کد + خروجی سرور'}</span>
                        </div>
                    </div>
                </article>`;
    }).join('');

    const rows = p.articles.map((a, i) => `
                <a class="article-row" href="articles/${p.slug}/${a.slug}.html" data-reveal data-delay="${i * 70}">
                    <span class="article-no">${fa(i + 1).padStart(2, '۰')}</span>
                    <span class="article-main">
                        <h3>${esc(a.title)}</h3>
                        <p>${esc(a.excerpt)}</p>
                        <span class="article-meta">
                            <span>${ICONS.clock} ${a.minutes} دقیقه مطالعه</span>
                            <span>${ICONS.cal} ${a.date}</span>
                        </span>
                    </span>
                    <span class="article-go">${ICONS.arrow}</span>
                </a>`).join('');

    return head(base, `${p.name} — مسیر یادگیری بایتی`, p.lead) + nav(base, ` data-path="${p.slug}"`) + `
<main>
    <section class="path-hero" data-no="${p.no}" style="--path:var(${p.token})">
        <div class="wrap">
            ${crumb([{ t: 'خانه', href: base + '../index.html' }, { t: 'مسیرها', href: base + '../index.html#tracks' }, { t: p.name }])}
            <div class="path-head">
                <span class="eyebrow">${p.en}</span>
                <h1>مسیر <span>${p.name}</span></h1>
                <p class="path-lead">${p.lead}</p>
                <div class="meta-chips">
                    <span class="meta-chip">${ICONS.clock} <i>${p.hours}</i> ساعت آموزش</span>
                    <span class="meta-chip">${ICONS.doc} <i>${fa(p.articles.length)}</i> مقاله</span>
                    <span class="meta-chip">${ICONS.playStroke} <i>${fa((CATALOG[p.slug] || []).length)}</i> ویدیوی آپارات</span>
                    <span class="meta-chip">${ICONS.code} <i>${fa(p.templates.length)}</i> قالب آماده</span>
                </div>
            </div>
        </div>
    </section>
${roadmapSection(p)}

    <section class="page-sec" id="articles" style="--path:var(${p.token})">
        <div class="wrap">
            <div class="sec-row" data-reveal>
                <div>
                    <span class="eyebrow">articles</span>
                    <h2>مقاله‌های این مسیر</h2>
                    <p>هر مقاله یک پروندهٔ مستقل است؛ روی عنوان بزن تا متن کامل باز شود.</p>
                </div>
            </div>
            <div class="article-list">${rows}
            </div>
        </div>
    </section>

    <section class="page-sec" id="videos" style="--path:var(${p.token})">
        <div class="wrap">
            <div class="sec-row" data-reveal>
                <div>
                    <span class="eyebrow">video archive</span>
                    <h2>ویدیوهای مسیر ${p.name}</h2>
                    <p>یک ویدیوی نمونه این‌جا می‌بینی؛ آرشیو کامل همهٔ مسیرها یک‌جا است.</p>
                </div>
                <a class="sec-link" href="videos.html#path=${p.slug}">آرشیو کامل ویدیوها ${ICONS.arrow}</a>
            </div>
            <a class="video-feature" href="videos.html#path=${p.slug}" data-reveal>
                <div class="poster live">
                    ${feat && feat.poster ? `<img class="poster-img" src="${esc(feat.poster)}" alt="" loading="lazy">` : ''}
                    <span class="poster-tag">ویدیوی نمونهٔ مسیر · آپارات</span>
                    <span class="poster-play">${ICONS.play}</span>
                    <span class="poster-time">${feat ? faDur(feat.duration) : ''}</span>
                </div>
                <div class="video-feature-body">
                    <span class="eyebrow">sample lesson · aparat</span>
                    <h3>${esc(feat ? feat.title : p.feature.title)}</h3>
                    <p>${esc(feat ? feat.desc : p.feature.desc)}</p>
                    <p>با کلیک روی این کارت، آرشیو ویدیوهای آپارات فقط با ویدیوهای مسیر ${p.name} باز می‌شود.</p>
                    <span class="btn btn-ink">تماشای ویدیوهای این مسیر ${ICONS.playStroke}</span>
                </div>
            </a>
        </div>
    </section>

    <section class="page-sec" id="templates" style="--path:var(${p.token})">
        <div class="wrap">
            <div class="sec-row" data-reveal>
                <div>
                    <span class="eyebrow">ready-made code</span>
                    <h2>کدهای آماده و پرکاربرد</h2>
                    <p>هر قالب پیش‌نمایش دارد و صفحهٔ اجرای مستقل خودش را؛ کد قابل اجرا، همان‌جا تست می‌شود.</p>
                </div>
            </div>
            <div class="tpl-grid">${tplCards}
            </div>
        </div>
    </section>
</main>
${footer(base)}
</body>
</html>`;
}

/* ---------- Article page ---------- */
function articlePage(p, a, idx) {
    const base = '../../../';
    const body = a.blocks.map((b) => {
        if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
        if (b.p) return `<p>${esc(b.p)}</p>`;
        if (b.ul) return `<ul>${b.ul.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>`;
        if (b.code) return `<pre class="code-block dark-scroll">${paint(b.code, b.lang)}</pre>`;
        if (b.tip) return `<div class="tip-box">${ICONS.bulb}<span><b>نکتهٔ منتور:</b> ${esc(b.tip)}</span></div>`;
        return '';
    }).join('\n');
    const prev = p.articles[idx - 1];
    const next = p.articles[idx + 1];
    return head(base, `${a.title} — بایتی`, a.excerpt) + nav(base) + `
<main style="--path:var(${p.token})">
    <section class="article-hero">
        <div class="wrap">
            ${crumb([{ t: 'خانه', href: base + '../index.html' }, { t: p.name, href: '../../' + p.slug + '.html' }, { t: 'مقاله' }])}
            <span class="path-tag">${p.name}</span>
            <h1>${esc(a.title)}</h1>
            <div class="article-byline">
                <span><span class="byline-avatar">${esc(a.author[0])}</span> ${esc(a.author)}</span>
                <span>${ICONS.cal} ${a.date}</span>
                <span>${ICONS.clock} ${a.minutes} دقیقه مطالعه</span>
            </div>
        </div>
    </section>
    <div class="wrap">
        <article class="prose">${body}</article>
        <nav class="article-nav" aria-label="مقاله‌های مسیر">
            ${prev ? `<a href="${prev.slug}.html"><small>مقالهٔ قبلی</small><b>${esc(prev.title)}</b></a>` : `<a href="../../${p.slug}.html"><small>بازگشت</small><b>صفحهٔ مسیر ${p.name}</b></a>`}
            ${next ? `<a class="next" href="${next.slug}.html"><small>مقالهٔ بعدی</small><b>${esc(next.title)}</b></a>` : `<a class="next" href="../../videos.html#path=${p.slug}"><small>ادامهٔ مسیر</small><b>ویدیوهای ${p.name}</b></a>`}
        </nav>
    </div>
</main>
${footer(base)}
</body>
</html>`;
}

/* ---------- Template page ---------- */
function templatePage(p, t) {
    const base = '../../../';
    const payload = JSON.stringify({ slug: t.slug, lang: t.lang, runnable: t.runnable, code: t.code, expected: t.expected || [] }).replace(/</g, '\\u003c');
    const outputCol = t.runnable ? `
            <div class="runner-col">
                <div>
                    <div class="pane-head"><span>${ICONS.eye} پیش‌نمایش زنده</span><small>iframe sandbox</small></div>
                    <iframe id="preview-frame" class="preview-frame" sandbox="allow-scripts" title="پیش‌نمایش اجرای کد"></iframe>
                </div>
                <div>
                    <div class="pane-head"><span>${ICONS.terminal} کنسول</span><small>خروجی console کد</small></div>
                    <pre id="console-pane" class="console-pane dark-scroll"></pre>
                </div>
            </div>` : `
            <div class="runner-col">
                <div class="server-note">${ICONS.server}<span>این کد (${t.lang}) سمت سرور اجرا می‌شود و در مرورگر قابل اجرا نیست؛ با زدن دکمهٔ اجرا، <b>خروجی مورد انتظار سرور</b> را قدم‌به‌قدم می‌بینی.</span></div>
                <div>
                    <div class="pane-head"><span>${ICONS.terminal} خروجی مورد انتظار سرور</span><small>شبیه‌سازی اجرای واقعی</small></div>
                    <pre id="expected-pane" class="expected-pane dark-scroll"></pre>
                </div>
            </div>`;
    return head(base, `${t.title} — قالب آمادهٔ بایتی`, t.desc, ['template.css']) + nav(base) + `
<main style="--path:var(${p.token})">
    <div class="wrap">
        <div class="tpl-hero">
            ${crumb([{ t: 'خانه', href: base + '../index.html' }, { t: p.name, href: '../../' + p.slug + '.html' }, { t: 'قالب آماده' }])}
            <h1>${esc(t.title)}</h1>
            <p class="desc">${esc(t.desc)}</p>
            <div class="tpl-badges">
                <span class="path-tag">${p.name}</span>
                <span class="tpl-tag">${t.lang}</span>
                <span class="tpl-tag ${t.runnable ? 'run' : 'server'}">${t.runnable ? 'قابل اجرا و تست در مرورگر' : 'اجرای سمت سرور + خروجی مورد انتظار'}</span>
            </div>
        </div>
        <div class="runner-grid">
            <div class="runner-col">
                <div class="editor-bar">
                    <button type="button" id="run-btn" class="btn btn-amber">${ICONS.play} ${t.runnable ? 'اجرا و تست' : 'اجرا و دیدن خروجی'}</button>
                    <button type="button" id="reset-btn" class="bar-btn">${ICONS.reset} بازنشانی</button>
                    <button type="button" id="copy-btn" class="bar-btn">${ICONS.copy} کپی کد</button>
                    <span id="run-status" class="run-status"><i></i>آماده</span>
                </div>
                <div class="code-window runner-window">
                    <div class="window-top"><div class="window-dots"><i></i><i></i><i></i></div><span>${t.slug}.${{ html: 'html', css: 'css', js: 'js', php: 'php', yaml: 'yml', docker: 'Dockerfile' }[t.lang] || t.lang}</span><span class="window-lock">⌘</span></div>
                    <div class="code-surface">
                        <div class="gutter" id="code-gutter" aria-hidden="true"></div>
                        <pre id="code-highlight" class="dark-scroll" aria-hidden="true"></pre>
                        <textarea id="code-area" class="dark-scroll" spellcheck="false" aria-label="ویرایشگر کد قالب"></textarea>
                    </div>
                    <div class="code-footer"><span><i class="status-dot"></i> ${t.runnable ? 'ready to run' : 'server-side'}</span><span>${t.lang} · UTF-8</span></div>
                </div>
            </div>
            ${outputCol}
        </div>
        <section class="tpl-notes">
            <h2>این قالب چه می‌کند و چگونه استفاده کنیم؟</h2>
            <p>${esc(t.desc)}</p>
            <ul>${t.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        </section>
    </div>
</main>
<script type="application/json" id="tpl-data">${payload}</script>
${footer(base)}

</body>
</html>`;
}

/* ---------- Video archive ---------- */
function videosPage() {
    const base = '../';
    return head(base, 'آرشیو ویدیوها — بایتی', 'همهٔ ویدیوهای آموزشی همهٔ مسیرهای بایتی در یک آرشیو واحد با فیلتر مسیر.') + nav(base) + `
<main>
    <section class="tpl-hero" style="--path:var(--amber)">
        <div class="wrap">
            ${crumb([{ t: 'خانه', href: base + '../index.html' }, { t: 'مسیرها', href: base + '../index.html#tracks' }, { t: 'آرشیو ویدیو' }])}
            <span class="eyebrow">video archive</span>
            <h1>آرشیو ویدیوهای بایتی</h1>
            <p class="desc">همهٔ ضبط‌های همهٔ مسیرها در یک صفحه؛ با فیلتر مسیر یا جستجو، فقط چیزی را ببین که لازم داری. ورود از صفحهٔ هر مسیر، آرشیو را همان‌جا فیلترشده باز می‌کند.</p>
        </div>
    </section>
    <div class="wrap">
        <div class="filter-bar">
            <div class="filter-chips" role="group" aria-label="فیلتر مسیر">
                <button type="button" class="filter-chip active" data-path="all">همه</button>
                ${PATHS.map((p) => `<button type="button" class="filter-chip" data-path="${p.slug}">${p.name}</button>`).join('\n                ')}
            </div>
            <input id="video-search" class="video-search" type="search" placeholder="جستجو در عنوان و توضیح…" aria-label="جستجوی ویدیو">
            <p class="video-count" id="video-count" role="status"></p>
        </div>
        <div class="video-grid" id="video-grid"></div>
    </div>
</main>
<dialog class="player-dialog" id="player-dialog" aria-labelledby="player-title">
    <div class="player-stage"><iframe id="player-frame" title="پخش‌کنندهٔ آپارات" allow="autoplay; fullscreen" allowfullscreen></iframe></div>
    <div class="player-body">
        <div class="player-head">
            <div>
                <h2 id="player-title"></h2>
                <div class="player-meta" id="player-meta"></div>
            </div>
            <button type="button" class="player-close" id="player-close" aria-label="بستن پخش‌کننده">${ICONS.close}</button>
        </div>
        <p id="player-desc"></p>
        <p class="player-source"><a id="player-link" class="btn btn-ghost" href="https://www.aparat.com" target="_blank" rel="noopener">مشاهدهٔ این ویدیو در آپارات</a></p>
    </div>
</dialog>
<script src="${base}assets/static/data-catalog.js"></script>
${footer(base)}
</body>
</html>`;
}

/* ---------- Generation ---------- */
for (const p of PATHS) {
    out(`tracks/${p.slug}.html`, pathPage(p));
    p.articles.forEach((a, i) => out(`tracks/articles/${p.slug}/${a.slug}.html`, articlePage(p, a, i)));
    p.templates.forEach((t) => out(`tracks/templates/${p.slug}/${t.slug}.html`, templatePage(p, t)));
}
out('tracks/videos.html', videosPage());
console.log('همهٔ صفحات مسیر ساخته شدند.');