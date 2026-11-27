// Tage 19–24

// ---------- 19: Keks-Ninja ----------
GAMES[19] = {
  title: 'Keks-Ninja', emoji: '🥷',
  rules: 'Süßigkeiten fliegen hoch. Wisch mit dem Finger durch, um sie zu zerschneiden! Bloß keine Bombe 💣 erwischen (rot leuchtend). Lässt du 3 Süßigkeiten fallen, ist es vorbei.',
  goal: '30 Süßigkeiten zerschneiden',
  play(api) {
    const GOAL = 30, MAXMISS = 3;
    const { ctx, W, H } = api;
    let cut = 0, miss = 0, t = 0, waveT = 0.6, last = null;
    const items = [], trail = [], parts = [], pops = [];
    const G = 520;
    const kinds = [['🍪', '#f2b84b'], ['🧁', '#ff8fab'], ['🍩', '#ff8fab'], ['🍭', '#c084fc'], ['🍓', '#ef4444'], ['🍊', '#fb923c'], ['🍬', '#38bdf8']];
    const upd = () => api.hud(`🍪 ${cut}/${GOAL}`, '❤️'.repeat(MAXMISS - miss) + '🤍'.repeat(miss));
    upd();
    const throwOne = bomb => {
      const x = rnd(W * 0.15, W * 0.85), vy = -rnd(Math.sqrt(2 * G * H * 0.55), Math.sqrt(2 * G * H * 0.8));
      const k = pick(kinds);
      items.push({ x, y: H + 30, vx: (W / 2 - x) * rnd(0.2, 0.6), vy, r: 27, bomb, e: bomb ? '💣' : k[0], c: bomb ? '#ef4444' : k[1], rot: 0, vr: rnd(-3, 3) });
    };
    const segHit = (ax, ay, bx, by, cx, cy, r) => {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const k = clamp(((cx - ax) * dx + (cy - ay) * dy) / l2, 0, 1);
      return dist(ax + dx * k, ay + dy * k, cx, cy) < r;
    };
    api.on('down', (x, y) => { last = { x, y }; });
    api.on('up', () => { last = null; });
    api.on('move', (x, y, d) => {
      if (!d || !last) return;
      trail.push({ x, y, life: 0.2 });
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (segHit(last.x, last.y, x, y, it.x, it.y, it.r)) {
          items.splice(i, 1);
          if (it.bomb) { return api.end(false, `💥 Bombe! ${cut} geschafft`); }
          cut++; upd();
          for (let k = 0; k < 10; k++) parts.push({ x: it.x, y: it.y, vx: rnd(-220, 220), vy: rnd(-260, 40), life: 0.6, c: it.c });
          pops.push({ x: it.x, y: it.y, life: 0.4 });
          if (cut >= GOAL) return api.end(true);
        }
      }
      last = { x, y };
    });
    api.loop(dt => {
      t += dt; waveT -= dt;
      if (waveT <= 0) {
        const n = rndi(1, t < 10 ? 2 : t < 25 ? 3 : 4);
        for (let i = 0; i < n; i++) api.after(i * 160, () => throwOne(false));
        if (t > 4 && Math.random() < Math.min(0.55, 0.25 + t * 0.01)) api.after(rnd(0, 300), () => throwOne(true));
        waveT = Math.max(0.9, 1.7 - t * 0.025);
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
        if (it.vy > 0 && it.y > H + 40) { items.splice(i, 1); if (!it.bomb) { miss++; upd(); api.flash('Verpasst!', 400); if (miss >= MAXMISS) return api.end(false, `${cut} von ${GOAL} geschafft`); } }
      }
      api.bg('#1e3a8a', '#0b1230');
      ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 61 + t * 12) % H, 2, 2);
      for (const it of items) {
        const g = ctx.createRadialGradient(it.x, it.y, 4, it.x, it.y, it.r * 1.35);
        g.addColorStop(0, it.bomb ? 'rgba(239,68,68,.55)' : 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(it.x, it.y, it.r * 1.35, 0, 7); ctx.fill();
        api.emoji(it.e, it.x, it.y, it.r * 2, it.rot);
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill(); }
      for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.life -= dt; if (p.life <= 0) { pops.splice(i, 1); continue; } ctx.globalAlpha = p.life * 2.5; api.text('+1', p.x, p.y - (0.4 - p.life) * 80, 22, '#fde68a'); ctx.globalAlpha = 1; }
      for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
      if (trail.length > 1) {
        ctx.save(); ctx.shadowColor = '#bae6fd'; ctx.shadowBlur = 14; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y); trail.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.restore();
      }
    });
  },
};

