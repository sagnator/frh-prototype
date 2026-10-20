/* Final v42: Rewards (new) and Coupons (redesigned), from Account.
   rewards   FRH points: balance and what it's worth, progress to the next reward, rewards to redeem (with a confirm
             sheet, v42-redeem), ways to earn, refer a friend, and recent points history.
             Mobbin: CHOPT (points card + Use points), adidas (trade points for a voucher), Taco Bell (next free item bar),
             Gymshark (How do I earn?).
   coupons   Enter a code, then Available / Used / Expired. Ticket cards with the conditions, an expiry countdown, the code
             to copy, Details (terms) and Apply; with a cart, each coupon says what it saves and the best one leads.
             Rewards you redeem land here. Mobbin: Swiggy (best coupon + save on this order), Trip.com (tabs, expiring
             soon), Agoda (applied coupon), Keeta (ticket cards).
   Applying a coupon uses the cart's own coupon logic (F.sApplyCoupon) when it knows the code. */
(function () {
  const F = window.FRH, S = F.S, { icon } = window.FRHI;
  const esc = F.esc;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const aed = n => `AED ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const XI = {
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5"/><path d="M12 8.5V21"/><path d="M12 8.5S10.5 3.6 7.8 4.1C5.6 4.6 6.4 8.5 12 8.5z"/><path d="M12 8.5s1.5-4.9 4.2-4.4c2.2.5 1.4 4.4-4.2 4.4z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  };
  const xi = (n, s = 18, w = 2) => XI[n] ? `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XI[n]}</svg>` : icon(n, s, w);

  /* ---------- points ---------- */
  const PT_AED = 0.05;                                  /* 1 point = AED 0.05 */
  if (S.v42pts == null) S.v42pts = 1240;
  const REWARDS = [
    { id: 'r25', pts: 500, title: 'AED 25 off any visit', sub: 'Home visits, tests and IV therapy', ic: 'tag', tint: '', code: 'PTS25', flat: 25 },
    { id: 'rtele', pts: 1500, title: 'Free video consultation', sub: 'A GP on video, worth AED 99', ic: 'video', tint: 'blue', code: 'PTSVIDEO', flat: 99 },
    { id: 'r100', pts: 2000, title: 'AED 100 off IV therapy', sub: 'Any IV drip at home', ic: 'drip', tint: 'violet', code: 'PTSIV100', flat: 100 },
    { id: 'rvitd', pts: 2500, title: 'Free vitamin D test', sub: 'Home sample, results in 24 hrs', ic: 'lab', tint: 'green', code: 'PTSVITD', flat: 120 },
  ];
  const EARN = [
    { ic: 'calendar', t: 'Book a visit', s: '1 point for every AED 1 you spend', p: '1 / AED' },
    { ic: 'users', t: 'Refer a friend', s: 'When they book their first visit', p: '+500' },
    { ic: 'starFill', t: 'Rate your visit', s: 'After every completed visit', p: '+50' },
    { ic: 'user', t: 'Complete your health profile', s: 'Done, thank you', p: '+100', done: true },
    { ic: 'users', t: 'Add a family member', s: 'Then book for them in one tap', p: '+100' },
  ];
  const HIST0 = [
    { t: 'Doctor on Call', s: 'Today', p: 420 },
    { t: 'Rated your IV therapy visit', s: '3 Sep', p: 50 },
    { t: 'Redeemed AED 25 off', s: '28 Aug', p: -500 },
    { t: 'Referral: Omar joined FRH', s: '20 Aug', p: 500 },
    { t: 'Lab Tests visit', s: '16 Aug', p: 240 },
  ];
  const hist = () => (S.v42hist || []).concat(HIST0);
  const nextReward = () => REWARDS.find(r => r.pts > S.v42pts) || null;

  function rewardsHTML() {
    const pts = S.v42pts, nx = nextReward();
    const pct = nx ? Math.min(100, Math.round(pts / nx.pts * 100)) : 100;
    const card = `<div class="v42-pts">
        <div class="v42-pts-top"><span class="v42-pts-lbl">${xi('gift', 15, 2.2)} FRH points</span><button class="v42-pts-h" type="button" data-act="v42-hist">${xi('history', 14, 2.2)} History</button></div>
        <div class="v42-pts-n"><b>${pts.toLocaleString('en-US')}</b><span>points · worth ${aed(pts * PT_AED)}</span></div>
        ${nx ? `<div class="v42-bar"><i style="width:${pct}%"></i></div>
          <p class="v42-pts-nx"><b>${(nx.pts - pts).toLocaleString('en-US')} points</b> to ${nx.title.charAt(0).toLowerCase() + nx.title.slice(1)}</p>`
        : '<p class="v42-pts-nx">You can redeem every reward below.</p>'}
      </div>`;
    const rewards = REWARDS.map(r => {
      const ok = pts >= r.pts;
      return `<div class="v42-rw ${ok ? '' : 'lock'}">
          <span class="tile ${r.tint}">${xi(r.ic, 19, 2)}</span>
          <span class="v42-rw-m"><b>${r.title}</b><small>${r.sub}</small><em>${r.pts.toLocaleString('en-US')} points</em></span>
          ${ok ? `<button class="v42-rw-b" type="button" data-act="v42-redeem" data-id="${r.id}">Redeem</button>`
            : `<span class="v42-rw-need">${(r.pts - pts).toLocaleString('en-US')} more</span>`}
        </div>`;
    }).join('');
    const earn = EARN.map(e => `<div class="v42-earn ${e.done ? 'done' : ''}"><span class="tile">${xi(e.ic, 17, 2)}</span>
        <span class="v42-earn-m"><b>${e.t}</b><small>${e.s}</small></span><span class="v42-earn-p">${e.done ? icon('check', 14, 2.6) : ''}${e.p}</span></div>`).join('');
    const refer = `<div class="v42-ref">
        <div><b>Give AED 50, get 500 points</b><span>Friends get AED 50 off their first home visit. You get 500 points when they book.</span></div>
        <div class="v42-ref-code"><span>Your code</span><b>SARA50</b><button type="button" data-act="v42-share">${icon('share', 15, 2.2)} Invite</button></div>
      </div>`;
    const h = hist().slice(0, S.v42allHist ? 20 : 4).map(x => `<div class="v42-h"><span class="v42-h-m"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>
        <span class="v42-h-p ${x.p < 0 ? 'neg' : ''}">${x.p > 0 ? '+' : '−'}${Math.abs(x.p).toLocaleString('en-US')}</span></div>`).join('');
    return `${card}
      <div class="sec-h v42-sech"><h4>Redeem your points</h4><span class="v42-secx">Added to your coupons</span></div>
      <div class="v42-list">${rewards}</div>
      <div class="sec-h v42-sech"><h4>Ways to earn</h4></div>
      <div class="v42-list">${earn}</div>
      <div class="sec-h v42-sech"><h4>Refer a friend</h4></div>
      ${refer}
      <div class="sec-h v42-sech" id="v42-hist"><h4>Points history</h4>${hist().length > 4 ? `<button class="link" type="button" data-act="v42-allhist">${S.v42allHist ? 'Show less' : 'See all'}</button>` : ''}</div>
      <div class="v42-list">${h}</div>
      <p class="v42-small">1 point is worth AED 0.05. Points last 12 months from the day you earn them. Rewards can't be exchanged for cash.</p>`;
  }
  F.SCREENS.rewards = {
    status: 'dark', cls: 'v42-rewards',
    render() {
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Rewards</span><button class="nav-link" type="button" data-act="v42-to-cpn">Coupons</button></div>
        <div class="scr-body" data-s="body"></div>`;
    },
    update(n) { setHTML(n.querySelector('[data-s="body"]'), rewardsHTML()); },
  };

  /* redeem: confirm before spending points */
  F.SHEETS['v42-redeem'] = () => {
    const r = REWARDS.find(x => x.id === S.v42rw) || REWARDS[0], left = S.v42pts - r.pts;
    return `<div class="sheet v42-sheet" role="dialog" aria-label="Redeem ${esc(r.title)}"><div class="grab"></div>
        <span class="tile ${r.tint} v42-sheet-ic">${xi(r.ic, 24, 2)}</span>
        <h2>${r.title}</h2>
        <p>${r.sub}. It goes into your coupons as <b>${r.code}</b>, ready for your next booking, and lasts 90 days.</p>
        <div class="v42-sheet-sum"><div><span>Points to use</span><b>${r.pts.toLocaleString('en-US')}</b></div><div><span>Left after</span><b>${left.toLocaleString('en-US')}</b></div></div>
        <div class="stack"><button class="btn btn-primary" type="button" data-act="v42-redeem-ok" data-id="${r.id}">Redeem ${r.pts.toLocaleString('en-US')} points</button>
          <button class="btn btn-ghost" type="button" data-act="sheet-close">Not now</button></div>
      </div>`;
  };

  /* ---------- coupons ---------- */
  const OFFERS = [
    { code: 'WELCOME20', title: 'Welcome offer', desc: '20% off your first home visit.', pct: 20, max: 150, min: 0, days: 11, src: 'offer',
      terms: ['First booking on this account only', 'Up to AED 150 off', 'Not with other coupons or plan visits'] },
    { code: 'IVWEEK15', title: 'Weekday IV therapy', desc: '15% off any IV drip booked Monday to Thursday.', pct: 15, max: 200, min: 300, days: 26, src: 'offer', cat: 'iv',
      terms: ['IV therapy only, Monday to Thursday', 'Minimum AED 300', 'Up to AED 200 off'] },
    { code: 'FRH500', title: 'Annual health package', desc: 'AED 500 off health packages.', flat: 500, min: 1499, days: 72, src: 'offer', cat: 'checkup',
      terms: ['Health packages from AED 1,499', 'One use per account'] },
    { code: 'FAMILY10', title: 'Family visit', desc: '10% off when you book for two or more people.', pct: 10, max: 120, min: 400, days: 5, src: 'offer',
      people: 2, terms: ['Two or more people in one visit', 'Minimum AED 400', 'Up to AED 120 off'] },
  ];
  const CODES = { FRIEND50: { code: 'FRIEND50', title: 'Friend’s invite', desc: 'AED 50 off your first home visit.', flat: 50, min: 200, days: 30, src: 'code', terms: ['First home visit only', 'Minimum AED 200'] } };
  const USED = [
    { code: 'SUMMER15', title: 'Summer offer', note: 'Used on 12 Aug · you saved AED 45', badge: ['15%', 'OFF'] },
    { code: 'PTS25', title: 'AED 25 off any visit', note: 'Used on 28 Aug · from your points', badge: ['25', 'AED'] },
  ];
  const EXPIRED = [
    { code: 'RAMADAN20', title: 'Ramadan wellness', note: 'Expired on 30 Mar', badge: ['20%', 'OFF'] },
    { code: 'NADPLUS', title: 'NAD+ launch', note: 'Expired on 15 Jan', badge: ['100', 'AED'] },
  ];
  const mine = () => (S.v42mine || []).concat(S.v42added || []);
  const available = () => mine().concat(OFFERS);
  const cartTotal = () => { try { return F.cartCount && F.cartCount() > 0 && F.sCartTotal ? F.sCartTotal() : 0; } catch (e) { return 0; } };
  const CATN = { iv: 'IV therapy', checkup: 'health package' };
  const cartItems = () => (S.cart || []);
  /* what a coupon saves on the cart now, or why it doesn't apply yet */
  const fit = (c, t) => {
    if (!t) return { sv: 0, why: '' };
    if (c.cat && !cartItems().some(i => i.cat === c.cat)) return { sv: 0, why: `For ${CATN[c.cat] || c.cat} bookings` };
    if (c.people && !cartItems().some(i => (i.qty || 1) >= c.people)) return { sv: 0, why: 'Book for two or more people to use it' };
    if (t < (c.min || 0)) return { sv: 0, why: `Add ${aed2((c.min || 0) - t)} more to use it` };
    return { sv: c.flat ? Math.min(c.flat, t) : Math.min(t * c.pct / 100, c.max || Infinity), why: '' };
  };
  const saves = (c, t) => fit(c, t).sv;
  const aed2 = n => Number.isInteger(n) ? aed(n) : `AED ${(Math.round(n * 100) / 100).toFixed(2)}`;
  const badgeOf = c => c.flat ? [String(c.flat), 'AED'] : [`${c.pct}%`, 'OFF'];
  const expTxt = d => d <= 1 ? 'Expires today' : d <= 7 ? `Expires in ${d} days` : `Valid for ${d} days`;
  const conds = c => [c.min ? `Min. ${aed(c.min)}` : 'No minimum', c.max ? `up to ${aed(c.max)} off` : ''].filter(Boolean).join(' · ');

  function cpnCard(c, t, best) {
    const on = S.coupon && S.coupon.code === c.code, { sv, why } = fit(c, t), open = S.v42open === c.code, [v, u] = badgeOf(c);
    return `<div class="v42-cp src-${c.src} ${on ? 'on' : ''}">
        <div class="v42-cp-band"><b>${v}</b><small>${u}</small></div>
        <div class="v42-cp-m">
          <div class="v42-cp-top"><b>${esc(c.title)}</b>${best ? '<span class="v42-best">Best for your cart</span>' : c.src === 'points' ? '<span class="v42-src">From points</span>' : c.src === 'code' ? '<span class="v42-src">Added</span>' : ''}</div>
          <p>${esc(c.desc)}</p>
          <span class="v42-cp-cond">${conds(c)}</span>
          ${t ? (sv ? `<span class="v42-cp-save">${icon('check', 13, 2.8)} Saves ${aed2(sv)} on your cart</span>`
            : `<span class="v42-cp-no">${why}</span>`) : ''}
          <div class="v42-cp-code"><button type="button" data-act="v42-copy" data-code="${c.code}">${c.code} ${icon('copy', 13, 2.2)}</button><small class="${c.days <= 7 ? 'soon' : ''}">${expTxt(c.days)}</small></div>
          ${open ? `<ul class="v42-terms">${(c.terms || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          <div class="v42-cp-acts"><button class="link" type="button" data-act="v42-terms" data-code="${c.code}">${open ? 'Hide details' : 'Details'}</button>
            <button class="v42-apply ${on ? 'done' : ''}" type="button" data-act="v42-apply" data-code="${c.code}">${on ? `${icon('check', 14, 2.6)} Applied` : 'Apply'}</button></div>
        </div></div>`;
  }
  const pastCard = (c, kind) => `<div class="v42-cp past"><div class="v42-cp-band"><b>${c.badge[0]}</b><small>${c.badge[1]}</small></div>
      <div class="v42-cp-m"><div class="v42-cp-top"><b>${esc(c.title)}</b><span class="v42-src">${kind}</span></div><span class="v42-cp-cond">${esc(c.note)}</span>
        <div class="v42-cp-code"><span class="v42-code-off">${c.code}</span></div></div></div>`;

  function couponsHTML() {
    const tab = S.v42tab || 'avail', t = cartTotal(), A = available();
    const sorted = t ? A.slice().sort((a, b) => saves(b, t) - saves(a, t)) : A;
    const bestCode = t && saves(sorted[0], t) > 0 ? sorted[0].code : null;
    const field = `<div class="v42-code ${S.v42err ? 'err' : ''}">${xi('tag', 17, 2)}
        <input id="v42-code" type="text" placeholder="Enter a coupon code" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(S.v42q || '')}">
        <button type="button" data-act="v42-code-apply">Apply</button></div>
      ${S.v42err ? `<p class="v42-code-err">${icon('alert', 13, 2.4)} ${esc(S.v42err)}</p>` : `<p class="v42-code-hint">Try FRIEND50, a friend’s invite code.</p>`}`;
    const tabs = `<div class="v42-tabs" role="tablist">${[['avail', 'Available', A.length], ['used', 'Used', USED.length], ['exp', 'Expired', EXPIRED.length]].map(([k, l, c]) =>
      `<button class="${tab === k ? 'on' : ''}" type="button" role="tab" aria-selected="${tab === k}" data-act="v42-tab" data-t="${k}">${l} <span>${c}</span></button>`).join('')}</div>`;
    const cart = t ? `<p class="v42-cartline">${icon('cart', 14, 2.2)} Your cart: <b>${aed2(t)}</b>. Coupons are sorted by what they save.</p>` : '';
    const body = tab === 'used' ? USED.map(c => pastCard(c, 'Used')).join('')
      : tab === 'exp' ? EXPIRED.map(c => pastCard(c, 'Expired')).join('')
      : cart + sorted.map(c => cpnCard(c, t, c.code === bestCode)).join('');
    return `${field}${tabs}<div class="v42-cps">${body}</div>
      <button class="v42-torew" type="button" data-act="v42-to-rew"><span class="tile">${xi('gift', 18, 2)}</span>
        <span><b>${S.v42pts.toLocaleString('en-US')} points to spend</b><small>Turn points into coupons in Rewards</small></span>${icon('chevRight', 17, 2.2)}</button>
      <p class="v42-small">One coupon per booking. Coupons can't be used on membership fees or with included plan visits.</p>`;
  }
  let cpnFrom = null;
  F.SCREENS.coupons = {
    status: 'dark', cls: 'v42-coupons',
    render() {
      const c = F.cur(); cpnFrom = c ? c.dataset.id : null;
      return `<div class="nav"><button class="nav-btn" type="button" data-act="nav-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">Coupons</span><span style="width:40px"></span></div>
        <div class="scr-body" data-s="body"></div>`;
    },
    update(n) {
      const inp = n.querySelector('#v42-code'), had = inp && document.activeElement === inp;
      setHTML(n.querySelector('[data-s="body"]'), couponsHTML());
      if (had) { const i = n.querySelector('#v42-code'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    },
  };

  /* ---------- actions ---------- */
  const applyCode = c => {
    const ok = typeof F.sApplyCoupon === 'function' && F.sApplyCoupon(c.code);
    if (!ok) S.coupon = { code: c.code, pct: c.pct || 0, flat: c.flat || 0, max: c.max, min: c.min, desc: c.desc };
    if (cpnFrom === 'cart') { F.back('cart'); F.toast(`${c.code} applied to your cart`, 'check'); }
    else if (cartTotal() && F.SCREENS.cart) { F.go('cart'); F.toast(`${c.code} applied to your cart`, 'check'); }
    else { F.upd(); F.toast(`${c.code} will be used on your next booking`, 'check'); }
  };
  const tryCode = () => {
    const i = document.getElementById('v42-code'), q = (i ? i.value : S.v42q || '').trim().toUpperCase();
    S.v42q = q;
    if (!q) { S.v42err = 'Enter a code first.'; return F.upd(); }
    if (available().some(c => c.code === q)) { S.v42err = ''; S.v42q = ''; S.v42tab = 'avail'; F.upd(); return F.toast(`${q} is already in your coupons`, 'check'); }
    const c = CODES[q];
    if (!c) { S.v42err = `“${q}” isn’t a valid code, or it has expired.`; return F.upd(); }
    S.v42added = (S.v42added || []).concat([{ ...c }]); S.v42err = ''; S.v42q = ''; S.v42tab = 'avail';
    F.upd(); F.toast(`${q} added: ${c.desc}`, 'check');
  };
  Object.assign(F.ACT, {
    'v42-redeem': n => { S.v42rw = n.dataset.id; F.openSheet('v42-redeem'); },
    'v42-redeem-ok': n => {
      const r = REWARDS.find(x => x.id === n.dataset.id); if (!r || S.v42pts < r.pts) return F.closeSheet();
      S.v42pts -= r.pts;
      S.v42hist = [{ t: `Redeemed ${r.title}`, s: 'Just now', p: -r.pts }].concat(S.v42hist || []);
      S.v42mine = [{ code: r.code, title: r.title, desc: `${r.sub}.`, flat: r.flat, min: 0, days: 90, src: 'points', terms: ['From your points', 'One use', 'Valid for 90 days'] }].concat((S.v42mine || []).filter(c => c.code !== r.code));
      F.closeSheet(); F.upd(); F.toast(`${r.title} is in your coupons`, 'check');
    },
    'v42-hist': () => { const h = document.querySelector('.scr.cur #v42-hist'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'v42-allhist': () => { S.v42allHist = !S.v42allHist; F.upd(); },
    'v42-share': () => F.toast('Invite link copied: frh.ae/i/SARA50', 'copy'),
    'v42-to-cpn': () => { S.v42tab = 'avail'; F.go('coupons'); },
    'v42-to-rew': () => F.go('rewards'),
    'v42-tab': n => { S.v42tab = n.dataset.t; F.upd(); },
    'v42-copy': n => F.toast(`${n.dataset.code} copied`, 'copy'),
    'v42-terms': n => { S.v42open = S.v42open === n.dataset.code ? null : n.dataset.code; F.upd(); },
    'v42-apply': n => { const c = available().find(x => x.code === n.dataset.code); if (c) applyCode(c); },
    'v42-code-apply': () => tryCode(),
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'v42-code') { e.preventDefault(); tryCode(); } });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'v42-code') { S.v42q = e.target.value; if (S.v42err) { S.v42err = ''; const w = e.target.closest('.v42-code'); if (w) w.classList.remove('err'); } } });

  /* shared with Account (counts) and the panel presets */
  F.v42 = {
    available: () => available().length,
    rewards: () => { F.go('rewards', { dir: 'fade' }); },
    redeem: id => { F.go('rewards', { dir: 'fade' }); setTimeout(() => { if (S.screen === 'rewards') { S.v42rw = id; F.openSheet('v42-redeem'); } }, 450); },
    coupons: (tab, extra) => { S.v42tab = tab || 'avail'; S.v42err = ''; S.v42q = ''; if (extra === 'bad') { S.v42q = 'HEALTH30'; S.v42err = '“HEALTH30” isn’t a valid code, or it has expired.'; } F.go('coupons', { dir: 'fade' }); },
  };
})();
