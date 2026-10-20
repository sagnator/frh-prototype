/* FRH Healthcare prototype — icon set, logo mark, flags.
   Line icons are 24px grid, stroked with currentColor. */
(function () {
  const P = {
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevRight: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    shieldCheck: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    wifiOff: '<path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M10.7 5.1A15 15 0 0 1 22 8.8"/><path d="M5 12.6a10 10 0 0 1 5.2-2.4"/><path d="M16.8 11.3a10 10 0 0 1 2.2 1.3"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="m3 3 18 18"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.8v4.7"/><path d="M12 16.2h.01"/>',
    msgX: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z"/><path d="m9.6 9.6 4.8 4.8"/><path d="m14.4 9.6-4.8 4.8"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z"/>',
    sms: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    stetho: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    heartPulse: '<path d="M19.6 12.9 12 20.4l-7.6-7.5A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 7.6 6.6z"/><path d="M3.5 12.5h4.2l1.6-3 3 5.6 1.7-2.6h6.5"/>',
    physio: '<circle cx="12" cy="4.6" r="1.9"/><path d="M4.5 9.2 12 10.4l7.5-1.2"/><path d="M12 10.4v4.8"/><path d="m8.2 21 3.8-5.8 3.8 5.8"/>',
    lab: '<path d="M14.5 2.5v16.8a2.5 2.5 0 0 1-5 0V2.5"/><path d="M8.2 2.5h7.6"/><path d="M9.5 13.5h5"/>',
    drip: '<path d="M7.5 3h9v7.5a4.5 4.5 0 0 1-9 0z"/><path d="M10 7h4"/><path d="M12 15v2.5"/><path d="M12 17.5c0 2.2 1.3 3.5 4 3.5"/>',
    syringe: '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>',
    users: '<circle cx="9" cy="7.5" r="3.5"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 4.1a3.5 3.5 0 0 1 0 6.8"/><path d="M21.5 21a6.5 6.5 0 0 0-4-6"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6.5 15h3"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13.5" width="4.5" height="6.5" rx="2"/><rect x="17" y="13.5" width="4.5" height="6.5" rx="2"/><path d="M19 20c0 1-1.5 1.5-4 1.5h-2"/>',
    backspace: '<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="m17 9-6 6"/><path d="m11 9 6 6"/>',
    shift: '<path d="M12 4 4 12h4.5v7h7v-7H20z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    ambulance: '<path d="M3 17V8a1 1 0 0 1 1-1h10v10"/><path d="M14 10h4l3 3.5V17h-2"/><path d="M8 10v4"/><path d="M6 12h4"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M9 17.5h6"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    starFill: '<path d="M12 3.4l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9z"/>',
    cart: '<circle cx="9.5" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3.5h2.3l2.4 11.3a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L20.5 8H6.2"/>',
    nav: '<path d="M21 3 3 10.6l7.6 2.8L13.4 21z"/>',
    download: '<path d="M12 3.5v11.5"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4.5 20.5h15"/>',
    chevUp: '<path d="m6 15 6-6 6 6"/>',
    share: '<path d="M12 3.5v11"/><path d="m8 7.5 4-4 4 4"/><path d="M5 13v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V13"/>',
    heart: '<path d="M19.6 12.9 12 20.4l-7.6-7.5A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 7.6 6.6z"/>',
    dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  };

  function icon(name, size = 20, sw = 1.8) {
    const d = P[name] || '';
    return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${/Fill$/.test(name) ? 'currentColor' : 'none'}" stroke="${/Fill$/.test(name) ? 'none' : 'currentColor'}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  /* FRH logo (v41, from the client's logo): a medical bag leaning forward, a heartbeat line cut through it and
     speed lines behind it. One path, viewBox 196 x 120; size = width. Source: assets/brand, rebuilt by tools/build-logo.py */
  const LOGO = 'M157.39 9.79 L156.94 9.01 L156.3 8.37 L155.73 8.01 L155.31 7.83 L154.43 7.66 L112.8 7.65 L112.14 7.71 L111.5 7.9 L110.91 8.21 L110.56 8.48 L109.97 9.13 L100.57 24.7 L79.36 24.7 L77.84 24.8 L76.32 25.09 L75.56 25.31 L74.82 25.58 L73.36 26.24 L71.98 27.08 L71.32 27.55 L70.09 28.62 L69.51 29.2 L68.48 30.45 L68.02 31.11 L67.22 32.5 L66.6 33.96 L66.36 34.7 L66.02 36.2 L65.25 41 L61.5 41.01 L60.78 41.13 L60.09 41.39 L59.28 41.93 L58.63 42.67 L58.2 43.54 L58.01 44.5 L58.03 45.24 L58.13 45.72 L58.29 46.19 L58.63 46.83 L59.1 47.4 L59.47 47.73 L60.31 48.21 L60.78 48.37 L61.5 48.49 L67.33 48.52 L68.11 48.76 L68.65 49.12 L68.98 49.48 L69.31 50.04 L69.48 50.67 L69.49 51.16 L69.41 51.65 L69.17 52.25 L68.88 52.65 L68.39 53.08 L67.8 53.37 L67 53.5 L42.9 53.5 L42.12 53.58 L41.37 53.8 L40.68 54.17 L39.89 54.86 L39.44 55.5 L39.11 56.21 L38.91 57.24 L38.93 58.02 L39.2 59.03 L39.73 59.94 L40.46 60.67 L41.37 61.2 L42.38 61.47 L61.97 61.5 L61.96 61.55 L64.05 61.55 L64.66 61.61 L65.26 61.79 L65.62 61.97 L66.13 62.33 L66.55 62.78 L66.78 63.12 L67.03 63.69 L67.17 64.29 L67.19 64.91 L67.09 65.52 L66.96 65.91 L66.67 66.45 L66.28 66.93 L65.8 67.32 L65.26 67.61 L64.66 67.79 L64.05 67.85 L77.05 67.85 L83.89 54.23 L84.45 53.61 L85.15 53.16 L85.53 53 L86.15 52.87 L86.98 52.89 L87.58 53.04 L88.32 53.43 L88.93 54 L89.37 54.7 L93.34 67.85 L101.25 67.85 L111.09 39.28 L111.51 38.57 L111.93 38.12 L112.26 37.88 L112.8 37.59 L113.19 37.46 L113.6 37.38 L114.21 37.36 L114.82 37.46 L115.4 37.68 L115.75 37.88 L116.23 38.28 L116.62 38.75 L116.91 39.3 L117.09 39.89 L117.14 40.29 L117.15 79.3 L122.76 69.44 L123.26 68.78 L123.57 68.51 L124.1 68.18 L124.68 67.96 L125.09 67.88 L129.12 67.85 L138.33 50.82 L138.86 50.19 L139.36 49.81 L139.91 49.54 L140.72 49.36 L141.34 49.37 L141.75 49.44 L142.14 49.56 L142.7 49.85 L143.03 50.09 L143.46 50.54 L143.8 51.06 L143.96 51.44 L147.54 67.85 L180.91 67.88 L181.71 68.09 L182.42 68.5 L182.87 68.92 L183.12 69.25 L183.48 69.99 L183.64 70.79 L183.59 71.61 L183.41 72.21 L183.23 72.58 L182.73 73.23 L182.25 73.62 L181.71 73.91 L181.11 74.09 L180.5 74.15 L145 74.15 L144.19 74.05 L143.62 73.83 L142.94 73.39 L142.4 72.78 L142.03 72.06 L139.72 61.49 L133.77 72.5 L133.42 73.02 L133.12 73.33 L132.61 73.71 L132.24 73.9 L131.63 74.09 L131 74.15 L127.33 74.15 L116.63 92.93 L116.09 93.56 L115.41 94.02 L114.63 94.29 L113.8 94.34 L113.19 94.25 L112.61 94.03 L112.09 93.7 L111.78 93.43 L111.38 92.95 L111.18 92.6 L110.96 92.02 L110.86 91.41 L110.85 59.33 L106.41 72.22 L105.99 72.93 L105.41 73.5 L104.89 73.83 L104.11 74.09 L103.5 74.15 L91 74.15 L90.2 74.05 L89.46 73.75 L88.96 73.4 L88.54 72.97 L88.05 72.1 L85.77 64.51 L81.72 72.59 L81.07 73.38 L80.2 73.91 L79.61 74.09 L79 74.15 L59.95 74.15 L62.49 74.19 L63.06 74.28 L63.92 74.67 L64.62 75.32 L64.92 75.81 L65.12 76.34 L65.21 76.91 L65.2 77.48 L65.07 78.04 L64.83 78.56 L64.5 79.03 L64.08 79.42 L63.24 79.87 L62.49 80.01 L49.48 80.03 L48.47 80.3 L47.78 80.67 L47.17 81.17 L46.67 81.78 L46.3 82.47 L46.08 83.22 L46 84 L46.08 84.78 L46.41 85.77 L46.83 86.44 L47.36 87.01 L48 87.46 L48.96 87.86 L49.74 87.99 L57.73 88 L56.42 96.35 L56.38 97.84 L56.43 98.58 L56.53 99.3 L56.89 100.69 L57.43 101.99 L58.15 103.18 L59.05 104.25 L60.1 105.16 L60.67 105.56 L61.28 105.91 L62.58 106.49 L63.97 106.88 L64.69 107 L66.17 107.1 L169.02 107.1 L170.54 107 L172.06 106.71 L172.82 106.49 L174.3 105.91 L175.72 105.16 L176.4 104.72 L177.69 103.73 L178.3 103.18 L179.4 101.99 L179.9 101.35 L180.78 100 L181.16 99.3 L181.78 97.84 L182.03 97.1 L182.36 95.6 L191.87 36.2 L191.96 35.45 L192.01 33.96 L191.85 32.5 L191.7 31.8 L191.25 30.45 L190.95 29.81 L190.23 28.62 L189.33 27.55 L188.29 26.64 L187.1 25.89 L185.81 25.31 L184.42 24.92 L183.69 24.8 L182.21 24.7 L161.37 24.7ZM114.75 14.55 L151.54 14.55 L154.23 24.7 L108.63 24.7ZM61.14 73.97 L62.08 73.69 L62.58 73.38 L63.01 72.98 L63.35 72.5 L63.59 71.96 L63.75 71 L63.69 70.41 L63.52 69.85 L63.24 69.33 L62.87 68.88 L62.08 68.31 L61.53 68.1 L60.95 68.01 L23.05 68.01 L22.1 68.23 L21.58 68.51 L21.13 68.88 L20.76 69.33 L20.48 69.85 L20.26 70.8 L20.28 71.39 L20.41 71.96 L20.65 72.5 L20.99 72.98 L21.42 73.38 L21.92 73.69 L22.47 73.9 L23.05 73.99ZM40.02 87.97 L40.54 87.86 L41.27 87.59 L41.94 87.17 L42.51 86.64 L42.96 86 L43.29 85.29 L43.47 84.52 L43.5 84 L43.47 83.48 L43.29 82.71 L42.96 82 L42.51 81.36 L41.94 80.83 L41.27 80.41 L40.54 80.14 L40.02 80.03 L3.74 80.01 L2.96 80.14 L2.47 80.3 L1.78 80.67 L1.36 80.99 L0.83 81.56 L0.41 82.23 L0.21 82.71 L0.03 83.48 L0.01 84.26 L0.14 85.04 L0.41 85.77 L0.83 86.44 L1.36 87.01 L2 87.46 L2.71 87.79 L3.48 87.97Z';
  function mark(color = '#fff', size = 48, cls = '') {
    return `<svg class="frh-mark ${cls}" width="${size}" height="${Math.round(size * 120 / 196)}" viewBox="0 0 196 120" aria-hidden="true"><path class="m-logo" fill="${color}" fill-rule="evenodd" d="${LOGO}"/></svg>`;
  }

  /* App icon (red squircle + mark) */
  function appIcon(size = 60) {
    return `<span class="frh-appicon" style="width:${size}px;height:${size}px">${mark('#fff', Math.round(size * 0.74))}</span>`;
  }

  /* Simplified flags (28x20) — drawn so they render on every OS (emoji flags don't on Windows). */
  const F = {
    AE: '<rect width="28" height="20" fill="#00732F"/><rect y="6.67" width="28" height="6.67" fill="#fff"/><rect y="13.33" width="28" height="6.67" fill="#000"/><rect width="7.5" height="20" fill="#EF3340"/>',
    SA: '<rect width="28" height="20" fill="#006C35"/><path d="M8 8.2h12M9.5 10.2h9" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/><path d="M8.5 13.6h11l1.2-.9" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/>',
    OM: '<rect width="28" height="20" fill="#fff"/><rect y="6.67" width="28" height="6.67" fill="#DB161B"/><rect y="13.33" width="28" height="6.67" fill="#008000"/><rect width="8" height="20" fill="#DB161B"/>',
    QA: '<rect width="28" height="20" fill="#8A1538"/><path d="M0 0h9l2.6 1.1L9 2.2l2.6 1.1L9 4.4l2.6 1.1L9 6.7l2.6 1.1L9 8.9l2.6 1.1L9 11.1l2.6 1.1L9 13.3l2.6 1.1L9 15.6l2.6 1.1L9 17.8l2.6 1.1L9 20H0z" fill="#fff"/>',
    BH: '<rect width="28" height="20" fill="#CE1126"/><path d="M0 0h8l3.2 2L8 4l3.2 2L8 8l3.2 2L8 12l3.2 2L8 16l3.2 2L8 20H0z" fill="#fff"/>',
    KW: '<rect width="28" height="20" fill="#fff"/><rect width="28" height="6.67" fill="#007A3D"/><rect y="13.33" width="28" height="6.67" fill="#CE1126"/><path d="M0 0l7 6.67v6.66L0 20z" fill="#000"/>',
    IN: '<rect width="28" height="20" fill="#fff"/><rect width="28" height="6.67" fill="#FF9933"/><rect y="13.33" width="28" height="6.67" fill="#138808"/><circle cx="14" cy="10" r="2.3" fill="none" stroke="#000080" stroke-width=".8"/>',
    PK: '<rect width="28" height="20" fill="#01411C"/><rect width="7" height="20" fill="#fff"/><circle cx="17.4" cy="10.4" r="5" fill="#fff"/><circle cx="18.9" cy="9.2" r="4.4" fill="#01411C"/><circle cx="21.4" cy="7.3" r="1.1" fill="#fff"/>',
    PH: '<rect width="28" height="10" fill="#0038A8"/><rect y="10" width="28" height="10" fill="#CE1126"/><path d="M0 0l12.5 10L0 20z" fill="#fff"/><circle cx="4.2" cy="10" r="1.7" fill="#FCD116"/>',
    EG: '<rect width="28" height="20" fill="#fff"/><rect width="28" height="6.67" fill="#CE1126"/><rect y="13.33" width="28" height="6.67" fill="#000"/><circle cx="14" cy="10" r="1.6" fill="#C09300"/>',
    GB: '<rect width="28" height="20" fill="#012169"/><path d="M0 0l28 20M28 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l28 20M28 0L0 20" stroke="#C8102E" stroke-width="1.4"/><path d="M14 0v20M0 10h28" stroke="#fff" stroke-width="6"/><path d="M14 0v20M0 10h28" stroke="#C8102E" stroke-width="3.4"/>',
    US: '<rect width="28" height="20" fill="#fff"/><g fill="#B22234"><rect width="28" height="1.54"/><rect y="3.08" width="28" height="1.54"/><rect y="6.15" width="28" height="1.54"/><rect y="9.23" width="28" height="1.54"/><rect y="12.31" width="28" height="1.54"/><rect y="15.38" width="28" height="1.54"/><rect y="18.46" width="28" height="1.54"/></g><rect width="12" height="10.77" fill="#3C3B6E"/>',
  };
  function flag(code, w = 24) {
    const h = Math.round(w * 20 / 28);
    return `<span class="flag" style="width:${w}px;height:${h}px"><svg viewBox="0 0 28 20" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${F[code] || ''}</svg></span>`;
  }

  window.FRHI = { icon, mark, appIcon, flag };
})();
