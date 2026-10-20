/* FRH prototype — screens, sheets and actions. */
(function () {
  const { icon, mark, appIcon, flag } = window.FRHI;
  const F = window.FRH, S = F.S;
  const img = n => `assets/img/${n}`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const EMAIL_ERR = 'Enter a valid email, like name@example.com — or leave it blank.';
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  F.EMAIL_ERR = EMAIL_ERR;
  const back = `<button class="nav-btn" type="button" data-act="back" aria-label="Back">${icon('arrowLeft', 20, 2)}</button>`;
  const spacer = '<span style="width:40px"></span>';

  /* ================= Splash ================= */
  F.SCREENS.splash = {
    status: 'light', cls: 'splash',
    render: () => `<div class="sp-center">${mark('#fff', 96, 'sp-mark')}<div class="sp-word">FRH</div><div class="sp-sub">Healthcare</div></div><div class="sp-tag">Care that comes home.</div>`,
    mount() {
      clearTimeout(F._spT);
      F._spT = setTimeout(() => { if (S.open && S.screen === 'splash') F.go('onb', { dir: 'fade' }); }, 2400);
    },
  };

  /* ================= Onboarding ================= */
  const SLIDES = [
    {
      img: 'onb-1.jpg', alt: 'A doctor arriving at a family’s front door',
      title: 'Care that <em>comes home</em>',
      body: 'DHA-licensed doctors, nurses and therapists visit you at home, in your hotel or at the office — day or night.',
      chips: () => `<div class="fchip pill-live" style="left:-18px;top:96px"><i></i>On call 24/7</div>
        <div class="fchip d2" style="right:-20px;bottom:36px"><span class="ci">${icon('shieldCheck', 18, 2)}</span><div>DHA-licensed<small>Doctors · Nurses · Therapists</small></div></div>`,
    },
    {
      img: 'onb-2.jpg', alt: 'A mother booking a home visit on her phone',
      title: 'Book in minutes, <em>track</em> every step',
      body: 'Pick a service and a time that suits you, then follow your clinician live — right up to your door.',
      chips: () => `<div class="fchip eta"><div class="eta-row"><img src="${img('doctor.jpg')}" alt=""><div class="eta-t">Dr. Layla is on her way<small>General practitioner</small></div><span class="eta-min">12 min</span></div>
        <div class="eta-track"><i></i><i class="half"></i><i class="off"></i></div><div class="eta-steps"><span>Booked</span><b>On the way</b><span>Arrived</span></div></div>`,
    },
    {
      img: 'onb-3.jpg', alt: 'A physiotherapist helping an elderly man with an exercise at home',
      title: 'One app for the <em>whole family</em>',
      body: 'Doctor visits, nursing, physiotherapy and lab tests — with insurance support, secure payments and private records.',
      chips: () => `<div class="fchip" style="right:-18px;top:22px"><span class="ci">${icon('card', 18, 2)}</span><div>Insurance accepted<small>Secure payments</small></div></div>
        <div class="svc-pills"><div class="fchip hot d2"><span class="ci">${icon('physio', 15, 2)}</span>Physiotherapy</div><div class="fchip d2"><span class="ci">${icon('heartPulse', 15, 2)}</span>Nursing</div><div class="fchip d3"><span class="ci">${icon('lab', 15, 2)}</span>Lab tests</div><div class="fchip d4"><span class="ci">${icon('drip', 15, 2)}</span>IV therapy</div></div>`,
    },
  ];
  F.SLIDES = SLIDES;
  F.SCREENS.onb = {
    status: 'dark', cls: 'onb',
    render: () => `<div class="onb-top"><div class="brandline">${appIcon(30)}FRH<span>Healthcare</span></div><button class="onb-skip" type="button" data-act="onb-skip">Skip</button></div>
      <div class="onb-view"><div class="onb-track">${SLIDES.map(s => `<div class="slide"><div class="arch-wrap"><div class="arch"><img src="${img(s.img)}" alt="${s.alt}" draggable="false"></div>${s.chips()}</div><div class="slide-txt"><h1 class="h1">${s.title}</h1><p class="lead">${s.body}</p></div></div>`).join('')}</div></div>
      <div class="onb-foot"><div class="dots">${SLIDES.map((_, i) => `<button type="button" data-act="onb-dot" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div><button class="btn btn-primary onb-cta" type="button" data-act="onb-next"></button></div>`,
    update(n) {
      const last = S.onb === SLIDES.length - 1;
      n.querySelector('.onb-track').style.transform = `translateX(${-S.onb * 100}%)`;
      n.querySelectorAll('.slide').forEach((s, i) => { s.classList.toggle('cur', i === S.onb); s.setAttribute('aria-hidden', String(i !== S.onb)); });
      n.querySelectorAll('.dots button').forEach((b, i) => b.classList.toggle('on', i === S.onb));
      n.querySelector('.onb-foot').classList.toggle('last', last);
      n.querySelector('.onb-skip').classList.toggle('hide', last);
      setHTML(n.querySelector('.onb-cta'), `${last ? 'Get started' : 'Continue'} ${icon('arrowRight', 18, 2.2)}`);
    },
    mount(n) {
      const view = n.querySelector('.onb-view'), track = n.querySelector('.onb-track');
      let x0 = null, dx = 0;
      view.addEventListener('pointerdown', e => { if (e.button !== 0) return; x0 = e.clientX; dx = 0; track.classList.add('drag'); });
      view.addEventListener('pointermove', e => {
        if (x0 === null) return;
        dx = (e.clientX - x0) / F.scale;
        const edge = (S.onb === 0 && dx > 0) || (S.onb === SLIDES.length - 1 && dx < 0) ? 0.3 : 1;
        track.style.transform = `translateX(calc(${-S.onb * 100}% + ${dx * edge}px))`;
      });
      const end = () => {
        if (x0 === null) return;
        track.classList.remove('drag');
        if (dx < -60 && S.onb < SLIDES.length - 1) S.onb++;
        else if (dx > 60 && S.onb > 0) S.onb--;
        x0 = null; F.upd();
      };
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => view.addEventListener(t, end));
    },
  };

  /* ================= Mobile number ================= */
  F.SCREENS.phone = {
    status: 'dark', kb: 'num', focus: 'phone',
    render: () => `<div class="nav">${back}<button class="nav-link" type="button" data-act="guest">Browse as guest</button></div>
      <div class="scr-body">
        <div class="eyebrow">${icon('user', 13, 2.6)} Sign in or sign up</div>
        <h1 class="h1">What’s your <em>mobile number</em>?</h1>
        <p class="lead">We’ll send a 4-digit code to confirm it’s you. New to FRH? We’ll set up your account next.</p>
        <div class="pf focus"><button class="cc" type="button" data-act="cc" aria-label="Choose country code"></button><div class="pf-in"></div><button class="pf-clear hide" type="button" data-act="clear-phone" aria-label="Clear number">${icon('x', 14, 2.6)}</button></div>
        <div class="pf-msg"></div>
        <div class="chan"><div class="chan-lbl">Send my code by</div><div class="seg2">
          <button type="button" data-act="ch" data-ch="wa"><span class="cd wa">${icon('chat', 13, 2.6)}</span>WhatsApp</button>
          <button type="button" data-act="ch" data-ch="sms"><span class="cd sms">${icon('sms', 13, 2.6)}</span>SMS</button></div></div>
        <p class="fine">By continuing, you agree to our <u>Terms of Service</u> and <u>Privacy Policy</u>.</p>
      </div>
      <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="send"></button></div>`,
    update(n) {
      if (S.country.c === 'AE' && S.phone.startsWith('0')) { S.phone = S.phone.replace(/^0+/, ''); S.phoneHint = true; }
      const has = S.phone.length > 0;
      setHTML(n.querySelector('.cc'), `${flag(S.country.c, 24)}<span>+${S.country.d}</span>${icon('chevDown', 16, 2.2)}`);
      setHTML(n.querySelector('.pf-in'), (has ? `<span>${F.fmtPhone(S.phone)}</span>` : '') + '<span class="caret"></span>' + (has ? '' : `<span class="pf-ph">${S.country.ph}</span>`));
      n.querySelector('.pf').classList.toggle('error', !!S.phoneErr);
      n.querySelector('.pf-clear').classList.toggle('hide', !has || S.sending);
      setHTML(n.querySelector('.pf-msg'), S.phoneErr
        ? `<div class="fmsg" role="alert">${icon('alert', 16, 2.2)}<span>${S.phoneErr}</span></div>`
        : S.phoneHint && has ? `<div class="fmsg hint">${icon('check', 16, 2.4)}<span>No need for the leading 0 — we’ve removed it.</span></div>` : '');
      n.querySelectorAll('.seg2 button').forEach(b => b.classList.toggle('on', b.dataset.ch === S.channel));
      const b = n.querySelector('[data-act="send"]');
      b.classList.toggle('off', !!F.validatePhone() && !S.sending);
      b.classList.toggle('loading', S.sending);
      setHTML(b, S.sending ? '<span class="spin"></span>Sending code…' : `Send code ${icon('arrowRight', 18, 2.2)}`);
    },
  };

  /* ================= Enter code ================= */
  F.SCREENS.otp = {
    status: 'dark', kb: 'num', focus: 'otp',
    render: () => `<div class="nav">${back}<span class="nav-step">Step 2 of 3</span>${spacer}</div>
      <div class="scr-body">
        <h1 class="h1">Enter the <em>4-digit code</em></h1>
        <p class="lead otp-lead"></p>
        <div class="otp-row">${'<div class="ob"></div>'.repeat(4)}</div>
        <div class="otp-status"></div><div class="otp-alert"></div><div class="resend"></div>
      </div>`,
    update(n) {
      const ch = S.channel === 'wa' ? 'WhatsApp' : 'SMS';
      const last = S.codes[S.codes.length - 1];
      setHTML(n.querySelector('.otp-lead'), `Sent by ${ch} to <b>${F.fullPhone()}</b> · <button class="link" type="button" data-act="edit-number">Edit</button>`);
      const row = n.querySelector('.otp-row');
      row.className = 'otp-row' + ({ wrong: ' err', ok: ' ok', verifying: ' busy', expired: ' dis' }[S.otpState] || '');
      const typing = S.otpState === 'idle' || S.otpState === 'wrong';
      [...row.children].forEach((b, i) => {
        const v = S.otp[i] || '', act = typing && S.otp.length < 4 && i === S.otp.length;
        b.className = 'ob' + (v ? ' fill' : '') + (act ? ' act' : '');
        setHTML(b, v || (act ? '<span class="caret"></span>' : ''));
      });
      const st = n.querySelector('.otp-status');
      st.classList.toggle('ok', S.otpState === 'ok');
      setHTML(st, S.otpState === 'verifying' ? '<span class="spin dark sm"></span>Checking your code…'
        : S.otpState === 'ok' ? `${icon('check', 16, 2.6)} Verified`
        : last && last.status === 'pending' ? `<span class="spin dark sm"></span>Sending your code by ${ch}…` : '');
      const left = S.maxAttempts - S.attempts;
      setHTML(n.querySelector('.otp-alert'),
        S.otpState === 'wrong' ? `<div class="alert err" role="alert"><span class="a-ic">${icon('alert', 18, 2.2)}</span><div><b>${S.wasOld ? 'That’s an older code' : 'That code doesn’t match'}</b>${S.wasOld ? 'We’ve sent you a newer one — use the latest message.' : 'Check the latest message and try again.'} <span style="white-space:nowrap;font-weight:700">${left} ${left === 1 ? 'attempt' : 'attempts'} left<span class="tries">${[...Array(S.maxAttempts)].map((_, i) => `<i class="${i < S.attempts ? 'used' : ''}"></i>`).join('')}</span></span></div></div>`
        : S.otpState === 'expired' ? `<div class="alert warn" role="alert"><span class="a-ic">${icon('clock', 18, 2.2)}</span><div><b>This code has expired</b>Codes are valid for 5 minutes. Get a fresh one — it only takes a second.<br><button class="a-btn" type="button" data-act="new-code">${icon('refresh', 14, 2.4)} Send a new code</button></div></div>`
        : '');
      const wait = S.resendAt - Date.now(), other = S.channel === 'wa' ? 'SMS' : 'WhatsApp';
      setHTML(n.querySelector('.resend'),
        S.otpState === 'ok' ? ''
        : S.resending ? '<span class="spin dark sm"></span>Sending a new code…'
        : wait > 0 ? `<span>Didn’t get it? Resend in <span class="t">${F.mmss(wait)}</span></span>`
        : `Didn’t get it? <button class="link" type="button" data-act="resend">Resend code</button><span class="sep"></span><button class="link" type="button" data-act="switch-ch">Send by ${other}</button>`);
    },
    tick(n) {
      const c = F.activeCode();
      if (c && F.isExpired(c) && S.otpState === 'idle') { c.status = 'expired'; S.otpState = 'expired'; S.otp = ''; F.upd(); return; }
      this.update(n);
    },
  };

  /* ================= Locked ================= */
  F.SCREENS.locked = {
    status: 'dark', cls: 'locked',
    render: () => `<div class="nav"><button class="nav-btn" type="button" data-act="diff-number" aria-label="Back to sign in">${icon('arrowLeft', 20, 2)}</button><span></span><button class="nav-link" type="button" data-act="support">Help</button></div>
      <div class="scr-body">
        <div class="lock-badge"><svg class="ring" viewBox="0 0 124 124" width="124" height="124"><circle cx="62" cy="62" r="58" fill="none" stroke="#F6E3E0" stroke-width="5"/><circle class="rg" cx="62" cy="62" r="58" fill="none" stroke="#D71F32" stroke-width="5" stroke-linecap="round" stroke-dasharray="364.4" stroke-dashoffset="0"/></svg><div class="core">${icon('lock', 38, 2)}</div></div>
        <h1 class="h1">Too many attempts</h1>
        <p class="lead">To keep your account safe, we’ve paused sign-in for <b>${F.fullPhone()}</b>. It happens — you can try again soon.</p>
        <div class="timer-card"><small>You can try again in</small><div class="timer">15:00</div></div>
        <button class="sos" type="button" data-act="sos"><span class="si">${icon('ambulance', 20, 2)}</span><div><b>Medical emergency?</b><span>Don’t wait — call 998 for an ambulance</span></div></button>
      </div>
      <div class="scr-foot"><div class="stack"><button class="btn btn-primary" type="button" data-act="diff-number">Use a different number</button><button class="btn btn-secondary" type="button" data-act="support">${icon('headset', 18, 2)} Contact support</button></div></div>`,
    update(n) { this.tick(n); },
    tick(n) {
      const left = S.lockUntil - Date.now();
      if (left <= 0) { S.attempts = 0; S.lockUntil = 0; F.go('phone', { dir: 'fade' }); F.toast('You can sign in again now', 'check'); return; }
      n.querySelector('.timer').textContent = F.mmss(left);
      n.querySelector('.rg').style.strokeDashoffset = (364.4 * (1 - left / (15 * 60 * 1000))).toFixed(1);
    },
  };

  /* ================= Profile ================= */
  F.SCREENS.profile = {
    status: 'dark',
    render: () => `<div class="nav"><button class="nav-btn" type="button" data-act="edit-number" aria-label="Change number">${icon('arrowLeft', 20, 2)}</button><span class="nav-step">Step 3 of 3</span>${spacer}</div>
      <div class="scr-body" data-act="blur">
        <div class="eyebrow">${icon('check', 13, 2.8)} Number verified</div>
        <h1 class="h1">Welcome to FRH. <em>What’s your name?</em></h1>
        <p class="lead">So your clinician knows who they’re visiting. Use the name on your Emirates ID or passport.</p>
        <div class="tf-lbl">Full name</div>
        <div class="tf name" data-act="focus" data-f="name">${icon('user', 20, 1.9)}<div class="tf-v"></div></div>
        <div class="tf-lbl">Email <span>Optional · for receipts &amp; visit reports</span></div>
        <div class="tf email" data-act="focus" data-f="email">${icon('mail', 20, 1.9)}<div class="tf-v"></div></div>
        <div class="em-msg"></div>
        <div class="prefs">
          <div class="pref" data-act="pref" data-k="remind"><div class="pref-t">Visit reminders on WhatsApp<small>Booking updates and arrival alerts</small></div><span class="tog"></span></div>
          <div class="pref" data-act="pref" data-k="promo"><div class="pref-t">Health tips &amp; offers<small>Occasional news from FRH. Opt out anytime.</small></div><span class="tog"></span></div>
        </div>
        <div class="consent" data-act="consent"><span class="cbx">${icon('check', 15, 3)}</span><span>I agree to the <u>Terms of Service</u> and <u>Privacy Policy</u>, and allow FRH clinicians to access my health information to provide my care.</span></div>
      </div>
      <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="create"></button></div>`,
    update(n) {
      const f = S.focus;
      const val = (k, ph) => (S[k] ? `<span>${F.esc(S[k])}</span>` : '') + (f === k ? '<span class="caret"></span>' : '') + (S[k] ? '' : `<span class="ph">${ph}</span>`);
      setHTML(n.querySelector('.tf.name .tf-v'), val('name', 'As on your Emirates ID'));
      setHTML(n.querySelector('.tf.email .tf-v'), val('email', 'name@example.com'));
      n.querySelector('.tf.name').classList.toggle('focus', f === 'name');
      n.querySelector('.tf.email').classList.toggle('focus', f === 'email');
      n.querySelector('.tf.email').classList.toggle('error', !!S.emailErr);
      setHTML(n.querySelector('.em-msg'), S.emailErr ? `<div class="fmsg" role="alert">${icon('alert', 16, 2.2)}<span>${S.emailErr}</span></div>` : '');
      n.querySelectorAll('.pref').forEach(p => p.querySelector('.tog').classList.toggle('on', !!S[p.dataset.k]));
      n.querySelector('.cbx').classList.toggle('on', S.consent);
      const b = n.querySelector('[data-act="create"]');
      b.classList.toggle('off', !(S.name.trim().length >= 2 && S.consent) && !S.creating);
      b.classList.toggle('loading', S.creating);
      setHTML(b, S.creating ? '<span class="spin"></span>Creating your account…' : 'Create account');
    },
  };
  F.focusField = f => {
    if (S.screen !== 'profile') return;
    const prev = S.focus;
    if (prev === 'email' && f !== 'email' && S.email && !validEmail(S.email)) S.emailErr = EMAIL_ERR;
    S.focus = f;
    if (f) {
      S.sym = false;
      S.shift = f === 'name' && (S.name.length === 0 || S.name.endsWith(' '));
      F.showKb('qwerty', f);
    } else F.hideKb();
    F.upd();
    if (f) setTimeout(() => {
      const node = F.cur() && F.cur().querySelector('.tf.' + f), body = F.cur() && F.cur().querySelector('.scr-body');
      if (!node || !body) return;
      const y = (node.getBoundingClientRect().top - body.getBoundingClientRect().top) / F.scale + body.scrollTop - 70;
      body.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }, 380);
  };

  /* ================= Success ================= */
  F.SCREENS.success = {
    status: 'dark', cls: 'success',
    render() {
      const bits = [[-72, -38], [72, -44], [-60, 54], [66, 50], [0, -80], [-88, 6], [90, 4], [0, 82]];
      return `<div class="scr-body">
        <div class="ok-badge"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#D71F32"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>${bits.map(([x, y], i) => `<i style="--x:${x}px;--y:${y}px;${i % 2 ? 'background:#D71F32' : ''}"></i>`).join('')}</div>
        <h1 class="h1">You’re all set, <em>${F.esc(F.firstName())}</em></h1>
        <p class="lead">Your FRH account is ready. Whenever you need care, we’ll come to you.</p>
        <div class="sum">
          <div class="sum-row"><span class="si">${icon('phone', 14, 2.2)}</span>${F.fullPhone()}<span>Verified</span></div>
          <div class="sum-row"><span class="si ${S.remind ? '' : 'off'}">${icon('bell', 15, 2.2)}</span>Visit reminders<span>${S.remind ? 'On · WhatsApp' : 'Off'}</span></div>
          <div class="sum-row"><span class="si ${S.email ? '' : 'off'}">${icon('mail', 15, 2.2)}</span>${S.email ? F.esc(S.email) : 'Email'}<span>${S.email ? 'Receipts' : 'Not added'}</span></div>
        </div>
      </div>
      <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="go-home">Go to home ${icon('arrowRight', 18, 2.2)}</button></div>`;
    },
  };

  /* ================= Home ================= */
  const SERVICES = [['stetho', 'Doctor visit'], ['heartPulse', 'Nursing'], ['physio', 'Physio&shy;therapy'], ['lab', 'Lab tests'], ['drip', 'IV therapy'], ['syringe', 'Vaccines'], ['users', 'Elderly care'], ['video', 'Video consult']];
  const initials = () => { const p = (S.name || F.DEMO.name).trim().split(/\s+/); return ((p[0] || ' ')[0] + ((p[1] || '')[0] || '')).toUpperCase(); };
  F.SCREENS.home = {
    status: 'dark', cls: 'home',
    render() {
      const g = S.guest, book = g ? 'signin' : 'soon';
      return `<div class="scr-body">
        <div class="h-top"><button class="addr" type="button" data-act="soon" data-msg="Saved addresses come with the booking flow"><small>Visit address</small><b>${icon('pin', 16, 2.2)} ${g ? 'Set your location' : 'Home · Al Barsha 1'} ${icon('chevDown', 15, 2.4)}</b></button>
          <div class="h-actions">${g ? '<button class="signin-pill" type="button" data-act="signin">Sign in</button>' : `<button class="icon-btn" type="button" data-act="soon" aria-label="Notifications">${icon('bell', 20, 1.9)}<i class="dot"></i></button><button class="avatar" type="button" data-act="soon" aria-label="Profile">${initials()}</button>`}</div></div>
        ${g ? '<div class="guest-bar"><p><b>You’re browsing as a guest</b>Sign in to book visits and keep your records.</p><button type="button" data-act="signin">Sign in</button></div>' : ''}
        <h1 class="h-greet">${g ? 'Welcome to FRH' : `${F.greeting()}, ${F.esc(F.firstName())}`}</h1>
        <p class="h-sub">How can we help you today?</p>
        <button class="search" type="button" data-act="soon">${icon('search', 19, 2)} Search services, symptoms or doctors</button>
        <div class="hero-card"><div class="hc-text"><span class="hc-tag"><i></i>Doctors available now</span><h3>Doctor at home</h3><p>A licensed GP at your door. Book in under a minute.</p><button class="hc-btn" type="button" data-act="${book}">Book a visit ${icon('arrowRight', 16, 2.4)}</button></div><img class="hc-img" src="${img('doctor.jpg')}" alt=""></div>
        <div class="sec-h"><h4>Care at home</h4><button class="link" type="button" data-act="soon">See all</button></div>
        <div class="svc-grid">${SERVICES.map(([i, t]) => `<button class="svc" type="button" data-act="${book}"><span class="svc-ic">${icon(i, 26, 1.8)}</span>${t}</button>`).join('')}</div>
        <div class="sec-h"><h4>Your visits</h4></div>
        <div class="empty-card"><span class="ei">${icon('calendar', 22, 2)}</span><div><b>No visits booked yet</b><span>When you book, you’ll track your clinician here — live.</span></div></div>
        <div class="trust"><div>${icon('shieldCheck', 20, 2)}DHA-licensed<br>clinicians</div><div>${icon('card', 20, 2)}Insurance<br>accepted</div><div>${icon('lock', 20, 2)}Private &amp;<br>secure</div></div>
      </div>
      <nav class="tabbar"><button class="tab on" type="button">${icon('home', 23, 1.9)}Home</button><button class="tab" type="button" data-act="soon">${icon('calendar', 23, 1.9)}Visits</button><button class="tab" type="button" data-act="${book}" aria-label="Book a visit"><span class="tab-book">${icon('plus', 26, 2.4)}</span></button><button class="tab" type="button" data-act="soon">${icon('file', 23, 1.9)}Records</button><button class="tab" type="button" data-act="soon">${icon('user', 23, 1.9)}Profile</button></nav>`;
    },
  };

  /* ================= Sheets ================= */
  const ccItem = c => `<button class="cc-item ${c.c === S.country.c ? 'on' : ''}" type="button" data-act="cc-pick" data-c="${c.c}">${flag(c.c, 28)}<span>${c.n}</span><span class="dc">+${c.d}</span></button>`;
  F.SHEETS.country = () => `<div class="sheet tall" role="dialog" aria-label="Choose your country"><div class="grab"></div><div class="sh-head"><h2>Choose your country</h2><button class="nav-btn" type="button" data-act="sheet-close" aria-label="Close">${icon('x', 18, 2.2)}</button></div>
    <div class="cc-list"><div class="cc-sec">Gulf</div>${F.COUNTRIES.slice(0, 6).map(ccItem).join('')}<div class="cc-sec">Popular in the UAE</div>${F.COUNTRIES.slice(6).map(ccItem).join('')}</div></div>`;
  F.SHEETS.offline = () => `<div class="sheet" role="dialog" aria-label="You’re offline"><div class="grab"></div><div class="sh-ic ink">${icon('wifiOff', 34, 1.9)}</div><h2>You’re offline</h2><p>Check your Wi-Fi or mobile data and try again. Nothing you’ve entered is lost.</p><div class="sheet-note"></div>
    <div class="stack"><button class="btn btn-primary" type="button" data-act="retry">${icon('refresh', 18, 2.2)} Try again</button><button class="btn btn-ghost" type="button" data-act="sheet-close">Not now</button></div></div>`;
  F.SHEETS.failed = () => {
    const ch = S.channel === 'wa' ? 'WhatsApp' : 'SMS', other = S.channel === 'wa' ? 'SMS' : 'WhatsApp';
    return `<div class="sheet" role="dialog" aria-label="Code not sent"><div class="grab"></div><div class="sh-ic red">${icon('msgX', 34, 1.9)}</div><h2>We couldn’t send your code</h2><p>${ch} isn’t responding right now. Get your code by ${other} instead, or try again in a moment.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="switch-send">${icon(S.channel === 'wa' ? 'sms' : 'chat', 18, 2.2)} Send by ${other}</button><button class="btn btn-ghost" type="button" data-act="retry">Try again</button></div></div>`;
  };

  /* ================= Flows ================= */
  function failDelivery(pending) {
    S.failNext = false; S.pending = pending;
    if (F.panel) F.panel.note(`${S.channel === 'wa' ? 'WhatsApp' : 'SMS'} delivery failed — no message sent`, true);
    F.upd(); F.openSheet('failed');
  }
  function sendCode() {
    if (S.sending) return;
    const err = F.validatePhone();
    if (err) { S.phoneErr = err; F.upd(); F.shake('.pf'); return; }
    if (S.lockUntil > Date.now() && S.lockedPhone === S.country.d + S.phone) { F.go('locked', { dir: 'fade' }); return; }
    if (!S.online) { S.pending = 'send'; F.openSheet('offline'); return; }
    S.sending = true; F.upd();
    const from = S.screen;
    setTimeout(() => {
      S.sending = false;
      if (!S.open || S.screen !== from) return;   // they left (or closed the app) before it sent
      if (S.failNext) return failDelivery('send');
      F.issueCode(); F.go('otp');
    }, 1100);
  }
  function resend(force) {
    if (S.resending || (!force && Date.now() < S.resendAt)) return;
    if (!S.online) { S.pending = 'resend'; F.openSheet('offline'); return; }
    S.resending = true; F.upd();
    setTimeout(() => {
      S.resending = false;
      if (!S.open || S.screen !== 'otp') return;
      if (S.failNext) return failDelivery('resend');
      F.issueCode(); F.upd();
      F.toast(`New code sent by ${S.channel === 'wa' ? 'WhatsApp' : 'SMS'}`, 'check');
    }, 900);
  }
  const sendOrResend = () => (S.screen === 'otp' ? resend(true) : sendCode());
  function retry() {
    if (!S.online) {
      const note = document.querySelector('#sheetLayer .sheet-note');
      if (note) note.innerHTML = `${icon('wifiOff', 15, 2.2)} Still offline — check your connection`;
      F.shake('.sheet'); return;
    }
    const p = S.pending, from = S.screen; S.pending = null; F.closeSheet();
    setTimeout(() => {
      if (!S.open || S.screen !== from) return;
      if (p === 'send') sendCode(); else if (p === 'resend') resend(true);
      else if (p === 'verify') F.verify(); else if (p === 'create') createAccount();
    }, 320);
  }
  function createAccount() {
    if (S.creating) return;
    if (S.email && !validEmail(S.email)) { S.emailErr = EMAIL_ERR; F.upd(); F.shake('.tf.email'); return; }
    if (S.name.trim().length < 2) { F.focusField('name'); F.shake('.tf.name'); return; }
    if (!S.consent) { F.focusField(null); F.shake('.consent'); return; }
    if (!S.online) { S.pending = 'create'; F.openSheet('offline'); return; }
    F.focusField(null);
    S.creating = true; F.upd();
    setTimeout(() => { S.creating = false; if (S.open && S.screen === 'profile') F.go('success', { dir: 'fade' }); }, 1300);
  }

  /* ================= Actions ================= */
  Object.assign(F.ACT, {
    launch: () => F.launch(),
    'ios-app': n => F.toast(`${n.dataset.name} isn’t part of this demo — tap FRH Health`, 'alert'),
    'onb-next': () => { if (S.onb < SLIDES.length - 1) { S.onb++; F.upd(); } else F.go('phone'); },
    'onb-skip': () => F.go('phone'),
    'onb-dot': n => { S.onb = +n.dataset.i; F.upd(); },
    back: () => {
      if (S.screen === 'phone') { S.onb = SLIDES.length - 1; F.go('onb', { dir: 'back' }); }
      else if (S.screen === 'otp') { S.otp = ''; S.otpState = 'idle'; F.go('phone', { dir: 'back' }); }
    },
    guest: () => { S.guest = true; F.go('home', { dir: 'fade' }); },
    signin: () => { S.guest = false; F.go('phone'); },
    cc: () => F.openSheet('country'),
    'cc-pick': n => { S.country = F.COUNTRIES.find(c => c.c === n.dataset.c); S.phone = S.phone.slice(0, S.country.len[1]); S.phoneErr = ''; F.closeSheet(); F.upd(); },
    ch: n => { S.channel = n.dataset.ch; F.upd(); },
    'clear-phone': () => { S.phone = ''; S.phoneErr = ''; S.phoneHint = false; F.upd(); },
    send: () => sendCode(),
    'edit-number': () => { S.otp = ''; S.otpState = 'idle'; F.go('phone', { dir: 'back' }); },
    resend: () => resend(false),
    'switch-ch': () => { S.channel = S.channel === 'wa' ? 'sms' : 'wa'; resend(true); },
    'new-code': () => resend(true),
    'switch-send': () => { S.channel = S.channel === 'wa' ? 'sms' : 'wa'; const from = S.screen; F.closeSheet(); setTimeout(() => { if (S.open && S.screen === from) sendOrResend(); }, 320); },
    retry: () => retry(),
    'diff-number': () => { S.phone = ''; S.phoneErr = ''; S.phoneHint = false; S.attempts = 0; S.otp = ''; S.otpState = 'idle'; F.go('phone', { dir: 'back' }); },
    support: () => (F.ACT['a-call'] ? F.ACT['a-call']({ dataset: { n: 'frh' } }) : F.toast('Calling FRH support…', 'headset')),
    sos: () => (F.ACT['a-call'] ? F.ACT['a-call']({ dataset: { n: 'ambulance' } }) : F.toast('Calling 998 (Ambulance)…', 'phone')),
    'sheet-close': () => F.closeSheet(),
    focus: n => F.focusField(n.dataset.f),
    blur: () => { if (S.focus) F.focusField(null); },
    pref: n => { S[n.dataset.k] = !S[n.dataset.k]; F.upd(); },
    consent: () => { S.consent = !S.consent; F.upd(); },
    create: () => createAccount(),
    'go-home': () => F.go('home', { dir: 'fade' }),
    soon: n => F.toast(n.dataset.msg || 'Booking is the next design phase — this demo covers sign-in', 'sparkle'),
  });
})();
