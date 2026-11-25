// Tage 7–12

// ---------- 7: Reaktionstest ----------
GAMES[7] = {
  title: 'Schnell wie ein Kuss', emoji: '⚡',
  rules: 'Warte, bis Lukas auftaucht, und tippe dann so schnell wie möglich. Zu früh getippt oder bei Kohle 🪨 getippt = Strafzeit von 1 Sekunde.',
  goal: 'Durchschnitt unter 400 ms (7 Runden)',
  play(api) {
    const ROUNDS = 7, LIMIT = 400, PEN = 1000;
    const { ctx, W, H } = api;
    let round = 0, phase = 'wait', tShow = 0, waitLeft = 0, times = [], decoyLeft = 0, msg = '';
    const plan = shuffle([...Array(ROUNDS).fill('real'), 'decoy', 'decoy']); let pi = 0;
    let fx = W / 2, fy = H / 2, face = null;
    const next = () => {
      if (times.length >= ROUNDS) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        return api.end(avg <= LIMIT, `Durchschnitt: ${avg} ms`);
      }
      phase = 'wait'; waitLeft = rnd(1.2, 3.6); fx = rnd(70, W - 70); fy = rnd(90, H - 90);
    };
    const upd = () => api.hud(`⚡ ${times.length}/${ROUNDS}`, times.length ? `Ø ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms` : '');
    api.on('down', () => {
      if (phase === 'wait') { times.push(PEN); msg = 'Zu früh! +1s'; upd(); return next(); }
      if (phase === 'decoy') { times.push(PEN); msg = 'Kohle! +1s'; upd(); return next(); }
      if (phase === 'show') { const ms = Math.round(performance.now() - tShow); times.push(ms); msg = ms + ' ms'; upd(); next(); }
    });
    next(); upd();
    api.loop(dt => {
      if (phase === 'wait') {
        waitLeft -= dt;
        if (waitLeft <= 0) {
          const kind = plan[pi++] || 'real';
          if (kind === 'decoy') { phase = 'decoy'; decoyLeft = 1.1; }
          else { phase = 'show'; tShow = performance.now(); face = api.face('er'); }
        }
      } else if (phase === 'decoy') { decoyLeft -= dt; if (decoyLeft <= 0) { msg = 'Gut widerstanden!'; next(); } }
      api.bg(phase === 'show' ? '#1f7a4d' : '#3a1220', phase === 'show' ? '#0f3b25' : '#1a0710');
      if (phase === 'wait') api.text('Warte…', W / 2, H / 2, 34, '#ffffffaa');
      if (phase === 'decoy') api.emoji('🪨', fx, fy, 90);
      if (phase === 'show') api.drawFace(face, fx, fy, 60, '#f6c453', 5);
      if (msg) api.text(msg, W / 2, H - 40, 22, '#f6c453');
    });
  },
};

// ---------- 8: Lichterketten-Simon ----------
GAMES[8] = {
  title: 'Lichterkette', emoji: '💡',
  rules: 'Merk dir, in welcher Reihenfolge die Lichter aufleuchten, und tippe sie nach. Jede Runde kommt eins dazu und es wird schneller. Ein Fehler und es ist aus.',
  goal: 'Schaffe Runde 9',
  play(api) {
    const GOAL = 9;
    const root = api.dom();
    const s = Math.min((api.W - 50) / 2, (api.H - 120) / 2);
    const cols = ['#d7263d', '#2fbf71', '#f6c453', '#3d7dd8'];
    const content = [`<img src="${CONFIG.faces.er[0]}" style="width:70%;border-radius:50%">`, `<img src="${CONFIG.faces.sie[0]}" style="width:70%;border-radius:50%">`, '🎄', '⭐'];
    root.innerHTML = `<div id="sim-msg" style="font-size:22px;font-weight:600;height:30px"></div><div style="display:grid;grid-template-columns:repeat(2,${s}px);gap:14px"></div>`;
    const msgEl = root.querySelector('#sim-msg'), grid = root.lastChild;
    const btns = cols.map((c, i) => {
      const b = document.createElement('div');
      b.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;background:${c};opacity:.35;display:flex;align-items:center;justify-content:center;font-size:${s * 0.4}px;box-shadow:0 6px 0 #0007;transition:opacity .08s, transform .08s`;
      b.innerHTML = content[i]; grid.appendChild(b); return b;
    });
    const seq = []; let input = 0, accepting = false, round = 0;
    const light = (i, ms) => { btns[i].style.opacity = 1; btns[i].style.transform = 'scale(1.06)'; api.after(ms, () => { btns[i].style.opacity = .35; btns[i].style.transform = ''; }); };
    const play = () => {
      round++; api.hud(`💡 Runde ${round}/${GOAL}`, '');
      seq.push(rndi(0, 3)); accepting = false; input = 0; msgEl.textContent = 'Schau genau hin…';
      const on = Math.max(260, 560 - round * 32), gap = Math.max(110, 230 - round * 12);
      seq.forEach((v, k) => api.after(700 + k * (on + gap), () => light(v, on)));
      api.after(700 + seq.length * (on + gap), () => { accepting = true; msgEl.textContent = 'Jetzt du!'; });
    };
    btns.forEach((b, i) => b.addEventListener('pointerdown', e => {
      e.stopPropagation(); if (!accepting || api.ended) return;
      light(i, 180);
      if (seq[input] !== i) { accepting = false; return api.end(false, `Runde ${round} – ${round - 1} geschafft`); }
      input++;
      if (input === seq.length) { accepting = false; msgEl.textContent = '✔️'; if (round >= GOAL) return api.end(true); api.after(600, play); }
    }));
    play();
  },
};

