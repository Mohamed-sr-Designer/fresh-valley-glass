/* =========================================================================
   Fresh Valley dashboard — commerce views
   home · orders · order · products · product editor · collections ·
   inventory · customers · discounts · drop · custom requests
   ========================================================================= */
(function () {
  'use strict';
  const N = window.NZ, S = window.NZS, Z = window.NZA, C = window.NZC;
  const { A, AR, esc, icon, money, dt, d8, F, card, ph, deltaHTML, statusBdg, listEd } = Z;
  const ALL = { start: 0, end: 8.64e15, len: 8.64e15, prev: { start: 0, end: 0 } };
  const T = (o, f) => (AR() ? (o[f + '_ar'] || o[f + '_en']) : (o[f + '_en'] || o[f + '_ar'])) || '';
  const LL = o => (o ? (AR() ? (o.ar || o.en) : (o.en || o.ar)) : '');
  const D = () => Z.draft;
  const img0 = p => (p.variants && p.variants[0] && p.variants[0].images[0]) || '';
  const fmtX = gran => t => new Date(t).toLocaleString(AR() ? 'ar-EG' : 'en-GB', gran === 'hour' ? { hour: '2-digit' } : { day: 'numeric', month: 'short' });
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

  /* ═════════════════════════ HOME ═════════════════════════ */
  const METRICS = () => ({ sales: A('إجمالي المبيعات', 'Total sales'), orders: A('الطلبات', 'Orders'), aov: A('متوسط قيمة الطلب', 'Average order value'), conv: A('معدل التحويل', 'Conversion rate'), sessions: A('الزيارات', 'Sessions') });
  const fmtMetric = (m, v) => m === 'conv' ? v.toFixed(2) + '%' : m === 'orders' || m === 'sessions' ? Math.round(v).toLocaleString('en-US') : money(v);
  function kpiRow(p, metrics, sel, click) {
    const k = S.kpis(p);
    return `<div class="kpis" style="--n:${metrics.length}">${metrics.map(m => {
      const s = S.series(m, p);
      return `<div class="kpi${m === sel ? ' sel' : ''}"${click ? ` data-metric="${m}"` : ''}><span class="kpi__l">${METRICS()[m] || m}</span><span class="kpi__v num">${fmtMetric(m, k.cur[m])} ${deltaHTML(k.delta(m))}</span>${C.slot('spark', { values: s.values, color: m === sel ? '#2F5BEA' : '#9AA3AB' })}</div>`;
    }).join('')}</div>`;
  }
  Z.view('home', {
    title: () => A('الرئيسية', 'Home'),
    render(arg, q) {
      const p = S.range(Z.curRange()), m = q.m || 'sales', s = S.series(m, p), os = S.orders();
      const pend = os.filter(o => o.status === 'pending').length, resv = os.filter(o => o.status === 'reserved').length;
      const reqs = S.requests().filter(r => r.status === 'new').length;
      const low = S.inventory().filter(r => r.track && r.stock - r.open <= 2).length;
      const top = S.breakdown('product', p).slice(0, 6);
      const coll = S.breakdown('collection', p);
      const d = D().drop, rc = N.reservedCount(), goal = +d.goal || 100;
      const act = S.activity(10);
      return `<div class="page">
        ${ph(A('أهلاً', 'Welcome back') + (Z.me.name ? '، ' + esc(Z.me.name) : ''), { act: Z.rangePicker(p.key) })}
        ${demoBanner()}
        <div class="tasks">
          ${pend ? `<a class="task" href="#orders?st=pending"><i></i>${pend} ${A('طلب محتاج تأكيد', 'orders to confirm')}</a>` : ''}
          ${resv ? `<a class="task" href="#orders?st=reserved"><i style="background:#9DBF00"></i>${resv} ${A('حجز جديد', 'new reservations')}</a>` : ''}
          ${reqs ? `<a class="task" href="#requests"><i></i>${reqs} ${A('طلب مناسبة جديد', 'new event requests')}</a>` : ''}
          <a class="task" href="#reports/packing"><i style="background:var(--brand)"></i>${A('قايمة تجهيز النهارده', 'Today’s packing list')}</a>
          ${low ? `<a class="task" href="#inventory?low=1"><i style="background:var(--bad)"></i>${low} ${A('عبوة قربت تخلص', 'packs running low')}</a>` : ''}
          ${Z.dirty() ? `<a class="task" href="#publish"><i style="background:var(--blue)"></i>${A('تعديلات مستنية النشر', 'Changes waiting to publish')}</a>` : ''}
          ${!pend && !resv && !reqs && !low && !Z.dirty() ? `<span class="task" style="cursor:default">${icon('check')}${A('مفيش حاجة مستعجلة', 'You’re all caught up')}</span>` : ''}
        </div>
        ${kpiRow(p, ['sales', 'orders', 'aov', 'conv'], m, true)}
        ${card(METRICS()[m] || '', C.slot('area', { values: s.values, prev: s.prev, labels: s.labels, fmt: v => fmtMetric(m, v), fmtX: fmtX(s.gran), fmtTip: t => dt(t, s.gran === 'hour' ? { day: 'numeric', month: 'short', hour: '2-digit' } : { weekday: 'short', day: 'numeric', month: 'short' }), names: [p.label, A('الفترة السابقة', 'Previous period')] }), { act: `<a class="btn btn--sm btn--ghost" href="#analytics">${A('كل التحليلات', 'All analytics')}</a>` })}
        <div class="grid g-main">
          <div class="stack">
            ${card(A('الأكثر مبيعاً', 'Top products'), C.slot('bars', { rows: top.map(r => ({ label: esc(r.label), value: r.value, sub: r.units + ' ' + A('قطعة', 'units') })), fmt: v => money(v) }), { act: `<a class="btn btn--sm btn--ghost" href="#reports/by-product">${A('التقرير', 'Report')}</a>` })}
            ${card(A('أحدث الطلبات', 'Recent orders'), ordersTable(os.slice(0, 7), { compact: true }), { flush: true, act: `<a class="btn btn--sm btn--ghost" href="#orders">${A('كل الطلبات', 'All orders')}</a>` })}
          </div>
          <div class="stack">
            ${d.on ? card(A('الدروب', 'The drop') + ' · ' + esc(T(d, 'title')), `<div class="kv"><div><span>${A('محجوز', 'Reserved')}</span><b class="num">${rc} / ${goal}</b></div></div><div style="height:8px;background:#EEE;border-radius:4px;overflow:hidden;margin:10px 0"><i style="display:block;height:100%;width:${Math.min(100, rc / goal * 100)}%;background:#9DBF00"></i></div>
              <div class="kv"><div><span>${A('ينزل', 'Drops')}</span><b>${d8(d.date)}</b></div><div><span>${A('العربون', 'Deposit')}</span><b>${d.depositPct}%</b></div></div>`, { act: `<a class="btn btn--sm btn--ghost" href="#drop">${A('إدارة', 'Manage')}</a>` }) : ''}
            ${card(A('المبيعات حسب الكولكشن', 'Sales by collection'), coll.length ? `<div class="donut-wrap">${C.slot('donut', { parts: coll.map((r, i) => ({ label: r.label, value: r.value, color: C.PALETTE[i % C.PALETTE.length] })), center: C.short(coll.reduce((s, r) => s + r.value, 0)), sub: A('ج.م', 'EGP'), size: 150 })}<div class="legend">${coll.map((r, i) => `<div><i style="background:${C.PALETTE[i % C.PALETTE.length]}"></i>${esc(r.label)}<b>${money(r.value)}</b></div>`).join('')}</div></div>` : `<p class="muted small">—</p>`)}
            ${card(A('آخر النشاط', 'Activity'), `<div class="timeline">${act.map(e => `<div class="tl on"><i></i><div><div class="small">${e.kind === 'req' ? `${icon('pen')} ${A('طلب مناسبة', 'Event request')} <a href="#requests">${esc(e.r.id)}</a> · ${esc(e.r.name)}` : `${e.kind === 'pre' ? A('حجز', 'Reservation') : A('طلب', 'Order')} <a href="#orders/${esc(e.o.id)}">${esc(e.o.id)}</a> · ${esc(e.o.customer.name)} · <b class="num">${money(e.o.totals.total)}</b>`}</div><div class="faint small">${dt(e.t)}</div></div></div>`).join('') || `<p class="muted small">—</p>`}</div>`)}
          </div>
        </div>
      </div>`;
    },
    mount() { Z.$$('.kpi[data-metric]').forEach(k => k.addEventListener('click', () => { location.hash = '#home?m=' + k.dataset.metric; })); bindDemo(); }
  });
  function demoBanner() {
    if (S.hasDemo()) return `<div class="banner banner--warn">${icon('chart')}<div class="grow"><b>${A('بتشوف بيانات تجريبية', 'You’re looking at demo data')}</b><span class="small">${A('طلبات وزيارات وهمية (180 يوم) عشان تجرّب التحليلات. مش بتظهر للعملاء.', '180 days of made-up orders and visits so you can try the analytics. Customers never see them.')}</span></div><button class="btn btn--sm" data-demo="clear">${A('حذف البيانات التجريبية', 'Delete demo data')}</button></div>`;
    if (S.orders().length < 25) return `<div class="banner">${icon('chart')}<div class="grow"><b>${S.orders().length ? A('لسه الطلبات قليلة', 'Only a few orders so far') : A('لسه مفيش طلبات', 'No orders yet')}</b><span class="small">${A('تقدر تحمّل بيانات تجريبية عشان تشوف شكل التحليلات والتقارير.', 'Load demo data to see how analytics and reports look.')}</span></div><button class="btn btn--sm btn--pri" data-demo="seed">${A('تحميل بيانات تجريبية', 'Load demo data')}</button></div>`;
    return '';
  }
  function bindDemo() {
    Z.$$('[data-demo]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.demo === 'seed') { const n = S.seedDemo(); Z.toast(A('اتحمّل ', 'Loaded ') + n + A(' طلب تجريبي', ' demo orders')); }
      else { S.clearDemo(); Z.toast(A('اتمسحت البيانات التجريبية', 'Demo data deleted')); }
      Z.rerender();
    }));
  }
  Z.demoBanner = demoBanner; Z.bindDemo = bindDemo;

  /* ═════════════════════════ ORDERS ═════════════════════════ */
  const payName = k => S.payName(k);
  function ordersTable(list, o) {
    o = o || {};
    if (!list.length) return `<div class="empty">${icon('orders')}<span>${A('مفيش طلبات هنا.', 'No orders here.')}</span></div>`;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${o.bulk ? '<th style="width:30px"><input type="checkbox" data-all></th>' : ''}<th>${A('الطلب', 'Order')}</th><th>${A('التاريخ', 'Date')}</th><th>${A('العميل', 'Customer')}</th>${o.compact ? '' : `<th>${A('الدفع', 'Payment')}</th>`}<th>${A('الحالة', 'Status')}</th>${o.compact ? '' : `<th>${A('القطع', 'Items')}</th>`}<th class="r">${A('الإجمالي', 'Total')}</th></tr></thead><tbody>
      ${list.map(x => `<tr data-href="orders/${esc(x.id)}">${o.bulk ? `<td><input type="checkbox" data-sel="${esc(x.id)}"></td>` : ''}<td><b>${esc(x.id)}</b>${x.demo ? ' <span class="bdg bdg--plain faint">demo</span>' : ''}${x.preorder ? ' <span class="bdg bdg--brand bdg--plain">' + A('حجز', 'Pre') + '</span>' : ''}</td><td class="muted small">${dt(x.date)}</td><td>${esc(x.customer.name)}</td>${o.compact ? '' : `<td class="small">${esc(payName(x.payment))}</td>`}<td>${statusBdg(x.status)}</td>${o.compact ? '' : `<td class="num">${x.items.reduce((n, i) => n + i.qty, 0)}</td>`}<td class="r num"><b>${money(x.totals.total)}</b></td></tr>`).join('')}</tbody></table></div>`;
  }
  const ST_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  Z.view('orders', {
    perm: 'orders', title: () => A('الطلبات', 'Orders'),
    render(id, q) {
      if (id) return orderDetail(id);
      const all = S.orders(), st = q.st || '', qq = (q.q || '').toLowerCase(), kind = q.k || '', pg = +q.p || 1;
      let list = all.filter(o => (!st || o.status === st) && (!kind || (kind === 'pre' ? o.preorder : !o.preorder)) && (!qq || (o.id + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase().indexOf(qq) > -1));
      const pages = Math.max(1, Math.ceil(list.length / 50)); const view = list.slice((pg - 1) * 50, pg * 50);
      const cnt = s => all.filter(o => o.status === s).length;
      const L = S.STATUS(); const href = patch => '#orders?' + new URLSearchParams(Object.assign({ st, q: q.q || '', k: kind }, patch)).toString();
      return `<div class="page">${ph(A('الطلبات', 'Orders'), { act: `<button class="btn" data-csv>${icon('down2')}${A('تصدير CSV', 'Export CSV')}</button>` })}
        ${Z.demoBanner()}
        <section class="card card--flush">
          <div class="tabs"><a href="${href({ st: '', p: 1 })}" class="${!st ? 'on' : ''}">${A('الكل', 'All')}<span class="cnt">${all.length}</span></a>${ST_ORDER.map(s => `<a href="${href({ st: s, p: 1 })}" class="${st === s ? 'on' : ''}">${L[s]}<span class="cnt">${cnt(s)}</span></a>`).join('')}</div>
          <div class="tbar"><input class="inp" style="max-width:320px" placeholder="${A('بحث برقم الطلب أو الاسم أو الموبايل', 'Search by order, name or phone')}" value="${esc(q.q || '')}" id="oq">
            <span class="muted small" style="margin-inline-start:auto">${list.length} ${A('طلب', 'orders')}</span></div>
          <div class="bulk hide" id="bulk"><b id="bulkN"></b><span class="muted small">${A('غيّر الحالة إلى', 'Mark as')}</span>${ST_ORDER.map(s => `<button class="btn btn--sm" data-bulk="${s}">${L[s]}</button>`).join('')}</div>
          ${ordersTable(view, { bulk: true })}
          ${pages > 1 ? `<div class="pager">${pg > 1 ? `<a class="btn btn--sm" href="${href({ p: pg - 1 })}">‹</a>` : ''}<span class="small">${pg} / ${pages}</span>${pg < pages ? `<a class="btn btn--sm" href="${href({ p: pg + 1 })}">›</a>` : ''}</div>` : ''}
        </section></div>`;
    },
    mount(id, q) {
      if (id) return mountOrder(id);
      Z.bindDemo();
      const go = patch => { location.hash = '#orders?' + new URLSearchParams(Object.assign({ st: q.st || '', q: q.q || '', k: q.k || '' }, patch)).toString(); };
      let t; const oq = Z.$('#oq'); oq.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { go({ q: oq.value, p: 1 }); setTimeout(() => { const n = Z.$('#oq'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 350); });

      const sel = () => Z.$$('[data-sel]:checked').map(c => c.dataset.sel);
      const paint = () => { const n = sel().length; Z.$('#bulk').classList.toggle('hide', !n); Z.$('#bulkN').textContent = n + ' ' + A('محدد', 'selected'); };
      Z.$$('[data-sel]').forEach(c => c.addEventListener('change', paint));
      const all = Z.$('[data-all]'); if (all) all.addEventListener('change', () => { Z.$$('[data-sel]').forEach(c => { c.checked = all.checked; }); paint(); });
      Z.$$('[data-bulk]').forEach(b => b.addEventListener('click', () => { sel().forEach(id2 => S.setStatus(id2, b.dataset.bulk)); Z.toast(A('اتحدّثت الحالة', 'Status updated')); Z.rerender(); }));
      Z.$('[data-csv]').addEventListener('click', () => {
        const os = S.orders();
        Z.csv('freshvalley-orders', ['id', 'date', 'status', 'customer', 'phone', 'zone', 'district', 'address', 'slot', 'payment', 'promo', 'items', 'subtotal', 'discount', 'delivery', 'total', 'gift', 'demo'],
          os.map(o => [o.id, new Date(o.date).toISOString(), o.status, o.customer.name, o.customer.phone, o.address.zone, o.address.district, o.address.line, o.slot || '', o.payment, o.promo, o.items.map(i => `${i.title_en} / ${i.color_en} x${i.qty}`).join(' | '), o.totals.subtotal, o.totals.discount, o.totals.delivery, o.totals.total, o.gift ? 'yes' : '', o.demo ? 'yes' : '']));
      });
    }
  });
  const NEXT = { reserved: 'confirmed', pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
  function orderDetail(id) {
    const o = S.get(id);
    if (!o) return `<div class="page">${ph(A('طلب غير موجود', 'Order not found'), { back: '#orders' })}</div>`;
    const L = S.STATUS(), nx = NEXT[o.status];
    const custOrders = S.orders().filter(x => x.customer.phone === o.customer.phone).length;
    const m = S.metrics(o);
    return `<div class="page">
      ${ph(esc(o.id), { back: '#orders', badge: statusBdg(o.status) + (o.demo ? ' <span class="bdg bdg--plain faint">demo</span>' : ''), act: `${nx ? `<button class="btn btn--pri" data-st="${nx}">${icon('check')}${A('انقل لـ', 'Mark as')} ${L[nx]}</button>` : ''}<button class="btn" data-print>${icon('print')}${A('فاتورة', 'Invoice')}</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${esc(waPhone(o.customer.phone))}?text=${encodeURIComponent(waMsg(o))}">${icon('wa')}WhatsApp</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${esc(waPhone(o.customer.phone))}?text=${encodeURIComponent(reviewAsk(o))}" title="${A('ابعت للعميل لينك التقييم', 'Send the customer a review link')}">${icon('star')}${A('اطلب تقييم', 'Ask for a review')}</a><button class="btn btn--danger btn--ghost" data-rm>${icon('trash')}</button>` })}
      <p class="muted" style="margin:-8px 0 0">${dt(o.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <div class="grid g-main">
        <div class="stack">
          ${card(A('القطع', 'Items') + ` <span class="bdg bdg--plain">${o.items.reduce((n, i) => n + i.qty, 0)}</span>`, o.items.map(i => `<div class="line-i"><img src="${esc(i.img)}" alt=""><div><b>${esc(AR() ? i.title_ar : i.title_en)}</b><div class="muted small">${esc(AR() ? i.color_ar || i.color_en : i.color_en)}${i.pre ? ` · <span class="bdg bdg--brand bdg--plain">${A('حجز', 'Pre-order')}</span> ${A('عربون', 'deposit')} ${money(i.deposit)}` : ''}</div></div><div class="num" style="text-align:end">${money(i.price)} × ${i.qty}<br><b>${money(i.price * i.qty)}</b></div></div>`).join(''))}
          ${card(A('الحساب', 'Payment'), `<div class="kv"><div><span>${A('المجموع', 'Subtotal')}</span><span class="num">${money(o.totals.subtotal)}</span></div>
            ${o.totals.discount ? `<div><span>${A('الخصم', 'Discount')} · ${esc(o.promo)}</span><span class="num">−${money(o.totals.discount)}</span></div>` : ''}
            <div><span>${A('التوصيل', 'Delivery')}</span><span class="num">${o.totals.delivery ? money(o.totals.delivery) : A('مجاني', 'Free')}</span></div>
            <div class="tot"><span>${A('الإجمالي', 'Total')}</span><span class="num">${money(o.totals.total)}</span></div>
            ${o.preorder ? `<div><span>${A('المطلوب مقدّماً (العربون)', 'Due upfront (deposit)')}</span><b class="num">${money(o.totals.dueNow)}</b></div><div><span>${A('الباقي عند الاستلام', 'Balance on delivery')}</span><b class="num">${money(o.totals.balance)}</b></div>` : ''}
            <div><span>${A('طريقة الدفع', 'Method')}</span><span>${esc(payName(o.payment))}</span></div>
            ${m.profit != null ? `<div><span>${A('ربح تقديري', 'Estimated profit')}</span><b class="num" style="color:var(--ok)">${money(m.profit)}</b></div>` : ''}</div>`)}
          ${card(A('السجل والملاحظات', 'Timeline & notes'), `<form class="row" id="noteF" style="margin-bottom:14px"><input class="inp grow" name="n" placeholder="${A('اكتب ملاحظة داخلية…', 'Add an internal note…')}"><button class="btn">${A('حفظ', 'Save')}</button></form>
            <div class="timeline">${(o.log || []).map(l => ({ t: l.t, h: `${A('الحالة', 'Status')}: ${L[l.s] || l.s}` })).concat((o.notes || []).map(n => ({ t: n.t, h: '📝 ' + esc(n.text) }))).sort((a, b) => b.t - a.t).map(e => `<div class="tl on"><i></i><div><div>${e.h}</div><div class="faint small">${dt(e.t)}</div></div></div>`).join('')}</div>`)}
        </div>
        <div class="stack">
          ${card(A('الحالة', 'Status'), `<select class="inp" id="stSel">${ST_ORDER.map(s => `<option value="${s}"${o.status === s ? ' selected' : ''}>${L[s]}</option>`).join('')}</select>`)}
          ${card(A('العميل', 'Customer'), `<div style="display:grid;gap:6px"><a href="#customers/${encodeURIComponent(o.customer.phone)}"><b>${esc(o.customer.name)}</b></a><span class="muted small">${custOrders} ${A('طلب', 'orders')}</span><a href="tel:${esc(o.customer.phone)}" dir="ltr" class="mono" style="justify-self:start">${esc(o.customer.phone)}</a>${o.customer.email ? `<a href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a>` : ''}</div>`)}
          ${card(A('عنوان التوصيل', 'Delivery address'), `<div style="display:grid;gap:4px"><b>${esc(S.zoneName(o.address.zone))} · ${esc(S.distName(o.address.zone, o.address.district))}</b><span>${esc(o.address.line)}</span>${o.slot ? `<span class="bdg bdg--info bdg--plain" style="justify-self:start">${icon('truck')} ${esc(o.slot)}</span>` : ''}${o.gift ? `<span class="bdg bdg--brand bdg--plain" style="justify-self:start">${A('هدية', 'Gift')}</span>` : ''}${o.address.notes ? `<span class="muted small">${esc(o.address.notes)}</span>` : ''}</div>`)}
          ${o.promo ? card(A('كود الخصم', 'Discount code'), `<span class="bdg bdg--info bdg--plain mono">${esc(o.promo)}</span>`) : ''}
        </div>
      </div></div>`;
  }
  const waPhone = p => { p = String(p || '').replace(/\D/g, ''); return p.indexOf('0') === 0 ? '2' + p : p; };
  const absStore = hash => new URL(Z.storeUrl(hash), location.href).href;
  function reviewAsk(o) {
    const seen = {}, links = [];
    (o.items || []).forEach(i => { const p = D().products.find(x => x.id === i.pid); if (!p || seen[p.id]) return; seen[p.id] = 1; links.push((AR() ? i.title_ar : i.title_en) + ':\n' + absStore('#/products/' + p.handle + '?review=1')); });
    const first = String(o.customer.name || '').split(' ')[0];
    return (AR() ? `أهلاً ${first}، شكراً إنك اخترت فريش فالي!\nيهمنا جداً رأيك في الطزاجة والطعم — لو عندك دقيقة اكتب تقييمك من هنا:\n\n` : `Hi ${first}, thank you for choosing Fresh Valley!\nWe'd love your honest take on the freshness and taste — it takes a minute:\n\n`) + links.join('\n\n');
  }
  function waMsg(o) { return (AR() ? `أهلاً ${o.customer.name}\nبخصوص طلبك ${o.id} من فريش فالي — الإجمالي ${money(o.totals.total)}${o.slot ? ' · ' + o.slot : ''}.` : `Hi ${o.customer.name}\nAbout your Fresh Valley order ${o.id} — total ${money(o.totals.total)}${o.slot ? ' · ' + o.slot : ''}.`); }
  function mountOrder(id) {
    const o = S.get(id); if (!o) return;
    Z.$$('[data-st]').forEach(b => b.addEventListener('click', () => { S.setStatus(id, b.dataset.st); Z.toast(A('اتحدّثت الحالة', 'Status updated')); Z.rerender(); }));
    const sel = Z.$('#stSel'); if (sel) sel.addEventListener('change', () => { S.setStatus(id, sel.value); Z.toast(A('اتحدّثت الحالة', 'Status updated')); Z.rerender(); });
    Z.$('#noteF').addEventListener('submit', e => { e.preventDefault(); const v = e.target.n.value.trim(); if (!v) return; S.addNote(id, v); Z.rerender(); });
    Z.$('[data-print]').addEventListener('click', () => invoice(o));
    Z.$('[data-rm]').addEventListener('click', () => Z.confirmBox(A('حذف الطلب نهائياً؟', 'Delete this order permanently?'), A('حذف', 'Delete'), () => { S.remove(id); location.hash = '#orders'; }, true));
  }
  /* branded invoice */
  function invoice(o) {
    const ar = AR(), s = D().settings;
    const html = `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(o.id)}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Plus+Jakarta+Sans:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap">
      <style>*{box-sizing:border-box}body{margin:0;font-family:'Plus Jakarta Sans','IBM Plex Sans Arabic',sans-serif;color:#141A15;font-size:13px}.w{max-width:760px;margin:0 auto;padding:28px}
      .hd{background:#19291C;color:#fff;padding:22px 26px;display:flex;justify-content:space-between;align-items:center;border-radius:16px}.hd img{height:40px}.hd small{color:#C9CFC6;display:block;max-width:300px}
      .acc{height:4px;background:#AE9D57;margin:0 0 20px;border-radius:4px}.g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:18px 0}.g b{display:block;font-size:11px;color:#777;font-weight:600;margin-bottom:3px}
      table{width:100%;border-collapse:collapse;margin-top:10px}th{text-align:start;font-size:11px;color:#777;border-bottom:1px solid #ddd;padding:8px 6px}td{padding:10px 6px;border-bottom:1px solid #eee}td.r,th.r{text-align:end}
      .sz{display:inline-block;border:1px solid #DDD;border-radius:20px;padding:1px 8px;font:600 11px 'Plus Jakarta Sans',sans-serif}.tot{margin-${ar ? 'right' : 'left'}:auto;width:280px;margin-top:14px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.tot .b{font-weight:700;font-size:15px;border-top:2px solid #111;padding-top:8px}
      .note{margin-top:22px;padding:12px 14px;background:#F4F5F2;border-radius:12px;font-size:12px}.ft{margin-top:26px;color:#777;font-size:11px;text-align:center}.st{display:inline-block;background:#AE9D57;color:#19291C;font-weight:700;padding:3px 10px;border-radius:20px;font-size:11px}
      @media print{.w{padding:0}}</style></head><body><div class="w">
      <div class="hd"><div><img src="${location.origin + location.pathname.replace(/admin\.html.*$/, '')}images/brand/logo-white.svg" alt="Fresh Valley"><small>${esc(ar ? s.tagline_ar : s.tagline_en)}</small></div><div style="text-align:end"><div style="font:400 22px 'Fraunces',serif">${esc(o.id)}</div><small>${dt(o.date, { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></div><div class="acc"></div>
      <span class="st">${S.STATUS()[o.status]}</span>
      <div class="g"><div><b>${ar ? 'العميل' : 'Billed to'}</b>${esc(o.customer.name)}<br><span dir="ltr">${esc(o.customer.phone)}</span></div><div><b>${ar ? 'التوصيل' : 'Deliver to'}</b>${esc(S.zoneName(o.address.zone))} · ${esc(S.distName(o.address.zone, o.address.district))}<br>${esc(o.address.line)}${o.slot ? '<br>' + esc(o.slot) : ''}</div><div><b>${ar ? 'الدفع' : 'Payment'}</b>${esc(payName(o.payment))}${o.promo ? '<br>' + (ar ? 'كود' : 'Code') + ': ' + esc(o.promo) : ''}</div></div>
      <table><thead><tr><th>${ar ? 'الصنف' : 'Item'}</th><th>${ar ? 'العبوة' : 'Pack'}</th><th class="r">${ar ? 'الكمية' : 'Qty'}</th><th class="r">${ar ? 'السعر' : 'Price'}</th><th class="r">${ar ? 'الإجمالي' : 'Total'}</th></tr></thead><tbody>
      ${o.items.map(i => `<tr><td><b>${esc(ar ? i.title_ar : i.title_en)}</b><br><span style="color:#777">${ar ? 'درجة A+' : 'Class A+'}</span></td><td><span class="sz">${esc(ar ? i.color_ar || i.color_en : i.color_en)}</span></td><td class="r">${i.qty}</td><td class="r">${money(i.price)}</td><td class="r">${money(i.price * i.qty)}</td></tr>`).join('')}</tbody></table>
      <div class="tot"><div><span>${ar ? 'المجموع' : 'Subtotal'}</span><span>${money(o.totals.subtotal)}</span></div>${o.totals.discount ? `<div><span>${ar ? 'الخصم' : 'Discount'}</span><span>−${money(o.totals.discount)}</span></div>` : ''}<div><span>${ar ? 'التوصيل' : 'Delivery'}</span><span>${o.totals.delivery ? money(o.totals.delivery) : (ar ? 'مجاني' : 'Free')}</span></div><div class="b"><span>${ar ? 'الإجمالي' : 'Total'}</span><span>${money(o.totals.total)}</span></div>
      ${o.preorder ? `<div><span>${ar ? 'مدفوع مقدّماً' : 'Paid upfront'}</span><span>${money(o.totals.dueNow)}</span></div><div><span>${ar ? 'الباقي عند الاستلام' : 'Balance on delivery'}</span><b>${money(o.totals.balance)}</b></div>` : ''}</div>
      <div class="note">${ar ? 'إنستاباي' : 'InstaPay'}: ${esc((s.payments.instapay || {}).handle || '')} · ${ar ? 'فودافون كاش' : 'Vodafone Cash'}: ${esc((s.payments.vodafone || {}).number || '')}<br>${ar ? 'ابعت صورة التحويل على واتساب لتأكيد الطلب.' : 'Send the transfer screenshot on WhatsApp to confirm your order.'}</div>
      <div class="ft">${o.gift ? (ar ? 'هدية — من غير أسعار على الكارت · ' : 'Gift — card printed without prices · ') : ''}Fresh Valley · فريش فالي — instagram.com/${esc(s.instagram)} · ${esc(s.email)} · WhatsApp +${esc(s.whatsapp)}</div></div><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`;
    const w = window.open('', '_blank'); if (!w) return Z.toast(A('اسمح بالنوافذ المنبثقة عشان الفاتورة', 'Allow pop-ups to print the invoice'), true);
    w.document.open(); w.document.write(html); w.document.close();
  }
  Z.invoice = invoice;

  /* ═════════════════════════ PRODUCTS ═════════════════════════ */
  const unitsSold = () => { const m = {}; S.breakdown('product', ALL).forEach(r => { m[r.k] = r.units; }); return m; };
  Z.view('products', {
    perm: 'products', title: () => A('المنتجات', 'Products'),
    render(id, q) {
      if (id) return productEditor(id);
      const ps = D().products, st = q.st || '', col = q.c || '', qq = (q.q || '').toLowerCase(), sold = unitsSold();
      const list = ps.filter(p => (!st || p.status === st) && (!col || p.collection === col) && (!qq || (p.title_en + ' ' + p.title_ar + ' ' + (p.tags || []).join(' ')).toLowerCase().indexOf(qq) > -1));
      const cnt = s => ps.filter(p => p.status === s).length;
      const href = patch => '#products?' + new URLSearchParams(Object.assign({ st, c: col, q: q.q || '' }, patch)).toString();
      return `<div class="page">${ph(A('المنتجات', 'Products'), { act: `<a class="btn" href="#collections">${A('الكولكشنز', 'Collections')}</a><a class="btn btn--pri" href="#products/new">${icon('plus')}${A('منتج جديد', 'Add product')}</a>` })}
        <section class="card card--flush">
          <div class="tabs"><a href="${href({ st: '' })}" class="${!st ? 'on' : ''}">${A('الكل', 'All')}<span class="cnt">${ps.length}</span></a><a href="${href({ st: 'active' })}" class="${st === 'active' ? 'on' : ''}">${A('منشور', 'Active')}<span class="cnt">${cnt('active')}</span></a><a href="${href({ st: 'draft' })}" class="${st === 'draft' ? 'on' : ''}">${A('مسودة', 'Draft')}<span class="cnt">${cnt('draft')}</span></a></div>
          <div class="tbar"><input class="inp" style="max-width:300px" id="pq" placeholder="${A('بحث…', 'Search…')}" value="${esc(q.q || '')}">
            <select class="inp" style="max-width:220px" id="pc"><option value="">${A('كل الكولكشنز', 'All collections')}</option>${D().collections.map(c => `<option value="${esc(c.id)}"${col === c.id ? ' selected' : ''}>${esc(T(c, 'title'))}${c.status !== 'active' ? ' (' + A('مخفي', 'hidden') + ')' : ''}</option>`).join('')}</select>
            <span class="muted small" style="margin-inline-start:auto">${list.length}</span></div>
          <div class="bulk hide" id="pbulk"><b id="pbulkN"></b><button class="btn btn--sm" data-pst="active">${A('انشر', 'Set active')}</button><button class="btn btn--sm" data-pst="draft">${A('حوّل لمسودة', 'Set draft')}</button></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:30px"><input type="checkbox" data-pall></th><th></th><th>${A('المنتج', 'Product')}</th><th>${A('الحالة', 'Status')}</th><th>${A('القسم', 'Collection')}</th><th>${A('العبوات', 'Packs')}</th><th>${A('المخزون', 'Inventory')}</th><th class="r">${A('المُباع', 'Sold')}</th><th class="r">${A('السعر', 'Price')}</th></tr></thead><tbody>
          ${list.map(p => { const c = N.collection(p.collection); const tr = p.variants.filter(v => v.track); const stock = tr.reduce((n, v) => n + Object.values(v.stock || {}).reduce((a, b) => a + (+b || 0), 0), 0);
            return `<tr data-href="products/${esc(p.id)}"><td><input type="checkbox" data-psel="${esc(p.id)}"></td><td><img class="thumb" src="${esc(img0(p))}" alt="" loading="lazy"></td><td><b>${esc(T(p, 'title'))}</b>${p.preorder ? ` <span class="bdg bdg--brand bdg--plain">${A('حجز', 'Pre-order')}</span>` : ''}<div class="faint small">${esc(p.id)}</div></td>
              <td>${p.status === 'active' ? `<span class="bdg bdg--ok">${A('منشور', 'Active')}</span>` : `<span class="bdg">${A('مسودة', 'Draft')}</span>`}</td><td class="small">${c ? esc(T(c, 'title')) : '—'}${c && c.status !== 'active' ? ` <span class="faint">(${A('مخفي', 'hidden')})</span>` : ''}</td>
              <td class="small">${p.variants.map(v => esc(AR() ? v.color_ar || v.color_en : v.color_en)).join(' · ')}</td>
              <td class="small">${tr.length ? `<b class="num">${stock}</b> ${A('في المخزن', 'in stock')}` : `<span class="faint">${A('غير متتبّع', 'Not tracked')}</span>`}</td><td class="r num">${sold[p.id] || 0}</td><td class="r num">${money(p.price)}</td></tr>`; }).join('')}</tbody></table></div>
        </section></div>`;
    },
    mount(id, q) {
      if (id) return mountProduct(id);
      const go = patch => { location.hash = '#products?' + new URLSearchParams(Object.assign({ st: q.st || '', c: q.c || '', q: q.q || '' }, patch)).toString(); };
      let t; const pq = Z.$('#pq'); pq.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { go({ q: pq.value }); setTimeout(() => { const n = Z.$('#pq'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 30); }, 350); });
      Z.$('#pc').addEventListener('change', e => go({ c: e.target.value }));
      const sel = () => Z.$$('[data-psel]:checked').map(c => c.dataset.psel);
      const paint = () => { const n = sel().length; Z.$('#pbulk').classList.toggle('hide', !n); Z.$('#pbulkN').textContent = n + ' ' + A('محدد', 'selected'); };
      Z.$$('[data-psel]').forEach(c => c.addEventListener('change', paint));
      Z.$('[data-pall]').addEventListener('change', e => { Z.$$('[data-psel]').forEach(c => { c.checked = e.target.checked; }); paint(); });
      Z.$$('[data-pst]').forEach(b => b.addEventListener('click', () => { const ids = sel(); D().products.forEach(p => { if (ids.indexOf(p.id) > -1) p.status = b.dataset.pst; }); Z.save(); Z.toast(A('اتحدّث', 'Updated')); Z.rerender(); }));
    }
  });
  function newProduct() {
    const id = 'p-' + Date.now().toString(36);
    return { id, handle: id, status: 'draft', collection: (D().collections[0] || {}).id || '', sort: 99, unit: 'kg', title_en: 'New product', title_ar: 'منتج جديد', sub_en: '', sub_ar: '', desc_en: '', desc_ar: '', storage_en: '', storage_ar: '', origin_en: '', origin_ar: '', season_en: 'All year', season_ar: 'طول السنة', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], grade: { calibre_en: '', calibre_ar: '', brix: '', label: 'A+' }, hue: '#AE9D57', macro: '', price: 0, compareAt: null, sizes: ['one'], preorder: false, badges: ['new'], tags: [], sales: 0, pairings: [], variants: [{ id: id + '-1kg', color: '1kg', color_en: '1 kg', color_ar: '١ كجم', hex: '#AE9D57', images: [], track: false, stock: {} }] };
  }
  function productEditor(id) {
    const ps = D().products;
    if (id === 'new') { const p = newProduct(); ps.unshift(p); Z.save(); setTimeout(() => { location.replace('#products/' + p.id); }, 0); return ''; }
    const i = ps.findIndex(p => p.id === id); if (i < 0) return `<div class="page">${ph(A('منتج غير موجود', 'Product not found'), { back: '#products' })}</div>`;
    const p = ps[i], base = 'products.' + i, cost = S.costs().byId[p.id];
    const signs = D().signs || [];
    return `<div class="page">
      ${ph(esc(T(p, 'title')), { back: '#products', badge: p.status === 'active' ? `<span class="bdg bdg--ok">${A('منشور', 'Active')}</span>` : `<span class="bdg">${A('مسودة', 'Draft')}</span>`, act: `<button class="btn" data-view>${icon('eye')}${A('معاينة في المتجر', 'Preview in store')}</button><button class="btn" data-dup>${icon('copy')}${A('نسخ', 'Duplicate')}</button><button class="btn btn--danger btn--ghost" data-pdel>${icon('trash')}${A('حذف', 'Delete')}</button>` })}
      <div class="grid g-main">
        <div class="stack">
          ${card('', `${F.bi(base, 'title', A('الاسم', 'Title'))}<div style="height:12px"></div>${F.bi(base, 'sub', A('سطر قصير تحت الاسم', 'Short line under the title'))}<div style="height:12px"></div>${F.bi(base, 'desc', A('الوصف', 'Description'), { rows: 5 })}`)}
          ${card(A('العبوات والصور', 'Packs & photos'), `<p class="card__s">${A('كل عبوة ليها سعرها (٥٠٠ جم، ١ كجم…) أو حجم الصندوق. أول صورة بتظهر في الكارت — صور على خلفية بيضا ٤:٥.', 'Each pack has its own price (500 g, 1 kg…) or box size. The first photo shows on the card — 4:5 on a white background.')}</p>
            ${p.variants.map((v, vi) => { const vb = base + '.variants.' + vi; return `<div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px;display:grid;gap:12px">
              <div class="row row--sb"><span class="row"><b>${esc(AR() ? v.color_ar || v.color_en : v.color_en)}</b><span class="faint small mono">${esc(v.id)}</span></span>
                <span class="row"><button class="iconb" data-vmove="${vi}" data-d="-1"${vi ? '' : ' disabled'}>${icon('up')}</button><button class="iconb" data-vmove="${vi}" data-d="1"${vi < p.variants.length - 1 ? '' : ' disabled'}>${icon('down')}</button><button class="iconb" data-vdel="${vi}"${p.variants.length > 1 ? '' : ' disabled'}>${icon('trash')}</button></span></div>
              <div class="fgrid g3"><label class="fld"><span>${A('الاسم', 'Name')} <i class="lang-tag">AR</i></span><input class="inp" dir="rtl" data-p="${vb}.color_ar" value="${esc(v.color_ar || '')}"></label><label class="fld"><span>${A('الاسم', 'Name')} <i class="lang-tag">EN</i></span><input class="inp" dir="ltr" data-p="${vb}.color_en" value="${esc(v.color_en || '')}"></label></div>${p.box ? `<div class="fgrid"><label class="fld"><span>${A('يكفي', 'Serves')} <i class="lang-tag">AR</i></span><input class="inp" dir="rtl" data-p="${vb}.serves_ar" value="${esc(v.serves_ar || '')}"></label><label class="fld"><span>${A('يكفي', 'Serves')} <i class="lang-tag">EN</i></span><input class="inp" dir="ltr" data-p="${vb}.serves_en" value="${esc(v.serves_en || '')}"></label></div>` : ''}
              ${F.num(vb + '.price', A('سعر العبوة دي', 'Price for this pack'), { sub: A('ج.م — فاضي = سعر المنتج', 'EGP — empty = product price'), min: 0 })}
              <div class="media">${(v.images || []).map((u, k) => `<div class="media__i"><img src="${esc(u)}" alt="" loading="lazy">${p.sign && k < 2 ? `<span class="lbl">${k ? A('الأمام', 'Front') : A('الظهر', 'Back')}</span>` : k === 0 ? `<span class="lbl">${A('الرئيسية', 'Main')}</span>` : ''}<span class="act"><button data-imove="${vi}|${k}|-1" ${k ? '' : 'disabled'} aria-label="left">‹</button><button data-idel="${vi}|${k}" aria-label="delete">✕</button><button data-imove="${vi}|${k}|1" ${k < v.images.length - 1 ? '' : 'disabled'} aria-label="right">›</button></span></div>`).join('')}
                <label class="media__add">${icon('upload')}<span>${A('رفع صورة', 'Add image')}<br><small>4:5</small></span><input type="file" accept="image/*" hidden data-up="${vb}.images" data-push="1" data-max="1400"></label>
                <button class="media__add" data-vpick="${vi}" style="background:none">${icon('image')}<span>${A('من المكتبة', 'From library')}</span></button></div>
              ${F.bool(vb + '.track', A('تتبّع المخزون للعبوة دي', 'Track stock for this pack'), { rr: 1, hint: A('لو مقفول: متاح دايماً', 'Off = always available') })}
              ${v.track ? `<div class="fgrid" style="grid-template-columns:repeat(${Math.min(6, (p.sizes || []).length)},minmax(0,1fr))">${(p.sizes || []).map(s => F.num(vb + '.stock.' + s, s === 'one' ? A('الكمية المتاحة', 'Quantity in stock') : s, { min: 0 })).join('')}</div>` : ''}
            </div>`; }).join('')}
            <button class="btn btn--sm" data-vadd>${icon('plus')}${A('إضافة عبوة', 'Add pack')}</button>`)}
          ${card(A('تفاصيل المنتج والفرز', 'Produce & grading'), `<div style="display:grid;gap:12px">${F.bi(base, 'origin', A('المنشأ', 'Origin'))}${F.bi(base, 'season', A('الموسم (نص)', 'Season (text)'))}
            <label class="fld"><span>${A('شهور الموسم', 'Season months')} <small>${A('أرقام مفصولة بفاصلة — بتحدد «في موسمه دلوقتي»', 'comma separated numbers — drives “In season now”')}</small></span><input class="inp" dir="ltr" data-months="${base}" value="${esc((p.months || []).join(', '))}"></label>
            ${F.bi(base + '.grade', 'calibre', A('المقاس / الوزن المطلوب', 'Calibre / weight spec'))}<div class="fgrid">${F.text(base + '.grade.label', A('الدرجة', 'Grade label'), { dir: 'ltr' })}</div>
            ${F.bi(base, 'storage', A('إزاي يفضل طازة', 'Storage tip'), { rows: 2 })}
            ${p.box ? `<div class="fgrid"><label class="fld"><span>${A('جوّه الصندوق (سطر لكل صنف)', 'What’s inside (one per line)')} <i class="lang-tag">AR</i></span><textarea class="inp" rows="5" dir="rtl" data-lines="${base}.includes_ar">${esc((p.includes_ar || []).join('\n'))}</textarea></label><label class="fld"><span>${A('جوّه الصندوق (سطر لكل صنف)', 'What’s inside (one per line)')} <i class="lang-tag">EN</i></span><textarea class="inp" rows="5" dir="ltr" data-lines="${base}.includes_en">${esc((p.includes_en || []).join('\n'))}</textarea></label></div>` : ''}
            <div class="fgrid">${F.select(base + '.unit', A('بيتباع بـ', 'Sold by'), [['kg', A('الوزن (كجم)', 'Weight (kg)')], ['piece', A('القطعة', 'Piece')], ['bunch', A('الحزمة', 'Bunch')], ['box', A('صندوق', 'Box')]])}${F.color(base + '.hue', A('لون الهالة (الزجاج)', 'Halo colour (glass)'))}</div>
            ${F.img(base + '.macro', A('صورة العدسة (ماكرو)', 'Lens photo (macro close-up)'), { max: 900, sub: A('مربعة — بتظهر جوّه العدسة', 'square — shown inside the lens') })}</div>`)}
        </div>
        <div class="stack">
          ${card(A('الحالة', 'Status'), `${F.select(base + '.status', '', [['active', A('منشور — ظاهر في المتجر', 'Active — visible in the store')], ['draft', A('مسودة — مخفي', 'Draft — hidden')]], { rr: 1 })}`)}
          ${card(A('التنظيم', 'Organisation'), `<div style="display:grid;gap:12px">${F.select(base + '.collection', A('الكولكشن', 'Collection'), D().collections.map(c => [c.id, T(c, 'title') + (c.status !== 'active' ? ' (' + A('مخفي', 'hidden') + ')' : '')]), { rr: 1 })}
            <label class="fld"><span>${A('الوسوم', 'Tags')} <small>${A('مفصولة بفاصلة', 'comma separated')}</small></span><input class="inp" dir="ltr" data-tags="${base}" value="${esc((p.tags || []).join(', '))}"></label>
            ${F.num(base + '.sort', A('الترتيب داخل الكولكشن', 'Order within collection'))}
            ${F.num(base + '.sales', A('درجة الشعبية', 'Popularity score'), { hint: A('بتستخدم لترتيب «الأكثر مبيعاً»', 'Used to rank “Best sellers”') })}</div>`)}
          ${card(A('السعر', 'Pricing'), `<div style="display:grid;gap:12px">${F.num(base + '.price', A('السعر', 'Price'), { sub: A('ج.م', 'EGP'), min: 0 })}${F.num(base + '.compareAt', A('السعر قبل الخصم', 'Compare-at price'), { hint: A('لو أكبر من السعر يظهر كخصم', 'Shown struck-through if higher') })}
            <label class="fld"><span>${A('التكلفة للقطعة', 'Cost per item')} <small>${A('خاص بيك — مش بتتنشر', 'private — never published')}</small></span><input class="inp num" type="number" dir="ltr" id="costIn" value="${cost == null ? '' : cost}"></label>
            ${cost != null && p.price ? `<p class="small muted" style="margin:0">${A('هامش الربح', 'Margin')}: <b>${Math.round((p.price - cost) / p.price * 100)}%</b> · ${A('ربح القطعة', 'Profit/item')} <b>${money(p.price - cost)}</b></p>` : ''}</div>`)}
          ${card(A('الشارات', 'Badges'), `<div class="row">${[['new', A('جديد', 'New')], ['seasonal', A('موسمي', 'Seasonal')], ['export', A('درجة تصدير', 'Export grade')], ['organic', A('أورجانيك', 'Organic')], ['bestseller', A('الأكثر إهداءً', 'Most gifted')]].map(([k, l]) => `<label class="tg"><input type="checkbox" data-badge="${k}" ${(p.badges || []).indexOf(k) > -1 ? 'checked' : ''}><span class="tg__sw"></span><span><b>${l}</b></span></label>`).join('')}</div>`)}
          ${card(A('رابط المنتج', 'URL'), `${F.text(base + '.handle', A('الرابط', 'Handle'), { dir: 'ltr', hint: '#/products/' + esc(p.handle) })}`)}
        </div>
      </div></div>`;
  }
  function mountProduct(id) {
    const ps = D().products, i = ps.findIndex(p => p.id === id); if (i < 0) return;
    const p = ps[i];
    const c = Z.$('#costIn'); if (c) c.addEventListener('change', () => { S.setCost(p.id, c.value); Z.rerender(); });
    const tg = Z.$('[data-tags]'); if (tg) tg.addEventListener('change', () => { p.tags = tg.value.split(',').map(s => s.trim()).filter(Boolean); Z.save(); });
    const mo = Z.$('[data-months]'); if (mo) mo.addEventListener('change', () => { p.months = mo.value.split(/[,\s]+/).map(Number).filter(n => n >= 1 && n <= 12); Z.save(); });
    Z.$$('[data-lines]').forEach(x => x.addEventListener('change', () => { Z.set(x.dataset.lines, x.value.split('\n').map(t => t.trim()).filter(Boolean)); }));
    Z.$$('[data-badge]').forEach(x => x.addEventListener('change', () => { const b = x.dataset.badge; p.badges = (p.badges || []).filter(z => z !== b); if (x.checked) p.badges.push(b); Z.save(); }));
    Z.$$('[data-vmove]').forEach(b => b.addEventListener('click', () => { const a = +b.dataset.vmove, j = a + (+b.dataset.d); [p.variants[a], p.variants[j]] = [p.variants[j], p.variants[a]]; Z.save(); Z.rerender(); }));
    Z.$$('[data-vdel]').forEach(b => b.addEventListener('click', () => Z.confirmBox(A('حذف العبوة دي؟', 'Delete this pack?'), A('حذف', 'Delete'), () => { p.variants.splice(+b.dataset.vdel, 1); Z.save(); Z.rerender(); }, true)));
    Z.$('[data-vadd]').addEventListener('click', () => { const k = 'c' + Date.now().toString(36).slice(-4); p.variants.push({ id: p.id + '-' + k, color: k, color_en: 'New pack', color_ar: 'عبوة جديدة', hex: p.hue || '#AE9D57', images: (p.variants[0] && p.variants[0].images || []).slice(0, 1), track: false, stock: {}, price: p.price }); Z.save(); Z.rerender(); });
    Z.$$('[data-idel]').forEach(b => b.addEventListener('click', () => { const [vi, k] = b.dataset.idel.split('|').map(Number); p.variants[vi].images.splice(k, 1); Z.save(); Z.rerender(); }));
    Z.$$('[data-imove]').forEach(b => b.addEventListener('click', () => { const [vi, k, d] = b.dataset.imove.split('|').map(Number); const a = p.variants[vi].images; [a[k], a[k + d]] = [a[k + d], a[k]]; Z.save(); Z.rerender(); }));
    Z.$$('[data-vpick]').forEach(b => b.addEventListener('click', () => { const vi = +b.dataset.vpick; pick(url => { p.variants[vi].images.push(url); Z.save(); Z.rerender(); }); }));
    Z.$('[data-view]').addEventListener('click', () => { N.write(N.LS.draft, Z.draft); localStorage.setItem(N.LS.preview, '1'); window.open(Z.storeUrl('#/products/' + p.handle), '_blank'); });
    Z.$('[data-dup]').addEventListener('click', () => { const cp = JSON.parse(JSON.stringify(p)); const nid = p.id + '-copy-' + Date.now().toString(36).slice(-3); cp.id = nid; cp.handle = p.handle + '-copy'; cp.status = 'draft'; cp.title_en += ' (copy)'; cp.title_ar += ' (نسخة)'; cp.variants.forEach(v => { v.id = nid + '-' + v.color; }); ps.splice(i + 1, 0, cp); Z.save(); location.hash = '#products/' + nid; });
    Z.$('[data-pdel]').addEventListener('click', () => Z.confirmBox(A('حذف المنتج؟ (ممكن تحوّله لمسودة بدل الحذف)', 'Delete this product? (You can set it to draft instead)'), A('حذف', 'Delete'), () => { ps.splice(i, 1); Z.save(); location.hash = '#products'; }, true));
  }
  function pick(cb) {
    const imgs = Z.allImages();
    Z.modal(A('اختار صورة', 'Choose an image'), `<div class="media">${imgs.map(u => `<button class="media__i" data-u="${esc(u)}" style="padding:0;border:0;cursor:pointer"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>`, '', m => {
      m.querySelector('.media').addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; Z.closeModal(); cb(b.dataset.u); });
    });
  }

  /* ═════════════════════════ COLLECTIONS ═════════════════════════ */
  Z.view('collections', {
    perm: 'products', title: () => A('الكولكشنز', 'Collections'),
    render(id) {
      const cs = D().collections;
      if (id) {
        const i = cs.findIndex(c => c.id === id); if (i < 0) return `<div class="page">${ph(A('غير موجود', 'Not found'), { back: '#collections' })}</div>`;
        const c = cs[i], b = 'collections.' + i, prods = D().products.filter(p => p.collection === c.id);
        return `<div class="page">${ph(esc(T(c, 'title')), { back: '#collections', badge: c.status === 'active' ? `<span class="bdg bdg--ok">${A('ظاهر', 'Visible')}</span>` : `<span class="bdg">${A('مخفي', 'Hidden')}</span>` })}
          <div class="grid g-main"><div class="stack">
            ${card('', `${F.bi(b, 'title', A('الاسم', 'Title'))}<div style="height:12px"></div>${F.bi(b, 'short', A('اسم قصير (للقوائم)', 'Short name (menus)'))}<div style="height:12px"></div>${F.bi(b, 'desc', A('الوصف', 'Description'), { rows: 3 })}`)}
            ${card(A('المنتجات', 'Products') + ` <span class="bdg bdg--plain">${prods.length}</span>`, prods.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${prods.map(p => `<tr data-href="products/${esc(p.id)}"><td style="width:50px"><img class="thumb" src="${esc(img0(p))}" alt=""></td><td><b>${esc(T(p, 'title'))}</b></td><td>${p.status === 'active' ? `<span class="bdg bdg--ok">${A('منشور', 'Active')}</span>` : `<span class="bdg">${A('مسودة', 'Draft')}</span>`}</td><td class="r num">${money(p.price)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="muted small">${A('اختار الكولكشن من صفحة المنتج.', 'Assign products from the product page.')}</p>`, { flush: false })}
          </div><div class="stack">
            ${card(A('الظهور', 'Visibility'), `${F.select(b + '.status', '', [['active', A('ظاهر في المتجر', 'Visible in the store')], ['hidden', A('مخفي — كل منتجاته بتختفي', 'Hidden — its products disappear')]], { rr: 1 })}`)}
            ${card(A('النوع', 'Type'), `<div style="display:grid;gap:12px">${F.select(b + '.group', A('النوع', 'Type'), [['produce', A('خضار وفاكهة', 'Produce')], ['boxes', A('صناديق', 'Boxes')]])}</div>`)}
            ${card(A('الصور', 'Images'), `<div style="display:grid;gap:14px">${F.img(b + '.image', A('صورة البلاطة في الرئيسية', 'Homepage tile image'), { max: 1400 })}${F.img(b + '.banner', A('بانر صفحة الكولكشن', 'Collection page banner'), { max: 2200, sub: A('اختياري', 'optional') })}</div>`)}
            ${card(A('الرابط', 'URL'), F.text(b + '.handle', A('الرابط', 'Handle'), { dir: 'ltr', hint: '#/collections/' + esc(c.handle) }))}
          </div></div></div>`;
      }
      return `<div class="page">${ph(A('الكولكشنز', 'Collections'), { act: `<button class="btn btn--pri" data-cadd>${icon('plus')}${A('كولكشن جديد', 'Add collection')}</button>` })}
        <section class="card card--flush"><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${A('الاسم', 'Title')}</th><th>${A('الظهور', 'Visibility')}</th><th>${A('المنتجات', 'Products')}</th><th>${A('النوع', 'Type')}</th><th class="r">${A('الترتيب', 'Order')}</th></tr></thead><tbody>
        ${cs.map((c, i) => `<tr data-href="collections/${esc(c.id)}"><td style="width:50px"><img class="thumb" src="${esc(c.image)}" alt=""></td><td><b>${esc(T(c, 'title'))}</b><div class="faint small">${esc(c.handle)}</div></td><td>${c.status === 'active' ? `<span class="bdg bdg--ok">${A('ظاهر', 'Visible')}</span>` : `<span class="bdg">${A('مخفي', 'Hidden')}</span>`}</td><td class="num">${D().products.filter(p => p.collection === c.id && p.status === 'active').length} / ${D().products.filter(p => p.collection === c.id).length}</td><td class="small">${c.group === 'boxes' ? A('صناديق', 'Boxes') : A('خضار وفاكهة', 'Produce')}</td>
          <td class="r"><button class="iconb" data-cm="${i}|-1"${i ? '' : ' disabled'}>${icon('up')}</button><button class="iconb" data-cm="${i}|1"${i < cs.length - 1 ? '' : ' disabled'}>${icon('down')}</button></td></tr>`).join('')}</tbody></table></div></section>
        <p class="muted small">${A('ترتيب الكولكشنز هنا هو ترتيب بلاطات «تسوّق حسب الفئة» والقوائم.', 'This order drives the “Shop by category” tiles and menus.')}</p></div>`;
    },
    mount(id) {
      if (id) return;
      const cs = D().collections;
      Z.$$('[data-cm]').forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.cm.split('|').map(Number); [cs[i], cs[i + d]] = [cs[i + d], cs[i]]; Z.save(); Z.rerender(); }));
      Z.$('[data-cadd]').addEventListener('click', () => { const id2 = 'col-' + Date.now().toString(36).slice(-4); cs.push({ id: id2, handle: id2, status: 'hidden', group: 'produce', split: false, title_en: 'New collection', title_ar: 'كولكشن جديد', short_en: '', short_ar: '', desc_en: '', desc_ar: '', image: '', banner: '' }); Z.save(); location.hash = '#collections/' + id2; });
    }
  });

  /* ═════════════════════════ INVENTORY ═════════════════════════ */
  Z.view('inventory', {
    perm: 'products', title: () => A('المخزون', 'Inventory'),
    render(arg, q) {
      const rows = S.inventory(), low = q.low === '1', tracked = q.t === '1';
      const list = rows.filter(r => (!low || (r.track && r.stock - r.open <= 2)) && (!tracked || r.track) && r.p.status === 'active');
      const idx = (p, v) => { const i = D().products.indexOf(p), j = p.variants.indexOf(v); return 'products.' + i + '.variants.' + j; };
      return `<div class="page">${ph(A('المخزون', 'Inventory'))}
        <div class="banner">${icon('box')}<div class="grow"><b>${A('إزاي بيشتغل', 'How it works')}</b><span class="small">${A('فعّل «تتبّع المخزون» لأي عبوة واكتب الكمية المتاحة النهارده. المحجوز = عبوات في طلبات لسه متسلمتش. لما المتاح يوصل صفر العبوة بتتقفل في المتجر وتظهر «بلّغني».', 'Turn on “Track stock” for a pack and enter today’s available quantity. Committed = packs in orders not yet delivered. At zero the pack closes in the store and shows “Notify me”.')}</span></div></div>
        <section class="card card--flush"><div class="tabs"><a href="#inventory" class="${!low && !tracked ? 'on' : ''}">${A('الكل', 'All')}</a><a href="#inventory?t=1" class="${tracked ? 'on' : ''}">${A('متتبّع', 'Tracked')}</a><a href="#inventory?low=1" class="${low ? 'on' : ''}">${A('قرب يخلص', 'Low stock')}</a></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${A('المنتج', 'Product')}</th><th>${A('العبوة', 'Pack')}</th><th>${A('محجوز', 'Committed')}</th><th>${A('المتاح', 'Available')}</th><th style="width:130px">${A('في المخزن', 'On hand')}</th></tr></thead><tbody>
        ${list.slice(0, 400).map(r => { const av = r.track ? r.stock - r.open : null; return `<tr><td style="width:50px"><img class="thumb" src="${esc(r.v.images[0] || img0(r.p))}" alt=""></td><td><a href="#products/${esc(r.p.id)}">${esc(T(r.p, 'title'))}</a></td><td class="small">${esc(AR() ? r.v.color_ar || r.v.color_en : r.v.color_en)}</td><td class="num">${r.open}</td>
          <td>${r.track ? `<b class="num" style="color:${av <= 0 ? 'var(--bad)' : av <= 2 ? 'var(--warn)' : 'inherit'}">${av}</b>` : `<span class="faint small">${A('غير متتبّع', 'Not tracked')}</span>`}</td>
          <td>${r.track ? `<input class="inp num" type="number" dir="ltr" min="0" data-p="${idx(r.p, r.v)}.stock.${esc(r.size)}" data-t="num" value="${r.stock}">` : `<button class="btn btn--sm" data-track="${idx(r.p, r.v)}">${A('تتبّع', 'Track')}</button>`}</td></tr>`; }).join('') || `<tr><td colspan="6"><div class="empty">${A('مفيش حاجة هنا', 'Nothing here')}</div></td></tr>`}</tbody></table></div></section></div>`;
    },
    mount() { Z.$$('[data-track]').forEach(b => b.addEventListener('click', () => { Z.set(b.dataset.track + '.track', true); Z.rerender(); })); }
  });

  /* ═════════════════════════ CUSTOMERS ═════════════════════════ */
  Z.view('customers', {
    perm: 'orders', title: () => A('العملاء', 'Customers'),
    render(phone, q) {
      const all = S.customers(), SEG = S.SEGS();
      if (phone) {
        const c = all.find(x => x.phone === phone); if (!c) return `<div class="page">${ph(A('غير موجود', 'Not found'), { back: '#customers' })}</div>`;
        const os = S.orders().filter(o => o.customer.phone === phone);
        return `<div class="page">${ph(esc(c.name), { back: '#customers', badge: `<span class="bdg bdg--info">${SEG[c.seg]}</span>`, act: `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${esc(waPhone(c.phone))}">${icon('wa')}WhatsApp</a>` })}
          <div class="kpis" style="--n:4"><div class="kpi"><span class="kpi__l">${A('الطلبات', 'Orders')}</span><span class="kpi__v num">${c.orders}</span></div><div class="kpi"><span class="kpi__l">${A('إجمالي الصرف', 'Total spent')}</span><span class="kpi__v num">${money(c.spent)}</span></div><div class="kpi"><span class="kpi__l">${A('متوسط الطلب', 'Avg. order')}</span><span class="kpi__v num">${money(c.spent / c.orders)}</span></div><div class="kpi"><span class="kpi__l">${A('عميل من', 'Customer since')}</span><span class="kpi__v" style="font-size:1rem">${d8(c.first)}</span></div></div>
          ${card(A('الطلبات', 'Orders'), ordersTable(os), { flush: true })}
          ${card(A('التواصل', 'Contact'), `<div class="kv"><div><span>${A('الموبايل', 'Phone')}</span><a dir="ltr" class="mono" href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div><div><span>${A('المحافظة', 'Governorate')}</span><span>${esc(S.zoneName(c.zone))}</span></div><div><span>${A('آخر طلب', 'Last order')}</span><span>${d8(c.last)}</span></div></div>`)}</div>`;
      }
      const seg = q.s || '', qq = (q.q || '').toLowerCase();
      const list = all.filter(c => (!seg || c.seg === seg) && (!qq || (c.name + ' ' + c.phone).toLowerCase().indexOf(qq) > -1));
      return `<div class="page">${ph(A('العملاء', 'Customers'), { act: `<button class="btn" data-ccsv>${icon('down2')}CSV</button>` })}
        <div class="kpis" style="--n:5">${Object.keys(SEG).map(k => `<a class="kpi" href="#customers?s=${k}" style="color:inherit;text-decoration:none"><span class="kpi__l">${SEG[k]}</span><span class="kpi__v num">${all.filter(c => c.seg === k).length}</span></a>`).join('')}</div>
        <section class="card card--flush"><div class="tabs"><a href="#customers" class="${!seg ? 'on' : ''}">${A('الكل', 'All')}<span class="cnt">${all.length}</span></a>${Object.keys(SEG).map(k => `<a href="#customers?s=${k}" class="${seg === k ? 'on' : ''}">${SEG[k]}</a>`).join('')}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${A('العميل', 'Customer')}</th><th>${A('الشريحة', 'Segment')}</th><th>${A('الطلبات', 'Orders')}</th><th>${A('آخر طلب', 'Last order')}</th><th>${A('المحافظة', 'Governorate')}</th><th class="r">${A('الصرف', 'Spent')}</th></tr></thead><tbody>
        ${list.slice(0, 300).map(c => `<tr data-href="customers/${encodeURIComponent(c.phone)}"><td><b>${esc(c.name)}</b>${c.demo ? ' <span class="bdg bdg--plain faint">demo</span>' : ''}<div class="faint small mono" dir="ltr" style="text-align:start">${esc(c.phone)}</div></td><td><span class="bdg bdg--plain">${SEG[c.seg]}</span></td><td class="num">${c.orders}</td><td class="small muted">${d8(c.last)}</td><td class="small">${esc(S.zoneName(c.zone))}</td><td class="r num"><b>${money(c.spent)}</b></td></tr>`).join('') || `<tr><td colspan="6"><div class="empty">${A('لسه مفيش عملاء', 'No customers yet')}</div></td></tr>`}</tbody></table></div></section></div>`;
    },
    mount(phone) {
      if (phone) return;
      const b = Z.$('[data-ccsv]'); if (b) b.addEventListener('click', () => { const SEG = S.SEGS(); Z.csv('freshvalley-customers', ['name', 'phone', 'segment', 'orders', 'spent', 'first_order', 'last_order', 'governorate'], S.customers().map(c => [c.name, c.phone, SEG[c.seg], c.orders, c.spent, new Date(c.first).toISOString().slice(0, 10), new Date(c.last).toISOString().slice(0, 10), S.zoneName(c.zone)])); });
    }
  });

  /* ═════════════════════════ DISCOUNTS ═════════════════════════ */
  Z.view('discounts', {
    perm: 'promos', title: () => A('أكواد الخصم', 'Discounts'),
    render() {
      const usage = {}; S.orders().filter(o => o.promo && o.status !== 'cancelled').forEach(o => { const k = o.promo.toUpperCase(); const u = usage[k] || (usage[k] = { n: 0, sales: 0, disc: 0 }); u.n++; u.sales += o.totals.total; u.disc += o.totals.discount || 0; });
      return `<div class="page page--narrow">${ph(A('أكواد الخصم', 'Discounts'))}
        ${card('', listEd('promos', (b, it) => { const u = usage[String(it.code || '').toUpperCase()] || { n: 0, sales: 0, disc: 0 }; return `<div class="fgrid g3">
          ${F.text(b + '.code', A('الكود', 'Code'), { dir: 'ltr' })}${F.select(b + '.type', A('النوع', 'Type'), [['pct', A('نسبة %', 'Percentage %')], ['fixed', A('مبلغ ثابت', 'Fixed amount')]])}${F.num(b + '.value', A('القيمة', 'Value'), { min: 0 })}
          ${F.num(b + '.min', A('أقل قيمة طلب', 'Minimum order'), { min: 0 })}${F.text(b + '.expiry', A('ينتهي في', 'Expires'), { type: 'date', dir: 'ltr' })}${F.num(b + '.limit', A('أقصى عدد استخدام', 'Usage limit'), { hint: A('0 = بلا حد', '0 = unlimited'), min: 0 })}</div>
          ${F.text(b + '.note', A('ملاحظة داخلية', 'Internal note'))}
          <div class="row row--sb">${F.bool(b + '.active', A('شغال', 'Active'))}<span class="small muted">${A('استُخدم', 'Used')} <b>${u.n}</b> · ${A('مبيعات', 'sales')} <b>${money(u.sales)}</b> · ${A('خصم', 'discounted')} <b>${money(u.disc)}</b></span></div>`; },
          { code: 'NEWCODE', type: 'pct', value: 10, min: 0, active: true, expiry: '', limit: 0, note: '' }, { addLabel: A('كود جديد', 'New code') }))}
        <p class="muted small">${A('الأكواد بتشتغل في الشنطة والدفع. الخصم بيتوزّع على الطلب كله، فعربون الحجز بيفضل نفس النسبة.', 'Codes work in the bag and checkout. The discount is spread over the order, so pre-order deposits keep their percentage.')}</p>
        ${card(A('نافذة الخصم المنبثقة', 'Discount pop-up'), `<div style="display:grid;gap:12px">${F.bool('settings.popup.on', A('تظهر للزوار الجدد', 'Show to new visitors'))}<div class="fgrid">${F.text('settings.popup.code', A('الكود', 'Code'), { dir: 'ltr' })}${F.num('settings.popup.delay', A('بعد كام ثانية', 'Delay (seconds)'), { min: 0 })}</div>${F.bi('settings.popup', 'title', A('العنوان', 'Title'))}${F.bi('settings.popup', 'text', A('النص', 'Text'))}</div>`)}</div>`;
    }
  });

  /* ═════════════════════════ DROP ═════════════════════════ */
  const toLocal = iso => { const d = new Date(iso); if (isNaN(d)) return ''; const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
  Z.view('drop', {
    perm: 'products', title: () => A('الدروب', 'Drop'),
    render() {
      const d = D().drop, rc = N.reservedCount(), goal = +d.goal || 100;
      const mat = S.reservations(), pre = S.orders().filter(o => o.preorder && o.status !== 'cancelled');
      const dep = pre.reduce((s, o) => s + o.totals.dueNow, 0), bal = pre.reduce((s, o) => s + o.totals.balance, 0);
      const cols = (N.product('z-leo') || { variants: [] }).variants.map(v => v.color);
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const signs = D().signs || [];
      const bySign = {}; mat.forEach(r => { (bySign[r.sign] = bySign[r.sign] || {})[r.col] = r; });
      const cd = N.countdown(new Date(d.date).getTime());
      return `<div class="page">${ph(A('الدروب والحجوزات', 'Drop & pre-orders'), { badge: d.on ? (N.dropOpen() ? `<span class="bdg bdg--brand">${A('الحجز شغال', 'Reservations open')}</span>` : `<span class="bdg bdg--ok">${A('نزل', 'Dropped')}</span>`) : `<span class="bdg">${A('متوقف', 'Off')}</span>`, act: `<button class="btn" data-rcsv>${icon('down2')}${A('ملف الإنتاج CSV', 'Production CSV')}</button>` })}
        <div class="kpis" style="--n:4"><div class="kpi"><span class="kpi__l">${A('قطع محجوزة', 'Units reserved')}</span><span class="kpi__v num">${rc} <small class="muted" style="font-size:.8rem">/ ${goal}</small></span></div><div class="kpi"><span class="kpi__l">${A('عرابين اتحصّلت', 'Deposits collected')}</span><span class="kpi__v num">${money(dep)}</span></div><div class="kpi"><span class="kpi__l">${A('باقي عند الاستلام', 'Balance due')}</span><span class="kpi__v num">${money(bal)}</span></div><div class="kpi"><span class="kpi__l">${A('ينزل خلال', 'Drops in')}</span><span class="kpi__v num">${cd.done ? A('نزل', 'Live') : `${cd.d}${A('ي', 'd')} ${cd.h}${A('س', 'h')}`}</span></div></div>
        <div class="grid g-main"><div class="stack">
          ${card(A('خطة الإنتاج — البرج × اللون × المقاس', 'Production plan — sign × colour × size'), mat.length ? `<div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th style="text-align:start">${A('البرج', 'Sign')}</th>${cols.map(c => `<th>${esc(S.colName2('z-leo', 'z-leo-' + c))}</th>`).join('')}<th>${A('الإجمالي', 'Total')}</th></tr></thead><tbody>
            ${signs.map(sg => { const row = bySign[sg.id] || {}; const tot = Object.values(row).reduce((n, r) => n + r.total, 0); if (!tot) return ''; return `<tr><td style="text-align:start"><b>${sg.glyph}︎ ${esc(AR() ? sg.ar : sg.en)}</b></td>${cols.map(c => { const r = row[c]; return `<td class="${r ? 'hot' : ''}" title="${r ? sizes.map(s => s + ':' + (r.sizes[s] || 0)).join('  ') : ''}">${r ? `${r.total}<div class="faint small mono" style="font-weight:400">${sizes.filter(s => r.sizes[s]).map(s => s + '·' + r.sizes[s]).join(' ')}</div>` : '<span class="faint">—</span>'}</td>`; }).join('')}<td><b>${tot}</b></td></tr>`; }).join('')}</tbody></table></div>` : `<div class="empty">${icon('orbit')}<span>${A('لسه مفيش حجوزات.', 'No reservations yet.')}</span></div>`)}
          ${card(A('الحجوزات', 'Reservations'), ordersTable(pre.slice(0, 30)), { flush: true, act: `<a class="btn btn--sm btn--ghost" href="#orders?k=pre">${A('الكل', 'All')}</a>` })}
        </div><div class="stack">
          ${card(A('إعدادات الدروب', 'Drop settings'), `<div style="display:grid;gap:12px">${F.bool('drop.on', A('الدروب شغال', 'Drop is on'), { rr: 1, hint: A('لو اتقفل، منتجات الحجز بتتباع عادي', 'When off, pre-order products sell normally') })}
            <label class="fld"><span>${A('ميعاد النزول', 'Drop date & time')}</span><input class="inp" type="datetime-local" dir="ltr" id="dropDate" value="${toLocal(d.date)}"></label>
            ${F.select('drop.collection', A('الكولكشن', 'Collection'), D().collections.map(c => [c.id, T(c, 'title')]))}
            <div class="fgrid">${F.num('drop.depositPct', A('العربون %', 'Deposit %'), { min: 1 })}${F.num('drop.goal', A('الهدف (قطع)', 'Goal (units)'), { min: 1 })}${F.num('drop.cancelDays', A('أيام الإلغاء', 'Cancel window (days)'), { min: 0 })}${F.num('drop.seed', A('بداية العدّاد', 'Counter head start'), { min: 0, hint: A('بيتضاف للحجوزات الحقيقية — خليه 0 للأرقام الحقيقية', 'Added to real reservations — keep 0 for honest numbers') })}</div></div>`)}
          ${card(A('نصوص الدروب', 'Drop copy'), `<div style="display:grid;gap:12px">${F.bi('drop', 'title', A('الاسم', 'Title'))}${F.bi('drop', 'text', A('الوصف', 'Text'), { rows: 3 })}${F.bi('drop', 'terms', A('شروط الحجز', 'Reservation terms'), { rows: 3, hint: A('{days} = أيام الإلغاء', '{days} = cancel window') })}</div>`)}
        </div></div></div>`;
    },
    mount() {
      const dd = Z.$('#dropDate'); if (dd) dd.addEventListener('change', () => { const t = new Date(dd.value); if (!isNaN(t)) { Z.set('drop.date', t.toISOString()); Z.toast(A('اتحفظ', 'Saved')); } });
      Z.$('[data-rcsv]').addEventListener('click', () => { const rows = []; S.reservations().forEach(r => ['S', 'M', 'L', 'XL', 'XXL'].forEach(s => { if (r.sizes[s]) rows.push([r.sign, r.col, s, r.sizes[s]]); })); Z.csv('freshvalley-production-plan', ['sign', 'colour', 'size', 'units'], rows); });
    }
  });

  /* ═════════════════════════ CUSTOM REQUESTS ═════════════════════════ */
  const RQ = () => ({ new: A('جديد', 'New'), contacted: A('تم التواصل', 'Contacted'), quoted: A('اتبعت السعر', 'Quoted'), won: A('اتأكّد', 'Booked'), lost: A('اتلغى', 'Lost') });
  Z.view('requests', {
    perm: 'orders', title: () => A('المناسبات والهدايا', 'Events & gifting'),
    render(arg, q) {
      const all = S.requests(), st = q.st || '', L = RQ();
      const list = all.filter(r => !st || r.status === st);
      return `<div class="page">${ph(A('المناسبات والهدايا', 'Events & gifting'))}
        <section class="card card--flush"><div class="tabs"><a href="#requests" class="${!st ? 'on' : ''}">${A('الكل', 'All')}<span class="cnt">${all.length}</span></a>${Object.keys(L).map(k => `<a href="#requests?st=${k}" class="${st === k ? 'on' : ''}">${L[k]}<span class="cnt">${all.filter(r => r.status === k).length}</span></a>`).join('')}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${A('الطلب', 'Request')}</th><th>${A('المناسبة', 'Occasion')}</th><th>${A('الميعاد', 'Date')}</th><th>${A('الضيوف', 'Guests')}</th><th>${A('الميزانية', 'Budget')}</th><th>${A('الحالة', 'Status')}</th><th></th></tr></thead><tbody>
        ${list.map(r => `<tr><td><b>${esc(r.id)}</b>${r.demo ? ' <span class="bdg bdg--plain faint">demo</span>' : ''}<div class="small">${esc(r.name)} · <span dir="ltr" class="mono">${esc(r.phone)}</span></div><div class="faint small">${dt(r.date)}</div>${r.notes ? `<div class="small muted" style="max-width:260px">${esc(r.notes)}</div>` : ''}</td>
          <td class="small">${esc(r.kind || '—')}${r.alt ? `<div class="faint">${esc(r.alt)}</div>` : ''}</td>
          <td class="small">${esc(r.when || '—')}</td><td class="num">${esc(r.guests || '—')}</td><td class="num">${r.budget ? money(r.budget) : '—'}</td>
          <td><select class="inp" style="height:30px" data-rq="${esc(r.id)}">${Object.keys(L).map(k => `<option value="${k}"${r.status === k ? ' selected' : ''}>${L[k]}</option>`).join('')}</select></td>
          <td class="r" style="white-space:nowrap"><a class="btn btn--sm" target="_blank" rel="noopener" href="https://wa.me/${esc(waPhone(r.phone))}?text=${encodeURIComponent((AR() ? 'أهلاً ' : 'Hi ') + r.name + (AR() ? '، بخصوص طلب المناسبة ' : ', about your event request ') + r.id)}">${icon('wa')}</a><button class="iconb" data-rqdel="${esc(r.id)}">${icon('trash')}</button></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">${icon('pen')}<span>${A('لسه مفيش طلبات مناسبات.', 'No event requests yet.')}</span></div></td></tr>`}</tbody></table></div></section>
        <div class="banner">${icon('pen')}<div class="grow"><b>${A('ملحوظة', 'Note')}</b><span class="small">${A('الطلبات بتتحفظ على الجهاز اللي اتبعت منه لحد ما يتربط سيرفر. عشان كده صفحة الضيافة بتدي العميل زرار واتساب برقم الطلب — فبيوصلك في كل الأحوال.', 'Requests are stored on the device they were sent from until a server is connected — which is why the Hosting page also gives the customer a WhatsApp button with the request number, so it always reaches you.')}</span></div></div></div>`;
    },
    mount() {
      Z.$$('[data-rq]').forEach(s => s.addEventListener('change', () => { S.setRequest(s.dataset.rq, { status: s.value }); Z.toast(A('اتحدّث', 'Updated')); }));
      Z.$$('[data-rqdel]').forEach(b => b.addEventListener('click', () => Z.confirmBox(A('حذف الطلب؟', 'Delete this request?'), A('حذف', 'Delete'), () => { S.removeRequest(b.dataset.rqdel); Z.rerender(); }, true)));
    }
  });

  /* ═════════════════════════ REVIEWS ═════════════════════════
     Published reviews are content (draft → Publish). Customer submissions
     wait in "Pending" until approved. Add real feedback you received on
     WhatsApp / Instagram by hand — only reviews real customers wrote. */
  const starTxt = r => '★★★★★'.slice(0, Math.round(+r || 0)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(+r || 0));
  const prodName = id => { const p = D().products.find(x => x.id === id); return p ? T(p, 'title') : id; };
  function reviewModal(idx) {
    const list = D().reviews || (D().reviews = []), r = idx != null ? list[idx] : { pid: '', name: '', rating: 5, text: '', date: Date.now(), verified: false, status: 'published' };
    const ps = D().products.filter(p => p.status === 'active').concat(D().products.filter(p => p.status !== 'active'));
    const d0 = new Date(r.date || Date.now()), iso = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
    const pv = D().products.find(p => p.id === r.pid);
    Z.modal(idx != null ? A('تعديل التقييم', 'Edit review') : A('إضافة تقييم حقيقي', 'Add a real review'), `<div style="display:grid;gap:12px">
      <p class="small muted" style="margin:0">${A('ضيف رأي عميل حقيقي وصلك (واتساب، إنستجرام، أو بعد الاستلام) بنفس كلامه ولغته.', 'Add feedback a real customer sent you (WhatsApp, Instagram, after delivery) in their own words and language.')}</p>
      <label class="fld"><span>${A('المنتج', 'Product')}</span><select class="inp" id="rvP">${ps.map(p => `<option value="${esc(p.id)}"${p.id === r.pid ? ' selected' : ''}>${esc(T(p, 'title'))}${p.status !== 'active' ? ' (' + A('مسودة', 'draft') + ')' : ''}</option>`).join('')}</select></label>
      <div class="fgrid"><label class="fld"><span>${A('اسم العميل', 'Customer name')}</span><input class="inp" id="rvN" value="${esc(r.name || '')}" dir="auto"></label>
        <label class="fld"><span>${A('التقييم', 'Rating')}</span><select class="inp" id="rvR">${[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map(k => `<option value="${k}"${+r.rating === k ? ' selected' : ''}>${k} ★</option>`).join('')}</select></label></div>
      <label class="fld"><span>${A('الكلام', 'Review text')}</span><textarea class="inp" id="rvT" rows="4" dir="auto">${esc(r.text || '')}</textarea></label>
      <div class="fgrid"><label class="fld"><span>${A('الحي', 'Area')}</span><input class="inp" id="rvS" value="${esc(r.size || '')}" dir="auto" placeholder="New Cairo"></label>
        <label class="fld"><span>${A('العبوة', 'Pack')}</span><select class="inp" id="rvC"><option value="">—</option>${(pv || ps[0] || { variants: [] }).variants.map(v => `<option value="${esc(v.color)}"${v.color === r.color ? ' selected' : ''}>${esc(AR() ? v.color_ar : v.color_en)}</option>`).join('')}</select></label></div>
      <div class="fgrid"><label class="fld"><span>${A('التاريخ', 'Date')}</span><input class="inp" type="date" id="rvD" value="${iso}"></label>
        <label class="tg" style="align-self:end"><input type="checkbox" id="rvV" ${r.verified ? 'checked' : ''}><span class="tg__sw"></span><span><b>${A('مشتري مؤكَّد', 'Verified buyer')}</b><small>${A('اشترى فعلاً من المتجر', 'Actually bought from the store')}</small></span></label></div>
    </div>`, `<button class="btn" data-mclose>${A('إلغاء', 'Cancel')}</button><button class="btn btn--pri" id="rvOk">${A('حفظ', 'Save')}</button>`, m => {
      m.querySelector('#rvP').addEventListener('change', e => { const q = D().products.find(p => p.id === e.target.value); m.querySelector('#rvC').innerHTML = '<option value="">—</option>' + (q ? q.variants.map(v => `<option value="${esc(v.color)}">${esc(AR() ? v.color_ar : v.color_en)}</option>`).join('') : ''); });
      m.querySelector('#rvOk').addEventListener('click', () => {
        const x = { id: r.id || ('RV-' + N.uid().slice(0, 7)), pid: m.querySelector('#rvP').value, name: m.querySelector('#rvN').value.trim(), rating: +m.querySelector('#rvR').value, text: m.querySelector('#rvT').value.trim(), size: m.querySelector('#rvS').value.trim(), color: m.querySelector('#rvC').value, date: new Date(m.querySelector('#rvD').value || Date.now()).getTime(), verified: m.querySelector('#rvV').checked, status: r.status || 'published' };
        if (!x.name || !x.text) return Z.toast(A('الاسم والكلام مطلوبين', 'Name and text are required'), true);
        if (idx != null) list[idx] = x; else list.unshift(x);
        Z.save(); Z.closeModal(); Z.rerender(); Z.toast(A('اتحفظ — اضغط نشر عشان يظهر', 'Saved — publish to show it'));
      });
    });
  }
  Z.view('reviews', {
    perm: 'content', title: () => A('التقييمات', 'Reviews'),
    render(arg, q) {
      const tab = q.t || 'published', all = D().reviews || [], pend = Z.pendingReviews();
      const pub = all.filter(r => r.status !== 'hidden'), hid = all.filter(r => r.status === 'hidden');
      const st = N.reviews.stats(pub);
      const tabs = [['published', A('منشورة', 'Published'), pub.length], ['pending', A('مستنية موافقة', 'Pending'), pend.length], ['hidden', A('مخفية', 'Hidden'), hid.length]];
      const row = (r, i, kind) => `<tr><td style="width:56px">${(() => { const p = D().products.find(x => x.id === r.pid); return p ? `<img class="thumb" src="${esc(img0(p))}" alt="">` : ''; })()}</td>
        <td><b>${esc(r.name || '')}</b>${r.verified ? ` <span class="bdg bdg--ok">${A('مؤكَّد', 'Verified')}</span>` : ''}<div class="faint small">${esc(prodName(r.pid))}${r.size ? ' · ' + esc(r.size) : ''} · ${d8(r.date)}</div></td>
        <td style="color:#B7791F;white-space:nowrap;letter-spacing:1px">${starTxt(r.rating)}</td>
        <td class="small" dir="auto" style="max-width:420px">${esc(r.text || '')}${kind === 'pending' && r.phone ? `<div class="faint mono" dir="ltr">${esc(r.phone)}</div>` : ''}</td>
        <td class="r" style="white-space:nowrap">${kind === 'pending'
          ? `<button class="btn btn--sm btn--pri" data-rvok="${esc(r.id)}">${icon('check')}${A('موافقة', 'Approve')}</button><button class="btn btn--sm btn--ghost" data-rvno="${esc(r.id)}">${A('رفض', 'Reject')}</button>`
          : `<button class="iconb" data-rvedit="${i}" title="${A('تعديل', 'Edit')}">${icon('pen')}</button><button class="btn btn--sm btn--ghost" data-rvhide="${i}">${kind === 'hidden' ? A('إظهار', 'Show') : A('إخفاء', 'Hide')}</button><button class="iconb" data-rvdel="${i}" title="${A('حذف', 'Delete')}">${icon('trash')}</button>`}</td></tr>`;
      const rows = tab === 'pending' ? pend.map(r => row(r, -1, 'pending')) : all.map((r, i) => ({ r, i })).filter(x => tab === 'hidden' ? x.r.status === 'hidden' : x.r.status !== 'hidden').map(x => row(x.r, x.i, tab));
      return `<div class="page">${ph(A('التقييمات', 'Reviews'), { act: `<button class="btn btn--pri" data-rvadd>${icon('plus')}${A('إضافة تقييم', 'Add review')}</button>` })}
        <div class="banner">${icon('star')}<div class="grow"><b>${A('التقييمات الحقيقية بتبيع أكتر', 'Real reviews sell better')}</b><span class="small">${A('العملاء بيكتبوا تقييمهم من صفحة المنتج وبيوصلوا هنا في «مستنية موافقة». ومن أي طلب اتسلّم اضغط «اطلب تقييم» يتبعت للعميل لينك على واتساب. تقدر كمان تضيف رأي وصلك على إنستجرام أو واتساب بنفس كلام العميل. التقييمات بتظهر في المتجر بعد «نشر».', 'Customers write reviews on the product page and they land here under “Pending”. From any delivered order, “Ask for a review” sends the customer a WhatsApp link. You can also add feedback you got on Instagram or WhatsApp in the customer’s own words. Reviews go live after Publish.')}</span></div></div>
        <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
          <div class="kpi"><span class="kpi__l">${A('متوسط التقييم', 'Average rating')}</span><b class="kpi__v">${st.n ? st.avg.toFixed(1) + ' ★' : '—'}</b></div>
          <div class="kpi"><span class="kpi__l">${A('منشورة', 'Published')}</span><b class="kpi__v">${pub.length}</b></div>
          <div class="kpi"><span class="kpi__l">${A('مستنية موافقة', 'Pending')}</span><b class="kpi__v">${pend.length}</b></div>
          <div class="kpi"><span class="kpi__l">${A('مشتري مؤكَّد', 'Verified buyers')}</span><b class="kpi__v">${pub.filter(r => r.verified).length}</b></div>
        </div>
        <section class="card card--flush"><div class="tabs">${tabs.map(([k, l, n]) => `<a href="#reviews?t=${k}" class="${tab === k ? 'on' : ''}">${l} <span class="faint">${n}</span></a>`).join('')}</div>
          ${rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>${A('العميل', 'Customer')}</th><th>${A('التقييم', 'Rating')}</th><th>${A('الكلام', 'Review')}</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
            : `<div class="empty">${icon('star')}<b>${tab === 'pending' ? A('مفيش تقييمات مستنية', 'Nothing waiting for approval') : A('لسه مفيش تقييمات هنا', 'No reviews here yet')}</b><span class="small muted">${A('ابعت «اطلب تقييم» للعملاء من صفحة الطلب بعد الاستلام.', 'Send “Ask for a review” to customers from the order page after delivery.')}</span></div>`}</section></div>`;
    },
    mount() {
      const list = D().reviews || (D().reviews = []);
      Z.$$('[data-rvadd]').forEach(b => b.addEventListener('click', () => reviewModal(null)));
      Z.$$('[data-rvedit]').forEach(b => b.addEventListener('click', () => reviewModal(+b.dataset.rvedit)));
      Z.$$('[data-rvhide]').forEach(b => b.addEventListener('click', () => { const r = list[+b.dataset.rvhide]; r.status = r.status === 'hidden' ? 'published' : 'hidden'; Z.save(); Z.rerender(); }));
      Z.$$('[data-rvdel]').forEach(b => b.addEventListener('click', () => Z.confirmBox(A('حذف التقييم نهائياً؟', 'Delete this review?'), A('حذف', 'Delete'), () => { list.splice(+b.dataset.rvdel, 1); Z.save(); Z.rerender(); }, true)));
      Z.$$('[data-rvok]').forEach(b => b.addEventListener('click', () => {
        const r = Z.pendingReviews().find(x => x.id === b.dataset.rvok); if (!r) return;
        const p = D().products.find(x => x.id === r.pid);
        const phone = String(r.phone || '').replace(/\D/g, '');
        const bought = !!phone && S.orders().some(o => !o.demo && String(o.customer.phone || '').replace(/\D/g, '') === phone && (o.items || []).some(i => i.pid === r.pid || (p && i.collection === p.collection)));
        list.unshift({ id: r.id, pid: r.pid, name: r.name, rating: +r.rating, text: r.text, size: r.size || '', color: r.color || '', date: r.date || Date.now(), verified: bought, status: 'published' });
        Z.dropPending(r.id); Z.save(); Z.rerender();
        Z.toast(bought ? A('اتضاف ومؤكَّد من الطلبات — اضغط نشر', 'Approved as a verified buyer — hit Publish') : A('اتضاف — اضغط نشر عشان يظهر', 'Approved — hit Publish to show it'));
      }));
      Z.$$('[data-rvno]').forEach(b => b.addEventListener('click', () => Z.confirmBox(A('رفض التقييم ده؟', 'Reject this review?'), A('رفض', 'Reject'), () => { Z.dropPending(b.dataset.rvno); Z.rerender(); }, true)));
    }
  });

  Z.ordersTable = ordersTable; Z.kpiRow = kpiRow; Z.METRICS = METRICS; Z.fmtMetric = fmtMetric; Z.fmtX = fmtX; Z.pick = pick;
})();
