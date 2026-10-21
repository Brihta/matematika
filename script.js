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
    },
    /* Boben pred razglasitvijo zmagovalca v bitki — vse hitrejši udarci. */
    drumroll() {
      let t = 0;
      for (let i = 0; i < 26; i++) {
        setTimeout(() => tone(95 + (i % 2) * 12, 'triangle', 0.07, 0.22 + i * 0.006), t);
        t += Math.max(35, 95 - i * 3);
      }
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

/* Kaj se vadi: poštevanka ali seštevanje in odštevanje do 20.
   Pri Do 20 ostaneta isti dve vrsti računa (opType), le gumba sta druga:
   'multiply' je tam +, 'divide' je −. Tako vse, kar že dela z opType
   (kviz, tipkovnica, prednastavitve), dela tudi za Do 20. */
let subject  = 'post';
/* Začetni zaslon ('home') s ploščicami ali vaja ('play'). Povezava
   učiteljice (prednastavitev v URL) gre naravnost v vajo. */
let screen   = 'home';
/* Računi do 20 so razdeljeni tako kot pri pouku v 1. in 2. razredu: do 10,
   do 20 brez prehoda in do 20 s prehodom. Učiteljica vklopi samo tisto, kar
   so že jemali. Vsak račun je v natanko eni skupini (do20Group), sicer
   statistika ne bi povedala, kje otrok res še računa na prste.
   (Do 20. 10. 2026 sta bili še skupini "prijatelji 10" in "dvojčki"; to sta
   strategiji znotraj teh sklopov, ne ločena sklopa.) */
const DO20_GROUPS = [
  { key: 'd10', label: 'Do 10',              short: 'Do 10'        },
  { key: 'b20', label: 'Do 20 brez prehoda', short: 'Brez prehoda' },
  { key: 'pr',  label: 'Do 20 s prehodom',   short: 'S prehodom'   }
];
// stare povezave učiteljic (?g=p10,dv) še delujejo
const DO20_OLD = { p10: ['d10'], dv: ['d10', 'pr'] };
const DO20_KEYS = DO20_GROUPS.map(g => g.key);
let groups   = new Set(DO20_KEYS);
const MINUS  = '−';   // pravi minus, ne vezaj: na tabli in v zvezku je tak

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
let tdRefreshTimer = null;          // teacher dashboard auto-refresh
let tdRefreshFn = null;             // its refresh(), so returning to the tab can fire it
let tdResizeHandler = null;         // re-render on rotate: labels/columns are picked at render time
const TD_REFRESH_MS = 15000;        // how often an open dashboard re-reads
const STATS_FLUSH_MS = 15000;       // how often pending answers are pushed

/* Student profile + stats logging */
let profile = null;                 // { id, username, emoji, display_name } or null
let teacherSession = null;          // { id, username } or null
let pendingStats = {};              // { mode: {correct,wrong,points,seconds} }
let pendingTableStats = {};         // { "t_op": {t,op,c,w} }
let pendingAnswerCount = 0;
let lastAnswerTs = 0;               // for estimating practice time in quiz/keypad
let pendingSpeed = {};              // { "t_op": {t,op,n,f} } — see FAST_SECONDS
let pendingFacts = {};              // { "t_op_k": {t,op,k,c,w,n,f} } — supabase_racuni.sql
let pendingDo20 = {};               // { "g_op": {g,op,c,w,n,f} } — supabase_do20.sql
let pendingDo20Facts = {};          // { "g_op_x_y": {g,op,x,y,c,w,n,f} } — supabase_ljubljencek.sql
let questionShownTs = 0;            // when the current question appeared

/* Hitrost: cilj poštevanke je priklic na pamet, ne računanje na prste.
   Pravilen odgovor, hitrejši od FAST_SECONDS, je "hiter". Predal je obvladan
   šele, ko je vsaj FAST_SHARE pravilnih odgovorov hitrih — a samo, če je
   izmerjenih vsaj MIN_TIMED; stari podatki časa nimajo in zanje velja samo
   točnost. Odgovor po več kot SPEED_IGNORE sekundah se ne meri: otrok je
   takrat najbrž odšel od računalnika, ne razmišljal. */
const FAST_SECONDS = 3;
const FAST_SHARE   = 0.8;
const MIN_TIMED    = 5;
const SPEED_IGNORE = 30;

/* 12 animal icons — the password is a sequence of 4 of these (order matters) */
const ANIMALS = ['🐘','🦁','🦊','🐊','🐬','🦉','🐸','🐢','🦒','🐧','🐝','🐙'];
/* Emoji choices for the profile badge */
const PROFILE_EMOJIS = ['🦉','🚀','🦄','🐉','🌟','⚡','🎮','🍕','🦖','🐱','🐶','🦁','🌈','🎨','⚽','🦋'];

/* ══════════════════════════
   SETTINGS PERSISTENCE
══════════════════════════ */
const STORAGE_KEY = 'brihta_settings_v1';
/* Only the MODE is remembered between visits.
   The tables and the operation deliberately are not. Remembering them silently
   narrowed what children practised: one student had 229 division answers and
   zero multiplication on a table, because somebody once tapped ÷ and nobody
   knew to tap it back. On a shared class iPad it is worse still — the next
   child inherits whatever the previous one left behind.
   Liking the keypad harms nobody; being stuck on ÷ costs half the curriculum.
   So every visit starts on all ten tables with × and ÷, and a narrower
   selection has to be asked for — by the child, or by a teacher's preset link,
   which lives in the URL and therefore survives a reload. */
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s && ['quiz','keypad','tekmovanje','bitka'].includes(s.mode)) mode = s.mode;
  } catch(e) {}
}
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }));
  } catch(e) {}
}

/* Teacher preset links: ?p=7&op=x opens straight into the 7 times table with
   multiplication only, so a class never has to touch the settings at all.
     p    1-10, comma separated, or "vse"   (poštevanke)
     op   x | d | both                       (vrsta računa)
     mode kviz | tipkovnica | tekmovanje | bitka
     v    do20 | postevanka                  (kaj se vadi)
     g    d10,b20,pr ali "vse"               (do 10, do 20 brez prehoda, s prehodom)
   Pri Do 20 je op p (+), m (−) ali both.
   Applied after the saved settings, so a link always wins, and saved so the
   choice survives a refresh without the query string. */
function applyPresetFromURL() {
  let q;
  try { q = new URLSearchParams(location.search); } catch(e) { return false; }
  if (![...q.keys()].length) return false;
  let touched = false;

  const m = (q.get('mode') || '').toLowerCase();
  const modeMap = { kviz:'quiz', quiz:'quiz', tipkovnica:'keypad', keypad:'keypad',
                    tekmovanje:'tekmovanje', competition:'tekmovanje',
                    bitka:'bitka', battle:'bitka' };
  if (modeMap[m]) { mode = modeMap[m]; touched = true; }

  const o = (q.get('op') || '').toLowerCase();
  const opMap = { x:'multiply', mult:'multiply', multiply:'multiply', krat:'multiply',
                  d:'divide', div:'divide', divide:'divide', deljenje:'divide',
                  both:'both', xd:'both', obe:'both',
                  // Do 20: + in − sta prvi in drugi gumb, kot × in ÷
                  p:'multiply', plus:'multiply', m:'divide', minus:'divide', pm:'both' };
  if (opMap[o]) { opType = opMap[o]; touched = true; }

  const v = (q.get('v') || '').toLowerCase();
  const graw = (q.get('g') || '').toLowerCase();
  if (['do20', '20', 'sestevanje'].includes(v) || graw) { subject = 'do20'; touched = true; }
  else if (['postevanka', 'post', 'x'].includes(v))      { subject = 'post'; touched = true; }
  if (graw === 'vse' || graw === 'all') {
    groups = new Set(DO20_KEYS);
  } else if (graw) {
    const arr = graw.split(',').map(x => x.trim()).flatMap(x => DO20_OLD[x] || [x]).filter(x => DO20_KEYS.includes(x));
    if (arr.length) groups = new Set(arr);
  }

  const praw = (q.get('p') || q.get('t') || '').toLowerCase();
  if (praw === 'vse' || praw === 'all') {
    tables = new Set([1,2,3,4,5,6,7,8,9,10]); touched = true;
  } else if (praw) {
    const arr = praw.split(',')
      .map(x => parseInt(x.trim(), 10))
      .filter(n => Number.isInteger(n) && n >= 1 && n <= 10);
    if (arr.length) { tables = new Set(arr); touched = true; }
    subject = 'post';
  }
  /* Asking for particular tables only makes sense in a practice mode —
     tekmovanje and bitka always use the full deck. Without this, a child
     whose last session ended there opens the teacher's link and sees the
     preset silently ignored. */
  const askedForContent = praw || opMap[o] || graw || v;
  if (askedForContent && !modeMap[m] && (mode === 'tekmovanje' || mode === 'bitka')) {
    mode = 'quiz'; touched = true;
  }
  // tekmovanje in bitka sta samo za poštevanko
  if (subject === 'do20' && (mode === 'tekmovanje' || mode === 'bitka')) mode = 'quiz';
  if (touched) saveSettings();
  return touched;
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
/* Anything that came from the database gets escaped before it goes into
   innerHTML — usernames, display names and leaderboard names are typed by
   kids, and the leaderboard POST endpoint is reachable with the publishable
   key, so its contents cannot be trusted to be 3 safe letters. */
/* Imena z veliko začetnico: "nace" → "Nace", "ana marija" → "Ana Marija".
   Enkratni popravek v bazi (supabase_ime_ucenca.sql) je uredil stara imena,
   nova pa spet prihajajo z malo — otroci jih tako vpišejo, in tudi
   učiteljica na tablici. Zato se popravi ob branju in ob shranjevanju. */
function velikaZacetnica(ime) {
  if (!ime) return ime;
  // enako kot enkratni popravek v bazi: prva velika, ostale male ("BRIN" → "Brin")
  return String(ime).trim().toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
  if (q.includes('+')) {
    const p = q.replace(/\s*=\s*$/, '').split('+').map(s => parseInt(s.trim()));
    return { op:'add', a:p[0], b:p[1] };
  }
  if (q.includes(MINUS)) {
    const p = q.replace(/\s*=\s*$/, '').split(MINUS).map(s => parseInt(s.trim()));
    return { op:'sub', a:p[0], b:p[1] };
  }
  return null;
}

/* Skupina računa x + y (odštevanje s − y = x spada k x + y):
   do 10 (7 + 3), do 20 brez prehoda (13 + 4, 12 + 8, 10 + 10) in do 20 s
   prehodom (8 + 5, 6 + 6). null = račun ni v nobeni skupini (npr. 14 + 7,
   ki gre čez 20). Ista pravila so v supabase_ljubljencek.sql (_do20_group). */
function do20Group(x, y) {
  const s = x + y;
  if (x < 1 || y < 1 || s > 20) return null;
  if (s <= 10) return 'd10';
  const big = Math.max(x, y), small = Math.min(x, y);
  if (big >= 10 && big % 10 + small <= 10) return 'b20';
  if (big <= 9) return 'pr';
  return null;
}
/* Kup računov do 20 se sestavi tukaj, ne v JSON: pravila skupin so tako na
   enem mestu. Seštevanje v obeh vrstnih redih (3 + 4 in 4 + 3), odštevanje
   kot obratni račun. Pri Do 20 samo odštevanje enice (17 − 4 = 13), ne
   17 − 13: to je že odštevanje desetic, ki pride pozneje. 20 − 10 ostane. */
function buildDo20Cards() {
  const out = [];
  for (let x = 1; x <= 19; x++) {
    for (let y = 1; y <= 19; y++) {
      const g = do20Group(x, y);
      if (!g) continue;
      const s = x + y;
      out.push({ question: `${x} + ${y} =`, answer: String(s), g, op: 'add' });
      if (g === 'b20' && y >= 10 && x < 10) continue;
      out.push({ question: `${s} ${MINUS} ${y} =`, answer: String(x), g, op: 'sub' });
    }
  }
  return out;
}
const do20Cards = buildDo20Cards();

/* FILTER:
   A problem belongs to the multiplication table of its SECOND operand.
   - a × b  →  table b   (e.g. 3 × 8 is in the 8-times table, 8 × 3 in the 3-times table)
   - c : b  →  table b   (e.g. 24 : 8 is in the 8-times table, 24 : 3 in the 3-times table)
   So in both cases the relevant table is p.b — show only if that table is selected. */
function getFilteredCards() {
  if (subject === 'do20') {
    return do20Cards.filter(c => {
      if (opType === 'multiply' && c.op !== 'add') return false;
      if (opType === 'divide'   && c.op !== 'sub') return false;
      return groups.has(c.g);
    });
  }
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
  // pri Do 20 nobene ponudbe nad 20: 23 pri 7 + 6 otrok izloči brez računanja
  const max = subject === 'do20' ? 20 : Infinity;
  [-2,-1,1,2,-3,3,-5,5,10,-10,-4,4].forEach(d => { const v=n+d; if(v>0&&v<=max&&v!==n) cands.add(v); });
  if (String(n).length===2) {
    const rev = parseInt(String(n)[1]+String(n)[0]);
    if (rev!==n && rev>0 && rev<=max) cands.add(rev);
  }
  const pool = shuffle([...cands]), res = [];
  for (const c of pool) { if (res.length>=3) break; res.push(String(c)); }
  for (let f=1; res.length<3; f++) { if(f!==n && !res.includes(String(f))) res.push(String(f)); }
  return res;
}

/* ── LOAD JSON ── */
function loadData(cb) {
  fetch('postevanka.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => { allCards = d; if (cb) cb(); })
    .catch(e => {
      console.error('Napaka pri nalaganju JSON:', e);
      showLoadError();
    });
}
/* Without the question deck there is nothing to show, so say so instead of
   leaving the panel on its "začni!" placeholder forever. */
function showLoadError() {
  const html = '<div class="quiz-empty">⚠️ Računov ni bilo mogoče naložiti.<br>'
             + 'Preveri internetno povezavo in osveži stran.</div>';
  ['quizArea','keypadArea','tekmovanjeArea','bitkaArea'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

/* ── BRAND = na začetek ──
   Logotip vodi na začetni zaslon (prej je osvežil stran — "čist začetek",
   ki ga zdaj da začetni zaslon brez nalaganja). */
/* Guarded: a browser holding a cached index.html from before this button
   existed would otherwise throw here and take the whole init block with it,
   leaving the child staring at a dead page. */
const brandBtn = document.getElementById('brandBtn');
if (brandBtn) brandBtn.addEventListener('click', () => showHome());

/* ── BRAND FALLBACK ── */
document.getElementById('brandImg').onerror = function() {
  this.style.display='none';
  const em=document.createElement('span'); em.className='brand-emoji'; em.textContent='🦉';
  this.parentNode.insertBefore(em, this);
};

/* ══════════════════════════
   KAJ UTRJUJEM — okno z izbiro računov
   Gumb v zgornji vrstici pove, kaj se vadi ("Do 10 · + −"), in odpre okno.
   Imeni collapse/expandToolbar sta ostali, ker ju kličejo tekmovanje in
   bitka (battle.js): "pospravi nastavitve z poti".
══════════════════════════ */
const toolbar = document.getElementById('toolbar');
const summaryArrow = document.getElementById('summaryArrow');
const summaryLabel = document.getElementById('summaryLabel');
const summaryChip = document.getElementById('summaryChip');
const pickSheet = document.getElementById('pickSheet');
function collapseToolbar() {
  if (pickSheet) pickSheet.classList.remove('on');
  if (summaryChip) summaryChip.classList.remove('is-open');
}
function expandToolbar() {
  if (!pickSheet) return;
  if (document.activeElement) document.activeElement.blur();   // tipke naj ne tečejo v vajo za oknom
  pickSheet.classList.add('on');
  if (summaryChip) summaryChip.classList.add('is-open');
}
if (summaryChip) summaryChip.addEventListener('click', () => {
  pickSheet && pickSheet.classList.contains('on') ? collapseToolbar() : expandToolbar();
});
if (pickSheet) {
  pickSheet.addEventListener('click', e => { if (e.target === pickSheet) collapseToolbar(); });
  const close = document.getElementById('pickClose'), start = document.getElementById('pickStart');
  if (close) close.addEventListener('click', collapseToolbar);
  if (start) start.addEventListener('click', collapseToolbar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && pickSheet.classList.contains('on')) collapseToolbar(); });
}

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

/* Lock the op / tables controls in Tekmovanje and Bitka (fixed settings there) */
function updateControlLock() {
  const lock = (mode === 'tekmovanje' || mode === 'bitka');
  document.querySelectorAll('#opBtnGroup .seg-btn, .table-btn, #selAll, #selNone')
    .forEach(b => { b.disabled = lock; });
  document.getElementById('opBtnGroup').classList.toggle('locked', lock);
  document.getElementById('filterRow').classList.toggle('locked', lock);
  /* Tekmovanje in bitka imata lestvico in nagrade samo za poštevanko — pri
     Do 20 ju ni, da se tretješolec ne bi meril s petošolci. */
  const do20 = subject === 'do20';
  document.querySelectorAll('#modeBtnGroup .seg-btn').forEach(b => {
    const race = b.dataset.mode === 'tekmovanje' || b.dataset.mode === 'bitka';
    b.disabled = do20 && race;
    b.classList.toggle('mode-off', do20 && race);
    b.title = do20 && race ? 'Tekmovanje in bitka sta samo za poštevanko' : '';
  });
}

/* Poštevanka ↔ Do 20: drugi gumbi za vrsto računa in druga izbira
   (poštevanke ali skupine), vse ostalo ostane isto. */
function applySubjectUI() {
  const do20 = subject === 'do20';
  document.querySelectorAll('#subjectBtnGroup .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.subject === subject);
  });
  const LABELS = do20 ? { both: '+ −', multiply: '+', divide: '−' }
                      : { both: '× ÷', multiply: '×', divide: '÷' };
  document.querySelectorAll('#opBtnGroup .seg-btn').forEach(b => {
    b.textContent = LABELS[b.dataset.op];
  });
  /* Brskalnik ima lahko še star index.html (brez teh elementov) in nov
     script.js — takrat ne sme pasti cel zagon, kot pri brandBtn. */
  const fr = document.getElementById('filterRow'), gr = document.getElementById('groupRow');
  const pl = document.getElementById('pickLabel');
  if (fr) fr.style.display = do20 ? 'none' : '';
  if (gr) gr.style.display = do20 ? '' : 'none';
  if (pl) pl.textContent = do20 ? 'Računi do 20' : 'Poštevanke';
  document.querySelectorAll('.group-btn').forEach(b => {
    b.classList.toggle('active', groups.has(b.dataset.g));
  });
  // začetni zaslon je vedno svetel (kot Do 20), ne glede na zadnjo snov
  document.body.classList.toggle('do20', do20 || screen === 'home');
  updateSummary();
}

document.querySelectorAll('#subjectBtnGroup .seg-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    if (this.dataset.subject === subject) return;
    subject = this.dataset.subject;
    if (subject === 'do20' && (mode === 'tekmovanje' || mode === 'bitka')) {
      mode = 'quiz';
      applyUIFromState();
      showPanel(mode);
      saveSettings();
    }
    applySubjectUI();
    updateControlLock();
    triggerRestart();
  });
});

