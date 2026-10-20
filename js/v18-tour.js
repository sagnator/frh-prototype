/* Final v18: first-time walkthrough.
   New users (just signed up, or browsing as a guest) get a short tour on Home: a welcome card,
   then highlights on Ask anything, the service tiles and the five tabs. After that, the first
   visit to the Services tab and to a service page shows one or two tips. Skip ends everything;
   Account > App tour replays the Home tour. */
(function () {
  const F = window.FRH, S = F.S, icon = (n, s, w) => window.FRHI.icon(n, s, w);
  const TOURS = {
    home: [
      { k: 'welcome' },
      { sel: '.v15-ask', r: 99, pad: 5, t: 'Ask anything', s: 'Talk or type. A doctor or our care team replies, and emergencies go straight to 998.' },
      { sel: '.hx-grid-w', r: 24, pad: 6, t: 'Book a visit', s: 'Tap a service to see what’s included and the price, then pick a time. A DHA-licensed clinician comes to you.' },
      { sel: '.m-tab[data-to="cats"]', r: 18, pad: 2, t: 'Services', s: 'Everything FRH offers in one place, with search.' },
      { sel: '.m-tab[data-to="appts"]', r: 18, pad: 2, t: 'Bookings', s: 'Track your clinician live, reschedule, and find reports after each visit.' },
      { sel: '.m-tab[data-to="chat-home"]', r: 18, pad: 2, t: 'Chat', s: 'FRH Support, plus one chat for each booking with the doctor and nurses on it.' },
      { sel: '.m-tab[data-to="profile-home"]', r: 18, pad: 2, t: 'Account', s: 'Family members, addresses, cards and membership. You can replay this tour from here.' },
    ],
    cats: [
      { sel: '.hx-fake', r: 16, pad: 4, t: 'Search anything', s: 'Type a service, a test or a symptom, like “fever” or “vitamin D”.' },
      { sel: '.hx-cfor', r: 12, pad: 6, t: 'Services follow your address', s: 'You see what we offer where the visit is. Anything not there yet is marked Soon.' },
    ],
    service: [
      { sel: '[data-r="facts"]', r: 18, pad: 4, t: 'The key facts', s: 'Rating, when we can be there and how long it takes, at a glance.' },
      { sel: '.s-sbar', r: 22, pad: 6, t: 'Add to cart or Book now', s: 'Book now takes you straight to your cart, where you choose who it’s for, the time and the address, then pay.' },
    ],
  };
  const st = () => (S.v18 = S.v18 || { seen: false, off: false, cats: false, service: false });
  const isNew = () => !!(S.aCreated || S.guest);
  let tour = null, layer = null, waitT = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.className = 'v18-tour'; layer.id = 'v18Tour';
    layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    const bar = document.getElementById('statusbar');
    bar.parentNode.insertBefore(layer, bar);
    layer.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('[data-tour]');
      if (b) ({ next, back, skip })[b.dataset.tour]();
    });
    return layer;
  }

  /* ---------- geometry (screen coordinates, whatever the phone's scale) ---------- */
  /* measured from the tour layer, not the screen: the layer moves with the screen's content even if
     something has scrolled the (overflow:hidden) screen, so the spotlight always lands on its target */
  function rectOf(t) {
    const L = ensureLayer(), R = L.getBoundingClientRect(), k = R.width / L.offsetWidth || 1, a = t.getBoundingClientRect();
    return { x: (a.left - R.left) / k, y: (a.top - R.top) / k, w: a.width / k, h: a.height / k };
  }
  function bringIntoView(t) {
    const body = t.closest('.scr-body');
    if (!body) return;
    const r = rectOf(t), top = 120, bottom = ensureLayer().offsetHeight - 300;
    if (r.y < top) body.scrollTop -= top - r.y;
    else if (r.y + r.h > bottom) body.scrollTop += Math.min(r.y + r.h - bottom, r.y - top);
  }

  /* ---------- drawing ---------- */
  function welcome() {
    const L = ensureLayer();
    L.classList.add('welcome');
    L.innerHTML = `<div class="v18-dim"></div>
      <div class="v18-wcard" aria-labelledby="v18wT">
        <span class="v18-wic">${icon('sparkle', 26, 2)}</span>
        <h2 id="v18wT">Welcome to FRH${S.guest ? '' : `, ${F.esc(F.firstName())}`}</h2>
        <p>Here’s a 20-second look at where everything is. You can replay it any time from Account.</p>
        <button class="btn btn-primary" type="button" data-tour="next">Show me around</button>
        <button class="v18-later" type="button" data-tour="skip">Skip for now</button>
      </div>`;
  }
  function draw(step, t) {
    const L = ensureLayer(), steps = TOURS[tour.kind], first = steps[0].k === 'welcome' ? 1 : 0;
    const N = steps.length - first, i = tour.i - first + 1, last = tour.i === steps.length - 1, home = tour.kind === 'home';
    L.classList.remove('welcome');
    if (!L.querySelector('.v18-spot')) L.innerHTML = '<div class="v18-spot"></div><div class="v18-card"></div>';
    const H = L.offsetHeight, W = L.offsetWidth, p = step.pad || 0, r = rectOf(t);
    const sx = Math.max(6, r.x - p), sy = r.y - p, sw = Math.min(W - 12, r.w + p * 2), sh = r.h + p * 2;
    Object.assign(L.querySelector('.v18-spot').style, { left: sx + 'px', top: sy + 'px', width: sw + 'px', height: sh + 'px', borderRadius: step.r + 'px' });
    const card = L.querySelector('.v18-card'), above = sy + sh / 2 > H * 0.5, cw = W - 32;
    const ax = Math.max(22, Math.min(cw - 22, sx + sw / 2 - 16));
    card.className = 'v18-card ' + (above ? 'above' : 'below');
    card.style.top = above ? 'auto' : (sy + sh + 16) + 'px';
    card.style.bottom = above ? (H - sy + 16) + 'px' : 'auto';
    card.innerHTML = `<span class="v18-arr" style="left:${ax - 7}px"></span>
      <div class="v18-k">${home ? `${i} of ${N}` : `Tip ${i} of ${N}`}</div>
      <b class="v18-t">${step.t}</b><p class="v18-s">${step.s}</p>
      <div class="v18-f"><button class="v18-skip" type="button" data-tour="skip">${home ? 'Skip tour' : 'Skip tips'}</button>
        <span class="v18-dots" aria-hidden="true">${Array.from({ length: N }, (_, k) => `<i class="${k + 1 === i ? 'on' : ''}"></i>`).join('')}</span>
        ${i > 1 ? `<button class="v18-back" type="button" data-tour="back" aria-label="Back">${icon('arrowLeft', 16, 2.4)}</button>` : ''}
        <button class="v18-next" type="button" data-tour="next">${last ? (home ? 'Done' : 'Got it') : 'Next'}</button></div>`;
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  }

  /* ---------- flow ---------- */
  const SCREEN_OF = { home: 'home', cats: 'cats', service: 'service' };
  function show() {
    const steps = TOURS[tour.kind], step = steps[tour.i];
    if (!step) return end(true);
    if (step.k === 'welcome') return welcome();
    const n = F.cur(), t = n && n.querySelector(step.sel);
    if (!t) { tour.i++; return show(); }               /* a target that isn't on screen is skipped, never pointed at blank space */
    bringIntoView(t);
    draw(step, t);
  }
  function start(kind, at) {
    clearTimeout(waitT);
    if (tour || !S.open || S.screen !== SCREEN_OF[kind]) return;
    tour = { kind, i: at || 0 };
    const L = ensureLayer();
    L.innerHTML = ''; L.className = 'v18-tour';
    show();
    if (!tour) return;
    void L.offsetWidth;                                  /* commit opacity 0 first so the fade still runs; no rAF, which a hidden tab never fires */
    L.classList.add('on');
  }
  function next() { if (!tour) return; tour.i++; if (tour.i >= TOURS[tour.kind].length) end(true); else show(); }
  function back() {
    if (!tour) return;
    const first = TOURS[tour.kind][0].k === 'welcome' ? 1 : 0;
    if (tour.i > first) { tour.i--; show(); }
  }
  function skip() { const s = st(); s.off = true; s.seen = true; end(false); }
  function hide() {
    if (!layer) return;
    const L = layer;
    L.classList.remove('on');
    setTimeout(() => { if (!tour) { L.innerHTML = ''; L.className = 'v18-tour'; } }, 280);
  }
  function end(done) {
    if (!tour) return;
    const kind = tour.kind, s = st();
    tour = null;
    if (kind === 'home') s.seen = true; else s[kind] = true;
    hide();
    if (done && kind === 'home') setTimeout(() => { if (S.open && !tour) F.toast('You’re ready. Replay the tour from Account', 'sparkle'); }, 320);
  }
  /* leaving the screen (or the app) drops the tour without counting it as seen */
  function abort() { clearTimeout(waitT); if (tour) { tour = null; hide(); } }

  /* ---------- when to show ---------- */
  function schedule(id) {
    clearTimeout(waitT);
    const s = st();
    const kind = id === 'home' && isNew() && !s.seen && !s.off ? 'home'
      : (id === 'cats' || id === 'service') && s.seen && !s.off && !s[id] ? id : null;
    if (!kind) return;
    let tries = 0;
    const go = () => {
      if (!S.open || S.screen !== id) return;
      const toastUp = kind === 'home' && F.el.toast && F.el.toast.classList.contains('show');
      if (S.sheet || S.kb || toastUp) { if (++tries < 40) waitT = setTimeout(go, 600); return; }   /* wait for sheets, the keyboard and the “You’re all set” toast */
      start(kind, 0);
    };
    waitT = setTimeout(go, kind === 'home' ? 1400 : 700);
  }
  const go0 = F.go;
  F.go = function (id) { abort(); const r = go0.apply(this, arguments); schedule(id); return r; };
  const close0 = F.closeApp;
  if (typeof close0 === 'function') F.closeApp = function () { abort(); return close0.apply(this, arguments); };

  /* ---------- replay: Account > App tour, and the presenter panel ---------- */
  F.ACT['v18-tour'] = () => {
    const s = st(); s.off = false;
    F.go('home', { dir: 'fade' });
    clearTimeout(waitT); waitT = setTimeout(() => start('home', 1), 650);
  };
  F.tourJump = id => {
    const s = st(); s.off = false;
    const run = (kind, at, open) => { abort(); open(); clearTimeout(waitT); waitT = setTimeout(() => start(kind, at), 900); };
    if (id === 'tour-welcome') run('home', 0, () => F.hx.jump('home'));
    else if (id === 'tour-ask') run('home', 1, () => F.hx.jump('home'));
    else if (id === 'tour-tabs') run('home', 3, () => F.hx.jump('home'));
    else if (id === 'tips-services') { s.seen = true; run('cats', 0, () => F.hx.jump('cats')); }
    else if (id === 'tips-service') { s.seen = true; run('service', 0, () => F.DEVPREP.sGp()); }
  };
  F.tourState = () => (tour ? { kind: tour.kind, i: tour.i } : null);
})();
