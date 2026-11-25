// Tage 13–18

// ---------- 13: Kopfrechnen ----------
GAMES[13] = {
  title: 'Rentier-Rechnen', emoji: '🧮',
  rules: 'Rechne so schnell du kannst und tippe die richtige Antwort. Es wird schwieriger! Drei falsche Antworten und du hast verloren.',
  goal: '16 richtige in 45 Sekunden',
  play(api) {
    const GOAL = 16, TIME = 45, MAXW = 3;
    const root = api.dom();
    root.innerHTML = `<div id="q" style="font-size:52px;font-weight:700;margin-bottom:20px;text-shadow:0 3px 0 #0006"></div><div id="a" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:380px"></div>`;
    const q = root.querySelector('#q'), a = root.querySelector('#a');
    let ok = 0, wrong = 0, ans;
    const timer = gameTimer(api, TIME, () => api.end(false, `${ok} von ${GOAL} richtig`));
    const upd = () => api.hud(`✅ ${ok}/${GOAL}  ❌ ${wrong}/${MAXW}`, timer.label());
    const make = () => {
      const lvl = ok; let x, y, op;
      const r = Math.random();
      if (lvl < 4) { op = r < .5 ? '+' : '−'; x = rndi(8, 40); y = rndi(5, 30); }
      else if (lvl < 9) { op = r < .35 ? '+' : r < .65 ? '−' : '×'; x = op === '×' ? rndi(3, 9) : rndi(20, 80); y = op === '×' ? rndi(3, 9) : rndi(11, 49); }
      else { op = r < .3 ? '+' : r < .55 ? '−' : '×'; x = op === '×' ? rndi(6, 14) : rndi(40, 160); y = op === '×' ? rndi(4, 12) : rndi(17, 89); }
      if (op === '−' && y > x) [x, y] = [y, x];
      ans = op === '+' ? x + y : op === '−' ? x - y : x * y;
      q.textContent = `${x} ${op} ${y}`;
      const opts = new Set([ans]);
      while (opts.size < 4) { const d = pick([1, 2, 10, 9, 11, -1, -2, -10, -9, 3, x, -y]); const v = ans + d; if (v >= 0) opts.add(v); }
      a.innerHTML = '';
      shuffle([...opts]).forEach(v => {
        const b = document.createElement('button'); b.className = 'btn'; b.style.fontSize = '28px'; b.style.margin = 0; b.textContent = v;
        b.addEventListener('pointerdown', e => {
          e.stopPropagation(); if (api.ended) return;
          if (v === ans) { ok++; if (ok >= GOAL) { upd(); return api.end(true); } }
          else { wrong++; api.flash('❌', 300); if (wrong >= MAXW) { upd(); return api.end(false, 'Drei Fehler'); } }
          upd(); make();
        });
        a.appendChild(b);
      });
    };
    make(); upd();
    api.loop(dt => { timer.tick(dt); upd(); });
  },
};

