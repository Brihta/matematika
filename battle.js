/* ═══════════════════════════════════════════
   BRIHTA — battle.js
   ⚔️ Bitka: 2–8 prijateljev, 60 s, ista vprašanja, stopničke
   ═══════════════════════════════════════════
   Naloži se za script.js in uporablja njegove pomočnike (SFX, supabaseRPC,
   recordStat …). Strežniški del je v supabase_bitka.sql.

   Vse naprave vsaki 1,5–2 s pokličejo battle_sync: pošljejo svoj rezultat
   in preberejo ostale. Brez WebSocketov — šolska omrežja jih včasih
   blokirajo, 8 igralcev pa je za navadne klice malenkost.

   Čas vedno teče po uri strežnika (btNow), ne tablice: šolske tablice imajo
   pogosto uro, ki zamuja minuto ali več, in odštevanje bi se razhajalo. */

const BT_KEY          = 'brihta_bitka_v1';       // { code, token } — preživi osvežitev
const BT_NAME_KEY     = 'brihta_bitka_ime';      // zadnje začetnice
const BT_MAX_PLAYERS  = 8;
const BT_POLL_LOBBY   = 1500;
const BT_POLL_GAME    = 2000;
const BT_POLL_WAIT    = 1000;
const BT_POLL_PODIUM  = 3000;

let bt = null;               // { code, token } trenutne bitke
let btState = null;          // zadnje stanje s strežnika
let btView = 'start';        // start | lobby | countdown | game | waiting | podium
let btPollTimer = null;
let btOffset = 0;            // strežniška ura − lokalna ura (ms)
let btBestRtt = Infinity;
let btOffline = false;
let btPlayedRound = 0;       // runda, ki jo je ta naprava že odigrala/začela
let btG = null;              // stanje igre med rundo
let btCountdownTimer = null;
let btPodiumTimers = [];
let btListTimer = null;      // osveževanje seznama odprtih bitk na začetnem zaslonu
let btListGen = 0;           // vsak izris začne svojo zanko; stare se ustavijo
const BT_POLL_LIST = 3000;
const BT_POLL_BOARD = 2000;

function btNow() { return Date.now() + btOffset; }

function btSave() {
  try {
    if (bt) localStorage.setItem(BT_KEY, JSON.stringify(bt));
    else localStorage.removeItem(BT_KEY);
  } catch(e) {}
}
function btLoad() {
  try {
    const b = JSON.parse(localStorage.getItem(BT_KEY) || 'null');
    if (b && b.code && b.token) return b;
  } catch(e) {}
  return null;
}

/* Ista vprašanja v istem vrstnem redu za vse: premešano z generatorjem, ki
   ga poganja skupni seed bitke (mulberry32). */
function btRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function btSeededDeck(seed) {
  const rnd = btRandom(seed);
  const a = allCards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function btMe() {
  return btState && btState.players.find(p => p.id === btState.me);
}
function btIsHost() { return !!btState && btState.host === btState.me; }
function btHostName() {
  const h = btState && btState.players.find(p => p.id === btState.host);
  return h ? `${esc(h.emoji)} ${esc(h.name)}` : 'gostitelj';
}
function btMyName() { return profile ? profile.username : null; }

const BT_ERRORS = {
  not_found:  'Bitke s to kodo ni. Preveri številke. 🔍',
  started:    'Ta bitka se je že začela. Počakaj na naslednjo ali ustvari svojo.',
  full:       `Bitka je polna (${BT_MAX_PLAYERS} igralcev).`,
  name_taken: 'To ime je v bitki že zasedeno — izberi druge začetnice.',
  name:       'Vpiši svoje začetnice (3 črke).',
  busy:       'Strežnik je zaseden. Poskusi znova čez trenutek.',
  alone:      'Za bitko potrebuješ vsaj enega prijatelja.',
  missing:    '⚠️ Bitka v bazi še ni vklopljena (supabase_bitka.sql).',
  offline:    '⚠️ Strežnik ni dosegljiv. Preveri internetno povezavo.'
};
function btErrorText(res) {
  if (res === RPC_UNREACHABLE) return BT_ERRORS.offline;
  if (res == null) return BT_ERRORS.missing;
  return BT_ERRORS[res.error] || 'Nekaj je šlo narobe. Poskusi znova.';
}

/* ── Klic na strežnik, ki hkrati izmeri zamik ure ── */
async function btCall(fn, params) {
  const t0 = Date.now();
  const res = await supabaseRPC(fn, params);
  const t1 = Date.now();
  const state = res && (res.state || (res.status ? res : null));
  if (state && state.now) {
    // najhitrejši odgovor je najbolj natančen: čas potovanja je najkrajši
    const rtt = t1 - t0;
    if (rtt <= btBestRtt) {
      btBestRtt = rtt;
      btOffset = state.now - (t0 + t1) / 2;
    }
  }
  return res;
}

function btStopTimers() {
  if (btPollTimer) { clearTimeout(btPollTimer); btPollTimer = null; }
  if (btListTimer) { clearTimeout(btListTimer); btListTimer = null; }
  if (btCountdownTimer) { clearInterval(btCountdownTimer); btCountdownTimer = null; }
  btPodiumTimers.forEach(clearTimeout); btPodiumTimers = [];
  if (btG) {
    if (btG.tick) clearInterval(btG.tick);
    if (btG.advance) clearTimeout(btG.advance);
    btG.active = false;
  }
}

/* Zapusti bitko (gumb ali preklop na drug način). */
function battleLeave() {
  if (!bt) return;
  const b = bt;
  bt = null; btState = null; btSave();
  btStopTimers();
  btG = null;
  supabaseRPC('leave_battle', { p_code: b.code, p_token: b.token });
}

/* ══════════════════════════
   VSTOPNA TOČKA (iz doRestart)
══════════════════════════ */
function showBattlePanel() {
  btStopTimers();
  const saved = bt || btLoad();
  if (saved) {
    bt = saved;
    btView = 'resume';
    btArea().innerHTML = '<div class="quiz-empty">Nalagam bitko … ⚔️</div>';
    btPoll();
    return;
  }
  btRenderStart();
}

function btArea() { return document.getElementById('bitkaArea'); }

/* Bitke so odprte kot tekmovanje (7:00–19:00), prijavljen učitelj pa jih
   lahko odpre kadarkoli — da jih preizkusi zvečer ali pokaže razredu. */
function btIsOpen() { return !!teacherSession || isCompetitionOpen(); }

/* Prijava ali odjava spremeni, kdo sme igrati in pod katerim imenom, zato
   se začetni zaslon nariše znova (kliče ga updateProfileButton). */
function battleAccessChanged() {
  if (mode === 'bitka' && btView === 'start') btRenderStart();
}

/* ══════════════════════════
   ZAČETNI ZASLON: ustvari / pridruži se
══════════════════════════ */
function btRenderStart(msg) {
  btView = 'start';
  btState = null;
  const area = btArea();
  if (!area) return;
  if (!btIsOpen()) {
    area.innerHTML = `
      <div class="comp-locked bt-card">
        <div class="comp-lock-icon">🔒</div>
        <h2>Bitke so zaprte</h2>
        <p>Odprte so vsak dan med <strong>7:00</strong> in <strong>19:00</strong>.</p>
        <p class="comp-now">Trenutno je <strong>${getSloveniaClock()}</strong> po slovenskem času.</p>
      </div>`;
    return;
  }
  let savedName = '';
  try { savedName = localStorage.getItem(BT_NAME_KEY) || ''; } catch(e) {}
  area.innerHTML = `
    <div class="comp-intro bt-card">
      <div class="comp-trophy">⚔️</div>
      <h2>Bitka</h2>
      <p class="comp-rules">60 sekund · 2–${BT_MAX_PLAYERS} igralcev · ista vprašanja za vse</p>
      ${isCompetitionOpen() ? '' : `<p class="bt-teacher-note">👨‍🏫 Učiteljski dostop — bitke so zate odprte ves čas.
         Otroci se lahko pridružijo med 7:00 in 19:00.</p>`}
      ${profile
        ? `<p class="bt-as">Igraš kot <strong>${esc(profile.emoji || '🦉')} ${esc(profile.username)}</strong></p>`
        : `<label class="bt-label" for="btName">Tvoje začetnice</label>
           <input id="btName" class="comp-name-input bt-name-input" maxlength="3"
                  autocomplete="off" autocapitalize="characters" placeholder="ABC"
                  value="${esc(savedName)}" />`}
      <div class="bt-msg" id="btMsg">${msg ? esc(msg) : ''}</div>
      <button class="comp-btn comp-btn-start" id="btCreate">⚔️ Ustvari bitko</button>
      <div class="bt-or"><span>ali se pridruži prijatelju</span></div>
      <div class="bt-join-row">
        <input id="btCode" class="bt-code-input" inputmode="numeric" pattern="[0-9]*"
               maxlength="4" autocomplete="off" placeholder="koda" />
        <button class="comp-btn comp-btn-ghost bt-join-btn" id="btJoin">Pridruži se</button>
      </div>
      ${btCanList() ? `
      <div class="bt-open">
        <div class="bt-open-title">Odprte bitke</div>
        <div class="bt-open-list" id="btOpenList"><div class="bt-open-empty">Iščem …</div></div>
      </div>` : ''}
    </div>`;

  const nameIn = area.querySelector('#btName');
  if (nameIn) nameIn.addEventListener('input', () => {
    nameIn.value = nameIn.value.toUpperCase().replace(/[^A-ZČŠŽ]/g, '').slice(0, 3);
  });
  const codeIn = area.querySelector('#btCode');
  codeIn.addEventListener('input', () => {
    codeIn.value = codeIn.value.replace(/\D/g, '').slice(0, 4);
  });
  codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); btJoin(); } });
  area.querySelector('#btCreate').addEventListener('click', btCreate);
  area.querySelector('#btJoin').addEventListener('click', btJoin);
  // ob ponovnem izrisu (prijava/odjava) ne sme teči dvojna zanka
  if (btListTimer) { clearTimeout(btListTimer); btListTimer = null; }
  btListGen++;
  if (btCanList()) btRefreshOpenList(btListGen);
}

/* ══════════════════════════
   ODPRTE BITKE — seznam za prijavljene in projektor za učitelja
   Seznam pove, kdo je ta trenutek na spletu, zato ga baza vrne samo
   prijavljenemu učencu ali potrjenemu učitelju (supabase_bitka_seznam.sql).
══════════════════════════ */
function btCanList() { return !!(profile || teacherSession); }

