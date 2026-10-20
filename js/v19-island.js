/* Final v19: Dynamic Island. FRH's Live Activities, the only thing an app can put in the island.
   Four activities: the home visit (assigned → on the way → arrived → in progress → complete), an IV drip,
   the video-consult queue and lab results. Each has the iOS forms: compact, minimal (two at once),
   expanded (long press) and alert (a short expanded pop when FRH pushes an important update).
   iOS shows them in the island only while the patient is outside the FRH app; the Lock Screen card is
   drawn by the preview page (island-preview.html), which uses the same renderer (window.FRHDI). */
(function () {
  const ic = (n, s, w) => window.FRHI.icon(n, s || 16, w || 2);
  const IMG = 'assets/img/';
  const CAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.6 6.3A2 2 0 0 1 7.5 5h9a2 2 0 0 1 1.9 1.3L20 11a2 2 0 0 1 1 1.7V17a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4.3A2 2 0 0 1 4 11zM7.6 7l-1.2 3.5h11.2L16.4 7z"/></svg>';

  /* placeholder content: the same people, times and visit as the rest of the prototype */
  const TEAM = [{ img: 'doc-5.jpg', name: 'Dr. Layla' }, { img: 'doc-3.jpg', name: 'Grace' }];
  const VISIT = ['assigned', 'onway', 'arrived', 'treating', 'done'];
  const pad2 = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');
  const clock = s => (s >= 3600 ? `${Math.floor(s / 3600)}:${pad2((s % 3600) / 60)}:${pad2(s % 60)}` : `${Math.floor(s / 60)}:${pad2(s % 60)}`);
  const secsOf = a => Math.max(0, Math.round(((a.t0 ? Date.now() - a.t0 : 0) / 1000) + (a.base || 0)));

  const av = (p, cls) => `<img class="di-av ${cls || ''}" src="${IMG}${p.img}" alt="">`;
  const tile = (n, tone) => `<span class="di-tile ${tone || ''}">${ic(n, 17, 2.2)}</span>`;
  const btn = (n, label, tone) => `<span class="di-btn ${tone || ''}" role="button" aria-label="${label}">${ic(n, 17, 2.2)}</span>`;
  const pill = (label, tone) => `<span class="di-pill ${tone || ''}">${label}</span>`;
  function track(stops, at, tone) {           /* stops = labels, at = 0-based index reached; fraction allowed */
    const n = stops.length - 1, pct = Math.min(100, (at / n) * 100);
    return `<span class="di-track ${tone || ''}"><span class="di-line"><i style="width:${pct}%"></i></span>
      ${stops.map((s, i) => `<span class="di-dot ${i <= at ? 'on' : ''}" style="left:${(i / n) * 100}%"></span>`).join('')}
      ${tone === 'car' ? `<span class="di-car" style="left:${pct}%">${CAR}</span>` : ''}</span>`;
  }
  const timer = (a, down) => `<span class="di-timer" data-t0="${a.t0 || 0}" data-base="${a.base || 0}" data-down="${down || 0}">${clock(down ? Math.max(0, down - secsOf(a)) : secsOf(a))}</span>`;

  /* ---------- what each activity shows ----------
     cl/ct = compact leading/trailing, m = minimal, xl/xt = expanded leading/trailing,
     title/sub = expanded centre (below the camera), bottom = expanded bottom row, open = screen it opens */
  function parts(a) {
    const big = (v, unit, tone) => `<span class="di-big ${tone || ''}"><b>${v}</b>${unit ? `<small>${unit}</small>` : ''}</span>`;
    const stack = `<span class="di-stack">${TEAM.map(p => av(p)).join('')}</span>`;
    const lead = TEAM[0];
    if (a.kind === 'visit') {
      const stops = ['Booked', 'Assigned', 'On the way', 'Arrived'];
      const calls = `<span class="di-btns">${btn('phone', 'Call the team', 'green')}${btn('chat', 'Message the team')}</span>`;
      switch (a.stage) {
        case 'assigned': return { cl: av(lead, 'ring'), ct: `<span class="di-t">5:24</span>`, m: av(lead, 'ring'),
          xl: stack, xt: big('5:24', 'PM'), title: 'Dr. Layla and Grace are your team', sub: 'They leave for Al Barsha at 5:05 PM',
          bottom: `${track(stops, 1)}${calls}`, open: 'appt-assigned' };
        case 'onway': return { cl: av(lead, 'ring'), ct: `<span class="di-tn red"><b>${a.min}</b><small>min</small></span>`, m: `${av(lead, 'ring')}<i class="di-mbadge">${a.min}</i>`,
          xl: stack, xt: big(a.min, 'min', 'red'), title: 'Dr. Layla and Grace are on the way', sub: `Doctor on Call · ${a.km || 3.2} km away`,
          bottom: `${track(stops, 1 + Math.min(.92, Math.max(.08, (12 - a.min) / 12 + .08)), 'car')}${calls}`, open: 'appt-onway' };
        case 'arrived': return { cl: av(lead, 'ring green'), ct: `<span class="di-t green">Here</span>`, m: av(lead, 'ring green'),
          xl: stack, xt: big('Here', '', 'green'), title: 'Dr. Layla and Grace are at your door', sub: 'Gate code 4471 · visitor bay',
          bottom: `${track(stops, 3, 'green')}${calls}`, open: 'appt-arrived' };
        case 'treating': return { cl: tile('stetho', 'red'), ct: timer(a), m: tile('stetho', 'red'),
          xl: stack, xt: `<span class="di-big"><b>${timer(a)}</b><small>so far</small></span>`, title: 'Visit in progress', sub: 'Dr. Layla is with Sara and Fatima',
          bottom: `<span class="di-note">${ic('file', 14, 2.2)}Notes and any prescription appear in the app after the visit</span>`, open: 'appt-treating' };
        default: return { cl: tile('check', 'green'), ct: `<span class="di-t green">Done</span>`, m: tile('check', 'green'),
          xl: tile('check', 'green big'), xt: big('42', 'min'), title: 'Visit complete', sub: 'Notes, prescription and invoice are in the app',
          bottom: pill('View visit notes', 'light'), open: 'appt-completed' };
      }
    }
    if (a.kind === 'drip') {
      const dur = a.dur || 2700, left = Math.max(0, dur - secsOf(a)), pct = Math.min(100, (1 - left / dur) * 100);
      return { cl: tile('drip', 'red'), ct: timer(a, dur), m: `<span class="di-ring" style="--p:${pct}">${ic('drip', 13, 2.4)}</span>`,
        xl: tile('drip', 'red big'), xt: `<span class="di-big"><b>${timer(a, dur)}</b><small>left</small></span>`, title: 'Immunity booster drip', sub: 'Nurse Grace is with you',
        bottom: `<span class="di-bar"><i style="width:${pct}%"></i></span><span class="di-btns">${btn('chat', 'Message the nurse')}</span>`, open: 'appts' };
    }
    if (a.kind === 'tele') {
      const doc = { img: 'doc-1.jpg' };
      return a.stage === 'ready'
        ? { cl: av(doc, 'ring green'), ct: `<span class="di-t green">Join</span>`, m: av(doc, 'ring green'),
          xl: av(doc, 'big'), xt: big('Ready', '', 'green'), title: 'Dr. Omar is ready for you', sub: 'Video consultation · 15 min',
          bottom: `<span class="di-wide">${pill(`${ic('video', 16, 2.2)} Join the call`, 'green')}</span>`, open: 'chat-home' }
        : { cl: tile('video', 'red'), ct: `<span class="di-tn"><b>~${a.min || 3}</b><small>min</small></span>`, m: tile('video', 'red'),
          xl: tile('video', 'red big'), xt: big('~' + (a.min || 3), 'min'), title: 'You’re next in line', sub: 'A doctor joins your video call in about 3 min',
          bottom: `<span class="di-note">${ic('mic', 14, 2.2)}Find a quiet spot; we’ll alert you when the doctor is ready</span>`, open: 'chat-home' };
    }
    /* lab */
    const stops = ['Collected', 'At the lab', 'Results'];
    return a.stage === 'ready'
      ? { cl: tile('lab', 'green'), ct: `<span class="di-t green">${ic('check', 17, 3)}</span>`, m: tile('lab', 'green'),
        xl: tile('lab', 'green big'), xt: big('Ready', '', 'green'), title: 'Your results are ready', sub: 'Full blood count · reviewed by Dr. Layla',
        bottom: `<span class="di-wide">${pill('View results', 'light')}</span>`, open: 'reports-hub' }
      : { cl: tile('lab', 'red'), ct: `<span class="di-t">6 PM</span>`, m: tile('lab', 'red'),
        xl: tile('lab', 'red big'), xt: big('6:00', 'PM'), title: 'Full blood count', sub: 'Your sample is at the lab',
        bottom: track(stops, 1), open: 'reports-hub' };
  }

  /* ---------- shapes (screen points on a 393-wide iPhone) ---------- */
  const GEO = {
    base: { w: 124, h: 36, top: 11, r: 18 },
    compact: { w: 204, h: 36, top: 11, r: 18 },            /* 40 pt each side of the camera, clear of the clock and icons */
    minimal: { w: 166, h: 36, top: 11, r: 18, dx: -21 },     /* attached activity widens the island to the left */
    expanded: { w: 371, h: 160, top: 9, r: 46 },
    alert: { w: 371, h: 160, top: 9, r: 46 },
  };
  function inner(a, mode) {
    const p = parts(a);
    if (mode === 'compact') return `<div class="di-c compact"><span class="di-l">${p.cl}</span><span class="di-r">${p.ct}</span></div>`;
    if (mode === 'minimal') return `<div class="di-c minimal"><span class="di-l">${p.m}</span></div>`;
    if (mode === 'expanded' || mode === 'alert') return `<div class="di-c expanded">
        <span class="di-xl">${p.xl}</span><span class="di-xt">${p.xt}</span>
        <span class="di-mid"><b>${p.title}</b><small>${p.sub}</small></span>
        <span class="di-bot">${p.bottom}</span></div>`;
    return '';
  }
  /* the Lock Screen card (preview page) */
  function lock(a) {
    const p = parts(a);
    return `<div class="di-lock"><div class="di-lh"><span class="di-lapp">${window.FRHI.appIcon ? window.FRHI.appIcon(20) : ''}</span><span>FRH Health</span><span class="di-lt">${p.ct}</span></div>
      <div class="di-lb"><span class="di-ll">${p.xl}</span><span class="di-lm"><b>${p.title}</b><small>${p.sub}</small></span></div>
      <div class="di-bot">${p.bottom}</div></div>`;
  }
  window.FRHDI = { parts, inner, lock, GEO, clock, secsOf, VISIT };

  /* =====================================================================
     Prototype: the island on the phone (the preview page stops here)
     ===================================================================== */
  const F = window.FRH;
  if (!F || !F.S) return;
  const S = F.S, D = window.FRHDATA || {};
  let acts = [], mode = 'compact', focus = 0, inApp = false, alertT = null, tickT = null, plays = [];
  const ended = {};                                         /* visits whose activity has finished: never re-seeded */
  let isl, isl2, catcher;
  const BUB = { w: 36, h: 36, top: 11, r: 18 }, BUB_DX = 85;     /* detached bubble: 5 pt right of the island, clear of the icons */

  function build() {
    if (isl && isl.isConnected) return;
    const scr = document.getElementById('screen'), mk = cls => { const d = document.createElement('div'); d.className = cls; scr.appendChild(d); return d; };
    catcher = mk('di-catch'); isl = mk('di-isl'); isl2 = mk('di-isl di-isl2');
    isl.setAttribute('role', 'button'); isl2.setAttribute('role', 'button');
    isl.addEventListener('click', e => { e.stopPropagation(); tap(0); });
    isl2.addEventListener('click', e => { e.stopPropagation(); tap(1); });
    catcher.addEventListener('click', e => { e.stopPropagation(); collapse(); });
  }
  function shape(node, g, dx) {
    const W = 393;
    Object.assign(node.style, { width: g.w + 'px', height: g.h + 'px', top: g.top + 'px', left: ((W - g.w) / 2 + (dx || 0)) + 'px', borderRadius: g.r + 'px' });
  }
  function fill(node, html) {
    if (node._html === html) return;
    const fresh = node._kind !== html.slice(0, 40);           /* same form, new numbers: swap without the fade */
    node._html = html; node._kind = html.slice(0, 40);
    node.innerHTML = html;
    if (fresh) { const c = node.firstElementChild; if (c) { c.classList.add('di-in'); } }
  }
  function render() {
    build();
    const G = window.FRHDI.GEO, show = !inApp && !S.open && acts.length;
    isl.classList.toggle('on', !!show); isl2.classList.toggle('on', !!(show && acts.length > 1 && mode !== 'expanded' && mode !== 'alert'));
    catcher.classList.toggle('on', !!(show && (mode === 'expanded' || mode === 'alert')));
    isl.classList.toggle('x', !!(show && (mode === 'expanded' || mode === 'alert')));
    if (!show) { shape(isl, G.base); fill(isl, ''); shape(isl2, BUB, BUB_DX); fill(isl2, ''); return stopTick(); }
    if (mode === 'expanded' || mode === 'alert') {
      shape(isl, G[mode]); fill(isl, window.FRHDI.inner(acts[focus] || acts[0], mode));
      isl.classList.toggle('alerting', mode === 'alert');
    } else if (acts.length > 1) {
      isl.classList.remove('alerting');
      shape(isl, G.minimal, G.minimal.dx); fill(isl, window.FRHDI.inner(acts[0], 'minimal'));
      shape(isl2, BUB, BUB_DX); fill(isl2, window.FRHDI.inner(acts[1], 'minimal'));
    } else {
      isl.classList.remove('alerting');
      shape(isl, G.compact); fill(isl, window.FRHDI.inner(acts[0], 'compact'));
    }
    startTick();
  }
  /* live clocks (visit timer, drip countdown) tick in place */
  function startTick() {
    if (tickT) return;
    tickT = setInterval(() => {
      document.querySelectorAll('.di-isl .di-timer').forEach(t => {
        const s = window.FRHDI.secsOf({ t0: +t.dataset.t0, base: +t.dataset.base }), down = +t.dataset.down;
        t.textContent = window.FRHDI.clock(down ? Math.max(0, down - s) : s);
      });
    }, 1000);
  }
  function stopTick() { clearInterval(tickT); tickT = null; }

  function tap(i) {
    if (!acts.length) return;
    if (mode === 'expanded' || mode === 'alert') return openFrom(acts[focus] || acts[0]);
    focus = Math.min(i, acts.length - 1); setMode('expanded');
  }
  function collapse() { clearTimeout(alertT); mode = 'compact'; focus = 0; render(); }
  function setMode(m, ms) {
    clearTimeout(alertT); mode = m; render();
    if (m === 'alert') alertT = setTimeout(collapse, ms || 4500);
  }
  /* tapping the expanded island opens FRH on the matching screen */
  function openFrom(a) {
    const to = window.FRHDI.parts(a).open;
    collapse(); inApp = true; render();
    F.launch();
    setTimeout(() => { if (S.open && F.panel) F.panel.jump(to); }, 640);
  }

  /* the app hides its own activity while it is open, and brings it back when the patient leaves */
  const launch0 = F.launch, open0 = F.openInstant, close0 = F.closeApp;
  F.launch = function () { inApp = true; collapse(); return launch0.apply(this, arguments); };
  F.openInstant = function () { inApp = true; render(); return open0.apply(this, arguments); };
  F.closeApp = function () {
    const was = S.open, r = close0.apply(this, arguments);
    if (was) setTimeout(() => { inApp = false; if (!acts.length) seed(); render(); }, 480);
    return r;
  };
  function liveVisit() {
    const ups = (D.appointments && D.appointments.upcoming) || [];
    const a = ups.find(x => x.tracking);
    if (!a) return null;
    const st = (S.tTrack && S.tTrack[a.id]) || 'onway';
    if (ended[a.id] || !VISIT.includes(st)) return null;
    return { kind: 'visit', id: a.id, stage: st, min: (D.tracking && D.tracking.minutes) || 12, t0: st === 'treating' ? Date.now() : 0, base: 0 };
  }
  function seed() { const v = liveVisit(); if (v) { acts = [v]; mode = 'compact'; } }
  function syncApp(a) { if (a.kind === 'visit' && ['onway', 'arrived', 'treating'].includes(a.stage)) { S.tTrack = S.tTrack || {}; S.tTrack[a.id || 'FRH-24817'] = a.stage; } }

  /* ---------- presenter panel ---------- */
  const now = () => Date.now();
  const stopPlay = () => { plays.forEach(clearTimeout); plays = []; };
  const at = (ms, fn) => plays.push(setTimeout(fn, ms));
  const visit = (stage, x) => Object.assign({ kind: 'visit', id: 'FRH-24817', stage, min: 12 }, x || {});
  const SET = {
    'di-assigned': () => [[visit('assigned')], 'alert'],
    'di-onway': () => [[visit('onway')], 'compact'],
    'di-onway-x': () => [[visit('onway')], 'expanded'],
    'di-arrived': () => [[visit('arrived')], 'alert'],
    'di-treating': () => [[visit('treating', { t0: now(), base: 492 })], 'compact'],
    'di-done': () => [[visit('done')], 'alert'],
    'di-two': () => [[visit('onway'), { kind: 'lab', stage: 'lab' }], 'compact'],
    'di-drip': () => [[{ kind: 'drip', t0: now(), base: 420, dur: 2700 }], 'expanded'],
    'di-tele': () => [[{ kind: 'tele', stage: 'ready' }], 'alert'],
    'di-lab': () => [[{ kind: 'lab', stage: 'ready' }], 'alert'],
  };
  /* the whole visit in about 45 seconds: each step is a push update from FRH's server */
  function play() {
    const v = visit('assigned');
    const step = (ms, fn, m, hold) => at(ms, () => { fn(); syncApp(v); acts = [v]; setMode(m || 'compact', hold); });
    step(0, () => {}, 'alert', 4200);
    step(5000, () => { v.stage = 'onway'; v.min = 12; }, 'alert', 3600);
    for (let k = 1; k <= 10; k++) at(9200 + k * 1300, () => { if (v.stage !== 'onway') return; v.min = 12 - k; render(); });
    step(23500, () => { v.stage = 'arrived'; }, 'alert', 5000);
    step(30000, () => { v.stage = 'treating'; v.t0 = now(); v.base = 0; });
    step(40000, () => { v.stage = 'done'; ended[v.id] = true; }, 'alert', 5000);
    at(46000, () => { acts = []; render(); });
  }
  F.diJump = id => {
    stopPlay(); clearTimeout(alertT);
    const go = () => {
      inApp = false;
      delete ended['FRH-24817'];
      if (id === 'di-play') { acts = []; render(); play(); return; }
      const [list, m] = SET[id] ? SET[id]() : [[], 'compact'];
      acts = list; focus = 0; list.forEach(syncApp);
      setMode(m, 6000);
    };
    if (S.open) { F.closeApp(); setTimeout(go, 520); } else go();
  };
  F.diState = () => ({ acts: acts.map(a => a.kind + ':' + (a.stage || '')), mode, inApp, shown: !!(isl && isl.classList.contains('on')) });
  render();
})();