document.querySelectorAll('.group-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const g = this.dataset.g;
    if (groups.has(g)) { groups.delete(g); this.classList.remove('active'); }
    else               { groups.add(g);    this.classList.add('active'); }
    updateSummary();
    triggerRestartDebounced();
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
  if (subject === 'do20') { groups = new Set(DO20_KEYS); applySubjectUI(); triggerRestart(); return; }
  tables = new Set([1,2,3,4,5,6,7,8,9,10]);
  document.querySelectorAll('.table-btn').forEach(b => b.classList.add('active'));
  updateSummary();
  saveSettings();
  triggerRestart();
});
document.getElementById('selNone').addEventListener('click', () => {
  if (subject === 'do20') { groups = new Set(); applySubjectUI(); triggerRestart(); return; }
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
  applySubjectUI();
}

function showPanel(m) {
  const home = screen === 'home';
  const show = (id, on, how) => { const el = document.getElementById(id); if (el) el.style.display = on ? (how || '') : 'none'; };
  show('homeScreen',      home);
  show('quizPanel',       !home && m==='quiz');
  show('keypadPanel',     !home && m==='keypad');
  show('tekmovanjePanel', !home && m==='tekmovanje');
  show('bitkaPanel',      !home && m==='bitka');
  const race = m === 'tekmovanje' || m === 'bitka';
  show('scoreHUD',   !home && !race, 'flex');
  show('modeSwitch', !home && !race);
  const msb = document.getElementById('modeSwitchBtn');
  if (msb) msb.textContent = m === 'quiz' ? '⌨️ Vtipkaj odgovor' : '🎯 Pokaži izbirne odgovore';
  // bitka si deli postavitev tekmovanja, le barva je svoja
  document.body.classList.toggle('competition', !home && race);
  document.body.classList.toggle('bitka', !home && m==='bitka');
  document.body.classList.toggle('home', home);
  document.body.classList.toggle('do20', subject === 'do20' || home);
  if (home) { collapseToolbar(); renderHomeCont(); }
}

/* Napis na gumbu "kaj utrjujem": kratko, kar je izbrano. */
function updateSummary() {
  if (!summaryLabel) return;
  let what, op;
  if (subject === 'do20') {
    const sel = DO20_GROUPS.filter(g => groups.has(g.key));
    what = !sel.length ? 'Nič izbrano' : sel.length === DO20_GROUPS.length ? 'Vsi računi'
         : sel.length <= 2 ? sel.map(g => g.label).join(', ') : `${sel.length} skupine`;
    op = { both: '+ −', multiply: '+', divide: '−' }[opType];
  } else {
    const t = [...tables].sort((a, b) => a - b);
    what = !t.length ? 'Nič izbrano' : t.length === 10 ? 'Vse poštevanke'
         : t.length <= 4 ? 'Poštevanka ' + t.join(', ') : `${t.length} poštevank`;
    op = { both: '× ÷', multiply: '×', divide: '÷' }[opType];
  }
  summaryLabel.textContent = `${what} · ${op}`;
}

/* ══════════════════════════
   ZAČETNI ZASLON
══════════════════════════ */
/* Zapomni se samo, KAJ je otrok nazadnje vadil (za "Nadaljuj"), ne katere
   poštevanke — zakaj ne, piše pri loadSettings. */
const LAST_KEY = 'brihta_last_v1';
function rememberLast() {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ subject })); } catch(e) {}
}
function renderHomeCont() {
  const btn = document.getElementById('homeCont');
  if (!btn) return;
  let last = null;
  try { last = JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch(e) {}
  if (!last || !['post', 'do20'].includes(last.subject)) { btn.style.display = 'none'; return; }
  btn.dataset.subject = last.subject;
  document.getElementById('homeContIc').textContent = last.subject === 'do20' ? '+' : '×';
  document.getElementById('homeContTxt').textContent =
    'Nadaljuj: ' + (last.subject === 'do20' ? 'Računi do 20' : 'Poštevanka');
  btn.style.display = '';
}
function showHome() {
  if (screen === 'home') return;
  screen = 'home';
  removeOverlay();
  applySubjectUI();
  showPanel(mode);
  doRestart();           // ustavi igro, zapiše odgovore, zapusti bitko
  window.scrollTo(0, 0);
}
/* Vstop v vajo: snov in način; pri vaji se odpre še "kaj utrjujem". */
function enterPlay(subj, m, openPick) {
  screen = 'play';
  subject = subj;
  mode = m;
  if (m === 'quiz' || m === 'keypad') rememberLast();   // tekmovanje ni "zadnja vaja"
  saveSettings();
  applyUIFromState();
  updateControlLock();
  showPanel(mode);
  triggerRestart();
  if (openPick) expandToolbar();
  window.scrollTo(0, 0);
}
/* Vaja je na tipkovnici, razen če je otrok sam izbral kviz (zapomnjeno). */
const practiceMode = () => (mode === 'quiz' ? 'quiz' : 'keypad');
document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => {
  const h = b.dataset.home;
  if (h === 'do20' || h === 'post') enterPlay(h, practiceMode(), true);
  else enterPlay('post', h, false);     // tekmovanje in bitka sta za poštevanko
}));
(function () {
  const cont = document.getElementById('homeCont');
  if (cont) cont.addEventListener('click', () => enterPlay(cont.dataset.subject || 'post', practiceMode(), false));
  const back = document.getElementById('backBtn');
  if (back) back.addEventListener('click', () => showHome());
  const ms = document.getElementById('modeSwitchBtn');
  if (ms) ms.addEventListener('click', () => {
    mode = mode === 'quiz' ? 'keypad' : 'quiz';
    saveSettings(); applyUIFromState(); showPanel(mode); triggerRestart();
  });
})();

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
  if (mode !== 'bitka' || screen === 'home') battleLeave();   // preklop drugam = odhod iz bitke
  flushStats();          // persist any answers from the mode we are leaving
  lastAnswerTs = 0;
  removeOverlay();
  if (screen === 'home') return;     // na začetnem zaslonu ne teče nobena igra
  cards = shuffle(getFilteredCards());
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else if (mode === 'bitka')  showBattlePanel();
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
  if (tdRefreshTimer) { clearInterval(tdRefreshTimer); tdRefreshTimer = null; }
  if (tdResizeHandler) {
    window.removeEventListener('resize', tdResizeHandler);
    window.removeEventListener('orientationchange', tdResizeHandler);
    tdResizeHandler = null;
  }
  tdRefreshFn = null;
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
function emptyPickMsg() {
  return subject === 'do20' ? 'Izberi vsaj eno skupino računov (gumb zgoraj).'
                            : 'Izberi vsaj eno poštevanko (gumb zgoraj).';
}
function startQuiz() {
  qQueue = shuffle(cards); qIdx = 0; qOk = 0; qNo = 0; qStreak = 0;
  updateScoreHUD(0,0,0);
  renderQuizQ();
}
function renderQuizQ() {
  const area = document.getElementById('quizArea');
  if (!qQueue.length) {
    area.innerHTML = `<div class="quiz-empty">Ni računov. ${emptyPickMsg()}</div>`;
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
  questionShownTs = Date.now();
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
    area.innerHTML = `<div class="quiz-empty">Ni računov. ${emptyPickMsg()}</div>`;
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
  questionShownTs = Date.now();
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
  if (mode !== 'keypad' || screen === 'home') return;
  if (pickSheet && pickSheet.classList.contains('on')) return;
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
/* En otrok = ena vrstica: samo najboljši rezultat vsakega imena. Sicer dober
   otrok, ki vadi celo uro, zasede vseh 10 mest in drugi izginejo s
   projektorja. Vsi poskusi se še vedno shranijo — skrije se le slabše. */
function bestPerName(rows) {
  const best = {};
  for (const r of rows) {
    const b = best[r.name];
    if (!b || r.score > b.score
        || (r.score === b.score && String(r.created_at) < String(b.created_at))) best[r.name] = r;
  }
  return Object.values(best)
    .sort((a, b) => (b.score - a.score) || String(a.created_at).localeCompare(String(b.created_at)))
    .slice(0, 10);
}
function loadLocalBoard(day) {
  try {
    const all = JSON.parse(localStorage.getItem('brihta_leaderboard') || '{}');
    return bestPerName(all[day] || []);
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
    /* Baza sama izbere najboljšega na ime (supabase_lestvica.sql). Dokler
       funkcije ni, preberi več vrstic in izberi tukaj. */
    const board = await supabaseRPC('get_daily_board', { p_day: day });
    if (Array.isArray(board)) return board;
    try {
      const url = `${LEADERBOARD.supabaseUrl}/rest/v1/scores`
        + `?day=eq.${day}&order=score.desc,created_at.asc&limit=300`;
      const res = await fetch(url, {
        headers: {
          apikey: LEADERBOARD.supabaseKey,
          Authorization: `Bearer ${LEADERBOARD.supabaseKey}`
        }
      });
      if (res.ok) return bestPerName(await res.json());
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
/* Returned when the backend could not be reached or answered with a server
   error — offline, DNS failure, project paused. Deliberately distinct from
   null, which means the server answered and turned the request down (e.g. a
   wrong password). Has no .length, so existing `rows && rows.length` checks
   still treat it as "no data". */
const RPC_UNREACHABLE = { unreachable: true };
const OFFLINE_MSG = '⚠️ Strežnik trenutno ni dosegljiv. Preveri internetno povezavo '
                  + 'in poskusi znova — geslo je najbrž pravilno.';
/* Rows from an RPC that may have failed — always safe to iterate. */
function asRows(v) { return Array.isArray(v) ? v : []; }

async function supabaseRPC(fn, params, extra) {
  if (!leaderboardEnabled()) return RPC_UNREACHABLE;
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
    if (res.status >= 500) return RPC_UNREACHABLE;
    if (!res.ok) return null;
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  } catch(e) { return RPC_UNREACHABLE; }
}

/* Supabase vrne največ 1000 vrstic na klic (nastavitev "Max rows") — tiho,
   brez napake. get_class_overview ima vrstico na učenca × poštevanko ×
   operacijo, zato je šola to mejo prerasla: pregled je dobil naključen
   izsek, v mreži in na izpisu so manjkale poštevanke, ki jih je otrok v
   resnici vadil, Brihtometer pa je bil prenizek. Zato beremo po straneh, v
   stalnem vrstnem redu, dokler ne pride krajša stran. */
const RPC_PAGE = 1000;
async function supabaseRPCAll(fn, params, order) {
  const all = [];
  for (let offset = 0; ; offset += RPC_PAGE) {
    const page = await supabaseRPC(
      `${fn}?order=${order}&limit=${RPC_PAGE}&offset=${offset}`, params);
    if (page === RPC_UNREACHABLE) return RPC_UNREACHABLE;
    /* Prva stran zavrnjena (funkcije ni, ali baza ne sprejme razvrščanja):
       poskusi še po starem, en klic brez strani — nikoli slabše kot prej. */
    if (!Array.isArray(page)) return offset ? all : supabaseRPC(fn, params);
    all.push(...page);
    if (page.length < RPC_PAGE) return all;
  }
}

/* ── Auth ── */
async function registerStudent(name, number, emoji, pinSeq) {
  const rows = await supabaseRPC('register_student', {
    p_name: name, p_number: String(number), p_emoji: emoji, p_pin: pinSeq
  });
  if (rows === RPC_UNREACHABLE) return RPC_UNREACHABLE;
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
  if (rows === RPC_UNREACHABLE) return RPC_UNREACHABLE;
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
/* Returned when the credentials are right but the account is still waiting
   for approval — worth telling a colleague apart from a wrong password. */
const TEACHER_PENDING = { pending: true };

async function loginTeacher(email, password) {
  const rows = await supabaseRPC('login_teacher_email', {
    p_email: String(email).toLowerCase().trim(), p_password: password
  });
  if (rows === RPC_UNREACHABLE) return RPC_UNREACHABLE;
  if (rows && rows.length) {
    if (!rows[0].approved) return TEACHER_PENDING;
    teacherSession = { id: rows[0].id, username: rows[0].username,
                       email: rows[0].email,
                       mustChange: !!rows[0].must_change };
    profile = null; saveProfile();
    saveTeacher();
    updateProfileButton();
    return teacherSession;
  }
  return null;
}

async function changeTeacherPassword(oldPass, newPass) {
  if (!teacherSession || !teacherSession.email) return 'NO_EMAIL';
  const res = await supabaseRPC('change_teacher_password', {
    p_email: teacherSession.email, p_old: oldPass, p_new: newPass
  });
  if (res === RPC_UNREACHABLE) return RPC_UNREACHABLE;
  return typeof res === 'string' ? res : 'ERROR';
}

/* Self-registration, gated by a school code. The account is created but
   inactive until Nino approves it in the SQL editor — a teacher account can
   read every child's results and reset any child's password, so an open
   form on a public page would hand that to whoever asked. */
async function registerTeacher(email, password, code) {
  const res = await supabaseRPC('register_teacher', {
    p_email: String(email).toLowerCase().trim(),
    p_password: password, p_code: code
  });
  if (res === RPC_UNREACHABLE) return RPC_UNREACHABLE;
  return typeof res === 'string' ? res : 'ERROR';
}
function logoutTeacher() {
  teacherSession = null;
  saveTeacher();
  updateProfileButton();
}

/* ── Student class (razred) ── */
/* Oddelki, ki dejansko obstajajo na šoli — 2., 3. in 9. razred imajo samo
   A, 8. razred ima tudi C. Ponujati oddelke, ki jih ni, samo vabi k napačni
   izbiri. */
const RAZREDI = ['1A','1B','2A','3A','4A','4B',
                 '5A','5B','6A','6B','7A','7B',
                 '8A','8B','8C','9A'];
/* Starši, stari starši, prijatelji … Namesto razreda dobijo to oznako, da jih
   aplikacija ne sprašuje več po razredu in da ne pridejo med učence. */
const OBISK = 'OBISK';
const razredLabel = r => r === OBISK ? 'Obiskovalec' : r;
async function getStudentRazred(id) {
  return supabaseRPC('get_student_razred', { p_student: id });
}
async function setStudentRazred(id, razred) {
  return supabaseRPC('set_student_razred', { p_student: id, p_razred: razred });
}
async function getClassRazreds(teacherId) {
  return supabaseRPCAll('get_class_razreds', { p_teacher_id: teacherId }, 'username');
}
/* Ask the server which class this child is in, and cache the answer.
   Deliberately asks every time rather than trusting the cached value: the
   class is now derived from the school year, so a child who was 3A in June
   is 4A in September and the stored copy would be a year out of date. */
async function ensureRazred(onDone) {
  if (!profile) { onDone && onDone(); return; }
  const r = await getStudentRazred(profile.id);
  if (r === RPC_UNREACHABLE) { onDone && onDone(); return; }  // ask again next time
  if (typeof r === 'string' && r) {
    profile.razred = r; saveProfile();
    onDone && onDone();
  } else {
    openRazredPrompt(onDone);
  }
}
function openRazredPrompt(onDone) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  document.body.appendChild(div);
  activeOverlay = div;

  function renderPick() {
    div.innerHTML = `
      <div class="timed-overlay-box razred-box">
        <div class="overlay-title" style="color:#f0a500">🏫 V kateri razred hodiš?</div>
        <div class="overlay-divider"></div>
        <div class="auth-msg">Novo šolsko leto se je začelo — izberi svoj razred.</div>
        <div class="razred-grid">
          ${RAZREDI.map(r => `<button class="razred-btn" data-r="${r}">${r}</button>`).join('')}
        </div>
        <button class="razred-btn razred-obisk" data-r="${OBISK}">🏡 Nisem učenec/ka — sem samo na obisku
          <span>(starš, prijatelj, drug sorodnik …)</span></button>
      </div>`;
    div.querySelectorAll('.razred-btn').forEach(b => {
      b.addEventListener('click', () => renderConfirm(b.dataset.r));
    });
  }

  /* A mis-tap here is worse than no answer: it quietly files the child in
     another teacher's class and nobody notices. Hence the confirm step. */
  function renderConfirm(r) {
    const obisk = r === OBISK;
    div.innerHTML = `
      <div class="timed-overlay-box razred-box">
        <div class="overlay-title" style="color:#f0a500">${obisk ? '🏡 Si na obisku?' : '🏫 Je to pravi razred?'}</div>
        <div class="overlay-divider"></div>
        <div class="razred-confirm${obisk ? ' razred-confirm-obisk' : ''}">${obisk ? '🏡 Obiskovalec' : esc(r)}</div>
        <div class="auth-msg">${obisk
          ? 'Potrdi, da nisi učenec/ka — Brihto igraš doma ali skupaj z otrokom.'
          : `Potrdi, da hodiš v razred <strong>${esc(r)}</strong>.`}</div>
        <button class="overlay-btn overlay-btn-next" id="razredOk">✓ Potrdi</button>
        <button class="auth-switch auth-close" id="razredBack">← Nazaj</button>
      </div>`;
    div.querySelector('#razredBack').addEventListener('click', renderPick);
    div.querySelector('#razredOk').addEventListener('click', async () => {
      const btn = div.querySelector('#razredOk');
      btn.disabled = true; btn.textContent = 'Shranjujem …';
      if (profile) {
        profile.razred = r; saveProfile();
        await setStudentRazred(profile.id, r);
      }
      removeOverlay();
      onDone && onDone();
    });
  }

  renderPick();
}

/* ── Stats logging ── */
function recordStat(modeKey, correct, wrong, points, seconds) {
  if (!profile) return;
  /* Odgovori Do 20 gredo samo v do20_stats. `stats` hrani poštevanko: iz nje
     se računajo stolpec Odgovori v pregledu, nizi v albumu in cekini — Do 20
     bi jih napihnil z lažjimi računi. */
  if (subject === 'do20') return;
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
  if (p && (p.op === 'add' || p.op === 'sub')) { recordDo20Stat(p, isCorrect); return; }
  if (!p || !(p.b >= 1 && p.b <= 10)) return;
  const op = p.op === 'multiply' ? 'x' : 'd';
  const key = p.b + '_' + op;
  if (!pendingTableStats[key]) pendingTableStats[key] = { t: p.b, op, c: 0, w: 0 };
  if (isCorrect) pendingTableStats[key].c++; else pendingTableStats[key].w++;

  const sec = isCorrect && questionShownTs ? (Date.now() - questionShownTs) / 1000 : null;
  const timed = sec !== null && sec <= SPEED_IGNORE;
  recordFactStat(p, op, isCorrect, timed, timed && sec < FAST_SECONDS);

  if (!timed) return;
  if (!pendingSpeed[key]) pendingSpeed[key] = { t: p.b, op, n: 0, f: 0 };
  pendingSpeed[key].n++;
  if (sec < FAST_SECONDS) pendingSpeed[key].f++;
}
/* Po posameznih računih (7·1 … 7·10), da bo Brihtometer lahko preveril, ali
   je otrok rešil cel predal. Račun je število, ki ga poštevanka množi: pri
   3 × 7 je 3, pri 21 : 7 količnik 3. Kviz se ne beleži: tam lahko otrok
   odgovor ugane med štirimi, za obvladanje pa šteje samo priklic. */
function recordFactStat(p, op, isCorrect, timed, fast) {
  if (mode === 'quiz') return;
  const k = p.op === 'multiply' ? p.a : p.a / p.b;
  if (!(k >= 1 && k <= 10 && Number.isInteger(k))) return;
  const key = p.b + '_' + op + '_' + k;
  const f = pendingFacts[key] || (pendingFacts[key] = { t: p.b, op, k, c: 0, w: 0, n: 0, f: 0 });
  if (isCorrect) f.c++; else f.w++;
  if (timed) { f.n++; if (fast) f.f++; }
}
/* Do 20: po skupini in operaciji, s hitrostjo kot pri poštevanki. Tudi kviz
   se šteje, tako kot v table_stats. */
function recordDo20Stat(p, isCorrect) {
  // seštevanec in drugi seštevanec: pri odštevanju s − y = x je to x + y
  const x0 = p.op === 'add' ? p.a : p.a - p.b, y0 = p.b;
  const g = do20Group(x0, y0);
  if (!g) return;
  const op = p.op === 'add' ? 'p' : 'm';
  const key = g + '_' + op;
  const e = pendingDo20[key] || (pendingDo20[key] = { g, op, c: 0, w: 0, n: 0, f: 0 });
  if (isCorrect) e.c++; else e.w++;
  const sec = isCorrect && questionShownTs ? (Date.now() - questionShownTs) / 1000 : null;
  const timed = sec !== null && sec <= SPEED_IGNORE, fast = timed && sec < FAST_SECONDS;
  if (timed) { e.n++; if (fast) e.f++; }
  /* Po računih za ljubljenčka (mejniki). Kot pri poštevanki samo tipkovnica:
     v kvizu lahko otrok odgovor ugane med štirimi. Račun je par {x, y}, zato
     so 3 + 4, 4 + 3 in 7 − 3 isti par — ločeno za + in −. */
  if (mode !== 'quiz') {
    const x = Math.min(x0, y0), y = Math.max(x0, y0);
    const fk = key + '_' + x + '_' + y;
    const fe = pendingDo20Facts[fk] || (pendingDo20Facts[fk] = { g, op, x, y, c: 0, w: 0, n: 0, f: 0 });
    if (isCorrect) fe.c++; else fe.w++;
    if (timed) { fe.n++; if (fast) fe.f++; }
  }
  // recordStat tu ne šteje, zato pošiljanje sproži sam
  if (++pendingAnswerCount >= 10) flushStats();
}
/* time since the previous answer, capped so idle time doesn't inflate it */
function answerSeconds() {
  const now = Date.now();
  let dt = lastAnswerTs ? (now - lastAnswerTs) / 1000 : 0;
  lastAnswerTs = now;
  if (dt < 0 || dt > 20) dt = dt > 20 ? 20 : 0;
  return dt;
}
/* Returns a promise that settles once every write has landed, so callers that
   read the stats back (openStatsOverlay) can await it instead of racing it. */
function flushStats(useKeepalive) {
  if (!profile) {
    pendingStats = {}; pendingTableStats = {}; pendingSpeed = {}; pendingFacts = {}; pendingDo20 = {}; pendingDo20Facts = {}; pendingAnswerCount = 0;
    return Promise.resolve();
  }
  const toSend = pendingStats;
  const toSendTables = pendingTableStats;
  const toSendSpeed = pendingSpeed;
  const toSendFacts = pendingFacts;
  const toSendDo20 = pendingDo20;
  const toSendDo20Facts = pendingDo20Facts;
  pendingDo20 = {};
  pendingDo20Facts = {};
  pendingStats = {};
  pendingTableStats = {};
  pendingSpeed = {};
  pendingFacts = {};
  pendingAnswerCount = 0;
  const day = getTodayKey();
  const extra = useKeepalive ? { keepalive: true } : undefined;
  const writes = [];
  for (const modeKey of Object.keys(toSend)) {
    const s = toSend[modeKey];
    if (!s.correct && !s.wrong && !s.points && !s.seconds) continue;
    writes.push(supabaseRPC('add_stats', {
      p_student: profile.id, p_mode: modeKey, p_day: day,
      p_correct: s.correct, p_wrong: s.wrong,
      p_points: s.points, p_seconds: Math.round(s.seconds)
    }, extra));
  }
  const tableData = Object.keys(toSendTables).map(k => toSendTables[k]);
  if (tableData.length) {
    writes.push(supabaseRPC('add_table_stats', {
      p_student: profile.id, p_day: day, p_data: tableData
    }, extra));
  }
  /* Ločen klic, ker je hitrost v svoji tabeli. Če funkcije v bazi še ni
     (supabase_hitrost.sql), klic tiho spodleti in vse ostalo dela naprej. */
  const speedData = Object.keys(toSendSpeed).map(k => toSendSpeed[k]);
  if (speedData.length) {
    writes.push(supabaseRPC('add_table_speed', {
      p_student: profile.id, p_day: day, p_data: speedData
    }, extra));
  }
  /* Računi so v svoji tabeli (supabase_racuni.sql). Dokler je ni, klic tiho
     spodleti, vse ostalo pa se zapiše kot prej. */
  const factData = Object.keys(toSendFacts).map(k => toSendFacts[k]);
  if (factData.length) {
    writes.push(supabaseRPC('add_fact_stats', {
      p_student: profile.id, p_day: day, p_data: factData
    }, extra));
  }
  /* Do 20 (supabase_do20.sql). Dokler funkcije ni, klic tiho spodleti. */
  const do20Data = Object.keys(toSendDo20).map(k => toSendDo20[k]);
  if (do20Data.length) {
    writes.push(supabaseRPC('add_do20_stats', {
      p_student: profile.id, p_day: day, p_data: do20Data
    }, extra));
  }
  /* Računi za ljubljenčka (supabase_ljubljencek.sql). */
  const do20FactData = Object.keys(toSendDo20Facts).map(k => toSendDo20Facts[k]);
  if (do20FactData.length) {
    writes.push(supabaseRPC('add_do20_facts', {
      p_student: profile.id, p_day: day, p_data: do20FactData
    }, extra));
  }
  return Promise.all(writes);
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
/* timed/fast are optional: without them (old data, or before
   supabase_hitrost.sql is run) the rule is accuracy alone. Accurate but slow
   is "še vadi" — the child knows how to work it out, not yet by heart. */
function masteryClass(correct, wrong, timed, fast) {
  const total = (correct || 0) + (wrong || 0);
  if (total < 5) return 'm-none';
  const pct = correct / total * 100;
  if (pct >= 85) return isSlow(timed, fast) ? 'm-mid' : 'm-good';
  if (pct >= 60) return 'm-mid';
  return 'm-bad';
}
function isSlow(timed, fast) {
  return (timed || 0) >= MIN_TIMED && (fast || 0) / timed < FAST_SHARE;
}
/* Like masteryClass, but keeps "a few answers so far" visually distinct from
   "never touched". The old code called both m-none, so a child's first
   handful of answers on a table was indistinguishable from no work at all. */
function cellClass(correct, wrong, timed, fast) {
  const total = (correct || 0) + (wrong || 0);
  if (!total) return 'm-none';
  if (total < 5) return 'm-early';
  return masteryClass(correct, wrong, timed, fast);
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
      + `<span class="profile-name">${esc(teacherSession.username)}</span>`;
    btn.classList.add('logged-in');
  } else if (profile) {
    btn.innerHTML = `<span class="profile-emoji">${esc(profile.emoji || '🦉')}</span>`
      + `<span class="profile-name">${esc(profile.username)}</span>`;
    btn.classList.add('logged-in');
  } else {
    btn.innerHTML = `<span class="profile-emoji">👤</span>`
      + `<span class="profile-name">Prijava</span>`;
    btn.classList.remove('logged-in');
  }
  // battle.js se naloži za tem skriptom, ob prvem klicu ga še ni
  if (typeof battleAccessChanged === 'function') battleAccessChanged();
  showPersonalBest();   // drug učenec na isti napravi: njegov rekord, ne prejšnjega
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
    box.className = 'timed-overlay-box auth-box is-login';
    box.innerHTML = `
      <div class="overlay-title">🔑 Prijava</div>
      <div class="overlay-divider"></div>
      <div class="auth-note">Vpiši se v račun, ki ga <strong>že imaš</strong>.</div>
      <label class="auth-label">Uporabniško ime</label>
      <input id="authUser" class="auth-input" autocomplete="off"
             autocapitalize="none" placeholder="npr. nin4" />
      <label class="auth-label">Geslo — poklikaj svoje 4 živali</label>
      <div id="authPickerSlot"></div>
      <button class="overlay-btn overlay-btn-next" id="authLoginBtn">Prijava ✓</button>
      <div class="auth-msg" id="authMsg"></div>
      <div id="authHelpSlot"></div>
      <button class="auth-switch" id="authToTeacher">👨‍🏫 Prijava za učitelje</button>
      <button class="auth-switch auth-secondary" id="authToRegister">Še nimam računa — ustvari novega</button>
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
      if (ok === RPC_UNREACHABLE) {
        btn.disabled = false; btn.textContent = 'Prijava ✓';
        msg.textContent = OFFLINE_MSG;
      } else if (ok) { removeOverlay(); ensureRazred(openStatsOverlay); }
      else {
        btn.disabled = false; btn.textContent = 'Prijava ✓';
        msg.textContent = '❌ Napačno uporabniško ime ali geslo.';
        /* The old screen answered a forgotten password with "create an
           account", which is how one child ended up with four. */
        const help = box.querySelector('#authHelpSlot');
        if (help && !help.innerHTML) {
          help.innerHTML = '<div class="auth-help">🙋 Si pozabil_a geslo ali '
            + 'uporabniško ime?<br><strong>Povej učiteljici</strong> — v nekaj '
            + 'sekundah ti ga ponastavi.<br>Ne delaj novega računa, ker boš '
            + 'izgubil_a vse svoje točke.</div>';
        }
      }
    });
    return;
  }

  if (view === 'teacher') {
    box.className = 'timed-overlay-box auth-box';
    box.innerHTML = `
      <div class="overlay-title" style="color:#f0a500">👨‍🏫 Prijava za učitelje</div>
      <div class="overlay-divider"></div>
      <label class="auth-label">E-naslov</label>
      <input id="tUser" class="auth-input" type="email" autocomplete="username"
             autocapitalize="none" placeholder="ime.priimek@sola.si" />
      <label class="auth-label">Geslo</label>
      <input id="tPin" class="auth-input" type="password" autocomplete="current-password" />
      <button class="overlay-btn overlay-btn-next" id="tLoginBtn">Prijava ✓</button>
      <div class="auth-msg" id="tMsg"></div>
      <button class="auth-switch" id="tToReg">Nimaš računa? Ustvari ga</button>
      <button class="auth-switch" id="tToLogin">← Nazaj na prijavo učencev</button>
      <button class="auth-switch auth-close" id="tClose">Zapri</button>`;
    box.querySelector('#tClose').addEventListener('click', removeOverlay);
    box.querySelector('#tToLogin').addEventListener('click', () => renderAuthView('login'));
    box.querySelector('#tToReg').addEventListener('click', () => renderAuthView('teacherReg'));
    const doTeacherLogin = async () => {
      const user = box.querySelector('#tUser').value.trim();
      const pin = box.querySelector('#tPin').value;
      const msg = box.querySelector('#tMsg');
      if (!user || !pin) { msg.textContent = 'Vpiši e-naslov in geslo.'; return; }
      const btn = box.querySelector('#tLoginBtn');
      btn.disabled = true; btn.textContent = 'Preverjam …';
      const ok = await loginTeacher(user, pin);
      btn.disabled = false; btn.textContent = 'Prijava ✓';
      if (ok === RPC_UNREACHABLE) {
        msg.textContent = OFFLINE_MSG;
      } else if (ok === TEACHER_PENDING) {
        msg.innerHTML = '⏳ Račun je ustvarjen, a še ni potrjen.<br>'
                      + 'Ko ga Nino odobri, se boš lahko prijavil_a.';
      } else if (ok) {
        removeOverlay();
        // Accounts created in bulk start on a password Nino chose. Without a
        // forced stop nobody would ever replace it, and those passwords are
        // guessable, so the dashboard stays shut until it is changed.
        if (ok.mustChange) openTeacherPassword(true);
        else openTeacherDashboard();
      }
      else {
        msg.textContent = '❌ Napačen e-naslov ali geslo.';
      }
    };
    box.querySelector('#tLoginBtn').addEventListener('click', doTeacherLogin);
    box.querySelector('#tPin').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); doTeacherLogin(); }
    });
    return;
  }

  if (view === 'teacherReg') {
    box.className = 'timed-overlay-box auth-box';
    box.innerHTML = `
      <div class="overlay-title" style="color:#f0a500">👨‍🏫 Nov učiteljski račun</div>
      <div class="overlay-divider"></div>
      <label class="auth-label">E-naslov</label>
      <input id="trEmail" class="auth-input" type="email" autocomplete="username"
             autocapitalize="none" placeholder="ime.priimek@sola.si" />
      <label class="auth-label">Geslo (vsaj 8 znakov)</label>
      <input id="trPass" class="auth-input" type="password" autocomplete="new-password" />
      <label class="auth-label">Ponovi geslo</label>
      <input id="trPass2" class="auth-input" type="password" autocomplete="new-password" />
      <label class="auth-label">Šolska koda</label>
      <input id="trCode" class="auth-input" autocomplete="off" autocapitalize="none"
             placeholder="dobiš jo pri Ninotu" />
      <button class="overlay-btn overlay-btn-next" id="trBtn">Ustvari račun ✓</button>
      <div class="auth-msg" id="trMsg"></div>
      <button class="auth-switch" id="trToLogin">← Nazaj na prijavo</button>
      <button class="auth-switch auth-close" id="trClose">Zapri</button>`;
    box.querySelector('#trClose').addEventListener('click', removeOverlay);
    box.querySelector('#trToLogin').addEventListener('click', () => renderAuthView('teacher'));
    box.querySelector('#trBtn').addEventListener('click', async () => {
      const email = box.querySelector('#trEmail').value.trim();
      const p1 = box.querySelector('#trPass').value;
      const p2 = box.querySelector('#trPass2').value;
      const code = box.querySelector('#trCode').value.trim();
      const msg = box.querySelector('#trMsg');
      if (!email)        { msg.textContent = 'Vpiši svoj e-naslov.'; return; }
      if (p1.length < 8) { msg.textContent = 'Geslo naj ima vsaj 8 znakov.'; return; }
      if (p1 !== p2)     { msg.textContent = 'Gesli se ne ujemata.'; return; }
      if (!code)         { msg.textContent = 'Vpiši šolsko kodo.'; return; }
      const btn = box.querySelector('#trBtn');
      btn.disabled = true; btn.textContent = 'Ustvarjam …';
      const res = await registerTeacher(email, p1, code);
      if (res === 'PENDING') {
        box.innerHTML = `
          <div class="overlay-title" style="color:#4caf50">✅ Račun ustvarjen</div>
          <div class="overlay-divider"></div>
          <div class="auth-msg">Račun za <strong>${esc(email)}</strong> je ustvarjen,
            a še <strong>ni aktiven</strong>.</div>
          <div class="auth-msg">Nino ga mora še potrditi. Ko to stori,
            se prijaviš s tem e-naslovom in geslom.</div>
          <button class="overlay-btn overlay-btn-next" id="trDone">V redu</button>`;
        box.querySelector('#trDone').addEventListener('click', removeOverlay);
        return;
      }
      btn.disabled = false; btn.textContent = 'Ustvari račun ✓';
      const errors = {
        BAD_CODE:      '❌ Šolska koda ni pravilna.',
        BAD_EMAIL:     '❌ E-naslov ni veljaven.',
        WEAK_PASSWORD: '❌ Geslo naj ima vsaj 8 znakov.',
        EXISTS:        '❌ Račun s tem e-naslovom že obstaja.'
      };
      msg.textContent = res === RPC_UNREACHABLE ? OFFLINE_MSG
                      : (errors[res] || '❌ Napaka pri ustvarjanju računa.');
    });
    return;
  }

  /* register */
  box.className = 'timed-overlay-box auth-box is-register';
  box.innerHTML = `
    <div class="overlay-title">✨ Nov račun</div>
    <div class="overlay-divider"></div>
    <div class="auth-warn">⚠️ Nov račun ustvari <strong>samo, če ga še nimaš</strong>.<br>
      Če si geslo pozabil_a, ti ga učiteljica ponastavi — tvoje točke ostanejo.</div>
    <label class="auth-label">Tvoje ime</label>
    <input id="regName" class="auth-input" autocomplete="off" maxlength="20"
           placeholder="npr. Nino" />
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
    const name = box.querySelector('#regName').value.trim().slice(0, 20);
    const number = box.querySelector('#regNumber').value.replace(/[^0-9]/g, '').slice(0, 3);
    const seq = picker.getSeq();
    const msg = box.querySelector('#regMsg');
    if (name.length < 1)   { msg.textContent = 'Vpiši svoje ime.'; return; }
    if (!number)           { msg.textContent = 'Vpiši svojo najljubšo številko.'; return; }
    if (!seq)              { msg.textContent = 'Izberi vse 4 živali za geslo.'; return; }
    const btn = box.querySelector('#regBtn');
    btn.disabled = true; btn.textContent = 'Ustvarjam …';
    const ok = await registerStudent(name, number, chosenEmoji, seq);
    if (ok === RPC_UNREACHABLE) {
      btn.disabled = false; btn.textContent = 'Ustvari račun ✓';
      msg.textContent = OFFLINE_MSG;
    } else if (ok) {
      box.innerHTML = `
        <div class="overlay-title" style="color:#4caf50">✅ Račun ustvarjen!</div>
        <div class="overlay-divider"></div>
        <div class="reg-done-emoji">${esc(ok.emoji)}</div>
        <div class="reg-done-label">Tvoje uporabniško ime je</div>
        <div class="reg-done-user">${esc(ok.username)}</div>
        <div class="auth-msg">📌 Dobro si ga zapomni — rabil ga boš za prijavo!</div>
        <button class="overlay-btn overlay-btn-next" id="regDoneBtn">Naprej ➡️</button>`;
      box.querySelector('#regDoneBtn').addEventListener('click', () => {
        removeOverlay();
        ensureRazred(openStatsOverlay);
      });
    } else {
      btn.disabled = false; btn.textContent = 'Ustvari račun ✓';
      msg.textContent = '❌ Napaka pri ustvarjanju računa. Poskusi znova.';
    }
  });
}

/* ── Stats dashboard ── */
async function openStatsOverlay() {
  if (!profile) { openAuthOverlay('login'); return; }
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box stats-box">
      <button class="medal-modal-close" id="statsClose" title="Zapri">✕</button>
      <div class="stats-header">
        <span class="stats-emoji">${esc(profile.emoji || '🦉')}</span>
        <div>
          <div class="stats-username">${esc(profile.username)}</div>
          <div class="stats-subname">${esc(profile.display_name || '')}</div>
        </div>
        <button class="stats-logout" id="statsLogout">🚪 Odjava</button>
      </div>
      <div class="stats-section-title">📚 Poštevanke</div>
      <div class="ptable-toggle" id="ptableToggle">
        <button class="ptable-tog-btn active" data-w="recent">Zadnja 2 tedna</button>
        <button class="ptable-tog-btn" data-w="all">Ves čas</button>
      </div>
      <div class="ptable-list" id="ptableList">
        <div class="comp-board-empty">Nalagam …</div>
      </div>
      <div class="ptable-legend">
        <span><span class="ptable-chip m-good"></span> pravilno in hitro</span>
        <span><span class="ptable-chip m-mid"></span> še vadi</span>
        <span><span class="ptable-chip m-bad"></span> veliko napak</span>
        <span>🐢 pravilno, a počasi</span>
      </div>
      <div class="ptable-tip" id="ptableTip"></div>
      <div id="do20Section" style="display:none">
        <div class="stats-section-title">➕ Računi do 20</div>
        <div class="ptable-list" id="do20List"></div>
      </div>
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
  /* ── Poštevanke section ── */
  const [tableRows, speedRows, do20Rows] = await Promise.all([
    fetchStudentTableStats(),
    supabaseRPC('get_my_speed', { p_student: profile.id }),
    supabaseRPC('get_my_do20', { p_student: profile.id })
  ]);
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
    for (const r of asRows(speedRows)) {
      if (window === 'recent' && r.day < recentSince) continue;
      const a = agg[r.table_n + '_' + r.op];
      if (!a) continue;
      a.n = (a.n || 0) + (r.timed || 0);
      a.f = (a.f || 0) + (r.fast || 0);
    }
    return agg;
  }
  function chip(cell) {
    const c = cell ? cell.c : 0, w = cell ? cell.w : 0;
    const pct = masteryPct(c, w);
    const cls = masteryClass(c, w, cell && cell.n, cell && cell.f);
    // rumeno pri visoki točnosti pomeni "pravilno, a prepočasi" — želva to pove brez legende
    const slow = pct !== null && pct >= 85 && cls === 'm-mid';
    const txt = pct === null ? '—' : pct + '%' + (slow ? ' 🐢' : '');
    return `<span class="ptable-chip ${cls}">${txt}</span>`;
  }
  function renderPtable(window) {
    const agg = aggTables(window);
    const list = div.querySelector('#ptableList');
    let worst = null, worstPct = 101, slow = null;
    list.innerHTML = '';
    for (let t = 1; t <= 10; t++) {
      const x = agg[t + '_x'], d = agg[t + '_d'];
      [x, d].forEach(cell => {
        if (cell) {
          const tot = cell.c + cell.w;
          if (tot >= 5) {
            const p = cell.c / tot * 100;
            if (p < worstPct) { worstPct = p; worst = t; }
            if (p >= 85 && slow === null && isSlow(cell.n, cell.f)) slow = t;
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
    renderDo20(window);
    const tip = div.querySelector('#ptableTip');
    if (worst !== null && worstPct < 85) {
      tip.textContent = `💡 Največ napak: poštevanka ${worst}. Tam še vadi!`;
    } else if (slow !== null) {
      tip.textContent = `⚡ Poštevanka ${slow} je pravilna — zdaj pa še hitreje, pod ${FAST_SECONDS} sekunde!`;
    } else if (worst !== null) {
      tip.textContent = '🎉 Odlično — vse poštevanke dobro obvladaš!';
    } else {
      tip.textContent = 'Igraj nekaj računov, da se pokaže napredek.';
    }
  }
  /* Do 20 se pokaže samo otroku, ki je kaj vadil — petošolcu bi bila prazna
     tabela samo v napoto. Isto okno (2 tedna / ves čas) kot poštevanke. */
  function renderDo20(window) {
    const rows = asRows(do20Rows);
    const sec = div.querySelector('#do20Section');
    if (!rows.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    const agg = {};
    for (const r of rows) {
      if (window === 'recent' && r.day < recentSince) continue;
      const a = agg[r.grp + '_' + r.op] || (agg[r.grp + '_' + r.op] = { c: 0, w: 0, n: 0, f: 0 });
      a.c += r.correct || 0; a.w += r.wrong || 0;
      a.n += r.timed || 0;   a.f += r.fast || 0;
    }
    div.querySelector('#do20List').innerHTML = DO20_GROUPS.map(g => `
      <div class="ptable-row">
        <span class="ptable-num ptable-grp">${g.label}</span>
        <span class="ptable-ops">
          <span class="ptable-op">+ ${chip(agg[g.key + '_p'])}</span>
          <span class="ptable-op">${MINUS} ${chip(agg[g.key + '_m'])}</span>
        </span>
      </div>`).join('');
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
  // Also covers a reload: the session comes back from localStorage, so the
  // check has to sit on the dashboard door, not only on the login path.
  if (teacherSession.mustChange) { openTeacherPassword(true); return; }
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box teacher-box">
      <button class="medal-modal-close" id="tdClose" title="Zapri">✕</button>
      <div class="overlay-title" style="color:#f0a500">👨‍🏫 Učiteljski pregled</div>
      <div class="td-controls">
        <div class="ptable-toggle" id="tdWinToggle">
          <button class="ptable-tog-btn active" data-w="today">Danes</button>
          <button class="ptable-tog-btn" data-w="recent">Zadnja 2 tedna</button>
          <button class="ptable-tog-btn" data-w="all">Ves čas</button>
        </div>
      </div>
      <div class="td-controls">
        <div class="ptable-toggle" id="tdViewToggle">
          <button class="ptable-tog-btn active" data-v="lesson">👥 Učenci</button>
          <button class="ptable-tog-btn" data-v="matrix">📚 Poštevanke</button>
          <button class="ptable-tog-btn" data-v="do20">➕ Do 20</button>
        </div>
        <select class="td-razred-select" id="tdRazredSelect" title="Filtriraj po razredu">
          <option value="">Vsi razredi</option>
        </select>
        <button class="td-names-btn" id="tdNames"
                title="Pokaži ali skrij imena učencev">🙈 Imena skrita</button>
      </div>
      <div class="td-statusline">
        <span class="td-live" id="tdLive"></span>
        <span class="td-classsum" id="tdClassSum"></span>
      </div>
      <div class="td-dupwarn" id="tdDupWarn" style="display:none"></div>
      <div class="td-legend" id="tdLegend">
        <span><span class="ptable-chip m-good"></span> obvlada (pravilno in hitro)</span>
        <span><span class="ptable-chip m-mid"></span> še vadi</span>
        <span><span class="ptable-chip m-bad"></span> potrebuje vajo</span>
        <span><span class="ptable-chip m-early"></span> premalo odgovorov</span>
        <span><span class="ptable-chip m-none"></span> ni podatkov</span>
        <span class="td-legend-ops" id="tdLegendOps">zgoraj × · spodaj ÷</span>
      </div>
      <div class="td-grid-wrap" id="tdGridWrap">
        <div class="comp-board-empty">Nalagam …</div>
      </div>
      <div class="td-hint">💡 Klikni na ime učenca, če želiš popraviti njegovo ime ali ponastaviti geslo.</div>
      <div class="td-footer">
        <button class="overlay-btn overlay-btn-next" id="tdPrint">🖨️ Natisni za razred (A4)</button>
        <button class="overlay-btn overlay-btn-ghost" id="tdBattles">⚔️ Bitke v živo</button>
        <button class="overlay-btn overlay-btn-ghost" id="tdNamesPrint">📋 Seznam uporabniških imen</button>
        <button class="overlay-btn overlay-btn-ghost" id="tdPass">🔑 Spremeni svoje geslo</button>
        <button class="overlay-btn overlay-btn-ghost" id="tdLogout">Odjava</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) removeOverlay(); });
  div.querySelector('#tdClose').addEventListener('click', removeOverlay);
  div.querySelector('#tdLogout').addEventListener('click', () => {
    logoutTeacher();
    removeOverlay();
  });
  div.querySelector('#tdPass').addEventListener('click', openTeacherPassword);
  div.querySelector('#tdPrint').addEventListener('click', () => printSheet());
  div.querySelector('#tdNamesPrint').addEventListener('click', () => printNames());
  div.querySelector('#tdBattles').addEventListener('click', () => openBattleBoard());

  const wrap = div.querySelector('#tdGridWrap');
  const cache = { today: null, recent: null };
  let curWin = 'today';
  let curRazred = '';
  let curView = 'lesson';
  let showIdle = false;
  /* Namenoma se NE shrani in ob vsakem odprtju začne skrito: pregled se
     projicira na tablo, in če bi si nastavitev zapomnil, bi se imena
     pokazala razredu, preden bi učiteljica sploh utegnila reagirati. */
  let showNames = false;
  let lastFetchTs = 0;
  let offline = false;
  let refreshing = false;
  const razredMap = {};   // username → razred

  function buildStudents(rows, modeRows, speedRows, do20Rows) {
    const students = {};
    for (const r of asRows(rows)) {
      if (!students[r.username]) {
        students[r.username] = { username: r.username, emoji: r.emoji,
                                 display_name: velikaZacetnica(r.display_name),
                                 cells: {}, modes: {} };
      }
      if (r.table_n != null) {
        students[r.username].cells[r.table_n + '_' + r.op] = {
          all:    { c: +r.correct_all,    w: +r.wrong_all },
          recent: { c: +r.correct_recent, w: +r.wrong_recent }
        };
      }
    }
    /* Ločen vir: način igre je v `stats`, ne v `table_stats`. Vrstic je malo
       (učenec × trije načini), zato jih samo pripnemo k učencu. Če funkcije
       v bazi še ni, je modeRows null in vse ostane po starem. */
    for (const r of asRows(modeRows)) {
      const s = students[r.username];
      if (!s || !r.mode) continue;
      s.modes[r.mode] = {
        all:    { c: +r.correct_all,    w: +r.wrong_all },
        recent: { c: +r.correct_recent, w: +r.wrong_recent }
      };
    }
    /* Hitrost (supabase_hitrost.sql) — pripne se k obstoječim predalom.
       Brez funkcije v bazi je speedRows null in velja samo točnost. */
    for (const r of asRows(speedRows)) {
      const s = students[r.username];
      const cell = s && s.cells[r.table_n + '_' + r.op];
      if (!cell) continue;
      cell.all.n    = +r.timed_all;    cell.all.f    = +r.fast_all;
      cell.recent.n = +r.timed_recent; cell.recent.f = +r.fast_recent;
    }
    /* Do 20 (supabase_do20.sql) — ločeni predali, ne mešajo se s
       poštevanko, Brihtometrom ali stolpcem Odgovori. */
    for (const r of asRows(do20Rows)) {
      const s = students[r.username];
      if (!s) continue;
      (s.do20 = s.do20 || {})[r.grp + '_' + r.op] = {
        all:    { c: +r.correct_all,    w: +r.wrong_all,    n: +r.timed_all,    f: +r.fast_all },
        recent: { c: +r.correct_recent, w: +r.wrong_recent, n: +r.timed_recent, f: +r.fast_recent }
      };
    }
    return Object.values(students).sort(poAbecedi);
  }

  /* 'all' reads its numbers from the correct_all columns, which do not depend
     on p_recent_since, so it can share whatever the 'today' fetch returned. */
  function cacheKeyFor(win) { return win === 'recent' ? 'recent' : 'today'; }

  async function fetchWindow(key) {
    const since = key === 'recent' ? getRecentSinceKey() : getTodayKey();
    /* Hkrati, ne zaporedno: pregled se osvežuje vsakih 15 s, in dva
       zaporedna klica bi ta interval po nepotrebnem podvojila.
       get_class_modes je novejši — če ga v bazi še ni, vrne null in
       pregled dela naprej, samo brez ikon načinov. */
    const [rows, modeRows, speedRows, do20Rows] = await Promise.all([
      supabaseRPCAll('get_class_overview', {
        p_teacher_id: teacherSession.id, p_recent_since: since
      }, 'username,table_n,op'),
      supabaseRPCAll('get_class_modes', {
        p_teacher_id: teacherSession.id, p_recent_since: since
      }, 'username,mode'),
      supabaseRPCAll('get_class_speed', {
        p_teacher_id: teacherSession.id, p_recent_since: since
      }, 'username,table_n,op'),
      supabaseRPCAll('get_class_do20', {
        p_teacher_id: teacherSession.id, p_recent_since: since
      }, 'username,grp,op')
    ]);
    return rows === RPC_UNREACHABLE ? null : buildStudents(rows, modeRows, speedRows, do20Rows);
  }

  async function ensureWindow(win) {
    const key = cacheKeyFor(win);
    if (cache[key]) return;
    const built = await fetchWindow(key);
    if (built) { cache[key] = built; lastFetchTs = Date.now(); offline = false; }
    else offline = true;
  }

  /* Pull again without destroying what is on screen: a failed poll keeps the
     last good board and flags it, rather than blanking the class mid-lesson. */
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    updateLive();
    try {
      const key = cacheKeyFor(curWin);
      const built = await fetchWindow(key);
      if (built) {
        cache[key] = built;
        lastFetchTs = Date.now();
        offline = false;
        renderGrid();
      } else {
        offline = true;
      }
    } finally {
      refreshing = false;
      updateLive();
    }
  }

  function updateLive() {
    const el = div.querySelector('#tdLive');
    if (!el) return;
    if (offline) { el.innerHTML = '<span class="tl-dot warn"></span> ni povezave'; return; }
    if (refreshing) { el.innerHTML = '<span class="tl-dot on"></span> osvežujem …'; return; }
    const age = lastFetchTs ? Math.round((Date.now() - lastFetchTs) / 1000) : null;
    el.innerHTML = '<span class="tl-dot on"></span> v živo'
      + (age === null ? '' : ` · osveženo pred ${age} s`);
  }

  function activeList() {
    return cache[cacheKeyFor(curWin)] || [];
  }

  /* Everyone in the selected class — including those who have not started,
     which is exactly who a teacher is looking for mid-lesson. */
  function baseList() {
    const list = activeList();
    /* "Vsi razredi" so samo učenci; obiskovalci imajo svojo izbiro. */
    return curRazred ? list.filter(s => razredMap[s.username] === curRazred)
                     : list.filter(s => razredMap[s.username] !== OBISK);
  }

  const OP_SIGN = { x: '×', d: '÷' };

  /* Brez besed ob vsaki vrstici — 25 vrstic × tri besede je stena besedila.
     Pomen ikon pove legenda pod seznamom, `title` pa natančno številko. */
  const MODES = [
    { key: 'keypad',     icon: '⌨️', label: 'Tipkovnica' },
    { key: 'quiz',       icon: '🎯', label: 'Kviz' },
    { key: 'tekmovanje', icon: '🏆', label: 'Tekmovanje' },
    { key: 'bitka',      icon: '⚔️', label: 'Bitka' }
  ];
  /* 10 poštevank × (× in ÷) — imenovalec Brihtometra je za vse enak. */
  const BUCKETS = 20;

  /* Abecedno po tistem, kar je v vrstici dejansko izpisano: ko so imena
     prikazana, učiteljica išče "Nace", ne "nac5". Slovenska abeceda, da se
     č, š in ž uvrstijo pravilno in ne za z. */
  function abecedniKljuc(s) {
    return (showNames && s.display_name ? s.display_name : s.username) || '';
  }
  function poAbecedi(a, b) {
    return abecedniKljuc(a).localeCompare(abecedniKljuc(b), 'sl', { sensitivity: 'base' });
  }

  /* Uporabniško ime ostane vidno tudi ob prikazanih imenih: učiteljica mora
     povezavo med njima videti, sicer naslednjič spet ne ve, kdo je adr90. */
  function imeUcenca(s) {
    const uporabnik = `<span class="td-uname">${esc(s.username)}</span>`;
    if (!showNames || !s.display_name) return esc(s.username);
    return `${esc(s.display_name)} ${uporabnik}`;
  }

  /* Roll a student's 20 table/op buckets up into the things that actually
     matter while a lesson is running. */
  function summarise(s, slot) {
    let c = 0, w = 0, worst = null, worstPct = 101, mastered = 0;
    for (const key of Object.keys(s.cells)) {
      const cell = s.cells[key];
      /* Brihtometer se vedno računa iz vsega časa, tudi kadar je izbrano
         "danes": obvladanje je trajno stanje, v enem samem dnevu pa nihče
         ne nabere petih odgovorov v vsakem predalu — v oknu "danes" bi
         zato pri vseh pisalo 0/20 in stolpec ne bi povedal ničesar. */
      const a = cell.all;
      if (a && masteryClass(a.c, a.w, a.n, a.f) === 'm-good') mastered++;

      const v = cell[slot];
      if (!v) continue;
      c += v.c; w += v.w;
      const tot = v.c + v.w;
      // 3 attempts is enough to point a teacher at a table; 5 was so strict
      // that nothing showed until the lesson was nearly over.
      if (tot >= 3) {
        const p = v.c / tot * 100;
        if (p < worstPct) { worstPct = p; worst = key; }
      }
    }

    /* Razčlenitev po načinu igre. `stats` in `table_stats` beležita iste
       odgovore, zato sta vsoti enaki — številko v vrstici raje seštejemo iz
       načinov, da je vedno natanko vsota prikazanih ikon. Kadar funkcije v
       bazi še ni, obvelja seštevek predalov in ikon preprosto ni. */
    const byMode = MODES.map(m => {
      const v = s.modes && s.modes[m.key] && s.modes[m.key][slot];
      return { icon: m.icon, label: m.label, c: v ? v.c : 0, w: v ? v.w : 0 };
    });
    const hasModes = byMode.some(m => m.c + m.w > 0);
    const correct = hasModes ? byMode.reduce((a, m) => a + m.c, 0) : c;
    const wrong   = hasModes ? byMode.reduce((a, m) => a + m.w, 0) : w;
    const total = correct + wrong;
    return {
      correct, wrong, answers: total,
      pct: total ? Math.round(correct / total * 100) : null,
      weak: (worst && worstPct < 85) ? worst : null,
      mastered,
      byMode: hasModes ? byMode.filter(m => m.c + m.w > 0) : []
    };
  }

  /* "63 / ✔34" — koliko odgovorov in koliko od tega pravilnih. Napačni se
     nikjer ne seštevajo v dosežek; vidni so samo kot razlika med številkama
     in kot barva, ki takoj izda otroka, ki zgolj klika. */
  function ansCell(r) {
    if (!r.answers) return '<span class="tl-ans tl-ans-none">—</span>';
    const chips = r.byMode.map(m =>
      `<span class="tl-mode" title="${m.label}: ${m.c} pravilnih od ${m.c + m.w}">`
      + `${m.icon}&#8202;${m.c}</span>`).join('');
    return `<span class="tl-ans" title="${r.answers} odgovorov, ${r.correct} pravilnih (${r.pct}%)">
        <span class="tl-ans-line">${r.answers}<span class="tl-ans-sep">/</span>`
      + `<span class="tl-ans-ok ${cellClass(r.correct, r.wrong)}">✔${r.correct}</span></span>`
      + (chips ? `<span class="tl-modes">${chips}</span>` : '')
      + `</span>`;
  }

  /* Brihtometer: koliko od 20 predalov učenec obvlada (≥5 odgovorov in
     ≥85 % pravilnih — isto pravilo kot barve v mreži). Ni ga mogoče
     napihniti: 300× poštevanka 10 prinese natanko 1/20. */
  function bmCell(n) {
    const pct = Math.round(n / BUCKETS * 100);
    /* Preliv mora biti raztegnjen čez CELO črtico, ne čez napolnjeni del —
       sicer se pri 2/20 stisne vanj in je tudi tak otrok videti zelen.
       background-size ga poveča nazaj na širino črtice, zato je barva
       odvisna od tega, kako daleč si, ne od tega, kako dolg je kos. */
    const bg = n ? `;background-size:${Math.round(BUCKETS / n * 100)}% 100%` : '';
    return `<span class="tl-bm" title="Brihtometer: ${n} od ${BUCKETS} obvladanih poštevank`
      + ` (vsaj 5 odgovorov, vsaj 85 % pravilnih in pravilni večinoma hitreje kot v ${FAST_SECONDS} s).`
      + ` Šteje ves čas, ne glede na izbrano obdobje.">`
      + `<span class="tl-bm-val">${n}<span class="tl-bm-max">/${BUCKETS}</span></span>`
      + `<span class="tl-bm-bar"><span class="tl-bm-fill" style="width:${pct}%${bg}"></span></span>`
      + `</span>`;
  }

  /* Split off students with nothing in this window, and fold them away once
     there are more than a screenful — otherwise a school-wide view is 100+
     dead rows burying the handful actually working. */
  function splitIdle(list, slot) {
    const active = [], idle = [];
    for (const s of list) (summarise(s, slot).answers ? active : idle).push(s);
    return { active, idle, folded: !showIdle && idle.length > 8 };
  }
  function foldButton(n) {
    return `<button class="tl-more" id="tlMore">👀 Pokaži še ${n}, ki še niso začeli</button>`;
  }
  function wireFold() {
    const more = wrap.querySelector('#tlMore');
    if (more) more.addEventListener('click', () => { showIdle = true; renderGrid(); });
  }

  function renderLesson() {
    const slot = curWin === 'all' ? 'all' : 'recent';
    const rows = baseList().map(s => Object.assign({ s }, summarise(s, slot)));
    if (!rows.length) {
      wrap.innerHTML = `<div class="comp-board-empty">${
        curRazred ? `V razredu ${curRazred} ni učencev.` : 'Še ni podatkov o učencih.'}</div>`;
      return;
    }
    /* Whoever needs help first, then whoever has not started.
       Ranking on raw accuracy alone buries a child who has 4 answers and got
       3 wrong beneath one sitting at 95% over 60 — the opposite of useful.
       Ranking on it unsmoothed lets a single unlucky answer top the list. So
       pull small samples toward 50% and sort on that: a struggling beginner
       surfaces, a one-off mistake does not. */
    /* Abecedno, ne več po tem, kdo najbolj potrebuje pomoč: v razredu s
       25 učenci je iskanje določenega otroka pogostejše kot iskanje
       najšibkejšega, tega pa še vedno izda rdeča točnost. */
    rows.sort((a, b) => poAbecedi(a.s, b.s));

    const started = rows.filter(r => r.answers > 0);
    const idleCount = rows.length - started.length;
    const folded = !showIdle && idleCount > 8;
    const shown = folded ? started : rows;

    /* "ODGOVORI", "BRIHTOMETER" and "NAJŠIBKEJŠA" are single unbreakable
       words — on a phone no column width or wrapping saves them, so use
       short labels there. */
    const narrow = window.matchMedia('(max-width: 600px)').matches;
    const H = narrow
      ? ['Učenec', 'Odg.', 'Brihta', 'Šibka']
      : ['Učenec', 'Odgovori', 'Brihtometer', 'Najšibkejša'];
    const head = `<div class="tl-row tl-head">
        <span>${H[0]}</span><span class="tl-num">${H[1]}</span>
        <span class="tl-num">${H[2]}</span><span class="tl-weak">${H[3]}</span>
      </div>`;
    const body = shown.map(r => {
      const rz = razredMap[r.s.username];
      const idle = r.answers === 0;
      const weakTxt = r.weak
        ? `${r.weak.split('_')[0]} ${OP_SIGN[r.weak.split('_')[1]]}`
        : '—';
      return `<div class="tl-row${idle ? ' tl-idle' : ''}">
        <span class="tl-name" data-username="${esc(r.s.username)}"
              title="Klikni za ponastavitev gesla">
          <span class="tl-dot ${idle ? 'off' : 'on'}"></span>
          ${esc(r.s.emoji || '🦉')} ${imeUcenca(r.s)}${
            !curRazred && rz ? `<span class="td-razred">${razredLabel(rz)}</span>` : ''}
        </span>
        ${ansCell(r)}
        ${bmCell(r.mastered)}
        <span class="tl-weak">${weakTxt}</span>
      </div>`;
    }).join('');
    const emptyNote = (folded && !started.length)
      ? '<div class="comp-board-empty">Nihče še ni vadil.</div>' : '';
    /* Ikone brez legende so uganka, `title` pa se na tablici nikoli ne
       pokaže — ista past kot pri oznakah × in ÷ v mreži. Legenda je pod
       seznamom, da vrstice same ostanejo brez besedila. */
    const anyModes = shown.some(r => r.byMode.length);
    const legend = `<div class="tl-legend">${
      anyModes ? MODES.map(m =>
        `<span>${m.icon} ${m.label.toLowerCase()}</span>`).join('') : ''
      }<span class="tl-legend-note">Brihtometer = obvladane poštevanke od ${BUCKETS}</span></div>`;
    wrap.innerHTML = `<div class="td-lesson">${head}${body}${emptyNote}${
      folded ? foldButton(idleCount) : ''}${legend}</div>`;
    wireFold();
  }

  function updateClassSum(rows) {
    const el = div.querySelector('#tdClassSum');
    if (!el) return;
    const active = rows.filter(r => r.answers > 0).length;
    const total = rows.reduce((a, r) => a + r.answers, 0);
    const correct = rows.reduce((a, r) => a + r.correct, 0);
    el.textContent = rows.length
      ? `${rows.length} učencev · ${active} vadi · ${total} odgovorov, ${correct} pravilnih`
      : '';
  }

  /* Dve Evi v istem razredu: na izpisu jih učiteljica ne loči. Lahko sta
     dva otroka (dodaj začetnico priimka) ali en otrok z dvema računoma
     (združi). Razredi se preverjajo vsak zase — Eva v 4A in Eva v 5B nista
     težava. Kadar so imena skrita (pregled na projektorju), opozorilo
     imen ne izda, samo pove, koliko jih je. */
  function updateDupWarn() {
    const el = div.querySelector('#tdDupWarn');
    if (!el) return;
    const groups = {};
    for (const s of baseList()) {
      const name = s.display_name || s.username || '';
      const rz = razredMap[s.username] || '';
      const k = rz + '|' + name.toLowerCase();
      (groups[k] = groups[k] || { name, rz, n: 0 }).n++;
    }
    const dups = Object.values(groups).filter(g => g.n > 1)
      .sort((a, b) => (a.rz + a.name).localeCompare(b.rz + b.name, 'sl'));
    if (!dups.length) { el.style.display = 'none'; return; }
    el.style.display = '';
    const what = showNames
      ? dups.map(g => `<strong>${esc(g.name)}</strong>${
          !curRazred && g.rz ? ` (${esc(g.rz)})` : ''} ${g.n}×`).join(', ')
      : `${dups.length} ${[, 'ime se ponovi', 'imeni se ponovita', 'imena se ponovijo',
          'imena se ponovijo'][dups.length] || 'imen se ponovi'}`
        + ` — pokaži imena za podrobnosti`;
    /* Zložljivo: na telefonu je navodilo zasedlo pol zaslona nad seznamom.
       Odprto/zaprto ostane med osveževanjem (vsakih nekaj sekund). */
    const open = el.querySelector('details')?.open ? ' open' : '';
    el.innerHTML = `<details${open}><summary>⚠️ Enako ime v razredu: ${what}.</summary>`
      + `<span class="td-dupwarn-how">Klikni ime: <b>dva otroka</b> → dodaj začetnico priimka `
      + `(Eva K.) · <b>en otrok, več računov</b> → 🔗 Združi.</span></details>`;
  }

  function renderGrid() {
    div.querySelector('#tdLegend').style.display = curView === 'lesson' ? 'none' : '';
    div.querySelector('#tdLegendOps').textContent =
      curView === 'do20' ? `zgoraj + · spodaj ${MINUS}` : 'zgoraj × · spodaj ÷';
    // Summary follows the class filter in all views, not just the lesson one.
    const slot = curWin === 'all' ? 'all' : 'recent';
    updateClassSum(baseList().map(s =>
      curView === 'do20' ? summariseDo20(s, slot) : summarise(s, slot)));
    updateDupWarn();
    if (curView === 'lesson') renderLesson();
    else if (curView === 'do20') renderDo20Matrix();
    else renderMatrix();
  }

  function summariseDo20(s, slot) {
    let correct = 0, wrong = 0;
    for (const cell of Object.values(s.do20 || {})) {
      const v = cell[slot];
      if (v) { correct += v.c; wrong += v.w; }
    }
    return { correct, wrong, answers: correct + wrong };
  }

  /* Ista mreža kot pri poštevankah, le stolpci so skupine računov do 20.
     Tisti, ki Do 20 niso vadili (vsi starejši razredi), so zloženi stran. */
  function renderDo20Matrix() {
    const slot = curWin === 'all' ? 'all' : 'recent';
    const active = [], idle = [];
    for (const s of baseList()) (summariseDo20(s, slot).answers ? active : idle).push(s);
    const folded = !showIdle && idle.length > 8;
    const filtered = folded ? active : active.concat(idle);
    if (!filtered.length) {
      wrap.innerHTML = `<div class="comp-board-empty">${
        curRazred ? `V razredu ${curRazred} ni podatkov.` : 'Še ni podatkov o učencih.'}</div>`;
      return;
    }
    let head = '<div class="td-row td-head"><span class="td-name"></span>'
             + '<span class="td-ops td-ops-head"></span>';
    for (const g of DO20_GROUPS) head += `<span class="td-cell td-th td-th-grp">${g.short}</span>`;
    head += '</div>';
    const body = filtered.map(s => {
      const rz = razredMap[s.username];
      const rzTag = (!curRazred && rz) ? `<span class="td-razred">${razredLabel(rz)}</span>` : '';
      let row = `<div class="td-row"><span class="td-name" data-username="${esc(s.username)}"`
        + ` title="Klikni za ponastavitev gesla">${esc(s.emoji || '🦉')} ${imeUcenca(s)}${rzTag}</span>`
        + `<span class="td-ops"><span>+</span><span>${MINUS}</span></span>`;
      for (const g of DO20_GROUPS) {
        const cp = s.do20 && s.do20[g.key + '_p'], cm = s.do20 && s.do20[g.key + '_m'];
        const vp = cp ? cp[slot] : null, vm = cm ? cm[slot] : null;
        const pc = vp ? vp.c : 0, pw = vp ? vp.w : 0;
        const mc = vm ? vm.c : 0, mw = vm ? vm.w : 0;
        const tip = `${g.label}\n+ ${pc}✓/${pw}✗\n${MINUS} ${mc}✓/${mw}✗`;
        if (!pc && !pw && !mc && !mw) {
          row += `<span class="td-cell td-cell-grp m-none" title="${tip}"></span>`;
        } else {
          const pp = masteryPct(pc, pw), mp = masteryPct(mc, mw);
          row += `<span class="td-cell td-cell-grp td-cell-split" title="${tip}">`
            + `<span class="td-half ${vp ? cellClass(pc, pw, vp.n, vp.f) : 'm-none'}">${pp === null ? '–' : pp}</span>`
            + `<span class="td-half ${vm ? cellClass(mc, mw, vm.n, vm.f) : 'm-none'}">${mp === null ? '–' : mp}</span>`
            + `</span>`;
        }
      }
      return row + '</div>';
    }).join('');
    wrap.innerHTML = head + body + (folded ? foldButton(idle.length) : '');
    wireFold();
  }

  function renderMatrix() {
    const slot = curWin === 'all' ? 'all' : 'recent';
    const { active, idle, folded } = splitIdle(baseList(), slot);
    const filtered = folded ? active : active.concat(idle);
    if (!filtered.length) {
      const msg = curRazred
        ? `V razredu ${curRazred} ni podatkov.`
        : 'Še ni podatkov o učencih.';
      wrap.innerHTML = `<div class="comp-board-empty">${msg}</div>`;
      return;
    }
    let head = '<div class="td-row td-head"><span class="td-name"></span>'
             + '<span class="td-ops td-ops-head"></span>';
    for (let t = 1; t <= 10; t++) head += `<span class="td-cell td-th">${t}</span>`;
    head += '</div>';
    const body = filtered.map(s => {
      const rz = razredMap[s.username];
      const rzTag = (!curRazred && rz) ? `<span class="td-razred">${razredLabel(rz)}</span>` : '';
      let row = `<div class="td-row"><span class="td-name" data-username="${esc(s.username)}"`
        + ` title="Klikni za ponastavitev gesla">${esc(s.emoji || '🦉')} ${imeUcenca(s)}${rzTag}</span>`
        // Oznaka ob vsaki vrstici. Na tablici ni prehoda z miško, zato se
        // namig nikoli ne pokaže — brez tega na dotik nihče ne izve, katera
        // polovica je množenje.
        + `<span class="td-ops"><span>×</span><span>÷</span></span>`;
      for (let t = 1; t <= 10; t++) {
        const cx = s.cells[t + '_x'];
        const cd = s.cells[t + '_d'];
        const vx = cx ? cx[slot] : null;
        const vd = cd ? cd[slot] : null;
        const xc = vx ? vx.c : 0, xw = vx ? vx.w : 0;
        const dc = vd ? vd.c : 0, dw = vd ? vd.w : 0;
        const xCls = vx ? cellClass(xc, xw, vx.n, vx.f) : 'm-none';
        const dCls = vd ? cellClass(dc, dw, vd.n, vd.f) : 'm-none';
        const xPct = masteryPct(xc, xw);
        const dPct = masteryPct(dc, dw);
        const xTxt = xPct === null ? '–' : xPct;
        const dTxt = dPct === null ? '–' : dPct;
        // Dve vrstici, brez "Poštevanka N" — številka je že v glavi stolpca.
        const tip = `× ${xc}✓/${xw}✗\n÷ ${dc}✓/${dw}✗`;
        // Only a cell with genuinely nothing behind it renders blank. A few
        // answers used to look identical to "never practised", which kept the
        // board empty for most of a lesson.
        if (!xc && !xw && !dc && !dw) {
          row += `<span class="td-cell m-none" title="${tip}"></span>`;
        } else {
          row += `<span class="td-cell td-cell-split" title="${tip}">`
            + `<span class="td-half ${xCls}">${xTxt}</span>`
            + `<span class="td-half ${dCls}">${dTxt}</span>`
            + `</span>`;
        }
      }
      return row + '</div>';
    }).join('');
    wrap.innerHTML = head + body + (folded ? foldButton(idle.length) : '');
    wireFold();
  }

  /* ── Izpis na en list A4 ──
     Učiteljica med uro v računalnici pomaga otrokom in pregleda ne gleda —
     zato po uri en list: kdo je vadil, v katerem načinu, koliko pravilno in
     narobe, in KATERE poštevanke. Zadnje je bistveno: otrok s 300 odgovori
     je lahko vadil samo 1 in 10, kar se iz števila ne vidi.
     Namenoma malo stolpcev in brez barv (tiskalnik je črno-bel). Brihtometra
     in najšibkejše poštevanke ni: to je pregled ure, ne ocena otroka. */
  /* Kvadratek na poštevanko (× in ÷ skupaj). Napačni odgovori odštevajo:
       ■ zna        pravilni − napačni ≥ PRINT_KNOWS
       ▣ še vadi    vse vmes
       □ ne zna     manj kot PRINT_MIN odgovorov, ali napačnih vsaj toliko
                    kot pravilnih — nevadeno in neznano sta za učiteljico
                    isti signal: tu je treba pomagati.
     Kup kart je 200 (10 × in 10 ÷ na poštevanko), v kvizu in na tipkovnici
     premešan brez ponavljanja: en krog = 20 računov na poštevanko, in za
     črno je treba vsaj 16 pravilnih (80 %). Tekmovanje premeša vsako
     minuto znova, zato je 20 tam le povprečje — PRINT_MIN je zato pol
     kroga, ne cel. */
  const PRINT_KNOWS = 12;
  const PRINT_MIN   = 10;
  const WIN_LABEL = { today: 'Danes', recent: 'Zadnja 2 tedna', all: 'Ves čas' };
  function printSheet() {
    const slot = curWin === 'all' ? 'all' : 'recent';
    const ime = s => (s.display_name || s.username || '');
    /* Isto ime večkrat je skoraj vedno isti otrok z več računi (pozabljeno
       geslo → nov račun). Brez uporabniškega imena jih na papirju ne ločiš. */
    const seen = {};
    for (const s of baseList()) { const k = ime(s).toLowerCase(); seen[k] = (seen[k] || 0) + 1; }
    const imeIzpis = s => esc(ime(s)) + (seen[ime(s).toLowerCase()] > 1 && s.display_name
      ? ` <span class="ps-uname">${esc(s.username)}</span>` : '');
    const rows = baseList()
      .map(s => Object.assign({ s }, summarise(s, slot)))
      .sort((a, b) => ime(a.s).localeCompare(ime(b.s), 'sl', { sensitivity: 'base' }));
    const active = rows.filter(r => r.answers > 0);
    const idle = rows.filter(r => !r.answers);

    const p = sloveniaParts();
    const datum = `${+p.day}. ${+p.month}. ${p.year}`;
    const title = `${razredLabel(curRazred) || 'Vsi razredi'} · ${WIN_LABEL[curWin]}`;
    const withRazred = !curRazred;

    const body = active.map(r => {
      let x = 0, d = 0, boxes = '';
      for (let t = 1; t <= 10; t++) {
        const cx = r.s.cells[t + '_x'], cd = r.s.cells[t + '_d'];
        const vx = cx && cx[slot], vd = cd && cd[slot];
        const nx = vx ? vx.c + vx.w : 0;
        const nd = vd ? vd.c + vd.w : 0;
        const neto = (vx ? vx.c - vx.w : 0) + (vd ? vd.c - vd.w : 0);
        x += nx; d += nd;
        const n = nx + nd;
        const cls = neto >= PRINT_KNOWS ? ' on'
                  : (n < PRINT_MIN || neto <= 0) ? '' : ' few';
        boxes += `<span class="ps-box${cls}">${t}</span>`;
      }
      const racun = x && d ? '× ÷' : x ? '×' : d ? '÷' : '';
      /* Kot v pregledu: ikona načina in število pravilnih, vedno v istem
         vrstnem redu (⌨️ 🎯 🏆), da se stolpec bere navpično. Vsota = ✔. */
      const nacin = r.byMode.map(m =>
        `<span class="ps-modechip">${m.icon}${m.c}</span>`).join('');
      return `<tr>
        <td class="ps-name">${imeIzpis(r.s)}</td>
        ${withRazred ? `<td>${esc(razredLabel(razredMap[r.s.username] || ''))}</td>` : ''}
        <td class="ps-num">${r.correct}</td>
        <td class="ps-num">${r.wrong}</td>
        <td class="ps-mode">${nacin}</td>
        <td class="ps-op">${racun}</td>
        <td class="ps-boxes">${boxes}</td>
      </tr>`;
    }).join('');

    const sheet = document.createElement('div');
    sheet.id = 'printSheet';
    sheet.innerHTML = `
      <div class="ps-head">
        <div class="ps-title">Brihta · ${esc(title)}</div>
        <div class="ps-date">${datum}</div>
      </div>
      ${active.length ? `<table class="ps-table">
        <thead><tr>
          <th class="ps-name">Učenec</th>${withRazred ? '<th>Razred</th>' : ''}
          <th class="ps-num">✔</th><th class="ps-num">✘</th>
          <th class="ps-mode">Način</th><th class="ps-op">Račun</th><th>Poštevanke</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>` : '<p>V tem obdobju ni nihče vadil.</p>'}
      ${idle.length ? `<p class="ps-idle"><strong>Niso vadili (${idle.length}):</strong> ${
        idle.map(r => imeIzpis(r.s)).join(', ')}</p>` : ''}
      <p class="ps-legend">✔ pravilno · ✘ napačno ·
        ⌨️ tipkovnica · 🎯 kviz · 🏆 tekmovanje · ⚔️ bitka (pravilni) ·
        <span class="ps-box on">7</span> zna (pravilni − napačni ≥ ${PRINT_KNOWS}) ·
        <span class="ps-box few">7</span> še vadi ·
        <span class="ps-box">7</span> ne zna ali ni vadil
        (manj kot ${PRINT_MIN} računov ali napačnih vsaj toliko kot pravilnih)</p>`;
    printNode(sheet);
  }
  /* List se pokaže kot predogled z gumbom Natisni in ostane, dokler ga ne
     zapreš. Prej se je odstranil ob 'afterprint' — na iPhonu ta dogodek
     pride takoj, še preden brskalnik list zajame, in tiskanje ni delalo. */
  function printNode(sheet) {
    const old = document.getElementById('printSheet');
    if (old) old.remove();
    const paper = document.createElement('div');
    paper.className = 'ps-paper';
    while (sheet.firstChild) paper.appendChild(sheet.firstChild);
    sheet.className = 'ps-preview';
    sheet.innerHTML = `<div class="ps-toolbar">
        <button class="overlay-btn overlay-btn-next" data-ps="print">🖨️ Natisni</button>
        <button class="overlay-btn overlay-btn-ghost" data-ps="close">✕ Zapri</button>
      </div>`;
    sheet.appendChild(paper);
    document.body.appendChild(sheet);
    /* A4 je širši od telefona: pomanjšaj list, da se vidi cel. */
    const fit = () => {
      const w = paper.offsetWidth / (parseFloat(paper.style.zoom) || 1);
      paper.style.zoom = Math.min(1, (sheet.clientWidth - 16) / w);
    };
    fit();
    window.addEventListener('resize', fit);
    sheet.querySelector('[data-ps="print"]').addEventListener('click', () => window.print());
    sheet.querySelector('[data-ps="close"]').addEventListener('click', () => {
      window.removeEventListener('resize', fit);
      sheet.remove();
    });
    /* Na računalniku se okno za tiskanje odpre takoj, kot prej. */
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) window.print();
  }

  /* ── Seznam imen in uporabniških imen ──
     Za otroka, ki je pozabil uporabniško ime, in za učiteljico, ki mora
     vedeti, kdo je "adr90". Gesel ni: v bazi so samo zakodirana in se jih ne
     da prebrati. Vsi učenci razreda, tudi tisti, ki še niso vadili. Brez
     izbranega razreda gre vsak razred na svojo stran. */
  function printNames() {
    const ime = s => (s.display_name || '');
    const sortKey = s => (s.display_name || s.username || '');
    const byRazred = {};
    for (const s of baseList()) {
      const rz = razredLabel(razredMap[s.username]) || 'Brez razreda';
      (byRazred[rz] = byRazred[rz] || []).push(s);
    }
    const order = RAZREDI.filter(r => byRazred[r]).concat(
      Object.keys(byRazred).filter(r => !RAZREDI.includes(r)));
    const p = sloveniaParts();
    const datum = `${+p.day}. ${+p.month}. ${p.year}`;
    const pages = order.map(rz => {
      const list = byRazred[rz].slice().sort((a, b) =>
        sortKey(a).localeCompare(sortKey(b), 'sl', { sensitivity: 'base' }));
      return `<div class="ps-page">
        <div class="ps-head">
          <div class="ps-title">Brihta · ${esc(rz)} · učenci</div>
          <div class="ps-date">${datum}</div>
        </div>
        <table class="ps-table ps-names">
          <thead><tr><th class="ps-rownum"></th><th>Ime</th><th>Uporabniško ime</th></tr></thead>
          <tbody>${list.map((s, i) => `<tr>
            <td class="ps-rownum">${i + 1}</td>
            <td>${esc(ime(s)) || '<span class="ps-uname">— ime ni vpisano —</span>'}</td>
            <td class="ps-login">${esc(s.username)}</td>
          </tr>`).join('')}</tbody>
        </table>
        <p class="ps-legend">Gesla (4 živali) niso shranjena v berljivi obliki, zato jih
          ni na seznamu. Pozabljeno geslo ponastaviš s klikom na ime učenca v pregledu.</p>
      </div>`;
    }).join('');
    const sheet = document.createElement('div');
    sheet.id = 'printSheet';
    sheet.innerHTML = pages || '<p>Ni učencev.</p>';
    printNode(sheet);
  }

  async function switchWindow(win) {
    curWin = win;
    wrap.innerHTML = '<div class="comp-board-empty">Nalagam …</div>';
    await ensureWindow(win);
    renderGrid();
    updateLive();
  }

  wrap.addEventListener('click', e => {
    // .tl-name je seznam učencev, .td-name mreža — namig pravi "klikni na
    // ime", a je prej deloval samo v mreži
    const nameEl = e.target.closest('.td-name[data-username], .tl-name[data-username]');
    if (!nameEl) return;
    const s = activeList().find(x => x.username === nameEl.dataset.username);
    if (s) openResetPin(s, mergeTargets(s), razredMap[s.username]);
  });

  /* Kam lahko združiš ta račun: isti razred (če ga poznamo), najprej računi z
     istim imenom — to so skoraj vedno podvojeni računi istega otroka. Število
     odgovorov (ves čas) pomaga izbrati tistega, ki ga otrok res uporablja. */
  function mergeTargets(s) {
    const ime = x => (x.display_name || x.username || '').toLowerCase();
    const rz = razredMap[s.username];
    return activeList()
      .filter(x => x.username !== s.username && (!rz || razredMap[x.username] === rz))
      .map(x => ({
        username: x.username,
        label: x.display_name ? `${x.display_name} · ${x.username}` : x.username,
        same: ime(x) === ime(s),
        total: Object.values(x.cells).reduce((a, c) => a + c.all.c + c.all.w, 0)
      }))
      .sort((a, b) => (b.same - a.same) || a.label.localeCompare(b.label, 'sl'));
  }
  div.querySelectorAll('#tdWinToggle .ptable-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
      div.querySelectorAll('#tdWinToggle .ptable-tog-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      switchWindow(b.dataset.w);
    });
  });

  const razSelect = div.querySelector('#tdRazredSelect');
  /* Učiteljica skoraj vedno gleda svoj razred — na telefonu je vsakič znova
     izbirati iz 17 razredov odveč. Zapomni si izbiro na tej napravi. */
  const RAZ_KEY = 'brihta-td-razred-' + teacherSession.id;
  razSelect.addEventListener('change', () => {
    curRazred = razSelect.value; showIdle = false; renderGrid();
    try { localStorage.setItem(RAZ_KEY, curRazred); } catch (e) {}
  });
  const namesBtn = div.querySelector('#tdNames');
  namesBtn.addEventListener('click', () => {
    showNames = !showNames;
    namesBtn.textContent = showNames ? '👁 Imena vidna' : '🙈 Imena skrita';
    namesBtn.classList.toggle('on', showNames);
    renderGrid();
  });

  div.querySelectorAll('#tdViewToggle .ptable-tog-btn').forEach(b => {
    b.addEventListener('click', () => {
      div.querySelectorAll('#tdViewToggle .ptable-tog-btn')
         .forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      curView = b.dataset.v;
      renderGrid();
    });
  });

  /* An iPad turned from portrait to landscape changes which column widths and
     which header labels are right, and both are chosen when the rows are
     built — so rebuild them. Debounced, because resize fires continuously. */
  if (tdResizeHandler) window.removeEventListener('resize', tdResizeHandler);
  let resizeDebounce = null;
  tdResizeHandler = () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(renderGrid, 200);
  };
  window.addEventListener('resize', tdResizeHandler);
  window.addEventListener('orientationchange', tdResizeHandler);

  /* One tick a second: keeps the "osveženo pred N s" label honest and pulls
     fresh data when it goes stale. Cleared by removeOverlay() on close. */
  if (tdRefreshTimer) clearInterval(tdRefreshTimer);
  tdRefreshFn = refresh;
  tdRefreshTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    updateLive();
    if (!refreshing && lastFetchTs && Date.now() - lastFetchTs >= TD_REFRESH_MS) refresh();
  }, 1000);

  // class map for labels + filter (independent of the time window)
  const razRows = await getClassRazreds(teacherSession.id);
  for (const r of asRows(razRows)) {
    if (r.razred) razredMap[r.username] = r.razred;
  }
  const present = RAZREDI.concat(OBISK).filter(r => Object.values(razredMap).includes(r));
  for (const r of present) {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r === OBISK ? '🏡 Obiskovalci' : r;
    razSelect.appendChild(opt);
  }
  let saved = '';
  try { saved = localStorage.getItem(RAZ_KEY) || ''; } catch (e) {}
  if (present.includes(saved)) { curRazred = saved; razSelect.value = saved; }

  await switchWindow('today');
}

