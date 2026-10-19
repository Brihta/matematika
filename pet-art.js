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
    { id: 'jez',    name: 'Ježek',   acc: 'ježka'   }
  ];
  const BODY = {
    gozd:   { name: 'Gozdna',   c: '#6f9a4a' },
    med:    { name: 'Medena',   c: '#e0a84a' },
    nebo:   { name: 'Nebesna',  c: '#6fa8d6' },
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
  const FREE = { body: ['gozd', 'med', 'nebo'], belly: Object.keys(BELLY),
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
        + `<circle cx="${x - r * .32}" cy="${y - r * .3}" r="${r * .24}" fill="#fff"/>`;
    }).join('');
  }
  function starPath(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)); }
    return 'M' + p.join(' L') + ' Z';
  }

  /* ── vrste ──
     Vsaka vrsta vrne { back, front }: back je za telesom (rep, krila),
     front je glava z vsem na njej. Telo in trebušček sta skupna. */
  const SP = {
    zmaj(c, b, e) {
      const D = shade(c);
      return {
        back: shape('M140 150 C172 150 182 128 172 112 C184 126 186 158 150 168 Z', c, `<path d="M150 150 L190 150 L190 175 L150 175 Z" fill="${D}"/>`)
            + shape('M166 110 L182 100 L178 120 Z', b)
            + shape('M62 118 C36 96 30 120 40 132 C46 124 56 126 62 134 Z', D)
            + shape('M138 118 C164 96 170 120 160 132 C154 124 144 126 138 134 Z', D),
        front: shape('M76 44 L70 22 L88 38 Z', b) + shape('M124 44 L130 22 L112 38 Z', b)
             + [86, 100, 114].map((x, i) => shape(`M${x - 6} ${44 - (i === 1 ? 4 : 0)} L${x} ${30 - (i === 1 ? 4 : 0)} L${x + 6} ${44 - (i === 1 ? 4 : 0)} Z`, D, '', 3)).join(''),
        face: shape('M80 90 C80 80 120 80 120 90 C120 104 80 104 80 90 Z', b, '', 3)
            + `<circle cx="93" cy="92" r="2" fill="${OL}"/><circle cx="107" cy="92" r="2" fill="${OL}"/>`
            + line('M94 99 Q100 103 106 99', 2.4)
      };
    },
    lisica(c, b, e) {
      const D = shade(c);
      return {
        back: shape('M138 160 C176 168 190 126 170 104 C176 132 160 146 140 144 Z', c,
                    `<path d="M168 100 C186 112 186 132 178 142 C170 130 162 118 160 108 Z" fill="${b}"/>`),
        front: shape('M66 60 L60 18 L94 46 Z', c, `<path d="M68 52 L65 30 L84 46 Z" fill="${b}"/>`)
             + shape('M134 60 L140 18 L106 46 Z', c, `<path d="M132 52 L135 30 L116 46 Z" fill="${b}"/>`),
        face: shape('M66 86 C80 96 90 90 100 104 C110 90 120 96 134 86 C132 108 116 118 100 118 C84 118 68 108 66 86 Z', b, '', 3)
            + `<ellipse cx="100" cy="102" rx="6" ry="4.5" fill="${OL}"/>`
            + line('M95 109 Q100 113 105 109', 2.4)
      };
    },
    sova(c, b, e) {
      const D = shade(c);
      return {
        back: shape('M56 112 C36 128 40 162 62 170 C58 150 60 132 66 122 Z', D)
            + shape('M144 112 C164 128 160 162 138 170 C142 150 140 132 134 122 Z', D),
        front: shape('M66 50 L58 22 L84 42 Z', D) + shape('M134 50 L142 22 L116 42 Z', D),
        face: `<circle cx="84" cy="78" r="17" fill="${b}" stroke="${OL}" stroke-width="2.6"/><circle cx="116" cy="78" r="17" fill="${b}" stroke="${OL}" stroke-width="2.6"/>`
            + shape('M93 92 L107 92 L100 106 Z', '#f0a640', '', 3),
        feet: '#f0a640'
      };
    },
    jez(c, b, e) {
      const D = shade(c), spikes = [];
      // bodice v pahljači okoli glave; korena so skrita za glavo
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (.92 + i * .097), r1 = 36, r2 = 62, cx = 100, cy = 78;
        const x0 = cx + r1 * Math.cos(a - .16), y0 = cy + r1 * Math.sin(a - .16);
        const x1 = cx + r2 * Math.cos(a), y1 = cy + r2 * Math.sin(a);
        const x2 = cx + r1 * Math.cos(a + .16), y2 = cy + r1 * Math.sin(a + .16);
        spikes.push(shape(`M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z`, D, '', 3));
      }
      return {
        back: spikes.join(''),
        front: '',
        face: shape('M70 84 C76 70 124 70 130 84 C130 106 116 116 100 116 C84 116 70 106 70 84 Z', b, '', 3)
            + `<circle cx="100" cy="100" r="5.5" fill="${OL}"/>` + line('M95 108 Q100 112 105 108', 2.4)
      };
    }
  };

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
    const sp = (SP[pet.species] || SP.zmaj)(c, b, pet.eyes);
    const D = shade(c), L = light(c);
    const bodyD = 'M52 140 C52 112 74 100 100 100 C126 100 148 112 148 140 C148 170 128 182 100 182 C72 182 52 170 52 140 Z';
    const body = shape(bodyD, c,
        patternFill(pet.pattern, c, 100, 142, 46)
      + `<path d="M40 160 L160 160 L160 190 L40 190 Z" fill="${D}" opacity=".55"/>`
      + `<ellipse cx="100" cy="150" rx="28" ry="26" fill="${b}" stroke="${OL}" stroke-width="2.6"/>`);
    const fc = sp.feet || D;
    const feet = shape('M70 178 C70 168 90 168 90 178 C90 186 70 186 70 178 Z', fc, '', 3)
               + shape('M110 178 C110 168 130 168 130 178 C130 186 110 186 110 178 Z', fc, '', 3);
    const headD = 'M58 76 C58 44 78 30 100 30 C122 30 142 44 142 76 C142 106 124 120 100 120 C76 120 58 106 58 76 Z';
    const headS = shape(headD, c,
        patternFill(pet.pattern, c, 100, 66, 30)
      + `<path d="M50 104 C80 122 120 122 150 104 L150 130 L50 130 Z" fill="${D}" opacity=".45"/>`
      + `<ellipse cx="80" cy="46" rx="14" ry="7" fill="${L}" opacity=".7" transform="rotate(-20 80 46)"/>`);
    const cheeks = `<ellipse cx="72" cy="94" rx="7" ry="4.5" fill="#f08aa0" opacity=".55"/><ellipse cx="128" cy="94" rx="7" ry="4.5" fill="#f08aa0" opacity=".55"/>`;
    const eyeY = pet.species === 'sova' ? 78 : 74, eyeR = pet.species === 'sova' ? 11 : 10;
    const eq = pet.equip || {};
    const headAll = sp.front + headS + cheeks + sp.face + eyes(pet.eyes, 84, 116, eyeY, eyeR)
      + accFace(eq.obraz, eyeY, eyeR) + accHead(eq.glava);
    // glavo povečamo okoli vratu (100, 112)
    const k = head || 1;
    return sp.back + body + feet + accNeck(eq.vrat)
      + `<g transform="translate(100 112) scale(${k}) translate(-100 -112)">${headAll}</g>`;
  }

  function egg(pet) {
    const c = (BODY[pet.body] || BODY.gozd).c, b = (BELLY[pet.belly] || BELLY.krema).c;
    const d = 'M100 44 C132 44 152 98 152 128 C152 160 130 182 100 182 C70 182 48 160 48 128 C48 98 68 44 100 44 Z';
    const hint = {
      zmaj: [0, 1, 2].map(i => line(`M${70 + i * 20} ${120} q10 -10 20 0`, 3, shade(c))).join(''),
      lisica: `<path d="M48 150 C80 140 120 140 152 150 L152 190 L48 190 Z" fill="${b}"/>`,
      sova: [0, 1, 2, 3].map(i => line(`M${66 + i * 20} ${108} l10 8 l10 -8`, 3, shade(c))).join(''),
      jez: [0, 1, 2, 3, 4].map(i => `<path d="M${72 + i * 14} 60 l7 -12 l7 12 Z" fill="${shade(c)}"/>`).join('')
    }[pet.species] || '';
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
