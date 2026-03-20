/* ══════════════════════════════════════════
   IDUL FITRI 1446H — app.js
   ══════════════════════════════════════════ */

/* ══ STARS CANVAS ══ */
const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d');
let stars = [], animT = 0;

function resizeCvs() { cvs.width = innerWidth; cvs.height = innerHeight; }
function initStars() {
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height * .65,
      r: Math.random() * 1.7 + .3,
      sp: Math.random() * .025 + .004,
      ph: Math.random() * Math.PI * 2,
      col: Math.random() > .85 ? 'rgba(200,230,255,' : 'rgba(232,204,128,'
    });
  }
}
function drawStars(t) {
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  stars.forEach(s => {
    const op = .2 + .8 * Math.abs(Math.sin(t * s.sp + s.ph));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.col + op + ')';
    ctx.fill();
    // Occasional sparkle cross
    if (s.r > 1.4 && op > .85) {
      ctx.strokeStyle = s.col + (op * .4) + ')';
      ctx.lineWidth = .5;
      ctx.beginPath();
      ctx.moveTo(s.x - s.r * 2.5, s.y);
      ctx.lineTo(s.x + s.r * 2.5, s.y);
      ctx.moveTo(s.x, s.y - s.r * 2.5);
      ctx.lineTo(s.x, s.y + s.r * 2.5);
      ctx.stroke();
    }
  });
}
(function animLoop() { animT += .045; drawStars(animT); requestAnimationFrame(animLoop); })();
resizeCvs(); initStars();
addEventListener('resize', () => { resizeCvs(); initStars(); });

/* ══ FLOATING PARTICLES ══ */
['✨','⭐','🌟','💫','🌙','🕌','🌸','🌺','🎋'].forEach((em, i) => {
  const p = document.createElement('div');
  p.className = 'ptc'; p.textContent = em;
  p.style.cssText = `left:${(i + 1) * 10.5}%;--pd:${(12 + i * 1.8).toFixed(1)}s;--pdd:-${(i * 2.3).toFixed(1)}s;--ps:${10 + (i % 3) * 5}px;`;
  document.body.appendChild(p);
});

/* ══════════════════════════════════════════
   WEB AUDIO ENGINE
   3 Tracks: Oud, Rebana, Ambient
   ══════════════════════════════════════════ */
let AC = null, masterGain = null;
let playing = false, muted = false, currentTrack = 0;
let activeNodes = [];

function initAC() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = AC.createGain();
    masterGain.gain.value = parseFloat(document.getElementById('volSlider').value);
    masterGain.connect(AC.destination);
  }
}

/* ── Reverb convolver ── */
function makeReverb(dur = 2.5, decay = 2) {
  const sr = AC.sampleRate;
  const n = Math.floor(sr * dur);
  const buf = AC.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  const conv = AC.createConvolver();
  conv.buffer = buf;
  return conv;
}

/* ── Noise buffer ── */
function makeNoise(dur) {
  const sr = AC.sampleRate, n = Math.floor(dur * sr);
  const buf = AC.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/* ── Pluck synth (Karplus-Strong approximation) ── */
function pluck(freq, t, gain = .18, dur = 1.2) {
  const o = AC.createOscillator();
  const g = AC.createGain();
  const flt = AC.createBiquadFilter();
  const rev = makeReverb(1.8, 2.5);
  const rg = AC.createGain(); rg.gain.value = .18;

  o.type = 'sawtooth'; o.frequency.value = freq;
  flt.type = 'lowpass'; flt.frequency.value = freq * 5; flt.Q.value = 1.5;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + .015);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);

  o.connect(flt); flt.connect(g);
  g.connect(masterGain);
  g.connect(rev); rev.connect(rg); rg.connect(masterGain);
  o.start(t); o.stop(t + dur + .05);
  activeNodes.push(o, g, flt, rev, rg);
}

/* ── Sine tone ── */
function sine(freq, t, gain, dur, fadeIn = .05) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + fadeIn);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g); g.connect(masterGain);
  o.start(t); o.stop(t + dur + .1);
  activeNodes.push(o, g);
}

/* ──────────────────────────────────────
   TRACK 0 — OUD & STRINGS
   Maqam Hijaz: D E♭ F# G A B♭ C D
   ────────────────────────────────────── */
