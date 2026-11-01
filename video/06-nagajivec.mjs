/* 6. poglavje: Odženi nagajivce! Zaženi: node 06-nagajivec.mjs → 06-nagajivec.mp4
   Posnetki v glas/06-nagajivec/ so vezani na zaporedno številko koraka,
   zato koraka ne dodajaj ali briši sredi seznama — samo na koncu.
   Prijatelji (sova3, medo8, ris5) so izmišljeni (nagajivec-demo.mjs).
   Boj je proti Sluzku; računi se rešujejo sami (enkrat namenoma narobe). */
import { zazeni } from './snemalnik.mjs';
import { DEMO_STUDENT } from './demo.mjs';
import { nagajivecDemo } from './nagajivec-demo.mjs';
import { izracunaj } from './racuni.mjs';

const N = nagajivecDemo(DEMO_STUDENT);
const RACUN = '#ngQ';

/* Med bojem kazalec hitreje skače po tipkah. */
const hitro = (v, on) => v.page.evaluate(on => {
  document.getElementById('vCursor').style.transition = on ? 'left .25s ease-out, top .25s ease-out' : '';
}, on);

async function tapni(v, sel) {
  const r = await v.loc(sel).boundingBox();
  await v.page.evaluate(([x, y]) => __v.cursor(x, y), [r.x + r.width / 2, r.y + r.height / 2]);
  await v.sleep(300);
  await v.page.evaluate(() => __v.press(true)); await v.sleep(90);
  await v.loc(sel).click({ force: true });
  await v.page.evaluate(() => __v.press(false));
  await v.sleep(80);
}

/* Med bojem je podnapis desno ob igri, da ne prekrije tipk. */
const obStrani = (v, on) => v.page.evaluate(on => {
  const c = document.getElementById('vCap');
  if (on) Object.assign(c.style, { left: 'auto', right: '28px', bottom: 'auto', top: '42%', transform: 'translateY(-50%)',
    maxWidth: '300px', fontSize: '22px', textAlign: 'left' });
  else c.removeAttribute('style');
  c.style.opacity = c.textContent ? 1 : 0;
}, on);

const konec = v => v.page.evaluate(() => !document.querySelector('#ngGrid') || !!document.getElementById('ngOverlay')
  || !/\d/.test(document.getElementById('ngQ').textContent));

/* Ko je račun na zaslonu in tipke niso omotične. */
async function pocakajRacun(v) {
  await v.page.waitForFunction(() => {
    const k = document.getElementById('ngKeys'), b = document.querySelector('#ngGrid [data-d="ok"]');
    return k && !k.classList.contains('dazed') && b && !b.disabled;
  }, null, { timeout: 8000 }).catch(() => {});
}

/* En račun s klikanjem po tipkah na zaslonu. Zasluzeno tipko najprej očisti. */
async function resi(v, { narobe = false } = {}) {
  if (await konec(v)) return;
  await pocakajRacun(v);
  const q = await v.loc(RACUN).textContent();
  let r = izracunaj(q);
  if (narobe) r = String(+r + 1);
  for (const d of r) {
    const sel = `#ngGrid [data-d="${d}"]`;
    if (await v.loc(sel).evaluate(b => b.classList.contains('slimed'))) await tapni(v, sel);
    await tapni(v, sel);
  }
  await tapni(v, '#ngGrid [data-d="ok"]');
  await v.page.waitForFunction(([sel, old]) => {
    const el = document.querySelector(sel);
    return !el || el.textContent !== old;
  }, [RACUN, q], { timeout: 5000 }).catch(() => {});
}

/* En račun s tipkovnico; sluz z računa najprej obriše preslednica. */
async function tipkaj(v) {
  if (await konec(v)) return;
  await pocakajRacun(v);
  if (await v.page.evaluate(() => !!document.querySelector('#ngQ .ng-splat:not(.wipe)'))) {
    await v.page.keyboard.press(' ');
    await v.sleep(500);
  }
  const q = await v.loc(RACUN).textContent();
  await v.page.keyboard.type(izracunaj(q), { delay: 180 });
  await v.sleep(150);
  await v.page.keyboard.press('Enter');
  await v.page.waitForFunction(([sel, old]) => {
    const el = document.querySelector(sel);
    return !el || el.textContent !== old;
  }, [RACUN, q], { timeout: 5000 }).catch(() => {});
}

