// Tage 1–6
// Jedes Spiel: { title, emoji, rules, goal, play(api) } -> ruft api.end(true|false, text) auf

// ---------- 1: Snake ----------
GAMES[1] = {
  title: 'Liebes-Snake', emoji: '🐍',
  rules: 'Steuere Lukas mit Wischen zu dir. Jedes Mal, wenn er dich erreicht, wird die Schlange länger und schneller. Nicht gegen die Wand oder dich selbst fahren!',
  goal: '12× einsammeln',
  play(api) {
    const GOAL = 12, COLS = 13;
    const { ctx, W, H } = api;
    const cs = Math.floor(W / COLS), ROWS = Math.floor((H - 10) / cs);
    const ox = (W - cs * COLS) / 2, oy = (H - cs * ROWS) / 2;
    let snake = [{ x: 5, y: Math.floor(ROWS / 2) }, { x: 4, y: Math.floor(ROWS / 2) }, { x: 3, y: Math.floor(ROWS / 2) }];
    let dir = { x: 1, y: 0 }, queue = [], food, eaten = 0, acc = 0, interval = 0.19;
    const herFace = api.face('sie'), hisFace = api.face('er');
    const placeFood = () => { do { food = { x: rndi(0, COLS - 1), y: rndi(0, ROWS - 1) }; } while (snake.some(s => s.x === food.x && s.y === food.y)); };
    placeFood();
    const D = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    api.on('swipe', d => {
      const last = queue.length ? queue[queue.length - 1] : dir, nd = D[d];
      if (nd.x === -last.x && nd.y === -last.y) return;
      if (nd.x === last.x && nd.y === last.y) return;
      if (queue.length < 2) queue.push(nd);
    });
    api.hud(`💛 0/${GOAL}`, '');
    api.loop(dt => {
      acc += dt;
      if (acc >= interval) {
        acc -= interval;
        if (queue.length) dir = queue.shift();
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || snake.some(s => s.x === h.x && s.y === h.y)) return api.end(false, `${eaten} von ${GOAL} eingesammelt`);
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) {
          eaten++; api.hud(`💛 ${eaten}/${GOAL}`);
          if (eaten >= GOAL) return api.end(true);
          interval = Math.max(0.11, interval - 0.006); placeFood();
        } else snake.pop();
      }
      // zeichnen
      api.bg('#173d2c', '#0c2219');
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) { ctx.fillStyle = '#ffffff08'; ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs); }
      ctx.strokeStyle = '#f6c45399'; ctx.lineWidth = 2; ctx.strokeRect(ox, oy, cs * COLS, cs * ROWS);
      api.drawFace(herFace, ox + food.x * cs + cs / 2, oy + food.y * cs + cs / 2, cs * 0.55, '#ff8fab', 2);
      for (let i = snake.length - 1; i > 0; i--) {
        const s = snake[i]; ctx.fillStyle = i % 2 ? '#d7263d' : '#f2f2f2';
        ctx.beginPath(); ctx.arc(ox + s.x * cs + cs / 2, oy + s.y * cs + cs / 2, cs * 0.42, 0, 7); ctx.fill();
      }
      api.drawFace(hisFace, ox + snake[0].x * cs + cs / 2, oy + snake[0].y * cs + cs / 2, cs * 0.6, '#f6c453', 2);
    });
  },
};