// ---------- 20: Mistelzweig-Schütze ----------
GAMES[20] = {
  title: 'Mistelzweig-Schütze', emoji: '🎯',
  rules: 'Zwei Lukasse gleiten über den Bildschirm und prallen von den Rändern ab. Tippe sie an, um ihnen einen Kuss zu verpassen! Jeder Tipp ist ein Schuss, daneben ist verschwendet. Mit jedem Treffer werden sie kleiner und schneller.',
  goal: '15 Treffer mit max. 20 Schüssen in 30 s',
  play(api) {
    const GOAL = 15, SHOTS = 20, TIME = 30;
    const { ctx, W, H } = api;
    let hits = 0, shots = 0;
    const targets = [], marks = [];
    const spawn = () => {
      const r = Math.max(20, 38 - hits * 1.2), sp = 120 + hits * 11;
      let a = rnd(0, Math.PI * 2); if (Math.abs(Math.cos(a)) < 0.3) a += 0.6; // nicht zu senkrecht
      targets.push({ x: rnd(r, W - r), y: rnd(r + 10, H - r - 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r, face: api.face('er') });
    };
    spawn(); spawn();
    const timer = gameTimer(api, TIME, () => api.end(false, `${hits} von ${GOAL} Treffern`));
    const upd = () => api.hud(`🎯 ${hits}/${GOAL}`, `🔫 ${SHOTS - shots}  ${timer.label()}`);
    api.on('down', (x, y) => {
      if (api.ended) return;
      shots++;
      let hit = false;
      for (let i = targets.length - 1; i >= 0; i--) if (dist(x, y, targets[i].x, targets[i].y) < targets[i].r + 8) {
        targets.splice(i, 1); hits++; hit = true; marks.push({ x, y, e: '❤️', life: 0.6 }); spawn(); break;
      }
      if (!hit) marks.push({ x, y, e: '💨', life: 0.4 });
      upd();
      if (hits >= GOAL) return api.end(true, `${hits} Treffer mit ${shots} Schüssen`);
      if (shots >= SHOTS) return api.end(false, `Keine Schüsse mehr – ${hits} Treffer`);
    });
    api.loop((dt, t) => {
      timer.tick(dt); if (api.ended) return; upd();
      for (const g of targets) {
        g.x += g.vx * dt; g.y += g.vy * dt;
        if (g.x < g.r) { g.x = g.r; g.vx = Math.abs(g.vx); } if (g.x > W - g.r) { g.x = W - g.r; g.vx = -Math.abs(g.vx); }
        if (g.y < g.r) { g.y = g.r; g.vy = Math.abs(g.vy); } if (g.y > H - g.r) { g.y = H - g.r; g.vy = -Math.abs(g.vy); }
      }
      api.bg('#14532d', '#062014');
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40 + i * 60, 0, 7); ctx.stroke(); }
      for (const g of targets) {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(g.x + 4, g.y + g.r + 4, g.r * 0.8, g.r * 0.25, 0, 0, 7); ctx.fill();
        api.drawFace(g.face, g.x, g.y, g.r, '#ef4444', 3); api.emoji('🌿', g.x + g.r * 0.7, g.y - g.r * 0.8, g.r * 0.7);
      }
      for (let i = marks.length - 1; i >= 0; i--) { const m = marks[i]; m.life -= dt; if (m.life <= 0) { marks.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, m.life * 2); api.emoji(m.e, m.x, m.y, 30); ctx.globalAlpha = 1; }
    });
  },
};

