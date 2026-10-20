/* FRH final — Home, the search overlay, Notifications and the services lists
   (Medical services + one service's list). Decisions H1–H34 in spec/final-decisions.js;
   the IDs survive only as comments. Loaded after the original screen files, so these win.

   Contracts used (all guarded, checked at call time):
     F.openAppt(id) · F.openReport(id) · F.openRx(id) · F.openAddressForm({ctx}) · F.cartCount()
     F.sCartTotal() · F.openDirectChat(k, bookingId) · F.A_CITIES (city sync for the cart)
   Contracts offered:
     F.visitAddress()        → the saved address the Home header shows (PD.addresses item)
     F.setVisitAddress(id)   → switch it (also syncs S.aCity / S.city for the cart's area check)
     F.openSearch()          → open the search overlay over the current screen
     F.HXDATA.was            → strike-through prices, F.HXDATA.inc → “what’s included” lines
     F.hx.jump(viewId)       → presenter-panel setups for this area (see VIEWS at the bottom) */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK, PD = window.FRHPROFILE || {};
  const img = n => `assets/img/${n}`;
  const esc = s => F.esc(s);
  const money = n => { n = Math.round(n * 100) / 100; return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const aed = n => 'AED ' + money(n);
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const has = id => !!F.SCREENS[id];
  const prevId = () => { const c = F.cur(); return c ? c.dataset.id : null; };
  const live = () => S.open;

  /* extra line icons, same 24 grid and stroke as icons.js */
  const XP = {
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3V7"/><path d="M6 7l.9 12.2c.1 1 .9 1.8 1.9 1.8h6.4c1 0 1.8-.8 1.9-1.8L18 7"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    fill: '<path d="M17 17 7 7"/><path d="M7 15V7h8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5C9 4.7 9.7 4 10.5 4h3c.8 0 1.5.7 1.5 1.5V7"/><path d="M3 12.5h18"/>',
    tooth: '<path d="M12 5.6c-1.6-1.4-3.6-2-5.2-1.2C4.6 5.5 4.2 8.3 5 11c.6 2 .9 3.8 1.2 6 .3 2.2 1.1 3.5 2.1 3.5 1.2 0 1.5-1.5 1.8-3.3.2-1.2.6-2.2 1.9-2.2s1.7 1 1.9 2.2c.3 1.8.6 3.3 1.8 3.3 1 0 1.8-1.3 2.1-3.5.3-2.2.6-4 1.2-6 .8-2.7.4-5.5-1.8-6.6-1.6-.8-3.6-.2-5.2 1.2z"/>',
    apple: '<path d="M12 8c-1.8-1.5-5.4-1.7-6.9 1-1.6 2.9-.5 7.2 1.7 9.8 1.3 1.6 2.8 2.1 4 1.5.8-.4 1.6-.4 2.4 0 1.2.6 2.7.1 4-1.5 2.2-2.6 3.3-6.9 1.7-9.8-1.5-2.7-5.1-2.5-6.9-1z"/><path d="M12 8c0-2 .9-3.6 2.8-4.6"/>',
    plaster: '<rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8" transform="rotate(-45 12 12)"/><path d="M10.6 10.6h.01M13.4 13.4h.01M10.6 13.4h.01M13.4 10.6h.01"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="17" rx="2.5"/><path d="M9 4.5v-.6C9 3.1 9.6 2.5 10.4 2.5h3.2c.8 0 1.4.6 1.4 1.4v.6"/><path d="M12 10v6M9 13h6"/>',
  };
  const xi = (name, size = 20, sw = 1.8) => XP[name]
    ? `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XP[name]}</svg>`
    : icon(name, size, sw);

  /* ---------------- catalogue lookups ---------------- */
  const catOf = k => B.categories.find(c => c.key === k) || { key: k, name: 'Services', icon: 'stetho' };
  const CAT_IC = { dentist: 'tooth', nutrition: 'apple', nursing: 'plaster', checkup: 'clipboard' };
  const catIc = k => CAT_IC[k] || catOf(k).icon;
  const allSvcs = () => Object.keys(B.subcats).flatMap(k => B.subcats[k].map(s => ({ ...s, cat: k })));
  const findSvc = id => allSvcs().find(s => s.id === id);

  /* ---------------- area content (placeholders, same status as data-book.js) ---------------- */
  const HX = {
    grid: ['lab', 'iv', 'physio', 'nursing', 'checkup', 'vaccine', 'dentist', 'nutrition'],      /* H10: 4×2 */
    short: { doctor: 'Doctor', ambulance: 'Ambulance', lab: 'Lab tests', iv: 'IV therapy', physio: 'Physio', nursing: 'Nursing', checkup: 'Check-ups', vaccine: 'Vaccines', dentist: 'Dentist', nutrition: 'Nutrition' },
    live: ['Dubai', 'Sharjah'],
    soonBy: { Dubai: ['nutrition'], Sharjah: ['nutrition', 'dentist'] },                            /* H25 */
    meta: {
      doctor: 'At your door in ~45 min', iv: '45 min – 3 hrs at home', lab: 'Results in 6–48 hrs',
      physio: '45–60 min sessions', dentist: '30–45 min at home', nutrition: '45 min consultation', checkup: '30–90 min at home',
      ambulance: 'Quoted on the call', vaccine: '15–20 min', nursing: '4 or 12 hour shifts',
    },
    noun: { lab: ['test', 'tests'], vaccine: ['vaccine', 'vaccines'], nursing: ['shift', 'shifts'], checkup: ['package', 'packages'] },
    was: { pcr: 120, stdbasic: 750, immune: 530, basic: 650, shift4: 300 },                         /* H30 */
    inc: {                                                                                         /* H29 */
      gp: 'Consultation, vitals check and a prescription if needed',
      peds: 'Child consultation, growth and vitals check',
      night: 'Consultation after 10 PM, prescription if needed',
      tele: 'Video call with a GP and an e-prescription',
      pcr: 'SARS-CoV-2 RT-PCR · nasal swab at home',
      cbc: 'Haemoglobin, white cells, platelets + 20 markers',
      vitd: 'Vitamin D (25-OH) and Vitamin B12',
      stdbasic: 'HIV, Hepatitis B & C, Syphilis, Chlamydia',
      stdfull: '10 tests incl. HIV, Hepatitis B & C, Gonorrhoea, HPV',
      expcr: 'SARS-CoV-2 RT-PCR · priority lab run',
      nad: 'NAD+ infusion, 250–750 mg, given by a nurse',
      immune: 'Vitamin C, zinc and B-complex',
      hydra: 'Electrolytes, B12 and 1 L saline',
      basic: '28 lab markers + a doctor review',
      family: 'Full panel for 4 people in one visit',
      scaling: 'Scaling, polishing and a dental exam',
      dcheck: 'Dental exam and a treatment plan',
      nutri: 'Diet review, plan sent in the app',
      flu: 'Seasonal flu jab, adults and children',
      travel: 'Travel vaccines with a certificate',
      shift4: 'DHA-licensed nurse for 4 hours',
      shift12: 'Day or night nursing cover',
      ortho: 'Assessment and a guided exercise session',
      post: '6 rehab sessions after surgery',
      amb: 'Private transfer · call 998 in an emergency',
    },
    /* search words people actually type (symptoms, short names) */
    kw: {
      doctor: 'gp doctor physician home visit', iv: 'drip drips infusion vitamin', lab: 'blood test tests sample',
      physio: 'physio rehab back knee pain injury sports', dentist: 'teeth tooth dental', nutrition: 'diet dietitian weight food',
      checkup: 'check checkup screening annual package', ambulance: 'emergency transfer 998', vaccine: 'vaccine vaccination jab shot immunisation',
      nursing: 'nurse elderly wound injection care',
      gp: 'gp fever cough cold flu sick infection headache stomach doctor', peds: 'child children kid kids baby infant paediatric pediatric fever',
      night: 'night late evening urgent fever', tele: 'video online call virtual remote teleconsultation',
      pcr: 'covid corona swab travel', expcr: 'covid corona swab fast urgent travel', cbc: 'blood cbc anaemia anemia haemoglobin',
      vitd: 'vitamin d b12 tired fatigue deficiency blood', stdbasic: 'std sti hiv hepatitis sexual', stdfull: 'std sti hiv hepatitis sexual',
      nad: 'nad energy', immune: 'immunity immune vitamin c zinc drip', hydra: 'hydration dehydration hangover electrolytes drip',
      basic: 'checkup blood screening', family: 'family checkup', scaling: 'teeth cleaning', dcheck: 'teeth dental',
      flu: 'flu influenza jab', travel: 'travel jab', shift4: 'nurse', shift12: 'nurse night', ortho: 'back knee joint',
      post: 'surgery rehab', nutri: 'diet weight',
    },
    promoCat: ['checkup', 'nursing', 'lab'],
    popular: ['Doctor on Call', 'Full blood count', 'IV drip', 'PCR test', 'Flu vaccine'],
    recent: ['Blood test', 'Vitamin D', 'Physiotherapy'],
    /* H20 types = the Notification settings categories */
    ntypes: {
      book: { label: 'Bookings', ic: 'calendar', tint: '' },
      team: { label: 'Care team', ic: 'stetho', tint: 'blue' },
      chg: { label: 'Changes', ic: 'refresh', tint: 'p-amber' },
      rec: { label: 'Records', ic: 'file', tint: 'violet' },
      off: { label: 'Offers', ic: 'sparkle', tint: 'p-teal' },
    },
    notifs: [
      { id: 'n1', g: 'Today', t: 'team', title: 'Dr. Layla Haddad is on the way', body: 'Arriving 5:24 – 5:38 PM at Villa 24, Al Barsha 1.', time: '5:12 PM', unread: true, to: ['appt', 'FRH-24817'] },
      { id: 'n2', g: 'Today', t: 'team', title: 'New message from Dr. Layla Haddad', body: 'Please keep Fatima’s recent blood pressure readings to hand.', time: '4:48 PM', unread: true, to: ['chat', 'FRH-24817'] },
      { id: 'n3', g: 'Today', t: 'book', title: 'Payment received · AED 420', body: 'Doctor on Call today, paid with the Visa ending 4242.', time: '3:02 PM', unread: false, to: ['appt', 'FRH-24817'] },
      { id: 'n4', g: 'Earlier', t: 'chg', title: 'Physiotherapy moved to 10:00 AM', body: 'Fatima’s session 2 of 6 is now Thu 1 Oct, 10:00 – 11:00 AM.', time: 'Yesterday', unread: true, to: ['appt', 'FRH-24790'] },
      { id: 'n5', g: 'Earlier', t: 'off', title: 'AED 500 off health packages', body: 'Use FRH500 on the Family package for 4 people.', time: 'Fri 25 Sep', unread: false, to: ['cat', 'checkup'] },
      { id: 'n6', g: 'Earlier', t: 'rec', title: 'Blood panel results are ready', body: 'From your IV Therapy visit, reviewed by Dr. Layla Haddad.', time: 'Wed 3 Sep', unread: false, to: ['report', 'sep'] },
      { id: 'n7', g: 'Earlier', t: 'rec', title: 'E-prescription added', body: 'Vitamin D3 and oral rehydration salts from your 2 Sep visit.', time: 'Tue 2 Sep', unread: false, to: ['rx', 'FRH-24512'] },
      { id: 'n8', g: 'Earlier', t: 'chg', title: 'Refund sent · AED 400', body: 'Your cancelled Dentist at Home visit went back to your Visa.', time: 'Tue 2 Sep', unread: false, to: ['appt', 'FRH-24201'] },
    ],
  };
  F.HXDATA = HX;
  const inc = s => HX.inc[s.id] || s.lab || '';

  const SOON_SVG = `<svg viewBox="0 0 260 160" aria-hidden="true">
      <circle cx="130" cy="78" r="60" fill="#FFF4F3"/>
      <path d="M26 128C62 120 70 72 108 76" fill="none" stroke="#FFC9C4" stroke-width="3" stroke-dasharray="5 8" stroke-linecap="round"/>
      <rect x="186" y="80" width="26" height="56" rx="7" fill="#EFE0DC"/><rect x="152" y="98" width="28" height="38" rx="7" fill="#F3E4E1"/>
      <rect x="46" y="108" width="28" height="28" rx="7" fill="#F3E4E1"/><rect x="80" y="118" width="22" height="18" rx="6" fill="#EFE0DC"/>
      <rect x="34" y="134" width="192" height="7" rx="3.5" fill="#F3E4E1"/>
      <path d="M130 30c-14.4 0-26 11.6-26 26 0 19 26 44 26 44s26-25 26-44c0-14.4-11.6-26-26-26z" fill="#D71F32"/>
      <circle cx="130" cy="56" r="11.5" fill="#FFF4F3"/>
      <rect x="127.9" y="49.6" width="4.2" height="12.8" rx="2.1" fill="#D71F32"/><rect x="123.6" y="53.9" width="12.8" height="4.2" rx="2.1" fill="#D71F32"/>
      <path d="m200 40 2.8 6.8 6.8 2.8-6.8 2.8-2.8 6.8-2.8-6.8-6.8-2.8 6.8-2.8z" fill="#FFC9C4"/><circle cx="62" cy="56" r="4.5" fill="#FFC9C4"/>
    </svg>`;
  const NORES_SVG = `<svg viewBox="0 0 220 130" aria-hidden="true">
      <circle cx="110" cy="62" r="54" fill="#FFF4F3"/>
      <rect x="38" y="114" width="144" height="6" rx="3" fill="#F3E4E1"/>
      <circle cx="102" cy="56" r="27" fill="#fff" stroke="#D71F32" stroke-width="7"/>
      <path d="M122 76l20 20" stroke="#D71F32" stroke-width="10" stroke-linecap="round"/>
      <path d="M93 47l18 18M111 47 93 65" stroke="#FFB0A8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="164" cy="34" r="4.5" fill="#FFC9C4"/><circle cx="56" cy="40" r="3.5" fill="#EAD9D5"/>
      <path d="m168 74 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFC9C4"/>
    </svg>`;
  const BELL_SVG = `<svg viewBox="0 0 220 130" aria-hidden="true">
      <circle cx="110" cy="64" r="54" fill="#FFF4F3"/>
      <rect x="38" y="116" width="144" height="6" rx="3" fill="#F3E4E1"/>
      <path d="M110 30c-17 0-29 13-29 30v17l-8 12h74l-8-12V60c0-17-12-30-29-30z" fill="#fff" stroke="#D71F32" stroke-width="6" stroke-linejoin="round"/>
      <path d="M100 96a10 10 0 0 0 20 0" fill="none" stroke="#D71F32" stroke-width="6" stroke-linecap="round"/>
      <path d="M150 38c5 4 8 10 8 17M70 38c-5 4-8 10-8 17" fill="none" stroke="#FFC9C4" stroke-width="4" stroke-linecap="round"/>
      <circle cx="166" cy="30" r="4.5" fill="#FFC9C4"/><circle cx="52" cy="84" r="3.5" fill="#EAD9D5"/>
    </svg>`;

  /* =====================================================================
     VISIT ADDRESS (H1 rejected → the header is the address, the city is implied)
     ===================================================================== */
  const addrs = () => PD.addresses || [];
  const cityOf = a => {
    if (!a) return (typeof S.city === 'string' && S.city) || 'Dubai';
    const m = /(Dubai|Sharjah|Abu Dhabi|Al Ain|Ras Al Khaimah|Ajman|Fujairah|Umm Al Quwain)\s*$/i.exec(a.line || '');
    return m ? m[1].replace(/\b\w/g, c => c.toUpperCase()) : 'Dubai';
  };
  function visitAddress() {
    const L = addrs();
    let a = L.find(x => x.id === S.visitAddr);
    if (!a && S.aCity && F.A_CITIES) {                      /* a city chosen at sign-up wins over the default */
      const c = F.A_CITIES.find(x => x.k === S.aCity);
      a = c && L.find(x => cityOf(x) === c.n);
    }
    return a || L.find(x => x.dflt) || L[0] || null;
  }
  const syncCity = a => {
    const c = F.A_CITIES && F.A_CITIES.find(x => x.n === cityOf(a));
    if (c) { S.aCity = c.k; S.city = c.n; }
  };
  F.visitAddress = visitAddress;
  F.setVisitAddress = id => { const a = addrs().find(x => x.id === id); if (!a) return false; S.visitAddr = a.id; syncCity(a); return true; };
  const city = () => cityOf(visitAddress());
  const street = a => (a ? a.line.replace(/,\s*(Dubai|Sharjah|Abu Dhabi|Al Ain|Ras Al Khaimah|Ajman|Fujairah|Umm Al Quwain)\s*$/i, '') : '');
  const addrIc = a => (a && (a.type === 'work' || /office|work/i.test(a.label)) ? 'briefcase' : a && (a.type === 'home' || /home|place/i.test(a.label)) ? 'home' : 'pin');
  const soonList = () => HX.live.includes(city()) ? (HX.soonBy[city()] || []) : B.categories.map(c => c.key).filter(k => k !== 'doctor');
  const isSoon = k => soonList().includes(k);

  /* a new address saved from the picker becomes the visit address */
  function adoptNewAddress() {
    if (S.hxAddrBase == null) return;
    const L = addrs();
    if (L.length > S.hxAddrBase) {
      const a = L[L.length - 1];
      S.visitAddr = a.id; syncCity(a);
      const from = S.screen;
      setTimeout(() => { if (live() && S.screen === from) F.toast(`Visits now go to ${a.label}`, 'pin'); }, 450);
    }
    S.hxAddrBase = null;
  }

  F.SHEETS['hx-addr'] = () => {
    const cur = visitAddress();
    return `<div class="sheet hx-asheet" role="dialog" aria-label="Choose the visit address"><div class="grab"></div>
        <h2>Where should we visit?</h2>
        <p>Your care team comes to this address. Prices and services follow it.</p>
        <div class="hx-alist">${addrs().map(a => `
          <button class="hx-arow ${cur && cur.id === a.id ? 'on' : ''}" type="button" data-act="hx-addr-pick" data-id="${a.id}">
            <span class="tile">${xi(addrIc(a), 18, 2)}</span>
            <span class="hx-amid"><b>${esc(a.label)}${a.dflt ? ' <span class="pill ink">Default</span>' : ''}</b><small>${esc(a.line)}</small></span>
            <span class="radio"></span></button>`).join('')}
          <button class="hx-arow add" type="button" data-act="hx-addr-add"><span class="tile">${icon('plus', 18, 2.4)}</span>
            <span class="hx-amid"><b>Add new address</b><small>Drop a pin or search for a building</small></span>${icon('chevRight', 18, 2.2)}</button>
        </div></div>`;
  };

  /* =====================================================================
     HOME
     ===================================================================== */
  const unreadN = () => (S.guest ? [] : HX.notifs).filter(n => n.unread && !(S.hxRead || {})[n.id]).length;

  function header() {
    const g = S.guest, a = visitAddress(), c = F.cartCount ? F.cartCount() : 0, un = unreadN();
    /* v16: no address switcher and no search on Home (address is set at sign-up and changed in Account or the cart;
       search lives in the Services tab). Greeting left, Ask anything and alerts right. */
    return `<div class="hx-hdr v16-hdr">
        <h1 class="hx-greet">${g ? '<small>Welcome to</small>FRH' : `<small>${F.greeting()},</small>${esc(F.firstName())}`}</h1>
        <div class="hx-acts">
          <button class="v15-ask" type="button" data-act="v15-ask">${icon('sparkle', 15, 2.2)}<span>Ask anything</span></button>
          <button class="icon-btn" type="button" data-act="goto" data-id="notifs" aria-label="Notifications${un ? `, ${un} unread` : ''}">${icon('bell', 19, 1.9)}${un ? '<i class="hx-bdot"></i>' : ''}</button>
        </div>
      </div>`;
  }

  const guestBar = () => S.guest
    ? '<div class="guest-bar" style="margin-top:14px"><p><b>You’re browsing as a guest</b>Sign in to book visits and keep your records.</p><button type="button" data-act="signin">Sign in</button></div>'
    : '';

  /* H6 rejected: Doctor on Call stays first · H7: service icon + Book now, photo kept */
  const hero = () => `<button class="h-hero hx-hero" type="button" data-act="open-cat" data-k="doctor">
      <img class="h-hero-img" src="${img('doctor.jpg')}" alt="">
      <span class="h-hero-in">
        <span class="hx-hero-top"><span class="hx-hero-ic">${icon('stetho', 18, 2)}</span><span class="pill hero-pill"><i></i>Available now</span></span>
        <b>Doctor on Call</b>
        <span class="sub">A DHA-licensed doctor at your door in about 45 minutes, day or night.</span>
        <span class="h-hero-cta">Book now ${icon('arrowRight', 16, 2.4)}</span>
      </span></button>`;

  /* H8: compact card that starts the video-consult booking (the duplicate opened service ‘tele’) */
  function tele() {
    const s = findSvc('tele') || { price: 99 };
    return `<button class="hx-tele" type="button" data-act="open-svc" data-id="tele">
        <span class="tile blue">${icon('video', 20, 2)}</span>
        <span class="hx-tele-mid"><b>Teleconsultation <span class="pill green live"><i></i>Online</span></b><small>See a GP on video in about 15 min</small></span>
        <span class="hx-tele-end"><small>from</small><b>${aed(s.price)}</b></span>${icon('chevRight', 17, 2.2)}</button>`;
  }

  /* H10 rejected → 4×2 icon grid · H25 “Soon” where the service is not live */
  const grid = () => `<div class="sec"><div class="sec-h"><h4>Our services</h4>
      <button class="link" type="button" data-act="goto" data-id="cats">View all</button></div>
      <div class="h-svc-grid hx-grid">${HX.grid.map(k => {
        const off = isSoon(k);
        return `<button class="h-svc ${off ? 'hx-off' : ''}" type="button" data-act="open-cat" data-k="${k}"${off ? ` aria-label="${catOf(k).name}, coming soon"` : ''}>
          <span class="tile">${xi(catIc(k), 22, 1.9)}${off ? '<i class="hx-soon-tag">Soon</i>' : ''}</span><span>${HX.short[k] || catOf(k).name}</span></button>`;
      }).join('')}</div></div>`;

  /* H11 adapted: the live visit gets the tracking box, one other booking = a full-width card, 2+ = a rail */
  const LIVE = { onway: 'On the way', arrived: 'Your team has arrived', treating: 'Treatment in progress' };
  const trackOf = a => (S.tTrack && S.tTrack[a.id]) || (a.tracking ? 'onway' : null);
  const firstNames = a => (a.patients || []).map(p => p.replace(/\s*\(.*\)/, '').split(' ')[0]);
  function liveBox(a) {
    const st = trackOf(a), t = D.tracking || {}, lead = a.id === t.id && t.team ? t.team[0] : null;
    const pct = { onway: 62, arrived: 84, treating: 94 }[st] || 50;
    const when = st === 'onway' ? `arriving ${t.eta || 'soon'}` : st === 'arrived' ? 'at your door now' : 'with you now';
    return `<button class="h-live hx-live" type="button" data-act="hx-appt" data-id="${a.id}">
        <span class="h-live-av">${lead ? `<img src="${img(lead.img)}" alt="">` : `<span class="hx-live-ini">${icon('stetho', 20, 2)}</span>`}<i></i></span>
        <span class="h-live-t"><span class="h-live-status"><i></i>${LIVE[st]}</span>
          <b>${lead ? lead.name : esc(a.team || 'Your care team')}</b>
          <small>${esc(a.service)} · ${when}</small></span>
        ${icon('chevRight', 18, 2.4)}<span class="h-live-bar"><i style="width:${pct}%"></i></span></button>`;
  }
  const MON = d => d.toLocaleDateString('en-US', { month: 'short' });
  function dateParts(s) {
    const m = /^(\w{3})\w*\s+(\d{1,2})\s+(\w{3})/.exec(s || '');
    if (m) return { top: m[1], day: m[2], mon: m[3] };
    const now = new Date();
    if (/^today/i.test(s)) return { top: 'Today', day: now.getDate(), mon: MON(now) };
    if (/^tom/i.test(s)) { const d = new Date(Date.now() + 864e5); return { top: 'Tmrw', day: d.getDate(), mon: MON(d) }; }
    return { top: '', day: '·', mon: '' };
  }
  const svcIcon = name => /physio/i.test(name) ? 'physio' : /lab/i.test(name) ? 'lab' : /iv|drip/i.test(name) ? 'drip' : /nurs/i.test(name) ? 'plaster' : /dent/i.test(name) ? 'tooth' : /vacc/i.test(name) ? 'syringe' : /tele|video/i.test(name) ? 'video' : 'stetho';
  function visitCard(a, rail) {
    const d = dateParts(a.date), ok = /confirm/i.test(a.statusLabel || 'Confirmed');
    return `<button class="hx-vcard ${rail ? 'rail' : ''}" type="button" data-act="hx-appt" data-id="${a.id}">
        <span class="hx-vdate"><small>${d.top}</small><b>${d.day}</b><small>${d.mon}</small></span>
        <span class="hx-vmid">
          <span class="hx-vtop"><b>${esc(a.service)}</b><span class="pill ${ok ? 'green' : 'amber'}">${esc(a.statusLabel || 'Confirmed')}</span></span>
          <span class="hx-vline">${icon('clock', 13, 2.2)}<span>${esc(a.time)}</span></span>
          <span class="hx-vline">${xi(svcIcon(a.service), 13, 2.2)}<span>${esc(firstNames(a).join(' & '))} · ${esc(String(a.address || '').split(' · ')[0])}</span></span>
        </span></button>`;
  }
  function visits() {
    if (S.guest) return '';
    const up = D.appointments.upcoming || [];
    const lv = up.filter(a => LIVE[trackOf(a)]), rest = up.filter(a => !LIVE[trackOf(a)]);
    if (!up.length) return '';
    return `<div class="sec hx-visits"><div class="sec-h"><h4>${up.length > 1 ? 'Upcoming visits' : 'Your next visit'}</h4>
        <button class="link" type="button" data-act="hx-appts">See all</button></div>
        ${lv.map(liveBox).join('')}
        ${rest.length === 1 ? visitCard(rest[0]) : rest.length ? `<div class="hrow hx-vrail">${rest.map(a => visitCard(a, true)).join('')}</div>` : ''}
      </div>`;
  }

  /* H6 rejected → one promo carousel, below the visits */
  const promos = () => `<div class="sec hx-promo"><div class="car"><div class="car-track">${D.banners.map((b, i) => `
      <div class="car-slide"><div class="car-card" data-act="open-cat" data-k="${HX.promoCat[i] || 'checkup'}" role="button" tabindex="0" aria-label="${esc(b.title)}"><img src="${img(b.img)}" alt="" draggable="false">
        <div class="car-txt"><span class="pill">${b.tag}</span><h3>${b.title}</h3><p>${b.sub}</p></div>
        <span class="car-go" aria-hidden="true">${icon('arrowRight', 17, 2.4)}</span>
      </div></div>`).join('')}</div>
      <div class="car-dots">${D.banners.map((_, i) => `<button type="button" data-act="car-dot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div></div></div>`;

  const trustLine = () => `<button class="h-trust" type="button" data-act="goto" data-id="${has('about') ? 'about' : 'policies'}">
      ${icon('shieldCheck', 18, 2)}<span><b>DHA-licensed clinicians</b>Secure payments · private medical records</span>${icon('chevRight', 17, 2.2)}</button>`;

  /* carousel: swipe, dots, gentle autoplay (paused while searching or dragging) */
  let carDrag = false, carIdle = 0;
  const carPos = n => {
    const track = n.querySelector('.car-track');
    if (!track) return;
    track.style.transform = `translateX(${-S.car * 100}%)`;
    n.querySelectorAll('.car-dots button').forEach((b, i) => b.classList.toggle('on', i === S.car));
  };
  function carMount(n) {
    const view = n.querySelector('.car'), track = n.querySelector('.car-track');
    if (!view) return;
    let x0 = null, dx = 0, moved = false;
    view.addEventListener('pointerdown', e => { if (e.button !== 0) return; x0 = e.clientX; dx = 0; moved = false; carDrag = true; track.classList.add('drag'); });
    view.addEventListener('pointermove', e => {
      if (x0 === null) return;
      dx = (e.clientX - x0) / F.scale;
      if (Math.abs(dx) > 6) moved = true;
      const edge = (S.car === 0 && dx > 0) || (S.car === D.banners.length - 1 && dx < 0) ? 0.3 : 1;
      track.style.transform = `translateX(calc(${-S.car * 100}% + ${dx * edge}px))`;
    });
    const end = () => {
      if (x0 === null) return;
      track.classList.remove('drag');
      if (dx < -50 && S.car < D.banners.length - 1) S.car++;
      else if (dx > 50 && S.car > 0) S.car--;
      x0 = null; carDrag = false; carIdle = 0; carPos(n);
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => view.addEventListener(t, end));
    view.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }

  let homePrev = null;
  const HOME = {
    status: 'dark', cls: 'home hx-home',
    render() {
      homePrev = prevId();
      S.car = S.car || 0;
      return `<div class="scr-body">
          <div class="hx-hdr-w"></div>
          ${guestBar()}
          ${hero()}
          ${tele()}
          <div class="hx-grid-w"></div>
          <div class="hx-visits-w"></div>
          ${promos()}
          ${trustLine()}
        </div>
        <div class="hx-sticky-w"></div>
        ${F.tabbar('home')}`;
    },
    mount(n) {
      adoptNewAddress();
      const a = visitAddress();
      if (a && !S.guest) syncCity(a);
      carMount(n);
      carIdle = 0;
      resume(n, 'home', homePrev);
    },
    update(n) {
      setHTML(n.querySelector('.hx-hdr-w'), header());
      setHTML(n.querySelector('.hx-grid-w'), grid());
      setHTML(n.querySelector('.hx-visits-w'), visits());
      setHTML(n.querySelector('.hx-sticky-w'), sticky());
      carPos(n);
      if (n.querySelector('.hx-so')) renderSO();
    },
    tick(n) {
      if (!n || carDrag || S.sheet || n.querySelector('.hx-so')) { carIdle = 0; return; }
      if (++carIdle < 6) return;
      carIdle = 0; S.car = (S.car + 1) % D.banners.length; carPos(n);
    },
  };
  F.SCREENS.home = HOME;
  /* the original Home wrapper (screens-home.js) routes ‘home-svc’ through open-cat; keep car-dot */
  F.ACT['car-dot'] = n => { S.car = +n.dataset.i; carIdle = 0; const c = F.cur(); if (c) carPos(c); };

  /* =====================================================================
     SEARCH OVERLAY (H5 adapted) — a layer inside the current screen, never a sheet,
     so the iOS keyboard can stay up. F.go('search') = Home with the overlay open.
     ===================================================================== */
  const SO = { host: null };
  const soRoot = () => (SO.host && SO.host.isConnected ? SO.host.querySelector('.hx-so') : null);
  const soOn = () => !!soRoot();
  const recents = () => (S.hxRecent = Array.isArray(S.hxRecent) ? S.hxRecent : HX.recent.slice());
  const addRecent = q => {
    q = String(q || '').trim(); if (!q) return;
    const L = recents().filter(x => x.toLowerCase() !== q.toLowerCase());
    L.unshift(q.charAt(0).toUpperCase() + q.slice(1)); S.hxRecent = L.slice(0, 6);
  };

  /* ---------- index + matching ---------- */
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = s => s.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
  let IDX = null;
  function index() {
    if (IDX) return IDX;
    const cats = B.categories.map(c => ({ kind: 'cat', id: c.key, name: c.name, w: words(`${c.name} ${HX.kw[c.key] || ''}`) }));
    const subs = allSvcs().map(s => ({ kind: 'svc', id: s.id, name: s.name, s, w: words(`${s.name} ${HX.kw[s.id] || ''} ${catOf(s.cat).name} ${inc(s)}`) }));
    return (IDX = { cats, subs });
  }
  function score(it, q) {
    const n = it.name.toLowerCase(), toks = words(q);
    if (!toks.length) return 0;
    if (n.startsWith(q)) return 100;
    if (new RegExp(`(^|[^a-z0-9])${reEsc(q)}`).test(n)) return 85;
    if (q.length > 2 && n.includes(q)) return 70;
    if (toks.every(t => it.w.some(w => w.startsWith(t)))) return toks.every(t => words(n).some(w => w.startsWith(t))) ? 60 : 40;
    return 0;
  }
  function search(raw) {
    const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    const run = L => L.map(it => ({ it, sc: score(it, q) })).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).map(x => x.it);
    const I = index();
    return { cats: run(I.cats).slice(0, 3), subs: run(I.subs).slice(0, 6) };
  }
  /* bold the matched text: the whole query if it appears at a word start, else each word */
  function hl(name, raw) {
    const q = raw.trim().toLowerCase(), lo = name.toLowerCase(), mark = new Array(name.length).fill(false);
    const paint = (i, len) => { for (let j = i; j < i + len && j < name.length; j++) mark[j] = true; };
    const at = s => { const m = new RegExp(`(^|[^a-z0-9])${reEsc(s)}`).exec(lo); return m ? m.index + m[1].length : -1; };
    let i = q ? at(q) : -1;
    if (i < 0 && q.length > 2) i = lo.indexOf(q);
    if (i >= 0) paint(i, q.length);
    else words(q).forEach(t => { const k = at(t); if (k >= 0) paint(k, t.length); });
    let out = '', on = false;
    for (let j = 0; j < name.length; j++) {
      if (mark[j] !== on) { out += mark[j] ? '<mark>' : '</mark>'; on = mark[j]; }
      out += esc(name[j]);
    }
    return out + (on ? '</mark>' : '');
  }

  /* ---------- markup ---------- */
  const soShell = () => `<div class="hx-so-bg" data-act="hx-s-close"></div>
      <div class="hx-so-panel" role="dialog" aria-label="Search">
        <div class="hx-so-bar">
          <div class="hx-so-field" data-act="hx-s-focus" role="searchbox" aria-label="Search services, tests or symptoms">
            <span class="hx-so-ic">${icon('search', 18, 2.2)}</span><span class="hx-so-txt"></span><span class="hx-so-xw"></span></div>
          <button class="hx-so-cancel" type="button" data-act="hx-s-close">Cancel</button>
        </div>
        <div class="hx-so-body"></div>
      </div>`;
  const chipsPopular = () => `<div class="hx-chips">${HX.popular.map(p => `<button class="hx-chip pop" type="button" data-act="hx-s-q" data-q="${esc(p)}">${xi('trend', 14, 2.2)}<span>${esc(p)}</span></button>`).join('')}</div>`;
  function idleHTML() {
    const R = recents();
    const head = S.hxClearAsk
      ? `<div class="hx-so-h ask"><h5>Clear all recent searches?</h5><span class="hx-ask"><button type="button" class="hx-ask-no" data-act="hx-s-clear-no">Cancel</button><button type="button" class="hx-ask-yes" data-act="hx-s-clear-yes">Clear</button></span></div>`
      : `<div class="hx-so-h"><h5>Recent searches</h5><button class="hx-so-clr" type="button" data-act="hx-s-clear-ask">${xi('trash', 14, 2.1)}Clear</button></div>`;
    return `${R.length ? `<section class="hx-so-sec">${head}
        <div class="hx-chips">${R.map(r => `<span class="hx-chip rec"><button type="button" data-act="hx-s-q" data-q="${esc(r)}">${icon('clock', 14, 2.2)}<span>${esc(r)}</span></button><button class="x" type="button" data-act="hx-s-rm" data-q="${esc(r)}" aria-label="Remove ${esc(r)}">${icon('x', 12, 2.6)}</button></span>`).join('')}</div></section>` : ''}
      <section class="hx-so-sec"><div class="hx-so-h"><h5>Popular services</h5></div>${chipsPopular()}</section>
      <section class="hx-so-sec"><div class="hx-so-h"><h5>Browse by category</h5></div>
        <div class="hx-browse">${B.categories.map(c => `<button class="hx-bcat ${isSoon(c.key) ? 'hx-off' : ''}" type="button" data-act="hx-s-go" data-k="cat" data-id="${c.key}">
          <span class="tile">${xi(catIc(c.key), 20, 1.9)}${isSoon(c.key) ? '<i class="hx-soon-tag">Soon</i>' : ''}</span><span>${HX.short[c.key] || c.name}</span></button>`).join('')}</div></section>`;
  }
  const catRow = (it, q) => {
    const c = catOf(it.id), off = isSoon(it.id), n = (B.subcats[it.id] || []).length;
    return `<button class="hx-rrow ${off ? 'hx-off' : ''}" type="button" data-act="hx-s-go" data-k="cat" data-id="${c.key}">
        <span class="tile">${xi(catIc(c.key), 19, 2)}</span>
        <span class="hx-rmid"><b>${hl(c.name, q)}</b><small>${off ? `Coming soon to ${esc(city())}` : `${n} ${nounOf(c.key, n)} · ${HX.meta[c.key] || ''}`}</small></span>
        ${off ? '<span class="pill ink">Soon</span>' : `<span class="hx-rprice">${c.from ? `<small>from</small><b>${aed(c.from)}</b>` : '<b>On request</b>'}</span>`}</button>`;
  };
  const subRow = (it, q) => {
    const s = it.s, off = isSoon(s.cat);
    return `<button class="hx-rrow sub ${off ? 'hx-off' : ''}" type="button" data-act="hx-s-go" data-k="svc" data-id="${s.id}">
        <img class="hx-rthumb" src="${img(s.img)}" alt="">
        <span class="hx-rmid"><b>${hl(s.name, q)}</b><small>${esc(catOf(s.cat).name)} · ${esc(s.dur)}</small></span>
        <span class="hx-rprice">${off ? '<span class="pill ink">Soon</span>' : s.price ? `${s.variants ? '<small>from</small>' : ''}<b>${aed(s.price)}</b>${HX.was[s.id] ? `<s>${aed(HX.was[s.id])}</s>` : ''}` : '<b>On request</b>'}</span></button>`;
  };
  function resultsHTML(q) {
    const r = search(q);
    if (!r.cats.length && !r.subs.length) {                                         /* H19 */
      return `<div class="hx-nores"><div class="hx-ill">${NORES_SVG}</div>
          <b>No results for ‘${esc(q.trim())}’</b><span>Check the spelling, or try a symptom like “fever” or “back pain”.</span>
          <button class="btn btn-secondary" type="button" data-act="hx-s-browse">${icon('layers', 17, 2)} Browse services</button></div>
        <section class="hx-so-sec"><div class="hx-so-h"><h5>Popular services</h5></div>${chipsPopular()}</section>`;
    }
    return `${r.cats.length ? `<section class="hx-so-sec"><div class="hx-so-h"><h5>Services</h5></div><div class="hx-res">${r.cats.map(it => catRow(it, q)).join('')}</div></section>` : ''}
      ${r.subs.length ? `<section class="hx-so-sec"><div class="hx-so-h"><h5>Tests &amp; treatments</h5></div><div class="hx-res">${r.subs.map(it => subRow(it, q)).join('')}</div></section>` : ''}`;
  }
  function renderSO() {
    const root = soRoot();
    if (!root) return;
    const q = S.hxQ || '', focus = S.focus === 'hx-search' && S.kb === 'qwerty';
    root.classList.toggle('typing', !!q.trim());
    root.classList.toggle('focus', focus);
    setHTML(root.querySelector('.hx-so-txt'), q
      ? `<span class="hx-so-q">${esc(q).replace(/ /g, '&nbsp;')}</span>${focus ? '<span class="caret"></span>' : ''}`
      : `${focus ? '<span class="caret"></span>' : ''}<span class="hx-so-ph">Search services, tests or symptoms</span>`);
    setHTML(root.querySelector('.hx-so-xw'), q ? `<button class="hx-so-x" type="button" data-act="hx-s-clear" aria-label="Clear search">${icon('x', 12, 2.8)}</button>` : '');
    setHTML(root.querySelector('.hx-so-body'), q.trim() ? resultsHTML(q) : idleHTML());
  }
  function focusSO() {
    if (!soOn()) return;
    S.shift = false; S.sym = false;
    F.showKb('qwerty', 'hx-search');
    renderSO();
  }
  function blurSO() {
    if (S.focus === 'hx-search') { F.hideKb(); S.focus = null; }
    renderSO();
  }
  function openSearch(host, o = {}) {
    host = host || F.cur();
    if (!host || !live()) return;
    let root = host.querySelector('.hx-so');
    if (!root) {
      root = document.createElement('div');
      root.className = 'hx-so' + (o.instant ? ' instant' : '');
      root.innerHTML = soShell();
      host.appendChild(root);
      root.querySelector('.hx-so-body').addEventListener('pointerdown', e => {
        if (!e.target.closest('button') && S.focus === 'hx-search') blurSO();     /* touching the results drops the keyboard */
      });
    }
    SO.host = host;
    host.classList.add('hx-so-host');
    S.hxQ = o.q != null ? o.q : (S.hxQ || '');
    S.hxClearAsk = false;
    renderSO();
    void root.offsetWidth;
    root.classList.add('on'); host.classList.add('hx-so-open');
    if (o.kb !== false) focusSO(); else renderSO();
    if (o.instant) setTimeout(() => root.classList.remove('instant'), 60);
  }
  function closeSearch(instant) {
    const root = soRoot(), host = SO.host;
    if (S.focus === 'hx-search') { F.hideKb(); S.focus = null; }
    S.hxClearAsk = false;
    if (!root) return;
    root.classList.remove('on', 'focus');
    if (host) host.classList.remove('hx-so-open');
    if (instant) root.remove(); else setTimeout(() => { if (!root.classList.contains('on')) root.remove(); }, 330);
    if (host && host.dataset.id === 'search') {
      const from = 'search';
      setTimeout(() => { if (!live() || S.screen !== from) return; F.go('home', { dir: 'none' }); }, instant ? 0 : 320);
    }
  }
  F.openSearch = () => openSearch(F.cur(), { q: '' });

  /* coming back from a result re-opens the overlay with the same query, keyboard down (Swiggy, Best Buy) */
  function resume(n, here, prev) {
    const r = S.hxResume;
    if (!r) return;
    if (here === r.to && here !== r.from) return;          /* still on the way out: keep the note */
    S.hxResume = null;
    if (r.from === here && prev === r.to) openSearch(n, { q: r.q, instant: true, kb: false });
  }
  function leaveTo(target) { S.hxResume = { from: S.screen, to: target, q: S.hxQ || '' }; }

  F.KEYS = F.KEYS || {}; F.KB_RET = F.KB_RET || {}; F.KB_LOWER = F.KB_LOWER || {};
  F.KB_RET['hx-search'] = 'search'; F.KB_LOWER['hx-search'] = true;
  F.KEYS['hx-search'] = k => {
    if (!soOn()) return;
    let q = S.hxQ || '';
    if (k === 'enter') { if (q.trim()) { addRecent(q); blurSO(); } return; }
    if (k === 'del') q = q.slice(0, -1);
    else if (k === ' ') { if (!q || q.endsWith(' ')) return; q += ' '; }
    else if (k.length === 1) q = (q + k).slice(0, 40);
    else return;
    S.hxQ = q; S.hxClearAsk = false;
    renderSO();
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !S.sheet && soOn()) { e.preventDefault(); closeSearch(); }
  });

  F.SCREENS.search = {
    status: 'dark', cls: 'home hx-home',
    render() { const h = HOME.render(); this._prev = homePrev; return h; },
    mount(n) {
      adoptNewAddress(); carMount(n);
      const r = S.hxResume, back = r && r.from === 'search' && this._prev === r.to;
      S.hxResume = null;
      openSearch(n, back ? { q: r.q, instant: true, kb: false } : { q: '' });
    },
    update(n) { HOME.update(n); },
    tick(n) { HOME.tick(n); },
  };

  /* =====================================================================
     NOTIFICATIONS (H20 adapted, H21–H24)
     ===================================================================== */
  const nUnread = n => n.unread && !(S.hxRead || {})[n.id];
  const nList = () => (S.guest || S.hxNotifEmpty ? [] : HX.notifs);
  function notifsHTML() {
    const all = nList();
    if (!all.length) {                                                             /* H24 */
      return `<div class="hx-nempty"><div class="hx-ill">${BELL_SVG}</div>
          <b>No notifications yet</b><span>Visit updates, messages from your care team and new results will show up here.</span>
          ${has('notif-settings') ? `<button class="btn btn-secondary" type="button" data-act="goto" data-id="notif-settings">${icon('bell', 17, 2)} Notification settings</button>` : ''}</div>`;
    }
    const f = S.hxNType || 'all', L = all.filter(n => f === 'all' || n.t === f);
    const chips = `<div class="hx-nchips" role="tablist">${[['all', 'All']].concat(Object.keys(HX.ntypes).map(k => [k, HX.ntypes[k].label])).map(([k, l]) =>
      `<button class="hx-nchip ${k === f ? 'on' : ''}" type="button" role="tab" aria-selected="${k === f}" data-act="hx-ntype" data-t="${k}">${l}</button>`).join('')}</div>`;
    if (!L.length) {
      return `${chips}<div class="hx-nnone"><span class="tile ${HX.ntypes[f].tint}">${icon(HX.ntypes[f].ic, 20, 2)}</span><b>No ${HX.ntypes[f].label.toLowerCase()} updates</b><span>They’ll appear here when there are any.</span></div>`;
    }
    return chips + ['Today', 'Earlier'].map(g => {                                  /* H21 */
      const items = L.filter(n => n.g === g);
      if (!items.length) return '';
      return `<div class="hx-ng">${g}</div><div class="hx-ncard">${items.map(n => {
        const t = HX.ntypes[n.t] || HX.ntypes.book, un = nUnread(n);
        return `<button class="hx-nrow ${un ? 'un' : ''}" type="button" data-act="hx-notif" data-id="${n.id}">
            ${un ? '<i class="hx-ndot" aria-label="Unread"></i>' : ''}<span class="tile ${t.tint}">${icon(t.ic, 18, 2)}</span>
            <span class="hx-nmid"><span class="hx-ntop"><b>${esc(n.title)}</b><small>${n.time}</small></span><span class="hx-nmsg">${esc(n.body)}</span></span>
          </button>`;
      }).join('')}</div>`;
    }).join('');
  }
  F.SCREENS.notifs = {
    status: 'dark', cls: 'hx-notifs',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Notifications</span><span class="hx-readall-w"></span></div>
        <div class="scr-body"><div class="hx-nlist"></div></div>`;
    },
    update(n) {
      const un = nList().some(nUnread);
      setHTML(n.querySelector('.hx-readall-w'), nList().length ? `<button class="nav-link hx-readall ${un ? '' : 'off'}" type="button" data-act="hx-read-all"${un ? '' : ' disabled'}>Mark all read</button>` : '');
      setHTML(n.querySelector('.hx-nlist'), notifsHTML());
    },
  };

  /* =====================================================================
     SERVICES — Medical services grid and one service's list (H25–H34)
     ===================================================================== */
  function sticky() {
    const c = F.cartCount ? F.cartCount() : 0;
    if (!c) return '';
    const t = typeof F.sCartTotal === 'function' ? F.sCartTotal() : null;
    return `<button class="b-sticky hx-sticky" type="button" data-act="goto" data-id="cart">${icon('cart', 20, 2)}
        <span style="flex:1"><b>${c} ${c === 1 ? 'visit' : 'visits'} in your cart</b><small>View cart</small></span>
        ${t != null ? `<span class="price">${aed(t)}</span>` : ''}${icon('chevRight', 18, 2.2)}</button>`;
  }

  let catsPrev = null;
  F.SCREENS.cats = {
    status: 'dark', cls: 'cats hx-cats',
    render() {
      catsPrev = prevId();
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Medical services</span><span style="width:40px"></span></div>
        <div class="scr-body">
          <button class="hx-fake" type="button" data-act="hx-search">${icon('search', 18, 2)}<span>Search services, tests or symptoms</span></button>
          <div class="hx-cgrid-w"></div>
          <p class="hx-cnote">${icon('shieldCheck', 15, 2.2)}<span>Every clinician is DHA licensed. In an emergency, call <b>998</b>.</span></p>
        </div>
        <div class="hx-sticky-w"></div>`;
    },
    mount(n) { resume(n, 'cats', catsPrev); },
    update(n) {
      const a = visitAddress();
      setHTML(n.querySelector('.hx-cgrid-w'), `<p class="hx-cfor">${icon('pin', 13, 2.4)}<span>Showing what’s available at <b>${esc(a ? a.label : city())}</b>, ${esc(city())}</span></p>
        <div class="b-catgrid hx-cgrid">${B.categories.map(c => {
          const off = isSoon(c.key);
          return `<button class="b-cat ${off ? 'hx-off' : ''}" type="button" data-act="open-cat" data-k="${c.key}">
            ${off ? '<span class="pill ink">Soon</span>' : c.badge ? `<span class="pill ${c.badge === 'New' ? 'green' : c.badge === 'Same day' ? 'amber' : 'red'}">${c.badge}</span>` : ''}
            <span class="tile">${xi(catIc(c.key), 21, 1.9)}</span><b>${c.name}</b>
            <span>${off ? `Not in ${esc(city())} yet` : c.from ? 'from ' + aed(c.from) : 'On request'}</span></button>`;
        }).join('')}</div>`);
      setHTML(n.querySelector('.hx-sticky-w'), sticky());
      if (n.querySelector('.hx-so')) renderSO();
    },
  };

  /* H26 — coming-soon sheet */
  F.SHEETS['hx-soon'] = () => {
    const c = catOf(S.hxSoon || 'nutrition'), on = (S.hxNotify || {})[c.key], a = visitAddress();
    return `<div class="sheet" role="dialog" aria-label="${c.name} is coming soon"><div class="grab"></div>
        <div class="hx-soon">
          <div class="hx-soon-ill">${SOON_SVG}</div>
          <h2>${c.name} is coming soon</h2>
          <p>We don’t offer it ${a ? `at ${esc(a.label)} in ${esc(city())}` : `in ${esc(city())}`} yet. Turn on alerts and we’ll tell you the day it goes live.</p>
          <div class="stack">
            <button class="btn btn-primary ${on ? 'hx-done' : ''}" type="button" data-act="hx-notify" data-k="${c.key}">${on ? `${icon('check', 18, 2.6)} We’ll let you know` : `${icon('bell', 18, 2.2)} Notify me`}</button>
            <button class="btn btn-ghost" type="button" data-act="sheet-close">Not now</button>
          </div>
          <button class="hx-soon-alt" type="button" data-act="hx-soon-tele">${icon('video', 16, 2.2)}<span>Need advice today? <b>See a GP on video</b></span>${icon('chevRight', 15, 2.4)}</button>
        </div></div>`;
  };

  /* ---------- one service's list ---------- */
  const loaded = {};
  let skelT = null;
  const nounOf = (k, n) => { const w = HX.noun[k] || ['service', 'services']; return n === 1 ? w[0] : w[1]; };
  const inCart = id => (S.cart || []).some(i => i.id === id);
  const priceHTML = s => `<span class="hx-price"><b>${s.price ? `${s.variants ? '<small>from</small> ' : ''}${aed(s.price)}` : 'On request'}</b>${HX.was[s.id] ? `<s>${aed(HX.was[s.id])}</s><span class="pill red hx-save">Save ${Math.round((1 - s.price / HX.was[s.id]) * 100)}%</span>` : ''}</span>`;
  const addBtn = s => s.variants
    ? `<button class="hx-add ghost" type="button" data-act="open-variants" data-id="${s.id}">Options</button>`
    : !s.price ? `<button class="hx-add ghost" type="button" data-act="open-svc" data-id="${s.id}">Details</button>`
      : inCart(s.id) ? `<button class="hx-add done" type="button" data-act="goto" data-id="cart" aria-label="${esc(s.name)} is in your cart">${icon('check', 14, 3)}Added</button>`
        : `<button class="hx-add" type="button" data-act="hx-add" data-id="${s.id}" aria-label="Add ${esc(s.name)}">${icon('plus', 14, 2.8)}Add</button>`;
  /* H29 included tests · H30 strike-through · H31 duration · H32 two-line name */
  const card = (s, i, fade) => `<div class="b-svc hx-card ${fade ? 'fade' : ''}" style="--i:${i}" data-act="open-svc" data-id="${s.id}" role="button" tabindex="0">
      <img class="b-thumb" src="${img(s.img)}" alt="">
      <span class="mid">
        <b class="hx-name">${esc(s.name)}</b>
        <small class="hx-inc">${esc(inc(s))}</small>
        <span class="hx-meta">${icon('clock', 13, 2.2)}<span>${esc(s.dur)}</span>${s.badge ? `<span class="pill ${s.badge === 'Same day' ? 'amber' : s.badge === 'New' ? 'green' : 'red'}">${s.badge}</span>` : ''}</span>
        <span class="hx-row">${priceHTML(s)}${addBtn(s)}</span>
      </span></div>`;
  const skel = n => [...Array(n)].map((_, i) => `<div class="hx-skel" style="--i:${i}" aria-hidden="true"><i class="t"></i><span><i style="width:72%"></i><i style="width:94%"></i><i style="width:46%"></i><i class="p" style="width:38%"></i></span></div>`).join('');

  function subList(key) {
    if (F.cartCount) F.cartCount();                       /* makes sure S.cart exists before the Added check */
    const c = catOf(key), q = (S.hxInQ || '').trim().toLowerCase();
    if (S.hxSkel === key) return `<div class="hx-skels" aria-busy="true" aria-label="Loading ${c.name}">${skel(4)}</div>`;   /* H27 */
    if (isSoon(key) || S.hxEmptySub === key) {                                                                                    /* H34 */
      const a = visitAddress();
      return `<div class="hx-na"><div class="hx-ill">${SOON_SVG}</div>
          <b>Not available at this location</b>
          <span>${c.name} isn’t offered ${a ? `at <em>${esc(a.label)} · ${esc(street(a))}</em>` : `in ${esc(city())}`} yet. Choose another address, or browse what’s available.</span>
          <div class="stack"><button class="btn btn-primary" type="button" data-act="hx-addr">${icon('pin', 17, 2.2)} Change address</button>
            <button class="btn btn-secondary" type="button" data-act="goto" data-id="cats">Browse other services</button></div></div>`;
    }
    const all = (B.subcats[key] || []).map(s => ({ ...s, cat: key }));
    const hit = s => {                                                                                                            /* H28 */
      const h = `${s.name} ${HX.kw[s.id] || ''} ${inc(s)} ${s.lab || ''}`.toLowerCase(), W = words(h);
      return h.includes(q) || words(q).every(t => W.some(w => w.startsWith(t)));
    };
    const L = q ? all.filter(hit) : all;
    if (!L.length) {
      return `<div class="hx-inone"><span class="tile">${icon('search', 20, 2.2)}</span><b>No ${c.name.toLowerCase()} match ‘${esc(S.hxInQ.trim())}’</b>
          <span>Try another word, or search everything FRH offers.</span>
          <div class="hx-inone-acts"><button class="mini-btn ghost" type="button" data-act="hx-in-clear">Clear search</button><button class="mini-btn" type="button" data-act="hx-search">Search all services</button></div></div>`;
    }
    const fade = S.hxFade === key; S.hxFade = null;
    return `${L.map((s, i) => card(s, i, fade)).join('')}
      <p class="sec-sub hx-count">${q ? `${L.length} of ${all.length} ${nounOf(key, all.length)}` : `${all.length} ${nounOf(key, all.length)}`} · every clinician is DHA licensed</p>`;
  }
  const inField = key => {
    const q = S.hxInQ || '', focus = S.focus === 'hx-in' && S.kb === 'qwerty';
    return `<div class="hx-insearch ${focus ? 'focus' : ''}">
        <div class="hx-infield" data-act="hx-in-focus" role="searchbox" aria-label="Search in ${catOf(key).name}">${icon('search', 17, 2.2)}
          <span class="hx-intxt">${q ? `<span>${esc(q).replace(/ /g, '&nbsp;')}</span>${focus ? '<span class="caret"></span>' : ''}` : `${focus ? '<span class="caret"></span>' : ''}<span class="hx-inph">Search in ${catOf(key).name}</span>`}</span>
          ${q ? `<button class="hx-so-x" type="button" data-act="hx-in-clear" aria-label="Clear">${icon('x', 12, 2.8)}</button>` : ''}</div>
        ${focus ? '<button class="hx-so-cancel" type="button" data-act="hx-in-cancel">Cancel</button>' : ''}</div>`;
  };

  let subPrev = null;
  F.SCREENS.subcat = {
    status: 'dark', cls: 'subcat hx-sub',
    render() {
      subPrev = prevId();
      const key = S.cat || 'doctor', c = catOf(key);
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">${c.name}</span><span style="width:40px"></span></div>
        <div class="scr-body">
          <div class="hx-in-w"></div>
          <div class="hx-list"></div>
        </div>
        <div class="hx-sticky-w"></div>`;
    },
    mount(n) {
      const key = S.cat || 'doctor';
      resume(n, 'subcat', subPrev);
      if (S.hxSkel === key) {                     /* H27: skeleton rows in the list, not a loader screen */
        const from = 'subcat', hold = S.hxSkelHold || 650;
        S.hxSkelHold = null;
        clearTimeout(skelT);
        skelT = setTimeout(() => {
          if (!live() || S.screen !== from || S.cat !== key || S.hxSkel !== key) return;
          S.hxSkel = null; loaded[key] = true; S.hxFade = key; F.upd();
        }, hold);
      }
    },
    update(n) {
      const key = S.cat || 'doctor';
      setHTML(n.querySelector('.hx-in-w'), isSoon(key) || S.hxEmptySub === key ? '' : `${inField(key)}
        <p class="hx-sub-intro">${icon(key === 'lab' ? 'clock' : 'home', 13, 2.2)}<span>${HX.meta[key] || 'At your home, hotel or office'}</span></p>`);
      setHTML(n.querySelector('.hx-list'), subList(key));
      setHTML(n.querySelector('.hx-sticky-w'), sticky());
      if (n.querySelector('.hx-so')) renderSO();
    },
  };

  F.KB_RET['hx-in'] = 'search'; F.KB_LOWER['hx-in'] = true;
  F.KEYS['hx-in'] = k => {
    if (S.screen !== 'subcat') return;
    let q = S.hxInQ || '';
    if (k === 'enter') { F.hideKb(); S.focus = null; F.upd(); return; }
    if (k === 'del') q = q.slice(0, -1);
    else if (k === ' ') { if (!q || q.endsWith(' ')) return; q += ' '; }
    else if (k.length === 1) q = (q + k).slice(0, 30);
    else return;
    S.hxInQ = q; F.upd();
  };

  /* =====================================================================
     DEEP LINKS
     ===================================================================== */
  function openAppt(id) {
    if (typeof F.openAppt === 'function') return F.openAppt(id);
    if (F.ACT['appt-open']) return F.ACT['appt-open']({ dataset: { id } });
    S.apptId = id; F.go('appts');
  }
  function openTarget(to) {
    const [k, id] = to;
    if (k === 'appt') return openAppt(id);
    if (k === 'chat') {
      if (F.openDirectChat && has('chat')) { F.openDirectChat('doctor', id); return F.go('chat'); }
      return F.go('chat-home');
    }
    if (k === 'report') {
      if (typeof F.openReport === 'function') { try { return F.openReport(id); } catch (e) { /* fall through */ } }
      return F.go(has('reports-hub') ? 'reports-hub' : 'reports');
    }
    if (k === 'rx') {
      if (typeof F.openRx === 'function') return F.openRx(id);
      return F.go(has('e-rx') ? 'e-rx' : has('reports-hub') ? 'reports-hub' : 'reports');
    }
    if (k === 'cat') return F.ACT['open-cat']({ dataset: { k: id } });
    if (k === 'coupons') return F.go(has('coupons') ? 'coupons' : 'cats');
  }

  /* =====================================================================
     ACTIONS
     ===================================================================== */
  Object.assign(F.ACT, {
    'open-cat': n => {
      const k = n.dataset.k;
      if (isSoon(k)) { S.hxSoon = k; F.openSheet('hx-soon'); return; }     /* H26 */
      if (!B.subcats[k]) { F.toast(`${catOf(k).name} opens soon`, 'sparkle'); return; }
      if (S.cat !== k) S.hxInQ = '';
      S.cat = k; S.hxEmptySub = null;
      if (!loaded[k]) S.hxSkel = k;
      F.go('subcat');
    },
    /* header */
    'hx-addr': () => { if (S.guest) return F.ACT.signin && F.ACT.signin(); F.openSheet('hx-addr'); },
    'hx-addr-pick': n => {
      const was = visitAddress(), a = addrs().find(x => x.id === n.dataset.id);
      F.closeSheet();
      if (!a || (was && was.id === a.id)) return;
      F.setVisitAddress(a.id);
      F.upd();
      F.toast(`Visits now go to ${a.label}`, 'pin');
    },
    'hx-addr-add': () => {
      F.closeSheet(true);
      S.hxAddrBase = addrs().length;
      if (typeof F.openAddressForm === 'function') F.openAddressForm({ ctx: 'profile' });
      else if (F.ACT['px-addr-add']) F.ACT['px-addr-add']();
      else F.go(has('addresses') ? 'addresses' : 'home');
    },
    'hx-appt': n => openAppt(n.dataset.id),
    'hx-appts': () => { S.apptTab = 'upcoming'; F.go('appts', { dir: 'fade' }); },
    /* search overlay */
    'hx-search': () => openSearch(F.cur(), { q: '' }),
    'hx-s-focus': () => focusSO(),
    'hx-s-close': () => closeSearch(),
    'hx-s-clear': () => { S.hxQ = ''; focusSO(); },
    'hx-s-q': n => { S.hxQ = n.dataset.q; addRecent(n.dataset.q); S.hxClearAsk = false; blurSO(); },
    'hx-s-rm': n => { S.hxRecent = recents().filter(x => x !== n.dataset.q); renderSO(); },
    'hx-s-clear-ask': () => { S.hxClearAsk = true; renderSO(); },
    'hx-s-clear-no': () => { S.hxClearAsk = false; renderSO(); },
    'hx-s-clear-yes': () => { S.hxRecent = []; S.hxClearAsk = false; renderSO(); F.toast('Recent searches cleared', 'check'); },   /* H18 */
    'hx-s-go': n => {
      const k = n.dataset.k, id = n.dataset.id;
      if (S.hxQ && S.hxQ.trim()) addRecent(S.hxQ);
      if (k === 'cat') {
        if (isSoon(id)) { S.hxSoon = id; F.openSheet('hx-soon'); return; }
        leaveTo('subcat'); F.ACT['open-cat']({ dataset: { k: id } });
      } else {                                                                  /* H17: sub-service result → its page */
        leaveTo('service'); F.ACT['open-svc']({ dataset: { id } });
      }
    },
    'hx-s-browse': () => { leaveTo('cats'); F.go('cats'); },
    /* notifications */
    'hx-ntype': n => { S.hxNType = n.dataset.t; F.upd(); },
    'hx-read-all': () => { S.hxRead = S.hxRead || {}; HX.notifs.forEach(x => { S.hxRead[x.id] = true; }); F.upd(); F.toast('All caught up', 'check'); },
    'hx-notif': n => {
      const x = HX.notifs.find(i => i.id === n.dataset.id);
      if (!x) return;
      S.hxRead = S.hxRead || {}; S.hxRead[x.id] = true;
      openTarget(x.to);                                                          /* H23 */
    },
    /* services */
    'hx-add': (n, e) => {
      if (e) e.stopPropagation();
      if (F.ACT['add-cart']) F.ACT['add-cart'](n, e);
      else { F.toast('Added to cart', 'check'); }
      F.upd();
    },
    'hx-in-focus': () => { S.shift = false; S.sym = false; F.showKb('qwerty', 'hx-in'); F.upd(); },
    'hx-in-clear': (n, e) => { if (e) e.stopPropagation(); S.hxInQ = ''; F.upd(); },
    'hx-in-cancel': () => { S.hxInQ = ''; F.hideKb(); S.focus = null; F.upd(); },
    'hx-notify': n => {
      const k = n.dataset.k;
      S.hxNotify = S.hxNotify || {};
      if (!S.hxNotify[k]) { S.hxNotify[k] = true; F.closeSheet(); F.toast(`We’ll tell you when ${catOf(k).name} is live`, 'bell'); }
      else F.closeSheet();
    },
    'hx-soon-tele': () => { F.closeSheet(true); if (soOn()) leaveTo('service'); F.ACT['open-svc']({ dataset: { id: 'tele' } }); },
  });

  /* =====================================================================
     PRESENTER PANEL — F.hx.jump(viewId); the lead wires these into panel.js
     ===================================================================== */
  const at = { dir: 'fade' };
  const signedIn = () => { S.guest = false; if (!S.name) S.name = F.DEMO.name; };
  const later = (from, fn, ms = 260) => setTimeout(() => { if (live() && S.screen === from) fn(); }, ms);
  const typeInto = q => { S.hxQ = q; renderSO(); };
  const VIEWS = {
    home: () => { signedIn(); F.go('home', at); },
    'home-addr': () => { signedIn(); F.go('home', at); later('home', () => F.openSheet('hx-addr')); },
    search: () => { signedIn(); S.hxQ = ''; F.go('cats', at); later('cats', () => F.ACT['hx-search']()); },
    'search-typing': () => { signedIn(); S.hxQ = ''; F.go('cats', at); later('cats', () => { F.ACT['hx-search'](); later('cats', () => typeInto('blood')); }); },
    'search-none': () => { signedIn(); S.hxQ = ''; F.go('cats', at); later('cats', () => { F.ACT['hx-search'](); later('cats', () => typeInto('dermatology')); }); },
    notifs: () => { signedIn(); S.hxNotifEmpty = false; S.hxNType = 'all'; F.go('notifs', at); },
    'notifs-empty': () => { signedIn(); S.hxNotifEmpty = true; F.go('notifs', at); },
    cats: () => { signedIn(); F.go('cats', at); },
    'soon-sheet': () => { signedIn(); F.go('cats', at); later('cats', () => { S.hxSoon = 'nutrition'; F.openSheet('hx-soon'); }); },
    subcat: () => { signedIn(); S.cat = 'lab'; S.hxInQ = ''; S.hxEmptySub = null; S.hxSkel = null; loaded.lab = true; F.go('subcat', at); },
    'subcat-loading': () => { signedIn(); S.cat = 'lab'; S.hxInQ = ''; S.hxEmptySub = null; delete loaded.lab; S.hxSkel = 'lab'; S.hxSkelHold = 2600; F.go('subcat', at); },
    'subcat-search': () => { signedIn(); S.cat = 'lab'; S.hxInQ = 'vit'; S.hxEmptySub = null; S.hxSkel = null; loaded.lab = true; F.go('subcat', at); },
    'subcat-na': () => { signedIn(); S.cat = 'nutrition'; S.hxInQ = ''; S.hxSkel = null; S.hxEmptySub = 'nutrition'; F.go('subcat', at); },
  };
  F.hx = { jump: v => { const f = VIEWS[v]; if (f) f(); return !!f; }, views: Object.keys(VIEWS) };
  /* the old dev-spec panel shortcuts keep working */
  if (F.DEVPREP) Object.assign(F.DEVPREP, { h5: VIEWS.search, h17: VIEWS['search-typing'], h19: VIEWS['search-none'], h24: VIEWS['notifs-empty'], h26: VIEWS['soon-sheet'], h27: VIEWS['subcat-loading'], h34: VIEWS['subcat-na'] });
})();
