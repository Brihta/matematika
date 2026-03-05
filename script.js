/* ═══════════════════════════════════════════
   BRIHTA — script.js
   ═══════════════════════════════════════════ */

/* ── MEDALS ── */
const MEDALS = [
  { min: 100, e: '🏆', t: 'Šampion' },
  { min: 90,  e: '🥇', t: 'Zlato'   },
  { min: 75,  e: '🥈', t: 'Srebro'  },
  { min: 60,  e: '🥉', t: 'Bron'    },
  { min: 40,  e: '⭐', t: 'Zvezda'  },
  { min: 0,   e: '🌱', t: 'Začetnik'},
];

function getMedal(pct) {
  return MEDALS.find(m => pct >= m.min) || MEDALS[MEDALS.length - 1];
}

function updateScoreHUD(ok, no) {
  document.getElementById('scoreCorrect').textContent = ok;
  document.getElementById('scoreWrong').textContent   = no;
  const total = ok + no;
  const pct   = total ? Math.round(ok / total * 100) : null;
  document.getElementById('scorePct').textContent = pct !== null ? pct + '%' : '—';
  if (pct !== null) {
    const m = getMedal(pct);
    document.getElementById('medalEmoji').textContent = m.e;
    document.getElementById('medalTitle').textContent = m.t;
  } else {
    document.getElementById('medalEmoji').textContent = '🏅';
    document.getElementById('medalTitle').textContent = '—';
  }
}

/* ── STATE ── */
let allCards   = [];   // loaded from JSON
let mode       = 'flashcard';
let opType     = 'both';
let tables     = new Set([1,2,3,4,5,6,7,8,9,10]);
let cards      = [];
let cardIdx    = 0;

let qQueue = [], qIdx = 0, qOk = 0, qNo = 0, qTimer = null;
let tQueue = [], tIdx = 0, tOk = 0, tNo = 0, tInterval = null, tSec = 60;

/* ── UTILS ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseQuestion(q) {
  if (q.includes('×')) {
    const p = q.replace(/\s*=\s*$/, '').split('×').map(s => parseInt(s.trim()));
    return { op: 'multiply', a: p[0], b: p[1] };
  }
  if (q.includes(':')) {
    const p = q.replace(/\s*=\s*$/, '').split(':').map(s => parseInt(s.trim()));
    return { op: 'divide', a: p[0], b: p[1] };
  }
  return null;
}

function getFilteredCards() {
  return allCards.filter(card => {
    const p = parseQuestion(card.question);
    if (!p) return false;
    if (opType === 'multiply' && p.op !== 'multiply') return false;
    if (opType === 'divide'   && p.op !== 'divide')   return false;
    const tbl = p.op === 'multiply' ? p.a : p.b;
    return tables.has(tbl);
  });
}

/* ── LOAD JSON ── */
function loadData(callback) {
  fetch('postevanka.json')
    .then(r => r.json())
    .then(data => {
      allCards = data;
      if (callback) callback();
    })
    .catch(err => console.error('Napaka pri nalaganju JSON:', err));
}

/* ── BRAND IMAGE FALLBACK ── */
document.getElementById('brandImg').onerror = function () {
  this.style.display = 'none';
  const em = document.createElement('span');
  em.className   = 'brand-emoji';
  em.textContent = '🦉';
  this.parentNode.insertBefore(em, this);
};

/* ── TOOLBAR COLLAPSE ── */
const toolbar   = document.getElementById('toolbar');
const toggleBtn = document.getElementById('toolbarToggle');

function collapseToolbar() { toolbar.classList.add('collapsed');    toggleBtn.textContent = '⚙️'; }
function expandToolbar()   { toolbar.classList.remove('collapsed'); toggleBtn.textContent = '✕';  }

toggleBtn.addEventListener('click', e => {
  e.stopPropagation();
  toolbar.classList.contains('collapsed') ? expandToolbar() : collapseToolbar();
  document.getElementById('filterPanel').classList.remove('open');
});

document.addEventListener('click', e => {
  if (!toolbar.contains(e.target) && !toolbar.classList.contains('collapsed')) collapseToolbar();
});

/* ── FILTER DROPDOWN ── */
const filterPanel = document.getElementById('filterPanel');

document.getElementById('filterToggle').addEventListener('click', function (e) {
  e.stopPropagation();
  if (!filterPanel.classList.contains('open')) {
    const r = this.getBoundingClientRect();
    filterPanel.style.top  = (r.bottom + 6) + 'px';
    filterPanel.style.left = r.left + 'px';
  }
  filterPanel.classList.toggle('open');
});

document.addEventListener('click', () => filterPanel.classList.remove('open'));
filterPanel.addEventListener('click', e => e.stopPropagation());

function updateFilterLabel() {
  const sel = [];
  for (let i = 1; i <= 10; i++) {
    const el = document.getElementById('chk' + i);
    if (el && el.checked) sel.push(i);
  }
  document.getElementById('filterToggle').textContent =
    sel.length === 10 ? '⚙ Vse ▾' :
    sel.length === 0  ? '⚙ Nič ▾' :
    '⚙ ' + sel.join(', ') + ' ▾';
  updateSummary();
}

