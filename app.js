/* ══════════════════════════════════════════
   IDUL FITRI 1446H — app.js  (YouTube Audio)
   ══════════════════════════════════════════ */

/* ══ STARS CANVAS ══ */
const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d');
let stars = [], animT = 0;
function resizeCvs() { cvs.width = innerWidth; cvs.height = innerHeight; }
function initStars() {
  stars = [];
  for (let i = 0; i < 150; i++) stars.push({
    x: Math.random()*cvs.width, y: Math.random()*cvs.height*.65,
    r: Math.random()*1.7+.3, sp: Math.random()*.025+.004,
    ph: Math.random()*Math.PI*2,
    col: Math.random()>.85?'rgba(200,230,255,':'rgba(232,204,128,'
  });
}
function drawStars(t) {
  ctx.clearRect(0,0,cvs.width,cvs.height);
  stars.forEach(s=>{
    const op=.2+.8*Math.abs(Math.sin(t*s.sp+s.ph));
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle=s.col+op+')'; ctx.fill();
    if(s.r>1.4&&op>.85){
      ctx.strokeStyle=s.col+(op*.4)+')'; ctx.lineWidth=.5;
      ctx.beginPath();
      ctx.moveTo(s.x-s.r*2.5,s.y); ctx.lineTo(s.x+s.r*2.5,s.y);
      ctx.moveTo(s.x,s.y-s.r*2.5); ctx.lineTo(s.x,s.y+s.r*2.5);
      ctx.stroke();
    }
  });
}
(function animLoop(){ animT+=.045; drawStars(animT); requestAnimationFrame(animLoop); })();
resizeCvs(); initStars();
addEventListener('resize',()=>{ resizeCvs(); initStars(); });

/* ══ FLOATING PARTICLES ══ */
['✨','⭐','🌟','💫','🌙','🕌','🌸','🌺','🎋'].forEach((em,i)=>{
  const p=document.createElement('div'); p.className='ptc'; p.textContent=em;
  p.style.cssText=`left:${(i+1)*10.5}%;--pd:${(12+i*1.8).toFixed(1)}s;--pdd:-${(i*2.3).toFixed(1)}s;--ps:${10+(i%3)*5}px;`;
  document.body.appendChild(p);
});

/* ══════════════════════════════════════════
   YOUTUBE PLAYER — Video: QFdN0Ku2Kk4
   ══════════════════════════════════════════ */
const YT_VIDEO_ID = 'QFdN0Ku2Kk4';
let ytPlayer = null, playing = false, muted = false, ytReady = false, pendingPlay = false;

/* Load YouTube IFrame API */
const ytScript = document.createElement('script');
ytScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(ytScript);

/* Hidden player div */
const ytDiv = document.createElement('div');
ytDiv.id = 'yt-player-hidden';
ytDiv.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
document.body.appendChild(ytDiv);

/* YouTube API callback */
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player-hidden', {
    videoId: YT_VIDEO_ID,
    playerVars: { autoplay:0, controls:0, loop:1, playlist:YT_VIDEO_ID, rel:0, fs:0, modestbranding:1, iv_load_policy:3 },
    events: {
      onReady: function(e) {
        ytReady = true;
        e.target.setVolume(Math.round(parseFloat(document.getElementById('volSlider').value)*100));
        document.getElementById('trackSub').textContent = '▶ Tekan play untuk memulai';
        if (pendingPlay) { pendingPlay=false; ytPlayer.playVideo(); }
      },
      onStateChange: function(e) {
        if (e.data === YT.PlayerState.PLAYING) {
          playing = true;
          document.getElementById('playIcon').innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
          document.querySelectorAll('.wb').forEach(b=>b.classList.add('active'));
          document.getElementById('trackSub').textContent='🎵 Sedang diputar...';
        } else if (e.data===YT.PlayerState.PAUSED||e.data===YT.PlayerState.ENDED) {
          playing = false;
          document.getElementById('playIcon').innerHTML='<path d="M8 5v14l11-7z"/>';
          document.querySelectorAll('.wb').forEach(b=>b.classList.remove('active'));
          document.getElementById('trackSub').textContent='⏸ Dijeda — tekan ▶ untuk lanjut';
        }
      },
      onError: function() {
        document.getElementById('trackTitle').textContent='⚠️ Gagal memuat musik';
        document.getElementById('trackSub').textContent='Cek koneksi internet';
      }
    }
  });
};

function toggleMusic() {
  if (!ytReady) { pendingPlay=true; document.getElementById('trackSub').textContent='⏳ Memuat...'; return; }
  if (!playing) ytPlayer.playVideo(); else ytPlayer.pauseVideo();
}
function switchTrack(n) {
  document.querySelectorAll('.pill').forEach((b,i)=>b.classList.toggle('active',i===n));
  if (ytReady) { ytPlayer.seekTo(0); ytPlayer.playVideo(); }
}
function setVolume(v) {
  if (ytPlayer&&ytReady) ytPlayer.setVolume(Math.round(parseFloat(v)*100));
  if (muted&&parseFloat(v)>0) { muted=false; document.getElementById('volIcon').textContent='🔊'; }
}
function toggleMute() {
  if (!ytPlayer||!ytReady) return;
  muted=!muted;
  if (muted) { ytPlayer.mute(); document.getElementById('volIcon').textContent='🔇'; }
  else { ytPlayer.unMute(); document.getElementById('volIcon').textContent='🔊'; }
}

