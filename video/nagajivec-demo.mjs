/* Izmišljen strežnik za Odženi nagajivce!: odgovarja kot boss_* v
   supabase_nagajivec.sql (z novostmi, v2), a samo v spominu. Prijatelji se
   v čakalnico pridružijo sami in glasujejo, med bojem streljajo, dokler
   zmaga() ne pošlje zadnjih strelov. Strežniška ura je prava ura + preskok
   (preskoci), da gre skupaj z uro v brskalniku. */
const ME = 'p-jaz';
const PET = { species: 'sova', name: 'Zvezdica', body: 'nebo', belly: 'krema', eyes: 'modre', pattern: 'pike',
  equip: { glava: 'pentlja' }, stage: 'mlad' };
const PRIJATELJI = [
  { id: 'p-sova', name: 'sova3', pride: 2500, glas: 'sluzko', level: 'd10', hitrost: 0.12,
    pet: { species: 'zmaj', name: 'Iskra', body: 'med', belly: 'breskev', eyes: 'zelene', pattern: 'proge', equip: {}, stage: 'odrasel' } },
  { id: 'p-medo', name: 'medo8', pride: 4500, glas: 'bahac', level: 'b20', hitrost: 0.09,
    pet: { species: 'lisica', name: 'Rjavko', body: 'koral', belly: 'krema', eyes: 'rjave', pattern: 'brez', equip: {}, stage: 'mlad' } },
  { id: 'p-ris', name: 'ris5', pride: 6500, glas: 'sluzko', level: 'd10', hitrost: 0.07,
    pet: { species: 'macka', name: 'Muri', body: 'oblak', belly: 'sivka', eyes: 'zvezde', pattern: 'pike', equip: {}, stage: 'mladicek' } }
];
const TARGET = { d10: 8, b20: 7, pr: 6 };
const HEARTS = 3;

export function nagajivecDemo(jaz) {
  let skok = 0;
  const now = () => Date.now() + skok;
  let b = null;
  let zmaga = false, zadnji = false;   // zmaga(): prijatelji dokončajo; zadnji: klient je že videl zadnje strele
  let jabolka = 5;                     // današnji priboljški

  const prisotni = t => PRIJATELJI.filter(p => t - b.ustvarjena >= p.pride);
  const zadetki = (p, t) => {
    if (b.status === 'lobby' || t < b.starts_at) return 0;
    return Math.floor((Math.min(t, b.ends_at) - b.starts_at) / 1000 * p.hitrost);
  };
  const state = () => {
    const t = now();
    const ekipa = b.status === 'lobby' ? prisotni(t) : b.ekipa;
    // pred zmago() prijatelji nikoli ne podrejo nagajivca sami
    const cnt = ekipa.map(p => zadetki(p, t));
    const meja = Math.max(0, b.hp - b.moj.dmg - 3);
    while (cnt.reduce((a, c) => a + c, 0) > meja) cnt[cnt.indexOf(Math.max(...cnt))]--;
    const fr = ekipa.map((p, i) => {
      const c = zadnji ? p.konec : cnt[i];
      return { id: p.id, name: p.name, pet: p.pet, level: p.level, vote: p.glas, levels: null, target: TARGET[p.level],
        weak: null, late: false, correct: c, wrong: 0, dmg: c, ready: b.status === 'finished' && t - b.konec > 2500 };
    });
    const jaz_ = { id: ME, name: jaz.username, pet: PET, level: b.level, vote: b.glas, levels: ['d10', 'b20'],
      target: TARGET[b.level], weak: [[3, 14, 'p'], [2, 15, 'p'], [4, 13, 'p']], late: false,
      correct: b.moj.correct, wrong: b.moj.wrong, dmg: b.moj.dmg, ready: false };
    return { now: t, code: b.code, status: b.status, round: b.round, boss: b.boss, hp: b.hp, hearts: b.hearts,
      result: b.result, v2: true, stage: b.stage, starts_at: b.starts_at, ends_at: b.ends_at,
      host: ME, me: ME, players: [jaz_, ...fr] };
  };

  return {
    preskoci(ms) { skok += ms; },
    zmaga() { zmaga = true; },
    odgovori: {
      boss_access: () => true,
      pet_state: () => ({
        season: { id: 1, name: 'Jesen', from: '2026-10-12', to: '2026-12-31' },
        species: ['zmaj', 'lisica', 'sova', 'macka'], count: 3, stage: 'mlad', unlocks: [],
        pet: PET, treats: { balance: 24, today: jabolka, cap: 20 }, shop: [], owned: ['pentlja'], companion: null,
        milestones: [], collection: []
      }),
      boss_list_open: () => [{ code: '5203', status: 'lobby', players: ['zajc2', 'lev1'] }],
      boss_trophies: () => [{ boss: 'kujavka', level: 'b20', stage: 2, wins: 3 }, { boss: 'sluzko', level: 'b20', stage: 1, wins: 1 }],
      boss_create: () => {
        b = { code: '4721', status: 'lobby', round: 0, boss: null, hp: 0, hearts: 0, result: null, stage: 1,
              starts_at: null, ends_at: null, ustvarjena: now(), glas: null, level: 'b20',
              moj: { correct: 0, wrong: 0, dmg: 0 }, ekipa: [] };
        return { token: '00000000-0000-0000-0000-0000000000bb', state: state() };
      },
      boss_choose: p => {
        if (p.p_vote) b.glas = p.p_vote;
        if (p.p_level) b.level = p.p_level;
        return state();
      },
      boss_start: () => {
        const t = now();
        b.ekipa = prisotni(t);
        const glasovi = {};
        [b.glas, ...b.ekipa.map(p => p.glas)].filter(Boolean).forEach(g => { glasovi[g] = (glasovi[g] || 0) + 1; });
        Object.assign(b, { status: 'running', round: b.round + 1, result: null,
          boss: Object.keys(glasovi).sort((x, y) => glasovi[y] - glasovi[x])[0] || 'sluzko',
          hp: TARGET[b.level] + b.ekipa.reduce((a, p) => a + TARGET[p.level], 0),
          hearts: HEARTS * (b.ekipa.length + 1),
          starts_at: t + 6000, ends_at: t + 66000, moj: { correct: 0, wrong: 0, dmg: 0 } });
        return state();
      },
      boss_sync: p => {
        if (!b) return { error: 'gone' };
        if (p.p_round === b.round && p.p_correct != null)
          b.moj = { correct: p.p_correct, wrong: p.p_wrong, dmg: p.p_dmg ?? p.p_correct };
        if (b.status === 'running' && zmaga) {
          if (!zadnji) {
            // prijatelji dokončajo: skupaj ravno dovolj za zmago, razdeljeno po hitrosti
            const zdaj = state().players.slice(1);
            let manjka = Math.max(0, b.hp - b.moj.dmg);
            b.ekipa.forEach((f, i) => {
              const sedaj = zdaj[i].correct;
              f.konec = i === b.ekipa.length - 1 ? Math.max(sedaj, manjka) : Math.min(sedaj + 1, manjka);
              manjka -= f.konec;
            });
            zadnji = true;
          } else {
            Object.assign(b, { status: 'finished', result: 'win', konec: now() });
            jabolka += 3;
          }
        }
        return state();
      },
      boss_ready: () => state(),
      boss_leave: () => null
    }
  };
}