for (let i = 1; i <= 10; i++) {
  const el = document.getElementById('chk' + i);
  if (el) el.addEventListener('change', () => {
    el.checked ? tables.add(i) : tables.delete(i);
    updateFilterLabel();
  });
}

/* ── OPERATION BUTTONS ── */
document.querySelectorAll('.op-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    opType = this.dataset.op;
    updateSummary();
  });
});

/* ── MODE SELECT ── */
document.getElementById('modeSelect').addEventListener('change', function () {
  mode = this.value;
  showPanel(mode);
  updateSummary();
  setTimeout(collapseToolbar, 200);
});

function showPanel(m) {
  document.getElementById('flashcardPanel').style.display = m === 'flashcard' ? '' : 'none';
  document.getElementById('quizPanel').style.display      = m === 'quiz'      ? '' : 'none';
  document.getElementById('timedPanel').style.display     = m === 'timed'     ? '' : 'none';
  document.getElementById('scoreHUD').style.display = (m === 'quiz' || m === 'timed') ? 'flex' : 'none';
}

/* ── SUMMARY ── */
function updateSummary() {
  const modeMap = { flashcard: '🃏 Kartice', quiz: '🎯 Kviz', timed: '⏱️ Tekma' };
  const opMap   = { both: '× ÷', multiply: '×', divide: '÷' };
  document.getElementById('summaryMode').textContent = modeMap[mode] || mode;
  document.getElementById('summaryOp').textContent   = opMap[opType];
  const sel = [...tables].sort((a, b) => a - b);
  document.getElementById('summaryFilter').textContent =
    sel.length === 10 ? 'Vse' : sel.length === 0 ? 'Nič' : sel.join(', ');
}

/* ── START BUTTON ── */
document.getElementById('reloadBtn').addEventListener('click', () => {
  clearInterval(tInterval);
  clearTimeout(qTimer);
  cards = shuffle(getFilteredCards());
  if (mode === 'flashcard') startFlashcard();
  else if (mode === 'quiz')  startQuiz();
  else                       startTimed();
  updateSummary();
  setTimeout(collapseToolbar, 300);
});

/* ══════════════════════════
   FLASHCARD MODE
══════════════════════════ */
function startFlashcard() {
  cardIdx = 0;
  document.getElementById('flashcard').classList.remove('flipped');
  updateFlashcard();
}

function updateFlashcard() {
  document.getElementById('flashcard').classList.remove('flipped');

  if (!cards.length) {
    document.getElementById('cardFrontText').textContent = 'Ni kartic za prikaz';
    document.getElementById('cardBackText').textContent  = '—';
    document.getElementById('cardCounter').textContent   = 'Ni kartic';
    document.getElementById('progressBar').style.width  = '0%';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    return;
  }

  const c = cards[cardIdx];
  document.getElementById('cardFrontText').textContent = c.question;
  document.getElementById('cardBackText').textContent  = c.answer;
  document.getElementById('cardCounter').textContent   = 'Kartica ' + (cardIdx + 1) + ' od ' + cards.length;
  document.getElementById('progressBar').style.width   = ((cardIdx + 1) / cards.length * 100) + '%';
  document.getElementById('prevBtn').disabled = cardIdx === 0;
  document.getElementById('nextBtn').disabled = cardIdx === cards.length - 1;
}

document.getElementById('flashcard').addEventListener('click', function () {
  if (cards.length) this.classList.toggle('flipped');
});

document.getElementById('prevBtn').addEventListener('click', () => {
  if (cardIdx > 0) { cardIdx--; updateFlashcard(); }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (cardIdx < cards.length - 1) { cardIdx++; updateFlashcard(); }
});

document.addEventListener('keydown', e => {
  if (mode !== 'flashcard') return;
  if      (e.key === 'ArrowRight') document.getElementById('nextBtn').click();
  else if (e.key === 'ArrowLeft')  document.getElementById('prevBtn').click();
  else if (e.key === ' ')          { e.preventDefault(); document.getElementById('flashcard').click(); }
});

let touchStartX = 0;
document.getElementById('cardContainer').addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById('cardContainer').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    dx < 0 ? document.getElementById('nextBtn').click()
           : document.getElementById('prevBtn').click();
  }
});

