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
```

---

**`postevanka.json`** — ostane nespremenjen ✓

Struktura mape:
```
📁 brihta/
  ├── index.html
  ├── style.css
  ├── script.js
  ├── postevanka.json
  └── Brihta.png            <stop offset="100%" stop-color="#e65100"/>
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
    default: return "";
  }
}

function buildDatasetSelect() {
  const sel = document.getElementById("dataset");
  sel.innerHTML = "";
  DATASETS.forEach(ds => {
    const opt = document.createElement("option");
    opt.value = ds.id; opt.textContent = ds.name;
    sel.appendChild(opt);
  });
  const saved = localStorage.getItem(SELECT_KEY);
  if (saved && DATASETS.find(d => d.id === saved)) sel.value = saved;
}

function currentDataset() {
  const id = document.getElementById("dataset").value;
  return DATASETS.find(d => d.id === id) || DATASETS[0] || null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Wikipedia image fetch ──────────────────────────────────────────────────
const imageCache = {};

async function fetchWikiImage(searchTerm) {
  if (imageCache[searchTerm] !== undefined) return imageCache[searchTerm];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search`
              + `&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=3`
              + `&prop=pageimages&piprop=thumbnail&pithumbsize=400`
              + `&format=json&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) { imageCache[searchTerm] = null; return null; }
    // Pick first page that actually has a thumbnail
    const img = Object.values(pages)
      .sort((a, b) => a.index - b.index)
      .map(p => p?.thumbnail?.source)
      .find(src => !!src) || null;
    imageCache[searchTerm] = img;
    return img;
  } catch {
    imageCache[searchTerm] = null;
    return null;
  }
}

async function maybeShowCardImage(card) {
  const imgEl = document.getElementById('cardImage');
  const faceEl = document.getElementById('cardFront');
  if (!imgEl) return;
  
  // Hide image if not in druzba or no image term exists
  if (currentSubject !== 'druzba' || !card.image) {
    imgEl.style.display = 'none';
    autoFitCardText(faceEl); // Make sure text fits without image
    return;
  }
  
  imgEl.style.display = 'none'; // hide while loading
  const src = await fetchWikiImage(card.image);
  
  if (src) {
    // Wait for the image to actually load its dimensions, THEN resize the text
    imgEl.onload = () => {
      autoFitCardText(faceEl);
    };
    imgEl.src = src;
    imgEl.style.display = 'block';
  } else {
    autoFitCardText(faceEl);
  }
}

function autoFitCardText(faceEl) {
  if (!faceEl) return;
  const span = faceEl.querySelector('.card-text');
  if (!span) return;
  if (faceEl.clientHeight === 0) return;

  const imgEl   = faceEl.querySelector('.card-image');
  const hasImage = imgEl && imgEl.style.display !== 'none' && imgEl.src;
  const padTop   = parseInt(getComputedStyle(faceEl).paddingTop)  || 26;
  const padBot   = parseInt(getComputedStyle(faceEl).paddingBottom) || 26;
  const flipHint = 30; // space reserved for "klikni za obrat"
  const available = faceEl.clientHeight - padTop - padBot - flipHint;

  if (hasImage) {
    // Give image up to 45% of available space, text gets the rest
    const imgMax  = Math.floor(available * 0.45);
    const textMax = available - imgMax - 10; // 10px gap between image and text

    // Scale image: grow or shrink to fill its allocation
    imgEl.style.maxHeight = imgMax + 'px';
    imgEl.style.maxWidth  = '75%';

    // Scale text to fill its allocation — try growing first, then shrink if needed
    let size = 2.2;
    span.style.fontSize = size + 'rem';
    // Shrink if overflowing text area
    while (span.scrollHeight > textMax && size > 0.78) {
      size -= 0.04;
      span.style.fontSize = size + 'rem';
    }
    // Grow if there's room to spare
    while (span.scrollHeight < textMax * 0.75 && size < 2.2) {
      size += 0.04;
      span.style.fontSize = size + 'rem';
      if (span.scrollHeight > textMax) { size -= 0.04; span.style.fontSize = size + 'rem'; break; }
    }
  } else {
    // No image — text fills everything, scale up or down freely
    let size = 2.5;
    span.style.fontSize = size + 'rem';
    // Shrink if overflowing
    while (span.scrollHeight > available && size > 0.78) {
      size -= 0.04;
      span.style.fontSize = size + 'rem';
    }
    // Grow if there's lots of room (short words should be big)
    while (span.scrollHeight < available * 0.65 && size < 2.8) {
      size += 0.04;
      span.style.fontSize = size + 'rem';
      if (span.scrollHeight > available) { size -= 0.04; span.style.fontSize = size + 'rem'; break; }
    }
  }
}

function setFaceText(faceEl, text) {
  if (!faceEl) return;
  const span = faceEl.querySelector('.card-text');
  if (span) span.textContent = text;
  else faceEl.textContent = text;
  autoFitCardText(faceEl);
}

