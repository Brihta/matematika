/* Album, cekini in lik — povezava z aplikacijo (naloži se za battle.js).

   Samo za prijavljene učence in samo, ko teče sezona (supabase_album.sql).
   - Zgoraj ob profilu: gumb z glavo lika, cekini in številom novih sličic.
   - Klik odpre lik.html v oknu čez aplikacijo (album, oprema, videz, liki).
   - Med vadbo: lik spodaj levo poskoči ob pravilnem odgovoru.
   - Po vadbi baza preveri pogoje; nova sličica → obvestilo spodaj.
   Kaj je zasluženo, odloča baza (album_sync), ne ta datoteka.

   lik.html teče v iframu na istem izvoru: kliče parent.albumApi (baza in
   prijavljen učenec) in po vsaki spremembi pokliče parent.albumChanged(stanje). */
(function () {
  const SYNC_MIN_MS = 30000;   // po vadbi baze ne sprašuj pogosteje

  document.head.insertAdjacentHTML('beforeend', `<style>
  .al-chip { order: 3; flex-shrink: 0; display: none; align-items: center; gap: 6px; background: rgba(240,165,0,.10);
    border: 1px solid rgba(240,165,0,.45); border-radius: 20px; padding: 3px 12px 3px 3px; color: #ffd27a;
    font: 600 .78rem/1 inherit; cursor: pointer; white-space: nowrap; position: relative; font-family: inherit; }
  .al-chip.on { display: flex; }
  .al-chip:hover { background: rgba(240,165,0,.18); }
  .al-face { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: #f6dcbc; }
  .al-face svg { width: 100%; height: 100%; display: block; }
  .al-coin { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff3b0, #f4c542 60%, #d89936);
    box-shadow: inset 0 0 0 1.5px #d89936, inset 0 0 0 3px #f4c542, inset 0 0 0 4px #d89936; }
  .al-badge { position: absolute; top: -6px; right: -6px; background: #f08c2e; color: #fff; border-radius: 999px; min-width: 18px; height: 18px;
    display: none; place-items: center; font-size: .68rem; font-weight: 800; padding: 0 5px; animation: alPulse 1.4s infinite; }
  .al-badge.on { display: grid; }
  @keyframes alPulse { 50% { transform: scale(1.15); } }
  .al-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(10,8,16,.6); display: none; padding: 18px; }
  .al-overlay.on { display: flex; }
  .al-frame { position: relative; flex: 1; max-width: 1260px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); background: #1c1a22; }
  .al-frame iframe { width: 100%; height: 100%; border: 0; display: block; }
  .al-close { position: absolute; top: 10px; right: 12px; z-index: 2; width: 38px; height: 38px; border-radius: 50%; border: 0;
    background: #2b2233; color: #fff; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.3); }
  .al-buddy { position: fixed; left: 12px; bottom: 8px; width: 120px; height: 120px; z-index: 50; pointer-events: none; display: none; }
  .al-buddy.on { display: block; }
  .al-buddy svg { width: 100%; height: 100%; display: block; }
  .al-buddy.hop { animation: alHop .45s ease-out; }
  @keyframes alHop { 40% { transform: translateY(-18px) rotate(-4deg); } }
  .al-toast { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 160px); z-index: 950; background: #fff8ec; color: #2b2233;
    border: 2px solid #f08c2e; border-radius: 16px; padding: 10px 14px; font-weight: 700; display: flex; gap: 10px; align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,.35); transition: transform .3s; max-width: calc(100% - 32px); cursor: pointer; }
  .al-toast.on { transform: translate(-50%, 0); }
  .al-toast small { display: block; font-weight: 600; color: #7a7184; }
  /* Široka vrstica se ne lomi (style.css, min-width 900px): beseda "cekinov"
     bi do ~1180 px potisnila Prijavo čez rob. */
  @media (max-width: 1180px) { .al-chip .al-txt { display: none; } }
  /* 900–1000 px: tam je vrstica načinov skoraj čez celo širino — samo glava
     lika in značka; uporabniško ime na Prijavi se skrije (ikona ostane). */
  @media (min-width: 900px) and (max-width: 1000px) {
    .al-chip { padding: 3px; gap: 0; }
    .al-chip .al-coin, .al-chip #alCoins { display: none; }
    .al-chip.on ~ .profile-btn .profile-name { display: none; }
    .topbar:has(.al-chip.on) { gap: 12px; }
  }
  @media (max-width: 600px) { .al-buddy.on { display: none; } }   /* na telefonu bi prekril namig pod tipkovnico */
  /* Med tekmovanjem sta logotip in profil v prvi vrsti, način pod njima. */
  body.competition .al-chip { order: 2; margin-left: auto; }
  body.competition .al-chip.on + .profile-btn { margin-left: 0; }
  @media (max-width: 700px) { .al-chip .al-txt { display: none; } .al-buddy { width: 84px; height: 84px; } .al-overlay { padding: 0; } .al-frame { border-radius: 0; } }
  </style>`);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="al-overlay" id="alOverlay"><div class="al-frame" id="alFrameBox"><button class="al-close" id="alClose" title="Zapri">✕</button></div></div>
    <div class="al-buddy" id="alBuddy"></div>
    <div class="al-toast" id="alToast"></div>`);

  const chip = document.createElement('button');
  chip.className = 'al-chip'; chip.id = 'alChip'; chip.title = 'Moj lik in album'; chip.type = 'button';
  chip.innerHTML = `<span class="al-face" id="alFace"></span><span class="al-coin"></span><span id="alCoins"></span><span class="al-txt" id="alCek"></span><span class="al-badge" id="alBadge"></span>`;
  const profileBtn = document.getElementById('profileBtn');
  profileBtn.parentNode.insertBefore(chip, profileBtn);

  const $ = id => document.getElementById(id);
  const overlay = $('alOverlay'), buddy = $('alBuddy');
  let frame = null, state = null, lastSync = 0, syncing = false, quizHinted = false;

  const isPupil = () => !!profile && !teacherSession;
  const W = () => frame && frame.contentWindow;
  const ready = () => { try { return !!(W() && W().hero && W().S); } catch (e) { return false; } };
  const active = () => isPupil() && state && state.season;

  /* Stran lika naložimo v ozadju takoj po prijavi: nariše glavo na gumbu in
     lika med vadbo, ob nalaganju pa baza preveri nove sličice. */
  function ensureFrame() {
    if (frame || !isPupil()) return;
    frame = document.createElement('iframe');
    frame.src = 'lik.html';
    frame.title = 'Moj lik';
    $('alFrameBox').appendChild(frame);
  }
  function dropFrame() {
    if (frame) frame.remove();
    frame = null; state = null; render();
  }

  const label = id => {
    const m = /^([xd])(\d+)$/.exec(id);
    if (m) return `${m[2]} ${m[1] === 'x' ? '×' : '÷'}`;
    return { z0: 'Dobrodošlica', z1: '3 dni zapored', z2: 'Cel teden', z3: '10 dni zapored', z4: '20 dni zapored', z5: '50 dni vadbe' }[id] || 'Nova sličica';
  };

  /* Most za lik.html: profile je v script.js "let", zato ni window.profile. */
  window.albumApi = { rpc: (fn, params) => supabaseRPC(fn, params), profile: () => profile };

  /* lik.html pokliče ob vsakem novem stanju iz baze. */
  window.albumChanged = function (st) {
    const prev = state;
    state = st;
    render();
    if (!prev || !st || !st.season) return;
    const was = new Set((prev.stickers || []).map(s => s.id));
    const fresh = (st.stickers || []).filter(s => s.state === 'pending' && !was.has(s.id));
    const prevGold = new Set((prev.stickers || []).filter(s => s.gold).map(s => s.id));
    const gold = (st.stickers || []).filter(s => s.gold && !prevGold.has(s.id));
    const coin = W() && W().cek ? W().cek(20) : 'cekinov';
    if (fresh.length) toast(`<span style="font-size:1.6rem">✉</span><div>Nova sličica: <b>${label(fresh[0].id)}</b>!${fresh.length > 1 ? ` (in še ${fresh.length - 1})` : ''}<small>Tapni in jo prilepi v album · +20 ${coin}</small></div>`);
    else if (gold.length && !overlay.classList.contains('on')) toast(`<span style="font-size:1.6rem">⭐</span><div>Zlata sličica: <b>${label(gold[0].id)}</b>!<small>Znaš jo tudi po 14 dneh · +20 ${coin}</small></div>`);
  };

  function render() {
    const on = active();
    chip.classList.toggle('on', !!on);
    if (!on) { buddy.classList.remove('on'); return; }
    $('alCoins').textContent = state.coins;
    const w = ready() ? W() : null;
    $('alCek').textContent = w ? w.cek(state.coins) : 'cekinov';
    const pend = (state.stickers || []).filter(s => s.state === 'pending').length, b = $('alBadge');
    b.textContent = pend ? `✉${pend}` : ''; b.classList.toggle('on', !!pend);
    if (w) {
      const S = w.S, eq = (S.equip && S.equip[S.active]) || {};
      $('alFace').innerHTML = w.hero(S.look, eq, '150 40 212 212', true);
      buddy.innerHTML = w.hero(S.look, eq, '0 0 512 512', true);
    }
  }

  function toast(html, ms = 5000) {
    const t = $('alToast');
    t.innerHTML = html; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
  }
  $('alToast').addEventListener('click', () => { $('alToast').classList.remove('on'); if (active()) open(); });

  function open() {
    ensureFrame();
    overlay.classList.add('on');
    if (ready() && W().albumReload) W().albumReload();
  }
  function close() { overlay.classList.remove('on'); render(); }
  chip.addEventListener('click', open);
  $('alClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('on')) close(); });

  /* Po vadbi (ko so odgovori zapisani v bazo) naj baza preveri nove sličice. */
  let syncTimer = null;
  function syncSoon() {
    if (!active() || !ready() || overlay.classList.contains('on')) return;
    const wait = lastSync + SYNC_MIN_MS - Date.now();
    /* Prepogosto: ne izpusti, ampak preveri malo kasneje — sicer bi otrok,
       ki je ravno končal vajo, za novo sličico izvedel šele naslednji dan. */
    if (syncing || wait > 0) { if (!syncTimer) syncTimer = setTimeout(() => { syncTimer = null; syncSoon(); }, Math.max(wait, 1000)); return; }
    syncing = true; lastSync = Date.now();
    Promise.resolve(W().albumReload()).finally(() => { syncing = false; });
  }

  /* Ovijemo tri funkcije iz script.js — vedenje aplikacije ostane enako. */
  const origFlush = window.flushStats;
  window.flushStats = function () {
    const p = origFlush.apply(this, arguments);
    Promise.resolve(p).then(syncSoon, () => {});
    return p;
  };
  const origProfile = window.updateProfileButton;
  window.updateProfileButton = function () {
    const r = origProfile.apply(this, arguments);
    if (isPupil()) ensureFrame(); else dropFrame();
    return r;
  };
  const origRecord = window.recordTableStat;
  window.recordTableStat = function (question, isCorrect) {
    if (active()) {
      if (isCorrect) { buddy.classList.remove('hop'); void buddy.offsetWidth; buddy.classList.add('hop'); }
      if (mode === 'quiz' && !quizHinted) {
        quizHinted = true;
        toast(`<span style="font-size:1.4rem">⌨️</span><div>Za sličice vadi na <b>tipkovnici</b><small>V kvizu lahko odgovor uganeš, zato za sličice ne šteje.</small></div>`, 6000);
      }
    }
    return origRecord.apply(this, arguments);
  };

  /* Lik spodaj levo je viden samo med vadbo. */
  const panels = ['quizPanel', 'keypadPanel', 'tekmovanjePanel', 'bitkaPanel'].map(id => $(id));
  setInterval(() => {
    buddy.classList.toggle('on', !!active() && !overlay.classList.contains('on') && panels.some(p => p && p.style.display !== 'none'));
  }, 500);

  if (isPupil()) ensureFrame();
})();