// ---------- 21: Grinch-Invasion ----------
GAMES[21] = {
  title: 'Grinch-Invasion', emoji: '👾',
  rules: 'Die Grinch-Bande will Weihnachten klauen! Zieh den Finger nach links und rechts, du schießt automatisch Sterne. Weich den Schneebällen aus (3 Leben). Besiege 2 Wellen und danach den Ober-Grinch. Kommen sie ganz runter, ist alles verloren.',
  goal: '2 Wellen + Ober-Grinch besiegen',
  play(api) {
    const { ctx, W, H } = api;
    const R = 22, py = H - 74;
    let x = W / 2, target = W / 2, lives = 3, inv = 0, fireT = 0, stage = 0, banner = 0, bannerText = '', t = 0, shake = 0;
    let enemies = [], shots = [], balls = [], parts = [], boss = null, dir = 1;
    const sky = Array.from({ length: 60 }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(0.6, 2), v: rnd(8, 30) }));
    const me = api.face('sie');
    const grinch = (gx, gy, r, flash, hat = true) => {
      ctx.save(); ctx.translate(gx, gy);
      ctx.fillStyle = flash ? '#fff' : '#65a30d'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.92, 0, 0, 7); ctx.fill();
      ctx.fillStyle = flash ? '#fff' : '#84cc16'; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.45, r * 0.3, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#fde047'; [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * r * 0.35, -r * 0.12, r * 0.22, r * 0.16, s * 0.3, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#b91c1c'; [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(s * r * 0.35, -r * 0.1, r * 0.08, 0, 7); ctx.fill(); });
      ctx.strokeStyle = '#1a2e05'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineCap = 'round';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * r * 0.55, -r * 0.42); ctx.lineTo(s * r * 0.15, -r * 0.28); ctx.stroke(); });
      ctx.beginPath(); ctx.arc(0, r * 0.12, r * 0.5, 0.25, Math.PI - 0.25); ctx.stroke();
      if (hat) {
        ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.7); ctx.lineTo(r * 0.55, -r * 0.75); ctx.lineTo(r * 0.9, -r * 1.45); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.68, -r * 0.82, r * 1.3, r * 0.18); ctx.beginPath(); ctx.arc(r * 0.92, -r * 1.45, r * 0.16, 0, 7); ctx.fill();
      }
      ctx.restore();
    };
    const burst = (bx, by, c, n = 14) => { for (let i = 0; i < n; i++) { const a = rnd(0, 7), s = rnd(60, 260); parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.3, 0.7), c }); } };
    const startStage = () => {
      stage++; shots = []; balls = []; dir = 1; banner = 1.3;
      if (stage <= 2) {
        bannerText = `Welle ${stage}`;
        const cols = 5, rows = 2 + stage, sx = (W - 60) / (cols - 1);
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) enemies.push({ x: 30 + sx * i, y: 70 + j * 46, r: 16, hit: 0 });
      } else { bannerText = 'Der Ober-Grinch!'; boss = { x: W / 2, y: 120, r: 46, hp: 32, max: 32, hit: 0, fire: 1.5 }; }
      upd();
    };
    const upd = () => api.hud(stage <= 2 ? `Welle ${stage}/2` : 'Endgegner', '❤️'.repeat(Math.max(0, lives)));
    const hurt = () => {
      if (inv > 0) return; lives--; inv = 1.3; shake = 0.3; upd(); burst(x, py, '#fca5a5', 18);
      if (lives <= 0) api.end(false, stage <= 2 ? `Besiegt in Welle ${stage}` : 'Der Ober-Grinch war zu stark');
    };
    startStage();
    api.on('down', px => target = px); api.on('move', (px, py2, d) => { if (d) target = px; });
    api.loop(dt => {
      t += dt; inv -= dt; shake = Math.max(0, shake - dt); banner -= dt;
      x += (target - x) * Math.min(1, dt * 14); x = clamp(x, R, W - R);
      fireT -= dt; if (fireT <= 0 && banner < 0.6) { fireT = 0.27; shots.push({ x, y: py - R }); }
      // Gegner-Formation
      if (enemies.length) {
        const sp = (40 + stage * 14) * (1 + (1 - enemies.length / 20) * 1.2);
        let edge = false;
        for (const e of enemies) { e.x += dir * sp * dt; if (e.x < e.r + 4 || e.x > W - e.r - 4) edge = true; e.hit -= dt; }
        if (edge) { dir *= -1; for (const e of enemies) { e.y += 16; e.x = clamp(e.x, e.r + 4, W - e.r - 4); } }
        if (enemies.some(e => e.y > py - 34)) return api.end(false, 'Sie sind bis zu dir durchgekommen');
        if (banner < 0 && Math.random() < dt * (1.0 + stage * 0.5)) { const e = pick(enemies); balls.push({ x: e.x, y: e.y + 16, vx: 0, vy: 200 + stage * 30 }); }
      }
      if (boss) {
        boss.x = W / 2 + Math.sin(t * (boss.hp < boss.max / 2 ? 1.6 : 1.1)) * (W / 2 - boss.r - 10); boss.hit -= dt;
        boss.fire -= dt;
        if (boss.fire <= 0 && banner < 0) {
          boss.fire = boss.hp < boss.max / 2 ? 0.8 : 1.15;
          const a0 = Math.atan2(py - boss.y, x - boss.x);
          for (const da of [-0.3, 0, 0.3]) balls.push({ x: boss.x, y: boss.y + boss.r * 0.6, vx: Math.cos(a0 + da) * 220, vy: Math.sin(a0 + da) * 220 });
        }
      }
      // Sterne des Spielers
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]; s.y -= 560 * dt; if (s.y < -10) { shots.splice(i, 1); continue; }
        const k = enemies.findIndex(e => dist(e.x, e.y, s.x, s.y) < e.r + 6);
        if (k >= 0) { burst(enemies[k].x, enemies[k].y, '#a3e635'); enemies.splice(k, 1); shots.splice(i, 1); continue; }
        if (boss && dist(boss.x, boss.y, s.x, s.y) < boss.r) { boss.hp--; boss.hit = 0.08; shots.splice(i, 1); burst(s.x, s.y, '#fde047', 5); if (boss.hp <= 0) { burst(boss.x, boss.y, '#a3e635', 50); return api.end(true, 'Weihnachten ist gerettet!'); } }
      }
      if (!enemies.length && !boss && stage < 3) startStage();
      // Schneebälle
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i]; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y > H + 10 || b.x < -10 || b.x > W + 10) { balls.splice(i, 1); continue; }
        if (dist(b.x, b.y, x, py) < R * 0.85 + 6) { balls.splice(i, 1); hurt(); if (api.ended) return; }
      }
      // ---- Zeichnen ----
      ctx.save(); if (shake > 0) ctx.translate(rnd(-4, 4), rnd(-4, 4));
      api.bg('#0f172a', '#312e81');
      for (const s of sky) { s.y += s.v * dt; if (s.y > H) s.y = 0; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(s.x, s.y, s.s, s.s); }
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.ellipse(W * 0.25, H + 30, W * 0.6, 70, 0, 0, 7); ctx.ellipse(W * 0.85, H + 40, W * 0.5, 70, 0, 0, 7); ctx.fill();
      for (const e of enemies) grinch(e.x, e.y, e.r, false);
      if (boss) {
        grinch(boss.x, boss.y, boss.r, boss.hit > 0);
        api.roundRect(20, 18, W - 40, 10, 5, 'rgba(255,255,255,.15)'); api.roundRect(20, 18, (W - 40) * boss.hp / boss.max, 10, 5, '#84cc16');
      }
      for (const s of shots) { ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10; api.emoji('⭐', s.x, s.y, 16); ctx.restore(); }
      for (const b of balls) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, 7); ctx.fill(); ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.stroke(); }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); ctx.globalAlpha = 1; }
      if (inv <= 0 || Math.floor(inv * 12) % 2) { api.emoji('🛷', x, py + R + 6, 34); api.drawFace(me, x, py, R, '#f2b84b', 3); }
      if (banner > 0) { ctx.globalAlpha = Math.min(1, banner * 2); api.text(bannerText, W / 2, H * 0.45, 34, '#fde68a'); ctx.globalAlpha = 1; }
      ctx.restore();
    });
  },
};

