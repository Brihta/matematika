/* 4. poglavje: vaja na tipkovnici in tekmovanje. Zaženi: node 04-vaja.mjs → 04-vaja.mp4
   Tekmovanje je odprto samo 7:00–19:59, zato je ura v brskalniku nastavljena
   na dopoldne. Računi se rešujejo sami: snemalnik prebere račun in vtipka
   rezultat (enkrat namenoma narobe). */
import { zazeni } from './snemalnik.mjs';
import { izracunaj } from './racuni.mjs';

/* Izmišljena dnevna lestvica; naš rezultat se doda, ko ga shranimo. */
let moj = null;
const odgovori = {
  scores: () => null,
  get_daily_board: () => [{ name: 'sova3', score: 46 }, { name: 'medo8', score: 38 }, { name: 'ris5', score: 31 },
    { name: 'zajc2', score: 24 }, { name: 'lev1', score: 17 }, ...(moj == null ? [] : [{ name: 'bri7', score: moj }])]
    .sort((a, b) => b.score - a.score)
};


/* Vaja: kazalec klika številke na zaslonski tipkovnici. */
async function resi(v, { narobe = false } = {}) {
  const q = await v.loc('#keypadArea .quiz-question').textContent();
  let r = izracunaj(q);
  if (narobe) r = String(+r + 1);
  for (const d of r) await v.klikni(`#keypadGrid [data-d="${d}"]`, { obroba: false });
  await v.klikni('#keypadGrid [data-d="ok"]', { obroba: false });
  if (narobe) {
    // ustavi uro v brskalniku, da pravilen odgovor ostane na zaslonu
    await v.page.clock.pauseAt(await v.page.evaluate(() => Date.now() + 300));
    await v.pokazi('#keypadDisplay');
    await v.sleep(3500);
    await v.skrij();
    await v.page.clock.resume();
  }
  await v.page.waitForFunction(old => {
    const el = document.querySelector('#keypadArea .quiz-question');
    return el && el.textContent !== old;
  }, q, { timeout: 15000 }).catch(() => {});
}

/* Tekmovanje: hitro, kot na pravi tipkovnici. */
async function tekmuj(v, koliko) {
  for (let i = 0; i < koliko; i++) {
    const q = await v.loc('#tekmovanjeArea .comp-question').textContent();
    await v.page.keyboard.type(izracunaj(q), { delay: 140 });
    await v.page.keyboard.press('Enter');
    await v.page.waitForFunction(old => {
      const el = document.querySelector('#tekmovanjeArea .comp-question');
      return el && el.textContent !== old;
    }, q, { timeout: 5000 }).catch(() => {});
    await v.sleep(350);
  }
}

const koraki = [
  { rece: 'Brihta. Četrti del: vaja in tekmovanje.', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Četrti del', 'Vaja in tekmovanje')); },
    premor: 900 },
  { rece: 'Na začetnem zaslonu izbereš, kaj boš vadil. Klikni Poštevanka.',
    naredi: async v => { await v.page.evaluate(() => __v.title(null)); await v.sleep(2200); await v.klikni('[data-home="post"]'); } },
  { rece: 'Odpre se okno Kaj vadim. Izberi poštevanke, ki jih želiš vaditi. Mi bomo vadili poštevanke 2, 5 in 10.',
    naredi: async v => {
      await v.sleep(1500);
      await v.klikni('#selNone');
      for (const n of [2, 5, 10]) await v.klikni(`#filterRow [data-n="${n}"]`, { obroba: false });
    } },
  { rece: 'Klikni Začni.',
    naredi: async v => { await v.klikni('#pickStart'); } },
  { rece: 'Najprej vidiš izbirne odgovore. Za sličice pa šteje tipkovnica, zato klikni Vtipkaj odgovor.',
    naredi: async v => { await v.sleep(3500); await v.klikni('#modeSwitchBtn'); } },
  { rece: 'Odgovor vtipkaj s številkami in ga potrdi s kljukico.',
    naredi: async v => { await v.sleep(800); await resi(v); } },
  { rece: 'Ko odgovoriš pravilno, se okence obarva zeleno. Lahko tipkaš tudi na pravi tipkovnici.',
    naredi: async v => { await resi(v); await resi(v); } },
  { rece: 'Če se zmotiš, ti Brihta pokaže pravilen odgovor. Dobro si ga oglej.',
    naredi: async v => { await resi(v, { narobe: true }); } },
  { rece: 'Zgoraj vidiš, koliko odgovorov je pravilnih, in medaljo, ki jo zbiraš.',
    naredi: async v => { await v.pokazi('#scoreHUD'); } },
  { rece: 'Računi do 20 delujejo enako. Na začetni zaslon se vrneš s puščico zgoraj levo.',
    naredi: async v => { await v.skrij(); await v.sleep(2500); await v.klikni('#backBtn'); } },
  { rece: 'Zdaj pa tekmovanje! Klikni Tekmovanje.',
    naredi: async v => { await v.sleep(800); await v.klikni('[data-home="tekmovanje"]'); } },
  { rece: 'Tekmovanje traja 60 sekund. Reši čim več računov iz vseh poštevank. Klikni Začni tekmovanje.',
    naredi: async v => { await v.sleep(3000); await v.klikni('#compStartBtn'); } },
  { rece: 'Hitro in pravilno! Več pravilnih odgovorov zapored prinese množilnik in še več točk.',
    naredi: async v => {
      await v.loc('#tekmovanjeArea .comp-question').waitFor({ timeout: 10000 });
      await tekmuj(v, 9);
    } },
  { rece: 'Preskočimo do konca.',
    naredi: async v => { await v.page.clock.runFor(60000); await v.sleep(800); } },
  { rece: 'Konec! Rezultat se shrani pod tvojim uporabniškim imenom. Klikni Shrani rezultat.',
    naredi: async v => {
      moj = Number(await v.loc('.comp-end-box .overlay-score-big').textContent());
      await v.sleep(2500);
      await v.klikni('#compSaveBtn');
    } },
  { rece: 'Na dnevni lestvici vidiš, kako se ti je danes izšlo. Tekmuješ lahko vsak dan od sedmih zjutraj do sedmih zvečer.',
    naredi: async v => { await v.sleep(1200); await v.pokazi('.comp-board-row.me'); },
    premor: 1200 }
];

export { koraki };
await zazeni(import.meta, '04-vaja', koraki, { odgovori, prijavljen: true, ura: '2026-10-22T09:30:00+02:00' });
