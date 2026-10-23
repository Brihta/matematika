/* Nagajivci — risbe za boj z ljubljenčki (Do 20).

   Trije nagajivci po slikah, ki jih je učitelj naredil v Geminiju (23. 10.
   2026): Godrnjava Greta (jezna punčka s čopki; v bazi 'kujavka'), Bahač (velik, plešast, nos v
   zraku) in Sluzko (zelena sluzasta pošast). Imena niso prava imena, da se
   noben sošolec ne bi počutil, kot da je on nagajivec.

   Vsak ima štiri drže: hodi (proti levi, k ljubljenčkom), zadet, poražen,
   zmagovalec. Platno je viewBox 0 0 200 200, tla na y ≈ 186, kot pri
   ljubljenčkih (pet-art.js) — isti slog: temna obroba, mehke barve. */
(function () {
  const OL = '#4a2733';

  let uid = 0;
  function shape(d, fill, inner = '', w = 4) {
    const id = 'ba' + (++uid);
    return `<path d="${d}" fill="${fill}"/>`
      + (inner ? `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` : '')
      + `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const line = (d, w = 3, c = OL) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /* Debel ud z obrobo: najprej temna črta, čez njo ožja v barvi. */
  const limb = (d, c, w = 12) => line(d, w + 7) + line(d, w, c);
  const ball = (x, y, r, c, w = 3.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${OL}" stroke-width="${w}"/>`;
  const cheek = (x, y, rx = 7, ry = 4.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f4a3a3" opacity=".85"/>`;
  const dot = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${OL}"/><circle cx="${x + r * .35}" cy="${y - r * .4}" r="${r * .32}" fill="#fff"/>`;
  const shadow = rx => `<ellipse cx="100" cy="188" rx="${rx}" ry="7" fill="#05270b" opacity=".12"/>`;
  /* Vrtinčasto oko (omotičen). */
  const spiral = (x, y, r) => line(`M${x} ${y} a${r * .25} ${r * .25} 0 1 1 ${r * .5} 0 a${r * .5} ${r * .5} 0 1 1 ${-r} 0 a${r * .75} ${r * .75} 0 1 1 ${r * 1.5} 0`, 2);
  /* Zvezdice, ki krožijo nad glavo. */
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

  /* ── SLUZKO: zelena sluzasta pošast ── */
  const G = '#a6d68e', GD = '#7cb866', TONGUE = '#f0909e';
  function sluzSpots() {
    return [[80, 112, 6], [121, 100, 5], [115, 142, 7], [78, 150, 5], [101, 162, 4], [130, 126, 4], [96, 128, 3.4]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${GD}" opacity=".75"/>`).join('');
  }
  const SLUZ_BODY = 'M66 172 C52 146 54 96 70 70 C82 52 118 52 130 70 C146 96 148 146 134 172 C120 180 80 180 66 172 Z';
  const hand3 = (x, y, a, c) => [-.5, 0, .5].map(t => {
    const r = a + t;
    return limb(`M${x} ${y} L${(x + Math.cos(r) * 9).toFixed(1)} ${(y + Math.sin(r) * 9).toFixed(1)}`, c, 5);
  }).join('');
  function sluzEyes(kind) {
    const lash = x => line(`M${x - 8} ${48} L${x - 12} ${40}`, 2.4) + line(`M${x} ${45} L${x} ${36}`, 2.4) + line(`M${x + 8} ${48} L${x + 12} ${40}`, 2.4);
    const big = kind === 'pop';
    const eye = (x, px, py) => ball(x, 60, big ? 15 : 13, '#fff') + (kind === 'spin' ? spiral(x, 60, 9)
      : kind === 'happy' ? line(`M${x - 6} ${62} Q${x} ${54} ${x + 6} ${62}`, 3) : dot(x + px, 60 + py, big ? 3 : 5));
    return lash(86) + lash(114) + eye(86, -3, 1) + eye(114, -3, 1);
  }
  function sluzFace(kind) {
    const open = kind === 'pop';
    return cheek(76, 96) + cheek(124, 96)
      + (open
        ? shape('M88 90 C88 108 112 108 112 90 Z', '#7b2e3a', `<ellipse cx="100" cy="106" rx="8" ry="6" fill="${TONGUE}"/>`, 3)
        : line('M84 90 Q100 104 116 90', 3)
          + `<path d="M90 93 L93 100 L96 95 Z M104 95 L107 100 L110 93 Z" fill="#fff" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`
          + shape(kind === 'happy' ? 'M94 98 C92 116 97 128 102 128 C108 128 110 116 107 97 Z' : 'M94 98 C93 110 96 118 101 118 C106 118 108 110 107 97 Z',
              TONGUE, line('M100.5 102 L100.5 112', 1.6, '#d06478'), 3));
  }
  const sluzko = {
    walk: () => shadow(52)
      + shape('M64 156 C44 158 32 170 22 180 C40 182 58 178 68 172 Z', G)
      + shape('M76 166 L72 182 C72 187 90 187 89 182 L88 168 Z', G) + shape('M112 168 L114 183 C115 187 131 187 129 181 L126 166 Z', G)
      + shape(SLUZ_BODY, G, sluzSpots(), 4.2)
      + limb('M68 110 C54 114 46 106 42 96', G) + hand3(42, 96, -2, G)
      + limb('M132 112 C148 118 154 132 148 144', G) + hand3(148, 144, 1.8, G)
      + sluzEyes('look') + sluzFace('smile'),
    hit: () => shadow(56)
      + `<g transform="translate(100 186) scale(1.08 .9) translate(-100 -186)">`
      + shape('M64 156 C44 158 32 170 22 180 C40 182 58 178 68 172 Z', G)
      + shape('M76 166 L72 182 C72 187 90 187 89 182 L88 168 Z', G) + shape('M112 168 L114 183 C115 187 131 187 129 181 L126 166 Z', G)
      + shape(SLUZ_BODY, G, sluzSpots(), 4.2)
      + limb('M68 108 C52 100 46 90 48 78', G) + hand3(48, 78, -1.6, G)
      + limb('M132 108 C148 100 154 90 152 78', G) + hand3(152, 78, -1.5, G)
      + sluzEyes('pop') + sluzFace('pop') + `</g>` + zing(100, 96, 66),
    down: () => shadow(66)
      + shape('M32 184 C30 166 60 154 100 152 C140 154 170 166 168 184 C140 190 60 190 32 184 Z', G,
          [[60, 172, 6], [138, 170, 5], [100, 178, 4], [118, 162, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${GD}" opacity=".75"/>`).join(''), 4.2)
      + shape('M70 158 C66 130 80 116 100 116 C120 116 134 130 130 158 Z', G, `<circle cx="112" cy="146" r="5" fill="${GD}" opacity=".75"/>`, 4)
      + ball(88, 128, 11, '#fff') + spiral(88, 128, 7) + ball(112, 128, 11, '#fff') + spiral(112, 128, 7)
      + cheek(80, 146, 6, 4) + cheek(120, 146, 6, 4)
      + line('M92 148 Q100 144 108 148', 2.6) + shape('M98 148 C97 156 100 160 103 158 C105 156 104 151 103 148 Z', TONGUE, '', 2.4)
      + `<ellipse cx="178" cy="186" rx="7" ry="3" fill="${G}" stroke="${OL}" stroke-width="2.6"/>`
      + stars(100, 104, 36),
    win: () => shadow(52)
      + shape('M64 156 C44 158 32 170 22 180 C40 182 58 178 68 172 Z', G)
      + shape('M76 166 L72 182 C72 187 90 187 89 182 L88 168 Z', G) + shape('M112 168 L114 183 C115 187 131 187 129 181 L126 166 Z', G)
      + shape(SLUZ_BODY, G, sluzSpots(), 4.2)
      + limb('M68 104 C54 92 50 72 54 54', G) + hand3(54, 54, -1.7, G)
      + limb('M132 104 C146 92 150 72 146 54', G) + hand3(146, 54, -1.4, G)
      + sluzEyes('happy') + sluzFace('happy')
  };

  /* ── BAHAČ: velik, plešast, nos v zraku ── */
  const SKIN = '#f7caa6', SKIN_D = '#e6a684', SHIRT = '#3a3340', PANTS = '#29252e', SHOE = '#7a4a2e';
  function bahHead(kind) {
    const eyes = kind === 'spin' ? spiral(90, 46, 6) + spiral(106, 46, 6)
      : kind === 'smug' ? line('M86 47 Q90 50 94 47', 2.6) + line('M102 47 Q106 50 110 47', 2.6)
      : kind === 'oh' ? dot(90, 46, 3) + dot(106, 46, 3)
      // pol zaprte, naveličane oči
      : `<path d="M85 45 Q90 42 95 45 L95 47 Q90 51 85 47 Z" fill="#fff" stroke="${OL}" stroke-width="2"/>${dot(89, 47, 2.2)}`
        + `<path d="M101 45 Q106 42 111 45 L111 47 Q106 51 101 47 Z" fill="#fff" stroke="${OL}" stroke-width="2"/>${dot(105, 47, 2.2)}`
        + line('M84 44 L96 43', 2.8) + line('M100 43 L112 44', 2.8);
    const mouth = kind === 'oh' ? `<ellipse cx="92" cy="61" rx="4" ry="5" fill="#7b2e3a" stroke="${OL}" stroke-width="2.4"/>`
      : kind === 'smug' ? line('M88 59 Q96 65 104 58', 2.6)
      : kind === 'spin' ? line('M88 61 Q94 58 100 61', 2.4)
      : line('M87 60 Q92 57 97 60', 2.6);
    return shape('M117 40 C126 36 130 50 120 54 Z', SKIN, `<path d="M118 42 C123 42 124 48 120 50" fill="none" stroke="${SKIN_D}" stroke-width="2"/>`, 3.4)
      + shape('M78 44 C78 28 90 22 101 22 C114 22 122 32 121 46 C120 60 110 68 99 68 C86 68 78 58 78 44 Z', SKIN,
          `<ellipse cx="92" cy="30" rx="8" ry="4" fill="#fff" opacity=".45"/>`, 4)
      + line('M101 22 C97 14 104 10 107 15 C109 19 104 21 102 18', 2.6)
      + `<path d="M79 49 C74 49 73 55 79 56" fill="${SKIN}" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`
      + eyes + mouth + cheek(86, 56, 5, 3);
  }
  function bahBody(arms) {
    const belly = 'M56 128 C70 142 130 142 144 128 L146 144 C130 154 70 154 54 144 Z';
    return shape('M76 172 L72 184 L58 184 C54 184 54 176 62 174 Z', SHOE) + shape('M118 172 L126 184 L140 184 C146 184 146 176 138 174 Z', SHOE)
      + shape('M54 142 C70 154 130 154 146 142 C150 160 144 174 128 176 L114 176 L108 160 L92 160 L86 176 L72 176 C56 174 50 160 54 142 Z', PANTS)
      + shape(belly, SKIN, line('M98 144 Q100 147 102 144', 2, SKIN_D), 4)
      + shape('M76 70 C60 80 52 110 56 130 C72 140 128 140 144 130 C148 110 140 80 124 70 C114 64 86 64 76 70 Z', SHIRT,
          `<path d="M66 86 C64 100 64 112 68 124" fill="none" stroke="#5a5262" stroke-width="5" stroke-linecap="round"/>`, 4)
      + arms;
  }
  const bahArm = (d, hx, hy) => limb(d, SHIRT, 15) + ball(hx, hy, 8, SKIN, 3.4);
  const bahac = {
    walk: () => shadow(54) + bahBody(bahArm('M74 78 C60 92 56 108 60 122', 60, 126) + bahArm('M126 78 C140 92 144 108 140 122', 140, 126))
      + `<g transform="rotate(-8 100 66)">${bahHead('bored')}</g>`,
    hit: () => shadow(58) + `<g transform="rotate(7 100 186)">`
      + bahBody(bahArm('M74 78 C60 88 52 96 48 92', 46, 90) + bahArm('M126 78 C140 88 148 96 152 92', 154, 90))
      + bahHead('oh') + `</g>` + zing(100, 60, 50),
    down: () => shadow(80)
      // na hrbtu kot želva: glava levo (k ljubljenčkom), noge desno
      + `<g transform="translate(0 30) rotate(-90 100 110)">`
      + bahBody(bahArm('M74 78 C62 76 54 68 52 58', 52, 56) + bahArm('M126 78 C138 76 146 68 148 58', 148, 56))
      + bahHead('spin') + `</g>` + stars(36, 100, 26),
    win: () => shadow(54) + bahBody(
        limb('M76 78 C62 92 66 104 80 104', SHIRT, 15) + limb('M124 78 C138 92 134 104 120 104', SHIRT, 15)
        + limb('M80 104 L120 100', SKIN, 11) + limb('M120 106 L82 102', SKIN, 11))
      + `<g transform="rotate(-4 100 66)">${bahHead('smug')}</g>`
  };

  /* ── KUJAVKA: jezna punčka s čopki ── */
  const HAIR = '#7b4b34', HAIR_D = '#5b3424', KSKIN = '#f8d6be', ORANGE = '#f28a3c', GREY = '#8f959d', GREY_D = '#71777f';
  /* Košat čop iz krogov: najprej vse obrobe, nato vse barve — en obris. */
  function puff(parts) {
    return parts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}" fill="${OL}"/>`).join('')
      + parts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.6}" fill="${HAIR}"/>`).join('')
      + parts.map(([x, y, r]) => `<path d="M${x - r * .5} ${y + r * .1} q${r * .3} ${-r * .4} ${r * .7} ${-r * .1}" fill="none" stroke="${HAIR_D}" stroke-width="1.8" stroke-linecap="round"/>`).join('');
  }
  function kujHead(kind, cy = 62) {
    const dy = cy - 62, t = (x, y) => `${x} ${y + dy}`;
    const brows = kind === 'smug' ? line(`M${t(80, 54)} L${t(94, 57)}`, 3.4) + line(`M${t(103, 55)} Q${t(110, 50)} ${t(117, 52)}`, 3.4)
      : kind === 'spin' ? line(`M${t(80, 54)} L${t(93, 51)}`, 3) + line(`M${t(104, 51)} L${t(117, 54)}`, 3)
      : line(`M${t(79, 52)} L${t(95, 59)}`, 3.8) + line(`M${t(102, 59)} L${t(118, 52)}`, 3.8);
    const eyes = kind === 'spin' ? spiral(88, 66 + dy, 7) + spiral(110, 66 + dy, 7)
      : kind === 'squeeze' ? line(`M${t(82, 62)} L${t(92, 66)} L${t(82, 70)}`, 3) + line(`M${t(116, 62)} L${t(106, 66)} L${t(116, 70)}`, 3)
      : kind === 'smug' ? line(`M${t(83, 66)} Q${t(88, 63)} ${t(93, 66)}`, 3) + dot(110, 66 + dy, 3.6)
      : dot(88, 66 + dy, 3.8) + dot(109, 66 + dy, 3.8);
    const mouth = kind === 'smug' ? line(`M${t(90, 82)} Q${t(98, 88)} ${t(108, 80)}`, 2.8)
      : kind === 'spin' ? line(`M${t(92, 84)} Q${t(98, 79)} ${t(104, 84)}`, 2.6)
      : kind === 'squeeze' ? line(`M${t(90, 82)} L${t(94, 79)} L${t(98, 82)} L${t(102, 79)} L${t(106, 82)}`, 2.6)
      : line(`M${t(92, 83)} Q${t(98, 77)} ${t(104, 83)}`, 3) + `<circle cx="100" cy="${80 + dy}" r="0" />`;
    return puff([[62, 34 + dy, 15], [52, 46 + dy, 12], [70, 22 + dy, 11], [56, 26 + dy, 10]])
      + puff([[138, 34 + dy, 15], [148, 46 + dy, 12], [130, 22 + dy, 11], [144, 26 + dy, 10]])
      + shape(`M${t(118, 64)} C${t(128, 60)} ${t(132, 74)} ${t(120, 78)} Z`, KSKIN, '', 3.4)
      + shape(`M${t(70, 62)} C${t(70, 42)} ${t(84, 34)} ${t(100, 34)} C${t(118, 34)} ${t(130, 44)} ${t(128, 64)} C${t(127, 82)} ${t(114, 94)} ${t(99, 94)} C${t(82, 94)} ${t(70, 82)} ${t(70, 62)} Z`, KSKIN, '', 4)
      + puff([[78, 42 + dy, 10], [90, 36 + dy, 11], [104, 35 + dy, 11], [117, 40 + dy, 10], [124, 49 + dy, 7]])
      + cheek(80, 76 + dy, 7.5, 5) + cheek(117, 76 + dy, 7.5, 5) + brows + eyes + mouth;
  }
  /* Telo pokonci: majica, hlače z naramnicami, noge kot debeli udi. */
  function kujBody(legs, arms) {
    const shoe = (x, y, flip) => shape(`M${x - 11} ${y - 7} C${x - 14} ${y - 7} ${x - 16} ${y + 4} ${x - 10} ${y + 5} L${x + 10} ${y + 5} C${x + 13} ${y + 5} ${x + 11} ${y - 7} ${x + 5} ${y - 8} Z`, ORANGE,
        `<path d="M${x - 20} ${y + 1} L${x + 20} ${y + 1} L${x + 20} ${y + 10} L${x - 20} ${y + 10} Z" fill="#fffaf0"/>`, 3.2);
    return legs.map(([d, fx, fy]) => limb(d, GREY, 15) + shoe(fx, fy)).join('')
      + shape('M76 96 C78 92 122 92 124 96 L126 132 C112 138 88 138 74 132 Z', ORANGE, '', 4)
      + shape('M82 104 L118 104 L122 140 C108 146 92 146 78 140 Z', GREY,
          `<rect x="92" y="112" width="16" height="9" rx="2" fill="${GREY_D}"/>`, 4)
      + line('M84 104 L80 94', 4.6, GREY_D) + line('M116 104 L120 94', 4.6, GREY_D)
      + `<circle cx="85" cy="107" r="2" fill="#fff"/><circle cx="115" cy="107" r="2" fill="#fff"/>`
      + arms;
  }
  const kujArm = (d, hx, hy) => limb(d, ORANGE, 13) + ball(hx, hy, 7.5, KSKIN, 3.2);
  const kujavka = {
    walk: () => shadow(48) + kujBody(
        [['M90 136 C86 152 80 162 74 170', 70, 176], ['M110 136 C116 150 122 160 126 168', 128, 175]],
        kujArm('M80 100 C68 106 62 114 58 108', 56, 104) + kujArm('M120 100 C130 112 132 122 128 130', 128, 132))
      + kujHead('angry'),
    hit: () => shadow(52) + `<g transform="rotate(8 100 186)">` + kujBody(
        [['M90 136 C86 152 82 164 80 172', 78, 177], ['M110 136 C114 152 118 164 120 172', 122, 177]],
        kujArm('M80 100 C68 104 62 98 60 90', 58, 88) + kujArm('M120 100 C132 104 136 112 132 118', 130, 120))
      + kujHead('squeeze') + `</g>` + zing(100, 62, 52),
    down: () => shadow(62)
      + [['M92 160 C80 166 64 168 50 168', 44, 172], ['M106 162 C94 172 76 176 62 178', 56, 181]].map(([d, fx, fy]) =>
          limb(d, GREY, 15) + shape(`M${fx - 4} ${fy - 14} C${fx - 12} ${fy - 14} ${fx - 12} ${fy + 4} ${fx - 2} ${fy + 4} C${fx + 4} ${fy + 4} ${fx + 6} ${fy - 10} ${fx - 4} ${fy - 14} Z`, '#fffaf0', '', 3)).join('')
      + shape('M78 124 C80 120 120 120 122 124 L126 162 C112 170 88 170 74 162 Z', ORANGE, '', 4)
      + shape('M84 132 L116 132 L120 166 C106 172 92 172 80 166 Z', GREY, '', 4)
      + line('M86 132 L82 122', 4.6, GREY_D) + line('M114 132 L118 122', 4.6, GREY_D)
      + kujArm('M80 128 C70 140 66 156 70 170', 70, 172) + kujArm('M120 128 C132 140 140 156 144 168', 146, 170)
      + kujHead('spin', 92) + stars(100, 52, 40),
    win: () => shadow(48) + kujBody(
        [['M90 136 L88 172', 86, 177], ['M110 136 L114 172', 116, 177]],
        limb('M80 100 C64 108 64 124 78 128', ORANGE, 13) + limb('M120 100 C136 108 136 124 122 128', ORANGE, 13))
      + kujHead('smug')
  };

  const BOSSES = [
    { id: 'kujavka', name: 'Godrnjava Greta', art: kujavka, hint: 'jezna in trmasta' },
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

  window.BossArt = { draw, BOSSES, find, stars, spiral };
})();
