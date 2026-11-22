# Kazalo Ninovih projektov (Brihta)

Ko Nino reče »poglej kazalo« ali omeni program po imenu, poišči ga tukaj.
Nato preberi CLAUDE.md tega programa, če ga ima.

Vse strani so na GitHub Pages: `https://brihta.github.io/<repozitorij>/`.
Lokalno so na Macu v `~/Documents/Shared_documents/GitHub/<mapa>`.

## Glavno (baza učencev)
| Program | Spletni naslov | Repozitorij (mapa) | Znanje |
|---|---|---|---|
| **Brihta-MAT**: poštevanka, Do 20, album, ljubljenček, nagajivci | brihta.github.io/matematika | Brihta/matematika (`matematika`) | `matematika/CLAUDE.md` |
| **Brihta Šola**: portal, gradiva, kvizi | brihta.github.io/sola | Brihta/sola (`sola`) | `sola/CLAUDE.md` |
| **Moja besedila**: pisanje in popravljanje besedil | brihta.github.io/sola/pisanje-besedil | Brihta/sola (`sola/pisanje-besedil`) | `sola/pisanje-besedil/CLAUDE.md` |

Vsi trije uporabljajo isto bazo Supabase (`ldczgbajbarlgwqzcggh`) in iste račune učencev.

## Druge šolske strani
| Program | Spletni naslov | Repozitorij (mapa) |
|---|---|---|
| Brihta-ANG (angleščina) | brihta.github.io/anglescina | Brihta/anglescina (`anglescina`) |
| Brihta (naravoslovje) | brihta.github.io/naravoslovje | Brihta/naravoslovje (`naravoslovje`) |
| Domača stran OŠ Šempeter | brihta.github.io/domaca-stran | Brihta/domaca-stran (`group_maker`) |
| Svet Lego junakov | brihta.github.io/lego | Brihta/lego (`lego`) |
| Potapljanje ladjic 2.0 | brihta.github.io/potapljanje-ladjic | Brihta/potapljanje-ladjic (`potapljanje-ladjic`) |
| Svetovni popotniki (kviz zastav, RAP) | brihta.github.io/svetovni-popotniki | Brihta/svetovni-popotniki (`svetovni-popotniki`) |
| Tedenska hišna opravila | brihta.github.io/tedenska_opravila | Brihta/tedenska_opravila (`tedenska_opravila`) |
| Preizkusna stran | brihta.github.io/test | Brihta/test (`test`) |

## Samo na Macu (ni na GitHubu)
- **Tajnik**: priprave ur (`~/Documents/Shared_documents/Tajnik`, ima svoj CLAUDE.md).
- **Kvizi** v datotekah: `~/Documents/Brihta-kvizi/` (z odgovori, zato niso v javnem repozitoriju).
- **Video navodila** (snemalnica): `~/Documents/Brihta-video/` (README, skill `video-navodila`). Nino reče »Pripravi video: …«,
  Claude posname zaslon, Nino samo glas (⬇ Izvozi glas), nato »sestavi«.

V oblaku (claude.ai/code) te mape niso dostopne.

## Agenti: Claudio in njegova ekipa
**Claudio** (»Klavdijo, moja desna roka«) je Claude, s katerim Nino govori: na Macu v Code v mapi `Desna-roka`
(`~/Documents/Desna-roka`, CLAUDE.md in ZAPISKI.md), sicer v kateremkoli klepetu. Dela po pravilih v CLAUDE.md posameznega programa.
Ninovo pripeto kazalo na claude.ai (artefakt »Moji projekti«) ima isti seznam agentov; ob spremembi posodobi oboje. Pod njim so načrtovana opravila (agenti), ki tečejo sama,
v oblaku, in ob koncu Ninu pošljejo obvestilo na telefon. Urejaš jih v aplikaciji Claude pod načrtovanimi opravili.

| Agent | Kdaj | Kaj dela | Potrebuje | Nikoli |
|---|---|---|---|---|
| **Max** (»Claudio › Max (Fleksi English)«) | sobota 8.49 | Pripravi ponedeljkovo uro Fleksi angleščine (5/3): Teaching, Our lessons, test spellinga, vse SKRITO; iz kljukic »Done in class« prenese neopravljeno | Mac prižgan (bere `~/Brihta-max/kljukice.json`), repo Brihta/sola | ne objavlja, ne bere `~/.config/brihta-sola`, ne zapisuje imen in točk |
| **Dnevni planer** | delavniki 4.47 | Dnevni načrt (nadomeščanja, obvestila, ure dneva) kot stran + mail | Gmail, Drive, koledar, Mac (priprave RAP) | ne ureja datotek, ne odgovarja na maile |
| **Tedenski EVIO vpisi** | petek 15.10 | Osnutek vpisov v EVIO za naslednji teden (txt v OneDrive) | Mac (OneDrive), Gmail, repo Brihta/sola (branje) | ne piše drugam, ne pošilja mailov |

Pravila za objavo gradiva iz katerega koli klepeta (»objavi …«, »skrij …«) so v `sola/CLAUDE.md`
(razdelek »Objava gradiva brez prijave«). Tedenski postopek Fleksi angleščine: `sola/CLAUDE.md` (Fleksi Spelling,
Teaching in Our lessons, Assessment, Max).

## Kako Nino dela
- Doma na Macu dela v aplikaciji Claude → zavihek Code. S telefona ali iz šole dela v claude.ai/code
  (izbere repozitorij); tam ni Macovega odložišča, zato SQL vedno pokaži v ```sql bloku.
- Novi programi dobijo svojo mapo s CLAUDE.md in vrstico v tem kazalu.
- Osebni projekti (vabilo, Green Street …) so v Ninovem pripetem kazalu na claude.ai, ne tukaj.