async function fetchRawData(dataset) {
  let allData = [];
  const t = Date.now();
  if (dataset.combined) {
    for (const url of dataset.combined) {
      const resp = await fetch(url + '?t=' + t);
      if (!resp.ok) throw new Error("Napaka pri prenosu " + url);
      allData = allData.concat(await resp.json());
    }
  } else {
    const resp = await fetch(dataset.url + '?t=' + t);
    if (!resp.ok) throw new Error("Napaka pri prenosu");
    allData = await resp.json();
  }
  return allData;
}

// Returns which timestable numbers (1-10) a card belongs to
function getCardTables(item) {
  const q = item.question ?? '';
  const mult = q.match(/^(\d+)\s*×\s*(\d+)/);
  if (mult) return [parseInt(mult[1]), parseInt(mult[2])];
  const div = q.match(/^(\d+)\s*:\s*(\d+)/);
  if (div) return [parseInt(div[2])]; // filter division by the divisor
  return [];
}

function applyFilters() {
  const selected = [];
  for (let i = 1; i <= 10; i++) {
    const el = document.getElementById('chk' + i);
    if (el && el.checked) selected.push(i);
  }
  const allSelected = selected.length === 10 || selected.length === 0;

  const filtered = MASTER_DATA.filter(item => {
    if (allSelected) return true;
    const tables = getCardTables(item);
    return tables.some(t => selected.includes(t));
  });

  return filtered.map((item, index) => ({
    id: index,
    front: item.question ?? '',
    back:  item.answer   ?? '',
    english: item.answer ?? '',
    isSloToEng: true,
  }));
}

function setLoadingUI(loading) {
  const buttons = ["prevBtn","nextBtn","audioBtn"].map(id => document.getElementById(id)).filter(Boolean);
  buttons.forEach(b => b.disabled = loading);
  if (loading) {
    setFaceText(document.getElementById("cardFront"), "Nalagam kartice…");
    setFaceText(document.getElementById("cardBack"),  "Prosim počakaj 🙂");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Sound Engine (Web Audio API – no external files) ─────────────────────────
const SoundFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(opts) {
    try {
      const ac  = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq, ac.currentTime);
      if (opts.freqEnd !== undefined)
        osc.frequency.linearRampToValueAtTime(opts.freqEnd, ac.currentTime + opts.dur);
      gain.gain.setValueAtTime(opts.vol || 0.35, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + opts.dur);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + opts.dur);
    } catch(e) {}
  }

  function correct() {
    // Soft, modern, quick ascending bubble/ding
    playTone({ freq: 800, freqEnd: 1000, type: 'sine', dur: 0.1, vol: 0.3 });
    setTimeout(() => playTone({ freq: 1200, freqEnd: 1600, type: 'sine', dur: 0.2, vol: 0.2 }), 80);
  }

  function wrong() {
    // Low descending buzz: two-tone drop
    playTone({ freq: 320, freqEnd: 180, type: 'sawtooth', dur: 0.18, vol: 0.22 });
    setTimeout(() => playTone({ freq: 200, freqEnd: 140, type: 'square', dur: 0.22, vol: 0.15 }), 180);
  }

  function rankUp() {
    // Fanfare: quick ascending arpeggio
    const ac = getCtx();
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone({ freq, freqEnd: freq * 1.02, type: 'sine', dur: 0.28, vol: 0.3 }), i * 90);
    });
  }

  return { correct, wrong, rankUp };
})();

// ── Score HUD ─────────────────────────────────────────────────────────────────
function updateScoreHUD(score, streak) {
  const hud = document.getElementById('scoreHUD');
  if (!hud) return;
  const rank     = getRank(score);
  const nextRank = getNextRank(score);
  const mult     = getMultiplier(streak);
  let progress   = 100, progressLabel = "MAX RANG 🏆";
  if (nextRank) {
    const range = nextRank.minScore - rank.minScore;
    progress = Math.min(100, Math.round(((score - rank.minScore) / range) * 100));
    progressLabel = `${nextRank.minScore - score} točk do ${nextRank.name}`;
  }

  // Build ranks popup items
  const popupItems = RANKS.map(r => {
    const isCurrent = r.name === rank.name;
    return `<div class="rank-popup-item${isCurrent ? ' current-rank' : ''}">
      ${getMedalSVG(r.name, isCurrent ? 44 : 34)}
      <span>${r.name}<br><small>${r.minScore}+</small></span>
    </div>`;
  }).join('');

  hud.innerHTML = `
    <div class="hud-medal" id="hudMedalBtn" title="Prikaži vse range">
      ${getMedalSVG(rank.name, 54)}
    </div>
    <div class="hud-info">
      <div class="hud-rank-name" style="color:${rank.glow}">${rank.name}</div>
      <div class="hud-score-row">
        <span class="hud-score">${score}<span class="hud-pts-label"> točk</span></span>
        ${streak >= 2 ? `<span class="hud-streak">🔥 ${streak}× ${mult > 1 ? `<span class="hud-mult-badge">×${mult}</span>` : ''}</span>` : ''}
      </div>
      <div class="hud-bar-wrap"><div class="hud-bar-fill" style="width:${progress}%;background:linear-gradient(90deg,${rank.color},${rank.glow})"></div></div>
      <div class="hud-bar-label">${progressLabel}</div>
    </div>
    <button id="resetScoreBtn" class="reset-score-btn" title="Ponastavi rezultat">↺</button>
    <div class="hud-ranks-popup" id="ranksPopup">
      <div class="ranks-popup-title">🏅 Lestvica rangov</div>
      <div class="ranks-popup-items">${popupItems}</div>
      <div class="mult-info">
        <span>🔥 5× niz = <strong>×2</strong></span>
        <span>🔥🔥 10× niz = <strong>×3</strong></span>
      </div>
    </div>
  `;

  // Medal click toggles popup
  document.getElementById('hudMedalBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('ranksPopup').classList.toggle('open');
  });
  document.addEventListener('click', function closePopup() {
    const p = document.getElementById('ranksPopup');
    if (p) p.classList.remove('open');
  }, { once: false });
  document.getElementById('ranksPopup').addEventListener('click', e => e.stopPropagation());

  document.getElementById('resetScoreBtn').addEventListener('click', () => {
    if (confirm('Res želiš ponastaviti rezultat na nič?')) {
      localStorage.setItem(SCORE_KEY, '0');
      if (window.quizApp) { window.quizApp.score = 0; window.quizApp.streak = 0; window.quizApp.render(); }
      updateScoreHUD(0, 0);
    }
  });
}

