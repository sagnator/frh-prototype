/* v14: the header badge opens a list of what was added after the client's dev-team PDF.
   Counted against the original prototype (/frh): 38 screens there, 67 here. */
(function () {
  const NEW = [
    ['Sign-in and system', ['a-addr', 'a-locperm', 'a-offline', 'a-update']],
    ['Booking', ['book-done', 'coupons']],
    ['Visits and records', ['appt-map', 'lab-report', 'e-rx', 'invoices', 'px-pdf']],
    ['Membership', ['membership', 'm-plan', 'm-plans', 'm-schedule']],
    ['Profile and account', ['edit-profile', 'px-patient', 'px-address', 'pay-methods', 'px-card', 'notif-settings', 'account', 'px-phone', 'px-delete', 'px-deleted']],
  ];
  const REBUILT = [['appt-onway', 'Appointment details', 'replaces Track and Booking details'], ['checkout', 'Pay', 'replaces Confirm and Payment'],
    ['reports-hub', 'Medical reports', 'one list for the whole family'], ['clinician', 'Clinician profile', 'one page for every role']];
  const POPS = [['a-ios-loc', 'iOS location alert'], ['a-locdenied', 'Location off'], ['a-city', 'City list'], ['a-outside', 'Outside our area'],
    ['a-session', 'Signed out'], [null, 'Call prompt'], ['home-addr', 'Visit address'], ['soon-sheet', 'Coming soon'],
    ['m-pay', 'Pay for membership'], ['m-welcome', 'Welcome to your plan'], ['m-booked', 'Included visit booked'], [null, 'Share prescription'],
    ['px-del-addr', 'Delete address'], [null, 'Remove family member'], [null, 'Call, email or maps'], [null, 'Remove card'],
    ['px-share', 'Share'], ['cart-time', 'Edit visit details'], [null, 'Who is this for?'], [null, 'Available coupons'],
    ['checkout-failed', 'Payment failed'], [null, 'Membership plans'], ['appt-menu', 'More options'], ['appt-reschedule', 'Change date and time'],
    ['appt-address', 'Change address'], [null, 'Call FRH or the team'], [null, 'Attach photo or file']];
  const has = id => id && document.querySelector('#scrIndex [data-v="' + id + '"]');
  const nameOf = id => { const b = has(id); return b ? b.innerText.replace(/^\s*\d+\s*/, '').trim() : id; };
  const row = (id, label, note) => '<button type="button" class="ns-row' + (has(id) ? '' : ' off') + '" ' + (has(id) ? 'data-v="' + id + '"' : 'disabled') + '>' +
    '<span>' + (label || nameOf(id)) + (note ? '<small>' + note + '</small>' : '') + '</span>' + (has(id) ? '<em>View</em>' : '') + '</button>';
  const ov = document.createElement('div');
  ov.className = 'ns-ov';
  ov.innerHTML = '<div class="ns-box" role="dialog" aria-label="New screens since the dev-team PDF">' +
    '<div class="ns-h"><div><b>25 new screens</b><span>since the dev-team PDF · counted against the original prototype (38 screens, now 67)</span></div><button type="button" class="ns-x" aria-label="Close">×</button></div>' +
    NEW.map(g => '<h4>' + g[0] + ' · ' + g[1].length + '</h4>' + g[1].map(id => row(id)).join('')).join('') +
    '<h4>Rebuilt · 4</h4>' + REBUILT.map(r => row(r[0], r[1], r[2])).join('') +
    '<h4>New pop-ups · 27</h4><div class="ns-pops">' + POPS.map(p => row(p[0], p[1])).join('') + '</div></div>';
  document.body.appendChild(ov);
  const open = () => ov.classList.add('on'), close = () => ov.classList.remove('on');
  const btn = document.getElementById('newScrBtn');
  if (btn) btn.addEventListener('click', open);
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('.ns-x')) { close(); return; }
    const r = e.target.closest('.ns-row[data-v]');
    if (r && window.FRH && FRH.panel) { FRH.panel.jump(r.dataset.v); ov.querySelectorAll('.ns-row.on').forEach(x => x.classList.remove('on')); r.classList.add('on'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