async function btFetchOpen() {
  if (!btCanList()) return null;
  return supabaseRPC('list_open_battles', {
    p_teacher: teacherSession ? teacherSession.id : null,
    p_student: profile ? profile.id : null
  });
}

/* Čakalnice, v katere se še da vstopiti, najprej; polne na konec. */
function btLobbiesFirstOpen(battles) {
  const lobbies = battles.filter(b => b.status === 'lobby');
  return lobbies.filter(b => b.players.length < BT_MAX_PLAYERS)
    .concat(lobbies.filter(b => b.players.length >= BT_MAX_PLAYERS));
}

function btPlayerNames(players, host, max) {
  const others = players.filter(p => p.id !== host);
  const shown = others.slice(0, max).map(p => `${esc(p.emoji)} ${esc(p.name)}`);
  if (others.length > max) shown.push(`+${others.length - max}`);
  return shown.join(' · ');
}

async function btRefreshOpenList(gen) {
  btListTimer = null;
  const res = await btFetchOpen();
  const list = document.getElementById('btOpenList');
  if (gen !== btListGen || !list || btView !== 'start' || mode !== 'bitka') return;   // zaslon je že drug
  const lobbies = res && Array.isArray(res.battles) ? btLobbiesFirstOpen(res.battles) : null;
  if (res == null) {
    // baza je zavrnila ali funkcije še ni (supabase_bitka_seznam.sql) —
    // otrokom ne kaži napake, samo skrij razdelek
    const wrap = list.closest('.bt-open');
    if (wrap) wrap.style.display = 'none';
  } else if (!lobbies) {
    list.innerHTML = '<div class="bt-open-empty">⚠️ Strežnik ni dosegljiv.</div>';
  } else if (!lobbies.length) {
    list.innerHTML = '<div class="bt-open-empty">Nobena bitka ne čaka. Ustvari svojo! ⚔️</div>';
  } else {
    list.innerHTML = lobbies.map(b => {
      const host = b.players.find(p => p.id === b.host);
      const full = b.players.length >= BT_MAX_PLAYERS;
      const rest = btPlayerNames(b.players, b.host, 3);
      return `<div class="bt-open-row${full ? ' full' : ''}">
        <span class="bt-open-code">${esc(b.code)}</span>
        <span class="bt-open-who">
          <span class="bt-open-host">👑 ${host ? `${esc(host.emoji)} ${esc(host.name)}` : '—'}</span>
          <span class="bt-open-rest">${rest || 'čaka na igralce …'}</span>
        </span>
        <span class="bt-open-count">${b.players.length}/${BT_MAX_PLAYERS}</span>
        <button class="bt-open-join" data-code="${esc(b.code)}" ${full ? 'disabled' : ''}>
          ${full ? 'Polna' : 'Pridruži se'}</button>
      </div>`;
    }).join('');
    list.querySelectorAll('.bt-open-join').forEach(btn => btn.addEventListener('click', () => {
      const codeIn = document.getElementById('btCode');
      if (codeIn) codeIn.value = btn.dataset.code;
      btJoin();
    }));
  }
  btListTimer = setTimeout(() => btRefreshOpenList(gen), BT_POLL_LIST);
}

/* Projektor: vse čakalnice z velikimi kodami, spodaj bitke v teku z
   rezultati v živo. Odpre se iz učiteljskega pregleda. */