// ── Quiz App ──────────────────────────────────────────────────────────────────
// ── Math-aware distractor generator ──────────────────────────────────────────
function getMathWrongAnswers(correct) {
  const correctNum = parseInt(correct);
  if (isNaN(correctNum)) return [];

  const candidates = new Set();

  // Reversed digits for 2-digit numbers (15→51, 24→42 etc)
  const str = String(correctNum);
  if (str.length === 2) {
    const rev = parseInt(str[1] + str[0]);
    if (rev !== correctNum && rev > 0) candidates.add(rev);
  }

  // Nearby plausible values
  const deltas = [-2, 2, -1, 1, -3, 3, -5, 5, 10, -10, -4, 4];
  for (const d of deltas) {
    const v = correctNum + d;
    if (v > 0 && v !== correctNum) candidates.add(v);
  }

  // Shuffle and pick 3 unique ones
  const pool = shuffle([...candidates]);
  const result = [];
  for (const c of pool) {
    if (result.length >= 3) break;
    result.push(String(c));
  }
  // Fallback fill if not enough candidates
  for (let fill = 1; result.length < 3; fill++) {
    if (fill !== correctNum && !result.includes(String(fill))) result.push(String(fill));
  }
  return result;
}

class QuizApp {
  constructor(cards) {
    this.cards    = cards;
    this.index    = 0;
    this.score    = parseInt(localStorage.getItem(SCORE_KEY) || '0');
    this.streak   = 0;
    this.answered = false;
    this.handleKey = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
    this.render();
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKey);
    if (this._autoTimer) clearTimeout(this._autoTimer);
  }

  handleKey(e) {
    if (this.answered && (e.code === 'Space' || e.code === 'ArrowRight')) {
      e.preventDefault(); this.nextQuestion();
    }
  }

  getWrongAnswers(correct) {
    return getMathWrongAnswers(correct);
  }

  render() {
    updateScoreHUD(this.score, this.streak);
    const area = document.getElementById('quizArea');
    if (!area) return;

    if (!this.cards || this.cards.length === 0) {
      area.innerHTML = `<div class="quiz-empty">Ni kartic za izbrane filtre 😕<br><small>Označite vsaj eno kategorijo.</small></div>`;
      return;
    }

    const card    = this.cards[this.index];
    const correct = card.back;
    const wrongs  = this.getWrongAnswers(correct);
    const options = shuffle([correct, ...wrongs]);
    const mult    = getMultiplier(this.streak);

    area.innerHTML = `
      <div class="quiz-meta">
        <div class="quiz-counter">Vprašanje ${this.index + 1} / ${this.cards.length}</div>

      </div>
      <div class="quiz-progress-wrap">
        <div class="quiz-progress-fill" style="width:${((this.index+1)/this.cards.length*100)}%"></div>
      </div>
      <div class="quiz-question-card">
        <div class="quiz-question-text">${escapeHtml(card.front)}</div>
      </div>
      ${mult > 1 ? `<div class="quiz-mult-notify">🔥 Množilnik <strong>×${mult}</strong> aktiven!</div>` : ''}
      <div class="quiz-options" id="quizOptions">
        ${options.map((opt, i) => `
          <button class="quiz-option" data-answer="${escapeHtml(opt)}" data-correct="${escapeHtml(correct)}">
            <span class="opt-letter">${['A','B','C','D'][i]}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>
      <button class="quiz-next-btn" id="quizNextBtn" style="display:none">
        ${this.index + 1 < this.cards.length ? 'Naslednje vprašanje ➡️' : '🏁 Končaj krog'}
      </button>
    `;

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });
    document.getElementById('quizNextBtn').addEventListener('click', () => this.nextQuestion());
  }

  checkAnswer(btn) {
    if (this.answered) return;
    this.answered = true;

    const selected = btn.dataset.answer;
    const correct  = btn.dataset.correct;
    const isCorrect = selected === correct;
    const mult = getMultiplier(this.streak);

    document.querySelectorAll('.quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correct) b.classList.add('correct');
      else if (b === btn && !isCorrect) b.classList.add('wrong');
    });

    const prevRank = getRank(this.score);
    const feedback = document.getElementById('quizFeedback');

    if (isCorrect) {
      SoundFX.correct();
      this.streak++;
      const pts = getMultiplier(this.streak);
      this.score += pts;
      localStorage.setItem(SCORE_KEY, this.score);
      const newMult = getMultiplier(this.streak);
      feedback.className = 'quiz-feedback feedback-correct';
      feedback.innerHTML = `✅ Pravilno! <strong>+${pts} točk${pts > 1 ? ` (×${pts})` : ''}</strong>${newMult > mult ? `<br>🔥 Množilnik ×${newMult} aktiviran!` : this.streak >= 2 ? `<br>🔥 Niz: ${this.streak} zapored!` : ''}`;
    } else {
      SoundFX.wrong();
      this.streak = 0;
      this.score = Math.max(0, this.score - 1);
      localStorage.setItem(SCORE_KEY, this.score);
      feedback.className = 'quiz-feedback feedback-wrong';
      feedback.innerHTML = `❌ Narobe! <strong>-1 točka</strong> · Pravilen odgovor: <strong>${escapeHtml(correct)}</strong>`;
    }

    updateScoreHUD(this.score, this.streak);

    // Rank-up check
    const newRank = getRank(this.score);
    if (isCorrect && newRank.name !== prevRank.name) this.showRankUp(newRank);

    const nextBtn = document.getElementById('quizNextBtn');
    if (nextBtn) nextBtn.style.display = 'inline-flex';

    // Correct = instant advance; wrong = brief pause to see correct answer
    const delay = isCorrect ? 600 : 1800;
    this._autoTimer = setTimeout(() => this.nextQuestion(), delay);
  }

  showRankUp(rank) {
    SoundFX.rankUp();
    const banner = document.createElement('div');
    banner.className = 'rank-up-banner';
    banner.innerHTML = `
      <div class="rank-up-inner">
        ${getMedalSVG(rank.name, 80)}
        <div class="rank-up-text">
          <div class="rank-up-title">🎖️ Napredovanje!</div>
          <div class="rank-up-name" style="color:${rank.glow}">${rank.name}</div>
          <div class="rank-up-sub">Čestitke!</div>
        </div>
      </div>`;
    document.body.appendChild(banner);
    setTimeout(() => { banner.classList.add('rank-up-hide'); setTimeout(() => banner.remove(), 600); }, 3500);
  }

  nextQuestion() {
    if (this._autoTimer) clearTimeout(this._autoTimer);
    this.answered = false;
    this.index = (this.index + 1) % this.cards.length;
    this.render();
  }
}

// ── Flashcard App ─────────────────────────────────────────────────────────────
class FlashcardApp {
  constructor(cards) {
    this.cards        = cards;
    this.currentIndex = 0;
    this.isFlipped    = false;
    this.touchStartX  = 0;
    this.touchEndX    = 0;
    this.handleKey    = this.handleKey.bind(this);
    this.initializeElements();
    this.setupEventListeners();
    this.setupAudio();
    this.updateDisplay();
  }

  initializeElements() {
    this.cardElement    = document.getElementById('flashcard');
    this.cardFront      = document.getElementById('cardFront');
    this.cardBack       = document.getElementById('cardBack');
    this.cardCounter    = document.getElementById('cardCounter');
    this.progressBar    = document.getElementById('progressBar');
    this.directionBadge = document.getElementById('directionBadge');
    this.prevBtn        = document.getElementById('prevBtn');
    this.nextBtn        = document.getElementById('nextBtn');
    this.audioBtn       = document.getElementById('audioBtn');
  }

  setupAudio() {
    if ('speechSynthesis' in window) {
      this.audioBtn.style.display = 'inline-block';
      this.audioBtn.onclick = () => this.playAudio();
    } else {
      this.audioBtn.style.display = 'none';
    }
  }

  playAudio() {
    if (!this.cards || this.cards.length === 0) return;
    const text = this.cards[this.currentIndex].english;
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'en-US'; utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  }

  setupEventListeners() {
    this.cardElement.onclick      = () => this.flipCard();
    this.prevBtn.onclick          = () => this.previousCard();
    this.nextBtn.onclick          = () => this.nextCard();
    document.addEventListener('keydown', this.handleKey);
    this.cardElement.ontouchstart = e => { this.touchStartX = e.changedTouches[0].screenX; };
    this.cardElement.ontouchend   = e => { this.touchEndX = e.changedTouches[0].screenX; this.handleSwipe(); };
  }

  destroy() { document.removeEventListener('keydown', this.handleKey); }

  handleKey(e) {
    if (!this.cards || this.cards.length === 0) return;
    switch (e.code) {
      case 'ArrowLeft':  e.preventDefault(); this.previousCard(); break;
      case 'ArrowRight': e.preventDefault(); this.nextCard();     break;
      case 'Space':      e.preventDefault(); this.flipCard();     break;
    }
  }

  handleSwipe() {
    if (!this.cards || this.cards.length === 0) return;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 50) { diff > 0 ? this.nextCard() : this.previousCard(); }
  }

  flipCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.isFlipped = !this.isFlipped;
    this.cardElement.classList.toggle('flipped', this.isFlipped);
    // Re-fit the now-visible face (hidden faces have no layout dimensions)
    const visibleFace = this.isFlipped ? this.cardBack : this.cardFront;
    setTimeout(() => autoFitCardText(visibleFace), 50);
  }

  previousCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.updateDisplay();
  }

  nextCard() {
    if (!this.cards || this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.cards || this.cards.length === 0) {
      setFaceText(this.cardFront, "Ni kartic za izbrane filtre 😕");
      setFaceText(this.cardBack,  "Označite vsaj eno kategorijo.");
      const imgEl = document.getElementById('cardImage');
      if (imgEl) imgEl.style.display = 'none';
      this.cardCounter.textContent = 'Kartica 0 od 0';
      if (this.progressBar) this.progressBar.style.width = '0%';

      this.prevBtn.disabled = this.nextBtn.disabled = this.audioBtn.disabled = true;
      this.isFlipped = false;
      this.cardElement.classList.remove('flipped');
      return;
    }
    const card = this.cards[this.currentIndex];
    setFaceText(this.cardFront, card.front);
    setFaceText(this.cardBack,  card.back);
    maybeShowCardImage(card);
    this.isFlipped = false;
    this.cardElement.classList.remove('flipped');
    this.cardCounter.textContent = `Kartica ${this.currentIndex + 1} od ${this.cards.length}`;
    if (this.progressBar) this.progressBar.style.width = ((this.currentIndex+1)/this.cards.length*100)+'%';

    this.prevBtn.disabled = this.nextBtn.disabled = this.audioBtn.disabled = false;
  }
}

// ── Timed App ─────────────────────────────────────────────────────────────────
class TimedApp {
  constructor(cards) {
    this.allCards   = shuffle([...cards]);
    this.levelIndex = 0;
    this.answered   = false;
    this.timer      = null;
    this._autoTimer = null;
    this.overlay    = null;
    this.handleKey  = this.handleKey.bind(this);
    document.addEventListener('keydown', this.handleKey);
    this.startLevel();
  }

  destroy() {
    if (this.timer)      clearInterval(this.timer);
    if (this._autoTimer) clearTimeout(this._autoTimer);
    document.removeEventListener('keydown', this.handleKey);
    this.removeOverlay();
  }

  handleKey(e) {
    if (this.answered && (e.code === 'Space' || e.code === 'ArrowRight')) {
      e.preventDefault(); this.nextQuestion();
    }
  }

  get level() { return TIMED_LEVELS[this.levelIndex]; }

  startLevel() {
    if (this.timer) clearInterval(this.timer);
    if (this._autoTimer) clearTimeout(this._autoTimer);
    this.removeOverlay();
    this.timeLeft     = this.level.timeLimit;
    this.score        = 0;
    this.streak       = 0;
    this.index        = 0;
    this.timerStarted = false;
    this.cards        = shuffle([...this.allCards]);
    this.answered     = false;
    this.timer        = null;
    this.render();
  }

  tick() {
    this.timeLeft--;
    this.updateTimerDisplay();
    if (this.timeLeft <= 0) {
      clearInterval(this.timer); this.timer = null;
      if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
      if (this.score >= this.level.target) {
        this.advanceLevel();
      } else {
        this.showGameOver();
      }
    }
  }

  updateTimerDisplay() {
    const el = document.getElementById('timedClock');
    const tm = document.getElementById('timedClockTime');
    if (!el || !tm) return;
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    tm.textContent = `${m}:${String(s).padStart(2,'0')}`;
    el.className = 'timed-clock';
    if (this.timeLeft <= 10) el.classList.add('danger');
    else if (this.timeLeft <= 25) el.classList.add('warn');
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    const sd = document.getElementById('timedScoreDisplay');
    const pf = document.getElementById('timedProgressFill');
    const pl = document.getElementById('timedProgressLabel');
    const st = document.getElementById('timedStreakDisplay');
    if (sd) sd.innerHTML = `<strong>${this.score}</strong> <span>/ ${this.level.target} točk</span>`;
    if (pf) {
      const pct = Math.min(100, Math.round((this.score / this.level.target) * 100));
      pf.style.width = pct + '%';
      pf.style.background = pct >= 100
        ? 'linear-gradient(90deg, #28a745, #ffe066)'
        : `linear-gradient(90deg, ${this.level.color}, ${this.level.glow})`;
    }
    if (pl) {
      const remaining = Math.max(0, this.level.target - this.score);
      pl.textContent = remaining > 0 ? `Manjka še ${remaining} točk` : '🎯 Cilj dosežen!';
    }
    if (st) {
      if (this.streak >= 2) {
        const mult = getMultiplier(this.streak);
        st.innerHTML = `🔥 ${this.streak}× ${mult > 1 ? `<strong>×${mult}</strong>` : ''}`;
        st.style.display = 'inline-flex';
      } else {
        st.style.display = 'none';
      }
    }
  }

  getWrongAnswers(correct) {
    return getMathWrongAnswers(correct);
  }

  render() {
    const area = document.getElementById('timedArea');
    if (!area) return;
    if (!this.cards || this.cards.length === 0) {
      area.innerHTML = `<div class="quiz-empty">Ni kartic za izbrane filtre 😕</div>`;
      return;
    }

    const card    = this.cards[this.index % this.cards.length];
    const correct = card.back;
    const wrongs  = this.getWrongAnswers(correct);
    const options = shuffle([correct, ...wrongs]);
    const mult    = getMultiplier(this.streak);
    const timeM   = Math.floor(this.timeLeft / 60);
    const timeS   = this.timeLeft % 60;
    const clockCls = this.timeLeft <= 10 ? 'timed-clock danger' : this.timeLeft <= 25 ? 'timed-clock warn' : 'timed-clock';
    const clockContent = this.timerStarted
      ? `<div class="timed-clock-label">Čas</div>
         <div class="timed-clock-time" id="timedClockTime">${timeM}:${String(timeS).padStart(2,'0')}</div>`
      : `<div class="timed-clock-label">Čas</div>
         <div class="timed-clock-time timed-clock-ready" id="timedClockTime">${timeM}:${String(timeS).padStart(2,'0')}</div>
         <div class="timed-clock-waiting">odgovori za start</div>`;
    const pct     = Math.min(100, Math.round((this.score / this.level.target) * 100));
    const streakHTML = this.streak >= 2
      ? `<span class="timed-streak" id="timedStreakDisplay">🔥 ${this.streak}× ${mult > 1 ? `<strong>×${mult}</strong>` : ''}</span>`
      : `<span class="timed-streak" id="timedStreakDisplay" style="display:none"></span>`;

    area.innerHTML = `
      <!-- HEADER -->
      <div class="timed-header">
        <div class="timed-level-badge">
          ${getMedalSVG(this.level.medal, 36)}
          <div>
            <div class="timed-level-name" style="color:${this.level.glow}">
              ${this.level.medal}
            </div>
            <div style="font-size:0.67rem;color:rgba(255,255,255,0.38);margin-top:2px">${this.level.hint}</div>
          </div>
        </div>
        <div class="${clockCls}" id="timedClock">
          ${clockContent}
        </div>
      </div>

      <!-- SCORE ROW -->
      <div class="timed-score-row">
        <div class="timed-score-display" id="timedScoreDisplay">
          <strong>${this.score}</strong> <span>/ ${this.level.target} točk</span>
        </div>
        ${streakHTML}
      </div>

      <!-- PROGRESS BAR -->
      <div class="timed-progress-wrap">
        <div class="timed-progress-fill" id="timedProgressFill"
          style="width:${pct}%;background:linear-gradient(90deg,${this.level.color},${this.level.glow})"></div>
      </div>
      <div class="timed-progress-label" id="timedProgressLabel">
        ${Math.max(0, this.level.target - this.score) > 0 ? `Manjka še ${this.level.target - this.score} točk` : '🎯 Cilj dosežen!'}
      </div>
      <div class="quiz-meta">
        <div class="quiz-counter">Vprašanje ${(this.index % this.cards.length) + 1} / ${this.cards.length}</div>
      </div>

      <!-- QUESTION -->
      <div class="quiz-question-card">
        <div class="quiz-question-text">${escapeHtml(card.front)}</div>
      </div>

      ${mult > 1 ? `<div class="timed-mult-notify">🔥 Množilnik <strong>×${mult}</strong> aktiven!</div>` : ''}

      <!-- OPTIONS -->
      <div class="quiz-options" id="timedOptions">
        ${options.map((opt, i) => `
          <button class="quiz-option" data-answer="${escapeHtml(opt)}" data-correct="${escapeHtml(correct)}">
            <span class="opt-letter">${['A','B','C','D'][i]}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>

      <div class="quiz-feedback" id="timedFeedback"></div>
      <div class="overlay-penalty-note">❗ Napačen odgovor: −1 točka in ponastavitev niza</div>
    `;

    document.querySelectorAll('#timedOptions .quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });
  }

  checkAnswer(btn) {
    if (this.answered) return;
    this.answered = true;

    const selected  = btn.dataset.answer;
    const correct   = btn.dataset.correct;
    const isCorrect = selected === correct;
    const mult      = getMultiplier(this.streak);

    // Start the countdown on the very first answer
    if (!this.timerStarted) {
      this.timerStarted = true;
      this.timer = setInterval(() => this.tick(), 1000);
    }

    document.querySelectorAll('#timedOptions .quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correct) b.classList.add('correct');
      else if (b === btn && !isCorrect) b.classList.add('wrong');
    });

    const feedback = document.getElementById('timedFeedback');

    if (isCorrect) {
      SoundFX.correct();
      this.streak++;
      const pts = getMultiplier(this.streak);
      this.score += pts;
      const newMult = getMultiplier(this.streak);
      if (feedback) {
        feedback.className = 'quiz-feedback feedback-correct';
        feedback.innerHTML = `✅ Pravilno! <strong>+${pts} točk${pts > 1 ? ` (×${pts})` : ''}</strong>${newMult > mult ? `<br>🔥 Množilnik ×${newMult} aktiviran!` : this.streak >= 2 ? `<br>🔥 Niz: ${this.streak} zapored!` : ''}`;
      }
    } else {
      SoundFX.wrong();
      this.streak = 0;
      this.score  = Math.max(0, this.score - 1);
      if (feedback) {
        feedback.className = 'quiz-feedback feedback-wrong';
        feedback.innerHTML = `❌ Narobe! <strong>-1 točka</strong> · Pravilen odgovor: <strong>${escapeHtml(correct)}</strong>`;
      }
    }
    this.updateScoreDisplay();

    // End round immediately once target is reached
if (this.score >= this.level.target && this.timer) {
  clearInterval(this.timer); this.timer = null;
  if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
  setTimeout(() => this.advanceLevel(), isCorrect ? 600 : 1800);
  return;
}

    this._autoTimer = setTimeout(() => this.nextQuestion(), isCorrect ? 500 : 1600);
  }

  nextQuestion() {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
    // Stop if time ran out
    if (!this.timer && this.timeLeft <= 0) return;
    this.answered = false;
    this.index++;
    if (this.index >= this.cards.length) {
      this.cards = shuffle([...this.allCards]);
      this.index = 0;
    }
    this.render();
  }

  advanceLevel() {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
    this.answered = true;
    if (this.levelIndex >= TIMED_LEVELS.length - 1) {
      this.showVictory();
      return;
    }
    this.showLevelComplete();
  }

  removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  showGameOver() {
    SoundFX.wrong();
    SoundFX.wrong();
    this.removeOverlay();
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-game-over-title">KONEC IGRE</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 64)}
        <div style="color:rgba(255,255,255,0.55);font-size:0.9rem">
          Raven: <strong style="color:#fff">${this.level.medal}</strong>
        </div>
        <div>
          <div class="overlay-score-label">Zbrane točke</div>
          <div class="overlay-score-big">${this.score}</div>
          <div class="overlay-score-label">cilj: ${this.level.target}</div>
        </div>
        <div class="overlay-subtitle">
          Manjkalo je ${this.level.target - this.score} točk. Poskusi znova! 💪
        </div>
        <button class="overlay-btn overlay-btn-retry" id="retryBtn">↺ Poskusi znova</button>
        <button class="overlay-btn overlay-btn-restart" id="restartBtn">⏮ Začni od začetka</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#retryBtn').addEventListener('click', () => this.startLevel());
    div.querySelector('#restartBtn').addEventListener('click', () => {
      this.levelIndex = 0;
      this.startLevel();
    });
  }

  showLevelComplete() {
    SoundFX.rankUp();
    this.removeOverlay();
    const nextLevel = TIMED_LEVELS[this.levelIndex + 1];
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-level-complete-title">⭐ Raven opravljena!</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 72)}
        <div class="overlay-score-big" style="color:${this.level.glow}">${this.score}</div>
        <div class="overlay-score-label">točk / cilj ${this.level.target}</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.9rem;text-align:center">
          Naslednja raven:<br>
          <strong style="color:${nextLevel.glow};font-size:1rem">${nextLevel.medal}</strong><br>
          <span style="font-size:0.8rem;color:rgba(255,255,255,0.4)">${nextLevel.hint}</span>
        </div>
        <button class="overlay-btn overlay-btn-next" id="nextLevelBtn">Naprej ➡️</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#nextLevelBtn').addEventListener('click', () => {
      this.levelIndex++;
      this.startLevel();
    });
  }

  showVictory() {
    SoundFX.rankUp();
    setTimeout(() => SoundFX.rankUp(), 600);
    this.removeOverlay();
    const div = document.createElement('div');
    div.className = 'timed-overlay';
    div.innerHTML = `
      <div class="timed-overlay-box">
        <div class="overlay-victory-title" style="color:${this.level.glow}">🏆 PRVAK! 🏆</div>
        <div class="overlay-divider"></div>
        ${getMedalSVG(this.level.medal, 80)}
        <div class="overlay-score-big" style="color:${this.level.glow}">${this.score}</div>
        <div class="overlay-score-label">točk na zlati ravni</div>
        <div class="overlay-subtitle">
          Čestitke! Premagal si vse ravni tekme s časom. 🎖️
        </div>
        <button class="overlay-btn overlay-btn-restart" id="playAgainBtn">🔄 Igraj znova</button>
      </div>
    `;
    document.body.appendChild(div);
    this.overlay = div;
    div.querySelector('#playAgainBtn').addEventListener('click', () => {
      this.levelIndex = 0;
      this.startLevel();
    });
  }
}