function playOud() {
  // Hijaz scale frequencies (root = D3 = 146.83)
  const hijaz = [146.83, 155.56, 185.00, 196.00, 220.00, 233.08, 261.63, 293.66, 311.13, 370.00, 392.00, 440.00, 466.16, 523.25];
  const melody = [0, 2, 3, 4, 3, 2, 0, 1, 2, 4, 6, 4, 3, 2, 4, 3, 2, 0, 7, 6, 4, 3, 4, 2, 0];
  const rhythm = [.45, .35, .4, .45, .35, .35, .5, .4, .35, .4, .4, .35, .4, .4, .45, .35, .4, .6, .4, .35, .4, .4, .35, .4, .8];

  let t = AC.currentTime + .15;
  function phrase() {
    if (!playing || currentTrack !== 0) return;

    // Drone bass (tanpura-like)
    [146.83, 293.66].forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain(), flt = AC.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = f;
      flt.type = 'lowpass'; flt.frequency.value = 400;
      g.gain.setValueAtTime(.07, t); g.gain.linearRampToValueAtTime(.05, t + 8);
      g.gain.linearRampToValueAtTime(0, t + 9);
      o.connect(flt); flt.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 9.2); activeNodes.push(o, g, flt);
    });

    // Oud melody line
    let mt = t + .1;
    melody.forEach((n, i) => {
      const freq = hijaz[n];
      pluck(freq, mt, .17, .9);
      // Occasional octave harmonic
      if (i % 5 === 0) pluck(freq * 2, mt, .06, .5);
      mt += rhythm[i];
    });

    // Sustained string pad underneath
    const padNotes = [hijaz[0], hijaz[3], hijaz[4]];
    padNotes.forEach(f => {
      const o = AC.createOscillator(), g = AC.createGain(), flt = AC.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = f * 2;
      flt.type = 'lowpass'; flt.frequency.value = 800;
      g.gain.setValueAtTime(0, t + 1); g.gain.linearRampToValueAtTime(.04, t + 2);
      g.gain.linearRampToValueAtTime(.03, t + 7); g.gain.linearRampToValueAtTime(0, t + 9);
      o.connect(flt); flt.connect(g); g.connect(masterGain);
      o.start(t + 1); o.stop(t + 9.2); activeNodes.push(o, g, flt);
    });

    const total = rhythm.reduce((a, b) => a + b, 0) + 1.5;
    t += total;
    setTimeout(phrase, (total - .15) * 1000);
  }
  phrase();
}

/* ──────────────────────────────────────
   TRACK 1 — REBANA & QASIDA
   Traditional Malay/Javanese frame drum
   ────────────────────────────────────── */
function playRebana() {
  const BPM = 78, SPB = 60 / BPM;
  const rast = [264, 297, 330, 352.4, 396, 440, 495, 528, 594, 660];

  let t = AC.currentTime + .1;

  function hit(type, st) {
    if (type === 'dum') {
      // Deep bass hit
      const o = AC.createOscillator(), g = AC.createGain(), flt = AC.createBiquadFilter();
      o.type = 'sine'; o.frequency.setValueAtTime(95, st); o.frequency.exponentialRampToValueAtTime(50, st + .14);
      flt.type = 'lowpass'; flt.frequency.value = 250;
      g.gain.setValueAtTime(.38, st); g.gain.exponentialRampToValueAtTime(.001, st + .2);
      o.connect(flt); flt.connect(g); g.connect(masterGain); o.start(st); o.stop(st + .22);
      activeNodes.push(o, g, flt);
      // Noise thud
      const src = AC.createBufferSource(), g2 = AC.createGain(), f2 = AC.createBiquadFilter();
      src.buffer = makeNoise(.15); f2.type = 'bandpass'; f2.frequency.value = 130; f2.Q.value = 6;
      g2.gain.setValueAtTime(.22, st); g2.gain.exponentialRampToValueAtTime(.001, st + .14);
      src.connect(f2); f2.connect(g2); g2.connect(masterGain); src.start(st);
      activeNodes.push(src, g2, f2);
    } else if (type === 'tek') {
      const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
      src.buffer = makeNoise(.07); f.type = 'highpass'; f.frequency.value = 1400;
      g.gain.setValueAtTime(.13, st); g.gain.exponentialRampToValueAtTime(.001, st + .06);
      src.connect(f); f.connect(g); g.connect(masterGain); src.start(st);
      activeNodes.push(src, g, f);
    } else if (type === 'ka') {
      const src = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
      src.buffer = makeNoise(.05); f.type = 'bandpass'; f.frequency.value = 750; f.Q.value = 4;
      g.gain.setValueAtTime(.08, st); g.gain.exponentialRampToValueAtTime(.001, st + .045);
      src.connect(f); f.connect(g); g.connect(masterGain); src.start(st);
      activeNodes.push(src, g, f);
    }
  }

  function bar() {
    if (!playing || currentTrack !== 1) return;

    // 8-beat pattern: dum tek ka tek | dum tek dum tek
    const pattern = [
      {b: 0,    type: 'dum'},
      {b: .5,   type: 'tek'},
      {b: 1,    type: 'ka'},
      {b: 1.5,  type: 'tek'},
      {b: 2,    type: 'dum'},
      {b: 2.75, type: 'tek'},
      {b: 3,    type: 'dum'},
      {b: 3.5,  type: 'tek'},
      {b: 4,    type: 'dum'},
      {b: 4.5,  type: 'ka'},
      {b: 5,    type: 'tek'},
      {b: 5.5,  type: 'tek'},
      {b: 6,    type: 'dum'},
      {b: 6.5,  type: 'tek'},
      {b: 7,    type: 'ka'},
      {b: 7.75, type: 'tek'},
    ];
    pattern.forEach(h => hit(h.type, t + h.b * SPB));

    // Qasida melody (Maqam Rast)
    const mel = [0, 2, 4, 5, 4, 2, 0, 2, 4, 6, 7, 6, 4, 2, 4, 3];
    mel.forEach((n, i) => {
      const freq = rast[n % rast.length];
      const mt = t + i * SPB * .5;
      const o = AC.createOscillator(), g = AC.createGain(), flt = AC.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = freq;
      flt.type = 'lowpass'; flt.frequency.value = 1200;
      g.gain.setValueAtTime(0, mt); g.gain.linearRampToValueAtTime(.08, mt + .03);
      g.gain.linearRampToValueAtTime(0, mt + SPB * .48);
      o.connect(flt); flt.connect(g); g.connect(masterGain);
      o.start(mt); o.stop(mt + SPB * .52); activeNodes.push(o, g, flt);
    });

    // Bass drone
    sine(rast[0] * .5, t, .06, SPB * 8, .1);

    const barLen = SPB * 8;
    t += barLen;
    setTimeout(bar, (barLen - .12) * 1000);
  }
  bar();
}

