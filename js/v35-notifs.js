/* Final v35: three new Notifications layouts to compare with the current list (S.v35n: a current, b, c, d).
   b  Now + actions: the visit happening now as a dark live card, then one card per update with one clear next step.
      Mobbin: Grab (Activity), Revolut Business (Inbox), Cleo AI (Alerts).
   c  By visit: updates bundled under the visit they are about, with its status; offers on their own tab.
      Mobbin: Spark Mail (smart inbox), Alan (care events), Cleo AI (Promotions / Alerts).
   d  Catch-up + timeline: a plain-language summary of what is new and what to do, then a dated timeline.
      Mobbin: Fi (Timeline), Swarm.
   Same data (F.HXDATA.notifs) and the same row action as A: hx-notif opens what it is about and marks it read. */
(function () {
  const F = window.FRH, S = F.S, { icon } = window.FRHI;
  const HX = F.HXDATA, D = window.FRHDATA || {};
  const scr = F.SCREENS.notifs;
  if (!scr || !HX) return;
  const esc = F.esc, img = n => `assets/img/${n}`;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const isUn = n => n.unread && !(S.hxRead || {})[n.id];
  const list = () => (S.guest || S.hxNotifEmpty ? [] : HX.notifs);
  const T = k => HX.ntypes[k] || HX.ntypes.book;
  const tile = (n, s = 18) => `<span class="tile ${T(n.t).tint}">${icon(T(n.t).ic, s, 2)}</span>`;
  const TOOTH = '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5.6c-1.6-1.4-3.6-2-5.2-1.2C4.6 5.5 4.2 8.3 5 11c.6 2 .9 3.8 1.2 6 .3 2.2 1.1 3.5 2.1 3.5 1.2 0 1.5-1.5 1.8-3.3.2-1.2.6-2.2 1.9-2.2s1.7 1 1.9 2.2c.3 1.8.6 3.3 1.8 3.3 1 0 1.8-1.3 2.1-3.5.3-2.2.6-4 1.2-6 .8-2.7.4-5.5-1.8-6.6-1.6-.8-3.6-.2-5.2 1.2z"/></svg>';

  /* one clear next step per update (b) */
  const ACTION = { n1: ['Track live', 'nav'], n2: ['Reply', 'chat'], n3: ['View booking', 'calendar'], n4: ['See new time', 'clock'], n5: ['Book a package', 'arrowRight'], n6: ['View results', 'file'], n7: ['View prescription', 'file'], n8: ['View refund', 'card'] };
  /* the visit each update is about (c) */
  const VISIT = { n1: 'FRH-24817', n2: 'FRH-24817', n3: 'FRH-24817', n4: 'FRH-24790', n6: 'FRH-24512', n7: 'FRH-24512', n8: 'FRH-24201' };
  const VPILL = { 'FRH-24790': ['Moved', 'a'], 'FRH-24512': ['2 records', 'v'], 'FRH-24201': ['Refunded', 'n'] };
  /* what the catch-up says for each unread update (d) */
  const SUM = {
    n1: () => liveSt() === 'onway' ? `Dr. Layla Haddad is <b>${(D.tracking || {}).minutes || 12} minutes away</b>` : 'Your care team is with you',
    n2: (prev) => prev ? 'sent you a message' : 'Dr. Layla Haddad sent you a message',
    n4: () => 'Fatima’s physiotherapy <b>moved to Thu 1 Oct, 10:00 AM</b>',
  };

  const appts = () => { const A = D.appointments || {}; return [].concat(A.upcoming || [], A.completed || [], A.cancelled || []); };
  const appt = id => appts().find(a => a.id === id);
  const LIVE = { onway: 'On the way', arrived: 'Arrived', treating: 'In progress' };
  const liveId = () => (D.tracking || {}).id;
  const liveSt = () => { const a = appt(liveId()); if (!a) return null; const st = (S.tTrack && S.tTrack[a.id]) || (a.tracking ? 'onway' : null); return LIVE[st] ? st : null; };
  const firstNames = a => (a.patients || []).map(p => p.replace(/\s*\(.*\)/, '').split(' ')[0]).join(' & ');
  const svcIc = name => /dent/i.test(name) ? TOOTH : icon(/physio/i.test(name) ? 'physio' : /lab/i.test(name) ? 'lab' : /iv|drip/i.test(name) ? 'drip' : 'stetho', 20, 2);

  /* ---------- the live card (b) ---------- */
  function nowCard() {
    const st = liveSt(); if (!st) return '';
    const a = appt(liveId()), t = D.tracking || {}, lead = (t.team || [])[0];
    const step = st === 'onway' ? 2 : 3, steps = t.steps || ['Booked', 'Team assigned', 'On the way', 'Arrived'];
    const when = st === 'onway' ? `${t.minutes || 12} min away` : st === 'arrived' ? 'At your door' : 'With you now';
    return `<div class="v35-sec">Happening now</div>
      <div class="v35-now">
        <button class="v35-now-top" type="button" data-act="hx-appt" data-id="${a.id}">
          <span class="v35-av">${lead ? `<img src="${img(lead.img)}" alt="">` : icon('stetho', 20, 2)}<i></i></span>
          <span class="v35-now-t"><small><i></i>${LIVE[st]} · ${when}</small><b>${esc(lead ? lead.name : a.team)}</b><span>${esc(a.service)} · ${st === 'onway' ? `arriving ${esc(t.eta || '')}` : esc(a.time)}</span></span>
          ${icon('chevRight', 18, 2.2)}
        </button>
        <div class="v35-steps">${steps.map((s, i) => `<span class="${i < step ? 'on' : i === step ? 'cur' : ''}"><i></i>${esc(s)}</span>`).join('')}</div>
        <div class="v35-now-btns"><button class="v35-b1" type="button" data-act="hx-appt" data-id="${a.id}">${icon('nav', 16, 2.2)} Track live</button><button class="v35-b2" type="button" data-act="hx-notif" data-id="n2">${icon('chat', 16, 2.2)} Message</button></div>
      </div>`;
  }

  /* ---------- b · now + action cards ---------- */
  function viewB() {
    const all = list(), f = S.hxNType || 'all', L = all.filter(n => f === 'all' || n.t === f);
    const chips = `<div class="hx-nchips" role="tablist">${[['all', 'All']].concat(Object.keys(HX.ntypes).map(k => [k, HX.ntypes[k].label])).map(([k, l]) =>
      `<button class="hx-nchip ${k === f ? 'on' : ''}" type="button" role="tab" aria-selected="${k === f}" data-act="hx-ntype" data-t="${k}">${l}</button>`).join('')}</div>`;
    const now = f === 'all' || f === 'team' ? nowCard() : '';
    if (!L.length) return `${chips}${now}<div class="hx-nnone"><span class="tile ${T(f).tint}">${icon(T(f).ic, 20, 2)}</span><b>No ${T(f).label.toLowerCase()} updates</b><span>They’ll appear here when there are any.</span></div>`;
    return chips + now + ['Today', 'Earlier'].map(g => {
      const items = L.filter(n => n.g === g);
      if (!items.length) return '';
      return `<div class="v35-sec">${g}</div>${items.map(n => {
        const [lbl, ic] = ACTION[n.id] || ['Open', 'chevRight'], un = isUn(n);
        return `<div class="v35-card ${un ? 'un' : ''}" role="button" tabindex="0" data-act="hx-notif" data-id="${n.id}">
            <div class="v35-ctop">${tile(n)}<span class="v35-cmid"><span class="v35-cline"><b>${esc(n.title)}</b><small>${esc(n.time)}</small></span><span class="v35-cbody">${esc(n.body)}</span></span></div>
            <button class="v35-cact" type="button" data-act="hx-notif" data-id="${n.id}">${icon(ic, 15, 2.2)} ${lbl}</button>
          </div>`;
      }).join('')}`;
    }).join('');
  }

  /* ---------- c · by visit ---------- */
  function viewC() {
    const all = list(), seg = S.v35seg || 'visits';
    const offers = all.filter(n => n.t === 'off'), ups = all.filter(n => n.t !== 'off');
    const badge = arr => { const k = arr.filter(isUn).length; return k ? `<em>${k}</em>` : `<small>${arr.length}</small>`; };
    const tabs = `<div class="v35-seg" role="tablist">
        <button class="${seg === 'visits' ? 'on' : ''}" type="button" role="tab" aria-selected="${seg === 'visits'}" data-act="v35-seg" data-k="visits">Visits ${badge(ups)}</button>
        <button class="${seg === 'offers' ? 'on' : ''}" type="button" role="tab" aria-selected="${seg === 'offers'}" data-act="v35-seg" data-k="offers">Offers ${badge(offers)}</button></div>`;
    if (seg === 'offers') {
      if (!offers.length) return tabs + `<div class="hx-nnone"><span class="tile p-teal">${icon('sparkle', 20, 2)}</span><b>No offers right now</b><span>New offers will appear here.</span></div>`;
      return tabs + offers.map(n => `<div class="v35-offer">
          <img src="${img('banner-2.jpg')}" alt="">
          <div class="v35-ob"><span class="v35-otag">${isUn(n) ? '<i></i>' : ''}Offer · ${esc(n.time)}</span><b>${esc(n.title)}</b><p>${esc(n.body)}</p>
            <div class="v35-code"><span>FRH500</span><button type="button" data-act="v35-copy">${icon('copy', 14, 2.2)} Copy</button></div>
            <button class="v35-obtn" type="button" data-act="hx-notif" data-id="${n.id}">Book a package</button></div></div>`).join('');
    }
    const order = [];
    ups.forEach(n => { const v = VISIT[n.id]; if (v && !order.includes(v)) order.push(v); });
    return tabs + order.map(id => {
      const a = appt(id); if (!a) return '';
      const items = ups.filter(n => VISIT[n.id] === id), un = items.filter(isUn).length;
      const st = id === liveId() ? liveSt() : null;
      const pill = st ? `<span class="v35-pill g"><i></i>${LIVE[st]}</span>` : VPILL[id] ? `<span class="v35-pill ${VPILL[id][1]}">${VPILL[id][0]}</span>` : `<span class="v35-pill n">${esc(a.statusLabel)}</span>`;
      return `<div class="v35-visit">
          <button class="v35-vh" type="button" data-act="hx-appt" data-id="${id}">
            <span class="tile">${svcIc(a.service)}</span>
            <span class="v35-vt"><b>${esc(a.service)}</b><small>${esc(a.date)} · ${esc(firstNames(a))}${un ? ` · <em>${un} new</em>` : ''}</small></span>${pill}</button>
          <div class="v35-thread">${items.map(n => `<button class="v35-u ${isUn(n) ? 'un' : ''}" type="button" data-act="hx-notif" data-id="${n.id}">
              <span class="v35-ut"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></span><small>${esc(n.time)}</small></button>`).join('')}</div>
          ${st ? `<div class="v35-vf"><button class="v35-b1" type="button" data-act="hx-appt" data-id="${id}">${icon('nav', 15, 2.2)} Track live</button><button type="button" data-act="hx-notif" data-id="n2">${icon('chat', 15, 2.2)} Message</button></div>` : ''}
        </div>`;
    }).join('');
  }

  /* ---------- d · catch-up + timeline ---------- */
  function catchUp() {
    const un = list().filter(isUn), live = liveSt();
    if (!un.length) return `<div class="v35-sum done"><span class="v35-sum-h">${icon('check', 15, 2.4)} You’re all caught up</span><p>Nothing new since you last looked. Visit updates, messages and results will show up here.</p></div>`;
    const parts = []; let prevTeam = false;
    un.forEach(n => {
      const f = SUM[n.id];
      if (f) { const s = f(prevTeam); if (n.id === 'n2' && prevTeam) parts[parts.length - 1] += ' and ' + s; else parts.push(s); prevTeam = n.id === 'n1'; }
      else { parts.push(esc(n.title)); prevTeam = false; }
    });
    const text = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('. ') + '.';
    return `<div class="v35-sum">
        <span class="v35-sum-h">${icon('sparkle', 15, 2.2)} Catch up<small>${un.length} new</small></span>
        <p>${text}</p>
        <div class="v35-sum-btns">${live ? `<button class="v35-b1" type="button" data-act="hx-appt" data-id="${liveId()}">${icon('nav', 15, 2.2)} Track live</button>` : ''}${un.some(n => n.id === 'n2') ? `<button type="button" data-act="hx-notif" data-id="n2">${icon('chat', 15, 2.2)} Read message</button>` : ''}</div>
      </div>`;
  }
  function viewD() {
    const all = list(), days = [];
    all.forEach(n => {
      const today = /\d(:\d\d)?\s?[AP]M$/i.test(n.time), day = today ? 'Today' : n.time;
      let d = days.find(x => x.day === day); if (!d) { d = { day, items: [] }; days.push(d); }
      d.items.push(n);
    });
    return catchUp() + days.map(d => `<div class="v35-day">${esc(d.day)}</div><div class="v35-tl">${d.items.map(n => `
        <button class="v35-ti ${isUn(n) ? 'un' : ''}" type="button" data-act="hx-notif" data-id="${n.id}">
          ${tile(n, 16)}<span class="v35-tc"><small>${/[AP]M$/i.test(n.time) ? esc(n.time) + ' · ' : ''}${esc(T(n.t).label)}</small><b>${esc(n.title)}</b><span>${esc(n.body)}</span></span>
        </button>`).join('')}</div>`).join('');
  }

  /* ---------- wire into the existing screen ---------- */
  const base = scr.update;
  scr.update = function (n) {
    const m = S.v35n || 'a';
    n.dataset.v35 = m;
    if (m === 'a' || !list().length) return base.call(this, n);
    const un = list().some(isUn);
    setHTML(n.querySelector('.hx-readall-w'), `<button class="nav-link hx-readall ${un ? '' : 'off'}" type="button" data-act="hx-read-all"${un ? '' : ' disabled'}>Mark all read</button>`);
    setHTML(n.querySelector('.hx-nlist'), m === 'b' ? viewB() : m === 'c' ? viewC() : viewD());
  };
  Object.assign(F.ACT, {
    'v35-seg': el => { S.v35seg = el.dataset.k; F.upd(); },
    'v35-copy': () => { try { navigator.clipboard && navigator.clipboard.writeText('FRH500'); } catch (e) { /* the toast is enough in the prototype */ } F.toast('Code FRH500 copied', 'copy'); },
  });
})();
