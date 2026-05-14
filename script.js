/* ═══════════════════════════════════════════
   BRIHTA — script.js
   ═══════════════════════════════════════════ */

/* ══════════════════════════
   SOUND ENGINE (Web Audio)
══════════════════════════ */
const SFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function tone(freq, type, dur, vol, freqEnd) {
    try {
      const c = getCtx(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (freqEnd) o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(c.currentTime); o.stop(c.currentTime + dur);
    } catch(e) {}
  }
  return {
    correct() {
      tone(523, 'sine', 0.09, 0.32);
      setTimeout(() => tone(784,  'sine', 0.10, 0.26), 80);
      setTimeout(() => tone(1047, 'sine', 0.18, 0.20), 170);
    },
    wrong() {
      tone(280, 'sawtooth', 0.14, 0.22, 160);
      setTimeout(() => tone(200, 'square', 0.18, 0.16, 140), 150);
    },
    click() {
      tone(660, 'sine', 0.04, 0.12);
    },
    levelUp() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => tone(f, 'sine', 0.22, 0.26, f * 1.02), i * 75)
      );
    },
    victory() {
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        setTimeout(() => tone(f, 'sine', 0.28, 0.28, f * 1.015), i * 65)
      );
      setTimeout(() => tone(1047, 'sine', 0.5, 0.3), 480);
    }
  };
})();

/* ══════════════════════════
   RANKS & SVG MEDALS
══════════════════════════ */
const RANKS = [
  { name: "Lesena medalja",   minScore: 0,   color: "#a07850", glow: "#d4a96a" },
  { name: "Železna medalja",  minScore: 30,  color: "#909090", glow: "#c8c8c8" },
  { name: "Bronasta medalja", minScore: 80,  color: "#c8a000", glow: "#ffe033" },
  { name: "Srebrna medalja",  minScore: 175, color: "#2a7fcf", glow: "#5eb8ff" },
  { name: "Zlata medalja",    minScore: 350, color: "#c0392b", glow: "#ff6b6b" },
];

const TIMED_LEVELS = [
  { medal: "Lesena medalja",   timeLimit: 90,  target: 30,  color: "#a07850", glow: "#d4a96a",
    hint: "Pridobi 30 točk v 1:30" },
  { medal: "Železna medalja",  timeLimit: 80,  target: 55,  color: "#909090", glow: "#c8c8c8",
    hint: "Pridobi 55 točk v 1:20" },
  { medal: "Bronasta medalja", timeLimit: 90,  target: 100, color: "#c8a000", glow: "#ffe033",
    hint: "Pridobi 100 točk v 1:30" },
  { medal: "Srebrna medalja",  timeLimit: 120, target: 180, color: "#2a7fcf", glow: "#5eb8ff",
    hint: "Pridobi 180 točk v 2:00" },
  { medal: "Zlata medalja",    timeLimit: 150, target: 290, color: "#c0392b", glow: "#ff6b6b",
    hint: "Pridobi 290 točk v 2:30" },
];

function getRank(score) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (score >= r.minScore) rank = r; }
  return rank;
}
function getNextRank(score) {
  for (const r of RANKS) { if (score < r.minScore) return r; }
  return null;
}
function getMultiplier(streak) {
  if (streak >= 10) return 3;
  if (streak >= 5)  return 2;
  return 1;
}