// ---------- 14: Endlos-Läufer ----------
GAMES[14] = {
  title: 'Weihnachtsmarkt-Sprint', emoji: '🏃',
  rules: 'Lukas rennt zum Glühweinstand! Tippe, um über Tannen, Schneemänner und Geschenke zu springen. Einmal hängen bleiben und es ist vorbei.',
  goal: '40 Sekunden durchhalten',
  play(api) {
    const TIME = 40;
    const { ctx, W, H } = api;
    const GY = H * 0.72, R = 22, X = W * 0.22;
    let y = GY - R, vy = 0, t = 0, speed = 270, nextIn = 1.2, rot = 0;
    const obs = [], face = api.face('er');
    const kinds = [{ e: '🎄', w: 30, h: 46 }, { e: '⛄', w: 30, h: 42 }, { e: '🎁', w: 30, h: 28 }, { e: '🦌', w: 40, h: 44 }];
    api.on('down', () => { if (y >= GY - R - 1) vy = -680; });
    api.loop(dt => {
      t += dt; if (t >= TIME) return api.end(true, 'Glühwein erreicht! 🍷');
      api.hud(`⏱ ${Math.ceil(TIME - t)}`, '');
      speed = 270 + t * 7.5;
      vy += 2000 * dt; y += vy * dt; if (y > GY - R) { y = GY - R; vy = 0; }
      rot += speed * dt / R;
      nextIn -= dt;
      if (nextIn <= 0) {
        const k = pick(kinds); obs.push({ x: W + 30, ...k });
        if (t > 15 && Math.random() < 0.25) obs.push({ x: W + 30 + k.w + 4, ...pick(kinds.slice(2)) }); // Doppelhindernis
        nextIn = rnd(0.75, 1.6) * Math.max(0.6, 1 - t * 0.008);
      }
      for (let i = obs.length - 1; i >= 0; i--) {
        const o = obs[i]; o.x -= speed * dt;
        if (o.x < -60) { obs.splice(i, 1); continue; }
        const cx = clamp(X, o.x - o.w / 2 + 4, o.x + o.w / 2 - 4), cy = clamp(y, GY - o.h + 6, GY);
        if (dist(X, y, cx, cy) < R * 0.82) return api.end(false, `Nach ${Math.floor(t)} Sekunden gestolpert`);
      }
      api.bg('#1a2550', '#3b4f8a');
      ctx.fillStyle = '#ffffff10'; for (let i = 0; i < 6; i++) { const bx = ((i * 140 - t * speed * 0.2) % (W + 140) + W + 140) % (W + 140) - 70; ctx.fillRect(bx, GY - 120, 60, 120); }
      ctx.fillStyle = '#f4f8ff'; ctx.fillRect(0, GY, W, H - GY);
      for (const o of obs) api.emoji(o.e, o.x, GY - o.h / 2, o.h);
      ctx.save(); ctx.translate(X, y); ctx.rotate(rot); api.drawFace(face, 0, 0, R, '#f6c453', 3); ctx.restore();
      if (t < 2) api.text('Tippen = springen', W / 2, H * 0.3, 22);
    });
  },
};

// ---------- 15: Pong ----------
GAMES[15] = {
  title: 'Paar-Pong', emoji: '🏓',
  rules: 'Du (unten) gegen Lukas (oben)! Zieh dein Paddel hin und her. Triffst du den Ball am Rand des Paddels, fliegt er schräger. Wer zuerst 5 Punkte hat, gewinnt.',
  goal: 'Zuerst 5 Punkte',
  play(api) {
    const WIN = 5;
    const { ctx, W, H } = api;
    const PW = W * 0.26, PH = 14, R = 11;
    let me = W / 2, target = W / 2, ai = W / 2, sMe = 0, sAi = 0, bx, by, vx, vy, speed, serveT = 0, aiErr = 0;
    const fMe = api.face('sie'), fAi = api.face('er');
    const serve = toMe => { bx = W / 2; by = H / 2; speed = 330; const a = rnd(-0.6, 0.6); vx = Math.sin(a) * speed; vy = (toMe ? 1 : -1) * Math.cos(a) * speed; serveT = 0.9; aiErr = rnd(-38, 38); };
    serve(true);
    const upd = () => api.hud(`Du ${sMe} : ${sAi} Lukas`, '');
    upd();
    api.on('down', x => target = x); api.on('move', (x, y, d) => { if (d) target = x; });
    const topY = 40, botY = H - 40 - PH;
    api.loop(dt => {
      me += (target - me) * Math.min(1, dt * 18); me = clamp(me, PW / 2, W - PW / 2);
      // KI: folgt mit begrenzter Geschwindigkeit
      const aim = vy < 0 ? bx + aiErr : W / 2;
      const aiSpeed = 250 + (sMe - sAi) * 12;
      ai += clamp(aim - ai, -aiSpeed * dt, aiSpeed * dt); ai = clamp(ai, PW / 2, W - PW / 2);
      if (serveT > 0) serveT -= dt;
      else {
        bx += vx * dt; by += vy * dt;
        if (bx < R) { bx = R; vx = Math.abs(vx); } if (bx > W - R) { bx = W - R; vx = -Math.abs(vx); }
        if (vy > 0 && by + R >= botY && by < botY + PH && Math.abs(bx - me) < PW / 2 + R) {
          const h = clamp((bx - me) / (PW / 2), -1, 1); speed = Math.min(620, speed + 22);
          vx = Math.sin(h * 1.1) * speed; vy = -Math.cos(h * 1.1) * speed; by = botY - R; aiErr = rnd(-42, 42);
        }
        if (vy < 0 && by - R <= topY + PH && by > topY && Math.abs(bx - ai) < PW / 2 + R) {
          const h = clamp((bx - ai) / (PW / 2), -1, 1) * 0.8 + rnd(-0.25, 0.25); speed = Math.min(620, speed + 14);
          vx = Math.sin(h) * speed; vy = Math.cos(h) * speed; by = topY + PH + R;
        }
        if (by > H + R) { sAi++; upd(); if (sAi >= WIN) return api.end(false, `${sMe} : ${sAi}`); api.flash('Punkt für Lukas', 600); serve(true); }
        if (by < -R) { sMe++; upd(); if (sMe >= WIN) return api.end(true, `${sMe} : ${sAi}`); api.flash('Punkt für dich!', 600); serve(false); }
      }
      api.bg('#0f3b25', '#0a2418');
      ctx.strokeStyle = '#ffffff33'; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
      api.roundRect(ai - PW / 2, topY, PW, PH, 7, '#3d7dd8'); api.drawFace(fAi, ai, topY - 16, 16, '#fff', 2);
      api.roundRect(me - PW / 2, botY, PW, PH, 7, '#d7263d'); api.drawFace(fMe, me, botY + PH + 18, 16, '#fff', 2);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, R, 0, 7); ctx.fill(); api.emoji('❄️', bx, by, 16);
    });
  },
};

