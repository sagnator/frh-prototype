/* FRH prototype — placeholder content for HealthAssist chat (flow 7) and the
   utility screens (flow 9).
   EVERYTHING IN THIS FILE IS A PLACEHOLDER for FRH to confirm: the specialists
   offered in chat, clinician names and photos, reply times, every scripted
   message, the search suggestions, and the maintenance and coming-soon copy.
   One rule is deliberate and should survive into the real build: HealthAssist
   gathers information and points to a booking. It never names a condition,
   never diagnoses and never recommends a medicine or a dose. */
window.FRHCHAT = {

  /* ---------- 7.1 HealthAssist landing ---------- */
  home: {
    title: 'Welcome. We’re here to help with your health.',
    lead: 'Tell us what is going on. HealthAssist gathers a few details, then a DHA-licensed clinician takes over. Chatting is free, before and after a visit.',
    pick: 'Who would you like to talk to?',
    note: 'HealthAssist gathers information only — it does not diagnose or prescribe. For chest pain, breathing difficulty or a serious injury, call 998.',
    recent: 'Recent conversations',
    empty: 'Your conversations will be listed here, with the visit each one belongs to.',
  },

  /* Three specialisms, each with the clinician who answers.
     Photos are stand-ins from the shared prototype set. */
  specialists: [
    {
      key: 'doctor', icon: 'stetho', title: 'Doctor', desc: 'General health consultation',
      eta: 'Usually replies in ~2 min', img: 'doc-5.jpg',
      name: 'Dr. Layla Haddad', role: 'General Practitioner · DHA licensed',
    },
    {
      key: 'physio', icon: 'physio', title: 'Physiotherapist', desc: 'Physical therapy & rehab',
      eta: 'Usually replies in ~2 min', img: 'doc-4.jpg',
      name: 'Mark Evans', role: 'Physiotherapist · DHA licensed',
    },
    {
      key: 'dentist', icon: 'heartPulse', title: 'Dentist', desc: 'Dental health & oral care',
      eta: 'Usually replies in ~2 min', img: 'doctor.jpg',
      name: 'Dr. Amira Saleh', role: 'Dental surgeon · DHA licensed',
    },
  ],

  /* Recent conversations. The first is tied to a live booking. */
  recent: [
    { who: 'doctor', booking: 'FRH-24817', last: 'How can we help before she arrives?', when: '5:03 PM', unread: 2 },
    { who: 'physio', booking: '', last: 'You: thank you, I will keep to the same count.', when: '11:20 AM', unread: 0 },
  ],

  /* ---------- 7.2 conversation ---------- */
  chat: {
    day: 'Today',
    online: 'Online',
    typing: 'typing…',
    sys: 'HealthAssist gathers information for your care team. It does not diagnose or prescribe.',
    ctx: 'About booking',
    ctxCta: 'View',
    input: 'Type a message…',
    inputToast: 'Free typing comes with the real build — tap a quick reply for now',
    attachToast: 'Photos and reports can be attached in the real build',
    newIntro: 'Your message goes straight to your care team. They usually reply within a couple of minutes while a visit is open.',
    newSafety: 'HealthAssist gathers information only — it does not diagnose or prescribe. For chest pain, breathing difficulty or a serious injury, call 998.',
    newHint: 'Start with one of these, or type your own message.',
    callToast: 'Calling your care team is wired in the real app',
  },

  /* Scripted conversation trees. Each chip points at a node: the node holds
     what the patient sends, what comes back, and the next set of chips.
     A node with no chips of its own returns to the opening three. */
  threads: {
    doctor: {
      seed: [
        { from: 'them', t: 'Good evening Sara. I am HealthAssist, working with Dr. Layla Haddad’s team.', at: '5:02 PM' },
        { from: 'them', t: 'Your doctor visit is confirmed for today at 5:30 PM. How can we help before she arrives?', at: '5:03 PM' },
      ],
      start: [
        { t: 'About today’s visit', to: 'visit' },
        { t: 'I am feeling unwell', to: 'unwell' },
        { t: 'A medicine question', to: 'med' },
      ],
      nodes: {
        visit: {
          me: 'I have a question about today’s visit',
          reply: [
            'The visit is booked for 5:30 – 6:15 PM, with Dr. Layla Haddad and Grace Santos, and it is already paid for.',
            'Would you like to add anything for the doctor to look at while she is with you?',
          ],
          chips: [{ t: 'Yes, add a note', to: 'note' }, { t: 'What time will they arrive?', to: 'eta' }, { t: 'No, that is all', to: 'end' }],
        },
        note: {
          me: 'Yes — please add that my mother’s knee is sore',
          reply: [
            'Noted, thank you. I have added it to the visit so Dr. Layla can look at it while she is there.',
            'If the knee is painful to stand on, keep the weight off it until then.',
          ],
          chips: [{ t: 'Thank you', to: 'end' }, { t: 'Something else', to: 'unwell' }],
        },
        eta: {
          me: 'What time will the team arrive?',
          reply: [
            'The team is on the way, and the live map shows an arrival window of 5:24 – 5:38 PM.',
            'You can follow them from the appointment card at any time.',
          ],
          chips: [{ t: 'Add a note for the doctor', to: 'note' }, { t: 'Thank you', to: 'end' }],
        },
        unwell: {
          me: 'I have not been feeling well since last night',
          reply: ['I am sorry to hear that. So the team can prepare, what is bothering you most?'],
          chips: [{ t: 'Fever and chills', to: 'fever' }, { t: 'Cough and sore throat', to: 'cough' }, { t: 'An upset stomach', to: 'tummy' }],
        },
        fever: {
          me: 'Fever and chills',
          reply: ['Thank you. Have you been able to measure your temperature, and how long has it been there?'],
          chips: [{ t: '38.4 °C since last night', to: 'temp' }, { t: 'No thermometer at home', to: 'notemp' }],
        },
        temp: {
          me: '38.4 °C since last night',
          reply: [
            'That is noted for Dr. Layla, with the time it started.',
            'I cannot tell you what is behind it — that needs a clinician who can examine you. You already have a doctor at home today at 5:30 PM, which is the right place for it.',
            'Keep drinking water. If the fever climbs above 39 °C, or you feel short of breath before the visit, call 998.',
          ],
          chips: [{ t: 'That is reassuring, thank you', to: 'end' }, { t: 'Book another visit', to: 'book' }],
        },
        notemp: {
          me: 'I do not have a thermometer at home',
          reply: [
            'That is fine — the team carries one and will check it when they arrive.',
            'I have logged the chills and the time they started for Dr. Layla.',
          ],
          chips: [{ t: 'Thank you', to: 'end' }, { t: 'Book another visit', to: 'book' }],
        },
        cough: {
          me: 'A cough and a sore throat',
          reply: ['Thank you. How many days has it been, and is anyone else at home unwell?'],
          chips: [{ t: 'Three days, my son has it too', to: 'cough2' }, { t: 'Two days, only me', to: 'cough2' }],
        },
        cough2: {
          me: 'Three days, and my son has it too',
          reply: [
            'Noted for the doctor, with both names.',
            'I cannot say what it is over chat. A GP can examine you both in the same visit, and children are added to the same booking at no extra call-out.',
          ],
          chips: [{ t: 'Book a doctor visit', to: 'book' }, { t: 'That is all for now', to: 'end' }],
        },
        tummy: {
          me: 'An upset stomach since yesterday',
          reply: ['Thank you. Are you keeping fluids down, and is there a fever with it?'],
          chips: [{ t: 'Fluids are fine, no fever', to: 'tummy2' }, { t: 'There is a fever too', to: 'fever' }],
        },
        tummy2: {
          me: 'Fluids are fine and there is no fever',
          reply: [
            'Good — that is worth telling the doctor.',
            'Keep sipping water or an oral rehydration drink. If it carries on past two days, a clinician should see you the same day.',
          ],
          chips: [{ t: 'Book a doctor visit', to: 'book' }, { t: 'That is all for now', to: 'end' }],
        },
        med: {
          me: 'Can I take my usual tablets with this?',
          reply: [
            'I am not able to advise on medicines or doses over chat — that has to come from a clinician who can see your history.',
            'I have added the question to your visit, and Dr. Layla will go through your medicines with you in person.',
          ],
          chips: [{ t: 'Understood, thank you', to: 'end' }, { t: 'Something else', to: 'unwell' }],
        },
        book: {
          me: 'Please help me book a doctor visit',
          reply: [
            'Doctor on Call starts at AED 350, and a GP usually reaches Al Barsha in about 45 minutes.',
            'Choose a time from Our services on the home screen. I have carried these notes across, so you do not need to type them again.',
          ],
          chips: [{ t: 'Thank you', to: 'end' }],
        },
        end: {
          me: 'Thank you',
          reply: [
            'You are welcome, Sara. The chat stays open, so you can add anything else before or after the visit.',
            'Is there anything else I can help with?',
          ],
          chips: [],
        },
      },
    },

    physio: {
      seed: [
        { from: 'them', t: 'Hello Sara. Mark Evans here, from the FRH physiotherapy team. How is your mother’s knee rehab going?', at: '11:18 AM' },
        { from: 'me', t: 'Thank you, I will keep to the same count.', at: '11:20 AM' },
      ],
      start: [
        { t: 'Exercises between sessions', to: 'exer' },
        { t: 'There is pain afterwards', to: 'pain' },
        { t: 'Move the next session', to: 'move' },
      ],
      nodes: {
        exer: {
          me: 'Which exercises should we keep doing at home?',
          reply: [
            'The plan from session 2 is in the visit notes: heel slides, seated knee extensions and a short walk, twice a day.',
            'Stop anything that turns sharp rather than tiring, and tell me how it goes.',
          ],
          chips: [{ t: 'It feels tiring, not sharp', to: 'ok' }, { t: 'It is sharp at the end', to: 'pain' }],
        },
        ok: {
          me: 'It feels tiring rather than sharp',
          reply: ['That is the range we want. Keep the same count until Thursday and I will reassess the knee then.'],
          chips: [{ t: 'Thank you', to: 'thanks' }, { t: 'Move the next session', to: 'move' }],
        },
        pain: {
          me: 'There is pain at the end of the exercise',
          reply: [
            'Thank you for telling me. Stop at the point where it begins, rather than pushing through it.',
            'I would rather look at the joint than judge it over chat. The next session is Thursday at 10 AM — shall we keep that, or bring it forward?',
          ],
          chips: [{ t: 'Keep Thursday', to: 'thanks' }, { t: 'Bring it forward', to: 'move' }],
        },
        move: {
          me: 'Could we move the next session?',
          reply: [
            'Of course. You can move it from the appointment in the app, and the price stays the same.',
            'Open My appointments, tap the physiotherapy booking and choose Reschedule.',
          ],
          chips: [{ t: 'Thank you', to: 'thanks' }],
        },
        thanks: {
          me: 'Thank you',
          reply: ['You are welcome. Message me any time between sessions.'],
          chips: [],
        },
      },
    },

    dentist: {
      seed: [
        { from: 'them', t: 'Hello Sara. Dr. Amira Saleh here, from the FRH dental team. What can I help with?', at: '4:48 PM' },
      ],
      start: [
        { t: 'A sensitive tooth', to: 'sens' },
        { t: 'Book a scale and polish', to: 'clean' },
        { t: 'Do you visit at home?', to: 'visit' },
      ],
      nodes: {
        sens: {
          me: 'One tooth is sensitive to cold',
          reply: ['Thank you. How long has it been sensitive, and is it sore when you bite down as well?'],
          chips: [{ t: 'A week, only with cold', to: 'sens2' }, { t: 'It hurts when I bite', to: 'sens3' }],
        },
        sens2: {
          me: 'About a week, and only with cold drinks',
          reply: [
            'Noted. I cannot tell what is causing it without looking, but sensitivity like that is worth checking before it becomes painful.',
            'A dental check-up at home takes about 30 minutes and starts at AED 250. Until then, try to keep very cold drinks off that side.',
          ],
          chips: [{ t: 'Book a check-up', to: 'clean' }, { t: 'That is all for now', to: 'done' }],
        },
        sens3: {
          me: 'It also hurts when I bite down',
          reply: [
            'Thank you for telling me — that is worth seeing sooner rather than later.',
            'I would rather examine it than guess, so I have flagged it for the next dental slot today. If the pain becomes severe or your face swells, call 998.',
          ],
          chips: [{ t: 'Book a check-up', to: 'clean' }, { t: 'That is all for now', to: 'done' }],
        },
        clean: {
          me: 'I would like to book a scale and polish',
          reply: [
            'Scaling and polishing at home is AED 400 and takes about 45 minutes, with a portable dental unit.',
            'Pick a time from Dentist at Home on the services grid and I will carry these notes across.',
          ],
          chips: [{ t: 'Thank you', to: 'done' }],
        },
        visit: {
          me: 'Do you visit at home, or is it a clinic?',
          reply: [
            'We come to you. The team brings a portable chair, suction and a sterilised kit, and sets up in any room with a socket.',
            'Anything that needs a clinic — an X-ray or a root canal, for instance — is referred to a partner clinic, and we arrange that for you.',
          ],
          chips: [{ t: 'Book a check-up', to: 'clean' }, { t: 'That is all for now', to: 'done' }],
        },
        done: {
          me: 'Thank you',
          reply: ['You are welcome. The chat stays open if anything changes.'],
          chips: [],
        },
      },
    },
  },

  /* ---------- 9.3 search ---------- */
  search: {
    placeholder: 'Search for services or sub-services…',
    typeToast: 'Free typing comes with the real build — tap a recent search for now',
    recent: 'Recent searches',
    recentList: ['Blood test', 'Physiotherapy', 'Night doctor', 'Vitamin D', 'Dentist'],
    popular: 'Popular services',
    popularList: ['doctor', 'iv', 'lab', 'checkup'],
    groups: { cat: 'Services', sub: 'Sub-services' },
    service: 'Service',
    ambulance: 'Call 998',
    noneTitle: 'Nothing matched that',
    noneLine: 'Try a service name such as “Doctor on Call”, or one of the searches below.',
    openToast: 'opens the full service page in the booking flow',
    note: 'Search covers services and sub-services in this build. Clinicians, packages and past reports are to be confirmed with FRH.',
  },

  /* ---------- 9.1 maintenance ---------- */
  maintenance: {
    title: 'We’ll be back shortly',
    body: 'FRH is carrying out planned maintenance on the booking system, so the app is briefly unavailable. Nothing in your account is affected and every confirmed visit still stands.',
    eta: 'Estimated time remaining: about 35 minutes',
    cta: 'Try again',
    toast: 'Still under maintenance — please try again shortly',
    help: 'Need care now? Call 800 FRH, or dial 998 in an emergency.',
  },

  /* ---------- 9.2 coming soon ---------- */
  comingSoon: {
    title: 'Coming soon',
    body: 'FRH home visits run across Dubai today, and Sharjah and Abu Dhabi are next. We are not covering your area yet, but we are close.',
    eta: 'Expected in early 2027 — area and date to be confirmed by FRH.',
    cta: 'Notify me',
    toast: 'Thanks — we’ll message you the day FRH opens in your area',
    alt: 'Teleconsultation is already available everywhere in the UAE, from AED 99.',
  },
};