function getMedalSVG(rankName, size) {
  size = size || 60;
  const s = size;
  switch (rankName) {
    case "Lesena medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="29" fill="#6b4c2a" stroke="#4a3018" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="#8B6340"/>
        <circle cx="32" cy="32" r="22" fill="#a07850" stroke="#c4943a" stroke-width="1"/>
        <text x="32" y="40" text-anchor="middle" fill="#f5deb3" font-size="22" font-family="Georgia,serif" font-weight="bold">P</text>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#c4943a" stroke-width="1" stroke-dasharray="3 4" opacity="0.7"/>
      </svg>`;
    case "Železna medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="29" fill="#555" stroke="#333" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="#777"/>
        <circle cx="32" cy="32" r="22" fill="#999" stroke="#bbb" stroke-width="1"/>
        <polygon points="32,14 35,23 45,23 37,29 40,39 32,33 24,39 27,29 19,23 29,23" fill="white" opacity="0.9"/>
        <polygon points="32,14 35,23 45,23 37,29 40,39 32,33 24,39 27,29 19,23 29,23" fill="none" stroke="#ccc" stroke-width="0.5"/>
      </svg>`;
    case "Bronasta medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#fff176"/>
            <stop offset="60%" stop-color="#ffd600"/>
            <stop offset="100%" stop-color="#e65100"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#7a5900" stroke="#5a3e00" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#gG${size})" stroke="#fff176" stroke-width="0.5"/>
        <polygon points="32,11 35.5,22 47,22 38,29 41.5,40 32,33 22.5,40 26,29 17,22 28.5,22" fill="white" opacity="0.95"/>
        <circle cx="32" cy="32" r="4.5" fill="#ffd600"/>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#fff9c4" stroke-width="0.8" opacity="0.5"/>
      </svg>`;
    case "Srebrna medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#80d8ff"/>
            <stop offset="60%" stop-color="#0288d1"/>
            <stop offset="100%" stop-color="#01579b"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#01386b" stroke="#012a50" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#bG${size})" stroke="#80d8ff" stroke-width="0.5"/>
        <polygon points="32,10 35.5,21 47,21 38,28 41.5,39 32,32 22.5,39 26,28 17,21 28.5,21" fill="white" opacity="0.95"/>
        <polygon points="32,17 34.5,25 42,25 36,30 38.5,38 32,33 25.5,38 28,30 22,25 29.5,25" fill="#80d8ff" opacity="0.6"/>
        <circle cx="32" cy="32" r="3.5" fill="white"/>
      </svg>`;
    case "Zlata medalja":
      return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rG${size}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#ff8a80"/>
            <stop offset="60%" stop-color="#e53935"/>
            <stop offset="100%" stop-color="#880e0e"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#5a0000" stroke="#3a0000" stroke-width="1.5"/>
        <circle cx="32" cy="32" r="25" fill="url(#rG${size})" stroke="#ff8a80" stroke-width="0.5"/>
        <circle cx="32" cy="32" r="23" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <polygon points="32,9 35.5,20 47,20 38,27 41.5,38 32,31 22.5,38 26,27 17,20 28.5,20" fill="white" opacity="0.95"/>
        <polygon points="32,15 34.5,23 42,23 36,28 38.5,36 32,31 25.5,36 28,28 22,23 29.5,23" fill="#ff8a80" opacity="0.65"/>
        <circle cx="32" cy="32" r="4" fill="white"/>
        <circle cx="32" cy="9"  r="2" fill="#ffcdd2"/>
        <circle cx="32" cy="55" r="2" fill="#ffcdd2"/>
        <circle cx="9"  cy="32" r="2" fill="#ffcdd2"/>
        <circle cx="55" cy="32" r="2" fill="#ffcdd2"/>
      </svg>`;
    default: return `<span style="font-size:${Math.round(s*0.6)}px">🏅</span>`;
  }
}

/* ══════════════════════════
   STATE
══════════════════════════ */
let allCards = [];
let mode     = 'quiz';
let opType   = 'both';
let tables   = new Set([1,2,3,4,5,6,7,8,9,10]);
let cards    = [];

let qQueue = [], qIdx = 0, qOk = 0, qNo = 0, qStreak = 0, qTimer = null;

let kQueue = [], kIdx = 0, kOk = 0, kNo = 0, kStreak = 0;
let kInput = '', kAnswered = false, kTimer = null;

let tLevelIdx = 0, tScore = 0, tStreak = 0, tTimeLeft = 0;
let tQueue = [], tIdx = 0, tTimer = null, tTimerStarted = false;
let tOverlay = null, tAnswered = false;

let restartDebounce = null;

/* ══════════════════════════
   SETTINGS PERSISTENCE
══════════════════════════ */
const STORAGE_KEY = 'brihta_settings_v1';
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s && ['quiz','keypad','timed'].includes(s.mode)) mode = s.mode;
    if (s && ['both','multiply','divide'].includes(s.op)) opType = s.op;
    if (s && Array.isArray(s.tables)) {
      const arr = s.tables.filter(n => Number.isInteger(n) && n>=1 && n<=10);
      if (arr.length) tables = new Set(arr);
    }
  } catch(e) {}
}
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode, op: opType, tables: [...tables]
    }));
  } catch(e) {}
}

/* ══════════════════════════
   UTILS
══════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function parseQuestion(q) {
  if (q.includes('×')) {
    const p = q.replace(/\s*=\s*$/, '').split('×').map(s => parseInt(s.trim()));
    return { op:'multiply', a:p[0], b:p[1] };
  }
  if (q.includes(':')) {
    const p = q.replace(/\s*=\s*$/, '').split(':').map(s => parseInt(s.trim()));
    return { op:'divide', a:p[0], b:p[1] };
  }
  return null;
}

/* FILTER:
   A problem belongs to the multiplication table of its SECOND operand.
   - a × b  →  table b   (e.g. 3 × 8 is in the 8-times table, 8 × 3 in the 3-times table)
   - c : b  →  table b   (e.g. 24 : 8 is in the 8-times table, 24 : 3 in the 3-times table)
   So in both cases the relevant table is p.b — show only if that table is selected. */
function getFilteredCards() {
  return allCards.filter(card => {
    const p = parseQuestion(card.question);
    if (!p) return false;
    if (opType==='multiply' && p.op!=='multiply') return false;
    if (opType==='divide'   && p.op!=='divide')   return false;
    return tables.has(p.b);
  });
}

function getWrongAnswers(correct) {
  const n = parseInt(correct);
  const cands = new Set();
  [-2,-1,1,2,-3,3,-5,5,10,-10,-4,4].forEach(d => { const v=n+d; if(v>0&&v!==n) cands.add(v); });
  if (String(n).length===2) {
    const rev = parseInt(String(n)[1]+String(n)[0]);
    if (rev!==n && rev>0) cands.add(rev);
  }
  const pool = shuffle([...cands]), res = [];
  for (const c of pool) { if (res.length>=3) break; res.push(String(c)); }
  for (let f=1; res.length<3; f++) { if(f!==n && !res.includes(String(f))) res.push(String(f)); }
  return res;
}

/* ── LOAD JSON ── */
function loadData(cb) {
  fetch('postevanka.json').then(r=>r.json()).then(d=>{allCards=d; if(cb) cb();})
    .catch(e=>console.error('Napaka pri nalaganju JSON:', e));
}

/* ── BRAND FALLBACK ── */
document.getElementById('brandImg').onerror = function() {
  this.style.display='none';
  const em=document.createElement('span'); em.className='brand-emoji'; em.textContent='🦉';
  this.parentNode.insertBefore(em, this);
};

/* ══════════════════════════
   TOOLBAR — chip toggles only (no auto-collapse)
══════════════════════════ */
const toolbar = document.getElementById('toolbar');
const summaryArrow = document.getElementById('summaryArrow');
function collapseToolbar() {
  toolbar.classList.add('collapsed');
  if (summaryArrow) summaryArrow.textContent = '▾';
}
function expandToolbar() {
  toolbar.classList.remove('collapsed');
  if (summaryArrow) summaryArrow.textContent = '▴';
}
document.getElementById('summaryChip').addEventListener('click', () => {
  toolbar.classList.contains('collapsed') ? expandToolbar() : collapseToolbar();
});

/* ── MODE BUTTONS ── */
document.querySelectorAll('#modeBtnGroup .seg-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.classList.contains('active')) return;
    document.querySelectorAll('#modeBtnGroup .seg-btn').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    mode = this.dataset.mode;
    showPanel(mode);
    updateSummary();
    saveSettings();
    triggerRestart();
  });
});

/* ── OP BUTTONS ── */
document.querySelectorAll('#opBtnGroup .seg-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.classList.contains('active')) return;
    document.querySelectorAll('#opBtnGroup .seg-btn').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    opType = this.dataset.op;
    updateSummary();
    saveSettings();
    triggerRestart();
  });
});

/* ── TABLE BUTTONS ── */
document.querySelectorAll('.table-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const n = parseInt(this.dataset.n);
    if (tables.has(n)) { tables.delete(n); this.classList.remove('active'); }
    else               { tables.add(n);    this.classList.add('active'); }
    updateSummary();
    saveSettings();
    triggerRestartDebounced();
  });
});
document.getElementById('selAll').addEventListener('click', () => {
  tables = new Set([1,2,3,4,5,6,7,8,9,10]);
  document.querySelectorAll('.table-btn').forEach(b => b.classList.add('active'));
  updateSummary();
  saveSettings();
  triggerRestart();
});
document.getElementById('selNone').addEventListener('click', () => {
  tables = new Set();
  document.querySelectorAll('.table-btn').forEach(b => b.classList.remove('active'));
  updateSummary();
  saveSettings();
  triggerRestart();
});

function applyUIFromState() {
  document.querySelectorAll('#modeBtnGroup .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  document.querySelectorAll('#opBtnGroup .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.op === opType);
  });
  document.querySelectorAll('.table-btn').forEach(b => {
    b.classList.toggle('active', tables.has(parseInt(b.dataset.n)));
  });
}

function showPanel(m) {
  document.getElementById('quizPanel').style.display   = m==='quiz'   ? '' : 'none';
  document.getElementById('keypadPanel').style.display = m==='keypad' ? '' : 'none';
  document.getElementById('timedPanel').style.display  = m==='timed'  ? '' : 'none';
  document.getElementById('scoreHUD').style.display = 'flex';
}

function updateSummary() {
  const mm = { quiz:'🎯 Kviz', keypad:'⌨️ Tipkovnica', timed:'⏱️ Tekma' };
  const om = { both:'× ÷', multiply:'×', divide:'÷' };
  document.getElementById('summaryMode').textContent = mm[mode] || mode;
  document.getElementById('summaryOp').textContent = om[opType];
  const sel = [...tables].sort((a,b)=>a-b);
  document.getElementById('summaryFilter').textContent =
    sel.length===10 ? 'Vse' : sel.length===0 ? 'Nič' : sel.join(', ');
}

/* ══════════════════════════
   RESTART
══════════════════════════ */
function triggerRestart() {
  if (restartDebounce) { clearTimeout(restartDebounce); restartDebounce = null; }
  doRestart();
}
function triggerRestartDebounced() {
  if (restartDebounce) clearTimeout(restartDebounce);
  restartDebounce = setTimeout(doRestart, 500);
}
function doRestart() {
  restartDebounce = null;
  if (tTimer) { clearInterval(tTimer); tTimer = null; }
  if (qTimer) { clearTimeout(qTimer);  qTimer = null; }
  if (kTimer) { clearTimeout(kTimer);  kTimer = null; }
  removeTimedOverlay();
  tLevelIdx = 0;
  cards = shuffle(getFilteredCards());
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else                        startTimedLevel();
}

/* ══════════════════════════
   SCORE HUD
══════════════════════════ */
function updateScoreHUD(ok, no, streak) {
  document.getElementById('scoreCorrect').textContent = ok;
  document.getElementById('scoreWrong').textContent   = no;
  const total = ok + no, pct = total ? Math.round(ok/total*100) : null;
  document.getElementById('scorePct').textContent = pct !== null ? pct + '%' : '—';

  const rank = ok > 0 ? getRank(ok) : RANKS[0];
  const next = getNextRank(ok);
  document.getElementById('hudMedalSVG').innerHTML  = getMedalSVG(rank.name, 38);
  document.getElementById('hudMedalName').textContent = rank.name.replace(' medalja', '');
  const nextEl = document.getElementById('hudMedalNext');
  if (next) {
    nextEl.textContent = `še ${next.minScore - ok} do ${next.name.replace(' medalja','')}`;
    nextEl.style.color = next.glow;
  } else {
    nextEl.textContent = '🏆 najvišji rang!';
    nextEl.style.color = '#ffe033';
  }

  const se = document.getElementById('hudStreak');
  if (se) {
    const mult = getMultiplier(streak || 0);
    se.textContent = (streak >= 2) ? `🔥 ${streak}×${mult>1?' ×'+mult:''}` : ' ';
    se.style.display = (streak >= 2) ? 'inline-block' : 'none';
  }
}

/* ══════════════════════════
   MEDAL INFO MODAL
══════════════════════════ */
function openMedalModal() {
  const list = document.getElementById('medalList');
  list.innerHTML = RANKS.map(r => `
    <div class="medal-row">
      <div class="medal-row-icon">${getMedalSVG(r.name, 48)}</div>
      <div class="medal-row-info">
        <div class="medal-row-name" style="color:${r.glow}">${r.name}</div>
        <div class="medal-row-score">od <strong>${r.minScore}</strong> točk</div>
      </div>
    </div>
  `).join('');
  document.getElementById('medalModal').style.display = 'flex';
}
function closeMedalModal() {
  document.getElementById('medalModal').style.display = 'none';
}

/* ══════════════════════════
   MEDAL EARNED OVERLAY
   Shown mid-game when a new medal threshold is crossed.
══════════════════════════ */
function showMedalEarnedOverlay(rank, score, onContinue) {
  removeTimedOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box">
      <div class="overlay-title" style="color:${rank.glow}">🎉 Nova medalja!</div>
      <div class="overlay-divider"></div>
      ${getMedalSVG(rank.name, 90)}
      <div class="overlay-score-big" style="color:${rank.glow}">${rank.name}</div>
      <div class="overlay-score-label">${score} pravilnih odgovorov</div>
      <div class="overlay-subtitle">Bravo! Napredek se ohrani — kar nadaljuj. 💪</div>
      <button class="overlay-btn overlay-btn-next" id="medalContinueBtn">Naprej ➡️</button>
    </div>`;
  document.body.appendChild(div);
  tOverlay = div;
  div.querySelector('#medalContinueBtn').addEventListener('click', () => {
    removeTimedOverlay();
    if (onContinue) onContinue();
  });
}
document.getElementById('medalItem').addEventListener('click', openMedalModal);
document.getElementById('medalModalClose').addEventListener('click', closeMedalModal);
document.getElementById('medalModal').addEventListener('click', e => {
  if (e.target.id === 'medalModal') closeMedalModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('medalModal').style.display !== 'none') {
    closeMedalModal();
  }
});