// ---------- 16: Wer ist das? ----------
GAMES[16] = {
  title: 'Wer ist das?', emoji: '🔎',
  rules: 'Ein Gesichts-Ausschnitt taucht auf: Ist das Lukas oder du? Tippe unten auf den richtigen Namen, bevor der Ring abläuft. Mit jeder Runde wird der Ausschnitt kleiner und die Zeit knapper. 3 Fehler und es ist vorbei.',
  goal: '25 richtig erkennen',
  play(api) {
    const GOAL = 25, MAXF = 3;
    const { ctx, W, H } = api;
    const R = Math.min(W * 0.36, H * 0.25), cx = W / 2, cy = H * 0.38;
    const bh = 92, by = H - bh - 22, bw = (W - 48) / 2;
    const btns = [{ who: 'er', x: 16, label: CONFIG.himName }, { who: 'sie', x: 32 + bw, label: CONFIG.herName }];
    let ok = 0, fails = 0, cur = null, left = 0, fb = null;
    const next = () => {
      const who = Math.random() < 0.5 ? 'er' : 'sie';
      const zoom = 1.15 + Math.min(2.4, ok * 0.11);
      const span = 0.5 - 0.5 / zoom;
      cur = { who, img: api.face(who), zoom, fx: 0.5 + rnd(-span, span) * 0.8, fy: 0.5 + rnd(-span, span) * 0.8, mirror: ok > 8 && Math.random() < 0.5 };
      cur.max = left = Math.max(0.95, 2.4 - ok * 0.06);
    };
    const upd = () => api.hud(`✓ ${ok}/${GOAL}`, '❤️'.repeat(MAXF - fails) + '🤍'.repeat(fails));
    const answer = who => {
      if (!cur || fb) return;
      const right = who === cur.who;
      fb = { right, t: 0.35, who: cur.who };
      if (right) ok++; else fails++;
      upd();
      if (ok >= GOAL) return api.end(true, 'Ihr kennt euch wirklich gut!');
      if (fails >= MAXF) return api.end(false, `${ok} von ${GOAL} erkannt`);
    };
    api.on('down', (x, y) => { if (y < by - 6) return; for (const b of btns) if (x >= b.x && x <= b.x + bw) answer(b.who); });
    next(); upd();
    api.loop(dt => {
      if (fb) { fb.t -= dt; if (fb.t <= 0) { fb = null; next(); } }
      else { left -= dt; if (left <= 0) { fb = { right: false, t: 0.45, who: cur.who, slow: true }; fails++; upd(); if (fails >= MAXF) return api.end(false, `${ok} von ${GOAL} erkannt`); } }
      api.bg('#14324a', '#0a1726');
      // Bild-Ausschnitt
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
      ctx.fillStyle = '#223'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (cur.img) {
        const iw = cur.img.width, ih = cur.img.height, sw = iw / cur.zoom, sh = ih / cur.zoom;
        const sx = clamp(cur.fx * iw - sw / 2, 0, iw - sw), sy = clamp(cur.fy * ih - sh / 2, 0, ih - sh);
        if (cur.mirror) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }
        ctx.drawImage(cur.img, sx, sy, sw, sh, cx - R, cy - R, R * 2, R * 2);
      }
      ctx.restore();
      // Zeit-Ring
      ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, 7); ctx.stroke();
      const k = fb ? 0 : clamp(left / cur.max, 0, 1);
      ctx.strokeStyle = k > 0.35 ? '#f2b84b' : '#e5484d'; ctx.beginPath(); ctx.arc(cx, cy, R + 12, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
      if (fb) {
        ctx.strokeStyle = fb.right ? '#22a35a' : '#e5484d'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, 7); ctx.stroke();
        api.text(fb.right ? 'Richtig!' : (fb.slow ? 'Zu langsam!' : `Das war ${fb.who === 'er' ? CONFIG.himName : 'du'}!`), cx, cy + R + 48, 22, fb.right ? '#7ee2a5' : '#ff9a9d');
      } else api.text('Wer ist das?', cx, cy + R + 48, 20, 'rgba(255,255,255,.7)');
      // Buttons
      for (const b of btns) {
        api.roundRect(b.x, by, bw, bh, 22, b.who === 'er' ? '#2563eb' : '#e5487a');
        api.drawFace(api.face(b.who, 0), b.x + 40, by + bh / 2, 24, '#fff', 2);
        api.text(b.label, b.x + 72 + (bw - 72) / 2, by + bh / 2, 19, '#fff');
      }
    });
  },
};

