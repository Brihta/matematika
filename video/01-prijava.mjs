/* 1. poglavje: nov račun in prijava. Zaženi: node 01-prijava.mjs → 01-prijava.mp4
   Večina učencev si račun ustvari sama; samo 2. razred dobi listek z
   vnaprej določenim geslom od učiteljice. */
import { zazeni } from './snemalnik.mjs';
import { DEMO_STUDENT } from './demo.mjs';

const GESLO = [1, 1, 6, 6];   // lev, lev, žaba, žaba (indeksi v mreži živali)

/* Nov račun še nima razreda; ko ga izbere, ga baza pomni. */
let razred = null;
const odgovori = {
  register_student: p => [{ ...DEMO_STUDENT, display_name: p.p_name, emoji: p.p_emoji,
    username: p.p_name.slice(0, 3).toLowerCase() + p.p_number }],
  get_student_razred: () => razred,
  set_student_razred: p => { razred = p.p_razred; return null; }
};

const zival = v => async () => { for (const i of GESLO) await v.klikni(`.animal-btn >> nth=${i}`, { obroba: false }); };

const koraki = [
  { rece: 'Brihta. Prvi del: nov račun in prijava.', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Prvi del', 'Nov račun in prijava')); },
    premor: 900 },
  { rece: 'Živjo! To je Brihta, stran, kjer lahko vadiš matematiko.',
    naredi: async v => { await v.page.evaluate(() => __v.title(null)); } },
  { rece: 'Najprej potrebuješ svoj račun. Zgoraj desno klikni gumb Prijava.',
    naredi: async v => { await v.sleep(2200); await v.klikni('#profileBtn'); } },
  { rece: 'Če računa še nimaš, klikni spodaj: Še nimam računa, ustvari novega.',
    naredi: async v => { await v.sleep(1500); await v.klikni('#authToRegister'); } },
  { rece: 'Vpiši svoje ime in svojo najljubšo številko.',
    naredi: async v => {
      await v.tipkaj('#regName', 'Brihtko');
      await v.tipkaj('#regNumber', '7');
    } },
  { rece: 'Izberi sličico, ki ti je všeč.',
    naredi: async v => { await v.klikni('.emoji-btn >> nth=11'); } },
  { rece: 'Zdaj si izmisli geslo: poklikaj štiri živali. Zapomni si, v kakšnem vrstnem redu si jih izbral.',
    naredi: async v => { await v.sleep(2500); await zival(v)(); } },
  { rece: 'Klikni Ustvari račun.',
    naredi: async v => { await v.klikni('#regBtn'); } },
  { rece: 'To je tvoje uporabniško ime. Uporabniško ime in svoje štiri živali si zapiši na listek. Listek dobro shrani, da ga ne izgubiš.',
    naredi: async v => { await v.sleep(800); await v.pokazi('.reg-done-user'); } },
  { rece: 'Klikni Naprej.',
    naredi: async v => { await v.skrij(); await v.klikni('#regDoneBtn'); } },
  { rece: 'Izberi razred, v katerega hodiš, in ga potrdi.',
    naredi: async v => {
      await v.sleep(1000);
      await v.klikni('.razred-btn[data-r="3A"]');
      await v.klikni('#razredOk');
    } },
  { rece: 'Prijava je uspela! Zgoraj desno zdaj vidiš svoje ime.',
    naredi: async v => { await v.sleep(1500); await v.pokazi('#profileBtn'); } },
  { rece: 'Stran si te zapomni, zato se moraš vedno odjaviti iz šolskega računalnika ali iPada. Doma pa lahko ostaneš prijavljen.',
    naredi: async v => { await v.skrij(); } },
  { rece: 'Odjaviš se tako, da klikneš svoje ime in nato Odjava.',
    naredi: async v => {
      await v.klikni('#profileBtn');
      await v.sleep(800);
      await v.klikni('#statsLogout');
    } },
  { rece: 'Naslednjič se samo prijaviš. Klikni Prijava in vpiši svoje uporabniško ime z listka.',
    naredi: async v => {
      await v.sleep(2500);
      await v.klikni('#profileBtn');
      await v.tipkaj('#authUser', 'bri7');
    } },
  { rece: 'Nato poklikaj svoje štiri živali in klikni Prijava.',
    naredi: async v => { await zival(v)(); await v.klikni('#authLoginBtn'); } },
  { rece: 'Učenci drugega razreda računa ne ustvarjajo sami. Listek z uporabniškim imenom in geslom jim da učiteljica, zato se samo prijavijo.',
    premor: 800 },
  { rece: 'Če pozabiš geslo, povej učiteljici. Ne delaj novega računa, sicer se tvoje točke lahko izgubijo.',
    premor: 1000 }
];

export { koraki };
await zazeni(import.meta, '01-prijava', koraki, { odgovori });
