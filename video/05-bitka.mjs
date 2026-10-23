/* 5. poglavje: bitka s prijatelji. Zaženi: node 05-bitka.mjs → 05-bitka.mp4
   Bitke so odprte samo 7:00–19:00, zato je ura v brskalniku dopoldne.
   Prijatelji (sova3, medo8, ris5) so izmišljeni (bitka-demo.mjs). */
import { zazeni } from './snemalnik.mjs';
import { DEMO_STUDENT } from './demo.mjs';
import { bitkaDemo } from './bitka-demo.mjs';
import { izracunaj } from './racuni.mjs';

const B = bitkaDemo(DEMO_STUDENT);
const VPRASANJE = '#bitkaArea .bt-question';

async function bojuj(v, koliko) {
  for (let i = 0; i < koliko; i++) {
    const q = await v.loc(VPRASANJE).textContent();
    await v.page.keyboard.type(izracunaj(q), { delay: 150 });
    await v.page.keyboard.press('Enter');
    await v.page.waitForFunction(([sel, old]) => {
      const el = document.querySelector(sel);
      return el && el.textContent !== old;
    }, [VPRASANJE, q], { timeout: 5000 }).catch(() => {});
    await v.sleep(400);
  }
}

const koraki = [
  { rece: 'Brihta. Peti del: bitka s prijatelji.', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Peti del', 'Bitka s prijatelji')); },
    premor: 900 },
  { rece: 'V bitki tekmuješ s sošolci. Na začetnem zaslonu klikni Bitka.',
    naredi: async v => { await v.page.evaluate(() => __v.title(null)); await v.sleep(2000); await v.klikni('[data-home="bitka"]'); } },
  { rece: 'Spodaj vidiš bitke, ki so jih ustvarili sošolci. Taki bitki se pridružiš s klikom na Pridruži se.',
    naredi: async v => { await v.sleep(1500); await v.pokazi('#btOpenList'); } },
  { rece: 'Lahko pa ustvariš svojo bitko. Klikni Ustvari bitko.',
    naredi: async v => { await v.skrij(); await v.klikni('#btCreate'); } },
  { rece: 'Dobiš kodo iz štirih številk. Povej jo prijateljem, da se ti pridružijo.',
    naredi: async v => { await v.sleep(800); await v.pokazi('.bt-code'); } },
  { rece: 'Prijatelji se pojavljajo v seznamu. Ko so vsi zraven, klikni Začni bitko.',
    naredi: async v => {
      await v.skrij();
      await v.page.waitForFunction(() => document.querySelectorAll('#btPlayers .bt-player').length >= 4, null, { timeout: 20000 });
      await v.sleep(800);
      await v.klikni('#btStart');
    } },
  { rece: 'Vsi rešujejo iste račune, šestdeset sekund. Zgoraj vidiš svoje točke in mesto, na katerem si.',
    naredi: async v => {
      await v.loc(VPRASANJE).waitFor({ timeout: 15000 });
      await bojuj(v, 4);
      await v.pokazi('#btRankBox');
      await bojuj(v, 5);
      await v.skrij();
    } },
  { rece: 'Preskočimo do konca.',
    naredi: async v => { B.preskoci(70000); await v.page.clock.runFor(70000); await v.sleep(1500); } },
  { rece: 'Na koncu vidiš stopničke. Kdo bo zmagal naslednjič?',
    naredi: async v => { await v.sleep(2500); await v.pokazi('.bt-step.me'); } },
  { rece: 'Kdor je ustvaril bitko, lahko klikne Še enkrat. Bitke so odprte vsak dan od sedmih zjutraj do sedmih zvečer.',
    naredi: async v => { await v.skrij(); await v.pokazi('#btRematch'); },
    premor: 1200 }
];

export { koraki };
await zazeni(import.meta, '05-bitka', koraki, { odgovori: B.odgovori, prijavljen: true, ura: '2026-10-22T09:30:00+02:00' });
