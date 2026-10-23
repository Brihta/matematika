/* 3. poglavje: vitez in prvi nakupi s cekini. Zaženi: node 03-vitez.mjs → 03-vitez.mp4
   Ob prvem obisku se okno z likom odpre samo (izbira vitez/vitezinja),
   za njo pa še ovojnica z Dobrodošlico. */
import { zazeni } from './snemalnik.mjs';
import { albumDemo } from './album-demo.mjs';

const koraki = [
  { rece: 'Brihta. Tretji del: vitez in cekini.', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Tretji del', 'Vitez in cekini')); },
    premor: 900 },
  { rece: 'Ko se prvič prijaviš, se odpre okno s tvojim likom. To jesen je tvoj lik vitez.',
    naredi: async v => { await v.page.evaluate(() => __v.title(null)); } },
  { rece: 'Izberi, ali boš vitez ali vitezinja.',
    naredi: async v => { await v.sleep(1200); await v.klikni('lik|[data-do="form"][data-val="m"]'); } },
  { rece: 'Za vajo poštevanke dobiš sličice. Prva te že čaka v ovojnici. Klikni Odpri.',
    naredi: async v => { await v.sleep(2500); await v.klikni('lik|[data-do="reveal"]'); } },
  { rece: 'To je sličica Dobrodošlica. Prilepi jo v album.',
    naredi: async v => { await v.sleep(1200); await v.klikni('lik|[data-do="stick"]'); } },
  { rece: 'Za vsako prilepljeno sličico dobiš dvajset cekinov. Zdaj jih imaš šestdeset.',
    naredi: async v => { await v.sleep(1200); await v.pokazi('lik|#wallet'); } },
  { rece: 'Sličico dobiš tudi za vsako poštevanko, ko jo rešuješ pravilno in hitro.',
    naredi: async v => { await v.skrij(); await v.klikni('lik|[data-page="post"]'); await v.sleep(400); await v.pokazi('lik|#slot-x1'); } },
  { rece: 'S cekini kupuješ opremo za svojega viteza. Klikni Oprema.',
    naredi: async v => { await v.skrij(); await v.sleep(1200); await v.klikni('lik|[data-view="trgovina"]'); } },
  { rece: 'Izberi lesen ščit. Vitez ga najprej preizkusi, da vidiš, kako mu pristoji.',
    naredi: async v => { await v.klikni('lik|[data-try="scit-les"]'); await v.sleep(600); await v.pokazi('lik|#stageSvg'); } },
  { rece: 'Klikni Kupi in nakup potrdi.',
    naredi: async v => {
      await v.skrij();
      await v.klikni('lik|[data-do="buy"]');
      await v.sleep(600);
      await v.klikni('lik|[data-do="confirm"]');
    } },
  { rece: 'Tvoj vitez ima zdaj svoj prvi ščit!',
    naredi: async v => { await v.sleep(800); await v.pokazi('lik|#stageSvg'); } },
  { rece: 'Ko zbereš več cekinov, si lahko kupiš meč, oklep, čelado ali plašč.',
    naredi: async v => { await v.skrij(); await v.pokazi('lik|[data-try="mec"]'); } },
  { rece: 'Vitez te spremlja pri vaji poštevanke. Veliko uspeha!',
    naredi: async v => { await v.skrij(); await v.klikni('#svClose'); await v.sleep(800); await v.pokazi('#homeHero'); },
    premor: 1000 }
];

export { koraki };
await zazeni(import.meta, '03-vitez', koraki, { odgovori: albumDemo(), prijavljen: true });