const koraki = [
  { rece: 'Brihta. Šesti del: Odženi nagajivce!', napis: ' ',
    naredi: async v => { await v.page.evaluate(() => __v.title('Šesti del', 'Odženi nagajivce!')); },
    premor: 900 },
  { rece: 'V tej igri ljubljenčki skupaj premagajo nagajivca. Za igro moraš biti prijavljen in imeti ljubljenčka.',
    naredi: async v => { await v.page.evaluate(() => __v.title(null)); await v.sleep(2500); await v.pokazi('.home-tile.t-nag'); } },
  { rece: 'Na začetnem zaslonu klikni Odženi nagajivce.',
    naredi: async v => { await v.skrij(); await v.klikni('[data-home="nagajivec"]'); } },
  { rece: 'Igraš lahko sam ali s prijatelji. V enem boju vas je lahko največ osem.',
    naredi: async v => { await v.sleep(800); await v.pokazi('#nagajivecArea .ng-rules'); } },
  { rece: 'Če je prijatelj že ustvaril boj, vpiši njegovo kodo in klikni Pridruži se. Boje sošolcev vidiš tudi spodaj.',
    naredi: async v => {
      await v.skrij(); await v.pokazi('.ng-join'); await v.sleep(3800);
      await v.pokazi('#ngOpen .ng-open-row');
    } },
  { rece: 'Lahko pa ustvariš svoj boj. Klikni Ustvari boj.',
    naredi: async v => { await v.skrij(); await v.klikni('#ngCreate'); } },
  { rece: 'Dobiš kodo iz štirih številk. Povej jo prijateljem, da se ti pridružijo.',
    naredi: async v => { await v.sleep(800); await v.pokazi('.ng-code'); } },
  { rece: 'Zdaj izberite nagajivca. Vsak klikne tistega, ki ga želi premagati. Izbran je tisti z največ glasovi.',
    naredi: async v => {
      await v.skrij();
      await v.page.waitForFunction(() => document.querySelectorAll('#ngTeam .ng-mate').length >= 3, null, { timeout: 20000 });
      await v.pokazi('#ngBosses');
    } },
  { rece: 'Vsak nagajivec ima svojo posebnost. Godrnjava Greta zastavlja uganke, na primer: sedem plus koliko je deset? Rešena uganka je dvojni strel.',
    naredi: async v => { await v.skrij(); await v.klikni('#ngBosses [data-vote="kujavka"]'); await v.pokazi('#ngTwist'); } },
  { rece: 'Bahač ima ščit. Trikrat zapored odgovori pravilno, pa se ščit razbije.',
    naredi: async v => { await v.skrij(); await v.klikni('#ngBosses [data-vote="bahac"]'); await v.pokazi('#ngTwist'); } },
  { rece: 'Sluzko meče sluz na račun in na tipke. Obriši jo s klikom ali s pritiskom na tipko presledek.',
    naredi: async v => { await v.skrij(); await v.klikni('#ngBosses [data-vote="sluzko"]'); await v.pokazi('#ngTwist'); } },
  { rece: 'Spodaj vidiš, katere račune boš reševal. Vsak računa na svoji ravni. Težji računi se odklenejo, ko boš pri vaji do dvajset napredoval.',
    naredi: async v => {
      await v.skrij(); await v.pokazi('#ngLevels'); await v.sleep(4500);
      await v.pokazi('#ngLevels [data-lv="pr"]');
    } },
  { rece: 'Kdor je ustvaril boj, ima krono. Ko so vsi zraven, klikne Začni boj.',
    naredi: async v => {
      await v.skrij();
      await v.page.waitForFunction(() => document.querySelectorAll('#ngTeam .ng-mate').length >= 4, null, { timeout: 20000 });
      await v.pokazi('#ngTeam .ng-mate.me'); await v.sleep(2600);
      await v.skrij(); await v.klikni('#ngStart');
    } },
  { rece: 'Preberi, kateri nagajivec prihaja. Potem se začne odštevanje.',
    naredi: async v => { await v.sleep(600); await v.pokazi('#ngOverlay .ng-twist'); await v.sleep(2600); await v.skrij(); } },
  { rece: 'Nagajivec hodi proti ljubljenčkom. Če pride do rdeče črte, zmaga on.',
    naredi: async v => {
      await v.loc('#ngGrid').waitFor({ timeout: 15000 });
      await hitro(v, true);
      // boj je višji od zaslona: pomanjšan se vidi cel nad podnapisom
      await v.page.evaluate(() => { document.getElementById('nagajivecArea').style.zoom = .74; scrollTo(0, 0); });
      await obStrani(v, true);
      await v.sleep(1500); await v.pokazi('#ngLine');
    } },
  { rece: 'Vsak pravilen odgovor je strel tvojega ljubljenčka. Vsak zadetek nagajivca malo odbije nazaj.',
    naredi: async v => { await v.skrij(); for (let i = 0; i < 4; i++) await resi(v); } },
  { rece: 'Pazi! Napačen odgovor vzame srček. Tvoj ljubljenček je za hip omotičen in ne more streljati.',
    naredi: async v => {
      await resi(v, { narobe: true });
      await v.pokazi('#ngKeys'); await v.sleep(1800); await v.skrij();
      await resi(v);
    } },
  { rece: 'Zgoraj vidiš, koliko zdravja ima še nagajivec, koliko srčkov ima ekipa in koliko sekund je še ostalo.',
    naredi: async v => { await v.pokazi('.ng-hud'); await v.sleep(4500); await v.skrij(); await resi(v); } },
  { rece: 'Včasih dobiš račun, ki ti še dela težave. Če ga rešiš pravilno, je to dvojni strel!',
    naredi: async v => {
      // vsak tretji račun je iz šibkih
      for (let i = 0; i < 3 && !(await v.loc('#ngTag').textContent()).includes('težji'); i++) await resi(v);
      await v.pokazi('#ngTag'); await v.sleep(1500); await v.skrij();
      await resi(v);
    } },
  { rece: 'Na računalniku lahko pišeš kar s tipkovnico in odgovor potrdiš s tipko Enter.',
    naredi: async v => { await hitro(v, false); for (let i = 0; i < 4; i++) await tipkaj(v); } },
  { rece: 'Hitro, samo še nekaj sekund!',
    naredi: async v => {
      // do konca naj ostane približno 9 sekund
      const ostane = await v.page.evaluate(() => +document.getElementById('ngTime').textContent);
      if (ostane > 10) { const ms = (ostane - 9) * 1000; N.preskoci(ms); await v.page.clock.runFor(ms); }
      await v.pokazi('#ngTime'); await tipkaj(v); await v.skrij();
    } },
  { rece: 'Zmaga! Vsak v ekipi dobi tri priboljške za svojega ljubljenčka.',
    naredi: async v => {
      N.zmaga();
      for (let i = 0; i < 6 && !(await konec(v)); i++) await tipkaj(v);
      await v.loc('#ngTreat').waitFor({ timeout: 10000 });
      await obStrani(v, false);
      await v.sleep(800); await v.pokazi('#ngTreat');
    } },
  { rece: 'Ko zmagate, je naslednji nagajivec močnejši. Zvezdice nad njim kažejo, kako močan je. Če izgubite, je naslednji spet lažji.',
    naredi: async v => { await v.skrij(); await v.pokazi('#ngOverlay .ng-stage'); } },
  { rece: 'Za nov boj klikni Sem pripravljen. Kdor je ustvaril boj, klikne Še enkrat.',
    naredi: async v => {
      await v.skrij();
      await v.page.waitForFunction(() => /Pripravljeni/.test(document.getElementById('ngResAct')?.textContent || ''), null, { timeout: 8000 }).catch(() => {});
      await v.pokazi('#ngResAct .ng-wait'); await v.sleep(2600);
      await v.pokazi('#ngAgain');
    } },
  { rece: 'Vse nagajivce, ki si jih premagal, vidiš na začetnem zaslonu igre. Koliko jih boš zbral ti?',
    naredi: async v => {
      await v.skrij(); await v.klikni('#ngOut');
      await v.page.evaluate(() => { document.getElementById('nagajivecArea').style.zoom = ''; });
      await v.sleep(800);
      await v.pokazi('.ng-trophies');
    },
    premor: 1200 }
];

export { koraki };
await zazeni(import.meta, '06-nagajivec', koraki, { odgovori: N.odgovori, prijavljen: true, ura: '2026-11-03T09:30:00+01:00' });