// ---------- 22: Zahlenjagd ----------
GAMES[22] = {
  title: 'Zahlenjagd', emoji: '🔢',
  rules: 'Tippe die Zahlen von 1 bis 25 der Reihe nach an, so schnell du kannst. Falsch getippt kostet 3 Sekunden.',
  goal: '1 bis 25 in 30 Sekunden',
  play(api) {
    const TIME = 30, N = 25;
    const root = api.dom();
    const s = Math.floor(Math.min((api.W - 28 - 4 * 8) / 5, (api.H - 28 - 4 * 8) / 5));
    root.innerHTML = `<div style="display:grid;grid-template-columns:repeat(5,${s}px);gap:8px"></div>`;
    const g = root.firstChild;
    let next = 1;
    const timer = gameTimer(api, TIME, () => api.end(false, `Bis ${next - 1} gekommen`));
    const cols = ['#e5484d', '#16a34a', '#d97706', '#2563eb', '#9333ea'];
    shuffle([...Array(N).keys()].map(i => i + 1)).forEach(v => {
      const b = document.createElement('div');
      b.style.cssText = `width:${s}px;height:${s}px;border-radius:14px;background:${pick(cols)};display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:${Math.round(s * 0.42)}px;font-weight:800;box-shadow:0 4px 0 rgba(0,0,0,.35);transition:opacity .15s,transform .15s`;
      b.textContent = v;
      b.addEventListener('pointerdown', e => {
        e.stopPropagation(); if (api.ended) return;
        if (v === next) { b.style.opacity = .15; b.style.transform = 'scale(.9)'; next++; if (next > N) return api.end(true, `Noch ${Math.ceil(timer.left)} Sekunden übrig!`); }
        else { timer.left -= 3; api.flash('−3s', 350); }
      });
      g.appendChild(b);
    });
    api.loop(dt => { timer.tick(dt); api.hud(`Nächste: ${Math.min(next, N)}`, timer.label()); });
  },
};

