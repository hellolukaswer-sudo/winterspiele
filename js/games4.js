// Tage 19–24

// ---------- 19: Keks-Ninja ----------
GAMES[19] = {
  title: 'Keks-Ninja', emoji: '🥷',
  rules: 'Kekse fliegen hoch – wisch mit dem Finger durch, um sie zu zerschneiden! Bloß keine Bombe 💣 erwischen. Lässt du 3 Kekse fallen, ist es vorbei.',
  goal: '30 Kekse zerschneiden',
  play(api) {
    const GOAL = 30, MAXMISS = 3;
    const { ctx, W, H } = api;
    let cut = 0, miss = 0, t = 0, waveT = 0.6, last = null;
    const items = [], trail = [], parts = [];
    const G = 520;
    const upd = () => api.hud(`🍪 ${cut}/${GOAL}`, '❌'.repeat(miss) + '⚪'.repeat(MAXMISS - miss));
    upd();
    const throwOne = bomb => {
      const x = rnd(W * 0.15, W * 0.85), vy = -rnd(Math.sqrt(2 * G * H * 0.55), Math.sqrt(2 * G * H * 0.8));
      items.push({ x, y: H + 30, vx: (W / 2 - x) * rnd(0.2, 0.6), vy, r: 26, bomb, e: bomb ? '💣' : pick(['🍪', '🍪', '🧁', '🍩', '🥨']), rot: 0, vr: rnd(-3, 3) });
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
      trail.push({ x, y, life: 0.18 });
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (segHit(last.x, last.y, x, y, it.x, it.y, it.r)) {
          items.splice(i, 1);
          if (it.bomb) { return api.end(false, `💥 Bombe! ${cut} Kekse geschafft`); }
          cut++; upd(); for (let k = 0; k < 6; k++) parts.push({ x: it.x, y: it.y, vx: rnd(-160, 160), vy: rnd(-200, 50), life: 0.5 });
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
        if (it.vy > 0 && it.y > H + 40) { items.splice(i, 1); if (!it.bomb) { miss++; upd(); if (miss >= MAXMISS) return api.end(false, `${cut} von ${GOAL} Keksen`); } }
      }
      api.bg('#3b2414', '#1a0f08');
      for (const it of items) api.emoji(it.e, it.x, it.y, it.r * 2, it.rot);
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.fillStyle = '#d9a35b'; ctx.fillRect(p.x, p.y, 5, 5); }
      for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
      if (trail.length > 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y); trail.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); }
    });
  },
};