/* delegated click for any element with .medal-clickable opens modal */
document.body.addEventListener('click', e => {
  const el = e.target.closest('.medal-clickable');
  if (el) openMedalModal();
});

/* ══════════════════════════
   QUIZ MODE
══════════════════════════ */
function startQuiz() {
  qQueue = shuffle(cards); qIdx = 0; qOk = 0; qNo = 0; qStreak = 0;
  updateScoreHUD(0,0,0);
  renderQuizQ();
}
function renderQuizQ() {
  const area = document.getElementById('quizArea');
  if (!qQueue.length) {
    area.innerHTML = '<div class="quiz-empty">Ni računov. Izberi vsaj eno poštevanko v nastavitvah.</div>';
    return;
  }
  if (qIdx >= qQueue.length) {
    qQueue = shuffle(qQueue);
    qIdx = 0;
  }
  const cur = qQueue[qIdx];
  const correctAns = cur.answer;
  const opts = shuffle([correctAns, ...getWrongAnswers(correctAns)]);
  const mult = getMultiplier(qStreak);
  area.innerHTML = `
    <div class="quiz-question">${cur.question}</div>
    ${mult>1?`<div class="streak-badge">🔥 Množilnik ×${mult} aktiven!</div>`:''}
    <div class="quiz-options" id="quizOpts">
      ${opts.map(o=>`<button class="quiz-opt-btn" data-val="${o}">${o}</button>`).join('')}
    </div>
    <div class="quiz-advance-bar-wrap" id="advWrap">
      <div class="quiz-advance-bar" id="advBar"></div>
    </div>`;
  area.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      area.querySelectorAll('.quiz-opt-btn').forEach(b=>b.disabled=true);
      const isCorrect = this.dataset.val === correctAns;
      let earnedRank = null;
      if (isCorrect) {
        const prevRank = getRank(qOk);
        SFX.correct(); this.classList.add('correct'); qOk++; qStreak++;
        const newRank = getRank(qOk);
        if (newRank.name !== prevRank.name) earnedRank = newRank;
      } else {
        SFX.wrong(); this.classList.add('wrong'); qStreak = 0; qNo++;
        area.querySelectorAll('.quiz-opt-btn').forEach(b => {
          if (b.dataset.val === correctAns) b.classList.add('correct');
        });
      }
      updateScoreHUD(qOk, qNo, qStreak);
      const wrap = document.getElementById('advWrap'), bar = document.getElementById('advBar');
      if (wrap && bar) {
        wrap.style.display = 'block';
        bar.style.transition = `width ${isCorrect?'0.4s':'0.7s'} linear`;
        requestAnimationFrame(()=>requestAnimationFrame(()=>{ bar.style.width = '0%'; }));
      }
      qTimer = setTimeout(() => {
        if (earnedRank) {
          SFX.levelUp();
          showMedalEarnedOverlay(earnedRank, qOk, () => { qIdx++; renderQuizQ(); });
        } else {
          qIdx++; renderQuizQ();
        }
      }, isCorrect ? 400 : 700);
    });
  });
}

