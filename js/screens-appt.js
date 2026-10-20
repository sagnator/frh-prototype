/* FRH prototype — flow 6: appointments, live tracking, booking details, reschedule, cancel. */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S, D = window.FRHDATA;
  const img = n => `assets/img/${n}`;
  const aed = n => 'AED ' + Number(n).toLocaleString('en-US');
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const whenTxt = d => (/^in /.test(d) ? d : 'on ' + d);
  const soon = m => `data-act="soon" data-msg="${m}"`;
  const navBar = (title, right = '') => `<div class="nav"><button class="nav-btn" type="button" data-act="appts" aria-label="Back">${icon('arrowLeft', 20, 2)}</button><span class="nav-title">${title}</span>${right || '<span style="width:40px"></span>'}</div>`;

  const ALL = () => [...D.appointments.upcoming, ...D.appointments.completed, ...D.appointments.cancelled];
  const current = () => ALL().find(a => a.id === S.apptId) || D.appointments.upcoming[0];

  /* ---------- shared appointment card ---------- */
  F.apptCard = (a, compact) => {
    const st = a.status;
    const statusPill = st === 'ongoing' ? '<span class="pill green live"><i></i>On the way</span>'
      : st === 'confirmed' ? '<span class="pill ink">Confirmed</span>'
      : st === 'completed' ? '<span class="pill green">Completed</span>'
      : '<span class="pill ink">Cancelled</span>';
    const foot = st === 'ongoing'
      ? `<button class="mini-btn" type="button" data-act="track" data-id="${a.id}">${icon('nav', 14, 2.2)} Track your team</button>
         <button class="icon-btn" type="button" data-act="msg-team" data-id="${a.id}" aria-label="Message the team">${icon('chat', 18, 1.9)}</button>`
      : st === 'confirmed'
      ? `<button class="mini-btn ghost" type="button" data-act="edit" data-id="${a.id}">${icon('edit', 14, 2.2)} Reschedule</button>
         <button class="mini-btn ghost" type="button" data-act="cancel" data-id="${a.id}">Cancel</button>
         <button class="icon-btn" type="button" data-act="msg-team" data-id="${a.id}" aria-label="Message the team">${icon('chat', 18, 1.9)}</button>`
      : st === 'completed'
      ? `<button class="mini-btn ghost" type="button" data-act="appt-open" data-id="${a.id}">View details</button>
         ${a.rated ? `<span class="pill amber">${icon('starFill', 12)} You rated ${a.rated}.0</span>` : `<button class="mini-btn" type="button" data-act="rate-open" data-id="${a.id}">Rate visit</button>`}`
      : `<button class="mini-btn ghost" type="button" data-act="goto" data-id="cats">Book again</button>`;
    return `<div class="appt" data-act="appt-open" data-id="${a.id}" role="button" tabindex="0">
        <div class="appt-top">
          <span class="appt-when">${icon('clock', 15, 2.2)} ${a.date} · ${a.time}</span>
          ${a.badge ? `<span class="pill ${a.badge === 'NEW' ? 'red' : 'amber'}">${a.badge}</span>` : ''}
          ${statusPill}
        </div>
        <h4>${a.service}</h4>
        <div class="who">${a.sub}<br>${a.patients.map(p => `<b>${p}</b>`).join(' · ')}</div>
        ${compact ? '' : `<div class="appt-meta">${icon('pin', 14, 2.2)} ${a.address}</div>`}
        ${a.tracking ? `<div class="appt-live"><i></i>Team is on the way · arriving ${D.tracking.eta}</div>` : ''}
        ${a.refund ? `<div class="appt-meta">${icon('card', 14, 2.2)} ${aed(a.refund.amount)} ${a.refund.status.toLowerCase()} ${whenTxt(a.refund.date)}</div>` : ''}
        <div class="appt-foot">${foot}</div>
      </div>`;
  };

  /* ================= 6.1 My appointments ================= */
  const emptyState = tab => `<div class="empty-state"><div class="es-ic">${icon('calendar', 30, 1.8)}</div>
      <b>No ${tab} appointments</b><span>${tab === 'upcoming' ? 'Book a visit and it will appear here, with live tracking on the day.' : `Your ${tab} visits will be listed here.`}</span></div>`;

  F.SCREENS.appts = {
    status: 'dark', cls: 'appts',
    render() {
      const tab = S.apptTab || 'upcoming';
      const list = D.appointments[tab] || [];
      return `<div class="nav"><span class="nav-title" style="padding-left:4px">My appointments</span>
          <button class="icon-btn" type="button" ${soon('Calendar view is in a later batch')} aria-label="Calendar">${icon('calendar', 19, 1.9)}</button></div>
        <div class="scr-body">
          <div class="seg-tabs">${['upcoming', 'completed', 'cancelled'].map(t => {
            const n = (D.appointments[t] || []).length;
            return `<button type="button" data-act="appt-tab" data-t="${t}" class="${t === tab ? 'on' : ''}">${cap(t)}${n ? ` (${n})` : ''}</button>`;
          }).join('')}</div>
          <div style="margin-top:14px">${list.length ? list.map(a => F.apptCard(a)).join('') : emptyState(tab)}</div>
        </div>
        ${F.tabbar('appts')}`;
    },
  };

  /* ================= 6.2 Track your team ================= */
  const MAP = `<svg viewBox="0 0 393 290" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="393" height="290" fill="#EDE8DF"/>
      <g fill="#E4DFD3"><rect x="8" y="14" width="120" height="84" rx="6"/><rect x="150" y="6" width="96" height="70" rx="6"/><rect x="268" y="22" width="110" height="76" rx="6"/>
        <rect x="16" y="130" width="104" height="70" rx="6"/><rect x="264" y="132" width="112" height="86" rx="6"/><rect x="30" y="232" width="120" height="58" rx="6"/><rect x="196" y="238" width="150" height="56" rx="6"/></g>
      <rect x="150" y="120" width="92" height="82" rx="8" fill="#DCE8CE"/>
      <g stroke="#fff" stroke-linecap="round"><path d="M-10 112h420" stroke-width="16"/><path d="M-10 222h420" stroke-width="12"/><path d="M138 -10v310" stroke-width="14"/><path d="M256 -10v310" stroke-width="10"/></g>
      <g stroke="#F2EBDF" stroke-width="2" stroke-dasharray="6 8"><path d="M-10 112h420"/><path d="M138 -10v310"/></g>
      <path d="M62 196 C 96 196 118 174 118 148 C 118 116 152 92 200 92 L 304 92" fill="none" stroke="#D71F32" stroke-width="5" stroke-linecap="round" opacity=".92"/>
      <circle cx="62" cy="196" r="5" fill="#D71F32"/>
    </svg>`;

  F.SCREENS.track = {
    status: 'dark', cls: 'track',
    render() {
      const t = D.tracking, a = current();
      return `${navBar('Track your team', `<button class="icon-btn" type="button" ${soon('Support chat is flow 7 — next batch')} aria-label="Help">${icon('headset', 19, 1.9)}</button>`)}
        <div class="scr-body">
          <div class="map">${MAP}
            <div class="map-pin" style="left:78%;top:32%"><span class="ping"></span><img src="${img(t.team[0].img)}" alt=""></div>
            <div class="map-pin dest" style="left:16%;top:67%">${icon('home', 17, 2.2)}</div>
            <div class="map-eta"><span class="tile">${icon('nav', 19, 2)}</span>
              <div style="flex:1"><b>Arriving ${t.eta}</b><small>${t.distance} · about ${t.minutes} min away</small></div>
              <span class="pill green live"><i></i>Live</span></div>
          </div>
          <div class="track-steps">${t.steps.map((_, i) => `<i class="${i < t.step ? 'done' : i === t.step ? 'now' : ''}"></i>`).join('')}</div>
          <div class="track-labels">${t.steps.map((s, i) => i === t.step ? `<b>${s}</b>` : `<span>${s}</span>`).join('')}</div>

          <div class="info-card">
            <div class="info-row"><span class="tile">${icon('file', 17, 2)}</span><div class="ir-mid"><b>Booking ${t.id}</b><small>${a.service} · ${a.date}, ${a.time}</small></div></div>
            <div class="info-row"><span class="tile">${icon('users', 17, 2)}</span><div class="ir-mid"><b>${a.patients.length} patients</b><small>${a.patients.join(' · ')}</small></div></div>
            <div class="info-row"><span class="tile">${icon('pin', 17, 2)}</span><div class="ir-mid"><b>${t.destination}</b><small>${t.note}</small></div></div>
          </div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>Your team</h4><span class="pill green">DHA licensed</span></div>
          <div class="info-card">${t.team.map(m => `
            <div class="info-row" ${soon('Team member profiles are screen 3.5 — next batch')} style="cursor:pointer">
              <img src="${img(m.img)}" alt=""><div class="ir-mid"><b>${m.name}${m.lead ? ' <span class="pill red">Lead</span>' : ''}</b><small>${m.role}</small></div>${icon('chevRight', 17, 2.2)}</div>`).join('')}</div>

          <div class="acc" id="accSummary"><button class="acc-head" type="button" data-act="acc" data-t="accSummary"><b>Booking summary</b><span class="price">${aed(t.summary.total)}</span>${icon('chevDown', 18, 2.2)}</button>
            <div class="acc-body">
              <div class="sum-line"><span>${t.summary.service} · ${t.summary.patients} patients</span><span>${aed(t.summary.subtotal)}</span></div>
              <div class="sum-line"><span>VAT (5%)</span><span>${aed(t.summary.vat)}</span></div>
              <div class="sum-line total"><span>Total paid</span><span>${aed(t.summary.total)}</span></div>
              <div class="flag-note">${icon('alert', 14, 2.2)}<span>${t.summary.night}</span></div>
            </div></div>
        </div>
        <div class="scr-foot"><div class="stack"><button class="btn btn-primary" type="button" ${soon('Calling the team is wired to the real app')}>${icon('phone', 18, 2)} Call the team</button>
          <button class="btn btn-secondary" type="button" ${soon('HealthAssist chat is flow 7 — next batch')}>${icon('chat', 18, 2)} Message</button></div></div>`;
    },
  };

  /* ================= 6.3 / 6.7 Booking details ================= */
  F.SCREENS.visit = {
    status: 'dark', cls: 'visit',
    render() {
      const a = current(), v = D.visit, done = a.status === 'completed';
      const acc = (id, title, meta, body) => `<div class="acc" id="${id}"><button class="acc-head" type="button" data-act="acc" data-t="${id}"><b>${title}</b>${meta ? `<span class="pill ink">${meta}</span>` : ''}${icon('chevDown', 18, 2.2)}</button><div class="acc-body">${body}</div></div>`;
      return `${navBar(done ? 'Visit details' : 'Booking details', `<button class="icon-btn" type="button" ${soon('Sharing is wired in the real app')} aria-label="Share">${icon('share', 18, 1.9)}</button>`)}
        <div class="scr-body">
          <div class="appt-top" style="margin-bottom:12px">${done ? '<span class="pill green">Completed</span>' : '<span class="pill ink">Confirmed</span>'}<span class="pill ink">${a.id}</span></div>
          <h1 class="h1" style="font-size:24px">${a.service}</h1>
          <p class="lead" style="margin-top:6px">${a.date} · ${a.time}</p>

          <div class="info-card">
            <div class="info-row"><span class="tile">${icon('users', 17, 2)}</span><div class="ir-mid"><b>${a.patients.join(', ')}</b><small>${a.sub}</small></div></div>
            <div class="info-row"><span class="tile">${icon('pin', 17, 2)}</span><div class="ir-mid"><b>${a.address}</b><small>Dubai, UAE</small></div></div>
            <div class="info-row"><span class="tile">${icon('card', 17, 2)}</span><div class="ir-mid"><b>${aed(a.total)} paid</b><small>Card ending 4242 · VAT included</small></div></div>
          </div>

          <div class="sec-h" style="margin:22px 0 10px"><h4>In this visit</h4></div>
          ${v.sessions.map(s => `<div class="info-card"><div class="info-row"><span class="tile">${icon('stetho', 17, 2)}</span><div class="ir-mid"><b>${s.name}</b><small>${s.time}</small></div></div>
            <div class="info-row"><span class="tile">${icon('file', 17, 2)}</span><div class="ir-mid"><b>Reason for visit</b><small>${s.issue}</small></div></div>
            <div class="info-row"><img src="${img('doc-3.jpg')}" alt=""><div class="ir-mid"><b>${s.clinician}</b><small>Senior Nurse · DHA licensed</small></div></div></div>`).join('')}

          ${done ? `
          <div class="sec-h" style="margin:22px 0 10px"><h4>Records</h4></div>
          ${acc('accReports', 'Reports', `${v.reports.length} files`, v.reports.map(r => `<div class="doc-line"><span class="tile">${icon('file', 16, 2)}</span><div style="flex:1"><b>${r.name}</b><small>${r.size} · ${r.date}</small></div><button class="icon-btn" type="button" ${soon('Downloads are wired in the real app')} aria-label="Download">${icon('download', 17, 2)}</button></div>`).join(''))}
          ${acc('accRx', 'Doctor’s prescription', `${v.prescription.length} items`, v.prescription.map(p => `<div class="doc-line"><span class="tile">${icon('syringe', 16, 2)}</span><div style="flex:1"><b>${p.name}</b><small>${p.dose}</small></div></div>`).join(''))}
          ${acc('accNotes', 'Doctor’s notes', '', `<p style="margin:0">${v.notes}</p>`)}

          <div class="rate-box"><b>Rate your clinician</b><span>How was your visit with ${v.sessions[0].clinician}?</span>
            <div class="stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-act="rate-star" data-v="${i}" class="${(S.rating || a.rated || 0) >= i ? 'on' : ''}" aria-label="${i} stars">${icon('starFill', 30)}</button>`).join('')}</div>
            <div class="rate-input">${S.rating >= 4 ? 'What went well? (optional)' : S.rating ? 'Tell us what we can improve (optional)' : 'Tap a star, then add a comment (optional)'}</div>
            <button class="btn btn-primary ${S.rating ? '' : 'off'}" type="button" data-act="submit-rating" style="margin-top:14px">Submit feedback</button></div>`
          : `<div class="stack" style="margin-top:22px"><button class="btn btn-secondary" type="button" data-act="edit" data-id="${a.id}">${icon('edit', 18, 2)} Reschedule appointment</button>
             <button class="btn btn-ghost" type="button" data-act="cancel" data-id="${a.id}">Cancel appointment</button></div>`}
        </div>`;
    },
  };

  /* ================= 6.4 Reschedule ================= */
  const DAYS = () => {
    const out = [], now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getTime() + i * 864e5);
      out.push({ k: i, top: i === 0 ? 'Today' : i === 1 ? 'Tom' : d.toLocaleDateString('en-US', { weekday: 'short' }), n: d.getDate(), m: d.toLocaleDateString('en-US', { month: 'short' }) });
    }
    return out;
  };
  const SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'];

  F.SCREENS['edit-appt'] = {
    status: 'dark', cls: 'edit-appt',
    render() {
      const a = current();
      return `${navBar('Reschedule')}
        <div class="scr-body">
          <p class="lead" style="margin-top:0">Pick a new slot for <b>${a.service}</b>. Your clinician and price stay the same.</p>
          <div class="sec-h" style="margin:20px 0 10px"><h4>Choose a date</h4></div>
          <div class="hrow">${DAYS().map(d => `<button class="date-chip ${S.editDate === d.k ? 'on' : ''}" type="button" data-act="pick-date" data-k="${d.k}"><small>${d.top}</small><b>${d.n}</b><span>${d.m}</span></button>`).join('')}</div>
          <div class="sec-h" style="margin:22px 0 10px"><h4>Choose a time</h4></div>
          <div class="time-grid">${SLOTS.map((t, i) => `<button class="slot ${S.editTime === t ? 'on' : ''} ${i === 3 ? 'full' : ''}" type="button" ${i === 3 ? 'disabled' : `data-act="pick-time" data-t="${t}"`}>${t}${i === 3 ? '<small>Full</small>' : ''}</button>`).join('')}</div>
          <div class="flag-note" style="margin-top:18px">${icon('alert', 14, 2.2)}<span>Free to reschedule up to 4 hours before the visit. The cut-off and any fee are placeholders for FRH to confirm.</span></div>
        </div>
        <div class="scr-foot"><button class="btn btn-primary ${S.editDate !== undefined && S.editTime ? '' : 'off'}" type="button" data-act="save-edit">Save changes</button></div>`;
    },
  };

  /* ================= 6.5 Cancel ================= */
  F.SCREENS['cancel-appt'] = {
    status: 'dark', cls: 'cancel-appt',
    render() {
      const a = current();
      return `${navBar('Cancel appointment')}
        <div class="scr-body">
          <div class="appt" style="cursor:default">
            <div class="appt-top"><span class="appt-when">${icon('clock', 15, 2.2)} ${a.date} · ${a.time}</span><span class="pill ink">${a.id}</span></div>
            <h4>${a.service}</h4><div class="who">${a.patients.join(' · ')}</div>
          </div>
          <div class="sec-h" style="margin:22px 0 4px"><h4>Why are you cancelling?</h4></div>
          <p class="sec-sub">Optional, but it helps FRH improve.</p>
          ${D.cancelReasons.map((r, i) => `<button class="reason ${S.cancelReason === i ? 'on' : ''}" type="button" data-act="pick-reason" data-i="${i}"><span class="radio"></span>${r}</button>`).join('')}
          <div class="refund-card"><div class="rc-top">${icon('card', 18, 2)}<b>You’ll be refunded ${aed(a.total)}</b></div>
            <div class="sum-line" style="margin-top:8px"><span>Paid on card ending 4242</span><span>${aed(a.total)}</span></div>
            <div class="sum-line"><span>Cancellation fee</span><span>AED 0</span></div>
            <div class="sum-line total"><span>Refund</span><span>${aed(a.total)}</span></div></div>
          <div class="flag-note" style="margin-top:12px">${icon('alert', 14, 2.2)}<span>Free cancellation up to 4 hours before the visit — FRH to confirm the window and any fee after that.</span></div>
        </div>
        <div class="scr-foot"><div class="stack">
          <button class="btn btn-primary" type="button" data-act="do-cancel">Cancel appointment</button>
          <button class="btn btn-ghost" type="button" data-act="appts">Keep my appointment</button></div></div>`;
    },
  };

  /* ================= 6.6 Cancelled ================= */
  F.SCREENS.cancelled = {
    status: 'dark', cls: 'success',
    render() {
      const a = current(), r = a.refund || { amount: a.total, status: 'Processing', date: 'in 5–7 working days' };
      return `<div class="scr-body">
          <div class="ok-badge"><svg viewBox="0 0 116 116"><circle class="cir" cx="58" cy="58" r="54" fill="#12805A"/><path class="chk" d="M38 59l13 13 27-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <h1 class="h1">Appointment cancelled</h1>
          <p class="lead">Booking <b>${a.id}</b> is cancelled. We’ve started your refund.</p>
          <div class="info-card" style="text-align:left">
            <div class="info-row"><span class="tile">${icon('stetho', 17, 2)}</span><div class="ir-mid"><b>${a.service}</b><small>${a.date} · ${a.time}</small></div></div>
            <div class="info-row"><span class="tile">${icon('users', 17, 2)}</span><div class="ir-mid"><b>${a.patients.join(', ')}</b><small>${a.address}</small></div></div>
          </div>
          <div class="refund-card" style="text-align:left"><div class="rc-top">${icon('card', 18, 2)}<b>Refund ${aed(r.amount)}</b><span class="pill green" style="margin-left:auto">${r.status}</span></div>
            <div class="sum-line" style="margin-top:8px"><span>Refund method</span><span>Card ending 4242</span></div>
            <div class="sum-line"><span>Expected</span><span>${whenTxt(r.date)}</span></div>
            <div class="sum-line"><span>Reference</span><span>${a.id}-R</span></div></div>
          <p class="sec-sub" style="margin-top:14px;text-align:left">Refunds usually reach your bank in 5–7 working days. You’ll get a WhatsApp message as soon as it lands.</p>
        </div>
        <div class="scr-foot"><div class="stack"><button class="btn btn-primary" type="button" data-act="appts">Back to appointments</button>
          <button class="btn btn-ghost" type="button" data-act="goto" data-id="cats">Book again</button></div></div>`;
    },
  };

  /* ================= actions ================= */
  const pick = n => { S.apptId = n.dataset.id || S.apptId; };
  Object.assign(F.ACT, {
    appts: () => { S.rating = 0; F.go('appts', { dir: 'back' }); },
    'appt-tab': n => { S.apptTab = n.dataset.t; F.upd(); },
    'appt-open': n => {
      pick(n);
      const a = current();
      if (a.status === 'ongoing') F.go('track');
      else if (a.status === 'cancelled') F.go('cancelled');
      else F.go('visit');
    },
    track: n => { pick(n); F.go('track'); },
    'msg-team': n => {
      pick(n);
      const a = current(), k = /physio/i.test(a.service) ? 'physio' : /dent/i.test(a.service) ? 'dentist' : 'doctor';
      if (F.openDirectChat) { F.openDirectChat(k, a.id); F.go('chat'); } else F.toast('Chat is loading', 'chat');
    },
    edit: n => { pick(n); S.editDate = undefined; S.editTime = ''; F.go('edit-appt'); },
    cancel: n => { pick(n); S.cancelReason = undefined; F.go('cancel-appt'); },
    'rate-open': n => { pick(n); S.rating = 0; F.go('visit'); },
    acc: n => { const box = document.getElementById(n.dataset.t); if (box) box.classList.toggle('open'); },
    'rate-star': n => { S.rating = +n.dataset.v; F.upd(); },
    'submit-rating': () => {
      if (!S.rating) return F.shake('.stars');
      const a = current(); a.rated = S.rating; S.rating = 0;
      F.go('appts', { dir: 'back' });
      setTimeout(() => F.toast('Thanks — your feedback was sent', 'check'), 400);
    },
    'pick-date': n => { S.editDate = +n.dataset.k; F.upd(); },
    'pick-time': n => { S.editTime = n.dataset.t; F.upd(); },
    'save-edit': () => {
      if (S.editDate === undefined || !S.editTime) return F.shake('.time-grid');
      const a = current(), d = DAYS()[S.editDate];
      a.date = d.k === 0 ? 'Today' : d.k === 1 ? 'Tomorrow' : `${d.top} ${d.n} ${d.m}`;
      a.time = S.editTime;
      a.badge = 'Rescheduled';
      F.go('appts', { dir: 'back' });
      setTimeout(() => F.toast(`Moved to ${a.date}, ${a.time}`, 'check'), 400);
    },
    'pick-reason': n => { S.cancelReason = +n.dataset.i; F.upd(); },
    'do-cancel': () => {
      const a = current(), i = D.appointments.upcoming.findIndex(x => x.id === a.id);
      if (i > -1) {
        const [gone] = D.appointments.upcoming.splice(i, 1);
        gone.status = 'cancelled'; gone.statusLabel = 'Cancelled'; gone.badge = ''; gone.tracking = false;
        gone.refund = { amount: gone.total, status: 'Processing', date: 'in 5–7 working days' };
        D.appointments.cancelled.unshift(gone);
      }
      S.apptTab = 'cancelled';
      F.go('cancelled', { dir: 'fade' });
    },
  });
})();
