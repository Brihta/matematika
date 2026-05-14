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

/* Competition (Tekmovanje) state */
let cQueue = [], cIdx = 0, cScore = 0, cStreak = 0, cTimeLeft = 60;
let cCorrect = 0, cWrong = 0;
let cInput = '', cAnswered = false, cTimer = null, cActive = false, cAdvanceTimer = null;
const COMP_DURATION   = 60;   // seconds
const COMP_OPEN_HOUR  = 7;    // 07:00 Slovenia
const COMP_CLOSE_HOUR = 19;   // 19:00 Slovenia

let activeOverlay = null;
let restartDebounce = null;

/* Student profile + stats logging */
let profile = null;                 // { id, username, emoji, display_name } or null
let teacherSession = null;          // { id, username } or null
let pendingStats = {};              // { mode: {correct,wrong,points,seconds} }
let pendingTableStats = {};         // { "t_op": {t,op,c,w} }
let pendingAnswerCount = 0;
let lastAnswerTs = 0;               // for estimating practice time in quiz/keypad

/* 12 animal icons — the password is a sequence of 4 of these (order matters) */
const ANIMALS = ['🐘','🦁','🦊','🐊','🐬','🦉','🐸','🐢','🦒','🐧','🐝','🐙'];
/* Emoji choices for the profile badge */
const PROFILE_EMOJIS = ['🦉','🚀','🦄','🐉','🌟','⚡','🎮','🍕','🦖','🐱','🐶','🦁','🌈','🎨','⚽','🦋'];

/* ══════════════════════════
   SETTINGS PERSISTENCE
══════════════════════════ */
const STORAGE_KEY = 'brihta_settings_v1';
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s && ['quiz','keypad','tekmovanje'].includes(s.mode)) mode = s.mode;
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

/* Profile session persistence */
const PROFILE_KEY = 'brihta_profile_v1';
const TEACHER_KEY = 'brihta_teacher_v1';
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && p.id && p.username) profile = p; }
  } catch(e) {}
  try {
    const raw = localStorage.getItem(TEACHER_KEY);
    if (raw) { const t = JSON.parse(raw); if (t && t.id && t.username) teacherSession = t; }
  } catch(e) {}
}
function saveProfile() {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_KEY);
  } catch(e) {}
}
function saveTeacher() {
  try {
    if (teacherSession) localStorage.setItem(TEACHER_KEY, JSON.stringify(teacherSession));
    else localStorage.removeItem(TEACHER_KEY);
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
const summaryLabel = document.getElementById('summaryLabel');
function collapseToolbar() {
  toolbar.classList.add('collapsed');
  if (summaryArrow) summaryArrow.textContent = '▾';
  if (summaryLabel) summaryLabel.textContent = 'Nastavitve';
}
function expandToolbar() {
  toolbar.classList.remove('collapsed');
  if (summaryArrow) summaryArrow.textContent = '▴';
  if (summaryLabel) summaryLabel.textContent = 'Skrij nastavitve';
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
    updateControlLock();
    updateSummary();
    saveSettings();
    triggerRestart();
  });
});

/* Lock the op / tables controls while in Tekmovanje (fixed settings there) */
function updateControlLock() {
  const lock = (mode === 'tekmovanje');
  document.querySelectorAll('#opBtnGroup .seg-btn, .table-btn, #selAll, #selNone')
    .forEach(b => { b.disabled = lock; });
  document.getElementById('opBtnGroup').classList.toggle('locked', lock);
  document.getElementById('filterRow').classList.toggle('locked', lock);
}

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
  document.getElementById('quizPanel').style.display       = m==='quiz'       ? '' : 'none';
  document.getElementById('keypadPanel').style.display     = m==='keypad'     ? '' : 'none';
  document.getElementById('tekmovanjePanel').style.display = m==='tekmovanje' ? '' : 'none';
  document.getElementById('scoreHUD').style.display = (m==='tekmovanje') ? 'none' : 'flex';
  document.body.classList.toggle('competition', m==='tekmovanje');
}

/* The chip now shows a static "Nastavitve" / "Skrij nastavitve" label
   (set by collapse/expandToolbar), so there is nothing to update here. */
function updateSummary() {}

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
  if (qTimer) { clearTimeout(qTimer);  qTimer = null; }
  if (kTimer) { clearTimeout(kTimer);  kTimer = null; }
  if (cTimer) { clearInterval(cTimer); cTimer = null; }
  if (cAdvanceTimer) { clearTimeout(cAdvanceTimer); cAdvanceTimer = null; }
  cActive = false;
  flushStats();          // persist any answers from the mode we are leaving
  lastAnswerTs = 0;
  removeOverlay();
  cards = shuffle(getFilteredCards());
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else                        showTekmovanjePanel();
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
   GENERIC OVERLAY HELPER
══════════════════════════ */
function removeOverlay() {
  if (activeOverlay && activeOverlay.parentNode) activeOverlay.parentNode.removeChild(activeOverlay);
  activeOverlay = null;
}

