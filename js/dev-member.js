/* FRH Healthcare (final) — navigation, membership and medical reports.
   Spec IDs M1–M23 and P7–P10 (spec/final-decisions.js). Loads after every original screen file and
   after the other builders' dev-*.js, so the definitions here win.

   Tab bar (M1–M5)
     F.tabbar(active)         4 tabs: Home · Appointments · Chat · Profile — keys 'home'|'appts'|'chat'|'profile'.
                              Chat carries the unread count (F.chatUnread() when the chat builder exposes it).
   Membership (pushed from Profile, M3, M6–M15, M22, M23)
     membership               member view, or the plan comparison for non-members
     m-plans                  compare / upgrade, for members
     m-plan                   plan detail → Join / Renew
     m-schedule               book an included service, no payment step (M14)
     sheets                   m-pay (pay step) · m-welcome (join / renew / upgrade done) ·
                              m-booked (included visit booked — the payment-success layout, M15) · m-share
   Medical reports (M16–M21, P7–P10)
     reports-hub              THE Medical reports list (the old 'reports' id points here too)
     lab-report               interactive lab report with range bars (M18, M19; M20 is `later`)
     e-rx                     the one e-prescription page (M21)
   Contracts
     F.setMember(tierKey|null)          presenter switch: 'silver' | 'gold' | 'platinum', or null (non-member)
     F.memberTier() · F.memberCoverage(key) · F.memberPrice(key, priceHtml, { short }) · F.memberVisit(apptId)
     F.openReport(id) · F.openReports({ visit, who }) · F.openRx(id)
   Plan prices, allowances and perks are placeholders for FRH to confirm. */
