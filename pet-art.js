/* Ljubljenček — risbe (Do 20).

   Ena datoteka za vse, ki rišejo ljubljenčka: stran ljubljencek.html,
   ljubljenček med vajo (pet.js) in pozneje spremljevalec ob liku (lik.html).
   Platno je viewBox 0 0 200 200, tla na y ≈ 186.

   Kaj je odklenjeno, odloča baza (supabase_ljubljencek.sql, _pet_allowed).
   Seznami spodaj morajo biti z njo usklajeni: imena barv, vzorcev, vrst in
   vrstni red UNLOCKS. Tukaj so samo zato, da stran lahko pokaže ključavnico.

   Slog je isti kot pri liku: temna obroba, senca spodaj, odsev zgoraj. */
(function () {
  const OL = '#3a2a3a';

  const SPECIES = [
    { id: 'zmaj',   name: 'Zmajček', acc: 'zmajčka' },
    { id: 'lisica', name: 'Lisička', acc: 'lisičko' },
    { id: 'sova',   name: 'Sovica',  acc: 'sovico'  },
    { id: 'macka',  name: 'Mucka',   acc: 'mucko'   }
  ];
  const BODY = {
    gozd:   { name: 'Gozdna',   c: '#6f9a4a' },
    med:    { name: 'Medena',   c: '#e0a84a' },
    nebo:   { name: 'Nebesna',  c: '#6fa8d6' },
    oblak:  { name: 'Oblačna',  c: '#a9a3b8' },
    malina: { name: 'Malinova', c: '#d4607f' },
    sliva:  { name: 'Slivova',  c: '#8b6fc0' },
    koral:  { name: 'Koralna',  c: '#ee8460' },
    polnoc: { name: 'Polnočna', c: '#45558c' },
    zlata:  { name: 'Zlata',    c: '#e6c24a' }
  };
  const BELLY = {
    krema:   { name: 'Krema',   c: '#fbf1d8' },
    breskev: { name: 'Breskev', c: '#ffd6b5' },
    meta:    { name: 'Meta',    c: '#d6efc6' },
    sivka:   { name: 'Sivka',   c: '#e6dcfa' }
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

  /* Oči: velike, z odsevom; "zvezde" imajo zvezdico namesto zenice. */
  function eyes(eyeKey, x1, x2, y, r) {
    const ec = (EYES[eyeKey] || EYES.rjave).c;
    return [x1, x2].map(x => {
      const pupil = eyeKey === 'zvezde'
        ? `<path d="${starPath(x, y + r * .05, r * .55)}" fill="${ec}" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/>`
        : `<circle cx="${x}" cy="${y + r * .08}" r="${r * .66}" fill="${ec}"/><circle cx="${x}" cy="${y + r * .12}" r="${r * .36}" fill="${OL}"/>`;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OL}" stroke-width="2.6"/>${pupil}`
        + `<circle cx="${x - r * .32}" cy="${y - r * .3}" r="${r * .26}" fill="#fff"/><circle cx="${x + r * .3}" cy="${y + r * .32}" r="${r * .11}" fill="#fff" opacity=".85"/>`;
    }).join('');
  }
  function starPath(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return 'M' + p.join(' L') + ' Z';
  }

  /* ── vrste ──
     Vsaka vrsta vrne:
       back  — za telesom (rep, krila)
       front — za glavo (ušesa, rogovi, puhasta lica)
       face  — na glavi (gobček, kljun, nos, brki)
       belly — na trebuščku (luske, perje)
       arms  — ali ima prednje tačke (sova ima krila)
       feet  — barva nog, če ni kot telo
     Telo, trebušček, glava in oči so skupni (creature). */
  const SP = {
    zmaj(c, b) {
      const D = shade(c), L = light(c), B = shade(b);
      // rep z bodicami in konico v obliki pike
      const tail = shape('M138 160 C170 166 184 146 178 124 C188 140 186 168 150 176 Z', c,
          `<path d="M150 160 L195 160 L195 180 L150 180 Z" fill="${D}"/>`)
        + [[160, 158], [172, 148]].map(([x, y]) => shape(`M${x - 5} ${y + 2} L${x + 2} ${y - 9} L${x + 6} ${y + 3} Z`, D, '', 2.5)).join('')
        + shape('M178 124 C170 116 172 104 182 98 C186 108 190 116 178 124 Z', b, '', 3);
      // krila: opna z rebri
      const wing = (sx) => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(64)} 120 C${m(36)} 96 ${m(24)} 108 ${m(28)} 132 C${m(36)} 126 ${m(42)} 130 ${m(46)} 138 C${m(52)} 130 ${m(58)} 132 ${m(64)} 138 Z`, D,
            `<path d="M${m(30)} 112 L${m(64)} 112 L${m(64)} 140 L${m(30)} 140 Z" fill="${shade(D)}" opacity=".35"/>`, 3.5)
          + line(`M${m(62)} 122 L${m(34)} 112`, 2.2, OL) + line(`M${m(62)} 126 L${m(44)} 132`, 2.2, OL);
      };
      return {
        back: tail + wing(1) + wing(-1),
        front: shape('M74 46 C68 34 66 24 70 16 C78 24 84 34 88 40 Z', b, line('M70 30 L80 28', 2, B) + line('M73 38 L84 35', 2, B), 3.5)
             + shape('M126 46 C132 34 134 24 130 16 C122 24 116 34 112 40 Z', b, line('M130 30 L120 28', 2, B) + line('M127 38 L116 35', 2, B), 3.5)
             + [[90, 36, 0], [100, 32, 1], [110, 36, 0]].map(([x, y]) => shape(`M${x - 6} ${y + 6} L${x} ${y - 7} L${x + 6} ${y + 6} Z`, D, '', 3)).join(''),
        face: shape('M78 92 C78 80 122 80 122 92 C122 106 78 106 78 92 Z', light(b), '', 3)
            + `<ellipse cx="92" cy="90" rx="2.6" ry="3.2" fill="${OL}"/><ellipse cx="108" cy="90" rx="2.6" ry="3.2" fill="${OL}"/>`
            + line('M92 99 Q100 104 108 99', 2.4)
            + `<path d="M103 100 L106 106 L109 99.5" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`,
        belly: [140, 150, 160].map(y => line(`M${80} ${y} Q100 ${y + 5} ${120} ${y}`, 2, B)).join(''),
        arms: true
      };
    },
    lisica(c, b) {
      const D = shade(c);
      // košat rep s čopkom (belo konico) in nekaj dlakami
      const tail = shape('M136 166 C176 176 196 140 180 102 C176 92 166 92 164 102 C170 124 160 146 138 146 Z', c,
          `<path d="M160 104 C168 92 186 96 186 116 C180 118 170 116 162 112 Z" fill="${b}"/>`
        + `<path d="M150 170 L200 170 L200 190 L150 190 Z" fill="${D}"/>`)
        + line('M168 140 L176 136', 2, D) + line('M160 154 L168 152', 2, D);
      return {
        back: tail,
        front: shape('M62 66 L56 16 L96 44 Z', c, `<path d="M66 56 L62 28 L84 44 Z" fill="${b}"/><path d="M64 40 L72 46 M62 48 L70 52" stroke="${shade(b)}" stroke-width="2" stroke-linecap="round"/>`, 4)
             + shape('M138 66 L144 16 L104 44 Z', c, `<path d="M134 56 L138 28 L116 44 Z" fill="${b}"/><path d="M136 40 L128 46 M138 48 L130 52" stroke="${shade(b)}" stroke-width="2" stroke-linecap="round"/>`, 4)
             // puhasta lica ob strani glave
             + shape('M62 92 L46 100 L58 104 L48 112 L66 110 Z', b, '', 3) + shape('M138 92 L154 100 L142 104 L152 112 L134 110 Z', b, '', 3),
        face: shape('M64 86 C78 96 90 92 100 104 C110 92 122 96 136 86 C134 108 118 120 100 120 C82 120 66 108 64 86 Z', b, '', 3)
            + `<ellipse cx="100" cy="101" rx="7" ry="5" fill="${OL}"/><ellipse cx="98" cy="99.5" rx="2.2" ry="1.4" fill="#fff" opacity=".7"/>`
            + line('M100 106 L100 110', 2.2) + line('M93 110 Q96.5 114 100 110 Q103.5 114 107 110', 2.4)
            // pramen na čelu
            + line('M96 34 Q100 42 104 34', 2.2, D),
        arms: true
      };
    },
    sova(c, b) {
      const D = shade(c), B = shade(b);
      // krila s pernatim robom
      const wing = (sx) => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(60)} 110 C${m(36)} 122 ${m(34)} 158 ${m(54)} 174 L${m(56)} 164 L${m(62)} 172 L${m(62)} 160 L${m(68)} 166 C${m(64)} 146 ${m(64)} 128 ${m(68)} 118 Z`, D,
            line(`M${m(48)} 132 L${m(58)} 136`, 2, shade(D)) + line(`M${m(46)} 146 L${m(58)} 150`, 2, shade(D)), 3.5);
      };
      return {
        back: wing(1) + wing(-1),
        front: shape('M64 52 L54 18 L72 30 L76 22 L86 42 Z', D, '', 3.5) + shape('M136 52 L146 18 L128 30 L124 22 L114 42 Z', D, '', 3.5),
        // obrazni disk v obliki srca, obrvi, kljun z odsevom
        face: shape('M100 66 C88 52 60 56 62 80 C64 98 84 102 100 92 C116 102 136 98 138 80 C140 56 112 52 100 66 Z', b, '', 3)
            + line('M72 60 Q84 54 94 62', 3, D) + line('M128 60 Q116 54 106 62', 3, D)
            + shape('M92 90 L108 90 L100 106 Z', '#f0a640', `<path d="M92 90 L100 90 L98 100 Z" fill="#f7c27a"/>`, 3),
        belly: [[88, 140], [100, 136], [112, 140], [94, 154], [106, 154], [100, 166]].map(([x, y]) => line(`M${x - 5} ${y} L${x} ${y + 5} L${x + 5} ${y}`, 2, B)).join(''),
        arms: false,
        feet: '#f0a640'
      };
    },
    macka(c, b) {
      const D = shade(c);
      // rep kot vprašaj, s progami in svetlo konico
      const tail = shape('M140 168 C170 172 178 150 170 128 C164 112 172 98 184 100 C190 102 190 110 184 112 C178 114 176 124 182 136 C192 160 176 184 140 182 Z', c,
          [[168, 160], [176, 140], [176, 120]].map(([x, y]) => `<path d="M${x - 10} ${y} L${x + 12} ${y - 4}" stroke="${D}" stroke-width="5" stroke-linecap="round"/>`).join('')
        + `<circle cx="186" cy="106" r="8" fill="${b}"/>`);
      return {
        back: tail,
        front: shape('M60 70 L62 22 L96 46 Z', c, `<path d="M66 58 L67 34 L86 47 Z" fill="#f4a9b8"/>`, 4)
             + shape('M140 70 L138 22 L104 46 Z', c, `<path d="M134 58 L133 34 L114 47 Z" fill="#f4a9b8"/>`, 4)
             // puhasta lica
             + shape('M60 96 L48 100 L58 104 L50 110 L64 108 Z', c, '', 3) + shape('M140 96 L152 100 L142 104 L150 110 L136 108 Z', c, '', 3),
        face: shape('M84 100 C84 92 116 92 116 100 C116 112 84 112 84 100 Z', b, '', 2.6)
            + `<path d="M95 96 L105 96 L100 102 Z" fill="#e8798f" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`
            + line('M100 102 L100 105', 2) + line('M93 105 Q96.5 109 100 105 Q103.5 109 107 105', 2.2)
            // brki
            + ['M80 100 L60 96', 'M80 104 L60 106', 'M120 100 L140 96', 'M120 104 L140 106'].map(d => line(d, 1.8)).join('')
            // proge na čelu
            + line('M100 36 L100 46', 3, D) + line('M90 38 L92 46', 3, D) + line('M110 38 L108 46', 3, D),
        arms: true
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
    if (id === 'kapa') return shape('M58 60 C58 26 142 26 142 60 C120 52 80 52 58 60 Z', '#4f86c6',
        `<path d="M50 44 L150 44 L150 50 L50 50 Z" fill="#fdfcf3" opacity=".8"/><path d="M50 32 L150 32 L150 37 L50 37 Z" fill="#fdfcf3" opacity=".8"/>`, 3.5)
      + shape('M56 62 C80 52 120 52 144 62 L144 70 C120 60 80 60 56 70 Z', '#3b6aa3', '', 3)
      + `<circle cx="100" cy="24" r="8" fill="#fdfcf3" stroke="${OL}" stroke-width="3"/>`;
    if (id === 'cilinder') return `<g transform="rotate(-8 100 40)">`
      + shape('M80 40 L84 6 L116 6 L120 40 Z', '#2f2a36', `<path d="M80 30 L120 30 L120 36 L80 36 Z" fill="#c0392b"/>`, 3.5)
      + shape('M68 40 C80 34 120 34 132 40 C120 46 80 46 68 40 Z', '#2f2a36', '', 3.5) + `</g>`;
    return '';
  }
  function accFace(id, y, r) {
    if (id !== 'ocala' && id !== 'soncna') return '';
    const R = r + 4, fill = id === 'soncna' ? '#2b2530' : 'rgba(255,255,255,.15)', op = id === 'soncna' ? .92 : 1;
    return [84, 116].map(x => `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" opacity="${op}" stroke="${OL}" stroke-width="3.2"/>`).join('')
      + (id === 'soncna' ? [84, 116].map(x => `<path d="M${x - 7} ${y - 5} L${x - 2} ${y - 9}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`).join('') : '')
      + line(`M${84 + R} ${y} Q100 ${y - 6} ${116 - R} ${y}`, 3);
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
  function creature(pet, head) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const sp = (SP[pet.species] || SP.zmaj)(c, b);
    const D = shade(c), L = light(c);
    const bodyD = 'M52 140 C52 112 74 100 100 100 C126 100 148 112 148 140 C148 170 128 182 100 182 C72 182 52 170 52 140 Z';
    const body = shape(bodyD, c,
        patternFill(pet.pattern, c, 100, 142, 46)
      + `<path d="M40 160 L160 160 L160 190 L40 190 Z" fill="${D}" opacity=".55"/>`
      + `<ellipse cx="66" cy="124" rx="8" ry="12" fill="${L}" opacity=".45" transform="rotate(30 66 124)"/>`
      + `<ellipse cx="100" cy="150" rx="28" ry="26" fill="${b}" stroke="${OL}" stroke-width="2.6"/>`
      + `<ellipse cx="92" cy="140" rx="9" ry="6" fill="#fff" opacity=".35"/>`
      + (sp.belly || ''));
    const fc = sp.feet || D;
    const foot = x => shape(`M${x} 178 C${x} 167 ${x + 22} 167 ${x + 22} 178 C${x + 22} 187 ${x} 187 ${x} 178 Z`, fc, '', 3)
      + line(`M${x + 8} 181 L${x + 8} 185`, 1.8) + line(`M${x + 14} 181 L${x + 14} 185`, 1.8);
    const feet = foot(69) + foot(109);
    // prednje tačke ob trebuščku (sova ima namesto njih krila)
    const paw = (x, flip) => shape(`M${x} 134 C${x - 9 * flip} 140 ${x - 8 * flip} 154 ${x + 3 * flip} 154 C${x + 12 * flip} 154 ${x + 12 * flip} 142 ${x + 6 * flip} 134 Z`, c,
        `<path d="M${x - 14} 148 L${x + 14} 148 L${x + 14} 160 L${x - 14} 160 Z" fill="${D}" opacity=".5"/>`, 3)
      + line(`M${x + 1 * flip} 150 L${x + 1 * flip} 154`, 1.6) + line(`M${x + 5 * flip} 150 L${x + 5 * flip} 154`, 1.6);
    const arms = sp.arms ? paw(76, 1) + paw(124, -1) : '';
    const headD = 'M58 76 C58 44 78 30 100 30 C122 30 142 44 142 76 C142 106 124 120 100 120 C76 120 58 106 58 76 Z';
    const headS = shape(headD, c,
        patternFill(pet.pattern, c, 100, 66, 30)
      + `<path d="M50 104 C80 122 120 122 150 104 L150 130 L50 130 Z" fill="${D}" opacity=".45"/>`
      + `<ellipse cx="80" cy="46" rx="14" ry="7" fill="${L}" opacity=".7" transform="rotate(-20 80 46)"/>`);
    const cheeks = `<ellipse cx="71" cy="95" rx="7.5" ry="4.5" fill="#f08aa0" opacity=".5"/><ellipse cx="129" cy="95" rx="7.5" ry="4.5" fill="#f08aa0" opacity=".5"/>`;
    const eyeY = pet.species === 'sova' ? 78 : 74, eyeR = pet.species === 'sova' ? 11 : 10;
    const eq = pet.equip || {};
    const headAll = sp.front + headS + cheeks + sp.face + eyes(pet.eyes, 84, 116, eyeY, eyeR)
      + accFace(eq.obraz, eyeY, eyeR) + accHead(eq.glava);
    // glavo povečamo okoli vratu (100, 112)
    const k = head || 1;
    return sp.back + body + feet + arms + accNeck(eq.vrat)
      + `<g transform="translate(100 112) scale(${k}) translate(-100 -112)">${headAll}</g>`;
  }

  function egg(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const d = 'M100 44 C132 44 152 98 152 128 C152 160 130 182 100 182 C70 182 48 160 48 128 C48 98 68 44 100 44 Z';
    const hint = {
      zmaj: [0, 1, 2].map(i => line(`M${70 + i * 20} ${120} q10 -10 20 0`, 3, shade(c))).join(''),
      lisica: `<path d="M48 150 C80 140 120 140 152 150 L152 190 L48 190 Z" fill="${b}"/>`,
      sova: [0, 1, 2, 3].map(i => line(`M${66 + i * 20} ${108} l10 8 l10 -8`, 3, shade(c))).join(''),
      // mucka: odtis tačke
      macka: `<g fill="${shade(c)}"><ellipse cx="100" cy="122" rx="11" ry="9"/><circle cx="86" cy="106" r="4.5"/><circle cx="96" cy="100" r="4.5"/><circle cx="106" cy="100" r="4.5"/><circle cx="115" cy="106" r="4.5"/></g>`
    }[pet.species === 'jez' ? 'macka' : pet.species] || '';
    return shape(d, c, patternFill(pet.pattern, c, 100, 120, 52) + hint
      + `<circle cx="80" cy="140" r="7" fill="${b}" opacity=".9"/><circle cx="118" cy="96" r="5" fill="${b}" opacity=".9"/><circle cx="124" cy="150" r="9" fill="${b}" opacity=".9"/>`
      + `<path d="M120 50 L160 50 L160 190 L120 190 Z" fill="${shade(c)}" opacity=".35"/>`
      + `<ellipse cx="82" cy="78" rx="10" ry="18" fill="${light(c)}" opacity=".7" transform="rotate(20 82 78)"/>`, 4.5);
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
    if (stage === 'jajce') s += `<g class="pa-egg">${egg(pet)}</g>`;
    else if (stage === 'mladicek') s += `<g transform="translate(100 192) scale(.66) translate(-100 -186)">${creature(pet, 1.22)}</g>` + shell();
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

  window.PetArt = { draw, SPECIES, BODY, BELLY, EYES, PATTERN, FREE, UNLOCKS, STAGES, ACC, SLOT_NAME, stageOf, allowed, unlockAt };
})();
