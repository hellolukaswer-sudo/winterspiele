// Kleine Spiel-Engine: Canvas, Loop, Eingabe, Hilfsfunktionen
const GAMES = {};
const ASSETS = { faces: { er: [], sie: [] }, photos: [] };

function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
// Verschlüsselte Bilder entschlüsseln (Datei = 16 Byte IV + AES-256-CBC) und als Blob-URL bereitstellen
async function decryptTo(url, key, mime) {
  try {
    const buf = await (await fetch(url, { cache: 'no-cache' })).arrayBuffer();
    const plain = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: buf.slice(0, 16) }, key, buf.slice(16));
    return URL.createObjectURL(new Blob([plain], { type: mime }));
  } catch (e) { return null; }
}
async function loadAssets(keyB64) {
  ASSETS.ok = false;
  if (!keyB64 || !window.crypto || !crypto.subtle) return false;
  let key;
  try {
    const raw = Uint8Array.from(atob(keyB64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - keyB64.length % 4) % 4)), c => c.charCodeAt(0));
    key = await crypto.subtle.importKey('raw', raw, 'AES-CBC', false, ['decrypt']);
  } catch (e) { return false; }
  const dec = (list, mime) => Promise.all(list.map(u => decryptTo(u, key, mime)));
  const [er, sie, ph] = await Promise.all([dec(CONFIG.faces.er, 'image/png'), dec(CONFIG.faces.sie, 'image/png'), dec(CONFIG.photos, 'image/jpeg')]);
  if (!er[0] || !sie[0] || !ph[0]) return false;
  // Ab hier zeigen alle Pfade auf die entschlüsselten Bilder
  CONFIG.faces.er = er.filter(Boolean); CONFIG.faces.sie = sie.filter(Boolean); CONFIG.photos = ph.filter(Boolean);
  const [ie, is, ip] = await Promise.all([Promise.all(CONFIG.faces.er.map(loadImg)), Promise.all(CONFIG.faces.sie.map(loadImg)), Promise.all(CONFIG.photos.map(loadImg))]);
  ASSETS.faces.er = ie.filter(Boolean); ASSETS.faces.sie = is.filter(Boolean); ASSETS.photos = ip.filter(Boolean);
  ASSETS.ok = true;
  return true;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// opts.demo = stille Vorschau (keine Eingaben, kein HUD, kein Overlay), opts.w/h = feste Größe
