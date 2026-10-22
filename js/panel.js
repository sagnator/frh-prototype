/* FRH prototype — presenter panel: OTP inbox, scenarios, screen index, caption. */
(function () {
  const { icon } = window.FRHI;
  const F = window.FRH, S = F.S;
  const P = document.getElementById('panel'), CAP = document.getElementById('caption');

  const VIEWS = [
    { g: 'Launch', items: [
      { id: 'ios', n: 'iPhone home screen', note: 'Start here — tap the FRH Health icon. The app opens with the native iOS zoom, just like on a real phone.' },
      { id: 'splash', n: 'Splash', note: 'A two-second brand moment, then the three intro slides before sign-in, as in the agency design.' },
    ] },
    { g: 'Onboarding', items: [
      { id: 'onb1', n: 'Care that comes home', note: 'Three slides instead of four, and local photography instead of stock illustration. Each photo sits in a doorway arch: care arriving at your door.' },
      { id: 'onb2', n: 'Book & track', note: 'Shows the product, not just a promise. The live arrival card previews how tracking works.' },
      { id: 'onb3', n: 'One app for the family', note: 'Services and trust signals (insurance, secure payments) together. Swipe or tap; the button grows into “Get started”.' },
    ] },
    { g: 'Sign in', items: [
      { id: 'phone', n: 'Mobile number', note: 'One screen for everyone: the code check tells us whether the number is new, so there is no sign-in/sign-up switch to guess at.' },
      { id: 'country', n: 'Country picker', note: 'GCC first, then the largest expat communities. Flags are drawn in code so they render on every device.' },
      { id: 'otp', n: 'Enter the code', note: 'Six boxes in two groups of three; typing moves on by itself, the code checks itself at the sixth digit, and a green tick confirms before moving on. Resend unlocks after 60 seconds.' },
      { id: 'otp-sms', n: 'Code from Messages', note: 'With SMS, iOS offers the code above the keypad; one tap types it in.' },
    ] },
    { g: 'Error states', err: true, items: [
      { id: 'err-phone', n: 'Invalid number', note: 'Inline and specific: it tells you what a valid UAE number looks like. A leading 0 is removed automatically.' },
      { id: 'err-wrong', n: 'Wrong code', note: 'The boxes shake and clear, and the message counts attempts left so the lockout is never a surprise. Old codes get their own message.' },
      { id: 'err-expired', n: 'Code expired', note: 'Amber, not red, and it says codes last 5 minutes, so it never reads as a wrong code.' },
      { id: 'err-locked', n: 'Too many attempts', note: 'A calm full-screen pause with a live countdown and two ways out. Because this is healthcare, the 998 ambulance line is always one tap away.' },
      { id: 'err-offline', n: 'No connection', note: 'A sheet over the screen you were on with Try again / Not now; nothing typed is lost.' },
      { id: 'err-failed', n: 'Code not delivered', note: 'If WhatsApp fails, SMS is one tap away (and the other way round).' },
      { id: 'err-email', n: 'Invalid email', note: 'Checked when you leave the field, and it never blocks an optional field that’s left empty.' },
    ] },
    { g: 'New patient', items: [
      { id: 'profile', n: 'Your details', note: 'New patients only: name, optional email and the health-data consent. Reminder settings live in Notification settings; “Create account” is the tap that creates it.' },
      { id: 'a-locperm', n: 'Location', note: 'Explains why before iOS asks; the button says Continue because the grant happens in the system alert, and typing an address is always offered.' },
      { id: 'a-ios-loc', n: 'iOS location alert', note: 'The real system prompt: Allow Once, Allow While Using App, Don’t Allow.' },
      { id: 'a-locdenied', n: 'Location off', note: 'Once iOS has said no, Settings is the only way back, so it offers Open Settings or typing the address.' },
      { id: 'a-addr', n: 'Address confirm', note: 'A short “Finding your address…”, then the detected address to confirm in one tap, with Edit if the pin is wrong.' },
      { id: 'px-address-onboarding', n: 'Type your address', note: 'The same address form as Profile, without the type picker; it saves as Home and continues.' },
      { id: 'a-city', n: 'City list', note: 'Only when detection fails or lands outside Dubai and Sharjah; live cities lead to the address form, the rest say Coming soon.' },
      { id: 'a-outside', n: 'Outside our area', note: 'One plain warning with ways out: choose a city we serve, get notified, or look around; video consults work anywhere in the UAE.' },
    ] },
    { g: 'Service page', items: [
      { id: 'v20-bleed', n: 'Full-bleed photo', note: 'New in v20. The photo runs edge to edge with the service name on it. Below it, three facts replace the old tags and lines: rating, when we can be there, how long it takes. The price sits on its own; who it is for is chosen in the cart (v23).' },
      { id: 'v32-cta-a', n: 'Still have questions · A card', note: 'New in v32. After the four FAQs: three clinician photos, “Still have questions?”, then Ask anything and See all FAQs, with a chat link. References via Mobbin: Kajabi and Apple Store.' },
      { id: 'v32-cta-b', n: 'Still have questions · B rows', note: 'Option B: a See all FAQs button under the list, then “Still need help?” with Ask anything and Chat with FRH Support (online, replies in about 2 min). Reference: Marcus, via Mobbin.' },
      { id: 'v32-cta-c', n: 'Still have questions · C ask inline', note: 'Option C: a dark Ask anything card with a question field and three suggested questions for this kind of service. Tapping one opens Ask anything already answering it. Reference: Cleo, via Mobbin.' },
      { id: 'v32-all-faqs', n: 'All FAQs', note: 'New screen. This service’s questions first, then booking and payment questions, with topic filters and a “Didn’t find your answer?” footer.' },
      { id: 'v27-how', n: 'How it works · A timeline', note: 'v28: icons on a dotted line, each step a title and one line. The “when” labels (Now, In minutes…) are gone because they don’t fit every service. Reference: Superpower’s test-prep timeline, via Mobbin.' },
      { id: 'v28-how-num', n: 'How it works · B numbered', note: 'Option B: black number circles on a solid line, no icons. The calmest of the three. Reference: Viator’s itinerary, via Mobbin.' },
      { id: 'v28-how-cards', n: 'How it works · C cards', note: 'Option C: swipeable step cards, each with an icon, its place in the order (1/5), a title and a line. The shortest on the page. References: Careem’s tips carousel and Hers’ “science of regrowth” cards, via Mobbin.' },
      { id: 'v28-added', n: 'After Add to cart', note: 'New in v28. Once this visit is in the cart, the sticky bar shows Added and Go to cart, so the top bar drops its cart button and keeps Share only. Before adding, the cart button stays, since the cart may hold other visits.' },
      { id: 'v27-how-lab', n: 'How it works · lab test', note: 'Each kind of service now has its own steps. Until v26, 21 services showed the doctor’s steps (“Doctor arrives”, “Consultation”) even for a blood test. A lab test goes: Book, Get ready, Nurse arrives, Sample taken, Results.' },
      { id: 'v27-how-nurse', n: 'How it works · nursing shift', note: 'A nursing shift: Book your shift, Care plan call, Nurse arrives, The shift, Handover. The step copy is placeholder for FRH to confirm.' },
      { id: 'v26-reviews', n: 'Reviews · A score card', note: 'Option A (v26): a score card with the rating, “would book again” and four scores; what patients mention, with counts; review cards you swipe sideways. References via Mobbin: Agoda, Best Buy, Fresha.' },
      { id: 'v29-rev-b', n: 'Reviews · B classic', note: 'Option B: the rating beside the star breakdown, four score rings (would book again, on time, care, advice), and two reviews in a plain list. Familiar and easy to scan. References via Mobbin: CVS Health and Target.' },
      { id: 'v29-rev-c', n: 'Reviews · C summary', note: 'Option C: the rating framed by laurels with “Patient favourite”, a “What patients say” summary with what they praise and one thing to know, then two quotes. The summary copy is placeholder. References via Mobbin: Tabby and Moonlitt.' },
      { id: 'v31-d1', n: 'Reviews · D1 laurel + scores', note: 'New in v31. The laurel header from C, then one row of scores (On time, Care, Advice, Hygiene), each a label, a big number and an icon, then swipeable reviews. “Verified” is said once in the header, not on every review. Reference: Airbnb’s guest-favourite rating, via Mobbin.' },
      { id: 'v31-d2', n: 'Reviews · D2 laurel + rings', note: 'The laurel header, then four score rings (would book again, on time, care, advice) and two reviews in a list. References: CVS Health and Target, via Mobbin.' },
      { id: 'v31-d3', n: 'Reviews · D3 laurel + mentions', note: 'The laurel header, then what patients mention as bars with counts (On time 144, Explained clearly 112…) and “93% would book again”, then swipeable reviews. Reference: Tabby, via Mobbin.' },
      { id: 'v26-revs-all', n: 'All reviews sheet', note: 'See all opens every review with the star breakdown and filters: All, 5, 4, 3 and below. Reference: Urban Company’s All reviews sheet.' },
      { id: 'v24-inc', n: 'What’s included · six feature tiles', note: 'v26: six icon tiles, two per row, and no bullet points. The service’s own four come first, then what comes with every visit (kit, notes, a free follow-up call), including what comes with every visit (kit, notes in the app, a free follow-up call). Reference: Careem’s “Included with your booking” tiles, via Mobbin.' },
      { id: 'v24-inc-lab', n: 'What’s included · on a lab test', note: 'The same tiles on a blood test: markers, home sample, lab report. The facts row already shows the results time, so the tiles don’t repeat it.' },
      { id: 'v25-inc-nad', n: 'What’s included · on an IV drip', note: 'The 2×2 tiles on NAD+: the dose, the nurse check, monitoring every 30 minutes and anti-nausea support. The drip kit, notes and aftercare follow as ticks.' },
      { id: 'v22-lab', n: 'Licence line · lab test', note: 'New in v22. One line under the name says who comes and who licenses them. It changes by service: doctor, nurse, physiotherapist, dentist, dietitian, or for labs "Licensed nurse · DHA-approved lab". The descriptions no longer repeat it.' },
      { id: 'v22-sharjah', n: 'Licence line · Sharjah address', note: 'The authority follows the visit address. DHA covers Dubai only, so a Sharjah visit says "UAE-licensed" until FRH confirms the right regulator to name. Ambulance has no line until FRH confirms who licenses the crew.' },
      { id: 'v20-card', n: 'Card summary', note: 'The same cleaned-up summary inside a white card under a shorter photo, to compare with the full-bleed version.' },
      { id: 'v20-tabs', n: 'Section tabs', note: 'Once the summary scrolls away, the top bar shows tabs for each section: Overview, Included, How it works, Reviews, FAQs (plus Dosage and Add-ons on IV drips). The active tab follows the scroll; tap one to jump there.' },
      { id: 'v20-nad', n: 'NAD+ with Dosage tab', note: 'Services with a dosage or add-ons get those tabs too. The Infusion fact follows the dosage you pick.' },
    ] },
    { g: 'Dynamic Island', items: [
      { id: 'di-play', n: 'Play the whole visit', note: 'New in v19. About 45 seconds on the iPhone home screen: team assigned, on the way with the minutes counting down, arrived, visit in progress, visit complete. Each step is a push update from FRH; important ones pop open as an alert.' },
      { id: 'di-assigned', n: 'Team assigned · alert', note: 'Pops open once when the doctor and nurse are assigned, then settles into the compact pill. On an iPhone a long press expands it and a tap opens FRH; here, tap to expand and tap again to open the booking.' },
      { id: 'di-onway', n: 'On the way · compact', note: 'The lead clinician on the left, minutes to arrival on the right. Live Activities only show in the island while the patient is outside FRH; open the app and it hides, close it and it comes back.' },
      { id: 'di-onway-x', n: 'On the way · expanded', note: 'The long-press view: the team, minutes away, distance, route progress, and Call and Message buttons. Tap anywhere outside to close it.' },
      { id: 'di-arrived', n: 'Arrived · alert', note: 'Pops open with the gate code from the booking note, so the patient can let the team in without opening the app.' },
      { id: 'di-treating', n: 'Visit in progress', note: 'A running timer for the visit. Notes and any prescription follow in the app.' },
      { id: 'di-done', n: 'Visit complete · alert', note: 'The last update: visit length and View visit notes. The activity then ends and the island goes back to normal.' },
      { id: 'di-two', n: 'Two at once · minimal', note: 'With two activities running, iOS shrinks them: the visit attaches to the island and the lab result sits in its own bubble. Tap either to expand it.' },
      { id: 'di-drip', n: 'IV drip · expanded', note: 'A countdown for the drip with the nurse’s name and a Message button, for patients resting during a 45-minute infusion.' },
      { id: 'di-tele', n: 'Video consult · doctor ready', note: 'The queue shows minutes to wait; when the doctor is ready it pops open with Join the call.' },
      { id: 'di-lab', n: 'Lab results ready', note: 'Tracks a sample from collection to results; the island pops open when the doctor has reviewed them.' },
    ] },
    { g: 'First-time guide', items: [
      { id: 'tour-welcome', n: 'Welcome to FRH', note: 'New in v18. Right after a new account is set up (or a guest opens Home), a welcome card offers a 20-second tour. Skip for now turns off every tip.' },
      { id: 'tour-ask', n: 'Tour · Ask anything', note: 'One highlight at a time with a short line of copy: Ask anything, the service tiles, then each tab. Next, Back and Skip tour on every step.' },
      { id: 'tour-tabs', n: 'Tour · the five tabs', note: 'Services, Bookings, Chat and Account are pointed out one by one. Done ends with a reminder that the tour can be replayed from Account.' },
      { id: 'tips-services', n: 'First visit · Services', note: 'The first time a new user opens Services: two tips, search and the address line that decides what is offered.' },
      { id: 'tips-service', n: 'First visit · Service page', note: 'The first service page a new user opens: who it is for, and the difference between Add to cart and Book now. Each tip appears once.' },
    ] },
    { g: 'Home & search', items: [
      { id: 'home', n: 'Home', note: 'Five tabs: Home, Services, Bookings, Chat, Account. The header keeps the visit address, search and alerts; Ask anything sits beside the greeting; the cart shows as a bar above the tabs once something is in it.' },
      { id: 'home-guest', n: 'Guest home', note: 'Guests can look around first. Sign-in is only asked for when they book.' },
      { id: 'ask-voice', n: 'Ask anything (voice)', note: 'A calm voice greets the patient and listens; the three options are always there, emergencies are sent to 998, and anything else goes to the care team in Chat.' },
      { id: 'home-addr', n: 'Visit address', note: 'Switch between saved addresses or add one; the Soon tags follow the address, so the header and the services never disagree.' },
      { id: 'search', n: 'Search', note: 'The search icon drops a panel over a dimmed Home with the keyboard already up: recent searches, popular services and categories, as Swiggy and Keeta do.' },
      { id: 'search-typing', n: 'Search results', note: 'Results appear as you type, split into Services and Tests & treatments, with the matched words in bold, the price and the duration.' },
      { id: 'search-none', n: 'No results', note: 'Names what was typed and offers Browse services and popular searches, so a typo is never a dead end.' },
      { id: 'notifs', n: 'Notifications · A current', note: 'Today and Earlier, one line each, filters that match Notification settings, and every row opens the visit, chat, report or offer it is about.' },
      { id: 'v35-notifs-b', n: 'Notifications · B now + actions', note: 'New in v35. The visit happening now sits on top as a dark live card: who is coming, minutes away, the four steps, then Track live and Message. Below it, each update is a card with one clear next step (Reply, View results, See new time); unread cards get the black button. References via Mobbin: Grab, Revolut Business, Cleo AI.' },
      { id: 'v35-notifs-c', n: 'Notifications · C by visit', note: 'Option C: updates grouped under the visit they are about. On the way, the doctor’s message and the payment sit in one Doctor on Call card with its live status; results and the prescription stay with the IV visit. Offers move to their own tab with the code to copy. References via Mobbin: Spark Mail, Alan, Cleo AI.' },
      { id: 'v35-notifs-d', n: 'Notifications · D catch-up + timeline', note: 'Option D: a plain-language catch-up at the top says what is new since you last looked, with the two things to do next. Below it, every update on a dated timeline. Mark all read turns the catch-up into “You’re all caught up”. References via Mobbin: Fi, Swarm.' },
      { id: 'notifs-empty', n: 'No notifications', note: 'A calm empty state that says what will appear here and links to Notification settings.' },
    ] },
    { g: 'Browse & book', items: [
      { id: 'cats', n: 'Services', note: 'The Services tab: a Visit address bar on top (new in v40: tap Change to pick another address), search, then every service with from-prices; anything not offered at that address is marked Soon. The cart bar follows you here too.' },
      { id: 'doctors', n: 'Doctors', note: 'New in v38. DHA-licensed doctors who come to you, with filters for what patients here ask for: available today, a female doctor, Arabic, children. Each card shows rating, years, who they see, languages and the next arrival window, with Book right there. Nurses and therapists sit below. From Home › Our doctors › See all. References via Mobbin: Zocdoc, Alan.' },
      { id: 'doctors-female', n: 'Doctors · female doctor', note: 'The Female doctor filter: three doctors. Filters are single-choice chips; when none match, a calm message offers Show all doctors.' },
      { id: 'doctor', n: 'Doctor profile', note: 'New in v38. Photo, DHA licence and three stats, then Book a home visit: pick a day and an arrival window, and the sticky bar shows exactly what you are booking. Then About, what they often help with, the visits they do with prices, credentials and reviews. References via Mobbin: Zocdoc, CVS Health, Fiverr.' },
      { id: 'doctor-full', n: 'Doctor profile · no visits today', note: 'Dr. Noor has nothing free today, so the day strip opens on tomorrow; a full day says so and links to the next free time.' },
      { id: 'doctor-req', n: 'Service page · requested doctor', note: 'After Book, the service page carries the doctor and time you picked, with Change and remove. The note is honest about home visits: we ask that doctor first, and tell you straight away if someone else has to come.' },
      { id: 'soon-sheet', n: 'Coming soon', note: 'Notify-me instead of a dead end, plus a video consult the patient can book today.' },
      { id: 'subcat-loading', n: 'Loading a service', note: 'Skeleton rows inside the list, never a full-screen loader.' },
      { id: 'subcat', n: 'Service list', note: 'New in v40: the Visit address bar on top, so you can change where the visit goes without leaving the list. Then two-line names, what is included, duration, strike-through prices and an Add button that turns into Added.' },
      { id: 'v40-loc-sheet', n: 'Service list · change address', note: 'Tapping the Visit address bar opens the same sheet as everywhere else: saved addresses with the current one ticked, and Add new address. Services and prices follow the choice. References via Mobbin: Careem, talabat, Instacart.' },
      { id: 'v40-loc-na', n: 'Service list · after a change of address', note: 'Switched to Mum’s place in Sharjah, where Dentist at Home isn’t offered yet: the list says so straight away and offers another address or other services. The bar shows the new address.' },
      { id: 'subcat-search', n: 'Search in a service', note: 'Filters the open service as you type, with its own keyboard.' },
      { id: 'subcat-na', n: 'Not available here', note: 'Says the service is not offered at this address and offers Change address or other services.' },
      { id: 'service', n: 'Service detail', note: 'Everything a patient needs before booking, top to bottom, with one sticky bar that shows the live total and both actions.' },
      { id: 'service-nad', n: 'Dosage & add-ons', note: 'Dosage as pills right on the page and add-ons only on IV drips; the total counts up as you choose.' },
      { id: 'cart', n: 'Cart', note: 'Every visit is already filled in (you, your visit address, the next free slot), so a simple booking needs no picks; a member sees what their plan covers.' },
      { id: 'cart-group', n: 'Cart · one visit, two people', note: 'Add another person keeps the service, address and time once, and adds a person block inside the same card, each with their own health note and price.' },
      { id: 'v43-addr-a', n: 'Cart · A address on each person', note: 'New in v43, option A. Everyone after the first person gets an address row that reads “Same address as Sara”; tap it to pick another one. Fatima is at Mum’s place in Sharjah, so her row says stop 2, about 12:00 PM: two hours after Home because it is in another emirate. No quantity: she stays a person in the same visit card. References via Mobbin: Shop (Use a different address), Grab.' },
      { id: 'v43-addr-b', n: 'Cart · B stops (recommended)', note: 'Option B, recommended. Under the visit address, “Someone at another address?” asks who, then where. With two addresses the card turns them into numbered stops with who is at each and when the team gets there, and every person is tagged with their stop. Tap a stop to change it or send them back to stop 1. FRH to confirm whether an extra address adds a travel charge (none for now). References via Mobbin: Uber group ride (route order), Waymo and Lyft (add stop).' },
      { id: 'v43-addr-c', n: 'Cart · C separate visit', note: 'Option C. “At another address?” on each person asks where, then moves them out into a visit card of their own, with its own address and time, marked “Separate visit”. Simplest for FRH to run, but the family ends up across two cards. Reference via Mobbin: Alan (Why separate orders?).' },
      { id: 'v43-addr-sheet', n: 'Where will Fatima be?', note: 'The sheet behind options A and B: same address as Sara first, then the other saved addresses, with coverage warnings. An address someone else in the visit already uses shows its stop and who is there. The last line says each address is booked as its own visit.' },
      { id: 'v43-addr-who', n: 'Who is at another address?', note: 'With three or more people, option B asks who first; with two it goes straight to the address.' },
      { id: 'v43-addr-pay', n: 'Pay · two addresses', note: 'The order summary lists Fatima at Mum’s place at about 12:00 PM, apart from Sara and Yusuf at Home at 10:00 AM.' },
      { id: 'v43-addr-done', n: 'Booked · one visit per address', note: 'Paying books two visits on the same order, one for each address, with both booking numbers shown.' },
      { id: 'cart-gold', n: 'Cart · membership offer', note: 'For a non-member, the cart shows all three plans with what each would save on this exact cart, marks the best one for it, and lets the patient add it to the order with one tick.' },
      { id: 'cart-gold-on', n: 'Cart · plan added', note: 'Covered services turn to Included, the after-10 PM charge goes where the plan waives it, and the plan is one line in the summary; paying activates it.' },
      { id: 'cart-time', n: 'Cart · choose a time', note: 'Tap any row to open just that picker: ASAP, then a date strip and hourly slots with full ones greyed out.' },
      { id: 'cart-tele', n: 'Cart · video consultation', note: 'A video call asks for an Emirates ID or passport instead of an address.' },
      { id: 'cart-issues', n: 'Cart · needs attention', note: 'A slot taken while it sat in the cart, and a service not offered at the chosen address, each with a one-tap fix.' },
      { id: 'cart-coupon', n: 'Cart · coupon applied', note: 'Type a code or pick from the available list; VAT is worked out on the discounted amount.' },
      { id: 'cart-empty', n: 'Empty cart', note: 'A friendly empty state with one way forward.' },
      { id: 'checkout', n: 'Pay', note: 'A collapsible summary grouped by day, then one list of ways to pay, with the amount on the button. Cart → Pay → Done, three steps.' },
      { id: 'checkout-card', n: 'Pay · new card', note: 'The card form types on the number pad and leaves Save this card off until you choose it.' },
      { id: 'checkout-apple', n: 'Pay · Apple Pay', note: 'Only the iPhone wallet, with Apple’s black pay button.' },
      { id: 'checkout-plan', n: 'Pay · included in plan', note: 'When the plan covers everything there is nothing to pay, just Confirm booking.' },
      { id: 'checkout-processing', n: 'Processing', note: 'A calm overlay while the bank confirms.' },
      { id: 'book-done', n: 'Payment successful', note: 'Amount, booking ID, date and time, then View booking or Back to Home; the visit is already in Upcoming.' },
      { id: 'checkout-failed', n: 'Payment failed', note: 'Says plainly that nothing was charged, then Retry or Change payment method.' },
    ] },
    { g: 'Appointments', items: [
      { id: 'appts', n: 'Bookings · A current', note: 'Date and time lead each card, one block per patient; the live strip and chat button states mean you rarely need to open a card.' },
      { id: 'v39-cards-b', n: 'Bookings · B date tile', note: 'New in v39. A calm, compact card: the date in a tile, then the service, time and place, who it is for, and one coloured status line. Easy to scan when there are many visits. References via Mobbin: Beli, Urban Company, Nike Training Club.' },
      { id: 'v39-cards-c', n: 'Bookings · C live status', note: 'Option C: the stage leads. A visit on the way turns the card dark with “Arriving in 12 min” and the ETA; every card has the four-step bar (Booked, Team assigned, On the way, Arrived), then who is coming with the chat button. References via Mobbin: Instacart, DoorDash, Shopee.' },
      { id: 'v39-cards-d', n: 'Bookings · D ticket + actions', note: 'Option D: a photo for the kind of visit with the date and status on it, then who it is for, the team and the address, and the next two actions as buttons: Reschedule and Details, Track live and Chat, Rate visit and Book again. References via Mobbin: TheFork, Tock, GetYourGuide.' },
      { id: 'appt-assigning', n: 'Assigning your team', note: 'A countdown until the team leaves and a placeholder where the team will appear. No map yet, because nobody is moving.' },
      { id: 'appt-assigned', n: 'Team confirmed', note: 'The confirmed clinician with licence number, and Change on the date and address while they are still editable.' },
      { id: 'appt-menu', n: 'More options', note: 'The ⋮ menu holds Change date and time, Change address and Cancel, with the cost shown before you pick.' },
      { id: 'appt-reschedule', n: 'Change date & time', note: 'A sheet with the current slot marked; free until the team leaves.' },
      { id: 'appt-address', n: 'Change address', note: 'Saved addresses checked against the Dubai/Sharjah service area.' },
      { id: 'appt-onway', n: 'On the way', note: 'Live map with a moving pin, “Arriving in 12 min”, the driver and plate, and Call team (number masked).' },
      { id: 'appt-map', n: 'Live map', note: 'Full-screen map with the ETA, team and driver in a bottom sheet.' },
      { id: 'appt-arrived', n: 'Arrived', note: 'The arrival banner replaces the map; date and address lock.' },
      { id: 'appt-treating', n: 'Treatment in progress', note: 'Estimated finish and a status for each patient.' },
      { id: 'clinician', n: 'Clinician profile', note: 'Same title for every role: licence, stars, About clamped to 3 lines, rated reviews.' },
      { id: 'appt-completed', n: 'Completed visit', note: 'One card per service with the health issue, who treated you, reports, e-prescription, invoice, and a doctor rating because a doctor attended.' },
      { id: 'v30-rate-a', n: 'Rate your visit · A stars', note: 'New in v30. Once a visit is complete, “How was your visit with Dr. …?” opens by itself, once per visit. A: tap the stars, a word appears (Excellent), then “What went well?” chips (or “What could be better?” at 3 stars and below) and an optional comment. References via Mobbin: Careem, talabat, inDrive, Instacart.' },
      { id: 'v30-rate-b', n: 'Rate your visit · B faces', note: 'Option B: five faces from Awful to Great instead of stars, then the chips, “Would you book this again?” and a comment. Feels lighter and friendlier. References via Mobbin: Mindtrip and Tabby.' },
      { id: 'v30-rate-c', n: 'Rate your visit · C detailed', note: 'Option C: overall stars plus a score for On time, Care, Advice and Hygiene, and “Would you book this again?”. These are the scores the service page shows under Reviews. The longest to fill in. References via Mobbin: Urban Company and Zomato.' },
      { id: 'appt-rated', n: 'Rated visit', note: 'No doctor attended, so the team was rated; ratings stay read-only.' },
      { id: 'cancel-appt', n: 'Cancel appointment', note: 'The refund comes first, a reason is required, and the buttons say what they do.' },
      { id: 'cancelled', n: 'Cancelled & refund', note: 'Success screen with refund amount and expected date.' },
      { id: 'appt-cancelled', n: 'Cancelled visit', note: 'Reason, refund status and a three-step timeline.' },
    ] },
    { g: 'Chat', items: [
      { id: 'chat-home', n: 'Chat', note: 'FRH Support pinned with hours and the 998 line, then one thread per visit. Chat is a tab, so there is no floating chat button.' },
      { id: 'chat-support', n: 'FRH Support', note: 'Real people, their hours and the 998 line up front; replies after a typing indicator.' },
      { id: 'chat-compose', n: 'Typing a message', note: 'The in-phone keyboard with a blue Send key; works with your computer keyboard too.' },
      { id: 'chat-visit', n: 'Visit chat', note: 'Sender name and role on every team message; the header opens the visit.' },
      { id: 'chat-readonly', n: 'Closed visit chat', note: 'Read-only after the visit, with Call FRH and Message Support.' },
    ] },
    { g: 'Profile & settings', items: [
      { id: 'profile-home', n: 'Account · A current', note: 'Header card opens Edit profile; four quick links with Membership as its only entry; settings grouped, version once in small print.' },
      { id: 'v33-acc-b', n: 'Account · B health card', note: 'New in v33. A centred profile with “Patient since”, a membership card (Manage, or Join for non-members), and a My family row with each person and an Add button. Then the same grouped lists. References via Mobbin: Fitbit, WHOOP, Runna.' },
      { id: 'v33-acc-c', n: 'Account · C action tiles', note: 'Option C: name, phone and email with an edit button; three big tiles (My bookings, Medical reports, Help and support); a Your family card; rows grouped by meaning (Health, Payments, Plan and settings, About); a Sign out button. References via Mobbin: Urban Company, Grab, CVS Health.' },
      { id: 'edit-profile', n: 'Edit profile', note: 'Name and email typed on the iOS keyboard; the phone is read-only with Change, because you sign in with it.' },
      { id: 'patients', n: 'Patients', note: 'Age, blood group and phone on every card, for everyone; the whole card opens the form.' },
      { id: 'px-patient', n: 'Add patient', note: 'A screen, not a sheet, so typing works: live age from the date of birth, inline errors, ID for video consults.' },
      { id: 'addresses', n: 'Addresses', note: 'Type icon, landmark and gate code / parking notes go straight to the team; delete asks first.' },
      { id: 'px-del-addr', n: 'Delete address', note: 'Confirmation names the address and says booked visits keep it.' },
      { id: 'px-address', n: 'Add address', note: 'A centred pin with current location; the area is checked against the service area before you type.' },
      { id: 'px-address-search', n: 'Address search', note: 'An in-screen layer with the keyboard; areas not yet served are marked Coming soon.' },
      { id: 'rewards', n: 'Rewards', note: 'New in v42. FRH points: the balance and what it is worth, a bar to the next reward, rewards to redeem (Redeem asks first, then the reward lands in Coupons), ways to earn, a refer-a-friend code and points history. From Account › Rewards. References via Mobbin: CHOPT, adidas, Taco Bell, Gymshark.' },
      { id: 'v42-redeem', n: 'Redeem points', note: 'Confirm before spending points: what you get, the code it becomes, points used and points left.' },
      { id: 'coupons', n: 'Coupons', note: 'Redesigned in v42. Enter a code (try FRIEND50), then Available, Used and Expired. Each ticket shows the conditions, an expiry countdown (red within a week), the code to copy, Details and Apply. With a cart, coupons are sorted by what they save and the best one is marked. References via Mobbin: Swiggy, Trip.com, Agoda, Keeta.' },
      { id: 'v42-coupons-used', n: 'Coupons · used', note: 'Used and Expired tabs keep a record of what you saved, with the codes struck through.' },
      { id: 'v42-coupons-bad', n: 'Coupons · invalid code', note: 'A code that does not exist or has expired gets a clear inline message; typing again clears it.' },
      { id: 'invoices', n: 'Invoices', note: 'One VAT invoice per booking; tap to open it in the viewer.' },
      { id: 'px-pdf', n: 'Document viewer', note: 'Reports and invoices open in-app, with Share and Download under the page.' },
      { id: 'px-share', n: 'Share', note: 'The native share sheet: AirDrop, Messages, Mail, WhatsApp, Save to Files.' },
      { id: 'pay-methods', n: 'Payment methods', note: 'No card cap; Apple Pay shown as available on this iPhone; cash on visit noted.' },
      { id: 'px-card', n: 'Add a card', note: 'Live card preview, number keypad that moves to the next field; Stripe keeps the details.' },
      { id: 'notif-settings', n: 'Notification settings', note: 'Care team and visit changes locked on with a reason; Bookings, Records and Offers are your choice.' },
      { id: 'notif-blocked', n: 'Notifications blocked', note: 'When iPhone Settings blocks FRH, a banner says why it matters and opens Settings.' },
      { id: 'language', n: 'Language', note: 'English now; Arabic listed as coming soon.' },
      { id: 'lang-ar', n: 'Arabic coming soon', note: 'A calm note and a notify-me instead of a half-mirrored layout.' },
      { id: 'support', n: 'Help & support', note: 'Chat with FRH Support, call or email first; FAQs one at a time; 998 always visible.' },
      { id: 'policies', n: 'Policies', note: 'All six policies, including consent to treatment and patient rights (DHA).' },
      { id: 'policy-text', n: 'Policy text', note: 'Long-form reading with a route to support.' },
      { id: 'about', n: 'About FRH', note: 'Trimmed to brand, intro, the DHA licence card and contact details.' },
      { id: 'account', n: 'Account settings', note: 'Your details first, delete account set apart.' },
      { id: 'px-phone', n: 'Change phone number', note: 'New number on the keypad, then a 6-digit code, on one screen.' },
      { id: 'px-phone-code', n: 'Verify new number', note: 'Messages autofill; checks automatically on the 6th digit.' },
      { id: 'px-delete', n: 'Delete account', note: 'Says upcoming visits are cancelled and medical records are kept as UAE law requires.' },
      { id: 'px-delete-code', n: 'Confirm with a code', note: 'A sign-in code, not re-typing the number.' },
      { id: 'px-deleted', n: 'Account closed', note: 'Says what happened and how to get a copy of the records.' },
      { id: 'logout', n: 'Sign out', note: 'A confirmation sheet that says nothing is lost.' },
    ] },
    { g: 'Membership & reports', items: [
      { id: 'membership', n: 'Membership', note: 'Your card, a renewal nudge, and every included service in one list: each shows usage, its booked and delivered visits, and when it resets.' },
      { id: 'membership-join', n: 'Membership plans', note: 'Non-members see the three plans side by side, with price per year and exactly what each includes.' },
      { id: 'm-plan', n: 'Plan detail', note: 'Everything the Gold plan includes, with what it is worth, before one clear Join button.' },
      { id: 'm-pay', n: 'Pay for membership', note: 'A short sheet like checkout, with nothing to type: summary with VAT included, Apple Pay or a saved card.' },
      { id: 'm-welcome', n: 'Welcome to Gold', note: 'The same success layout as a paid booking, landing on the new member view with a shortcut to book.' },
      { id: 'm-renew', n: 'Renew membership', note: 'Renewing shows the next plan year before you pay.' },
      { id: 'm-plans', n: 'Upgrade plan', note: 'Members upgrade any time and pay only the difference; moving down a tier waits for renewal.' },
      { id: 'm-schedule', n: 'Book an included visit', note: 'The booking steps without a payment step; only people on the plan can be picked.' },
      { id: 'm-booked', n: 'Included visit booked', note: 'Shares the payment-success layout; it shows the plan, not an amount.' },
      { id: 'reports-hub', n: 'Medical reports', note: 'One list for the whole family, grouped by visit, each report marked Released or Pending.' },
      { id: 'reports-empty', n: 'No reports yet', note: 'Filtering to a patient with no visits yet gives a plain empty state.' },
      { id: 'lab-report', n: 'Lab results', note: 'Every marker against its lab range on a bar, including upper-only and lower-only limits, with a filter for anything out of range.' },
      { id: 'e-rx', n: 'E-prescription', note: 'One prescription page the visit links to, ready to download or share with a pharmacy.' },
    ] },
    { g: 'System states', err: true, items: [
      { id: 'maintenance', n: 'Maintenance', note: 'Fully blocking with no way back into a broken app, but Call FRH and the 998 line still work.' },
      { id: 'a-update', n: 'Update required', note: 'Blocking, for breaking changes only; one button to the App Store and a call line for anyone who needs care now.' },
      { id: 'a-session', n: 'Signed out', note: 'After a long time away: sign in again and you land back on the screen you were on, not Home.' },
      { id: 'a-offline', n: 'Offline at first launch', note: 'Full screen only when the app opens offline with nothing cached; mid-flow it stays the sheet.' },
    ] },
  ];
  const FLAT = VIEWS.flatMap(g => g.items);
  const num = id => { const i = FLAT.findIndex(x => x.id === id); return i < 0 ? '··' : String(i + 1).padStart(2, '0'); };

  /* Each builder file owns the setup for its own states; the panel only routes. */
  const ROUTE = {};
  const via = (fn, ids) => ids.forEach(id => { ROUTE[id] = () => fn(id); });
  via(id => F.hx && F.hx.jump(id), ['home', 'home-addr', 'search', 'search-typing', 'search-none', 'notifs', 'notifs-empty', 'cats', 'soon-sheet', 'subcat-loading', 'subcat', 'subcat-search', 'subcat-na']);
  via(id => F.pxJump && F.pxJump(id), ['profile-home', 'edit-profile', 'patients', 'px-patient', 'addresses', 'px-del-addr', 'px-address', 'px-address-search', 'px-address-onboarding', 'coupons', 'invoices', 'px-pdf', 'px-share', 'pay-methods', 'px-card', 'notif-settings', 'notif-blocked', 'language', 'lang-ar', 'support', 'policies', 'policy-text', 'about', 'account', 'px-phone', 'px-phone-code', 'px-delete', 'px-delete-code', 'px-deleted', 'logout']);
  { const acc = ROUTE['profile-home'], rcp = ROUTE.coupons;   /* v42: Rewards and Coupons from Account */
    ROUTE.rewards = () => { acc(); F.v42.rewards(); };
    ROUTE['v42-redeem'] = () => { acc(); F.v42.redeem('r25'); };
    ROUTE.coupons = () => { acc(); F.v42.coupons('avail'); };
    ROUTE['v42-coupons-used'] = () => { acc(); F.v42.coupons('used'); };
    ROUTE['v42-coupons-bad'] = () => { acc(); F.v42.coupons('avail', 'bad'); }; }
  { const rs = ROUTE.subcat, rc = ROUTE.cats;                 /* v40: address bar on the listings */
    if (rs) ROUTE.subcat = () => { F.v40.home(); rs(); };
    if (rc) ROUTE.cats = () => { F.v40.home(); rc(); };
    ROUTE['v40-loc-sheet'] = () => { F.v40.home(); rs(); F.v40.sheet(); };
    ROUTE['v40-loc-na'] = () => { rs(); F.v40.sharjah(); }; }
  if (F.v43) {   /* v43: someone in a group visit at another address */
    ['a', 'b', 'c'].forEach(k => { ROUTE['v43-addr-' + k] = () => F.v43.cart(k); });
    ROUTE['v43-addr-sheet'] = () => F.v43.sheet('a');
    ROUTE['v43-addr-who'] = () => F.v43.who();
    ROUTE['v43-addr-pay'] = () => F.v43.pay();
    ROUTE['v43-addr-done'] = () => F.v43.done(); }
  { const r0 = ROUTE.appts || (() => F.apptJump && F.apptJump('appts'));      /* v39: booking card options; the plain entry is A */
    ROUTE.appts = () => { S.v39card = 'a'; r0(); };
    ['b', 'c', 'd'].forEach(k => { ROUTE['v39-cards-' + k] = () => { S.v39card = k; r0(); }; }); }
  { const home = () => { if (F.hx) F.hx.jump('home'); };          /* v38: doctors list and profile, opened from Home */
    ROUTE.doctors = () => { home(); F.v38.list('all'); };
    ROUTE['doctors-female'] = () => { home(); F.v38.list('female'); };
    ROUTE.doctor = () => { home(); F.v38.list('all'); F.v38.profile('layla'); };
    ROUTE['doctor-full'] = () => { home(); F.v38.list('all'); F.v38.profile('noor'); };
    ROUTE['doctor-req'] = () => { home(); F.v38.list('all'); F.v38.profile('layla'); F.v38.booked('layla'); }; }
  { const r0 = ROUTE.notifs;                              /* v35: the plain Notifications entry is option A */
    ROUTE.notifs = () => { S.v35n = 'a'; r0(); };
    ['b', 'c', 'd'].forEach(k => { ROUTE['v35-notifs-' + k] = () => { S.v35n = k; S.v35seg = 'visits'; r0(); }; }); }
  { const r0 = ROUTE['profile-home'];                      /* v33: the plain Account entry is option A */
    ROUTE['profile-home'] = () => { S.v33acc = 'a'; r0(); };
    ['b', 'c'].forEach(k => { ROUTE['v33-acc-' + k] = () => { S.v33acc = k; r0(); }; }); }
  via(id => F.apptJump && F.apptJump(id), ['v30-rate-a', 'v30-rate-b', 'v30-rate-c', 'appts', 'appt-assigning', 'appt-assigned', 'appt-menu', 'appt-reschedule', 'appt-address', 'appt-onway', 'appt-map', 'appt-arrived', 'appt-treating', 'clinician', 'appt-completed', 'appt-rated', 'cancel-appt', 'cancelled', 'appt-cancelled', 'chat-home', 'chat-support', 'chat-compose', 'chat-visit', 'chat-readonly']);
  ROUTE['ask-voice'] = () => F.go('ask-voice', { dir: 'fade' });
  via(id => F.tourJump && F.tourJump(id), ['tour-welcome', 'tour-ask', 'tour-tabs', 'tips-services', 'tips-service']);
  const prep = map => Object.entries(map).forEach(([id, k]) => { ROUTE[id] = () => F.DEVPREP && F.DEVPREP[k] && F.DEVPREP[k](); });
  prep({ membership: 'm-member', 'membership-join': 'm-nonmember', 'm-plan': 'm-plan', 'm-pay': 'm-pay', 'm-welcome': 'm-welcome', 'm-renew': 'm-renew', 'm-plans': 'm-plans', 'm-schedule': 'm-schedule', 'm-booked': 'm-booked', 'reports-hub': 'reports-hub', 'reports-empty': 'reports-empty', 'lab-report': 'lab-report', 'e-rx': 'e-rx' });
  prep({ 'v22-lab': 'v22Lab', 'v22-sharjah': 'v22Sharjah' });
  prep({ 'v24-inc': 'v24IncA', 'v24-inc-lab': 'v24IncLab', 'v25-inc-nad': 'v25IncNad', 'v26-reviews': 'v26Reviews', 'v26-revs-all': 'v26RevsAll', 'v27-how': 'v27How', 'v32-cta-a': 'v32CtaA', 'v32-cta-b': 'v32CtaB', 'v32-cta-c': 'v32CtaC', 'v32-all-faqs': 'v32All', 'v27-how-lab': 'v27HowLab', 'v27-how-nurse': 'v27HowNurse', 'v28-how-num': 'v28HowNum', 'v28-how-cards': 'v28HowCards', 'v28-added': 'v28Added', 'v29-rev-b': 'v29RevB', 'v29-rev-c': 'v29RevC', 'v31-d1': 'v31D1', 'v31-d2': 'v31D2', 'v31-d3': 'v31D3' });
  prep({ 'v20-bleed': 'v20Bleed', 'v20-card': 'v20Card', 'v20-tabs': 'v20Tabs', 'v20-nad': 'v20Nad' });
  prep({ service: 'sGp', 'service-nad': 'sNad', cart: 'sCart', 'cart-gold': 'sCartGold', 'cart-gold-on': 'sCartGoldOn', 'cart-group': 'sCartGroup', 'cart-time': 'sCartTime', 'cart-tele': 'sCartTele', 'cart-issues': 'sCartIssues', 'cart-coupon': 'sCartCoupon', 'cart-empty': 'sCartEmpty', checkout: 'sCheckout', 'checkout-card': 'sNewCard', 'checkout-apple': 'sApplePay', 'checkout-plan': 'sPlanCovered', 'checkout-processing': 'sPaying', 'book-done': 'sDone', 'checkout-failed': 'sPayFail' });
  /* sheets and screen states that have their own entry */
  const SHEETVIEW = { offline: 'err-offline', failed: 'err-failed', country: 'country', 's-payfail': 'checkout-failed', 's-clear': 'cart-clear', 'hx-soon': 'soon-sheet', 'hx-addr': 'home-addr', 't-more': 'appt-menu', 't-time': 'appt-reschedule', 't-loc': 'appt-address', 'm-pay': 'm-pay', 'm-welcome': 'm-welcome', 'm-booked': 'm-booked', 'px-share': 'px-share', 'px-del-addr': 'px-del-addr', logout: 'logout' };
  const STAGEVIEW = { unassigned: 'appt-assigning', assigned: 'appt-assigned', onway: 'appt-onway', arrived: 'appt-arrived', treating: 'appt-treating', completed: 'appt-completed' };

  P.innerHTML = `
    <section class="card inbox" aria-label="Incoming codes">
      <div class="card-h"><span class="card-ic green">${icon('chat', 19, 2)}</span><div><h2>Patient’s phone</h2><p>Codes land here, just as WhatsApp or SMS would deliver them.</p></div><span class="live"><i></i>Live</span></div>
      <div class="inbox-to"><span>Messages to</span><b id="ibTo">No number yet</b></div>
      <div class="thread" id="thread"></div>
    </section>
    <section class="card" aria-label="Scenarios">
      <div class="card-h"><span class="card-ic red">${icon('layers', 19, 2)}</span><div><h2>Try a scenario</h2><p>Flip these, then use the app to see each state for real.</p></div></div>
      <div class="scn-row"><div class="scn-lbl">Patient<small>Returning patients skip the profile</small></div><div class="seg" data-k="patient"><button type="button" data-v="new">New</button><button type="button" data-v="returning">Returning</button></div></div>
      <div class="scn-row"><div class="scn-lbl">Membership<small>Plan prices, Included tags, member view</small></div><div class="seg" data-k="member"><button type="button" data-v="none">None</button><button type="button" data-v="silver">Silver</button><button type="button" data-v="gold">Gold</button><button type="button" data-v="platinum">Plat.</button></div></div>
      <div class="scn-row"><div class="scn-lbl">Location<small>What the GPS finds at sign-up</small></div><div class="seg" data-k="detect"><button type="button" data-v="ok">Finds it</button><button type="button" data-v="fail">Fails</button><button type="button" data-v="outside">Outside</button></div></div>
      <div class="scn-row"><div class="scn-lbl">Connection<small>Send or verify while offline</small></div><div class="seg" data-k="online"><button type="button" data-v="1">Online</button><button type="button" data-v="0">Offline</button></div></div>
      <div class="scn-row"><div class="scn-lbl">Next code<small>Simulate a delivery failure</small></div><div class="seg" data-k="failNext"><button type="button" data-v="0">Delivers</button><button type="button" data-v="1">Fails</button></div></div>
      <div class="scn-actions"><button type="button" id="expireBtn">${icon('clock', 15, 2.2)} Expire current code</button><button type="button" id="lockBtn">${icon('lock', 15, 2.2)} Lock out</button></div>
      <div class="scn-actions"><button type="button" id="stageBtn">${icon('nav', 15, 2.2)} Next visit status</button><button type="button" id="sessBtn">${icon('user', 15, 2.2)} Session expired</button></div>
      <div class="scn-actions"><button type="button" id="payFailBtn">${icon('card', 15, 2.2)} Next payment fails</button><button type="button" id="blockBtn">${icon('bell', 15, 2.2)} Block notifications</button></div>
      <p class="scn-tip">${icon('sparkle', 14, 2.2)}<span>Or enter a wrong code three times. Any number works: nothing is sent anywhere, and every code is generated in your browser.</span></p>
    </section>
    <section class="card" aria-label="Final version">
      <div class="card-h"><span class="card-ic ink">${icon('check', 19, 2.2)}</span><div><h2>What this version takes from the dev spec</h2><p>203 items in the client dev team’s document, each with a decision and a reason.</p></div></div>
      <div class="fin-tally"><div><b>121</b><span>Adopted</span></div><div><b>39</b><span>With a fix</span></div><div><b>40</b><span>Left out</span></div><div><b>3</b><span>Later</span></div></div>
      <a class="fin-link" href="FINAL-NOTES.html" target="_blank" rel="noopener">${icon('file', 15, 2.2)} Open the decision note</a>
    </section>`;


  /* Final v34: the screen index has its own column on the left, with a search field */
  const PL = document.getElementById('panelL') || P;
  PL.insertAdjacentHTML('beforeend', `
    <section class="card scr-card" aria-label="Screen index">
      <div class="card-h"><div><h2>Jump to any screen</h2><p>${FLAT.length} screens and states, in flow order</p></div></div>
      <label class="scr-find">${icon('search', 15, 2)}<input id="scrFind" type="search" placeholder="Search screens" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>
      <div id="scrIndex">${VIEWS.map(g => `<div class="scr-group"><h3>${g.g}</h3><div class="scr-items">${g.items.map(it => `<button class="scr-item" type="button" data-v="${it.id}"><span class="n">${num(it.id)}</span><span>${it.n}</span>${g.err ? '<span class="e"></span>' : ''}</button>`).join('')}</div></div>`).join('')}<p class="scr-none">No screens match</p></div>
    </section>`);
  const thread = document.getElementById('thread');
  const MSG = new Map();
  const typing = document.createElement('div');
  typing.className = 'msg pending';
  typing.innerHTML = '<i></i><i></i><i></i>';
  const EMPTY = `<div class="thread-empty"><div class="te-ic">${icon('chat', 22, 2)}</div><b>Waiting for a code</b>Open the app on the phone, enter any mobile number and tap “Send code”. It arrives here in a second or two.</div>`;

  /* ---------- view id for highlight + caption ---------- */
  /* v34: the entry picked from the index stays highlighted, with its own note, while nothing has changed since */
  let pick = null;
  function viewId() {
    const b = baseView();
    if (pick && pick.b === b && S.screen === pick.screen && (S.sheet || '') === pick.sheet) return pick.id;
    pick = null; return b;
  }
  function baseView() {
    if (!S.open) return 'ios';
    const av = F.authView && F.authView();
    if (av) return av;
    if (S.sheet && SHEETVIEW[S.sheet]) return SHEETVIEW[S.sheet];
    if (S.screen === 'membership') return S.isMember ? 'membership' : 'membership-join';
    if (S.screen === 'm-plan' && S.mMode === 'renew') return 'm-renew';
    if (S.screen === 'reports-hub' && S.mRepWho === 'Yusuf Ahmed') return 'reports-empty';
    if (S.screen === 'appt-details' && F.apptStatus) {
      const D = window.FRHDATA, cancelled = D && D.appointments && (D.appointments.cancelled || []).some(a => a.id === S.apptId);
      if (cancelled) return 'appt-cancelled';
      try { return STAGEVIEW[F.apptStatus(S.apptId).stage] || 'appt-assigned'; } catch (e) { return 'appts'; }
    }
    if (S.screen === 'chat') {
      if (S.focus === 'chat-msg') return 'chat-compose';
      if (!S.tThread || S.tThread === 'support') return 'chat-support';
      try { return F.apptStatus(S.tThread).stage === 'completed' ? 'chat-readonly' : 'chat-visit'; } catch (e) { return 'chat-visit'; }
    }
    if (S.screen === 't-doc' || S.screen === 'doc-profile') return 'clinician';
    if (S.sheet === 'offline') return 'err-offline';
    if (S.sheet === 'failed') return 'err-failed';
    if (S.sheet === 'country') return 'country';
    switch (S.screen) {
      case 'splash': return 'splash';
      case 'onb': return 'onb' + (S.onb + 1);
      case 'phone': return S.phoneErr ? 'err-phone' : 'phone';
      case 'otp': return S.otpState === 'wrong' ? 'err-wrong' : S.otpState === 'expired' ? 'err-expired' : 'otp';
      case 'locked': return 'err-locked';
      case 'profile': return S.emailErr ? 'err-email' : 'profile';
      case 'success': return 'success';
      case 'home': return S.guest ? 'home-guest' : 'home';
    }
    return FLAT.some(x => x.id === S.screen) ? S.screen : 'ios';
  }

  /* ---------- messages ---------- */
  const fmtTime = t => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  function makeMsg(c) {
    const wa = c.channel === 'wa';
    const n = document.createElement('div');
    n.className = 'msg';
    n.innerHTML = `<div class="msg-meta"><span class="ch-tag ${wa ? 'wa' : 'sms'}">${wa ? 'WHATSAPP' : 'SMS'}</span><span class="msg-from">${wa ? 'FRH Healthcare' : 'FRH'}</span><span class="msg-time">${fmtTime(c.deliveredAt || Date.now())}</span></div>
      <div class="msg-body">${F.msgText(c)}</div>${wa ? '<div class="msg-foot">This code expires in 5 minutes.</div>' : ''}
      <div class="msg-code"><b>${c.code}</b><div class="msg-exp"><span class="st"></span><span class="bar"><i></i></span></div></div>
      <div class="msg-actions"><button class="mbtn primary" type="button" data-a="fill">${icon('sparkle', 14, 2.2)} Autofill in app</button><button class="mbtn" type="button" data-a="copy">${icon('copy', 14, 2.2)} Copy code</button></div>`;
    n.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b || b.disabled) return;
      if (b.dataset.a === 'fill') F.fillCode(c);
      else copy(c.code, b);
    });
    return n;
  }
  function updMsg(n, c) {
    const expired = c.status === 'expired' || (c.status === 'active' && F.isExpired(c));
    const label = { used: 'Used', replaced: 'Replaced by a newer code', void: 'Cancelled' }[c.status] || (expired ? 'Expired' : '');
    const cls = c.status === 'used' ? 'used' : expired ? 'expired' : '';
    const st = n.querySelector('.st');
    const html = label ? `<span class="msg-state ${cls}">${label}</span>` : `Expires in ${F.mmss(c.expiresAt - Date.now())}`;
    if (st._h !== html) { st.innerHTML = html; st._h = html; }
    n.querySelector('.bar').style.display = label ? 'none' : '';
    n.querySelector('.bar i').style.transform = `scaleX(${Math.max(0, (c.expiresAt - Date.now()) / (5 * 60 * 1000)).toFixed(3)})`;
    n.classList.toggle('dim', ['replaced', 'void', 'expired'].includes(c.status) || expired);
    const live = c.status === 'active' && !expired;
    n.querySelectorAll('.mbtn').forEach(b => { b.disabled = !live; });
  }
  function note(text, bad) {
    thread.querySelector('.thread-empty')?.remove();
    const n = document.createElement('div');
    n.className = 'msg sys' + (bad ? ' bad' : '');
    n.innerHTML = `${icon(bad ? 'msgX' : 'alert', 14, 2.2)}<span>${text}</span>`;
    thread.insertBefore(n, typing.isConnected ? typing : null);
    thread.scrollTop = thread.scrollHeight;
  }
  function renderThread() {
    const ib = document.getElementById('ibTo');
    const to = S.phone && !F.validatePhone() ? F.fullPhone() : 'No number yet';
    if (ib.textContent !== to) ib.textContent = to;
    let added = false;
    for (const c of S.codes) {
      if (c.status === 'pending') continue;
      if (!MSG.has(c.id)) {
        const n = makeMsg(c);
        thread.insertBefore(n, typing.isConnected ? typing : null);
        MSG.set(c.id, n); added = true;
      }
      updMsg(MSG.get(c.id), c);
    }
    const pending = S.codes.some(c => c.status === 'pending');
    if (pending && !typing.isConnected) { thread.appendChild(typing); added = true; }
    if (!pending && typing.isConnected) typing.remove();
    const hasAny = thread.querySelector('.msg');
    if (!hasAny && !thread.querySelector('.thread-empty')) thread.innerHTML = EMPTY;
    if (hasAny) thread.querySelector('.thread-empty')?.remove();
    if (added) thread.scrollTop = thread.scrollHeight;
  }
  async function copy(txt, btn) {
    try { await navigator.clipboard.writeText(txt); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) { /* ignore */ }
      ta.remove();
    }
    btn.innerHTML = `${icon('check', 14, 2.6)} Copied — paste in the app`;
    setTimeout(() => { btn.innerHTML = `${icon('copy', 14, 2.2)} Copy code`; }, 1800);
  }

  /* ---------- scenarios ---------- */
  P.querySelectorAll('.seg').forEach(sg => sg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const k = sg.dataset.k, v = b.dataset.v;
    if (k === 'patient') S.patient = v;
    if (k === 'online') { S.online = v === '1'; F.el.sb.classList.toggle('offline', !S.online); }
    if (k === 'failNext') S.failNext = v === '1';
    if (k === 'member' && F.setMember) { F.setMember(v === 'none' ? null : v); if (S.open && F.cur()) F.go(S.screen, { dir: 'none' }); }
    if (k === 'detect' && F.aSetDetect) F.aSetDetect(v);
    sync();
  }));
  document.getElementById('expireBtn').addEventListener('click', () => {
    const c = F.activeCode();
    if (!c) { F.toast('Request a code in the app first', 'alert'); return; }
    c.expiresAt = Date.now() - 1000;
    if (S.open && S.screen === 'otp' && (S.otpState === 'idle' || S.otpState === 'wrong')) { c.status = 'expired'; S.otpState = 'expired'; S.otp = ''; }
    F.upd();
  });
  document.getElementById('lockBtn').addEventListener('click', () => jump('err-locked'));
  document.getElementById('stageBtn').addEventListener('click', () => {
    if (!F.apptAdvance) return;
    if (!S.open || !['appts', 'appt-details', 'appt-map', 'home'].includes(S.screen)) jump('appt-onway');
    F.apptAdvance(); sync();
  });
  document.getElementById('sessBtn').addEventListener('click', () => { if (!S.open) jump('home'); if (F.aSessionExpired) F.aSessionExpired(); sync(); });
  document.getElementById('payFailBtn').addEventListener('click', () => { if (F.sFailNext) F.sFailNext(); F.toast('The next payment will fail', 'alert'); });
  document.getElementById('blockBtn').addEventListener('click', e => {
    const on = !S.pxOsOff; if (F.pxNotifBlocked) F.pxNotifBlocked(on);
    e.currentTarget.innerHTML = `${icon('bell', 15, 2.2)} ${on ? 'Unblock notifications' : 'Block notifications'}`;
    if (on && S.screen !== 'notif-settings') jump('notif-settings');
  });
  document.getElementById('scrIndex').addEventListener('click', e => {
    const b = e.target.closest('.scr-item');
    if (b) jump(b.dataset.v);
  });

  /* v34: filter the index, and keep the current screen in view */
  const IDX = document.getElementById('scrIndex'), FIND = document.getElementById('scrFind');
  function filterIdx() {
    const q = FIND.value.trim().toLowerCase(); let any = false;
    IDX.querySelectorAll('.scr-group').forEach(g => {
      const hit = !q || g.querySelector('h3').textContent.toLowerCase().includes(q); let n = 0;
      g.querySelectorAll('.scr-item').forEach(b => { const ok = hit || b.textContent.toLowerCase().includes(q); b.hidden = !ok; if (ok) n++; });
      g.hidden = !n; if (n) any = true;
    });
    IDX.classList.toggle('empty', !any);
  }
  function showActive() {
    const b = IDX.querySelector('.scr-item.on'); if (!b || b.hidden) return;
    const r = b.getBoundingClientRect(), c = IDX.getBoundingClientRect();
    if (r.top < c.top + 34 || r.bottom > c.bottom - 8) IDX.scrollTo({ top: IDX.scrollTop + (r.top - c.top) - c.height / 3, behavior: 'smooth' });
  }
  FIND.addEventListener('input', filterIdx);
  FIND.addEventListener('keydown', e => { if (e.key === 'Escape') { FIND.value = ''; filterIdx(); FIND.blur(); showActive(); } });
  FIND.addEventListener('search', () => { if (!FIND.value) { filterIdx(); showActive(); } });
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (e.key !== '/' || e.metaKey || e.ctrlKey || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) || (S.open && S.focus && S.kb)) return;
    e.preventDefault(); FIND.focus(); FIND.select();
  });

  /* ---------- jump to any state ---------- */
  function ensurePhone() {
    if (F.validatePhone()) { S.country = F.COUNTRIES[0]; S.phone = F.DEMO.phone; }
    S.phoneErr = '';
  }
  function jump(id) {
    pick = null; jump0(id);
    if (S.open && FLAT.some(x => x.id === id)) { pick = { id, b: baseView(), screen: S.screen, sheet: S.sheet || '' }; sync(); }
  }
  function jump0(id) {
    F.closeSheet(true); F.hideBanner();
    if (id === 'ios') { if (S.open) F.closeApp(); return; }
    if (/^di-/.test(id)) { if (F.diJump) F.diJump(id); return; }      /* Dynamic Island states live on the iOS home screen, so the app must not open first */
    F.openInstant();
    S.guest = false; S.emailErr = '';
    if (!['err-offline'].includes(id) && !S.online) { S.online = true; F.el.sb.classList.remove('offline'); }
    if (F.authJump && F.authJump(id)) { sync(); return; }
    if (ROUTE[id]) { ROUTE[id](); sync(); return; }
    const at = { dir: 'fade' };
    switch (id) {
      case 'splash': F.go('splash', at); break;
      case 'onb1': case 'onb2': case 'onb3':
        S.onb = +id.slice(3) - 1;
        if (S.screen === 'onb' && F.cur()) F.upd(); else F.go('onb', at);
        break;
      case 'phone': S.phoneErr = ''; F.go('phone', at); break;
      case 'country': F.go('phone', at); setTimeout(() => F.openSheet('country'), 200); break;
      case 'otp': ensurePhone(); S.attempts = 0; F.issueCode(); F.go('otp', at); break;
      case 'err-phone':
        S.country = F.COUNTRIES[0]; S.phone = '4123456'; S.phoneErr = F.validatePhone();
        F.go('phone', at); setTimeout(() => F.shake('.pf'), 250); break;
      case 'err-wrong': {
        ensurePhone(); S.attempts = 0;
        F.deliver(F.issueCode(), true);
        S.attempts = 1; S.otpState = 'wrong'; S.otp = ''; S.wasOld = false;
        F.go('otp', at); break;
      }
      case 'err-expired': {
        ensurePhone(); S.attempts = 0;
        const c = F.issueCode(); F.deliver(c, true);
        c.expiresAt = Date.now() - 1000; c.status = 'expired';
        S.otpState = 'expired'; S.otp = ''; S.resendAt = 0;
        F.go('otp', at); break;
      }
      case 'err-locked': ensurePhone(); F.lockout(); break;
      case 'err-offline':
        ensurePhone(); S.online = false; F.el.sb.classList.add('offline');
        F.go('phone', at); S.pending = 'send'; setTimeout(() => F.openSheet('offline'), 200); break;
      case 'err-failed': ensurePhone(); F.go('phone', at); S.pending = 'send'; setTimeout(() => F.openSheet('failed'), 200); break;
      case 'profile': ensurePhone(); F.go('profile', at); break;
      case 'err-email':
        ensurePhone(); if (!S.name) S.name = F.DEMO.name;
        S.email = 'sara.ahmed@gmail'; S.emailErr = F.EMAIL_ERR; F.go('profile', at); break;
      case 'success': ensurePhone(); if (!S.name) S.name = F.DEMO.name; F.go('success', at); break;
      case 'home': ensurePhone(); if (!S.name) S.name = F.DEMO.name; F.go('home', at); break;
      case 'home-guest': S.guest = true; F.go('home', at); break;
      case 'chat-home': case 'search': case 'maintenance': case 'coming-soon': F.go(id, at); break;
      case 'chat-empty': if (F.openDirectChat) { F.openDirectChat('doctor', 'FRH-24817'); F.go('chat', at); } break;
      case 'chat': { const el = { dataset: { k: 'doctor', b: 'FRH-24817' } }; if (F.ACT['c-open']) F.ACT['c-open'](el); else F.go('chat', at); break; }
      case 'profile-home': case 'patients': case 'addresses': case 'reports': case 'notifs':
      case 'policies': case 'about': case 'support': case 'language': F.go(id, at); break;
      case 'policy-text': S.pPolicy = S.pPolicy || 'privacy'; F.go('policy-text', at); break;
      case 'logout': F.go('profile-home', at); setTimeout(() => F.openSheet('logout'), 220); break;
      case 'cats': F.go('cats', at); break;
      case 'subcat': S.cat = S.cat || 'doctor'; F.go('subcat', at); break;
      case 'service': S.svc = 'gp'; S.svcTab = 'high'; S.svcTab2 = 'rev'; F.go('service', at); break;
      case 'doc-profile': F.go('doc-profile', at); break;
      case 'cart': F.go('cart', at); break;
      case 'who': F.go('who', at); break;
      case 'where': F.go('where', at); break;
      case 'confirm': S.whenMode = S.whenMode || 'now'; S.checking = true; S.addr = S.addr === undefined ? 0 : S.addr; F.go('confirm', at); break;
      case 'payment': S.whenMode = S.whenMode || 'now'; F.go('payment', at); break;
      case 'appts': S.apptTab = 'upcoming'; S.rating = 0; F.go('appts', at); break;
      case 'track': S.apptId = 'FRH-24817'; F.go('track', at); break;
      case 'visit': S.apptId = 'FRH-24512'; S.rating = 0; F.go('visit', at); break;
      case 'edit-appt': S.apptId = 'FRH-24790'; S.editDate = undefined; S.editTime = ''; F.go('edit-appt', at); break;
      case 'cancel-appt': S.apptId = 'FRH-24790'; S.cancelReason = undefined; F.go('cancel-appt', at); break;
      case 'cancelled': { const c = window.FRHDATA.appointments.cancelled[0]; if (c) S.apptId = c.id; F.go('cancelled', at); break; }
    }
    sync();
  }

  /* ---------- sync ---------- */
  let lastView = null;
  function sync() {
    renderThread();
    P.querySelectorAll('.seg').forEach(sg => {
      const k = sg.dataset.k;
      const tier = F.memberTier && F.memberTier();
      const v = k === 'patient' ? S.patient : k === 'online' ? (S.online ? '1' : '0') : k === 'member' ? (tier ? tier.key : 'none')
        : k === 'detect' ? (S.aDetectMode || 'ok') : (S.failNext ? '1' : '0');
      sg.querySelectorAll('button').forEach(b => {
        b.classList.toggle('on', b.dataset.v === v);
        b.classList.toggle('bad', (k === 'online' && b.dataset.v === '0') || (k === 'failNext' && b.dataset.v === '1'));
      });
    });
    const v = viewId();
    if (v !== lastView) {
      lastView = v;
      PL.querySelectorAll('.scr-item').forEach(b => b.classList.toggle('on', b.dataset.v === v));
      showActive();
      const t = S.open && document.querySelector('#app .scr.cur .nav-t, #app .scr.cur h1');
      const it = FLAT.find(x => x.id === v) || FLAT.find(x => x.id === S.screen) || (S.open
        ? { id: v, n: (t && t.textContent.trim()) || 'FRH Health', note: 'Use the screen index on the left to jump to any screen with its design note.' }
        : FLAT[0]);
      CAP.innerHTML = `<div class="cap-top"><span class="cap-num">${num(it.id)}</span><span class="cap-t">${it.n}</span><span class="cap-ctl"></span></div><p class="cap-note">${it.note}</p>`;
      capLayout();
    }
  }
  function tick() { MSG.forEach((n, id) => { const c = S.codes.find(x => x.id === id); if (c) updMsg(n, c); }); }
  function arrived() { sync(); }
  function reset() { MSG.clear(); thread.innerHTML = ''; typing.remove(); lastView = null; sync(); }

  /* v37: the note under the phone shows two lines, all of it, or nothing (remembered per browser) */
  let capMode = 'clamp', capH = -1;
  try { capMode = localStorage.getItem('frh-cap') || 'clamp'; } catch (e) { /* private window: default */ }
  function capLayout() {
    CAP.classList.remove('clamp', 'full', 'hide'); CAP.classList.add(capMode);
    const ctl = CAP.querySelector('.cap-ctl'), n = CAP.querySelector('.cap-note');
    if (!ctl || !n) return;
    const lh = parseFloat(getComputedStyle(n).lineHeight) || 20;
    const long = capMode === 'clamp' ? n.scrollHeight > n.clientHeight + 1 : capMode === 'full' && n.offsetHeight > lh * 2 + 2;
    ctl.innerHTML = capMode === 'hide'
      ? `<button type="button" data-cap="clamp">${icon('eye', 13, 2.2)} Show note</button>`
      : `${long ? `<button type="button" data-cap="${capMode === 'full' ? 'clamp' : 'full'}">${capMode === 'full' ? 'Less' : 'More'} ${icon(capMode === 'full' ? 'chevUp' : 'chevDown', 13, 2.4)}</button>` : ''}<button type="button" data-cap="hide">Hide</button>`;
    if (CAP.offsetHeight !== capH) { capH = CAP.offsetHeight; if (F.fit) F.fit(); }
  }
  CAP.addEventListener('click', e => {
    const b = e.target.closest('[data-cap]'); if (!b) return;
    capMode = b.dataset.cap;
    try { localStorage.setItem('frh-cap', capMode); } catch (err) { /* not saved, still works */ }
    capLayout();
  });
  window.addEventListener('resize', () => requestAnimationFrame(capLayout));

  F.panel = { sync, tick, arrived, reset, note, jump };
  F.boot();
})();
