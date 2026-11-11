# Brihta-MAT (matematika/)

Glavna Ninova stran: vaja poštevanke in računov do 20 za osnovno šolo.
Živo na https://brihta.github.io/matematika/. Nino je učitelj; piši mu v slovenščini.

**Kazalo vseh Ninovih projektov:** `KAZALO.md` v tem repozitoriju.

## Zakaj je ta repozitorij poseben
Tu je **baza učencev** (Supabase projekt `ldczgbajbarlgwqzcggh`): tabele `students`,
`teachers`, statistika in seje. Iste račune uporabljajo tudi druge Brihta strani
(`Brihta/sola`: kvizi, Moja besedila). Sprememba tabel `students`/`teachers` vpliva
na vse te strani, zato bodi previden.

## Datoteke
- `index.html`, `script.js`, `style.css`: glavna aplikacija (poštevanka, Do 20, tekmovanje, bitka).
- `supabase_*.sql`: vsa logika baze. Vsako datoteko požene Nino v Supabase → SQL Editor.
- `album.js`, `lik.html`, `supabase_album.sql`: gamifikacija (album, cekini, lik, sezone).
  Odločitve so v `gamifikacija/README.md`, testi SQL v `gamifikacija/test-album.mjs` (PGlite).
- `pet.js`, `pet-art.js`, `ljubljencek.html`, `supabase_ljubljencek.sql`: ljubljenček (nagrada pri Do 20).
- `nagajivec.js`, `supabase_nagajivec.sql`: »Odženi nagajivce!« (skupinski boj pri Do 20).
- `svet.js`: »Moj svet«, en gumb v zgornji vrstici z zavihkoma Moj lik in Ljubljenček.
- `navodila.html`, `listki.html`, `plakat.html`: gradiva za učitelje in tisk.

## Pravila in odločitve
- Nagrade izhajajo iz pravega učenja in se računajo **na strežniku** (učenec je le UUID).
- **Do 20 ne daje cekinov.** Do 20 ima svoj ljubljenček in priboljške; statistika gre v `do20_stats`, nikoli v `stats`.
- Sklopi Do 20 so samo po obsegu: `d10`, `b20`, `pr`. Nino je strateške skupine (prijatelji 10, dvojčki) zavrnil.
- Barve pri Do 20 so svetle in naravne (krem, pesek, limeta, list, gozd). Nobene temne ali neonsko zelene.
- Tekmovanja so odprta 7:00–19:00 (`COMP_CLOSE_HOUR` v script.js).
- Testna učenca sta `nik7a` in `lar4` (Ninova otroka). Pri statistiki ju loči od pravih učencev.
- Računi učencev: prikazno ime je samo ime. Začetnico priimka dodaš le, ko imata dva v razredu isto ime.
  Geslo sta 2 živali, vsaka dvakrat (AABB). Listki z gesli gredo v PDF na Namizje, **nikoli v repozitorij** (je javen).
- Logotip (sova) je kopiran v matematika, sola, anglescina, naravoslovje in test. Sprememba logotipa mora iti v vse.
- `manifest.json` ima namenoma `display: "browser"`.

## Objava
- Stran: commit in push na `main` → GitHub Pages (~1 min). Nino običajno potrdi objavo (»objavi«).
- SQL: Ninu ga daj v odložišče (`LANG=en_US.UTF-8 pbcopy`, brez LANG se šumniki pokvarijo).
  Ko ni za Macom (telefon, šola, claude.ai/code), mu ga pokaži v ```sql bloku.
- Predogled: `.claude/launch.json` → »brihta« (port 8766).