function switchMode(mode) {
  currentMode = mode;
  const fcPanel  = document.getElementById('flashcardPanel');
  const qzPanel  = document.getElementById('quizPanel');
  const tmPanel  = document.getElementById('timedPanel');
  const scoreHUD = document.getElementById('scoreHUD');
  const sel      = document.getElementById('modeSelect');
  if (sel && sel.value !== mode) sel.value = mode;

  if (window.app)      { window.app.destroy();      window.app      = null; }
  if (window.quizApp)  { window.quizApp.destroy();   window.quizApp  = null; }
  if (window.timedApp) { window.timedApp.destroy();  window.timedApp = null; }

  fcPanel.style.display  = 'none';
  qzPanel.style.display  = 'none';
  if (tmPanel) tmPanel.style.display = 'none';
  scoreHUD.style.display = 'none';

  if (mode === 'flashcard') {
    fcPanel.style.display = 'flex';
    clearDomListeners();
    const cards = applyFilters();
    window.app = new FlashcardApp(cards);
  } else if (mode === 'quiz') {
    qzPanel.style.display  = 'flex';
    scoreHUD.style.display = 'flex';
    reinitQuizApp();
  } else if (mode === 'timed') {
    if (tmPanel) tmPanel.style.display = 'flex';
    reinitTimedApp();
  }
}

