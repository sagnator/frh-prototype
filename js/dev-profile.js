/* FRH final — Profile & settings. Overrides the original screens in screens-profile.js.

   Screens   profile-home (tab root) · px-pdf · invoices · coupons ·
             pay-methods · px-card · notif-settings · language · support · policies · policy-text ·
             about · patients · px-patient · addresses · px-address · account · edit-profile ·
             px-phone (number → code) · px-delete (what happens → code) · px-deleted
   Sheets    logout · px-del-addr · px-del-pat · px-rm-card · px-share · px-ios · addpatient (→ px-patient)
   Contracts F.openPdf({ title, kind, back, … })   kind: 'invoice' | 'lab' | 'rx' | 'report'
             F.openAddressForm({ ctx, done, id })  ctx: 'onboarding' | 'cart' | 'profile' | 'appt' | 'home'
             F.openPatientForm({ ctx, done, id })
             F.pxJump(viewId) and F.pxNotifBlocked(bool) for the presenter panel.
   Typing    Every text field lives on a screen or an in-screen layer and uses F.KEYS (BRIEF rule 7). */
(function () {
  'use strict';
  const FI = window.FRHI, { flag, mark } = FI;
  const F = window.FRH, S = F.S, PD = window.FRHPROFILE;
  const B = window.FRHBOOK || {}, D = window.FRHDATA || {};
  const esc = F.esc;

  /* ================= icons the shared set lacks ================= */
  const PX = {
    trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M3 12.5h18"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5"/><path d="M12 8.5V21"/><path d="M12 8.5S10.5 3.6 7.8 4.1C5.6 4.6 6.4 8.5 12 8.5z"/><path d="M12 8.5s1.5-4.9 4.2-4.4c2.2.5 1.4 4.4-4.2 4.4z"/>',
    bellOff: '<path d="M8.7 3.6A6 6 0 0 1 18 8c0 3.3.7 5.5 1.5 6.9"/><path d="M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="m3 3 18 18"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    logout: '<path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.8h.01"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.4 12.6 9.1-9.1"/><path d="m16.5 6.5 2.5 2.5"/><path d="m14 9 2 2"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    airdrop: '<circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 1 1 7 0"/><path d="M5.6 18.4a9 9 0 1 1 12.8 0"/>',
    appleFill: '<path d="M16.4 12.7c0-2.2 1.8-3.2 1.9-3.3a4.1 4.1 0 0 0-3.2-1.8c-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8a4.3 4.3 0 0 0-3.6 2.2c-1.6 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.2 2.7 2.2s1.5-.7 2.8-.7 1.7.7 2.8.7 1.9-1.1 2.6-2.2a9 9 0 0 0 1.2-2.4 3.7 3.7 0 0 1-2.1-3.5zM14.2 6.2a3.7 3.7 0 0 0 .9-2.8 3.9 3.9 0 0 0-2.6 1.3 3.6 3.6 0 0 0-.9 2.7 3.3 3.3 0 0 0 2.6-1.2z"/>',
  };
  const icon = (n, s = 20, w = 1.8) => {
    if (!PX[n]) return FI.icon(n, s, w);
    const fill = /Fill$/.test(n);
    return `<svg class="ic ic-${n}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PX[n]}</svg>`;
  };

  /* ================= helpers ================= */
  const initials = s => String(s || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const aed = n => 'AED ' + Number(Math.round(n)).toLocaleString('en-US');
  const first = s => String(s || '').trim().split(/\s+/)[0];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /* shipped copy only: drop agency notes such as “placeholder … FRH to confirm” from shared data */
  const clean = t => String(t || '').split(/(?<=\.)\s+/).filter(x => !/placeholder|to confirm/i.test(x)).join(' ')
    .replace('is saved to Medical reports in the app', 'is saved under Invoices in the app');
  const faqs = () => PD.faqs.map(f => (/areas do you cover/i.test(f.q)
    ? { q: f.q, a: 'Dubai and Sharjah today, day and night. Abu Dhabi, Al Ain and Ras Al Khaimah are coming soon.' } : { q: f.q, a: clean(f.a) }));
  const later = (ms, scr, fn) => setTimeout(() => { if (!S.open || S.screen !== scr) return; fn(); }, ms);

  /* Patch the live screen in place (attributes, text, children) so toggles animate, the caret keeps
     blinking and scroll positions hold. Elements whose data-k differs are replaced, not patched. */
  function morph(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    for (let i = a.attributes.length - 1; i >= 0; i--) { const n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    morphKids(a, b);
  }
  function morphKids(a, b) {
    const ak = Array.from(a.childNodes), bk = Array.from(b.childNodes);
    bk.forEach((y, i) => {
      const x = ak[i];
      if (!x) a.appendChild(y);
      else if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName || (x.nodeType === 1 && x.getAttribute('data-k') !== y.getAttribute('data-k'))) a.replaceChild(y, x);
      else morph(x, y);
    });
    for (let i = bk.length; i < ak.length; i++) if (ak[i].parentNode === a) a.removeChild(ak[i]);
  }

  /* ---------- back navigation that follows where a screen was really opened from ----------
     A screen records the screen it was opened from (not on a back-arrival). If it was pushed,
     leaving pops the core history with F.back so the stack stays balanced for everyone else. */
  const NAV = { from: {}, pushed: {}, pend: {} };
  function navMount(n) {
    const id = n.dataset.id, p = NAV.pend[id];
    if (n.classList.contains('in-l') || !p || p === id) return;
    NAV.from[id] = p; NAV.pushed[id] = n.classList.contains('in-r');
  }
  const RESET = {};
  function leave(id, fb) {
    blurQuiet();
    if (RESET[id]) RESET[id]();
    const f = NAV.from[id], to = f && F.SCREENS[f] ? f : fb;
    if (NAV.pushed[id]) {
      NAV.pushed[id] = false;
      F.back(to);
      if (S.screen !== to && F.SCREENS[to]) F.go(to, { dir: 'none' });
    } else F.go(to, { dir: 'back' });
  }
  const screen = (id, def) => {
    const r = def.render;
    def.render = function () { const c = F.cur(); NAV.pend[id] = c ? c.dataset.id : null; return r.call(def); };
    def.update = n => { const t = document.createElement('div'); t.innerHTML = def.render(); morphKids(n, t); };
    const m = def.mount;
    def.mount = n => { navMount(n); if (m) m(n); };
    F.SCREENS[id] = def;
    return def;
  };
  const SP = '<span class="px-nav-sp"></span>';
  const navBack = (title, id, fb, right = '') => `<div class="nav"><button class="nav-btn" type="button" data-act="px-back" data-id="${id}" data-fb="${fb}" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
      <span class="nav-title">${title}</span>${right || SP}</div>`;
  const goAttr = to => `data-act="px-go" data-to="${to}"`;
  const reSheet = kind => {
    const L = F.el.sheet, a = L.querySelector('.sheet');
    if (!a || S.sheet !== kind) return;
    const t = document.createElement('div'); t.innerHTML = F.SHEETS[kind]();
    const b = t.querySelector('.sheet'); if (b) morph(a, b);
  };
  const empty = (ic, title, text, extra = '') => `<div class="empty-state"><div class="es-ic">${icon(ic, 30, 1.8)}</div><b>${title}</b><span>${text}</span>${extra}</div>`;
  const grpH = (h, extra = '') => `<div class="px-grp-h"><span>${h}</span>${extra}</div>`;

  /* ================= text fields (BRIEF rule 7) ================= */
  F.KEYS = F.KEYS || {}; F.KB_RET = F.KB_RET || {}; F.KB_LOWER = F.KB_LOWER || {};
  const TXT = {};
  const field = (key, o) => {
    TXT[key] = o;
    F.KEYS[key] = k => onType(key, k);
    if (o.ret) F.KB_RET[key] = o.ret;
    if (o.lower) F.KB_LOWER[key] = true;
  };
  const isNum = key => { const o = TXT[key]; return !!(o && (typeof o.digits === 'function' ? o.digits() : o.digits)); };
  function onType(key, k) {
    const o = TXT[key];
    if (!o || S.focus !== key) return;
    let v = String(o.get() || '');
    if (k === 'enter') { if (o.enter) o.enter(); else focusField(o.next || null); return; }
    if (k === 'del') v = v.slice(0, -1);
    else if (k.length === 1) {
      if (isNum(key) && !/\d/.test(k)) return;
      if (v.length >= (typeof o.max === 'function' ? o.max() : o.max || 60)) { F.shake(`[data-f="${key}"]`); return; }
      v += k;
    } else return;
    o.set(v);
    if (o.cap && !isNum(key)) {
      const want = v.length === 0 || (o.cap === 'words' && /\s$/.test(v));
      if (want !== !!S.shift) { S.shift = want; F.renderKb(); }
    }
    F.upd();
  }
  function focusField(key) {
    if (!key) { if (S.focus && TXT[S.focus]) { F.hideKb(); S.focus = null; F.upd(); } return; }
    const o = TXT[key]; if (!o) return;
    const v = String(o.get() || '');
    S.sym = false;
    S.shift = !isNum(key) && !!o.cap && (v.length === 0 || (o.cap === 'words' && /\s$/.test(v)));
    F.showKb(isNum(key) ? 'num' : 'qwerty', key);
    F.upd();
    later(360, S.screen, () => { if (S.focus === key) scrollToField(key); });
  }
  function blurQuiet() { if (S.focus && TXT[S.focus]) { F.hideKb(); S.focus = null; } }
  function scrollToField(key) {
    const c = F.cur(); if (!c) return;
    const node = c.querySelector(`[data-f="${key}"]`), body = node && node.closest('.scr-body, .px-layer-body');
    if (!node || !body) return;
    const y = (node.getBoundingClientRect().top - body.getBoundingClientRect().top) / (F.scale || 1) + body.scrollTop - 96;
    body.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
  /* screens with fields declare kb() so the core allows the keypad while one of their fields is focused */
  const kbFor = id => () => (S.focus && TXT[S.focus] && TXT[S.focus].scr === id ? (isNum(S.focus) ? 'num' : 'qwerty') : null);
  const errLine = e => (e ? `<div class="px-err" role="alert">${icon('alert', 13, 2.4)}<span>${e}</span></div>` : '');
  const tf = (key, label, o = {}) => {
    const f = TXT[key], v = String(f.get() || ''), on = S.focus === key;
    const shown = f.fmt ? f.fmt(v) : esc(v);
    return `${label ? `<label class="tf-lbl">${label}${o.opt ? '<span>Optional</span>' : ''}</label>` : ''}
      <div class="tf px-tf${on ? ' focus' : ''}${o.err ? ' error' : ''}${o.multi ? ' px-multi' : ''}" data-act="px-focus" data-f="${key}" role="textbox" aria-label="${esc(label || o.ph || '')}">
        ${o.ic ? icon(o.ic, 18, 2) : ''}${o.pre || ''}<div class="tf-v">${v ? `<span class="px-tv">${shown}</span>` : ''}${on ? '<span class="caret"></span>' : ''}${v ? '' : `<span class="ph">${o.ph || ''}</span>`}</div>${o.right || ''}</div>${errLine(o.err)}`;
  };

  /* ================= data ================= */
  /* patients: dates of birth become digits in the form; IDs for teleconsultation (S23) */
  const PAT_X = { p1: { idType: 'eid', idNo: '784199212345676' }, p2: { idType: 'eid', idNo: '784196498765431' }, p3: { idType: 'passport', idNo: '' } };
  PD.patients.forEach(p => { if (p.idType === undefined) Object.assign(p, PAT_X[p.id] || { idType: 'eid', idNo: '' }); });
  const dobDigits = s => { const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(s || ''); return m ? String(m[1]).padStart(2, '0') + String(MONTHS.indexOf(m[2]) + 1).padStart(2, '0') + m[3] : ''; };
  const dobText = d => (d.length === 8 ? `${+d.slice(0, 2)} ${MONTHS[+d.slice(2, 4) - 1]} ${d.slice(4)}` : '');
  const dobValid = d => {
    if (!/^\d{8}$/.test(d)) return false;
    const dd = +d.slice(0, 2), mm = +d.slice(2, 4), yy = +d.slice(4), t = new Date(yy, mm - 1, dd);
    return mm >= 1 && mm <= 12 && t.getDate() === dd && t <= new Date() && yy > 1900;
  };
  const ageOf = d => {
    if (!dobValid(d)) return null;
    const b = new Date(+d.slice(4), +d.slice(2, 4) - 1, +d.slice(0, 2)), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
    return a;
  };
  const fmtUae = d => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(' ');
  const phoneOf = p => (/^\+/.test(p.phone || '') ? p.phone : '');
  const fmtEid = d => [d.slice(0, 3), d.slice(3, 7), d.slice(7, 14), d.slice(14, 15)].filter(Boolean).join('-');

  /* addresses: type, area, building part, landmark, notes for the team (P17) */
  const TYPES = { home: ['home', 'Home'], work: ['briefcase', 'Work'], other: ['pin', 'Other'] };
  const CITY = { dubai: ['Dubai', true], sharjah: ['Sharjah', true], abudhabi: ['Abu Dhabi', false], alain: ['Al Ain', false], rak: ['Ras Al Khaimah', false] };
  const cityName = k => (CITY[k] || CITY.dubai)[0];
  const cityLive = k => { const a = F.A_CITIES && F.A_CITIES.find(c => c.k === k); return a ? !!a.live : !!(CITY[k] || [])[1]; };
  const PLACES = [
    { k: 'barsha', area: 'Al Barsha 1', city: 'dubai', x: 0, y: 0 },
    { k: 'marina', area: 'Dubai Marina', city: 'dubai', x: -150, y: 64 },
    { k: 'jlt', area: 'Jumeirah Lake Towers', city: 'dubai', x: -112, y: 120 },
    { k: 'bay', area: 'Business Bay', city: 'dubai', x: 128, y: -60 },
    { k: 'downtown', area: 'Downtown Dubai', city: 'dubai', x: 150, y: -12 },
    { k: 'jumeirah', area: 'Jumeirah 1', city: 'dubai', x: 70, y: -120 },
    { k: 'nahda', area: 'Al Nahda 2', city: 'sharjah', x: -60, y: -150 },
    { k: 'majaz', area: 'Al Majaz 3', city: 'sharjah', x: 40, y: -168 },
    { k: 'khalifa', area: 'Khalifa City', city: 'abudhabi', x: -170, y: 150 },
    { k: 'jimi', area: 'Al Jimi', city: 'alain', x: 170, y: 140 },
    { k: 'hamra', area: 'Al Hamra Village', city: 'rak', x: 20, y: 170 },
  ];
  const CITY_PLACE = { dubai: 'barsha', sharjah: 'nahda', abudhabi: 'khalifa', alain: 'jimi', rak: 'hamra' };
  const placeOf = k => PLACES.find(p => p.k === k) || PLACES[0];
  const ADDR_X = {
    a1: { type: 'home', bld: 'Villa 24', pos: 'barsha', landmark: 'Opposite Al Barsha Pond Park' },
    a2: { type: 'other', bld: 'Flat 1203', pos: 'nahda', landmark: 'Behind Sahara Centre' },
    a3: { type: 'work', bld: 'Office 1106, Bay Square 6', pos: 'bay', landmark: 'By the metro link bridge' },
  };
  PD.addresses.forEach(a => {
    if (a.type) return;
    const x = ADDR_X[a.id] || { type: 'other', bld: a.line.split(',')[0], pos: /sharjah/i.test(a.line) ? 'nahda' : 'barsha', landmark: '' };
    Object.assign(a, x, { icon: TYPES[x.type][0], city: placeOf(x.pos).city });
  });
  const bookAddr = a => (B.addresses || []).find(x => x.label === a.label || x.line === a.line);

  const INVOICES = [
    { no: 'INV-2026-00418', date: '12 Oct 2026', booking: 'FRH-24817', svc: 'Doctor on Call', who: 'Sara and Fatima Ahmed', amount: 420, status: 'paid', pay: 'Visa •••• 4242' },
    { no: 'INV-2026-00409', date: '28 Sep 2026', booking: 'FRH-24790', svc: 'Physiotherapy · session 2 of 6', who: 'Fatima Ahmed', amount: 300, status: 'paid', pay: 'Apple Pay' },
    { no: 'INV-2026-00377', date: '2 Sep 2026', booking: 'FRH-24512', svc: 'IV Therapy at Home', who: 'Sara Ahmed', amount: 450, status: 'paid', pay: 'Visa •••• 4242' },
    { no: 'INV-2026-00361', date: '28 Aug 2026', booking: 'FRH-24201', svc: 'Dentist at Home', who: 'Yusuf Ahmed', amount: 400, status: 'refunded', pay: 'Mastercard •••• 5100' },
    { no: 'INV-2026-00342', date: '16 Aug 2026', booking: 'FRH-24388', svc: 'Lab Tests · Vitamin D and FBC', who: 'Sara Ahmed', amount: 240, status: 'paid', pay: 'Visa •••• 4242' },
  ];
  const PAYST = { paid: ['green', 'Paid'], refunded: ['ink', 'Refunded'], pending: ['amber', 'Pending'] };

  const CPN = [
    { code: 'WELCOME20', title: 'Welcome offer', desc: '20% off your first home visit, up to AED 150.', badge: ['20%', 'OFF'], valid: 'Until 31 Oct 2026', pct: 20, max: 150 },
    { code: 'IVWEEK15', title: 'Weekday IV therapy', desc: '15% off any IV drip booked Monday to Thursday.', badge: ['15%', 'OFF'], valid: 'Until 15 Nov 2026', pct: 15, max: 200 },
    { code: 'FRH500', title: 'Annual health package', desc: 'AED 500 off health packages from AED 1,499.', badge: ['500', 'AED'], valid: 'Until 31 Dec 2026', flat: 500, min: 1499 },
  ];

  S.pxCards = S.pxCards || [
    { id: 'c1', brand: 'visa', last4: '4242', exp: '09/29', def: true },
    { id: 'c2', brand: 'mc', last4: '5100', exp: '03/28' },
  ];
  const BRAND = { visa: 'Visa', mc: 'Mastercard', amex: 'American Express' };

  /* notification categories match the notification types (H20); Care team + Changes are locked on (P33) */
  const NCATS = [
    { id: 'team', icon: 'stetho', tint: 'blue', label: 'Care team', sub: 'Team assigned, on the way and arrived, and messages from your team', locked: true },
    { id: 'chg', icon: 'refresh', tint: 'p-amber', label: 'Changes to a visit', sub: 'A new time or address, cancellations and refunds', locked: true },
    { id: 'book', icon: 'calendar', tint: '', label: 'Bookings', sub: 'Confirmations, visit reminders and receipts' },
    { id: 'rec', icon: 'file', tint: 'violet', label: 'Records', sub: 'Reports, prescriptions and invoices when they’re ready' },
    { id: 'off', icon: 'sparkle', tint: 'p-teal', label: 'Offers', sub: 'Coupons and membership news, twice a month at most' },
  ];
  const notif = () => (S.pxN && 'book' in S.pxN ? S.pxN : (S.pxN = { book: S.remind !== false, rec: true, off: !!S.promo }));

  const CODE = '482913';
  const NEW_PHONE_HINT = '557654321';

  /* ================= map (address form) ================= */
  const MAP_SVG = (() => {
    const W = 760, H = 620;
    let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect width="${W}" height="${H}" fill="#EDE8DF"/><g fill="#E3DDD0">`;
    for (let y = 18; y < H; y += 74) for (let x = 18; x < W; x += 92) s += `<rect x="${x}" y="${y}" width="${Math.round(62 + rnd() * 16)}" height="${Math.round(46 + rnd() * 12)}" rx="6"/>`;
    s += '</g><g fill="#D5E7C6"><rect x="386" y="240" width="66" height="56" rx="8"/><rect x="570" y="92" width="72" height="50" rx="8"/><rect x="202" y="462" width="74" height="52" rx="8"/></g><g stroke="#fff" stroke-linecap="round" fill="none">';
    for (let x = 103; x < W; x += 92) s += `<path d="M${x} -10V${H + 10}" stroke-width="${x === 379 ? 13 : 6}"/>`;
    for (let y = 85; y < H; y += 74) s += `<path d="M-10 ${y}H${W + 10}" stroke-width="${y === 307 ? 14 : 6}"/>`;
    s += `</g><path d="M-10 307H${W + 10}" stroke="#F6D88B" stroke-width="2" stroke-dasharray="7 7"/><path d="M379 -10V${H + 10}" stroke="#F6D88B" stroke-width="2" stroke-dasharray="7 7"/>`;
    s += '<path d="M0 0h268c-34 56-104 86-150 150S34 262 0 296z" fill="#CFE3EE"/></svg>';
    return s;
  })();
  const PIN = '<svg width="38" height="48" viewBox="0 0 38 48" aria-hidden="true"><path d="M19 47s16-14.8 16-28.2A16 16 0 0 0 3 18.8C3 32.2 19 47 19 47z" fill="#D71F32"/><circle cx="19" cy="18.5" r="6.5" fill="#fff"/></svg>';

  /* =====================================================================
     PROFILE HOME (P1–P6, P39): header card, 4 quick links, grouped menu
     ===================================================================== */
  const quick = () => {
    const tier = F.memberTier ? F.memberTier() : null;
    return [
      { to: 'membership', ic: 'crown', label: 'Membership', meta: tier ? `${tier.name} plan` : 'See plans', cls: 'px-q-m' },
      { to: 'patients', ic: 'users', label: 'Patients', meta: `${PD.patients.length} saved` },
      { to: 'addresses', ic: 'pin', label: 'Addresses', meta: `${PD.addresses.length} saved` },
      { to: 'rewards', ic: 'gift', label: 'Rewards', meta: `${(S.v42pts ?? 1240).toLocaleString('en-US')} points` },   /* v42: Coupons moved to the list below */
    ];
  };
  const MENU = [
    { h: 'Records and payments', rows: [
      { to: 'reports-hub', ic: 'file', label: 'Medical reports' },
      { to: 'invoices', ic: 'receipt', label: 'Invoices' },
      { to: 'pay-methods', ic: 'card', label: 'Payment methods' },
      { to: 'coupons', ic: 'tag', label: 'Coupons', val: () => `${F.v42 ? F.v42.available() : CPN.length}` },
    ] },
    { h: 'Preferences', rows: [
      { to: 'notif-settings', ic: 'bell', label: 'Notification settings' },
      { to: 'language', ic: 'globe', label: 'Language', val: () => 'English' },
    ] },
    { h: 'Help', rows: [
      { to: 'support', ic: 'headset', label: 'Help &amp; support' },
      { act: 'v18-tour', ic: 'sparkle', label: 'App tour' },
      { to: 'policies', ic: 'shieldCheck', label: 'Policies' },
      { to: 'about', ic: 'info', label: 'About FRH' },
    ] },
    { h: 'Account', rows: [
      { to: 'account', ic: 'gear', label: 'Account settings' },
      { act: 'p-logout', ic: 'logout', label: 'Sign out', danger: true },
    ] },
  ];
  const menuRow = m => `<button class="info-row p-row px-row${m.danger ? ' px-danger' : ''}" type="button" ${m.act ? `data-act="${m.act}"` : goAttr(m.to)}>
      <span class="tile">${icon(m.ic, 17, 2)}</span><span class="ir-mid"><b>${m.label}</b></span>${m.val ? `<span class="px-val">${m.val()}</span>` : ''}${m.danger ? '' : icon('chevRight', 17, 2.2)}</button>`;
  const versionLine = () => `FRH Healthcare · ${String(PD.about.version || 'Version 1.0').replace(/ · Build (.+)$/, ' ($1)')}`;

  /* Final v33: Account page options to compare (S.v33acc). a = current; b = health card (identity, plan card,
     family row; Fitbit / WHOOP / Runna); c = action tiles (name, three big tiles, family card, rows grouped by meaning,
     Sign out button; Urban Company / Grab / CVS Health). Same screens and actions as the current page. */
  const v33Row = (to, ic, label, val) => menuRow({ to, ic, label, val: val ? () => val : null });
  function v33Render(mode) {
    const me = PD.me, tier = F.memberTier ? F.memberTier() : null, pats = PD.patients, tab = F.tabbar ? F.tabbar('profile') : '';
    const first = n => esc(String(n).split(' ')[0]);
    const nav = `<div class="nav"><span class="nav-title px-tab-title">Account</span>${SP}</div>`;
    if (mode === 'b') {
      const plan = tier
        ? `<button class="v33-plan on" type="button" ${goAttr('membership')}><span class="v33-pi">${icon('crown', 20, 2)}</span><span class="v33-pt"><b>FRH ${esc(tier.name)}</b><small>Included visits and priority booking</small></span><span class="v33-pill">Manage</span></button>`
        : `<button class="v33-plan" type="button" ${goAttr('membership')}><span class="v33-pi">${icon('crown', 20, 2)}</span><span class="v33-pt"><b>Join FRH membership</b><small>Included home visits, priority booking, no night fees</small></span><span class="v33-pill">See plans</span></button>`;
      const groups = [{ h: 'Saved', rows: [{ to: 'addresses', ic: 'pin', label: 'Addresses', val: () => `${PD.addresses.length}` }, { to: 'coupons', ic: 'tag', label: 'Coupons', val: () => `${F.v42 ? F.v42.available() : CPN.length}` }, { to: 'rewards', ic: 'gift', label: 'Rewards', val: () => `${(S.v42pts ?? 1240).toLocaleString('en-US')} pts` }] }, ...MENU];
      return `${nav}<div class="scr-body v33 v33-b">
          <button class="v33-id" type="button" ${goAttr('edit-profile')} aria-label="Edit your profile">
            <span class="v33-ava">${initials(me.name)}<span class="px-ava-badge">${icon('edit', 11, 2.4)}</span></span>
            <b>${esc(me.name)}</b><small>${esc(me.phone)}</small>
            <span class="v33-since">${icon('shieldCheck', 12, 2.4)} Patient since Sep 2025${tier ? ` · ${esc(tier.name)} member` : ''}</span></button>
          ${plan}
          ${grpH('My family')}
          <div class="v33-fam">${pats.map(p => `<button class="v33-p" type="button" ${goAttr('patients')}><span class="v33-pa${p.self ? ' me' : ''}">${initials(p.name)}</span><b>${first(p.name)}</b><small>${p.self ? 'You' : esc(p.rel)}</small></button>`).join('')}
            <button class="v33-p add" type="button" ${goAttr('px-patient')}><span class="v33-pa">${icon('plus', 18, 2.2)}</span><b>Add</b><small>Family</small></button></div>
          ${groups.map(g => `${grpH(g.h)}<div class="info-card px-menu">${g.rows.map(menuRow).join('')}</div>`).join('')}
          <p class="p-ver px-ver">${versionLine()}</p>
        </div>${tab}`;
    }
    const names = pats.map(p => first(p.name)), who = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    const tiles = [['appts', 'calendar', 'My bookings'], ['reports-hub', 'file', 'Medical reports'], ['support', 'headset', 'Help and support']];
    const groups = [
      { h: 'Health', rows: [['patients', 'users', 'Patients', `${pats.length}`], ['addresses', 'pin', 'Addresses', `${PD.addresses.length}`], ['e-rx', 'file', 'Prescriptions']] },
      { h: 'Payments', rows: [['pay-methods', 'card', 'Payment methods'], ['invoices', 'receipt', 'Invoices'], ['coupons', 'tag', 'Coupons', `${F.v42 ? F.v42.available() : CPN.length} to use`], ['rewards', 'gift', 'Rewards', `${(S.v42pts ?? 1240).toLocaleString('en-US')} points`]] },
      { h: 'Plan and settings', rows: [['membership', 'crown', 'Membership', tier ? tier.name : 'Join'], ['notif-settings', 'bell', 'Notifications'], ['language', 'globe', 'Language', 'English'], ['account', 'gear', 'Account settings']] },
      { h: 'About', rows: [['policies', 'shieldCheck', 'Policies'], ['about', 'info', 'About FRH']] },
    ];
    return `${nav}<div class="scr-body v33 v33-c">
        <div class="v33-head"><div><b>${esc(me.name)}</b><small>${esc(me.phone)}</small><small>${esc(me.email)}</small></div>
          <button class="v33-edit" type="button" ${goAttr('edit-profile')} aria-label="Edit your profile">${icon('edit', 16, 2.2)}</button></div>
        <div class="v33-tiles">${tiles.map(([to, ic, l]) => `<button class="v33-tile" type="button" ${goAttr(to)}><span>${icon(ic, 20, 1.9)}</span><b>${l}</b></button>`).join('')}</div>
        <button class="v33-family" type="button" ${goAttr('patients')}><span class="v33-ft"><b>Your family on FRH</b><small>${pats.length} people · ${who}</small></span>
          <span class="v33-stack">${pats.map(p => `<i>${initials(p.name)}</i>`).join('')}</span></button>
        ${groups.map(g => `${grpH(g.h)}<div class="info-card px-menu">${g.rows.map(r => v33Row(...r)).join('')}${g.h === 'About' ? menuRow({ act: 'v18-tour', ic: 'sparkle', label: 'App tour' }) : ''}</div>`).join('')}
        <button class="btn btn-secondary v33-out" type="button" data-act="p-logout">${icon('logout', 17, 2)} Sign out</button>
        <p class="p-ver px-ver">${versionLine()}</p>
      </div>${tab}`;
  }

  screen('profile-home', {
    status: 'dark', cls: 'p-profile px-profile',
    render() {
      if (S.v33acc && S.v33acc !== 'a') return v33Render(S.v33acc);
      const me = PD.me;
      return `<div class="nav"><span class="nav-title px-tab-title">Account</span>${SP}</div>
        <div class="scr-body">
          <button class="px-me" type="button" ${goAttr('edit-profile')} aria-label="Edit your profile">
            <span class="px-ava"><span class="p-ava">${initials(me.name)}</span><span class="px-ava-badge">${icon('edit', 11, 2.4)}</span></span>
            <span class="px-me-txt"><b>${esc(me.name)}</b><small>${esc(me.phone)}</small></span>${icon('chevRight', 18, 2.2)}</button>
          <div class="px-quick">${quick().map(q => `<button class="p-qa ${q.cls || ''}" type="button" ${goAttr(q.to)}><span class="tile">${icon(q.ic, 19, 1.9)}</span><b>${q.label}</b><small>${q.meta}</small></button>`).join('')}</div>
          ${MENU.map(g => `${grpH(g.h)}<div class="info-card px-menu">${g.rows.map(menuRow).join('')}</div>`).join('')}
          <p class="p-ver px-ver">${versionLine()}</p>
        </div>
        ${F.tabbar ? F.tabbar('profile') : ''}`;
    },
  });

  /* MEDICAL REPORTS (P9 / M17): one list. The menu row opens 'reports-hub'; the member builder
     owns that screen and the legacy 'reports' id (aliased to it), so nothing is registered here. */

  /* =====================================================================
     IN-APP PDF VIEWER (P10) — F.openPdf({ title, kind, back, … })
     ===================================================================== */
  const LAB_ROWS = [
    ['Vitamin D, 25-OH', '24 ng/mL', '30 – 100', 'Low'], ['Haemoglobin', '13.4 g/dL', '12.0 – 15.5', ''],
    ['White blood cells', '6.8 ×10⁹/L', '4.0 – 11.0', ''], ['Platelets', '260 ×10⁹/L', '150 – 400', ''], ['Vitamin B12', '410 pg/mL', '200 – 900', ''],
  ];
  const RX_ROWS = [
    ['Vitamin D3 50,000 IU', '1 capsule weekly, with food', '8 weeks'],
    ['Paracetamol 500 mg', '1–2 tablets every 6 hours if needed', '5 days'],
  ];
  const pdfDoc = () => {
    const o = S.pxPdf || { kind: 'invoice', no: INVOICES[0].no };
    const kind = /inv/i.test(o.kind || '') ? 'invoice' : /lab/i.test(o.kind || '') ? 'lab' : /rx|presc/i.test(o.kind || '') ? 'rx' : 'report';
    const inv = kind === 'invoice' ? (INVOICES.find(v => v.no === o.no || (o.title && String(o.title).includes(v.no)) || v.booking === o.booking) || null) : null;
    const v = inv || {
      no: o.no || 'INV-2026-00418', date: o.date || '12 Oct 2026', booking: o.booking || 'FRH-24817', svc: o.svc || o.service || 'Home visit',
      who: o.who || PD.me.name, amount: o.amount || 420, status: o.status || 'paid', pay: o.pay || 'Visa •••• 4242',
    };
    const title = o.title || (kind === 'invoice' ? `Invoice ${v.no}` : 'Document');
    return { kind, title, o, v, size: kind === 'invoice' ? '84 KB' : kind === 'lab' ? '1.1 MB' : '240 KB' };
  };
  const pageHTML = d => {
    const head = `<div class="px-page-h">${mark('#D71F32', 30)}<div><b>FRH Healthcare</b><small>Home healthcare · DHA licence ${PD.about.licence.number} · Al Barsha 1, Dubai</small></div></div>`;
    if (d.kind === 'invoice') {
      const v = d.v, sub = v.amount / 1.05;
      return `${head}<h5>Tax invoice</h5>
        <div class="px-page-meta"><div><small>Invoice</small><b>${v.no}</b></div><div><small>Date</small><b>${v.date}</b></div><div><small>Booking</small><b>${v.booking}</b></div></div>
        <div class="px-page-to"><small>Billed to</small><b>${esc(PD.me.name)}</b><span>${esc(PD.me.phone)} · ${esc(PD.me.email)}</span></div>
        <table class="px-tbl"><tr><th>Service</th><th class="r">Amount</th></tr>
          <tr><td>${esc(v.svc)}<small>${esc(v.who)}</small></td><td class="r">${aed(sub)}</td></tr><tr><td>VAT 5%</td><td class="r">${aed(v.amount - sub)}</td></tr>
          <tr class="tot"><td>Total</td><td class="r">${aed(v.amount)}</td></tr></table>
        <div class="px-page-pay"><span class="px-stamp ${v.status}">${v.status === 'refunded' ? 'REFUNDED' : 'PAID'}</span><small>${esc(v.pay)}</small></div>
        <div class="px-page-f">TRN 100 4829 1730 0003 · Computer-generated tax invoice</div>`;
    }
    const o = d.o, who = o.who || PD.me.name, date = o.date || '3 Sep 2026', by = o.by || 'Dr. Omar Haddad';
    const meta = `<div class="px-page-meta"><div><small>Patient</small><b>${esc(who)}</b></div><div><small>Date</small><b>${esc(date)}</b></div><div><small>Clinician</small><b>${esc(by)}</b></div></div>`;
    const sign = `<div class="px-page-f">Electronically signed by ${esc(by)} · reviewed and released by FRH</div>`;
    if (d.kind === 'lab') {
      return `${head}<h5>${esc(o.name || 'Laboratory report')}</h5>${meta}
        <table class="px-tbl"><tr><th>Test</th><th>Result</th><th>Range</th><th class="r">Flag</th></tr>${LAB_ROWS.map(x => `<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td><td class="r${x[3] ? ' px-lo' : ''}">${x[3] || '—'}</td></tr>`).join('')}</table>
        <p class="px-page-p">Sample collected at home and processed by an accredited partner laboratory. Vitamin D is below range; your doctor has added a supplement to your prescription.</p>${sign}`;
    }
    if (d.kind === 'rx') {
      return `${head}<h5>Prescription</h5>${meta}
        <table class="px-tbl"><tr><th>Medicine</th><th>How to take it</th><th class="r">For</th></tr>${RX_ROWS.map(x => `<tr><td><b>${x[0]}</b></td><td>${x[1]}</td><td class="r">${x[2]}</td></tr>`).join('')}</table>
        <p class="px-page-p">Valid for 30 days at any UAE pharmacy. Prescription ID RX-2026-11842.</p>${sign}`;
    }
    return `${head}<h5>${esc(o.name || 'Visit report')}</h5>${meta}
      <div class="px-page-s"><b>Reason for visit</b><p>Fatigue and low energy for three weeks; no fever.</p></div>
      <div class="px-page-s"><b>Examination</b><p>Temperature 36.8 °C, blood pressure 118/76, heart rate 72. Chest clear, no swelling.</p></div>
      <div class="px-page-s"><b>Plan</b><p>Blood tests taken at home (Vitamin D, full blood count, B12). Rest and fluids. We will share results in the app within 24 hours.</p></div>${sign}`;
  };

  screen('px-pdf', {
    status: 'dark', cls: 'px-pdf-scr',
    render() {
      const d = pdfDoc(), dl = S.pxDl || '';
      return `${navBack(esc(d.title), 'px-pdf', (S.pxPdf && S.pxPdf.back) || (d.kind === 'invoice' ? 'invoices' : 'reports-hub'))}
        <div class="scr-body">
          <div class="px-page">${pageHTML(d)}</div>
          <p class="px-pdf-pg">PDF · ${d.size} · page 1 of 1</p>
        </div>
        <div class="scr-foot px-foot2">
          <button class="btn btn-secondary" type="button" data-act="px-share">${icon('share', 18, 2)} Share</button>
          <button class="btn btn-primary${dl === 'busy' ? ' loading' : ''}" type="button" data-act="px-dl">${dl === 'busy' ? '<span class="spin"></span>Downloading' : dl === 'done' ? `${icon('check', 18, 2.6)} Saved` : `${icon('download', 18, 2)} Download`}</button>
        </div>`;
    },
  });
  F.openPdf = (o = {}) => {
    S.pxPdf = Object.assign({}, o); S.pxDl = '';
    F.go('px-pdf');
    if (o.back && F.SCREENS[o.back]) NAV.from['px-pdf'] = o.back;
  };

  /* =====================================================================
     INVOICES (P11)
     ===================================================================== */
  screen('invoices', {
    status: 'dark', cls: 'px-invoices',
    render() {
      return `${navBack('Invoices', 'invoices', 'profile-home')}
        <div class="scr-body">
          <p class="lead px-lead">A VAT invoice for every booking, ready to send to your insurer or employer.</p>
          ${INVOICES.length ? `<div class="px-list">${INVOICES.map(v => `<button class="px-inv" type="button" data-act="px-inv" data-no="${v.no}">
              <span class="tile">${icon('receipt', 17, 2)}</span>
              <span class="px-inv-id"><b>${esc(v.svc)}</b><small>${v.date} · ${v.no}</small></span>
              <span class="px-inv-amt"><b>${aed(v.amount)}</b><span class="pill ${PAYST[v.status][0]}">${PAYST[v.status][1]}</span></span></button>`).join('')}</div>`
            : empty('receipt', 'No invoices yet', 'Your invoice appears here as soon as a booking is paid.')}
        </div>`;
    },
  });

  /* =====================================================================
     POLICIES (P12 rejected → all six stay) + policy text
     ===================================================================== */
  screen('policies', {
    status: 'dark', cls: 'p-policies',
    render() {
      return `${navBack('Policies', 'policies', 'profile-home')}
        <div class="scr-body">
          <p class="lead px-lead">The rules that apply to every FRH booking. ${PD.policyUpdated}.</p>
          <div class="info-card">${PD.policies.map(p => `
            <button class="info-row p-row" type="button" data-act="px-policy" data-id="${p.id}">
              <span class="tile">${icon(p.icon, 17, 2)}</span>
              <span class="ir-mid"><b>${esc(p.title)}</b><small>${esc(p.sub)}</small></span>${icon('chevRight', 17, 2.2)}</button>`).join('')}</div>
        </div>`;
    },
  });
  screen('policy-text', {
    status: 'dark', cls: 'p-policy-text',
    render() {
      const p = PD.policies.find(x => x.id === S.pPolicy) || PD.policies[0];
      return `${navBack('Policies', 'policy-text', 'policies', `<button class="icon-btn" type="button" data-act="px-share" data-t="${esc(p.title)}" aria-label="Share">${icon('share', 18, 1.9)}</button>`)}
        <div class="scr-body">
          <span class="tile">${icon(p.icon, 20, 2)}</span>
          <h1 class="h1 p-doc-h1">${esc(p.title)}</h1>
          <p class="p-updated">${icon('clock', 14, 2.2)} ${PD.policyUpdated}</p>
          <div class="p-doc">${p.body.map(s => `${s.h ? `<h4>${s.h}</h4>` : ''}<p>${clean(s.p)}</p>`).join('')}</div>
          <button class="btn btn-secondary px-mt" type="button" ${goAttr('support')}>${icon('headset', 18, 2)} Questions about this policy?</button>
        </div>`;
    },
  });

  /* =====================================================================
     ABOUT (P13, P14 adapted): trimmed, DHA licence card stays, contact details
     ===================================================================== */
  const CONTACT = {
    call: { title: '800 374', sub: 'FRH Healthcare · open 24 hours', acts: [{ label: 'Call 800 374', ic: 'phone', msg: 'Calling FRH on 800 374…', tic: 'phone' }] },
    mail: { title: 'care@frhhealthcare.ae', sub: 'Replies within one working day', acts: [{ label: 'New email', ic: 'mail', msg: 'Opening Mail…', tic: 'mail' }, { label: 'Copy address', ic: 'copy', msg: 'Email address copied', tic: 'copy' }] },
    web: { title: 'frhhealthcare.ae', sub: '', acts: [{ label: 'Open in Safari', ic: 'globe', msg: 'Opening frhhealthcare.ae…', tic: 'globe' }, { label: 'Copy link', ic: 'copy', msg: 'Link copied', tic: 'copy' }] },
    map: { title: 'FRH Healthcare, Al Barsha 1, Dubai', sub: '', acts: [{ label: 'Open in Maps', ic: 'pin', msg: 'Opening Maps…', tic: 'pin' }, { label: 'Copy address', ic: 'copy', msg: 'Address copied', tic: 'copy' }] },
    sos: { title: '998', sub: 'Dubai Ambulance · emergencies only', acts: [{ label: 'Call 998', ic: 'phone', msg: 'Calling 998…', tic: 'phone' }] },
  };
  const ABOUT_ROWS = [
    { k: 'call', icon: 'phone', label: 'Call 800 374', sub: 'Open 24 hours, every day', tint: '' },
    { k: 'mail', icon: 'mail', label: 'care@frhhealthcare.ae', sub: 'Replies within one working day', tint: 'blue' },
    { k: 'web', icon: 'globe', label: 'frhhealthcare.ae', sub: 'Our website', tint: 'p-ink' },
    { k: 'map', icon: 'pin', label: 'Al Barsha 1, Dubai', sub: 'Head office', tint: 'p-ink' },
  ];
  screen('about', {
    status: 'dark', cls: 'p-about',
    render() {
      const a = PD.about;
      return `${navBack('About FRH', 'about', 'profile-home')}
        <div class="scr-body">
          <div class="p-hero">${mark('#fff', 52)}<h3>FRH Healthcare</h3><p>${a.tagline}</p></div>
          <p class="p-doc-lead">${clean(a.intro)}</p>
          ${grpH('Licensed in Dubai')}
          <div class="p-lic"><div class="p-lic-top">${icon('shieldCheck', 20, 2)}<div><b>${a.licence.title}</b><small>${a.licence.number}</small></div><span class="pill green px-lic-pill">Active</span></div>
            <p>FRH Healthcare is licensed by the Dubai Health Authority as a home healthcare provider. Every clinician who visits you holds their own DHA professional licence.</p></div>
          ${grpH('Contact us')}
          <div class="info-card px-card0">${ABOUT_ROWS.map(c => `
            <button class="info-row p-row" type="button" data-act="px-contact" data-k="${c.k}"><span class="tile ${c.tint}">${icon(c.icon, 17, 2)}</span>
              <span class="ir-mid"><b>${c.label}</b><small>${c.sub}</small></span>${icon('chevRight', 17, 2.2)}</button>`).join('')}</div>
        </div>`;
    },
  });

  /* =====================================================================
     HELP & SUPPORT (P22 adapted, P23): call, chat, email, FAQs — no message form
     ===================================================================== */
  screen('support', {
    status: 'dark', cls: 'p-support',
    render() {
      const open = S.pxFaq === undefined ? -1 : S.pxFaq;
      return `${navBack('Help &amp; support', 'support', 'profile-home')}
        <div class="scr-body">
          <p class="lead px-lead">We’re here day and night. Most answers are below.</p>
          <div class="info-card">
            <button class="info-row p-row" type="button" data-act="px-chat"><span class="tile green">${icon('chat', 17, 2)}</span>
              <span class="ir-mid"><b>Chat with us</b><small>FRH Support · usually replies in a few minutes</small></span>${icon('chevRight', 17, 2.2)}</button>
            <button class="info-row p-row" type="button" data-act="px-contact" data-k="call"><span class="tile">${icon('phone', 17, 2)}</span>
              <span class="ir-mid"><b>Call 800 374</b><small>Open 24 hours, every day</small></span>${icon('chevRight', 17, 2.2)}</button>
            <button class="info-row p-row" type="button" data-act="px-contact" data-k="mail"><span class="tile blue">${icon('mail', 17, 2)}</span>
              <span class="ir-mid"><b>Email us</b><small>care@frhhealthcare.ae · replies within one working day</small></span>${icon('chevRight', 17, 2.2)}</button>
          </div>
          ${grpH('Common questions')}
          ${faqs().map((f, i) => `<div class="acc${open === i ? ' open' : ''}"><button class="acc-head" type="button" data-act="px-faq" data-i="${i}" aria-expanded="${open === i}"><b>${f.q}</b>${icon('chevDown', 18, 2.2)}</button>
            <div class="acc-body"><p>${f.a}</p></div></div>`).join('')}
          <button class="sos px-sos" type="button" data-act="px-contact" data-k="sos"><span class="si">${icon('ambulance', 20, 2)}</span><span><b>Medical emergency?</b><span>Call 998 for an ambulance, any time.</span></span></button>
        </div>`;
    },
  });

  /* =====================================================================
     LANGUAGE (P20; P21 later → calm "coming soon", no fake RTL)
     ===================================================================== */
  screen('language', {
    status: 'dark', cls: 'p-language',
    render() {
      const ar = !!S.pxAr, told = !!S.pxArTold;
      return `${navBack('Language', 'language', 'profile-home')}
        <div class="scr-body">
          <p class="lead px-lead">Choose the language for the app.</p>
          <div class="p-lang-list">
            <button class="reason p-lang on" type="button" data-act="px-lang-en"><span class="radio"></span>${flag('GB', 26)}<span class="p-lang-txt"><b>English</b><small>Current language</small></span></button>
            <button class="reason p-lang px-lang-ar${ar ? ' px-peek' : ''}" type="button" data-act="px-lang-ar"><span class="radio"></span>${flag('AE', 26)}<span class="p-lang-txt"><b lang="ar">العربية</b><small>Arabic</small></span><span class="pill ink">Coming soon</span></button>
          </div>
          ${ar ? `<div class="px-calm" data-k="ar"><span class="tile p-ink">${icon('globe', 18, 2)}</span><div><b>Arabic layout coming soon</b>
              <p>We’re building FRH in Arabic, from right to left, screen by screen. Until it’s ready the app stays in English.</p>
              <button class="mini-btn ${told ? 'ghost' : ''}" type="button" data-act="px-ar-tell">${told ? `${icon('check', 14, 2.6)} We’ll let you know` : 'Tell me when it’s ready'}</button></div></div>` : ''}
        </div>`;
    },
  });

  /* =====================================================================
     PATIENTS (P15 adapted, P16) + add / edit patient screen
     ===================================================================== */
  const patCard = p => {
    const age = ageOf(dobDigits(p.dob)), ph = phoneOf(p);
    return `<div class="p-card px-pat" role="button" tabindex="0" data-act="px-pat-edit" data-id="${p.id}">
      <div class="p-card-top"><span class="p-ava sm">${initials(p.name)}</span>
        <div class="p-card-id"><b>${esc(p.name)}${p.self ? ' <span class="pill red">You</span>' : ''}</b><small>${p.self ? 'Account holder' : esc(p.rel)} · ${esc(p.gender)}</small></div>
        <span class="icon-btn" aria-hidden="true">${icon('edit', 16, 2)}</span></div>
      <div class="px-facts">
        <span class="px-fact">${icon('calendar', 13, 2.2)}${age !== null ? `${age} yrs` : 'Age not added'}</span>
        <span class="px-fact${p.blood ? '' : ' dim'}">${icon('drop', 13, 2.2)}${p.blood ? `<b class="p-blood">${esc(p.blood)}</b>` : 'Blood group'}</span>
        ${ph ? `<span class="px-fact">${icon('phone', 13, 2.2)}${esc(ph)}</span>` : ''}
      </div></div>`;
  };
  screen('patients', {
    status: 'dark', cls: 'p-patients',
    render() {
      return `${navBack('Patients', 'patients', 'profile-home', `<button class="icon-btn" type="button" data-act="px-pat-add" aria-label="Add patient">${icon('plus', 19, 2.2)}</button>`)}
        <div class="scr-body">
          <p class="lead px-lead">Everyone you book visits for. Add family once and they’re ready at checkout.</p>
          <div class="px-list">${PD.patients.map(patCard).join('')}</div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="px-pat-add">${icon('plus', 18, 2.2)} Add patient</button></div>`;
    },
  });

  const RELS = ['Spouse', 'Son', 'Daughter', 'Mother', 'Father', 'Sibling', 'Other'];
  const BLOOD = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];
  let patDone = null;
  const newPat = ctx => ({ mode: 'add', ctx, self: false, name: '', dob: '', gender: '', rel: '', blood: '', phone: '', idType: 'eid', idNo: '', err: {} });
  const editPat = p => ({ mode: 'edit', ctx: 'profile', id: p.id, self: !!p.self, name: p.name, dob: dobDigits(p.dob), gender: p.gender, rel: p.self ? 'Self' : p.rel, blood: p.blood || '',
    phone: phoneOf(p).replace(/^\+971\s*/, '').replace(/\D/g, ''), idType: p.idType || 'eid', idNo: p.idNo || '', err: {} });
  const pat = () => S.pxPat || (S.pxPat = newPat('profile'));
  field('px-p-name', { scr: 'px-patient', get: () => pat().name, set: v => { pat().name = v.replace(/^\s+/, ''); pat().err.name = ''; }, max: 40, cap: 'words', next: 'px-p-dob' });
  field('px-p-dob', { scr: 'px-patient', digits: true, get: () => pat().dob, set: v => { pat().dob = v; pat().err.dob = ''; }, max: 8,
    fmt: d => [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join(' / ') });
  field('px-p-phone', { scr: 'px-patient', digits: true, get: () => pat().phone, set: v => { pat().phone = v; pat().err.phone = ''; }, max: 9, fmt: fmtUae });
  field('px-p-id', { scr: 'px-patient', digits: () => pat().idType === 'eid', get: () => pat().idNo,
    set: v => { const d = pat(); d.idNo = d.idType === 'eid' ? v : v.toUpperCase(); d.err.id = ''; },
    max: () => (pat().idType === 'eid' ? 15 : 12), fmt: v => (pat().idType === 'eid' ? fmtEid(v) : esc(v)), ret: 'done' });

  screen('px-patient', {
    status: 'dark', cls: 'px-form px-patient', kb: kbFor('px-patient'),
    render() {
      const d = pat(), age = ageOf(d.dob), e = d.err;
      const chip = (k, v, on) => `<button class="b-chip ${on ? 'on' : ''}" type="button" data-act="px-pat-set" data-k="${k}" data-v="${esc(v)}">${v}</button>`;
      const seg = (k, opts) => `<div class="seg2">${opts.map(([v, l]) => `<button type="button" class="${d[k] === v ? 'on' : ''}" data-act="px-pat-set" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
      const fb = d.ctx === 'cart' ? 'cart' : 'patients';
      return `${navBack(d.mode === 'edit' ? 'Edit patient' : 'Add patient', 'px-patient', fb)}
        <div class="scr-body" data-act="px-blur">
          ${d.mode === 'edit'
            ? `<div class="px-pat-head"><span class="p-ava">${initials(d.name)}</span><div><b>${esc(d.name || ' ')}</b><small>${d.self ? 'Account holder' : esc(d.rel)}${age !== null ? ` · ${age} yrs` : ''}</small></div></div>`
            : '<p class="lead px-lead">Add someone you book visits for. They’re ready to pick at checkout.</p>'}
          ${tf('px-p-name', 'Full name', { ph: 'As on their Emirates ID or passport', ic: 'user', err: e.name })}
          ${tf('px-p-dob', 'Date of birth', { ph: 'DD / MM / YYYY', ic: 'calendar', err: e.dob, right: age !== null ? `<span class="px-age">${age} yrs</span>` : '' })}
          <label class="tf-lbl">Gender</label>${seg('gender', [['Female', 'Female'], ['Male', 'Male']])}${errLine(e.gender)}
          <label class="tf-lbl">Relationship to you</label>
          ${d.self ? `<div class="px-self">${icon('user', 15, 2.2)}<span>You — the account holder</span></div>`
            : `<div class="b-chips px-chips">${RELS.map(r => chip('rel', r, d.rel === r)).join('')}</div>${errLine(e.rel)}`}
          <label class="tf-lbl">Blood group<span>Optional</span></label>
          <div class="b-chips px-chips">${BLOOD.map(b => chip('blood', b, d.blood === b)).join('')}</div>
          ${tf('px-p-phone', 'Mobile number', { opt: true, pre: `<span class="px-cc">${flag('AE', 20)}+971</span>`, ph: '50 123 4567', err: e.phone })}
          ${d.self ? '' : `<p class="px-hint">${icon('info', 13, 2.2)}<span>Leave it empty and the team calls you instead.</span></p>`}
          <label class="tf-lbl">ID for video consultations<span>Optional</span></label>
          ${seg('idType', [['eid', 'Emirates ID'], ['passport', 'Passport']])}
          <div class="px-gap8"></div>
          ${tf('px-p-id', '', { ph: d.idType === 'eid' ? '784-XXXX-XXXXXXX-X' : 'Passport number', ic: 'card', err: e.id })}
          ${d.mode === 'edit' && !d.self ? `<button class="px-link-danger" type="button" data-act="px-pat-del">${icon('trash', 15, 2)} Remove ${esc(first(d.name))} from your account</button>` : ''}
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="px-pat-save">${d.mode === 'edit' ? 'Save changes' : 'Add patient'}</button></div>`;
    },
  });
  RESET['px-patient'] = () => { S.pxPat = null; patDone = null; };
  F.openPatientForm = (o = {}) => {
    const p = o.id ? PD.patients.find(x => x.id === o.id) : null;
    blurQuiet();
    S.pxPat = p ? editPat(p) : newPat(o.ctx || 'profile');
    patDone = typeof o.done === 'function' ? o.done : null;
    F.go('px-patient');
  };
  /* the cart’s “Add patient” still calls F.openSheet('addpatient'): hand it to the full screen */
  F.SHEETS.addpatient = () => {
    const from = S.screen;
    later(0, from, () => { if (S.sheet !== 'addpatient') return; F.closeSheet(true); F.openPatientForm({ ctx: from === 'cart' ? 'cart' : 'profile' }); });
    return '<div class="sheet px-ghost" aria-hidden="true"></div>';
  };

  /* =====================================================================
     ADDRESSES (P17 adapted, P18) + add / edit address screen (P19)
     ===================================================================== */
  const addrCard = a => {
    const t = TYPES[a.type] || TYPES.other;
    return `<div class="p-card px-addr">
      <div class="p-card-top"><span class="tile">${icon(t[0], 18, 2)}</span>
        <div class="p-card-id"><b>${esc(a.label)}${a.dflt ? ' <span class="pill green">Default</span>' : ''}</b><small>${esc(a.line)}</small></div>
        <button class="icon-btn" type="button" data-act="px-addr-edit" data-id="${a.id}" aria-label="Edit ${esc(a.label)}">${icon('edit', 16, 2)}</button></div>
      ${a.landmark || a.note ? `<div class="px-addr-x">
        ${a.landmark ? `<div>${icon('pin', 13, 2.2)}<span>${esc(a.landmark)}</span></div>` : ''}
        ${a.note ? `<div>${icon('key', 13, 2.2)}<span>${esc(a.note)}</span></div>` : ''}</div>` : ''}
      <div class="px-addr-acts">${a.dflt ? '<span class="px-muted-s">Used for new bookings</span>' : `<button class="mini-btn ghost" type="button" data-act="px-addr-def" data-id="${a.id}">Set as default</button>`}
        <button class="px-rm" type="button" data-act="px-addr-del" data-id="${a.id}">${icon('trash', 15, 2)} Delete</button></div>
    </div>`;
  };
  screen('addresses', {
    status: 'dark', cls: 'p-addresses',
    render() {
      return `${navBack('Addresses', 'addresses', 'profile-home', `<button class="icon-btn" type="button" data-act="px-addr-add" aria-label="Add address">${icon('plus', 19, 2.2)}</button>`)}
        <div class="scr-body">
          <p class="lead px-lead">Where we come to you. Notes like a gate code go straight to your team.</p>
          ${PD.addresses.length ? `<div class="px-list">${PD.addresses.map(addrCard).join('')}</div>`
            : empty('pin', 'No saved addresses', 'Add one and it’s ready for your next booking.')}
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="px-addr-add">${icon('plus', 18, 2.2)} Add address</button></div>`;
    },
  });
  F.SHEETS['px-del-addr'] = () => {
    const a = PD.addresses.find(x => x.id === S.pxDelAddr) || { label: '', line: '' };
    return `<div class="sheet" role="dialog" aria-label="Delete address"><div class="grab"></div>
      <div class="sh-ic red">${icon('trash', 30, 1.9)}</div><h2>Delete ${esc(a.label)}?</h2>
      <p>${esc(a.line)}<br>Visits already booked here keep this address.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="px-addr-del-ok">Delete address</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;
  };

  let addrDone = null;
  const fbAddr = ctx => ({ onboarding: 'home', cart: 'cart', appt: 'appt-details', home: 'home' }[ctx] || 'addresses');
  const newAddr = ctx => ({ mode: 'add', ctx, type: ctx === 'onboarding' || !PD.addresses.some(a => a.type === 'home') ? 'home' : 'other',
    name: '', bld: '', lmk: '', note: '', place: 'barsha', dflt: ctx === 'onboarding' || !PD.addresses.length, err: '', q: '', searching: false, moving: false, locating: false });
  const editAddr = a => ({ mode: 'edit', ctx: 'profile', id: a.id, type: a.type || 'other', name: a.type === 'other' ? a.label : '', bld: a.bld || '', lmk: a.landmark || '',
    note: a.note || '', place: a.pos || 'barsha', dflt: !!a.dflt, err: '', q: '', searching: false, moving: false, locating: false });
  const adr = () => S.pxAddr || (S.pxAddr = newAddr('profile'));
  field('px-a-name', { scr: 'px-address', get: () => adr().name, set: v => { adr().name = v.replace(/^\s+/, ''); }, max: 24, cap: 'words', next: 'px-a-bld' });
  field('px-a-bld', { scr: 'px-address', get: () => adr().bld, set: v => { adr().bld = v.replace(/^\s+/, ''); adr().err = ''; }, max: 60, cap: 'words', next: 'px-a-lmk' });
  field('px-a-lmk', { scr: 'px-address', get: () => adr().lmk, set: v => { adr().lmk = v.replace(/^\s+/, ''); }, max: 60, cap: 'sentence', next: 'px-a-note' });
  field('px-a-note', { scr: 'px-address', get: () => adr().note, set: v => { adr().note = v.replace(/^\s+/, ''); }, max: 120, cap: 'sentence', ret: 'done' });
  field('px-a-q', { scr: 'px-address', get: () => adr().q, set: v => { adr().q = v.replace(/^\s+/, ''); }, max: 40, cap: 'words', ret: 'search',
    enter: () => { const r = searchHits(adr().q); if (r[0]) pickPlace(r[0].k); } });
  const searchHits = q => { q = String(q || '').trim().toLowerCase(); return q ? PLACES.filter(p => `${p.area} ${cityName(p.city)}`.toLowerCase().includes(q)) : PLACES.slice(0, 7); };
  function pickPlace(k) {
    const d = adr();
    d.place = k; d.searching = false; d.q = ''; d.moving = true;
    blurQuiet(); F.upd();
    later(560, 'px-address', () => { if (S.pxAddr) { S.pxAddr.moving = false; F.upd(); } });
  }
  const searchLayer = d => {
    const list = searchHits(d.q), q = d.q.trim();
    return `<div class="px-layer" data-act="px-noop">
      <div class="px-layer-top">${tf('px-a-q', '', { ph: 'Area, street or building', ic: 'search' })}<button class="nav-link" type="button" data-act="px-a-search-x">Cancel</button></div>
      <div class="px-layer-body">
        ${grpH(q ? 'Results' : 'Popular areas')}
        ${list.length ? `<div class="info-card px-card0">${list.map(p => `<button class="info-row p-row" type="button" data-act="px-a-pick" data-k="${p.k}">
            <span class="tile ${cityLive(p.city) ? '' : 'p-ink'}">${icon('pin', 16, 2)}</span><span class="ir-mid"><b>${p.area}</b><small>${cityName(p.city)}</small></span>
            ${cityLive(p.city) ? icon('chevRight', 16, 2.2) : '<span class="pill ink">Coming soon</span>'}</button>`).join('')}</div>`
          : empty('search', `No matches for “${esc(q)}”`, 'Try an area name, like Al Barsha or Dubai Marina.')}
      </div></div>`;
  };

  screen('px-address', {
    status: 'dark', cls: 'px-form px-address', kb: kbFor('px-address'),
    render() {
      const d = adr(), pl = placeOf(d.place), live = cityLive(pl.city), onb = d.ctx === 'onboarding';
      const title = d.mode === 'edit' ? 'Edit address' : onb ? 'Your address' : 'Add address';
      return `${navBack(title, 'px-address', fbAddr(d.ctx))}
        <div class="scr-body" data-act="px-blur">
          <div class="px-map${d.moving ? ' moving' : ''}${d.locating ? ' locating' : ''}">
            <div class="px-map-world" style="transform:translate(${-pl.x}px,${-pl.y}px)">${MAP_SVG}</div>
            <button class="px-map-search" type="button" data-act="px-a-search">${icon('search', 17, 2)}<span>Search for an area or building</span></button>
            <span class="px-pin-tip">Your team comes to this pin</span>
            <i class="px-pin-shadow"></i><span class="px-pin">${PIN}</span>
            <button class="px-map-loc" type="button" data-act="px-a-locate">${d.locating ? '<span class="spin dark sm"></span> Finding you…' : `${icon('crosshair', 15, 2.2)} Use current location`}</button>
          </div>
          <div class="px-area"><span class="tile">${icon('pin', 17, 2)}</span><span class="px-area-t"><b>${pl.area}</b><small>${cityName(pl.city)}, UAE</small></span>
            ${live ? `<span class="pill green">${icon('check', 11, 3)} We visit here</span>` : '<span class="pill amber">Coming soon</span>'}</div>
          ${live ? '' : `<div class="alert warn px-out"><span class="a-ic">${icon('alert', 16, 2.2)}</span><div><b>We don’t visit ${cityName(pl.city)} yet</b>FRH visits homes in Dubai and Sharjah today. Abu Dhabi, Al Ain and Ras Al Khaimah are coming soon.</div></div>`}
          ${onb ? '' : `<label class="tf-lbl">Save as</label><div class="seg2 px-seg3">${Object.keys(TYPES).map(k => `<button type="button" class="${d.type === k ? 'on' : ''}" data-act="px-a-type" data-v="${k}">${icon(TYPES[k][0], 16, 2.2)}${TYPES[k][1]}</button>`).join('')}</div>`}
          ${!onb && d.type === 'other' ? tf('px-a-name', 'Name this place', { opt: true, ph: 'e.g. Mum’s place', ic: 'edit' }) : ''}
          ${tf('px-a-bld', 'Flat or villa, and building', { ph: 'e.g. Flat 804, Marina Gate 2', ic: 'building', err: d.err })}
          ${tf('px-a-lmk', 'Landmark', { opt: true, ph: 'e.g. Opposite the park', ic: 'pin' })}
          ${tf('px-a-note', 'Notes for the team', { opt: true, ph: 'Gate code, parking, which entrance', ic: 'key', multi: true })}
          ${onb ? '' : `<div class="prefs px-prefs"><button class="pref px-pref" type="button" data-act="px-a-dflt"><span class="pref-t">Use as my default address<small>Filled in for every new booking</small></span><span class="tog ${d.dflt ? 'on' : ''}"></span></button></div>`}
        </div>
        ${d.searching ? searchLayer(d) : ''}
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="px-a-save">${onb ? 'Save and continue' : 'Save address'}</button></div>`;
    },
  });
  RESET['px-address'] = () => { S.pxAddr = null; addrDone = null; };
  F.openAddressForm = (o = {}) => {
    const ctx = o.ctx || 'profile';
    const a = o.id ? PD.addresses.find(x => x.id === o.id) : null;
    blurQuiet();
    S.pxAddr = a ? editAddr(a) : newAddr(ctx);
    S.pxAddr.ctx = ctx;
    const ck = o.city && (CITY_PLACE[String(o.city).toLowerCase().replace(/\s+/g, '')] || CITY_PLACE[(Object.keys(CITY).find(k => cityName(k).toLowerCase() === String(o.city).toLowerCase()) || '')]);
    if (!a && ck) S.pxAddr.place = ck;
    addrDone = typeof o.done === 'function' ? o.done : null;
    F.go('px-address');
  };

  /* =====================================================================
     COUPONS (P24; P25 rejected → available only)
     ===================================================================== */
  const cpnCard = c => {
    const on = S.coupon && S.coupon.code === c.code;
    return `<div class="px-cpn">
      <div class="px-cpn-badge"><b>${c.badge[0]}</b><small>${c.badge[1]}</small></div>
      <div class="px-cpn-mid"><b>${c.title}</b><span>${c.desc}</span>
        <div class="px-cpn-code"><span class="code">${c.code}</span><small>${c.valid}</small></div>
        <div class="px-cpn-acts"><button class="mini-btn ghost" type="button" data-act="px-cp-copy" data-code="${c.code}">${icon('copy', 14, 2.2)} Copy</button>
          <button class="mini-btn ${on ? 'ghost px-on' : ''}" type="button" data-act="px-cp-use" data-code="${c.code}">${on ? `${icon('check', 14, 2.6)} Applied` : 'Use now'}</button></div>
      </div></div>`;
  };
  screen('coupons', {
    status: 'dark', cls: 'px-coupons',
    render() {
      return `${navBack('Coupons', 'coupons', 'profile-home')}
        <div class="scr-body">
          <p class="lead px-lead">Tap Use now, or enter the code at checkout. One coupon per booking.</p>
          ${CPN.length ? `<div class="px-list">${CPN.map(cpnCard).join('')}</div>` : empty('tag', 'No coupons right now', 'New offers appear here. Check back after your next visit.')}
        </div>`;
    },
  });

  /* =====================================================================
     PAYMENT METHODS (P29; P30 rejected → no cap; P31 adapted → Apple Pay available, no Google Pay)
     ===================================================================== */
  const cardLogo = b => (b === 'visa' ? '<span class="px-logo visa">VISA</span>' : b === 'mc' ? '<span class="px-logo mc"><i></i><i></i></span>' : '<span class="px-logo amex">AMEX</span>');
  const pmCard = c => `<div class="p-card px-pm">
      <div class="p-card-top">${cardLogo(c.brand)}
        <div class="p-card-id"><b>${BRAND[c.brand] || 'Card'} •••• ${c.last4}${c.def ? ' <span class="pill green">Default</span>' : ''}</b><small>Expires ${c.exp}</small></div></div>
      <div class="px-addr-acts">${c.def ? '<span class="px-muted-s">Used first at checkout</span>' : `<button class="mini-btn ghost" type="button" data-act="px-card-def" data-id="${c.id}">Set as default</button>`}
        <button class="px-rm" type="button" data-act="px-card-rm" data-id="${c.id}">${icon('trash', 15, 2)} Remove</button></div></div>`;
  screen('pay-methods', {
    status: 'dark', cls: 'px-pay',
    render() {
      const cards = S.pxCards;
      return `${navBack('Payment methods', 'pay-methods', 'profile-home')}
        <div class="scr-body">
          ${grpH('Cards')}
          ${cards.length ? `<div class="px-list">${cards.map(pmCard).join('')}</div>` : '<p class="px-muted-p">No saved cards yet. Add one here or save it at checkout.</p>'}
          <button class="px-add-card" type="button" data-act="px-card-add">${icon('plus', 18, 2.4)} Add a card</button>
          ${grpH('Wallet')}
          <div class="info-card px-card0"><div class="info-row"><span class="px-wallet">${icon('appleFill', 15)}Pay</span>
            <span class="ir-mid"><b>Apple Pay</b><small>Available on this iPhone · choose it at checkout</small></span><span class="pill green">Available</span></div></div>
          ${grpH('At your door')}
          <div class="info-card px-card0"><div class="info-row"><span class="tile green">${icon('card', 16, 2)}</span>
            <span class="ir-mid"><b>Cash on visit</b><small>Pay the team when they arrive · choose it at checkout</small></span></div></div>
          <div class="b-trust px-trust"><span>${icon('lock', 15, 2.2)} Secured by Stripe</span><span>${icon('shieldCheck', 15, 2.2)} FRH never stores card numbers</span></div>
        </div>`;
    },
  });
  F.SHEETS['px-rm-card'] = () => {
    const c = S.pxCards.find(x => x.id === S.pxRmCard) || { brand: 'visa', last4: '', exp: '' };
    return `<div class="sheet" role="dialog" aria-label="Remove card"><div class="grab"></div>
      <div class="sh-ic red">${icon('card', 30, 1.9)}</div><h2>Remove this card?</h2>
      <p>${BRAND[c.brand] || 'Card'} •••• ${c.last4}, expires ${c.exp}. You can add it again any time.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="px-card-rm-ok">Remove card</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;
  };

  /* add card — a screen, because it has typing */
  const card = () => S.pxCard || (S.pxCard = { num: '', exp: '', cvv: '', def: !S.pxCards.length, err: '' });
  const brandOf = n => (/^4/.test(n) ? 'visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'mc' : /^3[47]/.test(n) ? 'amex' : '');
  const cardLen = () => (brandOf(card().num) === 'amex' ? 15 : 16);
  const fmtCard = n => (brandOf(n) === 'amex' ? [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)] : [0, 4, 8, 12].map(i => n.slice(i, i + 4))).filter(Boolean).join(' ');
  const expOk = e => e.length === 4 && +e.slice(0, 2) >= 1 && +e.slice(0, 2) <= 12 && (+e.slice(2) > 26 || (+e.slice(2) === 26 && +e.slice(0, 2) >= 10));
  field('px-c-num', { scr: 'px-card', digits: true, get: () => card().num, set: v => { card().num = v; card().err = ''; if (v.length === cardLen()) later(0, 'px-card', () => focusField('px-c-exp')); }, max: cardLen, fmt: fmtCard });
  field('px-c-exp', { scr: 'px-card', digits: true, get: () => card().exp, set: v => { card().exp = v; card().err = ''; if (v.length === 4) later(0, 'px-card', () => focusField('px-c-cvv')); }, max: 4, fmt: e => [e.slice(0, 2), e.slice(2)].filter(Boolean).join(' / ') });
  field('px-c-cvv', { scr: 'px-card', digits: true, get: () => card().cvv, set: v => { card().cvv = v; card().err = ''; }, max: () => (brandOf(card().num) === 'amex' ? 4 : 3), fmt: v => '•'.repeat(v.length) });
  const cardValid = () => { const c = card(); return c.num.length === cardLen() && expOk(c.exp) && c.cvv.length >= 3; };
  screen('px-card', {
    status: 'dark', cls: 'px-form px-card-scr', kb: kbFor('px-card'),
    render() {
      const c = card(), b = brandOf(c.num), shown = c.num.padEnd(cardLen(), '•');
      return `${navBack('Add a card', 'px-card', 'pay-methods')}
        <div class="scr-body" data-act="px-blur">
          <div class="px-cc-prev"><div class="px-cc-top"><span class="px-cc-chip"></span>${b ? cardLogo(b) : '<span class="px-logo none"></span>'}</div>
            <div class="px-cc-num">${fmtCard(shown)}</div>
            <div class="px-cc-row"><span><small>Card holder</small>${esc(PD.me.name)}</span><span><small>Expires</small>${c.exp ? [c.exp.slice(0, 2), c.exp.slice(2)].filter(Boolean).join('/') : 'MM/YY'}</span></div></div>
          ${tf('px-c-num', 'Card number', { ph: '1234 5678 9012 3456', ic: 'card', err: c.err })}
          <div class="px-2col"><div>${tf('px-c-exp', 'Expiry', { ph: 'MM / YY', ic: 'calendar' })}</div><div>${tf('px-c-cvv', 'Security code', { ph: 'CVV', ic: 'lock' })}</div></div>
          <div class="prefs px-prefs"><button class="pref px-pref" type="button" data-act="px-card-deftog"><span class="pref-t">Make this my default card<small>Used first at checkout</small></span><span class="tog ${c.def ? 'on' : ''}"></span></button></div>
          <p class="px-hint">${icon('lock', 13, 2.2)}<span>Stripe keeps your card details. FRH sees only the brand, the last four digits and the expiry date.</span></p>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${cardValid() ? '' : 'off'}" type="button" data-act="px-card-save">Save card</button></div>`;
    },
  });
  RESET['px-card'] = () => { S.pxCard = null; };

  /* =====================================================================
     NOTIFICATION SETTINGS (P32, P33 adapted, P34)
     ===================================================================== */
  const nRow = c => {
    const N = notif(), on = c.locked || !!N[c.id];
    return `<button class="pref px-nrow${c.locked ? ' locked' : ''}" type="button" data-act="${c.locked ? 'px-n-lock' : 'px-n'}" data-id="${c.id}" aria-pressed="${on}">
        <span class="tile ${c.tint}">${icon(c.icon, 17, 2)}</span><span class="pref-t">${c.label}<small>${c.sub}</small></span>
        <span class="px-togw">${c.locked ? `<i class="px-lock">${icon('lock', 10, 2.6)}</i>` : ''}<span class="tog ${on ? 'on' : ''}"></span></span></button>`;
  };
  screen('notif-settings', {
    status: 'dark', cls: 'px-nset',
    render() {
      const off = !!S.pxOsOff;
      return `${navBack('Notification settings', 'notif-settings', 'profile-home')}
        <div class="scr-body">
          ${off ? `<div class="alert warn px-os"><span class="a-ic">${icon('bellOff', 17, 2)}</span><div><b>Notifications are off for FRH</b>Turn them on in iPhone Settings so you know when your team is on the way.
              <button class="px-os-btn" type="button" data-act="px-os-on">${icon('gear', 14, 2.2)} Open Settings</button></div></div>` : ''}
          ${grpH('Always on')}
          <div class="prefs px-ncard${off ? ' px-dim' : ''}">${NCATS.filter(c => c.locked).map(nRow).join('')}</div>
          <p class="px-why">${icon('lock', 12, 2.4)}<span>These tell you when your team is coming or your visit changes, so they stay on.</span></p>
          ${grpH('Your choice')}
          <div class="prefs px-ncard${off ? ' px-dim' : ''}">${NCATS.filter(c => !c.locked).map(nRow).join('')}</div>
        </div>`;
    },
  });
  F.pxNotifBlocked = on => { S.pxOsOff = !!on; if (S.screen === 'notif-settings') F.upd(); };

  /* =====================================================================
     ACCOUNT SETTINGS (P35, P26, P36, P37/P38 adapted; P39 rejected → no version row)
     ===================================================================== */
  screen('account', {
    status: 'dark', cls: 'px-account',
    render() {
      return `${navBack('Account settings', 'account', 'profile-home')}
        <div class="scr-body">
          ${grpH('Your details')}
          <div class="info-card px-card0">
            <button class="info-row p-row" type="button" ${goAttr('edit-profile')}><span class="tile">${icon('user', 17, 2)}</span>
              <span class="ir-mid"><b>Edit profile</b><small>${esc(PD.me.name)} · ${esc(PD.me.email || 'No email')}</small></span>${icon('chevRight', 17, 2.2)}</button>
            <button class="info-row p-row" type="button" data-act="px-phone"><span class="tile">${icon('phone', 17, 2)}</span>
              <span class="ir-mid"><b>Phone number</b><small>${esc(PD.me.phone)} · you sign in with it</small></span>${icon('chevRight', 17, 2.2)}</button>
          </div>
          ${grpH('Close account')}
          <div class="info-card px-card0">
            <button class="info-row p-row" type="button" data-act="px-delete"><span class="tile">${icon('trash', 17, 2)}</span>
              <span class="ir-mid"><b class="px-red">Delete account</b><small>Close your account and remove your details</small></span>${icon('chevRight', 17, 2.2)}</button>
          </div>
        </div>`;
    },
  });

  /* ---------- edit profile (P26): name and email; phone changes through a code ---------- */
  const me = () => S.pxMe || (S.pxMe = { name: PD.me.name, email: PD.me.email || '', err: {} });
  field('px-name', { scr: 'edit-profile', get: () => me().name, set: v => { me().name = v.replace(/^\s+/, ''); me().err.name = ''; }, max: 40, cap: 'words', next: 'px-email' });
  field('px-email', { scr: 'edit-profile', get: () => me().email, set: v => { me().email = v.replace(/\s/g, '').toLowerCase(); me().err.email = ''; }, max: 44, lower: true, ret: 'done' });
  const emailOk = e => !e || /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e);
  screen('edit-profile', {
    status: 'dark', cls: 'px-form px-edit', kb: kbFor('edit-profile'),
    render() {
      const d = me(), changed = d.name.trim() !== PD.me.name || d.email.trim() !== (PD.me.email || '');
      return `${navBack('Edit profile', 'edit-profile', 'account')}
        <div class="scr-body" data-act="px-blur">
          <div class="px-ava-edit"><span class="p-ava lg">${initials(d.name || PD.me.name)}</span></div>
          ${tf('px-name', 'Full name', { ph: 'As on your Emirates ID or passport', ic: 'user', err: d.err.name })}
          ${tf('px-email', 'Email', { opt: true, ph: 'name@example.com', ic: 'mail', err: d.err.email })}
          <p class="px-hint">${icon('mail', 13, 2.2)}<span>We send receipts and visit reports here.</span></p>
          <label class="tf-lbl">Phone number</label>
          <div class="tf px-tf px-ro">${icon('lock', 17, 2)}<div class="tf-v">${esc(PD.me.phone)}</div><button class="link px-change" type="button" data-act="px-phone">Change</button></div>
          <p class="px-hint">${icon('lock', 13, 2.2)}<span>You sign in with this number, so changing it needs a code.</span></p>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${changed ? '' : 'off'}" type="button" data-act="px-me-save">Save</button></div>`;
    },
  });
  RESET['edit-profile'] = () => { S.pxMe = null; };

  /* ---------- shared 6-digit code step (phone change and account deletion) ---------- */
  const code = () => S.pxCode || (S.pxCode = { v: '', st: 'idle', sent: Date.now() });
  const freshCode = () => { S.pxCode = { v: '', st: 'idle', sent: Date.now() }; };
  const resendHTML = () => {
    const left = 60 - Math.floor((Date.now() - code().sent) / 1000);
    return left > 0 ? `Didn’t get it? <span class="t">Resend in ${F.mmss(left * 1000)}</span>` : 'Didn’t get it? <button class="link" type="button" data-act="px-code-resend">Resend code</button>';
  };
  const codeBlock = auto => {
    const c = code(), st = c.st, act = S.focus === 'px-code';
    const box = i => `<div class="ob ${c.v[i] ? 'fill' : i === c.v.length && st === 'idle' && act ? 'act' : ''}">${c.v[i] || (i === c.v.length && st === 'idle' && act ? '<span class="caret"></span>' : '')}</div>`;
    const status = st === 'busy' ? `<span class="spin dark sm"></span> ${auto ? 'Checking the code…' : 'Deleting your account…'}`
      : st === 'ok' ? `${icon('check', 16, 2.6)} Number verified` : st === 'bad' ? `${icon('alert', 15, 2.4)} That code doesn’t match. Try again.` : 'The code expires in 5 minutes.';
    return `<div class="otp-row px-otp6 ${st === 'ok' ? 'ok' : st === 'busy' ? 'busy' : st === 'bad' ? 'err' : ''}" data-act="px-code-focus">${[0, 1, 2, 3, 4, 5].map(box).join('')}</div>
      <div class="otp-status px-ostat ${st === 'ok' ? 'ok' : st === 'bad' ? 'bad' : ''}">${status}</div>
      ${st !== 'busy' && st !== 'ok' && c.v.length < 6 ? `<button class="px-autofill" type="button" data-act="px-code-fill">${icon('sms', 18, 2)}<span><small>From Messages</small><b>${CODE.slice(0, 3)} ${CODE.slice(3)}</b></span><em>Tap to fill</em></button>` : ''}
      <p class="resend px-resend">${resendHTML()}</p>`;
  };
  F.KEYS['px-code'] = k => {
    const c = code(); if (c.st === 'busy' || c.st === 'ok') return;
    if (k === 'del') c.v = c.v.slice(0, -1);
    else if (/^\d$/.test(k)) { if (c.v.length < 6) c.v += k; }
    else if (k === 'enter' && S.screen === 'px-delete') return delConfirm();
    else return;
    if (c.st === 'bad') c.st = 'idle';
    F.upd();
    if (c.v.length === 6 && S.screen === 'px-phone') verifyPhone();
  };
  function verifyPhone() {
    const c = code(); if (c.st === 'busy') return;
    c.st = 'busy'; F.upd();
    later(900, 'px-phone', () => {
      if (c.v !== CODE) { c.st = 'bad'; F.upd(); F.shake('.px-otp6'); later(900, 'px-phone', () => { if (c.st === 'bad') { c.v = ''; F.upd(); } }); return; }
      c.st = 'ok'; F.upd();
      later(650, 'px-phone', () => {
        const num = `+971 ${fmtUae(S.pxPh.v)}`;
        PD.me.phone = num;
        const self = PD.patients.find(p => p.self); if (self) self.phone = num;
        const bp = (B.patients || [])[0]; if (bp) bp.phone = num;
        leave('px-phone', 'account');
        F.toast(`Your number is now ${num}`, 'check');
      });
    });
  }

  /* ---------- change phone number (P36): new number → code, one screen, two steps ---------- */
  const ph = () => S.pxPh || (S.pxPh = { step: 'num', v: '', err: '' });
  F.KEYS['px-ph'] = k => {
    const d = ph();
    if (k === 'del') d.v = d.v.slice(0, -1);
    else if (/^\d$/.test(k)) { if (d.v.length < 9) d.v += k; }
    else if (k === 'enter') return F.ACT['px-ph-send']();
    else return;
    d.err = ''; F.upd();
  };
  F.KB_RET['px-ph'] = 'done';
  const phErr = v => (v.length !== 9 || v[0] !== '5' ? 'UAE mobile numbers start with 5 and have 9 digits.' : `+971 ${fmtUae(v)}` === PD.me.phone ? 'That’s already your number.' : '');
  screen('px-phone', {
    status: 'dark', cls: 'px-phone', kb: 'num',
    get focus() { return ph().step === 'code' ? 'px-code' : 'px-ph'; },
    render() {
      const d = ph(), okNum = !phErr(d.v);
      if (d.step === 'code') {
        return `<div class="nav"><button class="nav-btn" type="button" data-act="px-ph-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">Change phone number</span>${SP}</div>
          <div class="scr-body"><div class="px-step" data-k="code">
            <h1 class="h1 px-h1">Enter the code</h1>
            <p class="lead">Sent by SMS to <b>+971 ${fmtUae(d.v)}</b></p>
            ${codeBlock(true)}
          </div></div>`;
      }
      const sug = !d.v && S.focus === 'px-ph';
      return `${navBack('Change phone number', 'px-phone', 'account')}
        <div class="scr-body"><div class="px-step" data-k="num">
          <h1 class="h1 px-h1">Your new number</h1>
          <p class="lead">We’ll text a code to check it’s yours. Your visits, records and saved cards stay on your account.</p>
          <div class="px-cur">${icon('phone', 15, 2.2)}<span>Current number</span><b>${esc(PD.me.phone)}</b></div>
          <div class="pf ${S.focus === 'px-ph' ? 'focus' : ''}${d.err ? ' error' : ''}" data-act="px-ph-focus"><span class="cc">${flag('AE', 24)}+971</span>
            <span class="pf-in">${d.v ? fmtUae(d.v) : ''}${S.focus === 'px-ph' ? '<span class="caret"></span>' : ''}${d.v ? '' : '<span class="pf-ph">50 123 4567</span>'}</span>
            ${d.v ? `<button class="pf-clear" type="button" data-act="px-ph-clear" aria-label="Clear">${icon('x', 14, 2.6)}</button>` : ''}</div>
          ${errLine(d.err)}
          ${sug ? `<button class="px-autofill px-sug" type="button" data-act="px-ph-sample">${icon('phone', 18, 2)}<span><small>Try a sample number</small><b>+971 ${fmtUae(NEW_PHONE_HINT)}</b></span><em>Fill</em></button>` : ''}
        </div></div>
        <div class="scr-foot"><button class="btn btn-primary ${okNum ? '' : 'off'}" type="button" data-act="px-ph-send">Send code</button></div>`;
    },
    tick(n) { if (ph().step === 'code') { const r = n.querySelector('.px-resend'); if (r) { const h = resendHTML(); if (r._h !== h) { r.innerHTML = h; r._h = h; } } } },
  });
  RESET['px-phone'] = () => { S.pxPh = null; S.pxCode = null; };

  /* ---------- delete account (P37, P38 adapted): what happens → sign-in code → closed ---------- */
  const del = () => S.pxDel || (S.pxDel = { step: 'info' });
  const upcoming = () => ((D.appointments && D.appointments.upcoming) || []).slice(0, 3);
  function delConfirm() {
    const c = code();
    if (c.st === 'busy') return;
    if (c.v.length < 6) { F.shake('.px-otp6'); return; }
    if (c.v !== CODE) { c.st = 'bad'; F.upd(); F.shake('.px-otp6'); later(900, 'px-delete', () => { if (c.st === 'bad') { c.v = ''; c.st = 'idle'; F.upd(); } }); return; }
    c.st = 'busy'; F.hideKb(); S.focus = null; F.upd();
    later(1200, 'px-delete', () => { S.pxDel = null; S.pxCode = null; F.go('px-deleted', { dir: 'fade' }); });
  }
  screen('px-delete', {
    status: 'dark', cls: 'px-delete',
    kb: () => (del().step === 'code' && code().st !== 'busy' ? 'num' : null),
    get focus() { return del().step === 'code' ? 'px-code' : null; },
    render() {
      const d = del();
      if (d.step === 'code') {
        const c = code();
        return `<div class="nav"><button class="nav-btn" type="button" data-act="px-del-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">Delete account</span>${SP}</div>
          <div class="scr-body"><div class="px-step" data-k="code">
            <h1 class="h1 px-h1">Confirm it’s you</h1>
            <p class="lead">Enter the 6-digit sign-in code we sent by SMS to <b>${esc(PD.me.phone)}</b>.</p>
            ${codeBlock(false)}
          </div></div>
          <div class="scr-foot"><button class="btn btn-primary ${c.v.length === 6 && c.st !== 'busy' ? '' : 'off'}" type="button" data-act="px-del-ok">${c.st === 'busy' ? '<span class="spin"></span>Deleting…' : 'Delete my account'}</button></div>`;
      }
      const up = upcoming(), fam = PD.patients.filter(p => !p.self).length;
      return `${navBack('Delete account', 'px-delete', 'account')}
        <div class="scr-body"><div class="px-step" data-k="info">
          <div class="sh-ic red px-del-ic">${icon('trash', 30, 1.9)}</div>
          <h1 class="h1 px-h1">Delete your account?</h1>
          <p class="lead">This closes your FRH account${fam ? `, including the ${fam} family member${fam > 1 ? 's' : ''} you book for` : ''}.</p>
          ${up.length ? `${grpH('Upcoming visits are cancelled')}
            <div class="info-card px-card0">${up.map(a => `<div class="info-row"><span class="tile">${icon('calendar', 16, 2)}</span><span class="ir-mid"><b>${esc(a.service || 'Home visit')}</b><small>${esc([a.date, a.time].filter(Boolean).join(' · '))}</small></span></div>`).join('')}</div>
            <p class="px-why">${icon('card', 12, 2.4)}<span>Refunds go back to the card you paid with, as our cancellation policy sets out.</span></p>` : ''}
          ${grpH('What happens')}
          <div class="info-card px-card0">
            <div class="info-row"><span class="tile p-ink">${icon('user', 16, 2)}</span><span class="ir-mid"><b>Your details are removed</b><small>Profile, family members, saved addresses and cards</small></span></div>
            <div class="info-row"><span class="tile green">${icon('file', 16, 2)}</span><span class="ir-mid"><b>Medical records are kept</b><small>Reports, prescriptions and invoices stay securely with FRH for as long as UAE law requires</small></span></div>
            <div class="info-row"><span class="tile p-ink">${icon('sms', 16, 2)}</span><span class="ir-mid"><b>We confirm it’s you</b><small>With a sign-in code sent to ${esc(PD.me.phone)}</small></span></div>
          </div>
        </div></div>
        <div class="scr-foot px-foot-stack"><button class="btn btn-primary" type="button" data-act="px-del-go">Continue</button>
          <button class="btn btn-ghost" type="button" data-act="px-back" data-id="px-delete" data-fb="account">Keep my account</button></div>`;
    },
    tick(n) { if (del().step === 'code') { const r = n.querySelector('.px-resend'); if (r) { const h = resendHTML(); if (r._h !== h) { r.innerHTML = h; r._h = h; } } } },
  });
  RESET['px-delete'] = () => { S.pxDel = null; S.pxCode = null; };
  screen('px-deleted', {
    status: 'dark', cls: 'px-deleted',
    render() {
      return `<div class="scr-body">
          <div class="sh-ic ink px-done-ic">${icon('check', 34, 2.4)}</div>
          <h1 class="h1 px-h1">Your account is closed</h1>
          <p class="lead">We’ve cancelled your upcoming visits and signed you out. Any refund reaches your card in 5 to 7 working days.</p>
          <div class="info-card"><div class="info-row"><span class="tile green">${icon('file', 16, 2)}</span><span class="ir-mid"><b>Your medical records are safe</b><small>FRH keeps them as UAE law requires. Call 800 374 if you need a copy.</small></span></div></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="px-deleted-done">Done</button></div>`;
    },
  });

  /* =====================================================================
     SHEETS: sign out (P6), share, iOS action sheet, remove patient
     ===================================================================== */
  F.SHEETS.logout = () => `<div class="sheet" role="dialog" aria-label="Sign out"><div class="grab"></div>
      <div class="sh-ic ink">${icon('logout', 30, 2)}</div><h2>Sign out of FRH?</h2>
      <p>You’ll need your mobile number and a code to sign back in. Your visits and records stay safe.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="p-signout">Sign out</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;

  const SHARE_APPS = [['AirDrop', 'airdrop', 'px-a-air'], ['Messages', 'chat', 'px-a-msg'], ['Mail', 'mail', 'px-a-mail'], ['WhatsApp', 'phone', 'px-a-wa'], ['Notes', 'edit', 'px-a-notes']];
  F.SHEETS['px-share'] = () => {
    const t = S.pxShare || { title: 'Document', sub: 'PDF document' };
    return `<div class="sheet px-share" role="dialog" aria-label="Share">
      <div class="px-sh-top"><span class="px-sh-doc">${icon('file', 20, 2)}</span><span class="px-sh-id"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span>
        <button class="px-sh-x" type="button" data-act="sheet-close" aria-label="Close">${icon('x', 15, 2.6)}</button></div>
      <div class="px-sh-apps">${SHARE_APPS.map(([n, ic, cls]) => `<button type="button" data-act="px-share-to" data-n="${n}"><span class="px-sh-app ${cls}">${icon(ic, 24, 2)}</span>${n}</button>`).join('')}</div>
      <div class="px-sh-list">${[['Copy', 'copy', 'Copied'], ['Save to Files', 'folder', 'Saved to Files'], ['Print', 'printer', 'Opening print options…']]
        .map(([l, ic, m]) => `<button type="button" data-act="px-share-do" data-m="${m}" data-ic="${ic === 'folder' ? 'download' : ic === 'printer' ? 'file' : 'copy'}"><span>${l}</span>${icon(ic, 20, 1.8)}</button>`).join('')}</div></div>`;
  };
  F.SHEETS['px-ios'] = () => {
    const s = S.pxIos || { title: '', acts: [] };
    return `<div class="sheet px-ios" role="dialog" aria-label="${esc(s.title || 'Actions')}">
      <div class="px-ios-g">${s.title ? `<div class="px-ios-t"><b>${esc(s.title)}</b>${s.sub ? esc(s.sub) : ''}</div>` : ''}
        ${s.acts.map((a, i) => `<button class="px-ios-b" type="button" data-act="px-ios-go" data-i="${i}">${a.ic ? icon(a.ic, 19, 2) : ''}${esc(a.label)}</button>`).join('')}</div>
      <div class="px-ios-g"><button class="px-ios-b cancel" type="button" data-act="sheet-close">Cancel</button></div></div>`;
  };
  F.SHEETS['px-del-pat'] = () => {
    const d = S.pxPat || { name: '' };
    return `<div class="sheet" role="dialog" aria-label="Remove patient"><div class="grab"></div>
      <div class="sh-ic red">${icon('users', 30, 1.9)}</div><h2>Remove ${esc(first(d.name))}?</h2>
      <p>${esc(first(d.name))} won’t be offered at checkout any more. Their past reports stay in Medical reports.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="px-pat-del-ok">Remove patient</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;
  };

  /* =====================================================================
     ACTIONS
     ===================================================================== */
  const openIos = k => { const c = CONTACT[k]; if (!c) return; S.pxIos = c; F.openSheet('px-ios'); };
  const syncDefaults = id => {
    PD.addresses.forEach(a => { a.dflt = a.id === id; });
    const a = PD.addresses.find(x => x.id === id), ba = a && bookAddr(a);
    if (ba) (B.addresses || []).forEach(x => { x.def = x === ba; });
  };
  Object.assign(F.ACT, {
    'px-go': n => { const id = n.dataset.to; if (F.SCREENS[id]) F.go(id); },
    'px-back': n => leave(n.dataset.id, n.dataset.fb || 'profile-home'),
    'px-noop': () => {},
    'px-blur': () => focusField(null),
    'px-focus': n => focusField(n.dataset.f),

    /* pdf + invoices */
    'px-inv': n => { const v = INVOICES.find(x => x.no === n.dataset.no); if (v) F.openPdf({ kind: 'invoice', no: v.no, title: `Invoice ${v.no}`, back: 'invoices' }); },
    'px-share': n => {
      const d = S.screen === 'px-pdf' ? pdfDoc() : null;
      S.pxShare = d ? { title: d.title, sub: `PDF document · ${d.size}` } : { title: n.dataset.t || 'FRH Healthcare', sub: 'PDF document' };
      F.openSheet('px-share');
    },
    'px-share-to': n => { F.closeSheet(); F.toast(`Opening ${n.dataset.n}…`, 'share'); },
    'px-share-do': n => { F.closeSheet(); F.toast(n.dataset.m, n.dataset.ic); },
    'px-dl': () => {
      if (S.pxDl === 'busy') return;
      S.pxDl = 'busy'; F.upd();
      later(700, 'px-pdf', () => {
        S.pxDl = 'done'; F.upd(); F.toast('Saved to Files › Downloads', 'download');
        later(1800, 'px-pdf', () => { S.pxDl = ''; F.upd(); });
      });
    },

    /* policies, about, support, language */
    'px-policy': n => { S.pPolicy = n.dataset.id; F.go('policy-text'); },
    'px-contact': n => openIos(n.dataset.k),
    'px-ios-go': n => { const a = S.pxIos && S.pxIos.acts[+n.dataset.i]; F.closeSheet(); if (a) F.toast(a.msg, a.tic || 'check'); },
    'px-chat': () => { if (F.openSupportChat) F.openSupportChat(); else F.go('chat-home'); },
    'px-faq': n => { const i = +n.dataset.i; S.pxFaq = S.pxFaq === i ? -1 : i; F.upd(); },
    'px-lang-en': () => { if (S.pxAr) { S.pxAr = false; F.upd(); } },
    'px-lang-ar': () => { S.pxAr = true; F.upd(); },
    'px-ar-tell': () => { if (S.pxArTold) return; S.pxArTold = true; F.upd(); F.toast('We’ll tell you when FRH is ready in Arabic', 'bell'); },

    /* patients */
    'px-pat-add': () => F.openPatientForm({ ctx: 'profile' }),
    'px-pat-edit': n => F.openPatientForm({ id: n.dataset.id }),
    'px-pat-set': n => {
      const d = pat(), k = n.dataset.k, v = n.dataset.v;
      blurQuiet();
      if (k === 'idType' && d.idType !== v) d.idNo = '';
      d[k] = k === 'blood' && d.blood === v ? '' : v;
      d.err[k] = '';
      F.upd();
    },
    'px-pat-save': () => {
      const d = pat(), e = d.err = {};
      if (d.name.trim().length < 2) e.name = 'Enter their full name.';
      if (!dobValid(d.dob)) e.dob = 'Enter a real date, like 09 / 06 / 2017.';
      if (!d.gender) e.gender = 'Choose a gender.';
      if (!d.self && !d.rel) e.rel = 'Choose how they’re related to you.';
      if (d.phone && (d.phone.length !== 9 || d.phone[0] !== '5')) e.phone = 'UAE mobile numbers start with 5 and have 9 digits.';
      if (d.idNo && d.idType === 'eid' && (d.idNo.length !== 15 || !/^784/.test(d.idNo))) e.id = 'An Emirates ID has 15 digits and starts with 784.';
      const bad = ['name', 'dob', 'gender', 'rel', 'phone', 'id'].find(k => e[k]);
      if (bad) {
        blurQuiet(); F.upd();
        const sel = { name: '[data-f="px-p-name"]', dob: '[data-f="px-p-dob"]', phone: '[data-f="px-p-phone"]', id: '[data-f="px-p-id"]', gender: '.seg2', rel: '.px-chips' }[bad];
        F.shake(sel);
        const c = F.cur(), node = c && c.querySelector(sel), body = c && c.querySelector('.scr-body');
        if (node && body) body.scrollTo({ top: Math.max(0, (node.getBoundingClientRect().top - body.getBoundingClientRect().top) / (F.scale || 1) + body.scrollTop - 120), behavior: 'smooth' });
        return;
      }
      const name = d.name.trim(), age = ageOf(d.dob), phone = d.phone ? `+971 ${fmtUae(d.phone)}` : '';
      let p;
      if (d.mode === 'edit') {
        p = PD.patients.find(x => x.id === d.id); if (!p) return;
        const bp = (B.patients || []).find(x => x.name === p.name);
        Object.assign(p, { name, dob: dobText(d.dob), age, gender: d.gender, rel: d.self ? p.rel : d.rel, blood: d.blood, idType: d.idType, idNo: d.idNo, phone: phone || (p.self ? p.phone : 'Uses your number') });
        if (bp) Object.assign(bp, { name, age, gender: d.gender, blood: d.blood || '—', rel: d.self ? bp.rel : d.rel, phone: phone || bp.phone });
        if (p.self) { PD.me.name = name; S.name = name; }
      } else {
        p = { id: 'p' + (Date.now() % 1e7), name, rel: d.rel, age, dob: dobText(d.dob), gender: d.gender, blood: d.blood, phone: phone || 'Uses your number', idType: d.idType, idNo: d.idNo, note: '' };
        PD.patients.push(p);
        if (B.patients) B.patients.push({ name, rel: d.rel, age, gender: d.gender, blood: d.blood || '—', phone: phone || '—' });
      }
      const done = patDone, mode = d.mode, fb = d.ctx === 'cart' ? 'cart' : 'patients';
      F.toast(mode === 'edit' ? `Changes to ${first(name)} saved` : `${first(name)} added`, 'check');
      if (done) { RESET['px-patient'](); blurQuiet(); done(p); if (S.screen === 'px-patient') leave('px-patient', fb); }
      else leave('px-patient', fb);
    },
    'px-pat-del': () => { blurQuiet(); F.upd(); F.openSheet('px-del-pat'); },
    'px-pat-del-ok': () => {
      const d = pat(), i = PD.patients.findIndex(x => x.id === d.id);
      if (i < 0) return F.closeSheet();
      const [p] = PD.patients.splice(i, 1);
      if (B.patients) { const j = B.patients.findIndex(x => x.name === p.name); if (j > 0) B.patients.splice(j, 1); }
      F.closeSheet(true);
      leave('px-patient', 'patients');
      F.toast(`${first(p.name)} removed`, 'check');
    },

    /* addresses */
    'px-addr-add': () => F.openAddressForm({ ctx: S.screen === 'cart' ? 'cart' : S.screen === 'home' ? 'home' : 'profile' }),
    'px-addr-edit': n => F.openAddressForm({ id: n.dataset.id, ctx: 'profile' }),
    'px-addr-def': n => { syncDefaults(n.dataset.id); F.upd(); const a = PD.addresses.find(x => x.id === n.dataset.id); if (a) F.toast(`${a.label} is now your default address`, 'check'); },
    'px-addr-del': n => { S.pxDelAddr = n.dataset.id; F.openSheet('px-del-addr'); },
    'px-addr-del-ok': () => {
      const i = PD.addresses.findIndex(x => x.id === S.pxDelAddr); if (i < 0) return F.closeSheet();
      const [a] = PD.addresses.splice(i, 1), ba = bookAddr(a);
      if (ba && B.addresses.length > 1) B.addresses.splice(B.addresses.indexOf(ba), 1);
      if (a.dflt && PD.addresses[0]) syncDefaults(PD.addresses[0].id);
      F.closeSheet(); F.upd();
      F.toast(`${a.label} deleted`, 'check');
    },
    'px-a-type': n => { const d = adr(); blurQuiet(); d.type = n.dataset.v; F.upd(); },
    'px-a-dflt': () => { const d = adr(); blurQuiet(); d.dflt = !d.dflt; F.upd(); },
    'px-a-search': () => { const d = adr(); d.searching = true; d.q = ''; focusField('px-a-q'); },
    'px-a-search-x': () => { const d = adr(); d.searching = false; d.q = ''; blurQuiet(); F.upd(); },
    'px-a-pick': n => pickPlace(n.dataset.k),
    'px-a-locate': () => {
      const d = adr(); if (d.locating) return;
      blurQuiet(); d.locating = true; F.upd();
      later(800, 'px-address', () => { if (!S.pxAddr) return; S.pxAddr.locating = false; pickPlace('barsha'); });
    },
    'px-a-save': () => {
      const d = adr();
      if (d.searching) return;
      if (!d.bld.trim()) { d.err = 'Add the flat or villa number and the building.'; focusField('px-a-bld'); F.shake('[data-f="px-a-bld"]'); return; }
      const pl = placeOf(d.place), onb = d.ctx === 'onboarding';
      const type = onb ? 'home' : d.type;
      const label = type === 'other' ? (d.name.trim() || 'Other') : TYPES[type][1];
      const line = `${d.bld.trim()}, ${pl.area}, ${cityName(pl.city)}`;
      const rec = { type, label, icon: TYPES[type][0], line, bld: d.bld.trim(), area: pl.area, city: pl.city, pos: pl.k, landmark: d.lmk.trim(), note: d.note.trim() };
      let a;
      if (d.mode === 'edit') {
        a = PD.addresses.find(x => x.id === d.id);
        if (a) { const ba = bookAddr(a); Object.assign(a, rec); if (ba) Object.assign(ba, { label, line, note: rec.note, type, landmark: rec.landmark }); }
      } else {
        a = Object.assign({ id: 'a' + (Date.now() % 1e7), dflt: false }, rec);
        PD.addresses.push(a);
        if (B.addresses) B.addresses.push({ label, line, note: rec.note, def: false, type, landmark: rec.landmark });
      }
      if (a && (d.dflt || onb)) syncDefaults(a.id);
      /* contract: done({ label, line, line1, city }) — city is the key ('dubai', 'sharjah', …) */
      const out = Object.assign({}, a, { line1: `${rec.bld}, ${pl.area}`, city: pl.city, cityKey: pl.city, emirate: cityName(pl.city), serviceable: cityLive(pl.city) });
      const done = addrDone, fb = fbAddr(d.ctx), mode = d.mode;
      F.toast(mode === 'edit' ? 'Address updated' : `${label} saved`, 'check');
      if (done) { RESET['px-address'](); blurQuiet(); done(out); if (S.screen === 'px-address') leave('px-address', fb); }
      else leave('px-address', fb);
    },

    /* coupons */
    'px-cp-copy': n => F.toast(`${n.dataset.code} copied`, 'copy'),
    'px-cp-use': n => {
      const c = CPN.find(x => x.code === n.dataset.code); if (!c) return;
      const ok = typeof F.sApplyCoupon === 'function' && F.sApplyCoupon(c.code);
      if (!ok) S.coupon = { code: c.code, pct: c.pct || 0, flat: c.flat || 0, max: c.max, min: c.min, desc: c.desc };
      if (NAV.from.coupons === 'cart') { leave('coupons', 'cart'); F.toast(`${c.code} applied to your cart`, 'check'); }
      else if (F.cartCount && F.cartCount() > 0 && F.SCREENS.cart) { F.go('cart'); F.toast(`${c.code} applied to your cart`, 'check'); }
      else { F.upd(); F.toast(`${c.code} will be applied to your next booking`, 'check'); }
    },

    /* payment methods */
    'px-card-add': () => { S.pxCard = null; F.go('px-card'); },
    'px-card-deftog': () => { blurQuiet(); card().def = !card().def; F.upd(); },
    'px-card-save': () => {
      const c = card();
      if (!cardValid()) {
        c.err = c.num.length < cardLen() ? 'Check the card number.' : !expOk(c.exp) ? 'Check the expiry date.' : 'Check the security code.';
        F.upd(); F.shake('.scr-foot .btn'); return;
      }
      const brand = brandOf(c.num), last4 = c.num.slice(-4), exp = `${c.exp.slice(0, 2)}/${c.exp.slice(2)}`;
      if (c.def || !S.pxCards.length) S.pxCards.forEach(x => { x.def = false; });
      S.pxCards.push({ id: 'c' + (Date.now() % 1e7), brand, last4, exp, def: c.def || !S.pxCards.length });
      leave('px-card', 'pay-methods');
      F.toast(`${BRAND[brand]} •••• ${last4} saved`, 'card');
    },
    'px-card-def': n => { S.pxCards.forEach(c => { c.def = c.id === n.dataset.id; }); F.upd(); F.toast('Default card updated', 'check'); },
    'px-card-rm': n => { S.pxRmCard = n.dataset.id; F.openSheet('px-rm-card'); },
    'px-card-rm-ok': () => {
      const c = S.pxCards.find(x => x.id === S.pxRmCard);
      S.pxCards = S.pxCards.filter(x => x.id !== S.pxRmCard);
      if (c && c.def && S.pxCards[0]) S.pxCards[0].def = true;
      F.closeSheet(); F.upd();
      if (c) F.toast(`${BRAND[c.brand]} •••• ${c.last4} removed`, 'check');
    },

    /* notification settings */
    'px-n': n => { const N = notif(), k = n.dataset.id; N[k] = !N[k]; if (k === 'book') S.remind = N[k]; if (k === 'off') S.promo = N[k]; F.upd(); },
    'px-n-lock': n => { F.shake(`[data-id="${n.dataset.id}"] .px-togw`); F.toast(n.dataset.id === 'team' ? 'Care team alerts stay on so you always know when your team is coming' : 'Changes to a visit stay on so a new time never surprises you', 'lock'); },
    'px-os-on': () => { F.toast('Opening iPhone Settings…', 'gear'); later(1400, 'notif-settings', () => { S.pxOsOff = false; F.upd(); F.toast('Notifications are on for FRH', 'bell'); }); },

    /* account, edit profile */
    'px-me-save': () => {
      const d = me(), name = d.name.trim(), email = d.email.trim();
      if (name.length < 2) { d.err.name = 'Enter your full name.'; F.upd(); F.shake('[data-f="px-name"]'); return; }
      if (!emailOk(email)) { d.err.email = 'Check the email, like name@example.com.'; F.upd(); F.shake('[data-f="px-email"]'); return; }
      if (name === PD.me.name && email === (PD.me.email || '')) return;
      const self = PD.patients.find(p => p.self), bp = (B.patients || [])[0];
      if (self) self.name = name;
      if (bp && bp.name === PD.me.name) bp.name = name;
      PD.me.name = name; PD.me.email = email; S.name = name; if (email) S.email = email;
      leave('edit-profile', 'account');
      F.toast('Profile updated', 'check');
    },
    'px-phone': () => { S.pxPh = null; S.pxCode = null; F.go('px-phone'); },
    'px-ph-focus': () => { if (S.focus !== 'px-ph') { F.showKb('num', 'px-ph'); F.upd(); } },
    'px-ph-clear': () => { ph().v = ''; ph().err = ''; F.upd(); },
    'px-ph-sample': () => { ph().v = NEW_PHONE_HINT; ph().err = ''; F.upd(); },
    'px-ph-send': () => {
      const d = ph(), e = phErr(d.v);
      if (e) { d.err = d.v.length ? e : 'Enter your new mobile number.'; F.upd(); F.shake('.pf'); return; }
      freshCode(); d.step = 'code'; F.showKb('num', 'px-code'); F.upd();
      later(1200, 'px-phone', () => { if (ph().step === 'code') F.toast(`Code sent to +971 ${fmtUae(d.v)}`, 'sms'); });
    },
    'px-ph-back': () => { const d = ph(); d.step = 'num'; S.pxCode = null; F.showKb('num', 'px-ph'); F.upd(); },
    'px-code-focus': () => { if (S.focus !== 'px-code' && code().st !== 'busy') { F.showKb('num', 'px-code'); F.upd(); } },
    'px-code-fill': () => {
      const c = code(); if (c.st === 'busy' || c.st === 'ok') return;
      c.v = CODE; c.st = 'idle'; F.upd();
      if (S.screen === 'px-phone') later(250, 'px-phone', verifyPhone);
    },
    'px-code-resend': () => { freshCode(); F.upd(); F.toast(`New code sent to ${S.screen === 'px-phone' ? `+971 ${fmtUae(ph().v)}` : PD.me.phone}`, 'sms'); },
    'px-delete': () => { S.pxDel = null; S.pxCode = null; F.go('px-delete'); },
    'px-del-go': () => { freshCode(); del().step = 'code'; F.showKb('num', 'px-code'); F.upd(); later(1200, 'px-delete', () => { if (del().step === 'code') F.toast(`Code sent to ${PD.me.phone}`, 'sms'); }); },
    'px-del-back': () => { del().step = 'info'; S.pxCode = null; F.hideKb(); S.focus = null; F.upd(); },
    'px-del-ok': () => delConfirm(),
    'px-deleted-done': () => { F.go('phone', { dir: 'fade' }); },
  });

  /* =====================================================================
     PRESENTER PANEL — F.pxJump(viewId) sets up and opens any profile view
     ===================================================================== */
  const PARENT = {
    patients: 'profile-home', addresses: 'profile-home', coupons: 'profile-home', invoices: 'profile-home', 'pay-methods': 'profile-home',
    'notif-settings': 'profile-home', language: 'profile-home', support: 'profile-home', policies: 'profile-home', about: 'profile-home',
    account: 'profile-home', 'edit-profile': 'account', 'px-phone': 'account', 'px-delete': 'account', 'policy-text': 'policies',
    'px-patient': 'patients', 'px-address': 'addresses', 'px-card': 'pay-methods', 'px-pdf': 'invoices',
  };
  const at = { dir: 'fade' };
  const open = (id, prep) => {
    F.closeSheet(true); blurQuiet();
    if (prep) prep();
    F.go(id, at);
    if (PARENT[id]) { NAV.from[id] = PARENT[id]; NAV.pushed[id] = false; }
  };
  const sheetAfter = (kind, scr) => later(240, scr, () => F.openSheet(kind));
  F.pxJump = id => {
    switch (id) {
      case 'profile-home': open('profile-home'); break;
      case 'patients': case 'addresses': case 'coupons': case 'invoices': case 'pay-methods': case 'about': case 'policies': case 'account': open(id); break;
      case 'support': open('support', () => { S.pxFaq = 0; }); break;
      case 'language': open('language', () => { S.pxAr = false; }); break;
      case 'lang-ar': open('language', () => { S.pxAr = true; }); break;
      case 'policy-text': open('policy-text', () => { S.pPolicy = 'consent'; }); break;
      case 'notif-settings': open('notif-settings', () => { S.pxOsOff = false; }); break;
      case 'notif-blocked': open('notif-settings', () => { S.pxOsOff = true; }); break;
      case 'edit-profile': open('edit-profile', () => { S.pxMe = null; }); break;
      case 'px-pdf': open('px-pdf', () => { S.pxPdf = { kind: 'invoice', no: INVOICES[0].no, title: `Invoice ${INVOICES[0].no}`, back: 'invoices' }; S.pxDl = ''; }); break;
      case 'px-share': F.pxJump('px-pdf'); S.pxShare = { title: pdfDoc().title, sub: `PDF document · ${pdfDoc().size}` }; sheetAfter('px-share', 'px-pdf'); break;
      case 'px-patient': open('px-patient', () => { S.pxPat = newPat('profile'); patDone = null; }); break;
      case 'px-patient-edit': open('px-patient', () => { S.pxPat = editPat(PD.patients.find(p => p.id === 'p2') || PD.patients[0]); patDone = null; }); NAV.from['px-patient'] = 'patients'; break;
      case 'px-address': open('px-address', () => { S.pxAddr = newAddr('profile'); addrDone = null; }); break;
      case 'px-address-search': open('px-address', () => { S.pxAddr = newAddr('profile'); addrDone = null; }); F.ACT['px-a-search'](); break;
      case 'px-address-onboarding': open('px-address', () => { S.pxAddr = newAddr('onboarding'); addrDone = null; }); NAV.from['px-address'] = 'home'; break;
      case 'px-del-addr': open('addresses'); S.pxDelAddr = (PD.addresses[1] || PD.addresses[0] || {}).id; sheetAfter('px-del-addr', 'addresses'); break;
      case 'px-card': open('px-card', () => { S.pxCard = null; }); break;
      case 'px-phone': open('px-phone', () => { S.pxPh = null; S.pxCode = null; }); break;
      case 'px-phone-code': open('px-phone', () => { S.pxPh = { step: 'code', v: NEW_PHONE_HINT, err: '' }; freshCode(); }); break;
      case 'px-delete': open('px-delete', () => { S.pxDel = null; S.pxCode = null; }); break;
      case 'px-delete-code': open('px-delete', () => { S.pxDel = { step: 'code' }; freshCode(); }); break;
      case 'px-deleted': F.go('px-deleted', at); break;
      case 'logout': open('profile-home'); sheetAfter('logout', 'profile-home'); break;
      default: return false;
    }
    return true;
  };
})();
