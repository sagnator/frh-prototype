/* Final v39: booking card options for Bookings (S.v39card: a current, b, c, d). Every tab and state uses them.
   b  Date tile: a calm, compact row card; the date sits in a tile, the status is one coloured line.
      Mobbin: Beli (Your Reservations), Urban Company (My bookings), Nike Training Club (Scheduled).
   c  Live status first: the stage leads (On the way · arriving in 12 min) with a four-step bar, then who is coming.
      Mobbin: Instacart, DoorDash, Shopee (order tracking cards).
   d  Ticket with actions: a photo for the kind of visit, date and status on it, and the next actions as buttons.
      Mobbin: TheFork (Bookings), Tock (Reservations), GetYourGuide (Bookings).
   Tapping a card still opens the appointment; the chat button keeps its unread count and online dot. */
(function () {
  const F = window.FRH, S = F.S, { icon } = window.FRHI, A = F.APPT;
  if (!A || !F.apptCard) return;
  const esc = F.esc, img = n => `assets/img/${n}`;
  const base = F.apptCard;

  /* ---------- shared bits ---------- */
  const MON = d => d.toLocaleDateString('en-GB', { month: 'short' });
  function dparts(s) {
    const m = /^(\w{3})\w*\s+(\d{1,2})\s+(\w{3})/.exec(s || '');
    if (m) return { top: m[1], day: m[2], mon: m[3] };
    const d = new Date(Date.now() + (/^tom/i.test(s) ? 864e5 : 0));
    return { top: /^tom/i.test(s) ? 'Tmrw' : 'Today', day: d.getDate(), mon: MON(d) };
  }
  const first = n => String(n).split(' ')[0];
  const who = a => { const b = A.ext(a).blocks; return b.length === 1 ? `${b[0].p}${b[0].rel ? ` (${b[0].rel})` : ''}` : b.map(x => first(x.p)).join(' & '); };
  const avs = a => `<span class="v39-avs">${A.ext(a).blocks.slice(0, 3).map(b => A.av(b.p)).join('')}</span>`;
  const teamLine = a => { const t = A.team(a); return t.length ? (t.length === 1 ? `${t[0].name} · ${t[0].role}` : `${t[0].name} +${t.length - 1}`) : ''; };
  const mins = a => { const L = A.lv(a); return Math.max(1, Math.round((L.eta - A.now()) / 60000)); };
  const isNew = a => A.grp(a) === 'upcoming' && a.badge;
  const badge = a => isNew(a) ? `<span class="pill ${a.badge === 'NEW' ? 'red' : 'amber'}">${a.badge === 'NEW' ? 'New' : esc(a.badge)}</span>` : '';
  /* one status for every state: [label, tone] */
  function status(a) {
    const st = A.stage(a), L = A.grp(a) === 'upcoming' ? A.lv(a) : null;
    switch (st) {
      case 'unassigned': return ['Assigning your team', 'wait'];
      case 'assigned': return ['Team confirmed', 'ok'];
      case 'onway': return [`On the way · arriving ${A.hm(L.eta)}`, 'live'];
      case 'arrived': return ['Your team has arrived', 'ok'];
      case 'treating': return [`In treatment · done by ${A.hm(L.finishAt)}`, 'live'];
      case 'completed': return [A.rated(a) ? 'Completed · rated' : 'Completed · rate your visit', A.rated(a) ? 'done' : 'rate'];
      default: { const r = A.refundOf(a); return [r.plan ? `Cancelled · session returned to ${r.plan}` : r.none ? 'Cancelled · nothing charged' : `Cancelled · refund ${r.status === 'Refunded' ? 'sent' : 'processing'}`, 'off']; }
    }
  }
  const PHOTO = a => {
    const s = A.apptName(a);
    return /physio/i.test(s) ? 'onb-3.jpg' : /lab|test|blood|pcr/i.test(s) ? 'banner-3.jpg' : /nurs|vacc|iv|drip|nad/i.test(s) ? 'banner-2.jpg'
      : A.isTele(a) ? 'onb-2.jpg' : /doctor|gp|consult|paed/i.test(s) ? 'banner-1.jpg' : 'onb-1.jpg';
  };
  const open = a => `data-act="appt-open" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(A.apptName(a))}, ${esc(a.date)}"`;

  /* ---------- b · date tile ---------- */
  function cardB(a) {
    const g = A.grp(a), d = dparts(a.date), [lbl, tone] = status(a);
    return `<div class="appt v39b ${g}" ${open(a)}>
        <span class="v39b-date"><small>${esc(d.top)}</small><b>${esc(d.day)}</b><small>${esc(d.mon)}</small></span>
        <span class="v39b-mid">
          <span class="v39b-top"><b>${esc(A.apptName(a))}</b>${badge(a)}</span>
          <span class="v39b-time">${esc(a.time)} · ${esc(String(a.address || '').split(' · ')[0])}</span>
          <span class="v39b-who">${avs(a)}<span>${esc(who(a))}</span></span>
          <span class="v39-st ${tone}"><i></i>${lbl}</span>
        </span>
        <span class="v39b-end">${A.chatBtn(a)}</span>
      </div>`;
  }

  /* ---------- c · live status first ---------- */
  const STEPS = ['Booked', 'Team assigned', 'On the way', 'Arrived'];
  function cardC(a) {
    const g = A.grp(a), st = A.stage(a), t = A.team(a), [lbl, tone] = status(a), L = g === 'upcoming' ? A.lv(a) : null;
    const step = { unassigned: 0, assigned: 1, onway: 2, arrived: 3, treating: 4, completed: 4 }[st];
    const eyebrow = { unassigned: 'Assigning your team', assigned: 'Team confirmed', onway: 'On the way', arrived: 'Arrived', treating: 'In treatment', completed: 'Completed', cancelled: 'Cancelled' }[st];
    const live = st === 'onway' || st === 'arrived' || st === 'treating';
    const head = st === 'onway' ? `Arriving in ${mins(a)} min` : st === 'arrived' ? 'Your team is at the door' : st === 'treating' ? `Done by about ${A.hm(L.finishAt)}` : a.date;
    const right = st === 'onway' ? `<span class="v39c-eta"><b>${A.hm(L.eta).replace(/ (AM|PM)$/, '')}</b><small>${/PM$/.test(A.hm(L.eta)) ? 'PM' : 'AM'} ETA</small></span>` : badge(a);
    const bar = g === 'cancelled' ? '' : `<div class="v39c-bar ${g}">${STEPS.map((s, i) => `<span class="${i < step ? 'on' : i === step ? 'cur' : ''}"><i></i><small>${s}</small></span>`).join('')}</div>`;
    const person = t.length
      ? `<span class="v39c-team">${t.slice(0, 2).map(p => `<img src="${img(p.img)}" alt="">`).join('')}</span><span class="v39c-pm"><b>${esc(teamLine(a))}</b><small>${esc(A.apptName(a))} · ${esc(who(a))}</small></span>`
      : `<span class="v39c-team v39c-skel"><i></i></span><span class="v39c-pm"><b>${g === 'upcoming' ? 'Your team appears here soon' : esc(A.apptName(a))}</b><small>${esc(A.apptName(a))} · ${esc(who(a))}</small></span>`;
    return `<div class="appt v39c ${g} ${tone}" ${open(a)}>
        <div class="v39c-top"><span class="v39c-h"><small class="v39-st ${tone}"><i></i>${eyebrow}</small><b>${esc(head)}</b><span>${live ? `${esc(a.date)} · ` : ''}${esc(a.time)}</span></span>${right}</div>
        ${bar}
        ${g === 'cancelled' || (st === 'completed') ? `<p class="v39c-note ${tone}">${lbl.replace(/^(Completed|Cancelled) · /, '').replace(/^./, c => c.toUpperCase())}</p>` : ''}
        <div class="v39c-who">${person}${A.chatBtn(a)}</div>
      </div>`;
  }

  /* ---------- d · ticket with actions ---------- */
  const btn = (act, id, ic, label, pri) => `<button class="v39d-btn ${pri ? 'pri' : ''}" type="button" data-act="${act}" data-id="${id}">${icon(ic, 15, 2.2)} ${label}</button>`;
  function actions(a) {
    const g = A.grp(a), st = A.stage(a), id = a.id;
    if (g === 'completed') return (A.rated(a) ? btn('v39-open', id, 'file', 'Reports', false) : btn('v39-rate', id, 'starFill', 'Rate visit', true)) + btn('v39-again', id, 'refresh', 'Book again', !!A.rated(a));
    if (g === 'cancelled') return btn('v39-open', id, 'card', 'Refund details', false) + btn('v39-again', id, 'refresh', 'Book again', true);
    if (A.moving(a)) return btn('v39-open', id, st === 'onway' ? 'nav' : 'eye', st === 'onway' ? 'Track live' : 'Open visit', true) + btn('v39-chat', id, 'chat', 'Chat', false);
    return btn('v39-time', id, 'calendar', 'Reschedule', false) + btn('v39-open', id, 'eye', 'Details', true);
  }
  function cardD(a) {
    const g = A.grp(a), [lbl, tone] = status(a), t = A.team(a);
    return `<div class="appt v39d ${g}" ${open(a)}>
        <div class="v39d-ph"><img src="${img(PHOTO(a))}" alt="">
          <span class="v39d-chip v39-st ${tone}"><i></i>${lbl.split(' · ')[0]}</span>${badge(a) ? `<span class="v39d-badge">${badge(a)}</span>` : ''}
          <span class="v39d-when">${icon('calendar', 13, 2.2)} ${esc(a.date)} · ${esc(a.time)}</span></div>
        <div class="v39d-body">
          <span class="v39d-t"><b>${esc(A.apptName(a))}</b>${A.chatBtn(a)}</span>
          <span class="v39d-l">${icon('users', 14, 2.2)}<span>${esc(who(a))}</span></span>
          ${t.length ? `<span class="v39d-l"><img src="${img(t[0].img)}" alt=""><span>${esc(teamLine(a))}</span></span>` : g === 'upcoming' ? `<span class="v39d-l">${icon('clock', 14, 2.2)}<span>Your team is confirmed soon</span></span>` : ''}
          <span class="v39d-l">${icon(A.isTele(a) ? 'video' : 'pin', 14, 2.2)}<span>${esc(a.address)}</span></span>
          ${lbl.includes(' · ') ? `<span class="v39d-note v39-st ${tone}"><i></i>${lbl.split(' · ').slice(1).join(' · ').replace(/^./, c => c.toUpperCase())}</span>` : ''}
          <div class="v39d-acts">${actions(a)}</div>
        </div>
      </div>`;
  }

  F.apptCard = (a, x) => { const m = S.v39card || 'a'; return m === 'b' ? cardB(a) : m === 'c' ? cardC(a) : m === 'd' ? cardD(a) : base(a, x); };

  const pick = (n, e) => { if (e) e.stopPropagation(); S.apptId = n.dataset.id; };
  Object.assign(F.ACT, {
    'v39-open': (n, e) => { pick(n, e); F.openAppt(n.dataset.id); },
    'v39-chat': (n, e) => { pick(n, e); F.ACT['t-chat'](n, e); },
    'v39-time': (n, e) => { pick(n, e); F.ACT['t-edit-time'](); },
    'v39-again': (n, e) => { pick(n, e); F.ACT['t-again'](); },
    'v39-rate': (n, e) => { pick(n, e); if (F.SHEETS['v30-rate']) F.openSheet('v30-rate'); else F.openAppt(n.dataset.id); },
  });
})();
