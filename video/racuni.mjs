/* Iz besedila računa ("7 × 8 =", "56 : 7 =", "13 + 4 =") izračuna rezultat. */
export function izracunaj(besedilo) {
  const m = /(\d+)\s*([×x:÷+−-])\s*(\d+)/.exec(besedilo);
  const a = +m[1], b = +m[3];
  return String({ '×': a * b, x: a * b, ':': a / b, '÷': a / b, '+': a + b, '−': a - b, '-': a - b }[m[2]]);
}