// ---------- 9: Plätzchen-Breakout ----------
GAMES[9] = {
  title: 'Plätzchen-Knacker', emoji: '🍪',
  rules: 'Zieh den Schlitten unten hin und her und lass Lukas als Ball abprallen. Zerschlag alle Plätzchen! Fällt der Ball runter, verlierst du ein Leben (3 Leben).',
  goal: 'Alle 30 Plätzchen knacken',
  play(api) {
    const { ctx, W, H } = api;
    const COLS = 6, ROWS = 5, pad = 6, bw = (W - pad * (COLS + 1)) / COLS, bh = 24;
    const bricks = []; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) bricks.push({ x: pad + i * (bw + pad), y: 50 + j * (bh + pad), alive: true, c: ['#d7263d', '#f6c453', '#2fbf71', '#3d7dd8', '#c64fd1'][j] });
    const PW = W * 0.24, PH = 14, py = H - 46; let px = W / 2, target = W / 2;
    const R = 12; let bx, by, vx, vy, speed = 330, lives = 3, stuck = true, left = bricks.length;
    const face = api.face('er');
    const reset = () => { stuck = true; bx = px; by = py - R - 2; };
    reset();
    const upd = () => api.hud(`🍪 ${bricks.length - left}/${bricks.length}`, '❤️'.repeat(lives));
    upd();
    api.on('down', x => { target = x; if (stuck) { stuck = false; const a = rnd(-0.5, 0.5); vx = Math.sin(a) * speed; vy = -Math.cos(a) * speed; } });
    api.on('move', (x, y, d) => { if (d) target = x; });
    api.loop(dt => {
      px += (target - px) * Math.min(1, dt * 18); px = clamp(px, PW / 2, W - PW / 2);
      if (stuck) { bx = px; by = py - R - 2; }
      else {
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          bx += vx * dt / steps; by += vy * dt / steps;
          if (bx < R) { bx = R; vx = Math.abs(vx); } if (bx > W - R) { bx = W - R; vx = -Math.abs(vx); } if (by < R) { by = R; vy = Math.abs(vy); }
          if (vy > 0 && by + R > py && by + R < py + PH + 10 && bx > px - PW / 2 - R && bx < px + PW / 2 + R) {
            const hit = clamp((bx - px) / (PW / 2), -1, 1), a = hit * 1.05;
            vx = Math.sin(a) * speed; vy = -Math.cos(a) * speed; by = py - R;
          }
          for (const b of bricks) if (b.alive && bx + R > b.x && bx - R < b.x + bw && by + R > b.y && by - R < b.y + bh) {
            b.alive = false; left--; speed = Math.min(560, speed + 6.5);
            const ox = Math.min(bx + R - b.x, b.x + bw - (bx - R)), oy = Math.min(by + R - b.y, b.y + bh - (by - R));
            if (ox < oy) vx = -vx; else vy = -vy;
            const m = speed / Math.hypot(vx, vy); vx *= m; vy *= m;
            upd(); if (left === 0) return api.end(true);
            break;
          }
          if (by > H + R) { lives--; upd(); if (lives <= 0) return api.end(false, `${bricks.length - left} von ${bricks.length} geknackt`); api.flash('Leben verloren!', 600); reset(); break; }
        }
      }
      api.bg('#2a1630', '#110812');
      for (const b of bricks) if (b.alive) { api.roundRect(b.x, b.y, bw, bh, 8, b.c); api.emoji('🍪', b.x + bw / 2, b.y + bh / 2, 16); }
      api.roundRect(px - PW / 2, py, PW, PH, 7, '#f4f8ff'); ctx.fillStyle = '#d7263d'; ctx.fillRect(px - PW / 2 + 8, py + PH - 4, PW - 16, 4);
      api.drawFace(face, bx, by, R, '#f6c453', 2);
      if (stuck) api.text('Tippen zum Abschießen', W / 2, H * 0.62, 20, '#ffffffbb');
    });
  },
};