function reinitFlashcardApp() {
  if (window.app) { window.app.destroy(); window.app = null; }
  clearDomListeners();
  const cards = applyFilters();
  window.app = new FlashcardApp(cards);
}

function reinitQuizApp() {
  if (window.quizApp) { window.quizApp.destroy(); window.quizApp = null; }
  if (MASTER_DATA.length === 0) {
    const area = document.getElementById('quizArea');
    if (area) area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
    return;
  }
  const cards = applyFilters();
  window.quizApp = new QuizApp(cards);
}

function reinitTimedApp() {
  if (window.timedApp) { window.timedApp.destroy(); window.timedApp = null; }
  if (MASTER_DATA.length === 0) {
    const area = document.getElementById('timedArea');
    if (area) area.innerHTML = `<div class="quiz-empty">Najprej naloži nabor kartic 👆</div>`;
    return;
  }
  const cards = applyFilters();
  window.timedApp = new TimedApp(cards);
}


// ── Load full distractor pool from ALL unit files for current subject ─────────
async function loadAllUnitsPool() {
  // Build the pool from all datasets belonging to the current subject
  const subjectDatasets = DATASETS.filter(d => d.subject === currentSubject);
  const urlSet = new Set();
  subjectDatasets.forEach(ds => {
    if (ds.combined) ds.combined.forEach(u => urlSet.add(u));
    else if (ds.url) urlSet.add(ds.url);
  });
  const t = Date.now();
  let combined = [];
  for (const url of urlSet) {
    try {
      const resp = await fetch(url + '?t=' + t);
      if (resp.ok) combined = combined.concat(await resp.json());
    } catch(e) {}
  }
  ALL_UNITS_POOL = combined;
}