/* ──────────────────────────────────────
   TRACK 2 — AMBIENT RAMADHAN
   Lush pads + bell tones + breeze
   ────────────────────────────────────── */
function playAmbient() {
  // Chords: A minor / C major floating
  const chords = [
    [220, 261.63, 329.63, 392.00],  // Am
    [246.94, 293.66, 369.99, 440.00], // Bm7b5
    [196.00, 246.94, 293.66, 369.99], // Gmaj
    [220.00, 277.18, 329.63, 415.30], // Am/C
  ];
  let ci = 0, t = AC.currentTime + .1;

  // Wind noise
  const nSrc = AC.createBufferSource(), nFlt = AC.createBiquadFilter(), nGain = AC.createGain();
  nSrc.buffer = makeNoise(8); nSrc.loop = true;
  nFlt.type = 'bandpass'; nFlt.frequency.value = 380; nFlt.Q.value = .4;
  nGain.gain.value = .06;
  nSrc.connect(nFlt); nFlt.connect(nGain); nGain.connect(masterGain); nSrc.start();
  activeNodes.push(nSrc, nFlt, nGain);

  const rev = makeReverb(4, 1.5);
  const revGain = AC.createGain(); revGain.gain.value = .3;
  rev.connect(revGain); revGain.connect(masterGain);
  activeNodes.push(rev, revGain);

  function pad() {
    if (!playing || currentTrack !== 2) { try { nSrc.stop(); } catch(e){} return; }

    const chord = chords[ci % chords.length];
    const DUR = 6.5, FADE = 1.2;

    chord.forEach((freq, hi) => {
      [[1, 'sine', .055], [2, 'triangle', .028], [.5, 'sine', .04]].forEach(([h, type, g]) => {
        const o = AC.createOscillator(), gn = AC.createGain(), flt = AC.createBiquadFilter();
        o.type = type; o.frequency.value = freq * h;
        flt.type = 'lowpass'; flt.frequency.value = 1800 / h;
        gn.gain.setValueAtTime(0, t);
        gn.gain.linearRampToValueAtTime(g * (.8 + Math.random() * .4), t + FADE);
        gn.gain.linearRampToValueAtTime(g * .7, t + DUR - FADE);
        gn.gain.linearRampToValueAtTime(0, t + DUR);
        o.connect(flt); flt.connect(gn); gn.connect(masterGain); gn.connect(rev);
        o.start(t); o.stop(t + DUR + .2); activeNodes.push(o, gn, flt);
      });
    });

    // Bell tones / ney flute hint
    const bellFreqs = [880, 1108.73, 1318.51, 1760, 987.77, 1244.51];
    for (let k = 0; k < 4; k++) {
      const bT = t + .5 + Math.random() * 5.2;
      const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(.04, bT); g.gain.exponentialRampToValueAtTime(.001, bT + 3);
      o.connect(g); g.connect(masterGain); g.connect(rev);
      o.start(bT); o.stop(bT + 3.2); activeNodes.push(o, g);
    }

    // Subtle ney (flute) line
    const neyNotes = [440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88];
    neyNotes.forEach((freq, i) => {
      const st = t + 1 + i * .65;
      const o = AC.createOscillator(), g = AC.createGain(), flt = AC.createBiquadFilter();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq * .99, st);
      o.frequency.linearRampToValueAtTime(freq, st + .1);
      flt.type = 'bandpass'; flt.frequency.value = freq * 3; flt.Q.value = 2;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(.055, st + .08);
      g.gain.linearRampToValueAtTime(0, st + .6);
      o.connect(flt); flt.connect(g); g.connect(masterGain);
      o.start(st); o.stop(st + .65); activeNodes.push(o, g, flt);
    });

    ci++;
    t += DUR - .3;
    setTimeout(pad, (DUR - .4) * 1000);
  }
  pad();
}

