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
  Na lestvici je vsak otrok **samo enkrat**, z najboljšim rezultatom dneva
  (vsi poskusi se še vedno štejejo v statistiko). Prijavljen učenec ne
  vpisuje začetnic — rezultat se shrani pod njegovim uporabniškim imenom.
  Zahteva `supabase_lestvica.sql`.

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
  učenec obvlada, torej ima vsaj 5 odgovorov, vsaj 85 % pravilnih **in**
  vsaj 4 od 5 pravilnih hitreje kot v 3 sekundah. Pravilno, a počasi pomeni
  "še vadi": otrok zna izračunati, ne pa še priklicati na pamet. Tega ni
  mogoče napihniti: 300× poštevanka 10 prinese natanko 1/20. Imenovalec je
  za vse enak, zato je primerjava poštena, otroku pa pove, kaj naj naredi.
  Šteje **ves čas**, tudi kadar je izbrano obdobje "danes" — obvladanje je
  trajno stanje, v enem dnevu pa nihče ne nabere petih odgovorov v vsakem
  predalu.

### Izpis za razred (A4)

Gumb **🖨️ Natisni za razred** v učiteljskem pregledu natisne en list za
izbrani razred in obdobje (danes / zadnja 2 tedna / ves čas). Za vsakega
otroka: pravilno, napačno, način, × ali ÷ in **kako zna posamezno
poštevanko**. Tako se takoj vidi otroka, ki je nabral veliko odgovorov, a
samo pri 1 in 10. Kdor ni vadil, je naštet spodaj v eni vrstici. Če se isto
ime pojavi večkrat (isti otrok z več računi), je zraven drobno izpisano
uporabniško ime. V tiskalnem oknu izberi "Shrani kot PDF", če list želiš
shraniti.

#### Kvadratki poštevank

Šteje se × in ÷ skupaj, **napačni odgovori odštevajo**:

| Kvadratek | Pravilo | Pomen |
|---|---|---|
| ■ črn | pravilni − napačni **vsaj 12** | zna |
| ▣ siv | vse vmes | še vadi |
| □ bel | **manj kot 10** odgovorov, ali napačnih **vsaj toliko** kot pravilnih | ne zna ali ni vadil |

Primeri:

| Odgovori pri poštevanki 7 | Pravilni − napačni | Kvadratek |
|---|---|---|
| 20, od tega 12 pravilnih | 12 − 8 = 4 | ▣ siv |
| 20, od tega 15 pravilnih | 15 − 5 = 10 | ▣ siv |
| 20, od tega 18 pravilnih | 18 − 2 = 16 | ■ črn |
| 12, vsi pravilni | 12 − 0 = 12 | ■ črn |
| 8, vsi pravilni | premalo odgovorov | □ bel |
| 20 ugibanj v kvizu, ~5 pravilnih | 5 − 15 = −10 | □ bel |

**Zakaj te številke.** Vseh računov je 200 (10 × in 10 ÷ na poštevanko). V
kvizu in na tipkovnici se premešajo kot karte in se ne ponavljajo, dokler
otrok ne gre skozi vse: 200 odgovorov = vsak račun natanko enkrat = 20 na
poštevanko. Za črn kvadratek je pri takem krogu treba vsaj 16 pravilnih
(80 %). Tekmovanje premeša vsako minuto znova, zato je tam 20 le povprečje;
meja za bel kvadratek (10) je zato pol kroga, ne cel, da pošten otrok ne
pade vanj po naključju.

Bel kvadratek namenoma združuje "ni vadil" in "ne zna": na papirju je oboje
isti signal — tu je treba pomagati. Kateri od obeh je, povesta ✔ in ✘ v isti
vrstici. Meji sta konstanti `PRINT_KNOWS` in `PRINT_MIN` v `script.js`.

Najbolj zanesljiv je izpis **Danes** takoj po uri: v daljšem obdobju lahko
otrok, ki težke poštevanke izklaplja, deset odgovorov pri njih vseeno nabere
v tekmovanju.

### Seznam uporabniških imen

Gumb **📋 Seznam uporabniških imen** natisne ime in uporabniško ime vseh
učencev izbranega razreda, tudi tistih, ki še niso vadili. Brez izbranega
razreda gre vsak razred na svojo stran. **Gesel na seznamu ni** in jih ne
more biti: v bazi so shranjena samo zakodirana, ne v berljivi obliki.
Pozabljeno geslo ponastaviš s klikom na ime učenca v pregledu.

### Premik v drug razred

Klikni ime učenca → **Razred** → izberi razred → **Premakni**. Za otroka, ki
je ob prijavi izbral napačen razred ali je zamenjal oddelek. Razred se
shrani kot letnik vpisa (glej `supabase_generacije.sql`), zato otrok
vsako poletje še vedno sam napreduje. Zahteva `supabase_premakni_razred.sql`
(zaženi enkrat).

### Podvojeni in opuščeni računi

Klikni ime učenca v pregledu. Na dnu okna:

- **🔗 Združi** — za otroka, ki si je (po pozabljenem geslu) naredil nov
  račun. Izberi račun, ki ga otrok **zdaj uporablja**; vadba iz odprtega
  računa se prenese vanj, odprti račun se izbriše. Računi z istim imenom so
  na vrhu seznama (★), zraven je število odgovorov — obdrži tistega, ki ga
  otrok res uporablja. Nič se ne izgubi, Brihtometer pa končno pokaže celega
  otroka.
- **🗑️ Izbriši račun** — za račun, ki ga nihče ne rabi. Vadba se izgubi,
  zato je treba za potrditev vpisati uporabniško ime.

Oboje zahteva `supabase_zdruzi_izbrisi.sql` (zaženi enkrat).

## Tehnično

Statična stran (brez build koraka), podatki v Supabase.

- `index.html`, `script.js`, `style.css` — celotna aplikacija
- `postevanka.json` — računi
- `supabase_razred.sql`, `supabase_scores_guard.sql`, `supabase_nacini.sql`,
  `supabase_hitrost.sql`, `supabase_zdruzi_izbrisi.sql`,
  `supabase_premakni_razred.sql` — migracije za bazo
- `.github/workflows/keepalive.yml` — vsake 3 dni pinga bazo, da je
  Supabase ne ustavi zaradi neaktivnosti (brezplačni paket: 7 dni)

> **Opomba:** GitHub po 60 dneh brez commitov sam onemogoči načrtovane
> workflowe. Po daljših počitnicah preveri zavihek Actions.