// ---------- 2: Flatter-Flug ----------
GAMES[2] = {
  title: 'Schlittenflug', emoji: '🛷',
  rules: 'Tippe auf den Bildschirm, um nach oben zu flattern. Flieg durch die Lücken zwischen den Zuckerstangen. Nichts berühren!',
  goal: '12 Zuckerstangen passieren',
  play(api) {
    const GOAL = 12;
    const { ctx, W, H } = api;
    const R = Math.min(24, W * 0.06), x = W * 0.28;
    let y = H * 0.45, vy = 0, passed = 0, started = false;
    const G = 1450, FLAP = -440, PW = 58, GAP = Math.max(165, H * 0.26);
    let speed = 155;
    const pipes = [];
    let spawnX = W + 40;
    const addPipe = px => pipes.push({ x: px, gy: rnd(H * 0.18, H * 0.82 - GAP), done: false });
    for (let i = 0; i < 3; i++) addPipe(spawnX + i * 230);
    const face = api.face('sie');
    api.on('down', () => { started = true; vy = FLAP; });
    api.hud(`🍭 0/${GOAL}`, '');
    const stripes = (px, py, w, h) => {
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, w, h); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(px, py, w, h); ctx.fillStyle = '#d7263d';
      for (let s = -w; s < h + w; s += 22) { ctx.beginPath(); ctx.moveTo(px, py + s); ctx.lineTo(px + w, py + s - w * 0.6); ctx.lineTo(px + w, py + s - w * 0.6 + 10); ctx.lineTo(px, py + s + 10); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = '#0004'; ctx.lineWidth = 2; ctx.strokeRect(px, py, w, h);
    };
    api.loop(dt => {
      if (started) {
        vy += G * dt; y += vy * dt;
        for (const p of pipes) p.x -= speed * dt;
        if (pipes[0].x < -PW) { pipes.shift(); addPipe(pipes[pipes.length - 1].x + 230); }
        for (const p of pipes) {
          if (!p.done && p.x + PW < x - R) { p.done = true; passed++; speed += 4; api.hud(`🍭 ${passed}/${GOAL}`); if (passed >= GOAL) return api.end(true); }
          if (x + R * 0.8 > p.x && x - R * 0.8 < p.x + PW && (y - R * 0.8 < p.gy || y + R * 0.8 > p.gy + GAP)) return api.end(false, `${passed} von ${GOAL} geschafft`);
        }
        if (y > H - 30 - R * 0.8 || y < R * 0.5) return api.end(false, `${passed} von ${GOAL} geschafft`);
      }
      api.bg('#1b3b6f', '#0b1530');
      ctx.fillStyle = '#ffffff22'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % W, (i * 53) % H, 2, 2);
      for (const p of pipes) { stripes(p.x, 0, PW, p.gy); stripes(p.x, p.gy + GAP, PW, H - p.gy - GAP); }
      ctx.fillStyle = '#f4f8ff'; ctx.fillRect(0, H - 30, W, 30);
      ctx.save(); ctx.translate(x, y); ctx.rotate(clamp(vy / 900, -0.5, 0.8)); api.drawFace(face, 0, 0, R, '#f6c453'); ctx.restore();
      if (!started) api.text('Tippen zum Starten', W / 2, H * 0.7, 22);
    });
  },
};

// ---------- 3: Foto-Memory ----------
GAMES[3] = {
  title: 'Foto-Memory', emoji: '🧠',
  rules: 'Decke immer zwei Karten auf und finde die Paare. Vorsicht, wir sehen uns auf manchen Karten ziemlich ähnlich! Du hast nur begrenzt Versuche.',
  goal: 'Alle 8 Paare in max. 17 Versuchen',
  play(api) {
    const MAX = 17;
    const root = api.dom();
    const imgs = [...CONFIG.faces.er, ...CONFIG.faces.sie, ...CONFIG.photos].slice(0, 8);
    while (imgs.length < 8) imgs.push(imgs[imgs.length % 3]);
    const deck = shuffle([...imgs.map((s, i) => ({ s, i })), ...imgs.map((s, i) => ({ s, i }))]);
    const size = Math.min((api.W - 40) / 4, (api.H - 40) / 4);
    root.innerHTML = `<div style="display:grid;grid-template-columns:repeat(4,${size}px);gap:8px"></div>`;
    const grid = root.firstChild;
    let open = [], tries = 0, pairs = 0, lock = false;
    api.hud(`🔁 0/${MAX}`, '💞 0/8');
    deck.forEach(card => {
      const el = document.createElement('div');
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:14px;background:linear-gradient(145deg,#d7263d,#8d1526);display:flex;align-items:center;justify-content:center;font-size:${size * 0.45}px;box-shadow:0 3px 0 #0006;transition:transform .2s;background-size:cover;background-position:center`;
      el.textContent = '🎄';
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (lock || el.dataset.open || api.ended) return;
        el.dataset.open = 1; el.textContent = ''; el.style.backgroundImage = `url(${card.s})`; el.style.transform = 'scale(1.04)';
        open.push({ el, card });
        if (open.length === 2) {
          tries++; api.hud(`🔁 ${tries}/${MAX}`);
          const [a, b] = open; open = [];
          if (a.card.i === b.card.i) {
            pairs++; api.hud(undefined, `💞 ${pairs}/8`);
            [a, b].forEach(o => { o.el.style.outline = '3px solid #2fbf71'; o.el.style.transform = 'scale(.96)'; });
            if (pairs === 8) return api.end(true, `In ${tries} Versuchen!`);
            if (tries >= MAX) return api.end(false, `${pairs} von 8 Paaren`);
          } else {
            if (tries >= MAX) { lock = true; return api.after(500, () => api.end(false, `${pairs} von 8 Paaren`)); }
            lock = true;
            api.after(850, () => { [a, b].forEach(o => { delete o.el.dataset.open; o.el.style.backgroundImage = ''; o.el.textContent = '🎄'; o.el.style.transform = ''; }); lock = false; });
          }
        }
      });
      grid.appendChild(el);
    });
  },
};