// ── Init ──────────────────────────────────────────────────────────────────────
buildDatasetSelect();
const reloadBtn = document.getElementById("reloadBtn");

function clearDomListeners() {
  ['prevBtn','nextBtn','audioBtn','flashcard'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  });
}

function reinitApp() {
  if (currentMode === 'flashcard') reinitFlashcardApp();
  else if (currentMode === 'quiz') reinitQuizApp();
  else if (currentMode === 'timed') reinitTimedApp();
}

// Timestable filter change listeners (1–10)
for (let i = 1; i <= 10; i++) {
  const el = document.getElementById('chk' + i);
  if (el) el.addEventListener('change', () => {
    if (MASTER_DATA.length > 0) reinitApp();
  });
}

reloadBtn.addEventListener("click", async () => {
  const ds = currentDataset();
  if (!ds) return;
  localStorage.setItem(SELECT_KEY, ds.id);
  if (window.app)      { window.app.destroy();      window.app      = null; }
  if (window.quizApp)  { window.quizApp.destroy();   window.quizApp  = null; }
  if (window.timedApp) { window.timedApp.destroy();  window.timedApp = null; }
  clearDomListeners();
  setLoadingUI(true);
  try {
    MASTER_DATA = await fetchRawData(ds);
    if (!MASTER_DATA.length) throw new Error("No cards loaded");
    if (currentMode === 'flashcard') {
      const cards = applyFilters();
      window.app = new FlashcardApp(cards);
    } else if (currentMode === 'quiz') {
      reinitQuizApp();
    } else if (currentMode === 'timed') {
      reinitTimedApp();
    }
    // Collapse toolbar once the game is running
    if (typeof collapseToolbar === 'function') collapseToolbar();
  } catch (err) {
    console.error(err);
    setFaceText(document.getElementById('cardFront'), "Napaka pri nalaganju kartic 😢");
    setFaceText(document.getElementById('cardBack'),  "(preveri JSON datoteke)");
  } finally {
    setLoadingUI(false);
  }
});

updateScoreHUD(parseInt(localStorage.getItem(SCORE_KEY) || '0'), 0);
loadAllUnitsPool().then(() => reloadBtn.click());
