/* Snemalnik: odpre stran v predstavitvenem načinu, posname zaslon (slike iz
   brskalnika), za vsak korak posname glas Tina in na koncu vse sestavi v mp4.
   Poglavje je seznam korakov { rece, naredi }: korak traja, dokler ne
   konča glas in dejanje. Če je stavek posnet v snemalnici (glas/), se
   uporabi lasten posnetek namesto Tine. */
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installDemo, SITE, DEMO_STUDENT } from './demo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GLAS = join(HERE, 'glas');   // lastni posnetki: glas/<poglavje>/<korak>.webm|m4a
const W = 1280, H = 720, SCALE = 1.5;     // slika 1920 × 1080
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Kako naj Tina izgovori besede, ki jih bere narobe. Velja samo za glas,
   podnapis ostane zapisan pravilno. Izbrano po poslušanju
   izgovorjava-vzorci.m4a. */
const IZGOVORJAVA = {
  okence: 'okənce',
  zmotiš: 'zmótiš',
  iPada: 'ajpeda',
  sovica: 'sôvica',
  sovico: 'sôvico',
  oči: 'očí',
  obleci: 'obléci',
  zgodi: 'zgodí',
  poskoči: 'poskóči',
  kako: 'kakó',
  jesen: 'jesén',
  poštevanke: 'poštévanke',
  poštevanko: 'poštévanko',
  Dobrodošlica: 'dobrodôšlica',
  lesen: 'lesén',
  pristoji: 'pristojí',
  poštevanka: 'poštévanka',
  vaditi: 'váditi',
  šteje: 'štêje',
  zeleno: 'zelêno',
  reši: 'réši',
  preskočimo: 'preskóčimo',
  izšlo: 'izšló',
  prijateljem: 'prijáteljem',
  naslednjič: 'naslédnjič'
};
// velja tudi za besedo z veliko začetnico na začetku stavka
const izgovori = text => text.replace(/[\p{L}]+/gu, w => IZGOVORJAVA[w] ?? IZGOVORJAVA[w.toLowerCase()] ?? w);

const trajanje = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
  '-of', 'csv=p=0', f]).toString()) * 1000;

/* Lasten posnetek stavka iz snemalnice, če obstaja. */
export const lastenPosnetek = (ime, i) => ['webm', 'm4a']
  .map(e => join(GLAS, ime, `${String(i).padStart(2, '0')}.${e}`)).find(existsSync) || null;

/* Kje v lastnem posnetku je govor. Glasni deli so ločeni s tišino; kratek
   pok čisto na začetku (preslednica ob začetku snemanja) in kratek klik tik
   pred koncem (preslednica, ki snemanje ustavi) nista govor. */
export function govor(f) {
  const dur = trajanje(f) / 1000;
  // silencedetect piše v stderr
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'silencedetect=n=-40dB:d=0.08', '-f', 'null', '-'])
    .stderr.toString();
  const glasno = [];
  let t = 0, tiho = false;
  for (const [, k, v] of log.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    if (k === 'start') { if (+v > t) glasno.push([t, +v]); tiho = true; } else { t = +v; tiho = false; }
  }
  if (!tiho && t < dur) glasno.push([t, dur]);
  const dolzina = s => s[1] - s[0];
  // rob okoli govora, a nikoli čez odrezan klik
  let od = 0, do_ = dur;
  if (glasno.length > 1 && glasno[0][0] < 0.05 && dolzina(glasno[0]) < 0.3) od = glasno.shift()[1] + 0.02;
  if (glasno.length > 1 && dolzina(glasno.at(-1)) < 0.25 && glasno.at(-1)[0] > dur - 0.9) do_ = glasno.pop()[0] - 0.02;
  if (!glasno.length) return [0, dur];
  return [Math.max(od, glasno[0][0] - 0.08), Math.min(do_, glasno.at(-1)[1] + 0.12)];
}

function narrate(text, file, lasten) {
  if (lasten) {
    // samo govor (brez tišine in klikov na robovih), izenačena glasnost
    const [od, do_] = govor(lasten);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', lasten, '-af',
      `atrim=${od.toFixed(3)}:${do_.toFixed(3)},asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11`,
      '-ar', '48000', '-ac', '1', file + '.wav']);
    return trajanje(file + '.wav');
  }
  // Tina malo počasneje kot privzeto, da otroci sledijo
  execFileSync('say', ['-v', 'Tina', '-r', '165', '-o', file + '.aiff', izgovori(text)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file + '.aiff', '-ar', '48000', '-ac', '1', file + '.wav']);
  return trajanje(file + '.wav');
}

/* Poglavje se posname samo, če je zagnano neposredno (node 01-prijava.mjs);
   snemalnica ga le uvozi, da prebere stavke. */
export async function zazeni(meta, ime, koraki, opts) {
  if (!process.argv[1] || pathToFileURL(process.argv[1]).href !== meta.url) return;
  console.log(await posnemi(ime, koraki, opts));
}

/* odgovori: izmišljeni odgovori baze za to poglavje (gl. demo.mjs);
   prijavljen: začni že prijavljen kot DEMO_STUDENT.
   ura: čas v brskalniku (npr. tekmovanje je odprto samo podnevi). */