function openBattleBoard() {
  if (!teacherSession) return;
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay bt-theme bt-board-overlay';
  div.innerHTML = `
    <div class="bt-board">
      <button class="medal-modal-close" id="btBoardClose" title="Zapri">✕</button>
      <div class="bt-board-head">
        <div class="bt-board-title">⚔️ Bitke</div>
        <div class="bt-board-sub">Odpri <strong>⚔️ Bitka</strong> in vpiši kodo — ali tapni bitko na seznamu.</div>
      </div>
      <div class="bt-board-body" id="btBoardBody"><div class="comp-board-empty">Nalagam …</div></div>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  div.querySelector('#btBoardClose').addEventListener('click', () => openTeacherDashboard());

  let offset = 0;
  const render = (res) => {
    const body = div.querySelector('#btBoardBody');
    if (!body) return;
    if (!res || !Array.isArray(res.battles)) {
      body.innerHTML = `<div class="comp-board-empty">${res === RPC_UNREACHABLE
        ? '⚠️ Strežnik ni dosegljiv.'
        : '⚠️ Seznam bitk v bazi še ni vklopljen (supabase_bitka_seznam.sql).'}</div>`;
      return;
    }
    offset = res.now - Date.now();
    const lobbies = btLobbiesFirstOpen(res.battles);
    const running = res.battles.filter(b => b.status === 'running');
    const lobbyCard = b => {
      const host = b.players.find(p => p.id === b.host);
      const full = b.players.length >= BT_MAX_PLAYERS;
      return `<div class="bt-bcard${full ? ' full' : ''}">
        <div class="bt-bcard-top">
          <span class="bt-bcard-code">${esc(b.code)}</span>
          <span class="bt-bcard-count">${full ? 'polna' : `${b.players.length} / ${BT_MAX_PLAYERS}`}</span>
        </div>
        <div class="bt-bcard-host">👑 ${host ? `${esc(host.emoji)} ${esc(host.name)}` : '—'}</div>
        <div class="bt-bcard-players">${btPlayerNames(b.players, b.host, 7) || 'čaka na igralce …'}</div>
      </div>`;
    };
    const runCard = b => {
      const left = Math.max(0, Math.ceil((b.ends_at - (Date.now() + offset)) / 1000));
      const notYet = b.starts_at > Date.now() + offset;
      return `<div class="bt-bcard running">
        <div class="bt-bcard-top">
          <span class="bt-bcard-code small">${esc(b.code)}</span>
          <span class="bt-bcard-time${left <= 10 ? ' danger' : ''}">${notYet ? '3 · 2 · 1 …' : `⏱️ ${left} s`}</span>
        </div>
        ${b.players.map((p, i) => `<div class="bt-bcard-row">
          <span class="bt-bcard-rank">${btPlaceIcon(i)}</span>
          <span class="bt-bcard-name">${esc(p.emoji)} ${esc(p.name)}</span>
          <span class="bt-bcard-score">${p.score}</span>
        </div>`).join('')}
      </div>`;
    };
    body.innerHTML = `
      <div class="bt-board-section">🟢 Čakajo na igralce</div>
      ${lobbies.length
        ? `<div class="bt-board-grid">${lobbies.map(lobbyCard).join('')}</div>`
        : '<div class="bt-board-empty">Trenutno nobena bitka ne čaka.</div>'}
      <div class="bt-board-section">⚔️ V igri</div>
      ${running.length
        ? `<div class="bt-board-grid">${running.map(runCard).join('')}</div>`
        : '<div class="bt-board-empty">Nobena bitka ne poteka.</div>'}`;
  };

  let busy = false;
  const refresh = async () => {
    if (busy || activeOverlay !== div) return;
    busy = true;
    const res = await btFetchOpen();
    busy = false;
    if (activeOverlay === div) render(res);
  };
  refresh();
  /* tdRefreshTimer počisti removeOverlay — tako se osveževanje ustavi,
     ko se projektor zapre ali se odpre karkoli drugega. */
  tdRefreshTimer = setInterval(refresh, BT_POLL_BOARD);
}

function btSetMsg(text) {
  const el = document.getElementById('btMsg');
  if (el) el.textContent = text || '';
}

/* Ime igralca: prijavljen učenec pod uporabniškim imenom, ostali z začetnicami. */
function btReadName() {
  if (profile) return { name: profile.username, emoji: profile.emoji || '🦉' };
  const input = document.getElementById('btName');
  const name = input ? input.value.trim() : '';
  if (!name) { btSetMsg(BT_ERRORS.name); if (input) input.focus(); return null; }
  try { localStorage.setItem(BT_NAME_KEY, name); } catch(e) {}
  return { name, emoji: PROFILE_EMOJIS[Math.floor(Math.random() * PROFILE_EMOJIS.length)] };
}

function btBusy(on) {
  document.querySelectorAll('#btCreate, #btJoin').forEach(b => b.disabled = on);
}

async function btCreate() {
  const who = btReadName();
  if (!who) return;
  btBusy(true); btSetMsg('Ustvarjam …');
  const res = await btCall('create_battle', { p_name: who.name, p_emoji: who.emoji });
  if (!res || res === RPC_UNREACHABLE || res.error) { btBusy(false); btSetMsg(btErrorText(res)); return; }
  btEnter(res);
}

async function btJoin() {
  const codeIn = document.getElementById('btCode');
  const code = codeIn ? codeIn.value.trim() : '';
  if (!/^\d{4}$/.test(code)) { btSetMsg('Koda ima 4 številke.'); if (codeIn) codeIn.focus(); return; }
  const who = btReadName();
  if (!who) return;
  btBusy(true); btSetMsg('Pridružujem …');
  const res = await btCall('join_battle', { p_code: code, p_name: who.name, p_emoji: who.emoji });
  if (!res || res === RPC_UNREACHABLE || res.error) {
    btBusy(false);
    btSetMsg(res && res.error === 'name_taken' && profile
      ? 'V tej bitki že igraš — na drugi napravi ali zavihku.'
      : btErrorText(res));
    return;
  }
  btEnter(res);
}

function btEnter(res) {
  SFX.levelUp();
  bt = { code: res.state.code, token: res.token };
  btSave();
  // runde, ki so se odigrale pred vstopom, niso naše
  btPlayedRound = res.state.round;
  btApply(res.state);
}

/* ══════════════════════════
   SINHRONIZACIJA
══════════════════════════ */
function btSchedule(ms) {
  if (btPollTimer) clearTimeout(btPollTimer);
  btPollTimer = setTimeout(btPoll, ms);
}

async function btPoll() {
  btPollTimer = null;
  if (!bt || mode !== 'bitka') return;
  const params = { p_code: bt.code, p_token: bt.token };
  // med igro in tik po njej pošlji tudi svoj rezultat
  if (btG && btG.round && (btG.active || btG.finished)) {
    Object.assign(params, { p_round: btG.round, p_score: btG.score,
                            p_correct: btG.correct, p_wrong: btG.wrong });
  }
  const sent = bt;
  const res = await btCall('battle_sync', params);
  if (bt !== sent) return;                        // medtem zapustil
  if (res === RPC_UNREACHABLE || res == null) {
    btOffline = true; btShowOffline();
    if (btView === 'resume') { btView = 'start'; bt = null; btRenderStart(btErrorText(res)); return; }
    btSchedule(BT_POLL_GAME);
    return;
  }
  btOffline = false; btShowOffline();
  if (res.error) {
    // bitka pobrisana ali smo bili odstranjeni (predolgo odsotni)
    bt = null; btSave(); btStopTimers(); btG = null; removeOverlay();
    btRenderStart('Bitka je končana ali te v njej ni več. Ustvari novo ali se pridruži drugi.');
    return;
  }
  btApply(res);
}

function btShowOffline() {
  const el = document.getElementById('btNet');
  if (el) el.style.display = btOffline ? '' : 'none';
}

/* Glavni preklopnik: iz stanja strežnika izbere pravi zaslon. */
function btApply(state) {
  const prev = btState;
  btState = state;
  if (mode !== 'bitka' || !bt) return;
  const now = btNow();

  if (state.status === 'lobby') {
    if (btView !== 'lobby') { removeOverlay(); btStopTimers(); btG = null; btRenderLobby(); }
    else btUpdateLobby();
    btSchedule(BT_POLL_LOBBY);
    return;
  }

  if (state.status === 'running') {
    const fresh = state.round !== btPlayedRound;
    if (fresh && now < state.ends_at - 3000) {
      // nova runda: odštevanje, nato igra
      btPlayedRound = state.round;
      btStartCountdown();
    } else if (fresh) {
      // runda se je začela pred našim prihodom (osvežena stran)
      btPlayedRound = state.round;
      btShowWaiting(true);
    } else if (btView === 'game') {
      btUpdateLive();
    } else if (btView === 'resume') {
      btShowWaiting(true);
    }
    btSchedule(btView === 'waiting' ? BT_POLL_WAIT : BT_POLL_GAME);
    return;
  }

  // finished
  if (btView === 'game' && btG && btG.active) btEndGame();   // naša ura je za strežnikom
  if (btView !== 'podium') btShowPodium(btView !== 'resume');
  else if (prev && prev.host !== state.host) btUpdatePodiumButtons();
  btSchedule(BT_POLL_PODIUM);
}

/* ══════════════════════════
   ČAKALNICA
══════════════════════════ */
function btRenderLobby() {
  btView = 'lobby';
  const area = btArea();
  area.innerHTML = `
    <div class="comp-intro bt-card bt-lobby">
      <div class="bt-code-label">Koda bitke</div>
      <div class="bt-code">${esc(btState.code)}</div>
      <div class="bt-code-hint">Povej jo prijateljem — vpišejo jo pod ⚔️ Bitka</div>
      <div class="bt-count" id="btCount"></div>
      <div class="bt-players" id="btPlayers"></div>
      <div class="bt-msg" id="btMsg"></div>
      <div id="btLobbyAction"></div>
      <button class="comp-btn comp-btn-ghost" id="btLeave">Zapusti bitko</button>
      <div class="bt-net" id="btNet" style="display:none">⚠️ Povezava je prekinjena …</div>
    </div>`;
  area.querySelector('#btLeave').addEventListener('click', () => {
    battleLeave(); btRenderStart();
  });
  btUpdateLobby();
}

function btUpdateLobby() {
  const list = document.getElementById('btPlayers');
  if (!list || !btState) return;
  const seen = new Set([...list.querySelectorAll('[data-pid]')].map(e => e.dataset.pid));
  const players = btState.players.slice()
    .sort((a, b) => (a.id === btState.host ? -1 : b.id === btState.host ? 1 : 0));
  list.innerHTML = players.map(p => `
    <div class="bt-player${p.id === btState.me ? ' me' : ''}${seen.size && !seen.has(p.id) ? ' pop' : ''}"
         data-pid="${esc(p.id)}">
      <span class="bt-p-emoji">${esc(p.emoji)}</span>
      <span class="bt-p-name">${esc(p.name)}</span>
      ${p.id === btState.host ? '<span class="bt-p-tag" title="Gostitelj">👑</span>' : ''}
      ${p.id === btState.me ? '<span class="bt-p-you">ti</span>' : ''}
    </div>`).join('');
  if (seen.size && players.some(p => !seen.has(p.id))) SFX.click();

  const n = btState.players.length;
  document.getElementById('btCount').textContent = `${n} / ${BT_MAX_PLAYERS} igralcev`;

  const act = document.getElementById('btLobbyAction');
  if (btIsHost()) {
    const can = n >= 2;
    if (!act.querySelector('#btStart')) {
      act.innerHTML = `<button class="comp-btn comp-btn-start" id="btStart"></button>`;
      act.querySelector('#btStart').addEventListener('click', btStartBattle);
    }
    const b = act.querySelector('#btStart');
    if (!b.dataset.busy) {
      b.disabled = !can;
      b.textContent = can ? '▶ Začni bitko' : 'Čakam na prijatelje …';
    }
  } else {
    act.innerHTML = `<div class="bt-wait">Čakamo, da ${btHostName()} začne bitko …</div>`;
  }
}

async function btStartBattle() {
  const b = document.getElementById('btStart');
  if (b) { b.disabled = true; b.dataset.busy = '1'; b.textContent = 'Začenjam …'; }
  const res = await btCall('start_battle', { p_code: bt.code, p_token: bt.token });
  if (b) delete b.dataset.busy;
  if (!res || res === RPC_UNREACHABLE || res.error) {
    btSetMsg(btErrorText(res));
    btUpdateLobby();
    return;
  }
  btApply(res);
}

/* ══════════════════════════
   ODŠTEVANJE — po uri strežnika, pri vseh hkrati
══════════════════════════ */
function btStartCountdown() {
  btView = 'countdown';
  collapseToolbar();
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'comp-countdown-overlay bt-countdown';
  div.innerHTML = `
    <div class="bt-cd-inner">
      <div class="bt-cd-title">⚔️ Bitka se začne!</div>
      <div class="comp-countdown-num" id="btCdNum"></div>
      <div class="bt-cd-players">${btState.players.map(p =>
        `<span>${esc(p.emoji)} ${esc(p.name)}</span>`).join('')}</div>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  const numEl = div.querySelector('#btCdNum');
  let shown = null;
  const starts = btState.starts_at;
  const step = () => {
    const left = starts - btNow();
    if (left <= 0) {
      clearInterval(btCountdownTimer); btCountdownTimer = null;
      numEl.textContent = 'ZAČNI!';
      numEl.classList.add('go');
      numEl.classList.remove('pop'); void numEl.offsetWidth; numEl.classList.add('pop');
      SFX.levelUp();
      setTimeout(() => { if (activeOverlay === div) removeOverlay(); btStartGame(); }, 450);
      return;
    }
    const s = Math.ceil(left / 1000);
    const label = s > 3 ? '…' : String(s);
    if (label !== shown) {
      shown = label;
      numEl.textContent = label;
      if (s <= 3) {
        numEl.classList.remove('pop'); void numEl.offsetWidth; numEl.classList.add('pop');
        SFX.click();
      }
    }
  };
  step();
  btCountdownTimer = setInterval(step, 50);
}

