/* FRH prototype — flow 8 content: profile, patients, addresses, medical
   reports, notifications, policies, about us, help & support and language.

   EVERY name, date, age, phone number, address, file size, figure, licence
   number, insurer, policy paragraph, FAQ answer and contact detail in this file
   is a PLACEHOLDER for FRH to confirm. Nothing here has been verified. It is
   kept in one file so the client's real copy can be dropped in without touching
   any screen code. */
window.FRHPROFILE = {

  /* ---------- 8.1 the account holder ---------- */
  me: {
    name: 'Sara Ahmed',
    phone: '+971 50 123 4567',
    email: 'sara.ahmed@example.com',
    ref: 'FRH-P-10284',
    since: 'March 2024',
  },

  /* ---------- 8.1 quick actions (3-up) ---------- */
  quick: [
    { id: 'patients', icon: 'users', label: 'Patients', meta: '3 saved' },
    { id: 'addresses', icon: 'pin', label: 'Addresses', meta: '3 saved' },
    { id: 'coupons', icon: 'sparkle', label: 'Coupons', meta: '2 active' },
  ],

  /* ---------- 8.1 menu list ---------- */
  menu: [
    { id: 'appts', icon: 'calendar', label: 'My appointments', sub: 'Upcoming, past and cancelled', badge: 'appts' },
    { id: 'reports', icon: 'file', label: 'Medical reports', sub: 'Visit reports, prescriptions and lab results' },
    { id: 'notifs', icon: 'bell', label: 'Notifications', sub: 'Reminders, results and offers', badge: 'notifs' },
    { id: 'policies', icon: 'shieldCheck', label: 'Policies', sub: 'Terms, privacy, refunds and consent' },
    { id: 'about', icon: 'home', label: 'About us', sub: 'Who FRH are and how we are licensed' },
    { id: 'support', icon: 'headset', label: 'Help & support', sub: 'FAQs, call, WhatsApp or email us' },
    { id: 'language', icon: 'globe', label: 'Change language', sub: 'English', value: 'lang' },
  ],

  /* ---------- 8.2 patients ---------- */
  patients: [
    { id: 'p1', name: 'Sara Ahmed', rel: 'Self', age: 34, dob: '12 Apr 1992', gender: 'Female', phone: '+971 50 123 4567', blood: 'O+', self: true, note: 'Account holder · Emirates ID on file' },
    { id: 'p2', name: 'Fatima Ahmed', rel: 'Mother', age: 62, dob: '3 Feb 1964', gender: 'Female', phone: '+971 50 998 7712', blood: 'A+', note: 'Knee rehab · session 2 of 6' },
    { id: 'p3', name: 'Yusuf Ahmed', rel: 'Son', age: 7, dob: '19 Nov 2018', gender: 'Male', phone: 'Uses Sara’s number', blood: 'B+', note: 'Paediatric visits only' },
  ],
  patientNote: 'FRH to confirm which details are mandatory for a home visit, and whether an Emirates ID is needed for every patient or only the account holder.',

  /* ---------- 8.3 saved addresses ---------- */
  addresses: [
    { id: 'a1', label: 'Home', icon: 'home', line: 'Villa 24, Al Barsha 1, Dubai', note: 'Gate code 4471 · park in the visitor bay', dflt: true },
    { id: 'a2', label: 'Mum’s place', icon: 'home', line: 'Flat 1203, Al Nahda 2, Sharjah', note: 'Lift is on the right of the lobby · call on arrival' },
    { id: 'a3', label: 'Office', icon: 'pin', line: 'Office 1106, Bay Square 6, Business Bay, Dubai', note: 'Reception will call you up · visits after 6 PM' },
  ],
  addressNote: 'Sharjah and Abu Dhabi coverage is assumed here. FRH to confirm the service area, and whether a visit outside Dubai carries a travel charge.',

  /* ---------- 8.4 medical reports, grouped by month ---------- */
  reports: [
    {
      month: 'September 2026', items: [
        { name: 'Blood panel results', type: 'lab', who: 'Sara Ahmed', date: '3 Sep', size: 'PDF · 1.1 MB' },
        { name: 'Doctor’s prescription', type: 'rx', who: 'Sara Ahmed', date: '2 Sep', size: 'PDF · 96 KB' },
        { name: 'Visit report · IV Therapy at Home', type: 'report', who: 'Sara Ahmed', date: '2 Sep', size: 'PDF · 240 KB' },
      ],
    },
    {
      month: 'August 2026', items: [
        { name: 'Vitamin D and full blood count', type: 'lab', who: 'Sara Ahmed', date: '16 Aug', size: 'PDF · 780 KB' },
        { name: 'Visit report · Lab sample collection', type: 'report', who: 'Sara Ahmed', date: '16 Aug', size: 'PDF · 180 KB' },
      ],
    },
    {
      month: 'July 2026', items: [
        { name: 'Physiotherapy assessment', type: 'report', who: 'Fatima Ahmed', date: '24 Jul', size: 'PDF · 320 KB' },
        { name: 'Referral letter · Orthopaedics', type: 'rx', who: 'Fatima Ahmed', date: '24 Jul', size: 'PDF · 140 KB' },
      ],
    },
  ],
  reportNote: 'Records are kept for the whole family under one account. FRH to confirm how long reports stay in the app and who may download a dependant’s file.',

  /* ---------- 8.5 notifications ---------- */
  notifications: [
    { id: 'n1', group: 'Today', type: 'appointment', title: 'Your team is on the way', body: 'Dr. Layla Haddad will arrive between 5:24 and 5:38 PM.', time: '5:12 PM', unread: true },
    { id: 'n2', group: 'Today', type: 'message', title: 'New message from Dr. Layla Haddad', body: 'Please keep Fatima’s recent blood pressure readings to hand.', time: '4:48 PM', unread: true },
    { id: 'n3', group: 'Today', type: 'medication', title: 'Time for your Vitamin D3', body: 'One capsule weekly, with food. Week 4 of 8.', time: '9:00 AM', unread: false },
    { id: 'n4', group: 'Yesterday', type: 'lab', title: 'Your lab results are ready', body: 'Vitamin D and full blood count, reviewed by Dr. Omar Haddad.', time: '6:20 PM', unread: true },
    { id: 'n5', group: 'Yesterday', type: 'payment', title: 'Payment received', body: 'AED 420 for booking FRH-24817, card ending 4242.', time: '5:02 PM', unread: false },
    { id: 'n6', group: 'Earlier', type: 'offer', title: '20% off your next home visit', body: 'Use code WELCOME20 before 30 September.', time: 'Fri 25 Sep', unread: false },
    { id: 'n7', group: 'Earlier', type: 'report', title: 'Visit report uploaded', body: 'IV Therapy at Home, 2 September. Ready to download.', time: 'Wed 3 Sep', unread: false },
    { id: 'n8', group: 'Earlier', type: 'tip', title: 'Staying hydrated in Dubai', body: 'Aim for 2.5 litres a day while the humidity stays high.', time: 'Tue 2 Sep', unread: false },
  ],
  notifNote: 'Push, WhatsApp and email all land here as one list. FRH to confirm which reminders a patient may switch off and which are clinically required.',

  /* ---------- 8.6 / policy-text ---------- */
  policyUpdated: 'Last updated 12 August 2026',
  policies: [
    {
      id: 'terms', icon: 'file', title: 'Terms of use', sub: 'Using the FRH app and booking a visit',
      body: [
        { h: '', p: 'These terms cover your use of the FRH Healthcare app and any home visit, teleconsultation or laboratory service you book through it. By creating an account you agree to them.' },
        { h: 'Booking a visit', p: 'A booking is confirmed once payment is authorised and a clinician has been assigned. Arrival windows are estimates and may move if a clinician is held up at an earlier visit. We will tell you in the app if that happens.' },
        { h: 'Your responsibilities', p: 'Please give accurate medical information for every patient on the booking, including allergies and current medication, and make sure someone over 18 is present for a visit to a child.' },
        { h: 'Changes to these terms', p: 'We may update these terms as services change. You will be told in the app before an updated version takes effect, and continuing to use FRH means you accept it.' },
      ],
    },
    {
      id: 'privacy', icon: 'lock', title: 'Privacy policy', sub: 'What we hold, and who can see it',
      body: [
        { h: '', p: 'FRH Healthcare holds your personal and medical information to deliver care, meet our regulatory duties and improve our service. We do not sell it.' },
        { h: 'What we collect', p: 'Your name, contact details, Emirates ID where required, the addresses you save, the patients you add, your booking history and the clinical records created during a visit.' },
        { h: 'Who can see it', p: 'Only the clinicians treating you, the FRH staff supporting your booking, and our accredited partner laboratories. Insurers see only what is needed to settle a claim.' },
        { h: 'Your choices', p: 'You can ask for a copy of your records, correct anything wrong, or ask us to delete your account. Records we must keep by law will be retained for the required period.' },
      ],
    },
    {
      id: 'refund', icon: 'card', title: 'Refund and cancellation policy', sub: 'Cancelling, rescheduling and refunds',
      body: [
        { h: '', p: 'Plans change. This policy explains when a visit can be cancelled or moved, and how any refund reaches you.' },
        { h: 'Cancelling a visit', p: 'Cancel free of charge up to 4 hours before the arrival window. Inside 4 hours a fee may apply, and no refund is due once a clinician has arrived at your address.' },
        { h: 'Rescheduling', p: 'You can move a visit at no cost up to 4 hours before it starts, subject to a clinician being free in the new slot. Your price stays the same.' },
        { h: 'How refunds are paid', p: 'Refunds go back to the card or wallet you paid with, usually within 5 to 7 working days.' },
      ],
    },
    {
      id: 'consent', icon: 'stetho', title: 'Consent to treatment', sub: 'What you agree to before a visit',
      body: [
        { h: '', p: 'Before any examination, test or treatment, the clinician will explain what is proposed, why it is recommended and what the alternatives are.' },
        { h: 'Giving consent', p: 'Consent is recorded in the app at booking and confirmed verbally at the visit. You may withdraw it at any point, including part way through a procedure.' },
        { h: 'Consent for others', p: 'A parent or legal guardian consents for a child under 18. For an adult who cannot consent for themselves, the clinician will follow Dubai Health Authority guidance.' },
        { h: 'In an emergency', p: 'If a patient is at immediate risk and cannot consent, our clinician will provide urgent care and call 998, then tell you as soon as possible.' },
      ],
    },
    {
      id: 'insurance', icon: 'shieldCheck', title: 'Insurance and billing', sub: 'Direct billing, claims and receipts',
      body: [
        { h: '', p: 'FRH works with a number of UAE insurers. Cover depends on your plan, so please check before you book.' },
        { h: 'Direct billing', p: 'Where your insurer is a partner and your plan covers home visits, we bill them directly and you pay only the co-payment shown at checkout.' },
        { h: 'Pay and claim', p: 'If direct billing is not available, you pay in full and we issue a stamped invoice and clinical summary you can submit to your insurer.' },
        { h: 'Receipts', p: 'Every invoice, along with VAT at 5%, is saved to Medical reports in the app so you can download it whenever you need it.' },
      ],
    },
    {
      id: 'rights', icon: 'users', title: 'Patient rights and responsibilities', sub: 'What you can expect from us',
      body: [
        { h: '', p: 'Every patient treated by FRH has the same rights, whatever service they book and whoever pays for it.' },
        { h: 'Your rights', p: 'Safe, respectful care from a licensed clinician; a clear explanation of what is proposed and what it costs; privacy in your own home; and a copy of your records on request.' },
        { h: 'Your responsibilities', p: 'Give complete medical information, be at the address you booked within the arrival window, and treat our clinicians with the same respect they show you.' },
        { h: 'If something goes wrong', p: 'Tell us within 48 hours through Help and support. We will investigate, reply within two working days and put it right or refund you.' },
      ],
    },
  ],

  /* ---------- 8.7 about us ---------- */
  about: {
    tagline: 'Care that comes home',
    version: 'Version 1.0 · Build 2026.09',
    intro: 'FRH Healthcare brings licensed medical care to your door across Dubai. Doctors, nurses, physiotherapists and lab teams arrive at your home, your hotel or your office, usually within the hour, so a routine problem never costs you a day in a waiting room.',
    mission: 'To make good healthcare as easy to reach as anything else you book on your phone, without giving up the standards you expect from a hospital.',
    stats: [
      { n: '12,400+', l: 'Home visits' },
      { n: '80+', l: 'Clinicians' },
      { n: '42 min', l: 'Average arrival' },
      { n: '4.9', l: 'Patient rating' },
    ],
    values: [
      { icon: 'shieldCheck', title: 'Licensed, always', sub: 'Every clinician is DHA licensed and background checked before their first visit.' },
      { icon: 'clock', title: 'On the hour, not the day', sub: 'One arrival window, tracked live, and a call if anything slips.' },
      { icon: 'lock', title: 'Private by default', sub: 'Records stay inside the app and are shared only with the team treating you.' },
    ],
    licence: { title: 'DHA facility licence', number: 'DHA-F-0094821', body: 'FRH Healthcare is licensed by the Dubai Health Authority as a home healthcare provider.' },
    insurers: ['Daman', 'Sukoon', 'AXA', 'Cigna', 'Allianz', 'MetLife'],
    links: [
      { icon: 'globe', label: 'frhhealthcare.ae', sub: 'Our website' },
      { icon: 'users', label: 'Work with us', sub: 'Clinical and support roles' },
      { icon: 'starFill', label: 'Rate FRH on the App Store', sub: 'Takes about 20 seconds' },
    ],
  },

  /* ---------- 8.8 help & support ---------- */
  faqs: [
    { q: 'How quickly can a doctor reach me?', a: 'About 45 minutes anywhere in Dubai, day or night. You will see a live arrival window as soon as a clinician is assigned, and you can track them on the map.' },
    { q: 'Which areas do you cover?', a: 'All of Dubai and Sharjah today. Abu Dhabi, Al Ain and Ras Al Khaimah are coming soon — add your address and we will let you know when we reach you.' },
    { q: 'Do you accept my insurance?', a: 'We bill a number of UAE insurers directly. If yours is not a partner, you pay in the app and we send a stamped invoice you can claim back.' },
    { q: 'Can I book a visit for someone else?', a: 'Yes. Add them under Patients, then choose them at checkout. You can book for several patients in one visit and pay once.' },
    { q: 'What happens if I need to cancel?', a: 'Cancel from the appointment in the app and any refund starts straight away. Whether a fee applies depends on how close the visit is; see the refund and cancellation policy.' },
    { q: 'Are your clinicians licensed?', a: 'Every doctor, nurse and physiotherapist holds a current Dubai Health Authority licence, and you can see their name and role before they arrive.' },
  ],
  contact: [
    { id: 'call', icon: 'phone', label: 'Call us', value: '800 374', sub: 'Open 24 hours, every day', tint: '' },
    { id: 'wa', icon: 'chat', label: 'WhatsApp', value: '+971 55 010 3740', sub: 'Typically replies in 5 minutes', tint: 'green' },
    { id: 'mail', icon: 'mail', label: 'Email', value: 'care@frhhealthcare.ae', sub: 'Replies within one working day', tint: 'blue' },
  ],
  subjects: ['A booking', 'Billing or refund', 'Medical records', 'A problem with the app', 'Something else'],
  supportNote: 'Response times are placeholders. FRH to confirm the support hours, the WhatsApp number and who handles clinical questions out of hours.',

  /* ---------- 8.9 language ---------- */
  languages: [
    { id: 'en', name: 'English', native: 'English', sub: 'App default', flag: 'GB' },
    { id: 'ar', name: 'Arabic', native: 'العربية', sub: 'Arabic', flag: 'AE' },
    { id: 'hi', name: 'Hindi', native: 'हिन्दी', sub: 'Hindi', flag: 'IN' },
    { id: 'tl', name: 'Tagalog', native: 'Tagalog', sub: 'Filipino', flag: 'PH' },
  ],
  languageNote: 'The four languages shown match FRH’s largest patient groups. Wording for each is a placeholder until translation is signed off.',
  rtlNote: 'Arabic is listed, but the full right-to-left layout is a later phase: mirrored navigation, Arabic numerals and clinical copy translated and reviewed. Picking it here changes the setting only.',
};
