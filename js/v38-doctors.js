/* Final v38: browse doctors before booking.
   doctors  Doctors list: filters (available today, female doctor, speaks Arabic, sees children), one card per doctor
            with rating, years, languages and the next arrival window, Book on every card; nurses and therapists below.
   doctor   Doctor profile: photo, licence, stats, pick a day and an arrival window, about, what they treat,
            the visits they do (with prices), credentials and reviews; sticky Book visit.
   Also: an "Our doctors" rail on Home, and the requested doctor on the service page after Book.
   Mobbin: Zocdoc (cards with next availability; profile with time slots), Alan (filters by availability and language),
   Fiverr (profile stats row), CVS Health (pick a visit time, then Book).
   Clinician data is shared with the Clinician profile (F.CLIN from dev-appt.js), so names, licences and reviews match. */
(function () {
  const F = window.FRH, S = F.S, { icon } = window.FRHI, B = window.FRHBOOK || {}, C = F.CLIN;
  if (!C) return;
  const esc = F.esc, img = n => `assets/img/${n}`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };

  /* two more doctors in the shared list, so the Clinician profile knows them too */
  Object.assign(C.PEOPLE, {
    priya: { key: 'priya', img: 'doc-2.jpg', name: 'Dr. Priya Nair', role: 'Doctor', rk: 'doc', spec: 'Paediatrician', lic: 'DHA-P-0062457',
      quals: 'MBBS, DCH, MRCPCH (Paediatrics)', rating: 4.9, reviews: 187, langs: ['English', 'Hindi', 'Malayalam'],
      stats: [['2,700+', 'Patients'], ['11 yrs', 'Experience'], ['187', 'Reviews']], rv: 'priya',
      about: 'Dr. Priya is a paediatrician who has cared for children in Dubai for eleven years, from newborn checks to teenagers. She joined FRH to see children where they are most at ease, at home, and parents value how calmly she explains what is going on and what to watch for overnight.' },
    noor: { key: 'noor', img: 'doctor.jpg', name: 'Dr. Noor Al Mansoori', role: 'Doctor', rk: 'doc', spec: 'Family Medicine', lic: 'DHA-P-0093318',
      quals: 'MBBS, Arab Board in Family Medicine', rating: 4.9, reviews: 176, langs: ['Arabic', 'English'],
      stats: [['1,900+', 'Patients'], ['8 yrs', 'Experience'], ['176', 'Reviews']], rv: 'noor',
      about: 'Dr. Noor is an Emirati family physician with a special interest in women’s health. She spent six years at a Dubai primary-care centre before joining FRH, and families often ask for her when a mother, daughter or grandmother would rather see a female doctor at home.' },
  });
  Object.assign(C.REVIEWS, {
    omar: [
      { n: 'Khalid Rahman', d: '18 Sep 2026', s: 5, t: 'Went through all my father’s diabetes readings and changed one medicine. He called two days later to check.' },
      { n: 'Sarah Mitchell', d: '2 Sep 2026', s: 5, t: 'Came within the hour at night. Calm, thorough, and the sick note was in the app before he left.' },
      { n: 'Imran Qureshi', d: '27 Aug 2026', s: 4, t: 'Very knowledgeable. The visit started a little late, but he took his time with every question.' },
    ],
    priya: [
      { n: 'Huda Al Ali', d: '14 Sep 2026', s: 5, t: 'My son was nervous and she turned the check-up into a game. Clear advice on what to watch for overnight.' },
      { n: 'Anita George', d: '6 Sep 2026', s: 5, t: 'Checked our newborn at home so we didn’t have to go out in the heat. Kind and very reassuring.' },
      { n: 'Omar Farouk', d: '21 Aug 2026', s: 5, t: 'Spotted the ear infection quickly, sent the prescription to the app and called the next day.' },
    ],
    noor: [
      { n: 'Mariam Al Suwaidi', d: '17 Sep 2026', s: 5, t: 'My mother was comfortable straight away. Dr. Noor explained everything in Arabic and wrote it all down for us.' },
      { n: 'Leila Ahmadi', d: '1 Sep 2026', s: 5, t: 'Gentle and thorough. She noticed my iron was low and arranged the blood test the same week.' },
      { n: 'Noura Khalifa', d: '20 Aug 2026', s: 4, t: 'Very caring. The next free visit was a day away, but it was worth the wait.' },
    ],
  });

  /* what the list and profile add: who they see, visits they do, and free arrival windows for the next five days
     (hours, 19.5 = 7:30 PM; 'now' = can leave now) */
  const DOCS = {
    omar: { noun: 'doctor', female: false, kids: false, main: 'gp', svc: ['gp', 'tele'], since: 2022, who: 'Adults and teens over 16',
      treats: ['Diabetes and blood pressure', 'Fever and infections', 'Stomach upsets', 'Lab result reviews', 'Medication reviews', 'Sick notes'],
      days: [['now', 18, 20.5], [9, 12, 17], [10, 16], [9, 13], [11]] },
    layla: { noun: 'GP', female: true, kids: true, main: 'gp', svc: ['gp', 'peds', 'tele'], since: 2021, who: 'Adults and children',
      treats: ['Fever and flu', 'Chest and throat infections', 'Children’s illnesses', 'Check-ups for older parents', 'Sick notes', 'Repeat prescriptions'],
      days: [[19.5, 21], [10, 14, 16.5], [9, 11.5, 18], [], [10, 15]] },
    priya: { noun: 'paediatrician', female: true, kids: true, main: 'peds', svc: ['peds', 'tele'], since: 2020, who: 'Newborns to 16 years',
      treats: ['Fever in babies and children', 'Coughs, colds and ear infections', 'Rashes and allergies', 'Newborn checks', 'Growth and feeding', 'School sick notes'],
      days: [[18, 19.5], [9, 11, 16], [10, 17], [9.5, 15], []] },
    noor: { noun: 'doctor', female: true, kids: true, main: 'gp', svc: ['gp', 'tele'], since: 2023, who: 'Women, men and children',
      treats: ['Women’s health', 'Pregnancy check-ins', 'Fever and infections', 'Thyroid and anaemia', 'Family check-ups', 'Sick notes'],
      days: [[], [9, 11, 15.5], [10, 13], [9, 16], [10.5]] },
  };
  const ORDER = ['omar', 'layla', 'priya', 'noor'];
  const TEAM = ['grace', 'mark', 'daniel'];
  const FILTERS = [['all', 'All'], ['today', 'Available today'], ['female', 'Female doctor'], ['arabic', 'Speaks Arabic'], ['kids', 'Sees children']];
  const P = k => C.PEOPLE[k];

  /* ---------- time helpers ---------- */
  const DAY = 864e5;
  const hm = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return { t: `${H % 12 || 12}:${String(M).padStart(2, '0')}`, ap: H >= 12 ? 'PM' : 'AM' }; };
  const at = h => { const a = hm(h); return `${a.t} ${a.ap}`; };
  const win = h => { if (h === 'now') return 'Now · about 45 min'; const a = hm(h), b = hm(h + 1); return a.ap === b.ap ? `${a.t} – ${b.t} ${b.ap}` : `${a.t} ${a.ap} – ${b.t} ${b.ap}`; };
  const dayName = i => i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(Date.now() + i * DAY).toLocaleDateString('en-GB', { weekday: 'short' });
  const dayDate = i => new Date(Date.now() + i * DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const nowH = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const slots = (k, i) => (DOCS[k].days[i] || []).filter(h => i > 0 || h === 'now' || h > nowH() + 0.5);   /* today: only windows still ahead */
  const next = k => { for (let i = 0; i < DOCS[k].days.length; i++) { const s = slots(k, i); if (s.length) return { k, i, h: s[0] }; } return null; };
  const nextLine = k => { const x = next(k); if (!x) return ['No free visits this week', 'later']; if (x.h === 'now') return ['Available now · about 45 min', 'now'];
    return [`${dayName(x.i)} from ${at(x.h)}`, x.i === 0 ? 'now' : 'later']; };
  const svcOf = id => Object.keys(B.subcats || {}).flatMap(c => B.subcats[c]).find(s => s.id === id) || { id, name: id, price: 0 };
  const SVCIC = { gp: 'stetho', peds: 'users', tele: 'video', night: 'stetho' };
  const aed = n => `AED ${n}`;
  const first = k => P(k).name.split(' ').slice(0, 2).join(' ');   /* Dr. Layla */
  const railWhen = k => { const x = next(k); return !x ? 'Fully booked' : x.h === 'now' ? 'Available now' : `${dayName(x.i)} ${at(x.h)}`; };
  const star = (v, s = 13) => `<span class="v38-star">${icon('starFill', s)}</span><b>${v}</b>`;

  const match = (k, f) => {
    const p = P(k), d = DOCS[k];
    return f === 'today' ? slots(k, 0).length > 0 : f === 'female' ? d.female : f === 'arabic' ? p.langs.includes('Arabic') : f === 'kids' ? d.kids : true;
  };

  /* ---------- Doctors list ---------- */
  function listHTML() {
    const f = S.v38f || 'all', L = ORDER.filter(k => match(k, f));
    const chips = `<div class="v38-chips" role="tablist">${FILTERS.map(([k, l]) => `<button class="v38-chip ${k === f ? 'on' : ''}" type="button" role="tab" aria-selected="${k === f}" data-act="v38-f" data-f="${k}">${l}</button>`).join('')}</div>`;
    const cards = L.map(k => {
      const p = P(k), d = DOCS[k], [nl, tone] = nextLine(k);
      const tags = [d.who, p.langs.join(', ')];
      return `<div class="v38-dc" role="button" tabindex="0" data-act="v38-doc" data-k="${k}">
          <div class="v38-dc-top"><img class="v38-dc-img" src="${img(p.img)}" alt="">
            <span class="v38-dc-mid"><b>${p.name}</b><span class="v38-dc-spec">${p.spec} · ${p.stats[1][0]}</span>
              <span class="v38-dc-meta">${star(p.rating)}<span>(${p.reviews} reviews)</span></span></span></div>
          <div class="v38-tags">${tags.map(t => `<span class="v38-tag">${esc(t)}</span>`).join('')}</div>
          <div class="v38-dc-foot"><span class="v38-av ${tone}"><i></i>${nl}</span>
            <button class="v38-book" type="button" data-act="v38-book" data-k="${k}">Book</button></div>
        </div>`;
    }).join('');
    const none = `<div class="v38-none"><b>No doctors match</b><span>Try another filter, or book a visit and we’ll send the first available doctor.</span>
        <button class="v38-chip" type="button" data-act="v38-f" data-f="all">Show all doctors</button></div>`;
    const team = `<div class="sec-h v38-sech"><h4>Also on your care team</h4></div>
      <div class="v38-team">${TEAM.map(k => { const p = P(k); return `<button class="v38-tm" type="button" data-act="v38-team" data-k="${k}">
          <img src="${img(p.img)}" alt=""><span><b>${p.name}</b><small>${p.spec} · ${star(p.rating, 11)}</small></span>${icon('chevRight', 17, 2.2)}</button>`; }).join('')}</div>`;
    return `<p class="v38-intro">DHA-licensed doctors who come to your home, hotel or office. Pick one, or book a visit and we’ll send the first available.</p>
      ${chips}<div class="v38-count">${L.length} ${L.length === 1 ? 'doctor' : 'doctors'}</div>${L.length ? cards : none}${team}`;
  }
  F.SCREENS.doctors = {
    status: 'dark', cls: 'v38-docs',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Doctors</span><span style="width:40px"></span></div>
        <div class="scr-body" data-s="body"></div>`;
    },
    update(n) { setHTML(n.querySelector('[data-s="body"]'), listHTML()); },
  };

  /* ---------- Doctor profile ---------- */
  const selOf = k => (S.v38sel && S.v38sel.k === k) ? S.v38sel : next(k);
  function profileHTML(k) {
    const p = P(k), d = DOCS[k], sel = selOf(k), rv = C.REVIEWS[p.rv] || C.REVIEWS.doc, [nl, tone] = nextLine(k);
    const di = S.v38day && S.v38day.k === k ? S.v38day.i : sel ? sel.i : 0, times = slots(k, di);
    const days = d.days.map((_, i) => { const n = slots(k, i).length; return `<button class="v38-day ${i === di ? 'on' : ''} ${n ? '' : 'off'}" type="button" data-act="v38-day" data-k="${k}" data-i="${i}">
        <b>${dayName(i)}</b><small>${dayDate(i)}</small><i>${n ? `${n} free` : 'Full'}</i></button>`; }).join('');
    const nx = next(k);
    const timeHTML = times.length
      ? `<div class="v38-times">${times.map(h => `<button class="v38-time ${sel && sel.i === di && sel.h === h ? 'on' : ''}" type="button" data-act="v38-time" data-k="${k}" data-i="${di}" data-h="${h}">${win(h)}</button>`).join('')}</div>`
      : `<div class="v38-full">${icon('calendar', 16, 2)}<span>${d.female ? 'She has' : 'He has'} no free visits this day.</span>${nx ? `<button class="link" type="button" data-act="v38-day" data-k="${k}" data-i="${nx.i}">${dayName(nx.i)}, ${nx.h === 'now' ? 'now' : at(nx.h)}</button>` : ''}</div>`;
    return `<div class="v38-hero"><img src="${img(p.img)}" alt=""><span class="v38-live ${tone}"><i></i>${nl}</span></div>
      <h1 class="v38-name">${p.name}</h1>
      <div class="v38-spec">${p.spec} · ${d.who}</div>
      <div class="v38-lic">${icon('shieldCheck', 14, 2.2)}<span>DHA licensed · ${p.lic}</span></div>
      <div class="v38-stats"><div><b>${star(p.rating, 14)}</b><span>${p.reviews} reviews</span></div><div><b>${p.stats[1][0]}</b><span>Experience</span></div><div><b>${p.stats[0][0]}</b><span>Patients</span></div></div>

      <div class="sec-h v38-sech"><h4>Book a home visit</h4><span class="v38-secx">Arrival windows</span></div>
      <div class="v38-days">${days}</div>
      ${timeHTML}
      <p class="v38-note">${icon('clock', 14, 2.2)}<span>Pick when ${first(k)} arrives. We message you when ${d.female ? 'she' : 'he'}’s on the way.</span></p>

      <div class="sec-h v38-sech"><h4>About</h4></div>
      <p class="v38-about ${S.v38about ? 'open' : ''}">${p.about}</p>
      <button class="link v38-more" type="button" data-act="v38-about">${S.v38about ? 'Show less' : 'Read more'}</button>

      <div class="sec-h v38-sech"><h4>Often helps with</h4></div>
      <div class="v38-treats">${d.treats.map(t => `<span class="v38-tag lg">${esc(t)}</span>`).join('')}</div>

      <div class="sec-h v38-sech"><h4>Visits with ${first(k)}</h4></div>
      <div class="v38-svcs">${d.svc.map(id => { const s = svcOf(id); return `<button class="v38-svc" type="button" data-act="v38-book" data-k="${k}" data-svc="${id}">
          <span class="tile">${icon(SVCIC[id] || 'stetho', 19, 2)}</span><span class="v38-svc-t"><b>${esc(s.name)}</b><small>${esc(s.dur || '')}</small></span>
          <span class="v38-svc-p"><small>from</small><b>${aed(s.price)}</b></span>${icon('chevRight', 17, 2.2)}</button>`; }).join('')}</div>

      <div class="sec-h v38-sech"><h4>Credentials</h4></div>
      <div class="v38-cred">
        <div><span>DHA licence</span><b>${p.lic}</b></div>
        <div><span>Qualifications</span><b>${p.quals}</b></div>
        <div><span>Languages</span><b>${p.langs.join(', ')}</b></div>
        <div><span>With FRH since</span><b>${d.since}</b></div>
      </div>

      <div class="sec-h v38-sech"><h4>Reviews</h4><span class="v38-secx">${star(p.rating, 12)} · ${p.reviews}</span></div>
      <div class="v38-revs">${rv.map(r => `<div class="t-rev"><div class="t-rev-top">${C.av(r.n)}<span class="t-rev-n"><b>${r.n}</b><small>${r.d}</small></span>${C.stars(r.s, 13)}</div><p>${r.t}</p></div>`).join('')}</div>`;
  }
  function footHTML(k) {
    const sel = selOf(k), s = svcOf(DOCS[k].main);
    return `<div class="v38-fsum"><small>Home visit · from ${aed(s.price)}</small><b>${sel ? `${dayName(sel.i)}, ${win(sel.h)}` : 'No free visits this week'}</b></div>
      <button class="v38-fbtn" type="button" data-act="v38-book" data-k="${k}"${sel ? '' : ' disabled'}>Book visit</button>`;
  }
  F.SCREENS.doctor = {
    status: 'dark', cls: 'v38-doc',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title"></span><button class="nav-btn" type="button" data-act="v38-share" aria-label="Share">${icon('share', 18, 2)}</button></div>
        <div class="scr-body" data-s="body"></div><div class="scr-foot v38-foot" data-s="foot"></div>`;
    },
    update(n) {
      const k = DOCS[S.v38doc] ? S.v38doc : 'layla';
      setHTML(n.querySelector('[data-s="body"]'), profileHTML(k));
      setHTML(n.querySelector('[data-s="foot"]'), footHTML(k));
    },
  };

  /* ---------- the requested doctor on the service page ---------- */
  function reqStrip(n) {
    const r = S.v38req, sum = n.querySelector('[data-r="sum"]');
    let el = n.querySelector('.v38-req-w');
    const show = r && DOCS[r.k] && DOCS[r.k].svc.includes(S.svc) && sum;
    if (!show) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'v38-req-w'; sum.after(el); }
    const p = P(r.k), d = DOCS[r.k];
    setHTML(el, `<div class="v38-req"><img src="${img(p.img)}" alt="">
        <span class="v38-req-t"><small>Requested doctor</small><b>${p.name}</b><em>${r.h != null ? `${dayName(r.i)}, ${win(r.h)}` : 'First free time'}</em></span>
        <button class="v38-req-c" type="button" data-act="v38-doc" data-k="${r.k}">Change</button>
        <button class="v38-req-x" type="button" data-act="v38-unreq" aria-label="Remove requested doctor">${icon('x', 15, 2.4)}</button></div>
      <p class="v38-req-n">We ask ${first(r.k)} first. If ${d.female ? 'she' : 'he'} can’t make it, another ${d.noun} comes and we tell you straight away.</p>`);
  }
  const svc = F.SCREENS.service;
  if (svc) { const u0 = svc.update; svc.update = function (n) { const out = u0 ? u0.apply(this, arguments) : undefined; reqStrip(n); return out; }; }

  /* ---------- Home: Our doctors ---------- */
  const home = F.SCREENS.home;
  if (home) {
    const u0 = home.update;
    home.update = function (n) {
      const out = u0 ? u0.apply(this, arguments) : undefined;
      const after = n.querySelector('.hx-visits-w');
      if (after) {
        let w = n.querySelector('.v38-home-w');
        if (!w) { w = document.createElement('div'); w.className = 'v38-home-w'; after.after(w); }
        setHTML(w, `<div class="sec v38-hsec"><div class="sec-h"><h4>Our doctors</h4><button class="link" type="button" data-act="v38-all">See all</button></div>
          <div class="v38-rail">${ORDER.map(k => { const p = P(k), [nl, tone] = nextLine(k); return `<button class="v38-rc" type="button" data-act="v38-doc" data-k="${k}">
              <span class="v38-rc-img"><img src="${img(p.img)}" alt=""></span><b>${p.name}</b><small>${p.spec}</small>
              <span class="v38-rc-av ${tone}"><i></i>${railWhen(k)}</span></button>`; }).join('')}</div></div>`);
      }
      return out;
    };
  }

  /* ---------- actions ---------- */
  const book = (k, svcId) => {
    const sel = selOf(k);
    S.v38req = { k, i: sel ? sel.i : 0, h: sel ? sel.h : null };
    F.ACT['open-svc']({ dataset: { id: svcId || DOCS[k].main } });
  };
  Object.assign(F.ACT, {
    'v38-all': () => { S.v38f = 'all'; F.go('doctors'); },
    'v38-f': el => { S.v38f = el.dataset.f; F.upd(); },
    'v38-doc': el => { const k = el.dataset.k; if (S.v38doc !== k) { S.v38sel = null; S.v38day = null; S.v38about = false; } S.v38doc = k; F.go('doctor'); },
    'v38-team': el => { S.tDoc = el.dataset.k; F.go('t-doc'); },
    'v38-day': el => { const k = el.dataset.k, i = +el.dataset.i, s = slots(k, i); S.v38day = { k, i }; if (s.length) S.v38sel = { k, i, h: s[0] }; F.upd(); },
    'v38-time': el => { const h = el.dataset.h === 'now' ? 'now' : +el.dataset.h, k = el.dataset.k, i = +el.dataset.i; S.v38sel = { k, i, h }; S.v38day = { k, i }; F.upd(); },
    'v38-about': () => { S.v38about = !S.v38about; F.upd(); },
    'v38-book': (el, e) => { if (e) e.stopPropagation(); book(el.dataset.k, el.dataset.svc); },
    'v38-unreq': () => { S.v38req = null; F.upd(); F.toast('We’ll send the first available doctor', 'check'); },
    'v38-share': () => F.toast('Profile link copied', 'copy'),
  });

  /* panel presets */
  F.v38 = {
    list: f => { S.v38f = f || 'all'; F.go('doctors', { dir: 'fade' }); },
    profile: k => { S.v38doc = k; S.v38sel = null; S.v38day = null; S.v38about = false; F.go('doctor', { dir: 'fade' }); },
    booked: k => { S.v38doc = k; S.v38sel = null; S.v38day = null; book(k); },
  };
})();
