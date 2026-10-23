/* ═══════════════════════════════════════════
   BRIHTA — nagajivec.js
   👾 Nagajivec: ljubljenčki skupaj proti nagajivcu (Do 20), 1–8 igralcev, 60 s
   ═══════════════════════════════════════════
   Naloži se za script.js, pet-art.js in boss-art.js. Strežniški del je v
   supabase_nagajivec.sql, pravila boja so opisana tam.

   Kot Bitka (battle.js): koda, čakalnica, odštevanje po uri strežnika,
   vsaka naprava vsako sekundo pošlje svoje pravilne in napačne ter prebere
   ostale. Iz razlik med klici nariše strele in omotične ljubljenčke drugih.

   Vsak otrok računa na svoji ravni (do 10 / brez prehoda / s prehodom), ki
   jo določi baza iz mejnikov. Odgovori gredo v do20_stats in do20_facts
   (recordTableStat) — štejejo za jajce, priboljške in mejnike. */
(function () {
  const KEY = 'brihta_nagajivec_v1';            // { code, token } — preživi osvežitev
  const MAX = 8;
  const POLL_LOBBY = 1500, POLL_GAME = 1000, POLL_END = 2500, POLL_LIST = 3000;
  const DIZZY_MS = 2000;
  const LEVEL = { d10: 'Do 10', b20: 'Do 20 brez prehoda', pr: 'Do 20 s prehodom' };
  const BEAM = { zmaj: '#ff8a3d', lisica: '#f2b632', sova: '#4f9dff', macka: '#ff6fae' };
  const FEM = { kujavka: true };
  // prizor: viewBox 0 0 400 200; nagajivec hodi od desne proti ljubljenčkom
  const BOSS_K = .85, BOSS_X0 = 228, BOSS_X1 = 150, BOSS_Y = 28;

  document.head.insertAdjacentHTML('beforeend', `<style>
  .ng-card { background: #fffef8; border-radius: 22px; padding: 18px 16px; text-align: center; max-width: 560px; margin: 8px auto;
    box-shadow: 0 2px 14px rgba(5,39,11,.08), inset 0 0 0 1px var(--g-sand-2, #ecd9bc); color: var(--g-forest, #05270b); }
  .ng-card h2 { font-size: 1.5rem; font-weight: 900; margin: 4px 0; }
  .ng-card h3 { font-size: .74rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--g-muted, #5d6b52); margin: 16px 0 8px; }
  .ng-rules { color: var(--g-muted, #5d6b52); font-weight: 600; font-size: .9rem; line-height: 1.45; margin: 6px 0 14px; }
  .ng-hero { display: flex; justify-content: center; height: 140px; }
  .ng-hero svg { height: 100%; width: auto; }
  .ng-btn { display: block; width: 100%; border: 0; border-radius: 16px; padding: 14px; font: 900 1.05rem inherit; font-family: inherit; cursor: pointer;
    background: linear-gradient(135deg, #ff9a7a, #f2647e); color: #fff; box-shadow: 0 6px 18px rgba(242,100,126,.35); margin-top: 8px; }
  .ng-btn:disabled { opacity: .55; cursor: default; box-shadow: none; }
  .ng-btn.ghost { background: none; color: var(--g-forest, #05270b); box-shadow: inset 0 0 0 2px var(--g-sand-2, #ecd9bc); font-size: .9rem; padding: 10px; }
  .ng-join { display: flex; gap: 8px; margin-top: 8px; }
  .ng-join input { flex: 1; min-width: 0; border: 2px solid var(--g-sand-2, #ecd9bc); border-radius: 14px; padding: 10px; font: 900 1.3rem inherit; font-family: inherit;
    text-align: center; letter-spacing: .2em; color: var(--g-forest, #05270b); background: var(--g-cream, #fdfcf3); }
  .ng-join .ng-btn { width: auto; margin: 0; padding: 10px 16px; font-size: .95rem; }
  .ng-or { margin: 14px 0 4px; font-size: .8rem; font-weight: 700; color: var(--g-muted, #5d6b52); }
  .ng-msg { min-height: 1.2em; font-weight: 700; font-size: .88rem; color: #c2410c; margin: 6px 0; }
  .ng-open { margin-top: 14px; text-align: left; }
  .ng-open-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; background: var(--g-cream, #fdfcf3); margin-top: 6px;
    box-shadow: inset 0 0 0 1px var(--g-sand-2, #ecd9bc); font-weight: 700; font-size: .88rem; }
  .ng-open-row b { font-size: 1.05rem; letter-spacing: .1em; }
  .ng-open-row span { flex: 1; color: var(--g-muted, #5d6b52); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ng-open-row button { border: 0; border-radius: 10px; padding: 6px 12px; font: 800 .85rem inherit; font-family: inherit; background: var(--g-grad); color: var(--g-forest, #05270b); cursor: pointer; }
  .ng-code { font-size: 2.6rem; font-weight: 900; letter-spacing: .25em; line-height: 1.1; }
  .ng-hint { font-size: .8rem; font-weight: 600; color: var(--g-muted, #5d6b52); }
  .ng-bosses { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ng-boss { position: relative; border: 2px solid var(--g-sand-2, #ecd9bc); border-radius: 16px; background: var(--g-cream, #fdfcf3); padding: 4px 4px 8px;
    cursor: pointer; font: 800 .9rem inherit; font-family: inherit; color: var(--g-forest, #05270b); transition: transform .12s, border-color .12s; }
  .ng-boss svg { width: 100%; height: auto; display: block; max-height: 120px; }
  .ng-boss:hover { transform: translateY(-2px); }
  .ng-boss.on { border-color: #f2647e; background: #fff1f0; box-shadow: 0 4px 14px rgba(242,100,126,.25); }
  .ng-votes { display: flex; justify-content: center; gap: 3px; min-height: 18px; margin-top: 2px; flex-wrap: wrap; }
  .ng-votes svg { width: 18px; height: 18px; }
  .ng-levels { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .ng-lv { border: 2px solid var(--g-sand-2, #ecd9bc); background: var(--g-cream, #fdfcf3); border-radius: 999px; padding: 8px 14px; font: 800 .85rem inherit;
    font-family: inherit; color: var(--g-forest, #05270b); cursor: pointer; }
  .ng-lv.on { background: var(--g-grad); border-color: transparent; box-shadow: 0 4px 12px var(--g-glow); }
  .ng-lv:disabled { cursor: default; color: #9aa492; }
  .ng-team { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .ng-mate { width: 82px; font-size: .74rem; font-weight: 800; }
  .ng-mate svg { width: 70px; height: 70px; display: block; margin: 0 auto; }
  .ng-mate small { display: block; font-weight: 600; color: var(--g-muted, #5d6b52); }
  .ng-mate.me { color: #d9465f; }
  .ng-wait { font-weight: 700; color: var(--g-muted, #5d6b52); margin-top: 12px; }

  .ng-game { width: 100%; max-width: 560px; margin: 0 auto; }
  .ng-card { width: 100%; }
  .ng-hud { display: flex; align-items: center; gap: 10px; background: #fffef8; border-radius: 16px; padding: 8px 12px;
    box-shadow: inset 0 0 0 1px var(--g-sand-2, #ecd9bc); }
  .ng-hp { flex: 1; min-width: 0; }
  .ng-hp-top { display: flex; justify-content: space-between; font-size: .78rem; font-weight: 900; }
  .ng-bar { height: 12px; border-radius: 999px; background: #f6dede; overflow: hidden; margin-top: 3px; }
  .ng-bar i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #ff9a7a, #e8435f); border-radius: 999px; transition: width .25s; }
  .ng-hearts { display: flex; flex-wrap: wrap; gap: 1px; max-width: 46%; justify-content: flex-end; font-size: .95rem; line-height: 1; }
  .ng-hearts span.lost { filter: grayscale(1); opacity: .3; }
  .ng-time { font-size: 1.4rem; font-weight: 900; min-width: 2ch; text-align: right; }
  .ng-time.danger { color: #e8435f; }
  .ng-scene { margin-top: 8px; border-radius: 18px; overflow: hidden; background: linear-gradient(#eaf6ff, #f7fbe9 70%); box-shadow: inset 0 0 0 1px var(--g-sand-2, #ecd9bc); }
  .ng-scene svg { display: block; width: 100%; height: auto; }
  .ng-name { font: 800 20px system-ui, sans-serif; fill: #05270b; }
  .ng-pet.me .ng-name { fill: #d9465f; }
  .ng-dizzy { display: none; }
  .ng-pet.dizzy .ng-dizzy { display: inline; }
  .ng-pet.dizzy .ng-pet-in { animation: ngDizzy .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 90%; }
  @keyframes ngDizzy { from { transform: rotate(-9deg); } to { transform: rotate(9deg); } }
  .ng-pet.cheer .ng-pet-in { animation: ngCheer .5s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
  @keyframes ngCheer { to { transform: translateY(-14px); } }
  .ng-boss-walk { animation: ngBob .5s ease-in-out infinite alternate; }
  @keyframes ngBob { to { transform: translateY(-4px); } }
  .ng-beam { stroke-dasharray: 320; stroke-dashoffset: 320; animation: ngShot .42s ease-out forwards; }
  @keyframes ngShot { 55% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
  .ng-spark { transform-box: fill-box; transform-origin: center; animation: ngSpark .42s ease-out forwards; }
  @keyframes ngSpark { 0%, 40% { transform: scale(.2); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
  .ng-q { text-align: center; font-size: 2.1rem; font-weight: 900; margin: 6px 0; min-height: 2.5rem; }
  .ng-keys { position: relative; max-width: 400px; margin: 0 auto; }
  .ng-keys .keypad-grid { margin: 10px auto 0; }
  .ng-keys .keypad-display { margin-top: 0; }
  .ng-dazed { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem;
    background: rgba(253,252,243,.82); border-radius: 18px; z-index: 2; }
  .ng-keys.dazed .ng-dazed { display: flex; }
  .ng-net { text-align: center; font-size: .8rem; font-weight: 700; color: #c2410c; margin-top: 6px; }
  .ng-overlay { position: fixed; inset: 0; z-index: 4000; background: rgba(5,39,11,.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .ng-overlay .ng-card { width: 100%; max-width: 440px; animation: ngPop .35s cubic-bezier(.34,1.56,.64,1); }
  @keyframes ngPop { from { transform: scale(.85); opacity: 0; } }
  .ng-cd { font-size: 4.5rem; font-weight: 900; line-height: 1; color: #e8435f; min-height: 4.6rem; }
  .ng-res-art { height: 150px; }
  .ng-res-art svg { height: 100%; width: auto; }
  .ng-treat { display: inline-block; margin-top: 8px; background: var(--g-sand, #f6e5cd); border-radius: 999px; padding: 6px 14px; font-weight: 800; }
  /* ploščica na začetnem zaslonu */
  .t-nag { background: linear-gradient(135deg, #ff9a7a, #f2647e); color: #3a0d16; box-shadow: 0 6px 20px rgba(242,100,126,.3); }
  /* vzorec: sluzasti mehurčki in iskrice strelov (vzorci/narisi.py) */
  .t-nag::before { background: url(vzorci/sluz.svg) 0 0 / 56px 56px repeat;
    -webkit-mask-image: linear-gradient(115deg, rgba(0,0,0,.25) 30%, #000 80%); mask-image: linear-gradient(115deg, rgba(0,0,0,.25) 30%, #000 80%); }
  /* vsi trije nagajivci; selektor mora premagati .home-tile > span:not(...) */
  .home-tiles .home-tile.t-nag > span.home-boss { position: absolute; right: -4px; bottom: -4px; width: 176px; height: 93px; pointer-events: none; z-index: 2; }
  .home-boss svg { width: 100%; height: 100%; display: block; }
  /* s ploščico je ploščic pet: na računalniku pet stolpcev, na telefonu gre
     Bitka (zadnja) čez celo širino. Brez nje ostane mreža kot prej. */
  @media (max-width: 899px) { .home-tiles.has-nag .t-bit { grid-column: 1 / -1; min-height: 120px; } }
  @media (min-width: 900px) {
    .home-tiles.has-nag { grid-template-columns: repeat(5, 1fr); }
    /* pet ožjih ploščic: lik in ljubljenček manjša, da ne segata v naslov */
    .home-tiles.has-nag .home-hero { width: 64px; height: 92px; }
    .home-tiles.has-nag .home-pet { width: 80px; height: 80px; }
  }
  </style>`);

  let ng = null;            // { code, token }
  let st = null;            // zadnje stanje s strežnika
  let view = 'start';       // start | resume | lobby | countdown | game | late | result
  let pollT = null, listT = null, listGen = 0, cdT = null, resT = null;
  let offset = 0, bestRtt = Infinity, offline = false;
  let played = 0;           // runda, ki jo je ta naprava že začela
  let G = null;             // igra med rundo
  let seen = {};            // id igralca → {c, w} zadnjič s strežnika (za strele drugih)

  const $ = id => document.getElementById(id);
  const area = () => $('nagajivecArea');
  const now = () => Date.now() + offset;
  const active = () => typeof mode !== 'undefined' && mode === 'nagajivec' && screen !== 'home';
  const bossName = id => (BossArt.find(id) || {}).name || 'Nagajivec';
  const me = () => st && st.players.find(p => p.id === st.me);
  const isHost = () => !!st && st.host === st.me;
  const hostName = () => { const h = st && st.players.find(p => p.id === st.host); return h ? esc(h.name) : 'gostitelj'; };
  const petSvg = (pet, o = {}) => pet ? PetArt.draw(pet, pet.stage, o) : '';

  function save() { try { ng ? localStorage.setItem(KEY, JSON.stringify(ng)) : localStorage.removeItem(KEY); } catch (e) {} }
  function load() { try { const b = JSON.parse(localStorage.getItem(KEY) || 'null'); if (b && b.code && b.token) return b; } catch (e) {} return null; }

  const ERR = {
    login: 'Za boj z nagajivcem se prijavi.',
    closed: 'Igra še ni odprta. Kmalu! 👾',
    no_pet: 'Najprej si izberi ljubljenčka — on bo streljal na nagajivca!',
    not_found: 'Boja s to kodo ni. Preveri številke. 🔍',
    started: 'Ta boj se je že začel. Počakaj na naslednjega ali ustvari svojega.',
    full: `Boj je poln (${MAX} igralcev).`,
    busy: 'Strežnik je zaseden. Poskusi znova čez trenutek.',
    missing: '⚠️ Nagajivec v bazi še ni vklopljen (supabase_nagajivec.sql).',
    offline: '⚠️ Strežnik ni dosegljiv. Preveri internetno povezavo.'
  };
  const errText = r => r === RPC_UNREACHABLE ? ERR.offline : r == null ? ERR.missing : ERR[r.error] || 'Nekaj je šlo narobe. Poskusi znova.';

  /* Klic, ki hkrati izmeri zamik ure (kot btCall). */
  async function call(fn, params) {
    const t0 = Date.now();
    const res = await supabaseRPC(fn, params);
    const t1 = Date.now();
    const s = res && (res.state || (res.status ? res : null));
    if (s && s.now && t1 - t0 <= bestRtt) { bestRtt = t1 - t0; offset = s.now - (t0 + t1) / 2; }
    return res;
  }

  function stop() {
    [pollT, listT, resT].forEach(clearTimeout); pollT = listT = resT = null;
    if (cdT) { clearInterval(cdT); cdT = null; }
    if (G) { clearInterval(G.tick); clearTimeout(G.next); G.active = false; }
  }
  function overlayOff() { const o = $('ngOverlay'); if (o) o.remove(); }

  /* Odhod iz boja (gumb ali preklop na drug način). */
  function leave() {
    overlayOff();
    if (!ng) return;
    const b = ng; ng = null; st = null; save(); stop(); G = null;
    supabaseRPC('boss_leave', { p_code: b.code, p_token: b.token });
  }

  /* ═══ VSTOPNA TOČKA (iz doRestart) ═══ */
  function showPanel() {
    stop();
    const saved = ng || load();
    if (saved && profile) {
      ng = saved; view = 'resume';
      area().innerHTML = '<div class="ng-card">Nalagam boj … 👾</div>';
      poll();
      return;
    }
    renderStart();
  }

  /* ═══ ZAČETNI ZASLON ═══ */
  function renderStart(msg) {
    view = 'start'; st = null; overlayOff();
    const a = area(); if (!a) return;
    const hero = `<div class="ng-hero">${BossArt.group()}</div>`;
    if (!profile || !window.bossAllowed) {
      a.innerHTML = `<div class="ng-card">${hero}<h2>Odženi nagajivce!</h2>
        <p class="ng-rules">Ljubljenčki skupaj premagajo nagajivca — vsak pravilen račun je strel.</p>
        <div class="ng-msg">${profile ? ERR.closed : ERR.login}</div></div>`;
      return;
    }
    a.innerHTML = `<div class="ng-card">${hero}<h2>Odženi nagajivce!</h2>
      <p class="ng-rules">60 sekund · 1–${MAX} igralcev · vsak računa na svoji ravni.<br>
        Vsak pravilen račun je strel tvojega ljubljenčka. Napačen vzame srček.<br>
        Premagajte nagajivca, preden pride do vas!</p>
      <div class="ng-msg" id="ngMsg">${msg ? esc(msg) : ''}</div>
      <div id="ngPetFix"></div>
      <button class="ng-btn" id="ngCreate">👾 Ustvari boj</button>
      <div class="ng-or">ali se pridruži prijateljem</div>
      <div class="ng-join"><input id="ngCode" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="koda">
        <button class="ng-btn" id="ngJoin">Pridruži se</button></div>
      <div class="ng-open"><h3>Odprti boji</h3><div id="ngOpen"><div class="ng-hint">Iščem …</div></div></div>
    </div>`;
    const code = $('ngCode');
    code.addEventListener('input', () => { code.value = code.value.replace(/\D/g, '').slice(0, 4); });
    code.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); join(code.value); } });
    $('ngCreate').addEventListener('click', create);
    $('ngJoin').addEventListener('click', () => join(code.value));
    if (msg === ERR.no_pet) petFix();
    listGen++; refreshList(listGen);
  }
  function petFix() {
    const el = $('ngPetFix'); if (!el || typeof Svet === 'undefined') return;
    el.innerHTML = '<button class="ng-btn ghost">🐾 Izberi ljubljenčka</button>';
    el.firstChild.addEventListener('click', () => Svet.open('pet'));
  }
  function setMsg(t) { const el = $('ngMsg'); if (el) el.textContent = t || ''; if (t === ERR.no_pet) petFix(); }
  function busy(on) { ['ngCreate', 'ngJoin'].forEach(id => { const b = $(id); if (b) b.disabled = on; }); }

  async function refreshList(gen) {
    if (gen !== listGen || view !== 'start' || !active() || !profile) return;
    const r = await supabaseRPC('boss_list_open', { p_student: profile.id });
    if (gen !== listGen || view !== 'start') return;
    const el = $('ngOpen');
    if (el && Array.isArray(r)) {
      el.innerHTML = r.length ? r.map(b => `<div class="ng-open-row"><b>${esc(b.code)}</b>
          <span>${(b.players || []).map(esc).join(', ')}</span><button data-code="${esc(b.code)}">Pridruži se</button></div>`).join('')
        : '<div class="ng-hint">Zdaj ni odprtega boja — ustvari svojega!</div>';
      el.querySelectorAll('[data-code]').forEach(b => b.addEventListener('click', () => join(b.dataset.code)));
    }
    listT = setTimeout(() => refreshList(gen), POLL_LIST);
  }

  async function create() {
    busy(true); setMsg('Ustvarjam …');
    const r = await call('boss_create', { p_student: profile.id });
    if (!r || r === RPC_UNREACHABLE || r.error) { busy(false); setMsg(errText(r)); return; }
    enter(r);
  }
  async function join(code) {
    code = String(code || '').trim();
    if (!/^\d{4}$/.test(code)) { setMsg('Koda ima 4 številke.'); return; }
    busy(true); setMsg('Pridružujem …');
    const r = await call('boss_join', { p_code: code, p_student: profile.id });
    if (!r || r === RPC_UNREACHABLE || r.error) { busy(false); setMsg(errText(r)); return; }
    enter(r);
  }
  function enter(r) {
    SFX.levelUp();
    ng = { code: r.state.code, token: r.token }; save();
    played = r.state.round;               // runde pred vstopom niso naše
    if (listT) { clearTimeout(listT); listT = null; }
    apply(r.state);
  }

  /* ═══ SINHRONIZACIJA ═══ */
  function schedule(ms) { clearTimeout(pollT); pollT = setTimeout(poll, ms); }
  async function poll() {
    pollT = null;
    if (!ng || !active()) return;
    const p = { p_code: ng.code, p_token: ng.token };
    if (G && G.round) Object.assign(p, { p_round: G.round, p_correct: G.correct, p_wrong: G.wrong });
    const sent = ng;
    const r = await call('boss_sync', p);
    if (ng !== sent) return;
    if (r === RPC_UNREACHABLE || r == null) {
      offline = true; const n = $('ngNet'); if (n) n.style.display = '';
      if (view === 'resume') { ng = null; save(); renderStart(errText(r)); return; }
      schedule(POLL_GAME); return;
    }
    offline = false; const n = $('ngNet'); if (n) n.style.display = 'none';
    if (r.error) {
      ng = null; save(); stop(); G = null;
      renderStart('Boj je končan ali te v njem ni več. Ustvari novega ali se pridruži drugemu.');
      return;
    }
    apply(r);
  }

  /* Iz stanja strežnika izbere pravi zaslon. */
  function apply(s) {
    const prev = st;
    st = s;
    if (!ng || !active()) return;
    if (s.status === 'lobby') {
      if (view !== 'lobby') { stop(); overlayOff(); G = null; renderLobby(); } else updateLobby();
      schedule(POLL_LOBBY); return;
    }
    if (s.status === 'running') {
      const fresh = s.round !== played;
      if (fresh && now() < s.ends_at - 5000) { played = s.round; countdown(); }
      else if (fresh || view === 'resume') { played = s.round; lateScreen(); }
      else if (view === 'game') others();
      schedule(view === 'game' ? POLL_GAME : POLL_LOBBY); return;
    }
    // finished
    if (view === 'game') {
      others();
      if (G && G.active) localEnd(s.result === 'win' ? 'win' : 'lose');
      if (!resT) resT = setTimeout(() => { resT = null; result(); }, 1600);
    } else if (view !== 'result' && view !== 'game') result();
    else if (prev && prev.host !== s.host) resultButtons();
    schedule(POLL_END);
  }

  /* ═══ ČAKALNICA ═══ */
  function renderLobby() {
    view = 'lobby';
    area().innerHTML = `<div class="ng-card">
      <div class="ng-hint">Koda boja</div><div class="ng-code">${esc(st.code)}</div>
      <div class="ng-hint">Povej jo prijateljem — vpišejo jo pod »Odženi nagajivce!«</div>
      <h3>Koga gremo premagat?</h3><div class="ng-bosses" id="ngBosses"></div>
      <h3>Tvoji računi</h3><div class="ng-levels" id="ngLevels"></div>
      <h3 id="ngTeamH">Ekipa</h3><div class="ng-team" id="ngTeam"></div>
      <div class="ng-msg" id="ngMsg"></div>
      <div id="ngAct"></div>
      <button class="ng-btn ghost" id="ngLeave" style="margin-top:10px">Zapusti boj</button>
      <div class="ng-net" id="ngNet" style="display:none">⚠️ Povezava je prekinjena …</div>
    </div>`;
    $('ngLeave').addEventListener('click', () => { leave(); renderStart(); });
    updateLobby();
  }
  function updateLobby() {
    if (view !== 'lobby' || !st) return;
    const m = me(), mine = m ? m.vote : null;
    $('ngBosses').innerHTML = BossArt.BOSSES.map(b => `<button class="ng-boss${mine === b.id ? ' on' : ''}" data-vote="${b.id}">
        ${BossArt.draw(b.id, 'walk')}${b.name}
        <div class="ng-votes">${st.players.filter(p => p.vote === b.id).map(p => petSvg(p.pet, { viewBox: PetArt.faceBox(p.pet && p.pet.stage) })).join('')}</div>
      </button>`).join('');
    const lv = (m && m.levels) || ['d10'];
    $('ngLevels').innerHTML = Object.keys(LEVEL).map(k => `<button class="ng-lv${m && m.level === k ? ' on' : ''}" data-lv="${k}" ${lv.includes(k) ? '' : 'disabled'}>
        ${LEVEL[k]}${lv.includes(k) ? '' : ' 🔒'}</button>`).join('');
    $('ngTeamH').textContent = `Ekipa · ${st.players.length} / ${MAX}`;
    $('ngTeam').innerHTML = st.players.map(p => `<div class="ng-mate${p.id === st.me ? ' me' : ''}">${petSvg(p.pet)}
        ${esc(p.name)}${p.id === st.host ? ' 👑' : ''}<small>${LEVEL[p.level] || ''}</small></div>`).join('');
    document.querySelectorAll('#ngBosses [data-vote]').forEach(b => b.addEventListener('click', () => choose(b.dataset.vote, null)));
    document.querySelectorAll('#ngLevels [data-lv]').forEach(b => b.addEventListener('click', () => { if (!b.disabled) choose(null, b.dataset.lv); }));
    const act = $('ngAct');
    if (isHost()) {
      if (!$('ngStart')) {
        act.innerHTML = '<button class="ng-btn" id="ngStart">▶ Začni boj</button>';
        $('ngStart').addEventListener('click', start);
      }
    } else act.innerHTML = `<div class="ng-wait">Čakamo, da ${hostName()} začne boj …</div>`;
  }
  async function choose(vote, level) {
    const m = me(); if (!m) return;
    if (vote) m.vote = vote;
    if (level) m.level = level;
    SFX.click(); updateLobby();               // takoj pokaži, baza potrdi
    const r = await call('boss_choose', { p_code: ng.code, p_token: ng.token, p_vote: vote, p_level: level });
    if (r && !r.error && r !== RPC_UNREACHABLE && view === 'lobby') { st = r; updateLobby(); }
  }
  async function start() {
    const b = $('ngStart'); if (b) { b.disabled = true; b.textContent = 'Začenjam …'; }
    const r = await call('boss_start', { p_code: ng.code, p_token: ng.token });
    if (!r || r === RPC_UNREACHABLE || r.error) { setMsg(errText(r)); if (b) { b.disabled = false; b.textContent = '▶ Začni boj'; } return; }
    apply(r);
  }

  /* ═══ ODŠTEVANJE ═══ */
  function countdown() {
    view = 'countdown'; stop(); overlayOff();
    if (typeof collapseToolbar === 'function') collapseToolbar();
    document.body.insertAdjacentHTML('beforeend', `<div class="ng-overlay" id="ngOverlay"><div class="ng-card">
      <div class="ng-res-art">${BossArt.draw(st.boss, 'walk')}</div>
      <h2>Prihaja ${bossName(st.boss)}!</h2>
      <div class="ng-hint">${st.players.length === 1 ? 'Sam proti nagajivcu' : `${st.players.length} ljubljenčkov skupaj`} · ${st.hp} zadetkov za zmago</div>
      <div class="ng-cd" id="ngCd"></div></div></div>`);
    let shown = null;
    const step = () => {
      const left = st.starts_at - now();
      if (left <= 0) { clearInterval(cdT); cdT = null; SFX.levelUp(); overlayOff(); startGame(); return; }
      const s = Math.ceil(left / 1000), label = s > 3 ? '…' : String(s);
      if (label !== shown) { shown = label; const el = $('ngCd'); if (el) el.textContent = label; if (s <= 3) SFX.click(); }
    };
    step(); cdT = setInterval(step, 50);
  }

  function lateScreen() {
    view = 'late'; overlayOff();
    area().innerHTML = `<div class="ng-card"><div class="ng-res-art">${BossArt.draw(st.boss || 'sluzko', 'walk')}</div>
      <h2>Boj poteka</h2><p class="ng-rules">Ta boj se je začel brez tebe. Ko se konča, se lahko pridružiš naslednjemu.</p></div>`;
  }

  /* ═══ IGRA ═══ */
  function deck(level) {
    const a = do20Cards.filter(c => c.g === level);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  /* Kje stoji kateri ljubljenček: spredaj 4, zadaj do 4 (manjši). */
  function petPos(i, n) {
    const back = n > 4 && i >= Math.ceil(n / 2);
    const row = back ? i - Math.ceil(n / 2) : i, k = back ? .38 : .46;
    return { x: (back ? 24 : 2) + row * 44, y: back ? 76 : 104, k };
  }

  function startGame() {
    if (!active() || !st) return;
    view = 'game';
    const m = me();
    G = { round: st.round, startsAt: st.starts_at, endsAt: st.ends_at, hp: st.hp, hearts: st.hearts,
          queue: deck((m && m.level) || 'd10'), idx: 0, correct: 0, wrong: 0, input: '',
          answered: false, dizzyUntil: 0, active: true, ended: null, tick: null, next: null };
    seen = {};
    st.players.forEach(p => { seen[p.id] = { c: p.correct, w: p.wrong }; });
    const n = st.players.length;
    const pets = st.players.map((p, i) => {
      const q = petPos(i, n);
      return `<g class="ng-pet${p.id === st.me ? ' me' : ''}" data-pid="${esc(p.id)}" transform="translate(${q.x} ${q.y}) scale(${q.k})">
        <g class="ng-pet-in">${petSvg(p.pet, { inner: true })}</g>
        <g class="ng-dizzy">${BossArt.stars(100, 30, 46)}</g>
        <text x="100" y="212" text-anchor="middle" class="ng-name">${esc(p.name)}</text></g>`;
    });
    // zadnja vrsta prva, da je sprednja čez njo
    const order = st.players.map((p, i) => i).sort((a, b) => petPos(b, n).y - petPos(a, n).y).reverse();
    area().innerHTML = `<div class="ng-game">
      <div class="ng-hud">
        <div class="ng-hp"><div class="ng-hp-top"><span>👾 ${bossName(st.boss)}</span><span id="ngHpNum"></span></div>
          <div class="ng-bar"><i id="ngHp"></i></div></div>
        <div class="ng-hearts" id="ngHearts"></div>
        <div class="ng-time" id="ngTime">60</div>
      </div>
      <div class="ng-scene"><svg viewBox="0 26 400 182" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="200" cy="214" rx="260" ry="34" fill="#cfe7a6"/>
        <g>${order.map(i => pets[i]).join('')}</g>
        <g id="ngBossG" transform="translate(${BOSS_X0} ${BOSS_Y}) scale(${BOSS_K})"><g id="ngBossIn" class="ng-boss-walk">${BossArt.draw(st.boss, 'walk', { inner: true })}</g></g>
        <g id="ngBeams"></g>
      </svg></div>
      <div class="ng-q" id="ngQ"></div>
      <div class="ng-keys" id="ngKeys">
        <div class="keypad-display" id="ngDisplay"><span class="keypad-display-text" id="ngDisplayText">_</span></div>
        <div class="keypad-grid" id="ngGrid">
          ${['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => `<button class="keypad-btn" data-d="${d}">${d}</button>`).join('')}
          <button class="keypad-btn keypad-back" data-d="back">⌫</button>
          <button class="keypad-btn" data-d="0">0</button>
          <button class="keypad-btn keypad-ok" data-d="ok">✓</button>
        </div>
        <div class="ng-dazed">😵‍💫 Omotičen … še trenutek</div>
      </div>
      <div class="ng-net" id="ngNet" style="${offline ? '' : 'display:none'}">⚠️ Povezava je prekinjena — računaj naprej.</div>
    </div>`;
    document.querySelectorAll('#ngGrid .keypad-btn').forEach(b => b.addEventListener('click', () => input(b.dataset.d)));
    showQ(); hud();
    G.tick = setInterval(tick, 100);
    schedule(POLL_GAME);
  }

  function totals() {
    let c = G ? G.correct : 0, w = G ? G.wrong : 0;
    (st ? st.players : []).forEach(p => { if (p.id !== st.me) { c += p.correct; w += p.wrong; } });
    return { c, w };
  }
  function hud() {
    if (!G) return;
    const t = totals(), hpLeft = Math.max(0, G.hp - t.c), hLeft = Math.max(0, G.hearts - t.w);
    const bar = $('ngHp'); if (bar) bar.style.width = (G.hp ? hpLeft / G.hp * 100 : 0) + '%';
    const num = $('ngHpNum'); if (num) num.textContent = `${hpLeft} / ${G.hp}`;
    const h = $('ngHearts');
    if (h) h.innerHTML = Array.from({ length: G.hearts }, (_, i) => `<span class="${i < hLeft ? '' : 'lost'}">❤️</span>`).join('');
    return { hpLeft, hLeft };
  }
  function bossPose(pose) {
    const el = $('ngBossIn'); if (!el || !st) return;
    el.innerHTML = BossArt.draw(st.boss, pose, { inner: true });
    el.classList.toggle('ng-boss-walk', pose === 'walk');
  }
  function bossX() {
    const p = Math.min(1, Math.max(0, (now() - G.startsAt) / (G.endsAt - G.startsAt)));
    return BOSS_X0 - (BOSS_X0 - BOSS_X1) * p;
  }
  function tick() {
    if (!G) return;
    const b = $('ngBossG');
    if (b && G.active) b.setAttribute('transform', `translate(${bossX().toFixed(1)} ${BOSS_Y}) scale(${BOSS_K})`);
    const left = Math.max(0, Math.ceil((G.endsAt - now()) / 1000)), t = $('ngTime');
    if (t && t.textContent !== String(left)) { t.textContent = left; t.classList.toggle('danger', left <= 10); if (left <= 5 && left > 0 && G.active) SFX.click(); }
    if (!G.active) return;
    const keys = $('ngKeys'); if (keys) keys.classList.toggle('dazed', Date.now() < G.dizzyUntil);
    const r = hud();
    if (r.hpLeft <= 0) localEnd('win');
    else if (r.hLeft <= 0) localEnd('lose');
    else if (now() >= G.endsAt) localEnd('lose');
  }

  function showQ() {
    const cur = G.queue[G.idx % G.queue.length];
    if (G.idx && G.idx % G.queue.length === 0) G.queue = deck(G.queue[0].g);
    const q = $('ngQ'); if (q) q.textContent = cur.question;
    const d = $('ngDisplay');
    if (d) { d.className = 'keypad-display'; d.innerHTML = '<span class="keypad-display-text" id="ngDisplayText">_</span>'; }
    G.input = ''; G.answered = false;
    document.querySelectorAll('#ngGrid .keypad-btn').forEach(b => b.disabled = false);
    questionShownTs = Date.now();
  }
  function input(d) {
    if (!G || !G.active || G.answered || Date.now() < G.dizzyUntil) return;
    if (d === 'back') { G.input = G.input.slice(0, -1); SFX.click(); }
    else if (d === 'ok') { check(); return; }
    else { if (G.input.length >= 2) return; G.input += d; SFX.click(); }
    const t = $('ngDisplayText'); if (t) t.textContent = G.input || '_';
  }
  function check() {
    if (!G.input.length) return;
    G.answered = true;
    const cur = G.queue[G.idx % G.queue.length], ok = G.input === cur.answer;
    const d = $('ngDisplay');
    if (ok) {
      SFX.correct(); G.correct++;
      if (d) d.classList.add('correct');
      shoot(st.me);
    } else {
      SFX.wrong(); G.wrong++;
      if (d) { d.classList.add('wrong'); d.innerHTML = `<span class="keypad-display-text keypad-strike">${esc(G.input)}</span>
        <span class="keypad-display-arrow">→</span><span class="keypad-display-correct">${esc(cur.answer)}</span>`; }
      G.dizzyUntil = Date.now() + DIZZY_MS;
      dizzy(st.me);
    }
    recordTableStat(cur.question, ok);
    hud();
    document.querySelectorAll('#ngGrid .keypad-btn').forEach(b => b.disabled = true);
    const g = G;
    g.next = setTimeout(() => { if (G === g && g.active) { g.idx++; showQ(); } }, ok ? 260 : DIZZY_MS);
  }

  /* Strel ljubljenčka igralca pid v nagajivca. */
  function shoot(pid) {
    const pg = document.querySelector(`.ng-pet[data-pid="${CSS.escape(pid)}"]`), beams = $('ngBeams');
    if (!pg || !beams || !G) return;
    const m = /translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/.exec(pg.getAttribute('transform'));
    if (!m) return;
    const k = +m[3], x1 = +m[1] + 100 * k, y1 = +m[2] + 92 * k;
    const x2 = bossX() + 96 * BOSS_K + (Math.random() * 20 - 10), y2 = BOSS_Y + 100 * BOSS_K + (Math.random() * 30 - 15);
    const p = st.players.find(q => q.id === pid), c = BEAM[p && p.pet && p.pet.species] || '#ff8a3d';
    beams.insertAdjacentHTML('beforeend', `<g class="ng-shot">
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="10" stroke-linecap="round" class="ng-beam" opacity=".8"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="5.5" stroke-linecap="round" class="ng-beam"/>
      <circle cx="${x2}" cy="${y2}" r="12" fill="${c}" class="ng-spark"/></g>`);
    const shot = beams.lastElementChild;
    setTimeout(() => shot.remove(), 460);
    if (G.active) { bossPose('hit'); clearTimeout(G.hitT); G.hitT = setTimeout(() => { if (G && G.active) bossPose('walk'); }, 240); }
  }
  function dizzy(pid, ms = DIZZY_MS) {
    const pg = document.querySelector(`.ng-pet[data-pid="${CSS.escape(pid)}"]`);
    if (!pg) return;
    pg.classList.add('dizzy');
    clearTimeout(pg._t);
    if (ms) pg._t = setTimeout(() => pg.classList.remove('dizzy'), ms);
  }

  /* Drugi igralci: iz razlike od zadnjega klica strele in omotičnost. */
  function others() {
    if (!G || !st) return;
    st.players.forEach(p => {
      if (p.id === st.me) return;
      const was = seen[p.id] || { c: 0, w: 0 };
      const shots = Math.min(3, p.correct - was.c);
      for (let i = 0; i < shots; i++) setTimeout(() => shoot(p.id), i * 160);
      if (p.wrong > was.w && G.active) dizzy(p.id);
      seen[p.id] = { c: p.correct, w: p.wrong };
    });
    hud();
  }

  /* Konec na tej napravi: nagajivec pade ali zmaga. Rezultat potrdi baza. */
  function localEnd(how) {
    if (!G || !G.active) return;
    G.active = false; G.ended = how;
    clearTimeout(G.next); clearTimeout(G.hitT);
    document.querySelectorAll('#ngGrid .keypad-btn').forEach(b => b.disabled = true);
    const keys = $('ngKeys'); if (keys) keys.classList.remove('dazed');
    const q = $('ngQ');
    if (how === 'win') {
      bossPose('down'); SFX.victory();
      document.querySelectorAll('.ng-pet').forEach(p => { p.classList.remove('dizzy'); p.classList.add('cheer'); });
      if (q) q.textContent = '🎉 Premagali ste ga!';
    } else {
      bossPose('win'); SFX.wrong();
      document.querySelectorAll('.ng-pet').forEach(p => dizzy(p.dataset.pid, 0));
      if (q) q.textContent = '😵 Ojoj …';
    }
    if (typeof flushStats === 'function') flushStats();
    poll();
  }

  /* ═══ REZULTAT ═══ */
  function result() {
    view = 'result'; stop(); overlayOff();
    if (G) clearInterval(G.tick);
    const win = st.result === 'win', b = st.boss, nm = bossName(b);
    const t = st.players.reduce((a, p) => a + p.correct, 0);
    document.body.insertAdjacentHTML('beforeend', `<div class="ng-overlay" id="ngOverlay"><div class="ng-card">
      <div class="ng-res-art">${BossArt.draw(b, win ? 'down' : 'win')}</div>
      <h2>${win ? '🎉 Zmaga!' : `Tokrat je zmagal${FEM[b] ? 'a' : ''} ${nm}`}</h2>
      <p class="ng-rules">${win ? `${nm} je premagan${FEM[b] ? 'a' : ''}! Skupaj ste zadeli ${t}-krat.`
        : `Zadeli ste ${t} od ${st.hp}. Manjkalo je še ${Math.max(0, st.hp - t)} — poskusite še enkrat!`}</p>
      <div class="ng-team">${st.players.map(p => `<div class="ng-mate${p.id === st.me ? ' me' : ''}">${petSvg(p.pet)}${esc(p.name)}</div>`).join('')}</div>
      ${win ? '<div class="ng-treat">🍎 +3 priboljški za vsakega ljubljenčka</div>' : ''}
      <div id="ngResAct"></div></div></div>`);
    (win ? SFX.victory : SFX.click)();
    resultButtons();
  }
  function resultButtons() {
    const box = $('ngResAct'); if (!box) return;
    box.innerHTML = (isHost() ? '<button class="ng-btn" id="ngAgain">👾 Še enkrat</button>'
      : `<div class="ng-wait">Za nov boj čakamo na ${hostName()} …</div>`)
      + '<button class="ng-btn ghost" id="ngOut" style="margin-top:8px">Zapusti boj</button>';
    const again = $('ngAgain');
    if (again) again.addEventListener('click', async () => {
      again.disabled = true; again.textContent = 'Pripravljam …';
      const r = await call('boss_rematch', { p_code: ng.code, p_token: ng.token });
      if (!r || r === RPC_UNREACHABLE || r.error) { again.disabled = false; again.textContent = '👾 Še enkrat'; return; }
      apply(r);
    });
    $('ngOut').addEventListener('click', () => { leave(); renderStart(); });
  }

  /* ── fizična tipkovnica med bojem ── */
  document.addEventListener('keydown', e => {
    if (!active() || !G || !G.active) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key >= '0' && e.key <= '9') { e.preventDefault(); input(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); input('back'); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input('ok'); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ng && active() && !pollT) poll();
  });

  /* Vsi trije nagajivci na ploščici na začetnem zaslonu. */
  const hb = $('homeBoss');
  if (hb) hb.innerHTML = BossArt.group();

  /* Kdo nagajivca vidi, odloči baza (boss_access: stikalo boss_config.open
     ali preizkuševalec). Brez odgovora ostane skrit. */
  window.bossAllowed = false;
  let accessFor = null;
  function showAccess(on) {
    window.bossAllowed = !!on;
    const tile = document.querySelector('.home-tile.t-nag');
    if (tile) tile.style.display = on ? '' : 'none';
    const tiles = document.querySelector('.home-tiles');
    if (tiles) tiles.classList.toggle('has-nag', !!on);
    if (typeof updateControlLock === 'function') updateControlLock();
    if (active() && view === 'start') renderStart();
  }
  async function checkAccess() {
    const id = profile && !teacherSession ? profile.id : null;
    if (id === accessFor) return;
    accessFor = id;
    if (!id) { showAccess(false); return; }
    const r = await supabaseRPC('boss_access', { p_student: id });
    if (accessFor === id) showAccess(r === true);
  }
  const origProfile = window.updateProfileButton;
  window.updateProfileButton = function () {
    const r = origProfile.apply(this, arguments);
    checkAccess();
    return r;
  };
  checkAccess();

  window.showBossPanel = showPanel;
  window.bossLeave = leave;
})();
