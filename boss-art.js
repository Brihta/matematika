/* Nagajivci — risbe za igro »Odženi nagajivce!« (Do 20).

   Trije nagajivci po slikah, ki jih je učitelj naredil v Geminiju (23. 10.
   2026): Godrnjava Greta (jezna punčka s čopki; v bazi 'kujavka'), Bahač
   (velik, plešast, nos v zraku) in Sluzko (zelena sluzasta pošast).
   Druga, podrobnejša risba (23. 10. 2026): senčenje, odsevi, kodri, šivi,
   gumbi, vezalke — prva je bila učitelju "preveč basic".

   Vsak ima štiri drže: hodi (proti levi, k ljubljenčkom), zadet, poražen,
   zmagovalec. Platno je viewBox 0 0 200 200, tla na y ≈ 186, kot pri
   ljubljenčkih (pet-art.js) — isti slog: temna obroba, mehke barve. */
(function () {
  const OL = '#4a2733';

  /* ── pomožne ── */
  const hex = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const dark = (c, t = .22) => mix(c, '#2a1430', t), light = (c, t = .45) => mix(c, '#ffffff', t);

  let uid = 0;
  const PREFIX = 'ba' + Math.random().toString(36).slice(2, 6) + '_';
  /* Oblika z obrobo; `inner` (senca, odsev, vzorec) se nariše znotraj nje. */
  function shape(d, fill, inner = '', w = 4) {
    const id = PREFIX + (++uid);
    return `<path d="${d}" fill="${fill}"/>`
      + (inner ? `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` : '')
      + `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const line = (d, w = 3, c = OL, o = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o < 1 ? ` opacity="${o}"` : ''}/>`;
  const fill = (d, c, o = 1) => `<path d="${d}" fill="${c}"${o < 1 ? ` opacity="${o}"` : ''}/>`;
  /* Debel ud z obrobo, senco ob spodnjem robu in odsevom. */
  const limb = (d, c, w = 12) => line(d, w + 7) + line(d, w, c) + line(d, w * .35, light(c, .35), .55);
  const ball = (x, y, r, c, w = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OL}" stroke-width="${w}"/>`;
  const cheek = (x, y, rx = 7, ry = 4.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f59a9a" opacity=".8"/>`
    + `<circle cx="${x - rx * .35}" cy="${y - ry * .3}" r="${ry * .28}" fill="#fff" opacity=".7"/>`;
  /* Oko: temno, z velikim in malim odsevom (kot pri ljubljenčkih). */
  const dot = (x, y, r = 3.6) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${OL}"/>`
    + `<circle cx="${x + r * .35}" cy="${y - r * .45}" r="${r * .38}" fill="#fff"/><circle cx="${x - r * .35}" cy="${y + r * .45}" r="${r * .16}" fill="#fff"/>`;
  const shadow = rx => `<ellipse cx="100" cy="188" rx="${rx}" ry="7" fill="#05270b" opacity=".13"/>`;
  /* Vrtinčasto oko (omotičen). */
  const spiral = (x, y, r) => line(`M${x} ${y} a${r * .25} ${r * .25} 0 1 1 ${r * .5} 0 a${r * .5} ${r * .5} 0 1 1 ${-r} 0 a${r * .75} ${r * .75} 0 1 1 ${r * 1.5} 0`, 2);
  function star(x, y, r, c) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * k).toFixed(1) + ' ' + (y + Math.sin(a) * k).toFixed(1);
    }
    return `<path d="${d}Z" fill="${c}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
  const stars = (x, y, w = 34) => `<g class="ba-stars">`
    + `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .22}" fill="none" stroke="${OL}" stroke-width="1.4" opacity=".5"/>`
    + star(x - w, y, 6, '#f6d36b') + star(x + w * .6, y - w * .2, 5, '#f4a3c0') + star(x + w * .1, y + w * .24, 5.5, '#f6d36b')
    + `</g>`;
  /* Črtice udarca. */
  const zing = (x, y, r) => [[-1, -.4], [-1.1, .2], [-.8, .8], [1, -.4], [1.1, .2], [.8, .8]].map(([a, b]) =>
    line(`M${x + a * r} ${y + b * r} L${x + a * r * 1.35} ${y + b * r * 1.25}`, 2.4)).join('');
  /* Gibalne črtice ob nogi (hoja). */
  const motion = (x, y) => line(`M${x} ${y} q4 4 0 8`, 2, OL, .6) + line(`M${x + 6} ${y - 2} q4 5 0 11`, 2, OL, .6);

  /* ════════════ GODRNJAVA GRETA ════════════ */
  const HAIR = '#87553a', HAIR_D = '#5b3424', HAIR_L = '#b07b55';
  const SKIN = '#fad7bf', SKIN_D = '#eeb69a';
  const ORANGE = '#f5873a', GREY = '#8f969f', DENIM_D = '#6f767f';

  /* Košat koder iz krogov: najprej vse obrobe, nato barve — en obris;
     nato kodrčki (temni zavoji) in svetli odsevi. */
  function curls(parts) {
    return parts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="${OL}"/>`).join('')
      + parts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.6}" fill="${HAIR}"/>`).join('')
      + parts.map(([x, y, r], i) => line(`M${x - r * .45} ${y + r * .15} a${r * .42} ${r * .42} 0 1 1 ${r * .5} ${r * .3}`, 1.8, HAIR_D, .8)
          + (i % 2 ? '' : line(`M${x - r * .55} ${y - r * .25} q${r * .3} ${-r * .45} ${r * .75} ${-r * .3}`, 2, HAIR_L, .9))).join('');
  }
  function gretaHead(kind, dy = 0) {
    const t = (x, y) => `${x} ${y + dy}`, Y = y => y + dy;
    const brows = kind === 'smug'
        ? fill(`M${t(78, 66)} L${t(95, 69)} L${t(94, 72)} L${t(77, 70)} Z`, HAIR_D) + fill(`M${t(104, 66)} Q${t(112, 58)} ${t(121, 62)} L${t(120, 65)} Q${t(112, 62)} ${t(105, 69)} Z`, HAIR_D)
      : kind === 'spin' ? fill(`M${t(78, 66)} L${t(94, 62)} L${t(95, 65)} L${t(79, 69)} Z`, HAIR_D) + fill(`M${t(105, 62)} L${t(121, 66)} L${t(120, 69)} L${t(104, 65)} Z`, HAIR_D)
      : fill(`M${t(76, 62)} L${t(96, 70)} L${t(95, 74)} L${t(75, 66)} Z`, HAIR_D) + fill(`M${t(104, 70)} L${t(124, 62)} L${t(125, 66)} L${t(105, 74)} Z`, HAIR_D)
        + line(`M${t(98, 69)} L${t(98, 74)}`, 1.6, SKIN_D);           // guba med obrvmi
    const eyes = kind === 'spin' ? spiral(88, Y(80), 7) + spiral(112, Y(80), 7)
      : kind === 'squeeze' ? line(`M${t(82, 76)} L${t(92, 80)} L${t(82, 84)}`, 3) + line(`M${t(118, 76)} L${t(108, 80)} L${t(118, 84)}`, 3)
      : kind === 'smug' ? line(`M${t(82, 80)} Q${t(88, 76)} ${t(94, 80)}`, 3) + dot(112, Y(80), 3.6)
      : dot(88, Y(80), 3.8) + dot(112, Y(80), 3.8);
    const mouth = kind === 'smug' ? line(`M${t(90, 97)} Q${t(100, 104)} ${t(110, 95)}`, 2.8) + line(`M${t(108, 93)} l3 3`, 2)
      : kind === 'spin' ? fill(`M${t(93, 100)} Q${t(100, 93)} ${t(107, 100)} Q${t(100, 98)} ${t(93, 100)} Z`, '#7b2e3a') + line(`M${t(93, 100)} Q${t(100, 93)} ${t(107, 100)}`, 2.6)
      : kind === 'squeeze' ? line(`M${t(91, 98)} L${t(95, 95)} L${t(99, 98)} L${t(103, 95)} L${t(107, 98)}`, 2.6)
      // napihnjena, kujava usta
      : line(`M${t(94, 99)} Q${t(100, 93)} ${t(106, 99)}`, 3) + line(`M${t(97, 102)} Q${t(100, 104)} ${t(103, 102)}`, 1.8, OL, .6);
    const face = `M${t(64, 78)} C${t(64, 52)} ${t(80, 42)} ${t(100, 42)} C${t(121, 42)} ${t(136, 54)} ${t(136, 78)} C${t(136, 100)} ${t(120, 112)} ${t(100, 112)} C${t(80, 112)} ${t(64, 100)} ${t(64, 78)} Z`;
    return curls([[58, Y(42), 14], [48, Y(56), 11], [64, Y(28), 11], [48, Y(34), 9], [70, Y(46), 8], [40, Y(46), 7]])
      + curls([[142, Y(42), 14], [152, Y(56), 11], [136, Y(28), 11], [152, Y(34), 9], [130, Y(46), 8], [160, Y(46), 7]])
      // čopka sta spodaj zavezana z elastiko
      + ball(70, Y(56), 3.4, '#f26b6b', 2.4) + ball(130, Y(56), 3.4, '#f26b6b', 2.4)
      + shape(`M${t(62, 78)} C${t(54, 76)} ${t(54, 92)} ${t(65, 92)} Z`, SKIN, line(`M${t(60, 81)} q-2 4 2 7`, 1.6, SKIN_D), 3.4)
      + shape(`M${t(138, 78)} C${t(146, 76)} ${t(146, 92)} ${t(135, 92)} Z`, SKIN, line(`M${t(140, 81)} q2 4 -2 7`, 1.6, SKIN_D), 3.4)
      + shape(face, SKIN, fill(`M${t(60, 40)} L${t(140, 40)} L${t(140, 70)} C${t(124, 60)} ${t(76, 60)} ${t(60, 70)} Z`, SKIN_D, .55)
          + fill(`M${t(60, 112)} L${t(140, 112)} L${t(140, 100)} C${t(124, 112)} ${t(76, 112)} ${t(60, 100)} Z`, SKIN_D, .45), 4)
      // šiška: kodrasti pramen čez čelo
      + shape(`M${t(66, 70)} C${t(62, 52)} ${t(76, 38)} ${t(100, 38)} C${t(124, 38)} ${t(138, 52)} ${t(134, 70)} L${t(128, 60)} L${t(122, 68)} L${t(116, 56)} L${t(108, 64)} L${t(102, 54)} L${t(94, 64)} L${t(86, 55)} L${t(80, 66)} L${t(73, 58)} Z`, HAIR,
          line(`M${t(78, 46)} q8 -6 18 -4`, 2.4, HAIR_L, .9) + line(`M${t(110, 44)} q8 0 14 6`, 2.2, HAIR_L, .7)
          + line(`M${t(90, 52)} a4 4 0 1 1 6 3`, 1.6, HAIR_D, .8) + line(`M${t(116, 50)} a4 4 0 1 1 6 3`, 1.6, HAIR_D, .8), 4)
      + cheek(78, Y(92), 8.5, 6) + cheek(122, Y(92), 8.5, 6) + brows + eyes
      + line(`M${t(100, 85)} q2.5 2.5 0 4.5`, 2, SKIN_D) + mouth;
  }
  /* Superga: oranžna z belo kapico in podplatom, vezalke. x,y = sredina podplata. */
  function shoe(x, y, toe = -1) {
    const s = toe;                                  // -1 = prsti levo
    return shape(`M${x - 12 * -s} ${y - 9} C${x + 16 * s} ${y - 12} ${x + 20 * s} ${y - 2} ${x + 18 * s} ${y + 2} L${x - 12 * s} ${y + 2} C${x - 15 * s} ${y - 2} ${x - 14 * s} ${y - 8} ${x - 12 * -s} ${y - 9} Z`, ORANGE,
        fill(`M${x + 6 * s} ${y - 14} C${x + 22 * s} ${y - 10} ${x + 24 * s} ${y + 2} ${x + 16 * s} ${y + 4} L${x + 4 * s} ${y + 4} Z`, '#fffaf0')
      + fill(`M${x - 20} ${y - 1} L${x + 24} ${y - 1} L${x + 24} ${y + 6} L${x - 20} ${y + 6} Z`, '#fffaf0')
      + line(`M${x - 20} ${y - 1} L${x + 24} ${y - 1}`, 1.4, OL, .5)
      + line(`M${x - 2 * s} ${y - 9} l${4 * s} 4 M${x + 2 * s} ${y - 10} l${4 * s} 4`, 1.6, '#fffaf0'), 3.4);
  }
  /* Noga v hlačah z zavihano hlačnico in superga. */
  const gretaLeg = (d, fx, fy, toe = -1, cx = fx, cy = fy - 12) => limb(d, GREY, 16)
    + shape(`M${cx - 10} ${cy - 4} L${cx + 10} ${cy - 4} L${cx + 11} ${cy + 4} L${cx - 11} ${cy + 4} Z`, light(GREY, .25), line(`M${cx - 10} ${cy} L${cx + 10} ${cy}`, 1.2, DENIM_D, .6), 3)
    + shoe(fx, fy, toe);
  /* Rokav in pest (prsti kot črtice). */
  const fist = (x, y) => ball(x, y, 7.5, SKIN, 3.2) + line(`M${x - 4} ${y - 2} q2 -1 3 1 M${x - 4} ${y + 2} q2 -1 3 1`, 1.4, SKIN_D);
  const gretaArm = (d, hx, hy) => limb(d, ORANGE, 13) + fist(hx, hy);
  /* Trup: majica, hlače z naprsnikom, žepkom, naramnicami in gumbi. */
  function gretaTorso(arms, legs, dy = 0) {
    const t = (x, y) => `${x} ${y + dy}`;
    return legs
      + shape(`M${t(70, 140)} L${t(130, 140)} L${t(132, 156)} C${t(112, 162)} ${t(88, 162)} ${t(68, 156)} Z`, GREY, fill(`M${t(112, 130)} L${t(140, 130)} L${t(140, 170)} L${t(112, 170)} Z`, DENIM_D, .5), 4)
      + shape(`M${t(74, 114)} C${t(78, 108)} ${t(122, 108)} ${t(126, 114)} L${t(130, 146)} C${t(114, 150)} ${t(86, 150)} ${t(70, 146)} Z`, ORANGE,
          fill(`M${t(112, 104)} L${t(140, 104)} L${t(140, 150)} L${t(114, 150)} Z`, dark(ORANGE, .18), .7)
          + line(`M${t(82, 112)} q18 6 36 0`, 2, dark(ORANGE), .5), 4)
      + shape(`M${t(82, 120)} L${t(118, 120)} L${t(122, 150)} C${t(108, 156)} ${t(92, 156)} ${t(78, 150)} Z`, GREY,
          fill(`M${t(108, 116)} L${t(126, 116)} L${t(126, 160)} L${t(110, 160)} Z`, DENIM_D, .5)
          + `<rect x="91" y="${128 + dy}" width="18" height="11" rx="2.5" fill="${DENIM_D}" stroke="${OL}" stroke-width="2"/>`
          + line(`M${t(93, 131)} L${t(107, 131)}`, 1, '#c9ced4', .8)
          + line(`M${t(85, 123)} L${t(115, 123)}`, 1.2, '#c9ced4', .7), 4)
      + line(`M${t(85, 122)} L${t(80, 108)}`, 6.5) + line(`M${t(85, 122)} L${t(80, 108)}`, 3.4, DENIM_D)
      + line(`M${t(115, 122)} L${t(120, 108)}`, 6.5) + line(`M${t(115, 122)} L${t(120, 108)}`, 3.4, DENIM_D)
      + ball(85, 123 + dy, 2.6, '#fdfdfd', 1.8) + ball(115, 123 + dy, 2.6, '#fdfdfd', 1.8)
      + arms;
  }
  const greta = {
    walk: () => shadow(50) + gretaTorso(
        gretaArm('M80 116 C66 122 58 128 54 120', 54, 117) + gretaArm('M120 116 C130 128 134 138 130 146', 130, 148),
        gretaLeg('M90 150 C86 162 80 168 76 172', 70, 178, -1, 78, 168) + gretaLeg('M110 150 C116 160 122 166 126 170', 128, 177, -1, 124, 166))
      + gretaHead('angry') + motion(140, 164),
    hit: () => shadow(54) + `<g transform="rotate(8 100 186)">` + gretaTorso(
        gretaArm('M80 116 C66 116 60 108 58 98', 57, 95) + gretaArm('M120 116 C132 116 138 108 140 100', 141, 97),
        gretaLeg('M90 150 C88 162 84 168 82 172', 78, 178, -1, 84, 168) + gretaLeg('M110 150 C114 160 118 166 120 172', 120, 178, -1, 118, 168))
      + gretaHead('squeeze') + `</g>` + zing(102, 74, 56),
    down: () => shadow(66)
      // sedi na tleh: noge naprej (levo), vidita se podplata
      + [['M92 166 C80 170 66 170 54 170', 46, 172], ['M108 168 C96 176 80 178 66 178', 58, 180]].map(([d, fx, fy]) => limb(d, GREY, 16)
          + shape(`M${fx - 4} ${fy - 14} C${fx - 13} ${fy - 14} ${fx - 13} ${fy + 5} ${fx - 3} ${fy + 5} C${fx + 4} ${fy + 5} ${fx + 6} ${fy - 10} ${fx - 4} ${fy - 14} Z`, '#fffaf0',
              line(`M${fx - 9} ${fy - 8} l7 0 M${fx - 9} ${fy - 3} l7 0 M${fx - 9} ${fy + 2} l7 0`, 1.2, OL, .35), 3)).join('')
      + gretaTorso(gretaArm('M80 140 C70 152 66 166 70 178', 70, 180) + gretaArm('M120 140 C132 152 140 166 144 176', 146, 178), '', 26)
      + gretaHead('spin', 30) + stars(100, 56, 42),
    // roke v bok: komolca ven, dlani skrite za trupom (zato so roke narisane pod njim)
    win: () => shadow(50) + gretaTorso('',
        limb('M80 116 C62 122 60 136 76 142', ORANGE, 13) + limb('M120 116 C138 122 140 136 124 142', ORANGE, 13)
        + gretaLeg('M90 150 L88 172', 86, 178, -1, 88, 168) + gretaLeg('M110 150 L114 172', 116, 178, 1, 113, 168))
      + gretaHead('smug')
  };

  /* ════════════ BAHAČ ════════════ */
  const BSKIN = '#f8c9a5', BSKIN_D = '#e8a37e', SHIRT = '#34303b', SHIRT_L = '#57505f', PANTS = '#25222b', SHOE = '#7c4a2c';
  function bahHead(kind) {
    // gleda levo: obraz levo, uho desno; nos v zraku
    const lid = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .75}" fill="#fff" stroke="${OL}" stroke-width="2"/>`
      + dot(x - 1, y + 1.5, w * .5)
      + fill(`M${x - w - 1} ${y + .5} C${x - w} ${y - w * 1.1} ${x + w} ${y - w * 1.1} ${x + w + 1} ${y + .5} Z`, BSKIN)
      + line(`M${x - w - 1} ${y + .5} Q${x} ${y - 1.5} ${x + w + 1} ${y + .5}`, 2.4);
    const eyes = kind === 'spin' ? spiral(86, 44, 6) + spiral(104, 44, 6)
      : kind === 'smug' ? line('M80 45 Q86 49 92 45', 2.6) + line('M98 45 Q104 49 110 45', 2.6)
      : kind === 'oh' ? `<ellipse cx="86" cy="44" rx="5.5" ry="6" fill="#fff" stroke="${OL}" stroke-width="2"/>${dot(85, 45, 2.6)}`
        + `<ellipse cx="104" cy="44" rx="5.5" ry="6" fill="#fff" stroke="${OL}" stroke-width="2"/>${dot(103, 45, 2.6)}`
      : lid(86, 45, 5.5) + lid(104, 45, 5.5);
    const brows = kind === 'oh' ? line('M80 34 Q86 31 92 34', 2.4) + line('M98 34 Q104 31 110 34', 2.4)
      : kind === 'spin' ? '' : line('M80 37 L92 36', 2.6) + line('M98 36 L110 37', 2.6);
    const mouth = kind === 'oh' ? `<ellipse cx="88" cy="62" rx="4.5" ry="5.5" fill="#7b2e3a" stroke="${OL}" stroke-width="2.4"/>`
      : kind === 'smug' ? line('M82 59 Q92 66 102 58', 2.6) + line('M100 56 l3 3', 1.8)
      : kind === 'spin' ? line('M82 61 Q88 57 94 61 Q99 64 102 60', 2.2)
      // našobljen "hmpf"
      : line('M83 61 Q88 57 93 61', 2.6) + line('M85 64 Q88 66 91 64', 1.6, OL, .6);
    return shape('M114 36 C126 30 132 48 118 54 Z', BSKIN, line('M117 40 C123 40 125 46 119 50', 2, BSKIN_D), 3.4)
      + shape('M72 44 C72 26 84 18 98 18 C113 18 122 28 121 44 C120 60 110 70 96 70 C82 70 72 60 72 44 Z', BSKIN,
          `<ellipse cx="88" cy="26" rx="10" ry="5" fill="#fff" opacity=".5" transform="rotate(-12 88 26)"/>`
          + fill('M110 20 C128 30 126 62 104 72 L130 72 L130 20 Z', BSKIN_D, .5)
          + line('M84 70 Q96 76 108 68', 2, BSKIN_D, .8), 4)
      + line('M99 18 C95 10 101 5 105 9 C108 12 104 16 101 13', 2.6)
      + `<path d="M74 49 C68 49 68 57 75 57" fill="${BSKIN}" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`
      + cheek(80, 55, 5, 3) + cheek(106, 56, 5, 3) + brows + eyes + mouth;
  }
  /* Kratki rokav in podlaht z dlanjo; prsti kot črtice. */
  function bahArm(sleeve, d, hx, hy) {
    return limb(d, BSKIN, 12) + shape(sleeve, SHIRT, line('M0 0', 0), 3.6)
      + ball(hx, hy, 8.5, BSKIN, 3.2) + line(`M${hx - 5} ${hy + 3} q3 2 6 0 M${hx - 3} ${hy + 6} q2 1 4 0`, 1.4, BSKIN_D);
  }
  function bahBody(arms, legs = 'walk') {
    const shoeL = legs === 'walk' ? 'M70 170 L64 184 L48 184 C44 184 44 176 54 174 Z' : 'M74 172 L70 184 L54 184 C50 184 50 176 60 174 Z';
    const shoeR = legs === 'walk' ? 'M124 168 L134 182 L150 182 C156 182 154 174 144 172 Z' : 'M120 172 L128 184 L144 184 C150 184 148 176 140 174 Z';
    return shape(shoeL, SHOE, fill('M40 176 L80 176 L80 186 L40 186 Z', dark(SHOE, .3), .6) + line('M52 177 q4 -2 8 -1', 1.6, light(SHOE), .8), 3.6)
      + shape(shoeR, SHOE, fill('M110 176 L160 176 L160 186 L110 186 Z', dark(SHOE, .3), .6), 3.6)
      // hlače: široke, z robom žepa in gubo
      + shape('M54 146 C76 156 124 156 146 146 C152 162 146 176 130 178 L114 178 L106 160 L94 160 L86 178 L70 178 C54 176 48 162 54 146 Z', PANTS,
          line('M66 154 Q70 164 78 166', 1.6, '#4a4552') + line('M134 154 Q130 164 122 166', 1.6, '#4a4552')
          + line('M100 156 L100 160', 1.6, '#4a4552') + fill('M120 146 L150 146 L150 180 L124 180 Z', '#000', .18), 4)
      // trebuh pokuka izpod premajhne majice
      + shape('M52 124 C68 136 132 136 148 124 C152 134 150 146 146 150 C122 160 78 160 54 150 C50 146 48 134 52 124 Z', BSKIN,
          fill('M120 120 L156 120 L156 160 L118 160 Z', BSKIN_D, .55)
          + `<ellipse cx="80" cy="140" rx="10" ry="4" fill="#fff" opacity=".35"/>`
          + line('M97 142 Q100 146 103 142', 2, BSKIN_D) + line('M98 141 Q100 139 102 141', 1.4, BSKIN_D), 4)
      // majica: kroglasta, z ovratnikom in gubami
      + shape('M74 70 C58 78 48 102 50 124 C66 138 134 138 150 124 C152 102 142 78 126 70 C116 64 84 64 74 70 Z', SHIRT,
          fill('M118 64 C140 72 152 100 150 126 L160 126 L160 60 Z', '#000', .22)
          + line('M62 92 C58 102 58 112 62 122', 4, SHIRT_L, .9) + line('M72 80 C68 86 66 92 66 98', 3, SHIRT_L, .6)
          + line('M92 124 Q100 128 108 124', 2, SHIRT_L, .8)
          + fill('M84 66 Q98 76 114 66 Z', BSKIN) + line('M84 66 Q98 76 114 66', 3), 4)
      + arms;
  }
  const bahArmL = (end) => bahArm('M74 72 C62 76 54 88 54 100 L70 102 C72 92 74 84 78 78 Z', end[0], end[1], end[2]);
  const bahArmR = (end) => bahArm('M126 72 C138 76 146 88 146 100 L130 102 C128 92 126 84 122 78 Z', end[0], end[1], end[2]);
  const bahac = {
    walk: () => shadow(56) + bahBody(bahArmL(['M60 98 C56 108 54 118 56 126', 56, 128]) + bahArmR(['M140 98 C146 108 148 116 146 124', 146, 126]))
      + `<g transform="rotate(-6 98 66)">${bahHead('bored')}</g>` + motion(150, 160),
    hit: () => shadow(60) + `<g transform="rotate(7 100 186)">`
      + bahBody(bahArmL(['M60 98 C52 104 46 106 42 102', 40, 100]) + bahArmR(['M140 98 C148 104 154 106 158 102', 160, 100]), 'stand')
      + bahHead('oh') + `</g>` + zing(98, 60, 50),
    // na hrbtu kot želva: glava levo (k ljubljenčkom), noge desno
    down: () => shadow(80)
      + `<g transform="translate(0 30) rotate(-90 100 110)">`
      + bahBody(bahArmL(['M60 98 C58 88 56 80 56 74', 56, 70]) + bahArmR(['M140 98 C142 88 144 80 144 74', 144, 70]), 'stand')
      + bahHead('spin') + `</g>` + stars(36, 100, 26),
    win: () => bahCrossed('smug')
  };
  // roki prekrižani na prsih; head = izraz obraza
  function bahCrossed(head) {
    return shadow(56) + bahBody(
        shape('M74 72 C62 76 54 88 54 100 L70 102 C72 92 74 84 78 78 Z', SHIRT, '', 3.6)
        + shape('M126 72 C138 76 146 88 146 100 L130 102 C128 92 126 84 122 78 Z', SHIRT, '', 3.6)
        + limb('M62 100 C68 110 96 112 126 104', BSKIN, 12) + limb('M138 100 C132 112 104 114 74 108', BSKIN, 12)
        + ball(128, 104, 7.5, BSKIN, 3) + ball(72, 108, 7.5, BSKIN, 3), 'stand')
      + `<g transform="rotate(-4 98 66)">${bahHead(head)}</g>`;
  }

  /* ════════════ SLUZKO ════════════ */
  const G = '#9fd287', GD = '#6fae5e', GL = '#d2efc2', TONGUE = '#f08c9c';
  const SLUZ_BODY = 'M64 172 C50 146 52 96 70 68 C82 50 118 50 130 68 C148 96 150 146 136 172 C120 182 80 182 64 172 Z';
  function sluzSkin(cx = 100) {
    // pike različnih velikosti s svetlim robom, senca desno, sijaj levo zgoraj, gubice
    const spots = [[78, 112, 7], [121, 98, 5], [116, 140, 8], [76, 152, 5.5], [100, 164, 4], [132, 122, 4.5], [96, 128, 3.4], [86, 86, 3], [138, 150, 3.4]];
    return fill('M118 50 C150 80 156 150 132 186 L170 186 L170 50 Z', GD, .45)
      + spots.map(([x, y, r]) => `<circle cx="${x + cx - 100}" cy="${y}" r="${r + 1.4}" fill="${light(GD, .3)}"/><circle cx="${x + cx - 100}" cy="${y}" r="${r}" fill="${GD}"/>`).join('')
      + `<ellipse cx="${cx - 24}" cy="94" rx="9" ry="16" fill="#fff" opacity=".4" transform="rotate(18 ${cx - 24} 94)"/>`
      + `<circle cx="${cx - 18}" cy="74" r="3.5" fill="#fff" opacity=".6"/>`
      + line(`M${cx - 16} 132 q6 3 12 0`, 1.6, GD, .9) + line(`M${cx + 8} 150 q5 3 10 0`, 1.6, GD, .9);
  }
  /* Kaplje sluzi ob spodnjem robu telesa. */
  const drips = () => shape('M70 170 C70 178 74 182 77 182 C80 182 82 178 80 170 Z', G, '', 3) + shape('M122 172 C122 180 125 184 128 184 C131 184 133 180 131 172 Z', G, '', 3);
  /* Tri zaobljeni prsti na koncu roke v smeri a (radiani). */
  const hand3 = (x, y, a) => [-.55, 0, .55].map(t => {
    const r = a + t, ex = x + Math.cos(r) * 10, ey = y + Math.sin(r) * 10;
    return line(`M${x} ${y} L${ex.toFixed(1)} ${ey.toFixed(1)}`, 12) + line(`M${x} ${y} L${ex.toFixed(1)} ${ey.toFixed(1)}`, 6, G);
  }).join('');
  const sluzArm = (d, hx, hy, a) => line(d, 17) + hand3(hx, hy, a) + line(d, 10, G) + line(d, 3, GL, .7);
  function sluzEyes(kind) {
    // velike buljave oči štrlijo nad glavo, s trepalnicami
    const Y = 48;
    const lash = x => line(`M${x - 8} ${Y - 11} Q${x - 13} ${Y - 18} ${x - 11} ${Y - 24}`, 2.6) + line(`M${x} ${Y - 14} Q${x - 1} ${Y - 21} ${x + 2} ${Y - 27}`, 2.6) + line(`M${x + 8} ${Y - 11} Q${x + 13} ${Y - 18} ${x + 11} ${Y - 24}`, 2.6);
    const big = kind === 'pop';
    const eye = (x, px, py) => `<ellipse cx="${x}" cy="${Y}" rx="${big ? 15 : 13.5}" ry="${big ? 16 : 14.5}" fill="#fff" stroke="${OL}" stroke-width="3.8"/>`
      + `<path d="M${x - 11} ${Y + 6} Q${x} ${Y + 13} ${x + 11} ${Y + 6}" fill="none" stroke="#dfe8ef" stroke-width="3" stroke-linecap="round"/>`
      + (kind === 'spin' ? spiral(x, Y, 9)
        : kind === 'happy' ? line(`M${x - 7} ${Y + 3} Q${x} ${Y - 6} ${x + 7} ${Y + 3}`, 3.2)
        : dot(x + px, Y + 1 + py, big ? 3.4 : 5.6))
      + `<ellipse cx="${x + 5}" cy="${Y - 7}" rx="3" ry="2" fill="#fff" opacity=".9"/>`;
    return lash(84) + lash(116) + eye(84, -3, 1) + eye(116, -3, 1);
  }
  function sluzFace(kind) {
    const teeth = `<path d="M86 94 L89 102 L93 96 Z M107 96 L111 102 L114 94 Z" fill="#fff" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>`;
    const tongue = (len) => shape(`M93 100 C91 ${112 + len} 96 ${122 + len} 101 ${122 + len} C107 ${122 + len} 110 ${112 + len} 108 99 Z`, TONGUE,
      line(`M100.5 104 L100.5 ${114 + len}`, 1.8, '#d0647a') + `<ellipse cx="96" cy="${108 + len / 2}" rx="2" ry="3.5" fill="#fff" opacity=".55"/>`, 3);
    if (kind === 'pop') return cheek(72, 98, 8, 5) + cheek(128, 98, 8, 5)
      + shape('M84 90 C84 116 116 116 116 90 Q100 96 84 90 Z', '#7b2e3a', `<ellipse cx="100" cy="110" rx="10" ry="6" fill="${TONGUE}"/>` + teeth, 3.4);
    return cheek(72, 96, 8, 5) + cheek(128, 96, 8, 5)
      + shape('M82 90 Q100 106 118 90 Q100 100 82 90 Z', '#7b2e3a', '', 3) + teeth + tongue(kind === 'happy' ? 8 : 0);
  }
  const sluzTail = 'M62 154 C40 156 26 168 18 182 C30 180 36 176 40 172 C46 178 58 178 68 170 Z';
  const sluzFeet = (lx = 0, rx = 0) => shape(`M${74 + lx} 166 L${71 + lx} 182 C${70 + lx} 188 ${90 + lx} 188 ${89 + lx} 182 L${88 + lx} 168 Z`, G, line(`M${77 + lx} 184 l0 -3 M${83 + lx} 184 l0 -3`, 1.4, GD), 3.6)
    + shape(`M${112 + rx} 168 L${113 + rx} 183 C${114 + rx} 188 ${132 + rx} 188 ${130 + rx} 182 L${127 + rx} 166 Z`, G, line(`M${118 + rx} 185 l0 -3 M${124 + rx} 185 l0 -3`, 1.4, GD), 3.6);
  const sluzko = {
    walk: () => shadow(54) + shape(sluzTail, G, `<circle cx="38" cy="168" r="3" fill="${GD}"/>`, 4) + sluzFeet(-4, 4)
      + shape(SLUZ_BODY, G, sluzSkin(), 4.2) + drips()
      + sluzArm('M68 110 C54 114 46 108 42 96', 42, 96, -2.1) + sluzArm('M132 112 C150 116 154 130 148 142', 148, 142, 1.8)
      + sluzEyes('look') + sluzFace('smile'),
    hit: () => shadow(58)
      + `<g transform="translate(100 186) scale(1.08 .9) translate(-100 -186)">`
      + shape(sluzTail, G, '', 4) + sluzFeet()
      + shape(SLUZ_BODY, G, sluzSkin(), 4.2) + drips()
      + sluzArm('M68 108 C52 102 46 92 48 80', 48, 80, -1.7) + sluzArm('M132 108 C148 102 154 92 152 80', 152, 80, -1.4)
      + sluzEyes('pop') + sluzFace('pop') + `</g>` + zing(100, 96, 66),
    down: () => shadow(70)
      + shape('M30 184 C28 166 58 152 100 150 C142 152 172 166 170 184 C140 191 60 191 30 184 Z', G,
          [[58, 172, 6], [140, 170, 5], [100, 180, 4], [120, 162, 4.5], [76, 162, 3.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 1.2}" fill="${light(GD, .3)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${GD}"/>`).join('')
          + fill('M130 150 C160 156 176 176 170 190 L180 190 L180 150 Z', GD, .4)
          + `<ellipse cx="66" cy="166" rx="12" ry="4" fill="#fff" opacity=".35"/>`, 4.2)
      + sluzArm('M50 178 C40 180 34 176 30 170', 30, 170, -2.5)
      + shape('M68 158 C64 128 80 112 100 112 C120 112 136 128 132 158 Z', G,
          `<circle cx="114" cy="146" r="5" fill="${GD}"/><circle cx="84" cy="140" r="3" fill="${GD}"/>` + `<ellipse cx="82" cy="126" rx="5" ry="8" fill="#fff" opacity=".4" transform="rotate(20 82 126)"/>`, 4)
      + `<ellipse cx="88" cy="124" rx="11" ry="12" fill="#fff" stroke="${OL}" stroke-width="3.4"/>` + spiral(88, 124, 7)
      + `<ellipse cx="112" cy="124" rx="11" ry="12" fill="#fff" stroke="${OL}" stroke-width="3.4"/>` + spiral(112, 124, 7)
      + cheek(80, 144, 6, 4) + cheek(120, 144, 6, 4)
      + line('M90 148 Q100 143 110 148', 2.6) + shape('M97 148 C96 157 99 161 102 159 C105 157 104 151 103 148 Z', TONGUE, '', 2.4)
      + `<ellipse cx="180" cy="186" rx="8" ry="3.4" fill="${G}" stroke="${OL}" stroke-width="2.6"/>`
      + stars(100, 98, 38),
    win: () => shadow(54) + shape(sluzTail, G, '', 4) + sluzFeet()
      + shape(SLUZ_BODY, G, sluzSkin(), 4.2) + drips()
      + sluzArm('M68 104 C54 92 50 72 54 54', 54, 54, -1.75) + sluzArm('M132 104 C146 92 150 72 146 54', 146, 54, -1.4)
      + sluzEyes('happy') + sluzFace('happy')
  };

  /* ════════════ SKUPINSKA SLIKA (ploščica, začetni zaslon igre) ════════════
     Po učiteljevi sliki iz Geminija, a brez verižic in dolarja: Greta se
     prekrižanih rok nasloni na Bahača, Bahač prekrižanih rok gleda vstran,
     Sluzko z obrnjeno kapo zvito pomežikne in pomaha. */
  function gretaCross() {
    return shadow(48) + gretaTorso(
        // prekrižane roke: najprej spodnja, nato zgornja čez njo
        limb('M120 116 C128 128 110 134 88 130', ORANGE, 13) + fist(86, 130)
        + limb('M80 116 C70 128 92 134 114 128', ORANGE, 13) + fist(116, 127)
        + line('M92 126 q8 3 16 0', 1.6, dark(ORANGE), .7),
        // noge prekrižane v gležnjih
        gretaLeg('M92 150 C96 160 104 166 112 172', 116, 178, 1, 108, 167) + gretaLeg('M108 150 C102 160 94 166 86 172', 82, 178, -1, 90, 167))
      + gretaHead('angry');
  }
  function sluzCap() {
    // obrnjena kapa: šilt kaže nazaj (levo), zadaj zaponka
    return shape('M40 40 C50 33 62 31 74 33 L74 45 C62 43 52 44 40 48 Z', '#2b2731', line('M46 42 L70 38', 1.6, '#55505d'), 3.6)
      + shape('M70 46 C70 16 130 12 134 40 C134 46 120 50 102 50 C86 50 74 49 70 46 Z', '#34303b',
          `<ellipse cx="90" cy="26" rx="12" ry="5" fill="#fff" opacity=".22" transform="rotate(-10 90 26)"/>`
          + line('M102 16 C104 28 104 40 102 50', 1.6, '#55505d'), 4)
      + `<rect x="122" y="28" width="9" height="6" rx="1.5" fill="#d9d9d9" stroke="${OL}" stroke-width="2" transform="rotate(20 126 31)"/>`;
  }
  function sluzCool() {
    // pol zaprte oči z veko, zenici gledata levo; jezik ven; ena roka pomaha
    const Y = 58;
    const eye = x => `<ellipse cx="${x}" cy="${Y}" rx="13" ry="14" fill="#fff" stroke="${OL}" stroke-width="3.8"/>`
      + dot(x - 5, Y + 3, 5) + fill(`M${x - 14} ${Y - 1} C${x - 13} ${Y - 18} ${x + 13} ${Y - 18} ${x + 14} ${Y - 1} Z`, G)
      + line(`M${x - 14} ${Y - 1} Q${x} ${Y - 4} ${x + 14} ${Y - 1}`, 3)
      + line(`M${x - 6} ${Y - 14} q-3 -5 -1 -9 M${x + 3} ${Y - 15} q0 -6 3 -9`, 2.4);
    return shadow(54) + shape(sluzTail.replace('M62 154', 'M136 150').replace(/C40 156 26 168 18 182 C30 180 36 176 40 172 C46 178 58 178 68 170/, 'C160 152 176 166 184 182 C172 182 164 178 160 172 C154 178 142 178 132 170'), G, '', 4)
      + sluzFeet() + shape(SLUZ_BODY, G, sluzSkin(), 4.2) + drips()
      + sluzArm('M68 112 C58 124 58 138 64 148', 64, 148, 1.9)
      + sluzArm('M132 110 C150 108 156 94 154 80', 154, 80, -1.4)
      + sluzCap() + eye(86) + eye(114) + sluzFace('smile');
  }
  function group(o = {}) {
    const s = `<g transform="translate(-8 4) rotate(8 100 186) scale(.92)">${gretaCross()}</g>`
      + `<g transform="translate(176 6) scale(.94)">${sluzCool()}</g>`
      + `<g transform="translate(82 -4) scale(1.02)">${bahCrossed('bored')}</g>`;
    if (o.inner) return s;
    return `<svg viewBox="${o.viewBox || '-4 0 380 200'}" xmlns="http://www.w3.org/2000/svg" class="ba-svg">${s}</svg>`;
  }

  const BOSSES = [
    { id: 'kujavka', name: 'Godrnjava Greta', art: greta, hint: 'jezna in trmasta' },
    { id: 'bahac',   name: 'Bahač',   art: bahac,   hint: 'velik in bahav' },
    { id: 'sluzko',  name: 'Sluzko',  art: sluzko,  hint: 'sluzast in gnusen' }
  ];
  const find = id => BOSSES.find(b => b.id === id) || BOSSES[0];

  /* pose: walk | hit | down | win. o.inner: samo vsebina brez <svg>. */
  function draw(id, pose = 'walk', o = {}) {
    const b = find(id), f = b.art[pose] || b.art.walk;
    const s = f();
    if (o.inner) return s;
    return `<svg viewBox="${o.viewBox || '0 0 200 200'}" xmlns="http://www.w3.org/2000/svg" class="ba-svg">${s}</svg>`;
  }

  /* Jeza po stopnjah (nadgradnja 31. 10. 2026): od 2. stopnje 💢 ob glavi
     (do tri), od 5. rdeč sij za nagajivcem. Riše se v prostor 0 0 200 200. */
  function anger(stage) {
    if (!stage || stage < 2) return '';
    const mark = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})" stroke="#e8435f" stroke-width="4.2" fill="none" stroke-linecap="round">`
      + `<path d="M-9 -3 Q-3 -3 -3 -9 M3 -9 Q3 -3 9 -3 M9 3 Q3 3 3 9 M-3 9 Q-3 3 -9 3"/></g>`;
    const at = [[160, 26, 1], [40, 30, .85], [176, 60, .75]];
    return (stage >= 5 ? `<ellipse cx="100" cy="110" rx="96" ry="88" fill="#e8435f" opacity=".13"/>` : '')
      + at.slice(0, Math.min(3, stage - 1)).map(([x, y, k]) => mark(x, y, k)).join('');
  }
  /* Zbirka premaganih nagajivcev (boss_trophies): za vsakega nagajivca
     največja stopnja in število zmag po ravneh. */
  const LV = { d10: 'Do 10', b20: 'Brez prehoda', pr: 'S prehodom' };
  function trophies(list) {
    list = Array.isArray(list) ? list : [];
    return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${BOSSES.map(b => {
      const mine = list.filter(t => t.boss === b.id);
      const best = mine.reduce((m, t) => Math.max(m, t.stage), 0);
      return `<div style="background:#fdfcf3;border-radius:14px;box-shadow:inset 0 0 0 1px #ecd9bc;padding:4px 4px 8px;text-align:center;font-size:.74rem;font-weight:700">
        <div style="${mine.length ? '' : 'filter:grayscale(1);opacity:.35'}">${draw(b.id, mine.length ? 'down' : 'walk', { viewBox: '0 20 200 180' })}</div>
        <div style="font-weight:900;font-size:.84rem">${b.name}</div>
        ${mine.length ? `<div style="color:#d9465f;font-weight:900">${'★'.repeat(Math.min(best, 8))}</div>`
          + mine.map(t => `<div style="color:#5d6b52">${LV[t.level] || t.level}: ${t.stage}. st. · ${t.wins}×</div>`).join('')
          : '<div style="color:#5d6b52">Še ne</div>'}
      </div>`;
    }).join('')}</div>`;
  }

  window.BossArt = { draw, group, BOSSES, find, stars, spiral, anger, trophies };
})();
