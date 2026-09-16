# Brihta — MAT

Vaja poštevanke za osnovno šolo. Živo na
**https://brihta.github.io/matematika/**

## Povezave za učitelje (prednastavitve)

Namesto da učenci sami odpirajo nastavitve, jim lahko daš povezavo, ki se
odpre točno na tisto, kar danes vadite. Nastavitve se ob tem tudi shranijo,
zato vaja ostane enaka tudi po osvežitvi strani.

| Kaj želim | Povezava |
|---|---|
| Samo poštevanka 7, množenje | `.../matematika/?p=7&op=x` |
| Poštevanke 3, 4 in 6, deljenje | `.../matematika/?p=3,4,6&op=d` |
| Vse poštevanke, × in ÷ | `.../matematika/?p=vse&op=both` |
| Poštevanka 8 na tipkovnici | `.../matematika/?p=8&mode=tipkovnica` |

### Parametri

- **`p`** — poštevanke: ena številka (`7`), več ločenih z vejico (`3,4,6`),
  ali `vse`
- **`op`** — vrsta računa: `x` (množenje), `d` (deljenje), `both` (oboje)
- **`mode`** — način: `kviz`, `tipkovnica` ali `tekmovanje`

Če povezava določa poštevanke ali vrsto računa, se način samodejno preklopi
iz tekmovanja v kviz — tekmovanje namreč vedno uporablja vse poštevanke in
bi prednastavitev preprosto prezrlo.

## Načini

- **Tipkovnica** — učenec vtipka odgovor
- **Kviz** — izbira med štirimi odgovori
- **Tekmovanje** — 60 sekund, vse poštevanke, dnevna lestvica.
  Odprto med 7:00 in 19:00 po slovenskem času. Brez nastavitev — namenoma.

Na širokih zaslonih (nad 900 px) so nastavitve stalno vidne ob strani, zato
jih ni treba odpirati in zapirati. Na tablicah in telefonih ostane zgornja
zložljiva vrstica.

## Učiteljski pregled

Prijava prek gumba profila → **Prijava za učitelje**.

- **Učenci** — vrstica na učenca: odgovori, točnost, najšibkejša poštevanka.
  Razvrščeno tako, da je zgoraj tisti, ki potrebuje pomoč.
- **Poštevanke** — podrobna mreža 10 poštevank × (× in ÷).

Pregled se sam osvežuje vsakih 15 s, dokler je odprt.

## Tehnično

Statična stran (brez build koraka), podatki v Supabase.

- `index.html`, `script.js`, `style.css` — celotna aplikacija
- `postevanka.json` — računi
- `supabase_razred.sql`, `supabase_scores_guard.sql` — migracije za bazo
- `.github/workflows/keepalive.yml` — vsake 3 dni pinga bazo, da je
  Supabase ne ustavi zaradi neaktivnosti (brezplačni paket: 7 dni)

> **Opomba:** GitHub po 60 dneh brez commitov sam onemogoči načrtovane
> workflowe. Po daljših počitnicah preveri zavihek Actions.