/* ══════════════════════════
   KEYPAD MODE
══════════════════════════ */
function startKeypad() {
  kQueue = shuffle(cards); kIdx = 0; kOk = 0; kNo = 0; kStreak = 0;
  kInput = ''; kAnswered = false;
  updateScoreHUD(0,0,0);
  renderKeypadQ();
}
function renderKeypadQ() {
  const area = document.getElementById('keypadArea');
  if (!kQueue.length) {
    area.innerHTML = '<div class="quiz-empty">Ni računov. Izberi vsaj eno poštevanko v nastavitvah.</div>';
    return;
  }
  if (kIdx >= kQueue.length) {
    kQueue = shuffle(kQueue);
    kIdx = 0;
  }
  const cur = kQueue[kIdx];
  const mult = getMultiplier(kStreak);
  area.innerHTML = `
    <div class="quiz-question">${cur.question}</div>
    ${mult>1?`<div class="streak-badge">🔥 Množilnik ×${mult} aktiven!</div>`:''}
    <div class="keypad-display" id="keypadDisplay">
      <span class="keypad-display-text" id="keypadDisplayText">_</span>
    </div>
    <div class="keypad-grid" id="keypadGrid">
      <button class="keypad-btn" data-d="7">7</button>
      <button class="keypad-btn" data-d="8">8</button>
      <button class="keypad-btn" data-d="9">9</button>
      <button class="keypad-btn" data-d="4">4</button>
      <button class="keypad-btn" data-d="5">5</button>
      <button class="keypad-btn" data-d="6">6</button>
      <button class="keypad-btn" data-d="1">1</button>
      <button class="keypad-btn" data-d="2">2</button>
      <button class="keypad-btn" data-d="3">3</button>
      <button class="keypad-btn keypad-back" data-d="back">⌫</button>
      <button class="keypad-btn" data-d="0">0</button>
      <button class="keypad-btn keypad-ok" data-d="ok">✓</button>
    </div>
    <div class="quiz-advance-bar-wrap" id="kAdvWrap" style="display:none">
      <div class="quiz-advance-bar" id="kAdvBar"></div>
    </div>
    <div class="keyboard-hint">💡 lahko tipkaš tudi na pravi tipkovnici · Enter potrdi · Backspace briše</div>`;
  area.querySelectorAll('.keypad-btn').forEach(btn => {
    btn.addEventListener('click', () => handleKeypadInput(btn.dataset.d));
  });
}

