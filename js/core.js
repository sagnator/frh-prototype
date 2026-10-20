/* FRH prototype — core: state, device chrome, navigation, keyboard, OTP engine. */
(function () {
  const { icon, mark, appIcon } = window.FRHI;
  const $ = (s, r = document) => r.querySelector(s);
  const el = {
    screen: $('#screen'), app: $('#app'), ios: $('#iosHome'), launch: $('#launch'), kb: $('#kb'),
    banner: $('#banner'), sb: $('#statusbar'), home: $('#homeInd'), sheet: $('#sheetLayer'),
    toast: $('#toast'), fit: $('#deviceFit'),
  };

  const COUNTRIES = [
    { c: 'AE', n: 'United Arab Emirates', d: '971', len: [9, 9], fmt: [2, 3, 4], ph: '50 123 4567' },
    { c: 'SA', n: 'Saudi Arabia', d: '966', len: [9, 9], fmt: [2, 3, 4], ph: '51 234 5678' },
    { c: 'OM', n: 'Oman', d: '968', len: [8, 8], fmt: [4, 4], ph: '9123 4567' },
    { c: 'QA', n: 'Qatar', d: '974', len: [8, 8], fmt: [4, 4], ph: '3312 3456' },
    { c: 'BH', n: 'Bahrain', d: '973', len: [8, 8], fmt: [4, 4], ph: '3600 1234' },
    { c: 'KW', n: 'Kuwait', d: '965', len: [8, 8], fmt: [4, 4], ph: '5001 2345' },
    { c: 'IN', n: 'India', d: '91', len: [10, 10], fmt: [5, 5], ph: '98765 43210' },
    { c: 'PK', n: 'Pakistan', d: '92', len: [10, 10], fmt: [3, 7], ph: '301 2345678' },
    { c: 'PH', n: 'Philippines', d: '63', len: [10, 10], fmt: [3, 3, 4], ph: '905 123 4567' },
    { c: 'EG', n: 'Egypt', d: '20', len: [10, 10], fmt: [3, 3, 4], ph: '100 123 4567' },
    { c: 'GB', n: 'United Kingdom', d: '44', len: [10, 10], fmt: [4, 6], ph: '7400 123456' },
    { c: 'US', n: 'United States', d: '1', len: [10, 10], fmt: [3, 3, 4], ph: '201 555 0123' },
  ];
  const DEMO = { phone: '501234567', name: 'Sara Ahmed', email: 'sara.ahmed@example.com' };
  const FRESH = () => ({
    open: false, screen: null, onb: 0,
    country: COUNTRIES[0], phone: '', phoneErr: '', sending: false, channel: 'wa',
    codes: [], otp: '', otpState: 'idle', attempts: 0, maxAttempts: 3, resendAt: 0, resending: false,
    lockUntil: 0, lockedPhone: '', wasOld: false,
    name: '', email: '', emailErr: '', remind: true, promo: false, consent: false, creating: false,
    guest: false, sheet: null, pending: null, focus: null, kb: null, shift: true, sym: false,
    patient: 'new', online: true, failNext: false, tapped: false,
  });
  const S = FRESH();
  let scale = 1, busy = false, hist = [];

  const FRH = window.FRH = { S, el, COUNTRIES, DEMO, $, SCREENS: {}, SHEETS: {}, ACT: {} };

  /* ---------- helpers ---------- */
  const fmtPhone = (d, c = S.country) => {
    const out = []; let i = 0;
    for (const n of c.fmt) { if (i >= d.length) break; out.push(d.slice(i, i + n)); i += n; }
    if (i < d.length) out.push(d.slice(i));
    return out.join(' ');
  };
  const fullPhone = () => `+${S.country.d} ${fmtPhone(S.phone)}`;
  function validatePhone() {
    const c = S.country, d = S.phone;
    if (!d.length) return 'Enter your mobile number to continue.';
    if (c.c === 'AE') return d.length === 9 && d[0] === '5' ? '' : 'UAE mobile numbers start with 5 and have 9 digits, like 50 123 4567.';
    return d.length >= c.len[0] && d.length <= c.len[1] ? '' : `That doesn’t look like a ${c.n} mobile number.`;
  }
  const genCode = () => { let c; do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (/^(\d)\1+$/.test(c) || c === '1234'); return c; };
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const firstName = () => (S.name || DEMO.name).trim().split(/\s+/)[0];
  const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const activeCode = () => S.codes.find(c => c.status === 'active');
  const isExpired = c => !!c && Date.now() > c.expiresAt;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cur = () => el.app.querySelector('.scr.cur');
  Object.assign(FRH, { fmtPhone, fullPhone, validatePhone, mmss, firstName, greeting, activeCode, isExpired, esc, cur, fit: () => fit() });

  /* ---------- fit phone to viewport ---------- */
  function fit() {
    const narrow = window.innerWidth <= 880;
    const col = el.fit.parentElement;
    const availW = Math.max(260, (narrow ? window.innerWidth - 32 : col.clientWidth));
    const cap = document.getElementById('caption');                       /* v37: room for the caption as it is now (two lines, full, or hidden) */
    const availH = narrow ? Infinity : window.innerHeight - 56 - 12 - 18 - (cap ? cap.offsetHeight : 70) - 28;
    scale = Math.max(0.5, Math.min(1, availH / 888, availW / 429));
    document.documentElement.style.setProperty('--s', scale.toFixed(4));
  }

  /* ---------- status bar ---------- */
  const SIG = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" width="3" height="12" rx=".8"/></svg>';
  const WIFI = '<svg class="wifi" width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .5 10.2 10.2 0 0 0 .8 3.4L2 4.6a8.5 8.5 0 0 1 6-2.4z"/><path d="M8 5.6c1.4 0 2.6.5 3.6 1.4l1.2-1.2A7 7 0 0 0 8 3.9a7 7 0 0 0-4.8 1.9L4.4 7c1-.9 2.2-1.4 3.6-1.4z"/><path d="M8 9c.6 0 1.1.2 1.5.6L8 11.1 6.5 9.6c.4-.4.9-.6 1.5-.6z"/></svg>';
  const BAT = '<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45"/></svg>';
  function renderStatus() {
    const t = new Date();
    el.sb.innerHTML = `<div class="sb-time">${t.getHours() % 12 || 12}:${String(t.getMinutes()).padStart(2, '0')}</div><div class="sb-icons">${SIG}${WIFI}${BAT}</div>`;
  }
  function setStatus(mode) {
    el.sb.classList.toggle('light', mode === 'light');
    el.home.classList.toggle('light', mode === 'light');
    el.sb.classList.toggle('offline', !S.online);
  }

  /* ---------- iOS home screen ---------- */
  const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const svg62 = inner => `<svg viewBox="0 0 62 62" width="62" height="62" aria-hidden="true">${inner}</svg>`;
  function iosIcons(now) {
    const h = now.getHours() % 12, m = now.getMinutes();
    return {
      calendar: `<div style="width:62px;height:62px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font:600 10px/1 var(--ios);color:#E8423C;text-transform:uppercase;margin-top:3px">${now.toLocaleDateString('en-US', { weekday: 'short' })}</span><span style="font:300 32px/1.02 var(--ios);color:#111">${now.getDate()}</span></div>`,
      photos: svg62('<rect width="62" height="62" fill="#fff"/>' + ['#F9A825', '#FDD835', '#7CB342', '#26A69A', '#42A5F5', '#7E57C2', '#EC407A', '#EF5350'].map((c, i) => `<ellipse cx="31" cy="19.5" rx="6.5" ry="11" fill="${c}" opacity=".78" transform="rotate(${i * 45} 31 31)"/>`).join('')),
      camera: svg62(grad('gcam', '#ececf0', '#b5b7be') + '<rect width="62" height="62" fill="url(#gcam)"/><rect x="11" y="20" width="40" height="27" rx="6" fill="#2b2c30"/><rect x="24" y="16" width="14" height="6" rx="2" fill="#2b2c30"/><circle cx="31" cy="33.5" r="9" fill="#56585f"/><circle cx="31" cy="33.5" r="6" fill="#18191c"/><circle cx="44" cy="25" r="1.8" fill="#f5c542"/>'),
      clock: svg62('<rect width="62" height="62" fill="#111"/><circle cx="31" cy="31" r="24" fill="#fff"/><g stroke="#111" stroke-width="1.4">' + [...Array(12)].map((_, i) => `<line x1="31" y1="9.5" x2="31" y2="12.5" transform="rotate(${i * 30} 31 31)"/>`).join('') + `</g><line x1="31" y1="31" x2="31" y2="19" stroke="#111" stroke-width="2.6" stroke-linecap="round" transform="rotate(${(h + m / 60) * 30} 31 31)"/><line x1="31" y1="31" x2="31" y2="13" stroke="#111" stroke-width="1.8" stroke-linecap="round" transform="rotate(${m * 6} 31 31)"/><circle cx="31" cy="31" r="2" fill="#F29B20"/>`),
      maps: svg62('<rect width="62" height="62" fill="#EDEBE3"/><path d="M0 40 62 22v40H0z" fill="#CDE6C3"/><path d="M-2 18 64 46" stroke="#fff" stroke-width="6"/><path d="M20-2 34 64" stroke="#F7D66B" stroke-width="5"/><path d="M8 50c12-10 22-6 38-24" stroke="#3D8BFD" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="46" cy="26" r="5" fill="#E8423C" stroke="#fff" stroke-width="2"/>'),
      weather: svg62(grad('gwx', '#2e7be0', '#6fb2f2') + '<rect width="62" height="62" fill="url(#gwx)"/><circle cx="25" cy="24" r="10" fill="#FFD43B"/><path d="M20 44h24a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-3 13z" fill="#fff"/>'),
      notes: svg62('<rect width="62" height="62" fill="#fff"/><rect width="62" height="17" fill="#FFD33D"/><g stroke="#D9D9DE" stroke-width="1.5"><path d="M0 28h62M0 38h62M0 48h62"/></g>'),
      settings: svg62(grad('gset', '#A5A9B2', '#6E737D') + '<rect width="62" height="62" fill="url(#gset)"/><circle cx="31" cy="31" r="17" fill="none" stroke="#3E424A" stroke-width="7" stroke-dasharray="4.2 3.4"/><circle cx="31" cy="31" r="13" fill="#D8DBE0"/><circle cx="31" cy="31" r="5.5" fill="#6E737D"/>'),
      whatsapp: svg62(grad('gwa', '#45DB78', '#1BA551') + '<rect width="62" height="62" fill="url(#gwa)"/><path d="M31 14a16.5 16.5 0 0 0-14.3 24.8L14.5 47l8.4-2.2A16.5 16.5 0 1 0 31 14z" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/><circle cx="24.5" cy="31" r="2.1" fill="#fff"/><circle cx="31" cy="31" r="2.1" fill="#fff"/><circle cx="37.5" cy="31" r="2.1" fill="#fff"/>'),
      wallet: svg62('<rect width="62" height="62" fill="#111"/><rect x="11" y="16" width="40" height="10" rx="3" fill="#3FA2F7"/><rect x="11" y="22" width="40" height="10" rx="3" fill="#F5B83D"/><rect x="11" y="28" width="40" height="10" rx="3" fill="#43C471"/><rect x="11" y="34" width="40" height="14" rx="3" fill="#E9493F"/><path d="M11 40h14c2 3 10 3 12 0h14v6a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#2a2a2c"/>'),
      files: svg62('<rect width="62" height="62" fill="#fff"/><path d="M10 20a4 4 0 0 1 4-4h11l4 4h19a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#1E88F5"/><path d="M10 26h42v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#52A8FA"/>'),
      phone: svg62(grad('gph', '#5DE07A', '#23B544') + '<rect width="62" height="62" fill="url(#gph)"/><path d="M24.6 17.5c.9-.3 1.9.1 2.4.9l2.4 4.2c.5.9.3 2-.5 2.7l-2 1.6c1.2 2.6 3.3 4.9 5.9 6.3l1.7-1.9c.7-.8 1.8-1 2.7-.4l4.1 2.5c.8.5 1.2 1.5.9 2.4l-.8 2.6c-.4 1.3-1.6 2.2-3 2.1-9.2-.7-16.6-8.1-17.3-17.3-.1-1.4.8-2.6 2.1-3z" fill="#fff"/>'),
      safari: svg62('<rect width="62" height="62" fill="#fff"/><circle cx="31" cy="31" r="23" fill="#1E90F0"/><circle cx="31" cy="31" r="20" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="1 3.2"/><path d="M31 31 42 20 35 35z" fill="#F24B3F"/><path d="M31 31 20 42 27 27z" fill="#fff"/>'),
      messages: svg62(grad('gmsg', '#6BE07A', '#28BA3E') + '<rect width="62" height="62" fill="url(#gmsg)"/><ellipse cx="31" cy="29" rx="18" ry="15" fill="#fff"/><path d="M15.5 43c3-1 5-3 6-5.5l4.5 3c-3 2.2-6.5 3.2-10.5 2.5z" fill="#fff"/>'),
      mail: svg62(grad('gml', '#3FA4FA', '#1A6FE8') + '<rect width="62" height="62" fill="url(#gml)"/><rect x="12" y="19" width="38" height="25" rx="4" fill="#fff"/><path d="m13 21 18 13 18-13" fill="none" stroke="#2a7df0" stroke-width="2.4"/>'),
    };
  }
  function renderIOS() {
    const now = new Date(), g = iosIcons(now);
    const app = (name, key) => `<button class="ios-app" type="button" data-act="ios-app" data-name="${name}"><span class="ico">${g[key]}</span><span class="lbl">${name}</span></button>`;
    el.ios.innerHTML = `
      <div class="ios-widgets">
        <div class="wg"><div class="w w-weather"><div class="wc">Dubai</div><div class="wt">34°</div>
          <svg class="sun" width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#FFD43B"/><g stroke="#FFD43B" stroke-width="2" stroke-linecap="round"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>
          <div class="wd">Mostly sunny<span>H:41° L:31°</span></div></div><span class="lbl">Weather</span></div>
        <div class="wg"><div class="w w-cal"><div class="cd">${now.toLocaleDateString('en-US', { weekday: 'long' })}</div><div class="cn">${now.getDate()}</div>
          <div class="ev">Mum’s check-up<span>5:30 – 6:00 PM</span></div></div><span class="lbl">Calendar</span></div>
      </div>
      <div class="ios-grid">
        ${app('Calendar', 'calendar')}${app('Photos', 'photos')}${app('Camera', 'camera')}${app('Clock', 'clock')}
        ${app('Maps', 'maps')}${app('Weather', 'weather')}${app('Notes', 'notes')}${app('Settings', 'settings')}
        <button class="ios-app frh" id="frhIcon" type="button" data-act="launch" aria-label="Open FRH Health">
          ${S.tapped ? '' : '<span class="tap-hint">Tap to open</span><span class="ring"></span>'}
          <span class="ico">${appIcon(62)}</span><span class="lbl">FRH Health</span></button>
        ${app('WhatsApp', 'whatsapp')}${app('Wallet', 'wallet')}${app('Files', 'files')}
      </div>
      <div class="ios-search">${icon('search', 13, 2.4)}Search</div>
      <div class="ios-dock">${app('Phone', 'phone')}${app('Safari', 'safari')}${app('Messages', 'messages')}${app('Mail', 'mail')}</div>`;
  }

  /* FRH icon position inside the (unscaled, unzoomed) screen */
  function iconRect() {
    const b = $('#frhIcon'); let x = 0, y = 0, n = b;
    while (n && n !== el.screen) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: 62, h: 62 };
  }

  /* ---------- launch / close ---------- */
  function launch() {
    if (S.open || busy) return;
    busy = true; S.tapped = true;
    const r = iconRect(), L = el.launch;
    L.innerHTML = `<div class="lm">${mark('#fff', 96)}</div>`;
    L.style.transition = 'none';
    Object.assign(L.style, { display: 'block', opacity: '1', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: '14px' });
    void L.offsetWidth;
    const e = '.5s cubic-bezier(.32,.9,.3,1)';
    L.style.transition = `left ${e},top ${e},width ${e},height ${e},border-radius ${e},opacity .25s`;
    Object.assign(L.style, { left: '0px', top: '0px', width: '393px', height: '852px', borderRadius: '56px' });
    el.ios.classList.add('zoomed');
    setStatus('light');
    setTimeout(() => {
      S.open = true;
      el.app.classList.add('on');
      const resume = S.screen && S.screen !== 'splash';
      go(resume ? S.screen : 'splash', { dir: 'none' });
      setTimeout(() => { L.style.opacity = '0'; setTimeout(() => { L.style.display = 'none'; busy = false; }, 260); }, 40);
      renderIOS();
    }, 500);
  }
  function closeApp() {
    if (!S.open || busy) return;
    busy = true;
    hideKb(); closeSheet(true); hideBanner();
    el.ios.classList.remove('zoomed');
    const r = iconRect(), A = el.app;
    A.style.transformOrigin = `${r.x + r.w / 2}px ${r.y + r.h / 2}px`;
    A.style.transition = 'transform .45s cubic-bezier(.3,.9,.3,1), opacity .3s ease .12s, border-radius .45s';
    A.style.borderRadius = '56px';
    A.style.transform = `scale(${r.w / 393})`;
    A.style.opacity = '0';
    setStatus('light');
    setTimeout(() => {
      S.open = false;
      A.classList.remove('on'); A.style.cssText = ''; A.innerHTML = '';
      busy = false; sync();
    }, 470);
  }
  function openInstant() {
    if (S.open) return;
    S.open = true; S.tapped = true;
    el.ios.classList.add('zoomed'); el.app.classList.add('on');
    el.launch.style.display = 'none';
    renderIOS();
  }

  /* ---------- navigation ---------- */
  function go(id, o = {}) {
    const def = FRH.SCREENS[id];
    if (!def) return;
    const dir = o.dir || 'fwd';
    if (dir === 'fwd' && S.screen && S.screen !== id) hist.push(S.screen);
    const old = cur();
    const node = document.createElement('div');
    node.className = `scr cur ${def.cls || id}`;
    node.dataset.id = id;
    S.screen = id;
    node.innerHTML = def.render();
    el.app.appendChild(node);
    closeSheet(true);
    setStatus(def.status || 'dark');
    if (old) {
      old.classList.remove('cur');
      const [a, b] = { fwd: ['in-r', 'out-l'], back: ['in-l', 'out-r'], fade: ['in-f', 'out-f'], none: [null, null] }[dir] || ['in-r', 'out-l'];
      if (a) { node.classList.add(a); setTimeout(() => node.classList.remove(a), 480); }
      if (b) { old.classList.add(b); setTimeout(() => old.remove(), 460); } else old.remove();
    }
    el.app.querySelectorAll('.scr:not(.cur):not(.out-l):not(.out-r):not(.out-f)').forEach(n => n.remove());
    const k = typeof def.kb === 'function' ? def.kb() : def.kb;
    if (k) showKb(k, def.focus); else { hideKb(); S.focus = null; }
    if (def.mount) def.mount(node);
    if (def.update) def.update(node);
    sync();
  }
  function upd() {
    const def = FRH.SCREENS[S.screen], node = cur();
    if (def && def.update && node) def.update(node);
    renderSug();
    sync();
  }
  const sync = () => FRH.panel && FRH.panel.sync();

  /* ---------- keyboard ---------- */
  const BKSP = icon('backspace', 24, 1.6), SHIFT = icon('shift', 20, 1.8);
  let curSug = null;
  function suggestion() {
    switch (S.focus) {
      case 'phone':
        return S.phone ? null : { html: `<small>Your number</small><b>+971 ${fmtPhone(DEMO.phone, COUNTRIES[0])}</b>`, act: () => { S.country = COUNTRIES[0]; S.phone = DEMO.phone; S.phoneErr = ''; upd(); } };
      case 'otp': {
        const c = activeCode();
        return c && c.channel === 'sms' && !isExpired(c) && S.otp.length < 4 && S.otpState !== 'verifying'
          ? { html: `<small>From Messages</small><b>${c.code}</b>`, act: () => fillCode(c) } : null;
      }
      case 'name': return S.name ? null : { html: `<b style="letter-spacing:0">${DEMO.name}</b>`, act: () => { S.name = DEMO.name; S.shift = false; upd(); } };
      case 'email': return S.email ? null : { html: `<b style="letter-spacing:0">${DEMO.email}</b>`, act: () => { S.email = DEMO.email; S.emailErr = ''; upd(); } };
    }
    return null;
  }
  function renderSug() {
    const box = el.kb.querySelector('.kb-sug');
    if (!box) return;
    curSug = S.kb ? suggestion() : null;
    box.innerHTML = curSug ? `<button type="button" data-act="suggest">${curSug.html}</button>` : '';
  }
  function renderKb() {
    if (S.kb === 'num') {
      const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
      el.kb.innerHTML = `<div class="kb-sug"></div><div class="kb-num">${keys.map(([n, l]) => `<button type="button" class="k" data-key="${n}">${n}<small>${l || '&nbsp;'}</small></button>`).join('')}<span class="k blank"></span><button type="button" class="k" data-key="0">0<small>&nbsp;</small></button><button type="button" class="k fn" data-key="del" aria-label="Delete">${BKSP}</button></div>`;
    } else if (S.kb === 'qwerty') {
      const rows = S.sym
        ? [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['-', '/', ':', ';', '(', ')', '&', '@', '"'], ['.', ',', '?', '!', "'", '_', '+']]
        : [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']];
      const up = S.shift && !S.sym && S.focus !== 'email' && !(FRH.KB_LOWER && FRH.KB_LOWER[S.focus]);
      const row = r => r.map(ch => `<button type="button" class="kq" data-key="${esc(ch)}">${esc(up ? ch.toUpperCase() : ch)}</button>`).join('');
      const email = S.focus === 'email';
      el.kb.innerHTML = `<div class="kb-sug"></div><div class="kb-q">
        <div class="kb-row">${row(rows[0])}</div>
        <div class="kb-row">${row(rows[1])}</div>
        <div class="kb-row"><button type="button" class="kq fn ${up ? 'on' : ''}" data-key="shift" aria-label="Shift">${S.sym ? '<span style="font-size:13px">#+=</span>' : SHIFT}</button>${row(rows[2])}<button type="button" class="kq fn" data-key="del" aria-label="Delete">${BKSP}</button></div>
        <div class="kb-row"><button type="button" class="kq fn" data-key="sym">${S.sym ? 'ABC' : '123'}</button>${email ? '<button type="button" class="kq sym" data-key="@">@</button>' : ''}<button type="button" class="kq space" data-key=" ">space</button>${email ? '<button type="button" class="kq sym" data-key=".">.</button>' : ''}<button type="button" class="kq fn ret${FRH.KB_RET && FRH.KB_RET[S.focus] ? ' go' : ''}" data-key="enter">${(FRH.KB_RET && FRH.KB_RET[S.focus]) || (email ? 'done' : 'next')}</button></div>
      </div><div class="kb-foot">${icon('globe', 24, 1.5)}${icon('mic', 24, 1.5)}</div>`;
    }
    renderSug();
  }
  function showKb(type, focus) {
    S.kb = type;
    if (focus) S.focus = focus;
    renderKb();
    if (!S.sheet || sheetKb()) el.kb.classList.add('show');
    el.app.style.setProperty('--kb', el.kb.offsetHeight + 'px');
  }
  function hideKb() {
    S.kb = null;
    el.kb.classList.remove('show');
    el.app.style.setProperty('--kb', '0px');
  }
  /* The keypad belongs to screens that declare one (phone, code) or to a focused text
     field. Anything else showing it is a bug — this guard hides it whatever the cause. */
  /* a sheet listed in FRH.SHEET_KB may show the keyboard above it (Final v8: the cart's health note) */
  function sheetKb(k) { const v = FRH.SHEET_KB && FRH.SHEET_KB[k || S.sheet]; return typeof v === 'function' ? !!v() : !!v; }
  function kbAllowed() {
    if (!S.open || (S.sheet && !sheetKb())) return false;
    const def = FRH.SCREENS[S.screen];
    const k = def && (typeof def.kb === 'function' ? def.kb() : def.kb);
    return !!k || (S.kb === 'qwerty' && !!S.focus);
  }
  new MutationObserver(() => {
    if (el.kb.classList.contains('show') && !kbAllowed()) { hideKb(); if (!FRH.SCREENS[S.screen] || !FRH.SCREENS[S.screen].kb) S.focus = null; }
  }).observe(el.kb, { attributes: true, attributeFilter: ['class'] });
  function pressVisual(k) {
    const b = [...el.kb.querySelectorAll('[data-key]')].find(n => n.dataset.key.toLowerCase() === String(k).toLowerCase());
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 110);
  }

  function onKey(k, physical) {
    const f = S.focus;
    if (!f || !S.open || (S.sheet && !sheetKb()) || !S.kb) return;
    if (f === 'phone') {
      if (S.sending) return;
      if (/^\d$/.test(k)) { if (S.phone.length < S.country.len[1]) S.phone += k; }
      else if (k === 'del') S.phone = S.phone.slice(0, -1);
      else if (k === 'enter') return FRH.ACT.send();
      else return;
      S.phoneErr = ''; upd(); return;
    }
    if (f === 'otp') {
      if (S.otpState === 'verifying' || S.otpState === 'ok' || S.otpState === 'expired') return;
      if (/^\d$/.test(k)) { if (S.otp.length < 4) S.otp += k; }
      else if (k === 'del') S.otp = S.otp.slice(0, -1);
      else return;
      if (S.otpState === 'wrong') S.otpState = 'idle';
      upd();
      if (S.otp.length === 4 && S.otpState !== 'expired') verify();
      return;
    }
    /* Any other text field: a screen registers FRH.KEYS[focus] = (key, physical) => {} and
       declares kb:'qwerty' + focus, or calls FRH.showKb('qwerty', focus). Shift/123 are handled here. */
    if (FRH.KEYS && FRH.KEYS[f]) {
      if (k === 'shift') { if (!S.sym) S.shift = !S.shift; renderKb(); return; }
      if (k === 'sym') { S.sym = !S.sym; renderKb(); return; }
      let ch = k;
      if (k.length === 1 && !physical && S.shift && /[a-z]/.test(ch)) { ch = ch.toUpperCase(); S.shift = false; renderKb(); }
      FRH.KEYS[f](ch, physical);
      return;
    }
    if (f === 'name' || f === 'email') {
      let v = S[f];
      if (k === 'del') v = v.slice(0, -1);
      else if (k === 'shift') { if (!S.sym) S.shift = !S.shift; renderKb(); return; }
      else if (k === 'sym') { S.sym = !S.sym; renderKb(); return; }
      else if (k === 'enter') { if (f === 'name') FRH.focusField('email'); else FRH.focusField(null); return; }
      else if (k.length === 1) {
        let ch = k;
        if (f === 'email') ch = ch.toLowerCase();
        else if (!physical && S.shift && /[a-z]/.test(ch)) ch = ch.toUpperCase();
        v += ch;
      } else return;
      S[f] = v.slice(0, 44);
      if (f === 'name') { const was = S.shift; S.shift = S.name.length === 0 || S.name.endsWith(' '); if (was !== S.shift) renderKb(); }
      if (f === 'email') S.emailErr = '';
      upd();
    }
  }

  /* ---------- banner, toast, sheets ---------- */
  let bannerT, toastT;
  function msgText(c) {
    return c.channel === 'wa'
      ? `<strong>${c.code}</strong> is your verification code. For your security, do not share this code.`
      : `<strong>${c.code}</strong> is your FRH Healthcare code. It expires in 5 minutes. Never share it — FRH will never ask for it.`;
  }
  function showBanner(c) {
    const wa = c.channel === 'wa';
    el.banner.innerHTML = `<div class="bn-ic ${wa ? 'wa' : 'sms'}">${icon(wa ? 'chat' : 'sms', 21, 2.2)}</div>
      <div class="bn-main"><div class="bn-top">${wa ? 'FRH Healthcare' : 'FRH'}<span>${wa ? 'WhatsApp · now' : 'now'}</span></div>
      <div class="bn-txt">${msgText(c)}</div>${S.screen === 'otp' ? `<div class="bn-hint">${icon('sparkle', 13, 2.2)}Tap to fill the code</div>` : ''}</div>`;
    el.banner.dataset.code = c.id;
    el.banner.classList.add('show');
    clearTimeout(bannerT);
    bannerT = setTimeout(hideBanner, 6500);
  }
  function hideBanner() { el.banner.classList.remove('show'); }
  function toast(msg, ic = 'check') {
    el.toast.innerHTML = `${icon(ic, 18, 2.2)}<span>${msg}</span>`;
    el.toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.toast.classList.remove('show'), 2800);
  }
  function openSheet(kind) {
    S.sheet = kind;
    el.sheet.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>${FRH.SHEETS[kind]()}`;
    void el.sheet.offsetWidth;
    el.sheet.classList.add('on');
    if (!sheetKb(kind)) el.kb.classList.remove('show');
    hideBanner();
    sync();
  }
  function closeSheet(instant) {
    if (!S.sheet) return;
    S.sheet = null;
    el.sheet.classList.remove('on');
    if (instant) el.sheet.innerHTML = '';
    else setTimeout(() => { if (!S.sheet) el.sheet.innerHTML = ''; }, 460);
    if (S.kb && kbAllowed()) el.kb.classList.add('show');
    sync();
  }
  function shake(sel) {
    const n = (cur() && cur().querySelector(sel)) || el.sheet.querySelector(sel);
    if (!n) return;
    n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake');
  }

  /* ---------- OTP engine ---------- */
  function issueCode() {
    S.codes.forEach(c => { if (c.status === 'active' || c.status === 'pending') c.status = 'replaced'; });
    const c = { id: Date.now() + Math.floor(Math.random() * 999), code: genCode(), channel: S.channel, to: fullPhone(), sentAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000, status: 'pending' };
    S.codes.push(c);
    S.otp = ''; S.otpState = 'idle'; S.wasOld = false;
    S.resendAt = Date.now() + 30 * 1000;
    sync();
    setTimeout(() => deliver(c), 1500 + Math.random() * 900);
    return c;
  }
  function deliver(c, quiet) {
    if (c.status !== 'pending') return;
    c.status = 'active'; c.deliveredAt = Date.now();
    if (FRH.panel) FRH.panel.arrived(c);
    if (S.open && !quiet) showBanner(c);
    upd();
  }
  function fillCode(c) {
    if (!S.open || S.screen !== 'otp') { toast('Open the code screen in the app first', 'alert'); return false; }
    if (S.otpState === 'verifying' || S.otpState === 'ok') return false;
    hideBanner();
    S.otp = c.code; S.otpState = 'idle'; upd();
    setTimeout(verify, 280);
    return true;
  }
  function verify() {
    if (S.otpState === 'verifying' || S.otp.length !== 4) return;
    S.otpState = 'verifying'; upd();
    setTimeout(() => {
      if (S.screen !== 'otp' || S.otpState !== 'verifying') return;
      if (!S.online) { S.otpState = 'idle'; upd(); S.pending = 'verify'; openSheet('offline'); return; }
      const c = activeCode();
      if (c && S.otp === c.code) {
        if (isExpired(c)) { c.status = 'expired'; S.otpState = 'expired'; S.otp = ''; upd(); return; }
        c.status = 'used'; S.otpState = 'ok'; S.attempts = 0; hideBanner(); upd();
        setTimeout(() => {
          if (!S.open || S.screen !== 'otp') return;
          if (S.patient === 'returning') {
            if (!S.name) S.name = DEMO.name;
            S.guest = false; go('home', { dir: 'fade' });
            setTimeout(() => toast(`Welcome back, ${firstName()}`, 'check'), 500);
          } else go('profile');
        }, 700);
        return;
      }
      S.attempts++;
      S.wasOld = S.codes.some(x => x.status === 'replaced' && x.code === S.otp);
      if (S.attempts >= S.maxAttempts) { lockout(); return; }
      S.otpState = 'wrong'; upd(); shake('.otp-row');
      setTimeout(() => { if (S.otpState === 'wrong') { S.otp = ''; upd(); } }, 900);
    }, 950);
  }
  function lockout() {
    S.lockUntil = Date.now() + 15 * 60 * 1000;
    S.lockedPhone = S.country.d + S.phone;
    S.otp = ''; S.otpState = 'idle'; S.attempts = S.maxAttempts;
    S.codes.forEach(c => { if (c.status === 'active' || c.status === 'pending') c.status = 'void'; });
    hideBanner();
    go('locked', { dir: 'fade' });
  }

  /* ---------- reset ---------- */
  function reset() {
    hist = [];
    closeSheet(true); hideBanner(); hideKb();
    Object.assign(S, FRESH());
    el.app.classList.remove('on'); el.app.innerHTML = ''; el.app.style.cssText = '';
    el.launch.style.display = 'none';
    el.ios.classList.remove('zoomed');
    busy = false;
    renderIOS(); setStatus('light');
    if (FRH.panel) FRH.panel.reset();
    sync();
  }

  /* ---------- input wiring ---------- */
  el.screen.addEventListener('click', e => {
    const key = e.target.closest('[data-key]');
    if (key && el.kb.contains(key)) { onKey(key.dataset.key); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'suggest') { if (curSug) curSug.act(); return; }
    const fn = FRH.ACT[a.dataset.act];
    if (fn) fn(a, e);
  });
  el.banner.addEventListener('click', () => {
    const c = S.codes.find(x => String(x.id) === el.banner.dataset.code);
    hideBanner();
    if (c) fillCode(c);
  });
  el.home.addEventListener('click', () => closeApp());
  document.addEventListener('keydown', e => {
    if (!S.open || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') { if (S.sheet) closeSheet(); return; }
    if (!S.focus || !S.kb || (S.sheet && !sheetKb())) return;
    let k = null;
    if (e.key === 'Backspace') k = 'del';
    else if (e.key === 'Enter') k = 'enter';
    else if (e.key === 'Tab' && S.focus === 'name') { e.preventDefault(); FRH.focusField('email'); return; }
    else if (e.key.length === 1) k = e.key;
    if (k === null) return;
    if ((S.focus === 'phone' || S.focus === 'otp') && !/^\d$/.test(k) && k !== 'del' && k !== 'enter') return;
    e.preventDefault();
    pressVisual(k);
    onKey(k, true);
  });
  document.addEventListener('paste', e => {
    if (!S.open || !S.focus) return;
    const txt = (e.clipboardData || window.clipboardData).getData('text') || '';
    if (S.focus === 'otp') {
      const d = txt.replace(/\D/g, '').slice(0, 4);
      if (!d) return;
      e.preventDefault();
      S.otp = d; S.otpState = 'idle'; upd();
      if (d.length === 4) verify();
    } else if (S.focus === 'phone') {
      let d = txt.replace(/\D/g, '');
      if (d.startsWith(S.country.d) && d.length > S.country.len[1]) d = d.slice(S.country.d.length);
      if (d.startsWith('0')) d = d.slice(1);
      e.preventDefault();
      S.phone = d.slice(0, S.country.len[1]); S.phoneErr = ''; upd();
    } else if (S.focus === 'name' || S.focus === 'email') {
      e.preventDefault();
      S[S.focus] = (S[S.focus] + txt.trim()).slice(0, 44); upd();
    }
  });

  /* ---------- clock ---------- */
  setInterval(() => {
    renderStatus();
    if (S.open && FRH.SCREENS[S.screen] && FRH.SCREENS[S.screen].tick) FRH.SCREENS[S.screen].tick(cur());
    if (FRH.panel) FRH.panel.tick();
  }, 1000);

  function boot() {
    $('#tbIcon').innerHTML = appIcon(28);
    const rb = $('#restartBtn');
    rb.innerHTML = icon('refresh', 16, 2) + '<span>Restart</span>';
    rb.addEventListener('click', reset);
    renderIOS(); renderStatus(); setStatus('light'); fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    sync();
  }

  const back = fb => { const prev = hist.pop(); go(prev || fb || 'home', { dir: 'back' }); };
  Object.assign(FRH, {
    go, back, upd, sync, launch, closeApp, openInstant, reset, boot, showKb, hideKb, renderKb,
    toast, openSheet, closeSheet, shake, showBanner, hideBanner, msgText,
    issueCode, deliver, fillCode, verify, lockout, setStatus, renderIOS,
    get scale() { return scale; },
  });
})();
