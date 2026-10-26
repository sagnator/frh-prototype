/* FRH final — Appointments, appointment details, cancellation, clinician profile and the Chat tab.
   Screens: appts · appt-details (aliases track, visit, edit-appt) · appt-map · cancel-appt · cancelled ·
            t-doc / doc-profile · chat-home · chat
   Sheets:  t-more · t-time · t-loc · t-call · t-attach
   Contracts: F.openAppt(id) · F.openSupportChat(bookingId?) · F.openDirectChat(k, bookingId) ·
              F.apptStatus(id) · F.apptSetStage(id, stage) · F.apptAdvance(id) · F.apptJump(view) · F.chatUnread()
   Spec IDs (T1–T47, spec/final-decisions.js) are noted beside the code that implements them. */
(function () {
  const { icon, mark } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK || {}, PD = window.FRHPROFILE || {};
  const img = n => `assets/img/${n}`;
  const esc = s => F.esc(s == null ? '' : s);
  const aed = n => 'AED ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clone = o => JSON.parse(JSON.stringify(o));
  const clean = p => String(p || '').replace(/\s*\(.*\)\s*$/, '');
  const relOf = p => ((/\(([^)]*)\)/.exec(p || '') || [])[1] || '').replace(/^Mum$/, 'Mother');
  const initials = n => clean(n).replace(/^Dr\.?\s+/, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  const firstOf = n => { const p = clean(n).split(/\s+/); return /^Dr\.?$/.test(p[0]) ? `Dr. ${p[1] || ''}` : p[0]; };
  const TONES = ['a', 'b', 'c', 'd'];
  const tone = n => TONES[[...clean(n)].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];
  const av = (n, cls = '') => `<span class="t-av ${tone(n)} ${cls}">${initials(n)}</span>`;   // T25: initials, never photos
  const andJoin = l => l.length < 2 ? (l[0] || '') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`;

  /* icons the shared set does not have */
  const XI = {
    dotsV: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    expand: '<path d="M15 3.5h5.5V9"/><path d="M9 20.5H3.5V15"/><path d="m20.5 3.5-6.5 6.5"/><path d="m3.5 20.5 6.5-6.5"/>',
    car: '<path d="M5 17H4a1 1 0 0 1-1-1v-3.4l2.1-5.1A2 2 0 0 1 7 6.3h10a2 2 0 0 1 1.9 1.2l2.1 5.1V16a1 1 0 0 1-1 1h-1"/><path d="M3.2 12.5h17.6"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
    rebook: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M12 8v4l2.5 2"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-8.5 8.5"/>',
    pinned: '<path d="M9 3.5h6l-1 6 3.5 3.5h-11L10 9.5z"/><path d="M12 13v7.5"/>',
  };
  const ic = (n, s = 20, w = 1.8) => XI[n]
    ? `<svg class="ic ic-${n}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XI[n]}</svg>`
    : icon(n, s, w);
  const stars = (v, s = 14) => `<span class="t-st5">${[1, 2, 3, 4, 5].map(i => `<span class="${Math.round(v) >= i ? 'on' : ''}">${icon('starFill', s)}</span>`).join('')}</span>`;
  const frhAv = (cls = '', on) => `<span class="t-frh ${cls}">${mark('#fff', cls.includes('lg') ? 30 : cls.includes('sm') ? 18 : 22)}${on === undefined ? '' : `<i class="${on ? 'on' : ''}"></i>`}</span>`;

  /* patch helper: skips identical HTML; animates a section only when its content really changed */
  function setHTML(n, h, anim) {
    if (!n || n._h === h) return false;
    const had = n._h !== undefined;
    n.innerHTML = h; n._h = h;
    if (anim && had) { n.classList.remove('t-in'); void n.offsetWidth; n.classList.add('t-in'); }
    return true;
  }
  const setTxt = (el, h) => { if (el && el._h !== h) { el.innerHTML = h; el._h = h; } };

  /* ---------- demo clock: the prototype lives on Mon 28 Sep 2026, 5:12 PM ---------- */
  const NOW0 = new Date(2026, 8, 28, 17, 12, 0).getTime(), T0 = Date.now(), MIN = 6e4;
  const now = () => NOW0 + (Date.now() - T0);
  F.now = now;   // shared demo clock (the booking flow dates bookings from it)
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hm = t => { const d = new Date(t), h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  const dshort = t => { const d = new Date(t); return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
  const stamp = t => `${dshort(t)} ${new Date(t).getFullYear()} · ${hm(t)}`;
  const addWorkDays = (t, n) => { const d = new Date(t); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; } return d.getTime(); };

  /* ---------- clinicians (T15: doctor, nurse, physio and lab) ---------- */
  const RB = { doc: 'Doctor', nurse: 'Nurse', physio: 'Physio', lab: 'Lab' };
  const PEOPLE = {
    layla: { key: 'layla', img: 'doc-5.jpg', name: 'Dr. Layla Haddad', role: 'Doctor', rk: 'doc', spec: 'General Practitioner', lic: 'DHA-P-0071935',
      quals: 'MBBS, MRCGP (Family Medicine)', rating: 4.9, reviews: 298, langs: ['English', 'Arabic', 'French'],
      stats: [['3,100+', 'Patients'], ['12 yrs', 'Experience'], ['298', 'Reviews']], rv: 'doc',
      about: 'Dr. Layla is a family physician who has worked in Dubai for twelve years, the last five leading FRH’s evening home-visit team. She sees adults and children, and is the doctor families ask for when an elderly parent needs a careful, unhurried check at home. She trained in Beirut and London and speaks English, Arabic and French.' },
    omar: { key: 'omar', img: 'doc-1.jpg', name: 'Dr. Omar Haddad', role: 'Doctor', rk: 'doc', spec: 'Internal Medicine', lic: 'DHA-P-0048213',
      quals: 'MBBS, MD (Internal Medicine)', rating: 4.9, reviews: 233, langs: ['English', 'Arabic', 'Hindi'],
      stats: [['2,500+', 'Patients'], ['10 yrs', 'Experience'], ['233', 'Reviews']], rv: 'doc',
      about: 'Dr. Omar has spent ten years in internal and family medicine across Dubai and Amman, the last four of them in home-visit care. He reviews lab results for FRH and leads the chronic-care visits for patients with diabetes and high blood pressure.' },
    grace: { key: 'grace', img: 'doc-3.jpg', name: 'Grace Santos', role: 'Nurse', rk: 'nurse', spec: 'Senior Registered Nurse', lic: 'DHA-N-0164420',
      quals: 'BSc Nursing, RN', rating: 4.8, reviews: 164, langs: ['English', 'Tagalog'],
      stats: [['1,800+', 'Patients'], ['9 yrs', 'Experience'], ['164', 'Reviews']], rv: 'nurse',
      about: 'Grace has nine years of hospital and home-care nursing behind her, including four in a Dubai emergency department. She runs IV therapy and sample collection for FRH and is known for first-time cannulas and for explaining every step before she starts.' },
    mark: { key: 'mark', img: 'doc-4.jpg', name: 'Mark Evans', role: 'Physiotherapist', rk: 'physio', spec: 'Musculoskeletal rehab', lic: 'DHA-A-0120876',
      quals: 'BSc (Hons) Physiotherapy', rating: 4.8, reviews: 121, langs: ['English'],
      stats: [['900+', 'Patients'], ['8 yrs', 'Experience'], ['121', 'Reviews']], rv: 'physio',
      about: 'Mark specialises in knee, hip and back rehabilitation after surgery or injury. He trained in Manchester and has treated patients at home in Dubai for six years, building each plan around the furniture and space the patient actually has.' },
    daniel: { key: 'daniel', img: 'doc-6.jpg', name: 'Daniel Mensah', role: 'Lab technician', rk: 'lab', spec: 'Sample collection', lic: 'DHA-A-0139257',
      quals: 'BSc Medical Laboratory Science', rating: 4.8, reviews: 142, langs: ['English', 'French'],
      stats: [['2,400+', 'Patients'], ['7 yrs', 'Experience'], ['142', 'Reviews']], rv: 'lab',
      about: 'Daniel collects blood and swab samples at home for FRH’s partner lab. He spent five years in a Dubai hospital lab before moving to home visits, and is the one parents ask for when a child needs a blood test.' },
  };
  const COORD = { aisha: { name: 'Aisha Rahman', role: 'FRH Support' } };
  const REVIEWS = {
    doc: [
      { n: 'Huda Al Ali', d: '14 Sep 2026', s: 5, t: 'Arrived inside the window at 11 PM and was wonderful with my son. The prescription was in the app an hour later.' },
      { n: 'James Porter', d: '22 Aug 2026', s: 5, t: 'Far easier than sitting in a clinic. A clear explanation and a follow-up call two days later, as promised.' },
      { n: 'Mariam Khan', d: '19 Aug 2026', s: 4, t: 'Thorough and kind. The arrival slipped by about 15 minutes, but the live map kept me informed.' },
    ],
    nurse: [
      { n: 'Rania Saleh', d: '9 Sep 2026', s: 5, t: 'The drip went in first time and she talked me through everything. Calm, quick and very clean.' },
      { n: 'Tom Becker', d: '30 Aug 2026', s: 5, t: 'Took bloods from my father without any fuss. Results were in the app the next morning.' },
      { n: 'Noor Hassan', d: '12 Aug 2026', s: 4, t: 'Professional and gentle. I will book her again for my mum’s weekly checks.' },
    ],
    physio: [
      { n: 'Fatima Ahmed', d: '24 Sep 2026', s: 5, t: 'Mark built the exercises around my own chair and stairs. My knee already bends further.' },
      { n: 'Daniel Moore', d: '2 Sep 2026', s: 5, t: 'A clear plan, patient with my questions, and he left a printed sheet I actually follow.' },
    ],
    lab: [
      { n: 'Priya Menon', d: '21 Sep 2026', s: 5, t: 'My daughter didn’t even cry. Results arrived the same evening.' },
      { n: 'Ahmed Saeed', d: '3 Sep 2026', s: 5, t: 'On time at 7 AM, quick and tidy. Much better than queueing at a lab before work.' },
    ],
  };

  /* ---------- one more upcoming booking: two patients, two services, team not yet assigned ---------- */
  if (!D.appointments.upcoming.some(a => a.id === 'FRH-24863')) {
    D.appointments.upcoming.push({
      id: 'FRH-24863', status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW',
      service: 'Vaccinations', sub: 'Flu vaccine + Vitamin D panel', date: 'Sat 3 Oct', time: '8:00 – 9:00 AM',
      patients: ['Yusuf Ahmed (Son)', 'Sara Ahmed'], address: 'Home · Al Barsha 1, Villa 24', team: 'Team being assigned', total: 441,
    });
  }

  /* ---------- per-appointment detail the shared data does not carry ---------- */
  const XB = {
    'FRH-24817': {
      blocks: [
        { p: 'Sara Ahmed', icon: 'stetho', svc: 'Doctor on Call', subs: ['General Practitioner visit', 'Night visit'], issue: 'Fever and a sore throat since last night.' },
        { p: 'Fatima Ahmed', rel: 'Mother', icon: 'stetho', svc: 'Doctor on Call', subs: ['General Practitioner visit', 'Knee assessment'], issue: 'Right knee sore since Friday, worse on the stairs.' },
      ],
      team: ['layla', 'grace'], track: 'onway', svc: 'gp', km: 4.3,
      driver: { name: 'Rashid Khan', car: 'White Toyota Previa', plate: 'K 48213' },
      sum: { lines: [['Sara Ahmed', 'General Practitioner visit', 250], ['Fatima Ahmed', 'General Practitioner visit', 250]], disc: ['Family visit · second patient', 100], vat: 20, total: 420 },
      invoice: { no: 'INV-2026-00418' }, rx: null,
    },
    'FRH-24790': {
      blocks: [{ p: 'Fatima Ahmed', rel: 'Mother', icon: 'physio', svc: 'Physiotherapy', subs: ['Knee rehab · session 2 of 6'] }],
      team: ['mark'], track: 'assigned', cat: 'physio', km: 6.1,
      driver: { name: 'Imran Ali', car: 'Silver Nissan Altima', plate: 'R 20931' },
      sum: { lines: [['Fatima Ahmed', 'Knee rehab session', 300.75]], disc: ['Follow-up session · 5%', 15.04], vat: 14.29, total: 300 },
      invoice: { no: 'INV-2026-00409' }, rx: null,
    },
    'FRH-24863': {
      blocks: [
        { p: 'Yusuf Ahmed', rel: 'Son', icon: 'syringe', svc: 'Vaccinations', subs: ['Seasonal flu vaccine (children)'] },
        { p: 'Sara Ahmed', icon: 'lab', svc: 'Lab Tests', subs: ['Vitamin D + B12 panel'], issue: 'Tired most afternoons; last vitamin D was low.' },
      ],
      team: [], assign: ['grace', 'daniel'], track: 'unassigned', svc: 'flu', km: 4.3,
      driver: { name: 'Imran Ali', car: 'Silver Nissan Altima', plate: 'R 20931' },
      sum: { lines: [['Yusuf Ahmed', 'Flu vaccine (children)', 180], ['Sara Ahmed', 'Vitamin D + B12 panel', 240]], disc: null, vat: 21, total: 441 },
      rx: null,
    },
    'FRH-24512': {
      blocks: [{ p: 'Sara Ahmed', icon: 'drip', svc: 'IV Therapy at Home', subs: ['Immunity drip · 45 min'], time: '8:00 – 8:45 PM', issue: 'Fatigue and low immunity after travel.' }],
      team: ['omar', 'grace'], svc: 'immune',
      reports: [{ id: 'rep-24512-lab', kind: 'lab', name: 'Blood panel results', date: 'Wed 3 Sep' }, { id: 'rep-24512-visit', kind: 'report', name: 'Vitals & infusion record', date: 'Tue 2 Sep' }],
      rx: { n: 2, by: 'Dr. Omar Haddad', date: 'Wed 3 Sep' },
      notes: (D.visit && D.visit.notes) || 'Patient responded well to the infusion.',
      invoice: { no: 'INV-2026-00377' },
      sum: { lines: [['Sara Ahmed', 'Immunity drip', 428.57]], vat: 21.43, total: 450 },
    },
    'FRH-24388': {
      blocks: [{ p: 'Sara Ahmed', icon: 'lab', svc: 'Lab Tests', subs: ['Vitamin D', 'Full blood count'], time: '7:30 – 7:50 AM', issue: 'Routine check: tired most afternoons.' }],
      team: ['grace'], svc: 'vitd',
      reports: [{ id: 'rep-24388-lab', kind: 'lab', name: 'Vitamin D + FBC results', date: 'Sun 17 Aug' }, { id: 'rep-24388-visit', kind: 'report', name: 'Sample collection record', date: 'Sat 16 Aug' }],
      rx: null,
      notes: 'Samples taken at home without complications. Results reviewed by Dr. Omar Haddad; no follow-up needed.',
      invoice: { no: 'INV-2026-00342' },
      rated: { who: 5, svc: 4, whoC: 'Quick, painless and on time.', svcC: 'Easy booking. Results came a few hours later than promised.', on: 'Sun 17 Aug' },
      sum: { lines: [['Sara Ahmed', 'Vitamin D + full blood count', 228.57]], vat: 11.43, total: 240 },
    },
    'FRH-24201': {
      blocks: [{ p: 'Sara Ahmed', icon: 'heartPulse', svc: 'Dentist at Home', subs: ['Scaling & polishing'] }],
      team: [], svc: 'scaling',
      cancelledOn: 'Wed 27 Aug 2026 · 9:14 PM', reason: 'Scheduling conflict',
      steps: [['Cancelled', 'Wed 27 Aug, 9:14 PM', true], ['Refund issued', 'Thu 28 Aug', true], ['Back on Visa •••• 4242', 'Tue 2 Sep', true]],
      invoice: { no: 'INV-2026-00361' },
      sum: { lines: [['Sara Ahmed', 'Scaling & polishing', 380.95]], vat: 19.05, total: 400 },
    },
  };

  /* one chat thread per visit (T40) plus the always-there FRH Support thread */
  const TB = {
    support: { unread: 0, msgs: [
      { day: 'Yesterday', from: 'them', k: 'aisha', t: 'Hi Sara, Fatima’s physiotherapy session is confirmed for Thu 1 Oct at 10 AM with Mark Evans.', at: '6:05 PM' },
      { from: 'me', t: 'Thank you! Could Mark bring a resistance band?', at: '6:12 PM' },
      { from: 'them', k: 'aisha', t: 'I’ve passed that on and he’ll bring one. Anything else I can help with?', at: '6:14 PM' },
    ] },
    'FRH-24817': { unread: 2, msgs: [
      { day: 'Today', from: 'me', t: 'Hi, could the doctor also look at my mother’s knee? It has been sore since Friday.', at: '4:41 PM' },
      { from: 'them', k: 'aisha', t: 'Of course. I’ve added it to the visit notes for Dr. Layla.', at: '4:44 PM' },
      { from: 'them', k: 'layla', t: 'Please keep Fatima’s recent blood pressure readings to hand.', at: '4:48 PM' },
      { from: 'them', k: 'grace', t: 'Hi Sara, Grace here with Dr. Layla. We’ve just left and should be with you around 5:24.', at: '5:08 PM' },
      { from: 'them', k: 'layla', t: 'Is the gate code still 4471, and can we park inside the compound?', at: '5:09 PM' },
    ] },
    'FRH-24790': { unread: 0, msgs: [
      { day: 'Yesterday', from: 'them', k: 'mark', t: 'Hi Sara, see you and Fatima on Thursday at 10. Please keep a firm chair and a towel ready.', at: '6:20 PM' },
      { from: 'me', t: 'Thank you, we will.', at: '6:31 PM' },
    ] },
    'FRH-24512': { unread: 1, msgs: [
      { day: 'Tue 2 Sep', from: 'them', k: 'grace', t: 'Hope you’re feeling better after the drip, Sara.', at: '8:52 PM' },
      { from: 'me', t: 'Much better, thank you!', at: '9:10 PM' },
      { day: 'Wed 3 Sep', from: 'them', k: 'omar', t: 'Your blood panel results are in. Vitamin D is low, so please start the prescription I added to this visit.', at: '10:05 AM' },
    ] },
    'FRH-24388': { unread: 0, msgs: [
      { day: 'Sat 16 Aug', from: 'them', k: 'grace', t: 'Thanks for having us, Sara. Your results will be in the app within 24 hours.', at: '7:52 AM' },
    ] },
  };

  let X = clone(XB), TH = clone(TB), LV = {};
  const RT = {};   // reply timers per thread

  /* ---------- lookups ---------- */
  const ALL = () => [...D.appointments.upcoming, ...D.appointments.completed, ...D.appointments.cancelled];
  const find = id => ALL().find(a => a.id === id);
  const current = () => find(S.apptId) || D.appointments.upcoming[0] || ALL()[0];
  const svcIcon = s => /doctor|gp|consult/i.test(s) ? 'stetho' : /physio/i.test(s) ? 'physio' : /lab|test|pcr|blood/i.test(s) ? 'lab'
    : /iv|drip|nad/i.test(s) ? 'drip' : /vacc/i.test(s) ? 'syringe' : /nurs/i.test(s) ? 'users' : /tele|video/i.test(s) ? 'video' : /dent/i.test(s) ? 'heartPulse' : 'stetho';
  function ext(a) {
    if (!X[a.id]) {
      const pats = a.patients && a.patients.length ? a.patients : [D.user.name], net = a.total / 1.05;
      X[a.id] = {
        blocks: pats.map(p => { const own = a.svcBy && a.svcBy[clean(p)];   /* v45: each person's own services when the booking says */
          return { p: clean(p), rel: relOf(p), icon: svcIcon(a.service), svc: own ? own[0] : a.service, subs: own ? own.slice(1) : [a.sub].filter(Boolean), issue: a.issue || '' }; }),
        team: [], track: 'unassigned', km: 4.3,
        sum: { lines: pats.map(p => [clean(p), a.sumLabel || a.service, net / pats.length]), disc: null, vat: a.total - net, total: a.total },
      };
    }
    return X[a.id];
  }
  const grp = a => a.status === 'completed' ? 'completed' : a.status === 'cancelled' ? 'cancelled' : 'upcoming';
  const TRAVEL = 16 * MIN;
  function lv(a) {
    if (!LV[a.id]) {
      const L = LV[a.id] = { st: ext(a).track || 'unassigned' };
      if (L.st === 'onway') { L.leftAt = NOW0 - 4 * MIN; L.eta = L.leftAt + TRAVEL; }
    }
    return LV[a.id];
  }
  const stage = a => grp(a) === 'upcoming' ? lv(a).st : grp(a);
  const team = a => (grp(a) === 'upcoming' && stage(a) === 'unassigned') ? [] : (ext(a).team || []).map(k => PEOPLE[k]).filter(Boolean);
  const moving = a => grp(a) === 'upcoming' && ['onway', 'arrived', 'treating'].includes(stage(a));   // the team has left
  const canEdit = a => grp(a) === 'upcoming' && !moving(a);                                           // T20
  const isTele = a => /video/i.test(a.address || '');
  const apptName = a => [...new Set(ext(a).blocks.map(b => b.svc))].join(' + ') || a.service;
  const patientsOf = a => [...new Set(ext(a).blocks.map(b => b.p))];
  const leadIcon = a => (ext(a).blocks[0] || {}).icon || svcIcon(a.service);
  const prog = L => Math.min(1, Math.max(0, (now() - L.leftAt) / (L.eta - L.leftAt)));
  const minsLeft = L => Math.max(1, Math.ceil((L.eta - now()) / MIN));
  const kmLeft = (a, L) => Math.max(0.1, (ext(a).km || 4.3) * (1 - prog(L))).toFixed(1);
  const teamNames = a => andJoin(team(a).map(p => firstOf(p.name)));
  function teamFor(a) {
    const e = ext(a);
    if (e.assign && e.assign.length) return e.assign.slice();
    return { stetho: ['layla'], physio: ['mark'], lab: ['daniel'], drip: ['grace'], syringe: ['grace'], video: ['layla'] }[leadIcon(a)] || ['omar'];
  }

  /* "Thu 1 Oct" + "10:00 – 11:00 AM" -> timestamp on the demo calendar */
  function startOf(a) {
    const base = new Date(NOW0); base.setHours(0, 0, 0, 0);
    let d;
    if (/^today/i.test(a.date || '')) d = new Date(base);
    else if (/^tomorrow/i.test(a.date || '')) d = new Date(base.getTime() + 864e5);
    else { const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(a.date || ''); if (!m || MO.indexOf(m[2]) < 0) return null; d = new Date(2026, MO.indexOf(m[2]), +m[1]); }
    const t = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(a.time || '');
    if (!t) return null;
    const ap = (t[3] || (/(AM|PM)/i.exec(a.time) || [])[1] || 'AM').toUpperCase();
    d.setHours(+t[1] % 12 + (ap === 'PM' ? 12 : 0), +t[2], 0, 0);
    return d.getTime();
  }
  const leaveAt = a => { const t = startOf(a); return t ? (isTele(a) ? t : t - 30 * MIN) : null; };
  const durMin = a => {
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(a.time || '');
    if (!m) return 60;
    const ap1 = (m[3] || m[6]).toUpperCase(), ap2 = m[6].toUpperCase();
    const s = (+m[1] % 12 + (ap1 === 'PM' ? 12 : 0)) * 60 + +m[2], e = (+m[4] % 12 + (ap2 === 'PM' ? 12 : 0)) * 60 + +m[5];
    return e > s ? e - s : 60;
  };
  const range = (slot, mins) => {
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(slot), s = (+m[1] % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + +m[2], e = s + mins;
    const f = x => `${Math.floor(x / 60) % 12 || 12}:${String(x % 60).padStart(2, '0')}`, ap = x => (Math.floor(x / 60) % 24) < 12 ? 'AM' : 'PM';
    return ap(s) === ap(e) ? `${f(s)} – ${f(e)} ${ap(e)}` : `${f(s)} ${ap(s)} – ${f(e)} ${ap(e)}`;
  };

  /* ---------- live status: unassigned → assigned → onway → arrived → treating → completed ---------- */
  const STAGES = ['unassigned', 'assigned', 'onway', 'arrived', 'treating', 'completed'];
  const MY = ['appts', 'appt-details', 'track', 'visit', 'edit-appt', 'appt-map', 'chat-home', 'chat', 'home'];
  const refresh = () => { if (S.open && MY.includes(S.screen)) F.upd(); };
  function setStage(id, st, o = {}) {
    const a = find(id);
    if (!a || grp(a) !== 'upcoming' || !STAGES.includes(st)) return false;
    if (st === 'completed') { complete(a); if (!o.quiet) refresh(); return true; }
    const L = lv(a), e = ext(a), t = now();
    L.st = st;
    if (st !== 'unassigned' && !(e.team || []).length) e.team = teamFor(a);
    if (st === 'onway') { L.leftAt = t - 4 * MIN; L.eta = L.leftAt + TRAVEL; }
    if (st === 'arrived') L.arrivedAt = o.auto && L.eta ? L.eta : t;
    if (st === 'treating') { if (!L.arrivedAt) L.arrivedAt = t - 4 * MIN; L.startedAt = t; L.finishAt = t + 38 * MIN; L.done = Math.min(1, e.blocks.length - 1); }
    a.status = ['onway', 'arrived', 'treating'].includes(st) ? 'ongoing' : 'confirmed';
    a.statusLabel = { unassigned: 'Confirmed', assigned: 'Team assigned', onway: 'On the way', arrived: 'Arrived', treating: 'In progress' }[st];
    a.tracking = st === 'onway';
    if (D.tracking && D.tracking.id === a.id) {
      D.tracking.step = { unassigned: 0, assigned: 1, onway: 2, arrived: 3, treating: 3 }[st];
      if (L.eta) D.tracking.eta = hm(L.eta);
    }
    if (o.auto && S.open && !(S.screen === 'appt-details' && S.apptId === a.id)) F.toast(`${teamNames(a) || 'Your team'} ${team(a).length > 1 ? 'have' : 'has'} arrived`, 'check');
    if (!o.quiet) refresh();
    return true;
  }
  function complete(a) {
    const i = D.appointments.upcoming.indexOf(a);
    if (i < 0) return;
    const e = ext(a);
    if (!(e.team || []).length) e.team = teamFor(a);
    D.appointments.upcoming.splice(i, 1);
    Object.assign(a, { status: 'completed', statusLabel: 'Completed', tracking: false, badge: '' });
    if (!(e.reports || []).length) { e.reports = []; e.reportsPending = true; }
    if (!e.rx && team(a).some(p => p.rk === 'doc')) e.rxPending = true;
    e.notes = e.notes || `${firstOf((team(a)[0] || PEOPLE.layla).name)} will add the visit notes here shortly.`;
    e.invoice = e.invoice || { no: 'INV-2026-00' + (430 + Math.floor(Math.random() * 60)) };
    delete LV[a.id];
    if (D.tracking && D.tracking.id === a.id) D.tracking.step = 3;
    D.appointments.completed.unshift(a);
  }
  /* the team pulls up by itself when the live ETA runs out */
  setInterval(() => {
    Object.keys(LV).forEach(id => {
      const L = LV[id];
      if (L.st !== 'onway' || !L.eta || now() < L.eta) return;
      const a = find(id);
      if (a && grp(a) === 'upcoming') setStage(id, 'arrived', { auto: true }); else delete LV[id];
    });
  }, 1000);

  function ensure() {
    S.tAcc = S.tAcc || {}; S.tDrafts = S.tDrafts || {};
    if (!S.tRate) S.tRate = { who: 0, svc: 0 };
    if (!S.tRateC) S.tRateC = { who: '', svc: '' };
  }
  ensure();
  let lastOpen = null;
  function resetDraft() { S.tRate = { who: 0, svc: 0 }; S.tRateC = { who: '', svc: '' }; S.tAbout = false; }

  /* ---------- text fields on the iOS keyboard (BRIEF rule 7) ---------- */
  F.KEYS = F.KEYS || {}; F.KB_RET = F.KB_RET || {};
  const blur = () => { F.hideKb(); S.focus = null; F.upd(); };
  const curThread = () => S.tThread || 'support';
  const draftOf = tid => (S.tDrafts || {})[tid] || '';
  const FIELDS = {
    'chat-msg': { get: () => draftOf(curThread()), set: v => { S.tDrafts[curThread()] = v; }, max: 500,
      ph: () => curThread() === 'support' ? 'Message FRH Support' : 'Message your care team', enter: () => F.ACT['t-send']() },
    'cancel-other': { get: () => S.tOther || '', set: v => { S.tOther = v; }, max: 160, ph: () => 'Tell us a little more (optional)', enter: blur },
    'rate-who': { get: () => S.tRateC.who, set: v => { S.tRateC.who = v; }, max: 240, ph: () => 'Add a comment (optional)', enter: blur },
    'rate-svc': { get: () => S.tRateC.svc, set: v => { S.tRateC.svc = v; }, max: 240, ph: () => 'Add a comment (optional)', enter: blur },
    'v30-note': { get: () => (S.v30 || {}).note || '', set: v => { (S.v30 = S.v30 || {}).note = v; }, max: 240, ph: () => 'Tell us more (optional)', enter: () => v30Blur() },
  };
  Object.keys(FIELDS).forEach(k => {
    F.KB_RET[k] = k === 'chat-msg' ? 'send' : 'done';
    F.KEYS[k] = key => {
      ensure();
      const f = FIELDS[k];
      let v = f.get() || '';
      if (key === 'enter') { f.enter(); return; }
      if (key === 'del') v = v.slice(0, -1);
      else if (key.length === 1) v = (v + key).slice(0, f.max);
      else return;
      f.set(v);
      const want = !v.length || /[.!?]\s$/.test(v);
      if (want !== S.shift && !S.sym) { S.shift = want; F.renderKb(); }
      F.upd();
      if (S.sheet) fillFields(document.getElementById('sheetLayer'));   /* v30: fields inside a sheet */
    };
  });
  function fieldHTML(k) {
    const f = FIELDS[k], v = f.get() || '', on = S.focus === k && S.kb === 'qwerty';
    return v ? `${esc(v)}${on ? '<span class="caret"></span>' : ''}` : `${on ? '<span class="caret"></span>' : ''}<span class="t-ph">${f.ph()}</span>`;
  }
  function fillFields(n) {
    n.querySelectorAll('[data-fld]').forEach(el => {
      const k = el.dataset.fld;
      setHTML(el, fieldHTML(k));
      const box = el.closest('.t-field');
      if (box) { box.classList.toggle('focus', S.focus === k && S.kb === 'qwerty'); if (k === 'chat-msg') box.scrollTop = box.scrollHeight; }
    });
  }

  /* ---------- live bits patched every second (countdown, ETA, distance, map pin) ---------- */
  function cdHTML(ms) {
    if (ms <= 0) return '<span class="t-cd-now">Leaving any minute now</span>';
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const t = (v, l) => `<span><b>${String(v).padStart(2, '0')}</b><i>${l}</i></span>`;
    return d ? t(d, d === 1 ? 'day' : 'days') + t(h, 'hrs') + t(m, 'min') : t(h, 'hrs') + t(m, 'min') + t(sec, 'sec');
  }
  function placeTeam(svg) {
    const L = LV[svg.dataset.id], path = svg.querySelector('.t-route'), pin = svg.querySelector('.t-tpin');
    if (!path || !pin || !path.getTotalLength) return;
    const len = path.getTotalLength(), p = L && L.st === 'onway' && L.eta ? prog(L) : 1, rest = len * (1 - p);
    const pt = path.getPointAtLength(rest), tf = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
    if (pin._tf !== tf) {
      if (!pin._tf) { pin.style.transition = 'none'; pin.style.transform = tf; void pin.getBoundingClientRect(); pin.style.transition = ''; }
      else pin.style.transform = tf;
      pin._tf = tf;
    }
    svg.querySelectorAll('.t-route,.t-route-bg').forEach(r => { r.style.strokeDasharray = `${rest.toFixed(1)} ${(len + 2).toFixed(1)}`; });
  }
  function fillLive(n) {
    if (!n) return;
    n.querySelectorAll('[data-cd]').forEach(el => setTxt(el, cdHTML(+el.dataset.cd - now())));
    n.querySelectorAll('[data-eta-min]').forEach(el => { const L = LV[el.dataset.etaMin]; if (L && L.eta) setTxt(el, `${minsLeft(L)} min`); });
    n.querySelectorAll('[data-km]').forEach(el => { const a = find(el.dataset.km), L = LV[el.dataset.km]; if (a && L && L.eta) setTxt(el, `${kmLeft(a, L)} km`); });
    n.querySelectorAll('[data-left]').forEach(el => setTxt(el, `${Math.max(1, Math.ceil((+el.dataset.left - now()) / MIN))} min`));
    n.querySelectorAll('.t-msvg').forEach(placeTeam);
  }

  /* ---------- the drawn maps (T12: only shown once the team is moving) ---------- */
  const MAPS = {
    card: { w: 393, h: 290, home: [100, 200], start: [362, 112],
      route: 'M100 200 V 214 Q 100 222 108 222 H 248 Q 256 222 256 214 V 120 Q 256 112 264 112 H 362',
      base: '<rect width="393" height="290" fill="#EDE8DF"/><g fill="#E4DFD3"><rect x="8" y="14" width="120" height="84" rx="6"/><rect x="150" y="6" width="96" height="70" rx="6"/><rect x="268" y="22" width="110" height="76" rx="6"/><rect x="16" y="130" width="104" height="70" rx="6"/><rect x="264" y="132" width="112" height="86" rx="6"/><rect x="30" y="232" width="98" height="58" rx="6"/><rect x="196" y="238" width="150" height="56" rx="6"/></g><rect x="150" y="124" width="94" height="84" rx="8" fill="#DCE8CE"/><g stroke="#fff" stroke-linecap="round"><path d="M-10 112h420" stroke-width="16"/><path d="M-10 222h420" stroke-width="12"/><path d="M138 -10v310" stroke-width="14"/><path d="M256 -10v310" stroke-width="10"/></g><g stroke="#F2EBDF" stroke-width="2" stroke-dasharray="6 8"><path d="M-10 112h420"/><path d="M138 -10v310"/></g>' },
    full: { w: 393, h: 760, home: [130, 548], start: [321, 236],
      route: 'M130 548 V 488 Q 130 470 148 470 H 178 Q 196 470 196 452 V 319 Q 196 301 214 301 H 303 Q 321 301 321 283 V 236',
      base: (() => {
        const cols = [[8, 52], [70, 186], [206, 312], [330, 385]], rows = [[8, 110], [130, 290], [312, 460], [480, 630], [652, 752]];
        const blocks = rows.map(([y1, y2], r) => cols.map(([x1, x2], c) => (r === 2 && c === 2) ? '' : `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="7"/>`).join('')).join('');
        return `<rect width="393" height="760" fill="#EDE8DF"/><g fill="#E4DFD3">${blocks}</g><rect x="206" y="312" width="106" height="148" rx="8" fill="#DCE8CE"/><g stroke="#fff" stroke-linecap="round"><path d="M-10 120h420" stroke-width="12"/><path d="M-10 301h420" stroke-width="16"/><path d="M-10 470h420" stroke-width="14"/><path d="M-10 641h420" stroke-width="12"/><path d="M61 -10v780" stroke-width="10"/><path d="M196 -10v780" stroke-width="14"/><path d="M321 -10v780" stroke-width="10"/></g><g stroke="#F2EBDF" stroke-width="2" stroke-dasharray="6 8"><path d="M-10 301h420"/><path d="M196 -10v780"/></g>`;
      })() },
  };
  function mapSVG(a, full) {
    const M = MAPS[full ? 'full' : 'card'], id = `tclip-${full ? 'f' : 'c'}-${a.id}`, lead = team(a)[0] || PEOPLE.layla;
    const [hx, hy] = M.home, [sx, sy] = M.start;
    return `<svg class="t-msvg" data-id="${a.id}" viewBox="0 0 ${M.w} ${M.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${M.base}
      <path class="t-route-bg" d="${M.route}" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="t-route" d="${M.route}" fill="none" stroke="#D71F32" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(${hx} ${hy})"><circle r="24" fill="#1C1214" opacity=".1"/><circle r="16" fill="#1C1214"/>${icon('home', 16, 2.4).replace('<svg ', '<svg x="-8" y="-8" color="#fff" ')}</g>
      <g class="t-tpin" style="transform:translate(${sx}px,${sy}px)"><circle class="t-ping" r="22"/><circle r="22" fill="#fff"/>
        <clipPath id="${id}"><circle r="18"/></clipPath><image href="${img(lead.img)}" x="-18" y="-18" width="36" height="36" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/></g>
    </svg>`;
  }

  /* ================= Appointments list (T1, T2, T3, T5, T7) ================= */
  const rated = a => ext(a).rated || null;
  /* membership: visits that count against the patient's plan say "Included in your <Tier> plan", never "Paid" */
  function planOf(a) {
    if (!a) return '';
    const tierName = () => ((F.memberTier && F.memberTier()) || {}).name || 'membership';
    const v = F.memberVisit ? F.memberVisit(a.id) : null;
    if (v) return v.tier || tierName();
    if (a.member || (a.refund && a.refund.plan)) return a.memberTier || (a.refund && a.refund.plan) || tierName();
    return '';
  }
  /* how the booking was paid: the booking flow stores paidWith ('Visa •••• 4242', 'Apple Pay', 'Cash on visit') */
  function payOf(a) {
    const w = (a && a.paidWith) || 'Visa •••• 4242';
    return /cash/i.test(w) ? { cash: true, label: 'Pay on visit' } : { cash: false, label: w };
  }
  function refundOf(a) {
    const e = ext(a), r = a.refund || { amount: e.sum.total - (e.fee || 0), status: 'Processing' };
    return { amount: r.amount, status: r.status || 'Processing', date: r.date || '', plan: r.plan || '', none: !!r.none };
  }
  function pStat(a, i, n) {   // T3: per-patient status only once the visit has started
    if (stage(a) !== 'treating') return '';
    const done = lv(a).done || 0;
    const k = n === 1 ? 'now' : i < done ? 'done' : i === done ? 'now' : 'next';
    return k === 'done' ? `<span class="pill green">${icon('check', 11, 3)} Done</span>`
      : k === 'now' ? '<span class="pill red live"><i></i>In treatment</span>' : '<span class="pill ink">Next</span>';
  }
  function chatBtn(a) {   // T5: unread / online / disabled
    const g = grp(a), T = TH[a.id], n = T ? T.unread : 0;
    if (g === 'cancelled' && !(T && T.msgs.length)) return '';
    if (g === 'upcoming' && !team(a).length) {
      return `<button class="t-cbtn off" type="button" data-act="t-chat-off" aria-label="Chat opens once your team is assigned">${icon('chat', 18, 1.9)}</button>`;
    }
    return `<button class="t-cbtn ${n ? 'has' : ''}" type="button" data-act="t-chat" data-id="${a.id}" aria-label="Chat with the team${n ? `, ${n} unread` : ''}">${icon('chat', 18, 1.9)}`
      + `${n ? `<i class="t-badge ${g === 'upcoming' ? 'red' : 'grey'}">${n}</i>` : ''}${moving(a) ? '<i class="t-online"></i>' : ''}</button>`;
  }
  function cardStrip(a) {
    const st = stage(a), L = grp(a) === 'upcoming' ? lv(a) : null;
    if (st === 'onway') return `<div class="t-live red"><i></i><span>Team on the way · arriving ${hm(L.eta)}</span></div>`;   // T7 (kept)
    if (st === 'arrived') return '<div class="t-live green"><i></i><span>Your team has arrived</span></div>';
    if (st === 'treating') return `<div class="t-live green"><i></i><span>Treatment in progress · done by about ${hm(L.finishAt)}</span></div>`;
    if (st === 'unassigned') return '<div class="t-live mute"><i></i><span>Assigning your team</span></div>';
    if (st === 'assigned') {
      const tm = team(a);
      return `<div class="t-cmeta"><span class="t-avst">${tm.slice(0, 3).map(p => `<img src="${img(p.img)}" alt="">`).join('')}</span><span>${esc(tm.length === 1 ? `${tm[0].name} · ${tm[0].role}` : andJoin(tm.map(p => p.name)))}</span></div>`;
    }
    if (st === 'completed') {
      const r = rated(a);
      return r ? `<div class="t-cmeta">${stars(r.who || r.svc, 12)}<span>You rated this visit</span></div>`
        : `<div class="t-cmeta red">${icon('starFill', 13)}<span>Rate your visit</span></div>`;
    }
    const r = refundOf(a);
    if (r.plan) return `<div class="t-cmeta ok">${icon('shieldCheck', 14, 2)}<span>Session returned to your ${esc(r.plan)} plan</span></div>`;
    if (r.none) return `<div class="t-cmeta">${icon('check', 14, 2.4)}<span>Nothing was charged</span></div>`;
    return `<div class="t-cmeta ${r.status === 'Refunded' ? 'ok' : ''}">${icon('card', 14, 2)}<span>Refund ${aed(r.amount)} · ${r.status === 'Refunded' ? `back on your card ${esc(r.date)}` : 'processing'}</span></div>`;
  }
  F.apptCard = a => {
    const e = ext(a), g = grp(a), badge = a.badge === 'NEW' ? 'New' : a.badge;
    return `<div class="appt t-card ${g}" data-act="appt-open" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(apptName(a))}, ${esc(a.date)}">
        <div class="t-ctop">
          <div class="t-when"><b>${esc(a.date)}</b><span>${esc(a.time)}</span></div>
          ${badge && g === 'upcoming' ? `<span class="pill ${a.badge === 'NEW' ? 'red' : 'amber'}">${esc(badge)}</span>` : ''}
          ${g === 'completed' ? '<span class="pill green">Completed</span>' : g === 'cancelled' ? '<span class="pill ink">Cancelled</span>' : ''}
        </div>
        <div class="t-pbs">${e.blocks.map((b, i) => `<div class="t-pb">${av(b.p)}
            <span class="t-pb-m"><b>${esc(b.p)}${b.rel ? ` <em>${esc(b.rel)}</em>` : ''}</b><small>${esc([b.svc, b.subs.join(', ')].filter(Boolean).join(' · '))}</small></span>
            ${pStat(a, i, e.blocks.length)}</div>`).join('')}</div>
        ${cardStrip(a)}
        <div class="t-cfoot">${icon(isTele(a) ? 'video' : 'pin', 14, 2.2)}<span>${esc(a.address)}</span>${chatBtn(a)}</div>
      </div>`;
  };

  F.APPT = { ext, grp, stage, lv, team, isTele, apptName, rated, refundOf, chatBtn, cardStrip, av, hm, now, moving };   /* v39: booking card options */
  const sortUp = l => l.slice().sort((x, y) => (startOf(x) || now()) - (startOf(y) || now()));
  function listHTML(tab) {
    const list = tab === 'upcoming' ? sortUp(D.appointments.upcoming) : (D.appointments[tab] || []);
    if (list.length) return `<div class="t-list">${list.map(a => F.apptCard(a)).join('')}</div>`;
    const E = {
      upcoming: ['calendar', 'No upcoming visits', 'Book a doctor, nurse or test at home and it shows up here, with live tracking on the day.', true],
      completed: ['check', 'No completed visits yet', 'After a visit you’ll find its reports, prescription and invoice here.'],
      cancelled: ['x', 'Nothing cancelled', 'Cancelled visits and their refunds are listed here.'],
    }[tab];
    return `<div class="empty-state t-empty"><div class="es-ic">${icon(E[0], 30, 1.8)}</div><b>${E[1]}</b><span>${E[2]}</span>
      ${E[3] ? '<button class="btn btn-primary t-empty-btn" type="button" data-act="t-book">Book a visit</button>' : ''}</div>`;
  }
  F.SCREENS.appts = {
    status: 'dark', cls: 'appts t-appts',
    render() {
      return `<div class="nav"><span class="t-navsp"></span><span class="nav-title">Bookings</span>
          <button class="icon-btn" type="button" data-act="t-book" aria-label="Book a visit">${icon('plus', 19, 2.2)}</button></div>
        <div class="t-segwrap" data-s="seg"></div>
        <div class="scr-body t-body" data-s="list"></div>
        ${F.tabbar('appts')}`;
    },
    update(n) {
      const tab = S.apptTab || 'upcoming';
      setHTML(n.querySelector('[data-s="seg"]'), `<div class="seg-tabs">${['upcoming', 'completed', 'cancelled'].map(t => {
        const c = (D.appointments[t] || []).length;
        return `<button type="button" data-act="t-tab" data-t="${t}" class="${t === tab ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}${c ? ` <span>${c}</span>` : ''}</button>`;
      }).join('')}</div>`);
      setHTML(n.querySelector('[data-s="list"]'), listHTML(tab));
    },
  };

  /* ================= Appointment details: one page that follows the status (T8) ================= */
  const secH = (t, right = '') => `<div class="sec-h t-sech"><h4>${t}</h4>${right}</div>`;
  const DOT = { assigned: ['Assigned', 'grey'], onway: ['On the way', 'amber'], arrived: ['Arrived', 'green'], treating: ['With you', 'green'] };
  const memCard = (p, st) => `<button class="t-mem" type="button" data-act="t-doc" data-k="${p.key}">
      <img src="${img(p.img)}" alt="">
      <span class="t-mem-m"><span class="t-mem-t"><b>${p.name}</b>${DOT[st] ? `<span class="t-dot ${DOT[st][1]}"><i></i>${DOT[st][0]}</span>` : ''}</span>
        <span class="t-mem-l"><span class="t-role ${p.rk}">${RB[p.rk]}</span><small>${p.spec}</small></span>
        <small class="t-lic">${icon('shieldCheck', 12, 2.2)} DHA licence ${p.lic}</small></span>
      ${icon('chevRight', 16, 2.2)}</button>`;

  function heroUp(a) {
    const st = stage(a), L = lv(a);
    if (st === 'onway') {   // T12 map, T10 live ETA only, T16 driver
      const d = ext(a).driver;
      return `<div class="t-hero t-hero-map">
          <div class="t-mapc" data-act="t-map-full" role="button" aria-label="Open the live map full screen">${mapSVG(a, false)}
            <span class="t-eta-chip"><i></i><b>Live</b><span>· <span data-km="${a.id}"></span> away</span></span>
            <span class="t-map-x">${ic('expand', 15, 2.2)}</span></div>
          <div class="t-ontw"><div class="t-ontw-l"><small>On the way</small><b>Arriving in <span data-eta-min="${a.id}"></span></b>
              <span>Left at ${hm(L.leftAt)} · ${esc(teamNames(a))}</span></div>
            <span class="t-ontw-eta"><b>${hm(L.eta).replace(/ (AM|PM)$/, '')}</b><small>${/PM$/.test(hm(L.eta)) ? 'PM' : 'AM'} ETA</small></span></div>
          ${d && !isTele(a) ? `<div class="t-drv"><span class="t-drv-ic">${ic('car', 20, 1.9)}</span>
            <div class="t-drv-m"><b>${esc(d.name)} · Driver</b><small>${esc(d.car)}</small></div>
            <span class="t-plate"><small>DUBAI</small>${esc(d.plate)}</span></div>` : ''}
        </div>`;
    }
    if (st === 'arrived') {   // T13
      return `<div class="t-arr"><span class="t-arr-ic">${icon('check', 22, 3)}</span>
          <div><b>Your team has arrived</b><span>${esc(teamNames(a))} reached your door at ${hm(L.arrivedAt || now())}.</span></div></div>`;
    }
    if (st === 'treating') {   // T17 + T3
      const bl = ext(a).blocks;
      return `<div class="t-hero">
          <div class="t-hero-top"><span class="t-stp live"><i></i>Treatment in progress</span></div>
          <h2 class="t-hero-h">Estimated finish ${hm(L.finishAt)}<span>Started ${hm(L.startedAt)} · about <b data-left="${L.finishAt}"></b> left</span></h2>
          <div class="t-plist">${bl.map((b, i) => `<div class="t-pl">${av(b.p)}<span class="t-pl-m"><b>${esc(b.p)}</b><small>${esc(b.subs.join(', ') || b.svc)}</small></span>${pStat(a, i, bl.length)}</div>`).join('')}</div>
        </div>`;
    }
    const t = leaveAt(a), un = st === 'unassigned', tele = isTele(a);
    return `<div class="t-hero">
        <div class="t-hero-top"><span class="t-stp ${un ? 'wait' : 'ok'}">${un ? '<i class="t-spin"></i>Assigning your team' : `${icon('check', 12, 3.2)}Team confirmed`}</span></div>
        <h2 class="t-hero-h">${esc(a.date)}<span>${esc(a.time)}</span></h2>
        ${t ? `<div class="t-cdw"><small>${tele ? 'Your video call starts in' : 'Your team leaves in'}</small><div class="t-cd" data-cd="${t}"></div></div>` : ''}
        <p class="t-hero-p">${un ? 'We match a DHA-licensed team to every visit and tell you the moment they’re confirmed.'
          : tele ? 'Your doctor calls you on video in the app.' : 'You’ll follow them on a live map as soon as they set off.'}</p>
      </div>`;
  }
  function teamSec(a, title) {
    const tm = team(a), st = stage(a);
    if (!tm.length) {
      if (grp(a) !== 'upcoming') return '';
      return `${secH('Your care team')}<div class="t-assign">
          <div class="t-skel"><span class="t-sk-av"></span><span class="t-sk-l"><i></i><i></i></span></div>
          <p>${icon('users', 15, 2)}<span>Your doctor or nurse appears here once they’re assigned.</span></p></div>`;   // T14
    }
    return `${secH(title || 'Your care team', `<span class="pill green">${icon('shieldCheck', 11, 2.6)} DHA licensed</span>`)}
      <div class="t-team">${tm.map(p => memCard(p, grp(a) === 'upcoming' ? st : '')).join('')}</div>`;
  }
  function addrParts(a) {
    const parts = (a.address || '').split(' · '), label = parts.length > 1 ? parts[0] : '', line = parts.length > 1 ? parts.slice(1).join(' · ') : parts[0];
    const all = [...(PD.addresses || []), ...(B.addresses || [])], hit = all.find(x => x.label === label);
    return { label, line, note: hit ? hit.note : '' };
  }
  function infoSec(a, editable) {   // T18, T19, T20
    const e = ext(a), ed = editable && canEdit(a), locked = editable && moving(a), ad = addrParts(a);
    return `${secH('Booking info')}
      <div class="info-card t-binfo">
        <div class="info-row"><span class="tile">${icon('file', 17, 2)}</span><div class="ir-mid"><b>${a.id}</b><small>Booking ID</small></div>
          <button class="t-copy" type="button" data-act="t-copy" data-v="${a.id}" aria-label="Copy booking ID">${icon('copy', 15, 2)}</button></div>
        ${e.blocks.map(b => `<div class="info-row t-prow">${av(b.p)}<div class="ir-mid"><b>${esc(b.p)}${b.rel ? ` <span class="t-rel">${esc(b.rel)}</span>` : ''}</b>
            <small>${esc([b.svc, b.subs.join(', ')].filter(Boolean).join(' · '))}</small>${b.issue ? `<small class="t-iss">“${esc(b.issue)}”</small>` : ''}</div></div>`).join('')}
        <div class="info-row"><span class="tile">${icon('calendar', 17, 2)}</span><div class="ir-mid"><b>${esc(a.date)}</b><small>${esc(a.time)}</small></div>
          ${ed ? '<button class="t-chg" type="button" data-act="t-edit-time">Change</button>' : ''}</div>
        <div class="info-row"><span class="tile">${icon(isTele(a) ? 'video' : 'pin', 17, 2)}</span><div class="ir-mid"><b>${esc(ad.line)}</b>
          <small>${esc([ad.label, ad.note].filter(Boolean).join(' · ') || (isTele(a) ? 'In the FRH app' : 'Visit address'))}</small></div>
          ${ed && !isTele(a) ? '<button class="t-chg" type="button" data-act="t-edit-loc">Change</button>' : ''}</div>
      </div>
      ${locked ? `<p class="t-lock">${icon('lock', 13, 2.2)}<span>The time and address are locked now that your team has left. Need a change? Call FRH.</span></p>` : ''}`;
  }
  function sumSec(a) {   // T21
    const s = ext(a).sum, who = [], refunded = grp(a) === 'cancelled', open = !!S.tAcc[`${a.id}:sum`], plan = planOf(a);
    s.lines.forEach(([w, item, p]) => { let g = who.find(x => x[0] === w); if (!g) who.push(g = [w, []]); g[1].push([item, p]); });
    const people = who.map(([w, items]) => `<div class="t-sum-who">${av(w)}<b>${esc(w)}</b></div>${items.map(([item, p]) => `<div class="sum-line"><span>${esc(item)}</span><span>${plan ? 'Included' : aed(p)}</span></div>`).join('')}`).join('');
    if (plan) {
      return `<div class="acc t-acc ${open ? 'open' : ''}">
        <button class="acc-head" type="button" data-act="t-acc" data-k="sum" aria-expanded="${open}"><b>Booking summary</b><span class="pill t-gold">${esc(plan)} plan</span><span class="price">${aed(0)}</span>${icon('chevDown', 18, 2.2)}</button>
        <div class="acc-body">${people}
          <div class="sum-line total"><span>You pay</span><span>${aed(0)}</span></div>
          <div class="t-paid plan">${icon('shieldCheck', 15, 2.2)}<span>${refunded ? 'Session returned to' : 'Included in'} your ${esc(plan)} plan</span></div>
        </div></div>`;
    }
    const pay = payOf(a), due = pay.cash && grp(a) === 'upcoming', none = refunded && refundOf(a).none;
    const tag = due ? ['amber', 'Pay on visit'] : none ? ['ink', 'Not charged'] : refunded ? ['ink', 'Refunded'] : ['green', 'Paid'];
    return `<div class="acc t-acc ${open ? 'open' : ''}">
        <button class="acc-head" type="button" data-act="t-acc" data-k="sum" aria-expanded="${open}"><b>Booking summary</b><span class="pill ${tag[0]}">${tag[1]}</span><span class="price">${aed(s.total)}</span>${icon('chevDown', 18, 2.2)}</button>
        <div class="acc-body">${people}
          ${s.disc ? `<div class="sum-line off"><span>${esc(s.disc[0])}</span><span>− ${aed(s.disc[1])}</span></div>` : ''}
          <div class="sum-line"><span>VAT (5%)</span><span>${aed(s.vat)}</span></div>
          <div class="sum-line total"><span>${due ? 'To pay on the day' : 'Total'}</span><span>${aed(s.total)}</span></div>
          <div class="t-paid">${icon('card', 15, 2.2)}${due ? '<span>Pay on visit</span><b>Cash or card at your door</b>'
            : none ? '<span>Nothing was charged</span>' : pay.cash ? '<span>Paid on the day</span><b>At your door</b>'
              : `<span>${refunded ? 'Refunded to' : 'Paid with'}</span><b>${esc(pay.label)}</b>`}</div>
        </div></div>`;
  }
  /* Final v45: a session of a package shows the whole package: the appointments booked, and a Schedule button
     on each one still to book. The record (S.v45pkgs) is written by the booking flow when the package is paid. */
  const pkgRec = a => (a && a.pkg && S.v45pkgs && S.v45pkgs[a.pkg]) || null;
  function pkgSec(a) {
    const P = pkgRec(a); if (!P) return '';
    const on = P.sessions.filter(Boolean).length, ad = addrParts({ address: P.address });
    const row = (id, k) => {
      const x = id && find(id);
      if (x) {
        const me = x.id === a.id;
        return `<button class="t-pkr on ${me ? 'me' : ''}" type="button" ${me ? 'aria-current="true"' : `data-act="v45-pk-go" data-id="${x.id}"`}><span class="t-pkn">${k + 1}</span>
          <span class="t-pkm"><small>Appointment ${k + 1}${grp(x) === 'completed' ? ' · done' : ''}</small><b>${esc(x.date)} · ${esc(x.time)}</b></span>${me ? '<span class="pill ink">This visit</span>' : icon('chevRight', 15, 2.2)}</button>`;
      }
      return `<div class="t-pkr later"><span class="t-pkn">${k + 1}</span><span class="t-pkm"><small>Appointment ${k + 1}</small><b>Not booked yet</b></span>
        <button class="mini-btn ${k === P.sessions.indexOf(null) ? '' : 'soft'}" type="button" data-act="v45-sched" data-n="${k}">Schedule</button></div>`;
    };
    return `${secH('Your package', `<span class="pill ${on < P.n ? 'amber' : 'green'}">${on} of ${P.n} booked</span>`)}
      <div class="t-pkg">
        <div class="t-pkh"><span class="tile">${icon('physio', 19, 2)}</span><div class="t-pkt"><b>${esc(P.name)} · ${esc(P.label)}</b><small>${esc(clean(P.patient))} · ${esc(ad.label || ad.line)} · ${esc(P.each)} each</small></div></div>
        <div class="t-pkbar" aria-hidden="true">${P.sessions.map(id => `<i class="${id ? 'on' : ''}"></i>`).join('')}</div>
        <div class="t-pkl">${P.sessions.map(row).join('')}</div>
        <p class="t-pkf">${icon('card', 13, 2.2)}<span>Paid in full · ${aed(P.total)} for ${P.n} appointments. Each one is for ${esc(firstOf(P.patient))} at ${esc(ad.label || 'the same address')}.</span></p>
      </div>`;
  }
  /* v45: a Visit + Packages order — each booking points to the others paid with it (a package shows once) */
  function orderSec(a) {
    if (!a || !a.order) return '';
    const seen = new Set(), rows = [];
    ALL().filter(x => x.order === a.order && x.id !== a.id && !(a.pkg && x.pkg === a.pkg)).forEach(x => {
      if (x.pkg) {
        const P = S.v45pkgs && S.v45pkgs[x.pkg]; if (!P || seen.has(x.pkg)) return; seen.add(x.pkg);
        const on = pkBooked(P), to = on[0] || x;
        rows.push(`<button class="t-ord" type="button" data-act="v45-pk-go" data-id="${to.id}"><span class="tile">${icon('physio', 17, 2)}</span>
          <span class="t-pkm"><small>Package · ${on.length} of ${P.n} booked</small><b>${esc(P.name)} · ${esc(P.label)}</b><em>${esc(firstOf(P.patient))} · next ${esc(to.date)}, ${esc(curSlot(to))}</em></span>${icon('chevRight', 15, 2.2)}</button>`);
        return;
      }
      rows.push(`<button class="t-ord" type="button" data-act="v45-pk-go" data-id="${x.id}"><span class="tile">${icon(svcIcon(x.service), 17, 2)}</span>
        <span class="t-pkm"><small>Visit · ${esc(x.date)} · ${esc(curSlot(x) || x.time)}</small><b>${esc(x.service)}${/^\+/.test(x.sub || '') ? ` ${esc(x.sub)}` : ''}</b><em>${esc((x.patients || []).map(firstOf).join(', '))}</em></span>${icon('chevRight', 15, 2.2)}</button>`);
    });
    return rows.length ? `${secH('Also in this order', '<span class="pill ink">Visit + Packages</span>')}<div class="t-pkg t-order">${rows.join('')}</div>` : '';
  }
  const helpSec = () => `<button class="t-helpln" type="button" data-act="t-help">${icon('headset', 17, 2)}<span>Something not right? <b>Message FRH Support</b></span>${icon('chevRight', 15, 2.2)}</button>`;

  /* completed (T24–T31) */
  function doneHero(a) {
    const pts = patientsOf(a), ad = addrParts(a);
    return `<div class="t-done">
        <div class="t-done-top"><span class="t-done-ic">${icon('check', 14, 3.2)}</span><b>Visit completed</b><span>${esc(a.time)}</span></div>
        <div class="t-pt"><span class="t-avs">${pts.map(p => av(p, 'lg')).join('')}</span>
          <div class="t-pt-m"><b>${esc(pts.join(', '))}</b><small>${esc(ad.line)}</small></div></div>
        <div class="t-idstrip"><div><small>Booking ID</small><b>${a.id}</b></div><div><small>Date</small><b>${esc(a.date)}</b></div></div>
      </div>`;
  }
  function svcSec(a) {
    const bl = ext(a).blocks, many = new Set(bl.map(b => b.p)).size > 1;
    return `${secH(bl.length > 1 ? 'Services' : 'Service')}${bl.map(b => `<div class="t-svc">
        <div class="t-svc-h"><span class="tile">${icon(b.icon, 17, 2)}</span><div class="t-svc-m"><b>${esc(b.svc)}</b><small>${esc(b.subs.join(', '))}${many ? ` · ${esc(b.p)}` : ''}</small></div>
          <span class="t-svc-t">${esc(b.time || a.time)}</span></div>
        ${b.issue ? `<div class="t-issue"><small>Health issue</small><p>${esc(b.issue)}</p></div>` : ''}</div>`).join('')}`;
  }
  function docsSec(a) {   // T27 reports, T28 prescription, T29 invoice
    const e = ext(a), reps = e.reports || [], rx = e.rx;
    const row = (ic2, tint, b, s, acts) => `<div class="t-docr"><span class="tile ${tint}">${ic(ic2, 17, 2)}</span><div class="ir-mid"><b>${b}</b><small>${s}</small></div>${acts}</div>`;
    const dl = n => `<button class="t-dl" type="button" data-act="t-dl" data-n="${esc(n)}" aria-label="Download ${esc(n)}">${icon('download', 15, 2.2)}</button>`;
    const reportRows = reps.length
      ? reps.map(r => row(r.kind === 'lab' ? 'lab' : 'file', r.kind === 'lab' ? 'blue' : '', esc(r.name), `${r.kind === 'lab' ? 'Lab result' : 'Visit report'} · ${esc(r.date)} · PDF`,
        `<button class="t-mini" type="button" data-act="t-report" data-r="${r.id}" data-n="${esc(r.name)}">View</button>${dl(r.name)}`)).join('')
      : e.reportsPending ? row('clock', 'mute', 'Reports on the way', 'Usually within 24 hours · we’ll notify you', '')
        : row('file', 'mute', 'No reports for this visit', 'Nothing was sent to the lab', '');
    const rxRow = rx ? row('pill', 'violet', 'E-prescription', `${rx.n} medicine${rx.n > 1 ? 's' : ''} · ${esc(rx.by)} · ${esc(rx.date)}`, `<button class="t-mini" type="button" data-act="t-rx" data-id="${a.id}">Open</button>`)
      : e.rxPending ? row('pill', 'mute', 'E-prescription', 'Your doctor is finishing it now', '')
        : row('pill', 'mute', 'No prescription', 'None was needed for this visit', '');
    const plan = planOf(a);
    const inv = e.invoice ? row('card', '', plan ? `Invoice · ${aed(0)}` : `Invoice · ${aed(e.sum.total)}`, plan ? `${e.invoice.no} · Included in your ${esc(plan)} plan` : `${e.invoice.no} · ${payOf(a).cash ? 'Paid on the day' : `Paid with ${esc(payOf(a).label)}`}`,
      `<button class="t-mini" type="button" data-act="t-inv" data-no="${e.invoice.no}">View</button>${dl(`Invoice ${e.invoice.no}`)}`) : '';
    const open = !!S.tAcc[`${a.id}:notes`];
    return `${secH('Reports & documents')}
      <div class="info-card t-docs"><div class="t-docg">Reports</div>${reportRows}<div class="t-docg">Prescription</div>${rxRow}${inv ? `<div class="t-docg">Invoice</div>${inv}` : ''}</div>
      <div class="acc t-acc ${open ? 'open' : ''}"><button class="acc-head" type="button" data-act="t-acc" data-k="notes" aria-expanded="${open}"><b>Clinician’s notes</b>${icon('chevDown', 18, 2.2)}</button>
        <div class="acc-body"><p class="t-notes">${esc(e.notes || 'No notes for this visit.')}</p></div></div>`;
  }
  function rateSec(a) {   // T30 + T31
    const tm = team(a), doc = tm.find(p => p.rk === 'doc'), r = rated(a);
    if (!tm.length) return '';
    const whoHead = doc
      ? `<img class="t-rimg" src="${img(doc.img)}" alt=""><div><small>Rate your doctor</small><b>${doc.name}</b></div>`
      : `<span class="t-avst lg">${tm.slice(0, 3).map(p => `<img src="${img(p.img)}" alt="">`).join('')}</span><div><small>Rate your team</small><b>${esc(andJoin(tm.map(p => p.name)))}</b></div>`;
    const svcHead = `${frhAv('sm')}<div><small>Rate the service</small><b>Booking, timing and care</b></div>`;
    if (r) {
      const ro = (head, v, c) => `<div class="t-rate"><div class="t-rate-h">${head}<span class="t-sub">${icon('check', 11, 3)} Submitted</span></div>
          <div class="t-rstars ro">${stars(v, 22)}</div>${c ? `<p class="t-cmt">“${esc(c)}”</p>` : ''}</div>`;
      return `${secH('Your ratings', r.on ? `<span class="t-muted">${esc(r.on)}</span>` : '')}<div class="t-rates">${ro(whoHead, r.who, r.whoC)}${ro(svcHead, r.svc, r.svcC)}</div>`;
    }
    const box = (k, head) => `<div class="t-rate"><div class="t-rate-h">${head}</div>
        <div class="t-rstars">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-act="t-star" data-k="${k}" data-v="${i}" class="${(S.tRate[k] || 0) >= i ? 'on' : ''}" aria-label="${i} star${i > 1 ? 's' : ''}">${icon('starFill', 28)}</button>`).join('')}</div>
        <button class="t-field t-rfield" type="button" data-act="t-focus" data-f="rate-${k}"><span data-fld="rate-${k}"></span></button></div>`;
    const any = S.tRate.who || S.tRate.svc;
    return `${secH('How was your visit?')}<div class="t-rates">${box('who', whoHead)}${box('svc', svcHead)}</div>
      <button class="btn btn-primary t-submit ${any ? '' : 'off'}" type="button" data-act="t-submit-rate">Submit rating</button>`;
  }

  /* cancelled (T32) */
  function cxHero(a) {
    const e = ext(a);
    return `<div class="t-cxh"><span class="t-cxh-ic">${icon('x', 18, 2.6)}</span><div><b>Appointment cancelled</b><span>${esc(e.cancelledOn || 'Cancelled')}</span></div></div>`;
  }
  function refundSec(a) {
    const e = ext(a), r = refundOf(a), done = r.status === 'Refunded';
    if (r.plan) {
      return `<div class="t-rfc">
        <div class="t-rfc-top"><div><small>Plan session</small><b>1 session</b><span>Back in your ${esc(r.plan)} plan</span></div><span class="pill green">Returned</span></div>
        <ol class="t-tl"><li class="ok"><i>${icon('check', 10, 3.4)}</i><b>Cancelled</b><span>${esc(e.cancelledAt ? `${dshort(e.cancelledAt)}, ${hm(e.cancelledAt)}` : e.cancelledOn || '')}</span></li>
          <li class="ok"><i>${icon('check', 10, 3.4)}</i><b>Session returned to your plan</b><span>${esc(r.date)}</span></li></ol>
        <div class="t-rsn"><small>Reason</small><b>${esc(e.reason || 'Not given')}</b></div>
      </div>`;
    }
    const pay = payOf(a), when = e.cancelledAt ? `${dshort(e.cancelledAt)}, ${hm(e.cancelledAt)}` : (e.cancelledOn || '');
    if (r.none) {
      return `<div class="t-rfc">
        <div class="t-rfc-top"><div><small>Refund</small><b>Nothing to refund</b><span>This visit was set to pay on the day, so nothing was charged.</span></div><span class="pill green">Closed</span></div>
        <ol class="t-tl"><li class="ok"><i>${icon('check', 10, 3.4)}</i><b>Cancelled</b><span>${esc(when)}</span></li></ol>
        <div class="t-rsn"><small>Reason</small><b>${esc(e.reason || 'Not given')}</b></div>
      </div>`;
    }
    const steps = e.steps || [['Cancelled', when, true], ['Refund issued', e.cancelledAt ? dshort(e.cancelledAt) : '', true],
      [`Back on ${pay.label}`, done ? r.date : `Expected by ${r.date || dshort(addWorkDays(now(), 7))}`, done]];
    return `<div class="t-rfc">
        <div class="t-rfc-top"><div><small>Refund</small><b>${aed(r.amount)}</b><span>To ${esc(pay.label)}${e.fee ? ` · AED ${e.fee} fee kept` : ''}</span></div>
          <span class="pill ${done ? 'green' : 'amber'}">${done ? 'Refunded' : 'Processing'}</span></div>
        <ol class="t-tl">${steps.map(([t, d, ok]) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? icon('check', 10, 3.4) : ''}</i><b>${t}</b><span>${esc(d)}</span></li>`).join('')}</ol>
        <div class="t-rsn"><small>Reason</small><b>${esc(e.reason || 'Not given')}</b></div>
      </div>`;
  }

  function footHTML(a) {
    const g = grp(a);
    if (g !== 'upcoming') {
      return `<div class="t-actions"><button class="btn btn-secondary t-sq" type="button" data-act="t-help" aria-label="Get help with this visit">${icon('headset', 19, 2)}</button>
          <button class="btn btn-primary" type="button" data-act="t-again">${ic('rebook', 18, 2.1)} Book again</button></div>`;
    }
    const has = team(a).length > 0, T = TH[a.id], n = T ? T.unread : 0, drive = stage(a) === 'onway';
    return `<div class="t-actions">
        <button class="btn btn-secondary" type="button" data-act="${has ? 't-chat' : 't-help'}" data-id="${a.id}">${icon('chat', 18, 2)} ${has ? 'Chat' : 'Chat with FRH'}${n ? `<i class="t-bn">${n}</i>` : ''}</button>
        <button class="btn btn-primary" type="button" data-act="t-call" data-m="${drive ? 'team' : 'frh'}">${icon('phone', 18, 2)} ${drive ? 'Call team' : 'Call FRH'}</button>
      </div>`;   // T22: while driving, Call goes to the team (masked)
  }

  const LAYOUT = {
    upcoming: ['hero', 'team', 'info', 'sum', 'help'],
    completed: ['hero', 'svc', 'team', 'docs', 'rate'],
    cancelled: ['hero', 'refund', 'info', 'sum'],
  };
  const ANIM = new Set(['hero', 'team', 'info', 'refund', 'docs']);
  const DETAILS = {
    status: 'dark', cls: 't-det',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="t-back" data-fb="appts" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Appointment details</span>
          <button class="icon-btn" type="button" data-act="t-more" aria-label="More options">${ic('dotsV', 19, 2)}</button></div>
        <div class="scr-body t-body" data-s="body" data-act="t-blur"></div>
        <div class="scr-foot t-foot" data-s="foot"></div>`;
    },
    update(n) {
      ensure();
      const a = current();
      if (!a) return;
      const g = grp(a), body = n.querySelector('[data-s="body"]'), key = `${a.id}:${g}`;
      if (body._k !== key) {
        const again = body._k !== undefined;
        body._k = key;
        const lay = g !== 'upcoming' ? LAYOUT[g] : ['hero', ...(pkgRec(a) ? ['pkg'] : []), 'team', 'info', ...(orderSec(a) ? ['order'] : []), 'sum', 'help'];   /* v45 */
        body.innerHTML = lay.map(k => `<div data-s="${k}"></div>`).join('');
        if (again) { body.classList.remove('t-in'); void body.offsetWidth; body.classList.add('t-in'); body.scrollTop = 0; }
      }
      const map = g === 'upcoming' ? { hero: heroUp(a), pkg: pkgSec(a), order: orderSec(a), team: teamSec(a), info: infoSec(a, true), sum: sumSec(a), help: helpSec(a) }
        : g === 'completed' ? { hero: doneHero(a), svc: svcSec(a), team: teamSec(a, 'Who treated you'), docs: docsSec(a), rate: rateSec(a) }
          : { hero: cxHero(a), refund: refundSec(a), info: infoSec(a, false), sum: sumSec(a) };
      Object.keys(map).forEach(k => setHTML(body.querySelector(`[data-s="${k}"]`), map[k], ANIM.has(k)));
      setHTML(n.querySelector('[data-s="foot"]'), footHTML(a));
      fillFields(n);
      fillLive(n);
    },
    mount() { ensure(); },
    tick(n) { fillLive(n); },
  };
  F.SCREENS['appt-details'] = DETAILS;
  F.SCREENS.track = DETAILS;   // ids the rest of the prototype already navigates to
  F.SCREENS.visit = DETAILS;
  F.SCREENS['edit-appt'] = Object.assign({}, DETAILS, {
    mount(n) {
      ensure();
      const from = S.screen;
      setTimeout(() => { if (!S.open || S.screen !== from) return; if (canEdit(current())) { S.tEd = dayIdx(current()); S.tEt = ''; F.openSheet('t-time'); } }, 80);
    },
  });

  /* full-screen live map (T12) */
  F.SCREENS['appt-map'] = {
    status: 'dark', cls: 't-mapscr',
    render() {
      return `<div class="t-mapfull" data-s="map"></div>
        <button class="nav-btn t-mapback" type="button" data-act="t-back" data-fb="appt-details" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
        <div class="t-mapsheet" data-s="sheet"></div>`;
    },
    update(n) {
      const a = current(), st = stage(a), L = grp(a) === 'upcoming' ? lv(a) : null, tm = team(a), d = ext(a).driver;
      setHTML(n.querySelector('[data-s="map"]'), `${mapSVG(a, true)}${st === 'onway' ? `<span class="t-eta-chip lg"><i></i><b data-eta-min="${a.id}"></b><span>· ETA ${hm(L.eta)}</span></span>` : ''}`);
      setHTML(n.querySelector('[data-s="sheet"]'), st === 'onway'
        ? `<div class="grab"></div><div class="t-ms-top"><div><small>On the way</small><b>Arriving in <span data-eta-min="${a.id}"></span></b>
              <span>ETA ${hm(L.eta)} · <span data-km="${a.id}"></span> away</span></div><span class="pill green live"><i></i>Live</span></div>
            <div class="t-ms-team"><span class="t-avst lg">${tm.map(p => `<img src="${img(p.img)}" alt="">`).join('')}</span><div><b>${esc(teamNames(a))}</b><small>${esc(tm.map(p => p.role).join(' · '))}</small></div></div>
            ${d ? `<div class="t-drv flat"><span class="t-drv-ic">${ic('car', 20, 1.9)}</span><div class="t-drv-m"><b>${esc(d.name)} · Driver</b><small>${esc(d.car)} </small></div><span class="t-plate"><small>DUBAI</small>${esc(d.plate)}</span></div>` : ''}
            <div class="t-actions"><button class="btn btn-secondary" type="button" data-act="t-chat" data-id="${a.id}">${icon('chat', 18, 2)} Chat</button>
              <button class="btn btn-primary" type="button" data-act="t-call" data-m="team">${icon('phone', 18, 2)} Call team</button></div>`
        : `<div class="grab"></div><div class="t-arr flat"><span class="t-arr-ic">${icon('check', 22, 3)}</span><div><b>${st === 'treating' ? 'Your team is with you' : 'Your team has arrived'}</b><span>${esc(teamNames(a))} reached your door${L && L.arrivedAt ? ` at ${hm(L.arrivedAt)}` : ''}.</span></div></div>
            <button class="btn btn-primary" type="button" data-act="t-back" data-fb="appt-details">Back to the visit</button>`, true);
      fillLive(n);
    },
    tick(n) { fillLive(n); },
  };

  /* ================= Clinician profile (T33, T34, T35) ================= */
  const DOC = {
    status: 'dark', cls: 'doc-profile t-docp',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="t-back" data-fb="appt-details" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Clinician profile</span><span style="width:40px"></span></div>
        <div class="scr-body t-body" data-s="body"></div>`;
    },
    update(n) {
      const p = PEOPLE[S.tDoc] || PEOPLE.layla, rv = REVIEWS[p.rv] || REVIEWS.doc;
      setHTML(n.querySelector('[data-s="body"]'), `<div class="t-dp">
          <img class="t-dp-img" src="${img(p.img)}" alt="">
          <h1>${p.name}</h1>
          <div class="t-dp-role"><span class="t-role ${p.rk}">${RB[p.rk]}</span><span>${p.spec}</span></div>
          <p class="t-dp-q">${p.quals}</p>
          <div class="t-dp-rate">${stars(p.rating, 15)}<b>${p.rating}</b><span>(${p.reviews} reviews)</span></div>
          <div class="t-dp-lic">${icon('shieldCheck', 14, 2.2)}<span>DHA licence <b>${p.lic}</b></span></div>
        </div>
        <div class="t-stats">${p.stats.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
        <div class="t-langs">${icon('globe', 15, 2)}<span>Speaks ${andJoin(p.langs)}</span></div>
        ${secH('About')}
        <p class="t-about ${S.tAbout ? 'open' : ''}">${p.about}</p>
        <button class="link t-about-l" type="button" data-act="t-about">${S.tAbout ? 'Show less' : 'Read more'}</button>
        ${secH('Reviews', `<span class="t-muted">${icon('starFill', 12)} ${p.rating} · ${p.reviews} reviews</span>`)}
        ${rv.map(r => `<div class="t-rev"><div class="t-rev-top">${av(r.n)}<span class="t-rev-n"><b>${r.n}</b><small>${r.d}</small></span>${stars(r.s, 13)}</div><p>${r.t}</p></div>`).join('')}`);
    },
  };
  F.SCREENS['t-doc'] = DOC;
  F.CLIN = { PEOPLE, REVIEWS, RB, stars, av };   /* v38: shared with the Doctors list and Doctor profile */
  F.SCREENS['doc-profile'] = DOC;

  /* ================= Cancel flow (T36–T39) ================= */
  const REASONS = ['No longer needed', 'Feeling better', 'Scheduling conflict', 'Found another provider', 'Other'];
  const within4h = a => { const t = startOf(a); return t ? t - now() < 4 * 60 * MIN : false; };
  const feeOf = a => (moving(a) || within4h(a)) ? Math.min(100, ext(a).sum.total) : 0;
  F.SCREENS['cancel-appt'] = {
    status: 'dark', cls: 't-cancel',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="t-back" data-fb="appt-details" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Cancel appointment</span><span style="width:40px"></span></div>
        <div class="scr-body t-body" data-act="t-blur"><div data-s="refund"></div><div data-s="appt"></div><div data-s="reasons"></div></div>
        <div class="scr-foot" data-s="foot"></div>`;
    },
    update(n) {
      const a = current(), e = ext(a), total = e.sum.total, fee = feeOf(a), pick = S.tReason, plan = planOf(a), pay = payOf(a);
      setHTML(n.querySelector('[data-s="refund"]'), pay.cash && !plan ? `<div class="t-rf">
          <small>Nothing to refund</small><b class="t-rf-amt">${aed(0)}</b>
          <span class="t-rf-to">${icon('card', 14, 2.2)} You chose to pay on the day, so nothing was charged</span>
          <div class="t-rf-note ${fee ? 'fee' : ''}">${icon(fee ? 'alert' : 'check', 14, 2.4)}<span>${fee
            ? 'Your visit is less than 4 hours away, so a AED 100 call-out fee will be charged to you.'
            : 'Free cancellation: your visit is more than 4 hours away.'}</span></div></div>` : plan ? `<div class="t-rf">
          <small>Goes back to your plan</small><b class="t-rf-amt">1 session</b>
          <span class="t-rf-to">${icon('shieldCheck', 14, 2.2)} Your ${esc(plan)} plan · ${esc(apptName(a))}</span>
          <div class="t-rf-note ${fee ? 'fee' : ''}">${icon(fee ? 'alert' : 'check', 14, 2.4)}<span>${fee
            ? 'Your visit is less than 4 hours away, so this session counts as used.'
            : 'Nothing to pay: this visit is included in your plan, and cancelling returns the session.'}</span></div></div>` : `<div class="t-rf">
          <small>You’ll get back</small><b class="t-rf-amt">${aed(total - fee)}</b>
          <span class="t-rf-to">${icon('card', 14, 2.2)} To ${esc(pay.label)} · in 5–7 working days</span>
          <div class="t-rf-lines"><div class="sum-line"><span>You paid</span><span>${aed(total)}</span></div>
            <div class="sum-line"><span>Cancellation fee</span><span>${fee ? `− ${aed(fee)}` : 'Free'}</span></div></div>
          <div class="t-rf-note ${fee ? 'fee' : ''}">${icon(fee ? 'alert' : 'check', 14, 2.4)}<span>${fee
            ? (moving(a) ? 'Your team has already set off, so the AED 100 call-out fee applies.' : 'Your visit is less than 4 hours away, so a AED 100 fee applies.')
            : 'Free cancellation: your visit is more than 4 hours away.'}</span></div></div>`);   // T36: refund first
      setHTML(n.querySelector('[data-s="appt"]'), `<div class="t-cxa"><span class="tile">${icon(leadIcon(a), 18, 2)}</span>
          <div><b>${esc(apptName(a))}</b><small>${esc(a.date)} · ${esc(a.time)}</small><small>${esc(patientsOf(a).join(', '))} · ${a.id}</small></div></div>`);
      setHTML(n.querySelector('[data-s="reasons"]'), `${secH('Why are you cancelling?', '<span class="pill red">Required</span>')}
          ${S.tCxErr && pick === undefined ? `<p class="t-err">${icon('alert', 14, 2.2)}<span>Choose a reason to cancel this appointment.</span></p>` : ''}
          <div class="t-reasons">${REASONS.map((r, i) => `<button class="reason ${pick === i ? 'on' : ''}" type="button" data-act="t-reason" data-i="${i}"><span class="radio"></span>${r}</button>`).join('')}
            ${pick === REASONS.length - 1 ? '<button class="t-field t-ofield" type="button" data-act="t-focus" data-f="cancel-other"><span data-fld="cancel-other"></span></button>' : ''}</div>`);   // T37
      setHTML(n.querySelector('[data-s="foot"]'), `<div class="stack">
          <button class="btn btn-primary t-cxbtn ${pick === undefined ? 'soft' : ''}" type="button" data-act="t-do-cancel">${S.tCancelling ? '<i class="t-spin w"></i>Cancelling…' : 'Cancel appointment'}</button>
          <button class="btn btn-ghost" type="button" data-act="t-keep">Keep appointment</button></div>`);   // T38
      fillFields(n);
    },
    mount() { ensure(); S.tReason = undefined; S.tCxErr = false; S.tOther = ''; S.tCancelling = false; },
  };
  function doCancel(id) {
    const a = find(id), i = D.appointments.upcoming.indexOf(a);
    if (!a || i < 0) return null;
    const e = ext(a), fee = feeOf(a), t = now(), other = (S.tOther || '').trim();
    D.appointments.upcoming.splice(i, 1);
    Object.assign(a, { status: 'cancelled', statusLabel: 'Cancelled', tracking: false, badge: '' });
    const plan = planOf(a);
    a.refund = plan ? { amount: 0, status: 'Returned', date: dshort(t), plan }
      : payOf(a).cash ? { amount: 0, status: 'Refunded', date: dshort(t), none: true }
        : { amount: e.sum.total - fee, status: 'Processing', date: dshort(addWorkDays(t, 7)) };
    Object.assign(e, { cancelledOn: stamp(t), cancelledAt: t, fee, steps: null,
      reason: REASONS[S.tReason] + (S.tReason === REASONS.length - 1 && other ? `: “${other}”` : '') });
    delete LV[a.id];
    D.appointments.cancelled.unshift(a);
    S.tJustCancelled = a.id; S.apptTab = 'cancelled';
    return a;
  }
  F.SCREENS.cancelled = {   // T39
    status: 'dark', cls: 'success t-success',
    render() {
      const a = find(S.tJustCancelled) || D.appointments.cancelled[0] || current(), r = refundOf(a), done = r.status === 'Refunded';
      return `<div class="nav"><span style="width:40px"></span><span class="nav-title"></span>
          <button class="nav-btn" type="button" data-act="t-cx-done" aria-label="Close">${icon('x', 18, 2.2)}</button></div>
        <div class="scr-body">
          <div class="ok-badge"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#12805A"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <h1 class="h1">Appointment cancelled</h1>
          <p class="lead">${r.plan ? `The session is back in your <b>${esc(r.plan)} plan</b>.` : r.none ? 'Nothing was charged, so there’s nothing to refund.'
            : `Your refund of <b>${aed(r.amount)}</b> ${done ? 'is back on' : 'is on its way to'} ${esc(payOf(a).label)}.`}</p>
          <div class="info-card t-okcard">
            <div class="t-kv"><span>Patient${patientsOf(a).length > 1 ? 's' : ''}</span><b>${esc(patientsOf(a).join(', '))}</b></div>
            <div class="t-kv"><span>Booking ID</span><b>${a.id}</b></div>
            <div class="t-kv"><span>Visit</span><b>${esc(a.date)} · ${esc(a.time)}</b></div>
            ${r.plan ? `<div class="t-kv"><span>Plan session</span><b class="t-ok">Returned to ${esc(r.plan)}</b></div>`
              : r.none ? '<div class="t-kv"><span>Payment</span><b>Nothing was charged</b></div>'
              : `<div class="t-kv"><span>Refund</span><b class="t-ok">${aed(r.amount)}</b></div>
            <div class="t-kv"><span>${done ? 'Refunded' : 'Expected by'}</span><b>${esc(r.date)}</b></div>`}
          </div>
        </div>
        <div class="scr-foot"><div class="stack"><button class="btn btn-primary" type="button" data-act="t-cx-done">View appointments</button>
          <button class="btn btn-ghost" type="button" data-act="go-home">Back to Home</button></div></div>`;
    },
  };

  /* ================= sheets ================= */
  const mi = (act, ic2, t, sub, cls = '', extra = '') => `<button class="t-mi ${cls}" type="button" ${act ? `data-act="${act}"` : 'disabled'} ${extra}><span class="tile">${ic(ic2, 18, 2)}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
  /* Final v30: "How was your visit?" opens by itself once a visit is complete and not yet rated (once per visit).
     Three layouts to choose from (S.v30rate): a = stars + chips, b = faces + would you book again, c = detailed scores.
     It saves into the same rating as the form on the visit page, so the visit then shows "You rated this visit". */
  const V30LBL = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];
  const V30FACE = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Great'];
  const V30GOOD = ['On time', 'Explained clearly', 'Gentle and caring', 'Clean and tidy', 'Felt safe', 'Easy booking'];
  const V30BAD = ['Arrived late', 'Felt rushed', 'Unclear advice', 'Hygiene', 'Booking problem', 'Billing'];
  const V30ASP = [['on', 'clock', 'On time'], ['care', 'heart', 'Care'], ['adv', 'chat', 'Advice'], ['hyg', 'shieldCheck', 'Hygiene']];
  const v30Face = i => { const y = 15.6 + (i - 3) * 1.5;
    return `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M9 10h.01M15 10h.01" stroke-width="2.4"/><path d="M8.6 ${(31.2 - y).toFixed(1)}Q12 ${y.toFixed(1)} 15.4 ${(31.2 - y).toFixed(1)}"/></svg>`; };
  const v30Who = a => { const tm = team(a); return tm.find(p => p.rk === 'doc') || tm[0] || null; };
  const v30Score = () => { const v = S.v30 || {}; return S.v30rate === 'b' ? v.face || 0 : v.s || 0; };
  const v30Ready = () => (S.v30rate === 'b' ? !!(S.v30 || {}).face : !!(S.v30 || {}).s);
  function v30Open() { S.v30 = { s: 0, face: 0, chips: [], again: null, asp: {}, note: '' }; F.openSheet('v30-rate'); }
  function v30Blur() { F.hideKb(); S.focus = null; const L = document.getElementById('sheetLayer'); if (L) L.classList.remove('kb-lift'); if (S.sheet === 'v30-rate') F.openSheet('v30-rate'); }
  F.SHEET_KB = F.SHEET_KB || {};
  F.SHEET_KB['v30-rate'] = () => S.focus === 'v30-note';
  F.SHEETS['v30-rate'] = () => {
    const a = current(), p = v30Who(a), v = S.v30 || {}, mode = S.v30rate || 'a', sc = v30Score();
    const first = p ? p.name.replace(/^(Dr\.\s+\S+).*/, '$1').replace(/^(?!Dr\.)(\S+).*/, '$1') : '';
    const head = `<div class="v30-who">${p ? `<img src="${img(p.img)}" alt="">` : `<span class="v30-ic">${icon(leadIcon(a), 22, 2)}</span>`}
        <h2>${p ? `How was your visit with ${esc(first)}?` : 'How was your visit?'}</h2><small>${esc(apptName(a))} · ${esc(a.date)}</small></div>`;
    const chips = list => `<div class="v30-chips">${list.map(c => `<button type="button" class="v30-chip ${v.chips.includes(c) ? 'on' : ''}" data-act="v30-chip" data-c="${esc(c)}" aria-pressed="${v.chips.includes(c)}">${c}</button>`).join('')}</div>`;
    const note = `<button class="t-field v30-note ${S.focus === 'v30-note' ? 'focus' : ''}" type="button" data-act="v30-focus"><span data-fld="v30-note">${fieldHTML('v30-note')}</span></button>`;
    const bigStars = `<div class="v30-stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${(v.s || 0) >= i ? 'on' : ''}" data-act="v30-star" data-v="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">${icon('starFill', 34)}</button>`).join('')}</div>`;
    let body = '';
    if (mode === 'b') {
      body = `<div class="v30-faces">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${v.face === i ? 'on' : ''}" data-act="v30-face" data-v="${i}" aria-pressed="${v.face === i}">${v30Face(i)}<small>${V30FACE[i]}</small></button>`).join('')}</div>
        ${v.face ? `<p class="v30-q">${v.face >= 4 ? 'What went well?' : 'What could be better?'}</p>${chips(v.face >= 4 ? V30GOOD : V30BAD)}
        <p class="v30-q">Would you book this again?</p><div class="v30-seg">${[['yes', 'Yes'], ['no', 'No']].map(([k, l]) => `<button type="button" class="${v.again === k ? 'on' : ''}" data-act="v30-again" data-v="${k}">${l}</button>`).join('')}</div>${note}` : ''}`;
    } else if (mode === 'c') {
      body = `${bigStars}<p class="v30-lbl">${sc ? V30LBL[sc] : 'Tap to rate the visit overall'}</p>
        <div class="v30-asp">${V30ASP.map(([k, ic, l]) => `<div><span class="v30-ai">${icon(ic, 15, 2)}</span><b>${l}</b><span class="v30-mini">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${(v.asp[k] || 0) >= i ? 'on' : ''}" data-act="v30-asp" data-k="${k}" data-v="${i}" aria-label="${l}: ${i}">${icon('starFill', 18)}</button>`).join('')}</span></div>`).join('')}</div>
        <p class="v30-q">Would you book this again?</p><div class="v30-seg">${[['yes', 'Yes'], ['no', 'No']].map(([k, l]) => `<button type="button" class="${v.again === k ? 'on' : ''}" data-act="v30-again" data-v="${k}">${l}</button>`).join('')}</div>${note}`;
    } else {
      body = `${bigStars}<p class="v30-lbl">${sc ? V30LBL[sc] : 'Tap a star to rate'}</p>
        ${sc ? `<p class="v30-q">${sc >= 4 ? 'What went well?' : 'What could be better?'}</p>${chips(sc >= 4 ? V30GOOD : V30BAD)}${note}` : ''}`;
    }
    return `<div class="sheet v30-sheet v30-${mode}" role="dialog" aria-label="Rate your visit"><div class="grab"></div>${head}${body}
      <button class="btn btn-primary v30-send ${v30Ready() ? '' : 'off'}" type="button" data-act="v30-submit">Submit</button>
      <button class="v30-later" type="button" data-act="v30-later">Not now</button></div>`;
  };
  /* opens by itself: on the visit page of a completed, unrated visit, once per visit */
  function v30Auto() {
    if (S.v30off || !S.open || S.screen !== 'appt-details' || S.sheet) return;
    const a = current(); S.v30seen = S.v30seen || {};
    if (!a || grp(a) !== 'completed' || rated(a) || S.v30seen[a.id]) return;
    S.v30seen[a.id] = true;
    setTimeout(() => { if (S.open && S.screen === 'appt-details' && !S.sheet && current() === a) v30Open(); }, 900);
  }
  F.v30Auto = v30Auto;
  { const go0 = F.go, upd0 = F.upd;                                 /* check after every screen change and refresh */
    F.go = function () { const r = go0.apply(this, arguments); setTimeout(v30Auto, 0); return r; };
    F.upd = function () { const r = upd0.apply(this, arguments); v30Auto(); return r; }; }

  F.SHEETS['t-more'] = () => {   // T9
    const a = current(), g = grp(a), st = stage(a), ed = canEdit(a), fee = g === 'upcoming' ? feeOf(a) : 0;
    let items;
    if (g === 'upcoming') {
      items = mi(ed ? 't-edit-time' : '', 'calendar', 'Change date & time', ed ? 'Free until your team leaves' : 'Your team has already left', ed ? '' : 'off')
        + (isTele(a) ? '' : mi(ed ? 't-edit-loc' : '', 'pin', 'Change address', ed ? 'Only within Dubai and Sharjah' : 'Your team has already left', ed ? '' : 'off'))
        + (st === 'treating' ? mi('', 'x', 'Cancel appointment', 'Treatment has started. Call FRH if you need to stop.', 'danger off')
          : mi('t-cancel', 'x', 'Cancel appointment', planOf(a) ? 'The session goes back to your plan' : fee ? `A AED ${fee} fee applies, shown before you confirm` : 'Free. You’ll see the refund before you confirm', 'danger'))
        + mi('t-help', 'headset', 'Get help with this visit', 'Message FRH Support');
    } else {
      items = mi('t-help', 'headset', 'Get help with this visit', 'Message FRH Support')
        + (TH[a.id] && TH[a.id].msgs.length ? mi('t-chat', 'chat', 'Visit chat', 'Read your messages with the team', '', `data-id="${a.id}"`) : '')
        + mi('t-again', 'rebook', 'Book again', 'Start a new booking for the same service');
    }
    return `<div class="sheet t-sheet" role="dialog" aria-label="More options"><div class="grab"></div>
      <div class="t-mh"><b>${esc(apptName(a))}</b><small>${a.id} · ${esc(a.date)}</small></div>${items}
      <button class="btn btn-ghost t-sh-close" type="button" data-act="sheet-close">Close</button></div>`;
  };

  const SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];
  const DAYS7 = () => [...Array(7)].map((_, k) => {
    const d = new Date(NOW0 + k * 864e5);
    return { k, top: k === 0 ? 'Today' : k === 1 ? 'Tom' : WD[d.getDay()], n: d.getDate(), m: MO[d.getMonth()], wd: WD[d.getDay()] };
  });
  const dayLabel = d => d.k === 0 ? 'Today' : d.k === 1 ? 'Tomorrow' : `${d.wd} ${d.n} ${d.m}`;
  function dayIdx(a) { const i = DAYS7().findIndex(d => dayLabel(d) === a.date); return i < 0 ? 0 : i; }
  function slotOff(k, i) {
    if (k === 0) { const h = [8, 10, 12, 14, 16, 18, 20, 21, 22][i]; if (h * 60 <= new Date(NOW0).getHours() * 60 + 120) return true; }
    return (k * 3 + i) % 5 === 1;
  }
  const curSlot = a => { const m = /^(\d{1,2}:\d{2})\s*(AM|PM)?/i.exec(a.time || ''); if (!m) return ''; const ap = (m[2] || (/(AM|PM)/i.exec(a.time) || [])[1] || '').toUpperCase(); return `${m[1]} ${ap}`; };
  F.SHEETS['t-time'] = () => {   // T19
    const a = current(), sel = S.tEd === undefined ? dayIdx(a) : S.tEd, curD = dayIdx(a), cs = curSlot(a);
    return `<div class="sheet t-sheet" role="dialog" aria-label="Change date and time"><div class="grab"></div>
      <h2>Change date &amp; time</h2>
      <div class="t-cur">${icon('calendar', 16, 2.2)}<span>Now booked for <b>${esc(a.date)} · ${esc(a.time)}</b></span></div>
      <div class="t-lbl">Date</div>
      <div class="hrow t-days">${DAYS7().map(d => `<button class="date-chip ${sel === d.k ? 'on' : ''}" type="button" data-act="t-ed" data-k="${d.k}"><small>${d.top}</small><b>${d.n}</b><span>${d.m}</span></button>`).join('')}</div>
      <div class="t-lbl">Time</div>
      <div class="t-slots">${SLOTS.map((t, i) => {
        const isCur = sel === curD && t === cs, off = slotOff(sel, i) || isCur;
        return `<button class="slot ${S.tEt === t ? 'on' : ''} ${off ? 'full' : ''}" type="button" ${off ? 'disabled aria-disabled="true"' : `data-act="t-et" data-t="${t}"`}>${t}${isCur ? '<small>Current</small>' : ''}</button>`;
      }).join('')}</div>
      <div class="t-free">${icon('check', 14, 2.6)}<span>Free to change until your team leaves. Your team and price stay the same.</span></div>
      <div class="t-sh-btns"><button class="btn btn-secondary" type="button" data-act="sheet-close">Cancel</button>
        <button class="btn btn-primary ${S.tEt ? '' : 'off'}" type="button" data-act="t-save-time">Confirm</button></div></div>`;
  };

  /* v45: book one of the package's appointments that was left for later (4 weeks ahead; physio until 8 PM) */
  const DAYSN = n => [...Array(n)].map((_, k) => {
    const d = new Date(NOW0 + k * 864e5);
    return { k, top: k === 0 ? 'Today' : k === 1 ? 'Tom' : WD[d.getDay()], n: d.getDate(), m: MO[d.getMonth()], wd: WD[d.getDay()] };
  });
  const PK_SLOTS = SLOTS.slice(0, 7);
  const pkBooked = P => P.sessions.filter(Boolean).map(find).filter(Boolean);
  F.SHEETS['v45-sched'] = () => {
    const a = current(), P = pkgRec(a);
    if (!P) return '<div class="sheet"></div>';
    const k = S.v45sn || 0, sel = S.v45sd || 0, bkd = pkBooked(P), ad = addrParts({ address: P.address });
    const busy = (d, t) => bkd.find(x => x.date === dayLabel(d) && curSlot(x) === t);
    return `<div class="sheet t-sheet" role="dialog" aria-label="Book appointment ${k + 1}"><div class="grab"></div>
      <h2>Book appointment ${k + 1} of ${P.n}</h2>
      <div class="t-cur">${icon('physio', 16, 2.2)}<span><b>${esc(P.name)} · ${esc(P.label)}</b> · ${esc(firstOf(P.patient))} at ${esc(ad.label || ad.line)}</span></div>
      <div class="t-lbl">Date</div>
      <div class="hrow t-days">${DAYSN(28).map(d => `<button class="date-chip ${sel === d.k ? 'on' : ''} ${bkd.some(x => x.date === dayLabel(d)) ? 'v45-has' : ''}" type="button" data-act="v45-sd" data-k="${d.k}"><small>${d.top}</small><b>${d.n}</b><span>${d.m}</span></button>`).join('')}</div>
      <div class="t-lbl">Time</div>
      <div class="t-slots">${PK_SLOTS.map((t, i) => {
        const u = busy(DAYSN(28)[sel], t), off = u || slotOff(sel, i);
        return `<button class="slot ${S.v45st === t ? 'on' : ''} ${off ? 'full' : ''}" type="button" ${off ? 'disabled aria-disabled="true"' : `data-act="v45-st" data-t="${t}"`}>${t}${u ? `<small>Appt ${u.pkgN}</small>` : ''}</button>`;
      }).join('')}</div>
      <div class="t-free">${icon('check', 14, 2.6)}<span>Already paid with the package. Nothing more to pay.</span></div>
      <div class="t-sh-btns"><button class="btn btn-secondary" type="button" data-act="sheet-close">Cancel</button>
        <button class="btn btn-primary ${S.v45st ? '' : 'off'}" type="button" data-act="v45-sched-ok">Book appointment</button></div></div>`;
  };
  F.v45sched = n => {
    const a = current(), P = pkgRec(a); if (!P) return;
    const last = pkBooked(P).map(x => DAYSN(28).findIndex(d => dayLabel(d) === x.date)).filter(i => i >= 0).sort((x, y) => y - x)[0];
    S.v45sn = n; S.v45sd = last === undefined ? 1 : last + 7 <= 27 ? last + 7 : Math.min(27, last + 1); S.v45st = '';
    if (S.sheet) F.closeSheet(true);
    F.openSheet('v45-sched');
    const row = F.el.sheet.querySelector('.hrow'), on = row && row.querySelector('.on');
    if (on) { row.style.scrollBehavior = 'auto'; row.scrollLeft = Math.max(0, on.offsetLeft - row.offsetLeft - 60); row.style.scrollBehavior = ''; }
  };

  const LIVE_CITIES = ['Dubai', 'Sharjah'];
  const cityOf = line => /sharjah/i.test(line) ? 'Sharjah' : /abu dhabi/i.test(line) ? 'Abu Dhabi' : /al ain/i.test(line) ? 'Al Ain'
    : /ras al khaimah|\bRAK\b/i.test(line) ? 'Ras Al Khaimah' : /ajman/i.test(line) ? 'Ajman' : /dubai/i.test(line) ? 'Dubai' : '';
  const inArea = line => { const c = cityOf(line); return !c || LIVE_CITIES.includes(c); };   // T20 service-area check
  const ADDRS = () => ((PD.addresses && PD.addresses.length) ? PD.addresses : (B.addresses || [])).map(x => ({ label: x.label, line: x.line, note: x.note || '', icon: x.icon || (/home/i.test(x.label) ? 'home' : 'pin') }));
  const addrIdx = a => { const l = addrParts(a).label; return ADDRS().findIndex(x => x.label === l); };
  F.SHEETS['t-loc'] = () => {
    const a = current(), cur = addrIdx(a), sel = S.tAddr === undefined ? cur : S.tAddr;
    return `<div class="sheet t-sheet" role="dialog" aria-label="Change visit address"><div class="grab"></div>
      <h2>Change visit address</h2>
      <p class="t-sh-sub">Your team comes to the address you choose. We visit homes in Dubai and Sharjah.</p>
      ${ADDRS().map((d, i) => {
        const ok = inArea(d.line);
        return `<button class="reason t-addr ${sel === i ? 'on' : ''} ${ok ? '' : 'out'}" type="button" ${ok ? `data-act="t-addr" data-i="${i}"` : 'disabled'}><span class="radio"></span>
          <span class="t-addr-m"><b>${esc(d.label)}${i === cur ? ' <span class="pill ink">Current</span>' : ''}</b><small>${esc(d.line)}</small>
          ${ok ? '' : `<small class="t-out">${icon('alert', 12, 2.4)} ${cityOf(d.line)} is coming soon</small>`}</span></button>`;
      }).join('')}
      <button class="t-add" type="button" data-act="t-add-addr">${icon('plus', 16, 2.4)} Add a new address</button>
      <div class="t-sh-btns"><button class="btn btn-secondary" type="button" data-act="sheet-close">Cancel</button>
        <button class="btn btn-primary ${sel !== cur && sel >= 0 ? '' : 'off'}" type="button" data-act="t-save-loc">Confirm</button></div></div>`;
  };

  F.SHEETS['t-call'] = () => {
    const m = S.tCallMode || 'frh', a = current(), tm = a ? team(a) : [];
    const C = {
      frh: [frhAv('lg'), 'Call FRH', '800 374 · open 24 hours, every day', 'Call 800 374', ''],
      team: [`<span class="t-avst xl">${tm.map(p => `<img src="${img(p.img)}" alt="">`).join('')}</span>`, 'Call your team',
        `${esc(a ? teamNames(a) : 'Your team')} ${tm.length > 1 ? 'are' : 'is'} on the way. The call goes through FRH, so your number stays private.`, `Call ${esc(tm[0] ? firstOf(tm[0].name) : 'the team')}`, ''],
      '998': [`<span class="t-sos-ic">${icon('ambulance', 26, 2)}</span>`, 'Call 998?', 'Dubai Ambulance, for a medical emergency.', 'Call 998', 'danger'],
    }[m];
    return `<div class="sheet t-sheet t-callsh" role="dialog" aria-label="${C[1]}"><div class="grab"></div>
      <div class="t-call-av">${C[0]}</div><h2>${C[1]}</h2><p class="t-sh-sub">${C[2]}</p>
      <button class="btn btn-primary ${C[4]}" type="button" data-act="t-dial">${icon('phone', 18, 2)} ${C[3]}</button>
      <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div>`;
  };

  F.SHEETS['t-attach'] = () => {   // T46: attach stays
    const sup = curThread() === 'support';
    return `<div class="sheet t-sheet" role="dialog" aria-label="Attach"><div class="grab"></div>
      <h2>Share with ${sup ? 'FRH Support' : 'your care team'}</h2>
      <p class="t-sh-sub">A photo of a rash, an old report or a prescription helps them prepare.</p>
      ${mi('t-att-pick', 'image', 'Photo', 'Take a photo or choose from your library', '', 'data-k="photo"')}
      ${mi('t-att-pick', 'file', 'Document', 'A PDF, lab report or prescription', '', 'data-k="doc"')}
      <button class="btn btn-ghost t-sh-close" type="button" data-act="sheet-close">Cancel</button></div>`;
  };
  /* re-render an open sheet in place, without replaying its slide-in */
  function resheet(kind) {
    const old = F.el.sheet.querySelector('.sheet');
    if (!old || S.sheet !== kind) return F.openSheet(kind);
    const row = old.querySelector('.hrow'), sl = row ? row.scrollLeft : 0, st = old.scrollTop;
    const tmp = document.createElement('div'); tmp.innerHTML = F.SHEETS[kind]();
    const nu = tmp.firstElementChild; old.replaceWith(nu);
    const nr = nu.querySelector('.hrow'); if (nr) nr.scrollLeft = sl; nu.scrollTop = st;
  }

  /* ================= Chat tab (T40–T47) ================= */
  const thr = id => TH[id] || (TH[id] = { unread: 0, msgs: [] });
  const supOnline = () => { const h = new Date(now()).getHours(); return h >= 7 && h < 23; };
  const whoOf = k => PEOPLE[k] ? { name: PEOPLE[k].name, role: PEOPLE[k].role, img: PEOPLE[k].img } : (COORD[k] || COORD.aisha);
  const isRO = tid => { if (tid === 'support') return false; const a = find(tid); return !a || grp(a) !== 'upcoming'; };   // T47
  const openable = a => grp(a) !== 'upcoming' || team(a).length > 0;
  function preview(tid) {
    const T = thr(tid), m = T.msgs[T.msgs.length - 1];
    if (T.typing) return `<em>${esc(firstOf(whoOf(T.typing).name))} is typing…</em>`;
    if (!m) return '';
    const body = m.att ? (m.att.kind === 'photo' ? 'Photo' : 'Document') : m.t;
    return esc(m.from === 'me' ? `You: ${body}` : `${firstOf(whoOf(m.k).name)}: ${body}`);
  }
  function whenOf(tid) {
    const T = thr(tid); let day = 'Today';
    T.msgs.forEach(m => { if (m.day) day = m.day; });
    const l = T.msgs[T.msgs.length - 1];
    return l ? (day === 'Today' ? l.at : day.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/, '')) : '';
  }
  F.chatUnread = () => Object.keys(TH).reduce((n, k) => n + ((TH[k] && TH[k].unread) || 0), 0);

  function supportCard() {   // T40 pinned thread + T41 998 line + T42 hint
    const T = thr('support'), on = supOnline();
    return `<div class="t-sup">
        <button class="t-sup-main" type="button" data-act="t-open-thread" data-t="support">
          ${frhAv('', on)}
          <span class="t-th-m"><span class="t-th-top"><b>FRH Support</b><span class="t-pin">${ic('pinned', 11, 2.4)}Pinned</span><span class="c-when">${whenOf('support')}</span></span>
            <span class="t-sup-sub">${on ? '<i></i>Online · on-duty doctor and care team, 7 AM – 11 PM' : 'Back at 7 AM · call 800 374 any time'}</span>
            <span class="t-th-prev ${T.unread ? 'on' : ''}">${preview('support')}</span></span>
          ${T.unread ? `<span class="c-unread">${T.unread}</span>` : ''}
        </button>
        <button class="t-sos" type="button" data-act="t-998">${icon('ambulance', 17, 2)}<span><b>Medical emergency?</b> Call 998</span>${icon('phone', 15, 2.2)}</button>
      </div>
      <p class="t-hint">${icon('calendar', 13, 2.2)}<span>Your visit chat opens when you book.</span></p>`;
  }
  function threadRow(a) {
    const tm = team(a), g = grp(a), T = thr(a.id), ok = openable(a), lead = tm[0];
    const prev = !ok ? 'Opens once your team is assigned' : (preview(a.id) || `Say hello to ${esc(andJoin(tm.map(p => firstOf(p.name))))}`);
    return `<button class="t-th ${ok ? '' : 'off'} ${g === 'upcoming' ? '' : 'past'}" type="button" data-act="${ok ? 't-open-thread' : 't-chat-off'}" data-t="${a.id}">
        <span class="t-th-av">${lead ? `<img src="${img(lead.img)}" alt="">${tm[1] ? `<img class="b2" src="${img(tm[1].img)}" alt="">` : ''}` : `<span class="tile">${icon(leadIcon(a), 19, 2)}</span>`}${moving(a) ? '<i class="on"></i>' : ''}</span>
        <span class="t-th-m"><span class="t-th-top"><b>${esc(apptName(a))}</b><span class="c-when">${ok && T.msgs.length ? whenOf(a.id) : ''}</span></span>
          <span class="t-th-id">${a.id} · ${esc(a.date)}${g === 'upcoming' ? '' : ' · closed'}</span>
          <span class="t-th-prev ${T.unread ? 'on' : ''}">${prev}</span></span>
        ${T.unread ? `<span class="c-unread ${g === 'upcoming' ? '' : 'grey'}">${T.unread}</span>` : ''}
      </button>`;
  }
  function chatListHTML() {
    const up = sortUp(D.appointments.upcoming), past = [...D.appointments.completed, ...D.appointments.cancelled].filter(a => thr(a.id).msgs.length);
    return `${supportCard()}
      ${up.length ? `<div class="t-grp">Your visits</div><div class="t-ths">${up.map(threadRow).join('')}</div>`
        : `<div class="t-nov"><b>No visit chats yet</b><span>Each visit gets its own chat with your care team.</span><button class="btn btn-secondary" type="button" data-act="t-book">Book a visit</button></div>`}
      ${past.length ? `<div class="t-grp">Past visits</div><div class="t-ths">${past.map(threadRow).join('')}</div>` : ''}`;
  }
  F.SCREENS['chat-home'] = {
    status: 'dark', cls: 't-chats',
    render() {
      return `<div class="nav"><span class="t-navsp"></span><span class="nav-title">Chat</span>
          <button class="icon-btn" type="button" data-act="t-call" data-m="frh" aria-label="Call FRH">${icon('phone', 18, 1.9)}</button></div>
        <div class="scr-body t-body" data-s="list"></div>
        ${F.tabbar('chat')}`;
    },
    update(n) { setHTML(n.querySelector('[data-s="list"]'), chatListHTML()); },
  };

  const TICK = '<svg class="c-tick" viewBox="0 0 17 11" width="15" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6.2 4 9.2 9.4 1.9"/><path d="m7.7 9.2 5.6-7.3"/></svg>';
  const attHTML = att => `<span class="t-att-ic ${att.kind}">${ic(att.kind === 'photo' ? 'image' : 'file', 22, 1.8)}</span><span class="t-att-m"><b>${esc(att.name)}</b><small>${esc(att.size)}</small></span>`;
  const fromLine = (w, extra = '') => `<div class="t-from${extra}">${w.img ? `<img src="${img(w.img)}" alt="">` : `<span class="t-from-av">${initials(w.name)}</span>`}<b>${esc(w.name)}</b><span>${esc(w.role)}</span></div>`;
  function bubbles(tid) {
    const T = thr(tid), out = [];
    let prev = null;
    if (tid === 'support') {
      out.push(`<div class="t-intro">${frhAv('lg', supOnline())}<b>FRH Support</b><span>An on-duty doctor answers health questions, and our care team handles bookings, billing and membership. Every day 7 AM – 11 PM; we usually reply within 2 minutes.</span>
        <button class="t-intro-sos" type="button" data-act="t-998">${icon('ambulance', 14, 2.2)} Medical emergency? Call 998</button></div>`);
      const c = S.tSupCtx && find(S.tSupCtx);
      if (c) out.push(`<div class="t-ctx"><span class="tile">${icon(leadIcon(c), 16, 2)}</span><div class="t-ctx-m"><b>About booking ${c.id}</b><small>${esc(apptName(c))} · ${esc(c.date)}</small></div>
        <button class="mini-btn ghost" type="button" data-act="t-ctx-open">View</button></div>`);
    } else {
      out.push(`<div class="c-sys">${icon('shieldCheck', 13, 2.2)}<span>This chat belongs to your visit. The doctor and nurses on it join here, and if the doctor changes, the new one takes over in the same chat. For a medical emergency, call 998.</span></div>`);
    }
    T.msgs.forEach(m => {
      if (m.day) { out.push(`<div class="c-day">${m.day}</div>`); prev = null; }
      const fr = m.fresh ? ' t-pop' : '';
      if (m.from === 'me') {
        out.push(`<div class="c-msg me${m.att ? ' t-attm' : ''}${fr}">${m.att ? attHTML(m.att) : esc(m.t)}<span class="c-time">${m.at}${TICK}</span></div>`);
      } else {
        if (!prev || prev.from === 'me' || prev.k !== m.k) out.push(fromLine(whoOf(m.k), fr));   // T44 sender name + role
        out.push(`<div class="c-msg them${fr}">${esc(m.t)}<span class="c-time">${m.at}</span></div>`);
      }
      prev = m;
    });
    if (T.typing) out.push(`${fromLine(whoOf(T.typing), ' t-pop')}<div class="c-typing t-pop"><i></i><i></i><i></i></div>`);
    return out.join('');
  }
  function threadHead(tid) {
    const T = thr(tid), back = `<button class="nav-btn" type="button" data-act="t-back" data-fb="chat-home" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>`;
    const call = '<button class="icon-btn" type="button" data-act="t-call" data-m="frh" aria-label="Call FRH">' + icon('phone', 18, 1.9) + '</button>';   // T43: call rings FRH
    if (tid === 'support') {
      const on = supOnline();
      return `${back}<span class="t-chd">${frhAv('sm', on)}<span class="t-chd-t"><b>FRH Support</b><small class="${T.typing ? 'typ' : on ? 'on' : ''}">${T.typing ? `${esc(firstOf(whoOf(T.typing).name))} is typing…` : on ? 'Online · replies in about 2 min' : 'Replies from 7 AM · call 800 374'}</small></span></span>${call}`;
    }
    const a = find(tid);
    return `${back}<button class="t-chd" type="button" data-act="t-thread-appt" aria-label="Open the appointment"><span class="tile">${icon(leadIcon(a), 17, 2)}</span>
        <span class="t-chd-t"><b>${esc(apptName(a))}</b><small class="${T.typing ? 'typ' : ''}">${T.typing ? `${esc(firstOf(whoOf(T.typing).name))} is typing…` : `${a.id} · ${esc(a.date)}${isRO(tid) ? ' · closed' : ''}`}</small></span></button>${call}`;
  }
  function threadFoot(tid) {
    if (isRO(tid)) {   // T47
      return `<div class="t-ro">${icon('lock', 16, 2.2)}<div><b>This chat closed when your visit ended</b><span>Need anything about it? Call FRH, or message FRH Support.</span></div></div>
        <div class="t-ro-btns"><button class="btn btn-secondary" type="button" data-act="t-help-ro">Message Support</button>
          <button class="btn btn-primary" type="button" data-act="t-call" data-m="frh">${icon('phone', 17, 2)} Call FRH</button></div>`;
    }
    return `<div class="t-comp">
        <button class="t-attb" type="button" data-act="t-attach" aria-label="Attach a photo or document">${icon('plus', 20, 2.2)}</button>
        <button class="t-field t-cfield" type="button" data-act="t-focus" data-f="chat-msg" aria-label="Message"><span data-fld="chat-msg"></span></button>
        <button class="c-send ${draftOf(tid).trim() ? '' : 'idle'}" type="button" data-act="t-send" aria-label="Send">${icon('nav', 18, 2)}</button>
      </div>`;   // T45 free text, T46 attach
  }
  const scrollEnd = (n, smooth) => { const b = n && n.querySelector('.scr-body'); if (b) { if (smooth && b.scrollTo) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' }); else b.scrollTop = b.scrollHeight; } };
  F.SCREENS.chat = {
    status: 'dark', cls: 'c-chat t-thread',
    render() {
      return `<div class="nav c-nav t-cnav" data-s="head"></div>
        <div class="scr-body t-cbody" data-act="t-blur"><div class="c-list t-clist" data-s="list"></div></div>
        <div class="scr-foot c-foot t-tfoot" data-s="foot"></div>`;
    },
    update(n) {
      ensure();
      const tid = curThread(), T = thr(tid);
      if (T.unread) T.unread = 0;
      setHTML(n.querySelector('[data-s="head"]'), threadHead(tid));
      const list = n.querySelector('[data-s="list"]'), first = list._h === undefined;
      const changed = setHTML(list, bubbles(tid));
      if (changed) { T.msgs.forEach(m => { delete m.fresh; }); list._h = bubbles(tid); }
      setHTML(n.querySelector('[data-s="foot"]'), threadFoot(tid));
      fillFields(n);
      if (changed) scrollEnd(n, !first);
    },
    mount(n) { const from = S.screen; setTimeout(() => { if (S.open && S.screen === from) scrollEnd(n); }, 30); },
  };

  /* team / support replies after a typing indicator (timers never navigate) */
  const viewing = tid => S.open && S.screen === 'chat' && curThread() === tid;
  function pushMsg(tid, m) {
    const T = thr(tid), days = T.msgs.filter(x => x.day), last = days.length ? days[days.length - 1].day : '';
    if (last !== 'Today') m.day = 'Today';
    m.fresh = true;
    T.msgs.push(m);
  }
  function replierOf(tid) {
    if (tid === 'support') return 'aisha';
    const tm = team(find(tid));
    return (tm.find(p => p.rk === 'doc') || tm[0] || { key: 'aisha' }).key;
  }
  function replyText(tid, kind, text) {
    const t = String(text || '').toLowerCase();
    if (tid === 'support') {
      const c = S.tSupCtx && find(S.tSupCtx);
      if (kind === 'photo') return 'Thanks, I’ve got the photo. I’ve added it to your file so your clinician sees it before the visit.';
      if (kind === 'doc') return 'Thanks, the document is saved to your file. Your clinician will see it before the visit.';
      if (/emergenc|chest|breath|bleed|unconscious|faint|seizure/.test(t)) return 'If this is an emergency, please call 998 now. I’m here for anything else.';
      if (/cancel|refund/.test(t)) return 'You can cancel from the appointment page: tap ⋮, then Cancel appointment. You’ll see your refund before you confirm.';
      if (/reschedul|change|move|time|date|later|earlier/.test(t)) return 'You can change the date and time from the appointment page until your team leaves: tap ⋮, then Change date & time. I can also move it for you here.';
      if (/report|result|lab|test/.test(t)) return 'Results usually arrive within 24 hours. You’ll find them on the visit page and in Profile, under Medical reports.';
      if (/pay|invoice|price|cost|charge|insurance|bill/.test(t)) return 'Every invoice is on its visit page and in Profile, under Invoices. Tell me the booking ID and I’ll check the charge for you.';
      if (/^(hi|hello|hey|salam|good (morning|afternoon|evening))\b/.test(t)) return 'Hi Sara, Aisha here from FRH Support. How can I help?';
      if (/thank/.test(t)) return 'You’re welcome, Sara. I’m here if anything else comes up.';
      return c ? `Thanks, Sara. Aisha here. I’m looking into booking ${c.id} now and will update you in this chat.`
        : 'Thanks, Sara. Aisha here. I’m looking into that now and will update you in this chat.';
    }
    const a = find(tid), st = stage(a), L = lv(a);
    if (kind === 'photo') return 'Thanks for the photo, Sara. I’ll take a proper look when I’m with you.';
    if (kind === 'doc') return 'Got it, thank you. It’s saved to your visit so the whole team can see it.';
    if (/gate|park|code|door|lift|floor|villa|building/.test(t)) return 'Thank you, that helps. We’ll park in the visitor bay and call you from the gate.';
    if (/thank/.test(t)) return 'You’re welcome, Sara.';
    if (st === 'onway') return `Thanks, Sara. We’re about ${minsLeft(L)} minutes away.`;
    if (st === 'arrived') return 'We’re at your door now.';
    if (st === 'treating') return 'Noted, thank you. We’ll go through it before we leave.';
    return `Thanks, Sara. I’ve noted that for your visit on ${a.date}.`;
  }
  function queueReply(tid, kind, text) {
    const r = RT[tid] || (RT[tid] = {});
    clearTimeout(r.a); clearTimeout(r.b);
    r.kind = kind; r.text = text;
    const who = replierOf(tid);
    const poke = () => { if (!S.open) return; if (viewing(tid) || S.screen === 'chat-home') F.upd(); };
    r.a = setTimeout(() => { thr(tid).typing = who; poke(); }, 700);
    r.b = setTimeout(() => {
      const T = thr(tid);
      T.typing = null;
      pushMsg(tid, { from: 'them', k: who, t: replyText(tid, r.kind, r.text), at: hm(now()) });
      if (!viewing(tid)) T.unread = (T.unread || 0) + 1;
      poke();
    }, 2300);
  }

  /* ================= open helpers & contracts ================= */
  F.openAppt = (id, o = {}) => {   // contract: used by Home, notifications, membership, reports
    ensure();
    if (id) S.apptId = id;
    const a = current();
    if (!a) { F.go('appts'); return; }
    if (lastOpen !== a.id) { resetDraft(); lastOpen = a.id; }
    F.go('appt-details', { dir: o.dir || 'fwd' });
  };
  function openThread(tid) {
    S.tThread = tid; S.tChatFrom = S.screen;
    if (tid !== 'support') S.tSupCtx = S.tSupCtx || null;
    F.go('chat');
  }
  F.openSupportChat = ctx => { S.tSupCtx = typeof ctx === 'string' ? ctx : null; openThread('support'); };   // contract
  F.openDirectChat = (k, bookingId) => {   // kept for older callers; they F.go('chat') afterwards
    const a = bookingId && find(bookingId);
    S.tThread = a && openable(a) ? a.id : 'support';
    S.tSupCtx = S.tThread === 'support' ? (bookingId || null) : null;
    S.tChatFrom = S.screen;
  };
  F.apptStatus = id => {
    const a = find(id) || current();
    if (!a) return null;
    const st = stage(a), L = grp(a) === 'upcoming' ? lv(a) : {};
    return { id: a.id, stage: st, label: a.statusLabel, eta: L.eta ? hm(L.eta) : '', etaMin: L.eta && st === 'onway' ? minsLeft(L) : 0, team: team(a).map(p => p.name) };
  };
  F.apptSetStage = (id, st) => setStage(id, st);
  F.apptAdvance = id => {
    const a = find(id || (MY.includes(S.screen) && S.apptId) || 'FRH-24817') || find('FRH-24817');
    if (!a || grp(a) !== 'upcoming') return null;
    const nx = STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(stage(a)) + 1)];
    setStage(a.id, nx);
    return nx;
  };
  function bookAgain(a) {
    const id = a && ext(a).svc;
    if (id && F.ACT['open-svc'] && F.SCREENS.service) { F.ACT['open-svc']({ dataset: { id } }); return; }
    F.go(F.SCREENS.cats ? 'cats' : 'home');
  }
  const TABS = ['home', 'appts', 'chat-home', 'profile-home'];
  const kbOff = () => { if (S.kb) F.hideKb(); S.focus = null; };

  Object.assign(F.ACT, {
    'appt-open': n => F.openAppt(n && n.dataset && n.dataset.id),
    track: n => F.openAppt(n && n.dataset && n.dataset.id),
    'rate-open': n => F.openAppt(n && n.dataset && n.dataset.id),
    edit: n => { if (n && n.dataset && n.dataset.id) S.apptId = n.dataset.id; F.go('edit-appt'); },
    cancel: n => { if (n && n.dataset && n.dataset.id) S.apptId = n.dataset.id; F.go('cancel-appt'); },
    appts: () => F.go('appts', { dir: TABS.includes(S.screen) ? 'fade' : 'back' }),
    'msg-team': n => { F.openDirectChat('doctor', n && n.dataset && n.dataset.id); F.go('chat'); },
    'c-open': n => { F.openDirectChat(n.dataset.k, n.dataset.b); F.go('chat'); },
    'c-chats': () => F.go('chat-home', { dir: 'back' }),
    't-back': n => { kbOff(); F.back((n && n.dataset && n.dataset.fb) || 'appts'); },
    't-book': () => F.go(F.SCREENS.cats ? 'cats' : 'home'),
    't-tab': n => {
      S.apptTab = n.dataset.t; F.upd();
      const b = F.cur() && F.cur().querySelector('[data-s="list"]');
      if (b) { b.scrollTop = 0; b.classList.remove('t-in'); void b.offsetWidth; b.classList.add('t-in'); }
    },
    't-more': () => { kbOff(); F.openSheet('t-more'); },
    't-cancel': () => { F.closeSheet(true); F.go('cancel-appt'); },
    't-copy': n => F.toast(`Booking ID ${n.dataset.v} copied`, 'copy'),
    't-acc': n => { const k = `${current().id}:${n.dataset.k}`; S.tAcc[k] = !S.tAcc[k]; F.upd(); },
    't-map-full': () => F.go('appt-map'),
    't-doc': n => { S.tDoc = n.dataset.k; S.tAbout = false; F.go('t-doc'); },
    't-about': () => { S.tAbout = !S.tAbout; F.upd(); },
    't-help': () => { F.closeSheet(true); F.openSupportChat(current() && current().id); },
    't-again': () => { F.closeSheet(true); bookAgain(current()); },
    't-call': n => { kbOff(); S.tCallMode = (n && n.dataset && n.dataset.m) || 'frh'; F.openSheet('t-call'); },
    't-998': () => { kbOff(); S.tCallMode = '998'; F.openSheet('t-call'); },
    't-dial': () => {
      const m = S.tCallMode || 'frh', a = current(), lead = a && team(a)[0];
      F.closeSheet();
      F.toast(m === '998' ? 'Calling 998…' : m === 'team' ? `Connecting you to ${lead ? firstOf(lead.name) : 'your team'}. Your number stays private.` : 'Calling FRH on 800 374…', m === '998' ? 'ambulance' : 'phone');
    },
    /* v45: package appointments */
    'v45-pk-go': n => { const id = n.dataset.id; if (!find(id)) return; S.apptId = id; resetDraft(); lastOpen = id; S.tAcc = {}; F.upd(); },
    'v45-sched': n => F.v45sched(+n.dataset.n),
    'v45-sd': n => { S.v45sd = +n.dataset.k; S.v45st = ''; resheet('v45-sched'); },
    'v45-st': n => { S.v45st = n.dataset.t; resheet('v45-sched'); },
    'v45-sched-ok': () => {
      const a = current(), P = pkgRec(a);
      if (!P || !S.v45st) { F.shake('.t-slots'); return; }
      const d = DAYSN(28)[S.v45sd], used = new Set(ALL().map(x => x.id));
      let n = 24990; while (used.has('FRH-' + n)) n++;
      const x = { id: 'FRH-' + n, status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW', service: a.service, sub: '', date: dayLabel(d), time: range(S.v45st, 60),
        patients: (a.patients || []).slice(), address: a.address, team: 'Team being assigned', total: a.total, issue: a.issue || '', paidWith: a.paidWith,
        pkg: a.pkg, pkgN: 0, sumLabel: a.sumLabel, v45demo: a.v45demo, order: a.order };
      D.appointments.upcoming.push(x);
      P.sessions[S.v45sn] = x.id;
      /* keep the appointments in date order: appointment 1 is always the earliest */
      const on = pkBooked(P).sort((p, q) => (startOf(p) || 0) - (startOf(q) || 0));
      P.sessions = on.map(y => y.id).concat(Array(P.n - on.length).fill(null));
      on.forEach((y, j) => { y.pkgN = j + 1; y.sub = `${P.name} package · session ${j + 1} of ${P.n}`; if (X[y.id]) X[y.id].blocks.forEach(b => { b.subs = [y.sub]; }); });
      F.closeSheet(); F.upd();
      F.toast(`Appointment ${x.pkgN} booked · ${x.date}, ${S.v45st}`, 'check');
    },
    /* date & time (T19) */
    't-edit-time': () => { const a = current(); if (!canEdit(a)) return; S.tEd = dayIdx(a); S.tEt = ''; if (S.sheet) F.closeSheet(true); F.openSheet('t-time'); },
    't-ed': n => { S.tEd = +n.dataset.k; S.tEt = ''; resheet('t-time'); },
    't-et': n => { S.tEt = n.dataset.t; resheet('t-time'); },
    't-save-time': () => {
      if (!S.tEt) { F.shake('.t-slots'); return; }
      const a = current(), d = DAYS7()[S.tEd === undefined ? dayIdx(a) : S.tEd];
      a.date = dayLabel(d); a.time = range(S.tEt, durMin(a));
      if (a.badge === 'NEW') a.badge = 'Rescheduled';
      F.closeSheet(); F.upd();
      F.toast(`Moved to ${a.date}, ${S.tEt}`, 'check');
    },
    /* address (T20) */
    't-edit-loc': () => { const a = current(); if (!canEdit(a) || isTele(a)) return; S.tAddr = undefined; if (S.sheet) F.closeSheet(true); F.openSheet('t-loc'); },
    't-addr': n => { S.tAddr = +n.dataset.i; resheet('t-loc'); },
    't-save-loc': () => {
      const a = current(), d = ADDRS()[S.tAddr];
      if (!d || S.tAddr === addrIdx(a)) { F.shake('.t-addr'); return; }
      if (!inArea(d.line)) { F.shake('.t-addr.on'); return; }
      a.address = `${d.label} · ${d.line}`;
      F.closeSheet(); F.upd();
      F.toast(`Your team will come to ${d.label}`, 'pin');
    },
    't-add-addr': () => {
      const id = current().id;
      F.closeSheet(true);
      const done = x => {
        const a = find(id), line = x && (x.line || x.address || '');
        if (a && line) {
          if (inArea(line)) { a.address = `${x.label || 'New address'} · ${line}`; F.toast(`Your team will come to ${x.label || 'your new address'}`, 'pin'); }
          else F.toast(`${cityOf(line)} is coming soon. Your visit stays at ${addrParts(a).label || 'the current address'}.`, 'alert');
        }
        const from = S.screen;
        setTimeout(() => { if (!S.open || S.screen !== from || from === 'appt-details') return; S.apptId = id; F.back('appt-details'); }, 0);
      };
      if (F.openAddressForm) F.openAddressForm({ ctx: 'appt', done });
      else if (F.SCREENS['px-address']) F.go('px-address');
      else F.toast('Add an address in Profile, under Addresses', 'pin');
    },
    /* completed visit (T27–T31) */
    't-report': n => {
      const id = n.dataset.r, name = n.dataset.n;
      if (F.openReport) F.openReport(id);
      else if (F.openPdf) F.openPdf({ title: name, kind: 'report', back: S.screen });
      else if (F.SCREENS['reports-hub']) F.go('reports-hub');
      else F.toast(`${name} opens in the PDF viewer`, 'file');
    },
    't-rx': n => { const id = n.dataset.id; if (F.openRx) F.openRx(id); else if (F.SCREENS['e-rx']) F.go('e-rx'); else F.toast('Your e-prescription opens here', 'file'); },
    't-inv': n => {
      const no = n.dataset.no;
      if (F.openPdf) F.openPdf({ title: `Invoice ${no}`, kind: 'invoice', back: S.screen });
      else if (F.SCREENS['px-pdf']) F.go('px-pdf');
      else F.toast(`Invoice ${no} opens in the PDF viewer`, 'file');
    },
    't-dl': n => F.toast(`${n.dataset.n} saved to Files`, 'download'),
    't-star': n => { S.tRate[n.dataset.k] = +n.dataset.v; F.upd(); },
    't-submit-rate': () => {
      const a = current();
      if (!S.tRate.who && !S.tRate.svc) { F.shake('.t-rates'); return; }
      kbOff();
      ext(a).rated = { who: S.tRate.who || S.tRate.svc, svc: S.tRate.svc || S.tRate.who, whoC: (S.tRateC.who || '').trim(), svcC: (S.tRateC.svc || '').trim(), on: dshort(now()) };
      a.rated = S.tRate.who || S.tRate.svc;
      resetDraft();
      F.upd();
      F.toast('Thanks, your rating was sent', 'check');
    },
    'v30-star': n => { S.v30.s = +n.dataset.v; S.v30.chips = []; F.openSheet('v30-rate'); },
    'v30-face': n => { S.v30.face = +n.dataset.v; S.v30.chips = []; F.openSheet('v30-rate'); },
    'v30-chip': n => { const c = n.dataset.c, l = S.v30.chips, i = l.indexOf(c); if (i >= 0) l.splice(i, 1); else l.push(c); F.openSheet('v30-rate'); },
    'v30-again': n => { S.v30.again = n.dataset.v; F.openSheet('v30-rate'); },
    'v30-asp': n => { S.v30.asp[n.dataset.k] = +n.dataset.v; F.openSheet('v30-rate'); },
    'v30-focus': () => {
      ensure(); S.shift = !(S.v30.note || '').length; F.showKb('qwerty', 'v30-note'); F.openSheet('v30-rate');
      const L = document.getElementById('sheetLayer'), K = document.getElementById('kb');
      if (L && K) { L.classList.add('kb-lift'); L.style.setProperty('--kbh', K.offsetHeight + 'px'); }
    },
    'v30-later': () => { if (S.focus === 'v30-note') { F.hideKb(); S.focus = null; } const L = document.getElementById('sheetLayer'); if (L) L.classList.remove('kb-lift'); F.closeSheet(); },
    'v30-submit': () => {
      if (!v30Ready()) { F.shake('.v30-stars, .v30-faces'); return; }
      const a = current(), v = S.v30, score = S.v30rate === 'b' ? v.face : v.s;
      const comment = [(v.note || '').trim(), v.chips.join(', ')].filter(Boolean).join(' · ');
      ext(a).rated = { who: score, svc: score, whoC: comment, svcC: '', on: dshort(now()), chips: v.chips.slice(), again: v.again, asp: { ...v.asp } };
      a.rated = score;
      F.ACT['v30-later']();
      setTimeout(() => { F.upd(); F.toast('Thanks for your feedback', 'check'); }, 300);
    },
    /* cancel flow (T36–T39) */
    't-reason': n => { S.tReason = +n.dataset.i; S.tCxErr = false; if (S.tReason !== REASONS.length - 1) kbOff(); F.upd(); },
    't-keep': () => { kbOff(); F.back('appt-details'); },
    't-do-cancel': () => {
      if (S.tCancelling) return;
      if (S.tReason === undefined) {
        S.tCxErr = true; F.upd(); F.shake('.t-reasons');
        const r = F.cur() && F.cur().querySelector('.t-reasons'); if (r) r.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      kbOff();
      S.tCancelling = true; F.upd();
      const from = S.screen, id = current().id;
      setTimeout(() => {
        S.tCancelling = false;
        if (!S.open || S.screen !== from) return;
        if (doCancel(id)) F.go('cancelled', { dir: 'fade' }); else F.upd();
      }, 900);
    },
    't-cx-done': () => { S.apptTab = 'cancelled'; F.go('appts', { dir: 'fade' }); },
    /* chat */
    't-chat': n => { F.closeSheet(true); const id = (n && n.dataset && n.dataset.id) || S.apptId, a = find(id); if (a && openable(a)) { S.tSupCtx = null; openThread(a.id); } else F.ACT['t-chat-off'](); },
    't-chat-off': () => F.toast('Your visit chat opens once your team is assigned', 'chat'),
    't-open-thread': n => { const t = n.dataset.t; if (t === 'support') S.tSupCtx = null; openThread(t); },
    't-thread-appt': () => {
      const tid = curThread();
      if (S.tChatFrom === 'appt-details' && S.apptId === tid) { kbOff(); F.back('appt-details'); } else { kbOff(); F.openAppt(tid); }
    },
    't-ctx-open': () => { kbOff(); if (S.tSupCtx) F.openAppt(S.tSupCtx); },
    't-help-ro': () => { const tid = curThread(); S.tSupCtx = tid; S.tThread = 'support'; S.tChatFrom = S.screen; F.go('chat', { dir: 'fade' }); },
    't-focus': n => {
      const f = n.dataset.f;
      if (!FIELDS[f]) return;
      ensure();
      const v = FIELDS[f].get() || '';
      S.shift = !v.length || /[.!?]\s$/.test(v);
      F.showKb('qwerty', f);
      F.upd();
      const from = S.screen, node = F.cur();
      setTimeout(() => {
        if (!S.open || S.screen !== from || !node) return;
        if (f === 'chat-msg') scrollEnd(node, true);
        else { const el = node.querySelector(`[data-fld="${f}"]`); if (el) el.closest('.t-field').scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      }, 380);
    },
    't-blur': () => { if (S.focus && FIELDS[S.focus]) blur(); },
    't-send': () => {
      const tid = curThread(), v = draftOf(tid).trim();
      if (isRO(tid)) return;
      if (!v) { F.shake('.t-comp'); return; }
      pushMsg(tid, { from: 'me', t: v, at: hm(now()) });
      S.tDrafts[tid] = '';
      if (S.kb === 'qwerty' && !S.sym) { S.shift = true; F.renderKb(); }
      F.upd();
      queueReply(tid, 'text', v);
    },
    't-attach': () => F.openSheet('t-attach'),
    't-att-pick': n => {
      const tid = curThread(), k = n.dataset.k;
      F.closeSheet();
      pushMsg(tid, { from: 'me', att: k === 'photo' ? { kind: 'photo', name: 'Photo', size: 'IMG_2041.HEIC · 1.8 MB' } : { kind: 'doc', name: 'Blood test, March.pdf', size: 'PDF · 420 KB' }, at: hm(now()) });
      F.upd();
      queueReply(tid, k === 'photo' ? 'photo' : 'doc');
    },
  });

  /* ================= presenter jumps (lead wires these into panel.js) ================= */
  const SNAP = { lists: {}, objs: {}, tracking: D.tracking ? { step: D.tracking.step, eta: D.tracking.eta } : null };
  ['upcoming', 'completed', 'cancelled'].forEach(k => { SNAP.lists[k] = D.appointments[k].map(a => a.id); });
  ALL().forEach(a => { SNAP.objs[a.id] = clone(a); });
  const homeList = id => ['upcoming', 'completed', 'cancelled'].find(k => SNAP.lists[k].includes(id));
  function reorder(k) {
    const l = D.appointments[k], foreign = l.filter(a => !SNAP.objs[a.id]), mine = SNAP.lists[k].map(id => l.find(a => a.id === id)).filter(Boolean);
    l.length = 0; l.push(...foreign, ...mine);
  }
  function restore(id) {   // put one demo booking back the way it started
    if (!SNAP.objs[id]) return;
    let a = null;
    ['upcoming', 'completed', 'cancelled'].forEach(k => { const l = D.appointments[k], i = l.findIndex(x => x.id === id); if (i > -1) { a = l[i]; l.splice(i, 1); } });
    a = a || {};
    Object.keys(a).forEach(key => { delete a[key]; });
    Object.assign(a, clone(SNAP.objs[id]));
    const k = homeList(id);
    D.appointments[k].push(a); reorder(k);
    X[id] = clone(XB[id] || {}); if (!XB[id]) delete X[id];
    delete LV[id];
  }
  function resetAll() {
    Object.keys(SNAP.objs).forEach(restore);
    X = clone(XB); TH = clone(TB); LV = {};
    Object.values(RT).forEach(r => { clearTimeout(r.a); clearTimeout(r.b); });
    if (SNAP.tracking && D.tracking) Object.assign(D.tracking, SNAP.tracking);
    ['tAcc', 'tDrafts', 'tRate', 'tRateC', 'tThread', 'tSupCtx', 'tChatFrom', 'tDoc', 'tAbout', 'tReason', 'tCxErr', 'tOther', 'tCancelling',
      'tJustCancelled', 'tEd', 'tEt', 'tAddr', 'tCallMode', 'apptId', 'apptTab'].forEach(k => { delete S[k]; });
    lastOpen = null;
    ensure();
  }
  const rb = document.getElementById('restartBtn');
  if (rb) rb.addEventListener('click', resetAll);

  const fade = { dir: 'fade' };
  function prep(id, st) {
    restore(id);
    if (st && st !== 'unassigned') setStage(id, st, { quiet: true });
    S.apptId = id; resetDraft(); lastOpen = id; S.tAcc = {};
  }
  const toDetails = (id, st) => { prep(id, st); F.go('appt-details', fade); };
  /* v30 presets: a completed visit that isn't rated yet, so the pop-up opens by itself */
  const v30Demo = mode => { S.v30rate = mode; const a = find('FRH-24512'); if (a) { delete ext(a).rated; delete a.rated; } S.v30seen = {}; F.closeSheet(true); toDetails('FRH-24512'); };
  const sheetAfter = kind => { const from = S.screen; setTimeout(() => { if (!S.open || S.screen !== from) return; F.openSheet(kind); }, 120); };
  const JUMP = {
    appts: () => { S.apptTab = 'upcoming'; F.go('appts', fade); },
    'appts-completed': () => { S.apptTab = 'completed'; F.go('appts', fade); },
    'appts-cancelled': () => { S.apptTab = 'cancelled'; F.go('appts', fade); },
    'appt-assigning': () => toDetails('FRH-24863', 'unassigned'),
    'appt-assigned': () => toDetails('FRH-24790', 'assigned'),
    'appt-onway': () => toDetails('FRH-24817', 'onway'),
    'appt-map': () => { toDetails('FRH-24817', 'onway'); F.go('appt-map'); },
    'appt-arrived': () => toDetails('FRH-24817', 'arrived'),
    'appt-treating': () => toDetails('FRH-24817', 'treating'),
    'appt-completed': () => { S.v30seen = { ...(S.v30seen || {}), 'FRH-24512': true }; toDetails('FRH-24512'); S.tAcc['FRH-24512:notes'] = false; F.upd(); },
    'v30-rate-a': () => v30Demo('a'), 'v30-rate-b': () => v30Demo('b'), 'v30-rate-c': () => v30Demo('c'),
    'appt-rated': () => toDetails('FRH-24388'),
    'appt-cancelled': () => toDetails('FRH-24201'),
    'appt-menu': () => { toDetails('FRH-24790', 'assigned'); sheetAfter('t-more'); },
    'appt-reschedule': () => { toDetails('FRH-24790', 'assigned'); S.tEd = dayIdx(current()); S.tEt = ''; sheetAfter('t-time'); },
    'appt-address': () => { toDetails('FRH-24790', 'assigned'); S.tAddr = undefined; sheetAfter('t-loc'); },
    'cancel-appt': () => { toDetails('FRH-24863', 'unassigned'); F.go('cancel-appt'); },
    cancelled: () => {
      if (!find(S.tJustCancelled)) { prep('FRH-24863', 'unassigned'); S.tReason = 2; S.tOther = ''; doCancel('FRH-24863'); }
      F.go('cancelled', fade);
    },
    clinician: () => { S.tDoc = 'layla'; S.tAbout = false; F.go('t-doc', fade); },
    'chat-home': () => F.go('chat-home', fade),
    'chat-support': () => { S.tThread = 'support'; S.tSupCtx = null; S.tChatFrom = 'chat-home'; F.go('chat', fade); },
    'chat-compose': () => { JUMP['chat-support'](); F.ACT['t-focus']({ dataset: { f: 'chat-msg' } }); },
    'chat-visit': () => { prep('FRH-24817', 'onway'); S.tThread = 'FRH-24817'; S.tChatFrom = 'chat-home'; F.go('chat', fade); },
    'chat-readonly': () => { restore('FRH-24512'); S.tThread = 'FRH-24512'; S.tChatFrom = 'chat-home'; F.go('chat', fade); },
  };
  Object.assign(JUMP, { track: JUMP['appt-onway'], visit: JUMP['appt-completed'], 'edit-appt': JUMP['appt-reschedule'], 'doc-profile': JUMP.clinician, chat: JUMP['chat-visit'] });
  F.apptJump = v => { F.closeSheet(true); F.openInstant(); kbOff(); (JUMP[v] || JUMP.appts)(); };
  F.APPT_VIEWS = Object.keys(JUMP);
})();