function handleKeypadInput(d) {
  if (kAnswered) return;
  if (d === 'back') {
    kInput = kInput.slice(0, -1);
    SFX.click();
  } else if (d === 'ok') {
    checkKeypadAnswer();
    return;
  } else {
    if (kInput.length >= 3) return;
    kInput += d;
    SFX.click();
  }
  const display = document.getElementById('keypadDisplayText');
  if (display) display.textContent = kInput || '_';
}

function checkKeypadAnswer() {
  if (kAnswered) return;
  if (!kInput.length) return;
  kAnswered = true;
  const cur = kQueue[kIdx];
  const correctAns = cur.answer;
  const isCorrect = kInput === correctAns;
  const display = document.getElementById('keypadDisplay');
  let earnedRank = null;

  if (isCorrect) {
    const prevRank = getRank(kOk);
    SFX.correct();
    if (display) display.classList.add('correct');
    kOk++; kStreak++;
    const newRank = getRank(kOk);
    if (newRank.name !== prevRank.name) earnedRank = newRank;
  } else {
    SFX.wrong();
    if (display) {
      display.classList.add('wrong');
      display.innerHTML = `
        <span class="keypad-display-text keypad-strike">${kInput}</span>
        <span class="keypad-display-arrow">→</span>
        <span class="keypad-display-correct">${correctAns}</span>`;
    }
    kStreak = 0; kNo++;
  }
  updateScoreHUD(kOk, kNo, kStreak);

  document.querySelectorAll('.keypad-btn').forEach(b => b.disabled = true);

  const wrap = document.getElementById('kAdvWrap'), bar = document.getElementById('kAdvBar');
  if (wrap && bar) {
    wrap.style.display = 'block';
    bar.style.transition = `width ${isCorrect?'0.4s':'0.7s'} linear`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ bar.style.width = '0%'; }));
  }

  kTimer = setTimeout(() => {
    if (earnedRank) {
      SFX.levelUp();
      showMedalEarnedOverlay(earnedRank, kOk, () => {
        kIdx++; kInput = ''; kAnswered = false;
        renderKeypadQ();
      });
    } else {
      kIdx++; kInput = ''; kAnswered = false;
      renderKeypadQ();
    }
  }, isCorrect ? 400 : 700);
}

