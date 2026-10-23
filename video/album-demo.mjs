/* Izmišljena baza za album in lika: odgovarja kot album_sync, album_stick,
   album_buy in album_set_avatar v supabase_album.sql, a samo v spominu.
   Učenec ima že dve prilepljeni sličici (40 cekinov) in v ovojnici
   Dobrodošlico (+20), kar je ravno dovolj za prvi ščit. */
const PRICE = { verizna: 80, oklep: 220, 'celada-modra': 160, 'veliki-slem': 300, 'viking-celada': 250, kapuca: 120,
  mec: 100, buzdovan: 200, 'zlati-mec': 350, 'mec-matjaz': 400, 'scit-les': 60, 'scit-zvezda': 150,
  'scit-viking': 200, plasc: 120, 'plasc-kralj': 300, bojisce: 150, 'zmajeva-gora': 300 };

export function albumDemo() {
  let coins = 40, items = ['oproda', 'lesen-mec', 'travnik'];
  const stickers = [{ id: 'x1', state: 'have', gold: false }, { id: 'x10', state: 'have', gold: false },
                    { id: 'z0', state: 'pending', gold: false }];
  let avatar = { form: 'm', skin: null, hair: null, eye: null, style: null, active_char: 'vitez', form_chosen: false,
                 equip: { vitez: { obleka: 'oproda', 'v-roki': 'lesen-mec', ozadje: 'travnik' } } };

  const state = (extra = {}) => ({
    season: { id: 1, name: 'Jesen', starts: '2026-10-12', ends: '2026-12-31', days_left: 70 },
    char: 'vitez', coins, stickers: stickers.map(s => ({ ...s })),
    ranks: { vitez: stickers.filter(s => s.state !== 'pending').length }, chars: ['vitez'], items: [...items], avatar,
    tables: [{ t: 1, op: 'x', cover: 10, n: 24, c: 24, timed: 24, fast: 22 },
             { t: 10, op: 'x', cover: 10, n: 22, c: 21, timed: 22, fast: 20 }],
    practice_days: 2, streak: { best: 2, current: 2 }, comp: null, battle: null, pogum: null, vojska: null, razred: null,
    ...extra
  });

  return {
    album_sync: () => state(),
    album_stick: p => {
      const s = stickers.find(x => x.id === p.p_sticker);
      if (s && s.state === 'pending') { s.state = 'have'; coins += 20; }
      return state();
    },
    album_buy: p => {
      const price = PRICE[p.p_item];
      if (!price) return state({ error: 'NI_NAPRODAJ' });
      if (items.includes(p.p_item)) return state({ error: 'ZE_IMAS' });
      if (coins < price) return state({ error: 'PREMALO' });
      coins -= price; items = [...items, p.p_item];
      return state({ error: null });
    },
    album_set_avatar: p => { avatar = { ...avatar, ...p.p_avatar }; return state(); }
  };
}