// ---------- 20: Zielscheibe ----------
GAMES[20] = {
  title: 'Mistelzweig-Schütze', emoji: '🎯',
  rules: 'Lukas düst über den Bildschirm. Tippe ihn an, um ihm einen Mistelzweig-Kuss zu verpassen! Jeder Tipp zählt als Schuss – daneben ist verschwendet.',
  goal: '15 Treffer mit max. 20 Schüssen in 30 s',
  play(api) {
    const GOAL = 15, SHOTS = 20, TIME = 30;
    const { ctx, W, H } = api;
    let hits = 0, shots = 0;
    const targets = [], marks = [];
    const spawn = () => {
      const r = Math.max(19, 36 - hits * 1.2), sp = 150 + hits * 13, a = rnd(0, Math.PI * 2);
      targets.push({ x: rnd(r, W - r), y: rnd(r + 10, H - r - 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r, face: api.face('er'), turn: rnd(0.4, 1.2) });
    };
    spawn(); spawn();
    const timer = gameTimer(api, TIME, () => api.end(false, `${hits} von ${GOAL} Treffern`));
    const upd = () => api.hud(`🎯 ${hits}/${GOAL}`, `🔫 ${SHOTS - shots}  ${timer.label()}`);
    api.on('down', (x, y) => {
      if (api.ended) return;
      shots++;
      let hit = false;
      for (let i = targets.length - 1; i >= 0; i--) if (dist(x, y, targets[i].x, targets[i].y) < targets[i].r + 6) {
        targets.splice(i, 1); hits++; hit = true; marks.push({ x, y, e: '💋', life: 0.6 }); spawn(); break;
      }
      if (!hit) marks.push({ x, y, e: '💨', life: 0.4 });
      upd();
      if (hits >= GOAL) return api.end(true, `${hits} Treffer mit ${shots} Schüssen`);
      if (shots >= SHOTS) return api.end(false, `Keine Schüsse mehr – ${hits} Treffer`);
    });
    api.loop(dt => {
      timer.tick(dt); if (api.ended) return; upd();
      for (const t of targets) {
        t.turn -= dt; if (t.turn <= 0) { const sp = Math.hypot(t.vx, t.vy), a = Math.atan2(t.vy, t.vx) + rnd(-1.4, 1.4); t.vx = Math.cos(a) * sp; t.vy = Math.sin(a) * sp; t.turn = rnd(0.4, 1.1); }
        t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.x < t.r) { t.x = t.r; t.vx = Math.abs(t.vx); } if (t.x > W - t.r) { t.x = W - t.r; t.vx = -Math.abs(t.vx); }
        if (t.y < t.r) { t.y = t.r; t.vy = Math.abs(t.vy); } if (t.y > H - t.r) { t.y = H - t.r; t.vy = -Math.abs(t.vy); }
      }
      api.bg('#173d2c', '#0a1f16');
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#ffffff0d'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(W / 2, H / 2, 40 + i * 60, 0, 7); ctx.stroke(); }
      for (const t of targets) { api.drawFace(t.face, t.x, t.y, t.r, '#d7263d', 3); api.emoji('🌿', t.x + t.r * 0.7, t.y - t.r * 0.8, t.r * 0.7); }
      for (let i = marks.length - 1; i >= 0; i--) { const m = marks[i]; m.life -= dt; if (m.life <= 0) { marks.splice(i, 1); continue; } ctx.globalAlpha = m.life * 2; api.emoji(m.e, m.x, m.y, 30); ctx.globalAlpha = 1; }
    });
  },
};

// ---------- 21: Weihnachts-Invasion ----------
GAMES[21] = {
  title: 'Grinch-Invasion', emoji: '👾',
  rules: 'Die Grinch-Monster wollen Weihnachten klauen! Zieh dich nach links und rechts – du schießt automatisch. Weich ihren Schneeflocken aus (3 Leben). Kommen sie ganz unten an, ist alles verloren.',
  goal: '3 Angriffswellen besiegen',
  play(api) {
    const WAVES = 3;
    const { ctx, W, H } = api;
    const R = 20; let x = W / 2, target = W / 2, lives = 3, wave = 0, fireT = 0, inv = 0;
    const py = H - 50;
    let enemies = [], bullets = [], drops = [], dir = 1, edx = 0;
    const face = api.face('sie');
    const startWave = () => {
      wave++; enemies = []; dir = 1;
      const cols = 5, rows = 2 + wave, sx = W / (cols + 1);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) enemies.push({ x: sx * (i + 1), y: 50 + j * 42, e: ['👾', '👹', '🤖', '👺'][j % 4] });
      api.flash(`Welle ${wave}`, 800);
    };
    startWave();
    const upd = () => api.hud(`Welle ${wave}/${WAVES}`, '❤️'.repeat(lives));
    upd();
    api.on('down', px => target = px); api.on('move', (px, py2, d) => { if (d) target = px; });
    api.loop(dt => {
      x += (target - x) * Math.min(1, dt * 14); x = clamp(x, R, W - R);
      inv -= dt;
      fireT -= dt; if (fireT <= 0) { fireT = 0.3; bullets.push({ x, y: py - R }); }
      const sp = (36 + wave * 12) * (1 + (1 - enemies.length / 15) * 1.3);
      let hitEdge = false;
      for (const e of enemies) { e.x += dir * sp * dt; if (e.x < 18 || e.x > W - 18) hitEdge = true; }
      if (hitEdge) { dir *= -1; for (const e of enemies) { e.y += 16; e.x = clamp(e.x, 18, W - 18); } }
      if (enemies.some(e => e.y > py - 30)) return api.end(false, `Sie sind durchgekommen (Welle ${wave})`);
      if (enemies.length && Math.random() < dt * (0.9 + wave * 0.45)) { const e = pick(enemies); drops.push({ x: e.x, y: e.y + 14, vy: 190 + wave * 30 }); }
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.y -= 520 * dt; if (b.y < -10) { bullets.splice(i, 1); continue; }
        const k = enemies.findIndex(e => Math.abs(e.x - b.x) < 17 && Math.abs(e.y - b.y) < 16);
        if (k >= 0) { enemies.splice(k, 1); bullets.splice(i, 1); }
      }
      if (!enemies.length) { if (wave >= WAVES) return api.end(true, 'Weihnachten ist gerettet!'); startWave(); upd(); bullets = []; drops = []; }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.y += d.vy * dt; if (d.y > H + 10) { drops.splice(i, 1); continue; }
        if (inv <= 0 && dist(d.x, d.y, x, py) < R * 0.85) { drops.splice(i, 1); lives--; inv = 1.2; upd(); if (lives <= 0) return api.end(false, `Erwischt in Welle ${wave}`); api.flash('Autsch!', 400); }
      }
      api.bg('#0b0f2a', '#1b1340');
      ctx.fillStyle = '#ffffff55'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 83) % W, (i * 137 + performance.now() / 30) % H, 2, 2);
      for (const e of enemies) api.emoji(e.e, e.x, e.y, 28);
      ctx.fillStyle = '#f6c453'; for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      for (const d of drops) api.emoji('❄️', d.x, d.y, 16);
      if (inv <= 0 || Math.floor(inv * 10) % 2) api.drawFace(face, x, py, R, '#2fbf71', 3);
    });
  },
};

