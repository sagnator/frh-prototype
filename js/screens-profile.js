/* FRH prototype — flow 8: profile, patients, addresses, medical reports,
   notifications, policies, about us, help & support, language and sign out. */
(function () {
  const { icon, flag, mark } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA, PD = window.FRHPROFILE;
  const soon = m => `data-act="soon" data-msg="${m}"`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const swap = (root, sel, h) => setHTML(root.querySelector(sel), h);
  const initials = s => s.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const go = (to, dir) => `data-act="p-go" data-to="${to}"${dir ? ` data-dir="${dir}"` : ''}`;
  const navBar = (title, parent, right = '') =>
    `<div class="nav"><button class="nav-btn" type="button" ${go(parent, 'back')} aria-label="Back">${icon('arrowLeft', 20, 2)}</button>
      <span class="nav-title">${title}</span>${right || '<span style="width:40px"></span>'}</div>`;

  const unreadCount = () => PD.notifications.filter(n => n.unread).length;
  const apptCount = () => (D.appointments.upcoming || []).length;
  const langName = () => (PD.languages.find(l => l.id === (S.pLang || 'en')) || PD.languages[0]).name;

  /* ================= 8.1 Profile & settings ================= */
  const quickBtn = q => {
    const meta = q.id === 'patients' ? `${PD.patients.length} saved`
      : q.id === 'addresses' ? `${PD.addresses.length} saved` : q.meta;
    const act = q.id === 'coupons' ? soon('Coupons &amp; offers apply at checkout — flow 4') : go(q.id);
    return `<button class="p-qa" type="button" ${act}><span class="tile">${icon(q.icon, 20, 1.9)}</span><b>${q.label}</b><small>${meta}</small></button>`;
  };

  const menuRow = m => {
    const n = m.badge === 'appts' ? apptCount() : m.badge === 'notifs' ? unreadCount() : 0;
    const sub = m.value === 'lang' ? langName() : m.sub;
    return `<button class="info-row p-row" type="button" ${go(m.id)}>
        <span class="tile">${icon(m.icon, 17, 2)}</span>
        <div class="ir-mid"><b>${m.label}</b><small>${sub}</small></div>
        ${n ? `<span class="pill red">${n}</span>` : ''}${icon('chevRight', 17, 2.2)}</button>`;
  };

  F.SCREENS['profile-home'] = {
    status: 'dark', cls: 'p-profile',
    render() {
      const me = PD.me, n = unreadCount();
      return `${navBar('Profile', 'home', `<button class="icon-btn" type="button" ${go('notifs')} aria-label="Notifications">${icon('bell', 19, 1.9)}${n ? `<i class="badge-dot">${n}</i>` : ''}</button>`)}
        <div class="scr-body">
          <div class="p-me">
            <span class="p-ava">${initials(F.esc(me.name))}</span>
            <div class="p-me-txt"><b>${F.esc(me.name)}</b><small>${me.phone}</small><small>${me.email}</small></div>
            <button class="icon-btn" type="button" ${soon('Editing your own details is a later screen — FRH to confirm which fields patients may change')} aria-label="Edit profile">${icon('edit', 18, 2)}</button>
          </div>
          <div class="p-member">${icon('shieldCheck', 15, 2.2)}<span>Patient ID <b>${me.ref}</b> · with FRH since ${me.since}</span></div>

          <div class="p-quick">${PD.quick.map(quickBtn).join('')}</div>

          <div class="info-card p-menu">${PD.menu.map(menuRow).join('')}</div>

          <button class="btn btn-secondary p-logout" type="button" data-act="p-logout">${icon('lock', 18, 2)} Log out</button>
          <p class="p-ver">FRH Healthcare · ${PD.about.version}</p>
        </div>`;
    },
  };

  /* ================= 8.2 Patients ================= */
  const patientCard = p => `<div class="p-card">
      <div class="p-card-top">
        <span class="p-ava sm">${initials(p.name)}</span>
        <div class="p-card-id"><b>${p.name}${p.self ? ' <span class="pill red">You</span>' : ''}</b><small>${p.rel} · ${p.age} years · born ${p.dob}</small></div>
        <button class="icon-btn" type="button" data-act="p-edit-patient" data-n="${p.name}" aria-label="Edit ${p.name}">${icon('edit', 17, 2)}</button>
      </div>
      <div class="p-meta">
        <div><small>Gender</small><b>${p.gender}</b></div>
        <div><small>Blood group</small><b class="p-blood">${p.blood}</b></div>
        <div class="p-meta-wide"><small>Phone</small><b>${p.phone}</b></div>
      </div>
      <div class="p-card-note">${icon('file', 13, 2.2)}<span>${p.note}</span></div>
    </div>`;

  F.SCREENS.patients = {
    status: 'dark', cls: 'p-patients',
    render() {
      return `${navBar('Patients', 'profile-home', `<button class="icon-btn" type="button" data-act="p-add-patient" aria-label="Add patient">${icon('plus', 19, 2.2)}</button>`)}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Everyone you can book a visit for. Add a family member once and they are ready at checkout.</p>
          <div class="p-list">${PD.patients.map(patientCard).join('')}</div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.patientNote}</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="p-add-patient">${icon('plus', 18, 2.2)} Add new patient</button></div>`;
    },
  };

  /* ================= 8.3 Addresses ================= */
  const addressCard = a => `<div class="p-card">
      <div class="p-card-top">
        <span class="tile">${icon(a.icon, 18, 2)}</span>
        <div class="p-card-id"><b>${a.label}${a.dflt ? ' <span class="pill green">Default</span>' : ''}</b><small>${a.line}</small></div>
        <button class="icon-btn" type="button" data-act="p-edit-address" data-n="${a.label}" aria-label="Edit ${a.label}">${icon('edit', 17, 2)}</button>
      </div>
      <div class="p-card-note">${icon('pin', 13, 2.2)}<span>${a.note}</span></div>
      ${a.dflt ? '' : `<div class="p-card-foot"><button class="mini-btn ghost" type="button" data-act="p-default-address" data-id="${a.id}">Set as default</button></div>`}
    </div>`;

  const addressList = () => PD.addresses.map(addressCard).join('');

  F.SCREENS.addresses = {
    status: 'dark', cls: 'p-addresses',
    render() {
      return `${navBar('Addresses', 'profile-home', `<button class="icon-btn" type="button" data-act="p-add-address" aria-label="Add address">${icon('plus', 19, 2.2)}</button>`)}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Where we come to you. The default address is filled in for every new booking.</p>
          <div class="p-list">${addressList()}</div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.addressNote}</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="p-add-address">${icon('plus', 18, 2.2)} Add new address</button></div>`;
    },
    update(n) { swap(n, '.p-list', addressList()); },
  };

  /* ================= 8.4 Medical reports ================= */
  const RTYPE = {
    report: { ic: 'file', tint: '', label: 'Visit report' },
    rx: { ic: 'syringe', tint: 'violet', label: 'Prescription' },
    lab: { ic: 'lab', tint: 'blue', label: 'Lab result' },
  };

  F.SCREENS.reports = {
    status: 'dark', cls: 'p-reports',
    render() {
      const total = PD.reports.reduce((s, g) => s + g.items.length, 0);
      return `${navBar('Medical reports', 'profile-home', `<button class="icon-btn" type="button" ${soon('Search across your records is screen 9.3 — a later batch')} aria-label="Search">${icon('search', 19, 1.9)}</button>`)}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">${total} files from past visits, for everyone on your account. Tap download to keep a copy on your phone.</p>
          ${PD.reports.map(g => `
            <div class="sec-h" style="margin:22px 0 10px"><h4>${g.month}</h4><span class="pill ink">${g.items.length} files</span></div>
            <div class="info-card" style="margin-top:0">${g.items.map(r => {
              const t = RTYPE[r.type];
              return `<div class="info-row">
                  <span class="tile ${t.tint}">${icon(t.ic, 17, 2)}</span>
                  <div class="ir-mid"><b>${r.name}</b><small>${t.label} · ${r.who}<br>${r.date} · ${r.size}</small></div>
                  <button class="icon-btn" type="button" data-act="p-download" data-n="${r.name}" aria-label="Download ${r.name}">${icon('download', 17, 2)}</button>
                </div>`;
            }).join('')}</div>`).join('')}
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.reportNote}</span></div>
        </div>`;
    },
  };

  /* ================= 8.5 Notifications ================= */
  const NTYPE = {
    appointment: { ic: 'calendar', tint: '' },
    medication: { ic: 'syringe', tint: 'violet' },
    lab: { ic: 'lab', tint: 'blue' },
    payment: { ic: 'card', tint: 'green' },
    offer: { ic: 'sparkle', tint: 'p-amber' },
    message: { ic: 'chat', tint: 'p-teal' },
    tip: { ic: 'heartPulse', tint: 'p-lime' },
    report: { ic: 'file', tint: 'p-ink' },
  };
  const GROUPS = ['Today', 'Yesterday', 'Earlier'];

  const notifTabs = () => {
    const tab = S.pNotifTab || 'all';
    const all = PD.notifications.length, un = unreadCount();
    const counts = { all, unread: un, read: all - un };
    return ['all', 'unread', 'read'].map(t =>
      `<button type="button" data-act="p-notif-tab" data-t="${t}" class="${t === tab ? 'on' : ''}">${t === 'all' ? 'All' : t === 'unread' ? 'Unread' : 'Read'} (${counts[t]})</button>`).join('');
  };

  const notifList = () => {
    const tab = S.pNotifTab || 'all';
    const list = PD.notifications.filter(n => tab === 'all' || (tab === 'unread' ? n.unread : !n.unread));
    if (!list.length) return `<div class="empty-state"><div class="es-ic">${icon('bell', 30, 1.8)}</div>
        <b>Nothing ${tab === 'unread' ? 'unread' : 'read yet'}</b><span>${tab === 'unread' ? 'You are all caught up. New reminders and results will appear here.' : 'Notifications you have opened will be kept here.'}</span></div>`;
    return GROUPS.map(g => {
      const items = list.filter(n => n.group === g);
      if (!items.length) return '';
      return `<div class="p-group">${g}</div>${items.map(n => {
        const t = NTYPE[n.type] || NTYPE.report;
        return `<button class="p-notif ${n.unread ? 'unread' : ''}" type="button" data-act="p-notif" data-id="${n.id}">
            <span class="tile ${t.tint}">${icon(t.ic, 18, 2)}</span>
            <div class="p-n-mid"><b>${n.title}</b><span>${n.body}</span><small>${n.time}</small></div>
            ${n.unread ? '<i class="p-dot"></i>' : ''}</button>`;
      }).join('')}`;
    }).join('');
  };

  F.SCREENS.notifs = {
    status: 'dark', cls: 'p-notifs',
    render() {
      return `${navBar('Notifications', 'profile-home', `<button class="nav-link" type="button" data-act="p-read-all">Mark all read</button>`)}
        <div class="scr-body">
          <div class="seg-tabs">${notifTabs()}</div>
          <div class="p-notif-list">${notifList()}</div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.notifNote}</span></div>
        </div>`;
    },
    update(n) {
      swap(n, '.seg-tabs', notifTabs());
      swap(n, '.p-notif-list', notifList());
    },
  };

  /* ================= 8.6 Policies ================= */
  F.SCREENS.policies = {
    status: 'dark', cls: 'p-policies',
    render() {
      return `${navBar('Policies', 'profile-home')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">The rules that apply to every FRH booking. ${PD.policyUpdated}.</p>
          <div class="info-card">${PD.policies.map(p => `
            <button class="info-row p-row" type="button" data-act="p-policy" data-id="${p.id}">
              <span class="tile">${icon(p.icon, 17, 2)}</span>
              <div class="ir-mid"><b>${p.title}</b><small>${p.sub}</small></div>${icon('chevRight', 17, 2.2)}</button>`).join('')}</div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>Every policy in this build is placeholder wording written to show length and structure. FRH’s legal text replaces it before launch.</span></div>
        </div>`;
    },
  };

  /* ================= Policy text (reused for all six) ================= */
  F.SCREENS['policy-text'] = {
    status: 'dark', cls: 'p-policy-text',
    render() {
      const p = PD.policies.find(x => x.id === S.pPolicy) || PD.policies[0];
      return `${navBar('Policies', 'policies', `<button class="icon-btn" type="button" ${soon('Sharing a policy is wired in the real app')} aria-label="Share">${icon('share', 18, 1.9)}</button>`)}
        <div class="scr-body">
          <span class="tile">${icon(p.icon, 20, 2)}</span>
          <h1 class="h1 p-doc-h1">${p.title}</h1>
          <p class="p-updated">${icon('clock', 14, 2.2)} ${PD.policyUpdated}</p>
          <div class="p-doc">${p.body.map(s => `${s.h ? `<h4>${s.h}</h4>` : ''}<p>${s.p}</p>`).join('')}</div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>Placeholder wording. FRH’s approved legal text and its Arabic translation replace this page.</span></div>
          <button class="btn btn-secondary" style="margin-top:16px" type="button" ${go('support')}>${icon('headset', 18, 2)} Questions about this policy</button>
        </div>`;
    },
  };

  /* ================= 8.7 About us ================= */
  F.SCREENS.about = {
    status: 'dark', cls: 'p-about',
    render() {
      const a = PD.about;
      return `${navBar('About us', 'profile-home')}
        <div class="scr-body">
          <div class="p-hero">${mark('#fff', 52)}<h3>FRH Healthcare</h3><p>${a.tagline}</p><span class="pill">${a.version}</span></div>
          <p class="p-doc-lead">${a.intro}</p>

          <div class="sec-h" style="margin:22px 0 10px"><h4>Our mission</h4></div>
          <div class="p-quote">${icon('heart', 18, 2)}<p>${a.mission}</p></div>

          <div class="p-stats">${a.stats.map(s => `<div><b>${s.n}</b><small>${s.l}</small></div>`).join('')}</div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>What we hold ourselves to</h4></div>
          <div class="info-card" style="margin-top:0">${a.values.map(v => `
            <div class="info-row"><span class="tile">${icon(v.icon, 17, 2)}</span>
              <div class="ir-mid"><b>${v.title}</b><small>${v.sub}</small></div></div>`).join('')}</div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>Accreditation</h4><span class="pill green">Licensed</span></div>
          <div class="p-lic"><div class="p-lic-top">${icon('shieldCheck', 20, 2)}<div><b>${a.licence.title}</b><small>${a.licence.number}</small></div></div>
            <p>${a.licence.body}</p></div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>Insurance partners</h4></div>
          <div class="p-chips">${a.insurers.map(i => `<span class="p-chip">${i}</span>`).join('')}</div>
          <p class="sec-sub" style="margin:12px 0 0">Direct billing depends on your plan. The list is a placeholder for FRH to confirm.</p>

          <div class="info-card">${a.links.map(l => `
            <button class="info-row p-row" type="button" ${soon(`${l.label} opens outside the app in the real build`)}>
              <span class="tile">${icon(l.icon, 17, 2)}</span>
              <div class="ir-mid"><b>${l.label}</b><small>${l.sub}</small></div>${icon('chevRight', 17, 2.2)}</button>`).join('')}</div>
          <p class="p-ver">FRH Healthcare · ${a.version} · Prepared by Spiderworks</p>
        </div>`;
    },
  };

  /* ================= 8.8 Help & support ================= */
  const subjectChips = () => PD.subjects.map((s, i) =>
    `<button class="p-chip pick ${S.pSubject === i ? 'on' : ''}" type="button" data-act="p-subject" data-i="${i}">${s}</button>`).join('');

  F.SCREENS.support = {
    status: 'dark', cls: 'p-support',
    render() {
      return `${navBar('Help &amp; support', 'profile-home')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Most answers are below. If you would rather talk to someone, our team is on call day and night.</p>

          <div class="info-card">${PD.contact.map(c => `
            <button class="info-row p-row" type="button" data-act="p-contact" data-id="${c.id}">
              <span class="tile ${c.tint}">${icon(c.icon, 17, 2)}</span>
              <div class="ir-mid"><b>${c.label} · ${c.value}</b><small>${c.sub}</small></div>${icon('chevRight', 17, 2.2)}</button>`).join('')}</div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>Common questions</h4></div>
          ${PD.faqs.map((f, i) => `<div class="acc" id="pFaq${i}"><button class="acc-head" type="button" data-act="p-acc" data-t="pFaq${i}"><b>${f.q}</b>${icon('chevDown', 18, 2.2)}</button>
            <div class="acc-body"><p style="margin:0">${f.a}</p></div></div>`).join('')}

          <div class="sec-h" style="margin:22px 0 10px"><h4>Send us a message</h4></div>
          <div class="p-form">
            <label>What is it about?</label>
            <div class="p-chips pick">${subjectChips()}</div>
            <label style="margin-top:14px">Your message</label>
            <button class="p-textarea" type="button" ${soon('The keyboard opens here in the real app')}>Tell us what happened, and which booking it relates to…</button>
            <div class="p-form-foot">${icon('lock', 13, 2.2)}<span>Your message reaches the FRH care team only. In an emergency, call 998 instead.</span></div>
            <button class="btn btn-primary" type="button" data-act="p-send" style="margin-top:14px">Send message</button>
          </div>
          <div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.supportNote}</span></div>
        </div>`;
    },
    update(n) { swap(n, '.p-chips.pick', subjectChips()); },
  };

  /* ================= 8.9 Change language ================= */
  const langList = () => {
    const cur = S.pLang || 'en';
    return PD.languages.map(l => `<button class="reason p-lang ${l.id === cur ? 'on' : ''}" type="button" data-act="p-lang" data-id="${l.id}">
        <span class="radio"></span>${flag(l.flag, 26)}
        <span class="p-lang-txt"><b>${l.native}</b><small>${l.sub}</small></span></button>`).join('');
  };
  const langNotes = () => `<div class="flag-note">${icon('alert', 14, 2.2)}<span>${PD.languageNote}</span></div>
      ${(S.pLang || 'en') === 'ar' ? `<div class="flag-note">${icon('globe', 14, 2.2)}<span>${PD.rtlNote}</span></div>` : ''}`;

  F.SCREENS.language = {
    status: 'dark', cls: 'p-language',
    render() {
      return `${navBar('Change language', 'profile-home')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Choose the language for the app. Your clinician is matched separately, at booking.</p>
          <div class="p-lang-list">${langList()}</div>
          <div class="p-lang-notes">${langNotes()}</div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary" type="button" data-act="p-save-lang">Save language</button></div>`;
    },
    update(n) {
      swap(n, '.p-lang-list', langList());
      swap(n, '.p-lang-notes', langNotes());
    },
  };

  /* ================= 8.10 Log out sheet ================= */
  F.SHEETS.logout = () => `<div class="sheet" role="dialog" aria-label="Sign out"><div class="grab"></div>
      <div class="sh-ic ink">${icon('user', 34, 1.9)}</div>
      <h2>Sign out?</h2>
      <p>You will need your mobile number and a code to get back in. Your appointments and records stay safe with FRH.</p>
      <div class="stack"><button class="btn btn-primary" type="button" data-act="p-signout">Sign out</button>
        <button class="btn btn-ghost" type="button" data-act="sheet-close">Cancel</button></div></div>`;

  /* ================= actions ================= */
  Object.assign(F.ACT, {
    'p-go': n => F.go(n.dataset.to, { dir: n.dataset.dir || 'fwd' }),
    'p-acc': n => { const box = document.getElementById(n.dataset.t); if (box) box.classList.toggle('open'); },

    'p-edit-patient': n => F.toast(`Editing ${n.dataset.n} opens the add-patient form — next batch`, 'edit'),
    'p-add-patient': () => F.toast('The add-patient form is a later screen — FRH to confirm the fields', 'plus'),
    'p-edit-address': n => F.toast(`Editing ${n.dataset.n} opens the map picker — next batch`, 'edit'),
    'p-add-address': () => F.toast('Adding an address uses the map picker from the booking flow', 'pin'),
    'p-default-address': n => {
      PD.addresses.forEach(a => { a.dflt = a.id === n.dataset.id; });
      const a = PD.addresses.find(x => x.id === n.dataset.id);
      F.upd();
      F.toast(`${a.label} is now your default address`, 'check');
    },

    'p-download': n => F.toast(`${n.dataset.n} saved to your phone`, 'download'),

    'p-notif-tab': n => { S.pNotifTab = n.dataset.t; F.upd(); },
    'p-notif': n => {
      const item = PD.notifications.find(x => x.id === n.dataset.id);
      if (!item) return;
      if (item.unread) { item.unread = false; F.upd(); F.toast('Marked as read', 'check'); }
      else F.toast('Opening this notification takes you to the visit — next batch', 'sparkle');
    },
    'p-read-all': () => {
      if (!unreadCount()) return F.toast('Nothing left to mark', 'check');
      PD.notifications.forEach(n => { n.unread = false; });
      F.upd();
      F.toast('All notifications marked as read', 'check');
    },

    'p-policy': n => { S.pPolicy = n.dataset.id; F.go('policy-text'); },

    'p-contact': n => {
      const c = PD.contact.find(x => x.id === n.dataset.id);
      const how = c.id === 'call' ? `Calling ${c.value}` : c.id === 'wa' ? `WhatsApp opens at ${c.value}` : `Your mail app opens at ${c.value}`;
      F.toast(`${how} — wired in the real app`, c.icon);
    },
    'p-subject': n => { S.pSubject = +n.dataset.i; F.upd(); },
    'p-send': () => {
      if (S.pSubject === undefined) return F.shake('.p-chips.pick');
      S.pSubject = undefined;
      F.upd();
      F.toast('Message sent — our team replies within 2 hours', 'check');
    },

    'p-lang': n => { S.pLang = n.dataset.id; F.upd(); },
    'p-save-lang': () => {
      F.go('profile-home', { dir: 'back' });
      setTimeout(() => F.toast(`App language set to ${langName()}`, 'globe'), 400);
    },

    'p-logout': () => F.openSheet('logout'),
    'p-signout': () => {
      F.closeSheet();
      F.go('phone', { dir: 'fade' });
      setTimeout(() => F.toast('Signed out', 'check'), 400);
    },
  });
})();
