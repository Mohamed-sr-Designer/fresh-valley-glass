/* =========================================================================
   Fresh Valley — "Liquid Lens" storefront (hash-routed single page)
   Reads everything from window.NZ (core.js): content, catalog, cart, orders.
   Routes: #/  #/shop  #/collections/:h  #/products/:h  #/hosting  #/standard
           #/journal(/:id)  #/faq  #/policies/:id  #/saved  #/orders
           #/order/:id  #/checkout
   ========================================================================= */
window.FVS = (function () {
  'use strict';
  const N = window.NZ, esc = N.esc, $ = N.$, $$ = N.$$;
  const t = (k, v) => N.t(k, v), L = (o, f) => N.L(o, f), LL = o => N.LL(o);
  const app = document.getElementById('app');
  let C = null;

  /* ─────────────── icons ─────────────── */
  const IC = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', bag: '<path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', home: '<path d="M4 11 12 4l8 7v9H4z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    box: '<path d="M4 9h16v11H4z"/><path d="M3 5h18v4H3z"/><path d="M12 5v15"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', check: '<path d="m5 12 4.5 4.5L19 7"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>', swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>', shield: '<path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    wa: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2.4 2.2 4.4 4.6 4.9l1.2-1.2 2 .9-.4 1.6c-3.8.3-8.4-3.9-8.1-7.8l1.6-.4.9 2z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 14 10"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    lens: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4M8.5 9.5a3 3 0 0 1 2.5-2"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
  const money = n => N.money(n);
  const sm = u => (typeof u === 'string' && /^images\/products\/[^/]+\.webp$/.test(u) && !/-(sm|macro)\.webp$/.test(u)) ? u.replace(/\.webp$/, '-sm.webp') : u;
  const pimg = p => N.img(p) || '';
  const defVar = p => (p.unit === 'kg' && p.variants[1] ? p.variants[1] : p.variants[0]);
  const hue = p => (p && p.hue) || '#AE9D57';
  const halo = (cls, h) => `<span class="halo ${cls || ''}"${h ? ` style="--hue:${esc(h)}"` : ''} aria-hidden="true"></span>`;
  const title = p => L(p, 'title');
  const packName = v => (N.isAr() ? (v.color_ar || v.color_en) : (v.color_en || v.color_ar)) || '';
  const outAll = p => p.variants.every(v => N.soldOut(p, v));
  const year = () => new Date().getFullYear();
  const go = h => { location.hash = h; };
  const seasonal = p => p.months && p.months.length && p.months.length < 12;
  function sortBest(list) { return list.slice().sort((a, b) => (b.sales || 0) - (a.sales || 0)); }
  function inSeasonList() {
    const prod = N.products().filter(p => !p.box && N.collection(p.collection) && N.collection(p.collection).status === 'active');
    const m = new Date().getMonth() + 1, nx = m % 12 + 1;
    const s = sortBest(prod.filter(p => seasonal(p) && (N.inSeason(p, m) || N.inSeason(p, nx))));
    /* fill with all-year produce, alternating fruit / vegetables / herbs so the row reads like a market stall */
    const rest = prod.filter(p => s.indexOf(p) < 0 && !seasonal(p)), by = {};
    rest.forEach(p => { (by[p.collection] = by[p.collection] || []).push(p); });
    Object.keys(by).forEach(k => { by[k] = by[k].sort((a, b) => (a.sort || 0) - (b.sort || 0)); });
    const mix = []; let added = true;
    for (let i = 0; added; i++) { added = false; ['vegetables', 'fruit', 'herbs'].forEach(k => { if (by[k] && by[k][i]) { mix.push(by[k][i]); added = true; } }); }
    return s.concat(mix, prod.filter(p => s.indexOf(p) < 0 && mix.indexOf(p) < 0));
  }
  const live = () => N.products().filter(p => { const c = N.collection(p.collection); return c && c.status === 'active'; });

  /* ─────────────── small UI ─────────────── */
  function toast(msg, o) {
    o = o || {};
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div'); el.className = 'toast gf rim';
    el.innerHTML = `${o.img ? `<img class="prod" src="${esc(sm(o.img))}" alt="">` : `<span class="ib" style="width:36px;height:36px;background:var(--forest);color:#fff">${ic('check')}</span>`}<span>${esc(msg)}</span>${o.action ? `<a href="${esc(o.href || '#')}" data-tclose>${esc(o.action)}</a>` : ''}`;
    box.appendChild(el); setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2800);
  }
  function badge(p) {
    if (outAll(p)) return `<span class="chip gf rim tag"><span class="dot dot--red"></span>${t('c.soldOut')}</span>`;
    if (p.box) return (p.badges || []).indexOf('bestseller') > -1 ? `<span class="chip gf rim tag">${t('c.bestseller')}</span>` : `<span class="chip gf rim tag">${esc(L(p.variants[0], 'serves') || t('c.tier'))}</span>`;
    if (seasonal(p) && N.inSeason(p)) return `<span class="chip gf rim tag"><span class="dot"></span>${t('c.inSeason')}</span>`;
    if ((p.badges || []).indexOf('organic') > -1) return `<span class="chip gf rim tag">${t('c.organic')}</span>`;
    return `<span class="chip gf rim tag">${esc((p.grade && p.grade.label) || 'A+')} · ${N.isAr() ? 'درجة' : 'grade'}</span>`;
  }

  /* ─────────────── product card ─────────────── */
  function card(p) {
    const v = defVar(p), out = outAll(p), h = '#/products/' + encodeURIComponent(p.handle);
    const sub = p.box ? (L(v, 'serves') || L(p, 'sub')) : L(p, 'origin');
    return `<article class="pc${out ? ' pc--out' : ''}" style="--hue:${esc(hue(p))}"><div class="pc__media">
      <a class="pc__well" href="${h}" data-zoom="${esc(pimg(p))}" data-z="2.5" aria-label="${esc(title(p))}">${halo()}<img class="prod" src="${esc(sm(pimg(p)))}" alt="${esc(title(p))}" loading="lazy" width="480" height="600"><span class="lens lens--live" aria-hidden="true"></span></a>
      ${badge(p)}
      <button class="pc__fav gf rim${N.wish.has(p.id) ? ' on' : ''}" data-fav="${esc(p.id)}" aria-label="${t('p.save')}">${ic('heart')}</button>
      ${out ? `<div class="notify gf rim"><span>${t('c.soldOut')}</span><button class="btn btn--dark btn--sm" data-notify="${esc(p.id)}">${t('p.notify')}</button></div>` : `<button class="pc__add gf rim" data-quick="${esc(p.id)}" aria-label="${t('p.addToBag')} — ${esc(title(p))}">+</button>`}</div>
      <div class="pc__meta"><div><h3><a href="${h}">${esc(title(p))}</a></h3><p>${esc(sub)}</p></div><span class="pc__pr num">${money(N.priceOf(p, v))}<small>${esc(packName(v))}</small></span></div>
    </article>`;
  }
  function rail(list, id) {
    if (list.length <= 4) return `<div class="grid">${list.map(card).join('')}</div>`;
    return `<div class="rail" id="${id}">${list.map(card).join('')}</div>`;
  }
  const railNav = id => `<div class="rnav"><button class="gf rim" data-rail="${id}" data-d="-1" aria-label="previous">${ic('back')}</button><button class="gf rim" data-rail="${id}" data-d="1" aria-label="next">${ic('next')}</button></div>`;

  /* ─────────────── home sections ─────────────── */
  const SEC = {};
  let heroPid = null;
  SEC.hero = s => {
    const base = N.product(s.product) || inSeasonList()[0];
    const p = N.product(heroPid) || base;
    const dockList = [base].concat(inSeasonList().filter(x => x.id !== base.id)).slice(0, 4);
    return `<section class="hero" data-hero="${esc(s.id)}" style="--hue:${esc(hue(p))}">${heroInner(s, p, base)}
      <div class="hero__dock gf rim" role="tablist">${dockList.map(x => `<button class="${x.id === p.id ? 'on' : ''}" data-herop="${esc(x.id)}" aria-label="${esc(title(x))}"><img class="prod" src="${esc(sm(pimg(x)))}" alt=""></button>`).join('')}</div></section>`;
  };
  function heroInner(s, p, base) {
    const v = defVar(p), g = p.grade || {};
    const kick = p === base && L(s, 'kicker') ? L(s, 'kicker') : `${title(p)} · ${L(p, 'origin')}`;
    return `<div class="hero__img" id="heroImg">${halo()}<img class="prod" src="${esc(pimg(p))}" alt="${esc(title(p))}" width="1000" height="1250" fetchpriority="high"></div>
      <div class="wrap"><div class="hero__copy">
        <span class="chip gf rim"><span class="dot"></span>${esc(kick)}</span>
        <h1 class="h1" style="margin-top:22px">${esc(L(s, 'title'))}<span>${esc(L(s, 'title2'))}</span></h1>
        <p class="lead">${esc(L(s, 'text'))}</p>
        <div class="hero__cta"><a class="btn btn--dark" href="${esc(s.to || '#/shop')}">${esc(L(s, 'cta'))} ${ic('arrow').replace('class="i"', 'class="i flip"')}</a>${L(s, 'cta2') ? `<a class="btn btn--glass gf rim" href="${esc(s.to2 || '#/standard')}">${esc(L(s, 'cta2'))}</a>` : ''}</div>
      </div></div>
      <div class="lns lns--a gc rim">${g.brix ? `<small>${t('p.sweet')}</small><h4>${esc(g.brix)} °Brix</h4><div class="meter"><i style="width:${Math.min(100, g.brix / 20 * 100)}%"></i></div><div class="kv"><span>${t('p.gradeSpec')}</span><b>${esc(g.label || 'A+')}</b></div>` : `<small>${t('p.calibre')}</small><h4>${esc(L(g, 'calibre') || 'A+')}</h4><div class="kv"><span>${t('p.gradeSpec')}</span><b>${esc(g.label || 'A+')}</b></div>`}</div>
      <div class="lns lns--b gf rim" data-quickcard="${esc(p.id)}">
        <small>${esc(title(p))}</small><h4>${esc(L(p, 'sub'))}</h4>
        <div class="packs" data-packs="${esc(p.id)}">${p.variants.map(x => `<button class="${x.id === v.id ? 'on' : ''}" data-pack="${esc(x.id)}"${N.soldOut(p, x) ? ' disabled' : ''}>${esc(packName(x))}<small class="num">${money(N.priceOf(p, x))}</small></button>`).join('')}</div>
        <div class="addrow"><button class="btn btn--dark" data-addsel="${esc(p.id)}">${t('p.addToBag')} · <span class="num" data-selprice>${money(N.priceOf(p, v))}</span></button></div>
      </div>`;
  }
  SEC.trust = s => `<section class="sec--tight"><div class="wrap"><div class="trust">${(s.items || []).map(x => `<div>${ic(x.icon === 'wa' ? 'wa' : x.icon)}<span>${esc(LL(x))}</span></div>`).join('')}</div></div></section>`;
  SEC.products = s => {
    let list = s.source === 'season' ? inSeasonList() : s.source === 'collection' ? N.inCollection(s.collection) : sortBest(live().filter(p => !p.box));
    if (s.source === 'best') { const shown = new Set(); (C.home.sections || []).filter(x => x.on !== false && x.type === 'products' && x.source === 'season').forEach(x => inSeasonList().slice(0, +x.limit || 8).forEach(p => shown.add(p.id))); const fresh = list.filter(p => !shown.has(p.id)); if (fresh.length >= 4) list = fresh; }
    list = list.slice(0, +s.limit || 8);
    if (!list.length) return '';
    const id = 'r-' + esc(s.id);
    return `<section class="sec"><div class="wrap"><div class="sec__h rv-in"><div><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2">${esc(L(s, 'title'))}</h2></div><div style="display:flex;gap:12px;align-items:center">${list.length > 4 ? railNav(id) : ''}<a class="btn btn--glass gf rim btn--sm" href="#/shop${s.source === 'season' ? '?season=1' : ''}">${t('c.viewAll')}</a></div></div>${rail(list, id)}</div></section>`;
  };
  SEC.lens = s => {
    const p = N.product(s.product) || inSeasonList()[0], g = p.grade || {};
    return `<section class="sec clip"><div class="wrap"><div class="lensx">
      <div class="stage-wrap">${halo('', hue(p))}<div class="lensx__stage" data-zoom="${esc(pimg(p))}" data-z="2.6" data-keep="1" style="aspect-ratio:4/5"><img class="prod" src="${esc(pimg(p))}" alt="${esc(title(p))}" loading="lazy"><span class="lens lens--live on" style="left:58%;top:46%;background-image:url('${esc(p.macro || pimg(p))}');background-size:cover;background-position:center" aria-hidden="true"></span><span class="chip gt lensx__hint">${ic('lens')} ${t('p.lensHint')}</span></div></div>
      <div class="rv-in"><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2" style="margin:12px 0 18px">${esc(L(s, 'title'))}</h2><p class="lead">${esc(L(s, 'text'))}</p>
        <div class="gradecard gf rim" style="margin-top:28px">
          <div class="top"><div><small>${t('p.grade')}</small><div class="big">${esc(g.label || 'A+')}</div></div><span class="chip gt">${esc(title(p))}</span></div>
          ${g.brix ? `<div style="margin:14px 0 6px"><small>${t('p.sweet')}</small><div class="meter"><i style="width:${Math.min(100, g.brix / 20 * 100)}%"></i></div><div class="kv"><span>0–20 °Brix</span><b>${esc(g.brix)} °Brix</b></div></div>` : ''}
          <div class="row"><span>${t('p.calibre')}</span><b>${esc(L(g, 'calibre'))}</b></div>
          <div class="row"><span>${t('p.origin')}</span><b>${esc(L(p, 'origin'))}</b></div>
          <div class="row"><span>${t('p.season')}</span><b>${esc(L(p, 'season'))}</b></div>
          <a class="btn btn--dark btn--block" style="margin-top:10px" href="#/products/${esc(p.handle)}">${t('c.shopNow')} · ${money(N.priceOf(p, defVar(p)))}</a>
        </div></div></div></div></section>`;
  };
  SEC.collections = s => {
    const cs = N.collections().filter(c => N.inCollection(c.handle).length);
    return `<section class="sec"><div class="wrap"><div class="sec__h rv-in"><div><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2">${esc(L(s, 'title'))}</h2></div></div>
      <div class="doors">${cs.map(c => { const hp = N.product(c.hero); return `<a class="door rv-in" href="#/collections/${esc(c.handle)}" style="--hue:${esc(hp ? hue(hp) : '#AE9D57')}">${halo()}<img class="prod" src="${esc(sm(c.image))}" alt="${esc(L(c, 'title'))}" loading="lazy"><span class="door__lbl gf rim"><span><b>${esc(L(c, 'title'))}</b><span>${t('l.count', { n: N.inCollection(c.handle).length })}</span></span><span class="arr">${ic('arrow')}</span></span></a>`; }).join('')}</div></div></section>`;
  };
  function boxCard(p, big) {
    const v = p.variants[0];
    return `<article class="bx rv-in" style="--hue:${esc(hue(p))}"><a class="bx__img" href="#/products/${esc(p.handle)}">${halo()}<img class="prod" src="${esc(big ? pimg(p) : sm(pimg(p)))}" alt="${esc(title(p))}" loading="lazy"></a>
      <div class="bx__info gf rim"><span class="kick">${esc(L(v, 'serves'))}</span><h3>${esc(title(p))}</h3><p>${esc(L(p, 'sub'))}</p>
        <div class="row"><span class="pr num">${p.variants.length > 1 ? t('c.from') + ' ' : ''}${money(N.minPrice(p))}</span><button class="btn btn--dark btn--sm" data-quick="${esc(p.id)}">${t('c.add')}</button></div></div></article>`;
  }
  SEC.boxes = s => {
    const bs = N.inCollection('boxes').slice(0, 3);
    if (!bs.length) return '';
    return `<section class="sec"><div class="wrap"><div class="sec__h rv-in"><div><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2">${esc(L(s, 'title'))}</h2>${L(s, 'text') ? `<p class="lead">${esc(L(s, 'text'))}</p>` : ''}</div><a class="btn btn--glass gf rim btn--sm" href="#/collections/boxes">${t('c.viewAll')}</a></div>
      <div class="boxes">${bs.map((p, i) => boxCard(p, !i)).join('')}</div></div></section>`;
  };
  const STD_MACRO = ['strawberry', 'orange', 'tomato'];
  SEC.standard = s => `<section class="sec"><div class="wrap"><div class="sec__h rv-in"><div><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2">${esc(L(s, 'title'))}</h2></div><a class="btn btn--glass gf rim btn--sm" href="#/standard">${t('m.standard')}</a></div>
    <div class="std">${(s.steps || []).map((x, i) => { const mp = N.product(STD_MACRO[i % 3]); return `<div class="std__s rv-in"><span class="n">0${i + 1}</span>${mp && mp.macro ? `<span class="lens" style="background-image:url('${esc(mp.macro)}')" aria-hidden="true"></span>` : ''}<h3>${esc(LL(x))}</h3><p>${esc(N.isAr() ? (x.t_ar || x.t_en) : (x.t_en || x.t_ar))}</p></div>`; }).join('')}</div></div></section>`;
  SEC.band = s => `<section class="sec"><div class="wrap"><div class="band rv-in"><span class="halo" style="--hue:#AE9D57;right:-160px;top:-200px" aria-hidden="true"></span><div style="position:relative;z-index:2"><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2">${esc(L(s, 'title'))}</h2><p>${esc(L(s, 'text'))}</p></div>
    <div class="gw"><span class="chip" style="background:rgba(255,255,255,.1);color:#fff"><span class="dot"></span>${t('m.hosting')}</span><a class="btn btn--olive" href="${esc(s.to || '#/hosting')}">${esc(L(s, 'cta'))}</a><a class="btn" style="background:rgba(255,255,255,.1);color:#fff" target="_blank" rel="noopener" href="${esc(N.wa(t('p.waMsg')))}">${ic('wa')} ${t('c.whatsapp')}</a></div></div></div></section>`;
  SEC.editorial = s => `<section class="sec"><div class="wrap"><div class="edit"><div class="edit__img rv-in">${s.image ? `<img class="prod" src="${esc(s.image)}" alt="" loading="lazy">` : ''}</div><div class="rv-in"><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2" style="margin:12px 0 18px">${esc(L(s, 'title'))}</h2><p class="lead">${esc(L(s, 'text'))}</p>${L(s, 'cta') ? `<a class="btn btn--dark" style="margin-top:26px" href="${esc(s.to || '#/shop')}">${esc(L(s, 'cta'))}</a>` : ''}</div></div></div></section>`;
  SEC.faq = s => `<section class="sec"><div class="wrap" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:40px" data-faqgrid><div class="rv-in"><span class="kick">${esc(L(s, 'kicker'))}</span><h2 class="h2" style="margin-top:12px">${esc(L(s, 'title'))}</h2><a class="btn btn--glass gf rim btn--sm" style="margin-top:22px" href="#/faq">${t('c.viewAll')}</a></div>${faqList((C.pages.faq || []).slice(0, +s.limit || 5))}</div></section>`;
  const faqList = list => `<div class="faq">${list.map(q => `<details class="qa"><summary>${esc(L(q, 'q'))}${ic('plus')}</summary><div>${esc(L(q, 'a'))}</div></details>`).join('')}</div>`;

  function home() {
    return (C.home.sections || []).filter(s => s.on !== false && SEC[s.type]).map(s => { try { return SEC[s.type](s); } catch (e) { console.error(e); return ''; } }).join('');
  }

  /* ─────────────── shop / collection ─────────────── */
  function shop(handle, q) {
    const col = handle ? N.collection(handle) : null;
    if (handle && (!col || col.status !== 'active')) return notFound();
    let list = col ? N.inCollection(col.handle) : live();
    const qq = (q.q || '').trim().toLowerCase();
    if (qq) list = list.filter(p => (p.title_en + ' ' + p.title_ar + ' ' + (p.tags || []).join(' ') + ' ' + p.origin_en).toLowerCase().indexOf(qq) > -1);
    if (q.season === '1') list = list.filter(p => p.box || N.inSeason(p));
    const sort = q.sort || 'featured';
    if (sort === 'low') list = list.slice().sort((a, b) => N.minPrice(a) - N.minPrice(b));
    else if (sort === 'high') list = list.slice().sort((a, b) => N.minPrice(b) - N.minPrice(a));
    else if (sort === 'best') list = sortBest(list);
    else if (!col) list = list.slice().sort((a, b) => ((N.inSeason(b) && seasonal(b)) - (N.inSeason(a) && seasonal(a))) || (a.box - b.box) || ((b.sales || 0) - (a.sales || 0)));
    const hp = col ? N.product(col.hero) : N.product('orange');
    const qs = patch => '#' + (col ? '/collections/' + col.handle : '/shop') + '?' + new URLSearchParams(Object.assign({}, q, patch)).toString().replace(/(^|&)[a-z]+=(?=&|$)/g, '');
    return `<section class="ph" style="--hue:${esc(hp ? hue(hp) : '#AE9D57')}">${halo()}${hp ? `<img class="ph__img prod" src="${esc(sm(pimg(hp)))}" alt="">` : ''}<div class="wrap">
        <nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${col ? esc(L(col, 'title')) : t('l.title')}</span></nav>
        <h1 class="h2">${col ? esc(L(col, 'title')) : (qq ? `“${esc(q.q)}”` : t('l.title'))}</h1><p class="lead">${col ? esc(L(col, 'desc')) : esc(L(C.settings, 'tagline'))}</p></div></section>
      <section class="sec--tight" style="padding-top:0"><div class="wrap">
        <div class="toolbar"><div class="seg"><a href="#/shop${q.season ? '?season=1' : ''}" class="${!col ? 'on' : ''}">${t('l.all')}</a>${N.collections().map(c => `<a href="#/collections/${esc(c.handle)}${q.season ? '?season=1' : ''}" class="${col && col.id === c.id ? 'on' : ''}">${esc(L(c, 'short') || L(c, 'title'))}</a>`).join('')}</div>
          <div class="toolbar__r"><label class="toggle"><input type="checkbox" data-goto="${esc(qs({ season: q.season === '1' ? '' : '1' }))}"${q.season === '1' ? ' checked' : ''}>${t('l.season')}</label>
            <select class="inp sortsel" aria-label="${t('l.sort')}" data-sort="${esc(qs({ sort: '__' }))}">${[['featured', 'l.sort.featured'], ['best', 'l.sort.best'], ['low', 'l.sort.low'], ['high', 'l.sort.high']].map(([k, l]) => `<option value="${k}"${sort === k ? ' selected' : ''}>${t(l)}</option>`).join('')}</select></div></div>
        <p class="small muted" style="margin:-8px 0 18px">${t('l.count', { n: list.length })}</p>
        ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty">${ic('leaf')}<p>${qq ? t('m.noResults', { q: esc(q.q) }) : t('l.empty')}</p><a class="btn btn--dark" href="#/shop">${t('l.shopAll')}</a></div>`}
      </div></section>`;
  }

  /* ─────────────── product page ─────────────── */
  let pdp = null;
  function product(handle) {
    const p = N.product(decodeURIComponent(handle || ''));
    const col = p && N.collection(p.collection);
    if (!p || p.status !== 'active' || !col || col.status !== 'active') return notFound(t('p.notFound'));
    const sel = pdp && pdp.p.id === p.id ? pdp.v : (p.variants.find(v => !N.soldOut(p, v) && v.id === defVar(p).id) || p.variants.find(v => !N.soldOut(p, v)) || defVar(p));
    pdp = { p, v: sel, qty: (pdp && pdp.p.id === p.id && pdp.qty) || 1 };
    const g = p.grade || {}, img = pimg(p), out = N.soldOut(p, sel);
    const reviews = N.reviews.all().filter(r => r.pid === p.id), st = N.reviews.stats(reviews);
    const pairs = (p.pairings || []).map(id => N.product(id)).filter(x => x && x.status === 'active').concat(N.inCollection(p.collection).filter(x => x.id !== p.id)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
    const stock = sel.track ? N.stockOf(sel, 'one') : Infinity;
    return `<div class="wrap"><nav class="crumbs" style="margin-top:22px"><a href="#/">${t('nav.home')}</a><span>/</span><a href="#/collections/${esc(col.handle)}">${esc(L(col, 'title'))}</a><span>/</span><span>${esc(title(p))}</span></nav>
      <div class="pdp" style="--hue:${esc(hue(p))}">
        <div class="pdp__gal">
          <div class="pdp__stage" data-zoom="${esc(img)}" data-z="2.3">${halo()}<img class="prod" id="pdpImg" src="${esc(img)}" alt="${esc(title(p))}" width="1000" height="1250"><span class="lens lens--live" aria-hidden="true"></span>
            <div class="tagrow">${badge(p).replace(' tag"', '"')}</div>
            ${!p.box ? `<span class="chip gt hint">${ic('lens')} ${t('p.lensHint')}</span>` : ''}</div>
          ${p.macro ? `<div class="pdp__thumbs"><button class="on" data-thumb="${esc(img)}"><img class="prod" src="${esc(sm(img))}" alt=""></button><button data-thumb="${esc(p.macro)}"><img src="${esc(p.macro)}" alt="${t('c.lens')}"></button></div>` : ''}
        </div>
        <div class="pdp__info">
          <span class="kick">${esc(L(p, 'origin'))} · ${esc(L(p, 'season'))}</span>
          <h1 class="h2">${esc(title(p))}</h1>
          <p class="pdp__sub">${esc(L(p, 'sub'))}</p>
          <div class="pdp__price"><b class="num" id="pdpPrice">${money(N.priceOf(p, sel))}</b>${p.compareAt && p.compareAt > p.price ? `<s class="num">${money(p.compareAt)}</s>` : ''}<small id="pdpPack">${esc(packName(sel))}</small></div>
          ${reviews.length ? `<a href="#/products/${esc(p.handle)}" data-scroll="rvs" class="small muted" style="display:inline-flex;gap:8px;margin:-8px 0 18px"><span class="rstars">${'★'.repeat(Math.round(st.avg))}</span>${st.avg.toFixed(1)} · ${reviews.length === 1 ? t('rv.one') : t('rv.count', { n: reviews.length })}</a>` : ''}
          <span class="pdp__lbl">${p.box ? t('c.tier') : t('c.pack')}</span>
          <div class="packs" data-pdppacks>${p.variants.map(v => `<button class="${v.id === sel.id ? 'on' : ''}" data-pdpv="${esc(v.id)}"${N.soldOut(p, v) ? ' disabled' : ''}>${esc(packName(v))}<small class="num">${money(N.priceOf(p, v))}${p.box && L(v, 'serves') ? ' · ' + esc(L(v, 'serves')) : ''}</small></button>`).join('')}</div>
          ${stock !== Infinity && stock > 0 && stock <= 5 ? `<p class="small" style="color:var(--warn);font-weight:600;margin:12px 0 0">${t('p.lowStock', { n: stock })}</p>` : ''}
          <div class="pdp__buy" id="pdpBuy">${out ? `<button class="btn btn--dark" data-notify="${esc(p.id)}">${t('p.notify')}</button>` : `<span class="step"><button data-pq="-1" aria-label="−">−</button><span id="pdpQty">${pdp.qty}</span><button data-pq="1" aria-label="+">+</button></span><button class="btn btn--dark" data-pdpadd>${t('p.addToBag')}</button>`}
            <a class="btn btn--wa" target="_blank" rel="noopener" data-pdpwa href="${esc(N.wa(t('p.waMsg') + '\n' + title(p) + ' — ' + packName(sel)))}">${ic('wa')}</a>
            <button class="ib gf rim${N.wish.has(p.id) ? ' on' : ''}" data-fav="${esc(p.id)}" aria-label="${t('p.save')}">${ic('heart')}</button></div>
          <div class="pdp__lines"><div>${ic('clock')}<span>${t('p.today')}</span></div><div>${ic('shield')}<span>${t('p.promise')}</span></div></div>
          ${!p.box ? `<div class="gradecard gf rim" style="margin-bottom:26px"><div class="top"><div><small>${t('p.gradeSpec')}</small><div class="big">${esc(g.label || 'A+')}</div></div><span class="chip gt">${t('c.export')}</span></div>
            ${g.brix ? `<div style="margin:14px 0 6px"><small>${t('p.sweet')}</small><div class="meter"><i style="width:${Math.min(100, g.brix / 20 * 100)}%"></i></div><div class="kv"><span>0–20 °Brix</span><b>${esc(g.brix)} °Brix</b></div></div>` : ''}
            <div class="row"><span>${t('p.calibre')}</span><b>${esc(L(g, 'calibre'))}</b></div><div class="row"><span>${t('p.origin')}</span><b>${esc(L(p, 'origin'))}</b></div><div class="row"><span>${t('p.season')}</span><b>${esc(L(p, 'season'))}</b></div></div>`
            : `<div style="margin-bottom:26px"><span class="pdp__lbl">${t('p.inside')}</span><div class="inc">${(N.isAr() ? (p.includes_ar || p.includes_en) : (p.includes_en || p.includes_ar) || []).map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`}
          <div class="acc">
            <details open><summary>${t('p.details')}${ic('plus')}</summary><div class="body">${esc(L(p, 'desc'))}</div></details>
            <details><summary>${t('p.storage')}${ic('plus')}</summary><div class="body">${esc(L(p, 'storage'))}</div></details>
            <details><summary>${t('p.delivery')}${ic('plus')}</summary><div class="body">${esc(L(C.settings.shipping, 'eta'))} ${t('p.promise')}</div></details>
          </div>
        </div>
      </div></div>
      ${pairs.length ? `<section class="sec"><div class="wrap"><div class="sec__h"><div><span class="kick">${t('p.pairs')}</span><h2 class="h2">${t('p.also')}</h2></div>${pairs.length > 4 ? railNav('r-pairs') : ''}</div>${rail(pairs, 'r-pairs')}</div></section>` : ''}
      <section class="sec" id="rvs" style="padding-top:0"><div class="wrap"><div class="sec__h"><div><span class="kick">${t('rv.title')}</span><h2 class="h2">${reviews.length ? st.avg.toFixed(1) + ' / 5' : t('rv.title')}</h2></div></div>
        <div class="rv"><div class="rv__sum">${reviews.length ? `<div class="big">${st.avg.toFixed(1)}</div><div class="rstars">${'★'.repeat(Math.round(st.avg))}</div><p class="small muted">${reviews.length === 1 ? t('rv.one') : t('rv.count', { n: reviews.length })}</p>` : `<p class="muted" style="margin-top:0">${t('rv.first')}</p>`}
          <form id="rvForm" novalidate><div class="stars-in">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="r" id="rs${n}" value="${n}"><label for="rs${n}" aria-label="${n}">★</label>`).join('')}</div>
            <input class="inp" name="name" placeholder="${t('rv.name')}"><textarea class="inp" name="text" rows="3" placeholder="${t('rv.textPh')}"></textarea><input class="inp" name="phone" inputmode="tel" placeholder="${t('rv.phone')}"><p class="err" id="rvErr" hidden></p><button class="btn btn--dark">${t('rv.send')}</button></form></div>
          <div class="rv__list">${reviews.map(r => `<div class="rv__i"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(r.name)}</b><span class="rstars">${'★'.repeat(Math.round(r.rating))}</span></div>${r.verified ? `<span class="stat" style="margin-top:6px">${ic('check')} ${t('rv.verified')}</span>` : ''}<p dir="auto">${esc(r.text)}</p></div>`).join('') || `<div class="empty" style="padding:30px">${ic('leaf')}<p>${t('rv.none')}</p></div>`}</div></div></div></section>
      <div class="buybar gf rim" id="buybar"><img class="prod" src="${esc(sm(img))}" alt=""><div class="t"><b>${esc(title(p))}</b><span class="num" data-bbprice>${money(N.priceOf(p, sel))} · ${esc(packName(sel))}</span></div>${out ? '' : `<button class="btn btn--dark btn--sm" data-pdpadd>${t('c.add')}</button>`}</div>`;
  }
  function pdpRefresh() {
    if (!pdp) return;
    const { p, v } = pdp;
    $$('[data-pdpv]').forEach(b => b.classList.toggle('on', b.dataset.pdpv === v.id));
    const pr = $('#pdpPrice'); if (pr) pr.textContent = money(N.priceOf(p, v));
    const pk = $('#pdpPack'); if (pk) pk.textContent = packName(v);
    const bb = $('[data-bbprice]'); if (bb) bb.textContent = money(N.priceOf(p, v)) + ' · ' + packName(v);
    const wa = $('[data-pdpwa]'); if (wa) wa.href = N.wa(t('p.waMsg') + '\n' + title(p) + ' — ' + packName(v) + ' × ' + pdp.qty);
    const q = $('#pdpQty'); if (q) q.textContent = pdp.qty;
  }
  function addToBag(p, v, qty) {
    v = v || defVar(p);
    if (N.soldOut(p, v)) { toast(t('c.soldOut')); return false; }
    if (!N.cart.add(p.id, v.id, 'one', qty || 1)) { toast(t('c.soldOut')); return false; }
    try { window.NZ_TRACK && NZ_TRACK.event('add_to_cart', { id: p.id }); } catch (e) { }
    toast(t('p.added') + ' — ' + title(p), { img: pimg(p), action: t('b.checkout'), href: '#/checkout' });
    return true;
  }

  /* ─────────────── hosting (boxes + events) ─────────────── */
  function hosting(q) {
    const bs = N.inCollection('boxes'), P = C.pages.custom || {}, hp = N.product('hosting-box');
    const kinds = P.materials || [];
    return `<section class="ph" style="--hue:${esc(hp ? hue(hp) : '#E5383F')};padding-bottom:20px">${halo()}${hp ? `<img class="ph__img prod" src="${esc(pimg(hp))}" alt="" style="width:min(44vw,520px)">` : ''}<div class="wrap">
        <nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${t('m.hosting')}</span></nav>
        <span class="kick">${t('m.hosting')}</span><h1 class="h1" style="margin-top:16px;max-width:780px">${N.isAr() ? 'هات صندوق،<span style="display:block;color:var(--olive)">مش كيس حلويات.</span>' : 'Bring a box,<span style="display:block;font-style:italic;color:var(--olive)">not a bag of sweets.</span>'}</h1>
        <p class="lead" style="margin-top:22px">${N.isAr() ? 'في مصر، إنك تروح زيارة بإيد فاضية مش وارد. صناديق فريش فالي بتخلّي الهدية دي سفرة كاملة — فاكهة متفرزة ومترتبة، بتوصل قبلك.' : 'In Egypt, you never arrive empty-handed. Fresh Valley boxes turn that gesture into a whole table — graded, arranged fruit that arrives before you do.'}</p>
        <div class="hero__cta" style="margin-top:28px"><a class="btn btn--dark" href="#/collections/boxes">${t('c.shopNow')}</a><a class="btn btn--glass gf rim" href="#/hosting" data-scroll="event">${esc(L(P, 'title'))}</a></div></div></section>
      <section class="sec" style="padding-top:30px"><div class="wrap"><div class="boxes">${bs.slice(0, 3).map((p, i) => boxCard(p, !i)).join('')}</div>${bs.length > 3 ? `<div class="boxes boxes--more">${bs.slice(3).map(p => boxCard(p)).join('')}</div>` : ''}</div></section>
      <section class="sec" id="event"><div class="wrap"><div class="band" style="grid-template-columns:1fr 1.1fr;align-items:start">${'<span class="halo" style="--hue:#AE9D57;left:-160px;bottom:-260px;width:520px;height:520px" aria-hidden="true"></span>'}
        <div style="position:relative;z-index:2"><span class="kick">${t('r.title')}</span><h2 class="h2">${esc(L(P, 'title'))}</h2><p>${esc(L(P, 'text'))}</p><p style="font-size:14px">${t('r.fine')}</p></div>
        <form class="evform gf rim" id="evForm" novalidate style="color:var(--ink)">
          <div id="evBody"><div style="display:grid;gap:12px">
            <label class="fld">${t('r.kind')}<select class="inp" name="kind">${kinds.map(k => `<option value="${esc(k.en)}">${esc(LL(k))}</option>`).join('')}</select></label>
            <div class="f2"><label class="fld">${t('r.date')}<input class="inp" name="when" type="date"></label><label class="fld">${t('r.guests')}<input class="inp" name="guests" type="number" min="1" inputmode="numeric"></label></div>
            <div class="f2"><label class="fld">${t('k.name')}<input class="inp" name="name" autocomplete="name"></label><label class="fld">${t('k.phone')}<input class="inp" name="phone" inputmode="tel" autocomplete="tel" dir="ltr"></label></div>
            <div class="f2"><label class="fld">${t('r.budget')}<input class="inp" name="budget" type="number" min="0" inputmode="numeric"></label><label class="fld">${t('r.alt')}<input class="inp" name="alt" dir="auto"></label></div>
            <label class="fld">${t('r.notes')}<textarea class="inp" name="notes" rows="3"></textarea></label>
            <p class="err" id="evErr" hidden></p><button class="btn btn--dark btn--block">${t('r.send')}</button></div></div>
        </form></div></div></section>`;
  }

  /* ─────────────── standard page ─────────────── */
  function standard() {
    const s = (C.home.sections || []).find(x => x.type === 'standard') || { steps: [] };
    const hp = N.product('strawberry');
    const rows = live().filter(p => !p.box);
    return `<section class="ph" style="--hue:${esc(hp ? hue(hp) : '#E5383F')}">${halo()}${hp ? `<img class="ph__img prod" src="${esc(pimg(hp))}" alt="">` : ''}<div class="wrap"><nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${t('m.standard')}</span></nav>
        <span class="kick">Class A+</span><h1 class="h1" style="margin-top:16px;max-width:820px">${esc(L(s, 'title') || t('m.standard'))}</h1>
        <p class="lead" style="margin-top:22px">${N.isAr() ? 'A+ مش شعار — دي قايمة فحص. كل صنف بيتقاس ويتفحص ويتذاق قبل ما يخرج من المزرعة، وده الجدول اللي بنشتغل بيه.' : 'A+ isn’t a slogan — it’s a checklist. Every item is measured, inspected and tasted before it leaves the farm. This is the sheet we grade to.'}</p></div></section>
      <section class="sec" style="padding-top:20px"><div class="wrap"><div class="std">${(s.steps || []).map((x, i) => { const mp = N.product(STD_MACRO[i % 3]); return `<div class="std__s rv-in"><span class="n">0${i + 1}</span>${mp && mp.macro ? `<span class="lens" style="background-image:url('${esc(mp.macro)}')" aria-hidden="true"></span>` : ''}<h3>${esc(LL(x))}</h3><p>${esc(N.isAr() ? (x.t_ar || x.t_en) : (x.t_en || x.t_ar))}</p></div>`; }).join('')}</div></div></section>
      <section class="sec" style="padding-top:0"><div class="wrap"><div class="sec__h"><div><span class="kick">${t('p.gradeSpec')}</span><h2 class="h2">${N.isAr() ? 'ورقة الفرز' : 'The grading sheet'}</h2></div></div>
        <div class="specwrap"><table class="spec"><thead><tr><th>${N.isAr() ? 'الصنف' : 'Item'}</th><th>${t('p.grade')}</th><th>${t('p.calibre')}</th><th>${t('p.sweet')}</th><th>${t('p.origin')}</th><th>${t('p.season')}</th></tr></thead><tbody>
        ${rows.map(p => `<tr><td><a class="nm" href="#/products/${esc(p.handle)}"><img class="prod" src="${esc(sm(pimg(p)))}" alt="" loading="lazy">${esc(title(p))}</a></td><td><b>${esc((p.grade || {}).label || 'A+')}</b></td><td>${esc(L(p.grade || {}, 'calibre'))}</td><td class="num">${(p.grade || {}).brix ? esc(p.grade.brix) + ' °Brix' : '—'}</td><td>${esc(L(p, 'origin'))}</td><td>${esc(L(p, 'season'))}</td></tr>`).join('')}</tbody></table></div></div></section>`;
  }

  /* ─────────────── journal / faq / policies ─────────────── */
  function journal(id) {
    const js = (C.journal || []).filter(a => a.status !== 'draft');
    if (id) {
      const a = js.find(x => x.id === id); if (!a) return notFound();
      return `<article class="sec" style="padding-top:40px"><div class="wrap"><nav class="crumbs"><a href="#/journal">${t('m.journal')}</a><span>/</span><span>${esc(L(a, 'cat'))}</span></nav>
        <div class="prose"><span class="kick">${esc(L(a, 'cat'))} · ${esc(a.date || '')}</span><h1 class="h2" style="margin:14px 0 24px">${esc(L(a, 'title'))}</h1><p class="lead">${esc(L(a, 'excerpt'))}</p>
        <div class="jc__img" style="margin:30px 0">${a.image ? `<img class="prod" src="${esc(a.image)}" alt="">` : ''}</div>${L(a, 'body')}</div></div></article>`;
    }
    return `<section class="ph"><div class="wrap"><nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${t('m.journal')}</span></nav><h1 class="h2">${t('m.journal')}</h1><p class="lead">${N.isAr() ? 'عن الضيافة، والمواسم، وإزاي تخلّي الفاكهة في أحسن حالها.' : 'On hosting, seasons, and keeping produce at its best.'}</p></div></section>
      <section class="sec" style="padding-top:10px"><div class="wrap"><div class="jgrid">${js.map(a => `<a class="jc rv-in" href="#/journal/${esc(a.id)}"><div class="jc__img">${a.image ? `<img class="prod" src="${esc(sm(a.image))}" alt="" loading="lazy">` : ''}</div><span class="kick" style="margin-top:16px">${esc(L(a, 'cat'))}</span><h3>${esc(L(a, 'title'))}</h3><p>${esc(L(a, 'excerpt'))}</p></a>`).join('')}</div></div></section>`;
  }
  const faqPage = () => `<section class="ph"><div class="wrap"><nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${t('m.faq')}</span></nav><h1 class="h2">${t('m.faq')}</h1></div></section><section class="sec" style="padding-top:10px"><div class="wrap">${faqList(C.pages.faq || [])}</div></section>`;
  function policy(id) {
    const p = (C.pages.policies || []).find(x => x.id === id); if (!p) return notFound();
    return `<section class="ph"><div class="wrap"><nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${esc(L(p, 'title'))}</span></nav><h1 class="h2">${esc(L(p, 'title'))}</h1></div></section><section class="sec" style="padding-top:10px"><div class="wrap"><div class="prose" style="margin:0">${L(p, 'body')}</div></div></section>`;
  }

  /* ─────────────── saved / orders ─────────────── */
  function saved() {
    const list = N.wish.list().map(N.product).filter(p => p && p.status === 'active');
    return `<section class="ph"><div class="wrap"><h1 class="h2">${t('a.saved')}</h1></div></section><section class="sec" style="padding-top:10px"><div class="wrap">${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty">${ic('heart')}<p>${t('a.noSaved')}</p><a class="btn btn--dark" href="#/shop">${t('c.shopNow')}</a></div>`}</div></section>`;
  }
  const stat = s => `<span class="stat"><span class="dot${s === 'cancelled' ? ' dot--red' : s === 'pending' ? ' dot--amber' : ''}"></span>${t('o.st.' + s)}</span>`;
  function orders() {
    const os = N.orders.list();
    return `<section class="ph"><div class="wrap"><h1 class="h2">${t('a.title')}</h1></div></section><section class="sec" style="padding-top:10px"><div class="wrap" style="max-width:880px">${os.length ? `<div class="olist">${os.map(o => `<a class="ocard" href="#/order/${esc(o.id)}"><span class="imgs">${o.items.slice(0, 4).map(i => `<img class="prod" src="${esc(sm(i.img))}" alt="">`).join('')}</span><span style="flex:1;min-width:0;margin-inline-start:12px"><b>${esc(o.id)}</b><br><span class="small muted">${N.date(o.date)} · ${o.items.reduce((n, i) => n + i.qty, 0)} ${t('c.items')}</span></span>${stat(o.status)}<b class="num">${money(o.totals.total)}</b></a>`).join('')}</div>` : `<div class="empty">${ic('bag')}<p>${t('a.none')}</p><a class="btn btn--dark" href="#/shop">${t('c.shopNow')}</a></div>`}</div></section>`;
  }
  function waOrderText(o) {
    const S = C.settings;
    return (N.isAr() ? `أهلاً فريش فالي، ده طلبي رقم ${o.id}:\n` : `Hi Fresh Valley, this is my order ${o.id}:\n`) + o.items.map(i => `• ${N.isAr() ? i.title_ar : i.title_en} — ${N.isAr() ? i.color_ar : i.color_en} × ${i.qty}`).join('\n') +
      `\n${t('b.total')}: ${money(o.totals.total)}\n${o.slot ? t('k.slot') + ': ' + o.slot + '\n' : ''}${o.customer.name} · ${o.customer.phone}\n${zoneName(o.address.zone)} — ${distName(o.address.zone, o.address.district)}, ${o.address.line}` + (S ? '' : '');
  }
  const zoneName = id => { const z = (C.settings.shipping.zones || []).find(x => x.id === id); return z ? LL(z) : id; };
  const distName = (zid, id) => { const z = (C.settings.shipping.zones || []).find(x => x.id === zid); const d = z && (z.districts || []).find(x => x.id === id); return d ? LL(d) : id; };
  function order(id, q) {
    const o = N.orders.get(id); if (!o) return notFound(t('o.notFound'));
    const pay = C.settings.payments || {}, method = pay[o.payment] || {};
    const first = String(o.customer.name || '').split(' ')[0];
    return `<section class="sec"><div class="wrap"><div class="ok">
      <span class="ok__badge gf rim">${ic('check')}</span><span class="kick">${q.new ? t('o.placed', { id: esc(o.id) }) : esc(o.id)}</span>
      <h1 class="h2">${q.new ? t('o.thanks', { name: esc(first) }) : t('o.status') + ': ' + t('o.st.' + o.status)}</h1>
      ${o.slot ? `<p class="lead" style="margin:0 auto">${ic('truck')} ${esc(o.slot)} · ${esc(distName(o.address.zone, o.address.district))}</p>` : ''}
      <div class="steps3"><div><b>01</b>${t('o.step1')}</div><div><b>02</b>${t('o.step2')}</div><div><b>03</b>${t('o.step3')}</div></div>
      ${o.payment !== 'cod' && method.on ? `<div class="co__card" style="width:100%;text-align:start"><b>${t('o.payNow', { amount: money(o.totals.total), method: esc(LL(method)) })}</b><p class="muted" style="margin:0">${esc(method.handle || method.number || '')}<br>${t('o.payHint')}</p></div>` : ''}
      <div class="hero__cta" style="justify-content:center"><a class="btn btn--dark" target="_blank" rel="noopener" href="${esc(N.wa(waOrderText(o)))}">${ic('wa')} ${t('o.sendWa')}</a><a class="btn btn--glass gf rim" href="#/shop">${t('c.continue')}</a></div>
      <div class="co__sum gf rim" style="width:100%;text-align:start;margin-top:12px">${o.items.map(i => `<div class="line"><span class="line__img"><img class="prod" src="${esc(sm(i.img))}" alt=""></span><span class="line__t"><b>${esc(N.isAr() ? i.title_ar : i.title_en)}</b><small>${esc(N.isAr() ? i.color_ar : i.color_en)} × ${i.qty}</small></span><span class="line__p num">${money(i.price * i.qty)}</span></div>`).join('')}
        <div class="rows"><div><span>${t('b.subtotal')}</span><span class="num">${money(o.totals.subtotal)}</span></div>${o.totals.discount ? `<div><span>${t('b.discount')} · ${esc(o.promo)}</span><span class="num">−${money(o.totals.discount)}</span></div>` : ''}<div><span>${t('b.delivery')}</span><span class="num">${o.totals.delivery ? money(o.totals.delivery) : t('b.freeShip')}</span></div></div>
        <div class="tot"><span>${t('b.total')}</span><b class="num">${money(o.totals.total)}</b></div></div>
    </div></div></section>`;
  }

  /* ─────────────── checkout ─────────────── */
  let co = null;
  function checkout() {
    const T = N.cart.totals(co && co.zone, co && co.payment);
    if (!T.rows.length) return `<section class="sec"><div class="wrap"><div class="empty">${ic('bag')}<h1 class="h3">${t('k.empty')}</h1><a class="btn btn--dark" href="#/shop">${t('c.shopNow')}</a></div></div></section>`;
    const S = C.settings.shipping, prof = N.profile(), zones = (S.zones || []).filter(z => z.on !== false);
    const pays = Object.keys(C.settings.payments || {}).filter(k => C.settings.payments[k].on);
    co = co || { zone: prof.zone || (zones[0] && zones[0].id), payment: pays[0], slot: 0 };
    const z = zones.find(x => x.id === co.zone) || zones[0];
    return `<section class="sec" style="padding-top:36px"><div class="wrap"><nav class="crumbs"><a href="#/">${t('nav.home')}</a><span>/</span><span>${t('k.title')}</span></nav><h1 class="h2" style="margin-bottom:30px">${t('k.title')}</h1>
      <form class="co" id="coForm" novalidate><div class="co__f">
        <div class="co__card"><h2><i>1</i>${t('k.contact')}</h2><div class="f2"><label class="fld">${t('k.name')}<input class="inp" name="name" autocomplete="name" value="${esc(prof.name || '')}" required></label><label class="fld">${t('k.phone')}<input class="inp" name="phone" inputmode="tel" autocomplete="tel" dir="ltr" placeholder="01XXXXXXXXX" value="${esc(prof.phone || '')}" required></label></div><label class="fld">${t('k.email')}<input class="inp" name="email" type="email" autocomplete="email" dir="ltr" value="${esc(prof.email || '')}"></label></div>
        <div class="co__card"><h2><i>2</i>${t('k.delivery')}</h2><p class="small muted" style="margin:-6px 0 0">${t('k.onlyAreas')}</p>
          <div class="f2"><label class="fld">${t('k.gov')}<select class="inp" name="zone" data-cozone>${zones.map(x => `<option value="${esc(x.id)}"${x.id === co.zone ? ' selected' : ''}>${esc(LL(x))} · ${money(x.fee)}</option>`).join('')}</select></label>
            <label class="fld">${t('k.district')}<select class="inp" name="district" required><option value="">${t('k.choose')}</option>${(z.districts || []).map(d => `<option value="${esc(d.id)}"${d.id === prof.district ? ' selected' : ''}>${esc(LL(d))}</option>`).join('')}</select></label></div>
          <label class="fld">${t('k.address')}<input class="inp" name="address" autocomplete="street-address" value="${esc(prof.address || '')}" required></label>
          <span class="fld" style="margin-top:4px">${t('k.slot')}</span><div class="slots">${(S.slots || []).map((s, i) => `<label class="opt"><input type="radio" name="slot" value="${i}"${i === (co.slot || 0) ? ' checked' : ''}>${ic('clock')}<span><b>${esc(LL(s))}</b></span></label>`).join('')}</div>
          <label class="opt"><input type="checkbox" name="gift"><span><b>${t('k.gift')}</b><small>${t('k.notes')}</small></span></label>
          <label class="fld">${t('k.notes')}<textarea class="inp" name="notes" rows="2"></textarea></label></div>
        <div class="co__card"><h2><i>3</i>${t('k.payment')}</h2>${pays.map(k => `<label class="opt"><input type="radio" name="payment" value="${k}"${k === co.payment ? ' checked' : ''} data-copay>${ic(k === 'cod' ? 'cash' : 'shield')}<span><b>${esc(LL(C.settings.payments[k]))}</b>${k !== 'cod' ? `<small>${esc(C.settings.payments[k].handle || C.settings.payments[k].number || '')}</small>` : ''}</span></label>`).join('')}<p class="small muted" style="margin:0">${t('k.secure')}</p></div>
      </div>
      <aside class="co__sum gf rim" id="coSum">${coSummary(T)}</aside></form></div></section>`;
  }
  function coSummary(T) {
    const code = N.promo.get();
    return `<h2 class="h3" style="font-size:24px">${t('k.summary')}</h2>
      <div>${T.rows.map(r => `<div class="line"><span class="line__img"><img class="prod" src="${esc(sm(r.v.images[0] || pimg(r.p)))}" alt=""></span><span class="line__t"><b>${esc(title(r.p))}</b><small>${esc(packName(r.v))} × ${r.l.qty}</small></span><span class="line__p num">${money(r.line)}</span></div>`).join('')}</div>
      <div class="promo"><input class="inp" id="promoIn" placeholder="${t('b.promo')}" value="${esc(code || '')}" dir="ltr"><button type="button" class="btn btn--glass gf rim btn--sm" data-promo>${t('b.apply')}</button></div>${code && !T.promo ? `<p class="err">${t('b.promoBad')}</p>` : ''}
      <div class="rows"><div><span>${t('b.subtotal')}</span><span class="num">${money(T.full)}</span></div>${T.discount ? `<div><span>${t('b.discount')} · ${esc(T.promo.code)}</span><span class="num">−${money(T.discount)}</span></div>` : ''}<div><span>${t('b.delivery')}</span><span class="num">${T.delivery == null ? t('b.calcLater') : T.delivery ? money(T.delivery) : t('b.freeShip')}</span></div></div>
      <div class="tot"><span>${t('b.total')}</span><b class="num">${money(T.total)}</b></div>
      <p class="err" id="coErr" hidden></p><button class="btn btn--dark btn--block">${t('k.place')} · <span class="num">${money(T.total)}</span></button>`;
  }

  /* ─────────────── basket drawer ─────────────── */
  function bagHTML() {
    const T = N.cart.totals(null);
    if (!T.rows.length) return `<div class="drawer__h"><h2>${t('b.title')}</h2><button class="ib gf rim" data-bagclose aria-label="${t('nav.close')}">${ic('x')}</button></div><div class="drawer__b"><div class="empty">${ic('bag')}<p>${t('b.empty')}</p><a class="btn btn--dark" href="#/shop" data-bagclose>${t('c.shopNow')}</a></div></div>`;
    const left = Math.max(0, T.freeOver - (T.full - T.discount));
    return `<div class="drawer__h"><h2>${t('b.title')}</h2><button class="ib gf rim" data-bagclose aria-label="${t('nav.close')}">${ic('x')}</button></div>
      <div class="drawer__b">${T.freeOver ? `<div class="freebar">${left > 0 ? t('b.toFree', { amount: money(left) }) : t('b.free')}<div class="meter"><i style="width:${Math.min(100, (T.full - T.discount) / T.freeOver * 100)}%"></i></div></div>` : ''}
        ${T.rows.map(r => `<div class="line"><a class="line__img" href="#/products/${esc(r.p.handle)}" data-bagclose><img class="prod" src="${esc(sm(r.v.images[0] || pimg(r.p)))}" alt=""></a><div class="line__t"><b>${esc(title(r.p))}</b><small>${esc(packName(r.v))}</small><br><span class="step"><button data-lq="${esc(r.l.key)}" data-d="-1" aria-label="−">−</button><span>${r.l.qty}</span><button data-lq="${esc(r.l.key)}" data-d="1" aria-label="+">+</button></span></div><div class="line__p"><span class="num">${money(r.line)}</span><button data-lrm="${esc(r.l.key)}">${t('c.remove')}</button></div></div>`).join('')}</div>
      <div class="drawer__f"><div class="tot"><span>${t('b.subtotal')}</span><b class="num">${money(T.full - T.discount)}</b></div><p class="small muted" style="margin:0">${esc(L(C.settings.shipping, 'eta'))}</p><a class="btn btn--dark btn--block" href="#/checkout" data-bagclose>${t('b.checkout')}</a></div>`;
  }
  function openBag() { const d = $('#bag'); d.innerHTML = bagHTML(); d.classList.add('on'); $('#scrim').classList.add('on'); d.setAttribute('aria-hidden', 'false'); }
  function closeBag() { const d = $('#bag'); d.classList.remove('on'); $('#scrim').classList.remove('on'); d.setAttribute('aria-hidden', 'true'); closeModal(); }
  function paintCount() { const n = N.cart.count(); $$('[data-bagcount]').forEach(e => { e.textContent = n || ''; }); if ($('#bag').classList.contains('on')) $('#bag').innerHTML = bagHTML(); }

  /* ─────────────── modal: search / popup ─────────────── */
  function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="gf rim">${html}</div>`; m.classList.add('on'); $('#scrim').classList.add('on'); }
  function closeModal() { const m = $('#modal'); if (!m.classList.contains('on')) return; m.classList.remove('on'); if (!$('#bag').classList.contains('on')) $('#scrim').classList.remove('on'); setTimeout(() => { if (!m.classList.contains('on')) m.innerHTML = ''; }, 300); }
  function openSearch() {
    modal(`<div class="search__in">${ic('search')}<input id="sq" placeholder="${t('m.searchPh')}" autocomplete="off" aria-label="${t('nav.search')}"><button class="ib" data-mclose aria-label="${t('nav.close')}">${ic('x')}</button></div><div class="sres" id="sres"></div>`);
    const i = $('#sq'); setTimeout(() => i.focus(), 60); searchPaint('');
  }
  let sT = 0;
  function searchPaint(q) {
    q = q.trim().toLowerCase();
    const list = (q ? live().filter(p => (p.title_en + ' ' + p.title_ar + ' ' + (p.tags || []).join(' ') + ' ' + p.origin_en + ' ' + p.origin_ar).toLowerCase().indexOf(q) > -1) : inSeasonList()).slice(0, 7);
    $('#sres').innerHTML = (list.map(p => `<a href="#/products/${esc(p.handle)}" data-mclose><img class="prod" src="${esc(sm(pimg(p)))}" alt=""><span style="flex:1"><b>${esc(title(p))}</b><br><span class="small muted">${esc(L(p, 'origin'))}</span></span><span class="num small">${money(N.minPrice(p))}</span></a>`).join('') || `<p class="muted">${t('m.noResults', { q: esc(q) })}</p>`) + (q ? `<a href="#/shop?q=${encodeURIComponent(q)}" data-mclose class="small" style="justify-content:center;font-weight:600">${t('c.viewAll')} →</a>` : '');
    clearTimeout(sT); if (q) sT = setTimeout(() => { try { window.NZ_TRACK && NZ_TRACK.event('search', { q, n: list.length }); } catch (e) { } }, 900);
  }
  function maybePopup(name) {
    const P = C.settings.popup || {};
    if (!P.on || N.read(N.LS.popup, null) || /checkout|order|products/.test(name)) return;
    clearTimeout(maybePopup.t);
    maybePopup.t = setTimeout(() => {
      if ($('#modal').classList.contains('on') || $('#bag').classList.contains('on') || /checkout|order/.test(location.hash)) return;
      N.write(N.LS.popup, 1);
      const p = N.product('strawberry');
      modal(`<div style="display:grid;grid-template-columns:${p ? '140px ' : ''}1fr;gap:20px;align-items:center">${p ? `<img class="prod" src="${esc(sm(pimg(p)))}" alt="" style="border-radius:20px;background:#fff">` : ''}<div><span class="kick">${esc(L(C.settings, 'name'))}</span><h2 class="h3" style="margin:10px 0">${esc(L(P, 'title'))}</h2><p class="muted" style="margin:0 0 16px">${esc(L(P, 'text'))}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--dark" data-usecode="${esc(P.code)}">${t('m.useCode')} · ${esc(P.code)}</button><button class="btn btn--glass gf rim" data-mclose>${t('m.gotIt')}</button></div></div></div>`);
    }, (+P.delay || 30) * 1000);
  }

  /* ─────────────── shell ─────────────── */
  function shell() {
    const nav = (C.nav.header || []);
    const pv = N.previewing();
    app.innerHTML = `${pv ? `<div class="pv">${t('m.preview')}<button data-exitpv>${t('m.exitPreview')}</button></div>` : ''}
      <div class="ann" aria-live="polite"><span id="annTxt">${esc(LL((C.settings.announcement || [])[0]))}</span></div>
      <header class="hdr" id="hdr"><div class="hdr__in gf rim">
        <a href="#/" aria-label="${esc(L(C.settings, 'name'))}"><span class="logo"></span></a>
        <nav aria-label="Main"><div class="seg">${nav.map(n => `<a href="${esc(n.to)}" data-nav="${esc(n.to)}">${esc(LL(n))}</a>`).join('')}</div></nav>
        <div class="hdr__act"><button class="ib gf rim" data-search aria-label="${t('nav.search')}">${ic('search')}</button><a class="ib gf rim hide-m" href="#/saved" aria-label="${t('nav.saved')}">${ic('heart')}</a><button class="lang gf rim" data-lang>${N.isAr() ? 'EN' : 'ع'}</button><button class="ib gf rim" data-bag aria-label="${t('nav.bag')}">${ic('bag')}<span class="cnt" data-bagcount></span></button></div>
      </div></header>
      <main id="view" tabindex="-1"></main>
      <footer class="ftr">${halo()}<div class="wrap"><div class="ftr__g">
        <div><span class="logo logo--light" style="width:90px;height:58px"></span><p style="max-width:320px;margin-top:18px">${esc(L(C.settings, 'tagline'))}</p><div class="pay">${Object.keys(C.settings.payments || {}).filter(k => C.settings.payments[k].on).map(k => `<span>${esc(LL(C.settings.payments[k]))}</span>`).join('')}</div></div>
        <div><h4>${t('nav.shop')}</h4><ul>${N.collections().map(c => `<li><a href="#/collections/${esc(c.handle)}">${esc(L(c, 'title'))}</a></li>`).join('')}<li><a href="#/shop?season=1">${t('c.inSeason')}</a></li></ul></div>
        <div><h4>Fresh Valley</h4><ul>${(C.nav.footer || []).map(n => `<li><a href="${esc(n.to)}">${esc(LL(n))}</a></li>`).join('')}</ul></div>
        <div class="gw"><h4>${t('m.getInTouch')}</h4><p style="margin:0 0 14px">${t('m.deliveryArea')}<br>${esc(L(C.settings.shipping, 'eta'))}</p><a class="btn btn--olive btn--sm" target="_blank" rel="noopener" href="${esc(N.wa(''))}">${ic('wa')} ${t('c.whatsapp')}</a>
          <p style="margin:14px 0 0;font-size:13px"><a href="mailto:${esc(C.settings.email)}">${esc(C.settings.email)}</a>${C.settings.instagram ? ` · <a target="_blank" rel="noopener" href="https://instagram.com/${esc(C.settings.instagram)}">@${esc(C.settings.instagram)}</a>` : ''}</p></div>
      </div><div class="ftr__b"><span>${t('m.rights', { y: year() })}</span><span><a href="#/policies/privacy">${N.isAr() ? 'الخصوصية' : 'Privacy'}</a> · <a href="#/policies/terms">${N.isAr() ? 'الشروط' : 'Terms'}</a> · <a href="admin.html">${t('m.dashboard')}</a></span></div></div></footer>
      <nav class="dock gf rim" aria-label="Quick"><a href="#/" data-dock="home">${ic('home')}${t('nav.home')}</a><a href="#/shop" data-dock="shop">${ic('grid')}${t('nav.shop')}</a><a href="#/collections/boxes" data-dock="boxes">${ic('box')}${t('nav.boxes')}</a><button data-bag>${ic('bag')}${t('nav.bag')}<span class="cnt" data-bagcount></span></button></nav>
      <div class="scrim" id="scrim"></div><aside class="drawer gf rim" id="bag" aria-hidden="true" aria-label="${t('b.title')}"></aside><div class="modal" id="modal" role="dialog" aria-modal="true"></div><div class="toasts" id="toasts" aria-live="polite"></div>`;
    paintCount();
  }
  function applyTheme() {
    const th = C.theme || {}, r = document.documentElement.style;
    if (th.night) r.setProperty('--forest', th.night);
    if (th.accent) r.setProperty('--olive', th.accent);
    if (th.paper) r.setProperty('--white', th.paper);
    if (th.radius != null) r.setProperty('--radius', th.radius + 'px');
    document.body.dataset.lens = th.lens === false ? '0' : '1';
    document.body.dataset.halos = th.halos === false ? '0' : '1';
    document.documentElement.lang = N.lang; document.documentElement.dir = N.isAr() ? 'rtl' : 'ltr';
  }

  /* ─────────────── router ─────────────── */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [p, qs] = h.split('?');
    const parts = (p || '').split('/').filter(Boolean).map(decodeURIComponent);
    const q = {}; new URLSearchParams(qs || '').forEach((v, k) => { q[k] = v; });
    return { parts, q, path: '/' + parts.join('/') };
  }
  function notFound(msg) { return `<section class="sec"><div class="wrap"><div class="empty">${ic('leaf')}<h1 class="h2">${t('m.404')}</h1><p>${msg || t('m.404t')}</p><a class="btn btn--dark" href="#/shop">${t('l.shopAll')}</a></div></div></section>`; }
  let lastPath = null;
  function render() {
    const r = parse(), [a, b] = r.parts;
    let html = '', name = a || 'home', ttl = '';
    if (a === 'boxes') { location.replace('#/collections/boxes'); return; }
    if (!a) html = home();
    else if (a === 'shop') { html = shop(null, r.q); ttl = t('l.title'); }
    else if (a === 'collections') { html = shop(b, r.q); const c = N.collection(b); ttl = c ? L(c, 'title') : ''; }
    else if (a === 'products') { html = product(b); const p = N.product(b); ttl = p ? title(p) : ''; name = 'products'; }
    else if (a === 'hosting') { html = hosting(r.q); ttl = t('m.hosting'); }
    else if (a === 'standard') { html = standard(); ttl = t('m.standard'); }
    else if (a === 'journal') { html = journal(b); ttl = t('m.journal'); }
    else if (a === 'faq') { html = faqPage(); ttl = t('m.faq'); }
    else if (a === 'policies') { html = policy(b); }
    else if (a === 'saved') { html = saved(); ttl = t('a.saved'); }
    else if (a === 'orders') { html = orders(); ttl = t('a.title'); }
    else if (a === 'order') { html = order(b, r.q); name = 'order'; }
    else if (a === 'checkout') { co = null; html = checkout(); ttl = t('k.title'); }
    else html = notFound();
    if (a !== 'products') pdp = null;
    const view = $('#view'); view.innerHTML = html;
    document.title = (ttl ? ttl + ' — ' : '') + L(C.settings, a ? 'name' : 'seo_title');
    const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', a === 'products' && pdp ? L(pdp.p, 'desc') : L(C.settings, 'seo_desc'));
    $$('[data-nav]').forEach(x => x.classList.toggle('on', location.hash.indexOf(x.dataset.nav) === 0 && x.dataset.nav !== '#/'));
    $$('[data-dock]').forEach(x => x.classList.toggle('on', x.dataset.dock === (a === 'collections' && b === 'boxes' ? 'boxes' : !a ? 'home' : /shop|collections|products/.test(a) ? 'shop' : '')));
    if (r.path !== lastPath) window.scrollTo(0, 0);
    lastPath = r.path;
    closeBag();
    mount(name);
    try { window.NZ_TRACK && NZ_TRACK.page(r.path, name); if (name === 'checkout') NZ_TRACK.event('begin_checkout', {}); if (name === 'products' && pdp) NZ_TRACK.event('view_item', { id: pdp.p.id }); } catch (e) { }
    maybePopup(name);
  }

  /* ─────────────── after-render wiring ─────────────── */
  let io = null;
  function mount(name) {
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      $$('.rv-in').forEach(el => io.observe(el));
    } else $$('.rv-in').forEach(el => el.classList.add('on'));
    railState();
    if (name === 'products') {
      const bb = $('#buybar'), buy = $('#pdpBuy');
      if (bb && buy && 'IntersectionObserver' in window) { const o2 = new IntersectionObserver(es => es.forEach(e => bb.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0))); o2.observe(buy); }
      if (/review=1/.test(location.hash)) setTimeout(() => { const f = $('#rvs'); f && f.scrollIntoView({ behavior: 'smooth' }); }, 300);
    }
    const ev = $('#evForm'); if (ev) ev.addEventListener('submit', sendEvent);
    const cf = $('#coForm'); if (cf) cf.addEventListener('submit', placeOrder);
    const rf = $('#rvForm'); if (rf) rf.addEventListener('submit', sendReview);
  }
  function railState() { $$('.rail').forEach(r => { const prev = $(`[data-rail="${r.id}"][data-d="-1"]`), next = $(`[data-rail="${r.id}"][data-d="1"]`); if (!prev) return; const max = r.scrollWidth - r.clientWidth - 4, x = Math.abs(r.scrollLeft); prev.disabled = x <= 2; next.disabled = x >= max; }); }

  function sendEvent(e) {
    e.preventDefault();
    const f = e.target, err = $('#evErr'), v = k => (f[k] && f[k].value || '').trim();
    $$('.inp', f).forEach(i => i.classList.remove('bad'));
    const bad = [];
    if (!v('name')) bad.push('name'); if (!/^01[0125]\d{8}$/.test(v('phone').replace(/\D/g, ''))) bad.push('phone'); if (!(+v('guests') > 0)) bad.push('guests');
    if (bad.length) { bad.forEach(k => f[k].classList.add('bad')); err.hidden = false; err.textContent = bad.indexOf('phone') > -1 ? t('k.phoneBad') : bad.indexOf('guests') > -1 ? t('r.errGuests') : t('r.errName'); return; }
    const r = { id: 'EV-' + N.uid().slice(0, 6), date: Date.now(), status: 'new', name: v('name'), phone: v('phone'), alt: v('alt'), kind: v('kind'), when: v('when'), guests: +v('guests'), budget: +v('budget') || null, notes: v('notes'), lang: N.lang };
    N.requests.add(r);
    try { window.NZ_TRACK && NZ_TRACK.event('custom_request', { id: r.id }); } catch (x) { }
    const P = C.settings, msg = (N.isAr() ? `أهلاً فريش فالي، عندي طلب مناسبة ${r.id}:\n` : `Hi Fresh Valley, event request ${r.id}:\n`) + `${r.kind} · ${r.when || '—'} · ${r.guests} ${N.isAr() ? 'ضيف' : 'guests'}\n${r.name} · ${r.phone}${r.notes ? '\n' + r.notes : ''}`;
    $('#evBody').innerHTML = `<div class="ok" style="text-align:start;justify-items:start"><span class="ok__badge gf rim" style="width:64px;height:64px">${ic('check')}</span><h3 class="h3">${t('r.done')}</h3><p class="muted" style="margin:0">${esc(L(C.pages.custom, 'done'))}</p><p class="small"><b>${t('r.no', { id: r.id })}</b></p><a class="btn btn--dark" target="_blank" rel="noopener" href="${esc(N.wa(msg))}">${ic('wa')} ${t('c.whatsapp')}</a></div>`;
    void P;
  }
  function placeOrder(e) {
    e.preventDefault();
    const f = e.target, err = $('#coErr'), v = k => (f[k] && f[k].value || '').trim();
    $$('.inp', f).forEach(i => i.classList.remove('bad'));
    const bad = ['name', 'district', 'address'].filter(k => !v(k));
    const phone = v('phone').replace(/\D/g, '');
    if (!/^01[0125]\d{8}$/.test(phone)) bad.push('phone');
    if (bad.length) { bad.forEach(k => f[k] && f[k].classList.add('bad')); err.hidden = false; err.textContent = bad.indexOf('phone') > -1 && bad.length === 1 ? t('k.phoneBad') : t('k.required'); f[bad[0]] && f[bad[0]].focus(); return; }
    const slots = C.settings.shipping.slots || [], si = +((f.querySelector('[name="slot"]:checked') || {}).value || 0);
    const pay = (f.querySelector('[name="payment"]:checked') || {}).value || 'cod';
    const o = N.orders.create({ name: v('name'), phone, email: v('email'), zone: v('zone'), district: v('district'), address: v('address'), notes: v('notes'), payment: pay, slot: slots[si] ? slots[si].en : '', gift: f.gift && f.gift.checked });
    if (!o) return;
    try { window.NZ_TRACK && NZ_TRACK.event('purchase', { id: o.id, total: o.totals.total }); } catch (x) { }
    co = null; go('#/order/' + encodeURIComponent(o.id) + '?new=1');
  }
  function sendReview(e) {
    e.preventDefault();
    const f = e.target, err = $('#rvErr'), r = +((f.querySelector('[name="r"]:checked') || {}).value || 0), name = f.name.value.trim(), text = f.text.value.trim();
    const msg = !r ? t('rv.errRating') : !name ? t('rv.errName') : text.length < 10 ? t('rv.errText') : '';
    if (msg) { err.hidden = false; err.textContent = msg; return; }
    N.reviews.submit({ id: 'RV-' + N.uid().slice(0, 7), pid: pdp.p.id, name, rating: r, text, phone: f.phone.value.trim(), date: Date.now(), lang: N.lang });
    f.innerHTML = `<p class="small" style="color:var(--ok);font-weight:600;margin:0">${t('rv.thanks')}</p>`;
  }

  /* ─────────────── the lens (magnifier) ─────────────── */
  let zEl = null;
  function zoomMove(e) {
    const host = e.target.closest && e.target.closest('[data-zoom]');
    if (host !== zEl) { if (zEl && !zEl.dataset.keep) { const l = zEl.querySelector('.lens--live'); l && l.classList.remove('on'); } zEl = host; }
    if (!host || document.body.dataset.lens === '0') return;
    if (e.pointerType === 'touch' && !host.dataset.keep) return;
    const lens = host.querySelector('.lens--live'); if (!lens) return;
    const rc = host.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top, Z = +host.dataset.z || 2.4;
    if (!lens.dataset.src) { lens.dataset.src = host.dataset.zoom; lens.style.backgroundImage = `url("${host.dataset.zoom}")`; }
    const lw = lens.offsetWidth || 150;
    lens.style.backgroundSize = (rc.width * Z) + 'px ' + (rc.height * Z) + 'px';
    lens.style.backgroundPosition = (-(x * Z - lw / 2)) + 'px ' + (-(y * Z - lw / 2)) + 'px';
    lens.style.left = x + 'px'; lens.style.top = y + 'px';
    lens.classList.add('on');
  }
  function zoomLeave(e) { const host = e.target.closest && e.target.closest('[data-zoom]'); if (host && !host.dataset.keep && !host.contains(e.relatedTarget)) { const l = host.querySelector('.lens--live'); l && l.classList.remove('on'); } }

  /* ─────────────── events ─────────────── */
  function bind() {
    document.addEventListener('pointermove', zoomMove, { passive: true });
    document.addEventListener('pointerout', zoomLeave, { passive: true });
    document.addEventListener('click', e => {
      const b = e.target.closest('button, a, [data-goto]'); if (!b) { if (e.target.id === 'scrim') { closeBag(); closeModal(); } if (e.target.id === 'modal') closeModal(); return; }
      if (b.dataset.scroll) { e.preventDefault(); const el = document.getElementById(b.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (b.hasAttribute('data-bag')) { e.preventDefault(); openBag(); return; }
      if (b.hasAttribute('data-bagclose')) { if (b.tagName === 'BUTTON') e.preventDefault(); closeBag(); return; }
      if (b.hasAttribute('data-search')) { openSearch(); return; }
      if (b.hasAttribute('data-mclose')) { closeModal(); return; }
      if (b.hasAttribute('data-tclose')) { b.closest('.toast').remove(); return; }
      if (b.hasAttribute('data-lang')) { N.setLang(N.isAr() ? 'en' : 'ar'); boot2(); return; }
      if (b.hasAttribute('data-exitpv')) { localStorage.removeItem(N.LS.preview); location.reload(); return; }
      if (b.dataset.usecode) { N.promo.set(b.dataset.usecode); closeModal(); toast(t('b.promoOk')); return; }
      if (b.dataset.fav) { e.preventDefault(); const on = N.wish.toggle(b.dataset.fav); $$(`[data-fav="${b.dataset.fav}"]`).forEach(x => x.classList.toggle('on', on)); toast(on ? t('p.saved') : t('c.remove')); return; }
      if (b.dataset.quick) { e.preventDefault(); const p = N.product(b.dataset.quick); if (p && addToBag(p, defVar(p), 1)) { b.classList.add('ok'); b.innerHTML = '✓'; setTimeout(() => { b.classList.remove('ok'); b.textContent = b.classList.contains('pc__add') ? '+' : t('c.add'); }, 1400); } return; }
      if (b.dataset.notify) { const p = N.product(b.dataset.notify); const l = N.read(N.LS.notify, []); if (l.indexOf(p.id) < 0) l.push(p.id); N.write(N.LS.notify, l); window.open(N.wa((N.isAr() ? 'بلّغوني لما يرجع: ' : 'Please tell me when this is back: ') + title(p)), '_blank', 'noopener'); toast(t('p.notifyOk')); return; }
      if (b.dataset.rail) { const r = document.getElementById(b.dataset.rail); if (r) { r.scrollBy({ left: (+b.dataset.d) * r.clientWidth * .9 * (N.isAr() ? -1 : 1), behavior: 'smooth' }); setTimeout(railState, 450); } return; }
      if (b.dataset.herop) { heroPid = b.dataset.herop; const sec = b.closest('[data-hero]'); const s = (C.home.sections || []).find(x => x.id === sec.dataset.hero); const base = N.product(s.product) || inSeasonList()[0]; const p = N.product(heroPid); const img = $('#heroImg'); if (img) img.style.opacity = '0'; setTimeout(() => { sec.style.setProperty('--hue', hue(p)); const dock = sec.querySelector('.hero__dock'); sec.innerHTML = heroInner(s, p, base); sec.appendChild(dock); $$('[data-herop]', dock).forEach(x => x.classList.toggle('on', x.dataset.herop === p.id)); }, 220); return; }
      if (b.dataset.pack) { const card2 = b.closest('[data-quickcard]'); $$('[data-pack]', card2).forEach(x => x.classList.toggle('on', x === b)); const p = N.product(card2.dataset.quickcard), v = p.variants.find(x => x.id === b.dataset.pack); const sp = $('[data-selprice]', card2); if (sp) sp.textContent = money(N.priceOf(p, v)); return; }
      if (b.dataset.addsel) { const card2 = b.closest('[data-quickcard]'); const p = N.product(b.dataset.addsel), on = $('[data-pack].on', card2); addToBag(p, p.variants.find(x => on && x.id === on.dataset.pack) || defVar(p), 1); return; }
      if (b.dataset.pdpv && pdp) { pdp.v = pdp.p.variants.find(x => x.id === b.dataset.pdpv) || pdp.v; pdpRefresh(); return; }
      if (b.dataset.pq && pdp) { pdp.qty = Math.max(1, Math.min(20, pdp.qty + (+b.dataset.pq))); pdpRefresh(); return; }
      if (b.hasAttribute('data-pdpadd') && pdp) { addToBag(pdp.p, pdp.v, pdp.qty); return; }
      if (b.dataset.thumb) { const im = $('#pdpImg'); if (im) { im.src = b.dataset.thumb; im.classList.toggle('prod', b.dataset.thumb === pimg(pdp.p)); } $$('[data-thumb]').forEach(x => x.classList.toggle('on', x === b)); const st = $('.pdp__stage'); if (st) { st.dataset.zoom = b.dataset.thumb; const l = st.querySelector('.lens--live'); if (l) { l.dataset.src = ''; } } return; }
      if (b.dataset.lq) { const l = N.cart.lines().find(x => x.key === b.dataset.lq); if (l) N.cart.setQty(l.key, l.qty + (+b.dataset.d)); return; }
      if (b.dataset.lrm) { N.cart.remove(b.dataset.lrm); return; }
      if (b.hasAttribute('data-promo')) { const v = ($('#promoIn').value || '').trim(); N.promo.set(v || null); const T = N.cart.totals(co && co.zone, co && co.payment); toast(v ? (T.promo ? t('b.promoOk') : t('b.promoBad')) : t('c.remove')); paintSummary(); return; }
    });
    document.addEventListener('change', e => {
      const el = e.target;
      if (el.dataset.goto) { go(el.dataset.goto); return; }
      if (el.dataset.sort) { go(el.dataset.sort.replace('__', el.value)); return; }
      if (el.hasAttribute('data-cozone')) { co = co || {}; co.zone = el.value; const zs = C.settings.shipping.zones || [], z = zs.find(x => x.id === el.value); const ds = el.form.district; ds.innerHTML = `<option value="">${t('k.choose')}</option>` + ((z && z.districts) || []).map(d => `<option value="${esc(d.id)}">${esc(LL(d))}</option>`).join(''); paintSummary(); return; }
      if (el.hasAttribute('data-copay')) { co = co || {}; co.payment = el.value; paintSummary(); return; }
      if (el.name === 'slot' && co) co.slot = +el.value;
    });
    document.addEventListener('input', e => { if (e.target.id === 'sq') searchPaint(e.target.value); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeModal(); closeBag(); }
      if (e.key === 'Enter' && e.target.id === 'sq' && e.target.value.trim()) { closeModal(); go('#/shop?q=' + encodeURIComponent(e.target.value.trim())); }
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
    document.addEventListener('scroll', e => { if (e.target && e.target.classList && e.target.classList.contains('rail')) railState(); }, true);
    let ticking = false;
    window.addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const h = $('#hdr'); h && h.classList.toggle('hdr--scrolled', window.scrollY > 30); ticking = false; }); }, { passive: true });
    window.addEventListener('hashchange', render);
    window.addEventListener('storage', e => { if (e.key === N.LS.cart) paintCount(); });
    N.on(w => { if (w === 'cart' || w === 'added') { paintCount(); if (/checkout/.test(location.hash)) paintSummary(); } });
    // rotating announcement
    let ai = 0; setInterval(() => { const a = C.settings.announcement || [], el = $('#annTxt'); if (!el || a.length < 2) return; ai = (ai + 1) % a.length; el.style.opacity = '0'; setTimeout(() => { el.textContent = LL(a[ai]); el.style.opacity = '1'; }, 400); }, 4500);
  }
  function paintSummary() { const s = $('#coSum'); if (!s) return; const f = $('#coForm'); const zone = f && f.zone ? f.zone.value : co && co.zone; const pay = f && (f.querySelector('[name="payment"]:checked') || {}).value; co = co || {}; co.zone = zone; co.payment = pay; const T = N.cart.totals(zone, pay); if (!T.rows.length) return render(); s.innerHTML = coSummary(T); }

  /* ─────────────── boot ─────────────── */
  function boot2() { C = N.C; applyTheme(); shell(); lastPath = null; render(); }
  async function boot() {
    await N.load();
    N.initLang();
    C = N.C;
    bind();
    boot2();
  }
  return { boot, render, toast };
})();
