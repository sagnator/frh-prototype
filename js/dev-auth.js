/* FRH final — Sign in, onboarding, location and system states (prefix a-). Decisions A1–A19.

   Flow   splash → 3 intro slides (screens.js, A8) → phone (one screen for everyone, A1)
          → 6-digit code (A2–A4) → returning: Home · new: details 'profile' (A5–A7)
          → location priming 'a-locperm' (A9, A10) → iOS alert → address confirm 'a-addr' → Home.
          Don't Allow → 'a-locdenied' (A19). Detection fails / lands outside Dubai & Sharjah
          → city list 'loc-select' (A11, A12) / outside-area sheet 'a-outside' (A13).
   System maintenance (A14, A15) · 'a-update' (A17) · 'a-session' → sign in → back where you were (A16)
          · no internet stays the original 'offline' sheet; 'a-offline' only at launch with nothing cached (A18).

   Overrides  F.SCREENS splash (offline at launch), phone, otp, profile, maintenance; F.issueCode / F.fillCode / F.verify.
   New        screens a-locperm, a-addr, a-update, a-offline
              sheets  a-ios-loc, a-locdenied, loc-select, a-outside, a-session, a-ios-call
   Hooks      F.aCity() · F.A_CITIES · F.aOpenLocSelect(ctx) · F.ACT['a-loc-select'] · F.aLocWarn(cityKey, line)
              (optional F.aOnCity(city), F.aOnWarnChange()) · S.city / S.aCity · S.aAddr (address from onboarding)
   Presenter  F.authJump(viewId) · F.authView() · F.aSetDetect('ok'|'fail'|'outside') · F.aSessionExpired() */
