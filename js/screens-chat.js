/* FRH prototype — flow 7: HealthAssist chat (landing + conversation).
   Flow 9: search, maintenance and coming-soon states. */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, B = window.FRHBOOK, C = window.FRHCHAT;
  const img = n => `assets/img/${n}`;
  const soon = m => `data-act="soon" data-msg="${m}"`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const num = n => Number(n).toLocaleString('en-US');

  const SPEC = k => C.specialists.find(s => s.key === k) || C.specialists[0];
  const THREAD = k => C.threads[k] || C.threads.doctor;
  const ALL = () => [...D.appointments.upcoming, ...D.appointments.completed, ...D.appointments.cancelled];

  /* The prototype runs on a fixed clock so screenshots stay consistent:
     the conversation starts at 5:02 PM and each turn adds a minute. */
  const BASE = 17 * 60 + 3;
  const clock = m => {
    const t = BASE + m, h = Math.floor(t / 60) % 24, mm = t % 60;
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  /* ================= 7.1 HealthAssist landing ================= */
  const specCard = s => `<button class="c-spec" type="button" data-act="c-open" data-k="${s.key}">
      <span class="tile">${icon(s.icon, 20, 1.9)}</span>
      <span class="c-sp-mid"><b>${s.title}</b><small>${s.desc}</small>
        <span class="c-eta">${icon('clock', 12, 2.4)} ${s.eta}</span></span>
      <span class="c-av"><img src="${img(s.img)}" alt=""><i></i></span>
    </button>`;

  const recRow = r => {
    const s = SPEC(r.who);
    return `<button class="c-rec" type="button" data-act="c-open" data-k="${r.who}" data-b="${r.booking}">
      <span class="c-av"><img src="${img(s.img)}" alt=""><i></i></span>
      <span class="c-rc-mid"><b>${s.name}</b>
        <span class="c-link ${r.booking ? '' : 'off'}">${r.booking ? `${icon('calendar', 11, 2.6)} ${r.booking} · ${s.title}` : `${s.title} · general chat`}</span>
        <span class="c-prev ${r.unread ? 'on' : ''}">${r.last}</span></span>
      <span class="c-right"><span class="c-when">${r.when}</span>
        ${r.unread ? `<span class="c-unread">${r.unread}</span>` : `<span class="c-read">${icon('check', 14, 2.6)}</span>`}</span>
    </button>`;
  };

  F.SCREENS['chat-home'] = {
    status: 'dark', cls: 'c-hub',
    render() {
      const h = C.home;
      return `<div class="nav">
          <button class="nav-btn" type="button" data-act="c-home-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="nav-title">HealthAssist</span>
          <button class="icon-btn" type="button" ${soon('Chat settings and history are to be confirmed with FRH')} aria-label="More">${icon('dots', 19, 1.9)}</button>
        </div>
        <div class="scr-body">
          <h1 class="c-hi">${h.title}</h1>
          <p class="lead">${h.lead}</p>
          <div class="sec-h" style="margin:22px 0 10px"><h4>${h.pick}</h4><span class="pill green live"><i></i>Team online</span></div>
          ${C.specialists.map(specCard).join('')}
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${h.note}</span></div>
          <div class="sec-h" style="margin:24px 0 10px"><h4>${h.recent}</h4>
            <button class="link" type="button" ${soon('The full chat archive is to be confirmed with FRH')}>See all</button></div>
          ${C.recent.length ? C.recent.map(recRow).join('')
            : `<div class="empty-state"><div class="es-ic">${icon('chat', 28, 1.8)}</div><b>No conversations yet</b><span>${h.empty}</span></div>`}
        </div>
        ${F.tabbar('chat')}`;
    },
  };

  /* ================= 7.2 the conversation ================= */
  const TICK = `<svg class="c-tick" viewBox="0 0 17 11" width="15" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6.2 4 9.2 9.4 1.9"/><path d="m7.7 9.2 5.6-7.3"/></svg>`;
  const TYPING = '<div class="c-typing"><i></i><i></i><i></i></div>';

  const bubble = m => m.from === 'sys'
    ? `<div class="c-sys">${icon('shieldCheck', 13, 2.2)}<span>${m.t}</span></div>`
    : `<div class="c-msg ${m.from}">${m.t}<span class="c-time">${m.at}${m.from === 'me' ? TICK : ''}</span></div>`;

  function ctxCard(id) {
    const a = ALL().find(x => x.id === id);
    const line = a ? `${a.service} · ${a.date}, ${a.time}` : 'Doctor on Call · Today, 5:30 – 6:15 PM';
    return `<div class="c-ctx"><span class="tile">${icon('calendar', 16, 2)}</span>
        <div class="c-ctx-mid"><b>${C.chat.ctx} ${id}</b><small>${line}</small></div>
        <button class="mini-btn ghost" type="button" data-act="appt-open" data-id="${id}">${C.chat.ctxCta}</button></div>`;
  }

  /* seed a thread; also used when the panel jumps straight to the chat */
  function openThread(k, bookingId) {
    const t = THREAD(k);
    S.cWho = k;
    S.cBooking = bookingId || '';
    S.cMin = 0;
    S.cTyping = false;
    S.cMsgs = [{ from: 'sys', t: C.chat.sys }].concat(t.seed.map(m => Object.assign({}, m)));
    S.cChips = t.start;
  }
  /* a thread the patient opens first — no bot greeting, nothing said yet */
  function openDirect(k, bookingId) {
    const t = THREAD(k);
    S.cWho = k; S.cBooking = bookingId || ''; S.cMin = 0; S.cTyping = false;
    S.cMsgs = []; S.cChips = t.start;
  }
  F.openDirectChat = openDirect;
  const ensure = () => { if (!S.cMsgs) openThread('doctor', C.recent[0].booking); };
  const emptyThread = () => {
    const s = SPEC(S.cWho);
    return `<div class="c-new">
        <span class="c-new-av"><img src="${img(s.img)}" alt=""><i></i></span>
        <b>${s.name}</b><span>${s.role}</span>
        <p>${C.chat.newIntro}</p>
        <div class="flag-note">${icon('alert', 14, 2.2)}<span>${C.chat.newSafety}</span></div>
        <small class="c-new-hint">${C.chat.newHint}</small>
      </div>`;
  };

  const scrollEnd = n => { const b = (n || F.cur() || document).querySelector('.scr-body'); if (b) b.scrollTop = b.scrollHeight; };

  F.SCREENS.chat = {
    status: 'dark', cls: 'c-chat',
    render() {
      ensure();
      const s = SPEC(S.cWho);
      return `<div class="nav c-nav">
          <button class="nav-btn" type="button" data-act="c-chats" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <span class="c-who"><span class="c-av"><img src="${img(s.img)}" alt=""><i></i></span>
            <span class="c-who-t"><b>${s.name}</b><small class="c-status"></small></span></span>
          <button class="icon-btn" type="button" data-act="soon" data-msg="${C.chat.callToast}" aria-label="Call">${icon('phone', 18, 1.9)}</button>
        </div>
        <div class="scr-body">
          ${S.cBooking ? ctxCard(S.cBooking) : ''}
          <div class="c-list"></div>
        </div>
        <div class="scr-foot c-foot">
          <div class="c-chips"></div>
          <div class="c-bar">
            <button class="c-attach" type="button" data-act="c-attach" aria-label="Attach">${icon('plus', 19, 2.2)}</button>
            <button class="c-field" type="button" data-act="c-say">${C.chat.input}<span class="caret"></span></button>
            <button class="c-send" type="button" data-act="c-say" aria-label="Send">${icon('nav', 18, 2)}</button>
          </div>
        </div>`;
    },
    update(n) {
      setHTML(n.querySelector('.c-list'), S.cMsgs.length
        ? `<div class="c-day">${C.chat.day}</div>${S.cMsgs.map(bubble).join('')}${S.cTyping ? TYPING : ''}`
        : emptyThread());
      setHTML(n.querySelector('.c-chips'), S.cTyping ? ''
        : (S.cChips || []).map(c => `<button class="c-chip" type="button" data-act="c-chip" data-to="${c.to}">${c.t}</button>`).join(''));
      setHTML(n.querySelector('.c-status'), S.cTyping
        ? `<em>${C.chat.typing}</em>` : `<i class="c-dot"></i>${C.chat.online}`);
      scrollEnd(n);
    },
    mount(n) { scrollEnd(n); },
  };

  /* ================= 9.3 search ================= */
  const TOK = q => String(q).toLowerCase().split(/[^a-z0-9+]+/i).filter(w => w.length > 1);
  const hit = (txt, ts) => { const s = String(txt).toLowerCase(); return ts.some(w => s.includes(w)); };

  function results(q) {
    const ts = TOK(q), subs = [];
    if (!ts.length) return { cats: [], subs: [] };
    const cats = B.categories.filter(c => hit(c.name, ts));
    Object.keys(B.subcats || {}).forEach(k => {
      const cat = B.categories.find(c => c.key === k) || { name: k, icon: 'stetho' };
      (B.subcats[k] || []).forEach(s => { if (hit(`${s.name} ${s.lab || ''} ${cat.name}`, ts)) subs.push({ s, cat }); });
    });
    return { cats, subs };
  }

  const resRow = (ic, name, cat, price, act) => `<button class="info-row c-res" type="button" ${act}>
      <span class="tile">${icon(ic, 17, 2)}</span>
      <span class="ir-mid"><b>${name}</b><small>${cat}</small></span>
      <span class="price">${price ? `<small>from AED</small>${num(price)}` : C.search.ambulance}</span>
    </button>`;

  const group = (title, n, rows) => `<div class="sec-h" style="margin:20px 0 8px"><h4>${title}</h4><span class="pill ink">${n}</span></div>
      <div class="info-card" style="margin-top:0">${rows}</div>`;

  const recentChips = () => `<div class="sec-h" style="margin:18px 0 10px"><h4>${C.search.recent}</h4></div>
      <div class="c-chip-wrap">${C.search.recentList.map(q =>
        `<button class="c-schip" type="button" data-act="c-q" data-q="${F.esc(q)}">${icon('clock', 13, 2.2)} ${q}</button>`).join('')}</div>`;

  function emptyHTML() {
    const pop = C.search.popularList.map(k => B.categories.find(c => c.key === k)).filter(Boolean);
    return `${recentChips()}
      <div class="sec-h" style="margin:24px 0 8px"><h4>${C.search.popular}</h4></div>
      <div class="info-card" style="margin-top:0">${pop.map(c =>
        resRow(c.icon, c.name, C.search.service + (c.badge ? ` · ${c.badge}` : ''), c.from, `data-act="c-q" data-q="${F.esc(c.name)}"`)).join('')}</div>
      <div class="flag-note">${icon('alert', 14, 2.2)}<span>${C.search.note}</span></div>`;
  }

  function resultsHTML(q) {
    const r = results(q), open = n => `data-act="c-open-res" data-n="${F.esc(n)}"`;
    if (!r.cats.length && !r.subs.length) {
      return `<div class="empty-state"><div class="es-ic">${icon('search', 28, 1.8)}</div>
          <b>${C.search.noneTitle}</b><span>${C.search.noneLine}</span></div>${recentChips()}`;
    }
    return `${r.cats.length ? group(C.search.groups.cat, r.cats.length,
        r.cats.map(c => resRow(c.icon, c.name, C.search.service + (c.badge ? ` · ${c.badge}` : ''), c.from, open(c.name))).join('')) : ''}
      ${r.subs.length ? group(C.search.groups.sub, r.subs.length,
        r.subs.map(x => resRow(x.cat.icon, x.s.name, x.cat.name, x.s.price, open(x.s.name))).join('')) : ''}
      <div class="flag-note">${icon('alert', 14, 2.2)}<span>${C.search.note}</span></div>`;
  }

  F.SCREENS.search = {
    status: 'dark', cls: 'c-search',
    render() {
      return `<div class="nav c-snav">
          <button class="nav-btn" type="button" data-act="c-home-back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
          <div class="c-sfield"><span class="c-sic">${icon('search', 17, 2.2)}</span>
            <button class="c-qbtn" type="button" data-act="c-stype"><span class="c-q"></span><span class="caret"></span></button>
            <span class="c-clear-wrap"></span></div>
        </div>
        <div class="scr-body"><div class="c-sres"></div></div>`;
    },
    update(n) {
      const q = S.cQuery || '';
      setHTML(n.querySelector('.c-q'), q ? F.esc(q) : `<span class="c-sph">${C.search.placeholder}</span>`);
      setHTML(n.querySelector('.c-clear-wrap'), q
        ? `<button class="c-clear" type="button" data-act="c-clear" aria-label="Clear search">${icon('x', 13, 2.6)}</button>` : '');
      setHTML(n.querySelector('.c-sres'), q ? resultsHTML(q) : emptyHTML());
    },
    mount() { S.cQuery = ''; },
  };

  /* ================= 9.1 / 9.2 full-screen states ================= */
  const MAINT = `<svg viewBox="0 0 260 160" aria-hidden="true">
      <circle cx="130" cy="82" r="62" fill="#FFF4F3"/>
      <rect x="48" y="132" width="164" height="7" rx="3.5" fill="#F3E4E1"/>
      <rect x="94" y="74" width="72" height="58" rx="13" fill="#fff" stroke="#EEE3E1" stroke-width="2"/>
      <path d="M84 78 130 40l46 38" fill="none" stroke="#D71F32" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="125.8" y="88" width="8.4" height="28" rx="4.2" fill="#FFB0A8"/>
      <rect x="116" y="97.8" width="28" height="8.4" rx="4.2" fill="#FFB0A8"/>
      <circle cx="190" cy="110" r="24" fill="#FFE4E1"/>
      <circle cx="190" cy="110" r="17.5" fill="none" stroke="#D71F32" stroke-width="6.5" stroke-dasharray="6 7.74"/>
      <circle cx="190" cy="110" r="13" fill="none" stroke="#D71F32" stroke-width="4.5"/>
      <circle cx="190" cy="110" r="5.5" fill="#FFF4F3" stroke="#D71F32" stroke-width="2.4"/>
      <circle cx="70" cy="106" r="16" fill="#F6ECE9"/>
      <circle cx="70" cy="106" r="11.5" fill="none" stroke="#D3BCB8" stroke-width="4.5" stroke-dasharray="4.5 7.54"/>
      <circle cx="70" cy="106" r="8" fill="none" stroke="#D3BCB8" stroke-width="3"/>
      <circle cx="70" cy="106" r="3.2" fill="#FFFAF8"/>
      <circle cx="212" cy="52" r="5" fill="#FFC9C4"/>
      <circle cx="56" cy="62" r="3.5" fill="#EAD9D5"/>
    </svg>`;

  const SOON = `<svg viewBox="0 0 260 160" aria-hidden="true">
      <circle cx="130" cy="78" r="60" fill="#FFF4F3"/>
      <path d="M26 128C62 120 70 72 108 76" fill="none" stroke="#FFC9C4" stroke-width="3" stroke-dasharray="5 8" stroke-linecap="round"/>
      <rect x="186" y="80" width="26" height="56" rx="7" fill="#EFE0DC"/>
      <rect x="152" y="98" width="28" height="38" rx="7" fill="#F3E4E1"/>
      <rect x="46" y="108" width="28" height="28" rx="7" fill="#F3E4E1"/>
      <rect x="80" y="118" width="22" height="18" rx="6" fill="#EFE0DC"/>
      <rect x="34" y="134" width="192" height="7" rx="3.5" fill="#F3E4E1"/>
      <path d="M130 30c-14.4 0-26 11.6-26 26 0 19 26 44 26 44s26-25 26-44c0-14.4-11.6-26-26-26z" fill="#D71F32"/>
      <circle cx="130" cy="56" r="11.5" fill="#FFF4F3"/>
      <rect x="127.9" y="49.6" width="4.2" height="12.8" rx="2.1" fill="#D71F32"/>
      <rect x="123.6" y="53.9" width="12.8" height="4.2" rx="2.1" fill="#D71F32"/>
      <path d="m200 40 2.8 6.8 6.8 2.8-6.8 2.8-2.8 6.8-2.8-6.8-6.8-2.8 6.8-2.8z" fill="#FFC9C4"/>
      <circle cx="62" cy="56" r="4.5" fill="#FFC9C4"/>
    </svg>`;

  F.SCREENS.maintenance = {
    status: 'dark', cls: 'c-state',
    render() {
      const m = C.maintenance;
      return `<button class="nav-btn c-back-float" type="button" data-act="go-home" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
        <div class="scr-body">
          <div class="c-ill">${MAINT}</div>
          <h1 class="h1">${m.title}</h1>
          <p class="lead">${m.body}</p>
          <div class="c-line">${icon('clock', 15, 2.2)}<span>${m.eta}</span></div>
          <p class="c-help">${m.help}</p>
        </div>
        <div class="scr-foot"><div class="stack">
          <button class="btn btn-primary" type="button" data-act="c-retry">${icon('refresh', 18, 2.2)} ${m.cta}</button>
          <button class="btn btn-ghost" type="button" data-act="c-home-back">Back to home</button></div></div>`;
    },
  };

  F.SCREENS['coming-soon'] = {
    status: 'dark', cls: 'c-state',
    render() {
      const m = C.comingSoon;
      return `<button class="nav-btn c-back-float" type="button" data-act="go-home" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
        <div class="scr-body">
          <div class="c-ill">${SOON}</div>
          <span class="pill red" style="margin:18px 0 -4px">Not in your area yet</span>
          <h1 class="h1">${m.title}</h1>
          <p class="lead">${m.body}</p>
          <div class="c-line">${icon('pin', 15, 2.2)}<span>${m.eta}</span></div>
          <p class="c-help">${m.alt}</p>
        </div>
        <div class="scr-foot"><div class="stack">
          <button class="btn btn-primary" type="button" data-act="c-notify">${icon('bell', 18, 2.2)} ${m.cta}</button>
          <button class="btn btn-ghost" type="button" data-act="c-home-back">Back to home</button></div></div>`;
    },
  };

  /* ================= actions ================= */
  Object.assign(F.ACT, {
    'c-home-back': () => F.go('home', { dir: 'back' }),
    'c-chats': () => F.go('chat-home', { dir: 'back' }),
    'c-open': n => { openThread(n.dataset.k, n.dataset.b); F.go('chat'); },
    'c-chip': n => {
      if (S.cTyping) return;
      const t = THREAD(S.cWho), node = (t.nodes || {})[n.dataset.to];
      if (!node) return;
      S.cMin += 1;
      S.cMsgs.push({ from: 'me', t: node.me, at: clock(S.cMin) });
      S.cChips = [];
      S.cTyping = true;
      F.upd();
      setTimeout(() => {
        S.cTyping = false;
        S.cMin += 1;
        (node.reply || []).forEach(r => S.cMsgs.push({ from: 'them', t: r, at: clock(S.cMin) }));
        S.cChips = node.chips && node.chips.length ? node.chips : t.start;
        if (S.screen === 'chat') F.upd();
      }, 900);
    },
    'c-say': () => F.toast(C.chat.inputToast, 'sparkle'),
    'c-attach': () => F.toast(C.chat.attachToast, 'sparkle'),
    'c-stype': () => F.toast(C.search.typeToast, 'sparkle'),
    'c-q': n => { S.cQuery = n.dataset.q; F.upd(); },
    'c-clear': () => { S.cQuery = ''; F.upd(); },
    'c-open-res': n => F.toast(`${n.dataset.n} — ${C.search.openToast}`, 'search'),
    'c-retry': () => F.toast(C.maintenance.toast, 'refresh'),
    'c-notify': () => F.toast(C.comingSoon.toast, 'check'),
  });
})();
