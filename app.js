/* ══════════════════════════════════════════
   IDUL FITRI 1446H — app.js PREMIUM
   YouTube autoplay via splash interaction
   ══════════════════════════════════════════ */

/* ══ SPLASH STARS ══ */
(function() {
  const sc = document.getElementById('splash-cvs');
  if (!sc) return;
  const sx = sc.getContext('2d');
  function rsz() { sc.width = innerWidth; sc.height = innerHeight; }
  rsz(); addEventListener('resize', rsz);
  const ss = Array.from({length:120}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    r: Math.random()*1.5+.3, sp: Math.random()*.02+.003, ph: Math.random()*Math.PI*2
  }));
  let t = 0;
  (function al() {
    sx.clearRect(0, 0, sc.width, sc.height);
    ss.forEach(s => {
      const op = .15 + .85 * Math.abs(Math.sin(t*s.sp+s.ph));
      sx.beginPath(); sx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      sx.fillStyle = `rgba(232,204,128,${op})`; sx.fill();
    });
    t += .04; requestAnimationFrame(al);
  })();
})();

/* ══ YOUTUBE SETUP ══ */
const YT_ID = 'QFdN0Ku2Kk4';
let ytPlayer = null, ytReady = false, playing = false, muted = false;

const ytScript = document.createElement('script');
ytScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(ytScript);

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player-hidden', {
    videoId: YT_ID,
    playerVars: { autoplay:0, controls:0, loop:1, playlist:YT_ID, rel:0, fs:0, modestbranding:1, iv_load_policy:3, playsinline:1 },
    events: {
      onReady: function(e) {
        ytReady = true;
        e.target.setVolume(80);
      },
      onStateChange: function(e) {
        const isPlaying = e.data === YT.PlayerState.PLAYING;
        playing = isPlaying;
        document.getElementById('mmIcon').innerHTML = isPlaying
          ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
          : '<path d="M8 5v14l11-7z"/>';
        const bars = document.getElementById('mmBars');
        if (bars) bars.classList.toggle('playing', isPlaying);
      }
    }
  });
};

/* ══ SPLASH ENTER ══ */
function enterSite() {
  const btn = document.getElementById('splashBtn');
  btn.textContent = '⏳ Memuat...';
  btn.disabled = true;

  // Start YouTube
  if (ytReady && ytPlayer) {
    ytPlayer.setVolume(80);
    ytPlayer.playVideo();
  } else {
    // Retry after 1s
    setTimeout(() => {
      if (ytReady && ytPlayer) { ytPlayer.setVolume(80); ytPlayer.playVideo(); }
    }, 1200);
  }

  // Hide splash, show page
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    const page = document.getElementById('mainPage');
    page.style.display = 'block';
    page.style.opacity = '0';
    document.getElementById('musicMini').classList.add('visible');
    setTimeout(() => {
      page.style.transition = 'opacity 1s ease';
      page.style.opacity = '1';
      initMainCanvas();
      initShootingStars();
      initParticles();
      initScrollReveal();
    }, 100);
  }, 300);
}