(function () {
  const FI = window.FRHI, { mark } = FI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK || {};
  const esc = s => F.esc(s == null ? '' : s);
  const img = n => `assets/img/${n}`;
  const aed = n => 'AED ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const aed2 = n => 'AED ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const first = n => String(n || '').trim().split(/\s+/)[0];
  const initials = n => String(n || '').replace(/^Dr\.?\s+/, '').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  const andList = a => (a.length < 2 ? a[0] || '' : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ---------- icons the shared set lacks (24 grid, same stroke style as icons.js) ---------- */
  const XP = {
    crown: '<path d="M3.5 8.5 7.6 12 12 5.5l4.4 6.5 4.1-3.5-1.7 10H5.2z"/><path d="M5.5 21h13"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    zap: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5"/><path d="M12 12v9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>',
    folder: '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  };
  const xi = (n, s = 20, w = 1.8) => (XP[n]
    ? `<svg class="ic ic-${n}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XP[n]}</svg>`
    : FI.icon(n, s, w));
  const icon = FI.icon;
  /* filled tab icons — the selected tab switches from outline to filled, as iOS does */
  const FILL = {
    home: '<path d="M12 3.2 3.4 10.3h2.1V20a1 1 0 0 0 1 1h3.6v-5.5a.9.9 0 0 1 .9-.9h2a.9.9 0 0 1 .9.9V21h3.6a1 1 0 0 0 1-1v-9.7h2.1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.6"/><path d="M8 2.8V6.5M16 2.8V6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 10h17" stroke="#fff" stroke-width="1.5"/><g fill="#fff"><circle cx="8" cy="13.6" r="1.1"/><circle cx="12" cy="13.6" r="1.1"/><circle cx="16" cy="13.6" r="1.1"/><circle cx="8" cy="17.2" r="1.1"/><circle cx="12" cy="17.2" r="1.1"/></g>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
    user: '<circle cx="12" cy="7.8" r="4.3"/><path d="M3.8 20.2a8.2 8.2 0 0 1 16.4 0 .8.8 0 0 1-.8.8H4.6a.8.8 0 0 1-.8-.8z"/>',
  };
  const fi = (n, s = 24) => `<svg class="ic ic-${n}-fill" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">${FILL[n]}</svg>`;

  /* ---------- shared bits ---------- */
  const ALLA = () => [...D.appointments.upcoming, ...D.appointments.completed, ...D.appointments.cancelled];
  const findAppt = id => ALLA().find(a => a.id === id);
  const svcIcon = s => (/doctor|gp|consult/i.test(s) ? 'stetho' : /physio/i.test(s) ? 'physio' : /lab|test|blood/i.test(s) ? 'lab'
    : /iv|drip/i.test(s) ? 'drip' : /vacc/i.test(s) ? 'syringe' : /nurs/i.test(s) ? 'users' : /tele|video/i.test(s) ? 'video' : /dent/i.test(s) ? 'heartPulse' : 'stetho');
  const openAppt = id => {
    if (typeof F.openAppt === 'function') return F.openAppt(id);
    if (F.ACT['appt-open']) return F.ACT['appt-open']({ dataset: { id } });
    return F.go('appts');
  };
  const openPdf = (title, back) => (typeof F.openPdf === 'function'
    ? F.openPdf({ title, kind: 'report', back: back || S.screen })
    : F.go('px-pdf'));
  const openSupport = () => (typeof F.openSupportChat === 'function' ? F.openSupportChat() : F.go('chat-home'));
  const saved = n => F.toast(`${n} saved to Files`, 'download');
  const backNav = (title, fb, right = '') => `<div class="nav"><button class="nav-btn" type="button" data-act="m-back" data-fb="${fb}" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">${title}</span>${right || '<span style="width:42px"></span>'}</div>`;
  const okBadge = () => '<div class="ok-badge" style="width:84px;height:84px"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#12805A"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';

  /* re-render nav / body / foot in place on F.upd(): identical HTML is skipped, scroll is kept */
  const sig = n => [...n.children].map(c => c.className).join('|');
  function patch(def) {
    def.update = n => {
      const t = document.createElement('div');
      t.innerHTML = def.render();
      if (sig(t) !== sig(n)) {
        const b = n.querySelector('.scr-body'), y = b ? b.scrollTop : 0;
        n.innerHTML = t.innerHTML;
        const b2 = n.querySelector('.scr-body'); if (b2) b2.scrollTop = y;
        return;
      }
      [...t.children].forEach((c, i) => {
        const a = n.children[i];
        if (a && a.innerHTML !== c.innerHTML) { const y = a.scrollTop; a.innerHTML = c.innerHTML; a.scrollTop = y; }
      });
    };
    return def;
  }
  const reSheet = kind => {
    if (S.sheet !== kind) return;
    const L = F.el.sheet;
    L.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>${F.SHEETS[kind]()}`;
  };

  /* ================= 12 Tab bar (M1–M5) ================= */
  const TABS = [
    { key: 'home', to: 'home', ic: 'home', label: 'Home' },
    { key: 'services', to: 'cats', ic: 'stetho', label: 'Services' },
    { key: 'appts', to: 'appts', ic: 'calendar', label: 'Bookings' },
    { key: 'chat', to: 'chat-home', ic: 'chat', label: 'Chat' },
    { key: 'profile', to: 'profile-home', ic: 'user', label: 'Account' },
  ];
  /* Fallback mirrors the visit threads the chat builder seeds with unread messages (read state in S.tRead). */
  const UNREAD0 = { 'FRH-24817': 2, 'FRH-24512': 1 };
  function chatUnread() {
    if (typeof F.chatUnread === 'function') { try { return Math.max(0, +F.chatUnread() || 0); } catch (e) { /* use the fallback */ } }
    const read = S.tRead || {};
    return Object.keys(UNREAD0).reduce((n, id) => n + (read[id] ? 0 : UNREAD0[id]), 0);
  }
  let lastTab = null;
  F.tabbar = active => {
    const pop = lastTab !== null && active !== lastTab;
    if (TABS.some(t => t.key === active)) lastTab = active;
    const n = chatUnread();
    return `<nav class="tabbar m-tabbar" aria-label="Main">${TABS.map(t => {
      const on = active === t.key, badge = t.key === 'chat' && n ? `<i class="m-tab-badge">${n > 9 ? '9+' : n}</i>` : '';
      return `<button class="tab m-tab${on ? ' on' : ''}${on && pop ? ' pop' : ''}" type="button" data-act="m-tabgo" data-to="${t.to}"${on ? ' aria-current="page"' : ''} aria-label="${t.label}${badge ? `, ${n} unread` : ''}">
          <span class="m-tab-ic">${on && FILL[t.ic] ? fi(t.ic, 25) : icon(t.ic, 24, on ? 2.4 : 1.9)}${badge}</span><span class="m-tab-l">${t.label}</span></button>`;
    }).join('')}</nav>`;
  };
  /* Profile is a tab root: give the profile screen the bar if its render doesn't include one. */
  const pDef = F.SCREENS['profile-home'];
  if (pDef && !pDef._mTab) {
    const r = pDef.render;
    pDef.render = function () { const h = r.apply(this, arguments); return /class="tabbar/.test(h) ? h : h + F.tabbar('profile'); };
    pDef._mTab = true;
  }

  /* ================= plan data (placeholders — FRH to confirm every figure) ================= */
  const SVC = {
    doctor: { icon: 'stetho', name: 'Doctor home visits', sub: 'GP or paediatric visit at home', covers: ['gp', 'peds'], svc: 'Doctor on Call', book: 'GP home visit', dur: '30–45 min', unit: ['doctor visit', 'doctor visits'], short: 'Doctor home visits', price: 350 },
    tele: { icon: 'video', name: 'Video consultations', sub: 'A doctor on video in about 15 minutes', covers: ['tele'], svc: 'Teleconsultation', book: 'Video consultation', dur: '15 min', unit: ['video consultation', 'video consultations'], short: 'Video consultations', price: 99 },
    lab: { icon: 'lab', name: 'Lab panels', sub: 'Full blood count or Vitamin D + B12, sampled at home', covers: ['cbc', 'vitd'], svc: 'Lab Tests', book: 'Lab panel at home', dur: 'Sample in 15 min · results in 24 hrs', unit: ['lab panel', 'lab panels'], short: 'Lab panels', price: 140 },
    physio: { icon: 'physio', name: 'Physiotherapy sessions', sub: 'Orthopaedic or rehab, 45–60 min', covers: ['ortho'], svc: 'Physiotherapy', book: 'Physiotherapy session', dur: '45–60 min', unit: ['physio session', 'physio sessions'], short: 'Physiotherapy', price: 300 },
    iv: { icon: 'drip', name: 'IV drips', sub: 'Immunity or hydration drip', covers: ['immune', 'hydra'], svc: 'IV Therapy at Home', book: 'IV drip at home', dur: '45–60 min', unit: ['IV drip', 'IV drips'], short: 'IV drips', price: 450 },
    nursing: { icon: 'users', name: 'Nursing shifts', sub: '4-hour shift, DHA-licensed nurse', covers: ['shift4'], svc: 'Home Nursing', book: 'Nursing shift · 4 hours', dur: '4 hrs', unit: ['nursing shift', 'nursing shifts'], short: 'Nursing shifts', price: 250 },
    dental: { icon: 'heartPulse', name: 'Dental check-ups', sub: 'Exam and treatment plan at home', covers: ['dcheck'], svc: 'Dentist at Home', book: 'Dental check-up', dur: '30 min', unit: ['dental check-up', 'dental check-ups'], short: 'Dental check-ups', price: 250 },
  };
  const SVC_ORDER = ['doctor', 'tele', 'lab', 'physio', 'iv', 'nursing', 'dental'];
  const BEN = {
    priority: (m) => ({ ic: 'zap', t: 'Priority booking', d: `First pick of slots, and a team in about ${m} minutes` }),
    night: { ic: 'moon', t: 'No night-visit surcharge', d: 'Visits after 10 PM cost the same as daytime' },
    off: p => ({ ic: 'percent', t: `${p}% off other services`, d: 'Anything outside your plan, booked in the app' }),
    follow: { ic: 'refresh', t: 'Free follow-up call', d: 'A doctor calls you within 48 hours of a visit' },
    resched: { ic: 'calendar', t: 'Free rescheduling', d: 'Move a visit up to 2 hours before, at no charge' },
    line: { ic: 'headset', t: 'Member support', d: 'Skip the queue when you message or call FRH' },
    coord: { ic: 'headset', t: 'Personal care coordinator', d: 'On WhatsApp, 8 AM to 10 PM, every day' },
    meds: { ic: 'box', t: 'Free medicine delivery', d: 'Prescriptions delivered the same day' },
  };
  const TIER = {
    silver: { name: 'Silver', price: 799, people: 1, covers: [0], coverShort: 'Just you', tagline: 'A doctor on hand, just for you', off: 10,
      services: [{ k: 'doctor', n: 2 }, { k: 'tele', n: 4 }, { k: 'lab', n: 1 }],
      benefits: [BEN.off(10), BEN.follow, BEN.resched, BEN.line] },
    gold: { name: 'Gold', price: 2499, people: 2, covers: [0, 1], coverShort: 'You + 1', tagline: 'For you and one family member', off: 15, popular: true,
      services: [{ k: 'doctor', n: 4 }, { k: 'tele', n: 6 }, { k: 'lab', n: 2 }, { k: 'physio', n: 6 }, { k: 'iv', n: 1 }],
      benefits: [BEN.priority(60), BEN.night, BEN.off(15), { ic: 'users', t: 'Covers one family member', d: 'A parent, partner or child shares your plan' }, BEN.follow, BEN.resched] },
    platinum: { name: 'Platinum', price: 5999, people: 4, covers: [0, 1, 2], coverShort: 'You + 3', tagline: 'The whole family, fully covered', off: 20,
      services: [{ k: 'doctor', n: 8 }, { k: 'tele', n: 12 }, { k: 'lab', n: 4 }, { k: 'physio', n: 12 }, { k: 'iv', n: 3 }, { k: 'nursing', n: 4 }, { k: 'dental', n: 2 }],
      benefits: [BEN.coord, BEN.priority(45), BEN.night, { ic: 'users', t: 'Covers up to four people', d: 'Add parents, a partner or children' }, BEN.off(20), BEN.meds, BEN.follow, BEN.resched] },
  };
  const TIERS = ['silver', 'gold', 'platinum'];
  const worth = t => TIER[t].services.reduce((s, x) => s + x.n * SVC[x.k].price, 0);
  const unit = (k, n) => plural(n, SVC[k].unit[0], SVC[k].unit[1]);
  const tierKey = () => (TIERS.includes(S.mTier) ? S.mTier : 'gold');
  const pickKey = () => (TIERS.includes(S.mPick) ? S.mPick : 'gold');
  /* Final v3: the demo patient starts as a regular customer; the panel's Membership switch turns a plan on */
  if (S.isMember === undefined) S.isMember = false;
  const rb = document.getElementById('restartBtn');
  if (rb) rb.addEventListener('click', () => { if (F.setMember) F.setMember(null); });
  if (!S.mTier) S.mTier = 'gold';

  /* ---------- dates ---------- */
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day0 = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addY = (d, n) => new Date(d.getFullYear() + n, d.getMonth(), d.getDate());
  const fD = d => `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
  const fDs = d => `${d.getDate()} ${MO[d.getMonth()]}`;
  const fMY = d => `${MO[d.getMonth()]} ${d.getFullYear()}`;

  /* ---------- member state ----------
     S.isMember / S.mTier (kept for anything that already reads them) + S.mPlan:
     { tier, since, end, id, use: { svcKey: [{ appt, sub, who }] }, renewed, next }.
     Session status comes from the linked appointment, so a cancelled visit gives the allowance back. */
  const CODE = { silver: 'SLV', gold: 'GLD', platinum: 'PLT' };
  const memberId = t => `FRH-M-${CODE[t]}-20417`;
  const DEMO_USE = {
    lab: [{ appt: 'FRH-24388', sub: 'Vitamin D + full blood count', who: 'Sara Ahmed' }],
    physio: [{ appt: 'FRH-24790', sub: 'Knee rehab · session 2', who: 'Fatima Ahmed' }],
    iv: [{ appt: 'FRH-24512', sub: 'Immunity drip', who: 'Sara Ahmed' }],
  };
  function demoPlan(t) {
    const end = addD(day0(), 24), use = {};
    TIER[t].services.forEach(s => { use[s.k] = (DEMO_USE[s.k] || []).map(x => Object.assign({}, x)); });
    return { tier: t, since: addD(addY(end, -1), 1), end, id: memberId(t), use, renewed: false };
  }
  function freshPlan(t) {
    const since = day0();
    return { tier: t, since, end: addD(addY(since, 1), -1), id: memberId(t), use: {}, renewed: false };
  }
  const MP = () => {
    if (!S.isMember) return null;
    if (!S.mPlan || !TIER[S.mPlan.tier]) S.mPlan = demoPlan(tierKey());
    S.mPlan.tier = tierKey();
    return S.mPlan;
  };
  const validTo = p => (p.renewed && p.next ? p.next.to : p.end);
  const svcOf = k => TIER[tierKey()].services.find(s => s.k === k);
  function sessions(k) {
    const p = MP();
    if (!p) return [];
    return (p.use[k] || []).map(x => {
      const a = findAppt(x.appt);
      const st = !a ? 'done' : (a.status === 'cancelled' || D.appointments.cancelled.includes(a)) ? 'cancelled'
        : (a.status === 'completed' || D.appointments.completed.includes(a)) ? 'done' : a.status === 'ongoing' ? 'live' : 'booked';
      return Object.assign({}, x, { a, st, date: a ? a.date : x.date || '' });
    }).filter(x => x.st !== 'cancelled');
  }
  const leftOf = k => { const s = svcOf(k); return s ? s.n - sessions(k).length : 0; };
  const holder = () => S.name || (F.DEMO && F.DEMO.name) || 'Sara Ahmed';
  const coveredPeople = t => TIER[t].covers.map(i => (B.patients || [])[i]).filter(Boolean);

  /* ================= 13.7 member pricing (M22) ================= */
  const COVERS = {};
  const allSubs = () => Object.values(B.subcats || {}).flat();
  Object.keys(SVC).forEach(k => SVC[k].covers.forEach(id => {
    COVERS[id] = k;
    const s = allSubs().find(x => x.id === id);
    if (s) COVERS[s.name.toLowerCase()] = k;
  }));
  F.memberTier = () => (S.isMember ? { key: tierKey(), name: TIER[tierKey()].name } : null);
  /* Final v9: run fn as if the patient had just joined tier t (fresh allowance), then restore. No re-render. */
  F.memberPreview = (t, fn) => {
    const keep = { isMember: S.isMember, mTier: S.mTier, mPlan: S.mPlan };
    S.isMember = true; S.mTier = t; S.mPlan = freshPlan(t);
    try { return fn(); } finally { S.isMember = keep.isMember; S.mTier = keep.mTier; S.mPlan = keep.mPlan; }
  };
  F.memberPlanInfo = t => ({ key: t, name: TIER[t].name, price: TIER[t].price, people: TIER[t].people, coverShort: TIER[t].coverShort,
    services: TIER[t].services.map(s => ({ n: s.n, name: SVC[s.k].short || SVC[s.k].name, unit: SVC[s.k].unit[s.n === 1 ? 0 : 1] })) });
  F.memberCoverage = key => {
    if (!S.isMember || key == null) return null;
    const raw = String(key).trim(), lk = raw.toLowerCase();
    let k = COVERS[raw] || COVERS[lk];
    if (!k) { const hit = Object.keys(COVERS).find(n => n.length > 3 && lk.startsWith(n)); if (hit) k = COVERS[hit]; }
    const s = k && svcOf(k);
    if (!s) return null;
    const used = sessions(k).length;
    return { key: k, name: SVC[k].name, total: s.n, used, left: s.n - used, tier: TIER[tierKey()].name };
  };
  /* “Included in your plan” replaces the price while allowance is left; otherwise priceHtml unchanged. */
  F.memberPrice = (key, priceHtml = '', o = {}) => {
    const c = F.memberCoverage(key);
    if (!c || c.left <= 0) return priceHtml;
    return `<span class="m-incl${o.short ? ' short' : ''}" title="${c.left} of ${c.total} ${SVC[c.key].unit[1]} left on your ${c.tier} plan">${icon('check', 12, 3)}${o.short ? 'Included' : 'Included in your plan'}</span>`;
  };
  /* For the appointment builder: is this visit one of the plan's included sessions? */
  F.memberVisit = id => {
    const p = MP();
    if (!p || !id) return null;
    const k = Object.keys(p.use).find(x => (p.use[x] || []).some(s => s.appt === id));
    return k && svcOf(k) ? { key: k, service: SVC[k].name, tier: TIER[tierKey()].name } : null;
  };

  /* presenter switch — the lead puts it in the panel; nothing in the phone shows it */
  const MY = ['membership', 'm-plans', 'm-plan', 'm-schedule'];
  F.setMember = (t, o = {}) => {
    const k = t ? (TIERS.includes(t) ? t : 'gold') : null;
    S.isMember = !!k;
    if (k) S.mTier = k;
    S.mPlan = k ? (o.fresh ? freshPlan(k) : demoPlan(k)) : null;
    S.mBenAll = false; S.mSch = null; S.mPick = k || 'gold';
    if (S.sheet && /^m-/.test(S.sheet)) F.closeSheet(true);
    if (S.open && S.screen) {
      if (MY.includes(S.screen)) F.go('membership', { dir: 'none' });
      else F.upd();
    }
    return F.memberTier();
  };

  /* ================= 13 Membership — member view (M6–M13) ================= */
  function cardHTML(t, meta, o = {}) {
    return `<div class="m-card m-t-${t}${o.cls ? ' ' + o.cls : ''}"><span class="m-card-bg" aria-hidden="true"></span>
        <div class="m-card-top"><span class="m-badge">${xi('crown', 13, 2.3)}${TIER[t].name}</span><span class="m-card-brand">${mark('currentColor', 20)}FRH Care</span></div>
        <b class="m-card-name">${esc(o.name || holder())}</b>
        <span class="m-card-id">${o.id || memberId(t)}</span>
        <div class="m-card-meta">${meta}</div>
      </div>`;
  }
  function renewNudge(p) {
    const d = Math.round((p.end - day0()) / 864e5);
    if (p.renewed || d > 45) return '';
    return `<div class="m-nudge"><span class="m-nudge-ic">${icon('clock', 18, 2.2)}</span>
        <div class="m-nudge-t"><b>Your plan ends in ${plural(d, 'day', 'days')}</b><small>Renew to keep your included visits and member prices.</small></div>
        <button class="mini-btn" type="button" data-act="m-renew">Renew</button></div>`;
  }
  const ST = { done: 'Delivered', live: 'In progress', booked: 'Booked for' };
  const sessRow = x => `<button class="m-sess-row" type="button" ${x.a ? `data-act="m-appt" data-id="${x.appt}"` : 'disabled'}>
      <span class="m-dot ${x.st}"></span>
      <span class="m-sess-t"><b>${esc(x.sub)}</b><small>${ST[x.st]} ${esc(x.date)} · ${esc(x.who)}</small></span>
      ${x.a ? `<span class="m-sess-go">Visit${icon('chevRight', 14, 2.6)}</span>` : ''}</button>`;
  function svcCard(s, p) {
    const d = SVC[s.k], ss = sessions(s.k), u = ss.length, l = s.n - u, full = l <= 0;
    const done = ss.filter(x => x.st === 'done').length, booked = u - done;
    const legend = [done && `<span><i class="d"></i>${done} delivered</span>`, booked && `<span><i class="b"></i>${booked} booked</span>`].filter(Boolean).join('') || '<span>Not used yet</span>';
    const segs = [...Array(s.n)].map((_, i) => `<i class="${i < done ? 'd' : i < u ? 'b' : ''}"></i>`).join('');
    return `<div class="m-svc${full ? ' full' : ''}">
        <div class="m-svc-top"><span class="tile m-tile">${xi(d.icon, 19, 2)}</span>
          <div class="m-svc-t"><b>${d.name}</b><small>${d.sub}</small></div>
          <div class="m-svc-n">${full ? '<b>0</b><small>left</small>' : `<b>${l}</b><small>of ${s.n} left</small>`}</div></div>
        <div class="m-usage${s.n > 8 ? ' dense' : ''}" role="img" aria-label="${u} of ${s.n} used">${segs}</div>
        <div class="m-legend">${legend}</div>
        ${u ? `<div class="m-sess">${ss.map(sessRow).join('')}</div>` : ''}
        <div class="m-svc-foot">${full
          ? `<span class="m-reset">${icon('refresh', 14, 2.4)} All ${s.n} used · resets ${fD(addD(p.end, 1))}</span>`
          : `<span><b>${l} left</b> this plan year</span><button class="mini-btn" type="button" data-act="m-schedule" data-k="${s.k}">${icon('calendar', 14, 2.3)} Schedule</button>`}</div>
      </div>`;
  }
  function people(p) {
    const T = TIER[p.tier], cov = coveredPeople(p.tier), free = T.people - cov.length;
    return `<div class="sec-h m-sech"><h4>Who’s covered</h4><span class="m-sub">${cov.length} of ${T.people}</span></div>
      <div class="m-people">${cov.map(pt => `<div class="m-person"><span class="m-ava">${initials(pt.name)}</span><b>${esc(first(pt.name))}</b><small>${pt.rel === 'Myself' ? 'You' : esc(pt.rel)}</small></div>`).join('')}
        ${free > 0 ? `<button class="m-person add" type="button" data-act="m-add-person"><span class="m-ava">${icon('plus', 18, 2.4)}</span><b>${plural(free, 'place', 'places')} free</b><small>Add someone</small></button>` : ''}</div>`;
  }
  function benefits(t) {
    const T = TIER[t], all = !!S.mBenAll, more = T.benefits.length > 4, list = all || !more ? T.benefits : T.benefits.slice(0, 4);
    return `<div class="sec-h m-sech"><h4>Your ${T.name} benefits</h4>${more ? `<button class="link" type="button" data-act="m-ben">${all ? 'Show less' : `View all ${T.benefits.length}`}</button>` : ''}</div>
      <div class="info-card m-list">${list.map(b => `<div class="info-row"><span class="tile">${xi(b.ic, 17, 2)}</span><div class="ir-mid"><b>${b.t}</b><small>${b.d}</small></div></div>`).join('')}</div>`;
  }
  function memberView() {
    const p = MP(), T = TIER[p.tier];
    const left = T.services.reduce((n, s) => n + Math.max(0, s.n - sessions(s.k).length), 0);
    const next = p.renewed && p.next;
    return `${backNav('Membership', 'profile-home')}
      <div class="scr-body">
        ${cardHTML(p.tier, `<div><small>Member since</small><b>${fD(p.since)}</b></div><div><small>Valid until</small><b>${fD(validTo(p))}</b></div>`, { id: p.id })}
        ${renewNudge(p)}
        <div class="m-stats">
          <div><b>${left}</b><small>included visits left</small></div>
          <div><b>${coveredPeople(p.tier).length}</b><small>${coveredPeople(p.tier).length === 1 ? 'person' : 'people'} covered</small></div>
          <div><b>${fDs(p.end)}</b><small>plan year ends</small></div>
        </div>
        <div class="sec-h m-sech"><h4>Included in your plan</h4><span class="m-sub">${fMY(p.since)} – ${fMY(p.end)}</span></div>
        <div class="m-svcs">${T.services.map(s => svcCard(s, p)).join('')}</div>
        ${people(p)}
        ${benefits(p.tier)}
        <div class="sec-h m-sech"><h4>Manage</h4></div>
        <div class="info-card m-list">
          ${next
            ? `<div class="info-row"><span class="tile green">${icon('check', 17, 2.4)}</span><div class="ir-mid"><b>Renewed</b><small>Your next plan year runs ${fD(next.from)} – ${fD(next.to)}</small></div></div>`
            : `<button class="info-row m-row" type="button" data-act="m-renew"><span class="tile">${icon('refresh', 17, 2)}</span><div class="ir-mid"><b>Renew membership</b><small>This plan year ends ${fD(p.end)}</small></div>${icon('chevRight', 17, 2.2)}</button>`}
          <button class="info-row m-row" type="button" data-act="m-change"><span class="tile">${xi('crown', 17, 2)}</span><div class="ir-mid"><b>${p.tier === 'platinum' ? 'Compare plans' : 'Upgrade plan'}</b><small>Silver, Gold and Platinum side by side</small></div>${icon('chevRight', 17, 2.2)}</button>
          <button class="info-row m-row" type="button" data-act="m-support"><span class="tile">${icon('headset', 17, 2)}</span><div class="ir-mid"><b>Member support</b><small>Message FRH Support, any time</small></div>${icon('chevRight', 17, 2.2)}</button>
        </div>
      </div>`;
  }

  /* ================= M23 Compare plans (non-members; members upgrading) ================= */
  const CHECK = `<span class="m-yes" aria-label="Included">${icon('check', 14, 3)}</span>`, DASH = '<span class="m-no" aria-label="Not included">—</span>';
  const CMP = [
    { g: 'Included every year', rows: SVC_ORDER.map(k => ({ l: SVC[k].short, v: t => { const s = TIER[t].services.find(x => x.k === k); return s ? `<b>${s.n}</b>` : DASH; } })) },
    { g: 'Member benefits', rows: [
      { l: 'People covered', v: t => `<b>${TIER[t].people}</b>` },
      { l: 'Priority booking', v: t => (t === 'silver' ? DASH : CHECK) },
      { l: 'No night surcharge', v: t => (t === 'silver' ? DASH : CHECK) },
      { l: 'Off other services', v: t => `<b>${TIER[t].off}%</b>` },
      { l: 'Care coordinator', v: t => (t === 'platinum' ? CHECK : DASH) },
      { l: 'Medicine delivery', v: t => (t === 'platinum' ? CHECK : DASH) },
    ] },
  ];
  const tierCard = (t, pick, cur) => {
    const T = TIER[t], tag = t === cur ? '<span class="m-pop cur">Your plan</span>' : T.popular && !cur ? '<span class="m-pop">Most popular</span>' : '';
    return `<button class="m-tier${t === pick ? ' on' : ''}" type="button" role="radio" aria-checked="${t === pick}" data-act="m-pick" data-t="${t}">${tag}
        <span class="m-tier-dot m-t-${t}" aria-hidden="true"></span><b>${T.name}</b>
        <span class="m-tier-p">${aed(T.price)}</span><small>per year</small><span class="m-tier-c">${T.coverShort}</span></button>`;
  };
  function compareTable(pick) {
    const cell = (t, h) => `<span class="${t === pick ? 'on' : ''}">${h}</span>`;
    return `<div class="m-cmp" role="table" aria-label="Compare plans">
        <div class="m-cmp-r m-cmp-h" role="row"><span></span>${TIERS.map(t => `<button type="button" class="${t === pick ? 'on' : ''}" data-act="m-pick" data-t="${t}">${TIER[t].name}</button>`).join('')}</div>
        ${CMP.map(g => `<div class="m-cmp-g">${g.g}</div>${g.rows.map(r => `<div class="m-cmp-r" role="row"><span class="m-cmp-l">${r.l}</span>${TIERS.map(t => cell(t, r.v(t))).join('')}</div>`).join('')}`).join('')}
      </div>`;
  }
  function compareBody(change) {
    const pick = pickKey(), T = TIER[pick], cur = change ? tierKey() : null;
    return `${change
        ? `<p class="lead m-lead">You’re on <b>${TIER[cur].name}</b>. Upgrade any time: you pay the difference and your plan year stays the same.</p>`
        : `<div class="m-pitch"><span class="m-pitch-ic">${xi('crown', 26, 1.9)}</span><h1 class="h1">Care at home, <em>included</em></h1>
            <p class="lead">One yearly plan covers your doctor visits, lab tests and more. Book in a tap, with nothing to pay on the day.</p></div>`}
      <div class="m-tiers" role="radiogroup" aria-label="Plans">${TIERS.map(t => tierCard(t, pick, cur)).join('')}</div>
      <div class="m-value">${icon('sparkle', 16, 2.2)}<span><b>${T.name}</b> includes ${aed(worth(pick))} of care at standard prices, for ${aed(T.price)} a year. ${T.tagline}.</span></div>
      <div class="sec-h m-sech"><h4>Compare plans</h4></div>
      ${compareTable(pick)}
      <p class="m-fine">Prices include VAT. A plan runs for 12 months from the day you join; unused visits don’t carry over.</p>`;
  }
  function compareFoot(change) {
    const pick = pickKey(), T = TIER[pick];
    if (!change) {
      return `<div class="scr-foot"><button class="btn btn-primary" type="button" data-act="m-view-plan">See the ${T.name} plan ${icon('arrowRight', 18, 2.2)}</button>
          <p class="b-final">${aed(T.price)} a year · VAT included</p></div>`;
    }
    const cur = tierKey(), up = TIERS.indexOf(pick) > TIERS.indexOf(cur), p = MP();
    if (pick === cur) return `<div class="scr-foot"><button class="btn btn-primary off" type="button" disabled>${TIER[cur].name} is your plan</button><p class="b-final">Pick a plan above to compare</p></div>`;
    if (!up) return `<div class="scr-foot"><button class="btn btn-primary off" type="button" disabled>Move to ${T.name} when you renew</button><p class="b-final">Plans can go down a tier at renewal, on ${fD(addD(p.end, 1))}</p></div>`;
    return `<div class="scr-foot"><button class="btn btn-primary" type="button" data-act="m-upgrade">Upgrade to ${T.name} · ${aed(T.price - TIER[cur].price)}</button>
        <p class="b-final">You pay the difference · your plan year still ends ${fD(p.end)}</p></div>`;
  }
  function nonMemberView() {
    return `${backNav('Membership', 'profile-home')}
      <div class="scr-body">${compareBody(false)}</div>
      ${compareFoot(false)}`;
  }

  F.SCREENS.membership = patch({
    status: 'dark', cls: 'm-mem',
    render() { return S.isMember ? memberView() : nonMemberView(); },
  });
  F.SCREENS['m-plans'] = patch({
    status: 'dark', cls: 'm-mem m-plans',
    render() {
      if (!S.isMember) return nonMemberView();
      return `${backNav('Compare plans', 'membership')}<div class="scr-body">${compareBody(true)}</div>${compareFoot(true)}`;
    },
  });

  /* ---------- plan detail → Join / Renew ---------- */
  F.SCREENS['m-plan'] = patch({
    status: 'dark', cls: 'm-mem m-plan',
    render() {
      const t = pickKey(), T = TIER[t], renew = S.mMode === 'renew' && S.isMember, p = renew ? MP() : null;
      const from = renew ? addD(p.end, 1) : day0(), to = renew ? addY(p.end, 1) : addD(addY(day0(), 1), -1);
      const save = worth(t) - T.price;
      return `${backNav(renew ? 'Renew membership' : `${T.name} plan`, 'membership')}
        <div class="scr-body">
          ${cardHTML(t, `<div><small>Covers</small><b>${T.coverShort}</b></div><div><small>${renew ? 'Next plan year starts' : 'Plan year'}</small><b>${renew ? fD(from) : '12 months'}</b></div>`, { id: renew ? p.id : `FRH-M-${CODE[t]}-•••••`, cls: 'm-card-sm' })}
          <div class="m-price"><div><b>${aed(T.price)}</b><span>/ year</span></div>${save > 0 ? `<span class="pill green">Save ${aed(save)}</span>` : ''}</div>
          <p class="m-price-sub">${renew ? `Your next plan year runs ${fD(from)} – ${fD(to)}. Your allowance starts fresh on ${fD(from)}.` : `${T.tagline}. VAT included.`}</p>
          <div class="sec-h m-sech"><h4>Included every year</h4><span class="m-sub">worth ${aed(worth(t))}</span></div>
          <div class="info-card m-list">${T.services.map(s => `<div class="info-row"><span class="tile">${xi(SVC[s.k].icon, 17, 2)}</span>
              <div class="ir-mid"><b>${unit(s.k, s.n)}</b><small>${SVC[s.k].sub}</small></div><span class="m-worth">${aed(s.n * SVC[s.k].price)}</span></div>`).join('')}</div>
          <div class="sec-h m-sech"><h4>${T.name} benefits</h4></div>
          <div class="info-card m-list">${T.benefits.map(b => `<div class="info-row"><span class="tile">${xi(b.ic, 17, 2)}</span><div class="ir-mid"><b>${b.t}</b><small>${b.d}</small></div></div>`).join('')}</div>
          ${renew ? '' : `<div class="sec-h m-sech"><h4>How it works</h4></div>
          <ol class="m-how">
            <li><b>Join today</b><span>Your plan starts straight away and lasts 12 months.</span></li>
            <li><b>Book included visits</b><span>From Membership, in a few taps, with nothing to pay.</span></li>
            <li><b>Renew once a year</b><span>Your allowance starts fresh every plan year.</span></li>
          </ol>`}
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="m-buy">${renew ? `Renew for ${aed(T.price)}` : `Join for ${aed(T.price)}`}</button>
          <p class="b-final m-secure">${icon('shieldCheck', 13, 2.4)} Secure payment · VAT included</p></div>`;
    },
  });

  /* ---------- pay step (a sheet: nothing to type) ---------- */
  const cards = () => S.pxCards || [{ id: 'c1', brand: 'visa', last4: '4242', exp: '09/29', def: true }, { id: 'c2', brand: 'mc', last4: '5100', exp: '03/28' }];
  const BRAND = { visa: 'Visa', mc: 'Mastercard', amex: 'American Express' };
  const brandChip = b => `<span class="m-brand ${b}">${b === 'mc' ? '<i></i><i></i>' : b === 'amex' ? 'AMEX' : 'VISA'}</span>`;
  const pmKey = () => { const c = cards(); return S.mPm && (S.mPm === 'apple' || c.some(x => x.id === S.mPm)) ? S.mPm : ((c.find(x => x.def) || c[0] || { id: 'apple' }).id); };
  const pmName = k => { const c = cards().find(x => x.id === k); return c ? `${BRAND[c.brand] || 'Card'} •••• ${c.last4}` : 'Apple Pay'; };
  function order(mode, t) {
    const T = TIER[t], p = MP();
    if (mode === 'renew') return { mode, tier: t, amount: T.price, title: `Renew ${T.name}`, sub: `Next plan year ${fD(addD(p.end, 1))} – ${fD(addY(p.end, 1))}`, line: `${T.name} membership · 12 months` };
    if (mode === 'upgrade') { const c = TIER[tierKey()]; return { mode, tier: t, amount: T.price - c.price, title: `Upgrade to ${T.name}`, sub: `Your plan year still ends ${fD(p.end)}`, line: `${c.name} → ${T.name} upgrade` }; }
    return { mode: 'join', tier: t, amount: T.price, title: `Join ${T.name}`, sub: `12 months, from today to ${fD(addD(addY(day0(), 1), -1))}`, line: `${T.name} membership · 12 months` };
  }
  F.SHEETS['m-pay'] = () => {
    const o = S.mOrder || order('join', 'gold'), k = pmKey(), busy = !!S.mPaying;
    const row = (key, inner) => `<button class="m-pm${k === key ? ' on' : ''}" type="button" data-act="m-pm" data-k="${key}"${busy ? ' disabled' : ''}>${inner}<span class="radio"></span></button>`;
    return `<div class="sheet m-pay" role="dialog" aria-label="${o.title}"><div class="grab"></div>
        <div class="m-pay-h"><span class="m-badge sm m-t-${o.tier}">${xi('crown', 11, 2.4)}${TIER[o.tier].name}</span><h2>${o.title}</h2><p>${o.sub}</p></div>
        <div class="m-pay-sum">
          <div><span>${o.line}</span><b>${aed2(o.amount)}</b></div>
          <div class="m-vat"><span>Includes VAT (5%)</span><span>${aed2(o.amount - o.amount / 1.05)}</span></div>
          <div class="tot"><span>Total</span><b>${aed2(o.amount)}</b></div>
        </div>
        <div class="m-pay-lbl">Pay with</div>
        <div class="m-pms">
          ${row('apple', '<span class="m-wallet">Apple&nbsp;Pay</span><span class="mid"><b>Apple Pay</b><small>Confirm with Face ID</small></span>')}
          ${cards().map(c => row(c.id, `${brandChip(c.brand)}<span class="mid"><b>${BRAND[c.brand] || 'Card'} •••• ${c.last4}${c.def ? ' <span class="pill ink">Default</span>' : ''}</b><small>Expires ${c.exp}</small></span>`)).join('')}
        </div>
        <button class="btn btn-primary m-pay-btn${busy ? ' loading' : ''}" type="button" data-act="m-pay-go">${busy ? '<span class="spin"></span>Processing payment…' : `${icon('lock', 17, 2.2)} Pay ${aed(o.amount)}`}</button>
        <p class="b-final m-secure">${icon('shieldCheck', 13, 2.4)} Secured by <b>Stripe</b> · 3-D Secure</p>
      </div>`;
  };
  function completePurchase() {
    const o = S.mOrder;
    if (!o) return;
    if (o.mode === 'join') { S.isMember = true; S.mTier = o.tier; S.mPlan = freshPlan(o.tier); }
    else if (o.mode === 'renew') { const p = MP(); p.renewed = true; p.next = { from: addD(p.end, 1), to: addY(p.end, 1) }; }
    else { S.mTier = o.tier; const p = MP(); p.tier = o.tier; p.id = memberId(o.tier); }
    const p = MP();
    S.mDone = { mode: o.mode, tier: o.tier, amount: o.amount, pm: pmName(pmKey()), id: p.id, valid: fD(validTo(p)) };
    S.mBenAll = false;
    F.closeSheet(true);
    F.back('membership');
    if (S.screen !== 'membership') F.go('membership', { dir: 'none' });
    F.openSheet('m-welcome');
  }
  /* join / renew / upgrade done — the payment-success layout */
  F.SHEETS['m-welcome'] = () => {
    const L = S.mDone || { mode: 'join', tier: 'gold', amount: TIER.gold.price, pm: 'Visa •••• 4242', id: memberId('gold'), valid: fD(addD(addY(day0(), 1), -1)) };
    const T = TIER[L.tier];
    const title = L.mode === 'renew' ? 'Membership renewed' : L.mode === 'upgrade' ? `You’re on ${T.name} now` : `Welcome to ${T.name}`;
    return `<div class="sheet m-done" role="dialog" aria-label="${title}"><div class="grab"></div>
        ${okBadge()}
        <h2>${title}</h2>
        <div class="m-amt">${aed(L.amount)}<small>Paid with ${L.pm}</small></div>
        <div class="m-kv"><div><small>Member ID</small><b>${L.id}</b></div><div><small>Valid until</small><b>${L.valid}</b></div></div>
        <div class="stack">${L.mode === 'renew'
          ? '<button class="btn btn-primary" type="button" data-act="sheet-close">Done</button>'
          : '<button class="btn btn-primary" type="button" data-act="m-welcome-book">Book an included visit</button><button class="btn btn-ghost" type="button" data-act="sheet-close">View my membership</button>'}</div>
      </div>`;
  };

  /* ================= 13.4 Schedule from membership (M14, M15) ================= */
  const DAYS = () => [...Array(6)].map((_, i) => {
    const d = addD(day0(), i);
    return { k: i, top: i === 0 ? 'Today' : i === 1 ? 'Tom' : d.toLocaleDateString('en-US', { weekday: 'short' }), n: d.getDate(), m: MO[d.getMonth()] };
  });
  const SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];
  const ISSUES = ['Fever', 'Cough & cold', 'Stomach pain', 'Back pain', 'Follow-up', 'Routine check'];
  const dayLabel = k => { const d = DAYS()[k || 0]; return d.k === 0 ? 'Today' : d.k === 1 ? 'Tomorrow' : `${d.top} ${d.n} ${d.m}`; };
  const timeLabel = q => (q.time === 'ASAP' ? 'Next available · about 45 min' : q.time);
  const freshSch = k => ({ k, step: 0, pat: null, addr: null, day: 0, time: null, issue: '', issueDone: false });
  const sch = () => S.mSch || (S.mSch = freshSch((TIER[tierKey()].services.find(s => leftOf(s.k) > 0) || TIER[tierKey()].services[0]).k));
  const isTele = q => q.k === 'tele';
  const stepVal = (i, q) => i === 0 ? (q.pat !== null && B.patients[q.pat] ? `${B.patients[q.pat].name} · ${B.patients[q.pat].rel}` : '')
    : i === 1 ? (isTele(q) ? 'Video call · we send the link before your slot' : q.addr !== null && B.addresses[q.addr] ? `${B.addresses[q.addr].label} · ${B.addresses[q.addr].line}` : '')
    : i === 2 ? (q.time ? `${dayLabel(q.day)} · ${timeLabel(q)}` : '')
    : (q.issueDone ? (q.issue || 'Nothing added') : '');
  const firstOpen = q => { for (let i = 0; i < 4; i++) if (!stepVal(i, q)) return i; return 4; };
  const advance = q => { q.step = firstOpen(q); };

  function stepBody(i, q) {
    const t = tierKey(), T = TIER[t];
    if (i === 0) {
      const names = andList(coveredPeople(t).map(x => first(x.name)));
      return B.patients.map((pt, j) => {
        const ok = T.covers.includes(j);
        return `<button class="b-pick ${q.pat === j ? 'on' : ''} ${ok ? '' : 'm-off'}" type="button" ${ok ? `data-act="m-pat" data-i="${j}"` : 'disabled'}>
            <span class="radio"></span><span class="mid"><b>${esc(pt.name)} <span class="pill ink">${esc(pt.rel)}</span></b><small>${ok ? `${pt.age} yrs · ${pt.gender} · Blood ${pt.blood}` : `Not on your ${T.name} plan`}</small></span></button>`;
      }).join('') + `<p class="m-step-note">${icon('users', 14, 2.2)}<span>Your ${T.name} plan covers ${names}.${t !== 'platinum' ? ' <button class="link" type="button" data-act="m-change">Cover more people</button>' : ''}</span></p>`;
    }
    if (i === 1) {
      return B.addresses.map((a, j) => `<button class="b-pick ${q.addr === j ? 'on' : ''}" type="button" data-act="m-addr" data-i="${j}">
          <span class="tile">${icon(a.label === 'Home' ? 'home' : 'pin', 17, 2)}</span>
          <span class="mid"><b>${esc(a.label)}${a.def ? ' <span class="pill green">Default</span>' : ''}</b><small>${esc(a.line)}</small></span><span class="radio"></span></button>`).join('')
        + `<button class="m-add" type="button" data-act="m-add-addr">${icon('plus', 15, 2.4)} Add address</button>`;
    }
    if (i === 2) {
      const today = (q.day || 0) === 0;
      return `<div class="hrow m-days">${DAYS().map(d => `<button class="date-chip ${q.day === d.k ? 'on' : ''}" type="button" data-act="m-day" data-k="${d.k}"><small>${d.top}</small><b>${d.n}</b><span>${d.m}</span></button>`).join('')}</div>
        <div class="time-grid m-times">
          ${today ? `<button class="slot m-asap ${q.time === 'ASAP' ? 'on' : ''}" type="button" data-act="m-time" data-t="ASAP">${xi('zap', 15, 2.2)} As soon as possible <small>about 45 min</small></button>` : ''}
          ${SLOTS.map((s, j) => `<button class="slot ${q.time === s ? 'on' : ''} ${j === 3 ? 'full' : ''}" type="button" ${j === 3 ? 'disabled' : `data-act="m-time" data-t="${s}"`}>${s}${j === 3 ? '<small>Full</small>' : ''}</button>`).join('')}
        </div>`;
    }
    return `<div class="b-chips" style="margin-top:4px">${ISSUES.map(c => `<button class="b-chip ${q.issue.split(', ').includes(c) ? 'on' : ''}" type="button" data-act="m-issue" data-c="${c}">${c}</button>`).join('')}</div>
      <div class="m-step-acts"><button class="mini-btn ghost" type="button" data-act="m-issue-done" data-skip="1">Skip</button><button class="mini-btn" type="button" data-act="m-issue-done">Done</button></div>`;
  }
  function steps(q) {
    const names = ['Patient', isTele(q) ? 'How you’ll meet' : 'Location', 'Date & time', 'Health issue'];
    const open = firstOpen(q);
    return names.map((nm, i) => {
      const val = stepVal(i, q), on = q.step === i && !(i === 1 && isTele(q)), lock = !on && !val && i > open;
      const st = on ? 'on' : val ? 'done' : lock ? 'lock' : 'next';
      const fixed = i === 1 && isTele(q);
      return `<div class="m-step ${st}">
          <button class="m-step-h" type="button" ${lock || on || fixed ? 'disabled' : `data-act="m-step" data-i="${i}"`}>
            <span class="m-step-n">${val && !on ? icon('check', 15, 3) : i + 1}</span>
            <span class="m-step-t"><b>${nm}${i === 3 ? '<em>Optional</em>' : ''}</b>${val && !on ? `<small>${esc(val)}</small>` : lock ? '<small>After the step above</small>' : ''}</span>
            ${val && !on && !fixed ? '<span class="m-step-c">Change</span>' : ''}
          </button>
          ${on ? `<div class="m-step-b">${stepBody(i, q)}</div>` : ''}
        </div>`;
    }).join('');
  }
  F.SCREENS['m-schedule'] = patch({
    status: 'dark', cls: 'm-sch',
    render() {
      if (!S.isMember) return `${backNav('Book a visit', 'membership')}<div class="scr-body"><div class="empty-state"><div class="es-ic">${xi('crown', 28, 1.9)}</div><b>Included visits are for members</b><span>Join a plan to book visits with nothing to pay.</span></div></div>`;
      const q = sch(), T = TIER[tierKey()], s = svcOf(q.k) || T.services[0], d = SVC[s.k], l = Math.max(0, leftOf(s.k));
      if (isTele(q) && q.addr === null) q.addr = -1;
      const ready = q.pat !== null && (isTele(q) || q.addr !== null) && !!q.time;
      return `${backNav('Book an included visit', 'membership')}
        <div class="scr-body">
          <div class="m-sch-svc"><span class="tile">${xi(d.icon, 20, 2)}</span>
            <div class="m-sch-t"><b>${d.book}</b><small>${d.dur}${isTele(q) ? ' · video call' : ' · at home'}</small></div>
            <div class="m-sch-p">${F.memberPrice(d.covers[0], `<span class="price">${aed(d.price)}</span>`, { short: true })}</div></div>
          <div class="m-sch-use"><span class="m-badge sm m-t-${tierKey()}">${xi('crown', 11, 2.4)}${T.name}</span><span>Uses 1 of your <b>${l}</b> remaining ${SVC[s.k].unit[l === 1 ? 0 : 1]}</span></div>
          <div class="m-steps">${steps(q)}</div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${ready ? '' : 'off'}${S.mBooking ? ' loading' : ''}" type="button" data-act="m-confirm">${S.mBooking ? '<span class="spin"></span>Booking…' : 'Confirm booking'}</button>
          <p class="b-final">Nothing to pay · included in your ${T.name} plan</p></div>`;
    },
  });

  function confirmBooking() {
    const q = sch(), T = TIER[tierKey()], s = svcOf(q.k), d = SVC[q.k], p = MP();
    if (!s || leftOf(q.k) <= 0) { F.toast('That allowance is used up for this plan year', 'alert'); return; }
    const pt = B.patients[q.pat], ad = isTele(q) ? null : B.addresses[q.addr];
    const used = new Set(ALLA().map(a => a.id));
    let n = 25100 + Math.floor(Math.random() * 700);
    while (used.has('FRH-' + n)) n++;
    const id = 'FRH-' + n, date = dayLabel(q.day), time = timeLabel(q);
    D.appointments.upcoming.unshift({
      id, status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW',
      service: d.svc, sub: `${d.book} · included in ${T.name} plan`, date, time,
      patients: [pt.rel === 'Myself' ? pt.name : `${pt.name} (${pt.rel})`], address: ad ? `${ad.label} · ${ad.line}` : 'Video call',
      team: 'Team being assigned', total: 0, member: true, memberTier: T.name, issue: q.issue || '',
    });
    (p.use[q.k] = p.use[q.k] || []).push({ appt: id, sub: d.book, who: pt.name });
    S.newBooking = id;
    S.mLast = { id, svc: d.book, who: pt.name, when: q.time === 'ASAP' ? 'Today · ASAP' : `${date}, ${q.time}`, used: sessions(q.k).length, n: s.n, unit: SVC[q.k].unit[1], tier: T.name };
    S.mSch = null;
    F.openSheet('m-booked');
  }
  /* M15 — the same layout as the payment-success sheet: badge, title, amount line, key facts, two exits */
  F.SHEETS['m-booked'] = () => {
    const b = S.mLast || { id: 'FRH-25146', svc: 'GP home visit', who: 'Sara Ahmed', when: 'Tomorrow, 10:00 AM', used: 1, n: 4, unit: 'doctor visits', tier: 'Gold' };
    return `<div class="sheet m-done" role="dialog" aria-label="Visit booked"><div class="grab"></div>
        ${okBadge()}
        <h2>Visit booked</h2>
        <div class="m-amt incl">Included in your ${b.tier} plan<small>Nothing to pay</small></div>
        <div class="m-kv"><div><small>Booking ID</small><b>${b.id}</b></div><div><small>Date &amp; time</small><b>${esc(b.when)}</b></div></div>
        <p class="m-paidnote">${esc(b.svc)} for ${esc(first(b.who))} · ${b.used} of ${b.n} ${b.unit} used this plan year. We’ll message you when your team is assigned.</p>
        <div class="stack"><button class="btn btn-primary" type="button" data-act="m-booked-appt">View Appointment</button><button class="btn btn-ghost" type="button" data-act="m-booked-done">Back to membership</button></div>
      </div>`;
  };

  /* ================= Medical reports — the one list (M16, M17, P7–P9) ================= */
  const REPS = [
    { id: 'rep-24817-sara', appt: 'FRH-24817', type: 'report', name: 'Visit report · Doctor on Call', who: 'Sara Ahmed', status: 'pending' },
    { id: 'rep-24817-fatima', appt: 'FRH-24817', type: 'report', name: 'Visit report · Knee assessment', who: 'Fatima Ahmed', status: 'pending' },
    { id: 'rep-24512-lab', appt: 'FRH-24512', type: 'lab', name: 'Blood panel results', who: 'Sara Ahmed', date: '3 Sep', lab: 'sep', status: 'released' },
    { id: 'rx-24512', appt: 'FRH-24512', type: 'rx', name: 'E-prescription', who: 'Sara Ahmed', date: '3 Sep', rx: 'FRH-24512', status: 'released' },
    { id: 'rep-24512-visit', appt: 'FRH-24512', type: 'report', name: 'Vitals & infusion record', who: 'Sara Ahmed', date: '2 Sep', size: 'PDF · 240 KB', status: 'released' },
    { id: 'rep-24388-lab', appt: 'FRH-24388', type: 'lab', name: 'Vitamin D + FBC results', who: 'Sara Ahmed', date: '17 Aug', lab: 'aug', status: 'released' },
    { id: 'rep-24388-visit', appt: 'FRH-24388', type: 'report', name: 'Sample collection record', who: 'Sara Ahmed', date: '16 Aug', size: 'PDF · 180 KB', status: 'released' },
  ];
  const RT = { lab: { ic: 'lab', tint: 'blue', label: 'Lab results' }, rx: { ic: 'pill', tint: 'violet', label: 'Prescription' }, report: { ic: 'file', tint: '', label: 'Visit report' } };
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const findRep = id => REPS.find(r => r.id === id) || REPS.find(r => norm(r.name) === norm(id))
    || REPS.find(r => norm(id).length > 4 && (norm(r.name).includes(norm(id)) || norm(id).includes(norm(r.name))));
  const repSub = r => {
    if (r.status === 'pending') return `${first(r.who)} · ready within 24 hours of the visit`;
    const extra = r.type === 'lab' ? `${LAB[r.lab].panels.reduce((n, p) => n + p.tests.length, 0)} tests` : r.type === 'rx' ? plural(RX[r.rx].meds.length, 'medicine', 'medicines') : r.size || 'PDF';
    return `${RT[r.type].label} · ${first(r.who)} · ${r.date} · ${extra}`;
  };
  const repRow = r => {
    const t = RT[r.type], pend = r.status === 'pending';
    return `<div class="m-rep${pend ? ' pend' : ''}">
        <button class="m-rep-main" type="button" data-act="${pend ? 'm-pending' : 'm-rep'}" data-id="${r.id}">
          <span class="tile ${pend ? 'm-ink' : t.tint}">${pend ? icon('clock', 17, 2) : xi(t.ic, 17, 2)}</span>
          <span class="ir-mid"><b>${esc(r.name)}</b><small>${esc(repSub(r))}</small></span>
          <span class="pill ${pend ? 'amber' : 'green'}">${pend ? 'Pending' : 'Released'}</span></button>
        ${pend ? '' : `<button class="m-rep-dl" type="button" data-act="m-dl" data-n="${esc(r.name)}" aria-label="Download ${esc(r.name)}">${icon('download', 17, 2)}</button>`}
      </div>`;
  };
  F.SCREENS['reports-hub'] = patch({
    status: 'dark', cls: 'm-rh',
    render() {
      const pats = (B.patients || []).map(p => p.name);
      const who = S.mRepWho && pats.includes(S.mRepWho) ? S.mRepWho : 'all';
      const list = REPS.filter(r => who === 'all' || r.who === who);
      const ids = [...new Set(list.map(r => r.appt))];
      const chips = [['all', 'All patients']].concat(pats.map(n => [n, first(n)]))
        .map(([k, l]) => `<button class="b-chip m-chip ${who === k ? 'on' : ''}" type="button" data-act="m-rep-who" data-k="${esc(k)}">${esc(l)}</button>`).join('');
      const group = id => {
        const a = findAppt(id), rows = list.filter(r => r.appt === id);
        const head = a
          ? `<button class="m-rg-h" type="button" data-act="m-appt" data-id="${a.id}"><span class="tile">${xi(svcIcon(a.service), 18, 2)}</span>
              <span class="ir-mid"><b>${esc(a.service)}</b><small>${esc(a.date)} · ${a.patients.map(x => esc(first(x))).join(' & ')} · ${a.id}</small></span>
              <span class="m-rg-go">Visit${icon('chevRight', 14, 2.6)}</span></button>`
          : `<div class="m-rg-h"><span class="tile">${icon('file', 18, 2)}</span><span class="ir-mid"><b>Visit ${id}</b></span></div>`;
        return `<section class="m-rg${S.mRepVisit === id ? ' focus' : ''}" data-visit="${id}">${head}<div class="info-card m-rcard">${rows.map(repRow).join('')}</div></section>`;
      };
      return `${backNav('Medical reports', 'profile-home')}
        <div class="scr-body">
          <p class="lead m-lead">Reports, lab results and prescriptions from every visit, for everyone on your account.</p>
          <div class="hrow m-chips" role="group" aria-label="Filter by patient">${chips}</div>
          ${ids.length ? ids.map(group).join('')
            : `<div class="empty-state m-empty"><div class="es-ic">${icon('file', 28, 1.8)}</div><b>No reports yet</b><span>Reports for ${esc(first(who))} appear here as soon as FRH releases them after a visit.</span></div>`}
        </div>`;
    },
    mount(n) {
      const id = S.mRepVisit;
      if (!id) return;
      const g = n.querySelector(`[data-visit="${id}"]`), b = n.querySelector('.scr-body');
      if (g && b) b.scrollTop = Math.max(0, g.offsetTop - b.offsetTop - 12);
      setTimeout(() => { if (S.mRepVisit !== id) return; S.mRepVisit = null; if (S.open && S.screen === n.dataset.id) F.upd(); }, 1600);
    },
  });
  F.SCREENS.reports = F.SCREENS['reports-hub'];

  /* ================= 13.5 Interactive lab report (M18, M19) ================= */
  const TEST = (id, n, v, u, lo, hi) => ({ id, n, v, u, lo, hi });
  const CBC = v => ({ n: 'Complete blood count', tests: [
    TEST('hb', 'Haemoglobin', v[0], 'g/dL', 12.0, 15.5),
    TEST('wbc', 'White blood cells', v[1], '×10⁹/L', 4.0, 11.0),
    TEST('plt', 'Platelets', v[2], '×10⁹/L', 150, 400),
    TEST('rbc', 'Red blood cells', v[3], '×10¹²/L', 3.9, 5.2),
    TEST('hct', 'Haematocrit', v[4], '%', 36, 46),
    TEST('mcv', 'Mean cell volume', v[5], 'fL', 80, 100),
  ] });
  const LAB = {
    sep: { name: 'Blood panel results', appt: 'FRH-24512', who: 'Sara Ahmed', meta: 'Female · 34 yrs', collected: 'Tue 2 Sep, 8:10 PM', reported: '3 Sep', reviewer: 'Dr. Omar Haddad', rep: 'rep-24512-lab',
      panels: [
        CBC([12.9, 6.8, 265, 4.4, 39, 86]),
        { n: 'Lipid profile', tests: [
          TEST('chol', 'Total cholesterol', 5.6, 'mmol/L', null, 5.2),
          TEST('ldl', 'LDL cholesterol', 3.6, 'mmol/L', null, 3.4),
          TEST('hdl', 'HDL cholesterol', 1.4, 'mmol/L', 1.2, null),
          TEST('tg', 'Triglycerides', 1.3, 'mmol/L', null, 1.7),
        ] },
        { n: 'Vitamins & iron', tests: [
          TEST('vitd', 'Vitamin D (25-OH)', 18, 'ng/mL', 30, 100),
          TEST('b12', 'Vitamin B12', 412, 'pg/mL', 200, 900),
          TEST('fer', 'Ferritin', 38, 'ng/mL', 15, 150),
        ] },
      ] },
    aug: { name: 'Vitamin D + FBC results', appt: 'FRH-24388', who: 'Sara Ahmed', meta: 'Female · 34 yrs', collected: 'Sat 16 Aug, 7:40 AM', reported: '17 Aug', reviewer: 'Dr. Omar Haddad', rep: 'rep-24388-lab',
      panels: [
        CBC([12.6, 7.1, 248, 4.3, 38, 87]),
        { n: 'Vitamins', tests: [
          TEST('vitd', 'Vitamin D (25-OH)', 16, 'ng/mL', 30, 100),
          TEST('b12', 'Vitamin B12', 390, 'pg/mL', 200, 900),
        ] },
      ] },
  };
  const status = t => (t.lo != null && t.v < t.lo ? 'low' : t.hi != null && t.v > t.hi ? 'high' : 'normal');
  const rangeTxt = t => (t.lo != null && t.hi != null ? `${t.lo}–${t.hi}` : t.hi != null ? `below ${t.hi}` : `above ${t.lo}`);
  const SL = { normal: 'In range', high: 'High', low: 'Low' };
  /* M19: two-sided ranges get low / normal / high zones; upper-only and lower-only ranges get two */
  function rangeBar(t) {
    let min, max;
    if (t.lo != null && t.hi != null) { const sp = t.hi - t.lo; min = Math.max(0, t.lo - sp * 0.5); max = t.hi + sp * 0.5; }
    else if (t.hi != null) { min = 0; max = t.hi * 1.6; }
    else { min = 0; max = t.lo * 2.4; }
    const pad = (max - min) * 0.06;
    min = Math.max(0, Math.min(min, t.v - pad)); max = Math.max(max, t.v + pad);
    const P = x => (x - min) / (max - min) * 100;
    const a = t.lo != null ? P(t.lo) : 0, b = t.hi != null ? P(t.hi) : 100, pos = Math.min(97, Math.max(3, P(t.v)));
    const z = (cls, l, w) => `<span class="m-rb-z ${cls}" style="left:${l.toFixed(1)}%;width:${w.toFixed(1)}%"></span>`;
    return `<div class="m-rb ${status(t)}" role="img" aria-label="${t.v} ${t.u}, range ${rangeTxt(t)}">
        ${a > 0 ? z('out', 0, a) : ''}${z('ok', a, b - a)}${b < 100 ? z('out', b, 100 - b) : ''}
        ${t.lo != null ? `<span class="m-rb-t" style="left:${a.toFixed(1)}%">${t.lo}</span>` : ''}
        ${t.hi != null ? `<span class="m-rb-t" style="left:${b.toFixed(1)}%">${t.hi}</span>` : ''}
        <i class="m-rb-dot" style="left:${pos.toFixed(1)}%"></i></div>`;
  }
  const testRow = t => {
    const st = status(t);
    return `<div class="m-test">
        <div class="m-test-r1"><b>${t.n}</b><span class="m-test-v ${st}">${t.v}<small>${t.u}</small></span></div>
        ${rangeBar(t)}
        <div class="m-test-r3"><span>Range ${rangeTxt(t)} ${t.u}</span><span class="m-st ${st}">${SL[st]}</span></div>
      </div>`;
  };
  F.SCREENS['lab-report'] = patch({
    status: 'dark', cls: 'm-lab',
    render() {
      const k = LAB[S.mLab] ? S.mLab : 'sep', r = LAB[k], a = findAppt(r.appt);
      const all = r.panels.flatMap(p => p.tests), out = all.filter(t => status(t) !== 'normal');
      const f = S.mLabF === 'out' && out.length ? 'out' : 'all';
      const panels = r.panels.map(p => ({ n: p.n, tests: f === 'out' ? p.tests.filter(t => status(t) !== 'normal') : p.tests })).filter(p => p.tests.length);
      return `${backNav('Lab results', 'reports-hub', `<button class="icon-btn" type="button" data-act="m-share" data-n="${esc(r.name)}" aria-label="Share">${icon('share', 18, 1.9)}</button>`)}
        <div class="scr-body">
          <div class="m-lab-pills"><span class="pill m-blue">${icon('lab', 12, 2.4)} Lab results</span><span class="pill green">Released ${r.reported}</span></div>
          <h1 class="h1 m-lab-title">${r.name}</h1>
          <div class="m-facts">
            <div><small>Patient</small><b>${r.who}</b><span>${r.meta}</span></div>
            <div><small>Sample collected</small><b>${r.collected}</b><span>Reviewed by ${r.reviewer}</span></div>
          </div>
          ${a ? `<button class="m-applink" type="button" data-act="m-appt" data-id="${a.id}">${icon('calendar', 16, 2)}<span>From your visit · <b>${a.service}</b>, ${a.date}</span>${icon('chevRight', 16, 2.4)}</button>` : ''}
          <div class="m-lab-stats">
            <div><b>${all.length}</b><small>tests</small></div>
            <div class="ok"><b>${all.length - out.length}</b><small>in range</small></div>
            <div class="out"><b>${out.length}</b><small>out of range</small></div>
          </div>
          <div class="seg-tabs m-lab-f" role="tablist">
            <button type="button" role="tab" aria-selected="${f === 'all'}" class="${f === 'all' ? 'on' : ''}" data-act="m-lab-f" data-f="all">All tests (${all.length})</button>
            <button type="button" role="tab" aria-selected="${f === 'out'}" class="${f === 'out' ? 'on' : ''}" data-act="m-lab-f" data-f="out">Out of range (${out.length})</button>
          </div>
          ${panels.map(p => `<div class="sec-h m-sech"><h4>${p.n}</h4><span class="m-sub">${plural(p.tests.length, 'test', 'tests')}</span></div>
            <div class="info-card m-tests">${p.tests.map(testRow).join('')}</div>`).join('')}
          <div class="m-lab-note">${xi('info', 16, 2.2)}<span>Ranges come from the lab that tested your sample. ${r.reviewer} has reviewed these results; message your care team if you have a question.</span></div>
          <button class="m-applink m-ask" type="button" data-act="m-support">${icon('chat', 16, 2)}<span><b>Ask about these results</b></span>${icon('chevRight', 16, 2.4)}</button>
        </div>
        <div class="scr-foot"><div class="m-two"><button class="btn btn-secondary" type="button" data-act="m-pdf" data-n="${esc(r.name)}">${icon('eye', 18, 2)} View PDF</button>
          <button class="btn btn-primary" type="button" data-act="m-dl" data-n="${esc(r.name)}">${icon('download', 18, 2)} Download</button></div></div>`;
    },
  });

  /* ================= 13.6 E-prescription (M21) ================= */
  const RX = {
    'FRH-24512': {
      id: 'RX-24512-01', appt: 'FRH-24512', issued: 'Wed 3 Sep 2026', at: '10:05 AM', who: 'Sara Ahmed', meta: '34 yrs · Female',
      doc: { name: 'Dr. Omar Haddad', img: 'doc-1.jpg', role: 'Internal Medicine', lic: 'DHA-P-0048213' },
      meds: [
        { n: 'Vitamin D3 50,000 IU', form: 'Capsule · by mouth', dose: '1 capsule', freq: 'Once a week', dur: '8 weeks', ins: 'Take with a meal, on the same day each week.' },
        { n: 'Oral rehydration salts', form: 'Sachet · by mouth', dose: '1 sachet', freq: 'Once a day', dur: '5 days', ins: 'Dissolve in 200 ml of water and sip slowly over 30 minutes.' },
      ],
    },
  };
  const rxKey = id => (RX[id] ? id : Object.keys(RX).find(k => RX[k].id === id) || Object.keys(RX)[0]);
  F.SCREENS['e-rx'] = patch({
    status: 'dark', cls: 'm-rx',
    render() {
      const x = RX[rxKey(S.mRx)], a = findAppt(x.appt);
      return `${backNav('E-prescription', 'reports-hub')}
        <div class="scr-body">
          <div class="m-rx-card">
            <div class="m-rx-top"><span class="m-rx-mark">${mark('#D71F32', 22)}</span><div><b>Prescription ${x.id}</b><small>Issued ${x.issued}, ${x.at}</small></div><span class="pill green">Valid</span></div>
            <div class="m-rx-doc"><img src="${img(x.doc.img)}" alt=""><div><small>Prescribed by</small><b>${x.doc.name}</b><span>${x.doc.role} · Licence ${x.doc.lic}</span></div></div>
            <div class="m-facts flat">
              <div><small>Patient</small><b>${x.who}</b><span>${x.meta}</span></div>
              <div><small>Medicines</small><b>${x.meds.length}</b><span>listed below</span></div>
            </div>
            ${a ? `<button class="m-applink in" type="button" data-act="m-appt" data-id="${a.id}">${icon('calendar', 16, 2)}<span>From your visit · <b>${a.service}</b>, ${a.date}</span>${icon('chevRight', 16, 2.4)}</button>` : ''}
          </div>
          <div class="sec-h m-sech"><h4>Medicines</h4><span class="m-sub">${plural(x.meds.length, 'item', 'items')}</span></div>
          ${x.meds.map(m => `<div class="m-med">
              <div class="m-med-top"><span class="tile violet">${xi('pill', 18, 2)}</span><div><b>${m.n}</b><small>${m.form}</small></div></div>
              <div class="m-med-grid"><div><small>Dose</small><b>${m.dose}</b></div><div><small>How often</small><b>${m.freq}</b></div><div><small>For</small><b>${m.dur}</b></div></div>
              ${m.ins ? `<div class="m-med-ins">${xi('info', 15, 2.2)}<span>${m.ins}</span></div>` : ''}
            </div>`).join('')}
          <p class="m-fine">Show this page or the PDF at any pharmacy. Questions about a medicine? Message your care team from the visit.</p>
        </div>
        <div class="scr-foot"><div class="m-two"><button class="btn btn-secondary" type="button" data-act="m-dl" data-n="Prescription ${x.id}">${icon('download', 18, 2)} Download PDF</button>
          <button class="btn btn-primary" type="button" data-act="m-share" data-n="Prescription ${x.id}">${icon('share', 18, 2)} Share</button></div></div>`;
    },
  });

  /* share sheet (report, lab result, prescription) */
  const SHARE = [['wa', 'WhatsApp', 'chat'], ['mail', 'Mail', 'mail'], ['msg', 'Messages', 'sms'], ['files', 'Save to Files', 'download']];
  F.SHEETS['m-share'] = () => {
    const n = (S.mShare && S.mShare.n) || 'Document';
    return `<div class="sheet m-share" role="dialog" aria-label="Share"><div class="grab"></div>
        <div class="m-share-doc"><span class="tile">${icon('file', 18, 2)}</span><div><b>${esc(n)}</b><small>PDF · FRH Healthcare</small></div></div>
        <div class="m-share-apps">${SHARE.map(([k, l, ic]) => `<button type="button" data-act="m-share-to" data-k="${k}"><span class="m-share-ic ${k}">${icon(ic, 24, 2)}</span>${l}</button>`).join('')}</div>
        <button class="btn btn-secondary" type="button" data-act="sheet-close">Cancel</button>
      </div>`;
  };

  /* ================= contracts: reports + prescription ================= */
  F.openReports = (o = {}) => {
    S.mRepWho = o.who || 'all';
    S.mRepVisit = o.visit || null;
    F.go('reports-hub');
  };
  /* id: a report id from this list, a report name (“Blood panel results”), or a visit id (FRH-…) */
  F.openReport = id => {
    const r = findRep(id);
    if (!r) {
      if (findAppt(id) || /^FRH-\d+$/.test(String(id))) return F.openReports({ visit: id });
      return F.go('reports-hub');
    }
    if (r.status === 'pending') return F.openReports({ visit: r.appt });
    if (r.type === 'rx') return F.openRx(r.rx);
    if (r.lab) { S.mLab = r.lab; S.mLabF = 'all'; return F.go('lab-report'); }
    return openPdf(r.name);
  };
  /* id: a visit id (FRH-24512) or a prescription id (RX-24512-01) */
  F.openRx = id => { S.mRx = rxKey(id); F.go('e-rx'); };

  /* ================= actions (all prefixed m-) ================= */
  Object.assign(F.ACT, {
    'm-back': n => F.back(n.dataset.fb || 'home'),
    'm-tabgo': n => {
      const to = n.dataset.to;
      if (S.screen === to) {
        const b = F.cur() && F.cur().querySelector('.scr-body');
        if (b) { if (b.scrollTo) b.scrollTo({ top: 0, behavior: 'smooth' }); else b.scrollTop = 0; }
        return;
      }
      if (!F.SCREENS[to]) return F.toast('Coming soon', 'sparkle');
      F.go(to, { dir: 'fade' });
    },
    'm-appt': n => openAppt(n.dataset.id),
    'm-ben': () => { S.mBenAll = !S.mBenAll; F.upd(); },
    'm-renew': () => { S.mPick = tierKey(); S.mMode = 'renew'; F.go('m-plan'); },
    'm-change': () => { const i = TIERS.indexOf(tierKey()); S.mPick = TIERS[Math.min(i + 1, TIERS.length - 1)]; F.go(S.isMember ? 'm-plans' : 'membership'); },
    'm-support': () => openSupport(),
    'm-add-person': () => (F.SCREENS.patients ? F.go('patients') : F.toast('Add people from Profile → Patients', 'users')),
    'm-pick': n => { S.mPick = n.dataset.t; F.upd(); },
    'm-view-plan': () => { S.mMode = 'join'; F.go('m-plan'); },
    'm-buy': () => { S.mOrder = order(S.mMode === 'renew' && S.isMember ? 'renew' : 'join', pickKey()); S.mPaying = false; F.openSheet('m-pay'); },
    'm-upgrade': () => { S.mOrder = order('upgrade', pickKey()); S.mPaying = false; F.openSheet('m-pay'); },
    'm-pm': n => { S.mPm = n.dataset.k; reSheet('m-pay'); },
    'm-pay-go': () => {
      if (S.mPaying) return;
      S.mPaying = true; reSheet('m-pay');
      const from = S.screen;
      setTimeout(() => {
        S.mPaying = false;
        if (!S.open || S.screen !== from || S.sheet !== 'm-pay') return;
        completePurchase();
      }, 1400);
    },
    'm-welcome-book': () => {
      const T = TIER[tierKey()], s = T.services.find(x => leftOf(x.k) > 0) || T.services[0];
      F.closeSheet(true);
      S.mSch = freshSch(s.k);
      F.go('m-schedule');
    },
    'm-schedule': n => { S.mSch = freshSch(n.dataset.k || 'doctor'); F.go('m-schedule'); },
    'm-step': n => { sch().step = +n.dataset.i; F.upd(); },
    'm-pat': n => { const q = sch(); q.pat = +n.dataset.i; advance(q); F.upd(); },
    'm-addr': n => { const q = sch(); q.addr = +n.dataset.i; advance(q); F.upd(); },
    'm-add-addr': () => {
      const done = a => {
        const q = sch();
        if (a && (a.line || a.label)) {
          let i = B.addresses.findIndex(x => x.line === a.line);
          if (i < 0) { B.addresses.push({ label: a.label || 'Other', line: a.line || a.label, note: a.note || '' }); i = B.addresses.length - 1; }
          q.addr = i; advance(q);
        }
        setTimeout(() => { if (S.open && S.screen === 'px-address') F.back('m-schedule'); }, 0);
      };
      if (typeof F.openAddressForm === 'function') F.openAddressForm({ ctx: 'appt', done });
      else if (F.SCREENS['px-address']) F.go('px-address');
      else F.toast('Add addresses from Profile → Addresses', 'pin');
    },
    'm-day': n => { const q = sch(), k = +n.dataset.k; if (q.day !== k) { q.day = k; q.time = null; } F.upd(); },
    'm-time': n => { const q = sch(); q.time = n.dataset.t; advance(q); F.upd(); },
    'm-issue': n => { const q = sch(), c = n.dataset.c, l = q.issue ? q.issue.split(', ') : []; q.issue = (l.includes(c) ? l.filter(x => x !== c) : [...l, c]).join(', '); F.upd(); },
    'm-issue-done': n => { const q = sch(); if (n.dataset.skip) q.issue = ''; q.issueDone = true; advance(q); F.upd(); },
    'm-confirm': () => {
      const q = sch();
      if (S.mBooking) return;
      if (q.pat === null || (!isTele(q) && q.addr === null) || !q.time) { F.shake('.m-step.on'); F.toast('Finish the steps above to confirm', 'alert'); return; }
      S.mBooking = true; F.upd();
      const from = S.screen;
      setTimeout(() => {
        S.mBooking = false;
        if (!S.open || S.screen !== from) return;
        confirmBooking();
        F.upd();
      }, 700);
    },
    'm-booked-appt': () => {
      const id = S.mLast && S.mLast.id, from = S.screen;
      F.closeSheet();
      setTimeout(() => { if (!S.open || S.screen !== from) return; if (id) openAppt(id); else F.go('appts'); }, 260);
    },
    'm-booked-done': () => {
      const from = S.screen;
      F.closeSheet();
      setTimeout(() => {
        if (!S.open || S.screen !== from) return;
        F.back('membership');
        if (S.screen !== 'membership') F.go('membership', { dir: 'none' });
      }, 260);
    },
    'm-rep-who': n => { S.mRepWho = n.dataset.k; S.mRepVisit = null; F.upd(); },
    'm-rep': n => F.openReport(n.dataset.id),
    'm-pending': () => F.toast('We’ll notify you as soon as it’s released', 'bell'),
    'm-lab-f': n => { S.mLabF = n.dataset.f; F.upd(); },
    'm-pdf': n => openPdf(n.dataset.n),
    'm-dl': n => saved(n.dataset.n),
    'm-share': n => { S.mShare = { n: n.dataset.n }; F.openSheet('m-share'); },
    'm-share-to': n => {
      const k = n.dataset.k, name = (S.mShare && S.mShare.n) || 'Document';
      F.closeSheet();
      if (k === 'files') saved(name);
      else F.toast(`Opening ${k === 'wa' ? 'WhatsApp' : k === 'mail' ? 'Mail' : 'Messages'} with ${name} attached`, 'share');
    },
  });

  /* ================= jump setups for the presenter panel (F.DEVPREP) ================= */
  const P = F.DEVPREP = F.DEVPREP || {};
  P['m-member'] = (t = 'gold') => { F.setMember(t); F.go('membership', { dir: 'fade' }); };
  P['m-nonmember'] = () => { F.setMember(null); S.mPick = 'gold'; F.go('membership', { dir: 'fade' }); };
  P['m-plan'] = () => { F.setMember(null); S.mPick = 'gold'; S.mMode = 'join'; F.go('m-plan', { dir: 'fade' }); };
  P['m-pay'] = () => { P['m-plan'](); S.mOrder = order('join', 'gold'); S.mPaying = false; F.openSheet('m-pay'); };
  P['m-welcome'] = () => { F.setMember('gold', { fresh: true }); S.mDone = null; F.go('membership', { dir: 'fade' }); F.openSheet('m-welcome'); };
  P['m-renew'] = () => { F.setMember('gold'); S.mPick = 'gold'; S.mMode = 'renew'; F.go('m-plan', { dir: 'fade' }); };
  P['m-plans'] = () => { F.setMember('gold'); S.mPick = 'platinum'; F.go('m-plans', { dir: 'fade' }); };
  P['m-schedule'] = () => { F.setMember(S.isMember ? tierKey() : 'gold'); S.mSch = freshSch('doctor'); F.go('m-schedule', { dir: 'fade' }); };
  P['m-booked'] = () => { P['m-schedule'](); S.mLast = null; F.openSheet('m-booked'); };
  P['reports-hub'] = () => { S.mRepWho = 'all'; F.go('reports-hub', { dir: 'fade' }); };
  P['reports-empty'] = () => { S.mRepWho = (B.patients[2] || {}).name || 'Yusuf Ahmed'; F.go('reports-hub', { dir: 'fade' }); };
  P['lab-report'] = () => { S.mLab = 'sep'; S.mLabF = 'all'; F.go('lab-report', { dir: 'fade' }); };
  P['e-rx'] = () => { S.mRx = 'FRH-24512'; F.go('e-rx', { dir: 'fade' }); };
})();
/* Final v15: Services is a tab. The Medical services screen becomes its root: no back button, the tab bar below. */
(function () {
  const F = window.FRH, d = F.SCREENS.cats;
  if (!d || d._v15) return;
  const r = d.render;
  d.render = function () {
    const h = r.apply(this, arguments)
      .replace(/<button class="nav-btn" type="button" data-act="nav-back"[^>]*>[\s\S]*?<\/button>/, '<span style="width:40px"></span>')
      .replace('<span class="nav-title">Medical services</span>', '<span class="nav-title">Services</span>');
    return h + F.tabbar('services');
  };
  d.cls = (d.cls || '') + ' v15-tabroot';
  d._v15 = true;
})();
