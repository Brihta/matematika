/* Ljubljenček — risbe (Do 20).

   Ena datoteka za vse, ki rišejo ljubljenčka: stran ljubljencek.html,
   ljubljenček med vajo (pet.js) in pozneje spremljevalec ob liku (lik.html).
   Platno je viewBox 0 0 200 200, tla na y ≈ 186.

   Kaj je odklenjeno, odloča baza (supabase_ljubljencek.sql, _pet_allowed).
   Seznami spodaj morajo biti z njo usklajeni: imena barv, vzorcev, vrst in
   vrstni red UNLOCKS. Tukaj so samo zato, da stran lahko pokaže ključavnico.

   Slog je isti kot pri liku: temna obroba, senca spodaj, odsev zgoraj. */
(function () {
  const OL = '#4a2733';

  const SPECIES = [
    { id: 'zmaj',   name: 'Zmajček', acc: 'zmajčka', egg: true  },
    { id: 'lisica', name: 'Lisička', acc: 'lisičko', egg: false },
    { id: 'sova',   name: 'Sovica',  acc: 'sovico',  egg: true  },
    { id: 'macka',  name: 'Mucka',   acc: 'mucko',   egg: false }
  ];
  /* Zmajček in sovica se izvalita iz jajca, lisička in mucka pa sta
     sesalca: na začetku spita zvita v košarici in se ob prvem mejniku
     zbudita. V bazi je prva stopnja za vse 'jajce'. */
  const hatches = id => (SPECIES.find(s => s.id === (id === 'jez' ? 'macka' : id)) || SPECIES[0]).egg;
  const WORDS = {
    egg:  { first: 'Jajce', icon: '🥚', born: 'Jajce se je izvalilo! 🐣', wait: 'se izvali', waitPast: 'se je izvalil', still: 'Še v jajcu' },
    nest: { first: 'Spi v košarici', icon: '🧺', born: 'Ljubljenček se je zbudil! ☀️', wait: 'se zbudi', waitPast: 'se je zbudil', still: 'Še spi' }
  };
  const words = id => WORDS[hatches(id) ? 'egg' : 'nest'];
  const BODY = {
    gozd:   { name: 'Gozdna',   c: '#a3c78c' },
    med:    { name: 'Medena',   c: '#f3a868' },
    nebo:   { name: 'Nebesna',  c: '#9ec8ec' },
    oblak:  { name: 'Oblačna',  c: '#c6b8b4' },
    malina: { name: 'Malinova', c: '#f3a3b8' },
    sliva:  { name: 'Slivova',  c: '#bba6e4' },
    koral:  { name: 'Koralna',  c: '#f6c6ae' },
    polnoc: { name: 'Polnočna', c: '#8797d0' },
    zlata:  { name: 'Zlata',    c: '#f2d27e' }
  };
  const BELLY = {
    krema:   { name: 'Krema',   c: '#fff7ea' },
    breskev: { name: 'Breskev', c: '#ffe2d0' },
    meta:    { name: 'Meta',    c: '#e0f2d4' },
    sivka:   { name: 'Sivka',   c: '#ece4fb' }
  };
  const EYES = {
    rjave:  { name: 'Rjave',   c: '#6b4325' },
    zelene: { name: 'Zelene',  c: '#4f8a3c' },
    modre:  { name: 'Modre',   c: '#3f74b8' },
    zvezde: { name: 'Zvezdne', c: '#e9b52f' }
  };
  const PATTERN = {
    brez:    { name: 'Brez' },
    pike:    { name: 'Pike' },
    proge:   { name: 'Proge' },
    srcki:   { name: 'Srčki' },
    mavrica: { name: 'Mavrica' }
  };
  const FREE = { body: ['gozd', 'med', 'nebo', 'oblak'], belly: Object.keys(BELLY),
                 eyes: ['rjave', 'zelene', 'modre'], pattern: ['brez'] };
  // vsak mejnik odklene eno možnost, v tem vrstnem redu (= _pet_unlocks)
  const UNLOCKS = ['malina', 'pike', 'sliva', 'proge', 'koral', 'zvezde', 'polnoc', 'srcki', 'zlata', 'mavrica'];
  const STAGES = [
    { id: 'jajce',    name: 'Jajce',         from: 0 },
    { id: 'mladicek', name: 'Mladiček',      from: 1 },
    { id: 'mlad',     name: 'Mlad',          from: 4 },
    { id: 'odrasel',  name: 'Odrasel',       from: 7 },
    { id: 'koncna',   name: 'Končna oblika', from: 10 }
  ];
  const stageName = (id, species) => id === 'jajce' ? words(species).first : (STAGES.find(s => s.id === id) || {}).name;
  const stageOf = n => STAGES.slice().reverse().find(s => n >= s.from).id;
  function allowed(kind, val, count) {
    if (FREE[kind].includes(val)) return true;
    const i = UNLOCKS.indexOf(val);
    return i >= 0 && i < count;
  }
  const unlockAt = val => UNLOCKS.indexOf(val) + 1;   // 0 = prosto

  /* ── barvne pomožne ── */
  const hex = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const shade = c => mix(c, '#2a1430', .26), light = c => mix(c, '#ffffff', .4);

  let uid = 0;
  /* Oblika z obrobo; `inner` se nariše znotraj nje (vzorec, senca, odsev). */
  function shape(d, fill, inner = '', w = 4) {
    const id = 'pa' + (++uid);
    return `<path d="${d}" fill="${fill}"/>`
      + (inner ? `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` : '')
      + `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const line = (d, w = 3, c = OL) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sparkle = (x, y, r, c = '#fff6b0') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${c}"/>`;
  const heart = (x, y, r, c) => `<path d="M${x} ${y + r} C${x - r * 1.6} ${y - r * .2} ${x - r * .9} ${y - r * 1.4} ${x} ${y - r * .5} C${x + r * .9} ${y - r * 1.4} ${x + r * 1.6} ${y - r * .2} ${x} ${y + r} Z" fill="${c}"/>`;

  /* Vzorec na telesu (risan v območju telesa, obrezan nanj). */
  function patternFill(p, body, cx, cy, r) {
    const L = light(body), D = shade(body);
    if (p === 'pike') return [[-.5, -.35, .16], [.35, -.5, .12], [.55, .1, .15], [-.2, .2, .1], [-.6, .35, .12], [.15, .55, .11]]
      .map(([a, b, k]) => `<circle cx="${cx + a * r}" cy="${cy + b * r}" r="${k * r}" fill="${L}" opacity=".85"/>`).join('');
    if (p === 'proge') return [-.6, -.25, .1, .45].map(t =>
      `<path d="M${cx - r * 1.2} ${cy + t * r} Q${cx} ${cy + t * r - r * .25} ${cx + r * 1.2} ${cy + t * r}" fill="none" stroke="${D}" stroke-width="${r * .14}" stroke-linecap="round" opacity=".7"/>`).join('');
    if (p === 'srcki') return [[-.5, -.3, .13], [.45, -.4, .11], [.5, .3, .12], [-.45, .45, .1]]
      .map(([a, b, k]) => heart(cx + a * r, cy + b * r, k * r, L)).join('');
    if (p === 'mavrica') return ['#e86a6a', '#f2a24a', '#f2d24a', '#7cc06a', '#5fa0d8', '#9a7ad0'].map((c, i) =>
      `<path d="M${cx - r * 1.3} ${cy - r * .55 + i * r * .2} Q${cx} ${cy - r * .95 + i * r * .2} ${cx + r * 1.3} ${cy - r * .55 + i * r * .2}" fill="none" stroke="${c}" stroke-width="${r * .2}" opacity=".55"/>`).join('');
    return '';
  }

  /* Oči: majhne, polne in temne (v odtenku izbrane barve), z velikim in
     malim odsevom, brez obrobe. "zvezde" imajo zlato zvezdico za odsev. */
  function eyes(eyeKey, x1, x2, y, r) {
    const ec = (EYES[eyeKey] || EYES.rjave).c, star = eyeKey === 'zvezde';
    const fill = star ? '#3b2a48' : mix(ec, '#1c0e14', .5);
    return [x1, x2].map(x => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`
      + (star
        ? `<path d="${starPath(x - r * .2, y - r * .2, r * .55)}" fill="${ec}"/>`
        : `<circle cx="${x - r * .3}" cy="${y - r * .32}" r="${r * .4}" fill="#fff"/>`)
      + `<circle cx="${x + r * .36}" cy="${y + r * .36}" r="${r * .17}" fill="#fff"/>`).join('');
  }
  function starPath(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return 'M' + p.join(' L') + ' Z';
  }
  // usta v obliki "ω"
  const mouthW = (y, w = 2.6) => line(`M92 ${y} Q96 ${y + 5} 100 ${y} Q104 ${y + 5} 108 ${y}`, w);
  // zrcaljenje okoli sredine (x = 100)
  const mir = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${200 - x} ${y}`);
  const both = (d, f) => f(d) + f(mir(d));
  const SOCK = '#5b3c44', PAD = '#f5a7b4';

  /* ── vrste ──
     Slog: plosko, pastelno, ena debela temna obroba, noge so samo črte
     znotraj obrisa (kot na referenci, ki jo je izbral učitelj 20. 10. 2026).
     Skupno: sedeče telo (SIT), glava (HEAD), oči, lička. Vsaka vrsta vrne:
       back    — za telesom (rep, krila)
       bodyD   — drug obris telesa (sova)
       bodyC   — druga barva telesa (sova ima svetlejši trebuh)
       bodyIn  — na telesu, obrezano nanj (trebušček, nogavičke)
       over    — na telesu, čez črte (sovina krila in kremplji, blazinice)
       legs    — false: brez črt nog (sova); sicer od kod gre sredinska črta
       ears    — za glavo (ušesa, rogovi)
       headD   — drug obris glave (lisica z lički, sova s čopki)
       headIn  — na glavi, obrezano nanjo (bela lička)
       face    — na glavi (nos, usta, brki, kljun)
       eyeX, eyeY, eyeR */
  const SIT = 'M76 106 C68 122 64 142 64 160 C52 160 46 170 49 178 C52 186 66 188 78 186 L122 186 C134 188 148 186 151 178 C154 170 148 160 136 160 C136 142 132 122 124 106 Z';
  const HEAD = 'M46 74 C46 44 70 30 100 30 C130 30 154 44 154 74 C154 98 136 112 100 112 C64 112 46 98 46 74 Z';
  const SP = {
    zmaj(c, b) {
      return {
        back: shape('M132 176 C156 180 172 168 172 146 C178 154 182 168 172 180 C162 190 144 190 130 186 Z', c, '', 4.2)
          + both('M70 122 C58 108 40 104 28 110 C36 114 38 120 36 126 C44 124 48 128 48 134 C54 130 62 132 68 136 Z', d => shape(d, c, '', 4))
          + both('M66 120 L44 114', d => line(d, 2.4)),
        bodyIn: `<ellipse cx="100" cy="148" rx="12" ry="18" fill="${b}"/>`,
        legs: 168,
        ears: both('M54 66 C44 62 34 52 30 42 C42 40 54 46 62 56 Z', d => shape(d, c, '', 4))
            + both('M76 38 C72 28 74 20 80 16 C86 20 88 28 86 36 Z', d => shape(d, b, '', 3.6)),
        face: `<circle cx="96" cy="88" r="1.6" fill="${OL}"/><circle cx="104" cy="88" r="1.6" fill="${OL}"/>` + mouthW(93)
      };
    },
    lisica(c, b) {
      const tipEar = d => shape(d, c, `<path d="${d}" fill="none"/>`
          + `<path d="M30 0 L170 0 L170 30 L30 30 Z" fill="${SOCK}"/>`, 4.2);
      return {
        back: shape('M130 182 C160 188 186 170 182 140 C180 124 170 112 158 108 C154 122 158 140 148 152 C142 160 136 164 130 166 Z', c,
            `<path d="M146 100 C170 98 196 112 196 130 C184 128 172 130 160 140 C162 128 156 116 146 110 Z" fill="${b}"/>`, 4.2),
        bodyIn: `<path d="M76 100 C78 128 90 146 100 152 C110 146 122 128 124 100 Z" fill="${b}"/>`
              + `<path d="M84 168 L116 168 L116 192 L84 192 Z" fill="${SOCK}"/>`
              + both('M40 160 C56 158 70 166 75 192 L40 192 Z', d => `<path d="${d}" fill="${SOCK}"/>`),
        legs: 154,
        ears: both('M52 64 C46 44 48 22 58 10 C70 18 84 30 92 40 Z', tipEar)
            + both('M61 52 C58 42 59 32 62 26 C69 31 76 37 81 43 Z', d => `<path d="${d}" fill="${b}"/>`),
        headD: 'M46 70 C46 44 70 30 100 30 C130 30 154 44 154 70 C154 80 158 90 166 96 C154 98 148 104 140 106 C130 112 116 114 100 114 C84 114 70 112 60 106 C52 104 46 98 34 96 C42 90 46 80 46 70 Z',
        headIn: `<path d="M24 86 C46 84 64 88 78 96 C88 101 94 103 100 103 C106 103 112 101 122 96 C136 88 154 84 176 86 L176 130 L24 130 Z" fill="${b}"/>`,
        face: `<ellipse cx="100" cy="90" rx="4.6" ry="3.4" fill="${OL}"/>` + mouthW(95)
      };
    },
    sova(c, b) {
      const belly = mix(c, b, .62), F = '#f2a24e';
      const foot = x => shape(`M${x - 11} 186 C${x - 12} 178 ${x - 6} 174 ${x} 174 C${x + 6} 174 ${x + 12} 178 ${x + 11} 186 C${x + 6} 189 ${x + 2} 186 ${x} 189 C${x - 2} 186 ${x - 6} 189 ${x - 11} 186 Z`, F, '', 3.6);
      return {
        bodyD: 'M60 104 C46 122 44 152 56 172 C64 184 82 190 100 190 C118 190 136 184 144 172 C156 152 154 122 140 104 Z',
        bodyC: belly,
        bodyIn: [[88, 140], [112, 140], [76, 154], [100, 154], [124, 154], [88, 168], [112, 168]]
          .map(([x, y]) => line(`M${x - 6} ${y} Q${x} ${y + 6} ${x + 6} ${y}`, 2.6)).join(''),
        over: both('M62 112 C42 122 34 150 42 176 C47 170 50 177 55 172 C58 178 63 176 66 170 C68 150 70 128 62 112 Z', d => shape(d, c, '', 4))
            + foot(84) + foot(116),
        legs: false,
        headD: 'M50 80 C48 60 50 40 54 24 C62 32 72 36 82 34 C92 32 108 32 118 34 C128 36 138 32 146 24 C150 40 152 60 150 80 C150 104 130 116 100 116 C70 116 50 104 50 80 Z',
        face: shape('M100 60 C88 44 60 46 60 74 C60 98 82 108 100 108 C118 108 140 98 140 74 C140 46 112 44 100 60 Z', b, '', 3.6)
            + shape('M95 86 C95 83 105 83 105 86 C105 90 102 95 100 97 C98 95 95 90 95 86 Z', F, '', 2.8),
        eyeX: [81, 119], eyeY: 78, eyeR: 9
      };
    },
    macka(c, b) {
      const pads = x => `<ellipse cx="${x}" cy="179" rx="6" ry="4.6" fill="${PAD}"/>`
        + [-5.5, 0, 5.5].map(d => `<circle cx="${x + d}" cy="${d ? 172.5 : 171}" r="2" fill="${PAD}"/>`).join('');
      return {
        back: shape('M132 182 C160 186 172 170 164 150 C158 136 162 126 172 124 C180 124 182 132 176 136 C170 140 170 148 174 156 C184 176 166 192 132 188 Z', c, '', 4.2),
        bodyIn: `<path d="M86 104 C88 120 95 128 100 131 C105 128 112 120 114 104 Z" fill="${b}"/>`,
        over: pads(58) + pads(142),
        legs: 154,
        ears: both('M52 64 C48 46 50 30 58 20 C70 24 82 32 90 40 Z', d => shape(d, c, '', 4.2))
            + both('M60 52 C58 42 59 34 63 28 C69 31 75 35 80 40 Z', d => `<path d="${d}" fill="${PAD}"/>`),
        face: `<path d="M96 86 C96 84 104 84 104 86 C104 88 101.5 90 100 90 C98.5 90 96 88 96 86 Z" fill="${OL}"/>` + mouthW(92)
            + ['M56 86 L32 82', 'M56 93 L32 96', 'M144 86 L168 82', 'M144 93 L168 96'].map(d => line(d, 2.2)).join('')
      };
    }
  };
  SP.jez = SP.macka;   // stari ježki (pred 19. 10. 2026) so postali mucke

  /* ── oprema iz trgovine (supabase_ljubljencek.sql, pet_shop) ──
     Reže: glava (na vrhu glave), obraz (čez oči), vrat (pod brado).
     Glava in obraz se rišeta v skupini glave, zato se z njo povečata. */
  const ACC = {
    pentlja:   { slot: 'glava', name: 'Pentljica' },
    rozica:    { slot: 'glava', name: 'Rožica' },
    kapa:      { slot: 'glava', name: 'Kapa' },
    cilinder:  { slot: 'glava', name: 'Cilinder' },
    ovratnica: { slot: 'vrat',  name: 'Ovratnica' },
    sal:       { slot: 'vrat',  name: 'Šal' },
    metuljcek: { slot: 'vrat',  name: 'Metuljček' },
    ocala:     { slot: 'obraz', name: 'Očala' },
    soncna:    { slot: 'obraz', name: 'Sončna očala' }
  };
  const SLOT_NAME = { glava: 'Na glavo', vrat: 'Okoli vratu', obraz: 'Na oči' };
  function accHead(id) {
    if (id === 'pentlja') return shape('M124 40 L108 30 L110 50 Z', '#e86a8a', '', 3) + shape('M124 40 L140 30 L138 50 Z', '#e86a8a', '', 3)
      + `<circle cx="124" cy="40" r="5" fill="#f59ab0" stroke="${OL}" stroke-width="2.5"/>`;
    if (id === 'rozica') return [0, 72, 144, 216, 288].map(a => {
        const r = a * Math.PI / 180, x = 74 + 8 * Math.cos(r), y = 38 + 8 * Math.sin(r);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#fff4f8" stroke="${OL}" stroke-width="2.2"/>`;
      }).join('') + `<circle cx="74" cy="38" r="5" fill="#f2c94a" stroke="${OL}" stroke-width="2.2"/>`;
    // kapa je razširjena na široko glavo (x 48–152)
    if (id === 'kapa') return `<g transform="translate(100 0) scale(1.14 1) translate(-100 0)">` + shape('M58 60 C58 26 142 26 142 60 C120 52 80 52 58 60 Z', '#4f86c6',
        `<path d="M50 44 L150 44 L150 50 L50 50 Z" fill="#fdfcf3" opacity=".8"/><path d="M50 32 L150 32 L150 37 L50 37 Z" fill="#fdfcf3" opacity=".8"/>`, 3.5)
      + shape('M56 62 C80 52 120 52 144 62 L144 70 C120 60 80 60 56 70 Z', '#3b6aa3', '', 3)
      + `<circle cx="100" cy="24" r="8" fill="#fdfcf3" stroke="${OL}" stroke-width="3"/>` + `</g>`;
    if (id === 'cilinder') return `<g transform="rotate(-8 100 40)">`
      + shape('M80 40 L84 6 L116 6 L120 40 Z', '#2f2a36', `<path d="M80 30 L120 30 L120 36 L80 36 Z" fill="#c0392b"/>`, 3.5)
      + shape('M68 40 C80 34 120 34 132 40 C120 46 80 46 68 40 Z', '#2f2a36', '', 3.5) + `</g>`;
    return '';
  }
  function accFace(id, y, r) {
    if (id !== 'ocala' && id !== 'soncna') return '';
    const R = r + 4, fill = id === 'soncna' ? '#2b2530' : 'rgba(255,255,255,.15)', op = id === 'soncna' ? .92 : 1;
    return EYE_X.map(x => `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" opacity="${op}" stroke="${OL}" stroke-width="3.2"/>`).join('')
      + (id === 'soncna' ? EYE_X.map(x => `<path d="M${x - 7} ${y - 5} L${x - 2} ${y - 9}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`).join('') : '')
      + line(`M${EYE_X[0] + R} ${y} Q100 ${y - 6} ${EYE_X[1] - R} ${y}`, 3);
  }
  function accNeck(id) {
    if (id === 'ovratnica') return shape('M70 116 C86 126 114 126 130 116 L130 124 C114 134 86 134 70 124 Z', '#c0392b', '', 3)
      + `<circle cx="100" cy="134" r="6" fill="#f2c94a" stroke="${OL}" stroke-width="2.5"/>`;
    if (id === 'sal') return shape('M66 114 C86 128 114 128 134 114 L136 126 C114 140 86 140 64 126 Z', '#e0874a',
        `<path d="M60 118 L140 118 L140 122 L60 122 Z" fill="#fdfcf3" opacity=".7"/>`, 3)
      + shape('M114 128 L126 128 L130 160 L116 160 Z', '#e0874a', `<path d="M110 146 L134 146 L134 150 L110 150 Z" fill="#fdfcf3" opacity=".7"/>`, 3);
    if (id === 'metuljcek') return shape('M100 124 L82 114 L82 134 Z', '#6a4fc0', '', 3) + shape('M100 124 L118 114 L118 134 Z', '#6a4fc0', '', 3)
      + `<circle cx="100" cy="124" r="5" fill="#8a6fe0" stroke="${OL}" stroke-width="2.5"/>`;
    return '';
  }

  /* Odrasla žival; head = koliko večja je glava (mladiči imajo večjo). */
  const EYE_X = [76, 124];
  function creature(pet, head) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const sp = (SP[pet.species] || SP.zmaj)(c, b);
    const body = shape(sp.bodyD || SIT, sp.bodyC || c, (sp.bodyC ? '' : patternFill(pet.pattern, c, 100, 150, 34)) + (sp.bodyIn || ''), 4.4);
    // noge: stegna zadnjih nog, zunanja rob sprednjih nog in sredinska črta
    const legs = sp.legs === false ? '' : both('M64 156 C70 162 73 172 74 186', d => line(d, 3))
      + both('M84 134 C84 152 84 170 84 186', d => line(d, 3)) + line(`M100 ${sp.legs} L100 186`, 3);
    const eyeX = sp.eyeX || EYE_X, eyeY = sp.eyeY || 80, eyeR = sp.eyeR || 8;
    const headS = shape(sp.headD || HEAD, c, patternFill(pet.pattern, c, 100, 66, 34) + (sp.headIn || ''), 4.4);
    const cheeks = eyeX.map((x, i) => `<ellipse cx="${x + (i ? 12 : -12)}" cy="${eyeY + 12}" rx="8.5" ry="5" fill="#f7a1b2" opacity=".85"/>`).join('');
    const eq = pet.equip || {};
    const headAll = (sp.ears || '') + headS + cheeks + sp.face + eyes(pet.eyes, eyeX[0], eyeX[1], eyeY, eyeR)
      + accFace(eq.obraz, eyeY, 8) + accHead(eq.glava);
    // glavo povečamo okoli vratu (100, 110)
    const k = head || 1;
    return (sp.back || '') + body + legs + (sp.over || '') + accNeck(eq.vrat)
      + `<g transform="translate(100 110) scale(${k}) translate(-100 -110)">${headAll}</g>`;
  }

  /* Jajce (zmajček, sovica). Zmajček spi zvit v bisernem jajcu z zlatimi
     viticami, sovica je naslikana na kremnem jajcu s peresi. */
  const EGG = 'M100 40 C134 40 154 96 154 128 C154 162 130 184 100 184 C70 184 46 162 46 128 C46 96 66 40 100 40 Z';
  const zzz = (x, y) => [[0, 0, 13], [12, -14, 10], [21, -26, 8]].map(([dx, dy, f]) =>
    `<text x="${x + dx}" y="${y + dy}" font-size="${f}" font-weight="900" font-family="system-ui, sans-serif" fill="#7a6f9a">z</text>`).join('');
  const sleepEye = (x, y, w = 6) => line(`M${x - w} ${y} Q${x} ${y + w * .8} ${x + w} ${y}`, 2.8);
  function egg(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const sp = pet.species === 'sova' ? 'sova' : 'zmaj';
    let inner;
    if (sp === 'zmaj') {
      const G = '#d9a640';
      inner = `<path d="M30 30 L170 30 L170 190 L30 190 Z" fill="${mix(c, '#ffffff', .72)}"/>`
        + line('M132 146 C146 164 130 178 108 174 C96 172 92 164 98 160', 9) + line('M132 146 C146 164 130 178 108 174 C96 172 92 164 98 160', 4.4, c)
        + shape('M92 162 L84 168 L96 170 Z', c, '', 2.6)
        + shape('M118 114 C124 98 142 94 150 102 C144 105 142 110 144 116 C138 113 132 115 130 121 C126 117 121 117 118 121 Z', c, line('M120 116 L144 104', 2, shade(c)), 3)
        + shape('M84 132 C84 114 98 106 114 108 C130 110 138 122 136 138 C134 154 118 162 102 160 C90 158 84 146 84 132 Z', c,
            `<ellipse cx="104" cy="142" rx="12" ry="13" fill="${b}"/>`, 3.6)
        + shape('M70 100 C62 96 57 90 56 83 C63 84 69 89 72 95 Z', c, '', 2.8) + shape('M112 98 C120 94 125 88 126 81 C119 82 113 87 110 93 Z', c, '', 2.8)
        + shape('M79 84 C78 79 80 75 84 74 C87 77 87 81 86 84 Z', b, '', 2.6) + shape('M96 82 C97 77 100 74 104 74 C106 78 105 81 102 84 Z', b, '', 2.6)
        + shape('M66 104 C66 88 78 80 92 80 C106 80 118 90 116 104 C114 118 102 124 90 124 C76 124 66 116 66 104 Z', c, '', 3.6)
        + sleepEye(82, 102, 5) + sleepEye(100, 102, 5)
        + `<ellipse cx="76" cy="111" rx="5" ry="3" fill="#f7a1b2"/><ellipse cx="106" cy="111" rx="5" ry="3" fill="#f7a1b2"/>`
        + line('M88 113 Q91 116 94 113', 2)
        + ['M58 124 C52 102 60 82 74 68', 'M142 124 C148 102 140 82 126 68', 'M58 150 C64 168 78 178 92 180', 'M142 150 C136 168 122 178 108 180', 'M74 68 C70 62 74 56 80 58', 'M126 68 C130 62 126 56 120 58']
          .map(d => line(d, 3, G)).join('')
        + `<ellipse cx="60" cy="116" rx="5" ry="13" fill="#fff" opacity=".7" transform="rotate(10 60 116)"/>`;
    } else {
      const leaf = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})">${shape('M0 -16 C7 -7 7 7 0 16 C-7 7 -7 -7 0 -16 Z', mix(c, '#ffffff', .2), line('M0 -14 L0 14', 1.8, shade(c)), 2.6)}</g>`;
      inner = `<path d="M30 30 L170 30 L170 190 L30 190 Z" fill="#fbf2e2"/>`
        + shape('M66 104 C64 88 66 74 70 62 C78 70 88 72 100 72 C112 72 122 70 130 62 C134 74 136 88 134 104 C132 128 118 140 100 140 C82 140 68 128 66 104 Z', c, '', 3.6)
        + shape('M100 88 C92 78 74 78 74 96 C74 112 88 120 100 120 C112 120 126 112 126 96 C126 78 108 78 100 88 Z', b, '', 2.8)
        + sleepEye(88, 100, 6) + sleepEye(112, 100, 6)
        + shape('M96 104 C96 102 104 102 104 104 C104 107 102 110 100 112 C98 110 96 107 96 104 Z', '#f2a24e', '', 2.2)
        + both('M68 112 C72 134 88 148 100 150 C94 136 84 122 68 112 Z', d => shape(d, shade(c), '', 3))
        + leaf(66, 156, -30) + leaf(136, 152, 30) + leaf(124, 170, 50)
        + `<ellipse cx="62" cy="104" rx="5" ry="11" fill="#fff" opacity=".7" transform="rotate(14 62 104)"/>`;
    }
    return shape(EGG, '#fff', inner, 4.4) + (sp === 'zmaj' ? zzz(126, 98) : '');
  }

  /* Košarica z ročajem: zadnji del (ročaj, notranjost, blazina v barvi
     trebuščka) in sprednji del (pletenje, odejica čez rob). dy = zamik. */
  const WICKER = '#d9a062', WICK_D = '#a86f38', WICK_L = '#ecc58e';
  const basketBack = (dy = 0, pet = {}) => {
    const b = (BELLY[pet.belly] || BELLY.krema).c;
    const h = 'M50 136 C46 70 70 46 100 46 C130 46 154 70 150 136';
    return `<g transform="translate(0 ${dy})">` + line(h, 12) + line(h, 7, WICKER)
      + [[58, 84], [72, 60], [100, 48], [128, 60], [142, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${WICK_D}"/>`).join('')
      + shape('M46 136 C46 122 154 122 154 136 C154 146 46 146 46 136 Z', '#8a5a34', '', 4)
      + shape('M52 136 C60 118 140 118 148 136 Z', b, '', 3.4) + `</g>`;
  };
  function basketFront(dy = 0, pet = {}) {
    const b = (BELLY[pet.belly] || BELLY.krema).c;
    const front = 'M44 136 C60 150 140 150 156 136 C156 168 132 188 100 188 C68 188 44 168 44 136 Z';
    const rows = [152, 164, 176];
    const weave = rows.map(y => line(`M40 ${y} Q100 ${y + 10} 160 ${y}`, 2.6, WICK_D)).join('')
      + rows.map((y, i) => [-48, -28, -8, 12, 32, 52].map(dx => {
          const x = 100 + dx + (i % 2 ? 10 : 0), yy = y + 5 * (1 - ((x - 100) / 60) ** 2);
          return line(`M${x} ${yy - 7} L${x} ${yy + 3}`, 2.4, WICK_D);
        }).join('')).join('');
    return `<g transform="translate(0 ${dy})">`
      + shape(front, WICKER, weave, 4.2)
      // odejica čez rob
      + shape('M62 138 C78 148 104 150 124 146 C122 156 112 168 100 170 C88 166 72 156 62 138 Z', b,
          line('M78 152 Q92 160 108 154', 1.6, shade(b)), 3.4)
      // rob košarice kot debela vrv
      + line('M44 136 C60 150 140 150 156 136', 11, OL) + line('M44 136 C60 150 140 150 156 136', 6, WICK_L)
      + `</g>`;
  }
  /* Spanček v košarici (lisička, mucka): zvit klobčič, glava na boku,
     rep ovit naokoli. */
  function sleeper(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const fox = pet.species === 'lisica';
    const body = shape('M70 120 C70 100 92 94 116 96 C140 98 152 110 152 124 C152 136 140 142 116 142 C92 142 70 138 70 120 Z', c,
        patternFill(pet.pattern, c, 120, 116, 26), 4.2);
    const tipEar = d => shape(d, c, (fox ? `<path d="M20 40 L180 40 L180 74 L20 74 Z" fill="${SOCK}"/>` : ''), 4);
    // lisička ima visoka ušesa s temnimi konicami, mucka nižja z rožnato notranjostjo
    const ears = fox
      ? tipEar('M52 98 C46 84 46 70 52 60 C60 64 70 72 74 82 Z') + tipEar('M90 84 C94 74 102 64 112 60 C114 70 112 84 106 92 Z')
        + `<path d="M56 90 C53 82 53 74 56 68 C60 71 65 76 68 82 Z" fill="${b}"/><path d="M97 83 C100 77 104 72 108 69 C109 75 108 81 104 87 Z" fill="${b}"/>`
      : tipEar('M52 100 C48 90 50 80 55 72 C63 76 70 82 74 88 Z') + tipEar('M90 88 C95 80 101 75 108 72 C110 80 108 88 104 95 Z')
        + `<path d="M56 93 C55 87 56 82 58 78 C62 80 66 83 68 87 Z" fill="${PAD}"/><path d="M96 87 C99 83 102 80 105 78 C106 83 105 87 103 91 Z" fill="${PAD}"/>`;
    const head = shape('M46 118 C46 98 60 88 78 88 C96 88 110 98 110 116 C110 134 96 142 78 142 C60 142 46 134 46 118 Z', c,
        patternFill(pet.pattern, c, 78, 112, 18)
      + (fox ? `<path d="M36 120 C52 122 66 120 78 128 C90 120 104 122 120 120 L120 150 L36 150 Z" fill="${b}"/>` : ''), 4.2);
    const face = sleepEye(66, 118, 6) + sleepEye(90, 118, 6)
      + `<ellipse cx="57" cy="128" rx="6" ry="3.6" fill="#f7a1b2"/><ellipse cx="99" cy="128" rx="6" ry="3.6" fill="#f7a1b2"/>`
      + (fox ? `<ellipse cx="78" cy="126" rx="3.6" ry="2.6" fill="${OL}"/>` : `<path d="M75 125 C75 123.5 81 123.5 81 125 C81 126.5 79.5 128 78 128 C76.5 128 75 126.5 75 125 Z" fill="${OL}"/>`)
      + line('M72 131 Q75 134 78 131 Q81 134 84 131', 2)
      + (fox ? '' : ['M50 124 L36 122', 'M50 129 L36 131', 'M106 124 L120 122', 'M106 129 L120 131'].map(d => line(d, 1.8)).join(''));
    // rep ovit spredaj, konica pod brado
    const tail = shape('M150 122 C162 138 140 150 110 150 C92 150 74 150 62 144 C66 136 82 140 100 139 C124 138 144 136 150 122 Z', c,
        fox ? `<ellipse cx="62" cy="144" rx="16" ry="10" fill="${b}"/>` : '', 3.8);
    return basketBack(0, pet) + body + ears + head + face + tail + basketFront(0, pet) + zzz(122, 82);
  }

  const crown = () => `<g transform="translate(0 -6)">${shape('M78 34 L84 10 L94 26 L100 6 L106 26 L116 10 L122 34 Z', '#f4c542',
      `<path d="M70 28 L130 28 L130 40 L70 40 Z" fill="#d89936"/>`, 3.5)}<circle cx="100" cy="20" r="3.5" fill="#e86a8a" stroke="${OL}" stroke-width="2"/></g>`;
  const shell = () => shape('M44 160 L56 150 L66 162 L80 148 L92 162 L104 148 L116 162 L130 148 L142 160 L156 152 C158 176 138 192 100 192 C62 192 42 176 44 160 Z',
    '#fbf6e6', `<path d="M40 176 L160 176 L160 200 L40 200 Z" fill="#e8dcc0"/>`, 3.5);

  /* Glavna risba. stage: jajce | mladicek | mlad | odrasel | koncna */
  function draw(pet, stage, o = {}) {
    pet = Object.assign({ species: 'zmaj', body: 'gozd', belly: 'krema', eyes: 'rjave', pattern: 'brez' }, pet || {});
    const vb = o.viewBox || '0 0 200 200';
    let s = `<ellipse cx="100" cy="188" rx="${stage === 'jajce' ? 46 : 52}" ry="7" fill="#05270b" opacity=".12"/>`;
    const egg1 = hatches(pet.species);
    if (stage === 'jajce') s += `<g class="pa-egg">${egg1 ? egg(pet) : sleeper(pet)}</g>`;
    else if (stage === 'mladicek') s += (egg1 ? '' : basketBack(10, pet))
      + `<g transform="translate(100 192) scale(.66) translate(-100 -186)">${creature(pet, 1.22)}</g>` + (egg1 ? shell() : basketFront(10, pet));
    else if (stage === 'mlad') s += `<g transform="translate(100 188) scale(.82) translate(-100 -186)">${creature(pet, 1.1)}</g>`;
    else {
      if (stage === 'koncna') s = `<circle cx="100" cy="110" r="88" fill="#dde236" opacity=".22"/><circle cx="100" cy="110" r="70" fill="#dde236" opacity=".18"/>` + s;
      s += creature(pet, 1);
      if (stage === 'koncna') s += (pet.equip && pet.equip.glava ? '' : crown())
        + sparkle(30, 60, 9) + sparkle(172, 48, 7) + sparkle(168, 140, 8) + sparkle(28, 150, 6);
    }
    /* inner: samo vsebina, za vgradnjo v drugo risbo (spremljevalec ob liku) */
    if (o.inner) return s;
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="pa-svg">${s}</svg>`;
  }

  window.PetArt = { draw, hatches, words, stageName, SPECIES, BODY, BELLY, EYES, PATTERN, FREE, UNLOCKS, STAGES, ACC, SLOT_NAME, stageOf, allowed, unlockAt };
})();
