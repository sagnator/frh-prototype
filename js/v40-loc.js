/* Final v40: change the visit address from the service listings (Services tab and a service list).
   A "Visit address" bar sits at the top of both and opens the same address sheet as everywhere else (hx-addr);
   availability (Soon, Not available here) and prices follow the address straight away.
   Mobbin: Careem (Deliver to Home), talabat (Deliver to), Instacart (address above the store list). */
(function () {
  const F = window.FRH, S = F.S, { icon } = window.FRHI;
  const esc = F.esc;
  const setHTML = (n, h) => { if (n && n._h !== h) { n.innerHTML = h; n._h = h; } };
  const CITY = /,\s*(Dubai|Sharjah|Abu Dhabi|Al Ain|Ras Al Khaimah|Ajman|Fujairah|Umm Al Quwain)\s*$/i;
  const parts = a => { const m = CITY.exec(a.line || ''); return { city: m ? m[1] : 'Dubai', street: (a.line || '').replace(CITY, '') }; };
  const ic = a => /office|work/i.test(a.label) ? 'briefcase' : /home|place/i.test(a.label) ? 'home' : 'pin';
  const BRIEF = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5C9 4.7 9.7 4 10.5 4h3c.8 0 1.5.7 1.5 1.5V7"/><path d="M3 12.5h18"/></svg>';

  function bar() {
    const a = F.visitAddress && F.visitAddress();
    if (S.guest || !a) {
      return `<button class="v40-loc" type="button" data-act="hx-addr"><span class="v40-loc-ic">${icon('pin', 18, 2)}</span>
          <span class="v40-loc-m"><small>Visit address</small><b>Set where we should visit</b></span><span class="v40-loc-c">Sign in</span></button>`;
    }
    const p = parts(a), k = ic(a);
    return `<button class="v40-loc" type="button" data-act="hx-addr" aria-label="Visit address: ${esc(a.label)}, ${esc(p.street)}. Change">
        <span class="v40-loc-ic">${k === 'briefcase' ? BRIEF : icon(k, 18, 2)}</span>
        <span class="v40-loc-m"><small>Visit address · ${esc(p.city)}</small><b>${esc(a.label)} <em>· ${esc(p.street)}</em></b></span>
        <span class="v40-loc-c">Change ${icon('chevDown', 14, 2.4)}</span></button>`;
  }
  function place(n) {
    const body = n.querySelector('.scr-body'); if (!body) return;
    let w = body.querySelector(':scope > .v40-loc-w');
    if (!w) { w = document.createElement('div'); w.className = 'v40-loc-w'; body.insertBefore(w, body.firstChild); }
    setHTML(w, bar());
  }
  ['cats', 'subcat'].forEach(id => {
    const s = F.SCREENS[id]; if (!s) return;
    const u0 = s.update;
    s.update = function (n) { const out = u0 ? u0.apply(this, arguments) : undefined; place(n); return out; };
  });

  /* panel presets */
  F.v40 = {
    sheet: () => { setTimeout(() => { if (S.screen === 'subcat' && !S.sheet) F.openSheet('hx-addr'); }, 450); },
    sharjah: () => { F.setVisitAddress('a2'); S.cat = 'dentist'; S.hxInQ = ''; S.hxSkel = null; S.hxEmptySub = null; S.v40demo = true; F.go('subcat', { dir: 'fade' }); },
    home: () => { if (S.v40demo) { F.setVisitAddress('a1'); S.v40demo = false; } },
  };
})();