/* physical keyboard for keypad mode */
document.addEventListener('keydown', e => {
  if (mode !== 'keypad') return;
  // ignore when modal is open or focus is in an input
  if (document.getElementById('medalModal').style.display === 'flex') return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    handleKeypadInput(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    handleKeypadInput('back');
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleKeypadInput('ok');
  }
});

/* ══════════════════════════════════════════
   TIMED MODE — 5-LEVEL MEDAL PROGRESSION
══════════════════════════════════════════ */
function startTimedLevel() {
  if (tTimer) { clearInterval(tTimer); tTimer=null; }
  removeTimedOverlay();
  const lv = TIMED_LEVELS[tLevelIdx];
  tScore = 0; tStreak = 0; tTimeLeft = lv.timeLimit;
  tQueue = shuffle([...cards]); tIdx = 0;
  tTimerStarted = false; tAnswered = false;
  renderTimedLevel();
}

function renderTimedLevel() {
  const area = document.getElementById('timedArea');
  if (!cards.length) {
    area.innerHTML = '<div class="quiz-empty">Ni računov. Izberi vsaj eno poštevanko v nastavitvah.</div>';
    return;
  }
  const lv = TIMED_LEVELS[tLevelIdx];
  const card = tQueue[tIdx % tQueue.length];
  const correctAns = card.answer;
  const opts = shuffle([correctAns, ...getWrongAnswers(correctAns)]);
  const mult = getMultiplier(tStreak);
  const pct = Math.min(100, Math.round((tScore/lv.target)*100));
  const m = Math.floor(tTimeLeft/60), s = tTimeLeft%60;
  const urg = tTimeLeft<=10 ? 'danger' : tTimeLeft<=25 ? 'warn' : '';

  area.innerHTML = `
    <div class="timed-header">
      <div class="timed-level-badge medal-clickable" title="Klikni za seznam medalj">
        ${getMedalSVG(lv.medal, 36)}
        <div>
          <div class="timed-level-name" style="color:${lv.glow}">${lv.medal}</div>
          <div class="timed-hint">${lv.hint}</div>
        </div>
      </div>
      <div class="timed-clock ${urg}" id="timedClock">
        <div class="clock-label">Čas</div>
        <div class="clock-time" id="clockTime">${m}:${String(s).padStart(2,'0')}</div>
        ${!tTimerStarted ? '<div class="clock-waiting">odgovori za start</div>' : ''}
      </div>
    </div>
    <div class="timed-progress-row">
      <span class="timed-score-txt" id="timedScoreTxt"><strong>${tScore}</strong> / ${lv.target} točk</span>
      ${tStreak>=2 ? `<span class="streak-badge">🔥 ${tStreak}× ${mult>1?'×'+mult:''}</span>` : ''}
    </div>
    <div class="timed-bar-wrap">
      <div class="timed-bar-fill" id="timedBar" style="width:${pct}%;background:linear-gradient(90deg,${lv.color},${lv.glow})"></div>
    </div>
    <div class="timed-bar-label" id="timedBarLabel">${lv.target-tScore>0 ? 'Manjka še '+(lv.target-tScore)+' točk' : '🎯 Cilj dosežen!'}</div>
    <div class="quiz-question" style="border-color:${lv.glow}">${card.question}</div>
    ${mult>1 ? `<div class="streak-badge">🔥 Množilnik ×${mult} aktiven!</div>` : ''}
    <div class="quiz-options" id="timedOpts">
      ${opts.map(o=>`<button class="quiz-opt-btn" data-val="${o}">${o}</button>`).join('')}
    </div>
    <div class="quiz-advance-bar-wrap" id="tAdvWrap" style="display:none">
      <div class="quiz-advance-bar" id="tAdvBar"></div>
    </div>`;

  area.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() { checkTimedAnswer(this, correctAns); });
  });
}

