/* FRH prototype — placeholder content.
   EVERYTHING IN THIS FILE IS A PLACEHOLDER for FRH to confirm: service names,
   AED prices, durations, test panels, clinician names, ratings and review counts.
   It is kept in one file so the client's real list can be dropped in without
   touching any screen code. */
window.FRHDATA = {
  user: { name: 'Sara Ahmed', phone: '+971 50 123 4567', address: 'Home · Al Barsha 1' },

  /* Home — promotional carousel */
  banners: [
    { img: 'banner-1.jpg', tag: 'Family package', title: 'Family Health Package', sub: 'Full check-up for 4 · AED 1,499', cta: 'View package' },
    { img: 'banner-2.jpg', tag: 'Home nursing', title: 'Nursing care at home', sub: 'From AED 250 a visit · 4, 8 or 12 hrs', cta: 'Explore nursing' },
    { img: 'banner-3.jpg', tag: 'Lab tests', title: 'Blood tests without the clinic', sub: 'Sample taken at home · results in 24 hrs', cta: 'Book a test' },
  ],

  /* Home — offer strip */
  offers: [
    { amount: 'UP TO AED 500 OFF', title: 'Annual health packages', sub: 'Until 30 Sep', code: 'FRH500', tone: 'red' },
    { amount: '20% OFF', title: 'Your first home visit', sub: 'New patients only', code: 'WELCOME20', tone: 'ink' },
    { amount: 'FREE', title: 'Follow-up consultation', sub: 'With every doctor visit', code: '', tone: 'green' },
  ],

  /* Home — services grid (2 columns) + Category listing later */
  services: [
    { icon: 'stetho', name: 'Doctor on Call', from: 350, note: '24/7', badge: 'Popular' },
    { icon: 'heartPulse', name: 'Health Checkup', from: 499, note: 'Packages' },
    { icon: 'physio', name: 'Physiotherapy', from: 300, note: 'Per session' },
    { icon: 'users', name: 'Nursing Care', from: 250, note: '4–12 hrs' },
    { icon: 'drip', name: 'IV Therapy at Home', from: 450, note: '45–60 min', badge: 'Popular' },
    { icon: 'lab', name: 'Lab Tests', from: 120, note: 'Results in 24 hrs' },
    { icon: 'syringe', name: 'Vaccinations', from: 180, note: 'Flu · Travel' },
    { icon: 'video', name: 'Teleconsultation', from: 99, note: 'In 15 min', badge: 'New' },
  ],

  /* Home — featured test cards */
  pcr: [
    { name: 'Regular PCR', lab: 'DHA-approved partner lab', turnaround: 'Results in 24 hrs', price: 90 },
    { name: 'Express PCR', lab: 'DHA-approved partner lab', turnaround: 'Results in 6 hrs', price: 180 },
    { name: 'Travel PCR + certificate', lab: 'Accepted for travel', turnaround: 'Results in 12 hrs', price: 150 },
  ],
  std: [
    { name: 'STD Basic Panel', lab: '5 tests · discreet home visit', turnaround: 'Results in 48 hrs', price: 650 },
    { name: 'STD Comprehensive', lab: '10 tests · discreet home visit', turnaround: 'Results in 48 hrs', price: 1200 },
    { name: 'Single test', lab: 'HIV, Hepatitis B or C', turnaround: 'Results in 48 hrs', price: 250 },
  ],

  /* Home — top-rated professionals */
  doctors: [
    { img: 'doc-1.jpg', name: 'Dr. Omar Haddad', role: 'Internal Medicine', rating: 4.9, reviews: 233, tag: 'Available now' },
    { img: 'doc-2.jpg', name: 'Dr. Priya Nair', role: 'Paediatrics', rating: 4.9, reviews: 187 },
    { img: 'doc-3.jpg', name: 'Grace Santos', role: 'Senior Nurse', rating: 4.8, reviews: 164, tag: 'Available now' },
    { img: 'doc-4.jpg', name: 'Mark Evans', role: 'Physiotherapist', rating: 4.8, reviews: 121 },
    { img: 'doc-5.jpg', name: 'Dr. Layla Haddad', role: 'General Practitioner', rating: 4.9, reviews: 298, tag: 'On a visit' },
    { img: 'doc-6.jpg', name: 'Dr. Samuel Okoye', role: 'Family Medicine', rating: 4.7, reviews: 96 },
  ],

  /* Home — health insights */
  tips: [
    { icon: 'drip', title: 'Stay hydrated', sub: '2.5 L a day in Dubai heat', tone: 'blue' },
    { icon: 'heartPulse', title: 'Mental wellness', sub: '5-minute breathing reset', tone: 'violet' },
    { icon: 'lab', title: 'Nutrition plan', sub: 'Build a balanced plate', tone: 'green' },
  ],

  /* Appointments (Flow 6) */
  appointments: {
    upcoming: [
      {
        id: 'FRH-24817', status: 'ongoing', statusLabel: 'On the way', badge: 'NEW',
        service: 'Doctor on Call', sub: 'General consultation · night visit',
        date: 'Today', time: '5:30 – 6:15 PM', patients: ['Sara Ahmed', 'Fatima Ahmed (Mum)'],
        address: 'Home · Al Barsha 1, Villa 24', team: 'Dr. Layla Haddad +1', total: 420, tracking: true,
      },
      {
        id: 'FRH-24790', status: 'confirmed', statusLabel: 'Confirmed', badge: 'Follow Up',
        service: 'Physiotherapy', sub: 'Session 2 of 6 · knee rehab',
        date: 'Thu 1 Oct', time: '10:00 – 11:00 AM', patients: ['Fatima Ahmed (Mum)'],
        address: 'Home · Al Barsha 1, Villa 24', team: 'Mark Evans', total: 300,
      },
    ],
    completed: [
      {
        id: 'FRH-24512', status: 'completed', statusLabel: 'Completed',
        service: 'IV Therapy at Home', sub: 'Immunity drip · 45 min',
        date: 'Tue 2 Sep', time: '8:00 – 8:45 PM', patients: ['Sara Ahmed'],
        address: 'Home · Al Barsha 1, Villa 24', team: 'Grace Santos', total: 450,
        reports: 2, prescription: true, rated: 0,
      },
      {
        id: 'FRH-24388', status: 'completed', statusLabel: 'Completed',
        service: 'Lab Tests', sub: 'Vitamin D + full blood count',
        date: 'Sat 16 Aug', time: '7:30 – 7:50 AM', patients: ['Sara Ahmed'],
        address: 'Home · Al Barsha 1, Villa 24', team: 'Grace Santos', total: 240,
        reports: 1, prescription: false, rated: 5,
      },
    ],
    cancelled: [
      {
        id: 'FRH-24201', status: 'cancelled', statusLabel: 'Cancelled',
        service: 'Dentist at Home', sub: 'Scaling & polishing',
        date: 'Thu 28 Aug', time: '6:00 – 7:00 PM', patients: ['Sara Ahmed'],
        address: 'Home · Al Barsha 1, Villa 24', total: 400,
        refund: { amount: 400, status: 'Refunded', date: '2 Sep' },
      },
    ],
  },

  /* Live tracking (screen 6.2) */
  tracking: {
    id: 'FRH-24817', eta: '5:24 – 5:38 PM', distance: '3.2 km away', minutes: 12,
    steps: ['Booked', 'Team assigned', 'On the way', 'Arrived'], step: 2,
    destination: 'Villa 24, Al Barsha 1, Dubai',
    note: 'Gate code 4471 · park in the visitor bay',
    team: [
      { img: 'doc-5.jpg', name: 'Dr. Layla Haddad', role: 'General Practitioner · DHA licensed', lead: true },
      { img: 'doc-3.jpg', name: 'Grace Santos', role: 'Senior Nurse · DHA licensed' },
    ],
    summary: { service: 'Doctor on Call', patients: 2, subtotal: 400, vat: 20, total: 420, night: 'Night visit surcharge included (after 10 PM)' },
  },

  /* Post-visit detail (screen 6.3) */
  visit: {
    id: 'FRH-24512',
    sessions: [
      { name: 'IV Therapy at Home', time: 'Tue 2 Sep · 8:00 – 8:45 PM', issue: 'Fatigue and low immunity after travel', clinician: 'Grace Santos' },
    ],
    reports: [
      { name: 'Vitals & infusion record', size: 'PDF · 240 KB', date: '2 Sep' },
      { name: 'Blood panel results', size: 'PDF · 1.1 MB', date: '3 Sep' },
    ],
    prescription: [
      { name: 'Vitamin D3 50,000 IU', dose: 'One capsule weekly · 8 weeks' },
      { name: 'Oral rehydration salts', dose: 'One sachet daily · 5 days' },
    ],
    notes: 'Patient responded well to the infusion. Recommend repeat vitamin D panel in 8 weeks and 2.5 L water daily.',
  },

  cancelReasons: [
    'I no longer need the service',
    'I booked the wrong service or time',
    'The price is higher than expected',
    'I found another provider',
    'Other reason',
  ],
};
