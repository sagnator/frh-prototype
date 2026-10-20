/* Final v17: "Ask anything" opens a voice assistant. The prototype uses the browser's own voices
   (speechSynthesis) and speech recognition where available; replies are scripted. */
(function () {
  const F = window.FRH, S = F.S, icon = window.FRHI.icon;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const TTS = 'speechSynthesis' in window;
  let rec = null, timer = null, voice = null;
  const here = () => S.open && S.screen === 'ask-voice';
  function pickVoice() {
    if (!TTS) return null;
    const vs = speechSynthesis.getVoices();
    const pref = ['Samantha', 'Ava', 'Allison', 'Serena', 'Karen', 'Moira', 'Tessa', 'Google UK English Female', 'Microsoft Jenny', 'Microsoft Aria', 'Zira'];
    for (const p of pref) { const v = vs.find(x => x.name.includes(p)); if (v) return v; }
    return vs.find(v => /female/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (TTS) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  function set(st) { S.vaState = st; F.upd(); }
  function say(text, then) {
    S.vaLine = text; set('speaking');
    const done = () => { if (!here()) return; set('idle'); if (then) then(); };
    if (!TTS || S.vaMuted) { timer = setTimeout(done, 900 + text.length * 25); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    voice = voice || pickVoice(); if (voice) u.voice = voice;
    u.rate = 0.93; u.pitch = 1.05;
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  }
  function listen() {
    if (!here()) return;
    if (!SR) { S.vaNoMic = true; set('idle'); return; }
    try {
      rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = false;
      rec.onresult = e => {
        const t = [...e.results].map(r => r[0].transcript).join('');
        S.vaHeard = t; F.upd();
        if (e.results[e.results.length - 1].isFinal) { stopListening(); answer(t); }
      };
      rec.onerror = () => { if (S.vaState === 'listening') set('idle'); };
      rec.onend = () => { if (S.vaState === 'listening') set('idle'); };
      S.vaHeard = ''; set('listening'); rec.start();
    } catch (e) { set('idle'); }
  }
  function stopListening() { try { if (rec) rec.abort(); } catch (e) { /* already stopped */ } rec = null; }
  function stopAll() { stopListening(); if (TTS) speechSynthesis.cancel(); clearTimeout(timer); S.vaState = 'idle'; }
  const INTENTS = [
    { re: /chest pain|can.?t breathe|breathing|unconscious|emergency|stroke|severe bleeding/i,
      say: 'This sounds urgent. Please call 998 for an ambulance now.', act: [['Call 998', 'v17-998', 'red']] },
    { re: /track|where is|arriv|my team|on the way/i,
      say: 'Your team is on the way and should arrive in about twelve minutes. I can open live tracking for you.', act: [['Track my visit', 'v17-track']] },
    { re: /sick note|certificate/i, say: 'Yes. The doctor can give you a medical certificate during the visit, and a copy is saved in the app.', act: [['Book a doctor', 'v17-gp']] },
    { re: /child|children|kid|baby|son|daughter/i, say: 'Yes. Our doctors see children of all ages at home, and a paediatric doctor can come for little ones.', act: [['Paediatric visit', 'v17-peds']] },
    { re: /insurance|insurer|claim/i, say: 'We bill a number of UAE insurers directly. If yours is not a partner, you pay in the app and we send a stamped invoice you can claim back.', act: [['See all FAQs', 'v32-faqs']] },
    { re: /fast|eat before/i, say: 'For most blood tests, nothing to eat for eight to ten hours before. Water is fine, and we remind you the night before.', act: [['See lab tests', 'v17-lab']] },
    { re: /result/i, say: 'Most results reach the app within a day. You see the exact time when you book.', act: [['See lab tests', 'v17-lab']] },
    { re: /safe|side effect/i, say: 'A nurse checks your health first and stays for the whole drip, adjusting it if you feel unwell. Tell us about any conditions when you book.', act: [['See all FAQs', 'v32-faqs']] },
    { re: /how long|take\?|duration/i, say: 'Most drips take forty-five to sixty minutes, and NAD plus takes two to three hours. Each service page shows the exact time.', act: [['See all FAQs', 'v32-faqs']] },
    { re: /family|someone else|mum|dad|parent/i, say: 'Yes. Add them under Patients, then add them to the same visit in your cart. You pay once.', act: [['See all FAQs', 'v32-faqs']] },
    { re: /prepare|ready|before the visit/i, say: 'Have your Emirates ID and any current medicines to hand. If it is for a child, keep their vaccination card nearby.', act: [['See all FAQs', 'v32-faqs']] },
    { re: /price|cost|how much|charge|fee/i,
      say: 'A doctor home visit is three hundred and fifty dirhams, and a video consultation is ninety-nine. You see the full total before you pay.', act: [['See all services', 'v17-services']] },
    { re: /lab|test|blood|sample/i,
      say: 'A nurse can take samples at your home, and most results arrive within a day. Shall I show you the lab tests?', act: [['See lab tests', 'v17-lab']] },
    { re: /book|doctor|visit|sick|fever|pain|unwell|child/i,
      say: 'I can send a licensed doctor to your home. The next one can be with you in about forty-five minutes. Shall I open Doctor on Call?', act: [['Open Doctor on Call', 'v17-gp']] },
  ];
  const FALLBACK = { say: 'Thanks. I have passed that to our care team, and they will reply in Chat in a few minutes.', act: [['Open Chat', 'v17-chat']] };
  function answer(t) {
    const hit = INTENTS.find(i => i.re.test(t)) || FALLBACK;
    S.vaSteps = false; S.vaAct = hit.act;
    say(hit.say);
  }
  const face = n => '<img src="assets/img/' + n + '" alt="">';
  const opt = (act, ic, label, extra) => `<button class="v17-opt" type="button" data-act="${act}"><span class="oi">${icon(ic, 17, 2.2)}</span><span class="mid">${label}</span>${extra || ''}</button>`;
  F.SCREENS['ask-voice'] = {
    status: 'dark', cls: 'v17',
    render() {
      return `<div class="nav v17-nav"><button class="v17-back" type="button" data-act="v17-close" aria-label="Back">${icon('arrowLeft', 17, 2.4)}</button>
          <span class="nav-title">Ask anything</span><button class="v17-mute" type="button" data-act="v17-mute" aria-label="Voice on or off"></button></div>
        <div class="v17-stage"><div class="v17-orb"><i></i><i></i><i></i></div>
          <p class="v17-line"></p><p class="v17-heard"></p><span class="v17-status"><i></i><span></span></span><div class="v17-act"></div></div>
        <div class="v17-opts">
          ${opt('v17-clin', 'phone', 'Speak with clinicians', `<span class="v17-faces">${face('doc-1.jpg')}${face('doc-2.jpg')}${face('doc-3.jpg')}</span>`)}
          ${opt('v17-how', 'pin', 'How to book a home visit?')}
          ${opt('v17-else', 'chat', 'I have something else to ask')}
        </div>
        <div class="v17-foot"><button class="v17-mic" type="button" data-act="v17-mic" aria-label="Talk">${icon('mic', 22, 2)}</button>
          <button class="v17-type" type="button" data-act="v15-other">Type instead</button></div>`;
    },
    mount() {
      S.vaHeard = ''; S.vaAct = null; S.vaSteps = false; S.vaNoMic = false;
      say('Hey there, how can I help?', listen);
    },
    update(n) {
      const st = S.vaState || 'idle';
      n.classList.toggle('speaking', st === 'speaking');
      n.classList.toggle('listening', st === 'listening');
      const put = (sel, html) => { const el = n.querySelector(sel); if (el && el._h !== html) { el.innerHTML = html; el._h = html; } };
      n.classList.toggle('answer', !!(S.vaSteps || (S.vaAct && S.vaAct.length)));
      put('.v17-line', F.esc(S.vaSteps ? 'Booking takes four steps' : (S.vaLine || 'Hey there, how can I help?')));
      put('.v17-heard', S.vaHeard ? '“' + F.esc(S.vaHeard) + '”' : '');
      put('.v17-status span', st === 'listening' ? 'Listening…' : st === 'speaking' ? 'Speaking' : S.vaNoMic ? 'Voice input isn’t available here: pick an option or type' : 'Tap the mic to talk');
      const steps = S.vaSteps ? '<div class="v17-steps">' + [['1', 'Pick a service'], ['2', 'Choose who it is for'], ['3', 'Check your cart'], ['4', 'Pay once']]
        .map(s => '<span><b>Step ' + s[0] + '</b>' + s[1] + '</span>').join('') + '</div>' : '';
      const acts = (S.vaAct || []).map(a => `<button class="btn ${a[2] === 'red' ? 'btn-primary' : 'btn-secondary'}" type="button" data-act="${a[1]}">${a[0]}</button>`).join('');
      put('.v17-act', steps + acts);
      put('.v17-mute', S.vaMuted ? 'Off' : 'On');
    },
  };
  const toSupport = withKb => { stopAll(); if (F.ACT[withKb ? 'v15-other' : 'v15-care']) F.ACT[withKb ? 'v15-other' : 'v15-care'](); };
  Object.assign(F.ACT, {
    'v15-ask': () => F.go('ask-voice', { dir: 'fade' }),
    'v17-close': () => { stopAll(); F.back('home'); },
    'v17-mute': () => { S.vaMuted = !S.vaMuted; if (S.vaMuted && TTS) speechSynthesis.cancel(); F.upd(); },
    'v17-mic': () => { if (S.vaState === 'listening') { stopListening(); set('idle'); } else { if (TTS) speechSynthesis.cancel(); listen(); } },
    'v17-clin': () => { stopListening(); S.vaAct = null; S.vaSteps = false; say('Connecting you with our on-duty doctor now.', () => toSupport(false)); },
    'v17-how': () => { stopListening(); S.vaAct = [['Book a doctor', 'v17-gp']]; S.vaSteps = true;
      say('It takes four steps. Pick a service, choose who it is for, check your cart, and pay once. Then you can follow your team in Bookings.'); },
    'v17-else': () => { stopListening(); S.vaAct = null; S.vaSteps = false; say('Of course. Go ahead, I am listening.', listen); },
    'v17-gp': () => { stopAll(); S.svc = 'gp'; F.go('service'); },
    'v17-peds': () => { stopAll(); S.svc = 'peds'; F.go('service'); },
    'v17-services': () => { stopAll(); F.go('cats'); },
    'v17-lab': () => { stopAll(); F.ACT['open-cat']({ dataset: { k: 'lab' } }); },
    'v17-track': () => { stopAll(); if (F.openAppt) F.openAppt('FRH-24817'); else F.go('appts'); },
    'v17-chat': () => toSupport(false),
    'v17-998': () => { stopAll(); if (F.ACT['a-call']) F.ACT['a-call']({ dataset: { n: 'ambulance' } }); },
  });
  F.vaAnswer = t => { if (here()) { stopListening(); S.vaHeard = t; answer(t); } };   /* presenter and test hook: as if the patient said t */
  /* never keep talking or listening once the patient leaves the screen or closes the app */
  const go0 = F.go, close0 = F.closeApp;
  F.go = function (id) { if (S.screen === 'ask-voice' && id !== 'ask-voice') stopAll(); return go0.apply(this, arguments); };
  F.closeApp = function () { stopAll(); return close0.apply(this, arguments); };
})();