/* ══════════════════════════
   IGRA
══════════════════════════ */
function btStartGame() {
  if (mode !== 'bitka' || !btState) return;
  btView = 'game';
  btG = {
    round: btState.round, endsAt: btState.ends_at,
    queue: btSeededDeck(btState.seed), idx: 0,
    score: 0, streak: 0, correct: 0, wrong: 0,
    input: '', answered: false, active: true, finished: false,
    tick: null, advance: null, lastSec: null
  };
  btG.tick = setInterval(btTick, 200);
  btRenderQ();
}

function btTimeLeft() {
  return Math.max(0, Math.ceil((btG.endsAt - btNow()) / 1000));
}

/* Lestvica v živo: drugi s strežnika, sam s sabo lokalno (sveže). */
function btLiveRanking() {
  if (!btState) return [];
  const me = btState.me;
  return btState.players
    .map(p => p.id === me && btG ? { ...p, score: btG.score, correct: btG.correct } : p)
    .sort((a, b) => (b.score - a.score) || (b.correct - a.correct));
}
function btPlaceIcon(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`; }

function btLiveHTML() {
  const rows = btLiveRanking();
  return rows.map((p, i) => `
    <span class="bt-live-chip${p.id === btState.me ? ' me' : ''}">
      <span class="bt-live-rank">${btPlaceIcon(i)}</span>
      ${esc(p.emoji)} <span class="bt-live-name">${esc(p.name)}</span>
      <strong>${p.score}</strong>
    </span>`).join('');
}
function btRankHTML() {
  const rows = btLiveRanking();
  const i = rows.findIndex(p => p.id === btState.me);
  return `<div class="comp-score-num bt-rank-num">${i < 0 ? '–' : btPlaceIcon(i)}</div>
          <div class="comp-cell-lbl">mesto</div>`;
}

function btUpdateLive() {
  const live = document.getElementById('btLive');
  if (live) live.innerHTML = btLiveHTML();
  const rank = document.getElementById('btRankBox');
  if (rank) rank.innerHTML = btRankHTML();
}

function btScoreTier(s) {
  return s >= 60 ? 'tier4' : s >= 40 ? 'tier3' : s >= 20 ? 'tier2' : 'tier1';
}

function btRenderQ() {
  const area = btArea();
  const cur = btG.queue[btG.idx % btG.queue.length];
  const mult = getMultiplier(btG.streak);
  const left = btTimeLeft();
  area.innerHTML = `
    <div class="comp-hud bt-hud">
      <div class="comp-hud-score ${btScoreTier(btG.score)}" id="btScoreBox">
        <div class="comp-score-num" id="btScoreNum">${btG.score}</div>
        <div class="comp-cell-lbl">točk</div>
      </div>
      <div class="comp-hud-score bt-rank-box" id="btRankBox">${btRankHTML()}</div>
      <div class="comp-hud-time ${left <= 10 ? 'danger' : ''}" id="btTimeBox">
        <div class="comp-time-num" id="btTimeNum">${left}</div>
        <div class="comp-cell-lbl">sekund</div>
      </div>
    </div>
    <div class="bt-live" id="btLive">${btLiveHTML()}</div>
    <div class="comp-streak-slot">
      ${mult > 1 ? `<span class="streak-badge">🔥 Množilnik ×${mult}!</span>`
                 : (btG.streak >= 2 ? `<span class="streak-badge">🔥 ${btG.streak}×</span>` : '')}
    </div>
    <div class="quiz-question comp-question bt-question">${cur.question}</div>
    <div class="keypad-display" id="btDisplay">
      <span class="keypad-display-text" id="btDisplayText">${btG.input || '_'}</span>
    </div>
    <div class="keypad-grid" id="btGrid">
      ${['7','8','9','4','5','6','1','2','3'].map(d =>
        `<button class="keypad-btn" data-d="${d}">${d}</button>`).join('')}
      <button class="keypad-btn keypad-back" data-d="back">⌫</button>
      <button class="keypad-btn" data-d="0">0</button>
      <button class="keypad-btn keypad-ok" data-d="ok">✓</button>
    </div>
    <div class="bt-net" id="btNet" style="${btOffline ? '' : 'display:none'}">⚠️ Povezava je prekinjena — igraj naprej, rezultat se pošlje, ko se vrne.</div>`;
  questionShownTs = Date.now();
  area.querySelectorAll('#btGrid .keypad-btn').forEach(btn => {
    btn.addEventListener('click', () => btInput(btn.dataset.d));
  });
}

function btInput(d) {
  if (!btG || !btG.active || btG.answered) return;
  if (d === 'back') {
    btG.input = btG.input.slice(0, -1);
    SFX.click();
  } else if (d === 'ok') {
    btCheck();
    return;
  } else {
    if (btG.input.length >= 3) return;
    btG.input += d;
    SFX.click();
  }
  const t = document.getElementById('btDisplayText');
  if (t) t.textContent = btG.input || '_';
}

function btCheck() {
  if (!btG.input.length) return;
  btG.answered = true;
  const cur = btG.queue[btG.idx % btG.queue.length];
  const isCorrect = btG.input === cur.answer;
  const display = document.getElementById('btDisplay');
  if (isCorrect) {
    SFX.correct();
    if (display) display.classList.add('correct');
    btG.streak++;
    btG.score += getMultiplier(btG.streak);
    btG.correct++;
    const num = document.getElementById('btScoreNum');
    if (num) {
      num.textContent = btG.score;
      num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
    }
    const box = document.getElementById('btScoreBox');
    if (box) { box.classList.remove('tier1','tier2','tier3','tier4'); box.classList.add(btScoreTier(btG.score)); }
    btUpdateLive();
  } else {
    SFX.wrong();
    if (display) {
      display.classList.add('wrong');
      display.innerHTML = `
        <span class="keypad-display-text keypad-strike">${esc(btG.input)}</span>
        <span class="keypad-display-arrow">→</span>
        <span class="keypad-display-correct">${esc(cur.answer)}</span>`;
    }
    btG.streak = 0;
    btG.wrong++;
  }
  recordTableStat(cur.question, isCorrect);
  document.querySelectorAll('#btGrid .keypad-btn').forEach(b => b.disabled = true);
  const g = btG;
  g.advance = setTimeout(() => {
    g.advance = null;
    if (!g.active || btG !== g) return;
    g.idx++; g.input = ''; g.answered = false;
    btRenderQ();
  }, isCorrect ? 300 : 650);
}

function btTick() {
  if (!btG || !btG.active) return;
  const left = btTimeLeft();
  if (left !== btG.lastSec) {
    btG.lastSec = left;
    const el = document.getElementById('btTimeNum');
    if (el) el.textContent = left;
    const box = document.getElementById('btTimeBox');
    if (box) box.classList.toggle('danger', left <= 10);
    if (left <= 5 && left > 0) SFX.click();
  }
  if (left <= 0) btEndGame();
}

function btEndGame() {
  if (!btG || !btG.active) return;
  btG.active = false;
  btG.finished = true;
  if (btG.tick) { clearInterval(btG.tick); btG.tick = null; }
  if (btG.advance) { clearTimeout(btG.advance); btG.advance = null; }
  SFX.victory();
  recordStat('bitka', btG.correct, btG.wrong, btG.score, 60);
  flushStats();
  btShowWaiting(false);
  btPoll();   // takoj pošlji končni rezultat
}

/* Konec runde, strežnik še zbira zadnje rezultate (do 4 s). */
function btShowWaiting(lateJoiner) {
  btView = 'waiting';
  removeOverlay();
  const div = document.createElement('div');
  div.className = 'timed-overlay';
  div.innerHTML = `
    <div class="timed-overlay-box comp-end-box">
      ${lateJoiner
        ? `<div class="overlay-title bt-accent">⚔️ Bitka poteka</div>
           <div class="overlay-subtitle">Ta runda se je začela brez tebe.<br>Rezultate vidiš, ko se konča.</div>`
        : `<div class="overlay-title bt-accent">⏱️ Konec!</div>
           <div class="overlay-divider"></div>
           <div class="overlay-score-big bt-accent">${btG ? btG.score : 0}</div>
           <div class="overlay-score-label">točk</div>`}
      <div class="bt-drum">🥁</div>
      <div class="overlay-subtitle">Čakam na rezultate ostalih …</div>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
}

