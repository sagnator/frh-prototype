/* FRH final — Service detail, Cart, Pay and Done (S1–S41). Owner: book builder.
   Screens:   service (override) · cart (override) · checkout (Pay, new) · confirm (alias of checkout)
              · book-done (Done, new)
   Sheets:    s-clear (clear cart) · s-coupons (available coupons) · s-payfail (payment failed)
   Contracts: F.cartCount() · F.addToCart(idOrItem) · F.SCREENS.cart
   Presenter: F.DEVPREP.s* (bottom of file) · F.sSlotTaken() · F.sFailNext()
   Cart model: S.cart = [{ key, id, cat, name, sub, dur, price, qty:1, night, opts }]; booking details per
   item in S.sBk[key] = { pat, addr, when, note, chips, idDoc, gone }. One item = one patient's visit. */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK, PD = window.FRHPROFILE || {};
  F.KEYS = F.KEYS || {}; F.KB_RET = F.KB_RET || {};

  /* ---------- icons the shared set does not have ---------- */
  const XI = {
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.6 6.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.4"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16c.6-1.5 1.8-2.2 3.2-2.2s2.6.7 3.2 2.2"/><path d="M14.5 10h4M14.5 13.5h3"/>',
    note: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M8.5 12.5h7M8.5 16h5"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12.5h18"/>',
  };
  const xi = (n, s = 20, w = 1.8) => (XI[n]
    ? `<svg class="ic ic-${n}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XI[n]}</svg>`
    : icon(n, s, w));
  const APPLE = '<svg class="s-apl" width="13" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-1.1 2.8-2.3.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8zM14.2 6c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.1-.5 2.8-1.3z"/></svg>';

  /* ---------- formatting ---------- */
  const img = n => `assets/img/${n}`;
  const esc = s => F.esc(s == null ? '' : s);
  const r2 = n => Math.round(n * 100) / 100;
  const aed0 = n => 'AED ' + Number(Math.round(n)).toLocaleString('en-US');
  const aed = n => 'AED ' + r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtTk = (v, f) => (f === '0' ? aed0(v) : aed(v));
  const tk = (key, v, f = '2') => `<span class="s-tk" data-tk="${key}" data-v="${r2(v)}" data-f="${f}">${fmtTk(v, f)}</span>`;
  const initials = n => String(n).replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const starRow = (n, sz = 13) => [1, 2, 3, 4, 5].map(i => `<span class="${i <= Math.round(n) ? 'on' : ''}">${icon('starFill', sz)}</span>`).join('');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  /* ---------- demo clock: the same calendar as the appointments area (Mon 28 Sep 2026, 5:12 PM) ---------- */
  const NOW0 = new Date(2026, 8, 28, 17, 12, 0).getTime(), T0 = Date.now();
  const now = () => new Date(NOW0 + (Date.now() - T0));
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayOf = k => { const d = now(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + k); return d; };
  const dayShort = k => { const d = dayOf(k); return k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
  const dayLong = k => { const d = dayOf(k), w = `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; return k === 0 ? `Today · ${w}` : k === 1 ? `Tomorrow · ${w}` : w; };
  const fmtH = h => `${h % 12 || 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
  const hm = d => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;

  /* =====================================================================
     DOM patching. Regions are keyed: data-r = replace its inside when it changes,
     data-rc = keep the element and reconcile its keyed children. Untouched regions
     keep their nodes, so scroll, focus and running transitions survive updates.
     ===================================================================== */
  const tpl = document.createElement('template');
  const keyOf = el => (el.dataset.r !== undefined ? 'r:' + el.dataset.r : el.dataset.rc !== undefined ? 'c:' + el.dataset.rc : null);
  function syncAttrs(a, b) {
    [...a.attributes].forEach(({ name }) => { if (!b.hasAttribute(name)) a.removeAttribute(name); });
    [...b.attributes].forEach(({ name, value }) => { if (a.getAttribute(name) !== value) a.setAttribute(name, value); });
  }
  function leave(c) {
    if (!c.classList.contains('s-anim')) { c.remove(); return; }
    c.style.height = c.offsetHeight + 'px';
    c.classList.add('s-out');
    void c.offsetHeight;
    c.style.height = '0px';
    setTimeout(() => c.remove(), 300);
  }
  function reconcile(lp, fp) {
    const live = new Map();
    [...lp.children].forEach(c => { if (c.classList.contains('s-out') || c.classList.contains('s-fly')) return; const k = keyOf(c); if (k) live.set(k, c); else c.remove(); });
    let prev = null;
    [...fp.children].forEach(fc => {
      const k = keyOf(fc);
      let lc = k ? live.get(k) : null;
      if (lc) {
        live.delete(k);
        if (fc.dataset.rc !== undefined) { syncAttrs(lc, fc); reconcile(lc, fc); }
        else if (lc.outerHTML !== fc.outerHTML) { syncAttrs(lc, fc); if (lc.innerHTML !== fc.innerHTML) lc.innerHTML = fc.innerHTML; }
      } else {
        lc = fc;
        if (lc.classList.contains('s-anim')) { lc.classList.add('s-in'); setTimeout(() => lc.classList.remove('s-in'), 420); }
      }
      let ref = prev ? prev.nextElementSibling : lp.firstElementChild;
      while (ref && ref.classList.contains('s-out')) ref = ref.nextElementSibling;
      if (ref !== lc) lp.insertBefore(lc, ref);
      prev = lc;
    });
    live.forEach(leave);
  }
  function patch(n) {
    const def = F.SCREENS[n.dataset.id];
    if (!def) return;
    tpl.innerHTML = def.render();
    reconcile(n, tpl.content);
    ticks(n);
  }

  /* ---------- number tick: totals count to their new value instead of jumping ---------- */
  const TICK = {};
  function ticks(n, init) {
    n.querySelectorAll('[data-tk]').forEach(el => {
      const k = el.dataset.tk, v = +el.dataset.v, f = el.dataset.f;
      const st = TICK[k] || (TICK[k] = { shown: v, to: v, iv: null });
      if (init) { clearInterval(st.iv); st.shown = st.to = v; return; }
      if (st.to === v) { if (st.shown !== v) el.textContent = fmtTk(st.shown, f); return; }
      st.to = v;
      clearInterval(st.iv);
      const from = st.shown, t0 = Date.now(), dur = 320;
      el.textContent = fmtTk(from, f);
      st.iv = setInterval(() => {
        const p = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        st.shown = p >= 1 ? v : from + (v - from) * e;
        const cur = F.cur() && F.cur().querySelector(`[data-tk="${k}"]`);
        if (cur) cur.textContent = fmtTk(st.shown, f);
        if (p >= 1) clearInterval(st.iv);
      }, 16);
    });
  }

  /* =====================================================================
     Services
     ===================================================================== */
  const allSvcs = () => Object.keys(B.subcats).flatMap(k => B.subcats[k].map(s => ({ ...s, cat: k })));
  const findSvc = id => allSvcs().find(s => s.id === id) || { ...B.subcats.doctor[0], cat: 'doctor' };
  const catOf = key => B.categories.find(c => c.key === key) || { name: 'Services', icon: 'stetho' };
  /* Member pricing follows the real membership (dev-member): F.memberTier() is null for non-members,
     F.memberCoverage(id) gives the allowance left. Covered people mirror dev-member's TIER.covers
     (the first 1 / 2 / 3 people on the account); allowance is spent in cart order. */
  const tierNow = () => (typeof F.memberTier === 'function' ? F.memberTier() : null);
  const covOf = id => { if (!tierNow() || typeof F.memberCoverage !== 'function') return null; const c = F.memberCoverage(id); return c && c.left > 0 ? c : null; };
  const TIER_PEOPLE = { silver: 1, gold: 2, platinum: 3 };
  const inclTag = (id, short) => (typeof F.memberPrice === 'function' ? F.memberPrice(id, '', { short }) : '') || `<span class="pill green">${short ? 'Included' : 'Included in your plan'}</span>`;

  const GP_DATES = ['27 Sep 2026', '12 Sep 2026', '4 Sep 2026'];
  const GP_REVIEWS = B.detail.gp.reviewsList.map((r, i) => ({ ...r, date: GP_DATES[i] || '1 Sep 2026' }));
  const GP_FAQS = [
    ['How should I prepare for the visit?', 'Have your Emirates ID and any current medicines to hand. If the patient is a child, keep their vaccination card nearby.'],
    ['Can I reschedule or cancel?', 'Yes, from the appointment in the app. Whether a fee applies depends on how close the visit is; the refund and cancellation policy has the details.'],
    ['Do you accept insurance?', 'Direct billing with insurers is being arranged. Until then, pay by card, Apple Pay or at your door, and use the invoice in the app to claim. FRH Support can help.'],
    ['Are the doctors licensed in the UAE?', 'Yes. Every clinician holds a current DHA licence, and their licence number appears on your visit report.'],
  ];
  const IV_FAQS = [
    ['How often can I have a drip?', 'Weekly at most. Your nurse will advise what suits you.'],
    ['Who shouldn’t have IV therapy?', 'It isn’t given during pregnancy or with some heart and kidney conditions. A short health questionnaire screens for this before the visit.'],
    ['Can I work during the drip?', 'Yes. Most people read, work on a laptop or rest.'],
  ];
  const IV_ADDONS = [
    { id: 'glut', ic: 'drip', name: 'Glutathione push', note: 'Antioxidant, given at the end', price: 250 },
    { id: 'vitc', ic: 'sparkle', name: 'Vitamin C boost', note: 'High dose, added to the drip', price: 150 },
  ];
  const TRUST = [
    ['shieldCheck', 'DHA-licensed clinicians', 'Every doctor, nurse and therapist is licensed by the Dubai Health Authority.'],
    ['lock', 'Private records', 'Your notes and results stay encrypted in the app.'],
    ['card', 'Secure payment', 'Card or Apple Pay through Stripe, or pay at your door.'],
    ['headset', '24/7 support', 'A real person answers, day or night.'],
  ];
  const SD = {
    gp: {
      desc: 'A GP at your door for fevers, infections and everyday illness, day or night.',
      tags: ['24/7', 'Home visit'], avail: 'Available now · ~45 min', faqs: GP_FAQS,
      dist: [81, 13, 4, 1, 1], similar: ['peds', 'night', 'tele'],
    },
    peds: { desc: 'A doctor who sees children every day, at home where they are calm.', tags: ['Children', 'Home visit'], faqs: GP_FAQS,
      over: 'A doctor experienced with babies and children visits your home for fevers, coughs, ear pain, rashes and tummy bugs. They examine your child where they feel safe, explain what is going on and leave a clear plan. Prescriptions and notes land in the app.' },
    night: { desc: 'A doctor at your door after 10 PM, when clinics are closed.', tags: ['After 10 PM', 'Home visit'], avail: 'Night team on call', faqs: GP_FAQS,
      over: 'The same GP visit, for the hours when clinics are closed. The night price already includes the after-hours charge, so nothing extra is added at checkout.' },
    nad: {
      img: 'banner-2.jpg', desc: 'Cellular-energy IV infusion, given slowly at home.',
      tags: ['IV therapy', 'Nurse-led', 'Popular'], avail: 'Next nurse free tomorrow, 9:00 AM',
      rating: 4.9, reviews: 118, dist: [86, 10, 3, 1, 0], similar: ['immune', 'hydra'],
      over: 'NAD+ is a coenzyme your cells use to make energy. A registered nurse gives it as a slow drip at home, after checking your history and vitals. Most people book it for fatigue, recovery or as part of a wellness routine. It is not a treatment for any illness.',
      dosage: {
        note: B.variants.note,
        options: B.variants.options.map(o => ({ name: o.name, dur: '~' + String(o.desc.split('·')[1] || o.desc).trim(), price: o.price })),
      },
      included: [
        'Health check by a registered nurse before starting',
        'NAD+ at your chosen dose, mixed fresh',
        'Drip set, cannula and all consumables',
        'Blood pressure and pulse checked every 30 minutes',
        'Anti-nausea support if you need it',
        'Aftercare advice and a follow-up message',
      ],
      steps: [
        ['Health questionnaire', 'A short medical form, reviewed by our doctor before the visit.'],
        ['Nurse arrives', 'A DHA-licensed nurse checks your vitals and confirms the dose.'],
        ['Slow infusion', 'NAD+ runs over 2–3 hours; the nurse adjusts the rate to keep you comfortable.'],
        ['Monitoring', 'Vitals are checked throughout and the drip can pause at any point.'],
        ['Aftercare', 'Advice on the day and a follow-up message the next morning.'],
      ],
      addons: [...IV_ADDONS, { id: 'nausea', ic: 'shieldCheck', name: 'Anti-nausea cover', note: 'Recommended above 500 mg', price: 80 }],
      faqs: [
        ['Does NAD+ hurt?', 'Some people feel chest tightness or nausea if it runs too fast. The nurse slows the drip and it passes within minutes.'],
        ['How often should I have it?', 'Most courses are weekly for four weeks, then monthly. Your nurse will advise.'],
        ['Who shouldn’t have NAD+?', 'It isn’t given during pregnancy or breastfeeding, or with some heart conditions. The questionnaire screens for this.'],
        ['Can I work during the infusion?', 'Yes. Most people read, work on a laptop or rest.'],
      ],
      reviewsList: [
        { name: 'Rania S.', date: '3 Oct 2026', stars: 5, text: 'The nurse was calm and explained everything. She slowed the drip when I felt flushed and it settled straight away.' },
        { name: 'Omar K.', date: '21 Sep 2026', stars: 5, text: 'Booked for Friday morning, nurse on time, and three hours went by while I worked.' },
        { name: 'Leena M.', date: '2 Sep 2026', stars: 4, text: 'Good experience. I’d like more evening slots.' },
      ],
    },
    immune: {
      desc: 'Vitamin C, zinc and B-complex drip to help you recover from a cold or a run-down week.',
      tags: ['IV therapy', 'Nurse-led'], avail: 'Available today · from 7:00 PM',
      rating: 4.7, reviews: 164, dist: [72, 19, 6, 2, 1], similar: ['hydra', 'nad'],
      over: 'A vitamin drip for when you are run down or getting over a cold. A nurse checks your vitals, places a small cannula and stays with you for the 45–60 minutes it runs.',
      included: ['Nurse assessment and vitals before starting', 'Vitamin C, zinc and B-complex infusion', 'All consumables and a drip stand', 'Follow-up message the next day', 'Session notes saved in the app'],
      steps: [
        ['Health questionnaire', 'A few questions so the nurse knows your history.'],
        ['Nurse arrives', 'Vitals, a short history, then the cannula.'],
        ['Drip', '45–60 minutes; most people rest or work.'],
        ['Aftercare', 'Drink plenty of water; we message you the next day.'],
      ],
      addons: [...IV_ADDONS, { id: 'zinc', ic: 'sparkle', name: 'Extra zinc', note: 'For frequent colds', price: 90 }],
      faqs: IV_FAQS,
      reviewsList: [
        { name: 'Priya N.', date: '30 Sep 2026', stars: 5, text: 'Felt human again the next morning. Easy to book for after work.' },
        { name: 'Ahmed R.', date: '18 Sep 2026', stars: 4, text: 'Great nurse. She was 20 minutes late but messaged ahead.' },
      ],
    },
    hydra: { desc: 'Electrolytes and B12 to rehydrate after travel, heat or a stomach bug.', tags: ['IV therapy', 'Nurse-led'], faqs: IV_FAQS, similar: ['immune', 'nad'], addons: IV_ADDONS,
      over: 'Fluids, electrolytes and vitamin B12 to rehydrate after travel, the heat or a stomach bug. A nurse checks you first and stays for the whole drip.' },
    ortho: { desc: 'Hands-on physiotherapy for joint, back and sports injuries, at home.', tags: ['Physiotherapy', 'Home visit'] },
    knee5: { desc: 'Five knee physiotherapy sessions at home. Book the first now and the rest when it suits you.', tags: ['Package', 'Physiotherapy'], similar: ['ortho', 'post'],
      over: 'Five 60-minute physiotherapy sessions at home for knee pain, or after a knee injury. Choose the first appointment when you book; the other four can be booked at the same time or later from Bookings.' },
    tele: { desc: 'Talk to a doctor on video, usually within 15 minutes.', tags: ['Video call', 'New'], reviews: 0, avail: 'Doctors online now', similar: ['gp', 'peds'], faqs: GP_FAQS,
      over: 'A video call with a DHA-licensed doctor, usually within 15 minutes. Good for advice, repeat prescriptions and sick notes. If the doctor thinks you need to be seen in person, they will help you book a home visit.',
      steps: [['Book', 'Choose a time or the next free doctor.'], ['Confirm who you are', 'Emirates ID or passport, so the doctor knows who they are treating.'], ['Video call', 'The doctor calls you in the app.'], ['After the call', 'Notes and any prescription land in the app.']] },
  };

  const HXD = () => F.HXDATA || {};
  const wasOf = id => (HXD().was || {})[id] || 0;
  const incLine = (id, s) => (HXD().inc || {})[id] || s.lab;
  /* Final v24: What's included as features. Three icon tiles per service, then short ticks.
     Tiles never repeat the facts row (rating, arrival, duration, results time). Copy is placeholder for FRH to confirm. */
  const V24I = {
    pill: '<rect x="2.8" y="8.6" width="18.4" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="m9.6 9.6 4.8 4.8"/>',
    tube: '<path d="M8.5 3.5h7"/><path d="M9.8 3.5v13.2a2.2 2.2 0 0 0 4.4 0V3.5"/><path d="M9.8 11h4.4"/>',
    droplet: '<path d="M12 3.5c2.6 3.1 6 6.9 6 10.4a6 6 0 0 1-12 0c0-3.5 3.4-7.3 6-10.4z"/><path d="M9.2 14.6a2.9 2.9 0 0 0 2.4 2.5"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5"/>',
    face: '<circle cx="12" cy="12.5" r="8.3"/><path d="M9 14.6c.8.9 1.8 1.4 3 1.4s2.2-.5 3-1.4"/><path d="M9.4 10.6h.01M14.6 10.6h.01"/><path d="M12 4.2c-1 .9-1 2 .1 2.9"/>',
    moon: '<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z"/>',
    bag: '<rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M9 7.5V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6v1.9"/><path d="M12 11v5.5M9.25 13.75h5.5"/>',
    tooth: '<path d="M12 5.6C10.6 4.4 8.8 3.8 7.2 4.3 4.9 5 4.3 7.5 4.9 10c.4 1.8 1.3 3.2 1.7 5.3.4 2.1.8 4.4 2.2 4.4 1.6 0 1.4-4.2 3.2-4.2s1.6 4.2 3.2 4.2c1.4 0 1.8-2.3 2.2-4.4.4-2.1 1.3-3.5 1.7-5.3.6-2.5 0-5-2.3-5.7-1.6-.5-3.4.1-4.8 1.3z"/>',
    mirror: '<circle cx="15" cy="9" r="4.6"/><path d="m11.7 12.3-7.2 7.2"/>',
    cert: '<circle cx="12" cy="9.2" r="5.3"/><path d="m8.9 13.5-1.6 7 4.7-2.5 4.7 2.5-1.6-7"/>',
    leaf: '<path d="M5 19.5c-.4-8 4.6-14 15-15 .6 10.2-5.6 15.4-13.6 14.6"/><path d="M5 19.5c2.6-4.2 5.6-7.2 9.2-9.4"/>',
    bed: '<path d="M3 18.5V7"/><path d="M3 14h18v4.5"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.9"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  };
  const ic24 = (n, sz = 20, w = 1.9) => (V24I[n]
    ? `<svg class="ic ic-${n}" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${V24I[n]}</svg>`
    : xi(n, sz, w));
  /* what comes with every visit of a kind: [icon, tile title, tile line, tick text] */
  const V24C = {
    kit: ['bag', 'All kit brought', 'Nothing to prepare', 'Everything brought to you'],
    ivkit: ['bag', 'All kit brought', 'Drip set and stand', 'Drip set, stand and consumables'],
    notes: ['note', 'Notes in the app', 'After every visit', 'Visit notes saved in the app'],
    snotes: ['note', 'Shift notes', 'In the app', 'Shift notes saved in the app'],
    cnotes: ['note', 'Notes in the app', 'After the call', 'Call notes saved in the app'],
    results: ['file', 'Results in the app', 'Shared with you', 'Results saved in the app'],
    call: ['phone', 'Free follow-up', 'Call within 48 hours', 'Free follow-up call within 48 hours'],
    private: ['lock', 'Private call', 'Secure video', 'Private, secure video call'],
    after: ['chat', 'Aftercare', 'Next-day check-in', 'Aftercare advice and a follow-up message'],
  };
  const V24M = { home: ['kit', 'notes', 'call'], lab: ['kit', 'results', 'call'], tele: ['private', 'cnotes', 'call'], iv: ['ivkit', 'notes', 'after'], shift: ['kit', 'snotes'], amb: [] };
  /* Final v25: four features per service, two per row, so longer words fit; [icon, title, line, common key it covers]; t = extra ticks */
  const V24F = {
    gp: { m: 'home', f: [['stetho', 'Full exam', 'Head-to-toe check'], ['heartPulse', 'Vitals check', 'BP, temp, oxygen'], ['pill', 'Prescription', 'Medicines delivered'], ['file', 'Sick note', 'Certificate on request']] },
    peds: { m: 'home', f: [['face', 'Child check', 'Growth and vitals'], ['stetho', 'Gentle exam', 'Calm, at home'], ['pill', 'Prescription', 'If your child needs it'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    night: { m: 'home', f: [['moon', 'Night doctor', 'After 10 PM'], ['stetho', 'Full exam', 'Head-to-toe check'], ['pill', 'Prescription', 'If you need it'], ['file', 'Sick note', 'Certificate on request']] },
    tele: { m: 'tele', f: [['video', 'Video call', 'With a GP'], ['pill', 'E-prescription', 'Sent to your phone'], ['file', 'Sick note', 'On request'], ['lock', 'Private call', 'Secure video', 'private']] },
    pcr: { m: 'lab', g: [['users', 'Family too', 'In the same visit']], f: [['tube', 'RT-PCR test', 'Nasal swab'], ['home', 'Home sample', 'At your door'], ['file', 'Lab report', 'PDF in the app', 'results'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    cbc: { m: 'lab', f: [['droplet', '23 markers', 'Full blood count'], ['heartPulse', 'Key counts', 'Cells and platelets'], ['home', 'Home sample', 'One quick blood draw'], ['file', 'Lab report', 'PDF in the app', 'results']] },
    vitd: { m: 'lab', f: [['sun', 'Vitamin D', '25-OH level'], ['droplet', 'Vitamin B12', 'From the same sample'], ['home', 'Home sample', 'One blood draw'], ['file', 'Lab report', 'PDF in the app', 'results']] },
    stdbasic: { m: 'lab', f: [['tube', '5 tests', 'HIV, hepatitis B and C'], ['shieldCheck', 'Also checks', 'Syphilis and chlamydia'], ['lock', 'Private visit', 'Discreet, at home'], ['file', 'Lab report', 'Private, in the app', 'results']] },
    stdfull: { m: 'lab', f: [['tube', '10 tests', 'Full STD screen'], ['shieldCheck', 'Key tests', 'HIV, hepatitis, HPV'], ['lock', 'Private visit', 'Discreet, at home'], ['file', 'Lab report', 'Private, in the app', 'results']] },
    expcr: { m: 'lab', g: [['users', 'Family too', 'In the same visit']], f: [['tube', 'RT-PCR test', 'Priority lab run'], ['home', 'Home sample', 'At your door'], ['file', 'Lab report', 'PDF in the app', 'results'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    nad: { m: 'iv', f: [['drip', 'NAD+ drip', '250–750 mg dose'], ['stetho', 'Nurse check', 'Before starting'], ['heartPulse', 'Monitored', 'Checked every 30 min'], ['pill', 'Anti-nausea', 'Support if you need it']] },
    immune: { m: 'iv', g: [['users', 'Family too', 'In the same visit']], f: [['drip', 'Immune drip', 'Vitamin C, zinc, B'], ['stetho', 'Nurse check', 'Vitals before starting'], ['bag', 'All kit brought', 'Drip stand and set', 'ivkit'], ['chat', 'Next-day check', 'Follow-up message', 'after']] },
    hydra: { m: 'iv', f: [['drip', '1 L drip', 'Saline and B12'], ['droplet', 'Electrolytes', 'To rehydrate fast'], ['stetho', 'Nurse check', 'Vitals before starting'], ['chat', 'Aftercare', 'Next-day check-in', 'after']] },
    basic: { m: 'lab', f: [['lab', '28 markers', 'Full health panel'], ['stetho', 'Doctor review', 'Of your results'], ['home', 'Home sample', 'One visit'], ['file', 'Lab report', 'PDF in the app', 'results']] },
    family: { m: 'lab', g: [['heartPulse', 'Vitals too', 'For each person']], f: [['users', 'Up to 4 people', 'In one visit'], ['lab', 'Full panel', 'For each person'], ['file', 'Own report', 'One for each person', 'results'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    scaling: { m: 'home', f: [['tooth', 'Scaling', 'Tartar removed'], ['sparkle', 'Polishing', 'Smoother teeth'], ['mirror', 'Dental exam', 'Teeth and gums'], ['bag', 'Portable unit', 'Brought to your home', 'kit']] },
    dcheck: { m: 'home', f: [['mirror', 'Dental exam', 'Teeth and gums'], ['file', 'Treatment plan', 'Saved in the app'], ['chat', 'Advice', 'On what comes next'], ['bag', 'Portable unit', 'Brought to your home', 'kit']] },
    nutri: { m: 'home', skip: ['kit'], g: [['heartPulse', 'Body check', 'Weight and BMI']], f: [['leaf', 'Diet review', 'What you eat now'], ['file', 'Meal plan', 'Sent to the app'], ['sparkle', 'Goals', 'Set together'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    flu: { m: 'home', f: [['syringe', 'Flu jab', 'This season’s vaccine'], ['users', 'All ages', 'From 6 months'], ['stetho', 'Quick check', 'Before the jab'], ['note', 'Vaccine record', 'Saved in the app', 'notes']] },
    travel: { m: 'home', f: [['syringe', 'Travel jabs', 'For your trip'], ['cert', 'Certificate', 'Issued on the day'], ['globe', 'Travel advice', 'For where you’re going'], ['note', 'Vaccine record', 'Saved in the app', 'notes']] },
    shift4: { m: 'shift', f: [['bed', '4-hour shift', 'Day or evening'], ['pill', 'Medicines', 'Given on time'], ['heartPulse', 'Vitals', 'Checked and logged'], ['users', 'Personal care', 'Wound care, hygiene']] },
    shift12: { m: 'shift', f: [['moon', '12-hour cover', 'Day or night'], ['pill', 'Medicines', 'Given on time'], ['heartPulse', 'Vitals', 'Checked and logged'], ['users', 'Personal care', 'Wound care, hygiene']] },
    amb: { m: 'amb', g: [['alert', 'Emergency?', 'Call 998 instead'], ['bed', 'Stretcher', 'Or a wheelchair']], f: [['ambulance', 'Private transfer', 'Home to hospital'], ['heartPulse', 'Crew on board', 'Monitored ride'], ['phone', 'Quoted on call', 'Price agreed first'], ['note', 'Trip notes', 'Saved in the app']] },
    ortho: { m: 'home', f: [['physio', 'Assessment', 'Joints and back'], ['dumbbell', 'Guided session', 'Hands-on exercises'], ['file', 'Home plan', 'Sent to the app'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    post: { m: 'home', g: [['dumbbell', 'Exercises', 'Between sessions']], f: [['calendar', '6 sessions', 'One package'], ['physio', 'Rehab plan', 'After your surgery'], ['note', 'Progress notes', 'After each session', 'notes'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
    knee5: { m: 'home', g: [['dumbbell', 'Exercises', 'Between sessions']], f: [['calendar', '5 sessions', 'Book as you go'], ['physio', 'Knee rehab plan', 'Set at session 1'], ['note', 'Progress notes', 'After each session', 'notes'], ['phone', 'Free follow-up', 'Call within 48 hours', 'call']] },
  };
  const v24Common = id => { const x = V24F[id]; return (V24M[x.m] || []).filter(k => !(x.skip || []).includes(k))
    .map(k => { const c = V24C[k].slice(); if (k === 'kit' && x.kit) { c[2] = 'Portable unit'; c[3] = x.kit; } return [k].concat(c); }); };
  const nbh = t => t.replace(/-/g, '\u2011');                     /* never break "follow-up" at the hyphen */
  const lc1 = t => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);   /* keeps BP, PDF */
  const v24Tile = ([ic, t, sub]) => `<div class="v24-t"><span class="v24-ic">${ic24(ic, 20, 1.9)}</span><b>${nbh(t)}</b><small>${sub}</small></div>`;
  const v24Ticks = list => `<div class="b-list v24-ticks">${list.map(t => `<div>${icon('check', 16, 2.6)}<span>${t}</span></div>`).join('')}</div>`;
  /* Final v26: six icon tiles, three rows of two, no bullet points. Order: the service's own four, any extras,
     then what comes with every visit, most useful first, until there are six. */
  const V26P = ['call', 'kit', 'ivkit', 'after', 'notes', 'cnotes', 'snotes', 'results', 'private'];
  /* Final v32: after the four FAQs, a "Still have questions?" section that leads to Ask anything or the full FAQ page.
     Three layouts to compare (S.v32cta): a = card with two buttons, b = rows, c = ask inline with suggested questions. */
  const V32Q = {
    doctor: ['Can I get a sick note?', 'Do you see children?', 'Is it covered by insurance?'],
    lab: ['Do I need to fast?', 'When will I get results?', 'Is it covered by insurance?'],
    iv: ['Is the drip safe for me?', 'How long does it take?', 'Is it covered by insurance?'],
    checkup: ['Do I need to fast?', 'When will I get results?', 'Can I book for my family?'],
    other: ['How do I prepare?', 'Is it covered by insurance?', 'Can I book for my family?'],
  };
  /* general questions, minus any topic this service's own FAQs already answer (insurance, licences, cancelling, preparing) */
  const V32TOPIC = [/insur/i, /licen/i, /cancel|reschedul/i, /prepar/i];
  const v32General = d => { const own = d.faqs.map(f => f[0]);
    return ((window.FRHPROFILE || {}).faqs || []).map(f => [f.q, f.a]).filter(([q]) => !V32TOPIC.some(t => t.test(q) && own.some(o => t.test(o)))); };
  const v32Count = d => d.faqs.length + v32General(d).length;
  const v32Short = d => d.name.replace(/ (home )?visit$/i, '').replace(/^General Practitioner$/, 'GP');
  function v32Cta(d) {
    const mode = S.v32cta || 'a', n = v32Count(d);
    if (mode === 'b') return `<div class="s-sec v32" data-r="cta">
        <button class="btn btn-secondary v32-allbtn" type="button" data-act="v32-faqs">See all ${n} FAQs</button>
        <p class="v32-lbl">Still need help?</p>
        <div class="info-card v32-rows">
          <button class="info-row" type="button" data-act="v32-ask"><span class="tile v32-spark">${icon('sparkle', 17, 2)}</span><span class="ir-mid"><b>Ask anything</b><small>Instant answers, day or night</small></span>${icon('chevRight', 17, 2.2)}</button>
          <button class="info-row" type="button" data-act="v32-chat"><span class="tile green">${icon('chat', 17, 2)}</span><span class="ir-mid"><b>Chat with FRH Support</b><small><i class="v32-dot"></i>Online · replies in about 2 min</small></span>${icon('chevRight', 17, 2.2)}</button>
        </div></div>`;
    if (mode === 'c') { const qs = V32Q[d.cat] || V32Q.other;
      return `<div class="s-sec v32" data-r="cta"><div class="v32-ask">
          <span class="v32-badge">${icon('sparkle', 14, 2.2)} Ask anything</span>
          <h4>Still have a question about ${esc(v32Short(d))}?</h4>
          <button class="v32-field" type="button" data-act="v32-ask"><span>Type or say your question</span><span class="v32-mic">${icon('mic', 16, 2.2)}</span></button>
          <div class="v32-sugs">${qs.map(q => `<button type="button" class="v32-sug" data-act="v32-ask" data-q="${esc(q)}">${q}</button>`).join('')}</div>
        </div>
        <button class="v32-link" type="button" data-act="v32-faqs">See all ${n} FAQs ${icon('chevRight', 15, 2.4)}</button></div>`; }
    return `<div class="s-sec v32" data-r="cta"><div class="v32-card">
        <div class="v32-faces">${['doc-1.jpg', 'doc-3.jpg', 'doc-4.jpg'].map(f => `<img src="${img(f)}" alt="">`).join('')}</div>
        <h4>Still have questions?</h4><p>Ask our assistant for an instant answer, or read every question patients ask us.</p>
        <div class="v32-btns"><button class="btn btn-primary" type="button" data-act="v32-ask">${icon('sparkle', 16, 2.2)} Ask anything</button>
          <button class="btn btn-secondary" type="button" data-act="v32-faqs">See all ${n} FAQs</button></div>
        <button class="v32-chatlink" type="button" data-act="v32-chat">Or chat with our care team</button></div></div>`;
  }
  /* the full FAQ page: this service's questions first, then the general ones, with topic filters */
  const V32T = [['all', 'All'], ['svc', 'This service'], ['visit', 'Booking and visits'], ['pay', 'Payment']];
  const v32Groups = d => { const g = v32General(d), pay = /insurance|cancel|refund|pay/i;
    return [['svc', 'About ' + d.name, d.faqs], ['visit', 'Booking and visits', g.filter(([q]) => !pay.test(q))], ['pay', 'Payment and cancellations', g.filter(([q]) => pay.test(q))]].filter(x => x[2].length); };
  function v32List(d) { const t = S.v32topic || 'all', open = S.v32open || '';
    return v32Groups(d).filter(([k]) => t === 'all' || t === k).map(([k, title, list]) => `<div class="sec-h v32-gh"><h4>${title}</h4><span>${list.length}</span></div>
      ${list.map(([q, a], i) => { const id = k + i; return `<div class="acc ${open === id ? 'open' : ''}"><button class="acc-head" type="button" data-act="v32-acc" data-id="${id}" aria-expanded="${open === id}"><b>${q}</b>${icon('chevDown', 18, 2.2)}</button><div class="acc-body">${a}</div></div>`; }).join('')}`).join(''); }
  const v32Chips = d => { const has = v32Groups(d).map(x => x[0]); return V32T.filter(([k]) => k === 'all' || has.includes(k)).map(([k, l]) => `<button type="button" class="v26-f ${(S.v32topic || 'all') === k ? 'on' : ''}" data-act="v32-topic" data-t="${k}">${l}</button>`).join(''); };
  F.SCREENS['all-faqs'] = {
    status: 'dark', cls: 'v32-faqs',
    render() {
      const d = svcDetail(S.v32svc || S.svc || 'gp');
      return `<div class="nav"><button class="nav-btn" type="button" data-act="v32-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">FAQs</span><span style="width:40px"></span></div>
        <div class="scr-body">
          <p class="v32-sub">${v32Count(d)} questions about ${esc(d.name)} and booking with FRH</p>
          <div class="v26-fs v32-topics" data-r="topics">${v32Chips(d)}</div>
          <div data-r="list">${v32List(d)}</div>
          <div class="v32-card v32-foot"><h4>Didn’t find your answer?</h4><p>Ask our assistant, or chat with the FRH care team.</p>
            <div class="v32-btns"><button class="btn btn-primary" type="button" data-act="v32-ask">${icon('sparkle', 16, 2.2)} Ask anything</button>
              <button class="btn btn-secondary" type="button" data-act="v32-chat">Chat with us</button></div></div>
        </div>`;
    },
    update(n) { const d = svcDetail(S.v32svc || S.svc || 'gp'), t = n.querySelector('[data-r="topics"]'), l = n.querySelector('[data-r="list"]');
      if (t) t.innerHTML = v32Chips(d); if (l) l.innerHTML = v32List(d); },
  };

  /* Final v27: How it works as a timeline. Each step: [icon, when, title, line]. Every kind of service gets its
     own steps (until v26, 21 services showed the doctor's steps). Copy is placeholder for FRH to confirm.
     {dur} and {res} are filled from the service's own duration and results time. */
  const V27 = {
    doctor: [['calendar', 'Now', 'Book', 'Pick a time, or the next free doctor.'], ['chat', 'In minutes', 'Confirmed', 'A WhatsApp message with your doctor’s name.'],
      ['pin', 'On the day', 'Doctor arrives', 'Track them live on the map to your door.'], ['stetho', 'At home', 'Consultation', 'Exam, diagnosis and treatment.'],
      ['file', 'After', 'Notes and prescription', 'Saved in the app, medicines delivered.']],
    tele: [['calendar', 'Now', 'Book', 'Choose a time or the next free doctor.'], ['idcard', 'Before the call', 'Confirm who you are', 'Emirates ID or passport, so the doctor knows who they are treating.'],
      ['video', 'At your time', 'Video call', 'The doctor calls you in the app.'], ['file', 'After', 'Notes and prescription', 'Saved in the app.']],
    lab: [['calendar', 'Now', 'Book', 'Pick a time for your home sample.'], ['note', 'Before', 'Get ready', 'We tell you if you need to fast.'],
      ['pin', 'On the day', 'Nurse arrives', 'Track them live on the map to your door.'], ['droplet', '5 minutes', 'Sample taken', 'A quick, gentle draw or swab.'],
      ['file', '{res}', 'Results', 'Your report in the app, explained clearly.']],
    checkup: [['calendar', 'Now', 'Book', 'Pick a morning for the home visit.'], ['note', 'The night before', 'Fast for 8–10 hours', 'Water is fine. We remind you.'],
      ['pin', 'On the day', 'Nurse arrives', 'Vitals, then a quick blood draw.'], ['lab', 'Same day', 'Lab analysis', 'Run at an approved partner lab.'],
      ['stetho', 'In a few days', 'Doctor review', 'Your results explained, in the app.']],
    iv: [['note', 'Before', 'Health questionnaire', 'A short form, reviewed by our doctor.'], ['pin', 'On the day', 'Nurse arrives', 'Vitals, a short history, then the cannula.'],
      ['drip', '{dur}', 'Your drip', 'Rest or work while it runs. The nurse stays.'], ['chat', 'Next day', 'Aftercare', 'Drink plenty of water. We message you.']],
    nad: [['note', 'Before', 'Health questionnaire', 'A short medical form, reviewed by our doctor.'], ['pin', 'On the day', 'Nurse arrives', 'Checks your vitals and confirms the dose.'],
      ['drip', '{dur}', 'Slow infusion', 'The nurse adjusts the rate to keep you comfortable.'], ['heartPulse', 'Throughout', 'Monitoring', 'Vitals checked; the drip can pause at any point.'],
      ['chat', 'Next morning', 'Aftercare', 'Advice on the day and a follow-up message.']],
    dentist: [['calendar', 'Now', 'Book', 'Pick a time that suits you.'], ['chat', 'In minutes', 'Confirmed', 'A WhatsApp message with your dentist’s name.'],
      ['pin', 'On the day', 'Dentist arrives', 'Sets up a portable dental unit.'], ['tooth', '{dur}', 'Treatment', 'Done in your chair at home.'],
      ['file', 'After', 'Your dental plan', 'Notes and next steps in the app.']],
    nutrition: [['calendar', 'Now', 'Book', 'Pick a time that suits you.'], ['note', 'Before', 'Share your habits', 'A short form about what you eat.'],
      ['pin', 'On the day', 'Dietitian arrives', 'Body check and a chat about your goals.'], ['leaf', 'Within 2 days', 'Your meal plan', 'Sent to the app.']],
    vaccine: [['calendar', 'Now', 'Book', 'Pick a time for everyone who needs it.'], ['pin', 'On the day', 'Nurse arrives', 'Track them live on the map to your door.'],
      ['stetho', '5 minutes', 'Quick check and jab', 'A short health check first.'], ['cert', 'After', 'Vaccine record', 'Saved in the app, with a certificate if you need one.']],
    nursing: [['calendar', 'Now', 'Book your shift', 'Pick the day and the start time.'], ['phone', 'Before', 'Care plan call', 'We learn the patient’s needs and medicines.'],
      ['pin', 'On the day', 'Nurse arrives', 'The same nurse where possible.'], ['bed', '{dur}', 'The shift', 'Medicines, vitals and personal care.'],
      ['note', 'At the end', 'Handover', 'Shift notes saved in the app.']],
    ambulance: [['phone', 'Now', 'Request', 'Tell us the pick-up and the destination.'], ['chat', 'In minutes', 'Quote call', 'We confirm the price and the time.'],
      ['ambulance', 'On the day', 'Crew arrives', 'With a stretcher or wheelchair as needed.'], ['heartPulse', 'On the way', 'Monitored transfer', 'The crew stays with the patient throughout.']],
    physio: [['calendar', 'Now', 'Book', 'Pick a time that suits you.'], ['chat', 'In minutes', 'Confirmed', 'A WhatsApp message with your physio’s name.'],
      ['physio', 'On the day', 'Assessment', 'How you move, and what hurts.'], ['dumbbell', '{dur}', 'Guided session', 'Hands-on treatment and exercises.'],
      ['file', 'After', 'Home plan', 'Your exercises, in the app.']],
  };
  function v27Steps(d) {
    const s = findSvc(d.id) || {}, dur = s.dur || '', res = /^Results in /.test(dur) ? dur.replace(/^Results /, '') : 'Next day';
    const set = V27[d.id === 'tele' ? 'tele' : d.id === 'nad' ? 'nad' : d.cat] || V27.doctor;
    return set.map(([ic, w, t, l]) => [ic, w.replace('{dur}', /×/.test(dur) ? '60 min each' : dur).replace('{res}', res.charAt(0).toUpperCase() + res.slice(1)), t, l]);
  }
  /* Final v28: no "when" labels (Now, In minutes…), they don't fit every service. Three layouts to compare:
     A line = icons on a dotted line (default), B num = numbered circles on a solid line, C cards = swipeable step cards. */
  const v27How = d => {
    const st = v27Steps(d), mode = S.v28how || 'line';
    if (mode === 'num') return `<ol class="v28-num">${st.map(([, , t, l], i) => `<li><span class="v28-n">${i + 1}</span><div><b>${t}</b><p>${l}</p></div></li>`).join('')}</ol>`;
    if (mode === 'cards') return `<div class="v28-cards">${st.map(([ic, , t, l], i) => `<div class="v28-card"><div class="v28-ch"><span class="v28-ci">${ic24(ic, 20, 2)}</span><em>${i + 1}/${st.length}</em></div><b>${t}</b><p>${l}</p></div>`).join('')}</div>`;
    return `<ol class="v27-how v28-line">${st.map(([ic, , t, l], i) => `<li class="${i === 0 ? 'now' : ''}"><span class="v27-ic">${ic24(ic, 18, 2)}</span><div><b>${t}</b><p>${l}</p></div></li>`).join('')}</ol>`;
  };

  /* Final v26: reviews. A score card (overall, would book again, four scores), what patients mention,
     swipeable review cards, and an All reviews sheet with star filters. Scores and counts are placeholder,
     derived from the rating so they stay consistent; FRH's real review data replaces them. */
  const V26MENT = {
    doctor: ['On time', 'Explained clearly', 'Thorough', 'Follow-up call'], lab: ['Painless', 'Results on time', 'On time', 'Discreet'],
    iv: ['Calm nurse', 'Painless', 'On time', 'Felt better'], checkup: ['Thorough', 'Painless', 'Clear report', 'On time'],
    dentist: ['Gentle', 'Thorough', 'On time', 'Clean setup'], nutrition: ['Practical plan', 'Listened', 'On time', 'Follow-up'],
    vaccine: ['Quick', 'Painless', 'Good with kids', 'On time'], nursing: ['Caring', 'Reliable', 'On time', 'Clear handover'],
    physio: ['Hands-on', 'Clear exercises', 'On time', 'Felt better'],
  };
  const V26MORE = [
    { name: 'Fatima Z.', date: '25 Aug 2026', stars: 5, text: 'Booked in two minutes and the team called before arriving. Very professional from start to finish.' },
    { name: 'Daniel R.', date: '19 Aug 2026', stars: 5, text: 'Everything was explained in plain words, and the notes were in the app the same evening.' },
    { name: 'Sana M.', date: '11 Aug 2026', stars: 4, text: 'Good care and easy booking. Parking at our building slowed them down a little.' },
    { name: 'Khalid A.', date: '2 Aug 2026', stars: 5, text: 'So much better than waiting at a clinic with a sick child. Kind and patient team.' },
    { name: 'Emma T.', date: '28 Jul 2026', stars: 3, text: 'Care itself was fine, but I had to reschedule once because no one was free at my first time.' },
  ];
  const v26One = n => (Math.round(n * 10) / 10).toFixed(1);
  const v26Scores = d => [['clock', 'On time', d.rating], ['heart', 'Care', Math.min(5, d.rating + 0.1)], ['chat', 'Advice', d.rating], ['shieldCheck', 'Hygiene', Math.min(5, d.rating + 0.2)]];
  const v26Again = d => Math.round(d.dist[0] + d.dist[1] * 0.9);
  const v26All = d => d.reviewsList.concat(V26MORE);
  const v26Card = (r, cls = '') => `<article class="v26-rc ${cls}"><div class="v26-rt"><span class="s-stars">${starRow(r.stars, 13)}</span><span class="v26-date">${r.date || r.when || ''}</span></div>
      <p>${r.text}</p><div class="v26-who"><span class="av">${initials(r.name)}</span><span><b>${r.name}</b>${/^d/.test(S.v29rev || '') ? '' : `<small>${icon('shieldCheck', 11, 2.4)} Verified visit</small>`}</span></div></article>`;
  /* Final v29: three review layouts to choose from (S.v29rev). A = score card (v26), B = classic list, C = summary.
     The summary lines are placeholder, written per kind of service from the sample reviews; FRH's data replaces them. */
  const V29SUM = {
    doctor: ['Patients praise doctors who arrive on time, explain clearly and call back as promised.', 'A few say the arrival window slipped by 10–20 minutes at busy times.'],
    lab: ['Patients find the sample quick and painless, with results on time.', 'A few would like earlier morning slots.'],
    iv: ['Patients describe calm nurses who adjust the drip to keep them comfortable.', 'Some would like more evening slots.'],
    checkup: ['Patients like the thorough panel and a doctor who explains the results.', 'A few found the fasting window hard.'],
    dentist: ['Patients say the clean is gentle and thorough, with no clinic visit.', 'A few mention the setup needs some room.'],
    nutrition: ['Patients say the plan is practical and fits how they already eat.', 'Some wanted a follow-up sooner.'],
    vaccine: ['Parents say the nurse is quick and good with children.', 'A few mention late arrivals in rush hour.'],
    nursing: ['Families describe caring, reliable nurses and clear handovers.', 'A few asked for the same nurse every shift.'],
    physio: ['Patients like hands-on sessions and exercises that are easy to follow.', 'A few wanted longer sessions.'],
  };
  const v29Ring = (v, max, label, txt) => { const C = 2 * Math.PI * 21, f = Math.max(0, Math.min(1, v / max));
    return `<div class="v29-ring"><svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="21" class="t"/><circle cx="26" cy="26" r="21" class="f" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 26 26)"/></svg><b>${txt}</b><small>${label}</small></div>`; };
  const v29Laurel = flip => { let e = ''; for (let i = 0; i < 6; i++) { const a = (118 + i * 24) * Math.PI / 180, x = 30 + 19 * Math.cos(a), y = 25 + 19 * Math.sin(a), r = (118 + i * 24) + 70;
      e += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="6" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    return `<svg class="v29-laurel" width="34" height="50" viewBox="0 0 34 50" aria-hidden="true"${flip ? ' style="transform:scaleX(-1)"' : ''}><path d="M21 44C12 38 9 26 13 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><g fill="currentColor">${e}</g></svg>`; };
  const v29Row = r => `<article class="v29-row"><div class="v29-rh"><span class="av">${initials(r.name)}</span><span class="v29-rn"><b>${r.name}</b><small>${icon('shieldCheck', 11, 2.4)} Verified visit</small></span><span class="v26-date">${r.date || r.when || ''}</span></div>
      <span class="s-stars">${starRow(r.stars, 12)}</span><p>${r.text}</p></article>`;
  /* Final v31: the laurel header the user picked from C, with three structures below it (d1 scores, d2 rings,
     d3 mentions). "Verified" is said once in the header instead of on every review. */
  const v31Head = d => { const fav = d.rating >= 4.8;
    return `<div class="v29-hero">${v29Laurel(false)}<div><b>${d.rating}</b><span class="s-stars">${starRow(d.rating, 12)}</span></div>${v29Laurel(true)}</div>
      <p class="v29-fav"><b>${fav ? 'Patient favourite' : 'Well reviewed'}</b><span>${fav ? 'One of the top-rated services on FRH' : 'Rated well by patients'}</span></p>
      <p class="v31-ver">${icon('shieldCheck', 13, 2.2)}${d.reviews} reviews, all from verified visits</p>`; };
  const v31Card = r => `<article class="v26-rc v31-rc"><span class="s-stars">${starRow(r.stars, 13)}</span><p>${r.text}</p>
      <div class="v26-who"><span class="av">${initials(r.name)}</span><span><b>${r.name}</b><small class="v31-d">${r.date || r.when || ''}</small></span></div></article>`;
  const v31Row = r => `<article class="v29-row"><div class="v29-rh"><span class="av">${initials(r.name)}</span><span class="v29-rn"><b>${r.name}</b><small class="v31-d">${r.date || r.when || ''}</small></span><span class="s-stars">${starRow(r.stars, 12)}</span></div><p>${r.text}</p></article>`;
  function v31Reviews(d, mode) {
    const all = `<button class="btn btn-secondary v26-all" type="button" data-act="v26-revs">See all ${d.reviews} reviews</button>`;
    const sc = v26Scores(d), cards = `<div class="v26-cards v31-cards">${d.reviewsList.map(v31Card).join('')}</div>`;
    if (mode === 'd1') return `<div class="v31">${v31Head(d)}
        <div class="v31-row">${sc.map(([ic, l, v]) => `<div><small>${l}</small><b>${v26One(v)}</b>${icon(ic, 20, 1.8)}</div>`).join('')}</div>${cards}${all}</div>`;
    if (mode === 'd2') return `<div class="v31">${v31Head(d)}
        <div class="v29-rings v31-rings">${v29Ring(v26Again(d), 100, 'Would book again', v26Again(d) + '%')}${sc.slice(0, 3).map(([, l, v]) => v29Ring(v, 5, l, v26One(v))).join('')}</div>
        <div class="v29-list">${d.reviewsList.slice(0, 2).map(v31Row).join('')}</div>${all}</div>`;
    const ment = V26MENT[d.cat] || V26MENT.doctor, k = [0.62, 0.48, 0.37, 0.22], top = Math.round(d.reviews * k[0]);
    return `<div class="v31">${v31Head(d)}
        <div class="v31-ment"><div class="v31-mh"><b>What patients mention</b><span>${v26Again(d)}% would book again</span></div>
          ${ment.map((m, i) => { const n = Math.max(3, Math.round(d.reviews * k[i])); return `<div class="v31-mr"><span>${m}</span><i><em style="width:${Math.round(n / top * 100)}%"></em></i><b>${n}</b></div>`; }).join('')}</div>${cards}${all}</div>`;
  }
  function v29Reviews(d) {
    const mode = S.v29rev || 'a';
    if (mode === 'a') return v26Reviews(d);
    if (/^d[123]$/.test(mode)) return v31Reviews(d, mode);
    const sc = v26Scores(d), all = `<button class="btn btn-secondary v26-all" type="button" data-act="v26-revs">See all ${d.reviews} reviews</button>`;
    if (mode === 'b') return `<div class="v29-b">
        <div class="v29-bt"><div class="v29-bs"><b>${d.rating}</b><span class="s-stars">${starRow(d.rating, 13)}</span><small>${d.reviews} reviews</small></div>
          <div class="s-bars">${[5, 4, 3, 2, 1].map((k, i) => `<div><span>${k}</span>${icon('starFill', 10)}<i><em style="width:${d.dist[i]}%"></em></i><small>${d.dist[i]}%</small></div>`).join('')}</div></div>
        <div class="v29-rings">${v29Ring(v26Again(d), 100, 'Would book again', v26Again(d) + '%')}${sc.slice(0, 3).map(([, l, v]) => v29Ring(v, 5, l, v26One(v))).join('')}</div>
        <div class="v29-list">${d.reviewsList.slice(0, 2).map(v29Row).join('')}</div>${all}</div>`;
    const sum = V29SUM[d.cat] || V29SUM.doctor, ment = V26MENT[d.cat] || V26MENT.doctor, k = [0.62, 0.48, 0.37, 0.22], fav = d.rating >= 4.8;
    return `<div class="v29-c">
        <div class="v29-hero">${v29Laurel(false)}<div><b>${d.rating}</b><span class="s-stars">${starRow(d.rating, 12)}</span></div>${v29Laurel(true)}</div>
        <p class="v29-fav"><b>${fav ? 'Patient favourite' : 'Well reviewed'}</b><span>${fav ? 'One of the top-rated services on FRH' : 'Rated well by patients'} · ${d.reviews} verified reviews</span></p>
        <div class="v29-say"><h5>What patients say</h5><p>${sum[0]}</p><p class="v29-watch">${icon('alert', 13, 2.2)}<span>${sum[1]}</span></p>
          <div class="v26-chips">${ment.map((m, i) => `<span>${m}<em>${Math.max(3, Math.round(d.reviews * k[i]))}</em></span>`).join('')}</div>
          <small class="v29-src">Summary of ${d.reviews} verified reviews</small></div>
        <div class="v29-quotes">${d.reviewsList.slice(0, 2).map(r => `<article class="v29-q"><span class="s-stars">${starRow(r.stars, 12)}</span><p>“${r.text}”</p><small><b>${r.name}</b> · ${r.date || r.when || ''}</small></article>`).join('')}</div>${all}</div>`;
  }
  function v26Reviews(d) {
    const ment = V26MENT[d.cat] || V26MENT.doctor, k = [0.62, 0.48, 0.37, 0.22];
    return `<div class="v26-sum">
        <div class="v26-top"><div class="v26-big"><b>${d.rating}</b><span><span class="s-stars">${starRow(d.rating, 14)}</span><small>${d.reviews} verified reviews</small></span></div>
          <div class="v26-again"><b>${v26Again(d)}%</b><small>would book again</small></div></div>
        <div class="v26-cats">${v26Scores(d).map(([ic, l, v]) => `<div><span class="v26-ci">${icon(ic, 16, 2)}</span><b>${v26One(v)}</b><small>${l}</small></div>`).join('')}</div></div>
      <p class="v26-lbl">Patients mention</p>
      <div class="v26-chips">${ment.map((m, i) => `<span>${m}<em>${Math.max(3, Math.round(d.reviews * k[i]))}</em></span>`).join('')}</div>
      <div class="v26-cards" data-r="revcards">${d.reviewsList.map(r => v26Card(r)).join('')}</div>
      <button class="btn btn-secondary v26-all" type="button" data-act="v26-revs">See all ${d.reviews} reviews</button>`;
  }
  F.SHEETS['v26-revs'] = () => {
    const d = svcDetail(S.svc), f = S.v26rf || 'all', all = v26All(d);
    const list = all.filter(r => f === 'all' || (f === 'low' ? r.stars <= 3 : r.stars === +f));
    const chip = (v, l) => `<button type="button" class="v26-f ${f === v ? 'on' : ''}" data-act="v26-rf" data-f="${v}" aria-pressed="${f === v}">${l}</button>`;
    return `<div class="sheet v26-sheet" role="dialog" aria-label="All reviews"><div class="grab"></div>
      <div class="v26-sh"><h2>Reviews</h2><span>${d.name}</span></div>
      <div class="v26-dist"><div class="v26-big"><b>${d.rating}</b><span><span class="s-stars">${starRow(d.rating, 13)}</span><small>${d.reviews} verified reviews</small></span></div>
        <div class="s-bars">${[5, 4, 3, 2, 1].map((k, i) => `<div><span>${k}</span>${icon('starFill', 10)}<i><em style="width:${d.dist[i]}%"></em></i><small>${d.dist[i]}%</small></div>`).join('')}</div></div>
      <div class="v26-fs">${chip('all', 'All')}${chip('5', '5 ★')}${chip('4', '4 ★')}${chip('low', '3 ★ and below')}</div>
      <div class="v26-list">${list.length ? list.map(r => v26Card(r, 'flat')).join('') : '<p class="v26-none">No reviews with this rating yet.</p>'}</div>
      <p class="v26-note">${icon('shieldCheck', 13, 2.2)} Only patients who completed a visit can leave a review.</p></div>`;
  };
  function v26Tiles(id) {
    const x = V24F[id]; if (!x) return [];
    const covered = x.f.map(f => f[3]).filter(Boolean), com = v24Common(id).filter(c => !covered.includes(c[0]))
      .sort((a, b) => V26P.indexOf(a[0]) - V26P.indexOf(b[0])).map(c => [c[1], c[2], c[3]]);
    return x.f.concat(x.g || [], com).slice(0, 6);
  }
  function v24Inc(id) {
    const t = v26Tiles(id); if (!t.length) return '';
    return `<div class="v24-hl v24-n4 v26-six">${t.map(v24Tile).join('')}</div>`;
  }

  function svcDetail(id) {
    const s = findSvc(id), base = B.detail[id], x = SD[id] || {}, g = B.detail.gp;
    const sibs = (B.subcats[s.cat] || []).filter(o => o.id !== id).slice(0, 3).map(o => o.id);
    const reviews = x.reviews !== undefined ? x.reviews : base ? base.reviews : s.badge === 'New' ? 0 : 84;
    return {
      id, cat: s.cat, img: x.img || (base && base.img) || s.img, name: (base && base.name) || s.name,
      desc: x.desc || `${s.name} at home.${/DHA/.test(s.lab) ? '' : ` ${s.lab}.`}`,     /* v22: the licence line says DHA, so the description doesn't */
      over: overTidy(x.over || (base && base.overview) || `${s.name} at home, by a DHA-licensed FRH clinician. ${s.lab}. Everything needed is brought to you, and notes and results are saved in the app.`),
      tags: x.tags || [s.badge, 'Home visit'].filter(Boolean),
      avail: x.avail || 'Available today',
      rating: x.rating || (base && base.rating) || 4.7, reviews,
      price: s.price, dur: s.dur,
      inShort: (HXD().inc || {})[id] ? lineTidy(HXD().inc[id]) : '', was: wasOf(id),
      included: (x.included || (base && base.included) || [incLine(id, s), 'Assessment by a DHA-licensed clinician', 'All equipment and consumables brought to you', 'Notes and results saved in the app', 'Free follow-up call within 48 hours']).map(lineTidy),
      steps: (x.steps || (base && base.steps) || g.steps).map(([t, d]) => [t, lineTidy(d)]),
      faqs: faqFor(x.faqs || GP_FAQS),
      reviewsList: reviews ? (x.reviewsList || GP_REVIEWS) : [],
      dist: x.dist || [74, 17, 6, 2, 1],
      addons: s.cat === 'iv' ? (x.addons || []) : [],            /* S7: wellness (IV) only, never a doctor visit */
      dosage: x.dosage || null,
      similar: x.similar || sibs,
    };
  }
  const selOf = id => { S.sSel = S.sSel || {}; return (S.sSel[id] = S.sSel[id] || { dose: 0, addons: [], faq: 0, inc: false, how: false, rev: false }); };
  function svcPrice(d, sel) {
    const dose = d.dosage ? d.dosage.options[sel.dose] || d.dosage.options[0] : null;
    const unit = dose ? dose.price : d.price;
    const adds = d.addons.filter(a => sel.addons.includes(a.id));
    const add = adds.reduce((n, a) => n + a.price, 0);
    return { dose, unit, adds, add, total: unit + add };
  }
  const sigOf = (id, sel) => [id, sel ? sel.dose : 0, ...(sel ? sel.addons.slice().sort() : [])].join('|');

  /* =====================================================================
     People, places, time
     ===================================================================== */
  const pats = () => (PD.patients && PD.patients.length ? PD.patients : B.patients.map((p, i) => ({ ...p, id: 'b' + i, self: i === 0 })));
  const patBy = id => pats().find(p => p.id === id) || pats()[0];
  const selfId = () => (pats().find(p => p.self) || pats()[0]).id;
  const relOf = p => (p.self ? 'you' : String(p.rel || '').toLowerCase());
  const addrs = () => (PD.addresses && PD.addresses.length ? PD.addresses : B.addresses.map((a, i) => ({ ...a, id: 'b' + i, dflt: a.def })));
  const addrBy = id => addrs().find(a => a.id === id);
  const defAddrId = () => (addrs().find(a => a.dflt) || addrs()[0]).id;
  /* the visit address picked in the Home header (dev-home), else the default */
  const visitAddrId = () => {
    const v = typeof F.visitAddress === 'function' ? F.visitAddress() : null;
    const a = v && (addrBy(v.id) || addrs().find(x => x.line === v.line));
    return a ? a.id : defAddrId();
  };
  const shortLine = a => a.line.split(',').slice(0, 2).join(',').trim();
  const addrIc = a => (!a ? 'pin' : a.type === 'work' || /office|work/i.test(a.label) ? 'work' : a.type === 'home' || /home|place/i.test(a.label) ? 'home' : 'pin');
  const CITY = { dubai: 'Dubai', sharjah: 'Sharjah', abudhabi: 'Abu Dhabi', alain: 'Al Ain', rak: 'Ras Al Khaimah', ajman: 'Ajman', fujairah: 'Fujairah', uaq: 'Umm Al Quwain' };
  const cityOf = a => {
    if (a && a.city && CITY[a.city]) return a.city;
    const l = String(a && a.line || '').toLowerCase();
    return /sharjah/.test(l) ? 'sharjah' : /abu dhabi/.test(l) ? 'abudhabi' : /al ain/.test(l) ? 'alain' : /ras al khaimah|\brak\b/.test(l) ? 'rak'
      : /ajman/.test(l) ? 'ajman' : /fujairah/.test(l) ? 'fujairah' : /umm al quwain/.test(l) ? 'uaq' : 'dubai';
  };
  /* live cities and per-city “Soon” categories come from the Home list (H25) so list and cart agree */
  const cityKey = name => Object.keys(CITY).find(k => CITY[k] === name);
  const liveKeys = () => ((F.HXDATA && F.HXDATA.live) || ['Dubai', 'Sharjah']).map(cityKey).filter(Boolean);
  const offIn = c => (((F.HXDATA && F.HXDATA.soonBy) || { Dubai: ['nutrition'], Sharjah: ['nutrition', 'dentist'] })[CITY[c]] || []);
  const covers = a => liveKeys().includes(cityOf(a));

  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const FULL = { 0: [20], 1: [9, 13, 18], 2: [10, 19], 3: [11, 12], 4: [8, 17], 5: [15], 6: [9] };
  const isPast = (d, h) => d === 0 && h * 60 <= now().getHours() * 60 + now().getMinutes() + 60;
  const isFull = (d, h) => (FULL[d] || []).includes(h);
  const slotFree = (d, h) => !isPast(d, h) && !isFull(d, h);
  function nextSlot() {
    for (let d = 0; d < 7; d++) for (const h of HOURS) if (slotFree(d, h)) return { mode: 'slot', d, h };
    return { mode: 'asap' };
  }
  const isLate = w => !!w && (w.mode === 'asap' ? now().getHours() >= 22 : w.h >= 22);
  /* Final v45: a package is booked as appointments. bk(i).sess holds one entry per appointment, { mode:'slot', d, h }
     or null for "Schedule later", kept in date order with the later ones at the end; bk(i).when mirrors appointment 1.
     Appointment 1 is required; the rest can be booked now or later from the booking. Days run 4 weeks ahead. */
  const PKG = {
    knee5: { n: 5, name: 'Knee rehab', label: 'Bundle of 5', each: '60 min' },
    post: { n: 6, name: 'Post-surgery rehab', label: 'Package of 6', each: '60 min' },
  };
  const pkgOf = i => (i && PKG[i.id]) || null;
  const SESS_H = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], SESS_DAYS = 28;
  const sessFree = (d, h) => !isPast(d, h) && !isFull(d % 7, h);
  function sessFirst() { for (let d = 1; d < SESS_DAYS; d++) for (const h of SESS_H) if (sessFree(d, h)) return { mode: 'slot', d, h }; return null; }
  const sessAt = x => x.d * 24 + x.h;
  function sessSort(b) {
    const n = b.sess.length, on = b.sess.filter(Boolean).sort((x, y) => sessAt(x) - sessAt(y));
    b.sess = on.concat(Array(n - on.length).fill(null)); b.when = b.sess[0] ? { ...b.sess[0] } : null;
  }
  const sessTxt = x => `${dayShort(x.d)} · ${fmtH(x.h)}`;
  const hRange = h => { const ap = x => (x % 24 < 12 ? 'AM' : 'PM'), f = x => `${x % 12 || 12}:00`;
    return ap(h) === ap(h + 1) ? `${f(h)} – ${f(h + 1)} ${ap(h)}` : `${f(h)} ${ap(h)} – ${f(h + 1)} ${ap(h + 1)}`; };

  /* =====================================================================
     Cart model
     ===================================================================== */
  let seq = 0;
  const bkAll = () => (S.sBk = S.sBk || {});
  const isTele = i => i.id === 'tele';
  function prefill(i, prev) {
    const p = prev && bkAll()[prev.key];
    const b = p ? { pat: p.pat, addr: p.addr || defAddrId(), when: p.when ? { ...p.when } : nextSlot() }
      : { pat: selfId(), addr: visitAddrId(), when: nextSlot() };
    if (b.when.mode === 'slot' && !slotFree(b.when.d, b.when.h)) b.when = nextSlot();
    b.note = ''; b.chips = []; b.gone = false;
    b.idDoc = patBy(b.pat).self ? 'eid' : (p && p.pat === b.pat && p.idDoc) || '';
    const pk = PKG[i.id];
    if (pk) { b.sess = Array(pk.n).fill(null); b.sess[0] = sessFirst(); b.when = b.sess[0] ? { ...b.sess[0] } : null; }   /* v45 */
    return b;
  }
  function norm(i, prev) {
    if (i._n) return;
    const s = findSvc(i.id);
    i.key = i.key || i.id; i.cat = i.cat || s.cat; i.sub = catOf(i.cat).name; i.qty = 1;
    i.night = i.cat === 'doctor' && i.id !== 'tele' && i.id !== 'night' ? 70 : 0;
    i._n = 1;
    if (!bkAll()[i.key]) bkAll()[i.key] = prefill(i, prev);
  }
  const cart = () => { if (!S.cart) S.cart = B.cart.map(i => ({ ...i, key: i.id })); S.cart.forEach((i, n) => norm(i, S.cart[n - 1])); syncGroups(S.cart); return S.cart; };
  /* Final v5: “Add for another person” puts people in the same visit (one card). Each person is still
     its own cart item underneath (price, membership, booking), but address and time belong to the
     visit, so they are copied from the first person to everyone else in the group. */
  const grpOf = i => i.grp || i.key;
  /* Final v43: someone in the visit can be at another address. b.own marks a person with their own
     address; everyone else follows the first person. Each extra address is a stop: the team goes on to it
     after the one before (about 1 h later in the same city, 2 h in another emirate). completeBooking
     already makes one booking per time + address, so each stop is booked as its own visit. */
  const shiftWhen = (w, h) => (!w ? w : !h ? { ...w } : w.mode === 'asap' ? { mode: 'asap', off: h * 60 } : { ...w, h: Math.min(23, w.h + h) });
  function syncGroups(items) {
    const lead = {}, st = {};
    items.forEach(i => {
      if (!i.grp) return;
      const L = lead[i.grp], b = bkAll()[i.key];
      if (!b) return;
      if (!L) { lead[i.grp] = i; b.own = false; b.stop = 0; st[i.grp] = { ids: [b.addr], off: [0] }; return; }
      const a = bkAll()[L.key];
      if (!a) return;
      if (!b.own || b.addr === a.addr || isTele(i)) { b.own = false; b.addr = a.addr; }
      const t = st[i.grp];
      let n = t.ids.indexOf(b.addr);
      if (n < 0) {
        const prev = addrBy(t.ids[t.ids.length - 1]), here = addrBy(b.addr);
        t.ids.push(b.addr); t.off.push(t.off[t.off.length - 1] + (prev && here && cityOf(prev) !== cityOf(here) ? 2 : 1));
        n = t.ids.length - 1;
      }
      b.stop = n; b.when = shiftWhen(a.when, t.off[n]); b.gone = a.gone;
    });
  }
  function visitGroups(items) {
    const out = [], at = {};
    items.forEach(i => { const k = grpOf(i); if (at[k] === undefined) { at[k] = out.length; out.push([i]); } else out[at[k]].push(i); });
    return out;
  }
  const byKey = k => cart().find(i => i.key === k);
  const bk = i => bkAll()[i.key] || (bkAll()[i.key] = prefill(i, null));
  function makeItem(id, sel) {
    const d = svcDetail(id), s = findSvc(id), pr = svcPrice(d, sel || { dose: 0, addons: [] });
    const opts = [pr.dose ? pr.dose.name : '', ...pr.adds.map(a => '+ ' + a.name)].filter(Boolean).join(' · ');
    return { key: `${id}-${(++seq).toString(36)}${(Date.now() % 1e4).toString(36)}`, id, cat: s.cat, name: d.name, sub: catOf(s.cat).name,
      dur: pr.dose ? pr.dose.dur : d.dur, price: pr.total, qty: 1, night: s.cat === 'doctor' && id !== 'tele' && id !== 'night' ? 70 : 0, opts, sig: sigOf(id, sel), _n: 1 };
  }
  function addItem(id, sel) {
    const items = cart(), it = makeItem(id, sel);
    bkAll()[it.key] = prefill(it, items.filter(x => !PKG[x.id]).pop());   /* v45: copies the last visit, never a package */
    const to = S.v45to, b = bk(it);                                          /* v45: "Add a service to this visit" */
    if (to && !PKG[id]) { b.addr = to.addr; if (to.when && (to.when.mode === 'asap' || slotFree(to.when.d, to.when.h))) b.when = { ...to.when }; S.v45to = null; }
    items.push(it);
    return it;
  }
  /* v4: "Add for another person": the same service and options as a new line, priced in full.
     Address and time are copied; the patient is the next family member without this service yet. */
  const twinOf = (a, b) => a.id === b.id && (a.opts || '') === (b.opts || '');
  function dupItem(src) {
    const items = cart(), sb = bk(src);
    const g = grpOf(src); src.grp = g;
    const it = { ...src, grp: g, key: `${src.id}-${(++seq).toString(36)}${(Date.now() % 1e4).toString(36)}` };
    const used = items.filter(x => grpOf(x) === g).map(x => bk(x).pat);
    const next = pats().find(p => !used.includes(p.id));
    const pat = next ? next.id : sb.pat;
    bkAll()[it.key] = { ...sb, when: sb.when ? { ...sb.when } : sb.when, pick: undefined, pat, chips: [], note: '', gone: false,
      idDoc: isTele(it) ? (patBy(pat).self ? 'eid' : '') : sb.idDoc };
    let at = items.indexOf(src);
    items.forEach((x, n) => { if (grpOf(x) === g && n > at) at = n; });
    items.splice(at + 1, 0, it);
    return { it, next };
  }
  F.cartCount = () => visitGroups(cart()).length;
  function addForPeople(d, sel) {
    const ids = forOf(d.id), it = addItem(d.id, sel);
    bk(it).pat = ids[0];
    if (isTele(it)) bk(it).idDoc = patBy(ids[0]).self ? 'eid' : '';
    ids.slice(1).forEach(pid => { const r = dupItem(it); bk(r.it).pat = pid; if (isTele(r.it)) bk(r.it).idDoc = patBy(pid).self ? 'eid' : ''; });
    return it;
  }   /* a visit for 2 people counts once */
  F.addToCart = x => addItem(typeof x === 'string' ? x : x.id, typeof x === 'object' ? x.sel : null).key;

  /* membership: which cart items are included in the plan */
  const personCovered = pid => {
    const t = tierNow(); if (!t) return false;
    const p = patBy(pid), idx = (B.patients || []).findIndex(x => x.name === p.name);
    return idx >= 0 && idx < (TIER_PEOPLE[t.key] || 1);
  };
  function coverMap() {
    const used = {}, m = {};
    if (!tierNow()) return m;
    cart().forEach(i => {
      if (unav(i) || PKG[i.id]) return;
      const c = covOf(i.id);
      if (!c || !personCovered(bk(i).pat)) return;
      used[c.key] = used[c.key] || 0;
      if (used[c.key] < c.left) { m[i.key] = c.key; used[c.key]++; }
    });
    return m;
  }
  const itemCov = (i, m) => !!(m || coverMap())[i.key];
  /* detail page: would the next booking for you be included? */
  const svcCov = id => {
    const c = covOf(id);
    if (!c || !personCovered(selfId())) return false;
    const m = coverMap(), inCart = Object.values(m).filter(k => k === c.key).length;
    return c.left - inCart > 0;
  };

  /* item state */
  const unav = i => {
    if (isTele(i)) return '';
    const a = addrBy(bk(i).addr);
    if (!a) return 'none';
    const c = cityOf(a);
    if (!liveKeys().includes(c)) return CITY[c];
    return offIn(c).includes(i.cat) ? CITY[c] : '';
  };
  const NIGHT_FREE = ['gold', 'platinum'];
  const nightFree = i => { const t = tierNow(); return !!t && NIGHT_FREE.includes(t.key) && personCovered(bk(i).pat); };
  const extraOf = i => (i.night && isLate(bk(i).when) && !nightFree(i) ? i.night : 0);
  const needOf = i => {
    const b = bk(i);
    if (PKG[i.id]) return unav(i) ? { row: 'addr', t: 'Choose another address' } : !(b.sess && b.sess[0]) ? { row: 'sess', t: 'Choose appointment 1' } : null;
    if (i.grp) {
      const g = cart().filter(x => x.grp === i.grp);
      if (g.findIndex(x => bk(x).pat === b.pat) < g.indexOf(i)) return { row: 'pat', t: 'Choose a different person' };
    }
    if (unav(i)) return { row: i.grp && bk(i).own ? 'paddr' : 'addr', t: 'Choose another address' };
    if (b.gone) return { row: 'when', t: 'Choose a new time' };
    if (isTele(i) && !b.idDoc) return { row: 'id', t: 'Add an ID to continue' };
    if (!b.when) return { row: 'when', t: 'Choose a time' };
    return null;
  };

  /* coupons (the same three as Profile → Coupons) */
  const COUPONS = [
    { code: 'WELCOME20', title: 'Welcome offer', desc: '20% off your first home visit, up to AED 150.', pct: 20, max: 150 },
    { code: 'IVWEEK15', title: 'Weekday IV therapy', desc: '15% off any IV drip booked Monday to Thursday.', pct: 15, max: 200, scope: 'iv', need: 'Add an IV drip to use this code' },
    { code: 'FRH500', title: 'Annual health package', desc: 'AED 500 off health packages from AED 1,499.', flat: 500, min: 1499, scope: 'checkup', need: 'For health packages from AED 1,499' },
  ];
  const cpnOf = code => COUPONS.find(c => c.code === String(code || '').toUpperCase());
  function discount(items, sub, cc = S.coupon) {
    const c = cc && (cpnOf(cc.code) || cc);
    if (!c) return { off: 0 };
    const m = coverMap(), base = c.scope ? items.filter(i => i.cat === c.scope).reduce((n, i) => n + (itemCov(i, m) ? 0 : i.price), 0) : sub;
    if (!base) return { off: 0, why: c.need || 'Not valid for these services' };
    if (c.min && base < c.min) return { off: 0, why: `Spend ${aed(c.min - base)} more to use this code` };
    return { off: r2(c.pct ? Math.min(base * c.pct / 100, c.max || Infinity) : Math.min(c.flat || 0, base)) };
  }
  function totals() {
    const items = cart().filter(i => !unav(i));
    const m = coverMap(), inc = items.filter(i => itemCov(i, m)).length;
    const sub = r2(items.reduce((n, i) => n + (itemCov(i, m) ? 0 : i.price), 0));
    const night = r2(items.reduce((n, i) => n + (itemCov(i, m) ? 0 : extraOf(i)), 0));
    const dc = discount(items, sub), off = Math.min(dc.off, sub);
    const net = r2(sub + night - off), vat = r2(net * B.vatRate);   /* S29: VAT on the discounted amount */
    const gold = S.sAddPlan && S.sPreviewing ? planInfo(S.sAddPlan).price : 0;   /* membership price already includes VAT */
    return { items, inc, sub, night, off, why: dc.why, net, vat, gold, total: r2(net + vat + gold) };
  }
  /* Final v10: the cart offers all three plans (Silver, Gold, Platinum), each with its saving on THIS cart.
     A plan can be added to the order; cart and checkout are then priced as a fresh member of that tier, plus the fee. */
  const PLANS = ['silver', 'gold', 'platinum'];
  const PLAN_FB = { silver: { name: 'Silver', price: 799, coverShort: 'Just you', services: [] }, gold: { name: 'Gold', price: 2499, coverShort: 'You + 1', services: [] }, platinum: { name: 'Platinum', price: 5999, coverShort: 'You + 3', services: [] } };
  const planInfo = t => (typeof F.memberPlanInfo === 'function' ? F.memberPlanInfo(t) : PLAN_FB[t]);
  function withPlan(fn) {
    if (S.sAddPlan && !S.sPreviewing && tierNow()) S.sAddPlan = null;           /* became a member some other way */
    if (!S.sAddPlan || S.sPreviewing || typeof F.memberPreview !== 'function') return fn();
    S.sPlanBase = totals().total;                                                 /* what this order costs without a plan */
    S.sPreviewing = true;
    try { return F.memberPreview(S.sAddPlan, fn); } finally { S.sPreviewing = false; }
  }
  const withGold = withPlan;
  /* what tier t would save on this cart, VAT included, with a fresh allowance */
  function planSave(t) {
    if (typeof F.memberPreview !== 'function') return { save: 0, covered: [] };
    const base = S.sPreviewing ? S.sPlanBase : totals().total;
    const keepAdd = S.sAddPlan, keepPrev = S.sPreviewing;
    S.sAddPlan = null;                                                            /* no fee in this calculation */
    try {
      const r = F.memberPreview(t, () => { S.sPreviewing = true; const tt = totals(), m = coverMap(); return { total: tt.total, covered: tt.items.filter(i => m[i.key]) }; });
      return { save: Math.max(0, r2(base - r.total)), covered: r.covered };
    } finally { S.sAddPlan = keepAdd; S.sPreviewing = keepPrev; }
  }
  /* best for this cart = the biggest saving; on a tie, the cheaper plan */
  function planOffers() {
    const list = PLANS.map(t => Object.assign({ t, info: planInfo(t) }, planSave(t)));
    const best = list.filter(x => x.save > 0).sort((a, b) => b.save - a.save || a.info.price - b.info.price)[0];
    return { list, best: best ? best.t : null, top: Math.max(0, ...list.map(x => x.save)) };
  }
  /* Final v12: the agency's membership card (eyebrow, photo, frosted panel, big saving, two actions)
     with a plan choice. It opens on the plan that suits this cart (biggest saving, cheaper on a tie);
     the Silver / Gold / Platinum switch lets the patient pick another and the card updates live. */
  const HEART = `<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><defs><linearGradient id="mcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF4D2"/><stop offset=".55" stop-color="#F2C46B"/><stop offset="1" stop-color="#C98A2E"/></linearGradient></defs>
    <path d="M24 41s-14-8.6-14-19.2C10 16.4 13.9 12 18.9 12c2.6 0 4.2 1.1 5.1 2.6.9-1.5 2.5-2.6 5.1-2.6 5 0 8.9 4.4 8.9 9.8C38 32.4 24 41 24 41z" fill="url(#mcG)" stroke="#B57A22" stroke-width="1.4"/>
    <path d="M24 21v10M19 26h10" stroke="#9A5F12" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  function goldCard() {
    if (tierNow() && !S.sAddPlan) return '';
    const O = planOffers(), on = S.sAddPlan;
    if (!O.best && !on) {
      return `<div class="s-mem lite" data-r="gold"><span class="s-gold-ic">${icon('starFill', 14)}</span>
        <span class="mid"><b>FRH Membership</b><small>From ${aed0(planInfo('silver').price)} a year · doctor visits, lab panels and physio included</small></span>
        <button class="s-mem-btn ghost" type="button" data-act="s-plans">See plans</button></div>`;
    }
    const pickT = on || O.best;   /* v13: no switch on the card; it always shows the plan that fits this cart */
    const P = O.list.find(x => x.t === pickT), saves = P.save > 0;
    return `<div class="s-mc ${on ? 'on' : ''}" data-r="gold">
      <img class="s-mc-photo" src="${img('banner-2.jpg')}" alt="">
      <div class="s-mc-top"><span class="s-mc-eye">${icon('sparkle', 14, 2.2)} FRH Membership</span>
        <span class="s-mc-fit">${on ? 'Added to this order' : 'Best plan for this cart'}</span></div>
      <div class="s-mc-panel">
        <span class="s-mc-pill">${on ? `${icon('check', 11, 3)} Added` : saves ? 'Save' : 'Plan'}</span>
        <div class="s-mc-amt">${saves ? aed(P.save) : `${aed0(P.info.price)}<small>/yr</small>`}</div>
        <p class="s-mc-sub">${saves ? `on this order with ${P.info.name} membership${pickT === O.best ? '' : ''}` : `${P.info.name} doesn’t cover anything in this cart`} · ${esc(P.info.coverShort)}</p>
        <span class="s-mc-badge">${HEART}</span>
        <div class="s-mc-btns">
          <button class="s-mc-b ${on ? 'added' : ''}" type="button" data-act="s-plan-toggle" aria-pressed="${!!on}">${on ? `${icon('check', 14, 3)} ${P.info.name} added` : `${icon('plus', 14, 2.6)} Add at ${aed0(P.info.price)}/yr`}</button>
          <button class="s-mc-b ghost" type="button" data-act="s-plans">Compare plans${icon('chevRight', 13, 2.6)}</button>
        </div>
      </div>
    </div>`;
  }
  F.SHEETS['s-plans'] = () => {
    const O = planOffers(), on = S.sAddPlan;
    return `<div class="sheet s-goldsheet" role="dialog" aria-label="FRH membership plans"><div class="grab"></div>
      <div class="s-es-h"><span class="mid"><h2>FRH membership</h2><small>One year · VAT included · included visits are used first</small></span><button class="s-x" type="button" data-act="sheet-close" aria-label="Close">${icon('x', 15, 2.6)}</button></div>
      <div class="s-cmp">${O.list.map(x => `<div class="s-cmp-c ${x.t === (on || O.best) ? 'on' : ''}">
          <div class="s-cmp-h"><b>${x.info.name}</b>${x.t === O.best ? '<em class="s-plan-tag">Best for this cart</em>' : ''}<span>${aed0(x.info.price)} a year · ${esc(x.info.coverShort)}${x.save > 0 ? ` · saves ${aed0(x.save)} on this cart` : ''}</span></div>
          <ul>${x.info.services.map(v => `<li><b>${v.n}</b> ${esc(v.unit)}</li>`).join('')}${x.t !== 'silver' ? '<li><b>✓</b> No after-10 PM charge</li>' : ''}</ul>
          <button class="btn ${on === x.t ? 'btn-secondary' : 'btn-primary'} s-cmp-b" type="button" data-act="${on === x.t ? 'sheet-close' : 's-plan-add'}" data-t="${x.t}">${on === x.t ? 'Added to this order' : `Add ${x.info.name} to this order`}</button></div>`).join('')}</div>
    </div>`;
  };
  F.sCartTotal = () => withGold(() => totals().total);

  /* =====================================================================
     SERVICE DETAIL (S1–S13)
     ===================================================================== */
  let barShown = false;
  const badgeN = () => Math.max(0, F.cartCount() - (S.sFly || 0));
  const cartBtn = (cls, sz) => {
    const c = badgeN();
    return `<button class="${cls} s-cartbtn" type="button" data-act="s-gocart" aria-label="Cart, ${plural(c, 'item')}">${icon('cart', sz, 2)}${c ? `<i class="s-badge">${c}</i>` : ''}</button>`;
  };
  /* Final v20: one fact per idea in the summary (rating, when we can be there, how long it takes), so the tags
     and lines that repeated them (24/7, Home visit, Available now · ~45 min next to 30–45 min) are gone.
     Section tabs ride in the top bar once the summary scrolls away; the active tab follows the scroll. */
  let spyOn = '', spyLock = 0;
  const v20Bleed = () => (S.v20hero || 'bleed') === 'bleed';
  function factsOf(d, pr) {
    const a = String(d.avail || ''), m = /~\s?(\d+)\s?min/.exec(a), dur = pr.dose ? pr.dose.dur : String(d.dur || '');
    const rate = d.reviews ? { v: `${icon('starFill', 13)}${d.rating}`, l: `${d.reviews} reviews` } : { v: 'New', l: 'No reviews yet' };
    const when = d.id === 'tele' ? { v: '~15 min', l: 'On video in', live: true }
      : m && /now/i.test(a) ? { v: `~${m[1]} min`, l: 'Arrives in', live: true }
      : /on call/i.test(a) ? { v: 'Tonight', l: 'Night team on call', live: true }
      : /tomorrow/i.test(a) ? { v: 'Tomorrow', l: (/(\d{1,2}:\d{2}\s?[AP]M)/i.exec(a) || [0, ''])[1] ? `From ${(/(\d{1,2}:\d{2}\s?[AP]M)/i.exec(a))[1]}` : 'Next visit' }
      : /from\s+(\d{1,2}:\d{2}\s?[AP]M)/i.test(a) ? { v: 'Today', l: `From ${/from\s+(\d{1,2}:\d{2}\s?[AP]M)/i.exec(a)[1]}` }
      : { v: 'Today', l: d.cat === 'lab' ? 'Home sample' : 'Next visit' };
    const r = /^Results in (.+)$/i.exec(dur);
    const len = r ? { v: r[1], l: 'Results in' }
      : /request/i.test(dur) ? { v: 'Quoted', l: 'On the call' }
      : /×/.test(dur) ? { v: dur.replace(/\s/g, ''), l: 'Sessions' }
      : / at home$/i.test(dur) ? { v: dur.replace(/ at home$/i, ''), l: 'At home' }
      : { v: dur.replace(/^~/, ''), l: d.dosage ? 'Infusion' : d.cat === 'iv' ? 'Drip' : d.cat === 'nursing' ? 'Shift' : d.id === 'tele' ? 'Call' : 'Visit length' };
    return [rate, when, len];
  }
  /* v22: who comes, and who licenses them. The authority follows the visit address: DHA for Dubai;
     Sharjah stays neutral until FRH confirms its regulator's name. Ambulance has no line until FRH confirms. */
  function credOf(d) {
    const city = S.v22City || cityOf(addrBy(visitAddrId())), dxb = city === 'dubai', L = dxb ? 'DHA-licensed' : 'UAE-licensed';
    if (d.id === 'tele') return `${L} doctor, on video`;
    switch (d.cat) {
      case 'doctor': return `${L} doctor`;
      case 'iv': case 'nursing': case 'vaccine': return `${L} nurse`;
      case 'lab': return `Licensed nurse · ${dxb ? 'DHA-approved' : 'approved'} lab`;
      case 'physio': return `${L} physiotherapist`;
      case 'dentist': return `${L} dentist`;
      case 'nutrition': return `${L} dietitian`;
      case 'checkup': return `${L} nurse`;                  /* the description already says doctor review */
      default: return '';
    }
  }
  const v22Dubai = () => (S.v22City || cityOf(addrBy(visitAddrId()))) === 'dubai';
  /* the authority is named once, in the licence line (and Trust & safety); the rest of the copy just says licensed */
  const deDHA = t => String(t)
    .replace(/\b([aA]) DHA[- ]licensed FRH\b/g, '$1n FRH')
    .replace(/\.?\s*DHA-approved partner lab\./g, '.')
    .replace(/DHA[- ]approved/g, 'approved');
  const overTidy = t => deDHA(t).replace(/\b([aA]) DHA[- ]licensed /g, '$1 ').replace(/DHA[- ]licensed /g, '');
  const lineTidy = t => { const r = deDHA(t).replace(/DHA[- ]licensed/g, 'licensed'); return r.charAt(0).toUpperCase() + r.slice(1); };
  const trustFor = () => (v22Dubai() ? TRUST : TRUST.map(r => r[1] === 'DHA-licensed clinicians' ? ['shieldCheck', 'Licensed clinicians', 'Every doctor, nurse and therapist holds a current UAE licence. (Sharjah regulator to be confirmed by FRH.)'] : r));
  const faqFor = f => (v22Dubai() ? f : f.map(([q, a]) => [q, a.replace('a current DHA licence', 'a current UAE licence')]));
  const credLine = d => { const c = credOf(d); return c ? `<span class="v22-cred" data-r="cred">${icon('shieldCheck', 14, 2.4)}${c}</span>` : ''; };
  /* v21: what the headline price buys */
  const perOf = d => (d.id === 'amb' ? '' : d.id === 'family' ? 'for up to 4 people' : /×/.test(d.dur) ? 'per package' : d.cat === 'nursing' ? 'per shift' : 'per person');
  const factsRow = (d, pr) => `<div class="v20-facts" data-r="facts">${factsOf(d, pr).map(c => `<div class="v20-f"><b>${c.live ? '<i class="v20-live"></i>' : ''}${c.v}</b><small>${c.l}</small></div>`).join('')}</div>`;
  const v20Tabs = d => [d.dosage && ['dose', 'Dosage'], ['over', 'Overview'], ['inc', 'Included'], ['how', 'How it works'], d.addons.length && ['add', 'Add-ons'], d.reviews && ['rev', 'Reviews'], ['faq', 'FAQs']].filter(Boolean);
  const tabsRow = d => { const t = v20Tabs(d), on = t.some(x => x[0] === spyOn) ? spyOn : t[0][0];
    return `<nav class="v20-tabs" data-r="tabs" aria-label="Jump to a section">${t.map(([k, l]) => `<button class="v20-tab ${k === on ? 'on' : ''}" type="button" data-act="v20-jump" data-to="${k}"${k === on ? ' aria-current="true"' : ''}>${l}</button>`).join('')}</nav>`; };
  function forPill(d) {
    const label = esc(forLabel(d.id));
    return `<button class="v20-for" type="button" data-r="for" data-act="s-for" aria-label="Who is this for: ${label}"><small>For</small><b>${label}</b>${icon('chevDown', 14, 2.4)}</button>`;
  }

  F.SCREENS.service = {
    status: 'light', cls: 'service s-service',
    render() {
      const d = svcDetail(S.svc || 'gp'), sel = selOf(d.id), pr = svcPrice(d, sel), cov = svcCov(d.id);
      const dur = pr.dose ? pr.dose.dur : d.dur;
      const hidden = d.included.length - 4, cut = hidden >= 2 && !sel.inc;   /* S5: truncate only when 2+ are hidden */
      const inc = cut ? d.included.slice(0, 4) : d.included;
      const flash = sel.flash && Date.now() < sel.flash;
      const more = (t, label, open) => `<button class="s-more" type="button" data-act="s-more" data-t="${t}" aria-expanded="${open}">${open ? 'Show less' : label}${icon(open ? 'chevUp' : 'chevDown', 15, 2.4)}</button>`;
      const bleed = v20Bleed(), cat = catOf(d.cat).name;
      const people = forOf(d.id).length, sigNow = sigOf(d.id, sel) + '|' + forOf(d.id).join(',');
      const added = !!(sel.addedKey && byKey(sel.addedKey) && sel.addedSig === sigNow);   /* v21: this exact choice is already in the cart */
      return `<div class="b-topbar v20-topbar ${barShown ? 'show' : ''}" data-r="top"><div class="v20-trow"><button class="nav-btn" type="button" data-act="back-svc" aria-label="Back">${icon('arrowLeft', 19, 2)}</button><span>${d.name}</span>${added ? `<button class="nav-btn" type="button" data-act="s-share" aria-label="Share">${icon('share', 17, 2)}</button>` : cartBtn('nav-btn', 18)}</div>${tabsRow(d)}</div>
      <div class="scr-body" data-rc="body">
        <div class="b-hero ${bleed ? 'v20-bleed' : ''}" data-rc="hero"><img data-r="img" src="${img(d.img)}" alt="">
          ${bleed ? `<div class="v20-hcap" data-r="hcap"><span class="v20-eyebrow">${cat}</span><h1 class="h1">${d.name}</h1>${credLine(d)}</div>` : ''}
          <div class="b-hero-top" data-r="ht"><button class="icon-btn" type="button" data-act="back-svc" aria-label="Back">${icon('arrowLeft', 19, 2)}</button>
            <span class="s-hacts"><button class="icon-btn" type="button" data-act="s-share" aria-label="Share">${icon('share', 18, 2)}</button>${added ? '' : cartBtn('icon-btn', 19)}</span></div></div>
        <div class="b-sheet" data-rc="sheet"><div class="b-pad" data-rc="pad">

          <div class="s-sum v20-sum ${bleed ? 'bleed' : ''}" data-r="sum">
            ${bleed ? '' : `<span class="v20-eyebrow">${cat}</span><h1 class="h1">${d.name}</h1>${credLine(d)}`}
            <p class="s-desc">${d.desc}</p>
            ${factsRow(d, pr)}
            <div class="v20-buy" data-r="buy">
              <div class="v20-pd">${cov ? inclTag(d.id) : `<b>${tk('svc-unit', pr.unit, '0')}</b>${perOf(d) ? `<small>${perOf(d)}</small>` : ''}${d.was && !d.dosage ? `<s class="s-was">${aed0(d.was)}</s><span class="pill red">Save ${Math.round((1 - d.price / d.was) * 100)}%</span>` : ''}`}</div>
            </div>
            ${!cov && (people > 1 || pr.adds.length) ? `<p class="v21-pp" data-r="pp"><b>${tk('svc', pr.total * people, '0')}</b> ${people > 1 ? `for ${people} people` : 'in total'}${pr.adds.length ? ` · with ${plural(pr.adds.length, 'add-on')}` : ''}</p>` : ''}
          </div>

          ${d.dosage ? `<div class="s-sec" data-r="dose" id="s-dose">
            <div class="sec-h"><h4>Dosage</h4><span class="s-secx">${pr.dose.dur} infusion</span></div>
            <div class="s-pills" role="radiogroup" aria-label="Dosage">${d.dosage.options.map((o, i) => `<button class="s-pillbtn ${sel.dose === i ? 'on' : ''}" type="button" role="radio" aria-checked="${sel.dose === i}" data-act="s-dose" data-i="${i}"><b>${o.name}</b><small>${aed0(o.price)}</small></button>`).join('')}</div>
            <div class="flag-note">${icon('alert', 14, 2.2)}<span>${d.dosage.note}</span></div>
          </div>` : ''}

          <div class="s-sec" data-r="over"><div class="sec-h"><h4>Overview</h4></div><p class="s-over">${d.over}</p></div>

          <div class="s-sec" data-r="inc"><div class="sec-h"><h4>What’s included</h4></div>
            ${V24F[d.id] ? v24Inc(d.id) : `${d.inShort && d.inShort !== d.included[0] ? `<p class="s-inshort">${d.inShort}</p>` : ''}
            <div class="b-list">${inc.map(i => `<div>${icon('check', 16, 2.6)}<span>${i}</span></div>`).join('')}</div>
            ${hidden >= 2 ? more('inc', `View ${hidden} more`, sel.inc) : ''}`}</div>

          <div class="s-sec" data-r="how"><div class="sec-h"><h4>How it works</h4></div>
            ${v27How(d)}</div>

          ${d.addons.length ? `<div class="s-sec" data-r="add"><div class="sec-h"><h4>Add to your drip</h4><span class="s-secx">Optional</span></div>
            ${d.addons.map(a => { const on = sel.addons.includes(a.id); return `<div class="s-addon ${on ? 'on' : ''}"><span class="tile">${icon(a.ic || 'plus', 18, 2)}</span>
              <span class="mid"><b>${a.name}</b><small>${a.note}</small><span class="s-ap">+${aed0(a.price)}</span></span>
              <button class="s-tog ${on ? 'on' : ''}" type="button" data-act="s-addon" data-id="${a.id}" aria-pressed="${on}">${on ? icon('check', 14, 3) + ' Added' : icon('plus', 14, 2.6) + ' Add'}</button></div>`; }).join('')}
          </div>` : ''}

          <div class="s-sec" data-r="trust"><div class="sec-h"><h4>Trust &amp; safety</h4></div>
            <div class="info-card s-trust">${trustFor().map(([ic, t, s]) => `<div class="info-row"><span class="tile">${icon(ic, 17, 2)}</span><div class="ir-mid"><b>${t}</b><small>${s}</small></div></div>`).join('')}</div></div>

          ${d.reviews ? `<div class="s-sec" data-r="rev"><div class="sec-h"><h4>Reviews</h4></div>
            ${v29Reviews(d)}
          </div>` : ''}

          <div class="s-sec" data-r="faq"><div class="sec-h"><h4>FAQs</h4></div>
            ${d.faqs.map(([q, a], i) => `<div class="acc ${sel.faq === i ? 'open' : ''}"><button class="acc-head" type="button" data-act="s-faq" data-i="${i}" aria-expanded="${sel.faq === i}"><b>${q}</b>${icon('chevDown', 18, 2.2)}</button><div class="acc-body">${a}</div></div>`).join('')}
          </div>

          ${v32Cta(d)}

          ${d.similar.length ? `<div class="s-sec" data-r="sim"><div class="sec-h"><h4>Similar services</h4></div>
            <div class="hrow">${d.similar.map(id => { const s = findSvc(id), x = svcDetail(id); return `<button class="b-sim" type="button" data-act="open-svc" data-id="${id}"><img src="${img(x.img)}" alt=""><b>${s.name}</b>
              <span class="s-simr">${x.reviews ? `${icon('starFill', 12)} ${x.rating} <em>(${x.reviews})</em>` : '<em>New</em>'}</span><span${svcCov(id) ? ' class="s-simi"' : ''}>${svcCov(id) ? 'Included' : aed0(s.price)}${!svcCov(id) && wasOf(id) ? ` <s>${aed0(wasOf(id))}</s>` : ''}</span></button>`; }).join('')}</div>
          </div>` : ''}
        </div></div>
      </div>
      <div class="scr-foot s-sfoot ${added ? 'v21-in' : ''}" data-r="foot">
        ${added ? `<div class="v21-est" data-r="est"><span>Estimated total<small>${plural(new Set(cart().map(grpOf)).size, 'visit')} in your cart</small></span><b>${tk('cart-est', totals().total, '2')}</b></div>` : ''}
        <div class="s-sbar">${added
          ? `<button class="btn btn-secondary s-addbtn v21-added" type="button" data-act="v21-unadd" aria-pressed="true" aria-label="Added to cart. Tap to remove">${icon('check', 16, 2.8)} Added</button>
             <button class="btn btn-primary" type="button" data-act="s-gocart">Go to cart ${icon('arrowRight', 16, 2.4)}</button>`
          : `<button class="btn btn-secondary s-addbtn" type="button" data-act="s-add">Add to cart</button>
             <button class="btn btn-primary" type="button" data-act="s-book">Book now</button>`}</div></div>`;
    },
    mount(n) {
      const body = n.querySelector('.scr-body');
      if (!body) return;
      if (S.sScrollTo === 'dose') {
        S.sScrollTo = null;
        const el = n.querySelector('#s-dose');
        if (el) body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - V20_BAR - 12);
      }
      /* v20: the bar (with section tabs) comes in once the summary has scrolled under it */
      const top0 = () => offTop(body, n);
      /* v21: the bar takes over once the page title (on the photo or in the card) slides under it, like an iOS large title */
      const sumEnd = () => { const m = n.querySelector('.v20-hcap .h1') || n.querySelector('.v20-sum .h1') || n.querySelector('[data-r="sum"]'); return m ? offTop(m, n) - top0() + m.offsetHeight - V20_BAR : 165; };
      const f = () => {
        const on = body.scrollTop > sumEnd();
        if (on !== barShown) { barShown = on; const b = n.querySelector('.b-topbar'); if (b) b.classList.toggle('show', on); if (F.setStatus && n === F.cur()) F.setStatus(on ? 'dark' : 'light'); }
        if (Date.now() < spyLock) return;
        const keys = [...n.querySelectorAll('.v20-tab')].map(t => t.dataset.to);
        let cur = keys[0];
        keys.forEach(k => { const el = n.querySelector(`[data-r="${k}"]`); if (el && offTop(el, n) - top0() - V20_BAR - 24 <= body.scrollTop) cur = k; });
        if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) cur = keys[keys.length - 1];   /* the last section can't reach the top */
        if (cur && cur !== spyOn) { spyOn = cur; markTab(n); }
      };
      body.addEventListener('scroll', f, { passive: true });
      barShown = false; spyOn = ''; f();
      ticks(n, true);
    },
    update: patch,
  };
  const offTop = (el, root) => { let y = 0, x = el; while (x && x !== root) { y += x.offsetTop; x = x.offsetParent; } return y; };
  const V20_BAR = 138;                                     /* height of the top bar with its tab row */
  function markTab(n) {
    const row = n.querySelector('.v20-tabs');
    if (!row) return;
    row.querySelectorAll('.v20-tab').forEach(t => { const on = t.dataset.to === spyOn; t.classList.toggle('on', on); if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    const t = row.querySelector('.v20-tab.on');                /* keep the active tab in view, scrolling only the tab row */
    if (t) { const l = t.offsetLeft - 16, r = t.offsetLeft + t.offsetWidth + 16; if (l < row.scrollLeft) row.scrollLeft = l; else if (r > row.scrollLeft + row.clientWidth) row.scrollLeft = r - row.clientWidth; }
  }
  F.ACT['v20-jump'] = btn => {
    const n = F.cur(), body = n && n.querySelector('.scr-body'), el = n && n.querySelector(`[data-r="${btn.dataset.to}"]`);
    if (!body || !el) return;
    spyOn = btn.dataset.to; spyLock = Date.now() + 900; markTab(n);
    const y = Math.max(0, offTop(el, n) - offTop(body, n) - V20_BAR - 12);
    body.scrollTo({ top: y, behavior: 'smooth' });
  };

  /* Final v23: no "Who is this for" on the service page. It adds the visit for the account holder;
     the cart is where the patient is changed and more people are added (one visit, person blocks). */
  const forOf = () => [selfId()];
  const forLabel = id => {
    const ids = forOf(id), first = p => (p.self ? `${p.name.split(' ')[0]} (you)` : p.name.split(' ')[0]);
    return ids.length === 1 ? first(patBy(ids[0])) : ids.length === 2 ? ids.map(x => first(patBy(x))).join(' & ') : `${first(patBy(ids[0]))} + ${ids.length - 1} more`;
  };
  const updown = `<span class="s-ud">${icon('chevUp', 11, 2.6)}${icon('chevDown', 11, 2.6)}</span>`;
  function forRow(d) {
    return `<button class="s-optrow" type="button" data-r="for" data-act="s-for"><span class="s-ol">For</span><b>${esc(forLabel(d.id))}</b>${updown}</button>`;
  }
  F.SHEETS['s-for'] = () => {
    const d = svcNow(), ids = forOf(d.id), pr = svcPrice(d, selOf(d.id));
    return `<div class="sheet s-forsheet" role="dialog" aria-label="Who is this for"><div class="grab"></div>
      <div class="s-fs-h"><h2>Who is this for?</h2><button class="s-x" type="button" data-act="sheet-close" aria-label="Close">${icon('x', 15, 2.6)}</button></div>
      <p class="s-fs-sub">Everyone you pick is seen in the same visit, at the same address and time.</p>
      <div class="s-fs-list">${pats().map(p => { const on = ids.includes(p.id); return `<button class="s-fs-row ${on ? 'on' : ''}" type="button" data-act="s-for-pick" data-v="${esc(p.id)}" role="checkbox" aria-checked="${on}"><span class="s-av">${initials(p.name)}</span>
        <span class="mid"><b>${esc(p.name)}</b><small>${p.self ? 'You' : esc(p.rel)}${p.age ? ` · ${p.age} yrs` : ''}</small></span><span class="s-chk">${on ? icon('check', 13, 3) : ''}</span></button>`; }).join('')}
        <button class="s-fs-row add" type="button" data-act="s-for-add"><span class="s-av add">${icon('plus', 15, 2.6)}</span><span class="mid"><b>Add a family member</b></span></button></div>
      <button class="btn btn-primary s-fs-done" type="button" data-act="sheet-close">Done · ${aed(pr.total * ids.length)}</button></div>`;
  };

  /* fly a dot from the button to the cart icon, then bump the badge */
  function flyToCart(fromSel) {
    const n = F.cur(), from = n && n.querySelector(fromSel);
    const to = n && (barShown ? n.querySelector('.b-topbar .s-cartbtn') : n.querySelector('.b-hero-top .s-cartbtn'));
    if (!n || !from || !to) return false;
    const sc = F.scale || 1, R = n.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const x0 = (a.left + a.width / 2 - R.left) / sc, y0 = (a.top + a.height / 2 - R.top) / sc;
    const x1 = (b.left + b.width / 2 - R.left) / sc, y1 = (b.top + b.height / 2 - R.top) / sc;
    const d0 = svcDetail(S.svc || 'gp');
    const dot = document.createElement('img');
    dot.src = img(d0.img); dot.alt = '';
    dot.className = 's-fly s-fly-img';
    dot.style.left = (x0 - 9) + 'px'; dot.style.top = (y0 - 9) + 'px';
    n.appendChild(dot);
    void dot.offsetWidth;
    dot.style.transform = `translate(${x1 - x0}px, ${y1 - y0}px) scale(.55)`;
    dot.style.opacity = '.85';
    return dot;
  }

  /* =====================================================================
     CART (S14–S31)
     ===================================================================== */
  const EMPTY_ILL = `<svg class="s-ill" width="168" height="124" viewBox="0 0 168 124" aria-hidden="true">
    <ellipse cx="84" cy="114" rx="58" ry="7" fill="#F4E6E3"/><circle cx="84" cy="58" r="52" fill="#FFF4F3"/>
    <circle cx="132" cy="22" r="6" fill="#FFE4E1"/><circle cx="34" cy="34" r="4" fill="#FFC9C4"/>
    <path d="M46 38h11l9 40h38l9-30H62" fill="none" stroke="#D71F32" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="72" cy="91" r="6" fill="#D71F32"/><circle cx="100" cy="91" r="6" fill="#D71F32"/>
    <g fill="#FF9E96"><rect x="83" y="52" width="6" height="18" rx="3"/><rect x="77" y="58" width="18" height="6" rx="3"/></g></svg>`;
  const CHIPS = ['Fever', 'Cough & cold', 'Stomach pain', 'Back pain', 'Follow-up', 'Fatigue'];
  const ID_OPTS = [
    { k: 'eid', ic: 'shieldCheck', t: 'Emirates ID on file', s: '784-••••-•••••47-3 · verified', v: 'Emirates ID on file', self: true },
    { k: 'scan', ic: 'idcard', t: 'Scan Emirates ID', s: 'Front and back, with the camera', v: 'Emirates ID scanned' },
    { k: 'pass', ic: 'file', t: 'Upload passport', s: 'Photo page, for visitors to the UAE', v: 'Passport uploaded' },
  ];
  const steps = n => `<div class="b-steps s-steps" data-r="steps" aria-label="Step ${n} of 3">${['Cart', 'Pay', 'Done'].map((s, i) => `<span class="${i + 1 === n ? 'on' : i + 1 < n ? 'done' : ''}">${i + 1 < n ? icon('check', 12, 3) : i + 1}<b>${s}</b></span>`).join('')}</div>`;
  const isOpen = (i, row) => !!S.sOpen && S.sOpen.k === i.key && S.sOpen.row === row;
  const noteOf = b => [...(b.chips || []), (b.note || '').trim()].filter(Boolean).join(', ');

  const fmtMin = m => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
  const first = n => String(n || '').split(' ')[0];
  const v43m = () => S.v43addr || 'b';   /* v43 options: a per-person row · b stops · c own visit */
  const stopTime = i => { const w = bk(i).when; return !w ? '' : w.mode === 'asap' ? `about ${fmtMin(45 + (w.off || 0))}` : `${bk(i).stop ? 'about ' : ''}${fmtH(w.h)}`; };
  function whenHtml(i, b) {
    if (!b.when) return '<span class="s-ph">Choose a date and time</span>';
    const t = b.when.mode === 'asap' ? `As soon as possible · about ${isTele(i) ? '15 min' : fmtMin(45 + (b.when.off || 0))}` : `${dayShort(b.when.d)} · ${fmtH(b.when.h)}`;
    return b.gone ? `<s>${t}</s>` : t;
  }
  function rowsOf(i) {
    const b = bk(i), p = patBy(b.pat), a = addrBy(b.addr), un = unav(i);
    const r = [['pat', 'users', `For <b>${esc(p.name.split(' ')[0])}</b> (${esc(relOf(p))})`, '']];
    if (isTele(i)) {
      const o = ID_OPTS.find(x => x.k === b.idDoc);
      r.push(['id', 'idcard', o ? `${o.v} <span class="s-ok">${icon('check', 11, 3)}</span>` : '<span class="s-ph warn">Add Emirates ID or passport</span>', o ? '' : 'warn']);
    } else {
      r.push(['addr', addrIc(a), a ? esc(shortLine(a)) : '<span class="s-ph">Choose an address</span>', un ? 'warn' : '']);
    }
    r.push(['when', 'clock', whenHtml(i, b), b.gone ? 'warn' : '']);
    const nt = noteOf(b);
    r.push(['note', 'note', nt ? esc(nt) : '<span class="s-ph">Add a health note</span><span class="s-optl">Optional</span>', '']);
    return r;
  }

  function panel(i, row) {
    const b = bk(i), k = i.key;
    /* every top-level child is keyed (data-r) so a pick only repaints what changed */
    if (row === 'paddr' || row === 'stopwho') {
      /* v43: where one person in a group visit will be (a, b), or where their own visit goes (c) */
      const g = cart().filter(x => x.grp === i.grp), L = g[0], la = addrBy(bk(L).addr), lead = first(patBy(bk(L).pat).name);
      if (row === 'stopwho') {
        return `<p class="s-hint" data-r="hint">${icon('pin', 13, 2.2)} Pick who it is, then choose the address.</p>
          ${g.slice(1).map(x => { const p = patBy(bk(x).pat), a = addrBy(bk(x).addr);
            return `<button class="s-opt" type="button" data-r="o-${x.key}" data-act="v43-who" data-k="${x.key}"><span class="s-av">${initials(p.name)}</span>
              <span class="mid"><b>${esc(p.name)}</b><small>${bk(x).own && a ? `At ${esc(a.label)} · stop ${bk(x).stop + 1}` : `With ${esc(lead)} at ${la ? esc(la.label) : 'the visit address'}`}</small></span><span class="v43-go">${icon('chevRight', 15, 2.4)}</span></button>`; }).join('')}
          <p class="v43-foot" data-r="foot">Everyone moving? Change the visit address instead.</p>`;
      }
      const split = v43m() === 'c', all = !!(S.sOpen && S.sOpen.all);
      const mates = id => g.filter(x => bk(x).addr === id && x.key !== i.key).map(x => esc(first(patBy(bk(x).pat).name)));
      const stopOf = id => { const x = g.find(y => bk(y).addr === id); return x ? bk(x).stop : -1; };
      return `${split ? `<p class="s-hint" data-r="hint">${icon('calendar', 13, 2.2)} ${esc(first(patBy(b.pat).name))} gets a separate visit with its own time. The price stays the same.</p>`
        : `<button class="s-opt ${b.own ? '' : 'on'}" type="button" data-r="o-same" data-act="v43-paddr" data-k="${k}" data-v="" role="radio" aria-checked="${!b.own}"><span class="s-ai">${xi('users', 16, 2)}</span>
          <span class="mid"><b>${all ? `Back to stop 1` : `Same address as ${esc(lead)}`}</b><small>${la ? `${esc(la.label)} · ${esc(shortLine(la))}` : 'The visit address'}</small></span><span class="radio"></span></button>
        <div class="s-or" data-r="or">or somewhere else</div>`}
        ${addrs().filter(a => !la || a.id !== la.id).map(a => {
          const ok = covers(a), c = cityOf(a), off = ok && offIn(c).includes(i.cat), on = b.own && b.addr === a.id, st = split ? -1 : stopOf(a.id), w = mates(a.id);
          return `<button class="s-opt ${on ? 'on' : ''} ${ok ? '' : 'dis'}" type="button" data-r="o-${esc(a.id)}" data-act="v43-paddr" data-k="${k}" data-v="${esc(a.id)}" role="radio" aria-checked="${on}"><span class="s-ai">${xi(addrIc(a), 16, 2)}</span>
            <span class="mid"><b>${esc(a.label)}</b><small>${esc(a.line)}</small>
            ${st > 0 && w.length ? `<em class="v43-with">Stop ${st + 1} · with ${w.join(', ')}</em>` : ''}
            ${!ok ? `<em class="s-cov">Not covered yet · coming soon to ${CITY[c]}</em>` : off ? `<em class="s-cov">${esc(catOf(i.cat).name)} isn’t offered in ${CITY[c]} yet</em>` : ''}</span><span class="radio"></span></button>`;
        }).join('')}
        <button class="s-opt add" type="button" data-r="o-add" data-act="s-add-addr" data-k="${k}"><span class="s-ai add">${icon('plus', 15, 2.6)}</span>Add new address</button>
        ${split ? '' : `<p class="v43-foot" data-r="foot">${icon('clock', 12, 2.2)} The team goes on to this address after ${la ? esc(la.label) : 'the first one'}. Each address is booked as its own visit.</p>`}`;
    }
    if (row === 'pat') {
      const taken = i.grp ? cart().filter(x => x.grp === i.grp && x.key !== i.key).map(x => bk(x).pat) : [];
      return `${pats().map(p => `<button class="s-opt ${b.pat === p.id ? 'on' : ''} ${taken.includes(p.id) ? 'dis' : ''}" type="button" data-r="o-${esc(p.id)}" data-act="s-pat" data-k="${k}" data-v="${esc(p.id)}" role="radio" aria-checked="${b.pat === p.id}"><span class="s-av">${initials(p.name)}</span>
          <span class="mid"><b>${esc(p.name)}</b><small>${p.self ? 'You' : esc(p.rel)}${p.age ? ` · ${p.age} yrs` : ''}${p.gender ? ` · ${esc(p.gender)}` : ''}</small>${taken.includes(p.id) ? '<em class="s-cov">Already in this visit</em>' : ''}</span><span class="radio"></span></button>`).join('')}
        <button class="s-opt add" type="button" data-r="o-add" data-act="s-add-pat" data-k="${k}"><span class="s-av add">${icon('plus', 15, 2.6)}</span>Add patient</button>`;
    }
    if (row === 'addr') {
      return `${addrs().map(a => {
        const ok = covers(a), c = cityOf(a), off = ok && offIn(c).includes(i.cat);
        return `<button class="s-opt ${b.addr === a.id ? 'on' : ''} ${ok ? '' : 'dis'}" type="button" data-r="o-${esc(a.id)}" data-act="s-addr" data-k="${k}" data-v="${esc(a.id)}" role="radio" aria-checked="${b.addr === a.id}"><span class="s-ai">${xi(addrIc(a), 16, 2)}</span>
          <span class="mid"><b>${esc(a.label)}${a.dflt ? ' <span class="pill ink">Default</span>' : ''}</b><small>${esc(a.line)}</small>
          ${!ok ? `<em class="s-cov">Not covered yet · coming soon to ${CITY[c]}</em>` : off ? `<em class="s-cov">${esc(catOf(i.cat).name)} isn’t offered in ${CITY[c]} yet</em>` : ''}</span><span class="radio"></span></button>`;
      }).join('')}
        <button class="s-opt add" type="button" data-r="o-add" data-act="s-add-addr" data-k="${k}"><span class="s-ai add">${icon('plus', 15, 2.6)}</span>Add new address</button>`;
    }
    if (row === 'id') {
      const self = patBy(b.pat).self;
      return `<p class="s-hint" data-r="hint">${icon('shieldCheck', 13, 2.2)} The doctor confirms who they’re treating before a video consultation.</p>
        ${ID_OPTS.filter(o => self || !o.self).map(o => `<button class="s-opt ${b.idDoc === o.k ? 'on' : ''}" type="button" data-r="o-${o.k}" data-act="s-id" data-k="${k}" data-v="${o.k}" role="radio" aria-checked="${b.idDoc === o.k}"><span class="s-ai">${xi(o.ic, 16, 2)}</span>
          <span class="mid"><b>${o.t}</b><small>${o.s}</small></span><span class="radio"></span></button>`).join('')}`;
    }
    if (row === 'when') {
      const w = b.when, asap = w && w.mode === 'asap';
      const pd = b.pick !== undefined ? b.pick : w && w.mode === 'slot' ? w.d : 0;
      const hs = HOURS.filter(h => !isPast(pd, h));
      return `<button class="s-asap ${asap ? 'on' : ''}" type="button" data-r="asap" data-act="s-asap" data-k="${k}"><span class="tile green">${xi('clock', 17, 2.2)}</span>
          <span class="mid"><b>As soon as possible</b><small>${isTele(i) ? 'Next free doctor · about 15 min' : 'Next free team · about 45 min'}</small></span><span class="pill green live"><i></i>Now</span></button>
        <div class="s-or" data-r="or">or pick a time</div>
        <div class="s-dates" data-r="dates">${[0, 1, 2, 3, 4, 5, 6].map(d => { const x = dayOf(d); return `<button class="date-chip ${pd === d ? 'on' : ''}" type="button" data-act="s-date" data-k="${k}" data-d="${d}" aria-pressed="${pd === d}"><small>${d === 0 ? 'Today' : d === 1 ? 'Tom' : WD[x.getDay()]}</small><b>${x.getDate()}</b><span>${MO[x.getMonth()]}</span></button>`; }).join('')}</div>
        <div class="s-slots" data-r="slots">${hs.length ? hs.map(h => { const full = isFull(pd, h), on = !asap && w && w.d === pd && w.h === h && !b.gone;
          return `<button class="slot ${on ? 'on' : ''} ${full ? 'full' : ''}" type="button" ${full ? 'disabled aria-disabled="true"' : `data-act="s-slot" data-k="${k}" data-h="${h}"`}>${fmtH(h).replace(':00', '')}${full ? '<small>Full</small>' : ''}</button>`; }).join('') : '<p class="s-none">No times left today. Pick another day.</p>'}</div>
        ${i.night ? `<p class="s-hint" data-r="hint">${icon('clock', 13, 2.2)} ${nightFree(i) ? `No after-10 PM charge on your ${esc(tierNow().name)} plan.` : `Doctor visits from 10 PM add ${aed(i.night)}.`}</p>` : ''}`;
    }
    const f = S.focus === 's-note' && S.sNoteKey === k;
    return `<div class="b-chips" data-r="chips">${CHIPS.map(c => `<button class="b-chip ${(b.chips || []).includes(c) ? 'on' : ''}" type="button" data-act="s-chip" data-k="${k}" data-c="${c}" aria-pressed="${(b.chips || []).includes(c)}">${c}</button>`).join('')}</div>
      <div class="s-notebox ${f ? 'focus' : ''} ${b.note ? '' : 'empty'}" data-r="box" data-act="s-nfocus" data-k="${k}" data-kbf role="textbox" aria-label="Describe the problem">${b.note ? esc(b.note) : f ? '' : 'Anything else the clinician should know?'}${f ? '<span class="caret"></span>' : ''}</div>
      <div class="s-row2" data-r="nf"><span class="s-hint">${icon('lock', 12, 2.2)} Only your care team sees this.</span><button class="mini-btn" type="button" data-act="s-ndone" data-k="${k}">Done</button></div>`;
  }

  function itemCard(i) {
    const b = bk(i), cat = catOf(i.cat), un = unav(i), cov = itemCov(i), x = cov ? 0 : extraOf(i), need = needOf(i);
    const flash = S.sFlash === i.key;
    return `<div class="b-item s-item s-anim ${un ? 'unav' : ''} ${b.gone ? 'gone' : ''} ${flash ? 's-flash' : ''}" data-rc="it-${i.key}" data-key="${i.key}">
      <div class="s-ih" data-r="h"><span class="tile">${icon(cat.icon, 19, 2)}</span>
        <span class="mid"><b>${esc(i.name)}</b><small>${esc(i.sub)} · ${esc(i.dur)}</small>${i.opts ? `<small class="s-opts">${esc(i.opts)}</small>` : ''}
          ${i.split ? `<small class="s-ppl v43-from">${icon('pin', 11, 2.4)} Separate from ${esc(i.split.from)}’s visit</small>` : ''}</span>
        <span class="s-pr">${cov ? `${inclTag(i.id, true)}<s>${aed(i.price)}</s>` : `<b>${aed(i.price)}</b>`}${x ? `<small>+ ${aed(x)} after 10 PM</small>` : ''}</span></div>
      <div class="s-rows" data-rc="rows">${rowsOf(i).map(([row, ic, html, st]) => {
        const op = isOpen(i, row);
        return `<button class="s-row ${op ? 'on' : ''} ${st}" type="button" data-r="${row}" data-act="s-row" data-k="${i.key}" data-row="${row}" aria-expanded="${op}"><span class="s-ri">${xi(ic, 16, 2)}</span><span class="s-rv">${html}</span><span class="s-rc">${icon('chevDown', 15, 2.4)}</span></button>
          `;
      }).join('')}</div>
      ${un ? `<div class="s-flag bad s-anim" data-r="fl-un"><span class="s-fi">${icon('pin', 17, 2.2)}</span>
          <span class="mid"><b>Not available at this address</b><small>${esc(i.name)} isn’t offered in ${un === 'none' ? 'this area' : un} yet.</small></span>
          <button class="mini-btn ghost" type="button" data-act="s-row" data-k="${i.key}" data-row="addr" data-force="1">Change</button></div>` : ''}
      ${b.gone ? `<div class="s-flag warn s-anim" data-r="fl-gone"><span class="s-fi">${icon('clock', 17, 2.2)}</span>
          <span class="mid"><b>${b.when && b.when.mode === 'slot' ? fmtH(b.when.h) : 'That time'} was just taken</b><small>Someone booked it while this was in your cart.</small></span>
          <button class="mini-btn" type="button" data-act="s-row" data-k="${i.key}" data-row="when" data-force="1">Change time</button></div>` : ''}
      <div class="foot s-ifoot" data-r="f">${need ? `<span class="s-need">${icon('alert', 13, 2.4)} ${need.t}</span>` : `<span class="s-ready">${icon('check', 13, 3)} Ready to book</span>`}
        <button class="s-rmv" type="button" data-act="s-rm" data-k="${i.key}" aria-label="Remove ${esc(i.name)}">${xi('trash', 14, 2)} Remove</button></div>
      <button class="s-dup" type="button" data-r="dup" data-act="s-dup" data-k="${i.key}"><span class="s-dupi">${icon('plus', 13, 2.8)}</span><span class="mid">Add for another person</span><b>+ ${aed(i.price)}</b></button>
    </div>`;
  }

  function groupCard(g) {
    const L = g[0], b = bk(L), cat = catOf(L.cat), un = unav(L), m = coverMap(), n = g.length;
    const need = g.map(needOf).find(Boolean), flash = S.sFlash === L.key;
    const total = g.reduce((t, x) => t + (itemCov(x, m) ? 0 : x.price), 0);
    const rowBtn = (i, [row, ic, html, st]) => {
      const op = isOpen(i, row);
      return `<button class="s-row ${op ? 'on' : ''} ${st}" type="button" data-r="${row}" data-act="s-row" data-k="${i.key}" data-row="${row}" aria-expanded="${op}"><span class="s-ri">${xi(ic, 16, 2)}</span><span class="s-rv">${html}</span><span class="s-rc">${icon('chevDown', 15, 2.4)}</span></button>
        `;
    };
    /* v43: where everyone is. a = an address row on each person, b = numbered stops, c = a separate visit */
    const mode = v43m(), stops = [];
    g.forEach(i => { const s = bk(i).stop || 0; (stops[s] = stops[s] || []).push(i); });
    const nS = stops.filter(Boolean).length, lead = esc(first(patBy(b.pat).name));
    const paddr = i => {
      const pb = bk(i), a = addrBy(pb.addr);
      return rowBtn(i, ['paddr', pb.own ? addrIc(a) : 'pin', pb.own && a ? `<span class="v43-two"><b>${esc(a.label)}</b> · ${esc(shortLine(a))}<small>Stop ${pb.stop + 1} · ${stopTime(i)}</small></span>`
        : `<span class="v43-same">Same address as ${lead}</span>`, (pb.own ? 'v43-own ' : '') + (unav(i) ? 'warn' : '')]);
    };
    const route = () => `<div class="v43-route" data-rc="route">${stops.map((ps, n) => {
        const a = addrBy(bk(ps[0]).addr), names = ps.map(x => esc(first(patBy(bk(x).pat).name))).join(', ');
        return `<button class="v43-stop" type="button" data-r="st-${n}" ${n ? `data-act="v43-stop" data-k="${ps[0].key}"` : `data-act="s-row" data-k="${L.key}" data-row="addr"`}>
          <span class="v43-sn">${n + 1}</span><span class="mid"><b>${a ? `${esc(a.label)} <span>· ${esc(shortLine(a))}</span>` : 'Choose an address'}</b>
          <small>${icon('users', 11, 2.4)} ${names} · ${stopTime(ps[0])}</small></span><span class="s-rc">${icon('chevRight', 15, 2.4)}</span></button>`;
      }).join('')}</div>`;
    const another = () => `<button class="v43-more" type="button" data-r="more" data-act="v43-stopwho" data-k="${L.key}"><span class="v43-sn add">${icon('plus', 11, 3)}</span><span class="mid">Someone at another address?</span>${icon('chevRight', 14, 2.4)}</button>`;
    const shared = () => {
      const rs = rowsOf(L).filter(r => r[0] === 'addr' || r[0] === 'when');
      if (mode !== 'b' || rs.length < 2) return rs.map(r => rowBtn(L, r)).join('');
      if (nS < 2) return `${rowBtn(L, rs[0])}${another()}${rowBtn(L, rs[1])}`;
      return `${route()}${another()}${rowBtn(L, [rs[1][0], rs[1][1], `${rs[1][2]}<span class="v43-t"> · first stop</span>`, rs[1][3]])}`;
    };
    const person = (i, k) => {
      const cov = itemCov(i, m), x = cov ? 0 : extraOf(i);
      const rows = rowsOf(i).filter(r => r[0] === 'pat' || r[0] === 'id' || r[0] === 'note').map(r => rowBtn(i, r));
      if (mode === 'a' && k > 0 && !isTele(i)) rows.splice(1, 0, paddr(i));
      return `<div class="s-person ${S.sFlash === i.key ? 's-flash' : ''}" data-rc="pp-${i.key}" data-key="${i.key}">
        <div class="s-pp-h" data-r="pph"><span class="s-pp-n">${icon('user', 12, 2.4)} Person ${k + 1}</span>${mode === 'b' && nS > 1 ? `<span class="v43-tag">Stop ${(bk(i).stop || 0) + 1}</span>` : ''}
          <span class="s-pp-pr">${cov ? inclTag(i.id, true) : aed(i.price)}${x ? ` <small>+ ${aed(x)} after 10 PM</small>` : ''}</span>
          <button class="s-pp-x" type="button" data-act="s-rm" data-k="${i.key}" aria-label="Remove person ${k + 1} from this visit">${icon('x', 12, 2.8)}</button></div>
        <div class="s-rows" data-rc="rows">${rows.join('')}</div>
        ${mode === 'c' && k > 0 && !isTele(i) ? `<button class="v43-split" type="button" data-r="split" data-act="v43-split" data-k="${i.key}"><span class="s-ri">${xi('pin', 16, 2)}</span>
          <span class="mid"><b>At another address?</b><small>Book ${esc(first(patBy(bk(i).pat).name))} as a separate visit</small></span>${icon('chevRight', 14, 2.4)}</button>` : ''}
      </div>`;
    };
    return `<div class="b-item s-item s-grp s-anim ${un ? 'unav' : ''} ${b.gone ? 'gone' : ''} ${flash ? 's-flash' : ''}" data-rc="gr-${L.key}" data-key="${L.key}">
      <div class="s-ih" data-r="h"><span class="tile">${icon(cat.icon, 19, 2)}</span>
        <span class="mid"><b>${esc(L.name)}</b><small>${esc(L.sub)} · ${esc(L.dur)}</small>${L.opts ? `<small class="s-opts">${esc(L.opts)}</small>` : ''}
          <small class="s-ppl">${icon('users', 11, 2.4)} ${n} people · ${nS > 1 ? `${nS} addresses` : 'one visit'}</small></span>
        <span class="s-pr"><b>${aed(total)}</b><small>${n} × ${aed(L.price)}</small></span></div>
      <div class="s-rows s-shared" data-rc="shared">${shared()}</div>
      <div class="s-people" data-rc="people">${g.map(person).join('')}</div>
      ${un ? `<div class="s-flag bad s-anim" data-r="fl-un"><span class="s-fi">${icon('pin', 17, 2.2)}</span>
          <span class="mid"><b>Not available at this address</b><small>${esc(L.name)} isn’t offered in ${un === 'none' ? 'this area' : un} yet.</small></span>
          <button class="mini-btn ghost" type="button" data-act="s-row" data-k="${L.key}" data-row="addr" data-force="1">Change</button></div>` : ''}
      ${b.gone ? `<div class="s-flag warn s-anim" data-r="fl-gone"><span class="s-fi">${icon('clock', 17, 2.2)}</span>
          <span class="mid"><b>${b.when && b.when.mode === 'slot' ? fmtH(b.when.h) : 'That time'} was just taken</b><small>Someone booked it while this was in your cart.</small></span>
          <button class="mini-btn" type="button" data-act="s-row" data-k="${L.key}" data-row="when" data-force="1">Change time</button></div>` : ''}
      <button class="s-dup" type="button" data-r="dup" data-act="s-dup" data-k="${L.key}"><span class="s-dupi">${icon('plus', 13, 2.8)}</span><span class="mid">Add another person</span><b>+ ${aed(L.price)}</b></button>
      <div class="foot s-ifoot" data-r="f">${need ? `<span class="s-need">${icon('alert', 13, 2.4)} ${need.t}</span>` : `<span class="s-ready">${icon('check', 13, 3)} Ready to book</span>`}
        <button class="s-rmv" type="button" data-act="s-rm-grp" data-k="${L.key}" aria-label="Remove ${esc(L.name)} for everyone">${xi('trash', 14, 2)} Remove</button></div>
    </div>`;
  }

  function couponBlock(t) {
    if (S.coupon) {
      return `<div class="s-cpn applied" data-r="cpn"><span class="s-cpi">${xi('tag', 18, 2.2)}</span>
        <span class="mid"><b>${esc(S.coupon.code)}</b><small>${t.off ? `You save ${aed(t.off)}` : esc(t.why || 'Applied')}</small></span>
        <button class="s-x" type="button" data-act="s-drop-coupon" aria-label="Remove coupon">${icon('x', 15, 2.6)}</button></div>`;
    }
    const f = S.focus === 's-coupon';
    return `<div class="s-cpn" data-r="cpn">
      <div class="s-cin"><span class="s-field ${f ? 'focus' : ''} ${S.sCodeErr ? 'err' : ''}" data-act="s-cfocus" data-kbf role="textbox" aria-label="Coupon code">${xi('tag', 17, 2.2)}<span class="s-cv">${S.sCode ? `<b>${esc(S.sCode)}</b>` : f ? '' : '<span class="ph">Coupon code</span>'}${f ? '<span class="caret"></span>' : ''}</span></span>
        <button class="mini-btn ${S.sCode ? '' : 'off'}" type="button" data-act="s-capply">Apply</button></div>
      ${S.sCodeErr ? `<p class="s-cerr">${icon('alert', 13, 2.4)} ${esc(S.sCodeErr)}</p>` : ''}
      <button class="s-cview" type="button" data-act="s-coupons">View available coupons${icon('chevRight', 14, 2.6)}</button></div>`;
  }
  const sumLines = t => {
    const paid = t.items.length - t.inc, plan = esc((tierNow() || {}).name || '');
    return `${t.inc ? `<div class="sum-line off"><span>Included in your ${plan} plan · ${plural(t.inc, 'service')}</span><span>${aed(0)}</span></div>` : ''}
      ${paid ? `<div class="sum-line"><span>Subtotal · ${plural(paid, 'service')}</span><span>${aed(t.sub)}</span></div>` : ''}
      ${t.night ? `<div class="sum-line"><span>After-10 PM charge</span><span>${aed(t.night)}</span></div>` : ''}
      ${S.coupon && t.off ? `<div class="sum-line off"><span>Coupon discount · ${esc(S.coupon.code)}</span><span>− ${aed(t.off)}</span></div>` : ''}
      ${paid ? `<div class="sum-line"><span>VAT (5%)</span><span>${aed(t.vat)}</span></div>` : ''}
      ${t.gold ? `<div class="sum-line s-goldline"><span>FRH ${esc(planInfo(S.sAddPlan || 'gold').name)} membership · 1 year</span><span>${aed(t.gold)}</span></div>` : ''}
      <div class="sum-line total"><span>Total</span><span>${tk('sum', t.total)}</span></div>`;
  };

  /* new patient / address arrive while the cart waits: give them to the item that asked */
  function absorbNew() {
    if (S.sAddPatFor && pats().length > (S.sPatN || 0)) {
      const it = byKey(S.sAddPatFor), p = pats()[pats().length - 1];
      if (it) { bk(it).pat = p.id; if (isTele(it)) bk(it).idDoc = ''; S.sOpen = null; }
      S.sAddPatFor = null;
    }
    if (S.sAddAddrFor && addrs().length > (S.sAddrN || 0)) {
      const it = byKey(S.sAddAddrFor), a = addrs()[addrs().length - 1];
      if (it) setAddr(it, a, true);
      S.sAddAddrFor = null;
    }
  }
  function setAddr(it, a, isNew, all) {
    if (!covers(a)) { setTimeout(() => F.toast(`We don’t visit ${CITY[cityOf(a)]} yet — coming soon. Pick an address in Dubai or Sharjah.`, 'pin'), isNew ? 420 : 0); return false; }
    S.sOpen = null;
    if (it.grp && leadOf(it) !== it) return putPerson(it, a, all);
    bk(it).addr = a.id;
    return true;
  }
  /* v43: a person (or everyone at their stop) goes to address a; in option C they leave for a visit of their own */
  const leadOf = it => cart().find(x => x.grp && x.grp === it.grp) || it;
  const stopMates = (it, all) => (all ? cart().filter(x => x.grp === it.grp && bk(x).own && bk(x).addr === bk(it).addr) : [it]);
  function putPerson(it, a, all) {
    if (v43m() === 'c') { splitOut(it, a); return true; }
    stopMates(it, all).forEach(x => { bk(x).addr = a.id; bk(x).own = true; });
    cart();
    const w = stopTime(it);
    setTimeout(() => F.toast(`${esc(first(patBy(bk(it).pat).name))} · ${esc(a.label)}${w ? `, ${w}` : ''}`, 'pin'), 260);
    return true;
  }
  function splitOut(it, a, quiet) {
    const items = cart(), g = it.grp, L = leadOf(it), b = bk(it), la = addrBy(bk(L).addr);
    items.splice(items.indexOf(it), 1);
    delete it.grp; it.split = { from: first(patBy(bk(L).pat).name), at: la ? la.label : '' };
    b.own = false; b.stop = 0; b.addr = a.id; b.when = bk(L).when ? { ...bk(L).when, off: undefined } : b.when;
    let at = -1; items.forEach((x, n) => { if (x.grp === g) at = n; });
    items.splice(at + 1, 0, it);
    if (quiet) return;
    S.sFlash = it.key;
    setTimeout(() => { if (S.screen === 'cart') scrollIntoBody(`[data-key="${it.key}"]`); }, 60);
    setTimeout(() => F.toast(`${esc(first(patBy(b.pat).name))} now has a separate visit at ${esc(a.label)}`, 'check'), 260);
    setTimeout(() => { if (S.sFlash === it.key) { S.sFlash = null; if (S.screen === 'cart') F.upd(); } }, 1700);
  }

  F.SCREENS.cart = {
    status: 'dark', cls: 'cart s-cart',
    render() {
      absorbNew(); v45Mates();
      const items = cart(), n = F.cartCount();
      const nav = `<div class="nav" data-r="nav"><button class="nav-btn" type="button" data-act="s-cart-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
        <span class="nav-title">${n ? `My cart <span class="s-count">(${n})</span>` : 'My cart'}</span>
        <span style="width:40px"></span></div>`;   /* v14: no Clear all; each visit has Remove + Undo */
      if (!n) {
        return `${nav}<div class="scr-body" data-rc="body"><div class="empty-state s-empty s-anim" data-r="empty">${EMPTY_ILL}
            <b>Your cart is empty</b><span>Add a service and it will wait here until you’re ready to book.</span>
            <button class="btn btn-primary" type="button" data-act="s-browse">Browse services</button></div></div>`;
      }
      const t = totals();
      return `${nav}
        <div class="scr-body" data-rc="body">
          ${steps(1)}
          <div class="s-items" data-rc="items">${v45on() ? v45Cards(items) : visitGroups(items).map(g => (g.length > 1 ? groupCard(g) : itemCard(g[0]))).join('')}</div>
          ${goldCard()}
          ${couponBlock(t)}
          <div class="b-sum s-psum" data-r="sum">${sumLines(t)}</div>
          <p class="s-fine" data-r="fine">${icon('shieldCheck', 13, 2.2)} <span>You can reschedule or cancel from your booking · <button class="s-fine-link" type="button" data-act="px-policy" data-id="refund">Cancellation policy</button></span></p>
        </div>
        <div class="scr-foot" data-r="foot"><div class="b-foot s-cfoot"><span class="from"><small>Total · incl. VAT</small><b>${tk('cart', t.total)}</b></span>
          <button class="btn btn-primary" type="button" data-act="s-proceed">${v45on() && items.some(i => pkgOf(i) && !bk(i).sess[0]) ? 'Choose appointment 1' : t.total > 0 ? 'Proceed to pay' : 'Continue'}</button></div></div>`;
    },
    mount(n) { S.sAddPatFor = null; S.sAddAddrFor = null; S.v45to = null; ticks(n, true); scrollToKey(n); kbOutside(n); },
    update: patch,
  };
  function scrollToKey(n) {
    const k = S.sFocus;
    if (!k) return;
    S.sFocus = null;
    const el = n.querySelector(`[data-key="${k}"]`), body = n.querySelector('.scr-body');
    if (el && body) body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - 10);
  }
  function scrollIntoBody(sel, pad = 90) {
    const n = F.cur(), el = n && n.querySelector(sel), body = n && n.querySelector('.scr-body');
    if (!el || !body) return;
    const y = offTop(el, n) - offTop(body, n);
    if (y < body.scrollTop + 10 || y + el.offsetHeight > body.scrollTop + body.clientHeight - pad) body.scrollTop = Math.max(0, y - 120);
  }

  /* =====================================================================
     PAY (S32–S39) — `checkout`; the old one-page `confirm` now lands here too
     ===================================================================== */
  const BRAND = { visa: 'Visa', mc: 'Mastercard', amex: 'American Express' };
  const cards = () => (S.pxCards = S.pxCards || [
    { id: 'c1', brand: 'visa', last4: '4242', exp: '09/29', def: true },
    { id: 'c2', brand: 'mc', last4: '5100', exp: '03/28' },
  ]);
  const defCard = () => (cards().find(c => c.def) || cards()[0] || { id: 'apple' }).id;
  const cardOf = id => cards().find(c => c.id === id);
  const brandChip = b => `<span class="s-brand ${b}">${b === 'mc' ? '<i></i><i></i>' : b === 'amex' ? 'AMEX' : 'VISA'}</span>`;
  const brandOfNum = n => (/^3[47]/.test(n) ? 'amex' : /^5/.test(n) ? 'mc' : 'visa');
  const payLabel = () => { if (totals().total <= 0) return `Included in your ${(tierNow() || {}).name || ''} plan`; const c = cardOf(S.sPay); return c ? `${BRAND[c.brand]} •••• ${c.last4}` : S.sPay === 'apple' ? 'Apple Pay' : S.sPay === 'cash' ? 'Cash on visit' : S.sPay === 'new' ? `${BRAND[brandOfNum(newCard().cn)]} •••• ${newCard().cn.slice(-4)}` : 'Card'; };
  const newCard = () => (S.sNew = S.sNew || { cn: '', ce: '', cv: '' });
  const groupKey = w => (!w ? 99 : w.mode === 'asap' ? 0 : w.d);
  function groupsOf(items) {
    const gs = [];
    items.forEach(i => { const k = PKG[i.id] ? 98 : groupKey(bk(i).when); let g = gs.find(x => x.k === k); if (!g) gs.push(g = { k, items: [] }); g.items.push(i); });
    const at = i => { const w = bk(i).when; return !w ? 99 : w.mode === 'asap' ? (w.off || 0) / 60 : w.h; };   /* v43: a later stop after the first */
    gs.forEach(g => { g.items = g.items.map((i, n) => [i, n]).sort((a, b) => at(a[0]) - at(b[0]) || a[1] - b[1]).map(x => x[0]); });
    return gs.sort((a, b) => a.k - b.k);
  }
  const fmtCn = s => s.replace(/(\d{4})(?=\d)/g, '$1 ');
  const fmtCe = s => (s.length > 2 ? `${s.slice(0, 2)} / ${s.slice(2)}` : s);
  function field(f, label, val, ph, extra = '') {
    const on = S.sCardF === f, err = S.sCardErr && S.sCardErr.f === f;
    return `<div class="s-fl"><label>${label}</label><div class="s-in ${on ? 'focus' : ''} ${err ? 'err' : ''}" data-act="s-cf" data-f="${f}" data-kbf role="textbox" aria-label="${label}">
      <span class="s-iv">${val ? `<b>${val}</b>` : on ? '' : `<span class="ph">${ph}</span>`}${on ? '<span class="caret"></span>' : ''}</span>${extra}</div></div>`;
  }

  F.SCREENS.checkout = {
    status: 'dark', cls: 'checkout s-checkout',
    kb: () => (S.sCardF && (S.screen === 'checkout' || S.screen === 'confirm') ? 'num' : null),
    get focus() { return S.sCardF ? 's-' + S.sCardF : null; },
    render() {
      const items = cart().filter(i => !unav(i));
      const nav = `<div class="nav" data-r="nav"><button class="nav-btn" type="button" data-act="s-back-cart" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">Payment</span><span style="width:40px"></span></div>`;
      if (!items.length) {
        return `${nav}<div class="scr-body" data-rc="body"><div class="empty-state" data-r="empty"><div class="es-ic">${icon('card', 30, 1.8)}</div><b>Nothing to pay for</b><span>Your cart is empty.</span>
          <button class="btn btn-primary" type="button" data-act="s-browse" style="margin-top:22px">Browse services</button></div></div>`;
      }
      const t = totals(), gs = groupsOf(items), open = !!S.sOsum, cm = coverMap();
      if (!S.sPay || (!cardOf(S.sPay) && !['new', 'apple', 'cash'].includes(S.sPay))) S.sPay = defCard();
      const nc = newCard(), nb = brandOfNum(nc.cn);
      const pm = (key, lead, mid, tail = '') => `<button class="s-pmr ${S.sPay === key ? 'on' : ''}" type="button" data-act="s-pm" data-k="${key}" role="radio" aria-checked="${S.sPay === key}" data-r="pm-${key}">${lead}<span class="mid">${mid}</span>${tail}<span class="radio"></span></button>`;
      const free = t.total <= 0, apple = !free && S.sPay === 'apple', cash = !free && S.sPay === 'cash';
      return `${nav}
      <div class="scr-body" data-rc="body">
        ${steps(2)}
        <div class="s-osum ${open ? 'open' : ''}" data-rc="osum">
          <button class="s-osh" type="button" data-act="s-osum" aria-expanded="${open}" data-r="osh"><span class="tile">${icon('file', 18, 2)}</span>
            <span class="mid"><b>Order summary</b><small>${plural(items.length, 'service')}${gs.some(g => g.k < 98) ? ` · ${plural(gs.filter(g => g.k < 98).length, 'day')}` : ''}${gs.some(g => g.k === 98) ? ` · ${plural(items.filter(pkgOf).length, 'package')}` : ''}</small></span>
            <span class="price">${aed(t.total)}</span>${icon('chevDown', 18, 2.2)}</button>
          ${open ? `<div class="s-osb s-anim" data-r="osb">${gs.map(g => `<div class="s-od">${icon('calendar', 13, 2.4)} ${g.k === 99 ? 'Time not chosen' : g.k === 98 ? 'Packages' : dayLong(g.k)}</div>${g.items.map(i => {
              const b = bk(i), p = patBy(b.pat), a = addrBy(b.addr), w = b.when, pk = pkgOf(i);
              if (pk) { const on = (b.sess || []).filter(Boolean);   /* v45 */
                return `<div class="s-orow"><span class="s-av">${initials(p.name)}</span><span class="mid"><b>${esc(pk.name)} · ${esc(pk.label)}</b>
                  <small>${esc(first(p.name))} · Appointment 1 ${on[0] ? sessTxt(on[0]) : '—'}</small><small>${icon('calendar', 11, 2.4)} ${on.length} of ${pk.n} booked now${on.length < pk.n ? ` · ${pk.n - on.length} later` : ''}</small></span>
                  <span class="price">${aed(i.price)}</span></div>`; }
              const time = !w ? '—' : w.mode === 'asap' ? 'As soon as possible' : fmtH(w.h);
              return `<div class="s-orow"><span class="s-av">${initials(p.name)}</span><span class="mid"><b>${esc(i.name)}</b>
                <small>${esc(p.name.split(' ')[0])} · ${time}</small><small>${icon(isTele(i) ? 'video' : 'pin', 11, 2.4)} ${isTele(i) ? 'Video call' : a ? esc(shortLine(a)) : '—'}</small></span>
                <span class="price">${itemCov(i, cm) ? 'Included' : aed(i.price + extraOf(i))}</span></div>`; }).join('')}`).join('')}
            <div class="s-obrk">${sumLines(t).replace('data-tk="sum"', 'data-tk="psum"')}</div></div>` : ''}
        </div>

        ${free ? `<div class="s-free" data-r="free"><span class="tile green">${icon('check', 20, 2.6)}</span><span class="mid"><b>Nothing to pay</b><small>Everything here is included in your ${esc((tierNow() || {}).name || '')} plan. No card needed.</small></span></div>` : `
        <div class="sec-h s-pmh" data-r="pmh"><h4>Pay with</h4></div>
        <div class="s-pml" data-rc="pml" role="radiogroup" aria-label="Payment method">
          ${cards().map(c => pm(c.id, brandChip(c.brand), `<b>${BRAND[c.brand] || 'Card'} •••• ${c.last4}${c.def ? ' <span class="pill ink">Default</span>' : ''}</b><small>Expires ${c.exp}</small>`)).join('')}
          ${pm('apple', `<span class="s-wallet">${APPLE}<span>Pay</span></span>`, '<b>Apple Pay</b><small>Confirm with Face ID</small>')}
          ${pm('cash', `<span class="s-wallet cash">${xi('cash', 18, 1.9)}</span>`, '<b>Cash on visit</b><small>Pay the team at your door, cash or card</small>')}
          ${pm('new', `<span class="s-wallet add">${icon('plus', 17, 2.4)}</span>`, '<b>Add a new card</b><small>Visa, Mastercard, American Express</small>')}
          ${S.sPay === 'new' ? `<div class="s-cardform s-anim" data-r="newcard">
            ${field('cn', 'Card number', fmtCn(nc.cn), '1234 5678 9012 3456', nc.cn ? brandChip(nb) : icon('card', 18, 2))}
            <div class="s-in2">${field('ce', 'Expiry', fmtCe(nc.ce), 'MM / YY')}${field('cv', 'CVC', nc.cv.replace(/./g, '•'), nb === 'amex' ? '1234' : '123', icon('lock', 15, 2.2))}</div>
            ${S.sCardErr ? `<p class="s-cerr">${icon('alert', 13, 2.4)} ${S.sCardErr.t}</p>` : ''}
            <div class="s-savecard" data-act="s-save-card" role="switch" aria-checked="${!!S.sSaveCard}"><div class="pref-t">Save this card<small>For faster checkout next time</small></div><span class="tog ${S.sSaveCard ? 'on' : ''}"></span></div>
          </div>` : ''}
        </div>
        <button class="s-ins" type="button" data-act="s-insurance" data-r="ins">${icon('shieldCheck', 15, 2.2)}<span>Paying with insurance? <b>Ask FRH</b></span>${icon('chevRight', 14, 2.4)}</button>`}
      </div>
      <div class="scr-foot" data-r="foot"><div class="s-payfoot">
        <button class="btn ${apple ? 's-apbtn' : 'btn-primary'}" type="button" data-act="s-pay">${free ? 'Confirm booking' : apple ? `<span class="s-aplogo">${APPLE}Pay</span><span class="s-dot"></span>${tk('pay', t.total)}`
          : cash ? `Confirm booking · ${tk('pay', t.total)}` : `${icon('lock', 17, 2.2)} Pay ${tk('pay', t.total)}`}</button>
        <p class="b-final s-stripe">${free ? `${icon('shieldCheck', 13, 2.4)} Included in your plan · nothing is charged` : cash ? `${xi('cash', 13, 2.2)} Nothing is charged now · pay at your door` : `${icon('shieldCheck', 13, 2.4)} Secured by <b>Stripe</b> · 3-D Secure`}</p></div></div>
      ${S.sPaying ? `<div class="s-proc" data-r="proc" role="alert" aria-busy="true"><div class="s-proc-in"><span class="spin dark"></span><b>${free || cash ? 'Confirming your booking…' : apple ? 'Confirming with Apple Pay…' : 'Processing payment…'}</b><small>${free || cash ? 'This takes a moment.' : 'Checking with your bank. Please keep the app open.'}</small></div></div>` : ''}`;
    },
    mount(n) {
      ticks(n, true); kbOutside(n);
      if (S.sFocusPM) {
        S.sFocusPM = false;
        const el = n.querySelector('.s-pmh'), body = n.querySelector('.scr-body');
        if (el && body) body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - 8);
      }
    },
    update: patch,
  };
  /* the agency's one-page Confirm is retired: anything that still opens it gets the Pay step */
  F.SCREENS.confirm = F.SCREENS.checkout;

  /* =====================================================================
     DONE (S40)
     ===================================================================== */
  F.SCREENS['book-done'] = {
    status: 'dark', cls: 'book-done s-done',
    render() {
      const L = S.sLast || { ids: ['FRH-24931'], total: 0, when: 'Today · 7:00 PM', pats: ['Sara Ahmed'], where: 'Villa 24, Al Barsha 1', pay: 'Visa •••• 4242', cash: false, n: 1 };
      return `<div class="nav" data-r="nav"><span style="width:40px"></span><span class="nav-title"></span><button class="nav-btn" type="button" data-act="s-done-home" aria-label="Close">${icon('x', 19, 2.2)}</button></div>
      <div class="scr-body" data-rc="body">
        ${steps(4)}
        <div class="s-dhero" data-r="hero">
          <div class="ok-badge"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#12805A"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <h1 class="h1">${L.cash || L.free ? 'Booking confirmed' : 'Payment successful'}</h1>
          <div class="s-amt">${aed(L.total)}</div>
          <p class="s-amts">${L.free ? esc(L.pay) : L.cash ? 'To pay at your door, cash or card' : `Paid with ${esc(L.pay)}`}</p>
        </div>
        ${L.joined ? `<div class="s-goldok" data-r="gold"><span class="s-gold-ic">${icon('starFill', 15)}</span><span class="mid"><b>Welcome to FRH ${esc(planInfo(L.joined === true ? 'gold' : L.joined).name)}</b><small>Your membership is active for a year and this booking already uses it.</small></span></div>` : ''}
        <div class="s-kv" data-r="kv">
          <div><small>Booking ID</small><b>${L.ids[0]}${L.ids.length > 1 ? ` <span class="s-more2">+${L.ids.length - 1} more</span>` : ''}</b></div>
          <div><small>Date &amp; time</small><b>${esc(L.when)}</b></div>
          <div class="s-kvw"><small>${L.pats.length > 1 ? 'Patients' : 'Patient'}</small><b>${L.pats.map(esc).join(', ')}</b></div>
          <div class="s-kvw"><small>Where</small><b>${esc(L.where)}</b></div>
        </div>
        ${L.ids.length > 1 ? `<p class="s-paidnote" data-r="multi">${icon('calendar', 13, 2.2)} ${L.pkgs && L.pkgs.length ? `Booked as ${L.ids.length} appointments, one for each visit and package session` : `Booked as ${L.ids.length} visits, one for each time and place`}: ${L.ids.join(', ')}.</p>` : ''}
        ${(L.pkgs || []).filter(x => x.booked < x.n).map((x, k) => `<p class="s-paidnote v45-pknote" data-r="pk-${k}">${xi('calendar', 13, 2.2)} <span><b>${esc(x.name)}:</b> ${x.booked} of ${x.n} appointments booked. Book the other ${x.n - x.booked} any time from Bookings.</span></p>`).join('')}
        <p class="s-next" data-r="next">${icon('chat', 14, 2.2)} We’ve sent the details to WhatsApp. Your team is assigned soon, and you can follow them live on the day.</p>
      </div>
      <div class="scr-foot" data-r="foot"><div class="stack"><button class="btn btn-primary" type="button" data-act="s-view-booking">View booking</button>
        <button class="btn btn-ghost" type="button" data-act="s-done-home">Back to Home</button></div></div>`;
    },
    update: patch,
  };

  /* booking creation: one appointment per time + address (the appointments model) */
  function completeBooking() {
    let joined = null;
    if (S.sAddPlan && !tierNow() && typeof F.setMember === 'function') { joined = S.sAddPlan; F.setMember(joined, { fresh: true }); }
    S.sAddPlan = null; S.sPlanPick = null;
    const t = totals(), items = t.items, cm = coverMap(), ratio = (t.sub + t.night) ? t.total / (t.sub + t.night) : 1;
    const groups = [];
    items.filter(i => !PKG[i.id]).forEach(i => {
      const b = bk(i), w = b.when || { mode: 'asap' };
      const k = `${w.mode === 'asap' ? 'asap' + (w.off || 0) : w.d + '|' + w.h}|${isTele(i) ? 'tele' : b.addr}`;
      let g = groups.find(x => x.k === k);
      if (!g) groups.push(g = { k, items: [] });
      g.items.push(i);
    });
    const used = new Set([...D.appointments.upcoming, ...D.appointments.completed, ...D.appointments.cancelled].map(a => a.id));
    let n = 24900 + Math.floor(Math.random() * 80);
    const order = 'ORD-' + (Date.now() % 1e6).toString(36).toUpperCase();   /* v45: bookings paid together */
    const asapAt = new Date(now().getTime() + 45 * 6e4);
    groups.forEach(g => {
      while (used.has('FRH-' + n)) n++;
      const id = 'FRH-' + n; used.add(id); n++;
      const f = g.items[0], b = bk(f), w = b.when || { mode: 'asap' }, a = addrBy(b.addr) || addrs()[0];
      const pl = [...new Set(g.items.map(i => { const p = patBy(bk(i).pat); return p.self ? p.name : `${p.name} (${p.rel})`; }))];
      g.appt = {
        id, status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW',
        service: f.name, sub: new Set(g.items.map(i => i.id)).size > 1 ? `+ ${plural(new Set(g.items.map(i => i.id)).size - 1, 'more service')}` : (f.opts || f.sub),   /* v45: two people, one service */
        date: w.mode === 'slot' ? dayShort(w.d) : 'Today',
        time: w.mode === 'slot' ? fmtH(w.h) : `ASAP · about ${hm(new Date(asapAt.getTime() + (w.off || 0) * 6e4))}`,
        patients: pl, address: isTele(f) ? 'Video call' : `${a.label} · ${a.line}`,
        team: 'Team being assigned', total: r2(g.items.reduce((s, i) => s + (itemCov(i, cm) ? 0 : i.price + extraOf(i)), 0) * ratio),
        issue: g.items.map(i => noteOf(bk(i))).filter(Boolean).join('; '), paidWith: payLabel(), v45demo: !!S.v45demo, order,
        svcBy: g.items.reduce((m, i) => { const nm = patBy(bk(i).pat).name; (m[nm] = m[nm] || []).push(i.name); return m; }, {}),   /* v45: each person's own services */
      };
    });
    /* v45: a package books one appointment for each time chosen; the others wait in the package record */
    const pkAppts = [], pks = items.filter(i => PKG[i.id]).map(i => {
      const P = PKG[i.id], b = bk(i), a = addrBy(b.addr) || addrs()[0], p = patBy(b.pat);
      while (used.has('FRH-' + n) || (S.v45pkgs || {})['PKG-' + n]) n++;
      const rec = { id: 'PKG-' + n, svc: i.id, name: P.name, label: P.label, n: P.n, each: P.each, cat: catOf(i.cat).name,
        patient: p.self ? p.name : `${p.name} (${p.rel})`, address: `${a.label} · ${a.line}`, total: r2(i.price * ratio), paidWith: payLabel(), sessions: [], demo: !!S.v45demo };
      n++;
      (b.sess || [b.when]).forEach((x, k) => {
        if (!x) { rec.sessions.push(null); return; }
        while (used.has('FRH-' + n)) n++;
        const id = 'FRH-' + n; used.add(id); n++;
        rec.sessions.push(id);
        pkAppts.push({ id, status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW', service: rec.cat, sub: `${P.name} package · session ${k + 1} of ${P.n}`,
          date: dayShort(x.d), time: hRange(x.h), patients: [rec.patient], address: rec.address, team: 'Team being assigned', total: rec.total,
          issue: noteOf(b), paidWith: rec.paidWith, pkg: rec.id, pkgN: k + 1, sumLabel: `${P.name} · ${P.label}`, v45demo: !!S.v45demo, order });
      });
      (S.v45pkgs = S.v45pkgs || {})[rec.id] = rec;
      return rec;
    });
    pkAppts.slice().reverse().forEach(x => D.appointments.upcoming.unshift(x));
    groups.slice().reverse().forEach(g => D.appointments.upcoming.unshift(g.appt));
    /* spend the plan allowance the same way Membership → Schedule does, so Membership shows it as booked */
    if (S.mPlan && S.mPlan.use) groups.forEach(g => g.items.forEach(i => {
      const k = cm[i.key]; if (!k) return;
      (S.mPlan.use[k] = S.mPlan.use[k] || []).push({ appt: g.appt.id, sub: i.name, who: patBy(bk(i).pat).name });
      g.appt.member = true; g.appt.memberTier = (tierNow() || {}).name;
    }));
    const f = groups.length ? groups[0].appt : pkAppts[0], f0 = groups.length ? groups[0].items[0] : items.find(i => PKG[i.id]), fa = addrBy(bk(f0).addr);
    const places = [...new Set(items.filter(i => !isTele(i)).map(i => (addrBy(bk(i).addr) || {}).label).filter(Boolean))];
    S.sLast = {
      ids: groups.map(g => g.appt.id).concat(pkAppts.map(x => x.id)), total: r2(t.total + (joined ? planInfo(joined).price : 0)), joined, cash: t.total > 0 && S.sPay === 'cash', free: t.total <= 0, pay: payLabel(),
      when: `${f.date} · ${f.time.replace('ASAP · about ', 'about ')}`,
      pats: [...new Set(items.map(i => patBy(bk(i).pat).name))],
      where: isTele(f0) ? 'Video call' : places.length > 1 ? places.join(' and ') : fa ? `${fa.label} · ${shortLine(fa)}` : '—',
      pkgs: pks.map(r => ({ name: `${r.name} · ${r.label}`, booked: r.sessions.filter(Boolean).length, n: r.n })),
    };
    S.newBooking = f.id;
    S.cart = []; S.coupon = null; S.sBk = {}; S.sCode = ''; S.sOpen = null; S.sNew = null; S.sCardF = null;
  }

  /* =====================================================================
     Sheets
     ===================================================================== */
  F.SHEETS['s-clear'] = () => {
    const n = F.cartCount(), t = totals();
    return `<div class="sheet" role="dialog" aria-label="Clear cart"><div class="grab"></div>
      <div class="sh-ic red">${xi('trash', 30, 1.9)}</div>
      <h2>Clear your cart?</h2>
      <p><b class="s-ink">${plural(n, 'service')} · ${aed(t.total)}</b><br>The patients, addresses and times you picked will be cleared too.</p>
      <div class="s-btn2"><button class="btn btn-secondary" type="button" data-act="sheet-close">Keep</button><button class="btn btn-primary" type="button" data-act="s-clear-go">Clear all</button></div></div>`;
  };
  F.SHEETS['s-coupons'] = () => {
    const items = cart().filter(i => !unav(i)), sub = items.reduce((n, i) => n + i.price, 0);
    return `<div class="sheet s-cpsheet" role="dialog" aria-label="Available coupons"><div class="grab"></div>
      <h2>Available coupons</h2>
      ${COUPONS.map(c => {
        const d = discount(items, sub, c), on = !!S.coupon && S.coupon.code === c.code;
        return `<div class="s-cprow ${d.off ? '' : 'off'}"><span class="s-cpc">${c.pct ? `<b>${c.pct}%</b>OFF` : `<b>${c.flat}</b>AED`}</span>
          <span class="mid"><b>${c.title}</b><small>${c.desc}</small><em>${d.off ? `Saves ${aed(d.off)} on this cart` : esc(d.why)}</em><code>${c.code}</code></span>
          <button class="mini-btn ${d.off ? '' : 'ghost'}" type="button" ${d.off && !on ? `data-act="s-use-cp" data-code="${c.code}"` : 'disabled'}>${on ? 'Applied' : 'Apply'}</button></div>`;
      }).join('')}
      <button class="btn btn-ghost" type="button" data-act="sheet-close">Close</button></div>`;
  };
  F.SHEETS['s-payfail'] = () => `<div class="sheet" role="dialog" aria-label="Payment failed"><div class="grab"></div>
      <div class="sh-ic red">${icon('alert', 34, 2)}</div>
      <h2>Payment didn’t go through</h2>
      <p>Your bank declined ${esc(payLabel())}. <b class="s-ink">Nothing was charged.</b> Try again, or pay another way.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="s-retry">${icon('refresh', 18, 2.2)} Retry</button><button class="btn btn-secondary" type="button" data-act="s-change-pm">Change payment method</button></div></div>`;

  /* =====================================================================
     Keyboard fields: coupon (qwerty), health note (qwerty), card (number pad)
     ===================================================================== */
  const MINE = ['s-coupon', 's-note', 's-cn', 's-ce', 's-cv'];
  function blurMine(silent) {
    if (!MINE.includes(S.focus)) return;
    F.hideKb(); S.focus = null; S.sCardF = null;
    if (!silent) setTimeout(() => F.upd(), 0);
  }
  function kbOutside(n) {
    n.addEventListener('click', e => { if (MINE.includes(S.focus) && !e.target.closest('[data-kbf]')) blurMine(); }, true);
  }
  F.KB_RET['s-coupon'] = 'done'; F.KB_RET['s-note'] = 'done';
  F.KEYS['s-coupon'] = k => {
    if (k === 'enter') { F.ACT['s-capply'](); return; }
    if (k === 'del') S.sCode = (S.sCode || '').slice(0, -1);
    else if (/^[a-z0-9]$/i.test(k)) { if ((S.sCode || '').length < 16) S.sCode = (S.sCode || '') + k.toUpperCase(); }
    else return;
    S.sCodeErr = ''; F.upd();
  };
  F.KEYS['s-note'] = k => {
    const it = byKey(S.sNoteKey); if (!it) return;
    const b = bk(it);
    if (k === 'enter') { F.ACT['s-ndone']({ dataset: { k: it.key } }); return; }
    if (k === 'del') b.note = (b.note || '').slice(0, -1);
    else if (k.length === 1) { if ((b.note || '').length < 160) b.note = (b.note || '') + k; }
    else return;
    F.upd();
  };
  function cardKey(f, k) {
    const c = newCard(), amex = /^3[47]/.test(c.cn), max = { cn: amex ? 15 : 16, ce: 4, cv: amex ? 4 : 3 }[f];
    if (k === 'del') c[f] = c[f].slice(0, -1);
    else if (/^\d$/.test(k)) { if (c[f].length >= max) return; if (f === 'ce' && c.ce.length === 0 && +k > 1) c.ce = '0'; c[f] += k; }
    else return;
    S.sCardErr = null;
    if (/^\d$/.test(k) && c[f].length === max) {
      if (f === 'cn') { S.sCardF = 'ce'; S.focus = 's-ce'; }
      else if (f === 'ce') { S.sCardF = 'cv'; S.focus = 's-cv'; }
      else { blurMine(true); }
    }
    F.upd();
  }
  ['cn', 'ce', 'cv'].forEach(f => { F.KEYS['s-' + f] = k => cardKey(f, k); });
  function cardError() {
    const c = newCard(), amex = /^3[47]/.test(c.cn);
    if (c.cn.length < (amex ? 15 : 16)) return { f: 'cn', t: 'Enter the full card number' };
    const mm = +c.ce.slice(0, 2), yy = +c.ce.slice(2);
    if (c.ce.length < 4 || mm < 1 || mm > 12 || yy < 26 || (yy === 26 && mm < 9)) return { f: 'ce', t: 'Check the expiry date' };
    if (c.cv.length < (amex ? 4 : 3)) return { f: 'cv', t: 'Enter the security code on the back' };
    return null;
  }

  /* =====================================================================
     Actions
     ===================================================================== */
  let payT = null;
  const svcNow = () => svcDetail(S.svc || 'gp');
  const reselect = fn => { const d = svcNow(), sel = selOf(d.id); fn(sel, d); F.upd(); };
  const onPay = () => S.screen === 'checkout' || S.screen === 'confirm';
  const tEl = () => F.el && F.el.toast;
  const tAct = (label, act) => `<button class="s-tact" type="button" data-act="${act}">${label}</button>`;
  function openRow(it, row) {
    S.sOpen = { k: it.key, row };
    if (row === 'when') { const w = bk(it).when; bk(it).pick = w && w.mode === 'slot' ? w.d : 0; }
    F.upd();
    setTimeout(() => { if (S.screen === 'cart') scrollIntoBody(`[data-key="${it.key}"] .s-panel`); }, 30);
  }
  function closeRow() { S.sOpen = null; blurMine(true); F.upd(); }

  /* Final v8: S.sOpen = { k, row } is now shown as a bottom sheet over the cart */
  F.SHEET_KB = F.SHEET_KB || {};
  /* only while the health note itself is being typed in */
  F.SHEET_KB['s-edit'] = () => !!(S.sOpen && S.sOpen.row === 'note' && S.focus === 's-note');
  const EDIT_T = { pat: 'Who is this visit for?', addr: 'Visit address', when: 'Date & time', id: 'Confirm identity', note: 'Health note' };
  F.SHEETS['s-edit'] = () => {
    const o = S.sOpen, it = o && byKey(o.k);
    if (!it) return '<div class="sheet"></div>';
    const who = patBy(bk(it).pat), grp = it.grp && cart().filter(x => x.grp === it.grp).length > 1;
    const sub = o.row === 'stopwho' ? esc(it.name) : o.row === 'paddr' && o.all ? `${esc(it.name)} · everyone at stop ${bk(it).stop + 1}`
      : `${esc(it.name)}${grp && (o.row === 'pat' || o.row === 'note' || o.row === 'id' || o.row === 'paddr') ? ` · ${esc(who.name.split(' ')[0])}` : grp ? ' · everyone in this visit' : ''}`;
    const T = pkgOf(it) && (o.row === 'pat' || o.row === 'addr') ? (o.row === 'pat' ? 'Who is this package for?' : 'Where are the appointments?') : o.row === 'paddr' ? (o.all ? `Where is stop ${bk(it).stop + 1}?` : `Where will ${esc(first(who.name))} be?`) : o.row === 'stopwho' ? 'Who is at another address?' : EDIT_T[o.row] || 'Edit';
    return `<div class="sheet s-esheet" role="dialog" aria-label="${T}"><div class="grab"></div>
      <div class="s-es-h"><span class="mid"><h2>${T}</h2><small>${sub}</small></span><button class="s-x" type="button" data-act="s-edit-close" aria-label="Close">${icon('x', 15, 2.6)}</button></div>
      <div class="s-panel s-p-${o.row} s-es-body">${panel(it, o.row)}</div></div>`;
  };
  function syncEdit() {
    const up = S.sheet === 's-edit';
    if (S.sEditUp && !up) { S.sEditUp = false; if (S.sOpen) { S.sOpen = null; blurMine(true); setTimeout(() => { if (S.screen === 'cart') F.upd(); }, 0); } return; }
    if (S.sOpen && S.screen === 'cart') { S.sEditUp = true; F.openSheet('s-edit'); }
    else if (!S.sOpen && up) { S.sEditUp = false; F.closeSheet(); }
    const L = F.el && F.el.sheet ? F.el.sheet : document.getElementById('sheetLayer');
    const lift = S.sheet === 's-edit' && S.focus === 's-note' && F.el.kb.classList.contains('show');
    if (L) { L.classList.toggle('kb-lift', lift); if (lift) L.style.setProperty('--kbh', F.el.kb.offsetHeight + 'px'); }
  }
  {
    const c = F.SCREENS.cart, u0 = c.update, m0 = c.mount;
    c.update = function (n) { const r = u0 ? u0.apply(this, arguments) : undefined; syncEdit(); return r; };
    c.mount = function (n) { const r = m0 ? m0.apply(this, arguments) : undefined; return r; };
  }
  ['cart', 'checkout'].forEach(id => {
    const d = F.SCREENS[id]; if (!d) return;
    ['render', 'update'].forEach(fn => { const f0 = d[fn]; if (f0) d[fn] = function () { const a = arguments; return withGold(() => f0.apply(this, a)); }; });
  });
  const sheetClose0 = F.ACT['sheet-close'];
  F.ACT['sheet-close'] = (n, e) => { if (S.sheet === 's-edit') { closeRow(); return; } return sheetClose0 ? sheetClose0(n, e) : F.closeSheet(); };
  let lastRemoved = null, lastGroup = null;

  Object.assign(F.ACT, {
    /* ---- service detail ---- */
    'open-svc': n => {
      if (S.screen === 'service') (S.sSvcStack = S.sSvcStack || []).push(S.svc); else S.sSvcStack = [];
      S.svc = n.dataset.id; barShown = false; F.go('service');
    },
    'back-svc': () => { if (S.sSvcStack && S.sSvcStack.length) S.svc = S.sSvcStack.pop(); F.back('cats'); },
    'open-variants': (n, e) => { if (e) e.stopPropagation(); S.sSvcStack = []; S.svc = n.dataset.id; S.sScrollTo = 'dose'; F.go('service'); },
    's-share': () => F.toast('Link copied — share it with family', 'copy'),
    's-dose': n => reselect(sel => { sel.dose = +n.dataset.i; }),
    's-addon': n => reselect(sel => { const id = n.dataset.id; sel.addons = sel.addons.includes(id) ? sel.addons.filter(x => x !== id) : [...sel.addons, id]; }),
    's-more': n => { const sel = selOf(svcNow().id); sel[n.dataset.t] = !sel[n.dataset.t]; F.upd(); },
    's-faq': n => { const sel = selOf(svcNow().id), i = +n.dataset.i; sel.faq = sel.faq === i ? -1 : i; F.upd(); },
    's-add': () => {
      const d = svcNow(), sel = selOf(d.id), from = S.screen;
      const it = addForPeople(d, sel);
      sel.addedKey = it.key; sel.addedSig = sigOf(d.id, sel) + '|' + forOf(d.id).join(','); sel.flash = Date.now() + 1500;
      S.sFly = 1; F.upd();
      const dot = flyToCart('.s-addbtn');
      setTimeout(() => {
        if (dot) dot.remove();
        S.sFly = 0;
        if (!S.open || S.screen !== from) return;
        F.upd();
        F.cur().querySelectorAll('.s-badge').forEach(b => { b.classList.remove('s-bump'); void b.offsetWidth; b.classList.add('s-bump'); });
        const go = F.cur().querySelector('.s-sbar [data-act="s-gocart"]'); if (go) { go.classList.remove('v28-pop'); void go.offsetWidth; go.classList.add('v28-pop'); }   /* v28 */
      }, dot ? 330 : 0);
      setTimeout(() => { if (S.open && S.screen === from) F.upd(); }, 1550);
    },
    'v21-unadd': () => {
      const d = svcNow(), sel = selOf(d.id), it = sel.addedKey && byKey(sel.addedKey);
      if (!it) return;
      const items = cart(), g = grpOf(it);
      lastGroup = items.map((x, idx) => ({ it: x, b: bkAll()[x.key], idx })).filter(o => grpOf(o.it) === g);
      S.cart = items.filter(x => grpOf(x) !== g); lastGroup.forEach(o => { delete bkAll()[o.it.key]; });
      sel.flash = 0; F.upd();
      F.toast(`Removed from your cart ${tAct('Undo', 'v21-undo')}`, 'check');
    },
    'v21-undo': () => {                                         /* put it back and stay on the service page */
      if (tEl()) tEl().classList.remove('show');
      const r = lastGroup; if (!r) return; lastGroup = null;
      const items = cart(); r.forEach(o => { bkAll()[o.it.key] = o.b; items.splice(Math.min(o.idx, items.length), 0, o.it); });
      F.upd();
    },
    's-for': () => { blurMine(true); F.openSheet('s-for'); },
    'v32-faqs': () => { S.v32svc = S.svc || 'gp'; S.v32topic = 'all'; S.v32open = ''; F.go('all-faqs'); },
    'v32-back': () => F.back('service'),
    'v32-topic': n => { S.v32topic = n.dataset.t; F.upd(); },
    'v32-acc': n => { S.v32open = S.v32open === n.dataset.id ? '' : n.dataset.id; F.upd(); },
    'v32-ask': n => { const q = n && n.dataset && n.dataset.q; F.go('ask-voice', { dir: 'fade' }); if (q) setTimeout(() => { if (F.vaAnswer) F.vaAnswer(q); }, 700); },
    'v32-chat': () => { if (F.openSupportChat) F.openSupportChat(); },
    'v26-revs': () => { S.v26rf = 'all'; blurMine(true); F.openSheet('v26-revs'); },
    'v26-rf': n => { S.v26rf = n.dataset.f; const sc = document.querySelector('.v26-sheet'), y = sc ? sc.scrollTop : 0; F.openSheet('v26-revs'); const nx = document.querySelector('.v26-sheet'); if (nx) nx.scrollTop = y; },
    's-for-pick': n => {
      const d = svcNow(), ids = forOf(d.id).slice(), v = n.dataset.v, at = ids.indexOf(v);
      if (at >= 0) { if (ids.length === 1) { F.shake('.s-fs-row.on'); return; } ids.splice(at, 1); } else ids.push(v);
      S.sFor[d.id] = pats().map(p => p.id).filter(id => ids.includes(id));
      F.openSheet('s-for'); F.upd();
    },
    's-for-add': () => {
      const d = svcNow();
      F.closeSheet(true);
      if (typeof F.openPatientForm === 'function') F.openPatientForm({ ctx: 'cart', done: p => { const x = p && (pats().find(y => y.id === p.id) || pats().find(y => y.name === p.name)); if (x) { forOf(d.id); S.sFor[d.id].push(x.id); } } });
      else F.toast('Add family members from Profile → Patients', 'users');
    },
    's-gocart': () => { if (tEl()) tEl().classList.remove('show'); if (S.screen !== 'cart') F.go('cart'); },
    's-book': () => {
      const d = svcNow(), sel = selOf(d.id);
      const sig = sigOf(d.id, sel) + '|' + forOf(d.id).join(',');
      const reuse = sel.addedKey && byKey(sel.addedKey) && sel.addedSig === sig;
      const key = reuse ? sel.addedKey : addForPeople(d, sel).key;
      sel.addedKey = key; sel.addedSig = sig;
      S.sOpen = null; S.sFocus = key; S.sFlash = key;
      F.go('cart');
      setTimeout(() => { if (S.sFlash === key) { S.sFlash = null; if (S.screen === 'cart') F.upd(); } }, 1700);
    },

    /* entry points from other screens (service lists, rails, favourites, doctor profile) */
    'add-cart': (n, e) => {
      if (e) e.stopPropagation();
      addItem(n.dataset.id);
      F.toast(`${findSvc(n.dataset.id).name} added ${tAct('View cart', 's-gocart')}`, 'check');
      F.upd();
    },
    'book-svc': n => { const it = addItem(n.dataset.id || S.svc || 'gp'); S.sOpen = null; S.sFocus = it.key; F.go('cart'); },

    /* ---- cart ---- */
    's-cart-back': () => { blurMine(true); F.back('home'); },
    's-browse': () => { if (F.SCREENS.cats) F.go('cats'); else F.go('home', { dir: 'fade' }); },
    's-row': n => {
      const it = byKey(n.dataset.k); if (!it) return;
      blurMine(true); openRow(it, n.dataset.row);
    },
    's-pat': n => {
      const it = byKey(n.dataset.k); if (!it) return; const b = bk(it), p = patBy(n.dataset.v);
      if (it.grp && cart().some(x => x.grp === it.grp && x.key !== it.key && bk(x).pat === p.id)) { F.toast(`${esc(p.name.split(' ')[0])} is already in this visit`, 'users'); return; }
      b.pat = p.id;
      if (isTele(it)) b.idDoc = p.self ? 'eid' : '';
      closeRow();
      if (isTele(it) && !b.idDoc) setTimeout(() => { if (S.open && S.screen === 'cart') openRow(it, 'id'); }, 260);
    },
    's-add-pat': n => {
      const k = n.dataset.k;
      S.sAddPatFor = k; S.sPatN = pats().length;
      if (typeof F.openPatientForm === 'function') {
        /* the profile screen saves, calls done, then returns to the cart itself */
        F.openPatientForm({ ctx: 'cart', done: p => {
          S.sAddPatFor = null;
          const it = byKey(k), x = p && (pats().find(y => y.id === p.id) || pats().find(y => y.name === p.name));
          if (!it || !x) return;
          bk(it).pat = x.id; S.sOpen = null;
          if (isTele(it)) { bk(it).idDoc = ''; S.sOpen = { k, row: 'id' }; }
          setTimeout(() => F.toast(`${esc(x.name.split(' ')[0])} added to this visit`, 'check'), 420);
        } });
      } else if (F.SHEETS.addpatient) F.openSheet('addpatient');
      else { S.sAddPatFor = null; F.toast('Add patients from Profile → Patients', 'users'); }
    },
    's-addr': n => {
      const it = byKey(n.dataset.k), a = addrBy(n.dataset.v); if (!it || !a) return;
      if (setAddr(it, a)) { F.upd(); if (unav(it)) F.shake(`[data-key="${it.key}"] .s-flag`); }
    },
    's-add-addr': n => {
      const k = n.dataset.k; S.sAddAddrFor = k; S.sAddrN = addrs().length;
      if (typeof F.openAddressForm === 'function') {
        /* done({ id, label, line, city, serviceable, … }); the form returns to the cart itself */
        F.openAddressForm({ ctx: 'cart', done: a => {
          S.sAddAddrFor = null;
          const it = byKey(k), x = a && ((a.id && addrBy(a.id)) || addrs().find(y => y.line === a.line));
          if (!it || !a) return;
          if (a.serviceable === false) { setTimeout(() => F.toast(`Saved. We don’t visit ${esc(a.emirate || CITY[a.city] || 'that area')} yet — coming soon`, 'pin'), 420); return; }
          if (x) setAddr(it, x, true);
        } });
      } else if (F.ACT['px-addr-add']) F.ACT['px-addr-add']();
      else { S.sAddAddrFor = null; F.toast('Add addresses from Profile → Addresses', 'pin'); }
    },
    's-id': n => { const it = byKey(n.dataset.k); if (!it) return; bk(it).idDoc = n.dataset.v; closeRow(); },
    's-asap': n => { const it = byKey(n.dataset.k); if (!it) return; const b = bk(it); b.when = { mode: 'asap' }; b.gone = false; closeRow(); },
    's-date': n => { const it = byKey(n.dataset.k); if (!it) return; bk(it).pick = +n.dataset.d; F.upd(); },
    's-slot': n => {
      const it = byKey(n.dataset.k); if (!it) return; const b = bk(it), h = +n.dataset.h;
      b.when = { mode: 'slot', d: b.pick !== undefined ? b.pick : 0, h }; b.gone = false;
      closeRow();
      if (it.night && h >= 22) F.toast(`After-10 PM charge of ${aed(it.night)} added`, 'clock');
    },
    's-chip': n => { const it = byKey(n.dataset.k); if (!it) return; const b = bk(it), c = n.dataset.c; b.chips = (b.chips || []).includes(c) ? b.chips.filter(x => x !== c) : [...(b.chips || []), c]; F.upd(); },
    's-nfocus': n => {
      S.sNoteKey = n.dataset.k; S.shift = !bk(byKey(n.dataset.k) || {}).note;
      F.showKb('qwerty', 's-note'); F.upd();
      setTimeout(() => { if (S.screen === 'cart') scrollIntoBody('.s-notebox', 40); }, 360);
    },
    's-ndone': () => closeRow(),
    /* v43 */
    'v43-paddr': n => {
      const it = byKey(n.dataset.k); if (!it) return;
      const all = !!(S.sOpen && S.sOpen.all), v = n.dataset.v;
      if (!v) {
        const ms = stopMates(it, all); ms.forEach(x => { bk(x).own = false; });
        closeRow();
        const L = leadOf(it), la = addrBy(bk(L).addr);
        F.toast(`${ms.map(x => esc(first(patBy(bk(x).pat).name))).join(' and ')} back with ${esc(first(patBy(bk(L).pat).name))}${la ? ` at ${esc(la.label)}` : ''}`, 'users');
        return;
      }
      const a = addrBy(v); if (!a) return;
      if (setAddr(it, a, false, all)) F.upd();
    },
    'v43-stop': n => { const it = byKey(n.dataset.k); if (!it) return; blurMine(true); S.sOpen = { k: it.key, row: 'paddr', all: true }; F.upd(); },
    'v43-stopwho': n => {
      const it = byKey(n.dataset.k); if (!it) return; blurMine(true);
      const g = cart().filter(x => x.grp === it.grp);
      S.sOpen = g.length === 2 ? { k: g[1].key, row: 'paddr' } : { k: it.key, row: 'stopwho' }; F.upd();
    },
    'v43-who': n => { const it = byKey(n.dataset.k); if (!it) return; S.sOpen = { k: it.key, row: 'paddr' }; F.upd(); },
    'v43-split': n => { const it = byKey(n.dataset.k); if (!it) return; blurMine(true); S.sOpen = { k: it.key, row: 'paddr' }; F.upd(); },
    's-edit-close': () => closeRow(),
    's-dup': n => {
      const src = byKey(n.dataset.k); if (!src) return;
      blurMine(true);
      const { it, next } = dupItem(src);
      S.sOpen = next ? null : { k: it.key, row: 'pat' }; S.sFlash = it.key;
      F.upd();
      F.toast(next ? `Added for ${esc(next.name.split(' ')[0])} · + ${aed(it.price)}` : `Added · + ${aed(it.price)}. Choose who this one is for`, 'check');
      setTimeout(() => { if (S.screen === 'cart') scrollIntoBody(`[data-key="${it.key}"]`); }, 40);
      setTimeout(() => { if (S.sFlash === it.key) { S.sFlash = null; if (S.screen === 'cart') F.upd(); } }, 1700);
    },
    's-rm': n => {
      const items = cart(), idx = items.findIndex(x => x.key === n.dataset.k); if (idx < 0) return;
      const it = items[idx], who = patBy(bk(it).pat).name.split(' ')[0];
      lastRemoved = { it, b: bkAll()[it.key], idx, prev: items.slice() };
      if (it.grp && leadOf(it) === it) {
        /* v43: the visit stays at its address. Someone who was there leads it now; people at other stops keep theirs */
        const rest = items.filter(x => x !== it && x.grp === it.grp), nl = rest.find(x => !bk(x).own);
        lastRemoved.snap = rest.map(x => [x.key, bk(x).own, bk(x).addr]);
        rest.forEach(x => { bk(x).own = true; });
        if (nl) { items.splice(items.indexOf(nl), 1); items.splice(items.indexOf(it) + 1, 0, nl); }
      }
      if (S.sOpen && S.sOpen.k === it.key) { S.sOpen = null; blurMine(true); }
      S.cart = items.filter(x => x !== it); delete bkAll()[it.key];
      const inVisit = it.grp && S.cart.some(x => x.grp === it.grp);
      F.upd();
      F.toast(inVisit ? `${esc(who)} removed from this visit ${tAct('Undo', 's-undo')}` : `${esc(it.name)} removed ${tAct('Undo', 's-undo')}`, 'check');
    },
    's-undo': () => {
      if (tEl()) tEl().classList.remove('show');
      const r = lastRemoved; if (!r) return; lastRemoved = null;
      const items = cart();
      if (r.prev && r.prev.length === items.length + 1 && items.every(x => r.prev.includes(x))) S.cart = r.prev.slice();   /* v43: the order as it was */
      else items.splice(Math.min(r.idx, items.length), 0, r.it);
      bkAll()[r.it.key] = r.b;
      (r.snap || []).forEach(([k, own, addr]) => { const b = bkAll()[k]; if (b) { b.own = own; b.addr = addr; } });
      if (S.screen === 'cart') F.upd(); else F.go('cart');
    },
    's-rm-grp': n => {
      const items = cart(), it = byKey(n.dataset.k); if (!it) return;
      const g = grpOf(it);
      lastGroup = items.map((x, idx) => ({ it: x, b: bkAll()[x.key], idx })).filter(o => grpOf(o.it) === g);
      if (S.sOpen && lastGroup.some(o => o.it.key === S.sOpen.k)) { S.sOpen = null; blurMine(true); }
      S.cart = items.filter(x => grpOf(x) !== g); lastGroup.forEach(o => { delete bkAll()[o.it.key]; });
      F.upd();
      F.toast(`${esc(it.name)} removed for ${lastGroup.length} people ${tAct('Undo', 's-undo-grp')}`, 'check');
    },
    's-undo-grp': () => {
      if (tEl()) tEl().classList.remove('show');
      const r = lastGroup; if (!r) return; lastGroup = null;
      const items = cart(); r.forEach(o => { bkAll()[o.it.key] = o.b; items.splice(Math.min(o.idx, items.length), 0, o.it); });
      if (S.screen === 'cart') F.upd(); else F.go('cart');
    },
    's-plan-pick': n => { const t = n.dataset.t; if (!PLANS.includes(t)) return; S.sPlanPick = t; if (S.sAddPlan) S.sAddPlan = t; F.upd(); },
    's-plan-toggle': () => {
      if (S.sAddPlan) { S.sAddPlan = null; F.upd(); return; }
      const O = planOffers(), t = O.best || 'silver';
      S.sAddPlan = t; S.sPlanPick = t; F.upd(); F.toast(`${planInfo(t).name} added to this order`, 'check');
    },
    's-plan-add': n => { const t = n.dataset.t; if (!PLANS.includes(t)) return; S.sPlanPick = t; S.sAddPlan = t; F.closeSheet(); F.upd(); F.toast(`${planInfo(t).name} added to this order`, 'check'); },
    's-plans': () => { blurMine(true); F.openSheet('s-plans'); },
    's-clear': () => { blurMine(true); F.openSheet('s-clear'); },
    's-clear-go': () => { S.cart = []; S.coupon = null; S.sBk = {}; S.sCode = ''; S.sOpen = null; F.closeSheet(); F.upd(); F.toast('Cart cleared', 'check'); },

    /* coupon (S28) */
    's-cfocus': () => { S.sCodeErr = ''; F.showKb('qwerty', 's-coupon'); F.upd(); setTimeout(() => { if (S.screen === 'cart') scrollIntoBody('.s-cpn', 40); }, 360); },
    's-capply': () => {
      if (!S.sCode) { F.shake('.s-field'); return; }
      const c = cpnOf(S.sCode);
      if (!c) { S.sCodeErr = `${S.sCode} isn’t a valid code`; F.upd(); F.shake('.s-field'); return; }
      S.coupon = { ...c }; S.sCode = ''; S.sCodeErr = ''; blurMine(true); F.upd();
      const t = totals();
      F.toast(t.off ? `${c.code} applied · you save ${aed(t.off)}` : `${c.code} added — ${t.why}`, t.off ? 'check' : 'alert');
    },
    's-coupons': () => { blurMine(true); F.openSheet('s-coupons'); },
    's-use-cp': n => { const c = cpnOf(n.dataset.code); if (!c) return; S.coupon = { ...c }; S.sCode = ''; S.sCodeErr = ''; F.closeSheet(); F.upd(); F.toast(`${c.code} applied · you save ${aed(totals().off)}`, 'check'); },
    's-drop-coupon': () => { S.coupon = null; S.sCode = ''; F.upd(); },

    's-proceed': () => {
      blurMine(true);
      if (S.guest) { F.toast('Sign in to book — your cart will be here', 'user'); if (F.ACT.signin) setTimeout(() => { if (S.open && S.screen === 'cart') F.ACT.signin(); }, 600); return; }
      const items = cart(), bad = items.find(i => needOf(i));
      if (bad) {
        const nd = needOf(bad);
        S.sOpen = { k: bad.key, row: nd.row };
        if (nd.row === 'when') bk(bad).pick = bk(bad).when && bk(bad).when.mode === 'slot' ? bk(bad).when.d : 0;
        S.sFocus = bad.key; F.upd(); scrollToKey(F.cur());
        F.shake(`[data-key="${bad.key}"]`);
        F.toast(`${nd.t} for ${esc(bad.name)}`, 'alert');
        return;
      }
      S.sOpen = null; S.sCardF = null; S.sCardErr = null; S.sOsum = false;
      if (!S.sPay) S.sPay = defCard();
      F.go('checkout');
    },
    checkout: () => F.ACT['s-proceed'](),

    /* ---- pay ---- */
    's-back-cart': () => { blurMine(true); F.back('cart'); },
    's-osum': () => { S.sOsum = !S.sOsum; F.upd(); },
    's-pm': n => { if (S.sPay !== n.dataset.k) { S.sPay = n.dataset.k; S.sCardErr = null; } if (S.sPay !== 'new') blurMine(true); F.upd(); },
    's-cf': n => { S.sCardF = n.dataset.f; F.showKb('num', 's-' + n.dataset.f); F.upd(); setTimeout(() => { if (onPay()) scrollIntoBody('.s-cardform', 20); }, 360); },
    's-save-card': () => { S.sSaveCard = !S.sSaveCard; F.upd(); },
    's-insurance': () => {
      if (typeof F.openSupportChat === 'function') F.openSupportChat();
      else F.toast('FRH Support can tell you if your insurer is covered: 800 374', 'headset');
    },
    's-pay': () => {
      if (S.sPaying) return;
      blurMine(true);
      if (!cart().some(i => !unav(i))) { F.back('cart'); return; }
      const free = withGold(() => totals().total) <= 0;
      if (!free && S.sPay === 'new') { const er = cardError(); if (er) { S.sCardErr = er; F.upd(); F.shake('.s-cardform'); return; } }
      const from = S.screen;
      S.sPaying = true; F.upd();
      clearTimeout(payT);
      payT = setTimeout(() => {
        S.sPaying = false;
        if (!S.open || S.screen !== from) return;
        const c = cardOf(S.sPay), fail = !free && (S.sFailNext || (!!c && c.brand === 'mc' && !S.sRetried));
        S.sFailNext = false; S.sRetried = false;
        if (fail) { F.upd(); F.openSheet('s-payfail'); return; }
        if (!free && S.sPay === 'new' && S.sSaveCard) {
          const nc = newCard();
          cards().push({ id: 'c' + (Date.now() % 1e7), brand: brandOfNum(nc.cn), last4: nc.cn.slice(-4), exp: `${nc.ce.slice(0, 2)}/${nc.ce.slice(2)}` });
        }
        completeBooking();
        F.go('book-done', { dir: 'fade' });
      }, free || S.sPay === 'cash' ? 1100 : 1800);
    },
    pay: () => F.ACT['s-pay'](),
    's-retry': () => {
      S.sRetried = true; F.closeSheet();
      const from = S.screen;
      setTimeout(() => { if (S.open && S.screen === from && !S.sheet) F.ACT['s-pay'](); }, 340);
    },
    's-change-pm': () => {
      F.closeSheet(); S.sFocusPM = false;
      const alt = cards().find(c => c.id !== S.sPay);
      S.sPay = alt ? alt.id : 'apple';
      F.upd();
      const n = F.cur(), el = n && n.querySelector('.s-pmh'), body = n && n.querySelector('.scr-body');
      if (el && body) body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - 8);
      F.toast('Choose how you’d like to pay', 'card');
    },

    /* ---- done ---- */
    's-view-booking': () => {
      const id = (S.sLast && S.sLast.ids[0]) || S.newBooking;
      S.apptTab = 'upcoming';
      F.go('appts', { dir: 'none' });
      if (typeof F.openAppt === 'function') F.openAppt(id);
      else if (F.ACT['appt-open']) F.ACT['appt-open']({ dataset: { id } });
    },
    's-done-home': () => F.go('home', { dir: 'fade' }),
  });

  /* =====================================================================
     Final v45: the cart as visits and packages.
     Visit = everything at one address at one time: one card with Location and Date & time once, then each
     service with who it is for. Package = its own card: patient, location and its appointments (1 required,
     the rest now or "Schedule later"). The pickers open in one sheet, v45-edit, driven by
     S.v45open = { kind: 'loc' | 'time' | 'svc' | 'sess', k, n, pick }. S.v45cart 'old' keeps the v44 cart.
     ===================================================================== */
  const v45on = () => (S.v45cart || 'new') === 'new';
  const whoOf = p => `${first(p.name)} (${p.self ? 'you' : p.rel})`;
  const wKey = w => (!w ? 'none' : w.mode === 'asap' ? 'asap' + (w.off || 0) : `${w.d}|${w.h}`);
  const visitKey = i => (isTele(i) ? `tele|${grpOf(i)}|` : `${bk(i).addr}|`) + wKey(bk(i).when);
  function v45Visits(items) {
    const out = [], at = {};
    items.filter(i => !PKG[i.id]).forEach(i => { const k = visitKey(i); if (at[k] === undefined) { at[k] = out.length; out.push([i]); } else out[at[k]].push(i); });
    return out;
  }
  const visitOf = k => { const it = byKey(k); return it ? v45Visits(cart()).find(v => v.includes(it)) || [] : []; };
  {
    const count0 = F.cartCount;
    F.cartCount = () => (v45on() ? v45Visits(cart()).length + cart().filter(pkgOf).length : count0());
  }
  const v45Chev = `<span class="v45-chev">${icon('chevRight', 15, 2.4)}</span>`;
  const v45Row = (r, ic, label, val, act, st = '') => `<button class="v45-lr ${st}" type="button" data-r="${r}" ${act}><span class="v45-li">${xi(ic, 16, 2)}</span>
    <span class="mid"><small>${label}</small><b>${val}</b></span>${v45Chev}</button>`;
  const v45Need = need => (need ? `<span class="s-need">${icon('alert', 13, 2.4)} ${need.t}</span>` : `<span class="s-ready">${icon('check', 13, 3)} Ready to book</span>`);
  const unFlag = (un, act) => `<div class="s-flag bad s-anim" data-r="fl-un"><span class="s-fi">${icon('pin', 17, 2.2)}</span>
      <span class="mid"><b>Not available at this address</b><small>Not offered in ${un === 'none' ? 'this area' : un} yet.</small></span>
      <button class="mini-btn ghost" type="button" ${act}>Change</button></div>`;

  /* one service in a visit, with everyone it is for */
  function v45Line(g, m) {
    const L = g[0], n = g.length, cov = g.filter(i => itemCov(i, m)).length, paid = g.filter(i => !itemCov(i, m));
    const sum = paid.reduce((t, i) => t + i.price, 0), night = paid.reduce((t, i) => t + extraOf(i), 0);
    const who = g.map(i => `<span class="v45-nm">${esc(whoOf(patBy(bk(i).pat)))}</span>`).join(' · ');
    const need = g.map(needOf).find(x => x && (x.row === 'pat' || x.row === 'id'));
    const fl = S.sFlash && g.some(i => i.key === S.sFlash);
    return `<button class="v45-line ${fl ? 'v45-flash' : ''}" type="button" data-r="ln-${grpOf(L)}" data-act="v45-open" data-kind="svc" data-k="${grpOf(L)}" aria-label="${esc(L.name)}: people and notes">
      <img class="v45-th" src="${img(svcDetail(L.id).img)}" alt="">
      <span class="mid"><b>${esc(L.name)}</b>${L.opts ? `<small class="s-opts">${esc(L.opts)}</small>` : ''}
        <small class="v45-who">${icon(n > 1 ? 'users' : 'user', 12, 2.4)}<span>${who}</span></small>
        ${need ? `<small class="v45-need">${icon('alert', 12, 2.4)} ${need.t}</small>` : ''}</span>
      <span class="v45-pr">${cov === n ? `${inclTag(L.id, true)}<s>${aed(n * L.price)}</s>` : `<b>${aed(sum)}</b>${n > 1 ? `<small>${n} × ${aed(L.price)}${cov ? ` · ${cov} included` : ''}</small>` : ''}`}
        ${night ? `<small class="v45-x">+ ${aed(night)} after 10 PM</small>` : ''}</span></button>`;
  }
  function v45Visit(v, n, N) {
    const L = v[0], b = bk(L), a = addrBy(b.addr), m = coverMap(), tele = isTele(L);
    const un = v.map(unav).find(Boolean), gone = v.some(i => bk(i).gone), need = v.map(needOf).find(Boolean);
    const total = v.reduce((t, i) => t + (itemCov(i, m) ? 0 : i.price + extraOf(i)), 0);
    const at = `data-act="v45-open" data-k="${L.key}"`;
    return `<div class="b-item s-item v45-card s-anim ${un ? 'unav' : ''} ${gone ? 'gone' : ''}" data-rc="vs-${L.key}" data-key="${L.key}">
      <div class="v45-h" data-r="h"><span class="v45-eb">${xi(tele ? 'video' : 'home', 13, 2.2)}${tele ? 'Video consultation' : 'Visit'}${N > 1 ? `<i>${n} of ${N}</i>` : ''}</span>
        <b class="v45-tot">${aed(total)}</b></div>
      <div class="v45-logi" data-rc="logi">
        ${tele ? '' : v45Row('loc', addrIc(a), 'Location', a ? `${esc(a.label)} · ${esc(shortLine(a))}` : '<span class="s-ph">Choose an address</span>', `${at} data-kind="loc"`, un ? 'warn' : '')}
        ${v45Row('time', 'clock', 'Date &amp; time', whenHtml(L, b), `${at} data-kind="time"`, gone ? 'warn' : '')}
      </div>
      <div class="v45-lines" data-rc="lines">${visitGroups(v).map(g => v45Line(g, m)).join('')}</div>
      ${un ? unFlag(un, `${at} data-kind="loc"`) : ''}
      ${gone ? `<div class="s-flag warn s-anim" data-r="fl-gone"><span class="s-fi">${icon('clock', 17, 2.2)}</span>
          <span class="mid"><b>${b.when && b.when.mode === 'slot' ? fmtH(b.when.h) : 'That time'} was just taken</b><small>Someone booked it while this was in your cart.</small></span>
          <button class="mini-btn" type="button" ${at} data-kind="time">Change time</button></div>` : ''}
      ${tele ? '' : `<button class="v45-add" type="button" data-r="add" data-act="v45-add" data-k="${L.key}"><span class="v45-addi">${icon('plus', 12, 3)}</span>Add a service to this visit</button>`}
      <div class="foot s-ifoot" data-r="f">${v45Need(need)}
        <button class="s-rmv" type="button" data-act="v45-rm" data-k="${L.key}" aria-label="Remove this visit">${xi('trash', 14, 2)} Remove</button></div>
    </div>`;
  }
  function v45Pkg(i) {
    const P = pkgOf(i), b = bk(i), p = patBy(b.pat), a = addrBy(b.addr), un = unav(i), ss = b.sess || [], on = ss.filter(Boolean).length;
    const at = `data-act="v45-open" data-kind="sess" data-k="${i.key}"`;
    return `<div class="b-item s-item v45-card v45-pkg s-anim ${un ? 'unav' : ''} ${S.sFlash === i.key ? 's-flash' : ''}" data-rc="pk-${i.key}" data-key="${i.key}">
      <div class="v45-h" data-r="h"><span class="v45-eb pk">${xi('calendar', 13, 2.2)}Package<i>${P.n} appointments</i></span><b class="v45-tot">${aed(i.price)}</b></div>
      <div class="v45-pt" data-r="pt"><img class="v45-th" src="${img(svcDetail(i.id).img)}" alt=""><span class="mid"><b>${esc(P.name)} · ${esc(P.label)}</b><small>${esc(catOf(i.cat).name)} · ${P.each} each, at home</small></span></div>
      <div class="v45-logi" data-rc="logi">
        ${v45Row('pat', 'users', 'Patient', esc(whoOf(p)), `data-act="s-row" data-k="${i.key}" data-row="pat"`)}
        ${v45Row('loc', addrIc(a), 'Location', a ? `${esc(a.label)} · ${esc(shortLine(a))}` : '<span class="s-ph">Choose an address</span>', `data-act="s-row" data-k="${i.key}" data-row="addr"`, un ? 'warn' : '')}
      </div>
      <div class="v45-sess" data-rc="sess">
        <div class="v45-sh" data-r="sh"><b>Appointments</b><span class="v45-bar" aria-hidden="true">${ss.map(x => `<i class="${x ? 'on' : ''}"></i>`).join('')}</span><small>${on} of ${P.n} booked</small></div>
        ${ss.map((x, k) => `<button class="v45-sr ${x ? 'on' : 'later'} ${!k && !x ? 'warn' : ''}" type="button" data-r="s${k}" ${at} data-n="${k}">
          <span class="v45-sn">${k + 1}</span>
          <span class="mid"><small>Appointment ${k + 1}${k ? '' : '<em>Required</em>'}</small><b>${x ? sessTxt(x) : k ? 'Schedule later' : 'Choose a date and time'}</b></span>
          ${x ? v45Chev : `<span class="v45-pick">${k ? 'Pick' : 'Choose'}</span>`}</button>`).join('')}
      </div>
      ${un ? unFlag(un, `data-act="s-row" data-k="${i.key}" data-row="addr" data-force="1"`) : ''}
      <p class="v45-hint" data-r="hint">${xi('calendar', 13, 2.2)}<span>${on < P.n ? `Book the other ${P.n - on} now, or any time later from Bookings.` : 'All appointments booked. You can still move them from Bookings.'}</span></p>
      <div class="foot s-ifoot" data-r="f">${v45Need(needOf(i))}
        <button class="s-rmv" type="button" data-act="s-rm" data-k="${i.key}" aria-label="Remove ${esc(P.name)} package">${xi('trash', 14, 2)} Remove</button></div>
    </div>`;
  }
  const v45Cards = items => { const vs = v45Visits(items); return vs.map((v, n) => v45Visit(v, n + 1, vs.length)).join('') + items.filter(pkgOf).map(v45Pkg).join(''); };

  /* a new address saved from the visit sheet goes to everyone in that visit */
  function v45Mates() {
    const M = S.v45mates; if (!M) return;
    const L = byKey(M.lead); if (!L) { S.v45mates = null; return; }
    if (bk(L).addr === M.addr0) return;
    M.keys.forEach(k => { const x = byKey(k); if (x && x !== L) { bk(x).addr = bk(L).addr; bk(x).own = false; } });
    S.v45mates = null;
  }

  /* ---------- the v45-edit sheet ---------- */
  const v45Head = (T, sub) => `<div class="s-es-h"><span class="mid"><h2>${T}</h2><small>${sub}</small></span><button class="s-x" type="button" data-act="v45-close" aria-label="Close">${icon('x', 15, 2.6)}</button></div>`;
  const v45Items = o => (o.kind === 'svc' ? cart().filter(x => grpOf(x) === o.k) : o.kind === 'sess' ? [byKey(o.k)].filter(Boolean) : visitOf(o.k));
  const svcNames = v => [...new Set(v.map(i => i.name))].join(', ');
  function v45SheetHtml() {
    const o = S.v45open, v = o ? v45Items(o) : [];
    if (!v.length) return '<div class="sheet"></div>';
    const L = v[0], b = bk(L);
    if (o.kind === 'loc') {
      return `<div class="sheet s-esheet v45-sheet" role="dialog" aria-label="Visit address"><div class="grab"></div>${v45Head('Visit address', `${esc(svcNames(v))} · for everyone in this visit`)}
        <div class="s-panel s-p-addr s-es-body">${addrs().map(a => {
          const ok = covers(a), c = cityOf(a), off = ok && v.some(i => offIn(c).includes(i.cat));
          return `<button class="s-opt ${b.addr === a.id ? 'on' : ''} ${ok ? '' : 'dis'}" type="button" data-act="v45-addr" data-v="${esc(a.id)}" role="radio" aria-checked="${b.addr === a.id}"><span class="s-ai">${xi(addrIc(a), 16, 2)}</span>
            <span class="mid"><b>${esc(a.label)}${a.dflt ? ' <span class="pill ink">Default</span>' : ''}</b><small>${esc(a.line)}</small>
            ${!ok ? `<em class="s-cov">Not covered yet · coming soon to ${CITY[c]}</em>` : off ? `<em class="s-cov">Not every service here is offered in ${CITY[c]} yet</em>` : ''}</span><span class="radio"></span></button>`; }).join('')}
          <button class="s-opt add" type="button" data-act="v45-add-addr"><span class="s-ai add">${icon('plus', 15, 2.6)}</span>Add new address</button></div></div>`;
    }
    if (o.kind === 'time') {
      const w = b.when, asap = w && w.mode === 'asap', pd = o.pick, hs = HOURS.filter(h => !isPast(pd, h)), night = v.find(i => i.night);
      return `<div class="sheet s-esheet v45-sheet" role="dialog" aria-label="Date and time"><div class="grab"></div>${v45Head('Date &amp; time', `${esc(svcNames(v))} · one time for the whole visit`)}
        <div class="s-panel s-p-when s-es-body">
        <button class="s-asap ${asap ? 'on' : ''}" type="button" data-act="v45-asap"><span class="tile green">${xi('clock', 17, 2.2)}</span>
          <span class="mid"><b>As soon as possible</b><small>Next free team · about 45 min</small></span><span class="pill green live"><i></i>Now</span></button>
        <div class="s-or">or pick a time</div>
        <div class="s-dates">${[0, 1, 2, 3, 4, 5, 6].map(d => { const x = dayOf(d); return `<button class="date-chip ${pd === d ? 'on' : ''}" type="button" data-act="v45-date" data-d="${d}" aria-pressed="${pd === d}"><small>${d === 0 ? 'Today' : d === 1 ? 'Tom' : WD[x.getDay()]}</small><b>${x.getDate()}</b><span>${MO[x.getMonth()]}</span></button>`; }).join('')}</div>
        <div class="s-slots">${hs.length ? hs.map(h => { const full = isFull(pd, h), sel = !asap && w && w.d === pd && w.h === h && !b.gone;
          return `<button class="slot ${sel ? 'on' : ''} ${full ? 'full' : ''}" type="button" ${full ? 'disabled aria-disabled="true"' : `data-act="v45-slot" data-h="${h}"`}>${fmtH(h).replace(':00', '')}${full ? '<small>Full</small>' : ''}</button>`; }).join('') : '<p class="s-none">No times left today. Pick another day.</p>'}</div>
        ${night ? `<p class="s-hint">${icon('clock', 13, 2.2)} ${nightFree(night) ? `No after-10 PM charge on your ${esc(tierNow().name)} plan.` : `Doctor visits from 10 PM add ${aed(night.night)} a person.`}</p>` : ''}</div></div>`;
    }
    if (o.kind === 'svc') {
      const m = coverMap(), tele = isTele(L), w = bk(L).when;
      const person = i => { const ib = bk(i), p = patBy(ib.pat), nt = noteOf(ib), idOk = ID_OPTS.find(x => x.k === ib.idDoc);
        return `<div class="v45-pp" data-r="p-${i.key}">
          <div class="v45-pph"><span class="s-av">${initials(p.name)}</span><span class="mid"><b>${esc(p.name)}</b><small>${p.self ? 'You' : esc(p.rel)}${p.age ? ` · ${p.age} yrs` : ''}</small></span>
            <span class="v45-ppr">${itemCov(i, m) ? inclTag(i.id, true) : aed(i.price)}</span>
            <button class="s-x" type="button" data-act="v45-keep" data-a="s-rm" data-k="${i.key}" aria-label="Remove ${esc(first(p.name))}">${icon('x', 13, 2.8)}</button></div>
          <div class="v45-ppa">
            <button type="button" data-act="v45-via" data-a="s-row" data-k="${i.key}" data-row="pat">${xi('users', 14, 2)} Change person</button>
            ${tele ? `<button type="button" class="${idOk ? '' : 'warn'}" data-act="v45-via" data-a="s-row" data-k="${i.key}" data-row="id">${xi('idcard', 14, 2)} ${idOk ? esc(idOk.v) : 'Add ID'}</button>` : ''}
            <button type="button" data-act="v45-via" data-a="s-row" data-k="${i.key}" data-row="note">${xi('note', 14, 2)} ${nt ? esc(nt) : 'Health note'}</button></div></div>`; };
      return `<div class="sheet s-esheet v45-sheet" role="dialog" aria-label="${esc(L.name)}"><div class="grab"></div>
        ${v45Head(esc(L.name), `${esc(L.sub)} · ${esc(L.dur)}${w ? ` · ${w.mode === 'asap' ? 'as soon as possible' : `${dayShort(w.d)}, ${fmtH(w.h)}`}` : ''}`)}
        <div class="s-es-body">${v.map(person).join('')}
          <button class="s-dup v45-dup" type="button" data-act="v45-keep" data-a="s-dup" data-k="${L.key}"><span class="s-dupi">${icon('plus', 13, 2.8)}</span><span class="mid">Add another person</span><b>+ ${aed(L.price)}</b></button>
          <button class="v45-rmall" type="button" data-act="v45-via" data-a="s-rm-grp" data-k="${L.key}">${xi('trash', 14, 2)} Remove ${esc(L.name)}${v.length > 1 ? ' for everyone' : ''}</button></div></div>`;
    }
    /* sess: one appointment of a package */
    const P = pkgOf(L), ss = b.sess, k = o.n, cur = ss[k], pd = o.pick, p = patBy(b.pat), a = addrBy(b.addr);
    const usedBy = (d, h) => ss.findIndex((x, j) => j !== k && x && x.d === d && x.h === h);
    const prev = ss.filter((x, j) => x && j !== k).sort((x, y) => sessAt(y) - sessAt(x))[0];
    const sug = k && !cur && prev && prev.d + 7 < SESS_DAYS && sessFree(prev.d + 7, prev.h) && usedBy(prev.d + 7, prev.h) < 0 ? { d: prev.d + 7, h: prev.h } : null;
    const hs = SESS_H.filter(h => !isPast(pd, h));
    return `<div class="sheet s-esheet v45-sheet" role="dialog" aria-label="Appointment ${k + 1}"><div class="grab"></div>
      ${v45Head(`Appointment ${k + 1}${k ? '' : ' · required'}`, `${esc(P.name)} · ${esc(P.label)} · ${esc(first(p.name))}${a ? ` at ${esc(a.label)}` : ''}`)}
      <div class="s-panel s-p-when s-es-body">
        ${sug ? `<button class="v45-sug" type="button" data-act="v45-sslot" data-d="${sug.d}" data-h="${sug.h}"><span class="tile">${xi('calendar', 17, 2.2)}</span>
          <span class="mid"><small>Same time, a week later</small><b>${sessTxt(sug)}</b></span><span class="pill ink">Pick</span></button><div class="s-or">or another time</div>` : ''}
        <div class="s-dates v45-days">${[...Array(SESS_DAYS).keys()].map(d => { const x = dayOf(d), bk2 = ss.some((y, j) => j !== k && y && y.d === d);
          return `<button class="date-chip ${pd === d ? 'on' : ''} ${bk2 ? 'v45-has' : ''}" type="button" data-act="v45-sdate" data-d="${d}" aria-pressed="${pd === d}"><small>${d === 0 ? 'Today' : d === 1 ? 'Tom' : WD[x.getDay()]}</small><b>${x.getDate()}</b><span>${MO[x.getMonth()]}</span></button>`; }).join('')}</div>
        <div class="s-slots">${hs.length ? hs.map(h => { const full = !sessFree(pd, h), u = usedBy(pd, h), sel = cur && cur.d === pd && cur.h === h;
          return `<button class="slot ${sel ? 'on' : ''} ${full || u >= 0 ? 'full' : ''}" type="button" ${full || u >= 0 ? 'disabled aria-disabled="true"' : `data-act="v45-sslot" data-h="${h}"`}>${fmtH(h).replace(':00', '')}${u >= 0 ? `<small>Appt ${u + 1}</small>` : full ? '<small>Full</small>' : ''}</button>`; }).join('') : '<p class="s-none">No times left today. Pick another day.</p>'}</div>
        ${k ? `<button class="btn btn-secondary v45-later" type="button" data-act="v45-slater">${cur ? 'Remove this time · schedule later' : 'Schedule later'}</button>
          <p class="s-hint">${icon('calendar', 13, 2.2)} You can book it any time from Bookings. The package price stays the same.</p>`
        : `<p class="s-hint">${icon('alert', 13, 2.2)} The first appointment is booked with the package. The rest can wait.</p>`}
      </div></div>`;
  }
  F.SHEETS['v45-edit'] = () => withGold(v45SheetHtml);
  /* the sheet follows S.v45open; s-edit (S.sOpen) wins when both are asked for */
  function v45Draw() {
    const Lr = F.el.sheet, old = S.sheet === 'v45-edit' && Lr.querySelector('.sheet');
    const sc = old ? (old.querySelector('.s-es-body') || {}).scrollTop || 0 : 0, dl = old && old.querySelector('.v45-days') ? old.querySelector('.v45-days').scrollLeft : null;
    F.openSheet('v45-edit');
    const nw = Lr.querySelector('.sheet'); if (!nw) return;
    const body = nw.querySelector('.s-es-body'), days = nw.querySelector('.v45-days');
    if (body) body.scrollTop = sc;
    if (days) {                                     /* no smooth scroll here, or the next redraw reads a half-way value */
      days.style.scrollBehavior = 'auto';
      if (dl !== null) days.scrollLeft = dl; else { const on = days.querySelector('.on'); if (on) days.scrollLeft = Math.max(0, on.offsetLeft - days.offsetLeft - 60); }
      days.style.scrollBehavior = '';
    }
  }
  function syncV45() {
    if (S.sOpen) { S.v45open = null; return; }
    const up = S.sheet === 'v45-edit';
    if (S.v45open && S.screen === 'cart') { if (v45Items(S.v45open).length) v45Draw(); else { S.v45open = null; if (up) F.closeSheet(); } }
    else if (!S.v45open && up) F.closeSheet();
  }
  {
    const c = F.SCREENS.cart, u0 = c.update;
    c.update = function (n) { const r = u0.apply(this, arguments); syncV45(); return r; };
    const close0 = F.ACT['sheet-close'];
    F.ACT['sheet-close'] = (n, e) => { if (S.sheet === 'v45-edit') { S.v45open = null; F.closeSheet(); return; } return close0(n, e); };
    /* Pay with something missing: open the visit or appointment that needs it */
    const proceed0 = F.ACT['s-proceed'];
    F.ACT['s-proceed'] = n => {
      if (!v45on() || S.guest) return proceed0(n);
      const bad = cart().find(i => needOf(i)), nd = bad && needOf(bad);
      if (!bad || !(nd.row === 'sess' || (!pkgOf(bad) && (nd.row === 'when' || (nd.row === 'addr' && !(bad.grp && bk(bad).own)))))) return proceed0(n);
      blurMine(true);
      const L = pkgOf(bad) ? bad : visitOf(bad.key)[0] || bad;
      S.sFocus = L.key; F.upd(); scrollToKey(F.cur()); F.shake(`[data-key="${L.key}"]`);
      v45Open(pkgOf(bad) ? { kind: 'sess', k: bad.key, n: 0 } : { kind: nd.row === 'when' ? 'time' : 'loc', k: L.key });
      F.toast(`${nd.t} for ${esc(pkgOf(bad) ? pkgOf(bad).name : bad.name)}`, 'alert');
    };
  }
  function v45Open(o) {
    const v = v45Items(o); if (!v.length) return;
    const b = bk(v[0]);
    if (o.kind === 'time') o.pick = b.when && b.when.mode === 'slot' ? b.when.d : 0;
    if (o.kind === 'sess') { const x = b.sess[o.n] || b.sess.filter(Boolean).pop(); o.pick = x ? x.d : (sessFirst() || { d: 1 }).d; }
    S.sOpen = null; S.v45mates = null; S.v45open = o; F.upd();
  }
  const v45Close = () => { S.v45open = null; F.upd(); };
  const v45Each = fn => { const o = S.v45open, v = o ? v45Items(o) : []; v.forEach(i => fn(bk(i), i)); return v; };
  /* after a time change: did this visit join another one at the same address and time? */
  const joinedMsg = (lead, n0) => { const v = visitOf(lead.key); return v.length > n0 ? ' · joined your other visit then' : ''; };
  Object.assign(F.ACT, {
    'v45-open': n => { blurMine(true); v45Open({ kind: n.dataset.kind, k: n.dataset.k, n: n.dataset.n === undefined ? 0 : +n.dataset.n }); },
    'v45-close': () => v45Close(),
    'v45-via': n => { const a = n.dataset.a; S.v45open = null; F.closeSheet(true); if (F.ACT[a]) F.ACT[a](n); },
    'v45-keep': n => { const a = n.dataset.a; if (F.ACT[a]) F.ACT[a](n); },
    'v45-addr': n => {
      const a = addrBy(n.dataset.v), v = v45Items(S.v45open || {}); if (!a || !v.length) return;
      if (!covers(a)) { F.toast(`We don’t visit ${CITY[cityOf(a)]} yet — coming soon. Pick an address in Dubai or Sharjah.`, 'pin'); F.shake('.v45-sheet .s-opt.dis'); return; }
      const n0 = v.length;
      v.forEach(i => { bk(i).addr = a.id; bk(i).own = false; });
      v45Close();
      const L = v[0];
      F.toast(`Visit moved to ${esc(a.label)}${joinedMsg(L, n0)}`, 'pin');
      if (v.some(unav)) setTimeout(() => F.shake(`[data-key="${visitOf(L.key)[0].key}"] .s-flag`), 300);
    },
    'v45-add-addr': () => {
      const v = v45Items(S.v45open || {}); if (!v.length) return;
      const L = v[0];
      S.v45open = null; F.closeSheet(true);
      S.v45mates = { lead: L.key, keys: v.map(i => i.key), addr0: bk(L).addr };
      F.ACT['s-add-addr']({ dataset: { k: L.key } });
    },
    'v45-asap': () => { const v = v45Each(b => { b.when = { mode: 'asap' }; b.gone = false; }); const n0 = v.length; v45Close(); if (v[0]) F.toast(`As soon as possible · about 45 min${joinedMsg(v[0], n0)}`, 'clock'); },
    'v45-date': n => { if (S.v45open) { S.v45open.pick = +n.dataset.d; F.upd(); } },
    'v45-slot': n => {
      const o = S.v45open; if (!o) return;
      const h = +n.dataset.h, w = { mode: 'slot', d: o.pick, h };
      const v = v45Each(b => { b.when = { ...w }; b.gone = false; }), n0 = v.length;
      v45Close();
      if (!v[0]) return;
      const fee = h >= 22 && v.some(i => i.night && !nightFree(i));
      F.toast(`${dayShort(w.d)} · ${fmtH(h)}${fee ? ` · after-10 PM charge added` : ''}${joinedMsg(v[0], n0)}`, 'clock');
    },
    'v45-sdate': n => { if (S.v45open) { S.v45open.pick = +n.dataset.d; F.upd(); } },
    'v45-sslot': n => {
      const o = S.v45open, it = o && byKey(o.k); if (!it) return;
      const b = bk(it), x = { mode: 'slot', d: n.dataset.d !== undefined ? +n.dataset.d : o.pick, h: +n.dataset.h };
      b.sess[o.n] = x; sessSort(b);
      const at = b.sess.findIndex(y => y && y.d === x.d && y.h === x.h);
      v45Close();
      F.toast(`Appointment ${at + 1} · ${sessTxt(x)}${at !== o.n ? ' · sorted by date' : ''}`, 'check');
    },
    'v45-slater': () => {
      const o = S.v45open, it = o && byKey(o.k); if (!it || !o.n) return;
      const b = bk(it), had = !!b.sess[o.n];
      b.sess[o.n] = null; sessSort(b);
      v45Close();
      F.toast(had ? `Time removed · book it later from Bookings` : `Appointment ${o.n + 1} · schedule later`, 'calendar');
    },
    'v45-add': n => {
      const v = visitOf(n.dataset.k); if (!v.length) return;
      const b = bk(v[0]);
      S.v45to = { addr: b.addr, when: b.when ? { ...b.when } : null };
      F.ACT['s-browse']();
      F.toast('Pick a service · it joins this visit', 'plus');
    },
    'v45-rm': n => {
      const items = cart(), v = visitOf(n.dataset.k); if (!v.length) return;
      lastGroup = items.map((x, idx) => ({ it: x, b: bkAll()[x.key], idx })).filter(o => v.includes(o.it));
      S.cart = items.filter(x => !v.includes(x)); lastGroup.forEach(o => { delete bkAll()[o.it.key]; });
      S.v45open = null; F.upd();
      F.toast(`Visit removed · ${plural(v.length, 'service')} ${tAct('Undo', 's-undo-grp')}`, 'check');
    },
  });

  /* presenter helpers */
  F.sSlotTaken = () => { const it = cart().find(i => !PKG[i.id] && bk(i).when && bk(i).when.mode === 'slot'); if (!it) return false; bk(it).gone = true; S.sOpen = null; if (S.screen === 'cart') F.upd(); return true; };
  F.sFailNext = () => { S.sFailNext = true; };

  /* =====================================================================
     Presenter preps (panel jumps)
     ===================================================================== */
  const P = F.DEVPREP = F.DEVPREP || {}, at = { dir: 'fade' };
  function base(ids, over) {
    clearTimeout(payT); F.closeSheet(true); blurMine(true); S.sEditUp = false; S.sAddPlan = null; S.sPlanPick = null; S.v22City = null; S.v24inc = 'tiles'; S.v28how = 'line'; S.v29rev = 'a'; S.v32cta = 'a';
    S.cart = []; S.sBk = {}; S.coupon = null; S.sCode = ''; S.sCodeErr = ''; S.sOpen = null; S.sPaying = false;
    S.sNew = null; S.sCardF = null; S.sCardErr = null; S.sSaveCard = false; S.sFailNext = false; S.sRetried = false; S.guest = false;
    ids.forEach(id => { const prev = S.cart[S.cart.length - 1], it = makeItem(id); it.key = id; bkAll()[id] = prefill(it, prev); S.cart.push(it); });
    S.cart.forEach(i => { if (over && over[i.key]) Object.assign(bk(i), over[i.key]); });
  }
  const openSvc = (id, set) => { S.sSvcStack = []; S.svc = id; Object.assign(selOf(id), { dose: 0, addons: [], faq: 0, inc: false, how: false, rev: false, flash: 0 }, set || {}); barShown = false; F.go('service', at); };
  const mixed = () => ['gp', 'nad'];          /* a Gold member sees the GP visit included and NAD+ priced */
  const son = () => (pats()[2] || pats()[pats().length - 1]).id;
  P.sGp = () => { base(['gp', 'cbc']); openSvc('gp'); };
  P.sNad = () => { base(['gp', 'cbc']); openSvc('nad', { dose: 1, addons: ['glut'] }); };
  P.sTeleSvc = () => { base(['gp', 'cbc']); openSvc('tele'); };
  /* v20 service page: full-bleed photo or the card summary, and the section tabs */
  P.v20Bleed = () => { S.v20hero = 'bleed'; P.sGp(); };
  P.v22Sharjah = () => { S.v20hero = 'bleed'; P.sGp(); S.v22City = 'sharjah'; F.upd(); };
  P.v22Lab = () => { S.v20hero = 'bleed'; base(['gp']); openSvc('cbc'); };
  P.v20Card = () => { S.v20hero = 'card'; P.sGp(); };
  P.v20Nad = () => { S.v20hero = 'bleed'; base(['gp', 'cbc']); openSvc('nad'); };
  const v24Open = (mode, id) => { S.v20hero = 'bleed'; base(['gp', 'cbc']); S.v24inc = mode; openSvc(id || 'gp');
    setTimeout(() => {                                          /* instant, so the panel always lands on the section */
      const n = F.cur(), b = n && n.querySelector('.v20-tab[data-to="inc"]'), body = n && n.querySelector('.scr-body'), el = n && n.querySelector('[data-r="inc"]');
      if (!b || !body || !el || S.screen !== 'service') return;
      F.ACT['v20-jump'](b); body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - V20_BAR - 12); body.dispatchEvent(new Event('scroll'));
    }, 500); };
  P.v24IncA = () => v24Open('tiles');
  const v27Open = (id, to) => { S.v20hero = 'bleed'; base(['gp', 'cbc']); openSvc(id);
    setTimeout(() => { const n = F.cur(), b = n && n.querySelector(`.v20-tab[data-to="${to}"]`), body = n && n.querySelector('.scr-body'), el = n && n.querySelector(`[data-r="${to}"]`);
      if (!b || !body || !el || S.screen !== 'service') return;
      F.ACT['v20-jump'](b); body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - V20_BAR - 12); body.dispatchEvent(new Event('scroll')); }, 500); };
  P.v32CtaA = () => { v27Open('gp', 'faq'); S.v32cta = 'a'; F.upd(); };
  P.v32CtaB = () => { v27Open('gp', 'faq'); S.v32cta = 'b'; F.upd(); };
  P.v32CtaC = () => { v27Open('gp', 'faq'); S.v32cta = 'c'; F.upd(); };
  P.v32All = () => { S.v20hero = 'bleed'; base(['gp', 'cbc']); S.svc = 'gp'; F.ACT['v32-faqs'](); };
  P.v27How = () => { S.v28how = 'line'; v27Open('gp', 'how'); };
  P.v28HowNum = () => { v27Open('gp', 'how'); S.v28how = 'num'; F.upd(); };
  P.v28HowCards = () => { v27Open('gp', 'how'); S.v28how = 'cards'; F.upd(); };
  P.v28Added = () => { S.v20hero = 'bleed'; base(['gp', 'cbc']); openSvc('gp'); setTimeout(() => { const b = F.cur() && F.cur().querySelector('[data-act="s-add"]'); if (b && S.screen === 'service') b.click(); }, 500); };
  P.v27HowLab = () => { S.v28how = 'line'; v27Open('cbc', 'how'); };
  P.v27HowNurse = () => { S.v28how = 'line'; v27Open('shift4', 'how'); };
  P.v26Reviews = () => { S.v20hero = 'bleed'; base(['gp', 'cbc']); openSvc('gp');
    setTimeout(() => { const n = F.cur(), b = n && n.querySelector('.v20-tab[data-to="rev"]'), body = n && n.querySelector('.scr-body'), el = n && n.querySelector('[data-r="rev"]');
      if (!b || !body || !el || S.screen !== 'service') return;
      F.ACT['v20-jump'](b); body.scrollTop = Math.max(0, offTop(el, n) - offTop(body, n) - V20_BAR - 12); body.dispatchEvent(new Event('scroll')); }, 500); };
  P.v29RevA = () => { P.v26Reviews(); S.v29rev = 'a'; };
  P.v29RevB = () => { P.v26Reviews(); S.v29rev = 'b'; F.upd(); };
  P.v29RevC = () => { P.v26Reviews(); S.v29rev = 'c'; F.upd(); };
  P.v31D1 = () => { P.v26Reviews(); S.v29rev = 'd1'; F.upd(); };
  P.v31D2 = () => { P.v26Reviews(); S.v29rev = 'd2'; F.upd(); };
  P.v31D3 = () => { P.v26Reviews(); S.v29rev = 'd3'; F.upd(); };
  P.v26RevsAll = () => { P.v26Reviews(); setTimeout(() => { if (S.screen === 'service') F.ACT['v26-revs'](); }, 800); };
  P.v24IncB = () => v24Open('every');
  P.v24IncLab = () => v24Open('tiles', 'cbc');
  P.v25IncNad = () => v24Open('tiles', 'nad');
  P.v20Tabs = () => { S.v20hero = 'bleed'; P.sGp(); setTimeout(() => { const b = F.cur() && F.cur().querySelector('.v20-tab[data-to="rev"]'); if (b && S.screen === 'service') F.ACT['v20-jump'](b); }, 500); };
  P.sCartGroup = () => { S.v43addr = 'b'; base(mixed()); dupItem(byKey('gp')); F.go('cart', at); };
  /* v43: Sara and Yusuf at Home, Fatima (her mother) at Mum’s place in Sharjah, tomorrow from 10 AM */
  function v43Cart(m, away = true) {
    S.v43addr = m; base(['gp'], { gp: { pat: selfId(), when: { mode: 'slot', d: 1, h: 10 } } });
    const L = byKey('gp'), f = dupItem(L).it; dupItem(L);
    const mum = addrs().find(a => cityOf(a) === 'sharjah');
    if (away && mum) { if (m === 'c') splitOut(f, mum, true); else { bk(f).addr = mum.id; bk(f).own = true; } }
    return f;
  }
  F.v43 = {
    cart: (m, away) => { v43Cart(m, away); F.go('cart', at); },
    sheet: m => { const f = v43Cart(m, false); F.go('cart', at); setTimeout(() => { if (S.screen === 'cart') { S.sOpen = { k: f.key, row: 'paddr' }; F.upd(); } }, 80); },
    who: () => { v43Cart('b', false); F.go('cart', at); setTimeout(() => { if (S.screen === 'cart') { S.sOpen = { k: 'gp', row: 'stopwho' }; F.upd(); } }, 80); },
    pay: () => { v43Cart('b'); S.sPay = defCard(); S.sOsum = true; F.go('checkout', at); },
    done: () => { v43Cart('b'); S.sPay = defCard(); completeBooking(); F.go('book-done', at); },
  };
  const familyCart = () => { if (typeof F.setMember === 'function') F.setMember(null); base(mixed()); dupItem(byKey('gp')); };
  P.sCartGold = () => { familyCart(); F.go('cart', at); };
  P.sCartGoldOn = () => { familyCart(); S.sAddPlan = 'gold'; S.sPlanPick = 'gold'; F.go('cart', at); };
  P.sCart = () => { base(mixed()); F.go('cart', at); };
  P.sCartTime = () => { base(mixed()); S.sOpen = { k: 'gp', row: 'when' }; bk(byKey('gp')).pick = 0; F.go('cart', at); };
  P.sCartPat = () => { base(mixed()); S.sOpen = { k: 'nad', row: 'pat' }; F.go('cart', at); };
  P.sCartAddr = () => { base(mixed()); S.sOpen = { k: 'gp', row: 'addr' }; F.go('cart', at); };
  P.sCartTele = () => { base(['gp', 'tele'], { tele: { pat: (pats()[1] || pats()[0]).id, idDoc: '' } }); S.sOpen = { k: 'tele', row: 'id' }; F.go('cart', at); };
  P.sCartIssues = () => {
    const mum = addrs().find(a => cityOf(a) === 'sharjah');
    base(['gp', 'scaling', 'cbc'], { gp: { gone: true }, scaling: mum ? { addr: mum.id } : {} });
    if (!mum) bk(byKey('scaling')).addr = 'none';
    F.go('cart', at);
  };
  P.sCartCoupon = () => { base(mixed()); S.coupon = { ...COUPONS[0] }; F.go('cart', at); };
  P.sCartEmpty = () => { base([]); F.go('cart', at); };
  P.sClear = () => { P.sCart(); setTimeout(() => { if (S.screen === 'cart') F.openSheet('s-clear'); }, 60); };
  /* Pay with two days and a night visit: the GP visit is for Yusuf (not on a Gold plan) at 10 PM */
  const payCart = () => base(mixed(), { gp: { pat: son(), idDoc: '', when: { mode: 'slot', d: 0, h: 22 }, chips: ['Fever'] }, nad: { when: { mode: 'slot', d: 1, h: 10 } } });
  P.sCheckout = () => { payCart(); S.sPay = defCard(); S.sOsum = true; F.go('checkout', at); };
  P.sNewCard = () => { payCart(); S.sPay = 'new'; S.sOsum = false; F.go('checkout', at); };
  P.sApplePay = () => { payCart(); S.sPay = 'apple'; S.sOsum = false; F.go('checkout', at); };
  P.sPlanCovered = () => { if (!tierNow() && typeof F.setMember === 'function') F.setMember('gold'); base(['gp', 'cbc']); S.sOsum = true; F.go('checkout', at); };
  P.sPaying = () => { payCart(); S.sPay = defCard(); S.sOsum = false; F.go('checkout', at); F.ACT['s-pay'](); };
  P.sDone = () => { payCart(); S.sPay = defCard(); completeBooking(); F.go('book-done', at); };
  P.sPayFail = () => { payCart(); S.sPay = (cards().find(c => c.brand === 'mc') || cards()[0] || {}).id; S.sOsum = false; F.go('checkout', at); setTimeout(() => { if (onPay()) F.openSheet('s-payfail'); }, 60); };
  /* v45 presets: Sara and Fatima's GP visit with Sara's blood test (today, the next free time), and Fatima's knee rehab
     package with appointments 1 and 2 on Thu 8 Oct and Sat 10 Oct at 10 AM, the week after her current physio session */
  const mumId = () => (pats().find(p => /mother/i.test(p.rel || '')) || pats()[1] || pats()[0]).id;
  function v45Cart(kind) {
    S.v45cart = 'new'; S.v45open = null; S.v45to = null; S.v45mates = null;
    D.appointments.upcoming = D.appointments.upcoming.filter(a => !a.v45demo);
    Object.keys(S.v45pkgs || {}).forEach(k => { if (S.v45pkgs[k].demo) delete S.v45pkgs[k]; });
    const ids = kind === 'package' ? ['knee5'] : kind === 'visit' ? ['gp', 'cbc'] : ['gp', 'cbc', 'knee5'];
    base(ids, { knee5: { pat: mumId(), sess: [{ mode: 'slot', d: 10, h: 10 }, { mode: 'slot', d: 12, h: 10 }, null, null, null], when: { mode: 'slot', d: 10, h: 10 } } });
    if (kind !== 'package') { bk(byKey('gp')).pat = selfId(); bk(dupItem(byKey('gp')).it).pat = mumId(); }
  }
  const v45Book = kind => { v45Cart(kind); S.sPay = defCard(); S.v45demo = true; completeBooking(); S.v45demo = false; };
  const sheetSoon = o => setTimeout(() => { if (S.screen === 'cart') v45Open(o); }, 80);
  F.v45 = {
    cart: kind => { v45Cart(kind); F.go('cart', at); },
    time: () => { v45Cart('both'); F.go('cart', at); sheetSoon({ kind: 'time', k: 'gp' }); },
    svc: () => { v45Cart('both'); F.go('cart', at); sheetSoon({ kind: 'svc', k: 'gp' }); },
    sess: () => { v45Cart('both'); F.go('cart', at); sheetSoon({ kind: 'sess', k: 'knee5', n: 2 }); },
    pay: () => { v45Cart('both'); S.sPay = defCard(); S.sOsum = true; F.go('checkout', at); },
    done: () => { v45Book('both'); F.go('book-done', at); },
    detail: (sched, which) => {
      v45Book('both'); S.apptTab = 'upcoming'; F.go('appts', { dir: 'none' });
      const ids = S.sLast.ids, pk = D.appointments.upcoming.find(a => ids.includes(a.id) && a.pkg);
      F.openAppt(which === 'visit' || !pk ? ids[0] : pk.id, { dir: 'fade' });
      if (sched) setTimeout(() => { if (S.screen === 'appt-details' && F.v45sched) F.v45sched(2); }, 120);
    },
  };
})();