// ---------- 4: Hau-den-Lukas ----------
GAMES[4] = {
  title: 'Küss den Lukas', emoji: '❤️',
  rules: 'Lukas schaut kurz aus den Geschenken raus – tipp ihn schnell an! Aber Finger weg von der Kohle 🪨 – zweimal Kohle und es ist vorbei.',
  goal: '24 Treffer in 30 Sekunden',
  play(api) {
    const GOAL = 24, TIME = 30;
    const { ctx, W, H } = api;
    const cols = 3, rows = 4, cw = W / cols, ch = (H - 20) / rows, r = Math.min(cw, ch) * 0.34;
    const holes = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) holes.push({ x: cw * i + cw / 2, y: 20 + ch * j + ch / 2, item: null });
    let hits = 0, lives = 2, spawnT = 0, elapsed = 0;
    const timer = gameTimer(api, TIME, () => api.end(false, `${hits} von ${GOAL} Treffern`));
    const upd = () => api.hud(`❤️ ${hits}/${GOAL}`, '❤️'.repeat(lives) + '  ' + timer.label());
    api.on('down', (x, y) => {
      for (const h of holes) if (h.item && !h.item.hit && dist(x, y, h.x, h.y) < r * 1.25) {
        h.item.hit = true; h.item.life = Math.min(h.item.life, 0.15);
        if (h.item.bad) { lives--; api.flash('🪨 Autsch!'); if (lives <= 0) return api.end(false, 'Zu viel Kohle erwischt'); }
        else { hits++; if (hits >= GOAL) return api.end(true); }
        upd(); return;
      }
    });
    api.loop(dt => {
      elapsed += dt; timer.tick(dt); if (api.ended) return;
      const p = elapsed / TIME, stay = 0.95 - 0.42 * p;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 0.62 - 0.28 * p;
        const free = holes.filter(h => !h.item); if (free.length) { const h = pick(free); h.item = { bad: Math.random() < 0.27, life: stay, max: stay, hit: false, face: api.face('er') }; }
      }
      for (const h of holes) if (h.item) { h.item.life -= dt; if (h.item.life <= 0) h.item = null; }
      upd();
      api.bg('#2a1a12', '#140b07');
      for (const h of holes) {
        ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.ellipse(h.x, h.y + r * 0.9, r * 1.1, r * 0.35, 0, 0, 7); ctx.fill();
        if (h.item) {
          const k = Math.min(1, (h.item.max - h.item.life) / 0.12, h.item.life / 0.12);
          const yy = h.y + r * (1 - k) * 0.8;
          ctx.save(); ctx.beginPath(); ctx.rect(h.x - r * 1.3, h.y - r * 1.6, r * 2.6, r * 2.5); ctx.clip();
          if (h.item.bad) api.emoji('🪨', h.x, yy, r * 1.7); else api.drawFace(h.item.face, h.x, yy, r, h.item.hit ? '#2fbf71' : '#fff', 3);
          ctx.restore();
          if (h.item.hit && !h.item.bad) api.emoji('❤️', h.x + r * 0.6, h.y - r * 0.6, r * 0.8);
        }
        api.roundRect(h.x - r * 1.15, h.y + r * 0.75, r * 2.3, r * 0.75, 8, '#d7263d');
        ctx.fillStyle = '#f6c453'; ctx.fillRect(h.x - 5, h.y + r * 0.75, 10, r * 0.75);
      }
    });
  },
};