/* ── Teacher: change your own password ──
   Accounts created in bulk start on a password Nino picked, so every teacher
   needs a way to replace it without him editing the database. */
function openTeacherPassword(firstLogin) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box auth-box">
      <div class="overlay-title" style="color:#f0a500">${
        firstLogin ? '👋 Prva prijava' : '🔑 Spremeni svoje geslo'}</div>
      <div class="overlay-divider"></div>
      ${firstLogin ? `<div class="auth-msg">Geslo, ki si ga dobila, je začasno.<br>
        Določi svojega, da boš do pregleda dostopala le ti.</div>` : ''}
      <div class="reset-student">${esc(teacherSession ? teacherSession.email || teacherSession.username : '')}</div>
      <label class="auth-label">${firstLogin ? 'Začasno geslo' : 'Staro geslo'}</label>
      <input id="cpOld" class="auth-input" type="password" autocomplete="current-password" />
      <label class="auth-label">Novo geslo (vsaj 8 znakov)</label>
      <input id="cpNew" class="auth-input" type="password" autocomplete="new-password" />
      <label class="auth-label">Ponovi novo geslo</label>
      <input id="cpNew2" class="auth-input" type="password" autocomplete="new-password" />
      <button class="overlay-btn overlay-btn-next" id="cpBtn">Shrani ✓</button>
      <div class="auth-msg" id="cpMsg"></div>
      ${firstLogin
        ? '<button class="auth-switch auth-close" id="cpLogout">Odjava</button>'
        : '<button class="auth-switch auth-close" id="cpCancel">← Nazaj na pregled</button>'}
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  // On a first login the only ways out are changing the password or leaving.
  if (firstLogin) {
    div.querySelector('#cpLogout').addEventListener('click', () => {
      logoutTeacher(); removeOverlay();
    });
  } else {
    div.querySelector('#cpCancel').addEventListener('click', () => openTeacherDashboard());
  }
  div.querySelector('#cpBtn').addEventListener('click', async () => {
    const oldP = div.querySelector('#cpOld').value;
    const n1 = div.querySelector('#cpNew').value;
    const n2 = div.querySelector('#cpNew2').value;
    const msg = div.querySelector('#cpMsg');
    if (!oldP)          { msg.textContent = 'Vpiši staro geslo.'; return; }
    if (n1.length < 8)  { msg.textContent = 'Novo geslo naj ima vsaj 8 znakov.'; return; }
    if (n1 !== n2)      { msg.textContent = 'Novi gesli se ne ujemata.'; return; }
    const btn = div.querySelector('#cpBtn');
    btn.disabled = true; btn.textContent = 'Shranjujem …';
    const res = await changeTeacherPassword(oldP, n1);
    if (res === 'OK') {
      if (teacherSession) { teacherSession.mustChange = false; saveTeacher(); }
      div.querySelector('.timed-overlay-box').innerHTML = `
        <div class="overlay-title" style="color:#4caf50">✅ Geslo spremenjeno</div>
        <div class="overlay-divider"></div>
        <div class="auth-msg">Od zdaj se prijavljaj z novim geslom.</div>
        <button class="overlay-btn overlay-btn-next" id="cpDone">${
          firstLogin ? 'Naprej na pregled ➡️' : 'Nazaj na pregled'}</button>`;
      div.querySelector('#cpDone').addEventListener('click', () => openTeacherDashboard());
      return;
    }
    btn.disabled = false; btn.textContent = 'Shrani ✓';
    const errs = {
      BAD_LOGIN:     '❌ Staro geslo ni pravilno.',
      WEAK_PASSWORD: '❌ Novo geslo naj ima vsaj 8 znakov.',
      NO_EMAIL:      '❌ Ta račun nima e-naslova. Javi se Ninotu.'
    };
    msg.textContent = res === RPC_UNREACHABLE ? OFFLINE_MSG
                    : (errs[res] || '❌ Napaka pri shranjevanju.');
  });
}

