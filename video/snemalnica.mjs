/* Snemalnica: stran za snemanje lastne pripovedi.
   Zaženi: node snemalnica.mjs → odpri http://localhost:5199 v Chromu ali Safariju.
   Stavke prebere iz poglavij (0*.mjs), vsak posnetek shrani v
   glas/<poglavje>/<korak>.webm (ali .m4a v Safariju). snemalnik.mjs jih
   potem uporabi namesto Tine. */
import { createServer } from 'node:http';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLAS, lastenPosnetek } from './snemalnik.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 5199;

const poglavja = [];
for (const f of readdirSync(HERE).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort()) {
  const { koraki } = await import(`./${f}`);
  poglavja.push({ ime: f.replace(/\.mjs$/, ''), koraki });
}

const stavki = () => poglavja.map(p => ({
  ime: p.ime,
  stavki: p.koraki.map((k, i) => k.rece ? { i, besedilo: k.rece, posneto: !!lastenPosnetek(p.ime, i) } : null).filter(Boolean)
}));
const veljaven = (ime, i) => poglavja.some(p => p.ime === ime && p.koraki[i] && p.koraki[i].rece);

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const ime = url.searchParams.get('ime'), i = Number(url.searchParams.get('i'));
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(readFileSync(join(HERE, 'snemalnica.html')));
  }
  if (url.pathname === '/stavki') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(stavki()));
  }
  if (url.pathname === '/posnetek' && veljaven(ime, i)) {
    if (req.method === 'GET') {
      const f = lastenPosnetek(ime, i);
      if (!f) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': f.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm' });
      return res.end(readFileSync(f));
    }
    if (req.method === 'POST') {
      const kosi = [];
      req.on('data', c => kosi.push(c));
      req.on('end', () => {
        const ext = (req.headers['content-type'] || '').includes('mp4') ? 'm4a' : 'webm';
        const dir = join(GLAS, ime), osnova = join(dir, String(i).padStart(2, '0'));
        mkdirSync(dir, { recursive: true });
        // nov posnetek zamenja starega, tudi če je v drugi obliki
        for (const e of ['webm', 'm4a']) rmSync(`${osnova}.${e}`, { force: true });
        writeFileSync(`${osnova}.${ext}`, Buffer.concat(kosi));
        res.writeHead(204); res.end();
      });
      return;
    }
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Snemalnica: http://localhost:${PORT}`));
