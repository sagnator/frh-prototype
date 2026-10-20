/* Island preview page: every Live Activity state, drawn with the prototype's own renderer (js/v19-island.js). */
(function () {
  const DI = window.FRHDI, G = DI.GEO;
  const SIG = '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" width="3" height="12" rx=".8"/></svg>';
  const WIFI = '<svg class="wifi" width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .5 10.2 10.2 0 0 0 .8 3.4L2 4.6a8.5 8.5 0 0 1 6-2.4z"/><path d="M8 5.6c1.4 0 2.6.5 3.6 1.4l1.2-1.2A7 7 0 0 0 8 3.9a7 7 0 0 0-4.8 1.9L4.4 7c1-.9 2.2-1.4 3.6-1.4z"/><path d="M8 9c.6 0 1.1.2 1.5.6L8 11.1 6.5 9.6c.4-.4.9-.6 1.5-.6z"/></svg>';
  const BAT = '<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45"/></svg>';
  const bar = time => `<div class="pv-sb"><span class="pv-time">${time || '5:12'}</span><span class="pv-icons">${SIG}${WIFI}${BAT}</span></div>`;
  const shape = (g, dx) => `left:${(393 - g.w) / 2 + (dx || 0)}px;top:${g.top}px;width:${g.w}px;height:${g.h}px;border-radius:${g.r}px`;
  function phone(a, mode, b) {
    let isl;
    if (mode === 'minimal') isl = `<div class="di-isl on" style="${shape(G.minimal, G.minimal.dx)}">${DI.inner(a, 'minimal')}</div>
      <div class="di-isl on" style="${shape({ w: 36, h: 36, top: 11, r: 18 }, 85)}">${DI.inner(b, 'minimal')}</div>`;
    else isl = `<div class="di-isl on ${mode === 'alert' ? 'alerting' : ''} ${mode === 'expanded' || mode === 'alert' ? 'x' : ''}" style="${shape(G[mode])}">${DI.inner(a, mode)}</div>`;
    return `<div class="pv-ph ${mode === 'compact' || mode === 'minimal' ? 'short' : ''}"><div class="pv-scr">${bar()}<div class="island-hw"></div>${isl}</div></div>`;
  }
  function lockPhone(a) {
    return `<div class="pv-ph lock"><div class="pv-scr">${bar()}<div class="island-hw"></div>
      <div class="pv-lockclock"><small>Sunday 18 October</small><b>5:12</b></div><div class="pv-lockcard">${DI.lock(a)}</div></div></div>`;
  }
  const V = (stage, x) => Object.assign({ kind: 'visit', stage, min: 12 }, x || {});
  const R = {
    visit: [
      ['Team assigned', 'Alert', phone(V('assigned'), 'alert')],
      ['On the way', 'Compact', phone(V('onway'), 'compact')],
      ['On the way', 'Expanded (long press)', phone(V('onway'), 'expanded')],
      ['Arrived', 'Alert', phone(V('arrived'), 'alert')],
      ['Visit in progress', 'Compact', phone(V('treating', { base: 492 }), 'compact')],
      ['Visit in progress', 'Expanded', phone(V('treating', { base: 492 }), 'expanded')],
      ['Visit complete', 'Alert, then it ends', phone(V('done'), 'alert')],
      ['On the way', 'Lock Screen', lockPhone(V('onway'))],
    ],
    drip: [
      ['Drip running', 'Compact', phone({ kind: 'drip', base: 420, dur: 2700 }, 'compact')],
      ['Drip running', 'Expanded', phone({ kind: 'drip', base: 420, dur: 2700 }, 'expanded')],
      ['Drip running', 'Lock Screen', lockPhone({ kind: 'drip', base: 420, dur: 2700 })],
    ],
    tele: [
      ['In the queue', 'Compact', phone({ kind: 'tele', stage: 'queue', min: 3 }, 'compact')],
      ['In the queue', 'Expanded', phone({ kind: 'tele', stage: 'queue', min: 3 }, 'expanded')],
      ['Doctor ready', 'Alert', phone({ kind: 'tele', stage: 'ready' }, 'alert')],
    ],
    lab: [
      ['Sample at the lab', 'Compact', phone({ kind: 'lab', stage: 'lab' }, 'compact')],
      ['Sample at the lab', 'Expanded', phone({ kind: 'lab', stage: 'lab' }, 'expanded')],
      ['Results ready', 'Alert', phone({ kind: 'lab', stage: 'ready' }, 'alert')],
      ['Visit + lab together', 'Minimal (two at once)', phone(V('onway'), 'minimal', { kind: 'lab', stage: 'lab' })],
    ],
  };
  document.querySelectorAll('[data-row]').forEach(el => {
    el.innerHTML = R[el.dataset.row].map(([t, f, h]) => `<figure class="pv-cell">${h}<figcaption><b>${t}</b><span>${f}</span></figcaption></figure>`).join('');
  });
  /* fit the 393-pt phones to narrow screens */
  const fit = () => document.querySelectorAll('.pv-ph').forEach(p => { const w = p.parentElement.clientWidth, k = Math.min(1, w / 393); p.style.setProperty('--k', k.toFixed(4)); });
  fit(); window.addEventListener('resize', fit);
})();