function checkTimedAnswer(btn, correctAns) {
  if (tAnswered) return;
  tAnswered = true;
  if (!tTimerStarted) { tTimerStarted = true; tTimer = setInterval(timedTick, 1000); }

  const area = document.getElementById('timedArea');
  area.querySelectorAll('.quiz-opt-btn').forEach(b=>b.disabled=true);
  const isCorrect = btn.dataset.val === correctAns;
  const lv = TIMED_LEVELS[tLevelIdx];

  if (isCorrect) {
    SFX.correct(); btn.classList.add('correct');
    tStreak++; tScore += getMultiplier(tStreak);
  } else {
    SFX.wrong(); btn.classList.add('wrong');
    area.querySelectorAll('.quiz-opt-btn').forEach(b => {
      if (b.dataset.val === correctAns) b.classList.add('correct');
    });
    tStreak = 0; tScore = Math.max(0, tScore - 1);
  }

  const pct = Math.min(100, Math.round((tScore/lv.target)*100));
  const st = document.getElementById('timedScoreTxt');
  if (st) st.innerHTML = `<strong>${tScore}</strong> / ${lv.target} točk`;
  const bar = document.getElementById('timedBar');
  if (bar) bar.style.width = pct + '%';
  const lbl = document.getElementById('timedBarLabel');
  if (lbl) lbl.textContent = lv.target - tScore > 0 ? 'Manjka še '+(lv.target-tScore)+' točk' : '🎯 Cilj dosežen!';

  const wrap = document.getElementById('tAdvWrap'), advBar = document.getElementById('tAdvBar');
  if (wrap && advBar) {
    wrap.style.display = 'block';
    advBar.style.transition = `width ${isCorrect?'0.4s':'0.7s'} linear`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ advBar.style.width = '0%'; }));
  }

  if (tScore >= lv.target) {
    clearInterval(tTimer); tTimer = null;
    setTimeout(() => { tAnswered = false; advanceTimedLevel(); }, isCorrect ? 400 : 700);
    return;
  }
  setTimeout(() => {
    tAnswered = false; tIdx++;
    if (tIdx >= tQueue.length) { tIdx = 0; tQueue = shuffle(tQueue); }
    renderTimedLevel();
  }, isCorrect ? 400 : 700);
}

function timedTick() {
  tTimeLeft--;
  const el = document.getElementById('clockTime');
  if (el) { const m = Math.floor(tTimeLeft/60), s = tTimeLeft%60; el.textContent = `${m}:${String(s).padStart(2,'0')}`; }
  const cl = document.getElementById('timedClock');
  if (cl) cl.className = 'timed-clock ' + (tTimeLeft<=10 ? 'danger' : tTimeLeft<=25 ? 'warn' : '');
  if (tTimeLeft <= 0) { clearInterval(tTimer); tTimer = null; setTimeout(showTimedGameOver, 200); }
}

