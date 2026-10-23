/* Izmišljen strežnik za bitko: odgovarja kot create_battle, battle_sync,
   start_battle in list_open_battles v supabase_bitka*.sql, a samo v spominu.
   Prijatelji se v čakalnico pridružijo sami, med igro pa nabirajo točke.
   Strežniška ura je prava ura + preskok (preskoci), da gre skupaj z uro v
   brskalniku, ko jo snemalnik zavrti naprej. */
const PRIJATELJI = [
  { id: 'p-sova', name: 'sova3', emoji: '🦄', pride: 3000, hitrost: 0.35 },
  { id: 'p-medo', name: 'medo8', emoji: '🐶', pride: 6000, hitrost: 0.25 },
  { id: 'p-ris',  name: 'ris5',  emoji: '🐱', pride: 9000, hitrost: 0.15 }
];
const ME = 'p-jaz';

export function bitkaDemo(jaz) {
  let skok = 0;
  const now = () => Date.now() + skok;
  let b = null;     // { code, status, round, seed, starts_at, ends_at, ustvarjena, moj }

  const tocke = (p, t) => {
    if (!b.starts_at || t < b.starts_at) return { score: 0, correct: 0 };
    const s = (Math.min(t, b.ends_at) - b.starts_at) / 1000;
    const correct = Math.floor(s * p.hitrost);
    return { score: Math.round(correct * 1.6), correct };
  };
  const state = () => {
    const t = now();
    if (b.status === 'running' && t > b.ends_at + 4000) b.status = 'finished';
    const players = [
      { id: ME, name: jaz.username, emoji: jaz.emoji, ...b.moj, wrong: 0, joined: 0 },
      ...PRIJATELJI.filter(p => t - b.ustvarjena >= p.pride)
        .map(p => ({ id: p.id, name: p.name, emoji: p.emoji, ...tocke(p, t), wrong: 0, joined: p.pride }))
    ].sort((x, y) => y.score - x.score || y.correct - x.correct || x.joined - y.joined)
     .map(({ joined, ...p }) => p);
    return { now: t, code: b.code, status: b.status, seed: b.seed, round: b.round,
             starts_at: b.starts_at, ends_at: b.ends_at, host: ME, me: ME, players };
  };

  return {
    preskoci(ms) { skok += ms; },
    odgovori: {
      list_open_battles: () => ({ battles: [{ code: '3158', status: 'lobby', host: 'h-zajc', players: [
        { id: 'h-zajc', name: 'zajc2', emoji: '🐉' }, { id: 'h-lev', name: 'lev1', emoji: '🦁' }] }] }),
      create_battle: () => {
        b = { code: '4721', status: 'lobby', round: 0, seed: 12345, starts_at: null, ends_at: null,
              ustvarjena: now(), moj: { score: 0, correct: 0 } };
        return { token: '00000000-0000-0000-0000-0000000000aa', state: state() };
      },
      battle_sync: p => {
        if (!b) return { error: 'gone' };
        if (p.p_score != null && p.p_round === b.round) b.moj = { score: p.p_score, correct: p.p_correct };
        return state();
      },
      start_battle: () => {
        const t = now();
        Object.assign(b, { status: 'running', round: b.round + 1, seed: 777,
                           starts_at: t + 5000, ends_at: t + 65000, moj: { score: 0, correct: 0 } });
        return state();
      },
      battle_claim: () => null,
      leave_battle: () => null
    }
  };
}