function makeApi(stage, onEnd, opts = {}) {
  const demo = !!opts.demo;
  stage.innerHTML = '';
  const cv = document.createElement('canvas');
  stage.appendChild(cv);
  const snow = document.createElement('div'); snow.className = 'snowfall'; stage.appendChild(snow);
  const r = stage.getBoundingClientRect();
  const W = Math.round(opts.w || r.width || window.innerWidth), H = Math.round(opts.h || r.height || window.innerHeight - 60);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let ended = false, raf = 0;
  const timers = [], intervals = [];
  const H_ = { down: [], move: [], up: [], swipe: [] };
  let sw = null, pointerDown = false;

  const pos = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const onDown = e => {
    e.preventDefault(); if (ended) return; pointerDown = true;
    const p = pos(e); sw = { x: p.x, y: p.y }; H_.down.forEach(f => f(p.x, p.y));
  };
  const onMove = e => {
    e.preventDefault(); if (ended) return; const p = pos(e);
    H_.move.forEach(f => f(p.x, p.y, pointerDown));
    if (sw && pointerDown) {
      const dx = p.x - sw.x, dy = p.y - sw.y;
      if (Math.hypot(dx, dy) > 26) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        H_.swipe.forEach(f => f(dir)); sw = { x: p.x, y: p.y };
      }
    }
  };
  const onUp = e => { if (ended) return; pointerDown = false; const p = pos(e); sw = null; H_.up.forEach(f => f(p.x, p.y)); };
  const onKey = e => {
    const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
    if (m) { e.preventDefault(); H_.swipe.forEach(f => f(m)); }
    if (e.key === ' ') { e.preventDefault(); H_.down.forEach(f => f(W / 2, H / 2)); H_.up.forEach(f => f(W / 2, H / 2)); }
  };
  if (!demo) {
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
  }
  const cleanup = () => {
    ended = true; cancelAnimationFrame(raf);
    timers.forEach(clearTimeout); intervals.forEach(clearInterval);
    stage.removeEventListener('pointerdown', onDown); stage.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('keydown', onKey);
  };

  const api = {
    cv, ctx, W, H, stage,
    faces: ASSETS.faces, photos: ASSETS.photos,
    get ended() { return ended; },
    get pressed() { return pointerDown; },
    on(type, fn) { H_[type].push(fn); },
    loop(fn) {
      let last = performance.now(); let t = 0;
      const step = now => {
        if (ended) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        fn(dt, t);
        if (!ended) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    },
    after(ms, fn) { const id = setTimeout(() => { if (!ended) fn(); }, ms); timers.push(id); return id; },
    every(ms, fn) { const id = setInterval(() => { if (!ended) fn(); }, ms); intervals.push(id); return id; },
    hud(l, r, t) {
      if (demo) return;
      if (l !== undefined) document.getElementById('hud-l').textContent = l;
      if (r !== undefined) document.getElementById('hud-r').textContent = r;
      if (t !== undefined) document.getElementById('hud-t').textContent = t;
    },
    // DOM-Modus (für Memory, Quiz, etc.)
    dom() { cv.style.display = 'none'; const d = document.createElement('div'); d.className = 'dom'; stage.appendChild(d); return d; },
    face(who, i) { const a = ASSETS.faces[who]; return a.length ? a[(i === undefined ? Math.floor(Math.random() * a.length) : i) % a.length] : null; },
    drawFace(img, x, y, r, ring = '#fff', ringW = 3) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
      if (img) { ctx.save(); ctx.clip(); ctx.drawImage(img, x - r, y - r, r * 2, r * 2); ctx.restore(); }
      else { ctx.fillStyle = '#f2c'; ctx.fill(); }
      if (ring) { ctx.lineWidth = ringW; ctx.strokeStyle = ring; ctx.stroke(); }
      ctx.restore();
    },
    emoji(ch, x, y, size, rot = 0) {
      ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
      ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * 0.05); ctx.restore();
    },
    text(s, x, y, size = 20, color = '#fff', align = 'center') {
      ctx.save(); ctx.font = `700 ${size}px 'Plus Jakarta Sans', system-ui, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.fillText(s, x, y); ctx.restore();
    },
    bg(c1 = '#13392a', c2 = '#081a12') {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
    roundRect(x, y, w, h, r, fill, stroke) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    },
    flash(msg, ms = 700) {
      const o = document.createElement('div'); o.className = 'overlay pop'; o.style.background = 'transparent'; o.style.fontSize = '34px';
      o.style.pointerEvents = 'none'; o.style.textShadow = '0 3px 8px #000'; o.textContent = msg; stage.appendChild(o);
      setTimeout(() => o.remove(), ms);
    },
    kill() { cleanup(); },
    end(win, msg) {
      if (ended) return; cleanup();
      if (demo) { onEnd(win, msg); return; }
      if (navigator.vibrate) try { navigator.vibrate(win ? [60, 40, 60] : 250); } catch (e) {}
      const ov = document.getElementById('overlay');
      ov.className = 'overlay pop ' + (win ? 'win' : 'lose');
      ov.innerHTML = (win ? '🎉<br>Gewonnen!' : '💔<br>Verloren') + (msg ? `<small>${msg}</small>` : '');
      setTimeout(() => onEnd(win, msg), 1900);
    },
  };
  return api;
}

// Countdown-Overlay vor dem Spiel
function countdown(cb) {
  const ov = document.getElementById('overlay');
  let n = 3; ov.className = 'overlay'; ov.textContent = n;
  const iv = setInterval(() => {
    n--;
    if (n > 0) { ov.textContent = n; ov.classList.remove('pop'); void ov.offsetWidth; ov.classList.add('pop'); }
    else { clearInterval(iv); ov.className = 'overlay hidden'; cb(); }
  }, 750);
}

// Gemeinsamer Countdown-Timer für Spiele mit Zeitlimit
function gameTimer(api, seconds, onTimeout) {
  const t = { left: seconds, paused: false };
  t.tick = dt => { if (t.paused) return; t.left -= dt; if (t.left <= 0) { t.left = 0; onTimeout(); } };
  t.label = () => '⏱ ' + Math.ceil(t.left);
  return t;
}
