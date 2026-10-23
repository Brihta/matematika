/* Izmišljena baza za ljubljenčka: odgovarja kot pet_state, pet_save,
   pet_buy in pet_equip v supabase_ljubljencek.sql, a samo v spominu.
   napreduj() preskoči nekaj dni vaje (prvi mejnik, priboljški). */
const SHOP = [['pentlja', 'glava', 15], ['rozica', 'glava', 20], ['kapa', 'glava', 35], ['celada', 'glava', 40],
  ['cilinder', 'glava', 50], ['ovratnica', 'vrat', 15], ['sal', 'vrat', 25], ['metuljcek', 'vrat', 30],
  ['ocala', 'obraz', 30], ['soncna', 'obraz', 45]].map(([id, slot, price]) => ({ id, slot, price }));
const GROUPS = ['d10', 'b20', 'pr'], OPS = ['p', 'm'];
const FACTS = { d10: 66, b20: 45, pr: 45 };
const stageOf = n => n >= 6 ? 'koncna' : n >= 5 ? 'odrasel' : n >= 3 ? 'mlad' : n >= 1 ? 'mladicek' : 'jajce';

export function ljubljencekDemo() {
  let pet = null, count = 0, balance = 0, today = 0, owned = [];
  let progress = {};   // "d10p" → { done, answers, correct, timed, fast, facts_done }

  const milestones = () => GROUPS.flatMap(g => OPS.map(op => ({
    g, op, done: false, facts_total: FACTS[g], facts_done: 0, answers: 0, correct: 0, timed: 0, fast: 0,
    ...progress[g + op] })));
  const state = () => ({
    season: { id: 1, name: 'Jesen', from: '2026-10-12', to: '2026-12-31' },
    species: ['zmaj', 'lisica', 'sova', 'macka'], count, stage: stageOf(count),
    unlocks: ['malina', 'pike', 'sliva', 'proge', 'koral', 'zvezde', 'polnoc', 'srcki', 'zlata', 'mavrica'],
    pet, treats: { balance, today, cap: 20 }, shop: SHOP, owned, companion: null,
    milestones: milestones(), collection: []
  });

  return {
    answers: {
      pet_state: () => state(),
      pet_save: p => {
        pet = { species: p.p_species, name: p.p_name, body: p.p_body, belly: p.p_belly,
                eyes: p.p_eyes, pattern: p.p_pattern, equip: pet?.equip || {} };
        return state();
      },
      pet_buy: p => {
        const it = SHOP.find(x => x.id === p.p_item);
        if (balance < it.price) return { error: 'PREMALO' };
        balance -= it.price; owned = [...owned, it.id];
        return state();
      },
      pet_equip: p => {
        const equip = { ...pet.equip };
        if (p.p_item) equip[p.p_slot] = p.p_item; else delete equip[p.p_slot];
        pet = { ...pet, equip };
        return state();
      }
    },
    napreduj() {
      count = 1; balance = 32; today = 12;
      progress = {
        d10p: { done: true, facts_done: 66, answers: 84, correct: 80, timed: 84, fast: 73 },
        d10m: { facts_done: 41, answers: 30, correct: 27, timed: 30, fast: 21 }
      };
    }
  };
}