export async function posnemi(ime, koraki, { odpri = '/', odgovori = {}, prijavljen = false, ura = null } = {}) {
  // slike so začasne; mapa Shared_documents se sinhronizira in ne mara tisočev datotek
  const work = join(tmpdir(), 'brihta-video', ime);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(join(work, 'f'), { recursive: true });

  const lastni = koraki.map((k, i) => k.rece ? lastenPosnetek(ime, i) : null);
  const n = koraki.filter(k => k.rece).length, nl = lastni.filter(Boolean).length;
  if (nl && nl < n) console.warn(`Pozor: lasten glas za ${nl}/${n} stavkov, ostale bere Tina.`);
  const glasovi = koraki.map((k, i) => k.rece ? narrate(k.rece, join(work, `g${i}`), lastni[i]) : 0);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await installDemo(page, { answers: odgovori });
  if (ura) await page.clock.install({ time: new Date(ura) });
  if (prijavljen) await page.addInitScript(p => {
    if (!localStorage.getItem('brihta_profile_v1')) localStorage.setItem('brihta_profile_v1', p);
  }, JSON.stringify({ ...DEMO_STUDENT, razred: '3A' }));
  await page.addInitScript({ content: readFileSync(join(HERE, 'overlay.js'), 'utf8') });
  await page.goto(SITE + odpri);
  await page.waitForTimeout(1200);

  /* Slike zaslona prihajajo samo ob spremembi; čas vsake shranimo in iz
     razmikov sestavimo video. */
  const frames = [];
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', async f => {
    const n = frames.length;
    writeFileSync(join(work, 'f', `${String(n).padStart(6, '0')}.jpg`), Buffer.from(f.data, 'base64'));
    frames.push(f.metadata.timestamp);
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92,
    maxWidth: W * SCALE, maxHeight: H * SCALE });
  /* Kazalec, ki stoji pri miru, ne povzroči nove slike: drobna
     nevidna animacija poskrbi za stalen tok. */
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:2147483647;animation:vTick 1s linear infinite';
    const s = document.createElement('style');
    s.textContent = '@keyframes vTick{to{transform:translateX(2px)}}';
    document.head.appendChild(s); document.body.appendChild(d);
  });
  await sleep(300);

  /* "ljub|.sel" in "lik|.sel" sta elementa v oknu z ljubljenčkom ali likom (iframe). */
  const OKNA = { ljub: 'Moj ljubljenček', lik: 'Moj lik' };
  const loc = sel => {
    const m = /^(\w+)\|(.*)$/.exec(sel);
    return m ? page.frameLocator(`iframe[title="${OKNA[m[1]]}"]`).locator(m[2]).first() : page.locator(sel).first();
  };
  async function poisci(sel) {
    const el = loc(sel);
    await el.waitFor();
    // počasi podrsaj do elementa, če ni na zaslonu
    if (await el.evaluate(e => { const r = e.getBoundingClientRect();
        return r.top < 60 || r.bottom > (e.ownerDocument.defaultView.innerHeight - 110); })) {
      await el.evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await sleep(1100);
    }
    return el.boundingBox();
  }

  const v = {
    page,
    loc,
    async pokazi(sel) {
      const r = await poisci(sel);
      await page.evaluate(r => __v.ring(r), r);
      return r;
    },
    async skrij() { await page.evaluate(() => __v.ring(null)); },
    async premakni(sel) {
      const r = await poisci(sel);
      await page.evaluate(([x, y]) => __v.cursor(x, y), [r.x + r.width / 2, r.y + r.height / 2]);
      await sleep(1000);
      return r;
    },
    async klikni(sel, { obroba = true } = {}) {
      const r = await v.premakni(sel);
      if (obroba) { await page.evaluate(r => __v.ring(r), r); await sleep(700); }
      await page.evaluate(() => __v.press(true)); await sleep(150);
      await loc(sel).click({ force: true });
      await page.evaluate(() => __v.press(false));
      await v.skrij();
    },
    async tipkaj(sel, text) {
      await v.premakni(sel);
      await loc(sel).click();
      await loc(sel).pressSequentially(text, { delay: 260 });
    },
    sleep
  };

  const t0 = Date.now();
  const casi = [];   // kdaj se začne glas vsakega koraka (ms od začetka)
  for (const [i, k] of koraki.entries()) {
    casi.push(Date.now() - t0);
    if (k.rece) await page.evaluate(t => __v.caption(t), k.napis || k.rece);
    const glas = sleep(glasovi[i]);
    if (k.naredi) await k.naredi(v);
    await glas;
    await sleep(k.premor ?? 600);
  }
  await page.evaluate(() => __v.caption(''));
  await sleep(1200);
  await cdp.send('Page.stopScreencast');
  await browser.close();

  /* Slike → video (vsaka slika traja do naslednje) */
  const start = frames[0];
  let list = '';
  frames.forEach((t, n) => {
    const next = frames[n + 1] ?? t + 0.04;
    list += `file 'f/${String(n).padStart(6, '0')}.jpg'\nduration ${(next - t).toFixed(4)}\n`;
  });
  list += `file 'f/${String(frames.length - 1).padStart(6, '0')}.jpg'\n`;
  writeFileSync(join(work, 'slike.txt'), list);

  /* Glasovi na svoja mesta. Posnetek slik se začne malo pred t0. */
  const zamik = (t0 / 1000 - start) * 1000;
  const vhodi = [], filtri = [];
  koraki.forEach((k, i) => {
    if (!k.rece) return;
    const n = vhodi.length / 2;
    vhodi.push('-i', join(work, `g${i}.wav`));
    const d = Math.max(0, Math.round(casi[i] + zamik));
    filtri.push(`[${n + 1}:a]adelay=${d}|${d}[a${n}]`);
  });
  const nA = vhodi.length / 2;
  const mix = filtri.join(';') + ';' + Array.from({ length: nA }, (_, n) => `[a${n}]`).join('')
    + `amix=inputs=${nA}:normalize=0,apad[a]`;

  const izhod = join(HERE, `${ime}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', join(work, 'slike.txt'), ...vhodi,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]',
    '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', izhod]);
  return izhod;
}
