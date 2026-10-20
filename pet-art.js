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

  /* Oči: velike, sijoče, brez belega roba (kot pri plišastih igračah).
     Šarenica gre od temnejše zgoraj do svetlejše spodaj, zenica je velika,
     dva odseva. "zvezde" imajo zlato zvezdico v temni šarenici. */
  function eyes(eyeKey, x1, x2, y, r) {
    const ec = (EYES[eyeKey] || EYES.rjave).c, star = eyeKey === 'zvezde';
    const id = 'pe' + (++uid);
    const top = star ? '#2d2340' : mix(ec, '#1a0f1c', .55), bot = star ? '#5a4a86' : mix(ec, '#ffffff', .25);
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`
      + [x1, x2].map(x => `<ellipse cx="${x}" cy="${y}" rx="${r * .86}" ry="${r}" fill="url(#${id})" stroke="${OL}" stroke-width="2.6"/>`
        + (star
          ? `<path d="${starPath(x, y + r * .12, r * .5)}" fill="${ec}"/>`
          : `<ellipse cx="${x}" cy="${y + r * .12}" rx="${r * .44}" ry="${r * .52}" fill="${OL}"/>`)
        + `<ellipse cx="${x - r * .28}" cy="${y - r * .4}" rx="${r * .36}" ry="${r * .32}" fill="#fff"/>`
        + `<circle cx="${x + r * .34}" cy="${y + r * .42}" r="${r * .15}" fill="#fff" opacity=".9"/>`).join('');
  }
  function starPath(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return 'M' + p.join(' L') + ' Z';
  }
  // drobna usta v obliki ":3" in rožnat nosek
  const mouth3 = (y, w = 2.4) => line(`M100 ${y - 3} L100 ${y}`, w) + line(`M93 ${y} Q96.5 ${y + 4.5} 100 ${y} Q103.5 ${y + 4.5} 107 ${y}`, w);

  /* ── vrste ──
     Glava je skupna: široka in okrogla (x 48–152, y 36–126), oči nizko
     in narazen (x 77 in 123, y 88). Vsaka vrsta vrne:
       back  — za telesom (rep, krila)
       front — za glavo (ušesa, rogovi, puhasta lica)
       mask  — na glavi, obrezano nanjo (svetel spodnji del obraza)
       face  — na glavi (gobček, kljun, nos, brki)
       belly — na trebuščku (luske, perje)
       arms  — true: tačke ob trebuščku (zmaj); 'sit': sedi, sprednje noge
               do tal kot prava mačka ali lisica; false: krila (sova)
       feet  — barva nog, če ni kot telo
     Telo, trebušček, glava in oči so skupni (creature). */
  const SP = {
    zmaj(c, b) {
      const D = shade(c), B = shade(b), W = mix(c, b, .45);
      // kratek rep z bodicami in konico v obliki srčka
      const tail = shape('M130 170 C160 178 180 164 178 140 C177 132 168 132 167 140 C166 154 152 160 132 156 Z', c,
          `<path d="M140 166 L190 166 L190 190 L140 190 Z" fill="${D}" opacity=".6"/>`, 3.5)
        + [[156, 160], [168, 150]].map(([x, y]) => shape(`M${x - 5} ${y + 3} Q${x} ${y - 10} ${x + 5} ${y + 3} Z`, D, '', 2.5)).join('')
        + shape('M172 140 C160 132 160 118 168 116 C171 115 173 118 173 121 C174 118 177 116 180 118 C186 124 180 134 172 140 Z', '#f08aa0', '', 3);
      // majhna okrogla krilca z rebri
      const wing = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(70)} 132 C${m(54)} 112 ${m(32)} 110 ${m(30)} 126 C${m(38)} 126 ${m(42)} 132 ${m(40)} 140 C${m(48)} 136 ${m(54)} 142 ${m(54)} 150 C${m(60)} 144 ${m(66)} 142 ${m(72)} 144 Z`, W,
            `<path d="M${m(20)} 136 L${m(80)} 136 L${m(80)} 160 L${m(20)} 160 Z" fill="${D}" opacity=".25"/>`, 3.2)
          + line(`M${m(68)} 134 L${m(36)} 122`, 2, D) + line(`M${m(68)} 138 L${m(48)} 140`, 2, D);
      };
      // zaobljen rogek v barvi trebuščka
      const horn = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(70)} 58 C${m(62)} 46 ${m(62)} 32 ${m(68)} 24 C${m(72)} 22 ${m(76)} 24 ${m(77)} 28 C${m(80)} 38 ${m(84)} 46 ${m(88)} 50 Z`, b,
          line(`M${m(66)} 38 Q${m(72)} 40 ${m(78)} 36`, 2, B), 3.2);
      };
      // ušesni plavuti ob straneh
      const fin = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(54)} 82 C${m(42)} 76 ${m(32)} 66 ${m(30)} 58 C${m(40)} 58 ${m(52)} 64 ${m(60)} 72 Z`, c,
          `<path d="M${m(52)} 76 C${m(44)} 72 ${m(38)} 66 ${m(36)} 62 C${m(44)} 63 ${m(52)} 68 ${m(56)} 73 Z" fill="${W}"/>`, 3.2);
      };
      return {
        back: tail + wing(1) + wing(-1),
        front: horn(1) + horn(-1) + fin(1) + fin(-1)
             + [[88, 30], [100, 24], [112, 30]].map(([x, y]) => shape(`M${x - 7} ${y + 14} Q${x} ${y - 4} ${x + 7} ${y + 14} Z`, D, '', 3)).join(''),
        mask: `<path d="M40 104 C70 96 130 96 160 104 L160 140 L40 140 Z" fill="${light(c)}" opacity=".55"/>`,
        face: `<ellipse cx="95" cy="101" rx="1.8" ry="1.4" fill="${OL}"/><ellipse cx="105" cy="101" rx="1.8" ry="1.4" fill="${OL}"/>`
            + line('M92 107 Q100 113 108 107', 2.4)
            + `<path d="M102.5 109.6 L104.5 114 L106.5 109" fill="#fff" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`
            // luskice na čelu
            + [[92, 58], [100, 54], [108, 58]].map(([x, y]) => line(`M${x - 4} ${y} Q${x} ${y + 4} ${x + 4} ${y}`, 2, D)).join(''),
        belly: [146, 156, 166].map(y => line(`M80 ${y} Q100 ${y + 5} 120 ${y}`, 2, B)).join(''),
        arms: true
      };
    },
    lisica(c, b) {
      const D = shade(c), B = shade(b);
      // velik puhast rep, ovit ob strani, z belim čopkom
      const tail = shape('M128 174 C170 186 196 152 186 114 C182 96 162 90 156 102 C152 112 162 118 164 130 C168 152 152 162 132 158 Z', c,
          `<path d="M150 84 C170 84 196 96 196 122 C186 124 170 118 158 112 Z" fill="${b}"/>`
        + `<path d="M140 168 L200 168 L200 196 L140 196 Z" fill="${D}" opacity=".6"/>`, 3.5)
        + line('M170 146 L178 142', 2, D) + line('M162 160 L170 158', 2, D);
      // visoko uho z zaobljeno konico in puhom v notranjosti
      const ear = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(56)} 72 C${m(48)} 52 ${m(50)} 28 ${m(58)} 16 C${m(62)} 12 ${m(66)} 14 ${m(70)} 18 C${m(80)} 28 ${m(90)} 38 ${m(94)} 48 Z`, c,
            `<path d="M${m(62)} 62 C${m(58)} 48 ${m(58)} 34 ${m(62)} 26 C${m(70)} 32 ${m(78)} 40 ${m(84)} 50 Z" fill="${b}"/>`
          + line(`M${m(62)} 44 L${m(70)} 48`, 2, B) + line(`M${m(62)} 52 L${m(70)} 54`, 2, B), 3.5);
      };
      return {
        back: tail,
        front: ear(1) + ear(-1)
             // puhasta lica ob strani glave
             + shape('M56 92 L38 100 L50 104 L40 112 L56 112 L50 120 L64 116 Z', b, '', 3)
             + shape('M144 92 L162 100 L150 104 L160 112 L144 112 L150 120 L136 116 Z', b, '', 3),
        // svetel spodnji del obraza in temnejši gobček
        mask: `<path d="M44 96 C60 100 84 98 100 110 C116 98 140 100 156 96 L156 140 L44 140 Z" fill="${b}"/>`
            + `<path d="M44 96 C60 100 84 98 100 110 C116 98 140 100 156 96" fill="none" stroke="${B}" stroke-width="1.5" opacity=".6"/>`,
        face: `<path d="M94 103 C94 99.5 106 99.5 106 103 C106 106 103 108 100 108 C97 108 94 106 94 103 Z" fill="${OL}"/>`
            + `<ellipse cx="97.5" cy="102" rx="2" ry="1.2" fill="#fff" opacity=".7"/>`
            + mouth3(112, 2.2)
            // pramen na čelu
            + line('M95 46 Q100 54 105 46', 2.2, D),
        arms: 'sit'
      };
    },
    sova(c, b) {
      const D = shade(c), B = shade(b);
      // krila s pernatim robom
      const wing = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(66)} 120 C${m(46)} 128 ${m(42)} 158 ${m(56)} 176 L${m(60)} 166 L${m(64)} 174 L${m(66)} 162 L${m(72)} 168 C${m(68)} 150 ${m(68)} 134 ${m(74)} 124 Z`, D,
            line(`M${m(54)} 140 L${m(64)} 143`, 2, shade(D)) + line(`M${m(52)} 152 L${m(64)} 155`, 2, shade(D)), 3.2);
      };
      // ušesni čopek iz treh peres
      const tuft = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(60)} 60 C${m(54)} 46 ${m(50)} 34 ${m(52)} 22 C${m(58)} 28 ${m(62)} 30 ${m(66)} 30 C${m(66)} 24 ${m(70)} 22 ${m(74)} 22 C${m(76)} 32 ${m(82)} 40 ${m(88)} 46 Z`, D, '', 3.2);
      };
      return {
        back: wing(1) + wing(-1),
        front: tuft(1) + tuft(-1),
        // obrazni disk v obliki srca, okrogle obrvi, kljunček
        face: shape('M100 74 C88 56 52 58 52 86 C52 110 80 116 100 106 C120 116 148 110 148 86 C148 58 112 56 100 74 Z', b, '', 2.8)
            + line('M64 68 Q76 62 88 70', 3, D) + line('M136 68 Q124 62 112 70', 3, D)
            + shape('M94 98 C94 95 106 95 106 98 C106 103 102 108 100 110 C98 108 94 103 94 98 Z', '#f0a640', `<ellipse cx="98" cy="98" rx="2.5" ry="2" fill="#f7c27a"/>`, 2.6),
        belly: [[88, 146], [100, 142], [112, 146], [94, 158], [106, 158], [100, 170]].map(([x, y]) => line(`M${x - 4} ${y} Q${x} ${y + 5} ${x + 4} ${y}`, 2, B)).join(''),
        arms: false,
        feet: '#f0a640',
        eyeY: 86, eyeR: 13.5
      };
    },
    macka(c, b) {
      const D = shade(c);
      // rep kot vprašaj, s progami in svetlo konico
      const tail = shape('M132 172 C164 178 176 156 170 134 C166 118 172 104 184 104 C190 105 191 113 185 115 C178 117 177 126 181 138 C190 164 172 188 134 184 Z', c,
          [[164, 164], [174, 146], [176, 126]].map(([x, y]) => `<path d="M${x - 10} ${y} L${x + 12} ${y - 4}" stroke="${D}" stroke-width="5" stroke-linecap="round"/>`).join('')
        + `<circle cx="186" cy="109" r="8" fill="${b}"/>`, 3.5);
      // zaobljeno uho z rožnato notranjostjo
      const ear = sx => {
        const m = x => 100 + (x - 100) * sx;
        return shape(`M${m(54)} 74 C${m(50)} 56 ${m(50)} 38 ${m(56)} 26 C${m(58)} 22 ${m(62)} 21 ${m(66)} 24 C${m(76)} 30 ${m(86)} 38 ${m(92)} 46 Z`, c,
          `<path d="M${m(60)} 62 C${m(58)} 50 ${m(58)} 40 ${m(61)} 32 C${m(68)} 36 ${m(76)} 42 ${m(82)} 48 Z" fill="#f4a9b8"/>`, 3.5);
      };
      return {
        back: tail,
        front: ear(1) + ear(-1)
             // puhasta lica
             + shape('M56 98 L42 102 L54 106 L46 112 L60 110 Z', c, '', 3) + shape('M144 98 L158 102 L146 106 L154 112 L140 110 Z', c, '', 3),
        mask: `<ellipse cx="100" cy="112" rx="20" ry="12" fill="${b}"/>`,
        face: `<path d="M96 101 C96 99 104 99 104 101 C104 103 101.5 105 100 105 C98.5 105 96 103 96 101 Z" fill="#e8798f" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`
            + mouth3(109, 2.1)
            // brki
            + ['M62 104 L44 100', 'M62 108 L44 110', 'M138 104 L156 100', 'M138 108 L156 110'].map(d => line(d, 1.8)).join('')
            // proge na čelu
            + line('M100 42 L100 52', 3.2, D) + line('M89 44 L91 52', 3.2, D) + line('M111 44 L109 52', 3.2, D),
        arms: 'sit'
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

  /* Odrasla žival; head = koliko večja je glava (mladiči imajo večjo).
     Razmerja kot pri plišku: velika široka glava, majhno okroglo telo. */
  const EYE_X = [77, 123];
  function creature(pet, head) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const sp = (SP[pet.species] || SP.zmaj)(c, b);
    const D = shade(c), L = light(c);
    const bodyD = 'M62 152 C62 126 80 112 100 112 C120 112 138 126 138 152 C138 176 122 186 100 186 C78 186 62 176 62 152 Z';
    const body = shape(bodyD, c,
        patternFill(pet.pattern, c, 100, 152, 38)
      + `<path d="M50 168 L150 168 L150 192 L50 192 Z" fill="${D}" opacity=".45"/>`
      + `<ellipse cx="72" cy="140" rx="6" ry="10" fill="${L}" opacity=".45" transform="rotate(30 72 140)"/>`
      + `<ellipse cx="100" cy="158" rx="24" ry="22" fill="${b}" stroke="${OL}" stroke-width="2.4"/>`
      + `<ellipse cx="93" cy="149" rx="8" ry="5" fill="#fff" opacity=".35"/>`
      + (sp.belly || ''), 3.5);
    const fc = sp.feet || D;
    // okrogle tačke z rožnatimi blazinicami
    const foot = x => shape(`M${x} 180 C${x} 170 ${x + 22} 170 ${x + 22} 180 C${x + 22} 189 ${x} 189 ${x} 180 Z`, fc, '', 3)
      + line(`M${x + 8} 183 L${x + 8} 187`, 1.7) + line(`M${x + 14} 183 L${x + 14} 187`, 1.7);
    const sit = sp.arms === 'sit';
    // sedeča žival: zadnje tačke pokukajo ob straneh, spredaj sta nogi do tal
    const feet = sit ? foot(52) + foot(126) : foot(72) + foot(106);
    // kratke prednje tačke ob trebuščku (sova ima namesto njih krila)
    const paw = (x, flip) => shape(`M${x} 138 C${x - 9 * flip} 144 ${x - 8 * flip} 157 ${x + 3 * flip} 157 C${x + 12 * flip} 157 ${x + 12 * flip} 146 ${x + 6 * flip} 138 Z`, c,
        `<path d="M${x - 14} 151 L${x + 14} 151 L${x + 14} 162 L${x - 14} 162 Z" fill="${D}" opacity=".45"/>`, 3)
      + line(`M${x + 1 * flip} 153 L${x + 1 * flip} 157`, 1.5) + line(`M${x + 5 * flip} 153 L${x + 5 * flip} 157`, 1.5);
    /* Sprednja noga do tal: mehka, spodaj širša tačka v barvi trebuščka
       ("nogavička") s prstki. Vrh noge pokrije puhast prsni ovratnik (bib),
       kot pri pravi mački. x = levi rob noge. */
    const leg = x => shape(`M${x + 2} 132 C${x} 152 ${x} 166 ${x - 1} 177 C${x - 3} 190 ${x + 23} 190 ${x + 21} 177 C${x + 20} 166 ${x + 20} 152 ${x + 18} 132 Z`, c,
        `<path d="M${x + 14} 124 C${x + 18} 144 ${x + 18} 162 ${x + 24} 194 L${x + 30} 194 L${x + 30} 124 Z" fill="${D}" opacity=".35"/>`
      + `<path d="M${x - 6} 173 C${x + 4} 168 ${x + 16} 168 ${x + 26} 173 L${x + 26} 194 L${x - 6} 194 Z" fill="${b}"/>`, 3)
      + line(`M${x + 6} 183 L${x + 6} 187.5`, 1.6) + line(`M${x + 14} 183 L${x + 14} 187.5`, 1.6);
    const bib = shape('M76 122 C76 108 124 108 124 122 C124 130 122 135 117 137 C115 142 108 145 104 140 C102 145 98 145 96 140 C92 145 85 142 83 137 C78 135 76 130 76 122 Z', b,
        `<ellipse cx="90" cy="122" rx="8" ry="4" fill="#fff" opacity=".4"/>`, 3);
    const arms = sit ? leg(79) + leg(100) + bib : sp.arms ? paw(80, 1) + paw(120, -1) : '';
    const headD = 'M48 84 C48 52 72 36 100 36 C128 36 152 52 152 84 C152 112 130 126 100 126 C70 126 48 112 48 84 Z';
    const headS = shape(headD, c,
        patternFill(pet.pattern, c, 100, 70, 32)
      + (sp.mask || '')
      + `<path d="M40 112 C76 130 124 130 160 112 L160 140 L40 140 Z" fill="${D}" opacity=".3"/>`
      + `<ellipse cx="72" cy="54" rx="15" ry="7" fill="${L}" opacity=".75" transform="rotate(-24 72 54)"/>`
      + `<circle cx="91" cy="46" r="3" fill="#fff" opacity=".6"/>`, 3.6);
    const eyeY = sp.eyeY || 88, eyeR = sp.eyeR || 12.5;
    // rdeča lička z drobnimi črticami
    const cheeks = [64, 136].map(x => `<ellipse cx="${x}" cy="${eyeY + 15}" rx="9" ry="5.5" fill="#ff8fa8" opacity=".55"/>`
      + [-3, 1, 5].map(d => line(`M${x + d - 1.5} ${eyeY + 17} L${x + d + 1.5} ${eyeY + 13}`, 1.2, '#fff')).join('')).join('');
    const eq = pet.equip || {};
    const headAll = sp.front + headS + cheeks + sp.face + eyes(pet.eyes, EYE_X[0], EYE_X[1], eyeY, eyeR)
      + accFace(eq.obraz, eyeY, eyeR) + accHead(eq.glava);
    // glavo povečamo okoli vratu (100, 120)
    const k = head || 1;
    return sp.back + body + feet + arms + accNeck(eq.vrat)
      + `<g transform="translate(100 120) scale(${k}) translate(-100 -120)">${headAll}</g>`;
  }

  function egg(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const d = 'M100 44 C132 44 152 98 152 128 C152 160 130 182 100 182 C70 182 48 160 48 128 C48 98 68 44 100 44 Z';
    const hint = {
      zmaj: [0, 1, 2].map(i => line(`M${70 + i * 20} ${150} q10 -10 20 0`, 3, shade(c))).join(''),
      lisica: `<path d="M48 156 C80 146 120 146 152 156 L152 190 L48 190 Z" fill="${b}"/>`,
      sova: [0, 1, 2, 3].map(i => line(`M${66 + i * 20} ${150} l10 8 l10 -8`, 3, shade(c))).join(''),
      // mucka: odtis tačke
      macka: `<g fill="${shade(c)}"><ellipse cx="124" cy="80" rx="7" ry="6"/><circle cx="115" cy="70" r="3"/><circle cx="121" cy="66" r="3"/><circle cx="128" cy="66" r="3"/><circle cx="134" cy="70" r="3"/></g>`
    }[pet.species === 'jez' ? 'macka' : pet.species] || '';
    // jajce spi: zaprte očke in lička
    const sleepy = [84, 116].map(x => line(`M${x - 7} 118 Q${x} 125 ${x + 7} 118`, 3))
      .concat([72, 128].map(x => `<ellipse cx="${x}" cy="130" rx="7" ry="4.5" fill="#ff8fa8" opacity=".55"/>`)).join('')
      + line('M96 130 Q100 133 104 130', 2.4);
    return shape(d, c, patternFill(pet.pattern, c, 100, 120, 52) + hint
      + `<circle cx="70" cy="96" r="6" fill="${b}" opacity=".9"/><circle cx="132" cy="112" r="5" fill="${b}" opacity=".9"/><circle cx="76" cy="160" r="7" fill="${b}" opacity=".9"/>`
      + `<path d="M120 50 L160 50 L160 190 L120 190 Z" fill="${shade(c)}" opacity=".3"/>`
      + `<ellipse cx="82" cy="76" rx="9" ry="16" fill="${light(c)}" opacity=".75" transform="rotate(20 82 76)"/>`
      + sleepy, 4.2);
  }

  /* Košarica: zadnji rob (notranjost) in sprednji del s pletenjem in
     odejico v barvi trebuščka, ki visi čez rob. dy = zamik navzdol. */
  const WICKER = '#dda566', WICK_D = '#b47a3e', WICK_L = '#f0c88c';
  const basketBack = (dy = 0) => `<g transform="translate(0 ${dy})">`
    + shape('M46 136 C46 122 154 122 154 136 C154 146 46 146 46 136 Z', '#8a5a34', '', 3.5) + `</g>`;
  function basketFront(dy = 0, pet = {}) {
    const b = (BELLY[pet.belly] || BELLY.krema).c;
    const front = 'M44 136 C60 150 140 150 156 136 C156 168 132 188 100 188 C68 188 44 168 44 136 Z';
    const weave = [154, 166, 177].map(y => line(`M40 ${y} Q100 ${y + 12} 160 ${y}`, 2.4, WICK_D)).join('')
      + [[62, 150], [82, 154], [102, 156], [122, 154], [140, 150], [70, 163], [92, 168], [112, 168], [132, 163], [84, 179], [104, 181], [122, 178]]
        .map(([x, y]) => line(`M${x} ${y} L${x + 4} ${y + 8}`, 2.2, WICK_D)).join('');
    return `<g transform="translate(0 ${dy})">`
      + shape(front, WICKER, weave + `<path d="M120 140 L170 140 L170 200 L120 200 Z" fill="${WICK_D}" opacity=".3"/>`, 3.5)
      // odejica čez rob, s srčkom
      + shape('M58 138 C70 146 86 148 98 148 C98 156 94 166 86 168 C76 164 66 154 58 138 Z', b,
          `<path d="M50 152 L100 152 L100 172 L50 172 Z" fill="${shade(b)}" opacity=".25"/>`, 3)
      + heart(84, 154, 4, '#f08aa0')
      // rob košarice kot debela vrv
      + line('M44 136 C60 150 140 150 156 136', 10, OL) + line('M44 136 C60 150 140 150 156 136', 5.5, WICK_L)
      + `</g>`;
  }
  /* Spanček v košarici: zvit klobčič, glava na tačkah, rep ovit spredaj. */
  function sleeper(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c, D = shade(c);
    const fox = pet.species === 'lisica';
    const inner = fox ? b : '#f4a9b8';
    const body = shape('M70 118 C70 98 92 92 116 94 C140 96 152 108 152 124 C152 136 140 142 116 142 C92 142 70 136 70 118 Z', c,
        patternFill(pet.pattern, c, 120, 116, 26)
      + `<path d="M60 130 L160 130 L160 150 L60 150 Z" fill="${D}" opacity=".35"/>`
      + `<ellipse cx="124" cy="102" rx="12" ry="5" fill="${light(c)}" opacity=".6" transform="rotate(8 124 102)"/>`
      + (fox ? '' : [112, 124, 136].map(x => line(`M${x} 96 Q${x + 3} 104 ${x} 110`, 3.5, D)).join('')), 3.5);
    // ušesi: lisička ima višji, šilasti, mucka okroglejši
    const ear = (d, di) => shape(d, c, `<path d="${di}" fill="${inner}"/>`, 3.2);
    const ears = fox
      ? ear('M52 96 C46 82 46 66 52 58 C60 62 70 72 74 82 Z', 'M55 88 C52 80 52 72 55 66 C60 70 66 76 68 82 Z')
        + ear('M92 82 C96 72 104 62 112 60 C114 70 110 84 104 92 Z', 'M98 82 C101 76 106 70 109 68 C110 74 108 80 104 86 Z')
      : ear('M52 98 C48 86 50 74 56 66 C64 70 72 78 76 86 Z', 'M56 90 C55 84 56 78 59 74 C64 77 68 81 70 86 Z')
        + ear('M90 86 C96 76 104 70 112 68 C114 78 110 88 104 96 Z', 'M96 86 C100 80 104 77 108 75 C109 81 107 86 104 90 Z');
    const headD = 'M46 118 C46 98 60 88 78 88 C96 88 110 98 110 116 C110 134 96 142 78 142 C60 142 46 134 46 118 Z';
    const head = shape(headD, c,
        patternFill(pet.pattern, c, 78, 112, 18)
      + (fox ? `<path d="M40 122 C54 124 68 120 78 130 C88 120 102 124 116 122 L116 150 L40 150 Z" fill="${b}"/>`
             : `<ellipse cx="78" cy="130" rx="13" ry="8" fill="${b}"/>` + [70, 78, 86].map(x => line(`M${x} 90 L${x} 97`, 2.8, D)).join(''))
      + `<ellipse cx="62" cy="100" rx="9" ry="5" fill="${light(c)}" opacity=".7" transform="rotate(-30 62 100)"/>`, 3.5);
    const face = line('M60 117 Q66 122 72 117', 2.8) + line('M84 117 Q90 122 96 117', 2.8)
      + `<ellipse cx="57" cy="126" rx="6" ry="4" fill="#ff8fa8" opacity=".55"/><ellipse cx="99" cy="126" rx="6" ry="4" fill="#ff8fa8" opacity=".55"/>`
      + (fox ? `<path d="M74 125 C74 122.5 82 122.5 82 125 C82 127.5 80 129 78 129 C76 129 74 127.5 74 125 Z" fill="${OL}"/>`
             : `<path d="M75 125 C75 123.5 81 123.5 81 125 C81 126.5 79.5 128 78 128 C76.5 128 75 126.5 75 125 Z" fill="#e8798f" stroke="${OL}" stroke-width="1.5"/>`)
      + line('M74 132 Q76 134.5 78 132 Q80 134.5 82 132', 1.8);
    // rep ovit okoli spredaj, konica pod brado
    const tail = shape('M150 122 C162 138 140 150 110 150 C92 150 74 150 62 144 C66 136 82 140 100 139 C124 138 144 136 150 122 Z', c,
        (fox ? `<ellipse cx="62" cy="144" rx="16" ry="10" fill="${b}"/>`
             : [92, 112, 132].map(x => line(`M${x} 138 L${x - 2} 150`, 4, D)).join('') + `<ellipse cx="64" cy="144" rx="8" ry="7" fill="${b}"/>`)
      + `<path d="M60 146 L160 146 L160 160 L60 160 Z" fill="${D}" opacity=".3"/>`, 3.2);
    const zzz = [[134, 82, 13], [148, 66, 10], [158, 54, 8]].map(([x, y, f]) =>
      `<text x="${x}" y="${y}" font-size="${f}" font-weight="900" font-family="system-ui, sans-serif" fill="#6f6a9a" opacity=".85">z</text>`).join('');
    return basketBack() + body + ears + head + face + tail + basketFront(0, pet) + zzz;
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
    else if (stage === 'mladicek') s += (egg1 ? '' : basketBack(10))
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