// ---------- 5: Geschenke-Fänger ----------
GAMES[5] = {
  title: 'Geschenke-Regen', emoji: '🎁',
  rules: 'Zieh dich mit dem Finger nach links und rechts und fang die Geschenke. Kohle 🪨 auffangen oder Geschenke fallen lassen kostet ein Leben (3 Leben).',
  goal: '30 Geschenke fangen',
  play(api) {
    const GOAL = 30;
    const { ctx, W, H } = api;
    const R = Math.min(34, W * 0.085);
    let px = W / 2, target = W / 2, caught = 0, lives = 3, t = 0, spawnT = 0;
    const items = [], face = api.face('sie');
    const upd = () => api.hud(`🎁 ${caught}/${GOAL}`, '❤️'.repeat(Math.max(0, lives)));
    api.on('down', x => target = x); api.on('move', (x, y, d) => { if (d) target = x; });
    upd();
    const hurt = msg => { lives--; upd(); api.flash(msg, 500); if (lives <= 0) api.end(false, `${caught} von ${GOAL} gefangen`); };
    api.loop(dt => {
      t += dt; px += (target - px) * Math.min(1, dt * 16); px = clamp(px, R, W - R);
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.42, 0.95 - t * 0.012);
        const bad = Math.random() < Math.min(0.38, 0.2 + t * 0.004);
        items.push({ x: rnd(20, W - 20), y: -30, vy: rnd(170, 230) + t * 5.5, bad, e: bad ? '🪨' : pick(['🎁', '🎁', '🍬', '🧸', '🍪']) });
      }
      const py = H - R - 16;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.y += it.vy * dt;
        if (dist(it.x, it.y, px, py) < R + 16) {
          items.splice(i, 1);
          if (it.bad) hurt('🪨 Kohle!'); else { caught++; upd(); if (caught >= GOAL) return api.end(true); }
          if (api.ended) return; continue;
        }
        if (it.y > H + 20) { items.splice(i, 1); if (!it.bad) { hurt('Verpasst!'); if (api.ended) return; } }
      }
      api.bg('#203a5c', '#0e1b2c');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, H - 10, W, 10);
      for (const it of items) api.emoji(it.e, it.x, it.y, 34);
      api.drawFace(face, px, py, R, '#f6c453', 4);
    });
  },
};

// ---------- 6: Turmbau ----------
GAMES[6] = {
  title: 'Geschenke-Turm', emoji: '🏗️',
  rules: 'Ein Geschenk schwebt hin und her – tippe, um es fallen zu lassen. Was übersteht, wird abgeschnitten. Wird der Turm zu schmal oder triffst du daneben, ist es vorbei.',
  goal: '15 Geschenke stapeln',
  play(api) {
    const GOAL = 15;
    const { ctx, W, H } = api;
    const BH = Math.min(38, H / 18);
    const colors = ['#d7263d', '#2fbf71', '#f6c453', '#3d7dd8', '#c64fd1', '#ff8a3d'];
    const stack = [{ x: W * 0.2, w: W * 0.6 }];
    let cur = { x: 0, w: W * 0.6, dir: 1 }, speed = 175, cam = 0, falling = null;
    const face = api.face('sie');
    api.hud(`🎁 0/${GOAL}`, '');
    api.on('down', () => {
      if (api.ended || falling) return;
      const top = stack[stack.length - 1];
      let l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      if (Math.abs(cur.x - top.x) < 5) { l = top.x; r = top.x + top.w; api.flash('✨ Perfekt!', 400); }
      if (r - l < 6) { falling = { x: cur.x, w: cur.w, y: 0 }; return api.end(false, `${stack.length - 1} von ${GOAL} gestapelt`); }
      stack.push({ x: l, w: r - l });
      const n = stack.length - 1; api.hud(`🎁 ${n}/${GOAL}`);
      if (n >= GOAL) return api.end(true);
      speed += 13; cur = { x: Math.random() < 0.5 ? -(r - l) : W, w: r - l, dir: 1 };
      cur.dir = cur.x < 0 ? 1 : -1;
    });
    const drawBox = (x, y, w, c) => {
      api.roundRect(x, y, w, BH - 2, 5, c); ctx.fillStyle = '#ffffffcc'; ctx.fillRect(x + w / 2 - 3, y, 6, BH - 2);
    };
    api.loop(dt => {
      cur.x += cur.dir * speed * dt;
      if (cur.x + cur.w > W + 10) cur.dir = -1; if (cur.x < -10) cur.dir = 1;
      const targetCam = Math.max(0, stack.length * BH - H * 0.55); cam += (targetCam - cam) * Math.min(1, dt * 5);
      api.bg('#2b2150', '#120d26');
      const base = H - 30 + cam;
      ctx.fillStyle = '#e9f0ff'; ctx.fillRect(0, base, W, 40);
      stack.forEach((b, i) => drawBox(b.x, base - (i + 1) * BH, b.w, i === 0 ? '#6b4a2b' : colors[i % colors.length]));
      const cy = base - (stack.length + 1) * BH;
      drawBox(cur.x, cy, cur.w, colors[stack.length % colors.length]);
      api.drawFace(face, cur.x + cur.w / 2, cy - 18, 16, '#fff', 2);
    });
  },
};