// ---------- 23: Finde den Unterschied ----------
GAMES[23] = {
  title: 'Suchbild', emoji: '🔍',
  rules: 'In jedem Raster ist ein Symbol anders als alle anderen. Finde es und tippe es an! Die Raster werden größer. Falsch getippt kostet 3 Sekunden.',
  goal: '14 Raster in 45 Sekunden',
  play(api) {
    const ROUNDS = 14, TIME = 45;
    const pairs = [['🎄', '🌲'], ['⭐', '🌟'], ['😀', '😃'], ['🎅', '🤶'], ['⛄', '☃️'], ['🍬', '🍭'], ['❤️', '🧡'], ['🔔', '🛎️'], ['🌙', '🌛'], ['🍪', '🥠'], ['😊', '🙂'], ['🦌', '🐐'], ['❄️', '✳️'], ['🧦', '🧤'], ['😺', '😸'], ['🕐', '🕑']];
    const root = api.dom();
    let round = 0;
    const timer = gameTimer(api, TIME, () => api.end(false, `${round} von ${ROUNDS} gefunden`));
    const order = shuffle(pairs);
    const make = () => {
      const n = round < 3 ? 4 : round < 8 ? 5 : 6;
      const s = Math.min((api.W - 24) / n, (api.H - 30) / n) - 4;
      const isFace = round === ROUNDS - 1;
      const [a, b] = Math.random() < .5 ? order[round % order.length] : order[round % order.length].slice().reverse();
      const odd = rndi(0, n * n - 1);
      root.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${n},${s}px);gap:4px"></div>`;
      const g = root.firstChild;
      for (let i = 0; i < n * n; i++) {
        const c = document.createElement('div');
        c.style.cssText = `width:${s}px;height:${s}px;display:flex;align-items:center;justify-content:center;font-size:${s * 0.7}px;background:#ffffff10;border-radius:10px`;
        if (isFace) c.innerHTML = `<img src="${i === odd ? CONFIG.faces.sie[0] : CONFIG.faces.er[0]}" style="width:88%;border-radius:50%">`;
        else c.textContent = i === odd ? b : a;
        c.addEventListener('pointerdown', e => {
          e.stopPropagation(); if (api.ended) return;
          if (i === odd) { round++; if (round >= ROUNDS) return api.end(true, 'Adlerauge!'); make(); }
          else { timer.left -= 3; api.flash('−3s', 350); }
        });
        g.appendChild(c);
      }
    };
    make();
    api.loop(dt => { timer.tick(dt); api.hud(`🔍 ${round}/${ROUNDS}`, timer.label()); });
  },
};