/* ══════════════════════════
   MEDAL EARNED OVERLAY
   Shown mid-game when a new medal threshold is crossed.
══════════════════════════ */
function showMedalEarnedOverlay(rank, score, onContinue) {
  removeOverlay();
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
  activeOverlay = div;
  div.querySelector('#medalContinueBtn').addEventListener('click', () => {
    removeOverlay();
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
      recordTableStat(cur.question, isCorrect);
      recordStat('quiz', isCorrect?1:0, isCorrect?0:1, isCorrect?1:0, answerSeconds());
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
  recordTableStat(cur.question, isCorrect);
  recordStat('keypad', isCorrect?1:0, isCorrect?0:1, isCorrect?1:0, answerSeconds());
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
   TEKMOVANJE (COMPETITION) MODE
   60 s keypad sprint · daily leaderboard
══════════════════════════════════════════ */

/* ── Leaderboard backend config ──
   Vpiši Supabase podatka spodaj za skupno lestvico med napravami.
   Če sta prazna, lestvica deluje lokalno (localStorage) na tej napravi. */
const LEADERBOARD = {
  supabaseUrl: 'https://ldczgbajbarlgwqzcggh.supabase.co',
  supabaseKey: 'sb_publishable_888IYcEb-nSmGO0d67hEwA_rBFuXnv8',
};
function leaderboardEnabled() {
  return !!(LEADERBOARD.supabaseUrl && LEADERBOARD.supabaseKey);
}

/* ── Slovenia-time helpers ── */
function sloveniaParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Ljubljana',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const o = {};
  for (const p of fmt.formatToParts(new Date())) o[p.type] = p.value;
  if (o.hour === '24') o.hour = '00';
  return o;
}
function getTodayKey()      { const p = sloveniaParts(); return `${p.year}-${p.month}-${p.day}`; }
function getSloveniaHour()  { return parseInt(sloveniaParts().hour, 10); }
function getSloveniaClock() { const p = sloveniaParts(); return `${p.hour}:${p.minute}`; }
function isCompetitionOpen() {
  const h = getSloveniaHour();
  return h >= COMP_OPEN_HOUR && h < COMP_CLOSE_HOUR;
}

/* ── Leaderboard storage ── */
function loadLocalBoard(day) {
  try {
    const all = JSON.parse(localStorage.getItem('brihta_leaderboard') || '{}');
    return (all[day] || []).slice().sort((a,b)=>b.score-a.score).slice(0,10);
  } catch(e) { return []; }
}
function saveLocalScore(day, name, score) {
  try {
    const all = JSON.parse(localStorage.getItem('brihta_leaderboard') || '{}');
    if (!all[day]) all[day] = [];
    all[day].push({ name, score, created_at: new Date().toISOString() });
    all[day] = all[day].sort((a,b)=>b.score-a.score).slice(0,50);
    // keep only the last few days
    const keys = Object.keys(all).sort();
    while (keys.length > 7) delete all[keys.shift()];
    localStorage.setItem('brihta_leaderboard', JSON.stringify(all));
  } catch(e) {}
}
async function fetchLeaderboard() {
  const day = getTodayKey();
  if (leaderboardEnabled()) {
    try {
      const url = `${LEADERBOARD.supabaseUrl}/rest/v1/scores`
        + `?day=eq.${day}&order=score.desc,created_at.asc&limit=10`;
      const res = await fetch(url, {
        headers: {
          apikey: LEADERBOARD.supabaseKey,
          Authorization: `Bearer ${LEADERBOARD.supabaseKey}`
        }
      });
      if (res.ok) return await res.json();
    } catch(e) {}
  }
  return loadLocalBoard(day);
}
async function submitScore(name, score) {
  const day = getTodayKey();
  saveLocalScore(day, name, score);   // always keep a local copy
  if (leaderboardEnabled()) {
    try {
      await fetch(`${LEADERBOARD.supabaseUrl}/rest/v1/scores`, {
        method: 'POST',
        headers: {
          apikey: LEADERBOARD.supabaseKey,
          Authorization: `Bearer ${LEADERBOARD.supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ name, score, day })
      });
    } catch(e) {}
  }
}

/* ══════════════════════════
   SUPABASE RPC + STUDENT PROFILES
══════════════════════════ */
async function supabaseRPC(fn, params, extra) {
  if (!leaderboardEnabled()) return null;
  try {
    const res = await fetch(`${LEADERBOARD.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: LEADERBOARD.supabaseKey,
        Authorization: `Bearer ${LEADERBOARD.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params || {}),
      ...(extra || {})
    });
    if (!res.ok) return null;
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  } catch(e) { return null; }
}

/* Monday (Slovenia) of the current week, as YYYY-MM-DD */
function getWeekStartKey() {
  const p = sloveniaParts();
  const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  const dow = d.getUTCDay();              // 0 = Sun … 6 = Sat
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

/* ── Auth ── */
async function registerStudent(name, number, emoji, pinSeq) {
  const rows = await supabaseRPC('register_student', {
    p_name: name, p_number: String(number), p_emoji: emoji, p_pin: pinSeq
  });
  if (rows && rows.length) {
    profile = { id: rows[0].id, username: rows[0].username,
                emoji: rows[0].emoji, display_name: rows[0].display_name };
    saveProfile();
    updateProfileButton();
    return profile;
  }
  return null;
}
async function loginStudent(username, pinSeq) {
  const rows = await supabaseRPC('login_student', {
    p_username: username.toLowerCase().trim(), p_pin: pinSeq
  });
  if (rows && rows.length) {
    profile = { id: rows[0].id, username: rows[0].username,
                emoji: rows[0].emoji, display_name: rows[0].display_name };
    saveProfile();
    updateProfileButton();
    return profile;
  }
  return null;
}
function logoutStudent() {
  flushStats();
  profile = null;
  saveProfile();
  updateProfileButton();
}

/* ── Teacher auth ── */
async function loginTeacher(username, pin) {
  const rows = await supabaseRPC('login_teacher', {
    p_username: username.toLowerCase().trim(), p_pin: pin
  });
  if (rows && rows.length) {
    teacherSession = { id: rows[0].id, username: rows[0].username };
    profile = null; saveProfile();
    saveTeacher();
    updateProfileButton();
    return teacherSession;
  }
  return null;
}
function logoutTeacher() {
  teacherSession = null;
  saveTeacher();
  updateProfileButton();
}

/* ── Stats logging ── */
function recordStat(modeKey, correct, wrong, points, seconds) {
  if (!profile) return;
  if (!pendingStats[modeKey]) pendingStats[modeKey] = { correct:0, wrong:0, points:0, seconds:0 };
  const s = pendingStats[modeKey];
  s.correct += correct; s.wrong += wrong; s.points += points; s.seconds += seconds;
  pendingAnswerCount++;
  if (pendingAnswerCount >= 10) flushStats();
}
/* per-times-table logging — a question belongs to the table of its 2nd operand */
function recordTableStat(question, isCorrect) {
  if (!profile) return;
  const p = parseQuestion(question);
  if (!p || !(p.b >= 1 && p.b <= 10)) return;
  const op = p.op === 'multiply' ? 'x' : 'd';
  const key = p.b + '_' + op;
  if (!pendingTableStats[key]) pendingTableStats[key] = { t: p.b, op, c: 0, w: 0 };
  if (isCorrect) pendingTableStats[key].c++; else pendingTableStats[key].w++;
}
/* time since the previous answer, capped so idle time doesn't inflate it */
function answerSeconds() {
  const now = Date.now();
  let dt = lastAnswerTs ? (now - lastAnswerTs) / 1000 : 0;
  lastAnswerTs = now;
  if (dt < 0 || dt > 20) dt = dt > 20 ? 20 : 0;
  return dt;
}
function flushStats(useKeepalive) {
  if (!profile) { pendingStats = {}; pendingTableStats = {}; pendingAnswerCount = 0; return; }
  const toSend = pendingStats;
  const toSendTables = pendingTableStats;
  pendingStats = {};
  pendingTableStats = {};
  pendingAnswerCount = 0;
  const day = getTodayKey();
  const extra = useKeepalive ? { keepalive: true } : undefined;
  for (const modeKey of Object.keys(toSend)) {
    const s = toSend[modeKey];
    if (!s.correct && !s.wrong && !s.points && !s.seconds) continue;
    supabaseRPC('add_stats', {
      p_student: profile.id, p_mode: modeKey, p_day: day,
      p_correct: s.correct, p_wrong: s.wrong,
      p_points: s.points, p_seconds: Math.round(s.seconds)
    }, extra);
  }
  const tableData = Object.keys(toSendTables).map(k => toSendTables[k]);
  if (tableData.length) {
    supabaseRPC('add_table_stats', {
      p_student: profile.id, p_day: day, p_data: tableData
    }, extra);
  }
}
async function supabaseSelect(path) {
  if (!leaderboardEnabled()) return [];
  try {
    const res = await fetch(`${LEADERBOARD.supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: LEADERBOARD.supabaseKey,
                 Authorization: `Bearer ${LEADERBOARD.supabaseKey}` }
    });
    if (res.ok) return await res.json();
  } catch(e) {}
  return [];
}
async function fetchStudentStats() {
  if (!profile) return [];
  return supabaseSelect(`stats?student_id=eq.${profile.id}`);
}
async function fetchStudentTableStats() {
  if (!profile) return [];
  return supabaseSelect(`table_stats?student_id=eq.${profile.id}`);
}

/* date 14 days ago (Slovenia), as YYYY-MM-DD — start of the "recent" window */
function getRecentSinceKey() {
  const p = sloveniaParts();
  const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  d.setUTCDate(d.getUTCDate() - 13);
  return d.toISOString().slice(0, 10);
}

/* ── Mastery classification (shared by child + teacher views) ── */
function masteryClass(correct, wrong) {
  const total = (correct || 0) + (wrong || 0);
  if (total < 5) return 'm-none';
  const pct = correct / total * 100;
  if (pct >= 85) return 'm-good';
  if (pct >= 60) return 'm-mid';
  return 'm-bad';
}
function masteryPct(correct, wrong) {
  const total = (correct || 0) + (wrong || 0);
  return total ? Math.round(correct / total * 100) : null;
}

/* ══════════════════════════
   PROFILE UI
══════════════════════════ */
function updateProfileButton() {
  const btn = document.getElementById('profileBtn');
  if (!btn) return;
  if (teacherSession) {
    btn.innerHTML = `<span class="profile-emoji">👨‍🏫</span>`
      + `<span class="profile-name">${teacherSession.username}</span>`;
    btn.classList.add('logged-in');
  } else if (profile) {
    btn.innerHTML = `<span class="profile-emoji">${profile.emoji || '🦉'}</span>`
      + `<span class="profile-name">${profile.username}</span>`;
    btn.classList.add('logged-in');
  } else {
    btn.innerHTML = `<span class="profile-emoji">👤</span>`
      + `<span class="profile-name">Prijava</span>`;
    btn.classList.remove('logged-in');
  }
}
function handleProfileButton() {
  if (teacherSession) openTeacherDashboard();
  else if (profile)   openStatsOverlay();
  else                openAuthOverlay('login');
}

/* Reusable 4-animal code picker. Returns an element; read `.getSeq()` for the code. */
function buildAnimalPicker() {
  const wrap = document.createElement('div');
  wrap.className = 'animal-picker';
  let seq = [];
  const slots = document.createElement('div');
  slots.className = 'animal-slots';
  const grid = document.createElement('div');
  grid.className = 'animal-grid';
  const hint = document.createElement('div');
  hint.className = 'animal-hint';

  function render() {
    slots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'animal-slot' + (seq[i] != null ? ' filled' : '');
      slot.textContent = seq[i] != null ? ANIMALS[seq[i]] : '';
      slots.appendChild(slot);
    }
    hint.textContent = seq.length < 4
      ? `Izberi še ${4 - seq.length} ${seq.length === 3 ? 'žival' : 'živali'}`
      : '✓ Geslo izbrano';
  }
  ANIMALS.forEach((a, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'animal-btn';
    b.textContent = a;
    b.addEventListener('click', () => {
      if (seq.length >= 4) return;
      seq.push(idx);
      SFX.click();
      render();
    });
    grid.appendChild(b);
  });
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'animal-clear';
  clearBtn.textContent = '⌫ Počisti';
  clearBtn.addEventListener('click', () => { seq = []; render(); });

  wrap.appendChild(slots);
  wrap.appendChild(grid);
  wrap.appendChild(hint);
  wrap.appendChild(clearBtn);
  render();
  wrap.getSeq = () => (seq.length === 4 ? seq.join(',') : null);
  return wrap;
}

function openAuthOverlay(startView) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `<div class="timed-overlay-box auth-box" id="authBox"></div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) removeOverlay(); });
  renderAuthView(startView || 'login');
}

function renderAuthView(view) {
  const box = document.getElementById('authBox');
  if (!box) return;

  if (view === 'login') {
    box.innerHTML = `
      <div class="overlay-title" style="color:#f0a500">👤 Prijava</div>
      <div class="overlay-divider"></div>
      <label class="auth-label">Uporabniško ime</label>
      <input id="authUser" class="auth-input" autocomplete="off"
             autocapitalize="none" placeholder="npr. nin4" />
      <label class="auth-label">Geslo — poklikaj svoje 4 živali</label>
      <div id="authPickerSlot"></div>
      <button class="overlay-btn overlay-btn-next" id="authLoginBtn">Prijava ✓</button>
      <div class="auth-msg" id="authMsg"></div>
      <button class="auth-switch" id="authToRegister">Nimaš računa? Ustvari ga</button>
      <button class="auth-switch" id="authToTeacher">👨‍🏫 Prijava za učitelje</button>
      <button class="auth-switch auth-close" id="authClose">Zapri</button>`;
    const picker = buildAnimalPicker();
    box.querySelector('#authPickerSlot').appendChild(picker);
    box.querySelector('#authClose').addEventListener('click', removeOverlay);
    box.querySelector('#authToRegister').addEventListener('click', () => renderAuthView('register'));
    box.querySelector('#authToTeacher').addEventListener('click', () => renderAuthView('teacher'));
    box.querySelector('#authLoginBtn').addEventListener('click', async () => {
      const user = box.querySelector('#authUser').value.trim();
      const seq = picker.getSeq();
      const msg = box.querySelector('#authMsg');
      if (!user) { msg.textContent = 'Vpiši uporabniško ime.'; return; }
      if (!seq)  { msg.textContent = 'Izberi vse 4 živali.'; return; }
      const btn = box.querySelector('#authLoginBtn');
      btn.disabled = true; btn.textContent = 'Preverjam …';
      const ok = await loginStudent(user, seq);
      if (ok) { removeOverlay(); openStatsOverlay(); }
      else {
        btn.disabled = false; btn.textContent = 'Prijava ✓';
        msg.textContent = '❌ Napačno uporabniško ime ali geslo.';
      }
    });
    return;
  }

  if (view === 'teacher') {
    box.innerHTML = `
      <div class="overlay-title" style="color:#f0a500">👨‍🏫 Prijava za učitelje</div>
      <div class="overlay-divider"></div>
      <label class="auth-label">Uporabniško ime</label>
      <input id="tUser" class="auth-input" autocomplete="off" autocapitalize="none" />
      <label class="auth-label">Geslo</label>
      <input id="tPin" class="auth-input" type="password" autocomplete="off" />
      <button class="overlay-btn overlay-btn-next" id="tLoginBtn">Prijava ✓</button>
      <div class="auth-msg" id="tMsg"></div>
      <button class="auth-switch" id="tToLogin">← Nazaj na prijavo učencev</button>
      <button class="auth-switch auth-close" id="tClose">Zapri</button>`;
    box.querySelector('#tClose').addEventListener('click', removeOverlay);
    box.querySelector('#tToLogin').addEventListener('click', () => renderAuthView('login'));
    const doTeacherLogin = async () => {
      const user = box.querySelector('#tUser').value.trim();
      const pin = box.querySelector('#tPin').value;
      const msg = box.querySelector('#tMsg');
      if (!user || !pin) { msg.textContent = 'Vpiši uporabniško ime in geslo.'; return; }
      const btn = box.querySelector('#tLoginBtn');
      btn.disabled = true; btn.textContent = 'Preverjam …';
      const ok = await loginTeacher(user, pin);
      if (ok) { removeOverlay(); openTeacherDashboard(); }
      else {
        btn.disabled = false; btn.textContent = 'Prijava ✓';
        msg.textContent = '❌ Napačno uporabniško ime ali geslo.';
      }
    };
    box.querySelector('#tLoginBtn').addEventListener('click', doTeacherLogin);
    box.querySelector('#tPin').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); doTeacherLogin(); }
    });
    return;
  }

  /* register */
  box.innerHTML = `
    <div class="overlay-title" style="color:#f0a500">✨ Nov račun</div>
    <div class="overlay-divider"></div>
    <label class="auth-label">Tvoje ime</label>
    <input id="regName" class="auth-input" autocomplete="off" placeholder="npr. Nino" />
    <label class="auth-label">Tvoja najljubša številka</label>
    <input id="regNumber" class="auth-input" inputmode="numeric"
           autocomplete="off" placeholder="npr. 4" />
    <label class="auth-label">Izberi svoj emoji</label>
    <div class="emoji-grid" id="regEmojiGrid"></div>
    <label class="auth-label">Geslo — izberi 4 živali (zapomni si vrstni red!)</label>
    <div id="regPickerSlot"></div>
    <button class="overlay-btn overlay-btn-next" id="regBtn">Ustvari račun ✓</button>
    <div class="auth-msg" id="regMsg"></div>
    <button class="auth-switch" id="regToLogin">Že imaš račun? Prijavi se</button>
    <button class="auth-switch auth-close" id="regClose">Zapri</button>`;

  let chosenEmoji = PROFILE_EMOJIS[0];
  const eg = box.querySelector('#regEmojiGrid');
  PROFILE_EMOJIS.forEach((em, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'emoji-btn' + (i === 0 ? ' active' : '');
    b.textContent = em;
    b.addEventListener('click', () => {
      eg.querySelectorAll('.emoji-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      chosenEmoji = em;
    });
    eg.appendChild(b);
  });
  const picker = buildAnimalPicker();
  box.querySelector('#regPickerSlot').appendChild(picker);
  box.querySelector('#regClose').addEventListener('click', removeOverlay);
  box.querySelector('#regToLogin').addEventListener('click', () => renderAuthView('login'));
  box.querySelector('#regBtn').addEventListener('click', async () => {
    const name = box.querySelector('#regName').value.trim();
    const number = box.querySelector('#regNumber').value.replace(/[^0-9]/g, '').slice(0, 3);
    const seq = picker.getSeq();
    const msg = box.querySelector('#regMsg');
    if (name.length < 1)   { msg.textContent = 'Vpiši svoje ime.'; return; }
    if (!number)           { msg.textContent = 'Vpiši svojo najljubšo številko.'; return; }
    if (!seq)              { msg.textContent = 'Izberi vse 4 živali za geslo.'; return; }
    const btn = box.querySelector('#regBtn');
    btn.disabled = true; btn.textContent = 'Ustvarjam …';
    const ok = await registerStudent(name, number, chosenEmoji, seq);
    if (ok) {
      box.innerHTML = `
        <div class="overlay-title" style="color:#4caf50">✅ Račun ustvarjen!</div>
        <div class="overlay-divider"></div>
        <div class="reg-done-emoji">${ok.emoji}</div>
        <div class="reg-done-label">Tvoje uporabniško ime je</div>
        <div class="reg-done-user">${ok.username}</div>
        <div class="auth-msg">📌 Dobro si ga zapomni — rabil ga boš za prijavo!</div>
        <button class="overlay-btn overlay-btn-next" id="regDoneBtn">Naprej ➡️</button>`;
      box.querySelector('#regDoneBtn').addEventListener('click', () => {
        removeOverlay();
        openStatsOverlay();
      });
    } else {
      btn.disabled = false; btn.textContent = 'Ustvari račun ✓';
      msg.textContent = '❌ Napaka pri ustvarjanju računa. Poskusi znova.';
    }
  });
}

/* ── Stats dashboard ── */
function aggregateStats(rows, since) {
  // since = null → all-time, else only rows with day >= since
  const byMode = {};
  for (const r of rows) {
    if (since && r.day < since) continue;
    if (!byMode[r.mode]) byMode[r.mode] = { correct:0, wrong:0, points:0, seconds:0 };
    const m = byMode[r.mode];
    m.correct += r.correct || 0;
    m.wrong   += r.wrong   || 0;
    m.points  += r.points  || 0;
    m.seconds += r.seconds || 0;
  }
  return byMode;
}
function fmtDuration(sec) {
  sec = Math.round(sec || 0);
  if (sec < 60) return sec + ' s';
  const m = Math.floor(sec / 60);
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60);
  return h + ' h ' + (m % 60) + ' min';
}
function statCell(s) {
  if (!s || (!s.correct && !s.wrong)) {
    return '<div class="stat-cell empty">—</div>';
  }
  const total = s.correct + s.wrong;
  const pct = total ? Math.round(s.correct / total * 100) : 0;
  return `<div class="stat-cell">
    <div class="stat-line"><span class="stat-ico">✅</span> ${s.correct}</div>
    <div class="stat-line"><span class="stat-ico">❌</span> ${s.wrong} <span class="stat-pct">${pct}%</span></div>
    <div class="stat-line"><span class="stat-ico">⭐</span> ${s.points}</div>
    <div class="stat-line"><span class="stat-ico">⏱️</span> ${fmtDuration(s.seconds)}</div>
  </div>`;
}
async function openStatsOverlay() {
  if (!profile) { openAuthOverlay('login'); return; }
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box stats-box">
      <button class="medal-modal-close" id="statsClose" title="Zapri">✕</button>
      <div class="stats-header">
        <span class="stats-emoji">${profile.emoji || '🦉'}</span>
        <div>
          <div class="stats-username">${profile.username}</div>
          <div class="stats-subname">${profile.display_name || ''}</div>
        </div>
      </div>
      <div class="stats-body" id="statsBody">
        <div class="comp-board-empty">Nalagam statistiko …</div>
      </div>
      <div class="stats-section-title">📚 Poštevanke</div>
      <div class="ptable-toggle" id="ptableToggle">
        <button class="ptable-tog-btn active" data-w="recent">Zadnja 2 tedna</button>
        <button class="ptable-tog-btn" data-w="all">Ves čas</button>
      </div>
      <div class="ptable-list" id="ptableList">
        <div class="comp-board-empty">Nalagam …</div>
      </div>
      <div class="ptable-tip" id="ptableTip"></div>
      <button class="overlay-btn overlay-btn-ghost" id="statsLogout">Odjava</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) removeOverlay(); });
  div.querySelector('#statsClose').addEventListener('click', removeOverlay);
  div.querySelector('#statsLogout').addEventListener('click', () => {
    logoutStudent();
    removeOverlay();
  });

  await flushStats();           // make sure latest answers are counted
  const rows = await fetchStudentStats();
  const today = getTodayKey();
  const weekStart = getWeekStartKey();
  const scopes = [
    { label: 'Danes',    data: aggregateStats(rows, today) },
    { label: 'Ta teden', data: aggregateStats(rows, weekStart) },
    { label: 'Ves čas',  data: aggregateStats(rows, null) },
  ];
  const modeList = [
    { key: 'keypad',     label: '⌨️ Tipkovnica' },
    { key: 'quiz',       label: '🎯 Kviz' },
    { key: 'tekmovanje', label: '🏆 Tekmovanje' },
  ];
  const body = div.querySelector('#statsBody');
  body.innerHTML = modeList.map(m => `
    <div class="stats-mode-card">
      <div class="stats-mode-title">${m.label}</div>
      <div class="stats-grid">
        ${scopes.map(sc => `
          <div class="stats-col">
            <div class="stats-col-label">${sc.label}</div>
            ${statCell(sc.data[m.key])}
          </div>`).join('')}
      </div>
    </div>`).join('');

  /* ── Poštevanke section ── */
  const tableRows = await fetchStudentTableStats();
  const recentSince = getRecentSinceKey();

  function aggTables(window) {
    // window: 'recent' | 'all' → { "t_op": {c,w} }
    const agg = {};
    for (const r of tableRows) {
      if (window === 'recent' && r.day < recentSince) continue;
      const k = r.table_n + '_' + r.op;
      if (!agg[k]) agg[k] = { c: 0, w: 0 };
      agg[k].c += r.correct || 0;
      agg[k].w += r.wrong || 0;
    }
    return agg;
  }
  function chip(cell) {
    const c = cell ? cell.c : 0, w = cell ? cell.w : 0;
    const pct = masteryPct(c, w);
    const cls = masteryClass(c, w);
    const txt = pct === null ? '—' : pct + '%';
    return `<span class="ptable-chip ${cls}">${txt}</span>`;
  }
  function renderPtable(window) {
    const agg = aggTables(window);
    const list = div.querySelector('#ptableList');
    let worst = null, worstPct = 101;
    list.innerHTML = '';
    for (let t = 1; t <= 10; t++) {
      const x = agg[t + '_x'], d = agg[t + '_d'];
      [x, d].forEach(cell => {
        if (cell) {
          const tot = cell.c + cell.w;
          if (tot >= 5) {
            const p = cell.c / tot * 100;
            if (p < worstPct) { worstPct = p; worst = t; }
          }
        }
      });
      list.insertAdjacentHTML('beforeend', `
        <div class="ptable-row">
          <span class="ptable-num">${t}</span>
          <span class="ptable-ops">
            <span class="ptable-op">× ${chip(x)}</span>
            <span class="ptable-op">÷ ${chip(d)}</span>
          </span>
        </div>`);
    }
    const tip = div.querySelector('#ptableTip');
    if (worst !== null && worstPct < 85) {
      tip.textContent = `💡 Največ napak: poštevanka ${worst}. Tam še vadi!`;
    } else if (worst !== null) {
      tip.textContent = '🎉 Odlično — vse poštevanke dobro obvladaš!';
    } else {
      tip.textContent = 'Igraj nekaj računov, da se pokaže napredek.';
    }
  }
  renderPtable('recent');
  div.querySelectorAll('#ptableToggle .ptable-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
      div.querySelectorAll('#ptableToggle .ptable-tog-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderPtable(b.dataset.w);
    });
  });
}

/* ══════════════════════════
   TEACHER DASHBOARD
══════════════════════════ */
async function openTeacherDashboard() {
  if (!teacherSession) { openAuthOverlay('teacher'); return; }
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box teacher-box">
      <button class="medal-modal-close" id="tdClose" title="Zapri">✕</button>
      <div class="overlay-title" style="color:#f0a500">👨‍🏫 Učiteljski pregled</div>
      <div class="td-controls">
        <div class="ptable-toggle" id="tdOpToggle">
          <button class="ptable-tog-btn active" data-op="x">Množenje ×</button>
          <button class="ptable-tog-btn" data-op="d">Deljenje ÷</button>
        </div>
        <div class="ptable-toggle" id="tdWinToggle">
          <button class="ptable-tog-btn active" data-w="recent">Zadnja 2 tedna</button>
          <button class="ptable-tog-btn" data-w="all">Ves čas</button>
        </div>
      </div>
      <div class="td-legend">
        <span><span class="ptable-chip m-good"></span> obvlada</span>
        <span><span class="ptable-chip m-mid"></span> še vadi</span>
        <span><span class="ptable-chip m-bad"></span> potrebuje vajo</span>
        <span><span class="ptable-chip m-none"></span> ni podatkov</span>
      </div>
      <div class="td-grid-wrap" id="tdGridWrap">
        <div class="comp-board-empty">Nalagam …</div>
      </div>
      <div class="td-hint">💡 Klikni na ime učenca za ponastavitev gesla.</div>
      <button class="overlay-btn overlay-btn-ghost" id="tdLogout">Odjava</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) removeOverlay(); });
  div.querySelector('#tdClose').addEventListener('click', removeOverlay);
  div.querySelector('#tdLogout').addEventListener('click', () => {
    logoutTeacher();
    removeOverlay();
  });

  const rows = await supabaseRPC('get_class_overview', {
    p_teacher_id: teacherSession.id,
    p_recent_since: getRecentSinceKey()
  });
  const wrap = div.querySelector('#tdGridWrap');
  if (!rows || !rows.length) {
    wrap.innerHTML = '<div class="comp-board-empty">Še ni podatkov o učencih.</div>';
    return;
  }
  // group by student
  const students = {};
  for (const r of rows) {
    if (!students[r.username]) {
      students[r.username] = { username: r.username, emoji: r.emoji,
                               display_name: r.display_name, cells: {} };
    }
    if (r.table_n != null) {
      students[r.username].cells[r.table_n + '_' + r.op] = {
        all: { c: +r.correct_all, w: +r.wrong_all },
        recent: { c: +r.correct_recent, w: +r.wrong_recent }
      };
    }
  }
  const list = Object.values(students).sort((a, b) =>
    a.username.localeCompare(b.username));

  let curOp = 'x', curWin = 'recent';
  function renderGrid() {
    let head = '<div class="td-row td-head"><span class="td-name"></span>';
    for (let t = 1; t <= 10; t++) head += `<span class="td-cell td-th">${t}</span>`;
    head += '</div>';
    const body = list.map(s => {
      let row = `<div class="td-row"><span class="td-name" data-username="${s.username}"`
        + ` title="Klikni za ponastavitev gesla">${s.emoji || '🦉'} ${s.username}</span>`;
      for (let t = 1; t <= 10; t++) {
        const cell = s.cells[t + '_' + curOp];
        const v = cell ? cell[curWin] : null;
        const c = v ? v.c : 0, w = v ? v.w : 0;
        const cls = masteryClass(c, w);
        const pct = masteryPct(c, w);
        row += `<span class="td-cell ${cls}" title="Poštevanka ${t}: ${c}✓ / ${w}✗">`
          + `${pct === null ? '' : pct}</span>`;
      }
      return row + '</div>';
    }).join('');
    wrap.innerHTML = head + body;
  }
  renderGrid();
  wrap.addEventListener('click', e => {
    const nameEl = e.target.closest('.td-name[data-username]');
    if (!nameEl) return;
    const s = list.find(x => x.username === nameEl.dataset.username);
    if (s) openResetPin(s);
  });
  div.querySelectorAll('#tdOpToggle .ptable-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
      div.querySelectorAll('#tdOpToggle .ptable-tog-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); curOp = b.dataset.op; renderGrid();
    });
  });
  div.querySelectorAll('#tdWinToggle .ptable-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
      div.querySelectorAll('#tdWinToggle .ptable-tog-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); curWin = b.dataset.w; renderGrid();
    });
  });
}

/* ── Teacher: reset a student's password ── */
function openResetPin(student) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box auth-box">
      <div class="overlay-title" style="color:#f0a500">🔑 Ponastavi geslo</div>
      <div class="overlay-divider"></div>
      <div class="reset-student">${student.emoji || '🦉'} <strong>${student.username}</strong></div>
      <label class="auth-label">Izberi novo geslo — 4 živali</label>
      <div id="resetPickerSlot"></div>
      <button class="overlay-btn overlay-btn-next" id="resetBtn">Ponastavi geslo ✓</button>
      <div class="auth-msg" id="resetMsg"></div>
      <button class="auth-switch auth-close" id="resetCancel">← Nazaj na pregled</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) openTeacherDashboard(); });
  const picker = buildAnimalPicker();
  div.querySelector('#resetPickerSlot').appendChild(picker);
  div.querySelector('#resetCancel').addEventListener('click', () => openTeacherDashboard());
  div.querySelector('#resetBtn').addEventListener('click', async () => {
    const seq = picker.getSeq();
    const msg = div.querySelector('#resetMsg');
    if (!seq) { msg.textContent = 'Izberi vse 4 živali.'; return; }
    const btn = div.querySelector('#resetBtn');
    btn.disabled = true; btn.textContent = 'Ponastavljam …';
    const res = await supabaseRPC('reset_student_pin', {
      p_teacher_id: teacherSession.id, p_username: student.username, p_pin: seq
    });
    if (res && res.length) {
      const animals = seq.split(',').map(i => ANIMALS[+i]).join(' ');
      div.querySelector('.timed-overlay-box').innerHTML = `
        <div class="overlay-title" style="color:#4caf50">✅ Geslo ponastavljeno</div>
        <div class="overlay-divider"></div>
        <div class="reset-student">${student.emoji || '🦉'} <strong>${student.username}</strong></div>
        <label class="auth-label">Novo geslo — povej učencu:</label>
        <div class="reset-animals">${animals}</div>
        <button class="overlay-btn overlay-btn-next" id="resetDone">Nazaj na pregled</button>`;
      div.querySelector('#resetDone').addEventListener('click', () => openTeacherDashboard());
    } else {
      btn.disabled = false; btn.textContent = 'Ponastavi geslo ✓';
      msg.textContent = '❌ Napaka pri ponastavitvi. Poskusi znova.';
    }
  });
}

/* ── Panel: intro / locked ── */
function showTekmovanjePanel() {
  const area = document.getElementById('tekmovanjeArea');
  if (!area) return;
  if (cTimer) { clearInterval(cTimer); cTimer = null; }
  if (cAdvanceTimer) { clearTimeout(cAdvanceTimer); cAdvanceTimer = null; }
  cActive = false;
  if (isCompetitionOpen()) {
    area.innerHTML = `
      <div class="comp-intro">
        <div class="comp-trophy">🏆</div>
        <h2>Dnevno tekmovanje</h2>
        <p class="comp-rules">60 sekund · vse poštevanke · × in ÷</p>
        <p class="comp-sub">Reši čim več računov in pridi na dnevno lestvico!</p>
        <button class="comp-btn comp-btn-start" id="compStartBtn">▶ Začni tekmovanje</button>
        <button class="comp-btn comp-btn-ghost" id="compBoardBtn">🏆 Dnevna lestvica</button>
      </div>`;
    area.querySelector('#compStartBtn').addEventListener('click', startCompetition);
    area.querySelector('#compBoardBtn').addEventListener('click', () => openLeaderboard());
  } else {
    area.innerHTML = `
      <div class="comp-locked">
        <div class="comp-lock-icon">🔒</div>
        <h2>Tekmovanje je zaprto</h2>
        <p>Odprto je vsak dan med <strong>7:00</strong> in <strong>19:00</strong>.</p>
        <p class="comp-now">Trenutno je <strong>${getSloveniaClock()}</strong> po slovenskem času.</p>
        <button class="comp-btn comp-btn-ghost" id="compBoardBtn">🏆 Poglej dnevno lestvico</button>
      </div>`;
    area.querySelector('#compBoardBtn').addEventListener('click', () => openLeaderboard());
  }
}

/* ── Countdown 3-2-1 ── */
function runCountdown(done) {
  const seq = ['3', '2', '1', 'ZAČNI!'];
  let i = 0;
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'comp-countdown-overlay';
  div.innerHTML = `<div class="comp-countdown-num pop">${seq[0]}</div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  const numEl = div.querySelector('.comp-countdown-num');
  SFX.click();
  const step = () => {
    i++;
    if (i < seq.length) {
      numEl.textContent = seq[i];
      numEl.classList.remove('pop'); void numEl.offsetWidth; numEl.classList.add('pop');
      if (i === seq.length - 1) { numEl.classList.add('go'); SFX.levelUp(); }
      else SFX.click();
      setTimeout(step, 700);
    } else {
      removeOverlay();
      done();
    }
  };
  setTimeout(step, 700);
}

/* ── Start a competition round ── */
function startCompetition() {
  if (!isCompetitionOpen()) { showTekmovanjePanel(); return; }
  if (!allCards.length)     { showTekmovanjePanel(); return; }
  collapseToolbar();   // get the settings panel out of the way — every second counts
  cQueue = shuffle(allCards.slice());   // full deck — ignores filters
  cIdx = 0; cScore = 0; cStreak = 0; cTimeLeft = COMP_DURATION;
  cCorrect = 0; cWrong = 0;
  cInput = ''; cAnswered = false; cActive = false;
  if (cTimer) { clearInterval(cTimer); cTimer = null; }
  if (cAdvanceTimer) { clearTimeout(cAdvanceTimer); cAdvanceTimer = null; }
  runCountdown(() => {
    cActive = true;
    cTimer = setInterval(compTick, 1000);
    renderCompQ();
  });
}

function compScoreTier() {
  return cScore >= 60 ? 'tier4' : cScore >= 40 ? 'tier3' : cScore >= 20 ? 'tier2' : 'tier1';
}

function renderCompQ() {
  const area = document.getElementById('tekmovanjeArea');
  const cur = cQueue[cIdx % cQueue.length];
  const mult = getMultiplier(cStreak);
  area.innerHTML = `
    <div class="comp-hud">
      <div class="comp-hud-score ${compScoreTier()}" id="compScoreBox">
        <div class="comp-score-num" id="compScoreNum">${cScore}</div>
        <div class="comp-cell-lbl">točk</div>
      </div>
      <div class="comp-hud-time ${cTimeLeft<=10?'danger':''}" id="compTimeBox">
        <div class="comp-time-num" id="compTimeNum">${cTimeLeft}</div>
        <div class="comp-cell-lbl">sekund</div>
      </div>
    </div>
    <div class="comp-streak-slot">
      ${mult>1 ? `<span class="streak-badge">🔥 Množilnik ×${mult}!</span>`
               : (cStreak>=2 ? `<span class="streak-badge">🔥 ${cStreak}×</span>` : '')}
    </div>
    <div class="quiz-question comp-question">${cur.question}</div>
    <div class="keypad-display" id="compDisplay">
      <span class="keypad-display-text" id="compDisplayText">${cInput || '_'}</span>
    </div>
    <div class="keypad-grid" id="compGrid">
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
    </div>`;
  area.querySelectorAll('.keypad-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCompInput(btn.dataset.d));
  });
}

function handleCompInput(d) {
  if (!cActive || cAnswered) return;
  if (d === 'back') {
    cInput = cInput.slice(0, -1);
    SFX.click();
  } else if (d === 'ok') {
    checkCompAnswer();
    return;
  } else {
    if (cInput.length >= 3) return;
    cInput += d;
    SFX.click();
  }
  const t = document.getElementById('compDisplayText');
  if (t) t.textContent = cInput || '_';
}

function checkCompAnswer() {
  if (!cActive || cAnswered) return;
  if (!cInput.length) return;
  cAnswered = true;
  const cur = cQueue[cIdx % cQueue.length];
  const correctAns = cur.answer;
  const isCorrect = cInput === correctAns;
  const display = document.getElementById('compDisplay');

  if (isCorrect) {
    SFX.correct();
    if (display) display.classList.add('correct');
    cStreak++;
    cScore += getMultiplier(cStreak);
    cCorrect++;
    bumpCompScore();
  } else {
    SFX.wrong();
    if (display) {
      display.classList.add('wrong');
      display.innerHTML = `
        <span class="keypad-display-text keypad-strike">${cInput}</span>
        <span class="keypad-display-arrow">→</span>
        <span class="keypad-display-correct">${correctAns}</span>`;
    }
    cStreak = 0;   // no point penalty — just reset streak
    cWrong++;
  }
  recordTableStat(cur.question, isCorrect);
  document.querySelectorAll('#compGrid .keypad-btn').forEach(b => b.disabled = true);

  cAdvanceTimer = setTimeout(() => {
    cAdvanceTimer = null;
    if (!cActive) return;            // time ran out during the pause
    cIdx++; cInput = ''; cAnswered = false;
    renderCompQ();
  }, isCorrect ? 300 : 650);
}

function bumpCompScore() {
  const num = document.getElementById('compScoreNum');
  const box = document.getElementById('compScoreBox');
  if (num) {
    num.textContent = cScore;
    num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
  }
  if (box) {
    box.classList.remove('tier1','tier2','tier3','tier4');
    box.classList.add(compScoreTier());
  }
}

function compTick() {
  cTimeLeft--;
  const el = document.getElementById('compTimeNum');
  if (el) el.textContent = Math.max(0, cTimeLeft);
  const box = document.getElementById('compTimeBox');
  if (box) box.classList.toggle('danger', cTimeLeft <= 10);
  if (cTimeLeft <= 5 && cTimeLeft > 0) SFX.click();
  if (cTimeLeft <= 0) {
    clearInterval(cTimer); cTimer = null;
    cActive = false;
    if (cAdvanceTimer) { clearTimeout(cAdvanceTimer); cAdvanceTimer = null; }
    setTimeout(endCompetition, 250);
  }
}

/* ── End of round → name entry ── */
function endCompetition() {
  removeOverlay();
  SFX.victory();
  // log this round into the student's profile stats (if logged in)
  recordStat('tekmovanje', cCorrect, cWrong, cScore, COMP_DURATION);
  flushStats();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box comp-end-box">
      <div class="overlay-title" style="color:#c79bff">⏱️ Konec!</div>
      <div class="overlay-divider"></div>
      <div class="overlay-score-big" style="color:#c79bff">${cScore}</div>
      <div class="overlay-score-label">točk</div>
      <div class="comp-name-prompt">Vpiši svoje začetnice (3 črke):</div>
      <input id="compNameInput" class="comp-name-input" maxlength="3"
             autocomplete="off" autocapitalize="characters" placeholder="ABC" />
      <button class="overlay-btn overlay-btn-next" id="compSaveBtn">Shrani rezultat ✓</button>
      <button class="overlay-btn overlay-btn-ghost" id="compSkipBtn">Preskoči</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;

  const input = div.querySelector('#compNameInput');
  setTimeout(() => input.focus(), 50);
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-ZČŠŽ]/g, '').slice(0, 3);
  });
  let saving = false;
  const save = async () => {
    if (saving) return;
    saving = true;
    const name = (input.value.trim() || '???').slice(0, 3);
    div.querySelector('#compSaveBtn').disabled = true;
    div.querySelector('#compSaveBtn').textContent = 'Shranjujem …';
    await submitScore(name, cScore);
    removeOverlay();
    openLeaderboard(name, cScore);
  };
  div.querySelector('#compSaveBtn').addEventListener('click', save);
  div.querySelector('#compSkipBtn').addEventListener('click', () => {
    removeOverlay();
    showTekmovanjePanel();
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
}

/* ── Daily leaderboard overlay ── */
async function openLeaderboard(highlightName, highlightScore) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box comp-board-box">
      <div class="overlay-title" style="color:#c79bff">🏆 Dnevna lestvica</div>
      <div class="comp-board-date">${getTodayKey()}${leaderboardEnabled() ? '' : ' · lokalno'}</div>
      <div class="comp-board-list" id="compBoardList"><div class="comp-board-empty">Nalagam …</div></div>
      ${isCompetitionOpen()
        ? '<button class="overlay-btn overlay-btn-next" id="compReplayBtn">▶ Igraj znova</button>'
        : ''}
      <button class="overlay-btn overlay-btn-ghost" id="compCloseBtn">Zapri</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;

  const replayBtn = div.querySelector('#compReplayBtn');
  if (replayBtn) replayBtn.addEventListener('click', () => { removeOverlay(); startCompetition(); });
  div.querySelector('#compCloseBtn').addEventListener('click', () => {
    removeOverlay();
    showTekmovanjePanel();
  });

  const rows = await fetchLeaderboard();
  const list = div.querySelector('#compBoardList');
  if (!list) return;
  if (!rows.length) {
    list.innerHTML = '<div class="comp-board-empty">Še ni rezultatov. Bodi prvi! 🚀</div>';
    return;
  }
  let highlighted = false;
  list.innerHTML = rows.map((r, i) => {
    const isMe = !highlighted && highlightName != null
      && r.name === highlightName && r.score === highlightScore;
    if (isMe) highlighted = true;
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    return `<div class="comp-board-row${isMe ? ' me' : ''}">
      <span class="cb-rank">${rank}</span>
      <span class="cb-name">${r.name}</span>
      <span class="cb-score">${r.score}</span>
    </div>`;
  }).join('');
}

/* physical keyboard for competition mode */
document.addEventListener('keydown', e => {
  if (mode !== 'tekmovanje' || !cActive || cAnswered) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault(); handleCompInput(e.key);
  } else if (e.key === 'Backspace') {
    e.preventDefault(); handleCompInput('back');
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); handleCompInput('ok');
  }
});

/* ── Profile button + stats flush on leave ── */
document.getElementById('profileBtn').addEventListener('click', handleProfileButton);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushStats(true);
});
window.addEventListener('pagehide', () => flushStats(true));

/* ══════════════════════════
   INIT
══════════════════════════ */
loadSettings();
loadProfile();
applyUIFromState();
updateControlLock();
updateSummary();
updateProfileButton();
showPanel(mode);
loadData(() => {
  cards = shuffle(getFilteredCards());
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else                        showTekmovanjePanel();
});
collapseToolbar();