/* ══════════════════════════
   QUIZ MODE — AUTO-ADVANCE
══════════════════════════ */
function startQuiz() {
  qQueue = shuffle(cards);
  qIdx = 0; qOk = 0; qNo = 0;
  updateScoreHUD(0, 0);
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const area = document.getElementById('quizArea');

  if (!qQueue.length) {
    area.innerHTML = '<div class="quiz-empty">Ni kartic. Nastavi filtre in klikni ↻ Začni.</div>';
    return;
  }

  if (qIdx >= qQueue.length) {
    const pct = Math.round(qOk / qQueue.length * 100);
    const m   = getMedal(pct);
    area.innerHTML = `
      <div class="end-card">
        <div class="end-medal">${m.e}</div>
        <h2 style="color:#f0a500">${m.t}!</h2>
        <p>Pravilno: <strong>${qOk}</strong> / ${qQueue.length}</p>
        <p>Točnost: <strong>${pct}%</strong></p>
        <button class="restart-btn" onclick="startQuiz()">Znova ↻</button>
      </div>`;
    return;
  }

  const cur        = qQueue[qIdx];
  const correctVal = parseInt(cur.answer);
  const pool       = [...new Set(allCards.map(c => parseInt(c.answer)))].filter(n => n !== correctVal);
  const opts       = shuffle([correctVal, ...shuffle(pool).slice(0, 3)]);

  area.innerHTML = `
    <div class="quiz-question">${cur.question}</div>
    <div class="quiz-options" id="quizOpts">
      ${opts.map(o => `<button class="quiz-opt-btn" data-val="${o}">${o}</button>`).join('')}
    </div>
    <div class="quiz-advance-bar-wrap" id="advWrap">
      <div class="quiz-advance-bar" id="advBar"></div>
    </div>`;

  area.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      // disable all
      area.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);

      const val = parseInt(this.dataset.val);
      if (val === correctVal) {
        this.classList.add('correct');
        qOk++;
      } else {
        this.classList.add('wrong');
        qNo++;
        area.querySelectorAll('.quiz-opt-btn').forEach(b => {
          if (parseInt(b.dataset.val) === correctVal) b.classList.add('correct');
        });
      }

      updateScoreHUD(qOk, qNo);

      // start shrinking bar → auto-advance after 1s
      const wrap = document.getElementById('advWrap');
      const bar  = document.getElementById('advBar');
      wrap.style.display = 'block';
      requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('running')));
      qTimer = setTimeout(() => { qIdx++; renderQuizQuestion(); }, 1000);
    });
  });
}

/* ══════════════════════════
   TIMED MODE
══════════════════════════ */
function startTimed() {
  clearInterval(tInterval);
  tQueue = shuffle(cards);
  tIdx = 0; tOk = 0; tNo = 0; tSec = 60;
  updateScoreHUD(0, 0);
  renderTimedGame();
}

function renderTimedGame() {
  const area = document.getElementById('timedArea');

  if (!tQueue.length) {
    area.innerHTML = '<div class="quiz-empty">Ni kartic. Nastavi filtre in klikni ↻ Začni.</div>';
    return;
  }

  area.innerHTML = `
    <div class="timed-timer" id="timedTimerEl">60s</div>
    <div class="timed-question" id="timedQEl">—</div>
    <input class="timed-input" id="timedInputEl" type="number"
           inputmode="numeric" placeholder="?" autocomplete="off">`;

  showNextTimedQ();
  document.getElementById('timedInputEl').focus();
  document.getElementById('timedInputEl').addEventListener('input', checkTimedAnswer);

  tInterval = setInterval(() => {
    tSec--;
    const el = document.getElementById('timedTimerEl');
    if (el) { el.textContent = tSec + 's'; if (tSec <= 10) el.classList.add('urgent'); }
    if (tSec <= 0) { clearInterval(tInterval); endTimed(); }
  }, 1000);
}

function showNextTimedQ() {
  if (tIdx >= tQueue.length) { tIdx = 0; tQueue = shuffle(tQueue); }
  const q   = tQueue[tIdx];
  const el  = document.getElementById('timedQEl');
  const inp = document.getElementById('timedInputEl');
  if (el)  el.textContent = q ? q.question : '—';
  if (inp) { inp.value = ''; inp.className = 'timed-input'; setTimeout(() => inp.focus(), 50); }
}

function checkTimedAnswer() {
  const inp = document.getElementById('timedInputEl');
  if (!inp) return;
  const val       = inp.value.trim();
  const correctAns = tQueue[tIdx % tQueue.length]?.answer || '';
  if (!val) return;

  if (val === correctAns) {
    inp.classList.add('correct');
    tOk++; tIdx++;
    updateScoreHUD(tOk, tNo);
    setTimeout(showNextTimedQ, 160);
  } else if (val.length >= correctAns.length) {
    inp.classList.add('wrong');
    tNo++;
    updateScoreHUD(tOk, tNo);
    setTimeout(() => {
      const i = document.getElementById('timedInputEl');
      if (i) { i.value = ''; i.className = 'timed-input'; i.focus(); }
    }, 350);
  }
}

function endTimed() {
  const area  = document.getElementById('timedArea');
  const total = tOk + tNo;
  const pct   = total ? Math.round(tOk / total * 100) : 0;
  const m     = getMedal(pct);
  area.innerHTML = `
    <div class="end-card">
      <div class="end-medal">${m.e}</div>
      <h2 style="color:#f0a500">${m.t}!</h2>
      <p>Pravilno: <strong>${tOk}</strong></p>
      <p>Napačno: <strong>${tNo}</strong></p>
      ${total ? `<p>Točnost: <strong>${pct}%</strong></p>` : ''}
      <button class="restart-btn" onclick="startTimed()">Znova ↻</button>
    </div>`;
}

/* ── INIT — auto-load ob odprtju strani ── */
updateSummary();
loadData(() => {
  cards = shuffle(getFilteredCards());
  startFlashcard();
});
collapseToolbar();