/* ══ MAIN STARS CANVAS ══ */
function initMainCanvas() {
  const cvs = document.getElementById('cvs');
  const ctx = cvs.getContext('2d');
  let stars = [], t = 0;
  function rsz() { cvs.width = innerWidth; cvs.height = innerHeight; }
  function init() {
    stars = Array.from({length:160}, () => ({
      x: Math.random()*cvs.width, y: Math.random()*cvs.height*.7,
      r: Math.random()*1.8+.25, sp: Math.random()*.022+.003,
      ph: Math.random()*Math.PI*2,
      col: Math.random()>.88 ? 'rgba(200,225,255,' : 'rgba(232,204,128,'
    }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    stars.forEach(s => {
      const op = .18+.82*Math.abs(Math.sin(t*s.sp+s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = s.col+op+')'; ctx.fill();
      if (s.r > 1.5 && op > .88) {
        ctx.strokeStyle = s.col+(op*.35)+')'; ctx.lineWidth = .5;
        ctx.beginPath();
        ctx.moveTo(s.x-s.r*2.8,s.y); ctx.lineTo(s.x+s.r*2.8,s.y);
        ctx.moveTo(s.x,s.y-s.r*2.8); ctx.lineTo(s.x,s.y+s.r*2.8);
        ctx.stroke();
      }
    });
  }
  rsz(); init();
  addEventListener('resize', () => { rsz(); init(); });
  (function al() { t += .04; draw(t); requestAnimationFrame(al); })();
}

/* ══ SHOOTING STARS ══ */
function initShootingStars() {
  const cvs = document.getElementById('shootCvs');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  function rsz() {
    const r = cvs.parentElement.getBoundingClientRect();
    cvs.width = r.width; cvs.height = r.height;
  }
  rsz();
  addEventListener('resize', rsz);

  let shoots = [];
  function addShoot() {
    shoots.push({
      x: Math.random() * cvs.width * .7,
      y: Math.random() * cvs.height * .4,
      len: 80 + Math.random() * 120,
      speed: 4 + Math.random() * 6,
      angle: Math.PI / 5 + Math.random() * .3,
      life: 1, decay: .025 + Math.random() * .02
    });
  }
  setInterval(addShoot, 2800 + Math.random() * 2000);

  (function al() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    shoots = shoots.filter(s => s.life > 0);
    shoots.forEach(s => {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
      grad.addColorStop(0, `rgba(232,204,128,${s.life * .9})`);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
      ctx.strokeStyle = grad; ctx.lineWidth = s.life * 2;
      ctx.stroke();
      s.x += s.speed * Math.cos(s.angle);
      s.y += s.speed * Math.sin(s.angle);
      s.life -= s.decay;
    });
    requestAnimationFrame(al);
  })();
}

/* ══ PARTICLES ══ */
function initParticles() {
  ['✨','⭐','🌟','💫','🌙','🌸','🌺','🎋','🕌'].forEach((em, i) => {
    const p = document.createElement('div');
    p.className = 'ptc'; p.textContent = em;
    p.style.cssText = `left:${(i+1)*10.2}%;--pd:${(13+i*1.7).toFixed(1)}s;--pdd:-${(i*2.5).toFixed(1)}s;--ps:${10+(i%3)*5}px;`;
    document.body.appendChild(p);
  });
}

/* ══ SCROLL REVEAL ══ */
function initScrollReveal() {
  const els = document.querySelectorAll('.greeting-section,.card-section,.personalize-section,.share-section,.site-footer');
  els.forEach(el => el.classList.add('reveal'));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .1 });
  els.forEach(el => obs.observe(el));
}

/* ══ MUSIC CONTROLS ══ */
function toggleMusic() {
  if (!ytReady || !ytPlayer) return;
  if (playing) ytPlayer.pauseVideo(); else ytPlayer.playVideo();
}
function setVolume(v) {
  if (ytPlayer && ytReady) ytPlayer.setVolume(Math.round(parseFloat(v)*100));
  if (muted && parseFloat(v) > 0) { muted = false; }
}

/* ══ LIVE CARD ══ */
document.addEventListener('DOMContentLoaded', function() {
  ['inpName','inpSuffix','inpTo','inpMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCard);
  });
  const th = document.getElementById('inpTheme');
  if (th) th.addEventListener('change', applyTheme);
});

function updateCard() {
  const name = (document.getElementById('inpName')||{}).value?.trim() || 'Rifki';
  const suf  = (document.getElementById('inpSuffix')||{}).value?.trim() || '';
  const to   = (document.getElementById('inpTo')||{}).value?.trim() || 'Semua sahabat & keluarga';
  const msg  = (document.getElementById('inpMsg')||{}).value?.trim() || '';
  const full = suf ? name+' '+suf : name;
  const sigEl = document.getElementById('sigName');
  const toEl  = document.getElementById('toLabel');
  const exEl  = document.getElementById('extraMsg');
  if (sigEl) sigEl.textContent = full;
  if (toEl)  toEl.innerHTML = `Kepada: <strong>${to}</strong>`;
  if (exEl)  { if (msg) { exEl.textContent='"'+msg+'"'; exEl.style.display='block'; } else exEl.style.display='none'; }
}

function applyTheme() {
  const th = { em:{p:'#0B3326',a:'#C9A84C'}, royal:{p:'#0F1F5A',a:'#80AAFF'}, maroon:{p:'#4A0F1A',a:'#E8CC80'}, navy:{p:'#0F1F4A',a:'#E8CC80'} };
  const t = th[this.value] || th.em;
  document.documentElement.style.setProperty('--cp', t.p);
  document.documentElement.style.setProperty('--ca', t.a);
}