// ---------- 10: Schneeball-Ausweichen ----------
GAMES[10] = {
  title: 'Schneeballschlacht', emoji: '☃️',
  rules: 'Lukas wirft Schneebälle! Halte den Finger auf den Bildschirm und bewege dich – du schwebst etwas über deinem Finger. Ein Treffer und du hast verloren.',
  goal: '35 Sekunden überleben',
  play(api) {
    const TIME = 35;
    const { ctx, W, H } = api;
    const R = 22; let x = W / 2, y = H * 0.75, tx = x, ty = y, t = 0, spawnT = 0.6;
    const balls = [], face = api.face('sie'), thrower = api.face('er');
    api.on('down', (px, py) => { tx = px; ty = py - 70; });
    api.on('move', (px, py, d) => { if (d) { tx = px; ty = py - 70; } });
    api.loop(dt => {
      t += dt;
      if (t >= TIME) return api.end(true, '35 Sekunden trocken geblieben!');
      api.hud(`⏱ ${Math.ceil(TIME - t)}`, '');
      x += (tx - x) * Math.min(1, dt * 14); y += (ty - y) * Math.min(1, dt * 14);
      x = clamp(x, R, W - R); y = clamp(y, H * 0.25, H - R);
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.22, 0.7 - t * 0.014);
        const sp = 190 + t * 6.5;
        if (t > 12 && Math.random() < 0.3) { // gezielter Wurf
          const sx = rnd(0, W), a = Math.atan2(y - 0, x - sx);
          balls.push({ x: sx, y: -10, vx: Math.cos(a) * sp * 1.1, vy: Math.sin(a) * sp * 1.1, r: rnd(10, 14) });
        } else balls.push({ x: rnd(10, W - 10), y: -12, vx: rnd(-40, 40), vy: sp * rnd(0.85, 1.25), r: rnd(9, 16) });
      }
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i]; b.x += b.vx * dt; b.y += b.vy * dt;
        if (dist(b.x, b.y, x, y) < b.r + R * 0.72) return api.end(false, `Nach ${Math.floor(t)} Sekunden erwischt`);
        if (b.y > H + 20 || b.x < -30 || b.x > W + 30) balls.splice(i, 1);
      }
      api.bg('#5b7fa8', '#dfe9f5');
      ctx.globalAlpha = 0.85; api.drawFace(thrower, W / 2, 26, 20, '#fff', 2); ctx.globalAlpha = 1;
      for (const b of balls) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.strokeStyle = '#9bb3cf'; ctx.lineWidth = 1.5; ctx.stroke(); }
      api.drawFace(face, x, y, R, '#d7263d', 3);
    });
  },
};

