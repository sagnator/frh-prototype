/* FRH Final v7 — “Hers” theme: the few markup tweaks the stylesheet cannot do on its own.
   Visual only: no new flows, data or actions. Loaded after dev-member.js, before panel.js.

   Home · status tracker card (Hers “A provider is reviewing your treatment request”):
   while a visit is live (team on the way, arrived or treating) a card sits under the
   greeting with the clinician photo on the right and a 4-step bar
   Booked → Team assigned → On the way → Arrived. It replaces the old live box in
   “Upcoming visits” and opens the same appointment details (data-act="hx-appt"). */
(function () {
  const F = window.FRH, S = F.S, D = window.FRHDATA;
  const { icon } = window.FRHI;
  const H = F.SCREENS.home;
  if (!H || H._hh) return;
  H._hh = true;

  const esc = s => F.esc ? F.esc(s) : String(s);
  const img = n => `assets/img/${n}`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const LIVE = ['onway', 'arrived', 'treating'];
  const STEPS = (D.tracking && D.tracking.steps && D.tracking.steps.length === 4) ? D.tracking.steps : ['Booked', 'Team assigned', 'On the way', 'Arrived'];
  const STEP = { onway: 2, arrived: 3, treating: 3 };
  /* label anchors on the bar: first label left-aligned, middle two centred, last right-aligned */
  const AT = [0, 37.5, 62.5, 100];
  const TRAVEL_MIN = 16;   // the demo team’s drive time (dev-appt.js)

  const statusOf = a => { try { return F.apptStatus ? F.apptStatus(a.id) : null; } catch (e) { return null; } };
  function liveVisits() {
    if (S.guest || !D.appointments) return [];
    return (D.appointments.upcoming || []).map(a => ({ a, st: statusOf(a) })).filter(x => x.st && LIVE.includes(x.st.stage));
  }
  const first = n => /^Dr\.?\s/.test(n) ? n.split(/\s+/).slice(0, 2).join(' ') : n.split(/\s+/)[0];
  const andJoin = xs => xs.length < 2 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  const svcIcon = s => /physio/i.test(s) ? 'physio' : /lab|test/i.test(s) ? 'lab' : /iv|drip|nad/i.test(s) ? 'drip' : /vacc/i.test(s) ? 'syringe' : /tele|video/i.test(s) ? 'video' : 'stetho';

  function card({ a, st }) {
    const t = D.tracking && D.tracking.id === a.id ? D.tracking : null;
    const lead = t && t.team && t.team[0];
    const names = (st.team && st.team.length ? st.team : (t && t.team ? t.team.map(p => p.name) : [])).map(first);
    const who = andJoin(names);
    const many = names.length > 1;
    const eta = st.eta || (t && t.eta) || '';
    /* the status words carry the accent, like Hers’ highlighted headings */
    const [lead0, hi] = st.stage === 'onway' ? [`${who || 'Your care team'} ${who && !many ? 'is' : 'are'} `, 'on the way']
      : st.stage === 'arrived' ? [`${who || 'Your care team'} ${who && !many ? 'has' : 'have'} `, 'arrived']
      : ['Treatment ', 'in progress'];
    const title = lead0 + hi;
    const sub = `${esc(a.service)} · ${st.stage === 'onway' ? `arriving ${esc(eta || 'soon')}` : st.stage === 'arrived' ? 'at your door now' : 'with you now'}`;
    const idx = STEP[st.stage];
    const part = st.stage === 'onway' ? Math.min(.92, Math.max(.1, 1 - (st.etaMin || TRAVEL_MIN / 2) / TRAVEL_MIN)) : 0;
    const fill = idx >= 3 ? 100 : AT[idx] + (AT[idx + 1] - AT[idx]) * part;
    const foot = st.stage === 'onway' ? `${icon('clock', 15, 2.2)}<span>${st.etaMin ? `Arriving in ${st.etaMin} min` : 'On the way to you'}</span>`
      : st.stage === 'arrived' ? `${icon('home', 15, 2.2)}<span>${esc(String(a.address || '').split(' · ').pop() || 'At your door')}</span>`
      : `${icon('heartPulse', 15, 2.2)}<span>${esc((a.patients || []).length > 1 ? `${a.patients.length} patients` : 'Your visit')} · in progress</span>`;
    return `<button class="hh-track" type="button" data-act="hx-appt" data-id="${esc(a.id)}" aria-label="${esc(title)}. ${esc(STEPS[idx])}. Open the visit">
        <span class="hh-track-top">
          <span class="hh-track-t"><small class="hh-track-k"><i></i>Live · ${esc(a.date || 'Today')}</small><b>${esc(lead0)}<em>${esc(hi)}</em></b><span class="hh-track-s">${sub}</span></span>
          <span class="hh-track-th">${lead && lead.img ? `<img src="${img(lead.img)}" alt="">` : icon(svcIcon(a.service), 24, 1.9)}</span>
        </span>
        <span class="hh-track-bar" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${idx + 1}" aria-valuetext="${esc(STEPS[idx])}"><i style="width:${fill.toFixed(1)}%"></i></span>
        <span class="hh-track-lbl">${STEPS.map((s, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${esc(s)}</span>`).join('')}</span>
        <span class="hh-track-foot">${foot ? `<span>${foot}</span>` : '<span></span>'}<span class="hh-track-go">${st.stage === 'onway' ? 'Track live' : 'Open visit'}${icon('chevRight', 16, 2.4)}</span></span>
      </button>`;
  }

  const r0 = H.render, u0 = H.update;
  H.render = function () {
    const h = r0.apply(this, arguments);
    return h.replace('<div class="hx-hdr-w"></div>', '<div class="hx-hdr-w"></div><div class="hh-track-w"></div>');
  };
  H.update = function (n) {
    if (u0) u0.apply(this, arguments);
    if (!n) return;
    const live = liveVisits();
    setHTML(n.querySelector('.hh-track-w'), live.map(card).join(''));
    /* the live visit now lives in the tracker: drop its old box / card from “Upcoming visits” */
    const vw = n.querySelector('.hx-visits-w');
    if (!vw) return;
    vw.querySelectorAll('.h-live').forEach(x => x.remove());
    live.forEach(({ a }) => vw.querySelectorAll('.hx-vcard').forEach(c => { if (c.dataset.id === a.id) c.remove(); }));
    const sec = vw.querySelector('.hx-visits');
    if (sec) sec.classList.toggle('hh-none', !sec.querySelector('.hx-vcard'));
  };
})();