/* ══ CONFETTI ══ */
function burst(e) {
  const cols = ['#C9A84C','#E8CC80','#F5E8C0','#2D9B6F','#fff','#FFD700','#90EE90','#FFA07A','#FFB6C1'];
  const eas  = ['ease-out','linear','ease-in-out'];
  for (let i = 0; i < 65; i++) {
    const c = document.createElement('div'); c.className = 'cf';
    const a = Math.random()*Math.PI*2, d = 90+Math.random()*230;
    c.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${3+Math.random()*9}px;height:${3+Math.random()*13}px;background:${cols[~~(Math.random()*cols.length)]};border-radius:${Math.random()>.5?'50%':'2px'};--cfx:${Math.cos(a)*d}px;--cfy:${Math.sin(a)*d+60}px;--cfr:${(Math.random()-.5)*760}deg;--cfd:${(.5+Math.random()*.9).toFixed(2)}s;--cfe:${eas[~~(Math.random()*eas.length)]};`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1700);
  }
}

/* ══ SHARE ══ */
function getFullName() {
  const n = (document.getElementById('inpName')||{}).value?.trim()||'Rifki';
  const s = (document.getElementById('inpSuffix')||{}).value?.trim()||'';
  return s ? n+' '+s : n;
}
function buildMsg() {
  const to  = (document.getElementById('inpTo')||{}).value?.trim()||'Semua sahabat & keluarga';
  const msg = (document.getElementById('inpMsg')||{}).value?.trim()||'';
  const ex  = msg ? `\n\n_"${msg}"_` : '';
  const link= `\n\n🌐 Buka ucapan interaktif + musik: ${window.location.href}`;
  return `🌙 *SELAMAT HARI RAYA IDUL FITRI*\n*1446 H / 2025 M* 🌙\n\n_تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ_\n\nKepada: *${to}*\n\nMarhaban ya Idul Fitri — selamat datang hari kemenangan. Semoga ibadah kita diterima Allah SWT dan kita kembali kepada fitrah yang suci.${ex}\n\n🤲 *Permohonan Maaf*\nDengan sepenuh hati, kami memohon maaf atas segala khilaf dan salah.\n\n✨ _Minal 'Āidīn wal Fāizīn_ ✨\n\nSalam hangat,\n*${getFullName()}* 🙏${link}`;
}
function shareWA()  { window.open('https://wa.me/?text='+encodeURIComponent(buildMsg()),'_blank'); }
function copyLink() { doCopy(window.location.href,'🔗 Link tersalin! Siapapun buka = langsung ada musiknya ✨'); }
function copyText() { doCopy(buildMsg(),'✅ Teks tersalin!'); }
function copyIG() {
  const msg = (document.getElementById('inpMsg')||{}).value?.trim()||'';
  const ex  = msg ? `\n\n"${msg}"` : '';
  doCopy(`🌙 Selamat Hari Raya Idul Fitri 1446 H 🌙\n\nتَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ\n\nMarhaban ya Idul Fitri.${ex}\n\n🤲 Mohon maaf atas segala khilaf.\n\nMinal Aidin wal Faizin ✨\n— ${getFullName()}\n\n.\n.\n.\n#IdulFitri #IdulFitri1446H #LebaranMubarak #MinalAidin #SelamatLebaran #Ramadhan1446H #HariRaya2025`,'📸 Caption IG tersalin!');
}
function doCopy(txt, msg) {
  navigator.clipboard.writeText(txt).then(()=>showToast(msg)).catch(()=>{
    const t=document.createElement('textarea');t.value=txt;t.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);showToast(msg);
  });
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3200);
}

/* ══ SAVE QRIS IMAGE ══ */
function saveQRIS() {
  // Mobile friendly: open image directly so user can long-press save
  const imgUrl = 'qris.jpg';
  // Try anchor download first (works on desktop & some mobile)
  const a = document.createElement('a');
  a.href = imgUrl;
  a.download = 'QRIS-ShopeePay-RifkiMuhamad.jpg';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('📱 Gambar terbuka — tekan lama lalu "Simpan Gambar"');
}
