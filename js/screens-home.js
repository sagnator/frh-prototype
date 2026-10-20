/* FRH prototype — Home hub (spec screen 2.1, restructured).
   One hero action (urgent), then the returning-user's visit, then browsing.
   Sections deliberately removed from Home and rehomed:
     PCR & STD tests  -> Lab Tests category (3.2)
     Top-rated team   -> Medical Services screen + each service detail
     Offer strip      -> folded into the single promo carousel
     Chat teaser      -> the Chat tab already covers it
     Health tips      -> parked for a future Health tab (data kept in data.js) */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA;
  const img = n => `assets/img/${n}`;
  const initials = () => { const p = (S.name || F.DEMO.name).trim().split(/\s+/); return ((p[0] || ' ')[0] + ((p[1] || '')[0] || '')).toUpperCase(); };
  const soon = m => `data-act="soon" data-msg="${m}"`;
  const NEXT = 'That screen comes in a later batch';

  /* shared: bottom tab bar (4 tabs, profile lives in the header) */
  F.tabbar = active => {
    const tab = (id, ic, label, opts = {}) => {
      const act = opts.id ? `data-act="goto" data-id="${opts.id}"` : opts.act ? `data-act="${opts.act}"` : `data-act="soon" data-msg="${opts.msg || NEXT}"`;
      return `<button class="tab ${active === id ? 'on' : ''}" type="button" ${act}>${icon(ic, 23, 1.9)}${label}${opts.badge ? `<i class="tab-badge">${opts.badge}</i>` : ''}</button>`;
    };
    return `<nav class="tabbar">
      ${tab('home', 'home', 'Home', { act: 'go-home' })}
      ${tab('appts', 'calendar', 'Appointments', { act: 'appts' })}
      ${tab('cart', 'cart', 'Cart', { id: 'cart', badge: F.cartCount ? F.cartCount() : 0 })}
      ${tab('chat', 'chat', 'Chat', { id: 'chat-home' })}
    </nav>`;
  };

  /* Address is the header, not a chip under a greeting — the pattern every
     address-dependent app uses (DoorDash, Uber Eats, Instacart, foodpanda, Skip). */
  function header() {
    const g = S.guest;
    return `<div class="h2-top">
        <button class="h-addr" type="button" data-act="goto" data-id="addresses">
          <small>${icon('pin', 12, 2.6)} Visit address</small>
          <b><span>${g ? 'Set your location' : D.user.address}</span>${icon('chevDown', 15, 2.6)}</b>
        </button>
        <div class="h2-acts">
          <button class="icon-btn" type="button" data-act="goto" data-id="notifs" aria-label="Notifications">${icon('bell', 20, 1.9)}<i class="badge-dot">3</i></button>
          ${g ? '<button class="signin-pill" type="button" data-act="signin">Sign in</button>'
              : `<button class="avatar" type="button" data-act="goto" data-id="profile-home" aria-label="Profile">${initials()}</button>`}
        </div>
      </div>
      <p class="h-greet-line">${g ? 'Welcome to FRH' : `${F.greeting()}, ${F.esc(F.firstName())}`}</p>`;
  }

  /* 1 — the one thing most people open the app for */
  const hero = () => `<button class="h-hero" type="button" data-act="open-cat" data-k="doctor">
      <img class="h-hero-img" src="${img('doctor.jpg')}" alt="">
      <span class="h-hero-in">
        <span class="pill hero-pill"><i></i>Doctors available now</span>
        <b>Doctor on Call</b>
        <span class="sub">A DHA-licensed doctor at your door in about 45 minutes, day or night.</span>
        <span class="h-hero-cta">Book a doctor ${icon('arrowRight', 16, 2.4)}</span>
      </span></button>`;

  /* 1b — a clinician is on the way: the most important thing on the screen */
  function liveBox() {
    if (S.guest) return '';
    const a = D.appointments.upcoming.find(x => x.tracking);
    if (!a) return '';
    const t = D.tracking, lead = t.team[0];
    const pct = Math.round(((t.step + 0.5) / t.steps.length) * 100);
    return `<button class="h-live" type="button" data-act="track" data-id="${a.id}">
        <span class="h-live-av"><img src="${img(lead.img)}" alt=""><i></i></span>
        <span class="h-live-t">
          <span class="h-live-status"><i></i>${t.steps[t.step]}</span>
          <b>${lead.name}</b>
          <small>${a.service} · arriving ${t.eta}</small>
        </span>
        ${icon('chevRight', 18, 2.4)}
        <span class="h-live-bar"><i style="width:${pct}%"></i></span>
      </button>`;
  }

  /* 2 — returning patient: what is already booked */
  function upcoming() {
    if (S.guest) return '';
    const a = D.appointments.upcoming.find(x => !x.tracking);
    if (!a) return '';
    return `<div class="sec"><div class="sec-h"><h4>Your next visit</h4><button class="link" type="button" data-act="appts">All appointments</button></div>${F.apptCard(a, true)}</div>`;
  }

  /* 3 — planned care */
  const services = () => `<div class="sec"><div class="sec-h"><h4>Book care at home</h4>
      <button class="link" type="button" data-act="goto" data-id="cats">View all</button></div>
      <div class="h-svc-grid">${D.services.map(s => `
        <button class="h-svc" type="button" data-act="home-svc" data-name="${s.name}">
          <span class="tile">${icon(s.icon, 21, 1.9)}</span><span>${s.name.replace(' at Home', '')}</span></button>`).join('')}</div></div>`;

  /* 4 — one promo area (banners and offers merged) */
  const promos = () => `<div class="sec"><div class="car"><div class="car-track">${D.banners.map(b => `
      <div class="car-slide"><div class="car-card"><img src="${img(b.img)}" alt="" draggable="false">
        <div class="car-txt"><span class="pill">${b.tag}</span><h3>${b.title}</h3><p>${b.sub}</p></div>
        <button class="car-go" type="button" data-act="goto" data-id="cats" aria-label="${b.cta}">${icon('arrowRight', 17, 2.4)}</button>
      </div></div>`).join('')}</div>
      <div class="car-dots">${D.banners.map((_, i) => `<button type="button" data-act="car-dot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div></div></div>`;

  const trustLine = () => `<button class="h-trust" type="button" ${soon('Policies live in Profile → Policies')}>
      ${icon('shieldCheck', 18, 2)}<span><b>DHA-licensed clinicians</b>Insurance accepted · 100% satisfaction guarantee</span>${icon('chevRight', 17, 2.2)}</button>`;

  const guestBar = () => S.guest
    ? '<div class="guest-bar" style="margin-top:14px"><p><b>You’re browsing as a guest</b>Sign in to book visits and keep your records.</p><button type="button" data-act="signin">Sign in</button></div>'
    : '';

  F.SCREENS.home = {
    status: 'dark', cls: 'home',
    render() {
      S.car = S.car || 0;
      return `<div class="scr-body">
          ${header()}
          ${guestBar()}
          <button class="search" type="button" data-act="goto" data-id="search">${icon('search', 19, 2)} Search services or symptoms…</button>
          ${liveBox()}
          ${hero()}
          ${upcoming()}
          ${services()}
          ${promos()}
          ${trustLine()}
        </div>
        ${F.tabbar('home')}`;
    },
    update(n) {
      const track = n.querySelector('.car-track');
      if (!track) return;
      track.style.transform = `translateX(${-S.car * 100}%)`;
      n.querySelectorAll('.car-dots button').forEach((b, i) => b.classList.toggle('on', i === S.car));
    },
    mount(n) {
      const view = n.querySelector('.car'), track = n.querySelector('.car-track');
      if (!view) return;
      let x0 = null, dx = 0;
      view.addEventListener('pointerdown', e => { if (e.button !== 0) return; x0 = e.clientX; dx = 0; track.classList.add('drag'); });
      view.addEventListener('pointermove', e => {
        if (x0 === null) return;
        dx = (e.clientX - x0) / F.scale;
        const edge = (S.car === 0 && dx > 0) || (S.car === D.banners.length - 1 && dx < 0) ? 0.3 : 1;
        track.style.transform = `translateX(calc(${-S.car * 100}% + ${dx * edge}px))`;
      });
      const end = () => {
        if (x0 === null) return;
        track.classList.remove('drag');
        if (dx < -50 && S.car < D.banners.length - 1) S.car++;
        else if (dx > 50 && S.car > 0) S.car--;
        x0 = null; F.upd();
      };
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => view.addEventListener(t, end));
    },
  };

  const CATMAP = { 'Doctor on Call': 'doctor', 'Health Checkup': 'checkup', 'Physiotherapy': 'physio', 'Nursing Care': 'nursing', 'IV Therapy at Home': 'iv', 'Lab Tests': 'lab', 'Vaccinations': 'vaccine', 'Teleconsultation': 'doctor' };
  Object.assign(F.ACT, {
    'car-dot': n => { S.car = +n.dataset.i; F.upd(); },
    'home-svc': n => { const k = CATMAP[n.dataset.name] || 'doctor'; F.ACT['open-cat']({ dataset: { k } }); },
  });
})();
