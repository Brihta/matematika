/* 2. poglavje: ljubljenček. Zaženi: node 02-ljubljencek.mjs → 02-ljubljencek.mp4 */
import { zazeni } from './snemalnik.mjs';
import { ljubljencekDemo } from './ljubljencek-demo.mjs';

const L = ljubljencekDemo();
const ponovnoNalozi = v => v.page.evaluate(() =>
  document.querySelector('iframe[title="Moj ljubljenček"]').contentWindow.petReload());

const koraki = [
  { rece: 'Brihta. Drugi del: ljubljenček.', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Drugi del', 'Ljubljenček')); },
    premor: 900 },
  { rece: 'Ko si prijavljen, se zgoraj ob tvojem imenu pokaže gumb s klicajem. Klikni ga.',
    naredi: async v => {
      await v.page.evaluate(() => __v.title(null));
      await v.sleep(2500); await v.klikni('#svChip');
    } },
  { rece: 'Tu si izbereš ljubljenčka. Zmajček in sovica se izvalita iz jajca, lisička in mucek spita v košarici.',
    naredi: async v => { await v.sleep(1500); await v.pokazi('ljub|.pick .row'); } },
  { rece: 'Izberimo sovico.',
    naredi: async v => { await v.skrij(); await v.klikni('ljub|[data-new="sova"]'); } },
  { rece: 'Napiši, kako ji bo ime.',
    naredi: async v => {
      await v.tipkaj('ljub|#nameIn', 'Zvezdica');
      await v.loc('ljub|#nameIn').press('Enter');
    } },
  { rece: 'Izbereš lahko tudi barvo, trebušček in oči. Kjer je ključavnica, se to odklene pozneje.',
    naredi: async v => { await v.sleep(1500); await v.klikni('ljub|[data-k="belly"][data-v="breskev"]'); } },
  { rece: 'Ljubljenček raste, ko pri računih do 20 dosegaš mejnike. Mejnik dosežeš, ko račune rešuješ pravilno in hitro, na tipkovnici.',
    naredi: async v => { await v.pokazi('ljub|.ms'); } },
  { rece: 'Poglejmo, kaj se zgodi po nekaj dneh vaje.',
    naredi: async v => { await v.skrij(); L.napreduj(); await ponovnoNalozi(v); await v.sleep(300); await v.pokazi('ljub|.pet-big'); } },
  { rece: 'Jajce se je izvalilo! Prvi mejnik je dosežen.',
    naredi: async v => { await v.sleep(1800); await v.pokazi('ljub|.growth'); } },
  { rece: 'Za vajo do 20 dobiš tudi priboljške, to so jabolka. Na dan jih lahko zbereš največ dvajset.',
    naredi: async v => { await v.pokazi('ljub|.treats'); } },
  { rece: 'Z jabolki v trgovini kupiš dodatke. Kupimo pentljo.',
    naredi: async v => { await v.skrij(); await v.sleep(1500); await v.klikni('ljub|[data-buy="pentlja"]'); } },
  { rece: 'Kupljen dodatek še obleci.',
    naredi: async v => { await v.klikni('ljub|[data-wear="pentlja"]'); } },
  { rece: 'Zdaj ima Zvezdica pentljo!',
    naredi: async v => { await v.pokazi('ljub|.pet-big'); } },
  { rece: 'Med vajo do 20 je ljubljenček s tabo. Vsakič, ko odgovoriš pravilno, poskoči. Pa veliko uspeha!',
    naredi: async v => { await v.skrij(); await v.klikni('#svClose'); },
    premor: 1000 }
];

export { koraki };
await zazeni(import.meta, '02-ljubljencek', koraki, { odgovori: L.answers, prijavljen: true });