// ---------- 17: Passt die Farbe? ----------
GAMES[17] = {
  title: 'Passt die Farbe?', emoji: '🎨',
  rules: 'Ein Farbwort erscheint in einer Schriftfarbe. Passen Wort und Schriftfarbe zusammen? „ROT“ in roter Schrift → JA. „ROT“ in blauer Schrift → NEIN. Antworte so schnell du kannst. Bei 3 Fehlern ist es vorbei.',
  goal: '22 richtige in 30 Sekunden',
  play(api) {
    const GOAL = 22, TIME = 30, MAXW = 3;
    const C = [['ROT', '#ef4444'], ['GRÜN', '#22c55e'], ['BLAU', '#3b82f6'], ['GELB', '#facc15'], ['LILA', '#a855f7']];
    const root = api.dom();
    root.innerHTML = `
      <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.7;font-weight:700">Passt die Schriftfarbe zum Wort?</div>
      <div id="w" style="font-family:var(--display);font-size:clamp(54px,17vw,84px);font-weight:800;padding:18px 26px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);min-width:70%;text-align:center"></div>
      <div id="fb" style="height:22px;font-size:15px;font-weight:600"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:420px">
        <button class="g-btn" id="no" style="background:#b42d35;font-size:24px;padding:22px 10px">✕ Nein</button>
        <button class="g-btn" id="yes" style="background:#16774a;font-size:24px;padding:22px 10px">✓ Ja</button>
      </div>`;
    const w = root.querySelector('#w'), fbEl = root.querySelector('#fb');
    let ok = 0, wrong = 0, word, ink;
    const timer = gameTimer(api, TIME, () => api.end(false, `${ok} von ${GOAL} richtig`));
    const upd = () => api.hud(`✓ ${ok}/${GOAL}  ✕ ${wrong}/${MAXW}`, timer.label());
    const make = () => {
      word = rndi(0, 4);
      ink = Math.random() < 0.45 ? word : (() => { let i; do i = rndi(0, 4); while (i === word); return i; })();
      w.textContent = C[word][0]; w.style.color = C[ink][1];
    };
    const answer = yes => {
      if (api.ended) return;
      const match = word === ink;
      if (yes === match) { ok++; fbEl.textContent = ''; if (ok >= GOAL) { upd(); return api.end(true); } }
      else {
        wrong++; fbEl.style.color = '#ff9a9d';
        fbEl.textContent = match ? `Doch! ${C[word][0]} war in ${C[ink][0]}` : `Nein: Wort ${C[word][0]}, Farbe ${C[ink][0]}`;
        if (wrong >= MAXW) { upd(); return api.end(false, 'Drei Fehler'); }
      }
      upd(); make();
    };
    root.querySelector('#yes').addEventListener('pointerdown', e => { e.stopPropagation(); answer(true); });
    root.querySelector('#no').addEventListener('pointerdown', e => { e.stopPropagation(); answer(false); });
    make(); upd();
    api.loop(dt => { timer.tick(dt); upd(); });
  },
};

