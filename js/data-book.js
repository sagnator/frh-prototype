/* FRH prototype — placeholder content for browsing, cart and checkout (flows 3–5).
   EVERYTHING HERE IS A PLACEHOLDER for FRH to confirm: category names, service
   names, AED prices, durations, inclusions, FAQs, reviews and coupon rules. */
window.FRHBOOK = {
  /* ---------- 3.1 category grid ---------- */
  categories: [
    { key: 'doctor', icon: 'stetho', name: 'Doctor on Call', badge: 'Popular', from: 350 },
    { key: 'iv', icon: 'drip', name: 'IV Therapy', badge: 'Popular', from: 450 },
    { key: 'lab', icon: 'lab', name: 'Lab Tests', badge: 'Same day', from: 120 },
    { key: 'physio', icon: 'physio', name: 'Physiotherapy', from: 300 },
    { key: 'dentist', icon: 'heartPulse', name: 'Dentist at Home', badge: 'New', from: 400 },
    { key: 'nutrition', icon: 'users', name: 'Nutritionist', from: 280 },
    { key: 'checkup', icon: 'shieldCheck', name: 'Health Packages', from: 499 },
    { key: 'ambulance', icon: 'ambulance', name: 'Ambulance', from: 0 },
    { key: 'vaccine', icon: 'syringe', name: 'Vaccinations', from: 180 },
    { key: 'nursing', icon: 'heartPulse', name: 'Home Nursing', from: 250 },
  ],

  /* ---------- 3.2 sub-category lists (keyed by category) ---------- */
  subcats: {
    doctor: [
      { id: 'gp', img: 'doc-1.jpg', name: 'General Practitioner visit', lab: 'FRH clinical team · DHA licensed', price: 350, dur: '30–45 min', badge: 'Popular' },
      { id: 'peds', img: 'doc-2.jpg', name: 'Paediatric home visit', lab: 'FRH clinical team · DHA licensed', price: 450, dur: '30–45 min' },
      { id: 'night', img: 'doc-6.jpg', name: 'Night doctor visit', lab: 'After 10 PM · surcharge applies', price: 500, dur: '30–45 min' },
      { id: 'tele', img: 'doc-5.jpg', name: 'Video consultation', lab: 'Doctor on video in ~15 min', price: 99, dur: '15 min', badge: 'New' },
    ],
    lab: [
      { id: 'pcr', img: 'banner-3.jpg', name: 'Regular PCR', lab: 'DHA-approved partner lab', price: 90, dur: 'Results in 24 hrs', badge: 'Same day' },
      { id: 'cbc', img: 'banner-3.jpg', name: 'Full blood count', lab: 'DHA-approved partner lab', price: 140, dur: 'Results in 24 hrs' },
      { id: 'vitd', img: 'banner-3.jpg', name: 'Vitamin D + B12 panel', lab: 'DHA-approved partner lab', price: 240, dur: 'Results in 24 hrs' },
      { id: 'stdbasic', img: 'banner-3.jpg', name: 'STD Basic Panel', lab: '5 tests · discreet home visit', price: 650, dur: 'Results in 48 hrs' },
      { id: 'stdfull', img: 'banner-3.jpg', name: 'STD Comprehensive', lab: '10 tests · discreet home visit', price: 1200, dur: 'Results in 48 hrs' },
      { id: 'expcr', img: 'banner-3.jpg', name: 'Express PCR', lab: 'DHA-approved partner lab', price: 180, dur: 'Results in 6 hrs', badge: 'Same day' },
    ],
    iv: [
      { id: 'nad', img: 'banner-2.jpg', name: 'NAD+ Therapy', lab: 'Nurse-administered · choose dosage', price: 1200, dur: '2–3 hrs', variants: true, badge: 'Popular' },
      { id: 'immune', img: 'banner-2.jpg', name: 'Immunity booster drip', lab: 'Vitamin C, zinc, B-complex', price: 450, dur: '45–60 min' },
      { id: 'hydra', img: 'banner-2.jpg', name: 'Hydration drip', lab: 'Electrolytes + B12', price: 390, dur: '30–45 min' },
    ],
    checkup: [
      { id: 'basic', img: 'banner-1.jpg', name: 'Essential health check', lab: '28 lab markers · doctor review', price: 499, dur: '30 min at home', badge: 'Popular' },
      { id: 'family', img: 'banner-1.jpg', name: 'Family package (4 people)', lab: 'Full panel each · one visit', price: 1499, dur: '60–90 min' },
    ],
    dentist: [
      { id: 'scaling', img: 'doc-4.jpg', name: 'Scaling & polishing', lab: 'Portable dental unit', price: 400, dur: '45 min', badge: 'New' },
      { id: 'dcheck', img: 'doc-4.jpg', name: 'Dental check-up', lab: 'Exam + treatment plan', price: 250, dur: '30 min' },
    ],
    nutrition: [
      { id: 'nutri', img: 'doc-2.jpg', name: 'Nutrition consultation', lab: 'Plan sent in the app', price: 280, dur: '45 min' },
    ],
    vaccine: [
      { id: 'flu', img: 'banner-3.jpg', name: 'Seasonal flu vaccine', lab: 'Adults and children over 6 months', price: 180, dur: '15 min' },
      { id: 'travel', img: 'banner-3.jpg', name: 'Travel vaccination', lab: 'Certificate issued', price: 320, dur: '20 min' },
    ],
    nursing: [
      { id: 'shift4', img: 'banner-2.jpg', name: 'Nursing shift · 4 hours', lab: 'DHA-licensed nurse', price: 250, dur: '4 hrs', badge: 'Popular' },
      { id: 'shift12', img: 'banner-2.jpg', name: 'Nursing shift · 12 hours', lab: 'Day or night cover', price: 650, dur: '12 hrs' },
    ],
    ambulance: [
      { id: 'amb', img: 'onb-1.jpg', name: 'Private ambulance transfer', lab: 'Quoted on the call · 998 for emergencies', price: 0, dur: 'On request' },
    ],
    physio: [
      { id: 'ortho', img: 'onb-3.jpg', name: 'Orthopaedic physiotherapy', lab: 'Mark Evans + team', price: 300, dur: '45–60 min' },
      { id: 'post', img: 'onb-3.jpg', name: 'Post-surgery rehab', lab: 'Package of 6 sessions', price: 1650, dur: '6 × 60 min' },
      { id: 'knee5', img: 'onb-3.jpg', name: 'Knee rehab package', lab: 'Bundle of 5 sessions', price: 1700, dur: '5 × 60 min' },   /* v45 */
    ],
  },

  /* ---------- 3.3 variants (dosage) ---------- */
  variants: {
    title: 'Choose your NAD+ dosage',
    note: 'First-time patients usually start at 250 mg. Your nurse reviews your history before starting, and can stop the infusion at any point.',
    options: [
      { name: '250 mg', desc: 'First session · 2 hrs', price: 1200 },
      { name: '500 mg', desc: 'Regular course · 2.5 hrs', price: 1900 },
      { name: '750 mg', desc: 'Advanced · 3 hrs', price: 2600 },
    ],
  },

  /* ---------- 3.4 service detail ---------- */
  detail: {
    gp: {
      img: 'onb-1.jpg', name: 'General Practitioner visit', badges: ['24/7', 'Home visit'],
      rating: 4.8, reviews: 233, price: 350, dur: '30–45 min',
      overview: 'A DHA-licensed GP comes to you for anything you would normally see a family doctor about: fevers, infections, stomach upsets, minor injuries, prescriptions and sick notes. They carry a full examination kit and common medicines, so most visits are finished in one appointment.',
      included: [
        'Full medical consultation and examination',
        'Vital signs: blood pressure, temperature, oxygen, pulse',
        'Prescription issued and medicines delivered if needed',
        'Free follow-up call within 48 hours',
        'Medical certificate on request',
      ],
      steps: [
        ['Book', 'Pick a time, or ask for the next available doctor.'],
        ['Confirmation', 'You get a WhatsApp confirmation with the doctor’s name.'],
        ['Doctor arrives', 'Track the team live on the map, right to your door.'],
        ['Consultation', 'Examination, diagnosis and treatment at home.'],
        ['Post-care', 'Notes, prescription and reports land in the app.'],
      ],
      trust: [
        ['shieldCheck', 'DHA-licensed clinicians', 'Every doctor is licensed by the Dubai Health Authority.'],
        ['lock', 'Private records', 'Your notes and results stay encrypted in the app.'],
        ['card', 'Secure payment', 'Pay by card, Apple Pay, or through insurance.'],
        ['headset', '24/7 support', 'A real person answers, day or night.'],
      ],
      faqs: [
        ['How should I prepare for the visit?', 'Have your Emirates ID and any current medicines to hand. If the patient is a child, keep their vaccination card nearby.'],
        ['Can I reschedule or cancel?', 'Yes — free up to 4 hours before the visit, from the appointment card. (Window to be confirmed by FRH.)'],
        ['Do you accept insurance?', 'Insurance handling is being confirmed with FRH. For now the prototype shows card payment only.'],
        ['Are the doctors licensed in the UAE?', 'Yes. Every clinician holds a current DHA licence, and their licence number appears on your visit report.'],
      ],
      reviewsList: [
        { name: 'Huda A.', when: '2 weeks ago', stars: 5, text: 'The doctor arrived in 35 minutes at 11 PM and was wonderful with my son. Prescription arrived an hour later.' },
        { name: 'James P.', when: 'Last month', stars: 5, text: 'Far easier than sitting in a clinic. Clear explanation and a follow-up call two days later, as promised.' },
        { name: 'Mariam K.', when: 'Last month', stars: 4, text: 'Great care. The arrival window slipped by about 15 minutes, but the tracking kept me informed.' },
      ],
      similar: ['peds', 'night'],
    },
  },

  /* ---------- 3.5 doctor profile ---------- */
  doctor: {
    img: 'doc-1.jpg', name: 'Dr. Omar Haddad', creds: 'MBBS, MD (Internal Medicine)',
    rating: 4.9, reviews: 233, langs: ['English', 'Arabic', 'Hindi'],
    stats: [['2,500+', 'Patients'], ['10 yrs', 'Experience'], ['233', 'Reviews']],
    about: 'Dr. Omar has spent ten years in internal and family medicine across Dubai and Amman, the last four of them in home-visit care. He treats adults and teenagers, with a particular interest in diabetes and blood-pressure management. He speaks English, Arabic and Hindi.',
  },

  /* ---------- 4.1 cart ---------- */
  cart: [
    { id: 'gp', name: 'General Practitioner visit', sub: 'Doctor on Call', dur: '30–45 min', price: 350, qty: 1, night: 70 },
    { id: 'cbc', name: 'Full blood count', sub: 'Lab Tests', dur: 'Results in 24 hrs', price: 140, qty: 1, night: 0 },
  ],
  coupons: [
    { code: 'WELCOME20', pct: 20, desc: '20% off your first home visit', max: 150 },
    { code: 'FRH500', pct: 0, flat: 500, desc: 'AED 500 off annual health packages', min: 1499 },
  ],

  /* ---------- 5.2 patients ---------- */
  /* kept in step with js/data-profile.js — same three people, same details */
  patients: [
    { name: 'Sara Ahmed', rel: 'Myself', age: 34, gender: 'Female', blood: 'O+', phone: '+971 50 123 4567' },
    { name: 'Fatima Ahmed', rel: 'Mother', age: 62, gender: 'Female', blood: 'A+', phone: '+971 50 998 7712' },
    { name: 'Yusuf Ahmed', rel: 'Son', age: 7, gender: 'Male', blood: 'B+', phone: '—' },
  ],

  /* ---------- 5.3 addresses ---------- */
  addresses: [
    /* same three addresses as FRHPROFILE.addresses (Profile › Addresses), in the same order */
    { label: 'Home', line: 'Villa 24, Al Barsha 1, Dubai', note: 'Gate code 4471 · park in the visitor bay', def: true },
    { label: 'Mum’s place', line: 'Flat 1203, Al Nahda 2, Sharjah', note: 'Lift is on the right of the lobby · call on arrival', def: false },
    { label: 'Office', line: 'Office 1106, Bay Square 6, Business Bay, Dubai', note: 'Reception will call you up · visits after 6 PM', def: false },
  ],

  /* ---------- 5.4 payment ---------- */
  payments: [
    { key: 'visa', icon: 'card', label: 'Visa ending 4242', sub: 'Expires 09/29', def: true },
    { key: 'apple', icon: 'phone', label: 'Apple Pay', sub: 'Face ID confirmation' },
    { key: 'cash', icon: 'card', label: 'Cash on visit', sub: 'Pay the clinician at your door' },
    { key: 'insurance', icon: 'shieldCheck', label: 'Insurance', sub: 'Direct billing — to be confirmed with FRH', off: true },
  ],
  vatRate: 0.05,
};