/* ══════════════════════════
   STOPNIČKE (Kahoot)
══════════════════════════ */
function btShowPodium(animate) {
  btView = 'podium';
  btStopTimers();
  removeOverlay();
  const players = btState.players;   // strežnik jih vrne razvrščene
  const me = btState.me;
  const myIdx = players.findIndex(p => p.id === me);
  const step = (p, place) => p ? `
    <div class="bt-step bt-step-${place}${p.id === me ? ' me' : ''}" data-place="${place}">
      <div class="bt-step-who">
        <div class="bt-step-emoji">${esc(p.emoji)}</div>
        <div class="bt-step-name">${esc(p.name)}</div>
        <div class="bt-step-score">${p.score} <small>točk</small></div>
      </div>
      <div class="bt-step-block">${place}</div>
    </div>` : `<div class="bt-step bt-step-${place} bt-step-empty"></div>`;
  const rest = players.slice(3);

  const div = document.createElement('div');
  div.className = 'timed-overlay bt-podium-overlay';
  div.innerHTML = `
    <div class="bt-podium-box">
      <div class="overlay-title bt-podium-title">🏆 Rezultati bitke</div>
      <div class="bt-podium">
        ${step(players[1], 2)}${step(players[0], 1)}${step(players[2], 3)}
      </div>
      ${rest.length ? `<div class="bt-rest" id="btRest">${rest.map((p, i) => `
        <div class="comp-board-row${p.id === me ? ' me' : ''}">
          <span class="cb-rank">${i + 4}.</span>
          <span class="cb-name">${esc(p.emoji)} ${esc(p.name)}</span>
          <span class="cb-score">${p.score}</span>
        </div>`).join('')}</div>` : ''}
      <div class="bt-me-line" id="btMeLine">${myIdx >= 0
        ? (myIdx === 0 ? '🎉 Zmagal/a si bitko!' : `Tvoje mesto: <strong>${myIdx + 1}.</strong>`)
        : ''}</div>
      <div class="bt-podium-actions" id="btPodiumActions"></div>
    </div>`;
  document.body.appendChild(div);
  activeOverlay = div;
  btUpdatePodiumButtons();

  const reveal = (sel) => { const el = div.querySelector(sel); if (el) el.classList.add('show'); };
  if (!animate) {
    div.querySelectorAll('.bt-step, .bt-rest, .bt-me-line, .bt-podium-actions')
      .forEach(el => el.classList.add('show'));
    return;
  }
  /* Kahoot: od tretjega navzgor, pred zmagovalcem boben. */
  const later = (ms, fn) => btPodiumTimers.push(setTimeout(fn, ms));
  later(500,  () => { reveal('.bt-rest'); });
  later(1300, () => { if (players[2]) { reveal('.bt-step-3'); SFX.correct(); } });
  later(2600, () => { reveal('.bt-step-2'); SFX.correct(); });
  later(3200, () => SFX.drumroll());
  later(5000, () => {
    reveal('.bt-step-1'); SFX.victory(); btConfetti(div);
    if (myIdx === 0) div.querySelector('.bt-podium-box').classList.add('winner');
  });
  later(5800, () => { reveal('.bt-me-line'); reveal('.bt-podium-actions'); });
}