function advanceTimedLevel() {
  const lv = TIMED_LEVELS[tLevelIdx];
  if (tLevelIdx >= TIMED_LEVELS.length - 1) { showTimedVictory(); return; }
  SFX.levelUp();
  const nextLv = TIMED_LEVELS[tLevelIdx + 1];
  showTimedOverlay(`
    <div class="overlay-title" style="color:${lv.glow}">⭐ Raven opravljena!</div>
    <div class="overlay-divider"></div>
    ${getMedalSVG(lv.medal, 80)}
    <div class="overlay-score-big" style="color:${lv.glow}">${tScore}</div>
    <div class="overlay-score-label">točk · cilj ${lv.target}</div>
    <div class="overlay-subtitle">
      Naslednja raven:<br>
      <strong style="color:${nextLv.glow};font-size:1.1rem">${nextLv.medal}</strong><br>
      <span style="font-size:0.8rem;color:rgba(255,255,255,0.4)">${nextLv.hint}</span>
    </div>
    <button class="overlay-btn overlay-btn-next" id="nextLevelBtn">Naprej ➡️</button>
  `, () => { tLevelIdx++; startTimedLevel(); });
}

function showTimedGameOver() {
  SFX.wrong(); setTimeout(SFX.wrong, 200);
  const lv = TIMED_LEVELS[tLevelIdx];
  showTimedOverlay(`
    <div class="overlay-gameover">KONEC IGRE</div>
    <div class="overlay-divider"></div>
    ${getMedalSVG(lv.medal, 64)}
    <div style="color:rgba(255,255,255,0.55);font-size:0.9rem">Raven: <strong style="color:#fff">${lv.medal}</strong></div>
    <div>
      <div class="overlay-score-label">Zbrane točke</div>
      <div class="overlay-score-big">${tScore}</div>
      <div class="overlay-score-label">cilj: ${lv.target}</div>
    </div>
    <div class="overlay-subtitle">Manjkalo je <strong>${lv.target-tScore}</strong> točk. Poskusi znova! 💪</div>
    <button class="overlay-btn overlay-btn-retry"   id="retryBtn">↺ Poskusi znova</button>
    <button class="overlay-btn overlay-btn-restart" id="restartBtn">⏮ Začni od začetka</button>
  `, null, { retry:()=>startTimedLevel(), restart:()=>{ tLevelIdx=0; startTimedLevel(); } });
}

function showTimedVictory() {
  SFX.victory();
  const lv = TIMED_LEVELS[tLevelIdx];
  showTimedOverlay(`
    <div class="overlay-title" style="color:${lv.glow}">🏆 PRVAK! 🏆</div>
    <div class="overlay-divider"></div>
    ${getMedalSVG(lv.medal, 90)}
    <div class="overlay-score-big" style="color:${lv.glow}">${tScore}</div>
    <div class="overlay-score-label">točk na zlati ravni</div>
    <div class="overlay-subtitle">Čestitke! Premagal si vse ravni! 🎖️</div>
    <button class="overlay-btn overlay-btn-restart" id="playAgainBtn">🔄 Igraj znova</button>
  `, () => { tLevelIdx = 0; startTimedLevel(); });
}

function showTimedOverlay(html, onNext, extras) {
  removeTimedOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `<div class="timed-overlay-box">${html}</div>`;
  document.body.appendChild(div);
  tOverlay = div;
  const nb = div.querySelector('#nextLevelBtn');
  if (nb && onNext) nb.addEventListener('click', () => { removeTimedOverlay(); onNext(); });
  const pb = div.querySelector('#playAgainBtn');
  if (pb && onNext) pb.addEventListener('click', () => { removeTimedOverlay(); onNext(); });
  if (extras) {
    const rb = div.querySelector('#retryBtn'), sb = div.querySelector('#restartBtn');
    if (rb) rb.addEventListener('click', () => { removeTimedOverlay(); extras.retry(); });
    if (sb) sb.addEventListener('click', () => { removeTimedOverlay(); extras.restart(); });
  }
}
function removeTimedOverlay() {
  if (tOverlay && tOverlay.parentNode) tOverlay.parentNode.removeChild(tOverlay);
  tOverlay = null;
}

/* ══════════════════════════
   INIT
══════════════════════════ */
loadSettings();
applyUIFromState();
updateSummary();
showPanel(mode);
loadData(() => {
  cards = shuffle(getFilteredCards());
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else                        startTimedLevel();
});
collapseToolbar();
