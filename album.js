/* Album, cekini in lik — povezava z aplikacijo (naloži se za battle.js).

   Samo za prijavljene učence in samo, ko teče sezona (supabase_album.sql).
   - Lik je zavihek "Moj lik" v oknu Moj svet (svet.js): lik.html je tam,
     gumb zgoraj pokaže glavo lika, cekine in število novih sličic.
   - Med vadbo: lik spodaj levo poskoči ob pravilnem odgovoru.
   - Po vadbi baza preveri pogoje; nova sličica → obvestilo spodaj.
   Kaj je zasluženo, odloča baza (album_sync), ne ta datoteka.

   lik.html teče v iframu na istem izvoru: kliče parent.albumApi (baza in
   prijavljen učenec) in po vsaki spremembi pokliče parent.albumChanged(stanje). */
(function () {
  const SYNC_MIN_MS = 30000;   // po vadbi baze ne sprašuj pogosteje

  document.head.insertAdjacentHTML('beforeend', `<style>
  .al-buddy { position: fixed; left: 12px; bottom: 8px; width: 120px; height: 120px; z-index: 50; pointer-events: none; display: none; }
  .al-buddy.on { display: block; }
  .al-buddy svg { width: 100%; height: 100%; display: block; }
  .al-buddy.hop { animation: alHop .45s ease-out; }
  @keyframes alHop { 40% { transform: translateY(-18px) rotate(-4deg); } }
  .al-toast { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 160px); z-index: 5100;   /* nad oknom konca igre (5000) */ background: #fff8ec; color: #2b2233;
    border: 2px solid #f08c2e; border-radius: 16px; padding: 10px 14px; font-weight: 700; display: flex; gap: 10px; align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,.35); transition: transform .3s; max-width: calc(100% - 32px); cursor: pointer; }
  .al-toast.on { transform: translate(-50%, 0); }
  .al-toast small { display: block; font-weight: 600; color: #7a7184; }
  /* Vojaška služba v oknu "Konec!" po tekmovanju */
  .al-voj { display: flex; gap: 10px; align-items: center; text-align: left; width: 100%; background: rgba(240,165,0,.12);
    border: 1px solid rgba(240,165,0,.5); border-radius: 14px; padding: 10px 12px; color: #ffd27a; animation: alVoj .5s cubic-bezier(.34,1.56,.64,1); }
  .al-voj b { display: block; font-size: 1.05rem; color: #fff; }
  .al-voj small { display: block; color: rgba(255,255,255,.65); font-weight: 600; }
  .al-voj .ico { font-size: 1.7rem; }
  @keyframes alVoj { from { transform: scale(.6); opacity: 0; } }
  /* Enkratno obvestilo (album_notices): okno sredi zaslona, gumb V redu */
  .al-note { position: fixed; inset: 0; z-index: 5200; background: rgba(10,8,16,.55); display: none; align-items: center; justify-content: center; padding: 18px; }
  .al-note.on { display: flex; }
  .al-note-box { background: #fff8ec; color: #2b2233; border: 2px solid #f08c2e; border-radius: 20px; padding: 22px 22px 18px; max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,.4); text-align: center; animation: alVoj .4s cubic-bezier(.34,1.56,.64,1); }
  .al-note-box .ico { font-size: 2.6rem; line-height: 1; }
  .al-note-box h3 { margin: 8px 0 6px; font-size: 1.25rem; }
  .al-note-box p { margin: 0 0 10px; line-height: 1.45; color: #4a4152; }
  .al-note-box button { margin-top: 6px; background: #f08c2e; color: #fff; border: 0; border-radius: 999px; padding: 10px 28px;
    font: 800 1rem inherit; font-family: inherit; cursor: pointer; }
  .al-note-box button.later { background: none; color: #7a7184; padding: 6px 12px; font-weight: 700; font-size: .9rem; }
  @media (max-width: 600px) { .al-buddy.on { display: none; } }   /* na telefonu bi prekril namig pod tipkovnico */
  @media (max-width: 700px) { .al-buddy { width: 84px; height: 84px; } }
  </style>`);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="al-buddy" id="alBuddy"></div>
    <div class="al-toast" id="alToast"></div>
    <div class="al-note" id="alNote"><div class="al-note-box" id="alNoteBox"></div></div>`);

  const $ = id => document.getElementById(id);
  const buddy = $('alBuddy');
  const shownLik = () => Svet.isOpen('lik');   // je zavihek z likom odprt
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
    Svet.pane('lik').appendChild(frame);
  }
  function dropFrame() {
    if (frame) frame.remove();
    frame = null; state = null; render();
  }

  const label = id => {
    const m = /^([xd])(\d+)$/.exec(id);
    if (m) return `${m[2]} ${m[1] === 'x' ? '×' : '÷'}`;
    return { z0: 'Dobrodošlica', z1: '3 dni zapored', z2: 'Cel teden', z3: '10 dni zapored', z4: '20 dni zapored', z5: '50 dni vadbe',
             t0: 'Prvo tekmovanje', t1: 'Lesena medalja', t2: 'Železna medalja', t3: 'Bronasta medalja',
             t4: 'Srebrna medalja', t5: 'Zlata medalja', t6: 'Rekorder', t7: 'Na lestvici',
             b0: 'Prva bitka', b1: '10 bitk', b2: 'Stopničke', b3: 'Ekipa', b4: 'Zmagovalec', b5: 'Gostitelj',
             p0: 'Korak naprej', p1: 'Trije tedni', p2: 'Napredek', p3: 'Premagana' }[id] || 'Nova sličica';
  };

  /* Most za lik.html: profile je v script.js "let", zato ni window.profile. */
  window.albumApi = { rpc: (fn, params) => supabaseRPC(fn, params), profile: () => profile };

  /* lik.html pokliče ob vsakem novem stanju iz baze. */
  window.albumChanged = function (st) {
    const prev = state;
    state = st;
    render();
    if (!prev && st) checkNotices();
    if (!prev || !st || !st.season) return;
    const was = new Set((prev.stickers || []).map(s => s.id));
    const fresh = (st.stickers || []).filter(s => s.state === 'pending' && !was.has(s.id));
    const prevGold = new Set((prev.stickers || []).filter(s => s.gold).map(s => s.id));
    const gold = (st.stickers || []).filter(s => s.gold && !prevGold.has(s.id));
    const coin = W() && W().cek ? W().cek(20) : 'cekinov';
    /* Ko otrok ni sredi igre, se ovojnica odpre sama (autoEnvelope); obvestilo samo med igro. */
    if (fresh.length && !busy()) return;
    if (fresh.length) toast(`<span style="font-size:1.6rem">✉</span><div>Nova sličica: <b>${label(fresh[0].id)}</b>!${fresh.length > 1 ? ` (in še ${fresh.length - 1})` : ''}<small>Tapni in jo prilepi v album · +20 ${coin}</small></div>`);
    else if (gold.length && !Svet.isOpen()) toast(`<span style="font-size:1.6rem">⭐</span><div>Zlata sličica: <b>${label(gold[0].id)}</b>!<small>Znaš jo tudi po 14 dneh · +20 ${coin}</small></div>`);
    else if (prev.vojska && !prev.vojska.open && st.vojska && st.vojska.open && !Svet.isOpen())
      toast(`<span style="font-size:1.6rem">🎖️</span><div>Poklican${st.avatar && st.avatar.form === 'f' ? 'a' : ''} si v <b>vojaško službo</b>!<small>Tapni in poglej, kaj to pomeni.</small></div>`, 8000);
    else if (!Svet.isOpen()) {
      /* Bitko oceni baza ob koncu bitke — izid vidimo šele ob naslednjem stanju. */
      const nv = st.vojska, top = nv && nv.recent && nv.recent[0];
      if (top && top.kind === 'bit' && !((prev.vojska && prev.vojska.recent) || []).some(x => x.kind === 'bit' && x.ref === top.ref))
        window.albumVojska({ ...top, nabor: top.measure == null, nabor_left: nv.bit.nabor_left, total: nv.total }, true);
    }
  };

  /* Vojaška služba: izid ene igre (tekmovanje: add_comp_round v script.js). */
  window.albumVojska = function (r, inState) {
    if (!r || typeof r !== 'object' || !('coins' in r) || !active()) return;
    const w = ready() ? W() : null, coin = n => (w && w.cek ? w.cek(n) : 'cekinov');
    const what = r.kind === 'bit' ? 'bitko' : 'tekmovanje';
    let head, sub = '';
    if (r.capped) { head = 'danes je plačanih že 10 iger'; sub = 'Jutri spet! Igra se vseeno šteje v tvojo mero.'; }
    else if (r.nabor) { head = `+${r.coins} ${coin(r.coins)} za ${what}`; sub = r.nabor_left ? `Nabor: še ${r.nabor_left} ${r.nabor_left === 1 ? 'igra' : 'igri'}, nato dobiš svojo mero.` : 'Nabor končan — zdaj imaš svojo mero!'; }
    else {
      const m = Number(r.measure), pct = Math.round(r.score / m * 100);
      head = r.score > m ? `nad mero! +${r.coins} ${coin(r.coins)}` : r.coins ? `+${r.coins} ${coin(r.coins)}` : 'tokrat brez plačila';
      sub = `${r.score} točk · ${pct} % tvoje mere (${Math.round(m)})`;
    }
    if (w && w.vojRank && r.coins) {
      const before = w.vojRank(r.total - r.coins), after = w.vojRank(r.total);
      if (after.i > before.i) sub = `Nov čin: ${after.name}!`;
    }
    /* Po tekmovanju: v okno "Konec!" pod rezultat (tam otrok gleda). Sicer obvestilo spodaj. */
    const box = r.kind === 'tek' && document.querySelector('.comp-end-box');
    if (box) {
      const card = document.createElement('div');
      card.className = 'al-voj';
      card.innerHTML = `<span class="ico">⚔️</span><div><small>Vojaška služba</small><b>${head.charAt(0).toUpperCase() + head.slice(1)}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
      const at = box.querySelector('.comp-name-prompt') || box.querySelector('#compSaveBtn');
      box.insertBefore(card, at);
    } else toast(`<span style="font-size:1.6rem">⚔️</span><div>Vojaška služba: <b>${head}</b>${sub ? `<small>${sub}</small>` : ''}</div>`, 6000);
    if (!inState && state && r.coins) { state.coins += r.coins; render(); }
  };

  /* Enkratna obvestila iz baze (album_notices, supabase_spremljevalci.sql).
     Preverimo jih ob prvem stanju po prijavi, pokažemo, ko otrok ni sredi
     igre, in po "V redu" označimo kot prebrana. */
  /* Vsako obvestilo: html(data); neobvezno when() → 'show' | 'wait' | 'skip'
     (skip = brez prikaza označi kot prebrano) in go = { label, tab } za
     gumb, ki odpre zavihek v oknu Moj svet. */
  const NOTICE = {
    'spremljevalci-2026-10': {
      html: d => {
        const nm = { mucek: 'Mačko', lisicka: 'Lisičko' };
        const what = (d.items || []).map(id => nm[id]).filter(Boolean).join(' in ');
        const n = d.coins || 0, coin = W() && W().cek ? W().cek(n) : 'cekinov';
        return `<div class="ico">🐾</div><h3>Spremljevalci so se preselili</h3>`
          + `<p>V trgovini lika ni več spremljevalcev. Svojega spremljevalca si zdaj izbereš in vzgojiš pri vadbi <b>računov do 20</b> — to je tvoj ljubljenček, ki stoji ob tvojem liku.</p>`
          + `<p>Zato smo ti vrnili <b>${n} ${coin}</b>${what ? ` za ${what}` : ''}.</p>`;
      }
    },
    /* Ob odprtju ljubljenčka za vse (supabase_ljubljencek_obvestilo.sql).
       Počaka, da pet.js naloži stanje; kdor si ga je medtem že izbral,
       obvestila ne vidi. */
    'ljubljencek-2026-10': {
      when() {
        const p = window.petApi;
        if (!p || !p.loaded || !p.loaded()) return 'wait';
        if (!Svet.has('pet')) return 'wait';
        return p.hasPet() ? 'skip' : 'show';
      },
      html: () => `<div class="ico">🐣</div><h3>Novo: ljubljenček!</h3>`
        + `<p>Izberi si svojega ljubljenčka — <b>zmajčka, lisičko, sovico ali mucka</b>. Raste, ko računaš <b>do 20</b> hitro in brez napak, in lahko stoji ob tvojem liku.</p>`,
      go: { label: 'Izberi ljubljenčka', tab: 'pet' }
    }
  };
  let noticesChecked = false;
  const notices = [];
  async function checkNotices() {
    if (noticesChecked || !isPupil()) return;
    noticesChecked = true;
    const list = await supabaseRPC('album_notices', { p_student: profile.id });
    if (!Array.isArray(list)) return;
    list.forEach(n => { if (NOTICE[n.code]) notices.push(n); });
  }
  const seen = code => supabaseRPC('album_notice_seen', { p_student: profile.id, p_code: code });
  function showNotice() {
    const note = $('alNote');
    if (!notices.length || note.classList.contains('on') || busy() || Svet.isOpen()) return;
    const n = notices[0], def = NOTICE[n.code];
    const w = def.when ? def.when(n.data || {}) : 'show';
    if (w === 'wait') return;
    if (w === 'skip') { notices.shift(); seen(n.code); return; }
    $('alNoteBox').innerHTML = def.html(n.data || {})
      + (def.go ? `<button type="button" id="alNoteGo">${def.go.label}</button><br><button type="button" class="later" id="alNoteOk">Kasneje</button>`
                : '<button type="button" id="alNoteOk">V redu</button>');
    if (document.activeElement) document.activeElement.blur();   // tipke naj ne tečejo v vajo za oknom
    note.classList.add('on');
    const done = () => { note.classList.remove('on'); notices.shift(); seen(n.code); };
    $('alNoteOk').addEventListener('click', done);
    if (def.go) $('alNoteGo').addEventListener('click', () => { done(); Svet.open(def.go.tab); });
  }

  function render() {
    if (!active()) { buddy.classList.remove('on'); Svet.update(); return; }
    const w = ready() ? W() : null;
    const pend = (state.stickers || []).filter(s => s.state === 'pending').length;
    let face = '';
    if (w) {
      const S = w.S, eq = (S.equip && S.equip[S.active]) || {};
      face = w.hero(S.look, eq, '150 40 212 212', true);
      buddy.innerHTML = w.hero(S.look, eq, '0 0 512 512', true);
    }
    Svet.chip('lik', { face, coins: state.coins, cek: w ? w.cek(state.coins) : 'cekinov', badge: pend ? `✉${pend}` : '' });
  }

  function toast(html, ms = 5000) {
    const t = $('alToast');
    t.innerHTML = html; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
  }
  $('alToast').addEventListener('click', () => { $('alToast').classList.remove('on'); if (active()) open(); });

  const open = () => Svet.open('lik');
  Svet.register('lik', {
    label: 'Moj lik', theme: 'dark', available: () => !!active(),
    onShow() { ensureFrame(); if (ready() && W().albumReload) W().albumReload(); },
    /* Zaprl ali preklopil je, ne da bi prilepil: teh sličic ne odpiramo več
       sami, ostanejo v ovojnici (značka). */
    onHide() { (state && state.stickers || []).forEach(s => { if (s.state === 'pending') shown.add(s.id); }); render(); }
  });

  /* Nova sličica (ali grad za cilj razreda): okno se odpre samo — ne med tekmovanjem ali bitko
     in ne, dokler je odprto okno konca igre (najprej rezultat, potem sličica).
     Vsaka sličica se sama odpre le enkrat. Velja tudi za stare iz ovojnice ob prijavi. */
  const shown = new Set();
  const busy = () => !!cTimer || ['lobby', 'countdown', 'game', 'waiting'].includes(btView)
    || !!document.querySelector('.timed-overlay');
  function autoEnvelope() {
    // pri Do 20 je v ospredju ljubljenček — album počaka na poštevanko
    if (!active() || !ready() || busy() || subject === 'do20') return;
    const w = W(), next = (state.stickers || []).find(s => s.state === 'pending' && !shown.has(s.id));
    if ((!next && !w.S.classWin) || Date.now() < (w.S.calmUntil || 0)) return;
    if (Svet.isOpen() && !shownLik()) return;   // otrok je pri ljubljenčku — ne preklapljamo mu
    if (!Svet.isOpen()) { Svet.open('lik'); frame.focus(); }
    /* Novinca okno najprej vpraša, kdo bo (vitez/vitezinja) — ovojnica pride za tem. */
    if (w.document.getElementById('modal').classList.contains('on')) return;
    if (w.S.classWin) return w.classReward();   // razred je dosegel cilj: grad
    shown.add(next.id);
    w.openEnvelope();
  }

  /* Po vadbi (ko so odgovori zapisani v bazo) naj baza preveri nove sličice. */
  let syncTimer = null;
  function syncSoon() {
    if (!active() || !ready() || Svet.isOpen()) return;
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
    // Do 20 je ljubljenčkov (pet.js): tam lik ne skače in namig o sličicah ne velja
    if (active() && subject !== 'do20') {
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
    buddy.classList.toggle('on', !!active() && subject !== 'do20' && !Svet.isOpen() && panels.some(p => p && p.style.display !== 'none'));
    autoEnvelope();
    showNotice();
  }, 500);

  if (isPupil()) ensureFrame();
})();