/* ══ LIVE CARD UPDATE ══ */
function updateCard() {
  const name=document.getElementById('inpName').value.trim()||'Rifki';
  const suf=document.getElementById('inpSuffix').value.trim();
  const to=document.getElementById('inpTo').value.trim()||'Semua sahabat & keluarga';
  const msg=document.getElementById('inpMsg').value.trim();
  const full=suf?name+' '+suf:name;
  document.getElementById('sigName').textContent=full;
  document.getElementById('toLabel').innerHTML=`Kepada: <strong>${to}</strong>`;
  const ex=document.getElementById('extraMsg');
  if(msg){ex.textContent='"'+msg+'"';ex.style.display='block';}else ex.style.display='none';
}
['inpName','inpSuffix','inpTo','inpMsg'].forEach(id=>document.getElementById(id).addEventListener('input',updateCard));

document.getElementById('inpTheme').addEventListener('change',function(){
  const t={em:{primary:'#0B3326',accent:'#C9A84C',maaf:'rgba(11,51,38,.07)'},royal:{primary:'#0F1F5A',accent:'#80AAFF',maaf:'rgba(15,31,90,.07)'},maroon:{primary:'#4A0F1A',accent:'#E8CC80',maaf:'rgba(74,15,26,.07)'},navy:{primary:'#0F1F4A',accent:'#E8CC80',maaf:'rgba(15,31,74,.07)'}};
  const th=t[this.value]||t.em;
  document.documentElement.style.setProperty('--card-primary',th.primary);
  document.documentElement.style.setProperty('--card-accent',th.accent);
  document.querySelectorAll('.c-maaf').forEach(el=>el.style.background=`linear-gradient(135deg,${th.maaf},rgba(201,168,76,.07))`);
});

/* ══ CONFETTI ══ */
function burst(e) {
  const cols=['#C9A84C','#E8CC80','#F5E8C0','#2D9B6F','#fff','#FFD700','#90EE90','#FFA07A'];
  const eas=['ease-out','linear','ease-in-out'];
  for(let i=0;i<55;i++){
    const c=document.createElement('div'); c.className='cf';
    const a=Math.random()*Math.PI*2,d=80+Math.random()*210;
    const w=3+Math.random()*8,h=3+Math.random()*11;
    c.style.cssText=`left:${e.clientX}px;top:${e.clientY}px;width:${w}px;height:${h}px;background:${cols[Math.floor(Math.random()*cols.length)]};border-radius:${Math.random()>.5?'50%':'2px'};--cfx:${Math.cos(a)*d}px;--cfy:${Math.sin(a)*d+55}px;--cfr:${(Math.random()-.5)*740}deg;--cfd:${(.5+Math.random()*.95).toFixed(2)}s;--cfe:${eas[Math.floor(Math.random()*eas.length)]};`;
    document.body.appendChild(c); setTimeout(()=>c.remove(),1600);
  }
}

/* ══ SHARE ══ */
function buildMsg(){
  const name=document.getElementById('inpName').value.trim()||'Rifki';
  const suf=document.getElementById('inpSuffix').value.trim();
  const to=document.getElementById('inpTo').value.trim()||'Semua sahabat & keluarga';
  const msg=document.getElementById('inpMsg').value.trim();
  const full=suf?name+' '+suf:name;
  const ex=msg?`\n\n_"${msg}"_`:'';
  return `🌙 *SELAMAT HARI RAYA IDUL FITRI*\n*1446 H / 2025 M* 🌙\n\n_تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ_\n\nKepada: *${to}*\n\nMarhaban ya Idul Fitri — selamat datang hari kemenangan. Semoga ibadah kita diterima oleh Allah SWT dan kita kembali kepada fitrah yang suci.${ex}\n\n🤲 *Permohonan Maaf*\nDengan sepenuh hati, kami memohon maaf atas segala khilaf dan salah — disengaja maupun tidak, dalam ucapan, perbuatan, dan sikap.\n\n✨ _Minal 'Āidīn wal Fāizīn_ ✨\n\nSalam hangat,\n*${full}* 🙏`;
}
function shareWA(){window.open('https://wa.me/?text='+encodeURIComponent(buildMsg()),'_blank');}
function copyText(){doCopy(buildMsg(),'✅ Teks tersalin!');}
function copyLink(){doCopy(window.location.href,'🔗 Link tersalin! Share ke siapapun.');}
function copyIG(){
  const name=document.getElementById('inpName').value.trim()||'Rifki';
  const suf=document.getElementById('inpSuffix').value.trim();
  const full=suf?name+' '+suf:name;
  const msg=document.getElementById('inpMsg').value.trim();
  const ex=msg?`\n\n"${msg}"`:'' ;
  doCopy(`🌙 Selamat Hari Raya Idul Fitri 1446 H 🌙\n\nتَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ\n\nMarhaban ya Idul Fitri.${ex}\n\n🤲 Mohon maaf atas segala khilaf.\n\nMinal Aidin wal Faizin ✨\n— ${full}\n\n.\n.\n.\n#IdulFitri #IdulFitri1446H #LebaranMubarak #MinalAidin #SelamatLebaran`,'📸 Caption IG tersalin!');
}
function doCopy(txt,msg){
  navigator.clipboard.writeText(txt).then(()=>showToast(msg)).catch(()=>{
    const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast(msg);
  });
}
function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),3200);
}
