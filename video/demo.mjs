/* Predstavitveni način: stran se naloži z diska, vsi klici v Supabase pa
   dobijo izmišljene odgovore. Nič ne gre v pravo bazo. */
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'http://demo.localhost';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

export const DEMO_STUDENT = { id: '00000000-0000-0000-0000-000000000001',
  username: 'bri7', emoji: '🦁', display_name: 'Brihtko' };

export async function installDemo(page, { log = false, answers = {} } = {}) {
  await page.route(`${SITE}/**`, async route => {
    let p = new URL(route.request().url()).pathname;
    if (p.endsWith('/')) p += 'index.html';
    try {
      const body = await readFile(join(ROOT, decodeURIComponent(p)));
      await route.fulfill({ body, contentType: TYPES[extname(p)] || 'application/octet-stream' });
    } catch { await route.fulfill({ status: 404, body: '' }); }
  });

  await page.route('**/*.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const fn = url.pathname.split('/rpc/')[1];
    let res;
    const post = route.request().method() === 'POST';
    if (fn && fn in answers) res = answers[fn];
    // zapis na dnevno lestvico gre mimo RPC (tabela scores)
    else if (!fn && post && url.pathname.endsWith('/scores') && answers['scores']) res = answers['scores'];
    else if (fn === 'login_student') res = [DEMO_STUDENT];
    else if (fn === 'get_student_razred') res = '3A';
    else if (fn && /^(add_|set_|album_notice_seen|leave_battle|battle_claim)/.test(fn)) res = null;
    else res = [];
    if (typeof res === 'function') res = res(JSON.parse(route.request().postData() || '{}'));
    if (log) console.log('[supabase]', route.request().method(), fn || url.pathname, route.request().postData() || '', '→', JSON.stringify(res)?.slice(0, 80));
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: res == null ? '' : JSON.stringify(res) });
  });
}
