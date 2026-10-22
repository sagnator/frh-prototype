/* v44: the header badge counts only the screens that are new since the client's dev-team PDF.
   Matched by meaning against the prototype that existed when the PDF arrived (/frh, 38 screens).
   Anything that already existed there, even as a pop-up or under another name, is not counted:
   Confirm address on the map and Add address = the old Location screen, Add patient and Payment
   successful = old pop-ups, Offline at first launch = the old "You're offline" pop-up,
   Live map = the old Track your team screen. Each row says whether the PDF asked for it. */
(function () {
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
  const all = NEW.flatMap(g => g[1]), n = all.length, fromPdf = all.filter(r => r[2]).length;
  const has = id => id && document.querySelector('#scrIndex [data-v="' + id + '"]');
  const row = ([id, label, pdf, extra]) => '<button type="button" class="ns-row' + (has(id) ? '' : ' off') + '" ' + (has(id) ? 'data-v="' + id + '"' : 'disabled') + '>' +
    '<span>' + label + '<small>' + (pdf ? 'Asked for in the PDF · ' + pdf : 'Our addition') + (extra ? ' · ' + extra : '') + '</small></span>' + (has(id) ? '<em>View</em>' : '') + '</button>';
  const ov = document.createElement('div');
  ov.className = 'ns-ov';
  ov.innerHTML = '<div class="ns-box" role="dialog" aria-label="New screens since the dev-team PDF">' +
    '<div class="ns-h"><div><b>' + n + ' new screens</b><span>Added since the dev-team PDF: ' + fromPdf + ' the PDF asked for, ' + (n - fromPdf) + ' our additions. ' +
    'Screens the prototype already had before the PDF are not counted, even where they moved or changed form (Confirm location, Add patient, Payment successful, Offline, Live map).</span></div>' +
    '<button type="button" class="ns-x" aria-label="Close">×</button></div>' +
    NEW.map(g => '<h4>' + g[0] + ' · ' + g[1].length + '</h4>' + g[1].map(row).join('')).join('') + '</div>';
  document.body.appendChild(ov);
  const open = () => ov.classList.add('on'), close = () => ov.classList.remove('on');
  const btn = document.getElementById('newScrBtn');
  if (btn) { btn.innerHTML = '<b>' + n + '</b> new screens'; btn.title = 'Screens added since the client dev-team PDF'; btn.addEventListener('click', open); }
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('.ns-x')) { close(); return; }
    const r = e.target.closest('.ns-row[data-v]');
    if (r && window.FRH && FRH.panel) { FRH.panel.jump(r.dataset.v); ov.querySelectorAll('.ns-row.on').forEach(x => x.classList.remove('on')); r.classList.add('on'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
