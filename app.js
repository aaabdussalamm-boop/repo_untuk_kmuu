// App with two games: Tap40 then Flappy
(() => {
  'use strict';

  // ====== Config Expiry ======
  const START_DATE_ISO = "2025-09-04";
  const EXPIRE_DATE_ISO = "2025-11-08";
  const EXPIRE_END = new Date(EXPIRE_DATE_ISO + "T23:59:59");

  // ====== Tap40 Config ======
  const TOTAL_TAPS = 40;
  const MIN_TAP_INTERVAL_MS = 30;

  // ====== Flappy Config ======
  const GOAL_PIPES = 5; // pass this many for win
  const GRAVITY = 0.30;
  const JUMP = -7.5;
  const PIPE_GAP = 150;
  const PIPE_SPACING = 220;
  const PIPE_WIDTH = 52;
  const FLOOR = 490; // canvas height 520

  // ====== State ======
  let playerName = '';
  let runningTap = false, remaining = TOTAL_TAPS, startTime = 0, endTime = 0, lastTapTime = 0;
  let tapDone = false;
  let flappyScore = 0, flappyBest = 0, flappyDone = false;

  // ====== DOM ======
  const $ = (s)=>document.querySelector(s);
  const screenName = $("#screenName");
  const screenTap = $("#screenGameTap");
  const screenFlappy = $("#screenGameFlappy");
  const screenResult = $("#screenResult");

  const nameForm = $("#nameForm");
  const nameInput = $("#playerName");
  const nameError = $("#nameError");

  const hudName = $("#hudName");
  const hudCount = $("#hudCount");
  const hudTimer = $("#hudTimer");
  const tapArea = $("#tapArea");
  const tapCircle = $("#tapCircle");
  const tapText = $("#tapText");
  const btnResetGame = $("#btnResetGame");

  const goalEl = $("#goal");
  const flCanvas = $("#flappy");
  const flCtx = flCanvas.getContext("2d");
  const flScore = $("#flScore");
  const flBest = $("#flBest");
  const btnFlapReset = $("#btnFlapReset");

  const resName = $("#resName");
  const resTotal = $("#resTotal");
  const resAvg = $("#resAvg");
  const resFlappy = $("#resFlappy");
  const btnPlayAgain = $("#btnPlayAgain");
  const btnShare = $("#btnShare");

  const expiryBadge = $("#expiryBadge");
  const expiredOverlay = $("#expiredOverlay");
  const tapSound = $("#tapSound");
  const bgm = $("#bgm");
  const btnMute = $("#btnMute");

  // ====== Utils ======
  const fmtMs = (ms)=> ms.toFixed(0) + " ms";
  const fmtSec = (ms)=> (ms/1000).toFixed(3) + " dtk";
  const averageMs = (total,taps)=> total/taps;
  const validName = (n)=> {
    const t = (n||'').trim();
    if (t.length<1 || t.length>20) return false;
    return /^[\p{L}\p{N} .,'-]+$/u.test(t);
  };
  const saveName = (n)=> { try{localStorage.setItem('name',n)}catch{} };
  const loadName = ()=> { try{return localStorage.getItem('name')||''}catch{return ''} };
  const vibrate = (ms=10)=> { if (navigator.vibrate) navigator.vibrate(ms) };
  const playClick = ()=> { try{ tapSound.currentTime=0; tapSound.volume=.4; tapSound.play(); }catch{} };
  const setActive = (screen)=> {
    [screenName, screenTap, screenFlappy, screenResult].forEach(s=> s.classList.remove('active'));
    screen.classList.add('active');
  };
  const setHud = ()=> {
    hudName.textContent = `Pemain: ${playerName||'-'}`;
    hudCount.textContent = `Sisa: ${remaining}`;
    hudTimer.textContent = runningTap ? fmtSec(performance.now()-startTime) : "0.000 dtk";
    tapText.textContent = `Sisa: ${remaining}`;
  };
  const checkExpiry = ()=> {
    const now = new Date();
    expiryBadge.textContent = `Aktif: ${START_DATE_ISO} s/d ${EXPIRE_DATE_ISO}`;
    if (now>EXPIRE_END){
      expiredOverlay.classList.remove('hidden');
      return true;
    }
    return false;
  };
  function startBgm(){
    if (!bgm) return;
    bgm.volume = 0.6;
    bgm.play().catch(()=>{/* autoplay blocked until user interaction */});
  }
  function toggleBgm(){
    if (!bgm) return;
    if (bgm.paused){ bgm.play().catch(()=>{}); btnMute.textContent = "🔊 Musik"; btnMute.setAttribute('aria-pressed','false'); }
    else { bgm.pause(); btnMute.textContent = "🔇 Musik"; btnMute.setAttribute('aria-pressed','true'); }
  }

  // ====== Tap Game ======
  function resetTap(){
    remaining = TOTAL_TAPS;
    runningTap = false;
    startTime = 0; endTime = 0; lastTapTime = 0;
    setHud();
  }
  function startTap(){
    if (checkExpiry()) return;
    setActive(screenTap);
    resetTap();
    setHud();
  }
  function finishTap(){
    runningTap = false;
    endTime = performance.now();
    tapDone = true;
    // move to flappy next
    setTimeout(()=> startFlappy(), 400);
  }
  function handleTap(){
    if (checkExpiry()) return;
    const now = performance.now();
    if (!runningTap){ runningTap = true; startTime = now; }
    else {
      if (lastTapTime && (now-lastTapTime)<MIN_TAP_INTERVAL_MS){ return; }
    }
    lastTapTime = now;
    if (remaining<=0) return;
    remaining -= 1;
    tapCircle.style.transform = 'scale(0.96)';
    setTimeout(()=> tapCircle.style.transform='scale(1)', 90);
    vibrate(8); playClick(); setHud();
    if (remaining===0){ finishTap(); }
  }

  // ====== Flappy Game ======
  let rafId = 0, birdY=260, birdV=0, pipes=[], offset=0, started=false, crashed=false;
  function resetFlappy(){
    flappyScore = 0;
    birdY = 260; birdV = 0;
    pipes = [];
    offset = 0; started=false; crashed=false;
    // prepare initial pipes
    for (let i=0;i<4;i++){
      addPipe(360 + i*PIPE_SPACING);
    }
    drawFlappy();
    updateScoreHud();
  }
  function addPipe(x){
    const minTop = 60;
    const maxTop = flCanvas.height - PIPE_GAP - 100;
    const top = Math.floor(Math.random()*(maxTop-minTop)+minTop);
    pipes.push({x, top});
  }
  function updateScoreHud(){
    flScore.textContent = `Skor: ${flappyScore}`;
    flBest.textContent = `Terbaik: ${flappyBest}`;
    $("#goal").textContent = GOAL_PIPES;
  }
  function startFlappy(){
    if (checkExpiry()) return;
    setActive(screenFlappy);
    resetFlappy();
  }
  function flap(){
    if (checkExpiry()) return;
    if (!started){ started=true; loop(); }
    birdV = JUMP;
  }
  function loop(){
    rafId = requestAnimationFrame(loop);
    // physics
    birdV += GRAVITY;
    birdY += birdV;
    if (birdY>FLOOR){ birdY = FLOOR; crashed=true; }
    if (birdY<0){ birdY = 0; }

    // move pipes
    for (let i=0;i<pipes.length;i++){
      pipes[i].x -= 2.2;
    }
    // add/remove pipes
    if (pipes[0].x < -PIPE_WIDTH){
      pipes.shift();
      addPipe(pipes[pipes.length-1].x + PIPE_SPACING);
    }
    // collision + score
    for (let p of pipes){
      // count score when passing center
      if (!p.passed && p.x + PIPE_WIDTH < 60){
        p.passed = true;
        flappyScore += 1;
        if (flappyScore>flappyBest) flappyBest = flappyScore;
        updateScoreHud();
        if (flappyScore>=GOAL_PIPES){
          winFlappy();
          return;
        }
      }
      // collision check with bird rectangle (50x38)
      const birdRect = {x:40, y:birdY, w:50, h:38};
      const gapTop = p.top;
      const gapBottom = p.top + PIPE_GAP;
      const pipeLeft = p.x, pipeRight = p.x + PIPE_WIDTH;
      const hitX = birdRect.x + birdRect.w > pipeLeft && birdRect.x < pipeRight;
      const hitTop = birdRect.y < gapTop;
      const hitBottom = (birdRect.y + birdRect.h) > gapBottom;
      if (hitX && (hitTop || hitBottom)){
        crashed = true;
      }
    }
    drawFlappy();
    if (crashed){ loseFlappy(); }
  }
  function drawFlappy(){
    const w = flCanvas.width, h= flCanvas.height;
    flCtx.clearRect(0,0,w,h);
    // bg
    flCtx.fillStyle = "#eaf6ff";
    flCtx.fillRect(0,0,w,h);
    // pipes
    for (let p of pipes){
      flCtx.fillStyle = "#10b981";
      // top
      flCtx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
      // bottom
      flCtx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, h - (p.top+PIPE_GAP));
    }
    // bird
    flCtx.fillStyle = "#ef4444";
    flCtx.beginPath();
    flCtx.ellipse(65, birdY+19, 25, 19, 0, 0, Math.PI*2);
    flCtx.fill();
    // floor line
    flCtx.strokeStyle = "#94a3b8";
    flCtx.beginPath(); flCtx.moveTo(0,FLOOR+1); flCtx.lineTo(w,FLOOR+1); flCtx.stroke();
    // text
    flCtx.fillStyle = "#0f172a";
    flCtx.font = "bold 16px Inter, Arial";
    flCtx.fillText(`Skor: ${flappyScore}/${GOAL_PIPES}`, 12, 24);
    if (!started){
      flCtx.fillText("Sentuh/klik untuk mulai & terbang", 12, 46);
    }
    if (crashed){
      flCtx.fillText("Kena pipa! Klik 'Ulang' untuk coba lagi.", 12, 70);
    }
  }
  function loseFlappy(){
    cancelAnimationFrame(rafId);
    started=false;
    drawFlappy();
  }
  function winFlappy(){
    cancelAnimationFrame(rafId);
    flappyDone = true;
    // go to final result
    showResult();
  }

  // ====== Final Result ======
  function showResult(){
    setActive(screenResult);
    resName.textContent = playerName;
    const total = endTime - startTime;
    resTotal.textContent = `${fmtMs(total)} (${fmtSec(total)})`;
    resAvg.textContent = fmtMs(total/TOTAL_TAPS);
    resFlappy.textContent = `${flappyScore}`;
  }

  // ====== Init ======
  function init(){
    if (checkExpiry()) return;
    goalEl.textContent = GOAL_PIPES;
    const stored = loadName(); if (stored) nameInput.value = stored;
    setTimeout(()=> nameInput.focus(), 100);
    // name submit
    nameForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const val = nameInput.value;
      if (!validName(val)){ nameError.textContent = "Nama 1–20 karakter, gunakan huruf/angka/tanda umum."; return; }
      nameError.textContent = "";
      playerName = val.trim(); saveName(playerName);
      startBgm(); // try start bgm on first user gesture
      startTap();
    });
    // tap area
    ['pointerdown'].forEach(ev => {
      tapArea.addEventListener(ev, (e)=>{ e.preventDefault(); handleTap(); }, {passive:false});
    });
    btnResetGame.addEventListener('click', resetTap);
    // flappy controls
    flCanvas.addEventListener('pointerdown', flap);
    btnFlapReset.addEventListener('click', ()=>{ resetFlappy(); });
    // result buttons
    btnPlayAgain.addEventListener('click', ()=>{ tapDone=false; flappyDone=false; setActive(screenName); });
    btnShare.addEventListener('click', ()=>{
      const total = (endTime - startTime);
      const text = `Aku baru saja menamatkan Tap 40 (${fmtSec(total)}) + Flappy (skor ${flappyScore}/${GOAL_PIPES})!`;
      if (navigator.share){ navigator.share({title:"Skor Mini Games", text}).catch(()=>{}); }
      else { alert(text); }
    });
    // mute
    btnMute.addEventListener('click', toggleBgm);

    // timer HUD
    setInterval(()=>{ if (runningTap){ hudTimer.textContent = fmtSec(performance.now()-startTime); } }, 50);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
