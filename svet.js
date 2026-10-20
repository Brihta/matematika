/* Moj svet — eno okno za vse, kar je učenčevo (20. 10. 2026).

   Prej sta bila dva gumba in dve okni: lik z albumom (album.js, lik.html)
   in ljubljenček (pet.js, ljubljencek.html). Otrok misli "moje stvari",
   ne "album" in "ljubljenček", zato je zdaj:
   - zgoraj EN gumb: glava lika, ljubljenček v kotu, cekini in priboljški;
   - EN okno z zavihkoma "Moj lik" in "Ljubljenček" — preklop brez zapiranja.
   Okno se odpre na zavihku, ki ustreza vaji (Do 20 → ljubljenček, sicer lik).

   Ta datoteka ne ve nič o albumu ali ljubljenčku. album.js in pet.js se
   prijavita z Svet.register(id, …), vstavita svojo stran v Svet.pane(id)
   in povesta, kaj naj gumb pokaže (Svet.chip). Naloži se pred njima. */
(function () {
  document.head.insertAdjacentHTML('beforeend', `<style>
  .sv-chip { order: 5; flex-shrink: 0; display: none; align-items: center; gap: 7px; position: relative; cursor: pointer;
    border-radius: 22px; padding: 3px 12px 3px 3px; font: 800 .82rem/1 inherit; font-family: inherit; white-space: nowrap;
    background: rgba(240,165,0,.10); border: 1px solid rgba(240,165,0,.45); color: #ffd27a; }
  .sv-chip.on { display: flex; }
  .sv-chip:hover { background: rgba(240,165,0,.18); }
  body.do20 .sv-chip { background: #fffef8; border-color: #ecd9bc; color: #05270b; }
  body.do20 .sv-chip:hover { background: #fff; border-color: #9ac334; }
  .sv-faces { position: relative; width: 34px; height: 34px; flex-shrink: 0; }
  .sv-face { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #f6dcbc; }
  .sv-face svg, .sv-mini svg { width: 100%; height: 100%; display: block; }
  .sv-mini { position: absolute; right: -7px; bottom: -5px; width: 20px; height: 20px; border-radius: 50%; overflow: hidden;
    background: #f6e5cd; box-shadow: 0 0 0 2px #fffef8; display: none; }
  .sv-mini.on { display: block; }
  .sv-faces.no-lik .sv-face { display: none; }
  .sv-faces.no-lik .sv-mini { position: static; width: 34px; height: 34px; box-shadow: none; }
  .sv-num { display: none; align-items: center; gap: 4px; }
  .sv-num.on { display: inline-flex; }
  .sv-coin { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff3b0, #f4c542 60%, #d89936);
    box-shadow: inset 0 0 0 1.5px #d89936, inset 0 0 0 3px #f4c542, inset 0 0 0 4px #d89936; }
  body.do20 #svCoins { color: #9a6a00; }          /* rumeno na kremni podlagi se ne bere */
  .sv-badge { position: absolute; top: -6px; right: -6px; background: #f08c2e; color: #fff; border-radius: 999px; min-width: 18px; height: 18px;
    display: none; place-items: center; font-size: .68rem; font-weight: 800; padding: 0 5px; animation: svPulse 1.4s infinite; }
  .sv-badge.on { display: grid; }
  @keyframes svPulse { 50% { transform: scale(1.15); } }

  .sv-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(10,8,16,.55); display: none; padding: 18px; }
  .sv-overlay.on { display: flex; }
  .sv-frame { position: relative; flex: 1; max-width: 1260px; margin: 0 auto; border-radius: 20px; overflow: hidden;
    display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.45); background: #1c1a22; }
  .sv-frame.light { background: #fdfcf3; }
  .sv-bar { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; padding: 10px 12px 8px; background: #16141c;
    border-bottom: 1px solid rgba(255,255,255,.06); }
  .sv-frame.light .sv-bar { background: #f6efdf; border-bottom-color: #ecd9bc; }
  .sv-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(255,255,255,.06); }
  .sv-frame.light .sv-tabs { background: rgba(5,39,11,.06); }
  .sv-tab { display: none; align-items: center; gap: 8px; border: 0; border-radius: 12px; padding: 5px 14px 5px 5px; cursor: pointer;
    font: 800 .95rem/1 inherit; font-family: inherit; background: transparent; color: rgba(255,255,255,.6); }
  .sv-tab.on { display: inline-flex; }
  .sv-tab:hover { color: #fff; }
  .sv-frame.light .sv-tab { color: #5d6b52; }
  .sv-frame.light .sv-tab:hover { color: #05270b; }
  .sv-tab.cur { background: #f0a500; color: #1c1a22; }
  .sv-frame.light .sv-tab.cur { background: linear-gradient(135deg, #c5e05a, #9ac334); color: #05270b; }
  .sv-tab .pic { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: #f6dcbc; flex-shrink: 0; }
  .sv-tab .pic svg { width: 100%; height: 100%; display: block; }
  .sv-close { margin-left: auto; width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; border: 0; cursor: pointer;
    background: #2b2233; color: #fff; font-size: 1.1rem; }
  .sv-frame.light .sv-close { background: #05270b; color: #fdfcf3; }
  .sv-panes { position: relative; flex: 1; min-height: 0; }
  .sv-pane { position: absolute; inset: 0; display: none; }
  .sv-pane.cur { display: block; }
  .sv-pane iframe { width: 100%; height: 100%; border: 0; display: block; }
  @media (max-width: 1180px) { .sv-chip .sv-word { display: none; } }
  @media (max-width: 700px) {
    .sv-overlay { padding: 0; } .sv-frame { border-radius: 0; }
    .sv-tab { font-size: .85rem; padding-right: 10px; } .sv-tab .pic { width: 26px; height: 26px; }
  }
  @media (max-width: 520px) { .sv-chip { padding: 3px 8px 3px 3px; } .sv-chip .sv-num.treats { display: none; } }
  body.competition .sv-chip { order: 2; margin-left: auto; }
  body.competition .sv-chip.on + .profile-btn { margin-left: 0; }
  </style>`);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="sv-overlay" id="svOverlay"><div class="sv-frame" id="svFrame">
      <div class="sv-bar"><div class="sv-tabs" id="svTabs"></div>
        <button class="sv-close" id="svClose" type="button" title="Zapri">✕</button></div>
      <div class="sv-panes" id="svPanes"></div>
    </div></div>`);

  const chip = document.createElement('button');
  chip.className = 'sv-chip'; chip.id = 'svChip'; chip.type = 'button'; chip.title = 'Moj svet: lik, album in ljubljenček';
  chip.innerHTML = `<span class="sv-faces" id="svFaces"><span class="sv-face" id="svFace"></span><span class="sv-mini" id="svMini"></span></span>`
    + `<span class="sv-num" id="svCoinsBox"><span class="sv-coin"></span><span id="svCoins"></span><span class="sv-word" id="svCek"></span></span>`
    + `<span class="sv-num treats" id="svTreatsBox">🍎<span id="svTreats"></span></span>`
    + `<span class="sv-badge" id="svBadge"></span>`;
  const profileBtn = document.getElementById('profileBtn');
  profileBtn.parentNode.insertBefore(chip, profileBtn);

  const $ = id => document.getElementById(id);
  const overlay = $('svOverlay'), frameEl = $('svFrame');
  const tabs = {};        // id → { opts, tab, pane, chip }
  const order = [];
  let cur = null, last = null;

  const avail = id => !!(tabs[id] && tabs[id].opts.available());
  const firstAvail = () => order.find(avail) || null;

  function register(id, opts) {
    const tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'sv-tab';
    tab.innerHTML = `<span class="pic"></span><span>${opts.label}</span>`;
    tab.addEventListener('click', () => show(id));
    $('svTabs').appendChild(tab);
    const pane = document.createElement('div');
    pane.className = 'sv-pane';
    $('svPanes').appendChild(pane);
    tabs[id] = { opts, tab, pane, chip: {} };
    order.push(id);
    update();
  }

  /* Kaj naj pokaže gumb zgoraj: lik → face, coins, cek, badge; ljubljenček → face, treats, badge. */
  function setChip(id, data) {
    if (!tabs[id]) return;
    tabs[id].chip = data || {};
    update();
  }

  function update() {
    const lik = tabs.lik, pet = tabs.pet;
    const hasLik = avail('lik'), hasPet = avail('pet');
    chip.classList.toggle('on', hasLik || hasPet);
    $('svFaces').classList.toggle('no-lik', !hasLik);
    $('svFace').innerHTML = hasLik ? lik.chip.face || '' : '';
    $('svMini').innerHTML = hasPet ? pet.chip.face || '' : '';
    $('svMini').classList.toggle('on', hasPet && !!pet.chip.face);
    $('svCoinsBox').classList.toggle('on', hasLik && lik.chip.coins != null);
    if (hasLik) { $('svCoins').textContent = lik.chip.coins; $('svCek').textContent = lik.chip.cek || ''; }
    $('svTreatsBox').classList.toggle('on', hasPet && pet.chip.treats != null);
    if (hasPet) $('svTreats').textContent = pet.chip.treats;
    // značka: nove sličice (lik) imajo prednost pred "izberi ljubljenčka" (!)
    const badge = (hasLik && lik.chip.badge) || (hasPet && pet.chip.badge) || '';
    $('svBadge').textContent = badge; $('svBadge').classList.toggle('on', !!badge);
    for (const id of order) {
      const t = tabs[id];
      t.tab.classList.toggle('on', avail(id));
      t.tab.querySelector('.pic').innerHTML = t.chip.face || '';
    }
    // zavihek, ki ni več na voljo (odjava, konec sezone), zapre okno
    if (cur && !avail(cur)) close();
  }

  function show(id) {
    if (!avail(id)) return;
    if (cur && cur !== id && tabs[cur].opts.onHide) tabs[cur].opts.onHide();
    cur = last = id;
    for (const k of order) {
      tabs[k].tab.classList.toggle('cur', k === id);
      tabs[k].pane.classList.toggle('cur', k === id);
    }
    frameEl.classList.toggle('light', tabs[id].opts.theme === 'light');
    if (tabs[id].opts.onShow) tabs[id].opts.onShow();
  }

  /* Brez id: pri vaji Do 20 ljubljenček, pri drugi vaji lik, na začetnem
     zaslonu tisti, ki je bil nazadnje odprt. */
  function open(id) {
    if (!id) {
      const home = typeof screen !== 'undefined' && screen === 'home';
      const bySubject = typeof subject !== 'undefined' && subject === 'do20' ? 'pet' : 'lik';
      id = home && last ? last : bySubject;
    }
    if (!avail(id)) id = firstAvail();
    if (!id) return;
    if (document.activeElement) document.activeElement.blur();   // tipke naj ne tečejo v vajo za oknom
    overlay.classList.add('on');
    show(id);
  }
  function close() {
    if (!overlay.classList.contains('on')) return;
    overlay.classList.remove('on');
    const was = cur; cur = null;
    if (was && tabs[was].opts.onHide) tabs[was].opts.onHide();
  }
  const isOpen = id => overlay.classList.contains('on') && (!id || cur === id);

  chip.addEventListener('click', () => open());
  $('svClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });

  window.Svet = { register, chip: setChip, update, open, close, isOpen, has: avail,
                  pane: id => tabs[id] && tabs[id].pane };
})();
