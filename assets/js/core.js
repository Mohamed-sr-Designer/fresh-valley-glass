/* =========================================================================
   Fresh Valley core — shared by the storefront and the dashboard (ported from the NASIJ engine).
   · content  : defaults.js  ⊕  content.json (published)  ⊕  draft (preview)
   · catalog  : products / variants / collections / drop helpers
   · store    : cart, wishlist, orders, custom requests (localStorage)
   · i18n     : UI strings (AR/EN) with dashboard overrides
   · backend  : static (GitHub Pages: content.json) or WordPress (window.NZ_WP,
                injected by the NASIJ theme: content, orders, requests and
                visits live in the WordPress database via /wp-json/nasij/v1)
   ========================================================================= */
window.NZ = (function () {
  'use strict';
  const LS = {
    lang: 'fvg_lang', mode: 'fvg_mode', cart: 'fvg_cart', wish: 'fvg_wish', orders: 'fvg_orders',
    requests: 'fvg_requests', promo: 'fvg_promo', profile: 'fvg_profile', draft: 'fvg_cms_draft', preview: 'fvg_cms_preview',
    recent: 'fvg_recent', popup: 'fvg_popup', reviews: 'fvg_reviews', notify: 'fvg_notify'
  };
  const read = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const uid = p => (p || '') + Date.now().toString(36).slice(-5).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

  /* deep merge: objects merge, arrays and scalars from `b` replace `a` */
  function merge(a, b) {
    if (b === undefined || b === null) return clone(a);
    if (Array.isArray(a) || Array.isArray(b) || typeof a !== 'object' || typeof b !== 'object' || !a) return clone(b);
    const out = clone(a);
    Object.keys(b).forEach(k => { out[k] = (k in a) ? merge(a[k], b[k]) : clone(b[k]); });
    return out;
  }

  /* ─────────────────────────── backend ─────────────────────────── */
  const WP = window.NZ_WP || null;
  const BASE = (WP && WP.base) || '';
  const api = p => WP.rest + p;
  const withQ = (u, k, v) => u + (u.indexOf('?') > -1 ? '&' : '?') + k + '=' + encodeURIComponent(v);
  /* theme-relative asset path → absolute URL (only needed on WordPress, where pages are not served from the theme folder) */
  const abs = u => (!BASE || typeof u !== 'string' || !/^(images|assets)\//.test(u)) ? u : BASE + u;
  function absAll(o) {
    if (typeof o === 'string') return abs(o);
    if (Array.isArray(o)) return o.map(absAll);
    if (o && typeof o === 'object') { const r = {}; Object.keys(o).forEach(k => { r[k] = absAll(o[k]); }); return r; }
    return o;
  }
  /* fire-and-forget POST to the WordPress API (public endpoints: no nonce, so cached pages never break it) */
  async function send(path, body) {
    if (!WP) return null;
    try {
      const txt = JSON.stringify(body);
      const r = await fetch(api(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt, keepalive: txt.length < 60000, credentials: 'omit' });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }

  /* ─────────────────────────── content ─────────────────────────── */
  const DEF = window.NZ_DEFAULTS;
  let C = clone(DEF);
  let published = null;
  const previewing = () => { try { return localStorage.getItem(LS.preview) === '1' && !!localStorage.getItem(LS.draft); } catch (e) { return false; } };
  async function load(opts) {
    try {
      const url = WP ? api('nasij/v1/content') : 'content.json';
      const r = await fetch(withQ(url, 'ts', Date.now()), { cache: 'no-store', credentials: WP ? 'omit' : 'same-origin' });
      if (r.ok) { const j = await r.json(); if (j && typeof j === 'object' && Object.keys(j).length) published = j; }
    } catch (e) { /* offline or file:// — defaults only */ }
    let eff = published ? merge(DEF, published) : clone(DEF);
    if (previewing()) { const d = read(LS.draft, null); if (d && (d.v || 1) === (DEF.v || 1)) eff = merge(DEF, d); }
    if (opts && opts.abs && BASE) eff = absAll(eff);
    C = eff;
    return C;
  }
  const content = () => C;

  /* ─────────────────────────── i18n ─────────────────────────── */
  const STR = {
    // header / nav
    'nav.search': ['Search', 'بحث'], 'nav.bag': ['Basket', 'السلة'], 'nav.menu': ['Menu', 'القائمة'], 'nav.home': ['Home', 'الرئيسية'],
    'nav.shop': ['Shop', 'المتجر'], 'nav.saved': ['Saved', 'المحفوظ'], 'nav.boxes': ['Boxes', 'الصناديق'], 'nav.account': ['Orders', 'طلباتي'],
    'nav.close': ['Close', 'إغلاق'], 'nav.lang': ['العربية', 'English'], 'nav.hosting': ['Hosting', 'الضيافة'],
    // common
    'c.shopNow': ['Shop now', 'تسوّق دلوقتي'], 'c.viewAll': ['View all', 'عرض الكل'], 'c.from': ['From', 'من'],
    'c.soldOut': ['Sold out', 'خلصان'], 'c.new': ['New', 'جديد'], 'c.sale': ['Sale', 'تخفيض'], 'c.pack': ['Pack', 'العبوة'], 'c.tier': ['Size', 'الحجم'], 'c.qty': ['Qty', 'الكمية'],
    'c.back': ['Back', 'رجوع'], 'c.items': ['items', 'منتجات'], 'c.item': ['item', 'منتج'], 'c.continue': ['Continue shopping', 'كمّل تسوّق'], 'c.remove': ['Remove', 'إزالة'],
    'c.whatsapp': ['WhatsApp us', 'كلّمنا واتساب'], 'c.readMore': ['Read more', 'اقرأ أكتر'], 'c.inSeason': ['In season', 'في موسمه'], 'c.export': ['Export grade', 'درجة تصدير'],
    'c.organic': ['Organic', 'أورجانيك'], 'c.seasonal': ['Seasonal', 'موسمي'], 'c.bestseller': ['Most gifted', 'الأكثر إهداءً'], 'c.add': ['Add', 'أضف'], 'c.lens': ['Look closer', 'قرّب'],
    // product
    'p.addToBag': ['Add to basket', 'أضف للسلة'], 'p.waOrder': ['Order on WhatsApp', 'اطلب على واتساب'], 'p.waMsg': ['Hi Fresh Valley, I’d like to order:', 'أهلاً فريش فالي، عايز أطلب:'],
    'p.added': ['Added to your basket', 'اتضاف للسلة'], 'p.details': ['About it', 'عنه'], 'p.storage': ['Keeping it fresh', 'إزاي يفضل طازة'], 'p.delivery': ['Delivery & promise', 'التوصيل والضمان'],
    'p.grade': ['Grade', 'الدرجة'], 'p.origin': ['Origin', 'المنشأ'], 'p.calibre': ['Calibre', 'المقاس'], 'p.season': ['Season', 'الموسم'],
    'p.gradeSpec': ['Our grading spec', 'مواصفات الفرز عندنا'], 'p.inside': ['What’s inside', 'جوّه إيه'], 'p.serves': ['Serves', 'يكفي'], 'p.pairs': ['Lovely with', 'حلو مع'],
    'p.also': ['You may also like', 'ممكن يعجبك كمان'], 'p.saved': ['Saved', 'اتحفظ'], 'p.save': ['Save', 'حفظ'], 'p.notFound': ['This item isn’t available.', 'الصنف ده مش متاح.'],
    'p.lowStock': ['Only {n} left today', 'فاضل {n} بس النهارده'], 'p.copyLink': ['Copy link', 'انسخ اللينك'], 'p.linkCopied': ['Link copied', 'اتنسخ اللينك'],
    'p.lensHint': ['Move over the photo to look closer', 'حرّك على الصورة عشان تقرّب'], 'p.perKg': ['per kg', 'للكيلو'], 'p.perPiece': ['each', 'للقطعة'], 'p.perBunch': ['per bunch', 'للحزمة'],
    'p.today': ['Order by 1 pm — at your door today', 'اطلب قبل ١ الضهر — يوصلك النهارده'], 'p.promise': ['Not perfect? Replaced, no questions.', 'مش مظبوط؟ بنبدّله من غير أسئلة.'],
    'p.notify': ['Notify me', 'بلّغني'], 'p.notifyOk': ['We’ll message you when it’s back', 'هنبعتلك أول ما يرجع'],
    // listing
    'l.all': ['All', 'الكل'], 'l.sort': ['Sort', 'ترتيب'], 'l.sort.featured': ['Featured', 'المميز'], 'l.sort.low': ['Price: low → high', 'السعر: من الأقل'],
    'l.sort.high': ['Price: high → low', 'السعر: من الأعلى'], 'l.sort.best': ['Most loved', 'الأكثر طلباً'], 'l.season': ['In season only', 'اللي في موسمه بس'],
    'l.empty': ['Nothing here right now.', 'مفيش حاجة هنا دلوقتي.'], 'l.count': ['{n} items', '{n} صنف'], 'l.shopAll': ['Shop all', 'كل المنتجات'], 'l.title': ['The harvest', 'الحصاد'],
    // cart
    'b.title': ['Your basket', 'سلتك'], 'b.empty': ['Your basket is empty.', 'سلتك فاضية.'], 'b.subtotal': ['Subtotal', 'المجموع'],
    'b.checkout': ['Checkout', 'إتمام الطلب'], 'b.free': ['Free delivery unlocked', 'التوصيل عليك مجاني'], 'b.toFree': ['{amount} away from free delivery', 'فاضل {amount} على التوصيل المجاني'],
    'b.promo': ['Promo code', 'كود الخصم'], 'b.apply': ['Apply', 'تطبيق'], 'b.promoOk': ['Code applied', 'الكود اتطبّق'], 'b.promoBad': ['That code isn’t valid', 'الكود ده مش شغال'],
    'b.discount': ['Discount', 'الخصم'], 'b.delivery': ['Delivery', 'التوصيل'], 'b.total': ['Total', 'الإجمالي'], 'b.calcLater': ['At checkout', 'وقت الدفع'], 'b.freeShip': ['Free', 'مجاني'],
    // checkout
    'k.title': ['Checkout', 'إتمام الطلب'], 'k.contact': ['Contact', 'بيانات التواصل'], 'k.delivery': ['Delivery', 'التوصيل'], 'k.payment': ['Payment', 'الدفع'], 'k.slot': ['Delivery slot', 'ميعاد التوصيل'],
    'k.name': ['Full name', 'الاسم بالكامل'], 'k.phone': ['Mobile number', 'رقم الموبايل'], 'k.email': ['Email (optional)', 'الإيميل (اختياري)'], 'k.gov': ['Area', 'المنطقة'], 'k.district': ['Neighbourhood', 'الحي'],
    'k.address': ['Street, building, floor, apartment', 'الشارع، العمارة، الدور، الشقة'], 'k.notes': ['Notes for the courier, or a gift message', 'ملاحظات للمندوب، أو رسالة هدية'],
    'k.choose': ['Choose…', 'اختار…'], 'k.place': ['Place order', 'تأكيد الطلب'], 'k.onlyAreas': ['We deliver across East Cairo, West Cairo & Giza.', 'بنوصّل في شرق وغرب القاهرة والجيزة.'],
    'k.required': ['Please fill in the highlighted fields.', 'من فضلك كمّل البيانات المعلّمة.'], 'k.phoneBad': ['Enter a valid Egyptian mobile number (01XXXXXXXXX).', 'اكتب رقم موبايل مصري صحيح (01XXXXXXXXX).'],
    'k.summary': ['Order summary', 'ملخص الطلب'], 'k.empty': ['Your basket is empty — add something first.', 'سلتك فاضية — ضيف حاجة الأول.'], 'k.secure': ['We confirm every order on WhatsApp before it leaves.', 'بنأكّد كل طلب على واتساب قبل ما يخرج.'],
    'k.gift': ['This is a gift', 'ده هدية'],
    // confirmation
    'o.thanks': ['Thank you, {name}.', 'شكراً يا {name}.'], 'o.placed': ['Order {id} is in.', 'طلبك رقم {id} وصلنا.'], 'o.next': ['What happens next', 'اللي هيحصل بعد كده'],
    'o.step1': ['We confirm on WhatsApp', 'بنأكّد معاك على واتساب'], 'o.step2': ['We grade and pack it the same morning', 'بنفرزه ونعبّيه نفس الصبح'], 'o.step3': ['Chilled delivery to your door', 'توصيل متبرّد لحد الباب'],
    'o.sendWa': ['Send order on WhatsApp', 'ابعت الطلب على واتساب'], 'o.payNow': ['Pay {amount} via {method}', 'ادفع {amount} عن طريق {method}'], 'o.payHint': ['Send the transfer screenshot on WhatsApp to confirm.', 'ابعت صورة التحويل على واتساب عشان نأكّد.'],
    'o.status': ['Status', 'الحالة'], 'o.notFound': ['We couldn’t find that order on this device.', 'مش لاقيين الطلب ده على الجهاز ده.'],
    'o.st.pending': ['Received', 'اتستلم'], 'o.st.confirmed': ['Confirmed', 'اتأكّد'], 'o.st.shipped': ['On the way', 'في الطريق'], 'o.st.delivered': ['Delivered', 'اتسلّم'], 'o.st.cancelled': ['Cancelled', 'اتلغى'], 'o.st.reserved': ['Reserved', 'محجوز'],
    // account
    'a.title': ['Your orders', 'طلباتك'], 'a.none': ['No orders on this device yet.', 'مفيش طلبات على الجهاز ده لسه.'], 'a.saved': ['Saved items', 'المحفوظ'], 'a.noSaved': ['Nothing saved yet — tap the heart on any item.', 'مفيش حاجة محفوظة — دوس على القلب في أي صنف.'],
    // events (custom requests)
    'r.title': ['Plan an event', 'خطّط لمناسبة'], 'r.kind': ['Occasion', 'المناسبة'], 'r.date': ['Date', 'الميعاد'], 'r.guests': ['Guests', 'عدد الضيوف'], 'r.budget': ['Budget (EGP, optional)', 'الميزانية (ج.م، اختياري)'],
    'r.reach': ['How do we reach you?', 'نتواصل معاك إزاي؟'], 'r.alt': ['Email or Instagram (optional)', 'إيميل أو إنستجرام (اختياري)'], 'r.notes': ['Anything we should know?', 'أي تفاصيل تانية؟'],
    'r.send': ['Send request', 'ابعت الطلب'], 'r.fine': ['No payment now. A host from our team calls you with a plan and a price.', 'مفيش دفع دلوقتي. حد من فريق الضيافة هيكلّمك بخطة وسعر.'],
    'r.done': ['Request received', 'وصلنا طلبك'], 'r.again': ['Send another', 'ابعت طلب تاني'], 'r.no': ['Request no. {id}', 'رقم الطلب · {id}'], 'r.errName': ['Please enter your name.', 'اكتب اسمك.'], 'r.errGuests': ['How many guests?', 'كام ضيف؟'],
    // misc
    'm.faq': ['Questions', 'الأسئلة'], 'm.journal': ['Journal', 'المجلة'], 'm.standard': ['Our A+ standard', 'معيار A+'], 'm.hosting': ['The Art of Hosting', 'فن الضيافة'],
    'm.404': ['Out of season.', 'مش في موسمه.'], 'm.404t': ['This page isn’t on the shelf anymore.', 'الصفحة دي مش على الرف تاني.'],
    'm.searchPh': ['Search strawberries, herbs, boxes…', 'دوّر على فراولة، أعشاب، صناديق…'], 'm.noResults': ['No results for “{q}”.', 'مفيش نتايج لـ «{q}».'],
    'm.getInTouch': ['Get in touch', 'تواصل معنا'], 'm.deliveryArea': ['Delivery — East & West Cairo', 'التوصيل — شرق وغرب القاهرة'],
    'm.rights': ['© {y} Fresh Valley. Grown in Egypt.', '© {y} فريش فالي. من أرض مصر.'], 'm.copied': ['Copied', 'اتنسخ'], 'm.dashboard': ['Dashboard', 'لوحة التحكم'],
    'm.preview': ['Preview mode — you’re seeing unpublished dashboard changes.', 'وضع المعاينة — بتشوف تعديلات من لوحة التحكم لسه متنشرتش.'], 'm.exitPreview': ['Exit preview', 'خروج من المعاينة'],
    'm.useCode': ['Use code', 'استخدم الكود'], 'm.gotIt': ['Got it', 'تمام'], 'm.newsletter': ['The weekly harvest list', 'قايمة الحصاد الأسبوعية'],
    // reviews
    'rv.title': ['Reviews', 'التقييمات'], 'rv.none': ['No reviews yet.', 'مفيش تقييمات لسه.'], 'rv.first': ['Write the first review', 'اكتب أول تقييم'], 'rv.write': ['Write a review', 'اكتب تقييمك'],
    'rv.count': ['{n} reviews', '{n} تقييم'], 'rv.one': ['1 review', 'تقييم واحد'], 'rv.of': ['out of 5', 'من ٥'], 'rv.verified': ['Verified buyer', 'مشتري مؤكَّد'],
    'rv.name': ['Your name', 'الاسم'], 'rv.rating': ['Your rating', 'تقييمك'], 'rv.text': ['Your review', 'رأيك'], 'rv.textPh': ['Taste, freshness, delivery — how was it?', 'الطعم، الطزاجة، التوصيل… كان عامل إزاي؟'],
    'rv.phone': ['Phone — not shown, only to match your order', 'الموبايل — مش هيظهر، بس عشان نطابق طلبك'], 'rv.send': ['Send review', 'ابعت التقييم'],
    'rv.thanks': ['Thank you! Your review shows up after a quick check.', 'شكراً! تقييمك هيظهر بعد مراجعة سريعة.'], 'rv.errRating': ['Pick a star rating.', 'اختار عدد النجوم.'],
    'rv.errText': ['Write a few words (10+ letters).', 'اكتب كلمتين على الأقل (١٠ حروف).'], 'rv.errName': ['Add your name.', 'اكتب اسمك.'], 'rv.bought': ['Bought', 'الصنف']
  };
  let lang = read(LS.lang, null);
  const isAr = () => lang === 'ar';
  function t(key, vars) {
    const ov = (C.copy || {})[key];
    let s = ov && (isAr() ? ov.ar : ov.en);
    if (!s) { const d = STR[key]; s = d ? (isAr() ? d[1] : d[0]) : key; }
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  /* pick a bilingual field: L(obj,'title') → obj.title_ar | obj.title_en */
  const L = (o, f) => { if (!o) return ''; const a = o[f + '_ar'], e = o[f + '_en']; return isAr() ? (a || e || '') : (e || a || ''); };
  const LL = o => (o ? (isAr() ? (o.ar || o.en || '') : (o.en || o.ar || '')) : '');

  /* money — western digits in both languages, currency label per language */
  function money(n, opts) {
    const v = Math.round((+n || 0) * 100) / 100;
    const s = v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
    if (opts === false) return s;
    return isAr() ? s + ' ' + (C.settings.currency_ar || 'ج.م') : s + ' ' + (C.settings.currency_en || 'EGP');
  }
  const date = (d, o) => { try { return new Date(d).toLocaleDateString(isAr() ? 'ar-EG' : 'en-GB', o || { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };

  /* ─────────────────────────── catalog ─────────────────────────── */
  const products = all => (C.products || []).filter(p => all || p.status === 'active');
  const product = idOrHandle => (C.products || []).find(p => p.id === idOrHandle || p.handle === idOrHandle);
  /* price of a colour: its own price if set, else the product price */
  const priceOf = (p, v) => (v && v.price != null && v.price !== '' && !isNaN(+v.price) ? +v.price : +(p && p.price) || 0);
  const minPrice = p => Math.min.apply(null, (p.variants && p.variants.length ? p.variants : [null]).map(v => priceOf(p, v)));
  const collections = all => (C.collections || []).filter(c => all || c.status === 'active');
  const collection = h => (C.collections || []).find(c => c.id === h || c.handle === h);
  const inCollection = h => products().filter(p => p.collection === h && collection(h) && collection(h).status === 'active').sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const variant = (p, vid) => (p && p.variants || []).find(v => v.id === vid || v.color === vid) || (p && p.variants && p.variants[0]);
  const title = p => L(p, 'title');
  const colourName = v => (v ? (isAr() ? (v.color_ar || v.color_en) : (v.color_en || v.color_ar)) : '');
  const img = (p, v, i) => { v = v || variant(p); return (v && v.images && v.images[i || 0]) || (p && p.variants && p.variants[0] && p.variants[0].images[0]) || ''; };
  function sign(id) { return (C.signs || []).find(s => s.id === id); }
  function signForDate(month, day) {
    // START = [month, day] each sign begins; walk from the latest start ≤ date
    const list = (C.signs || []).map(s => ({ s, m: s.start[0], d: s.start[1] })).sort((a, b) => a.m - b.m || a.d - b.d);
    let hit = null;
    list.forEach(x => { if (month > x.m || (month === x.m && day >= x.d)) hit = x.s; });
    return hit || list[list.length - 1].s; // before Jan 20 → Capricorn
  }

  /* produce: season (months 1-12), unit label, macro image for the lens */
  const inSeason = (p, m) => { const mm = m || (new Date().getMonth() + 1); return !p.months || !p.months.length || p.months.indexOf(mm) > -1; };
  const unitLabel = p => (p && p.unit === 'kg' ? t('p.perKg') : p && p.unit === 'bunch' ? t('p.perBunch') : p && p.unit === 'piece' ? t('p.perPiece') : '');

  /* stock: variant.track=false → unlimited; stock = { S: n, M: n, … } */
  function stockOf(v, size) { if (!v || !v.track) return Infinity; const n = (v.stock || {})[size]; return n == null ? 0 : +n; }
  function soldOut(p, v) { v = v || variant(p); if (!v || !v.track) return false; return (p.sizes || []).every(s => stockOf(v, s) <= 0); }

  /* drop / pre-order */
  const drop = () => C.drop || {};
  const dropTime = () => new Date(drop().date).getTime();
  const dropOpen = () => !!drop().on && Date.now() < dropTime();
  const isPre = p => !!(p && p.preorder && dropOpen() && drop().collection === p.collection);
  const deposit = price => Math.max(1, Math.round((price || 0) * (drop().depositPct || 20) / 100));
  function reservedCount() {
    const d = drop();
    const mine = orders.list().filter(o => o.status !== 'cancelled').reduce((n, o) => n + (o.items || []).filter(i => i.pre).reduce((m, i) => m + (i.qty || 1), 0), 0);
    return (+d.seed || 0) + mine + (+window.NZ_EXTRA_RESERVED || 0);
  }
  function countdown(to) {
    let ms = Math.max(0, to - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    return { d, h, m, s: Math.floor(ms / 1000), done: to <= Date.now() };
  }

  /* ─────────────────────────── cart ─────────────────────────── */
  const listeners = [];
  const emit = (what) => listeners.forEach(fn => { try { fn(what); } catch (e) { } });
  const on = fn => listeners.push(fn);

  const cart = {
    lines() { return read(LS.cart, []).filter(l => product(l.pid)); },
    save(ls) { write(LS.cart, ls); emit('cart'); },
    count() { return cart.lines().reduce((n, l) => n + l.qty, 0); },
    add(pid, vid, size, qty, extra) {
      const p = product(pid); if (!p) return false;
      const v = variant(p, vid); if (!v) return false;
      const pre = isPre(p);
      if (!pre && stockOf(v, size) <= 0) return false;
      const ls = cart.lines();
      const key = p.id + '|' + v.id + '|' + size + '|' + (pre ? 'pre' : 'buy');
      const ex = ls.find(l => l.key === key);
      if (ex) ex.qty = Math.min(pre ? 5 : Math.max(1, Math.min(10, stockOf(v, size))), ex.qty + (qty || 1));
      else ls.push(Object.assign({ key, pid: p.id, vid: v.id, size, qty: qty || 1, pre, at: Date.now() }, extra || {}));
      cart.save(ls); emit('added'); return true;
    },
    setQty(key, q) { const ls = cart.lines(); const l = ls.find(x => x.key === key); if (!l) return; if (q <= 0) return cart.remove(key); l.qty = Math.min(10, q); cart.save(ls); },
    remove(key) { cart.save(cart.lines().filter(l => l.key !== key)); },
    clear() { cart.save([]); write(LS.promo, null); },
    /* every money figure the bag / checkout shows */
    totals(zoneId, payment) {
      const lines = cart.lines();
      let full = 0, now = 0, merch = 0;
      const rows = lines.map(l => {
        const p = product(l.pid), v = variant(p, l.vid);
        const unit = priceOf(p, v), dep = l.pre ? deposit(unit) : unit;
        full += unit * l.qty; now += dep * l.qty; if (!l.pre) merch += unit * l.qty;
        return { l, p, v, unit, dep, line: unit * l.qty, lineNow: dep * l.qty };
      });
      const code = read(LS.promo, null), promo = code ? promoFind(code) : null;
      let discount = 0;
      if (promo && full >= (+promo.min || 0)) discount = promo.type === 'fixed' ? Math.min(+promo.value, full) : Math.round(full * (+promo.value) / 100);
      const S = C.settings.shipping || {};
      const zone = (S.zones || []).find(z => z.id === zoneId);
      const freeOver = +S.freeOver || 0;
      const onlyPre = rows.length && rows.every(r => r.l.pre);
      let delivery = zone ? +zone.fee || 0 : null;
      if (freeOver && full - discount >= freeOver) delivery = 0;
      // pre-order only: delivery is collected with the balance on delivery
      const deliveryNow = onlyPre ? 0 : (delivery || 0);
      const total = Math.max(0, full - discount) + (delivery || 0);
      // the discount is spread over the whole order, so a pre-order deposit
      // stays exactly {depositPct}% of what the customer will actually pay
      const ratio = full ? Math.max(0, full - discount) / full : 1;
      const dueNow = payment === 'cod' ? 0 : Math.round(now * ratio) + deliveryNow; // cash on delivery: everything is paid to the courier
      return { rows, full, now, merch, discount, promo, delivery, deliveryNow, total, dueNow, balance: Math.max(0, total - dueNow), freeOver, onlyPre, hasPre: rows.some(r => r.l.pre), count: lines.reduce((n, l) => n + l.qty, 0) };
    }
  };
  function promoFind(code) {
    code = String(code || '').trim().toUpperCase();
    const p = (C.promos || []).find(x => String(x.code).toUpperCase() === code && x.active);
    if (!p) return null;
    if (p.expiry && new Date(p.expiry + 'T23:59:59').getTime() < Date.now()) return null;
    if (+p.limit) { const used = orders.list().filter(o => (o.promo || '').toUpperCase() === code).length; if (used >= +p.limit) return null; }
    return p;
  }
  const promo = { get: () => read(LS.promo, null), set: c => { write(LS.promo, c ? String(c).toUpperCase() : null); emit('cart'); }, find: promoFind };

  /* ─────────────────────────── wishlist ─────────────────────────── */
  const wish = {
    list: () => read(LS.wish, []).filter(id => product(id)),
    has: id => read(LS.wish, []).indexOf(id) > -1,
    toggle(id) { const w = read(LS.wish, []); const i = w.indexOf(id); if (i > -1) w.splice(i, 1); else w.unshift(id); write(LS.wish, w); emit('wish'); return i < 0; }
  };

  /* ─────────────────────────── orders ─────────────────────────── */
  const orders = {
    list: () => read(LS.orders, []),
    get: id => orders.list().find(o => o.id === id),
    save(list) { write(LS.orders, list); emit('orders'); },
    create(info) {
      const T = cart.totals(info.zone, info.payment);
      if (!T.rows.length) return null;
      const id = 'FV' + (1000 + orders.list().length + 1) + '-' + uid().slice(0, 3);
      const o = {
        id, date: Date.now(), status: T.onlyPre ? 'reserved' : 'pending', lang,
        customer: { name: info.name, phone: info.phone, email: info.email || '' },
        address: { zone: info.zone, district: info.district, line: info.address, notes: info.notes || '' }, slot: info.slot || '', gift: !!info.gift,
        payment: info.payment, promo: T.promo ? T.promo.code : '',
        items: T.rows.map(r => ({ pid: r.p.id, vid: r.v.id, title_en: r.p.title_en, title_ar: r.p.title_ar, color_en: r.v.color_en, color_ar: r.v.color_ar, size: r.l.size, qty: r.l.qty, price: r.unit, pre: r.l.pre, deposit: r.l.pre ? r.dep : null, img: r.v.images[0], collection: r.p.collection, src: r.l.src || 'direct' })),
        totals: { subtotal: T.full, discount: T.discount, delivery: T.delivery || 0, total: T.total, dueNow: T.dueNow, balance: T.balance },
        preorder: T.hasPre, dropId: T.hasPre ? drop().id : null,
        log: [{ s: T.onlyPre ? 'reserved' : 'pending', t: Date.now() }]
      };
      const all = orders.list(); all.unshift(o); orders.save(all);
      send('nasij/v1/orders', o);
      write(LS.profile, { name: info.name, phone: info.phone, email: info.email || '', zone: info.zone, district: info.district, address: info.address, slot: info.slot || '' });
      cart.clear();
      emit('order'); try { window.NZ_TRACK && NZ_TRACK.event('purchase', { id, total: o.totals.total }); } catch (e) { }
      return o;
    },
    setStatus(id, s) { const all = orders.list(); const o = all.find(x => x.id === id); if (!o) return false; o.status = s; o.log = (o.log || []).concat([{ s, t: Date.now() }]); orders.save(all); return true; },
    remove(id) { orders.save(orders.list().filter(o => o.id !== id)); }
  };
  const profile = () => read(LS.profile, {});

  /* ─────────────────────────── custom requests ─────────────────────────── */
  const requests = {
    list: () => read(LS.requests, []),
    add(r) { send('nasij/v1/requests', r); const all = requests.list(); all.unshift(r); if (!write(LS.requests, all)) { r.images = []; all[0] = r; write(LS.requests, all); } emit('requests'); return r; },
    set(id, patch) { const all = requests.list(); const r = all.find(x => x.id === id); if (r) Object.assign(r, patch); write(LS.requests, all); },
    remove(id) { write(LS.requests, requests.list().filter(x => x.id !== id)); }
  };

  /* ─────────────────────────── reviews ───────────────────────────
     Published reviews live in the content (reviews[]) and are managed in the
     dashboard. Reviews are pooled per collection (every zodiac hoodie is the
     same garment), and a product's own reviews come first. */
  const reviews = {
    group: p => (p ? (p.reviewGroup || p.collection || p.id) : ''),
    all: () => (C.reviews || []).filter(r => r && r.status !== 'hidden' && +r.rating > 0),
    forProduct(p) {
      const g = reviews.group(p);
      return reviews.all().filter(r => { const q = product(r.pid); return r.pid === p.id || (q && reviews.group(q) === g); })
        .sort((a, b) => ((b.pid === p.id) - (a.pid === p.id)) || ((b.date || 0) - (a.date || 0)));
    },
    stats(list) {
      const dist = [0, 0, 0, 0, 0]; let sum = 0;
      list.forEach(r => { const x = Math.max(1, Math.min(5, Math.round(+r.rating || 0))); dist[x - 1]++; sum += Math.max(1, Math.min(5, +r.rating || 0)); });
      return { n: list.length, avg: list.length ? sum / list.length : 0, dist };
    },
    /* submitted from the product page: pending until approved in the dashboard */
    pending: () => read(LS.reviews, []),
    submit(r) { send('nasij/v1/reviews', r); const all = reviews.pending(); all.unshift(r); write(LS.reviews, all.slice(0, 50)); emit('reviews'); return r; }
  };

  /* WhatsApp deep link */
  const wa = text => 'https://wa.me/' + String(C.settings.whatsapp || '').replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');

  return {
    LS, read, write, clone, esc, $, $$, uid, reviews, priceOf, minPrice, wp: WP, api: WP ? api : null, withQ, abs, absAll, send, hash, merge, load, content, previewing, use(o) { C = o; }, get C() { return C; }, get DEF() { return DEF; }, get published() { return published; },
    STR, t, L, LL, isAr, get lang() { return lang; }, setLang(l) { lang = l; write(LS.lang, l); emit('lang'); }, initLang() { if (!lang) lang = (C.settings && C.settings.defaultLang) || 'en'; },
    money, date, products, product, collections, collection, inCollection, variant, title, colourName, img, sign, signForDate,
    stockOf, soldOut, inSeason, unitLabel, drop, dropTime, dropOpen, isPre, deposit, reservedCount, countdown,
    cart, promo, wish, orders, profile, requests, wa, on, emit
  };
})();