// ---------- 11: Schiebepuzzle ----------
GAMES[11] = {
  title: 'Foto-Schiebepuzzle', emoji: '🧩',
  rules: 'Unser Foto ist durcheinander! Tippe ein Teil neben der Lücke an, um es zu verschieben, bis das Bild wieder stimmt. Die Vorlage siehst du oben.',
  goal: 'Lösen in 150 Sekunden',
  play(api) {
    const TIME = 150, N = 3;
    const root = api.dom();
    const photo = CONFIG.photos[0];
    const size = Math.min(api.W - 30, api.H - 150), ts = size / N;
    root.innerHTML = `<div style="width:90px;height:90px;border-radius:10px;background:url(${photo}) center/cover;border:2px solid #fff;opacity:.9"></div><div style="position:relative;width:${size}px;height:${size}px;background:#0006;border-radius:12px"></div>`;
    const board = root.lastChild;
    let tiles = [...Array(N * N).keys()]; // Wert = Zielposition, 8 = Lücke
    let blank = N * N - 1, prev = -1;
    for (let k = 0; k < 90 || tiles.every((v, i) => v === i); k++) {
      const bx = blank % N, by = Math.floor(blank / N);
      const nb = [[bx - 1, by], [bx + 1, by], [bx, by - 1], [bx, by + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => b * N + a).filter(i => i !== prev);
      const m = pick(nb); [tiles[blank], tiles[m]] = [tiles[m], tiles[blank]]; prev = blank; blank = m;
    }
    const els = {};
    tiles.forEach((v, i) => {
      if (v === N * N - 1) return;
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;width:${ts - 4}px;height:${ts - 4}px;border-radius:8px;background:url(${photo});background-size:${size}px ${size}px;background-position:${-(v % N) * ts}px ${-Math.floor(v / N) * ts}px;transition:left .12s,top .12s;box-shadow:0 2px 6px #0008`;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); move(v); });
      board.appendChild(el); els[v] = el;
    });
    const place = () => tiles.forEach((v, i) => { if (els[v]) { els[v].style.left = (i % N) * ts + 2 + 'px'; els[v].style.top = Math.floor(i / N) * ts + 2 + 'px'; } });
    let moves = 0;
    const move = v => {
      if (api.ended) return;
      const i = tiles.indexOf(v), bx = blank % N, by = Math.floor(blank / N), ix = i % N, iy = Math.floor(i / N);
      if (Math.abs(bx - ix) + Math.abs(by - iy) !== 1) return;
      [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]]; blank = i; moves++; place();
      if (tiles.every((t, k) => t === k)) api.end(true, `In ${moves} Zügen gelöst!`);
    };
    place();
    const timer = gameTimer(api, TIME, () => api.end(false, 'Die Zeit ist abgelaufen'));
    api.loop(dt => { timer.tick(dt); api.hud(timer.label(), `${moves} Züge`); });
  },
};

// ---------- 12: Glühwein-Timing ----------
GAMES[12] = {
  title: 'Glühwein einschenken', emoji: '🍷',
  rules: 'Der Zeiger flitzt hin und her. Tippe genau dann, wenn er im grünen Bereich ist. Der Bereich wird immer kleiner, der Zeiger immer schneller. Maximal 2 Fehler.',
  goal: '9 Treffer',
  play(api) {
    const GOAL = 9, MISS = 3;
    const { ctx, W, H } = api;
    let hits = 0, misses = 0, p = 0, dir = 1, speed = 0.75, zone, zw = 0.22, cool = 0, lastMsg = '', fill = 0;
    const newZone = () => { zw = Math.max(0.075, 0.22 - hits * 0.017); zone = rnd(0.05, 0.95 - zw); };
    newZone();
    const upd = () => api.hud(`🍷 ${hits}/${GOAL}`, '❤️'.repeat(Math.max(0, MISS - misses)) + '🤍'.repeat(Math.min(MISS, misses)));
    upd();
    api.on('down', () => {
      if (cool > 0 || api.ended) return;
      cool = 0.35;
      if (p >= zone && p <= zone + zw) { hits++; lastMsg = 'Perfekt eingeschenkt!'; fill = hits / GOAL; speed += 0.12; if (hits >= GOAL) { upd(); return api.end(true); } newZone(); }
      else { misses++; lastMsg = 'Daneben!'; if (misses >= MISS) { upd(); return api.end(false, `${hits} von ${GOAL} Treffern`); } }
      upd();
    });
    api.loop(dt => {
      cool -= dt;
      p += dir * speed * dt; if (p > 1) { p = 1; dir = -1; } if (p < 0) { p = 0; dir = 1; }
      api.bg('#3a1220', '#14060b');
      // Becher
      const cx = W / 2, cy = H * 0.36, cw = 120, chh = 140;
      api.roundRect(cx - cw / 2, cy - chh / 2, cw, chh, 18, '#fff3');
      ctx.fillStyle = '#9b1b30'; const fh = (chh - 10) * fill; api.roundRect(cx - cw / 2 + 5, cy + chh / 2 - 5 - fh, cw - 10, fh, 12, '#9b1b30');
      ctx.strokeStyle = '#fff8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + cw / 2 + 10, cy, 26, -1.2, 1.2); ctx.stroke();
      api.emoji('🍷', cx, cy - chh / 2 - 30, 34);
      // Balken
      const bx = 24, bw = W - 48, by = H * 0.68, bh = 46;
      api.roundRect(bx, by, bw, bh, 14, '#ffffff22');
      api.roundRect(bx + zone * bw, by, zw * bw, bh, 10, '#2fbf71');
      const mx = bx + p * bw; ctx.fillStyle = '#f6c453'; ctx.fillRect(mx - 3, by - 14, 6, bh + 28);
      api.text(lastMsg, W / 2, by + bh + 50, 22, '#f6c453');
      api.text('Tippen!', W / 2, H - 40, 18, '#ffffff77');
    });
  },
};