/* ══ PLAYER CONTROLS ══ */
function stopAll() {
  activeNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){} });
  activeNodes = [];
}

const TRACK_NAMES = ['🎸 Oud & Strings — Maqam Hijaz', '🥁 Rebana & Qasida — Maqam Rast', '🌊 Ambient Ramadhan — Ney & Pads'];
const TRACK_FNS   = [playOud, playRebana, playAmbient];

function toggleMusic() {
  initAC();
  if (AC.state === 'suspended') AC.resume();
  if (!playing) {
    playing = true;
    document.getElementById('playIcon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    document.querySelectorAll('.wb').forEach(b => b.classList.add('active'));
    document.getElementById('trackTitle').textContent = TRACK_NAMES[currentTrack];
    document.getElementById('trackSub').textContent   = '▶ Sedang diputar...';
    TRACK_FNS[currentTrack]();
  } else {
    playing = false; stopAll();
    document.getElementById('playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
    document.querySelectorAll('.wb').forEach(b => b.classList.remove('active'));
    document.getElementById('trackSub').textContent = '⏸ Dijeda — tekan ▶ untuk lanjut';
  }
}

function switchTrack(n) {
  document.querySelectorAll('.pill').forEach((b, i) => b.classList.toggle('active', i === n));
  currentTrack = n;
  document.getElementById('trackTitle').textContent = TRACK_NAMES[n];
  if (playing) {
    stopAll();
    if (AC.state === 'suspended') AC.resume();
    TRACK_FNS[n]();
    document.getElementById('trackSub').textContent = '▶ Sedang diputar...';
  }
}

function setVolume(v) {
  initAC();
  const vol = parseFloat(v);
  masterGain.gain.value = muted ? 0 : vol;
  if (muted && vol > 0) { muted = false; document.getElementById('volIcon').textContent = '🔊'; }
}

function toggleMute() {
  initAC();
  muted = !muted;
  masterGain.gain.value = muted ? 0 : parseFloat(document.getElementById('volSlider').value);
  document.getElementById('volIcon').textContent = muted ? '🔇' : '🔊';
}

/* ══ LIVE CARD UPDATE ══ */
function updateCard() {
  const name  = document.getElementById('inpName').value.trim() || 'Rifki';
  const suf   = document.getElementById('inpSuffix').value.trim();
  const to    = document.getElementById('inpTo').value.trim() || 'Semua sahabat & keluarga';
  const msg   = document.getElementById('inpMsg').value.trim();
  const full  = suf ? name + ' ' + suf : name;

  document.getElementById('sigName').textContent  = full;
  document.getElementById('toLabel').innerHTML    = `Kepada: <strong>${to}</strong>`;
  const ex = document.getElementById('extraMsg');
  if (msg) { ex.textContent = '"' + msg + '"'; ex.style.display = 'block'; }
  else     { ex.style.display = 'none'; }
}
['inpName','inpSuffix','inpTo','inpMsg'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateCard);
});

/* Theme switcher */
document.getElementById('inpTheme').addEventListener('change', function() {
  const themes = {
    em:     { primary:'#0B3326', accent:'#C9A84C', maaf:'rgba(11,51,38,.07)' },
    royal:  { primary:'#0F1F5A', accent:'#80AAFF', maaf:'rgba(15,31,90,.07)' },
    maroon: { primary:'#4A0F1A', accent:'#E8CC80', maaf:'rgba(74,15,26,.07)' },
    navy:   { primary:'#0F1F4A', accent:'#E8CC80', maaf:'rgba(15,31,74,.07)' },
  };
  const th = themes[this.value] || themes.em;
  document.documentElement.style.setProperty('--card-primary', th.primary);
  document.documentElement.style.setProperty('--card-accent',  th.accent);
  document.querySelectorAll('.c-maaf').forEach(el => {
    el.style.background = `linear-gradient(135deg, ${th.maaf}, rgba(201,168,76,.07))`;
  });
});

