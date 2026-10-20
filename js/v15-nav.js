/* Final v15: navigation B+ — Home · Services · Bookings · Chat · Account, with "Ask anything" on Home. */
(function () {
  const F = window.FRH, S = F.S, icon = window.FRHI.icon;
  const opt = (act, ic, t, d) => `<button class="v15-opt" type="button" data-act="${act}"><span class="v15-oi">${icon(ic, 18, 2)}</span><span class="mid"><b>${t}</b><small>${d}</small></span>${icon('chevRight', 15, 2.4)}</button>`;
  F.SHEETS['v15-ask'] = () => `<div class="sheet v15-sheet" role="dialog" aria-label="Ask anything"><div class="grab"></div>
    <h2>Ask anything</h2><p class="v15-sub">Real FRH people reply, usually in a few minutes.</p>
    ${opt('v15-care', 'stetho', 'Talk to a doctor', 'The on-duty doctor replies in Chat')}
    ${opt('v15-how', 'calendar', 'How booking works', 'Four steps, from choosing a service to your team at the door')}
    ${opt('v15-other', 'chat', 'Something else', 'Billing, membership or a booking; our care team replies')}</div>`;
  const STEPS = [['Choose a service', 'From Home or the Services tab, and pick who it is for.'],
    ['Check your cart', 'Address and time are filled in; change anything in a tap.'],
    ['Pay once', 'Card, Apple Pay or cash at the door.'],
    ['Follow your team', 'Bookings shows them on the way, then your reports.']];
  F.SHEETS['v15-howto'] = () => `<div class="sheet v15-sheet" role="dialog" aria-label="How booking works"><div class="grab"></div>
    <h2>How booking works</h2>
    <ol class="v15-steps">${STEPS.map(s => `<li><b>${s[0]}</b><span>${s[1]}</span></li>`).join('')}</ol>
    <button class="btn btn-primary v15-go" type="button" data-act="v15-book">Book a doctor</button></div>`;
  const toChat = withKb => {
    F.closeSheet(true);
    if (typeof F.openSupportChat === 'function') F.openSupportChat(); else F.go('chat-home');
    if (withKb) setTimeout(() => { if (S.open && S.screen === 'chat' && !S.sheet) F.showKb('qwerty', 'chat-msg'); }, 450);
  };
  Object.assign(F.ACT, {
    'v15-ask': () => F.openSheet('v15-ask'),
    'v15-care': () => toChat(false),
    'v15-other': () => toChat(true),
    'v15-how': () => F.openSheet('v15-howto'),
    'v15-book': () => { F.closeSheet(true); S.svc = 'gp'; F.go('service'); },
  });
})();