/* ── Teacher: reset a student's password ── */
function openResetPin(student, targets, razred) {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box auth-box">
      <div class="overlay-title" style="color:#f0a500">✏️ Učenec</div>
      <div class="overlay-divider"></div>
      <div class="reset-student">${esc(student.emoji || '🦉')} <strong>${esc(student.username)}</strong></div>

      <label class="auth-label">Ime učenca</label>
      <input id="imeInput" class="auth-input" autocomplete="off" maxlength="30"
             value="${esc(student.display_name || '')}" placeholder="npr. Nace" />
      <button class="overlay-btn overlay-btn-ghost" id="imeBtn">Shrani ime ✓</button>
      <div class="auth-msg" id="imeMsg"></div>

      <label class="auth-label">Razred</label>
      <select id="razredSelect" class="td-razred-select td-merge-select">
        ${razred ? '' : '<option value="">— ni izbran —</option>'}
        ${RAZREDI.concat(OBISK).map(r => `<option value="${r}"${r === razred ? ' selected' : ''}>${
          r === OBISK ? '🏡 Obiskovalec (ni učenec)' : r}</option>`).join('')}
      </select>
      <button class="overlay-btn overlay-btn-ghost" id="razredBtn">Premakni v izbrani razred ✓</button>
      <div class="auth-msg" id="razredMsg"></div>
      <div class="overlay-divider"></div>

      <label class="auth-label">Novo geslo — 4 živali</label>
      <div id="resetPickerSlot"></div>
      <button class="overlay-btn overlay-btn-next" id="resetBtn">Ponastavi geslo ✓</button>
      <div class="auth-msg" id="resetMsg"></div>
      <div class="overlay-divider"></div>

      <label class="auth-label">Račun ni več v uporabi?</label>
      <div class="td-merge-help">Prenesi njegovo vadbo v račun, ki ga otrok uporablja.
        Ta račun se potem izbriše.</div>
      <select id="mergeSelect" class="td-razred-select td-merge-select">
        <option value="">— izberi račun —</option>
        ${(targets || []).map(t => `<option value="${esc(t.username)}">${
          t.same ? '★ ' : ''}${esc(t.label)} · ${t.total} odg.</option>`).join('')}
      </select>
      <button class="overlay-btn overlay-btn-ghost" id="mergeBtn">🔗 Združi</button>
      <div class="auth-msg" id="mergeMsg"></div>
      <button class="overlay-btn overlay-btn-ghost td-delete-btn" id="deleteBtn">🗑️ Izbriši račun (brez prenosa)</button>
      <div class="auth-msg" id="deleteMsg"></div>

      <button class="auth-switch auth-close" id="resetCancel">← Nazaj na pregled</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.addEventListener('click', e => { if (e.target === div) openTeacherDashboard(); });
  const picker = buildAnimalPicker();
  div.querySelector('#resetPickerSlot').appendChild(picker);
  div.querySelector('#resetCancel').addEventListener('click', () => openTeacherDashboard());

  const ACCOUNT_ERR = {
    NI_DOVOLJENJA: '❌ Ni dovoljenja. Prijavi se znova.',
    NI_UCENCA:     '❌ Tega računa ni več.',
    ISTI:          '❌ Izberi drug račun.'
  };
  function accountError(res) {
    if (res === RPC_UNREACHABLE) return OFFLINE_MSG;
    if (res === null) return '❌ V bazi še ni funkcije — zaženi supabase_zdruzi_izbrisi.sql.';
    if (typeof res === 'string' && res.startsWith('NAPAKA')) return '❌ ' + res;
    return ACCOUNT_ERR[res] || '❌ Napaka. Poskusi znova.';
  }
  function accountDone(text) {
    div.querySelector('.timed-overlay-box').innerHTML = `
      <div class="overlay-title" style="color:#4caf50">✅ ${text}</div>
      <div class="overlay-divider"></div>
      <button class="overlay-btn overlay-btn-next" id="accDone">Nazaj na pregled</button>`;
    div.querySelector('#accDone').addEventListener('click', () => openTeacherDashboard());
  }

  div.querySelector('#razredBtn').addEventListener('click', async () => {
    const nov = div.querySelector('#razredSelect').value;
    const msg = div.querySelector('#razredMsg');
    if (!nov) { msg.textContent = 'Izberi razred.'; return; }
    if (nov === razred) { msg.style.color = ''; msg.textContent = nov === OBISK
      ? 'Račun je že med obiskovalci.' : `Učenec je že v ${nov}.`; return; }
    const btn = div.querySelector('#razredBtn');
    btn.disabled = true; btn.textContent = 'Premikam …';
    const res = await supabaseRPC('move_student_razred', {
      p_teacher_id: teacherSession.id, p_username: student.username, p_razred: nov
    });
    btn.disabled = false; btn.textContent = 'Premakni v izbrani razred ✓';
    if (res === 'OK') {
      razred = nov;
      msg.style.color = '#5fd97a';
      msg.textContent = nov === OBISK ? '✅ Premaknjen med obiskovalce.' : `✅ Premaknjen v ${nov}.`;
      return;
    }
    msg.style.color = '';
    msg.textContent = res === null
      ? '❌ V bazi še ni funkcije — zaženi supabase_premakni_razred.sql.'
      : res === 'SLAB_RAZRED'
        ? (nov === OBISK ? '❌ Zaženi supabase_obiskovalec.sql.' : '❌ Neveljaven razred.')
        : accountError(res);
  });

  div.querySelector('#mergeBtn').addEventListener('click', async () => {
    const into = div.querySelector('#mergeSelect').value;
    const msg = div.querySelector('#mergeMsg');
    if (!into) { msg.textContent = 'Izberi račun, v katerega preneseš vadbo.'; return; }
    if (!confirm(`Vadba računa ${student.username} se prenese v ${into}.\n`
               + `Račun ${student.username} se nato izbriše. Nadaljujem?`)) return;
    const btn = div.querySelector('#mergeBtn');
    btn.disabled = true; btn.textContent = 'Združujem …';
    const res = await supabaseRPC('merge_students', {
      p_teacher_id: teacherSession.id, p_from: student.username, p_into: into
    });
    if (res === 'OK') { accountDone(`Združeno v ${esc(into)}`); return; }
    btn.disabled = false; btn.textContent = '🔗 Združi';
    msg.textContent = accountError(res);
  });

  /* Brisanje se ne da razveljaviti, zato ga mora učiteljica potrditi z
     vpisom uporabniškega imena — en nehoten dotik na tablici ne sme zbrisati
     otrokove vadbe. */
  div.querySelector('#deleteBtn').addEventListener('click', async () => {
    const msg = div.querySelector('#deleteMsg');
    const typed = prompt(`Brisanje je dokončno — vadba se izgubi.\n`
                       + `Za potrditev vpiši uporabniško ime: ${student.username}`);
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== String(student.username).toLowerCase()) {
      msg.textContent = 'Ime se ne ujema — nič ni izbrisano.'; return;
    }
    const btn = div.querySelector('#deleteBtn');
    btn.disabled = true; btn.textContent = 'Brišem …';
    const res = await supabaseRPC('delete_student', {
      p_teacher_id: teacherSession.id, p_username: student.username
    });
    if (res === 'OK') { accountDone(`Račun ${esc(student.username)} izbrisan`); return; }
    btn.disabled = false; btn.textContent = '🗑️ Izbriši račun (brez prenosa)';
    msg.textContent = accountError(res);
  });

  div.querySelector('#imeBtn').addEventListener('click', async () => {
    const ime = velikaZacetnica(div.querySelector('#imeInput').value.trim());
    const msg = div.querySelector('#imeMsg');
    if (!ime) { msg.textContent = 'Vpiši ime.'; return; }
    const btn = div.querySelector('#imeBtn');
    btn.disabled = true; btn.textContent = 'Shranjujem …';
    const res = await supabaseRPC('set_student_name', {
      p_teacher_id: teacherSession.id, p_username: student.username, p_name: ime
    });
    btn.disabled = false; btn.textContent = 'Shrani ime ✓';
    if (res === 'OK') {
      student.display_name = ime;
      msg.style.color = '#5fd97a';
      msg.textContent = '✅ Ime shranjeno.';
      return;
    }
    msg.style.color = '';
    const napake = {
      NI_DOVOLJENJA: '❌ Ni dovoljenja. Prijavi se znova.',
      SLABO_IME:     '❌ Ime naj ima med 1 in 30 znakov.',
      NI_UCENCA:     '❌ Tega učenca ni več.'
    };
    msg.textContent = res === RPC_UNREACHABLE ? OFFLINE_MSG
                    : (napake[res] || '❌ Napaka pri shranjevanju imena.');
  });
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
        <div class="reset-student">${esc(student.emoji || '🦉')} <strong>${esc(student.username)}</strong></div>
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
        <button class="comp-btn comp-btn-ghost" id="compHallBtn">🏛️ Dvorana slavnih</button>
        <p class="comp-best" id="compBest"></p>
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
        <button class="comp-btn comp-btn-ghost" id="compHallBtn">🏛️ Dvorana slavnih</button>
        <p class="comp-best" id="compBest"></p>
      </div>`;
    area.querySelector('#compBoardBtn').addEventListener('click', () => openLeaderboard());
  }
  area.querySelector('#compHallBtn').addEventListener('click', openHallOfFame);
  showPersonalBest();
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
  loadRecordsBeforeRound();
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
  questionShownTs = Date.now();
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
  /* Igra za album (supabase_album.sql): vezana na učenca, preveri jo baza.
     Javna lestvica (scores) ni vezana na učenca, zato sličice ne gradijo na
     njej. Če funkcije v bazi še ni, klic tiho spodleti. Vrne izid vojaške
     službe (cekini za to igro), ki ga pokaže album.js. */
  if (profile) supabaseRPC('add_comp_round', {
    p_student: profile.id, p_score: cScore, p_correct: cCorrect, p_wrong: cWrong
  }).then(r => { if (window.albumVojska) window.albumVojska(r); });
  flushStats();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box comp-end-box">
      <div class="overlay-title" style="color:#c79bff">⏱️ Konec!</div>
      <div class="overlay-divider"></div>
      <div class="overlay-score-big" style="color:#c79bff">${cScore}</div>
      <div class="overlay-score-label">točk</div>
      ${recordNoteHTML()}
      ${profile
        ? `<div class="comp-name-prompt">Rezultat se shrani kot</div>
           <div class="comp-name-auto">${esc(profile.emoji || '🦉')} ${esc(profile.username)}</div>`
        : `<div class="comp-name-prompt">Vpiši svoje začetnice (3 črke):</div>
           <input id="compNameInput" class="comp-name-input" maxlength="3"
                  autocomplete="off" autocapitalize="characters" placeholder="ABC" />`}
      <button class="overlay-btn overlay-btn-next" id="compSaveBtn">Shrani rezultat ✓</button>
      <button class="overlay-btn overlay-btn-ghost" id="compSkipBtn">Preskoči</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;

  /* Prijavljen učenec ne tipka začetnic: uporabniško ime je enolično, zato
     se njegovi poskusi na lestvici združijo v enega — tri črke tega ne
     zmorejo (dve Ani sta obe "ANA"). */
  const input = div.querySelector('#compNameInput');
  if (input) {
    setTimeout(() => input.focus(), 50);
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-ZČŠŽ]/g, '').slice(0, 3);
    });
  } else {
    setTimeout(() => { const b = div.querySelector('#compSaveBtn'); if (b) b.focus(); }, 50);
  }
  let saving = false;
  const save = async () => {
    if (saving) return;
    saving = true;
    const name = profile ? profile.username : ((input.value.trim() || '???').slice(0, 3));
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
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
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
      <button class="overlay-btn overlay-btn-ghost" id="compHallBtn">🏛️ Dvorana slavnih</button>
      <button class="overlay-btn overlay-btn-ghost" id="compCloseBtn">Zapri</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.querySelector('#compHallBtn').addEventListener('click', openHallOfFame);

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
  let highlighted = false, myBest = null;
  list.innerHTML = rows.map((r, i) => {
    const isMe = !highlighted && highlightName != null && r.name === highlightName;
    if (isMe) myBest = r.score;
    if (isMe) highlighted = true;
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    return `<div class="comp-board-row${isMe ? ' me' : ''}">
      <span class="cb-rank">${rank}</span>
      <span class="cb-name">${esc(r.name)}</span>
      <span class="cb-score">${esc(r.score)}</span>
    </div>`;
  }).join('');
  /* Lestvica kaže samo najboljši rezultat — otrok, ki je tokrat dosegel
     manj, mora vseeno videti, da je bil poskus štet. */
  if (highlightScore != null && myBest !== null && myBest > highlightScore) {
    list.insertAdjacentHTML('beforeend', `<div class="comp-board-note">`
      + `Tokrat ${esc(highlightScore)} · tvoj najboljši danes ostaja ${esc(myBest)} 💪</div>`);
  }
}

/* ══════════════════════════════════════════
   DVORANA SLAVNIH (supabase_dvorana.sql)
   Dnevna lestvica se vsak dan izprazni; izjemen rezultat ostane tu za
   vedno, tudi čez sezone. Klubi namesto prvih 10: kdor doseže prag, je
   v klubu za vedno, zato je "klub 100" cilj, ne zamrznjena lestvica.
   Šteje samo igra prijavljenega učenca (comp_rounds), ki jo preveri baza.
══════════════════════════════════════════ */
const HALL_CLUBS = [
  { min: 120, name: 'Klub 120+', medal: '🥇' },
  { min: 100, name: 'Klub 100+', medal: '🥈' },
  { min: 80,  name: 'Klub 80+',  medal: '🥉' },
];
const hallClub = score => HALL_CLUBS.find(c => score >= c.min) || null;
/* Pred igro: osebni rekord in rekord šole (null = ni znano, ne slavimo). */
let cPrevBest = null, cSchoolBest = null;

async function fetchCompBest() {
  if (!profile) return null;
  const rows = await supabaseRPC('get_comp_best', { p_student: profile.id });
  if (!Array.isArray(rows)) return null;
  return rows.length ? rows[0] : { score: 0, day: null };
}
async function fetchHall() {
  const rows = await supabaseRPC('get_hall_of_fame', {});
  return Array.isArray(rows) ? rows : null;
}
function loadRecordsBeforeRound() {
  cPrevBest = null; cSchoolBest = null;
  if (!profile) return;
  fetchCompBest().then(b => { if (b) cPrevBest = b.score; });
  fetchHall().then(h => { if (h) cSchoolBest = h.length ? h[0].score : 0; });
}
const pointsWord = n => { const m = n % 100; return m === 1 ? 'točka' : m === 2 ? 'točki' : m === 3 || m === 4 ? 'točke' : 'točk'; };
const fmtDay = d => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); return m ? `${+m[3]}. ${+m[2]}. ${m[1]}` : ''; };
/* "Še 7 točk do Kluba 100+" — naslednji cilj za ta rekord. */
function nextClubText(best) {
  const next = HALL_CLUBS.slice().reverse().find(c => best < c.min);
  return next ? `še ${next.min - best} ${pointsWord(next.min - best)} do ${next.name.replace('Klub', 'Kluba')}` : '';
}

/* Okno "Konec!": rekord šole › nov klub › osebni rekord. Brez podatkov nič. */
function recordNoteHTML() {
  if (!profile || cPrevBest == null) return '';
  const club = hallClub(cScore);
  let ico, head, sub = '';
  if (cSchoolBest != null && cScore > cSchoolBest && cSchoolBest > 0) {
    ico = '👑'; head = 'Nov rekord šole!'; sub = `Prejšnji je bil ${cSchoolBest}. Tvoj lik je na vrhu dvorane slavnih.`;
  } else if (club && cPrevBest < club.min) {
    ico = club.medal; head = `Zdaj si v ${club.name.replace('Klub', 'Klubu')}!`; sub = 'Tvoj lik je v dvorani slavnih — za vedno.';
  } else if (cPrevBest > 0 && cScore > cPrevBest) {
    ico = '⭐'; head = 'Nov osebni rekord!'; sub = `Prej ${cPrevBest}` + (nextClubText(cScore) ? ` · ${nextClubText(cScore)}` : '');
  } else if (cPrevBest > 0) {
    return `<div class="comp-record-note">Tvoj rekord: <b>${esc(cPrevBest)}</b>${nextClubText(cPrevBest) ? ` · ${esc(nextClubText(cPrevBest))}` : ''}</div>`;
  } else return '';
  return `<div class="comp-record"><span class="ico">${ico}</span><div><b>${esc(head)}</b><small>${esc(sub)}</small></div></div>`;
}

/* Začetni zaslon tekmovanja: prijavljen učenec vidi svoj rekord in cilj. */
async function showPersonalBest() {
  const el0 = document.getElementById('compBest');
  if (el0) el0.innerHTML = '';
  if (!profile) return;
  const who = profile.id;
  const b = await fetchCompBest();
  const el = document.getElementById('compBest');
  /* Med čakanjem se je lahko prijavil kdo drug — odgovor velja le za tistega, ki je vprašal. */
  if (!el || !profile || profile.id !== who || !b || !b.score) return;
  const club = hallClub(b.score), next = nextClubText(b.score);
  el.innerHTML = `⭐ Tvoj rekord: <b>${esc(b.score)}</b>`
    + (club ? ` · ${club.medal} ${esc(club.name)}` : '')
    + (next ? `<br><span>${esc(next.charAt(0).toUpperCase() + next.slice(1))}</span>` : '');
}

/* Like riše lik.html (hero) — ista risba kot v albumu, z ozadjem in opremo,
   kot jo je učenec sam izbral. Stran se naloži enkrat, skrita, brez baze. */
let hallArtist = null;
function hallDrawer() {
  if (!hallArtist) hallArtist = new Promise(resolve => {
    const f = document.createElement('iframe');
    f.src = 'lik.html?samo-risanje';
    f.title = 'Risanje likov'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
    f.onload = () => { try { resolve(f.contentWindow.hero ? f.contentWindow : null); } catch (e) { resolve(null); } };
    f.onerror = () => resolve(null);
    document.body.appendChild(f);
  });
  return hallArtist;
}
function hallFigure(w, r) {
  const a = r.avatar;
  if (w && a) {
    try {
      const look = { ...w.S.look };
      ['form', 'skin', 'hair', 'eye', 'style'].forEach(k => { if (a[k]) look[k] = a[k]; });
      /* Ljubljenček, ki ga je učenec izbral za spremljevalca — kot v Moj svet. */
      const pet = a.pet && a.pet.stage !== 'jajce' ? a.pet : null;
      return w.hero(look, a.equip || {}, '0 0 512 512', false, pet);
    } catch (e) {}
  }
  return `<span class="hall-emoji">${esc(r.emoji || '🦉')}</span>`;   // še nima lika
}

async function openHallOfFame() {
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box comp-board-box hall-box">
      <div class="overlay-title" style="color:#ffd27a">🏛️ Dvorana slavnih</div>
      <div class="comp-board-date">Najboljši rezultati vseh časov · šteje igra prijavljenih učencev</div>
      <div class="hall-body" id="hallBody"><div class="comp-board-empty">Nalagam …</div></div>
      <button class="overlay-btn overlay-btn-ghost" id="hallCloseBtn">Zapri</button>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.querySelector('#hallCloseBtn').addEventListener('click', () => { removeOverlay(); showTekmovanjePanel(); });

  const [rows, w, mine] = await Promise.all([fetchHall(), hallDrawer(), fetchCompBest()]);
  const body = div.querySelector('#hallBody');
  if (!body) return;
  if (!rows) {
    body.innerHTML = `<div class="comp-board-empty">Dvorane ni bilo mogoče naložiti. Preveri internetno povezavo.</div>`;
    return;
  }
  const me = profile ? profile.username.toLowerCase() : null;
  const isMe = r => me && String(r.username).toLowerCase() === me;
  let html = '';
  if (rows.length) {
    const top = rows[0];
    html += `<div class="hall-record${isMe(top) ? ' me' : ''}">
      <div class="hall-pic big">${hallFigure(w, top)}</div>
      <div class="hall-record-txt">
        <small>👑 Rekord šole</small>
        <b class="hall-record-score">${esc(top.score)}</b>
        <span class="hall-name">${esc(top.username)}</span>
        <small>${esc(fmtDay(top.day))}</small>
      </div>
    </div>`;
  }
  if (mine && mine.score) {
    const next = nextClubText(mine.score);
    html += `<div class="comp-record-note">Tvoj rekord: <b>${esc(mine.score)}</b>${next ? ` · ${esc(next)}` : ' · najvišji klub! 🎉'}</div>`;
  }
  HALL_CLUBS.forEach((c, i) => {
    const upper = i ? HALL_CLUBS[i - 1].min : Infinity;
    const members = rows.filter(r => r.score >= c.min && r.score < upper);
    html += `<div class="hall-club">
      <div class="hall-club-head">${c.medal} ${esc(c.name)}</div>
      ${members.length ? `<div class="hall-grid">${members.map(r => `
        <div class="hall-card${isMe(r) ? ' me' : ''}">
          <div class="hall-pic">${hallFigure(w, r)}</div>
          <span class="hall-name">${esc(r.username)}</span>
          <b class="hall-score">${esc(r.score)}</b>
          <small>${esc(fmtDay(r.day))}</small>
        </div>`).join('')}</div>`
        : `<div class="hall-empty">Še prazno — kdo bo prvi?</div>`}
    </div>`;
  });
  body.innerHTML = html;
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
  if (document.visibilityState === 'hidden') { flushStats(true); return; }
  // Back on screen: don't make the teacher wait out the rest of the interval.
  if (tdRefreshFn) tdRefreshFn(true);
});
window.addEventListener('pagehide', () => flushStats(true));

/* The every-10-answers rule alone leaves a child who stops after 7 invisible
   to the teacher until they close the tab. This pushes whatever is pending on
   a timer instead. Skipped while hidden — visibilitychange already flushed,
   and nothing new accumulates when nobody is answering. */
setInterval(() => {
  if (!profile) return;
  if (document.visibilityState !== 'visible') return;
  if (!pendingAnswerCount && !Object.keys(pendingTableStats).length) return;
  flushStats();
}, STATS_FLUSH_MS);

/* ══════════════════════════
   INIT
══════════════════════════ */
loadSettings();
// a teacher's link overrides whatever is saved — and skips the start screen
if (applyPresetFromURL()) { screen = 'play'; rememberLast(); }
loadProfile();
applyUIFromState();
updateControlLock();
updateSummary();
updateProfileButton();
showPanel(mode);
// persisted student with no class yet → ask once
if (profile && leaderboardEnabled()) ensureRazred();   // also refreshes after the summer
loadData(() => {
  cards = shuffle(getFilteredCards());
  if (screen === 'home') return;
  if      (mode === 'quiz')   startQuiz();
  else if (mode === 'keypad') startKeypad();
  else if (mode === 'bitka')  showBattlePanel();
  else                        showTekmovanjePanel();
});
collapseToolbar();