// ---------- 24: Labyrinth-Finale ----------
GAMES[24] = {
  title: 'Weg unterm Mistelzweig', emoji: '❤️',
  rules: 'Das große Finale! Finde den Weg durchs Labyrinth zu Lukas unter dem Mistelzweig. Wische in eine Richtung – du rutschst bis zur nächsten Abzweigung. Die Zeit läuft!',
  goal: 'Lukas in 50 Sekunden erreichen',
  play(api) {
    const TIME = 50;
    const { ctx, W, H } = api;
    const C = 11, R = Math.max(13, Math.min(19, Math.floor(C * (H - 20) / (W - 20))));
    const cs = Math.min((W - 16) / C, (H - 16) / R), ox = (W - cs * C) / 2, oy = (H - cs * R) / 2;
    // Labyrinth per Tiefensuche
    const walls = Array.from({ length: R }, () => Array.from({ length: C }, () => ({ n: 1, s: 1, e: 1, w: 1 })));
    const seen = Array.from({ length: R }, () => Array(C).fill(false));
    const st = [[0, 0]]; seen[0][0] = true;
    const DIRS = { n: [0, -1, 's'], s: [0, 1, 'n'], e: [1, 0, 'w'], w: [-1, 0, 'e'] };
    while (st.length) {
      const [cx, cy] = st[st.length - 1];
      const opts = Object.entries(DIRS).filter(([, [dx, dy]]) => { const nx = cx + dx, ny = cy + dy; return nx >= 0 && ny >= 0 && nx < C && ny < R && !seen[ny][nx]; });
      if (!opts.length) { st.pop(); continue; }
      const [d, [dx, dy, o]] = pick(opts); walls[cy][cx][d] = 0; walls[cy + dy][cx + dx][o] = 0; seen[cy + dy][cx + dx] = true; st.push([cx + dx, cy + dy]);
    }
    // ein paar Extra-Durchgänge für Abkürzungen/Irrwege
    for (let k = 0; k < 6; k++) { const x = rndi(1, C - 2), y = rndi(1, R - 2); walls[y][x].e = 0; walls[y][x + 1].w = 0; }
    let px = 0, py = 0, rx = 0, ry = 0, moving = null;
    const gx = C - 1, gy = R - 1;
    const me = api.face('sie'), him = api.face('er');
    const map = { up: 'n', down: 's', left: 'w', right: 'e' };
    const openCount = (x, y) => ['n', 's', 'e', 'w'].filter(d => !walls[y][x][d]).length;
    api.on('swipe', dir => {
      if (moving) { moving.queued = map[dir]; return; }
      go(map[dir]);
    });
    const go = d => {
      if (walls[py][px][d]) return;
      const path = []; let x = px, y = py;
      while (!walls[y][x][d]) {
        x += DIRS[d][0]; y += DIRS[d][1]; path.push([x, y]);
        if ((x === gx && y === gy) || openCount(x, y) !== 2 || walls[y][x][d]) break;
      }
      moving = { path, i: 0, d, queued: null };
    };
    const timer = gameTimer(api, TIME, () => api.end(false, 'Die Zeit ist abgelaufen'));
    api.loop(dt => {
      timer.tick(dt); if (api.ended) return;
      api.hud(timer.label(), '❤️ Finde Lukas');
      if (moving) {
        const [tx, ty] = moving.path[moving.i];
        const sp = 16 * dt; rx += clamp(tx - rx, -sp, sp); ry += clamp(ty - ry, -sp, sp);
        if (Math.abs(rx - tx) < 1e-3 && Math.abs(ry - ty) < 1e-3) {
          px = tx; py = ty; moving.i++;
          if (px === gx && py === gy) return api.end(true, 'Kuss unterm Mistelzweig! ❤️');
          if (moving.i >= moving.path.length) { const q = moving.queued; moving = null; if (q) go(q); }
        }
      }
      api.bg('#0f2a1f', '#081610');
      ctx.strokeStyle = '#f6c453'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const w = walls[y][x], X = ox + x * cs, Y = oy + y * cs;
        if (w.n) { ctx.moveTo(X, Y); ctx.lineTo(X + cs, Y); }
        if (w.w) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cs); }
        if (y === R - 1 && w.s) { ctx.moveTo(X, Y + cs); ctx.lineTo(X + cs, Y + cs); }
        if (x === C - 1 && w.e) { ctx.moveTo(X + cs, Y); ctx.lineTo(X + cs, Y + cs); }
      }
      ctx.stroke();
      api.emoji('🌿', ox + gx * cs + cs / 2, oy + gy * cs + 2, cs * 0.6);
      api.drawFace(him, ox + gx * cs + cs / 2, oy + gy * cs + cs / 2, cs * 0.4, '#d7263d', 2);
      api.drawFace(me, ox + rx * cs + cs / 2, oy + ry * cs + cs / 2, cs * 0.4, '#fff', 2);
    });
  },
};
