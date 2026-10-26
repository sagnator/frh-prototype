/* v44: the header badge counts what is new since the client's dev-team PDF: screens and pop-ups.
   Matched by meaning against the prototype that existed when the PDF arrived (/frh, 38 screens).
   Anything that already existed there, even as a pop-up or under another name, is not counted, but it is
   still listed at the end ("Already there before the PDF") with what it was, so nothing disappears.
   Ask anything (voice) and Edit profile are left off the list (the user's call, 2026-10-22).
   Pop-up verdicts were checked by two independent reviewers on 2026-10-22. v45 adds three pop-ups for packages and visits. */
(function () {
  /* [panel id or null, label, PDF section or '', note] */
  const NEW = [
    ['Sign-in and system', [['a-locperm', 'Location permission', '01'], ['a-update', 'Update required', '12.13']]],
    ['Browse and book', [['doctors', 'Doctors'], ['doctor', 'Doctor profile'], ['v32-all-faqs', 'All FAQs']]],
    ['Visits and records', [['lab-report', 'Lab results', '13.5'], ['e-rx', 'E-prescription', '13.6'], ['invoices', 'Invoices', '10.2'], ['px-pdf', 'Document viewer', '10.1']]],
    ['Membership', [['membership-join', 'Membership plans'], ['membership', 'My membership', '13'], ['m-plan', 'Plan detail', '13.2–13.3'],
      ['m-plans', 'Upgrade plan'], ['m-schedule', 'Book an included visit', '13.4']]],
    ['Profile and account', [['coupons', 'Coupons', '10.9'], ['rewards', 'Rewards'],
      ['pay-methods', 'Payment methods', '10.13'], ['px-card', 'Add a card', '10.13'], ['notif-settings', 'Notification settings', '10.14'],
      ['account', 'Account settings', '10.15'], ['px-phone', 'Change phone number', '10.15'], ['px-delete', 'Delete account', '10.15'],
      ['px-deleted', 'Account closed', '10.15']]],
  ];
  const POPS = [
    ['Sign-in and location', [['a-locdenied', 'Location is off', '12.15'], ['a-city', 'Choose your city', '12.4'], ['a-session', 'Signed out', '12.12']]],
    ['First-time guide', [['tour-welcome', 'Welcome card'], ['tour-ask', 'Coach-mark tip']]],
    ['Browse and book', [['soon-sheet', 'Coming soon (one service)', '12.10'], ['v26-revs-all', 'All reviews'], [null, 'Membership plans', '', 'opens from the cart'],
      ['v43-addr-sheet', 'Where will they be?'], ['v45-visit-svc', 'People in a service'], ['v45-session', 'Pick a package appointment'], ['checkout-failed', 'Payment failed', '12.6']]],
    ['Visits', [['appt-address', 'Change address', '12.3'], ['v45-pkg-sched', 'Book the next appointment', '', 'from a package'], [null, 'Call FRH or the team', '', 'opens from a visit']]],
    ['Chat', [[null, 'Attach photo or file', '', 'opens from a chat']]],
    ['Membership and rewards', [['m-pay', 'Pay for membership'], ['m-welcome', 'Welcome to your plan', '13.4'], ['v42-redeem', 'Redeem points']]],
    ['Records', [['px-share', 'Share document']]],
  ];
  /* already in the prototype before the PDF: [panel id or null, label, what it was] */
  const BEFORE = [
    ['Screens', [['a-addr', 'Confirm address on the map', 'the Location screen (Confirm location)'], ['px-address', 'Add address', 'the add-address part of the Location screen'],
      ['px-patient', 'Add patient', 'a pop-up'], ['book-done', 'Payment successful', 'the Payment completed pop-up'],
      ['a-offline', 'Offline at first launch', 'the You’re offline pop-up'], ['appt-map', 'Live map', 'Track your team'],
      ['appt-onway', 'Appointment details', 'rebuilt: Track your team + Booking details'], ['checkout', 'Pay', 'rebuilt: Confirm & pay + Payment method'],
      ['reports-hub', 'Medical reports', 'rebuilt: one list for the family'], ['clinician', 'Clinician profile', 'rebuilt: one page for every role']]],
    ['Pop-ups', [['country', 'Country picker', 'the same pop-up'], ['err-offline', 'You’re offline', 'the same pop-up'], ['err-failed', 'Code not delivered', 'the same pop-up'],
      ['home-addr', 'Visit address', 'the address in the Home header'], ['a-outside', 'Outside our area', 'the Not in your area screen'],
      ['cart-time', 'Edit visit details', 'the Patients and Location screens'], [null, 'Available coupons', 'the coupon list in the cart'],
      ['appt-reschedule', 'Change date and time', 'the Reschedule screen'], ['v30-rate-a', 'Rate your visit', 'the rating box on Booking details'],
      ['appt-menu', 'More options', 'Reschedule and Cancel on the cards'], ['px-del-addr', 'Confirm dialog', 'the Sign out pop-up']]],
  ];
  const flat = L => L.flatMap(g => g[1]);
  const n = flat(NEW).length, np = flat(POPS).length, nb = flat(BEFORE).length;
  const fromPdf = flat(NEW).concat(flat(POPS)).filter(r => r[2]).length;
  const has = id => id && document.querySelector('#scrIndex [data-v="' + id + '"]');
  const row = (id, label, small) => '<button type="button" class="ns-row' + (has(id) ? '' : ' off') + '" ' + (has(id) ? 'data-v="' + id + '"' : 'disabled') + '>' +
    '<span>' + label + '<small>' + small + '</small></span>' + (has(id) ? '<em>View</em>' : '') + '</button>';
  const newRow = ([id, label, pdf, note]) => row(id, label, (pdf ? 'Asked for in the PDF · ' + pdf : 'Our addition') + (note ? ' · ' + note : ''));
  const wasRow = ([id, label, was]) => row(id, label, 'Was ' + was);
  const group = (g, fn, grid) => '<h4>' + g[0] + ' · ' + g[1].length + '</h4>' + (grid ? '<div class="ns-pops">' : '') + g[1].map(fn).join('') + (grid ? '</div>' : '');
  const ov = document.createElement('div');
  ov.className = 'ns-ov';
  ov.innerHTML = '<div class="ns-box" role="dialog" aria-label="New screens and pop-ups since the dev-team PDF">' +
    '<div class="ns-top"><div class="ns-h"><div><b>' + (n + np) + ' new screens</b><span>' + n + ' screens and ' + np + ' pop-ups added since the dev-team PDF: ' +
    fromPdf + ' the PDF asked for, ' + (n + np - fromPdf) + ' our additions. What the prototype already had before the PDF is listed at the end and not counted.</span></div>' +
    '<button type="button" class="ns-x" aria-label="Close">×</button></div>' +
    '<div class="ns-tabs" role="tablist"><button type="button" class="on" data-to="ns-s">Screens <b>' + n + '</b></button><button type="button" data-to="ns-p">Pop-ups <b>' + np + '</b></button>' +
    '<button type="button" data-to="ns-b">Already there <b>' + nb + '</b></button></div></div>' +
    '<h3 class="ns-sec" id="ns-s">New screens · ' + n + '</h3>' + NEW.map(g => group(g, newRow)).join('') +
    '<h3 class="ns-sec" id="ns-p">New pop-ups · ' + np + '</h3>' + POPS.map(g => group(g, newRow, true)).join('') +
    '<h3 class="ns-sec" id="ns-b">Already there before the PDF · ' + nb + '<small>Not counted: the earlier prototype already had these, sometimes in another form.</small></h3>' +
    BEFORE.map(g => group(g, wasRow, true)).join('') + '</div>';
  document.body.appendChild(ov);
  const box = ov.querySelector('.ns-box'), tabs = [...ov.querySelectorAll('.ns-tabs button')];
  const open = () => ov.classList.add('on'), close = () => ov.classList.remove('on');
  const btn = document.getElementById('newScrBtn');
  if (btn) { btn.innerHTML = '<b>' + (n + np) + '</b> new screens'; btn.title = n + ' screens and ' + np + ' pop-ups added since the client dev-team PDF'; btn.addEventListener('click', open); }
  /* the tab of the section being read stays highlighted */
  const sync = () => {
    const lim = ov.querySelector('.ns-top').getBoundingClientRect().bottom + 8;
    let cur = 'ns-s'; ['ns-s', 'ns-p', 'ns-b'].forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= lim) cur = id; });
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2) cur = 'ns-b';
    tabs.forEach(t => t.classList.toggle('on', t.dataset.to === cur));
  };
  box.addEventListener('scroll', sync, { passive: true });
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('.ns-x')) { close(); return; }
    const t = e.target.closest('.ns-tabs button');
    if (t) { const s = document.getElementById(t.dataset.to); box.scrollTo({ top: s.offsetTop - ov.querySelector('.ns-top').offsetHeight - 4, behavior: 'smooth' }); return; }
    const r = e.target.closest('.ns-row[data-v]');
    if (r && window.FRH && FRH.panel) { FRH.panel.jump(r.dataset.v); ov.querySelectorAll('.ns-row.on').forEach(x => x.classList.remove('on')); r.classList.add('on'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