(function () {
  const F = window.FRH;
  if (!F || !F.SCREENS) return;
  const { icon, flag } = window.FRHI;
  const S = F.S;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const spacer = '<span style="width:40px"></span>';
  const backBtn = (act, label = 'Back') => `<button class="nav-btn" type="button" data-act="${act}" aria-label="${label}">${icon('arrowLeft', 20, 2)}</button>`;
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const LEN = 6, RESEND_MS = 60 * 1000, CODE_MS = 5 * 60 * 1000;

  const DEFAULTS = () => ({
    aCity: 'dubai', city: 'Dubai', aLocPerm: 'idle', aDetectMode: 'ok', aDetectNext: null, aDetect: null,
    aFound: null, aAddr: null, aLocCtx: null, aOut: null, aResume: null, aCreated: false, aNotify: {}, aBusy: null, aCall: 'frh',
  });
  Object.assign(S, DEFAULTS());
  const rb = document.getElementById('restartBtn');
  if (rb) rb.addEventListener('click', () => Object.assign(S, DEFAULTS()));
  const RESET0 = F.reset;
  if (RESET0) F.reset = function () { const r = RESET0.apply(this, arguments); Object.assign(S, DEFAULTS()); return r; };

  /* rule 6: a delayed step only runs if the patient is still where it started */
  const later = (ms, fn, from = S.screen) => setTimeout(() => { if (!S.open || S.screen !== from) return; fn(); }, ms);
  function busy(key, ms, fn) {
    if (S.aBusy) return;
    const from = S.screen;
    S.aBusy = key; F.upd();
    setTimeout(() => { S.aBusy = null; if (!S.open || S.screen !== from) return; F.upd(); fn(); }, ms);
  }
  const btnBusy = (key, label, busyLabel) => (S.aBusy === key ? `<span class="spin"></span>${busyLabel}` : label);

  /* ================= cities & addresses ================= */
  const CITIES = [
    { k: 'dubai', n: 'Dubai', live: true },
    { k: 'sharjah', n: 'Sharjah', live: true },
    { k: 'abudhabi', n: 'Abu Dhabi', live: false },
    { k: 'alain', n: 'Al Ain', live: false },
    { k: 'rak', n: 'Ras Al Khaimah', live: false },
  ];
  F.A_CITIES = CITIES;
  const cityOf = k => CITIES.find(c => c.k === k);
  F.aCity = () => cityOf(S.aCity) || CITIES[0];
  const setCity = c => { if (c) { S.aCity = c.k; S.city = c.n; } };
  const cityFromText = t => (/sharjah/i.test(t) ? 'sharjah' : /abu dhabi/i.test(t) ? 'abudhabi' : /al ain/i.test(t) ? 'alain' : /ras al khaimah|\brak\b/i.test(t) ? 'rak' : 'dubai');
  const cityChanged = c => {
    if (typeof F.aOnCity === 'function') { F.aOnCity(c); return; }
    if (S.screen === 'home') later(300, () => { if (!S.sheet) F.go('home', { dir: 'none' }); }, 'home');
  };
  const HOME_ADDR = { label: 'Home', line1: 'Villa 24, Al Barsha 1', area: 'Al Barsha 1', city: 'dubai', tag: 'Villa 24', line: 'Villa 24, Al Barsha 1, Dubai' };
  const OUT_ADDR = { label: 'Home', line1: 'Villa 14, Khalifa City A', area: 'Khalifa City A', city: 'abudhabi', tag: 'Khalifa City A', line: 'Villa 14, Khalifa City A, Abu Dhabi' };

  /* ================= illustrations ================= */
  const PIN = `<path d="M130 30c-14.4 0-26 11.6-26 26 0 19 26 42 26 42s26-23 26-42c0-14.4-11.6-26-26-26z" fill="#D71F32"/>
      <circle cx="130" cy="56" r="11.5" fill="#FFF4F3"/>
      <rect x="127.9" y="49.6" width="4.2" height="12.8" rx="2.1" fill="#D71F32"/>
      <rect x="123.6" y="53.9" width="12.8" height="4.2" rx="2.1" fill="#D71F32"/>`;
  const LOC_SVG = `<svg viewBox="0 0 260 150" aria-hidden="true">
      <circle cx="130" cy="78" r="62" fill="#FFF4F3"/>
      <g transform="translate(130 96) rotate(-7) translate(-74 -40)">
        <rect width="148" height="80" rx="16" fill="#fff" stroke="#EEE3E1" stroke-width="2"/>
        <path d="M0 50C42 36 66 68 148 40" fill="none" stroke="#F3E4E1" stroke-width="7"/>
        <path d="M48 0 62 80" stroke="#F6ECE9" stroke-width="6"/>
        <path d="M104 0 110 80" stroke="#F6ECE9" stroke-width="4"/>
      </g>
      <ellipse class="a-ill-ring" cx="130" cy="98" rx="34" ry="12" fill="#D71F32" opacity=".1"/>
      <ellipse cx="130" cy="98" rx="17" ry="6" fill="#D71F32" opacity=".18"/>
      <g class="a-ill-pin">${PIN}</g>
      <g transform="translate(190 30)"><path d="M0 12 12 2l12 10" fill="none" stroke="#D3BCB8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="4" y="12" width="16" height="12" rx="3" fill="#F3E4E1"/></g>
      <circle cx="62" cy="52" r="4.5" fill="#FFC9C4"/><circle cx="58" cy="118" r="3.5" fill="#EAD9D5"/>
    </svg>`;
  const PIN_SVG = `<svg viewBox="102 28 56 72" aria-hidden="true">${PIN}</svg>`;
  /* street map behind the address pin: Al Barsha villas, a park, and the big road on the right */
  const MAP_SVG = `<svg viewBox="0 0 345 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="345" height="210" fill="#EFEBE4"/>
      <path d="M-6 150C40 140 70 176 120 214H-6z" fill="#D7E8CC"/>
      <rect x="200" y="150" width="70" height="44" rx="10" fill="#D7E8CC"/>
      <g fill="#E4DDD2">
        <rect x="12" y="12" width="42" height="30" rx="5"/><rect x="62" y="12" width="36" height="30" rx="5"/>
        <rect x="12" y="84" width="42" height="34" rx="5"/><rect x="62" y="84" width="36" height="34" rx="5"/>
        <rect x="128" y="12" width="40" height="34" rx="5"/><rect x="178" y="12" width="40" height="34" rx="5"/>
        <rect x="128" y="120" width="40" height="30" rx="5"/><rect x="178" y="100" width="40" height="38" rx="5"/>
        <rect x="128" y="164" width="40" height="40" rx="5"/><rect x="292" y="20" width="44" height="54" rx="6"/>
        <rect x="292" y="96" width="44" height="40" rx="6"/><rect x="292" y="152" width="44" height="50" rx="6"/>
      </g>
      <path d="M-10 66H360" stroke="#fff" stroke-width="12"/>
      <path d="M113 -10V220" stroke="#fff" stroke-width="10"/>
      <path d="M-10 132C40 128 80 134 113 136S220 146 280 140" fill="none" stroke="#fff" stroke-width="8"/>
      <path d="M228 -10V220" stroke="#fff" stroke-width="7"/>
      <path d="M276 -10 284 220" stroke="#F6D77A" stroke-width="13"/>
      <path d="M276 -10 284 220" stroke="#EFC84F" stroke-width="1.4" stroke-dasharray="6 7"/>
      <text x="300" y="88" font-size="8" font-weight="700" fill="#A2968D" transform="rotate(88 300 88)" font-family="-apple-system,Helvetica,sans-serif">Sheikh Zayed Rd</text>
      <text x="20" y="62" font-size="7.5" font-weight="700" fill="#A2968D" font-family="-apple-system,Helvetica,sans-serif">Al Barsha 1</text>
    </svg>`;
  const OFF_SVG = `<svg viewBox="0 0 260 160" aria-hidden="true">
      <circle cx="130" cy="82" r="62" fill="#FFF4F3"/>
      <g fill="none" stroke-linecap="round">
        <path d="M83.3 77.3A66 66 0 0 1 176.7 77.3" stroke="#EAD9D5" stroke-width="10"/>
        <path d="M100.3 94.3A42 42 0 0 1 159.7 94.3" stroke="#EAD9D5" stroke-width="10"/>
        <path d="M116.6 110.6A19 19 0 0 1 143.4 110.6" stroke="#D3BCB8" stroke-width="10"/>
        <path d="M90 48 170 128" stroke="#FFF4F3" stroke-width="18"/>
        <path d="M90 48 170 128" stroke="#D71F32" stroke-width="8"/>
      </g>
      <circle cx="130" cy="126" r="6.5" fill="#D3BCB8"/>
      <circle cx="206" cy="54" r="4.5" fill="#FFC9C4"/><circle cx="56" cy="66" r="3.5" fill="#EAD9D5"/>
    </svg>`;
  const UPD_SVG = `<svg viewBox="0 0 260 160" aria-hidden="true">
      <circle cx="130" cy="82" r="62" fill="#FFF4F3"/>
      <rect x="98" y="24" width="64" height="118" rx="14" fill="#fff" stroke="#EEE3E1" stroke-width="2.5"/>
      <rect x="120" y="31" width="20" height="5" rx="2.5" fill="#F3E4E1"/>
      <rect x="114" y="58" width="32" height="32" rx="8" fill="#D71F32"/>
      <path d="M121 76 130 69l9 7" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="128.4" y="75" width="3.2" height="10" rx="1.6" fill="#fff"/><rect x="125" y="78.4" width="10" height="3.2" rx="1.6" fill="#fff"/>
      <rect x="112" y="100" width="36" height="6" rx="3" fill="#F3E4E1"/>
      <rect x="118" y="112" width="24" height="6" rx="3" fill="#F6ECE9"/>
      <circle cx="166" cy="122" r="20" fill="#D71F32" stroke="#FFF4F3" stroke-width="4"/>
      <path d="M166 112v17M158.5 122.5l7.5 7.5 7.5-7.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="68" cy="58" r="4.5" fill="#FFC9C4"/><circle cx="204" cy="48" r="3.5" fill="#EAD9D5"/>
    </svg>`;
  const MINI_MAP = `<svg viewBox="0 0 238 118" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="238" height="118" fill="#EAE6DD"/>
      <rect x="12" y="10" width="44" height="30" rx="4" fill="#D7E8CF"/><rect x="182" y="78" width="46" height="32" rx="4" fill="#D7E8CF"/>
      <path d="M0 80C60 64 112 98 238 60" stroke="#fff" stroke-width="10" fill="none"/>
      <path d="M72 0 98 118" stroke="#fff" stroke-width="7"/>
      <path d="M172 0 158 118" stroke="#F7D66B" stroke-width="6"/>
      <circle cx="119" cy="62" r="24" fill="#007AFF" opacity=".15"/>
      <circle cx="119" cy="62" r="7.5" fill="#007AFF" stroke="#fff" stroke-width="3"/>
    </svg>`;
  const TICK = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle class="a-tk-c" cx="12" cy="12" r="11" fill="currentColor"/><path class="a-tk-p" d="M7 12.4l3.3 3.3L17.2 8.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const RING = '<svg class="a-ring" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle class="bg" cx="10" cy="10" r="8"/><circle class="v" cx="10" cy="10" r="8" transform="rotate(-90 10 10)"/></svg>';
  const KEY = '<svg class="a-key" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="4.5"/><path d="M12 12v9.5M12 16.5h2.6M12 19.6h2"/></svg>';

  /* ================= splash: only an offline first launch changes where it goes (A18) ================= */
  const SPLASH0 = F.SCREENS.splash;
  F.SCREENS.splash = Object.assign({}, SPLASH0, {
    mount() {
      clearTimeout(F._spT);
      F._spT = setTimeout(() => {
        if (!S.open || S.screen !== 'splash') return;
        if (S.online) S.onb = 0;
        F.go(S.online ? 'onb' : 'a-offline', { dir: 'fade' });
      }, 2400);
    },
  });

  /* ================= phone: one screen for sign-in and sign-up (A1) ================= */
  const PHONE0 = F.SCREENS.phone;
  F.SCREENS.phone = Object.assign({}, PHONE0, {
    render() {
      const r = !!S.aResume;
      return `<div class="nav">${r ? spacer : backBtn('back')}<button class="nav-link" type="button" data-act="guest">Browse as guest</button></div>
      <div class="scr-body">
        <div class="eyebrow">${icon(r ? 'lock' : 'user', 13, 2.6)} ${r ? 'Signed out for your security' : 'Sign in or sign up'}</div>
        <h1 class="h1">${r ? 'Sign in to <em>pick up where you left off</em>' : 'What’s your <em>mobile number</em>?'}</h1>
        <p class="lead">${r ? 'We’ll send a 6-digit code, then take you straight back to where you were.' : 'We’ll send a 6-digit code to confirm it’s you. New to FRH? We’ll set up your account next.'}</p>
        <div class="pf focus"><button class="cc" type="button" data-act="cc" aria-label="Choose country code"></button><div class="pf-in"></div><button class="pf-clear hide" type="button" data-act="clear-phone" aria-label="Clear number">${icon('x', 14, 2.6)}</button></div>
        <div class="pf-msg"></div>
        <div class="chan"><div class="chan-lbl">Send my code by</div><div class="seg2">
          <button type="button" data-act="ch" data-ch="wa"><span class="cd wa">${icon('chat', 13, 2.6)}</span>WhatsApp</button>
          <button type="button" data-act="ch" data-ch="sms"><span class="cd sms">${icon('sms', 13, 2.6)}</span>SMS</button></div></div>
        <p class="fine">By continuing, you agree to our <u>Terms of Service</u> and <u>Privacy Policy</u>.</p>
      </div>
      <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="send"></button></div>`;
    },
  });
  const GUEST0 = F.ACT.guest;
  F.ACT.guest = (n, e) => { S.aResume = null; if (GUEST0) GUEST0(n, e); else { S.guest = true; F.go('home', { dir: 'fade' }); } };

  /* re-auth after an expired session: phone → code must not leave 'phone' in the back stack,
     so the screen you return to keeps its own back history (A16) */
  const GO0 = F.go;
  F.go = function (id, o) {
    if (S.aResume && id === 'otp' && S.screen === 'phone' && (!o || !o.dir || o.dir === 'fwd')) o = Object.assign({}, o, { dir: 'fwd-keep' });
    return GO0.call(this, id, o);
  };

  /* ================= 6-digit code engine (A2, A3, A4) ================= */
  let prevOtp = '', vT = null, fillT = [], cascading = false;
  const gen6 = () => { let c; do { c = String(100000 + Math.floor(Math.random() * 900000)); } while (/^(\d)\1+$/.test(c) || c === '123456' || c === '654321'); return c; };
  const stopFill = () => { fillT.forEach(clearTimeout); fillT = []; cascading = false; };

  F.issueCode = function () {
    S.codes.forEach(c => { if (c.status === 'active' || c.status === 'pending') c.status = 'replaced'; });
    const c = { id: Date.now() + Math.floor(Math.random() * 999), code: gen6(), channel: S.channel, to: F.fullPhone(), sentAt: Date.now(), expiresAt: Date.now() + CODE_MS, status: 'pending' };
    S.codes.push(c);
    stopFill();
    S.otp = ''; prevOtp = ''; S.otpState = 'idle'; S.wasOld = false;
    S.resendAt = Date.now() + RESEND_MS;
    F.sync();
    setTimeout(() => F.deliver(c), 1500 + Math.random() * 900);
    return c;
  };

  function afterVerify() {
    const r = S.aResume;
    if (r || S.patient === 'returning') {
      if (!S.name) S.name = F.DEMO.name;
      S.guest = false; S.aCreated = true; S.aResume = null;
      const to = r && F.SCREENS[r.screen] ? r.screen : 'home';
      F.go(to, { dir: 'fade' });
      setTimeout(() => F.toast(r ? `Welcome back, ${F.firstName()}. You’re right where you left off` : `Welcome back, ${F.firstName()}`, 'check'), 450);
    } else F.go('profile');
  }

  function verify() {
    clearTimeout(vT); vT = null;
    if (!S.open || S.screen !== 'otp' || S.otpState === 'verifying' || S.otpState === 'ok' || S.otp.length !== LEN) return;
    S.otpState = 'verifying'; F.upd();
    later(900, () => {
      if (S.otpState !== 'verifying') return;
      if (!S.online) { S.otpState = 'idle'; F.upd(); S.pending = 'verify'; F.openSheet('offline'); return; }
      const c = F.activeCode();
      if (c && S.otp === c.code) {
        if (F.isExpired(c)) { c.status = 'expired'; S.otpState = 'expired'; S.otp = ''; prevOtp = ''; F.upd(); return; }
        c.status = 'used'; S.otpState = 'ok'; S.attempts = 0; F.hideBanner(); F.upd();
        later(850, afterVerify, 'otp');
        return;
      }
      S.attempts++;
      S.wasOld = S.codes.some(x => x.status === 'replaced' && x.code === S.otp);
      if (S.attempts >= S.maxAttempts) { F.lockout(); return; }
      S.otpState = 'wrong'; F.upd(); F.shake('.otp-row');
      setTimeout(() => { if (S.screen === 'otp' && S.otpState === 'wrong') { S.otp = ''; prevOtp = ''; F.upd(); } }, 900);
    }, 'otp');
  }
  F.verify = verify;

  /* autofill types the digits in quickly rather than snapping them in */
  function cascade(code) {
    stopFill(); clearTimeout(vT);
    cascading = true;
    S.otpState = 'idle'; S.otp = ''; prevOtp = ''; F.upd();
    for (let i = 1; i <= LEN; i++) {
      fillT.push(setTimeout(() => {
        if (!S.open || S.screen !== 'otp' || S.otpState !== 'idle') { stopFill(); return; }
        S.otp = code.slice(0, i); prevOtp = S.otp;
        if (i === LEN) { cascading = false; vT = setTimeout(verify, 220); }
        F.upd();
      }, i * 42));
    }
  }
  F.fillCode = function (c) {
    if (!S.open || S.screen !== 'otp') { F.toast('Open the code screen in the app first', 'alert'); return false; }
    if (S.otpState === 'verifying' || S.otpState === 'ok') return false;
    F.hideBanner();
    cascade(c.code);
    return true;
  };

  /* keypad + computer keyboard (core routes the 'a-otp' focus here) */
  F.KEYS = F.KEYS || {};
  F.KEYS['a-otp'] = k => {
    if (S.screen !== 'otp') return;
    if (S.otpState === 'verifying' || S.otpState === 'ok' || S.otpState === 'expired') return;
    if (/^\d$/.test(k)) { if (S.otp.length >= LEN) return; S.otp += k; }
    else if (k === 'del') { if (!S.otp) return; S.otp = S.otp.slice(0, -1); }
    else return;
    stopFill(); clearTimeout(vT);
    if (S.otpState === 'wrong') S.otpState = 'idle';
    prevOtp = S.otp; F.upd();
    if (S.otp.length === LEN) vT = setTimeout(verify, 140);
  };
  document.addEventListener('paste', e => {
    if (!S.open || S.focus !== 'a-otp' || S.screen !== 'otp' || S.sheet) return;
    const d = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, LEN);
    if (!d) return;
    e.preventDefault();
    if (S.otpState === 'verifying' || S.otpState === 'ok' || S.otpState === 'expired') return;
    stopFill();
    S.otp = d; S.otpState = 'idle'; prevOtp = d; F.upd();
    if (d.length === LEN) { clearTimeout(vT); vT = setTimeout(verify, 140); }
  });
  /* the message banner fills with the same quick cascade while the code screen is open */
  F.el.screen.addEventListener('click', e => {
    if (!S.open || S.screen !== 'otp' || !e.target.closest || !e.target.closest('#banner')) return;
    e.stopPropagation();
    const c = S.codes.find(x => String(x.id) === F.el.banner.dataset.code);
    F.hideBanner();
    if (c) F.fillCode(c);
  }, true);

  /* “From Messages” above the keypad, as iOS offers SMS codes */
  function otpSuggestion() {
    if (S.kb !== 'num' || S.focus !== 'a-otp') return;
    let box = F.el.kb.querySelector('.a-sug');
    if (!box) { box = document.createElement('div'); box.className = 'a-sug'; F.el.kb.appendChild(box); }
    const c = F.activeCode();
    const show = c && c.channel === 'sms' && !F.isExpired(c) && !cascading && S.otp.length < LEN && (S.otpState === 'idle' || S.otpState === 'wrong');
    setHTML(box, show ? `<button type="button" data-act="a-otp-sug" aria-label="Use code ${c.code} from Messages"><small>From Messages</small><b>${c.code}</b></button>${KEY}` : '');
  }

  F.SCREENS.otp = {
    status: 'dark', kb: 'num', focus: 'a-otp', cls: 'otp a-otp',
    render: () => {
      const box = i => `<div class="ob" style="--i:${i}"></div>`;
      return `<div class="nav">${backBtn('back')}${spacer}</div>
      <div class="scr-body">
        <h1 class="h1">Enter the <em>6-digit code</em></h1>
        <p class="lead otp-lead"></p>
        <div class="otp-row a-otp6" role="group" aria-label="6-digit code">${[0, 1, 2].map(box).join('')}<span class="a-otp-sep"></span>${[3, 4, 5].map(box).join('')}</div>
        <div class="otp-status" aria-live="polite"></div><div class="otp-alert"></div>
        <div class="resend a-rs"></div>
      </div>`;
    },
    mount() { prevOtp = S.otp; },
    update(n) {
      if (S.otp !== prevOtp) {
        prevOtp = S.otp;
        if (S.otp.length === LEN && S.otpState === 'idle') { clearTimeout(vT); vT = setTimeout(verify, 280); }
      }
      const ch = S.channel === 'wa' ? 'WhatsApp' : 'SMS', other = S.channel === 'wa' ? 'SMS' : 'WhatsApp';
      const last = S.codes[S.codes.length - 1];
      setHTML(n.querySelector('.otp-lead'), `Sent by ${ch} to <b>${F.fullPhone()}</b> · <button class="link" type="button" data-act="edit-number">Edit</button>`);
      const row = n.querySelector('.otp-row');
      const rc = 'otp-row a-otp6' + ({ wrong: ' err', ok: ' ok', verifying: ' busy', expired: ' dis' }[S.otpState] || '');
      if (row.className !== rc) row.className = rc;
      const typing = S.otpState === 'idle' || S.otpState === 'wrong';
      row.querySelectorAll('.ob').forEach((b, i) => {
        const v = S.otp[i] || '', act = typing && S.otp.length < LEN && i === S.otp.length;
        const bc = 'ob' + (v ? ' fill' : '') + (act ? ' act' : '');
        if (b.className !== bc) b.className = bc;
        setHTML(b, v ? `<span class="a-dg">${v}</span>` : act ? '<span class="caret"></span>' : '');
      });
      const st = n.querySelector('.otp-status');
      st.classList.toggle('ok', S.otpState === 'ok');
      setHTML(st, S.otpState === 'verifying' ? '<span class="spin dark sm"></span>Checking your code…'
        : S.otpState === 'ok' ? `<span class="a-tick">${TICK}</span>Verified`
        : last && last.status === 'pending' ? `<span class="spin dark sm"></span>Sending your code by ${ch}…` : '');
      const left = S.maxAttempts - S.attempts;
      setHTML(n.querySelector('.otp-alert'),
        S.otpState === 'wrong' ? `<div class="alert err" role="alert"><span class="a-ic">${icon('alert', 18, 2.2)}</span><div><b>${S.wasOld ? 'That’s an older code' : 'That code doesn’t match'}</b>${S.wasOld ? 'We’ve sent you a newer one — use the latest message.' : 'Check the latest message and try again.'} <span style="white-space:nowrap;font-weight:700">${left} ${left === 1 ? 'attempt' : 'attempts'} left<span class="tries">${[...Array(S.maxAttempts)].map((_, i) => `<i class="${i < S.attempts ? 'used' : ''}"></i>`).join('')}</span></span></div></div>`
        : S.otpState === 'expired' ? `<div class="alert warn" role="alert"><span class="a-ic">${icon('clock', 18, 2.2)}</span><div><b>This code has expired</b>Codes are valid for 5 minutes. Get a fresh one — it only takes a second.<br><button class="a-btn" type="button" data-act="new-code">${icon('refresh', 14, 2.4)} Send a new code</button></div></div>`
        : '');
      const wait = S.resendAt - Date.now();
      const mode = S.otpState === 'ok' || S.otpState === 'expired' ? 'ok' : S.resending ? 'sending' : wait > 0 ? 'wait' : 'ready';
      const rs = n.querySelector('.a-rs');
      setHTML(rs, mode === 'ok' ? ''
        : mode === 'sending' ? '<span class="spin dark sm"></span>Sending a new code…'
        : mode === 'wait' ? `${RING}<span>Resend code in <span class="t"></span></span>`
        : `Didn’t get it? <button class="link" type="button" data-act="resend">Resend code</button><span class="sep"></span><button class="link" type="button" data-act="switch-ch">Send by ${other}</button>`);
      if (mode === 'wait') {
        const t = rs.querySelector('.t'), s = F.mmss(wait);
        if (t.textContent !== s) t.textContent = s;
        rs.querySelector('.v').style.strokeDashoffset = (50.27 * (1 - Math.min(1, wait / RESEND_MS))).toFixed(2);
      }
      otpSuggestion();
    },
    tick(n) {
      const c = F.activeCode();
      if (c && F.isExpired(c) && S.otpState === 'idle') { stopFill(); c.status = 'expired'; S.otpState = 'expired'; S.otp = ''; prevOtp = ''; F.upd(); return; }
      this.update(n);
    },
  };

  /* ================= details for a new patient (A5 toggles gone, A6 consent stays, A7 “Create account”) ================= */
  F.SCREENS.profile = {
    status: 'dark', cls: 'profile a-details',
    render: () => `<div class="nav">${backBtn('edit-number', 'Change number')}${spacer}</div>
      <div class="scr-body" data-act="blur">
        <div class="eyebrow">${icon('check', 13, 2.8)} Number verified</div>
        <h1 class="h1">Welcome to FRH. <em>What’s your name?</em></h1>
        <p class="lead">So your clinician knows who they’re visiting. Use the name on your Emirates ID or passport.</p>
        <div class="tf-lbl">Full name</div>
        <div class="tf name" data-act="focus" data-f="name">${icon('user', 20, 1.9)}<div class="tf-v"></div></div>
        <div class="tf-lbl">Email <span>Optional · for receipts &amp; visit reports</span></div>
        <div class="tf email" data-act="focus" data-f="email">${icon('mail', 20, 1.9)}<div class="tf-v"></div></div>
        <div class="em-msg"></div>
        <div class="consent" data-act="consent"><span class="cbx">${icon('check', 15, 3)}</span><span>I agree to the <u>Terms of Service</u> and <u>Privacy Policy</u>, and allow FRH clinicians to access my health information to provide my care.</span></div>
        <p class="a-note">${icon('bell', 14, 2.2)}<span>Visit reminders come by WhatsApp. You can change this anytime in Notification settings.</span></p>
      </div>
      <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="a-create"></button></div>`,
    update(n) {
      const f = S.focus;
      const val = (k, ph) => (S[k] ? `<span>${F.esc(S[k])}</span>` : '') + (f === k ? '<span class="caret"></span>' : '') + (S[k] ? '' : `<span class="ph">${ph}</span>`);
      setHTML(n.querySelector('.tf.name .tf-v'), val('name', 'As on your Emirates ID'));
      setHTML(n.querySelector('.tf.email .tf-v'), val('email', 'name@example.com'));
      n.querySelector('.tf.name').classList.toggle('focus', f === 'name');
      n.querySelector('.tf.email').classList.toggle('focus', f === 'email');
      n.querySelector('.tf.email').classList.toggle('error', !!S.emailErr);
      setHTML(n.querySelector('.em-msg'), S.emailErr ? `<div class="fmsg" role="alert">${icon('alert', 16, 2.2)}<span>${S.emailErr}</span></div>` : '');
      n.querySelector('.cbx').classList.toggle('on', S.consent);
      const b = n.querySelector('[data-act="a-create"]');
      b.classList.toggle('off', !(S.name.trim().length >= 2 && S.consent) && !S.creating);
      b.classList.toggle('loading', S.creating);
      setHTML(b, S.creating ? '<span class="spin"></span>Creating your account…' : S.aCreated ? `Continue ${icon('arrowRight', 18, 2.2)}` : 'Create account');
    },
  };
  function createAccount() {
    if (S.creating) return;
    if (S.email && !validEmail(S.email)) { S.emailErr = F.EMAIL_ERR; F.upd(); F.shake('.tf.email'); return; }
    if (S.name.trim().length < 2) { F.focusField('name'); F.shake('.tf.name'); return; }
    if (!S.consent) { F.focusField(null); F.shake('.consent'); return; }
    F.focusField(null);
    if (S.aCreated) { F.go('a-locperm'); return; }
    if (!S.online) { S.pending = 'a-create'; F.openSheet('offline'); return; }
    S.creating = true; F.upd();
    const from = S.screen;
    setTimeout(() => {
      S.creating = false;
      if (!S.open || S.screen !== from) return;
      S.aCreated = true; S.guest = false;
      F.go('a-locperm');
    }, 1200);
  }
  /* the original “Try again” on the offline sheet doesn’t know these steps */
  const PENDING = { 'a-create': () => createAccount(), 'a-addr-ok': () => F.ACT['a-addr-ok']() };
  const RETRY0 = F.ACT.retry;
  F.ACT.retry = (n, e) => {
    const p = S.pending;
    if (PENDING[p] && S.online) {
      S.pending = null; F.closeSheet();
      later(320, PENDING[p], S.screen);
      return;
    }
    return RETRY0 && RETRY0(n, e);
  };

  /* ================= location priming (A9 “Continue”, A10 never blocks) ================= */
  F.SCREENS['a-locperm'] = {
    status: 'dark', cls: 'a-perm',
    render: () => `<div class="nav">${backBtn('a-perm-back')}${spacer}</div>
      <div class="scr-body">
        <div class="a-perm-ill">${LOC_SVG}</div>
        <h1 class="h1">Let us find <em>your address</em></h1>
        <p class="lead">FRH comes to you. Share your location and we’ll fill in your address, so your clinician finds the right door.</p>
        <div class="info-card a-why">
          <div class="info-row"><span class="tile">${icon('pin', 17, 2)}</span><span class="ir-mid"><b>Your address in seconds</b><small>We drop the pin for you, no typing</small></span></div>
          <div class="info-row"><span class="tile">${icon('stetho', 17, 2)}</span><span class="ir-mid"><b>Care that’s available near you</b><small>Services and timings differ by emirate</small></span></div>
          <div class="info-row"><span class="tile">${icon('nav', 17, 2)}</span><span class="ir-mid"><b>Your clinician finds the door</b><small>Only used while you’re using the app</small></span></div>
        </div>
        <div class="a-perm-state"></div>
      </div>
      <div class="scr-foot"><div class="stack a-perm-foot"></div></div>`,
    update(n) {
      const denied = S.aLocPerm === 'denied';
      setHTML(n.querySelector('.a-perm-state'), denied
        ? `<div class="alert warn" role="status"><span class="a-ic">${icon('pin', 18, 2.2)}</span><div><b>Location is off for FRH</b>Turn it on in Settings, or type your address instead.</div></div>` : '');
      setHTML(n.querySelector('.a-perm-foot'), denied
        ? `<button class="btn btn-primary" type="button" data-act="a-settings">Open Settings</button><button class="btn btn-ghost" type="button" data-act="a-manual">Enter address instead</button>`
        : `<button class="btn btn-primary" type="button" data-act="a-perm-go">Continue</button><button class="btn btn-ghost" type="button" data-act="a-manual">Enter address instead</button>`);
    },
  };

  /* the iOS system alert that “Continue” hands over to */
  F.SHEETS['a-ios-loc'] = () => `<div class="a-block"></div><div class="a-ios" role="alertdialog" aria-label="Allow FRH Health to use your location?">
      <div class="a-ios-b"><b>Allow “FRH Health” to use your location?</b><p>FRH uses your location to find your address and guide your clinician to your door.</p>
        <div class="a-ios-map">${MINI_MAP}<span class="a-ios-prec">${icon('nav', 11, 2.6)} Precise: On</span></div></div>
      <button type="button" data-act="a-ios-allow">Allow Once</button><button type="button" data-act="a-ios-allow">Allow While Using App</button><button type="button" data-act="a-ios-deny">Don’t Allow</button></div>`;

  /* location denied (A19): Settings, or type the address */
  F.SHEETS['a-locdenied'] = () => `<div class="sheet" role="dialog" aria-label="Location is off"><div class="grab"></div>
      <div class="sh-ic red">${icon('pin', 34, 1.9)}</div>
      <h2>Location is off for FRH</h2>
      <p>Turn it on in Settings and we’ll find your address for you. Or type it in yourself. It only takes a moment.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="a-settings">Open Settings</button><button class="btn btn-secondary" type="button" data-act="a-manual">Enter address instead</button></div>
    </div>`;

  /* ================= address detection + confirm ================= */
  let detT = null;
  function startDetect() {
    clearTimeout(detT);
    const mode = S.aDetectNext || S.aDetectMode || 'ok';
    S.aDetectNext = null;
    S.aDetect = 'finding'; S.aFound = null;
    detT = setTimeout(() => {
      if (!S.open || S.screen !== 'a-addr' || S.aDetect !== 'finding') return;
      if (mode === 'fail') {
        S.aDetect = 'fail'; F.upd();
        later(600, () => { if (!S.sheet && S.aDetect === 'fail') openLocSelect('fail'); }, 'a-addr');
      } else if (mode === 'outside') {
        S.aDetect = 'outside'; S.aFound = OUT_ADDR; S.aOut = { city: OUT_ADDR.city, line: OUT_ADDR.line, ctx: 'onboarding' }; F.upd();
        later(650, () => { if (!S.sheet && S.aDetect === 'outside') F.openSheet('a-outside'); }, 'a-addr');
      } else { S.aDetect = 'found'; S.aFound = HOME_ADDR; F.upd(); }
    }, 1700);
  }
  const addrCard = (a, end, cls = '') => `<div class="a-addr-card${cls}"><span class="tile">${icon('home', 18, 2)}</span><span class="ir-mid"><b>${F.esc(a.line1)}</b><small>${(cityOf(a.city) || CITIES[0]).n} · United Arab Emirates</small></span>${end || ''}</div>`;
  F.SCREENS['a-addr'] = {
    status: 'dark', cls: 'a-addr',
    render: () => `<div class="nav">${backBtn('a-addr-back')}${spacer}</div>
      <div class="scr-body">
        <div class="a-map">${MAP_SVG}<div class="a-map-pin"><i class="a-pulse"></i><i class="a-pulse b"></i><span class="a-pin">${PIN_SVG}</span><span class="a-pin-sh"></span></div><div class="a-map-tag"></div><span class="a-map-gps">${icon('nav', 14, 2.4)}</span></div>
        <div class="a-addr-main"></div>
      </div>
      <div class="scr-foot"><div class="stack a-addr-foot"></div></div>`,
    mount() { S.aBusy = null; if (!['found', 'fail', 'outside'].includes(S.aDetect)) startDetect(); },
    update(n) {
      const d = S.aDetect || 'finding', a = S.aFound, oc = a && cityOf(a.city);
      const map = n.querySelector('.a-map'), mc = 'a-map is-' + d;
      if (map.className !== mc) map.className = mc;
      setHTML(n.querySelector('.a-map-tag'), a && (d === 'found' || d === 'outside') ? F.esc(a.tag) : '');
      let main, foot;
      if (d === 'found' && a) {
        main = `<h1 class="h1">Is this <em>your address</em>?</h1>
          <p class="lead">Your clinician will come here. You can add a gate code or landmark later.</p>
          ${addrCard(a, '<button class="link" type="button" data-act="a-manual">Edit</button>')}
          <div class="a-served">${icon('check', 15, 2.6)}<span>Home visits available here · doctors on call 24/7</span></div>`;
        foot = `<button class="btn btn-primary${S.aBusy === 'confirm' ? ' loading' : ''}" type="button" data-act="a-addr-ok">${btnBusy('confirm', 'Confirm address', 'Saving…')}</button><button class="btn btn-ghost" type="button" data-act="a-manual">Enter a different address</button>`;
      } else if (d === 'fail') {
        main = `<h1 class="h1">We couldn’t find <em>your address</em></h1>
          <p class="lead">The signal can be weak indoors. Choose your city and type your address instead.</p>
          <div class="a-addr-card a-miss"><span class="tile">${icon('alert', 18, 2)}</span><span class="ir-mid"><b>Location unavailable</b><small>Move near a window, or type it in</small></span></div>
          <div class="a-served a-hold"></div>`;
        foot = `<button class="btn btn-primary" type="button" data-act="a-cities">Choose your city</button><button class="btn btn-ghost" type="button" data-act="a-redetect">${icon('refresh', 17, 2.2)} Try again</button>`;
      } else if (d === 'outside' && a) {
        const told = S.aNotify[a.city];
        main = `<h1 class="h1">We’re not in <em>${oc.n}</em> yet</h1>
          <p class="lead">FRH home visits run in Dubai and Sharjah today. Video consults already work anywhere in the UAE.</p>
          ${addrCard(a, '<span class="pill amber">Coming soon</span>')}
          <div class="a-served${told ? '' : ' a-hold'}">${told ? `${icon('bell', 15, 2.4)}<span>We’ll message you when FRH opens in ${oc.n}</span>` : ''}</div>`;
        foot = `<button class="btn btn-primary" type="button" data-act="a-cities">Choose a city we serve</button><button class="btn btn-ghost" type="button" data-act="a-browse">Look around first</button>`;
      } else {
        main = `<h1 class="h1">Finding <em>your address</em>…</h1>
          <p class="lead">Hold on, this only takes a moment.</p>
          <div class="a-addr-card a-skel" aria-hidden="true"><span class="tile"></span><span class="ir-mid"><i></i><i class="s"></i></span></div>
          <div class="a-served a-hold"></div>`;
        foot = `<button class="btn btn-primary off" type="button" aria-disabled="true">Confirm address</button><button class="btn btn-ghost" type="button" data-act="a-manual">Enter a different address</button>`;
      }
      setHTML(n.querySelector('.a-addr-main'), main);
      setHTML(n.querySelector('.a-addr-foot'), foot);
    },
  };

  /* typing the address: profile builder's full form, or the city list when it isn't there */
  function addressSaved(addr) {
    const a = addr || {};
    const line = a.line || [a.line1, a.area, a.city].filter(Boolean).join(', ');
    const c = cityOf(a.cityKey) || cityOf(a.city) || cityOf(cityFromText(`${line} ${a.city || ''} ${a.emirate || ''}`)) || F.aCity();
    const saved = { label: a.label || 'Home', line1: a.line1 || line.split(',').slice(0, 2).join(',').trim(), city: c.k, line };
    if (!c.live) {
      /* saved, but we can't visit there yet: land on Home (video consults still work) and say so plainly */
      S.aAddr = saved; S.guest = false; S.aLocCtx = null; S.aResume = null;
      S.aOut = { city: c.k, line, ctx: 'form' };
      F.go('home', { dir: 'fade' });
      later(520, () => { if (!S.sheet) F.openSheet('a-outside'); }, 'home');
      return;
    }
    S.aAddr = saved;
    setCity(c);
    finish();
  }
  function openForm(city) {
    if (typeof F.openAddressForm === 'function') {
      F.openAddressForm({ ctx: 'onboarding', city: city || F.aCity().n, done: addressSaved });
      return true;
    }
    return false;
  }
  function enterAddress() {
    const from = S.screen, hadSheet = !!S.sheet;
    if (hadSheet) F.closeSheet();
    const run = () => { if (!openForm()) openLocSelect('manual'); };
    if (hadSheet) later(320, run, from); else run();
  }
  function finish(msg) {
    S.guest = false; S.aLocCtx = null; S.aResume = null;
    F.go('home', { dir: 'fade' });
    setTimeout(() => F.toast(msg || `You’re all set, ${F.firstName()}`, 'check'), 450);
  }
  const swapSheet = kind => {
    const from = S.screen;
    F.closeSheet();
    later(300, () => { if (!S.sheet) F.openSheet(kind); }, from);
  };

  /* ================= city list (A11 only when needed, A12 coming-soon tags) ================= */
  const openLocSelect = ctx => { S.aLocCtx = ctx || 'app'; F.openSheet('loc-select'); };
  F.aOpenLocSelect = openLocSelect;
  F.SHEETS['loc-select'] = () => {
    const ctx = S.aLocCtx || 'app', app = ctx === 'app', cur = F.aCity().k;
    const seen = ctx === 'outside' && S.aOut ? S.aOut.city : S.aDetect === 'outside' && S.aFound ? S.aFound.city : null;
    const sub = c => (c.k === seen ? 'Detected near you' : c.live ? 'Home visits available' : 'Video consults only for now');
    const end = c => (!c.live ? '<span class="pill ink">Coming soon</span>'
      : app && c.k === cur ? `<span class="a-tick-sm">${icon('check', 15, 3)}</span>` : app ? '' : `<span class="a-chev">${icon('chevRight', 18, 2.2)}</span>`);
    const row = c => `<button class="a-loc-row${app && c.k === cur ? ' on' : ''}${c.live ? '' : ' off'}" type="button" data-act="a-loc-pick" data-k="${c.k}">${flag('AE', 28)}<span class="a-loc-n">${c.n}<small>${sub(c)}</small></span>${end(c)}</button>`;
    return `<div class="sheet a-loc-sheet" role="dialog" aria-label="Choose your city"><div class="grab"></div>
      <h2>${app ? 'Choose your city' : 'Which city should we come to?'}</h2>
      <p>FRH home visits run in Dubai and Sharjah today. More emirates are coming soon.</p>
      <div class="a-loc-list"><div class="cc-sec">United Arab Emirates</div>${CITIES.map(row).join('')}</div></div>`;
  };

  /* ================= outside the service area (A13) ================= */
  F.aLocWarn = (k, line) => {
    const c = cityOf(k) || cityOf('abudhabi');
    if (c.live) { if (c.k !== S.aCity) { setCity(c); cityChanged(c); } return; }
    S.aOut = { city: c.k, line: line || '', ctx: 'app' };
    F.openSheet('a-outside');
  };
  F.SHEETS['a-outside'] = () => {
    const o = S.aOut || { city: 'abudhabi', ctx: 'app' }, c = cityOf(o.city) || CITIES[2], ctx = o.ctx;
    const told = S.aNotify[c.k];
    const primary = ctx === 'onboarding' ? `<button class="btn btn-primary" type="button" data-act="a-out-cities">Choose a city we serve</button>`
      : ctx === 'form' ? `<button class="btn btn-primary" type="button" data-act="a-out-form">Add a Dubai or Sharjah address</button>`
      : `<button class="btn btn-primary" type="button" data-act="a-out-change">Use another address</button>`;
    const notify = told ? `<button class="btn btn-secondary a-done" type="button" data-act="sheet-close">${icon('check', 17, 2.6)} We’ll let you know</button>`
      : `<button class="btn btn-secondary" type="button" data-act="a-out-notify">${icon('bell', 17, 2.2)} Notify me when it opens</button>`;
    return `<div class="sheet" role="dialog" aria-label="Outside our service area"><div class="grab"></div>
      <div class="sh-ic a-amber">${icon('pin', 34, 1.9)}</div>
      <h2>We don’t serve ${c.n} yet</h2>
      <p>FRH home visits run in Dubai and Sharjah today, and ${c.n} is coming soon. Video consults already work anywhere in the UAE.</p>
      <div class="stack">${primary}${notify}</div>
    </div>`;
  };

  /* ================= maintenance: fully blocking, Call FRH (A14, A15) ================= */
  const MAINT0 = F.SCREENS.maintenance;
  const MAINT_ILL = MAINT0 ? ((/<div class="c-ill">([\s\S]*?)<\/div>/.exec(MAINT0.render()) || [])[1] || '') : '';
  F.SCREENS.maintenance = {
    status: 'dark', cls: 'c-state a-full a-maint',
    render() {
      const m = (window.FRHCHAT || {}).maintenance || {};
      return `<div class="scr-body">
          <div class="c-ill">${MAINT_ILL || UPD_SVG}</div>
          <h1 class="h1">We’re under maintenance</h1>
          <p class="lead">${m.body || 'FRH is carrying out planned maintenance, so the app is briefly unavailable. Every confirmed visit still stands.'}</p>
          <div class="c-line">${icon('clock', 15, 2.2)}<span>${m.eta || 'Back in about 30 minutes'}</span></div>
          <button class="sos a-sos" type="button" data-act="a-call" data-n="ambulance"><span class="si">${icon('ambulance', 20, 2)}</span><div><b>Medical emergency?</b><span>Call 998 for an ambulance</span></div></button>
        </div>
        <div class="scr-foot"><div class="stack">
          <button class="btn btn-primary" type="button" data-act="a-call" data-n="frh">${icon('phone', 18, 2.2)} Call FRH</button>
          <button class="btn btn-ghost a-maint-retry" type="button" data-act="a-maint-retry"></button></div></div>`;
    },
    mount() { S.aBusy = null; },
    update(n) {
      const b = n.querySelector('.a-maint-retry');
      b.classList.toggle('loading', S.aBusy === 'maint');
      setHTML(b, S.aBusy === 'maint' ? '<span class="spin dark sm"></span>Checking…' : `${icon('refresh', 18, 2.2)} Try again`);
    },
  };

  /* calling from a blocking screen goes through the iOS call prompt */
  const CALLS = { frh: { who: 'FRH Healthcare', num: '800 374' }, ambulance: { who: 'Ambulance (Dubai)', num: '998' } };
  F.SHEETS['a-ios-call'] = () => {
    const c = CALLS[S.aCall] || CALLS.frh;
    return `<div class="a-ios-as" role="dialog" aria-label="Call ${c.who}"><div class="a-ios-as-g"><div class="a-ios-as-t">${c.who}</div><button type="button" data-act="a-call-go">${icon('phone', 18, 2.2)} Call ${c.num}</button></div><button class="a-ios-as-c" type="button" data-act="sheet-close">Cancel</button></div>`;
  };

  /* ================= session expired → sign in → back where you were (A16) ================= */
  const AUTH = ['splash', 'onb', 'phone', 'otp', 'locked', 'profile', 'success', 'a-locperm', 'a-addr', 'a-update', 'a-offline', 'maintenance'];
  F.SHEETS['a-session'] = () => `<div class="a-block"></div><div class="sheet a-nograb" role="alertdialog" aria-label="Please sign in again">
      <div class="sh-ic red">${icon('lock', 34, 1.9)}</div>
      <h2>Please sign in again</h2>
      <p>For your security, we signed you out after a while away. Sign in and we’ll bring you right back here.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="a-session-signin">Sign in</button></div>
    </div>`;

  /* ================= force update, breaking changes only (A17) ================= */
  F.SCREENS['a-update'] = {
    status: 'dark', cls: 'c-state a-full',
    render: () => `<div class="scr-body">
        <div class="c-ill">${UPD_SVG}</div>
        <h1 class="h1">A new version is available</h1>
        <p class="lead">This version of FRH is no longer supported. Update to keep booking visits and seeing your records.</p>
        <div class="c-line">${icon('download', 15, 2.2)}<span>Version 1.4 · about 30 MB</span></div>
      </div>
      <div class="scr-foot"><div class="stack"><button class="btn btn-primary a-upd" type="button" data-act="a-update-now"></button></div>
        <p class="a-foot-note">Need care now? <button class="link" type="button" data-act="a-call" data-n="frh">Call 800 FRH</button></p></div>`,
    mount() { S.aBusy = null; },
    update(n) {
      const b = n.querySelector('.a-upd');
      b.classList.toggle('loading', S.aBusy === 'upd');
      setHTML(b, btnBusy('upd', 'Update now', 'Opening the App Store…'));
    },
  };

  /* ================= no internet at first launch, nothing cached (A18) ================= */
  F.SCREENS['a-offline'] = {
    status: 'dark', cls: 'c-state a-full',
    render: () => `<div class="scr-body">
        <div class="c-ill">${OFF_SVG}</div>
        <h1 class="h1">No internet connection</h1>
        <p class="lead">FRH needs a connection to load for the first time. Check your Wi-Fi or mobile data, then try again.</p>
        <div class="a-off-note" role="status"></div>
      </div>
      <div class="scr-foot"><div class="stack"><button class="btn btn-primary a-off-retry" type="button" data-act="a-retry"></button></div>
        <p class="a-foot-note">Medical emergency? <button class="link" type="button" data-act="a-call" data-n="ambulance">Call 998</button></p></div>`,
    mount() { S.aBusy = null; S.aOffNote = false; },
    update(n) {
      const b = n.querySelector('.a-off-retry');
      b.classList.toggle('loading', S.aBusy === 'off');
      setHTML(b, btnBusy('off', `${icon('refresh', 18, 2.2)} Try again`, 'Connecting…'));
      setHTML(n.querySelector('.a-off-note'), S.aOffNote ? `${icon('wifiOff', 15, 2.2)} Still offline — check your connection` : '');
    },
  };

  /* ================= actions ================= */
  Object.assign(F.ACT, {
    'a-otp-sug': () => { const c = F.activeCode(); if (c) F.fillCode(c); },
    'a-create': () => createAccount(),
    'a-perm-back': () => F.go('profile', { dir: 'back' }),
    'a-perm-go': () => {
      if (S.aLocPerm === 'granted') { S.aDetect = null; F.go('a-addr'); }
      else if (S.aLocPerm === 'denied') F.openSheet('a-locdenied');
      else F.openSheet('a-ios-loc');
    },
    'a-ios-allow': () => {
      F.closeSheet();
      S.aLocPerm = 'granted'; S.aDetect = null;
      later(240, () => F.go('a-addr'), 'a-locperm');
    },
    'a-ios-deny': () => {
      F.closeSheet();
      S.aLocPerm = 'denied'; F.upd();
      later(420, () => { if (!S.sheet) F.openSheet('a-locdenied'); }, 'a-locperm');
    },
    /* the round trip to iOS Settings: back in the app with location on */
    'a-settings': () => {
      F.closeSheet();
      later(700, () => {
        S.aLocPerm = 'granted'; S.aDetect = null; F.upd();
        F.toast('Location is on for FRH Health', 'nav');
        later(650, () => { if (!S.sheet) F.go('a-addr'); }, 'a-locperm');
      }, 'a-locperm');
    },
    'a-manual': () => enterAddress(),
    'a-addr-back': () => { clearTimeout(detT); if (S.aDetect === 'finding') S.aDetect = null; F.go('a-locperm', { dir: 'back' }); },
    'a-addr-ok': () => {
      if (S.aDetect !== 'found' || !S.aFound) return;
      if (!S.online) { S.pending = 'a-addr-ok'; F.openSheet('offline'); return; }
      busy('confirm', 650, () => { S.aAddr = Object.assign({}, S.aFound); setCity(cityOf(S.aFound.city)); finish(); });
    },
    'a-redetect': () => { S.aDetect = null; startDetect(); F.upd(); },
    'a-cities': () => openLocSelect(S.aDetect === 'outside' ? 'outside' : 'fail'),
    'a-browse': () => { F.closeSheet(true); finish(`Welcome to FRH, ${F.firstName()}`); },
    'a-loc-select': () => openLocSelect('app'),
    'a-loc-pick': n => {
      const c = cityOf(n.dataset.k);
      if (!c) return;
      const ctx = S.aLocCtx || 'app';
      if (!c.live) { S.aOut = { city: c.k, line: '', ctx: ctx === 'app' ? 'app' : 'onboarding' }; swapSheet('a-outside'); return; }
      setCity(c);
      if (ctx === 'app') { S.aLocCtx = null; F.closeSheet(); cityChanged(c); F.toast(`Showing care in ${c.n}`, 'pin'); return; }
      F.closeSheet();
      later(320, () => { if (!openForm(c.n)) finish(`You’re all set, ${F.firstName()}. Add your address when you book`); }, S.screen);
    },
    'a-out-cities': () => swapSheet('loc-select'),
    'a-out-form': () => { F.closeSheet(); later(320, () => { if (!openForm()) openLocSelect('manual'); }, S.screen); },
    'a-out-notify': () => {
      const c = cityOf((S.aOut || {}).city) || CITIES[2];
      S.aNotify[c.k] = true;
      F.closeSheet(); F.upd();
      F.toast(`We’ll message you when FRH opens in ${c.n}`, 'bell');
    },
    'a-out-change': () => {
      F.closeSheet();
      if (typeof F.aOnWarnChange === 'function') F.aOnWarnChange();
    },
    'a-call': n => { S.aCall = (n && n.dataset && n.dataset.n) || 'frh'; F.openSheet('a-ios-call'); },
    'a-call-go': () => { const c = CALLS[S.aCall] || CALLS.frh; F.closeSheet(); F.toast(`Calling ${c.who} · ${c.num}`, 'phone'); },
    'a-maint-retry': () => busy('maint', 1100, () => { F.toast(((window.FRHCHAT || {}).maintenance || {}).toast || 'Still under maintenance — please try again shortly', 'clock'); F.shake('.c-ill'); }),
    'a-session-signin': () => {
      const at = S.screen;
      S.aResume = { screen: AUTH.includes(at) ? 'home' : at };
      F.closeSheet(true);
      stopFill();
      Object.assign(S, { otp: '', otpState: 'idle', attempts: 0, guest: false, phoneErr: '', sending: false });
      if (F.validatePhone()) { S.country = F.COUNTRIES[0]; S.phone = F.DEMO.phone; }
      F.go('phone', { dir: 'fade' });
    },
    'a-update-now': () => busy('upd', 900, () => {
      F.toast('Opening FRH Health on the App Store', 'download');
      later(2200, () => { F.go(S.name ? 'home' : 'splash', { dir: 'fade' }); if (S.name) setTimeout(() => F.toast('FRH is up to date', 'check'), 450); }, 'a-update');
    }),
    'a-retry': () => busy('off', 800, () => {
      if (!S.online) { S.aOffNote = true; F.upd(); F.shake('.c-ill'); return; }
      S.onb = 0; F.go('onb', { dir: 'fade' });
    }),
  });

  /* ================= presenter hooks (the panel is the lead's) ================= */
  const at = { dir: 'fade' };
  const named = () => { if (!S.name) S.name = F.DEMO.name; };
  function prep(online = true) {
    if (!S.open) F.openInstant();
    F.closeSheet(true); F.hideBanner(); stopFill(); clearTimeout(detT);
    S.online = online; F.el.sb.classList.toggle('offline', !online);
    Object.assign(S, { guest: false, emailErr: '', phoneErr: '', pending: null, creating: false, sending: false, aBusy: null, aLocCtx: null, aResume: null, aDetectNext: null });
    if (F.validatePhone()) { S.country = F.COUNTRIES[0]; S.phone = F.DEMO.phone; }
  }
  const openAfter = (kind, ms = 260) => later(ms, () => { if (!S.sheet) F.openSheet(kind); }, S.screen);
  const onPerm = perm => { prep(); named(); S.consent = true; S.aCreated = true; S.aLocPerm = perm; F.go('a-locperm', at); };
  const onAddr = (state, found) => { prep(); named(); S.aCreated = true; S.aLocPerm = 'granted'; S.aDetect = state; S.aFound = found || null; F.go('a-addr', at); };
  const JUMPS = {
    splash: () => { prep(); F.go('splash', at); },
    onb1: () => { prep(); S.onb = 0; F.go('onb', at); },
    onb2: () => { prep(); S.onb = 1; F.go('onb', at); },
    onb3: () => { prep(); S.onb = 2; F.go('onb', at); },
    phone: () => { prep(); F.go('phone', at); },
    country: () => { prep(); F.go('phone', at); openAfter('country'); },
    otp: () => { prep(); S.attempts = 0; F.issueCode(); F.go('otp', at); },
    'otp-sms': () => { prep(); S.attempts = 0; S.channel = 'sms'; F.issueCode(); F.go('otp', at); },
    'err-wrong': () => { prep(); S.attempts = 0; F.deliver(F.issueCode(), true); S.attempts = 1; S.otpState = 'wrong'; S.otp = ''; S.wasOld = false; F.go('otp', at); },
    'err-expired': () => {
      prep(); S.attempts = 0;
      const c = F.issueCode(); F.deliver(c, true);
      c.expiresAt = Date.now() - 1000; c.status = 'expired';
      S.otpState = 'expired'; S.otp = ''; S.resendAt = 0;
      F.go('otp', at);
    },
    profile: () => { prep(); S.aCreated = false; F.go('profile', at); },
    'a-locperm': () => onPerm('idle'),
    'a-ios-loc': () => { onPerm('idle'); openAfter('a-ios-loc'); },
    'a-locdenied': () => { onPerm('denied'); openAfter('a-locdenied'); },
    'a-addr': () => { prep(); named(); S.aCreated = true; S.aLocPerm = 'granted'; S.aDetect = null; S.aDetectNext = 'ok'; F.go('a-addr', at); },
    'a-addr-found': () => onAddr('found', HOME_ADDR),
    'a-city': () => { onAddr('fail'); later(300, () => { if (!S.sheet) openLocSelect('fail'); }, 'a-addr'); },
    'a-outside': () => { onAddr('outside', OUT_ADDR); S.aOut = { city: OUT_ADDR.city, line: OUT_ADDR.line, ctx: 'onboarding' }; openAfter('a-outside'); },
    maintenance: () => { prep(); F.go('maintenance', at); },
    'a-update': () => { prep(); F.go('a-update', at); },
    'a-session': () => { prep(); named(); F.aSessionExpired(); },
    'a-offline': () => { prep(false); S.aOffNote = false; F.go('a-offline', at); },
  };
  F.authJump = id => { const fn = JUMPS[id]; if (!fn) return false; fn(); F.sync(); return true; };
  F.authView = () => {
    if (!S.open) return null;
    const sh = { 'a-ios-loc': 'a-ios-loc', 'a-locdenied': 'a-locdenied', 'loc-select': 'a-city', 'a-outside': 'a-outside', 'a-session': 'a-session' }[S.sheet];
    if (sh) return sh;
    if (S.screen === 'a-addr') return S.aDetect === 'fail' ? 'a-city' : S.aDetect === 'outside' ? 'a-outside' : 'a-addr';
    return ['a-locperm', 'maintenance', 'a-update', 'a-offline'].includes(S.screen) ? S.screen : null;
  };
  F.aSetDetect = m => { S.aDetectMode = ['ok', 'fail', 'outside'].includes(m) ? m : 'ok'; F.sync(); };
  F.aSessionExpired = () => {
    if (!S.open) F.openInstant();
    F.closeSheet(true);
    const here = S.screen && !AUTH.includes(S.screen) && F.cur();
    if (!here) { named(); S.guest = false; F.go('home', at); }
    later(here ? 0 : 380, () => F.openSheet('a-session'), S.screen);
  };
})();