/* ══ CONFETTI BURST ══ */
function burst(e) {
  const colors = ['#C9A84C','#E8CC80','#F5E8C0','#2D9B6F','#fff','#FFD700','#90EE90','#FFA07A'];
  const eases  = ['ease-out','linear','ease-in-out'];

  for (let i = 0; i < 55; i++) {
    const c = document.createElement('div'); c.className = 'cf';
    const angle = Math.random() * Math.PI * 2;
    const dist  = 80 + Math.random() * 210;
    const w = 3 + Math.random() * 8, h = 3 + Math.random() * 11;
    c.style.cssText = `
      left:${e.clientX}px; top:${e.clientY}px;
      width:${w}px; height:${h}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
      --cfx:${Math.cos(angle)*dist}px;
      --cfy:${Math.sin(angle)*dist + 55}px;
      --cfr:${(Math.random()-.5)*740}deg;
      --cfd:${(.5+Math.random()*.95).toFixed(2)}s;
      --cfe:${eases[Math.floor(Math.random()*eases.length)]};
    `;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1600);
  }

  // Musical ting if audio is playing
  if (playing && AC) {
    const now = AC.currentTime;
    [1320, 1760].forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.12 - i * .04, now + i * .08);
      g.gain.exponentialRampToValueAtTime(.001, now + .9 + i * .1);
      o.connect(g); g.connect(masterGain); o.start(now + i * .08); o.stop(now + 1.1);
    });
  }
}

/* ══ SHARE HELPERS ══ */
function buildMsg() {
  const name = document.getElementById('inpName').value.trim() || 'Rifki';
  const suf  = document.getElementById('inpSuffix').value.trim();
  const to   = document.getElementById('inpTo').value.trim() || 'Semua sahabat & keluarga';
  const msg  = document.getElementById('inpMsg').value.trim();
  const full = suf ? name + ' ' + suf : name;
  const ex   = msg ? `\n\n_"${msg}"_` : '';
  return `🌙 *SELAMAT HARI RAYA IDUL FITRI*\n*1446 H / 2025 M* 🌙\n\n_تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ_\n\nKepada: *${to}*\n\nMarhaban ya Idul Fitri — selamat datang hari kemenangan. Semoga ibadah kita diterima oleh Allah SWT dan kita kembali kepada fitrah yang suci.${ex}\n\n🤲 *Permohonan Maaf*\nDengan sepenuh hati, kami memohon maaf atas segala khilaf dan salah — disengaja maupun tidak, dalam ucapan, perbuatan, dan sikap.\n\n✨ _Minal 'Āidīn wal Fāizīn_ ✨\n\nSalam hangat,\n*${full}* 🙏`;
}

function shareWA() {
  window.open('https://wa.me/?text=' + encodeURIComponent(buildMsg()), '_blank');
}

function copyText() {
  doCopy(buildMsg(), '✅ Teks tersalin! Paste ke chat-mu.');
}

function copyLink() {
  doCopy(window.location.href, '🔗 Link halaman tersalin! Share ke siapapun.');
}

function copyIG() {
  const name = document.getElementById('inpName').value.trim() || 'Rifki';
  const suf  = document.getElementById('inpSuffix').value.trim();
  const full = suf ? name + ' ' + suf : name;
  const msg  = document.getElementById('inpMsg').value.trim();
  const ex   = msg ? `\n\n"${msg}"` : '';
  const text = `🌙 Selamat Hari Raya Idul Fitri 1446 H 🌙\n\nتَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ\n\nMarhaban ya Idul Fitri. Semoga ibadah kita diterima dan kita kembali fitrah.${ex}\n\n🤲 Mohon maaf atas segala khilaf dan salah.\n\nMinal Aidin wal Faizin ✨\n— ${full}\n\n.\n.\n.\n#IdulFitri #IdulFitri1446H #LebaranMubarak #MinalAidin #SelamatLebaran #Ramadhan1446H #HariRaya`;
  doCopy(text, '📸 Caption IG tersalin! Buka Instagram & paste.');
}

function doCopy(txt, msg) {
  navigator.clipboard.writeText(txt)
    .then(() => showToast(msg))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast(msg);
    });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}
