/* Vstavi se v stran samo med snemanjem: kazalec, krog okoli gumba,
   podnapisi in naslovna kartica. Na pravi strani ga ni. */
(() => {
  const css = `
  #vCursor{position:fixed;left:-60px;top:-60px;width:34px;height:34px;z-index:2147483647;
    pointer-events:none;transition:left .9s cubic-bezier(.45,0,.2,1),top .9s cubic-bezier(.45,0,.2,1);
    filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
  #vCursor.press{transform:scale(.82)}
  #vRing{position:fixed;z-index:2147483646;pointer-events:none;border:5px solid #ffcc00;
    border-radius:18px;box-shadow:0 0 0 6px rgba(255,204,0,.3),0 0 30px rgba(255,204,0,.7);
    opacity:0;transition:opacity .3s;animation:vPulse 1.1s ease-in-out infinite}
  @keyframes vPulse{50%{box-shadow:0 0 0 14px rgba(255,204,0,.12),0 0 40px rgba(255,204,0,.9)}}
  #vCap{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483645;
    max-width:86%;padding:14px 26px;border-radius:18px;background:rgba(20,16,40,.86);color:#fff;
    font:700 26px/1.35 system-ui,-apple-system,sans-serif;text-align:center;opacity:0;
    transition:opacity .35s;pointer-events:none}
  #vCap.top{bottom:auto;top:24px}
  #vTitle{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:18px;color:#fff;
    background:radial-gradient(circle at 50% 40%,#2f7a26,#0b2e10 70%);
    font-family:system-ui,-apple-system,sans-serif;transition:opacity .6s}
  #vTitle img{width:210px;height:210px;filter:drop-shadow(0 10px 25px rgba(0,0,0,.5))}
  #vTitle small{font-size:26px;letter-spacing:.2em;text-transform:uppercase;opacity:.75;font-weight:700}
  #vTitle b{font-size:64px}`;
  const add = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend',
      `<svg id="vCursor" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.3-3.4-6.8L4 20z"
        fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>
       <div id="vRing"></div><div id="vCap"></div>`);
  };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);

  window.__v = {
    cursor(x, y) { const c = document.getElementById('vCursor'); c.style.left = x + 'px'; c.style.top = y + 'px'; },
    press(on) { document.getElementById('vCursor').classList.toggle('press', on); },
    ring(r) {
      const g = document.getElementById('vRing');
      // podnapis ne sme prekriti obkroženega: če je spodaj, gre podnapis gor
      document.getElementById('vCap').classList.toggle('top', !!r && r.y + r.height > innerHeight - 140);
      if (!r) { g.style.opacity = 0; return; }
      const p = 10;
      Object.assign(g.style, { left: r.x - p + 'px', top: r.y - p + 'px',
        width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px', opacity: 1 });
    },
    caption(t) {
      const c = document.getElementById('vCap');
      if (t) c.textContent = t;
      c.style.opacity = t ? 1 : 0;
    },
    title(kicker, text) {
      let t = document.getElementById('vTitle');
      if (!kicker) { if (t) { t.style.opacity = 0; setTimeout(() => t.remove(), 700); } return; }
      document.body.insertAdjacentHTML('beforeend',
        `<div id="vTitle"><img src="Brihta.png" alt=""><small>${kicker}</small><b>${text}</b></div>`);
    }
  };
})();