// ---------- 18: Sternen-Sprung ----------
GAMES[18] = {
  title: 'Himmelsleiter', emoji: '⭐',
  rules: 'Du hüpfst automatisch. Zieh den Finger nach links und rechts, um auf den Wolken zu landen und immer höher zu kommen. Rissige Wolken brechen weg! Wer runterfällt, verliert.',
  goal: 'Erreiche Lukas auf dem Stern (Höhe 3000)',
  play(api) {
    const GOAL = 3000;
    const { ctx, W, H } = api;
    const R = 18, G = 1500, JUMP = -760;
    let x = W / 2, y = H - 100, vy = JUMP, cam = 0, target = W / 2, best = 0;
    const plats = [];
    let topY = H - 40;
    plats.push({ x: W / 2 - 40, y: H - 40, w: 80, type: 'n' });
    const addPlat = () => {
      const h = -topY + H; const diff = clamp(h / GOAL, 0, 1);
      topY -= rnd(55 + diff * 45, 95 + diff * 60);
      const r = Math.random();
      const type = diff > 0.2 && r < 0.18 + diff * 0.12 ? 'm' : diff > 0.3 && r > 0.85 ? 'b' : 'n';
      const w = 72 - diff * 16;
      plats.push({ x: rnd(4, W - w - 4), y: topY, w, type, dir: Math.random() < .5 ? 1 : -1 });
      if (type === 'b') { topY += 0; plats.push({ x: rnd(4, W - w - 4), y: topY - rnd(20, 40), w, type: 'n' }); topY -= 30; }
    };
    while (topY > -H) addPlat();
    const face = api.face('sie'), goalFace = api.face('er');
    api.on('down', px => target = px); api.on('move', (px, py, d) => { if (d) target = px; });
    api.loop(dt => {
      x += clamp(target - x, -520 * dt, 520 * dt);
      vy += G * dt; const oy = y; y += vy * dt;
      if (vy > 0) for (const p of plats) {
        if (p.broken) continue;
        if (oy + R <= p.y && y + R >= p.y && x > p.x - 8 && x < p.x + p.w + 8) {
          if (p.type === 'b') { p.broken = true; continue; }
          y = p.y - R; vy = JUMP; break;
        }
      }
      for (const p of plats) if (p.type === 'm') { p.x += p.dir * 70 * dt; if (p.x < 0 || p.x + p.w > W) p.dir *= -1; }
      const height = Math.round(H - 100 - y);
      best = Math.max(best, height);
      if (best >= GOAL) return api.end(true, 'Du hast den Stern erreicht!');
      const want = y - H * 0.42; if (want < cam) cam = want;
      while (topY > cam - 60) addPlat();
      for (let i = plats.length - 1; i >= 0; i--) if (plats[i].y > cam + H + 40) plats.splice(i, 1);
      if (y - cam > H + R) return api.end(false, `Höhe ${best} von ${GOAL}`);
      api.hud(`⭐ ${best}/${GOAL}`, '');
      const k = clamp(best / GOAL, 0, 1);
      api.bg(`hsl(${220 - k * 30},55%,${32 - k * 18}%)`, `hsl(${230 - k * 20},60%,${18 - k * 10}%)`);
      ctx.save(); ctx.translate(0, -cam);
      for (const p of plats) {
        if (p.broken) continue;
        api.roundRect(p.x, p.y, p.w, 14, 7, p.type === 'b' ? '#b9c4d6' : '#f4f8ff');
        if (p.type === 'b') { ctx.strokeStyle = '#6b7a90'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x + p.w * .4, p.y); ctx.lineTo(p.x + p.w * .5, p.y + 7); ctx.lineTo(p.x + p.w * .45, p.y + 14); ctx.stroke(); }
        if (p.type === 'm') api.emoji('↔️', p.x + p.w / 2, p.y + 7, 10);
      }
      const goalY = H - 100 - GOAL;
      if (goalY > cam - 80) { api.emoji('🌟', W / 2, goalY - 10, 60); api.drawFace(goalFace, W / 2, goalY - 10, 18, '#f6c453', 2); }
      api.drawFace(face, x, y, R, '#d7263d', 3);
      ctx.restore();
    });
  },
};
