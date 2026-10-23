"""Vzorci za ploščice na začetnem zaslonu (style.css, .home-tile::before).
Ponovno risanje: python3 vzorci/narisi.py vzorci"""
import math, os, sys
out = sys.argv[1]
def save(name, body, vb, extra=''):
    open(os.path.join(out, name), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{extra}>{body}</svg>\n')
f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')

# 1. Do 20: kocke za štetje (izometrične, "tumbling blocks"), ploščica se ponavlja
a = 22; s = a * math.cos(math.pi / 6); w, h = 2 * s, 3 * a
def cube(cx, cy):
    top = f'M{f(cx)} {f(cy-a)} L{f(cx+s)} {f(cy-a/2)} L{f(cx)} {f(cy)} L{f(cx-s)} {f(cy-a/2)} Z'
    right = f'M{f(cx)} {f(cy)} L{f(cx+s)} {f(cy-a/2)} L{f(cx+s)} {f(cy+a/2)} L{f(cx)} {f(cy+a)} Z'
    edges = (f'M{f(cx)} {f(cy-a)} L{f(cx+s)} {f(cy-a/2)} L{f(cx+s)} {f(cy+a/2)} L{f(cx)} {f(cy+a)} L{f(cx-s)} {f(cy+a/2)} L{f(cx-s)} {f(cy-a/2)} Z '
             f'M{f(cx)} {f(cy)} L{f(cx-s)} {f(cy-a/2)} M{f(cx)} {f(cy)} L{f(cx+s)} {f(cy-a/2)} M{f(cx)} {f(cy)} L{f(cx)} {f(cy+a)}')
    return (f'<path d="{top}" fill="#fff" fill-opacity=".16"/><path d="{right}" fill="#05270b" fill-opacity=".06"/>'
            f'<path d="{edges}" fill="none" stroke="#05270b" stroke-opacity=".14" stroke-width="1.4" stroke-linejoin="round"/>')
save('kocke.svg', ''.join(cube(x, y) for x, y in [(0, 0), (w, 0), (s, 1.5 * a), (0, 3 * a), (w, 3 * a)]), f'0 0 {f(w)} {f(h)}')

# 2. Poštevanka: zvezdno nebo (cel ploščica) + zobnika z × in ÷ (desno)
import random; random.seed(7)
stars = ''.join(f'<circle cx="{random.randint(0,300)}" cy="{random.randint(0,200)}" r="{random.choice([0.8,1,1.2,1.6])}" fill="#fff" fill-opacity="{random.choice([.25,.35,.5])}"/>' for _ in range(46))
con = [(150, 40), (182, 26), (214, 48), (200, 82), (238, 96)]
con_line = 'M' + ' L'.join(f'{x} {y}' for x, y in con)
stars += f'<path d="{con_line}" fill="none" stroke="#f0a500" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 3"/>'
stars += ''.join(f'<circle cx="{x}" cy="{y}" r="2" fill="#f0a500" fill-opacity=".7"/>' for x, y in con)
save('zvezde.svg', stars, '0 0 300 200', ' preserveAspectRatio="xMidYMid slice"')
def gear(cx, cy, r, n, rot=0):
    pts = []
    for i in range(n * 4):
        ang = rot + i * math.pi * 2 / (n * 4)
        rr = r if i % 4 in (1, 2) else r * .82
        pts.append(f'{f(cx + rr*math.cos(ang))} {f(cy + rr*math.sin(ang))}')
    return 'M' + ' L'.join(pts) + ' Z'
G = '#f0a500'
gears = (f'<path d="{gear(86, 62, 54, 12)}" fill="{G}" fill-opacity=".08" stroke="{G}" stroke-opacity=".45" stroke-width="2.4" stroke-linejoin="round"/>'
         f'<circle cx="86" cy="62" r="30" fill="none" stroke="{G}" stroke-opacity=".35" stroke-width="2"/>'
         f'<path d="M74 50 L98 74 M98 50 L74 74" stroke="{G}" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>'
         f'<path d="{gear(40, 136, 34, 9, .17)}" fill="{G}" fill-opacity=".08" stroke="{G}" stroke-opacity=".45" stroke-width="2.4" stroke-linejoin="round"/>'
         f'<circle cx="40" cy="136" r="18" fill="none" stroke="{G}" stroke-opacity=".35" stroke-width="2"/>'
         f'<path d="M29 136 L51 136" stroke="{G}" stroke-opacity=".6" stroke-width="4.5" stroke-linecap="round"/>'
         f'<circle cx="40" cy="127" r="3" fill="{G}" fill-opacity=".6"/><circle cx="40" cy="145" r="3" fill="{G}" fill-opacity=".6"/>')
save('zobniki.svg', gears, '0 0 150 180')

# 3. Tekmovanje: hitrostne črte (cela ploščica), lovorov venec (okoli pokala), zastava (desno zgoraj)
rays = ''.join(f'<path d="M{x} 210 L{x+130} -10" stroke="#fff" stroke-opacity="{o}" stroke-width="{sw}" stroke-linecap="round"/>'
               for x, o, sw in [(60, .05, 10), (110, .07, 3), (150, .05, 16), (205, .08, 2), (240, .05, 8), (290, .06, 3)])
save('hitrost.svg', rays, '0 0 300 200', ' preserveAspectRatio="xMidYMid slice"')
cx, cy, R = 50, 52, 38
def branch(a0, a1):
    stem = []
    leaves = []
    n = 8
    for i in range(n + 1):
        t = i / n
        th = math.radians(a0 + (a1 - a0) * t)
        x, y = cx + R * math.cos(th), cy + R * math.sin(th)
        stem.append(f'{f(x)} {f(y)}')
        if i == 0: continue
        # tangenta v smeri rasti (navzgor) in pravokotnica navzven
        d = 1 if a1 > a0 else -1
        tx, ty = -math.sin(th) * d, math.cos(th) * d
        for side in (1, -1):
            nx, ny = math.cos(th) * side, math.sin(th) * side
            lx, ly = x + nx * 5 + tx * 3, y + ny * 5 + ty * 3
            ang = math.degrees(math.atan2(ty + ny * .9, tx + nx * .9)) + 90
            k = 1 - t * .35
            leaves.append(f'<ellipse cx="{f(lx)}" cy="{f(ly)}" rx="{f(3.6*k)}" ry="{f(8.5*k)}" transform="rotate({f(ang)} {f(lx)} {f(ly)})"/>')
    return f'<path d="M{" L".join(stem)}" fill="none" stroke="#f4c542" stroke-width="2.2" stroke-linecap="round"/><g fill="#f4c542">{"".join(leaves)}</g>'
body = f'<g opacity=".55">{branch(100, 228)}{branch(80, -48)}</g>'
save('lovor.svg', body, '0 0 100 100')
flag = '<path d="M14 6 L14 94" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>'
for r in range(4):
    for c in range(5):
        x, y = 15 + c * 12, 8 + r * 11
        wave = 3 * math.sin(c * 1.1)
        flag += f'<rect x="{x}" y="{f(y + wave)}" width="12" height="11" fill="#fff" fill-opacity="{.4 if (r + c) % 2 == 0 else .08}"/>'
save('zastava.svg', flag, '0 0 80 100')

# 4. Bitka: zmajeve luske (ploščica se ponavlja)
R = 18
def scale(cx, cy):
    return (f'<path d="M{f(cx-R)} {f(cy)} A{R} {R} 0 0 0 {f(cx+R)} {f(cy)}" fill="#7a2c00" fill-opacity=".06" stroke="#7a2c00" stroke-opacity=".2" stroke-width="1.6"/>'
            f'<path d="M{f(cx-R*.55)} {f(cy+R*.45)} A{R*.7} {R*.7} 0 0 0 {f(cx+R*.2)} {f(cy+R*.72)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>')
cells = [(0, 0), (2*R, 0), (R, R*0.9), (0, R*1.8), (2*R, R*1.8), (R, -R*0.9)]
save('luske.svg', ''.join(scale(x, y) for x, y in cells), f'0 0 {2*R} {f(R*1.8)}')

# 5. Nagajivec: sluzasti mehurčki in iskrice strelov (ploščica se ponavlja)
def blob(cx, cy, r):
    # rahlo neraven krog — kapljica sluzi, z odsevom
    pts = [(cx + r * (1 + .08 * math.sin(3 * t)) * math.cos(t), cy + r * (1 + .08 * math.sin(3 * t)) * math.sin(t))
           for t in [i * math.pi / 8 for i in range(16)]]
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'
    return (f'<path d="{d}" fill="#6b0f24" fill-opacity=".07" stroke="#6b0f24" stroke-opacity=".18" stroke-width="1.5" stroke-linejoin="round"/>'
            f'<path d="M{f(cx-r*.5)} {f(cy-r*.2)} A{f(r*.55)} {f(r*.55)} 0 0 1 {f(cx-r*.05)} {f(cy-r*.6)}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/>')
def spark(cx, cy, r):
    return (f'<path d="M{f(cx)} {f(cy-r)} Q{f(cx)} {f(cy)} {f(cx+r)} {f(cy)} Q{f(cx)} {f(cy)} {f(cx)} {f(cy+r)} '
            f'Q{f(cx)} {f(cy)} {f(cx-r)} {f(cy)} Q{f(cx)} {f(cy)} {f(cx)} {f(cy-r)} Z" fill="#fff" fill-opacity=".35"/>')
N = 56
save('sluz.svg', blob(14, 16, 9) + blob(42, 40, 6) + blob(44, 8, 3.5) + blob(10, 46, 4) + spark(34, 22, 5) + spark(22, 36, 3.5), f'0 0 {N} {N}')
