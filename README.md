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

Na širokih zaslonih (nad 900 px) sta **način** in **vrsta računa** stalno
vidna v zgornji vrstici, **poštevanke** pa so v levem stolpcu, vsaka v svoji
vrsti. Ničesar ni treba odpirati ali zapirati. Na tablicah in telefonih
ostane zgornja zložljiva vrstica.

## Učiteljski računi

Prijava prek gumba profila → **Prijava za učitelje**, z **e-naslovom in geslom**.

Kolegi si račun ustvarijo sami (*Nimaš računa? Ustvari ga*), a potrebujejo
**šolsko kodo**, ki jo poveš samo zaposlenim. Račun je po registraciji
**neaktiven**, dokler ga ročno ne potrdiš:

```sql
-- kdo čaka
select email, username, created_at from teachers where approved = false;
-- potrditev
update teachers set approved = true where lower(email) = 'kolega@sola.si';
```

Dvojna zaščita je namerna: učiteljski račun vidi rezultate **vseh** učencev
šole in lahko ponastavi geslo kateremukoli učencu, stran pa je javna.
Brez tega bi si lahko učiteljski dostop ustvaril vsak učenec.

Vsi učitelji vidijo vse razrede — za medgeneracijsko primerjavo.

## Učiteljski pregled

- **Učenci** — vrstica na učenca: odgovori, Brihtometer, najšibkejša
  poštevanka. Razvrščeno po abecedi.
- **Poštevanke** — podrobna mreža 10 poštevank × (× in ÷).

Pregled se sam osvežuje vsakih 15 s, dokler je odprt.

### Zakaj ne samo "koliko odgovorov"

Golo število odgovorov je zavajajoče: učenci ga med sabo primerjajo, čeprav
je lahko sestavljeno iz napačnih odgovorov ali pa samo iz poštevank 10 in 5.
Zato vrstica pove troje:

- **`63 / ✔34`** — koliko odgovorov skupaj in koliko od tega pravilnih.
  Napačni se nikjer ne seštevajo v dosežek, razlika med številkama pa takoj
  pokaže otroka, ki samo ugiba (številka ✔ se ob tem obarva rdeče).
- **⌨️ 🎯 🏆** — koliko pravilnih je prišlo iz katerega načina. Kviz je izbira
  med štirimi odgovori, zato ima ugibanje 25 % možnosti; 300 pravilnih v
  kvizu ni isto kot 300 na tipkovnici ali v tekmovanju. Vsota ikon je vedno
  enaka številki ✔.
- **Brihtometer** — koliko od 20 predalov (10 poštevank × dve operaciji)
  učenec obvlada, torej ima vsaj 5 odgovorov in vsaj 85 % pravilnih. Tega ni
  mogoče napihniti: 300× poštevanka 10 prinese natanko 1/20. Imenovalec je
  za vse enak, zato je primerjava poštena, otroku pa pove, kaj naj naredi.
  Šteje **ves čas**, tudi kadar je izbrano obdobje "danes" — obvladanje je
  trajno stanje, v enem dnevu pa nihče ne nabere petih odgovorov v vsakem
  predalu.

## Tehnično

Statična stran (brez build koraka), podatki v Supabase.

- `index.html`, `script.js`, `style.css` — celotna aplikacija
- `postevanka.json` — računi
- `supabase_razred.sql`, `supabase_scores_guard.sql`, `supabase_nacini.sql`
  — migracije za bazo
- `.github/workflows/keepalive.yml` — vsake 3 dni pinga bazo, da je
  Supabase ne ustavi zaradi neaktivnosti (brezplačni paket: 7 dni)

> **Opomba:** GitHub po 60 dneh brez commitov sam onemogoči načrtovane
> workflowe. Po daljših počitnicah preveri zavihek Actions.