// ---------- 22: Zahlenjagd ----------
GAMES[22] = {
  title: 'Zahlenjagd', emoji: '🔢',
  rules: 'Tippe die Zahlen von 1 bis 25 der Reihe nach an, so schnell du kannst. Falsch getippt kostet 2 Sekunden.',
  goal: '1 bis 25 in 36 Sekunden',
  play(api) {
    const TIME = 36, N = 25;
    const root = api.dom();
    const s = Math.min((api.W - 30) / 5, (api.H - 40) / 5) - 6;
    root.innerHTML = `<div style="display:grid;grid-template-columns:repeat(5,${s}px);gap:6px"></div>`;
    const g = root.firstChild;
    let next = 1;
    const timer = gameTimer(api, TIME, () => api.end(false, `Bis ${next - 1} gekommen`));
    const cols = ['#d7263d', '#1f7a4d', '#c9952e', '#3d7dd8'];
    shuffle([...Array(N).keys()].map(i => i + 1)).forEach(v => {
      const b = document.createElement('div');
      b.style.cssText = `width:${s}px;height:${s}px;border-radius:12px;background:${pick(cols)};display:flex;align-items:center;justify-content:center;font-size:${s * 0.42}px;font-weight:700;box-shadow:0 3px 0 #0007;transform:rotate(${rnd(-6, 6)}deg)`;
      b.textContent = v;
      b.addEventListener('pointerdown', e => {
        e.stopPropagation(); if (api.ended) return;
        if (v === next) { b.style.opacity = .2; next++; if (next > N) return api.end(true, `Noch ${Math.ceil(timer.left)} Sekunden übrig!`); }
        else { timer.left -= 2; api.flash('−2s', 350); }
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
        if (isFace) c.innerHTML = `<img src="${i === odd ? CONFIG.faces.sie[0] : CONFIG.faces.er[i % CONFIG.faces.er.length]}" style="width:88%;border-radius:50%">`;
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
  title: 'Weg unterm Mistelzweig', emoji: '💋',
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
      api.hud(timer.label(), '💋 Finde Lukas');
      if (moving) {
        const [tx, ty] = moving.path[moving.i];
        const sp = 16 * dt; rx += clamp(tx - rx, -sp, sp); ry += clamp(ty - ry, -sp, sp);
        if (Math.abs(rx - tx) < 1e-3 && Math.abs(ry - ty) < 1e-3) {
          px = tx; py = ty; moving.i++;
          if (px === gx && py === gy) return api.end(true, 'Kuss unterm Mistelzweig! 💋');
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