function btUpdatePodiumButtons() {
  const box = document.getElementById('btPodiumActions');
  if (!box) return;
  box.innerHTML = `
    ${btIsHost()
      ? '<button class="comp-btn comp-btn-start" id="btRematch">⚔️ Še enkrat</button>'
      : `<div class="bt-wait">Za novo rundo čakamo na ${btHostName()} …</div>`}
    <button class="comp-btn comp-btn-ghost" id="btPodiumLeave">Zapusti bitko</button>`;
  const rm = box.querySelector('#btRematch');
  if (rm) rm.addEventListener('click', async () => {
    rm.disabled = true; rm.textContent = 'Pripravljam …';
    const res = await btCall('rematch_battle', { p_code: bt.code, p_token: bt.token });
    if (!res || res === RPC_UNREACHABLE || res.error) {
      rm.disabled = false; rm.textContent = '⚔️ Še enkrat';
      return;
    }
    btApply(res);
  });
  box.querySelector('#btPodiumLeave').addEventListener('click', () => {
    battleLeave(); removeOverlay(); btRenderStart();
  });
}

function btConfetti(host) {
  const colors = ['#ffd700', '#ffb23f', '#ff7a1a', '#7dff7d', '#ff6b9d', '#5eb8ff'];
  const layer = document.createElement('div');
  layer.className = 'bt-confetti';
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = (Math.random() * 0.8) + 's';
    s.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(s);
  }
  host.appendChild(layer);
  btPodiumTimers.push(setTimeout(() => layer.remove(), 5000));
}

/* ── fizična tipkovnica med igro ── */
document.addEventListener('keydown', e => {
  if (mode !== 'bitka' || !btG || !btG.active || btG.answered) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key >= '0' && e.key <= '9') { e.preventDefault(); btInput(e.key); }
  else if (e.key === 'Backspace')   { e.preventDefault(); btInput('back'); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btInput('ok'); }
});

/* Ko se otrok vrne na zavihek, ne čakaj naslednjega intervala. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && bt && mode === 'bitka' && !btPollTimer) btPoll();
});
