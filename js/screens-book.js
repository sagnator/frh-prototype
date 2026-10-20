/* FRH prototype — flows 3–5: browse, service detail, cart, checkout, confirmation. */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK;
  const img = n => `assets/img/${n}`;
  const aed = n => 'AED ' + Number(Math.round(n)).toLocaleString('en-US');
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const soon = m => `data-act="soon" data-msg="${m}"`;
  const nav = (title, back, right) => `<div class="nav"><button class="nav-btn" type="button" data-act="${back}" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">${title}</span>${right || '<span style="width:40px"></span>'}</div>`;
  const ctxChip = () => `<button class="b-ctx" type="button" data-act="goto" data-id="who">${icon('users', 15, 2.2)}<span>Booking for <b>${selectedPatients().map(p => p.name.split(' ')[0]).join(' & ')}</b></span>${icon('chevDown', 14, 2.4)}</button>`;
  const stepBar = n => `<div class="b-steps">${['Cart', 'Confirm', 'Done'].map((s, i) => `<span class="${i + 1 === n ? 'on' : i + 1 < n ? 'done' : ''}">${i + 1 < n ? icon('check', 12, 3) : i + 1}<b>${s}</b></span>`).join('')}</div>`;
  const searchField = () => `<button class="b-search" type="button" data-act="goto" data-id="search">${icon('search', 18, 2)} Search for services or sub-services…</button>`;

  /* ---------- lookups ---------- */
  const allSvcs = () => Object.keys(B.subcats).flatMap(k => B.subcats[k].map(s => ({ ...s, cat: k })));
  const findSvc = id => allSvcs().find(s => s.id === id) || B.subcats.doctor[0];
  const catName = key => (B.categories.find(c => c.key === key) || {}).name || 'Services';
  function detailOf(id) {
    const d = B.detail[id];
    const s = findSvc(id);
    if (d) return { ...d, id };
    const g = B.detail.gp;
    return { id, img: s.img, name: s.name, badges: ['Home visit'], rating: 4.7, reviews: 84, price: s.price, dur: s.dur,
      overview: `${s.name} delivered at home by an FRH clinician. ${s.lab}.`, included: g.included, steps: g.steps, trust: g.trust, faqs: g.faqs, reviewsList: g.reviewsList, similar: [] };
  }

  /* ---------- cart ---------- */
  const cart = () => (S.cart = S.cart || B.cart.map(i => ({ ...i, key: i.id })));
  F.cartCount = () => cart().reduce((n, i) => n + i.qty, 0);
  function totals() {
    const items = cart();
    const sub = items.reduce((n, i) => n + i.price * i.qty, 0);
    const night = items.reduce((n, i) => n + (i.night || 0), 0);
    let off = 0;
    if (S.coupon) {
      const c = S.coupon;
      off = c.pct ? Math.min(sub * c.pct / 100, c.max || Infinity) : (sub >= (c.min || 0) ? c.flat : 0);
    }
    const net = Math.max(0, sub + night - off);
    const vat = net * B.vatRate;
    return { sub, night, off, vat, total: net + vat };
  }
  function addToCart(id, variant) {
    const s = findSvc(id);
    const key = variant ? `${id}-${variant.name}` : id;
    const found = cart().find(i => i.key === key);
    if (found) found.qty++;
    else cart().push({ key, id, name: variant ? `${s.name} · ${variant.name}` : s.name, sub: catName(s.cat), dur: variant ? variant.desc : s.dur, price: variant ? variant.price : s.price, qty: 1, night: id === 'night' ? 70 : 0 });
    F.toast(`${s.name} added to cart`, 'check');
    F.upd();
  }

  /* ================= 3.1 categories ================= */
  F.SCREENS.cats = {
    status: 'dark', cls: 'cats',
    render: () => `${nav('Medical Services', 'nav-back')}
      <div class="scr-body">${ctxChip()}${searchField()}
        <div class="b-catgrid">${B.categories.map(c => `
          <button class="b-cat" type="button" data-act="open-cat" data-k="${c.key}">
            ${c.badge ? `<span class="pill ${c.badge === 'New' ? 'green' : c.badge === 'Same day' ? 'amber' : 'red'}">${c.badge}</span>` : ''}
            <span class="tile">${icon(c.icon, 21, 1.9)}</span><b>${c.name}</b>
            <span>${c.from ? 'from ' + aed(c.from) : 'On request'}</span></button>`).join('')}</div>
        <p class="sec-sub" style="margin-top:18px">Prices are placeholders for FRH to confirm. Ambulance dispatch is quoted on the call.</p>
        <div class="sec"><div class="sec-h"><h4>Our clinicians</h4><span class="pill green">DHA licensed</span></div>
          <div class="hrow">${D.doctors.map(d => `<button class="pro" type="button" data-act="goto" data-id="doc-profile">
            <img src="${img(d.img)}" alt=""><b>${d.name}</b><small>${d.role}</small>
            <span class="rate">${icon('starFill', 14)} ${d.rating} <span>(${d.reviews})</span></span></button>`).join('')}</div></div>
      </div>
      ${F.cartCount() ? stickyCart() : ''}`,
  };
  const stickyCart = () => `<button class="b-sticky" type="button" data-act="goto" data-id="cart">${icon('cart', 20, 2)}
      <span style="flex:1"><b>${F.cartCount()} ${F.cartCount() === 1 ? 'service' : 'services'} in cart</b><small>Tap to view details</small></span>
      <span class="price">${aed(totals().total)}</span></button>`;

  /* ================= 3.2 sub-category ================= */
  F.SCREENS.subcat = {
    status: 'dark', cls: 'subcat',
    render() {
      const key = S.cat || 'doctor';
      const list = B.subcats[key] || B.subcats.doctor;
      return `${nav(catName(key), 'nav-back')}
        <div class="scr-body">${ctxChip()}${searchField()}
          ${list.map(s => `<div class="b-svc" data-act="open-svc" data-id="${s.id}" role="button" tabindex="0">
            <img class="b-thumb" src="${img(s.img)}" alt="">
            <span class="mid"><b>${s.name}</b><small>${s.lab}</small>
              <span class="row">${s.badge ? `<span class="pill ${s.badge === 'Same day' ? 'amber' : 'red'}">${s.badge}</span>` : ''}<span class="price"><small>AED</small>${Number(s.price).toLocaleString('en-US')}</span>
              <button class="mini-btn" type="button" data-act="${s.variants ? 'open-variants' : 'add-cart'}" data-id="${s.id}">${s.variants ? 'Choose dosage' : 'Book now'}</button></span></span></div>`).join('')}
          <p class="sec-sub" style="margin-top:16px">${list.length} services · every clinician is DHA licensed.</p>
        </div>
        ${F.cartCount() ? stickyCart() : ''}`;
    },
  };

  /* ================= 3.3 variants sheet ================= */
  F.SHEETS.variants = () => {
    const v = B.variants;
    return `<div class="sheet" role="dialog" aria-label="${v.title}"><div class="grab"></div>
      <h2 style="text-align:left">${v.title}</h2>
      <div style="text-align:left">${v.options.map((o, i) => `
        <button class="b-pick ${(S.variant || 0) === i ? 'on' : ''}" type="button" data-act="pick-variant" data-i="${i}">
          <span class="radio"></span><span class="mid"><b>${o.name}</b><small>${o.desc}</small></span><span class="price">${aed(o.price)}</span></button>`).join('')}
        <div class="flag-note" style="margin-top:12px">${icon('alert', 14, 2.2)}<span>${v.note}</span></div></div>
      <button class="btn btn-primary" type="button" data-act="proceed-variant" style="margin-top:18px">Add to cart</button></div>`;
  };

  /* ================= 3.4 service detail ================= */
  F.SCREENS.service = {
    status: 'light', cls: 'service',
    render() {
      const d = detailOf(S.svc || 'gp'), t1 = S.svcTab || 'high', t2 = S.svcTab2 || 'rev';
      const stars = n => [1, 2, 3, 4, 5].map(i => icon('starFill', 13)).slice(0, n).join('');
      return `<div class="b-topbar"><button class="nav-btn" type="button" data-act="back-svc" aria-label="Back">${icon('arrowLeft', 19, 2)}</button><span>${d.name}</span><button class="nav-btn" type="button" ${soon('Sharing is wired in the real app')} aria-label="Share">${icon('share', 17, 2)}</button></div>
      <div class="scr-body">
        <div class="b-hero"><img src="${img(d.img)}" alt="">
          <div class="b-hero-top"><button class="icon-btn" type="button" data-act="back-svc" aria-label="Back">${icon('arrowLeft', 19, 2)}</button>
            <span style="display:flex;gap:8px"><button class="icon-btn" type="button" ${soon('Sharing is wired in the real app')} aria-label="Share">${icon('share', 18, 2)}</button>
            <button class="icon-btn" type="button" data-act="fav" aria-label="Save">${icon('heart', 18, 2)}</button></span></div></div>
        <div class="b-sheet"><div class="b-pad">
          <div class="b-titlerow"><h1 class="h1" style="font-size:25px;width:100%">${d.name}</h1>
            ${d.badges.map(b => `<span class="pill red">${b}</span>`).join('')}<span class="pill green live"><i></i>Available now</span></div>
          <div class="b-rate">${icon('starFill', 15)} ${d.rating} <span>(${d.reviews} reviews)</span></div>
          <div class="b-pricerow"><b>${aed(d.price)}</b><small>· ${d.dur} · DHA licensed</small></div>
          <div class="b-facts">
            <div>${icon('clock', 17, 2)}<b>${d.dur}</b><span>Typical visit</span></div>
            <div>${icon('shieldCheck', 17, 2)}<b>DHA licensed</b><span>Verified clinician</span></div>
            <div>${icon('home', 17, 2)}<b>At your door</b><span>Home, hotel or office</span></div>
          </div>

          <div class="seg-tabs" style="margin-top:20px"><button type="button" data-act="svc-tab" data-t="high" class="${t1 === 'high' ? 'on' : ''}">Highlights</button><button type="button" data-act="svc-tab" data-t="over" class="${t1 === 'over' ? 'on' : ''}">Overview</button></div>
          ${t1 === 'high' ? `
            <div class="sec-h" style="margin:20px 0 4px"><h4>What’s included</h4></div>
            <div class="b-list">${d.included.map(i => `<div>${icon('check', 16, 2.6)}<span>${i}</span></div>`).join('')}</div>
            <div class="sec-h" style="margin:22px 0 4px"><h4>How it works</h4></div>
            ${d.steps.map(([t, s], i) => `<div class="b-step"><span class="n">${i + 1}</span><span><b>${t}</b><span>${s}</span></span></div>`).join('')}`
          : `<p class="lead" style="margin-top:18px">${d.overview}</p>
            <div class="sec-h" style="margin:22px 0 10px"><h4>Trust &amp; safety</h4></div>
            <div class="info-card">${d.trust.map(([ic, t, s]) => `<div class="info-row"><span class="tile">${icon(ic, 17, 2)}</span><div class="ir-mid"><b>${t}</b><small>${s}</small></div></div>`).join('')}</div>`}

          <div class="seg-tabs" style="margin-top:24px"><button type="button" data-act="svc-tab2" data-t="rev" class="${t2 === 'rev' ? 'on' : ''}">Customer reviews</button><button type="button" data-act="svc-tab2" data-t="faq" class="${t2 === 'faq' ? 'on' : ''}">FAQs</button></div>
          ${t2 === 'rev' ? `<div style="margin-top:8px">${d.reviewsList.map(r => `
              <div class="b-review"><div class="top"><span class="av">${r.name[0]}</span><b>${r.name}</b><span class="when">${r.when}</span></div>
                <div class="stars">${stars(r.stars)}</div><p>${r.text}</p></div>`).join('')}
              <button class="btn btn-secondary" type="button" ${soon('The full review list comes with the real data')} style="margin-top:12px">See all ${d.reviews} reviews</button>`
            : `<div style="margin-top:10px">${d.faqs.map(([q, a], i) => `
              <div class="acc" id="faq${i}"><button class="acc-head" type="button" data-act="acc" data-t="faq${i}"><b>${q}</b>${icon('chevDown', 18, 2.2)}</button><div class="acc-body">${a}</div></div>`).join('')}</div>`}

          ${d.similar.length ? `<div class="sec-h" style="margin:24px 0 10px"><h4>Similar services</h4></div>
            <div class="hrow">${d.similar.map(id => { const s = findSvc(id); return `<button class="b-sim" type="button" data-act="open-svc" data-id="${id}"><img src="${img(s.img)}" alt=""><b>${s.name}</b><span>from ${aed(s.price)}</span></button>`; }).join('')}</div>` : ''}

          <div class="sec-h" style="margin:24px 0 10px"><h4>Your clinician</h4></div>
          <div class="card-row" data-act="goto" data-id="doc-profile"><img src="${img(B.doctor.img)}" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover">
            <span style="flex:1"><b style="display:block;font-size:14px">${B.doctor.name}</b><small style="font-size:12px;color:var(--muted)">${B.doctor.creds}</small></span>${icon('chevRight', 18, 2.2)}</div>
        </div></div></div>
      <div class="scr-foot"><div class="b-foot"><span class="from"><small>From</small><b>${aed(d.price)}</b></span>
        <button class="btn btn-primary" type="button" data-act="book-svc" data-id="${d.id}">Book appointment</button></div></div>`;
    },
  };

  F.SCREENS.service.mount = n => {
    const body = n.querySelector('.scr-body'), bar = n.querySelector('.b-topbar');
    if (!body || !bar) return;
    body.addEventListener('scroll', () => bar.classList.toggle('show', body.scrollTop > 165));
  };

  /* ================= 3.5 doctor profile ================= */
  F.SCREENS['doc-profile'] = {
    status: 'dark', cls: 'doc-profile',
    render() {
      const d = B.doctor;
      return `${nav('Clinician profile', 'back-doc')}
        <div class="scr-body"><div class="b-doc"><img src="${img(d.img)}" alt=""><h1>${d.name}</h1><div class="creds">${d.creds}</div>
          <div class="b-rate" style="justify-content:center">${icon('starFill', 15)} ${d.rating} <span>(${d.reviews} reviews)</span></div>
          <div class="b-langs">${d.langs.map(l => `<span class="pill ink">${l}</span>`).join('')}</div></div>
        <div class="b-stats">${d.stats.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
        <div class="sec-h" style="margin:22px 0 8px"><h4>About</h4></div>
        <p class="lead" style="margin:0">${d.about}</p>
        <div class="sec-h" style="margin:22px 0 4px"><h4>Patient reviews</h4></div>
        ${B.detail.gp.reviewsList.map(r => `<div class="b-review"><div class="top"><span class="av">${r.name[0]}</span><b>${r.name}</b><span class="when">${r.when}</span></div><p>${r.text}</p></div>`).join('')}
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="book-svc" data-id="gp">Book with ${d.name.split(' ')[0]} ${d.name.split(' ')[1]}</button></div>`;
    },
  };

  /* ================= 4.1 / 4.2 cart ================= */
  F.SCREENS.cart = {
    status: 'dark', cls: 'cart',
    render() {
      const items = cart(), t = totals();
      if (!items.length) {
        return `${nav('My cart', 'nav-back')}
          <div class="scr-body"><div class="empty-state"><div class="es-ic">${icon('cart', 30, 1.8)}</div>
            <b>Your cart is empty</b><span>Add a service and it will wait here until you check out.</span></div></div>
          <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="goto" data-id="cats">Browse services</button></div>`;
      }
      const pats = selectedPatients();
      return `${nav('My cart', 'nav-back', `<button class="nav-link" type="button" data-act="clear-cart">Clear all</button>`)}
        <div class="scr-body">
          ${stepBar(1)}
          ${S.coupon ? `<div class="b-applied">${icon('check', 16, 2.6)}<span>${S.coupon.code} applied — you save ${aed(t.off)}</span><button type="button" data-act="drop-coupon">Remove</button></div>` : ''}
          ${items.map(i => `<div class="b-item"><div class="head"><span class="tile">${icon('stetho', 19, 2)}</span>
              <span style="flex:1"><b>${i.name}</b><small>${i.sub} · ${i.dur}</small></span>
              <button class="x" type="button" data-act="rm-item" data-k="${i.key}" aria-label="Remove">${icon('x', 16, 2.4)}</button></div>
              ${i.night ? `<div class="b-night">${icon('clock', 13, 2.2)}<span>Night visit surcharge ${aed(i.night)} — rule to confirm with FRH</span></div>` : ''}
              <div class="foot"><div class="b-qty"><button type="button" data-act="qty" data-k="${i.key}" data-d="-1" ${i.qty === 1 ? 'disabled' : ''}>${icon('minus', 14, 2.4)}</button><span>${i.qty}</span><button type="button" data-act="qty" data-k="${i.key}" data-d="1">${icon('plus', 14, 2.4)}</button></div>
                <span class="price">${aed(i.price * i.qty)}</span></div></div>`).join('')}

          <div class="sec-h" style="margin:22px 0 8px"><h4>Who is this for?</h4></div>
          <button class="b-pick on" type="button" data-act="goto" data-id="who"><span class="tile">${icon('users', 18, 2)}</span>
            <span class="mid"><b>${pats.map(p => p.name).join(', ')}</b><small>${pats.length} patient${pats.length > 1 ? 's' : ''} · tap to change</small></span>${icon('chevRight', 18, 2.2)}</button>

          <div class="b-coupon"><div class="b-coupon-row" data-act="toggle-coupons">${icon('sparkle', 18, 2.2)}<b>Apply a coupon</b>${icon(S.showCoupons ? 'chevUp' : 'chevDown', 18, 2.2)}</div>
            ${S.showCoupons ? B.coupons.map(c => `<div class="b-cp" data-act="use-coupon" data-code="${c.code}"><span class="code">${c.code}</span>
              <span style="flex:1"><b>${c.pct ? c.pct + '% off' : aed(c.flat) + ' off'}</b><small>${c.desc}</small></span>${icon('chevRight', 16, 2.2)}</div>`).join('') : ''}</div>

          <div class="b-sum">
            <div class="sum-line"><span>Subtotal</span><span>${aed(t.sub)}</span></div>
            ${t.night ? `<div class="sum-line"><span>Night visit surcharge</span><span>${aed(t.night)}</span></div>` : ''}
            ${t.off ? `<div class="sum-line off"><span>Coupon ${S.coupon.code}</span><span>− ${aed(t.off)}</span></div>` : ''}
            <div class="sum-line"><span>VAT (5%)</span><span>${aed(t.vat)}</span></div>
            <div class="sum-line total"><span>Total</span><span>${aed(t.total)}</span></div></div>

          <div class="b-trust"><span>${icon('lock', 15, 2.2)} Secure payment</span><span>${icon('shieldCheck', 15, 2.2)} DHA licensed</span><span>${icon('card', 15, 2.2)} Insured service</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="checkout">Review &amp; confirm</button>
          <p class="b-final">Final amount <b>${aed(t.total)}</b> · VAT included</p></div>`;
    },
  };

  /* ================= 5.1 when sheet ================= */
  const DAYS = () => [...Array(6)].map((_, i) => { const d = new Date(Date.now() + i * 864e5); return { k: i, top: i === 0 ? 'Today' : i === 1 ? 'Tom' : d.toLocaleDateString('en-US', { weekday: 'short' }), n: d.getDate(), m: d.toLocaleDateString('en-US', { month: 'short' }) }; });
  const SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];
  F.SHEETS.when = () => {
    const later = S.whenMode === 'later';
    return `<div class="sheet" role="dialog" aria-label="Choose a time"><div class="grab"></div>
      <h2 style="text-align:left">When should we come?</h2>
      <div class="seg-tabs" style="margin-top:14px"><button type="button" data-act="when-mode" data-m="now" class="${later ? '' : 'on'}">Book now</button><button type="button" data-act="when-mode" data-m="later" class="${later ? 'on' : ''}">Schedule later</button></div>
      <div style="text-align:left">${later ? `
        <div class="sec-h" style="margin:18px 0 10px"><h4>Date</h4></div>
        <div class="hrow">${DAYS().map(d => `<button class="date-chip ${S.whenDate === d.k ? 'on' : ''}" type="button" data-act="when-date" data-k="${d.k}"><small>${d.top}</small><b>${d.n}</b><span>${d.m}</span></button>`).join('')}</div>
        <div class="sec-h" style="margin:18px 0 10px"><h4>Time</h4></div>
        <div class="time-grid">${SLOTS.map((t, i) => `<button class="slot ${S.whenTime === t ? 'on' : ''} ${i === 3 ? 'full' : ''}" type="button" ${i === 3 ? 'disabled' : `data-act="when-time" data-t="${t}"`}>${t}${i === 3 ? '<small>Full</small>' : ''}</button>`).join('')}</div>`
      : `<div class="info-card" style="margin-top:16px"><div class="info-row"><span class="tile">${icon('clock', 17, 2)}</span><div class="ir-mid"><b>Next available team</b><small>At your door in about 45 minutes</small></div><span class="pill green live"><i></i>Now</span></div></div>
         <div class="flag-note" style="margin-top:12px">${icon('alert', 14, 2.2)}<span>Visits booked after 10 PM carry a night surcharge — amount to be confirmed by FRH.</span></div>`}</div>
      <button class="btn btn-primary" type="button" data-act="when-go" style="margin-top:18px">${later ? 'Confirm slot' : 'Continue'}</button></div>`;
  };

  /* ================= 5.2 patients ================= */
  const selectedPatients = () => { S.pats = S.pats || [0]; return S.pats.map(i => B.patients[i]).filter(Boolean); };
  F.SCREENS.who = {
    status: 'dark', cls: 'who',
    render() {
      S.pats = S.pats || [0];
      const chips = ['Fever', 'Cough & cold', 'Stomach pain', 'Back pain', 'Follow-up', 'Blood test'];
      return `${nav('Who is this visit for?', 'goto-confirm')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Your clinician sees this before the visit. You can add more than one patient.</p>
          ${B.patients.map((p, i) => `<button class="b-pick ${S.pats.includes(i) ? 'on' : ''}" type="button" data-act="pick-pat" data-i="${i}">
            <span class="b-check">${icon('check', 14, 3)}</span><span class="mid"><b>${p.name} <span class="pill ink">${p.rel}</span></b><small>${p.age} yrs · ${p.gender} · Blood ${p.blood} · ${p.phone}</small></span></button>`).join('')}
          <button class="btn btn-secondary" type="button" data-act="add-patient" style="margin-top:12px">${icon('plus', 18, 2.4)} Add a new patient</button>
          <div class="sec-h" style="margin:24px 0 4px"><h4>What’s the problem?</h4></div>
          <p class="sec-sub">Optional. A line or two helps the clinician prepare.</p>
          <div class="b-chips">${chips.map(c => `<button class="b-chip ${(S.issue || '').includes(c) ? 'on' : ''}" type="button" data-act="pick-issue" data-c="${c}">${c}</button>`).join('')}</div>
          <div class="b-note-box ${S.issue ? '' : 'empty'}">${S.issue || 'Tap a chip above, or describe the symptoms in your own words in the real app.'}</div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${S.pats.length ? '' : 'off'}" type="button" data-act="who-next">Continue</button></div>`;
    },
  };
  F.SHEETS.addpatient = () => `<div class="sheet" role="dialog" aria-label="Add a patient"><div class="grab"></div>
      <div class="sh-ic red">${icon('users', 32, 1.9)}</div><h2>Add a new patient</h2>
      <p>The real app collects name, date of birth, gender, blood group and a contact number here.</p>
      <div class="flag-note" style="text-align:left">${icon('alert', 14, 2.2)}<span>Form entry is out of scope for this prototype — tap below to add a sample family member instead.</span></div>
      <div class="stack" style="margin-top:16px"><button class="btn btn-primary" type="button" data-act="do-add-patient">Add sample patient</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;

  /* ================= 5.3 address ================= */
  const MAPMINI = `<svg viewBox="0 0 345 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="345" height="190" fill="#EDE8DF"/>
    <g fill="#E4DFD3"><rect x="10" y="8" width="120" height="60" rx="6"/><rect x="150" y="4" width="90" height="52" rx="6"/><rect x="258" y="14" width="80" height="58" rx="6"/><rect x="14" y="120" width="104" height="62" rx="6"/><rect x="236" y="116" width="100" height="66" rx="6"/></g>
    <rect x="140" y="96" width="76" height="60" rx="8" fill="#DCE8CE"/>
    <g stroke="#fff" stroke-linecap="round"><path d="M-10 86h365" stroke-width="14"/><path d="M128 -10v210" stroke-width="12"/></g></svg>`;
  F.SCREENS.where = {
    status: 'dark', cls: 'where',
    render() {
      S.addr = S.addr === undefined ? B.addresses.findIndex(a => a.def) : S.addr;
      return `${nav('Where should we visit?', 'goto-confirm')}
        <div class="scr-body">
          ${B.addresses.map((a, i) => `<button class="b-pick ${S.addr === i ? 'on' : ''}" type="button" data-act="pick-addr" data-i="${i}">
            <span class="tile">${icon(a.label === 'Home' ? 'home' : 'file', 18, 2)}</span>
            <span class="mid"><b>${a.label} ${a.def ? '<span class="pill green">Default</span>' : ''}</b><small>${a.line}<br>${a.note}</small></span>
            <span class="radio"></span></button>`).join('')}
          <div class="sec-h" style="margin:22px 0 4px"><h4>Add a new address</h4></div>
          <p class="sec-sub">Drop a pin and we’ll save it for next time.</p>
          <div class="b-map">${MAPMINI}<span class="pin">${icon('pin', 34, 2)}</span></div>
          <button class="btn btn-secondary" type="button" data-act="use-pin" style="margin-top:10px">${icon('pin', 18, 2)} Use this location</button>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="where-next">Confirm location</button></div>`;
    },
  };

  /* ================= 5.4 payment ================= */
  F.SCREENS.payment = {
    status: 'dark', cls: 'payment',
    render() {
      S.pay = S.pay || 'visa';
      return `${nav('Payment method', 'goto-confirm')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Nothing is charged until you confirm the booking.</p>
          ${B.payments.map(p => `<button class="b-pick ${S.pay === p.key ? 'on' : ''} ${p.off ? 'off' : ''}" type="button" ${p.off ? `data-act="soon" data-msg="Insurance billing is still to be confirmed with FRH"` : `data-act="pick-pay" data-k="${p.key}"`}>
            <span class="tile">${icon(p.icon, 18, 2)}</span><span class="mid"><b>${p.label}</b><small>${p.sub}</small></span><span class="radio"></span></button>`).join('')}
          <div class="b-trust" style="margin-top:18px"><span>${icon('lock', 15, 2.2)} 3-D Secure</span><span>${icon('shieldCheck', 15, 2.2)} No card details stored</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="goto-confirm">Use this method</button></div>`;
    },
  };

  /* ================= 5.1–5.4 confirm (one screen) ================= */
  F.SCREENS.confirm = {
    status: 'dark', cls: 'confirm',
    render() {
      const t = totals(), items = cart(), a = B.addresses[S.addr === undefined ? 0 : S.addr];
      const pay = B.payments.find(p => p.key === (S.pay || 'visa'));
      const when = S.whenMode === 'later' && S.whenTime ? `${dayLabel()} · ${S.whenTime}` : 'Next available · about 45 min';
      const row = (ic, label, value, sub, act) => `<div class="b-row" ${act}>
          <span class="tile">${icon(ic, 17, 2)}</span>
          <span class="mid"><small>${label}</small><b>${value}</b>${sub ? `<em>${sub}</em>` : ''}</span>
          <span class="edit">Edit</span></div>`;
      return `${nav('Confirm booking', 'goto-cart')}
        <div class="scr-body">
          ${stepBar(2)}
          <div class="info-card b-rows">
            ${row('clock', 'When', when, S.whenMode === 'later' ? 'Rescheduling is free up to 4 hrs before' : 'A team is free now', 'data-act="edit-when"')}
            ${row('users', 'Who', selectedPatients().map(p => p.name).join(', '), S.issue || 'No symptoms added', 'data-act="goto" data-id="who"')}
            ${row('pin', 'Where', `${a.label} · ${a.line}`, a.note, 'data-act="goto" data-id="where"')}
            ${row(pay.icon, 'Payment', pay.label, pay.sub, 'data-act="goto" data-id="payment"')}
          </div>
          <div class="sec-h" style="margin:22px 0 10px"><h4>${items.length} ${items.length === 1 ? 'service' : 'services'}</h4>
            <button class="link" type="button" data-act="goto-cart">Edit cart</button></div>
          <div class="b-sum" style="margin-top:0">
            ${items.map(i => `<div class="sum-line"><span>${i.name}${i.qty > 1 ? ` × ${i.qty}` : ''}</span><span>${aed(i.price * i.qty)}</span></div>`).join('')}
            ${t.night ? `<div class="sum-line"><span>Night visit surcharge</span><span>${aed(t.night)}</span></div>` : ''}
            ${t.off ? `<div class="sum-line off"><span>Coupon ${S.coupon.code}</span><span>− ${aed(t.off)}</span></div>` : ''}
            <div class="sum-line"><span>VAT (5%)</span><span>${aed(t.vat)}</span></div>
            <div class="sum-line total"><span>Total</span><span>${aed(t.total)}</span></div></div>
          ${t.night ? `<div class="flag-note" style="margin-top:12px">${icon('alert', 14, 2.2)}<span>The night surcharge and the 4-hour free-cancellation window are placeholders for FRH to confirm.</span></div>` : ''}
          <div class="b-trust" style="margin-top:16px"><span>${icon('lock', 15, 2.2)} Secure payment</span><span>${icon('shieldCheck', 15, 2.2)} DHA licensed</span><span>${icon('card', 15, 2.2)} Insured service</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${S.paying ? 'loading' : ''}" type="button" data-act="pay">${S.paying ? '<span class="spin"></span>Processing…' : `Confirm &amp; pay ${aed(t.total)}`}</button>
          <p class="b-final">You can reschedule or cancel free of charge up to 4 hours before.</p></div>`;
    },
  };

  const dayLabel = () => { const d = DAYS()[S.whenDate || 0]; return d.k === 0 ? 'Today' : d.k === 1 ? 'Tomorrow' : `${d.top} ${d.n} ${d.m}`; };

  /* ================= 5.5 paid ================= */
  F.SHEETS.paid = () => `<div class="sheet b-paid" role="dialog" aria-label="Payment completed"><div class="grab"></div>
      <div class="ok-badge" style="width:96px;height:96px"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#12805A"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h2 style="margin-top:14px">Payment completed</h2>
      <p>Your booking <b>${S.newBooking || ''}</b> is confirmed. We’ve sent the details to WhatsApp, and you can track the team on the day.</p>
      <button class="btn btn-primary" type="button" data-act="paid-go">Got it</button></div>`;

  function completeBooking() {
    const items = cart(), t = totals();
    const id = 'FRH-' + (24900 + Math.floor(Math.random() * 90));
    const a = B.addresses[S.addr] || B.addresses[0];
    D.appointments.upcoming.unshift({
      id, status: 'confirmed', statusLabel: 'Confirmed', badge: 'NEW',
      service: items[0].name, sub: items.length > 1 ? `+ ${items.length - 1} more service${items.length > 2 ? 's' : ''}` : items[0].sub,
      date: S.whenMode === 'later' && S.whenTime ? dayLabel() : 'Today',
      time: S.whenMode === 'later' && S.whenTime ? S.whenTime : 'Next available · ~45 min',
      patients: selectedPatients().map(p => p.name), address: `${a.label} · ${a.line}`,
      team: 'Team being assigned', total: Math.round(t.total),
    });
    S.newBooking = id;
    S.cart = []; S.coupon = null; S.showCoupons = false;
  }

  /* ================= actions ================= */
  Object.assign(F.ACT, {
    'nav-back': n => F.back(n && n.dataset && n.dataset.fb || 'home'),
    goto: n => { const id = n.dataset.id; if (F.SCREENS[id]) F.go(id); else F.toast('That screen is still being built', 'sparkle'); },
    'open-cat': n => { S.cat = n.dataset.k; if (B.subcats[S.cat]) F.go('subcat'); else F.toast(`${catName(S.cat)} listing is placeholder-only for now`, 'sparkle'); },
    'open-svc': n => { S.svc = n.dataset.id; S.svcTab = 'high'; S.svcTab2 = 'rev'; F.go('service'); },
    'back-svc': () => F.back('cats'),
    'back-doc': () => F.back('service'),
    'add-cart': (n, e) => { if (e) e.stopPropagation(); addToCart(n.dataset.id); },
    'book-svc': n => { addToCart(n.dataset.id); F.go('cart'); },
    'open-variants': (n, e) => { if (e) e.stopPropagation(); S.svc = n.dataset.id; S.variant = 0; F.openSheet('variants'); },
    'pick-variant': n => { S.variant = +n.dataset.i; F.closeSheet(true); F.openSheet('variants'); },
    'proceed-variant': () => { const v = B.variants.options[S.variant || 0]; F.closeSheet(); addToCart(S.svc || 'nad', v); },
    'svc-tab': n => { S.svcTab = n.dataset.t; F.upd(); },
    'svc-tab2': n => { S.svcTab2 = n.dataset.t; F.upd(); },
    fav: () => F.toast('Saved to your favourites', 'heart'),
    qty: n => { const i = cart().find(x => x.key === n.dataset.k); if (i) { i.qty = Math.max(1, i.qty + +n.dataset.d); F.upd(); } },
    'rm-item': n => { S.cart = cart().filter(x => x.key !== n.dataset.k); F.upd(); F.toast('Removed from cart', 'check'); },
    'clear-cart': () => { S.cart = []; S.coupon = null; F.upd(); F.toast('Cart cleared', 'check'); },
    'toggle-coupons': () => { S.showCoupons = !S.showCoupons; F.upd(); },
    'use-coupon': n => { S.coupon = B.coupons.find(c => c.code === n.dataset.code); S.showCoupons = false; F.upd(); F.toast(`${S.coupon.code} applied`, 'check'); },
    'drop-coupon': () => { S.coupon = null; F.upd(); },
    checkout: () => { S.whenMode = S.whenMode || 'now'; S.checking = true; S.addr = S.addr === undefined ? B.addresses.findIndex(a => a.def) : S.addr; F.go('confirm'); },
    'edit-when': () => F.openSheet('when'),
    'goto-confirm': () => F.go(S.checking ? 'confirm' : 'cart', { dir: 'back' }),
    'when-mode': n => { S.whenMode = n.dataset.m; F.closeSheet(true); F.openSheet('when'); },
    'when-date': n => { S.whenDate = +n.dataset.k; F.closeSheet(true); F.openSheet('when'); },
    'when-time': n => { S.whenTime = n.dataset.t; F.closeSheet(true); F.openSheet('when'); },
    'when-go': () => {
      if (S.whenMode === 'later' && (S.whenDate === undefined || !S.whenTime)) return F.shake('.time-grid');
      F.closeSheet(); F.upd();
    },
    'goto-cart': () => { S.checking = false; F.go('cart', { dir: 'back' }); },
    'goto-who': () => F.go('who', { dir: 'back' }),
    'goto-where': () => F.go('where', { dir: 'back' }),
    'pick-pat': n => { const i = +n.dataset.i; S.pats = S.pats || [0]; S.pats = S.pats.includes(i) ? S.pats.filter(x => x !== i) : [...S.pats, i]; F.upd(); },
    'pick-issue': n => { const c = n.dataset.c; const cur = S.issue || ''; S.issue = cur.includes(c) ? cur.replace(new RegExp(`(, )?${c}`), '').replace(/^, /, '') : (cur ? `${cur}, ${c}` : c); F.upd(); },
    'add-patient': () => F.openSheet('addpatient'),
    'do-add-patient': () => { B.patients.push({ name: 'Layla Ahmed', rel: 'Daughter', age: 9, gender: 'Female', blood: 'O+', phone: '—' }); S.pats = [...(S.pats || [0]), B.patients.length - 1]; F.closeSheet(); F.upd(); F.toast('Patient added', 'check'); },
    'who-next': () => { if (!(S.pats || []).length) return F.shake('.b-pick'); F.go(S.checking ? 'confirm' : 'cart', { dir: 'back' }); },
    'pick-addr': n => { S.addr = +n.dataset.i; F.upd(); },
    'use-pin': () => F.toast('In the real app this saves a new address', 'pin'),
    'where-next': () => F.go(S.checking ? 'confirm' : 'cart', { dir: 'back' }),
    'pick-pay': n => { S.pay = n.dataset.k; F.upd(); },
    pay: () => {
      if (S.paying) return;
      S.paying = true; F.upd();
      setTimeout(() => { S.paying = false; completeBooking(); F.openSheet('paid'); }, 1400);
    },
    'paid-go': () => { S.checking = false; F.closeSheet(); S.apptTab = 'upcoming'; setTimeout(() => F.go('appts', { dir: 'fade' }), 260); },
  });
})();
