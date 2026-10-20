/* Ljubljenček — povezava z aplikacijo (naloži se za album.js).

   Samo pri Do 20, samo za prijavljene učence in samo, ko teče sezona.
   - Zgoraj ob profilu: gumb z ljubljenčkom (namesto gumba z likom in
     cekini, ki pri Do 20 ni smiseln — Do 20 cekinov ne daje).
   - Klik odpre ljubljencek.html v oknu čez aplikacijo.
   - Med vajo: ljubljenček spodaj levo poskoči ob pravilnem odgovoru.
   - Po vaji baza preveri mejnike; nov mejnik → obvestilo spodaj.
   Kaj je doseženo, odloča baza (pet_state), ne ta datoteka. */
(function () {
  const SYNC_MIN_MS = 20000;
  const GROUP_NAME = { d10: 'Do 10', b20: 'Do 20 brez prehoda', pr: 'Do 20 s prehodom' };
  const OPS = { p: '+', m: '−' };

  document.head.insertAdjacentHTML('beforeend', `<style>
  .pt-chip { order: 3; flex-shrink: 0; display: none; align-items: center; gap: 6px; background: #fdfcf3;
    border: 1px solid #ecd9bc; border-radius: 20px; padding: 2px 12px 2px 2px; color: #05270b;
    font: 800 .78rem/1 system-ui, sans-serif; cursor: pointer; white-space: nowrap; position: relative; }
  .pt-chip.on { display: flex; }
  .pt-chip:hover { border-color: #9ac334; background: #fff; }
  .pt-face { width: 32px; height: 32px; border-radius: 50%; background: #f6e5cd; overflow: hidden; }
  .pt-face svg { width: 100%; height: 100%; display: block; }
  .pt-badge { position: absolute; top: -6px; right: -6px; background: #9ac334; color: #05270b; border-radius: 999px;
    min-width: 18px; height: 18px; display: none; place-items: center; font-size: .68rem; font-weight: 900; padding: 0 5px; }
  .pt-badge.on { display: grid; }
  body.do20 .al-chip { display: none !important; }
  .pt-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(5,39,11,.35); display: none; padding: 18px; }
  .pt-overlay.on { display: flex; }
  .pt-frame { position: relative; flex: 1; max-width: 1160px; margin: 0 auto; border-radius: 22px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(5,39,11,.35); background: #fdfcf3; }
  .pt-frame iframe { width: 100%; height: 100%; border: 0; display: block; }
  .pt-close { position: absolute; top: 12px; right: 14px; z-index: 2; width: 38px; height: 38px; border-radius: 50%; border: 0;
    background: #05270b; color: #fdfcf3; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 12px rgba(5,39,11,.3); }
  .pt-buddy { position: fixed; left: 12px; bottom: 6px; width: 130px; height: 130px; z-index: 50; pointer-events: none; display: none; }
  .pt-buddy.on { display: block; }
  .pt-buddy svg { width: 100%; height: 100%; display: block; }
  .pt-buddy.hop { animation: ptHop .45s ease-out; }
  @keyframes ptHop { 40% { transform: translateY(-16px) rotate(-4deg); } }
  .pt-toast { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 170px); z-index: 5100; background: #fffef8; color: #05270b;
    border: 2px solid #9ac334; border-radius: 16px; padding: 8px 14px 8px 8px; font-weight: 800; display: flex; gap: 10px; align-items: center;
    box-shadow: 0 10px 30px rgba(5,39,11,.25); transition: transform .3s; max-width: calc(100% - 32px); cursor: pointer; }
  .pt-toast.on { transform: translate(-50%, 0); }
  .pt-toast .pic { width: 54px; height: 54px; flex-shrink: 0; }
  .pt-toast .pic svg { width: 100%; height: 100%; }
  .pt-toast small { display: block; font-weight: 600; color: #5d6b52; }
  @media (max-width: 600px) { .pt-buddy.on { display: none; } }
  @media (max-width: 700px) { .pt-chip .pt-txt { display: none; } .pt-chip { padding: 2px; } .pt-overlay { padding: 0; } .pt-frame { border-radius: 0; } }
  </style>`);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="pt-overlay" id="ptOverlay"><div class="pt-frame" id="ptFrameBox"><button class="pt-close" id="ptClose" title="Zapri">✕</button></div></div>
    <div class="pt-buddy" id="ptBuddy"></div>
    <div class="pt-toast" id="ptToast"></div>`);

  const chip = document.createElement('button');
  chip.className = 'pt-chip'; chip.id = 'ptChip'; chip.type = 'button'; chip.title = 'Moj ljubljenček';
  chip.innerHTML = `<span class="pt-face" id="ptFace"></span><span class="pt-txt" id="ptTxt">Ljubljenček</span><span class="pt-badge" id="ptBadge"></span>`;
  const profileBtn = document.getElementById('profileBtn');
  profileBtn.parentNode.insertBefore(chip, profileBtn);

  const $ = id => document.getElementById(id);
  const overlay = $('ptOverlay'), buddy = $('ptBuddy');
  let frame = null, state = null, lastSync = 0, syncing = false, quizHinted = false, loadedFor = null;

  const isPupil = () => !!profile && !teacherSession;
  const inDo20 = () => typeof subject !== 'undefined' && subject === 'do20';
  const active = () => isPupil() && state && state.season;

  /* Mostiček za ljubljencek.html (profile je v script.js "let"). */
  window.petApi = {
    rpc: (fn, params) => supabaseRPC(fn, params),
    profile: () => profile,
    /* "Vadi" pri mejniku: Do 20, samo ta skupina in operacija, na tipkovnici. */
    practice(g, op) {
      screen = 'play';
      subject = 'do20';
      groups = new Set([g]);
      opType = op === 'p' ? 'multiply' : 'divide';
      mode = 'keypad';
      saveSettings();
      applyUIFromState(); showPanel(mode); updateControlLock();
      close();
      triggerRestart();
    }
  };

  /* ljubljencek.html pokliče ob vsakem novem stanju iz baze. */
  window.petChanged = function (st) {
    apply(st, false);
    // lik v albumu (lik.html) naj takoj pokaže novega spremljevalca
    const lik = document.querySelector('#alFrameBox iframe');
    try { if (lik && lik.contentWindow.petCompanion) lik.contentWindow.petCompanion(st && st.companion); } catch (e) {}
  };

  function apply(st, announce) {
    const prev = state;
    state = st && st.season ? st : null;
    render();
    if (!announce || !prev || !state) return;
    const was = new Set((prev.milestones || []).filter(m => m.done).map(m => m.g + m.op));
    const fresh = (state.milestones || []).filter(m => m.done && !was.has(m.g + m.op));
    if (!fresh.length) return;
    const m = fresh[0], pic = state.pet ? PetArt.draw(state.pet, state.stage) : '';
    const all = { ...PetArt.BODY, ...PetArt.EYES, ...PetArt.PATTERN };
    const what = PetArt.UNLOCKS.filter(v => PetArt.unlockAt(v) === state.count).map(v => (all[v] || {}).name).join(', ') || null;
    const head = prev.stage === 'jajce' && state.stage !== 'jajce' ? PetArt.words(state.pet && state.pet.species).born
      : prev.stage !== state.stage ? `Ljubljenček je zrasel: ${(PetArt.STAGES.find(s => s.id === state.stage) || {}).name}!`
      : `Nov mejnik: ${GROUP_NAME[m.g]} ${OPS[m.op]}!`;
    toast(`<span class="pic">${pic}</span><div>${head}<small>${state.count}/${PetArt.MILESTONES} mejnikov${what ? ` · odklenjeno: ${what}` : ''} · tapni in poglej</small></div>`, 7000);
  }

  function render() {
    const on = !!active() && (inDo20() || screen === 'home');
    chip.classList.toggle('on', on);
    if (!active()) { buddy.classList.remove('on'); const hp = $('homePet'); if (hp) hp.innerHTML = ''; return; }
    const pet = state.pet || { species: 'zmaj' };
    const stage = state.pet ? state.stage : 'jajce';
    $('ptFace').innerHTML = PetArt.draw(pet, stage, { viewBox: stage === 'jajce' ? '40 40 120 150' : '50 20 100 100' });
    $('ptTxt').textContent = state.pet && state.pet.name ? state.pet.name : 'Ljubljenček';
    const b = $('ptBadge');
    b.textContent = state.pet ? '' : '!';      // še nima ljubljenčka: povabi ga
    b.classList.toggle('on', !state.pet);
    buddy.innerHTML = state.pet ? PetArt.draw(state.pet, state.stage) : '';
    // ljubljenček pokuka iz ploščice Do 20 na začetnem zaslonu
    const hp = $('homePet');
    if (hp) hp.innerHTML = state.pet ? PetArt.draw(state.pet, state.stage) : '';
  }

  async function fetchState(announce) {
    if (!isPupil()) { state = null; render(); return; }
    const st = await supabaseRPC('pet_state', { p_student: profile.id });
    if (st && !st.unreachable) apply(st, announce);
  }

  function toast(html, ms = 5000) {
    const t = $('ptToast');
    t.innerHTML = html; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
  }
  $('ptToast').addEventListener('click', () => { $('ptToast').classList.remove('on'); if (active()) open(); });

  function open() {
    if (!isPupil()) return;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.src = 'ljubljencek.html';
      frame.title = 'Moj ljubljenček';
      $('ptFrameBox').appendChild(frame);
    } else {
      try { frame.contentWindow.petReload(); } catch (e) {}
    }
    if (document.activeElement) document.activeElement.blur();   // tipke naj ne tečejo v vajo za oknom
    overlay.classList.add('on');
  }
  function close() { overlay.classList.remove('on'); render(); }
  chip.addEventListener('click', open);
  $('ptClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('on')) close(); });

  /* Po vaji Do 20 (ko so odgovori zapisani) naj baza preveri mejnike. */
  let syncTimer = null;
  function syncSoon() {
    if (!active() || !inDo20() || overlay.classList.contains('on')) return;
    const wait = lastSync + SYNC_MIN_MS - Date.now();
    if (syncing || wait > 0) { if (!syncTimer) syncTimer = setTimeout(() => { syncTimer = null; syncSoon(); }, Math.max(wait, 1000)); return; }
    syncing = true; lastSync = Date.now();
    fetchState(true).finally(() => { syncing = false; });
  }

  /* Ovijemo funkcije iz script.js — vedenje aplikacije ostane enako. */
  const origFlush = window.flushStats;
  window.flushStats = function () {
    const p = origFlush.apply(this, arguments);
    Promise.resolve(p).then(syncSoon, () => {});
    return p;
  };
  const origProfile = window.updateProfileButton;
  window.updateProfileButton = function () {
    const r = origProfile.apply(this, arguments);
    const id = isPupil() ? profile.id : null;
    if (id !== loadedFor) {
      loadedFor = id;
      if (frame) { frame.remove(); frame = null; }
      state = null; render();
      if (id) fetchState(false);
    }
    return r;
  };
  const origRecord = window.recordTableStat;
  window.recordTableStat = function (question, isCorrect) {
    if (active() && inDo20()) {
      if (isCorrect) { buddy.classList.remove('hop'); void buddy.offsetWidth; buddy.classList.add('hop'); }
      if (mode === 'quiz' && !quizHinted) {
        quizHinted = true;
        toast(`<span style="font-size:1.5rem">⌨️</span><div>Ljubljenček raste na <b>tipkovnici</b><small>V kvizu lahko odgovor uganeš, zato za mejnike ne šteje.</small></div>`, 6000);
      }
    }
    return origRecord.apply(this, arguments);
  };

  /* Gumb in ljubljenček med vajo sledita stikalu Poštevanka | Do 20. */
  const panels = ['quizPanel', 'keypadPanel'].map(id => $(id));
  setInterval(() => {
    chip.classList.toggle('on', !!active() && (inDo20() || screen === 'home'));
    buddy.classList.toggle('on', !!active() && inDo20() && !!state.pet && !overlay.classList.contains('on')
      && panels.some(p => p && p.style.display !== 'none'));
  }, 500);

  if (isPupil()) { loadedFor = profile.id; fetchState(false); }
})();
