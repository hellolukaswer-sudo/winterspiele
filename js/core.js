// Kalender-Logik: Türchen, Datumssperre, nur 1 Versuch, Preis-Topf
(() => {
  const C = CONFIG;
  const $ = s => document.querySelector(s);
  const KEY = 'wk26_state', ADM = 'wk26_admin', KK = 'wk26_k';
  const params = new URLSearchParams(location.search);
  let admin = false;

  // ---------- Speicher ----------
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { results: {}, seq: 0 }; } catch (e) { return { results: {}, seq: 0 }; } };
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  // Ein angefangenes Spiel, das nie beendet wurde (Reload/App verlassen) = verloren
  for (const [d, r] of Object.entries(state.results)) {
    if (r.status === 'started') finalize(+d, false, 'Spiel abgebrochen');
  }

  // ---------- Preis-Logik ----------
  function done() { return Object.values(state.results).filter(r => r.status === 'done'); }
  // Anzahl bereits vergebener Hauptpreise (Finale kann mehrere auf einmal vergeben)
  function winsSoFar() { return done().reduce((n, r) => n + (r.win && r.kind === 'main' ? (r.count || 1) : 0), 0); }
  function lossesSoFar() { return done().filter(r => !r.win).length; }
  function currentStake(day) {
    const w = winsSoFar();
    if (day === 24 && C.finaleTakesAll) {
      const rest = C.prizes.slice(w);
      return rest.length ? rest : [C.bonusPrize];
    }
    return [C.prizes[w] || C.bonusPrize];
  }
  function nextConsolation() { return C.consolation[lossesSoFar()] || C.consolationFallback; }

  function finalize(day, win, msg) {
    const r = { status: 'done', win, msg: msg || '', ts: Date.now(), seq: ++state.seq };
    if (win) {
      const stake = currentStake(day);
      r.kind = stake[0] === C.bonusPrize ? 'bonus' : 'main';
      r.prizes = stake;
      if (r.kind === 'main' && stake.length > 1) {
        // Finale: mehrere Preise gleichzeitig -> als einzelne Gewinne zählen
        r.count = stake.length;
      }
    } else {
      r.kind = 'cons';
      r.cons = nextConsolation();
      r.missed = currentStake(day);
    }
    state.results[day] = r; save();
    return r;
  }

  // ---------- Datum ----------
  const opensAt = day => new Date(C.year, 11, day, 0, 0, 0);
  const isOpen = day => admin || Date.now() >= opensAt(day).getTime();
  const todayDay = () => { const n = new Date(); return (n.getFullYear() === C.year && n.getMonth() === 11) ? n.getDate() : 0; };

  // ---------- Screens ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    $('#s-' + id).classList.remove('hidden'); window.scrollTo(0, 0);
  }
  const photoFor = day => C.photos[(day - 1) % C.photos.length];
  const prizeStr = p => `${p.e} ${p.t}`;

  function renderHome() {
    const faces = [C.faces.er[0], C.faces.sie[0]].filter(Boolean);
    $('#home-faces').innerHTML = ASSETS.ok ? faces.map(f => `<img src="${f}" alt="">`).join('') : '<div class="tree">🎄</div>';
    $('#home-name').textContent = C.herName;
    const td = todayDay();
    const n = new Date();
    const doneList = Object.values(state.results).filter(r => r.status === 'done');
    const wins = doneList.filter(r => r.win).length;
    if (n < opensAt(1) && !admin) {
      const days = Math.ceil((opensAt(1) - n) / 864e5);
      $('#home-sub').textContent = `Noch ${days} ${days === 1 ? 'Tag' : 'Tage'}, dann öffnet sich das erste Türchen.`;
    } else $('#home-sub').textContent = 'Jeden Tag ein Türchen, ein Spiel und nur ein Versuch.';
    $('#home-stats').innerHTML = `<span class="chip">${doneList.length}/24 gespielt</span><span class="chip win">✓ ${wins} gewonnen</span><span class="chip lose">✕ ${doneList.length - wins} verloren</span>`;

    const box = $('#doors'); box.innerHTML = '';
    for (let d = 1; d <= 24; d++) {
      const r = state.results[d];
      const b = document.createElement('button');
      b.className = 'door';
      if (r && r.status === 'done') { b.classList.add(r.win ? 'won' : 'lost'); b.innerHTML = `<span class="num">${d}</span><span class="mark">${r.win ? '✓' : '✕'}</span>`; }
      else if (!isOpen(d)) { b.classList.add('locked'); b.innerHTML = `<span class="num">${d}</span><span class="lbl">🔒</span>`; }
      else { b.classList.add('open'); if (d === td) b.classList.add('today'); b.innerHTML = `<span class="num">${d}</span><span class="lbl">${d === td ? 'Heute' : 'Offen'}</span>`; }
      b.onclick = () => doorClick(d);
      box.appendChild(b);
    }
    // Gewinnliste
    const list = Object.entries(state.results).filter(([, r]) => r.status === 'done').sort((a, b) => a[1].seq - b[1].seq);
    const w = $('#wins');
    if (!list.length) { w.innerHTML = `<h3>Deine Preise</h3><p class="empty">Noch leer. Das erste Türchen wartet auf dich.</p>`; }
    else {
      w.innerHTML = '<h3>Deine Preise</h3><ul>' + list.map(([d, r]) => {
        const what = r.win ? r.prizes.map(prizeStr).join(' + ') : `🍬 Trostpreis: ${r.cons}`;
        return `<li><span class="d ${r.win ? 'w' : 'l'}">${d}</span><span>${what}</span></li>`;
      }).join('') + '</ul>';
    }
    if (admin) {
      const ab = $('#admin-bar'); ab.classList.remove('hidden');
      ab.innerHTML = `🔧 Testmodus: alle Türchen offen, nichts wird gespeichert. <button id="adm-off">Testmodus aus</button><button id="adm-reset">Spielstand löschen</button>`;
      $('#adm-off').onclick = () => { try { localStorage.removeItem(ADM); } catch (e) {} location.href = location.pathname; };
      $('#adm-reset').onclick = () => { if (confirm('Spielstand auf DIESEM Gerät löschen?')) { state = { results: {}, seq: 0 }; save(); renderHome(); } };
    }
    show('home');
  }

  function doorClick(d) {
    const r = state.results[d];
    if (r && r.status === 'done' && !admin) return showResult(d, r, false);
    if (!isOpen(d)) {
      const dt = opensAt(d);
      return info('🔒', `Türchen ${d}`, `Geduld! Dieses Türchen öffnet sich am ${dt.getDate()}. Dezember.`);
    }
    if (!ASSETS.ok) return info('🔗', 'Fast geschafft', 'Öffne einmal den Link aus deiner Einladung, dann funktioniert alles.');
    intro(d, admin);
  }

  function info(emoji, title, msg) {
    $('#info-emoji').textContent = emoji; $('#info-title').textContent = title; $('#info-msg').textContent = msg; show('info');
  }

  function intro(day, test) {
    const g = GAMES[day];
    if (!g) return info('🛠️', 'Ups', 'Dieses Spiel fehlt noch.');
    $('#intro-photo').style.backgroundImage = `url(${photoFor(day)})`;
    $('#intro-day').textContent = `${day}. Dezember`;
    $('#intro-emoji').textContent = g.emoji;
    $('#intro-title').textContent = g.title;
    $('#intro-rules').textContent = g.rules;
    $('#intro-goal').innerHTML = `<span>Ziel</span>${g.goal}`;
    const stake = currentStake(day);
    $('#intro-stake').innerHTML = (day === 24 && stake.length > 1)
      ? `<span class="k">Großes Finale</span><b>Alle ${stake.length} übrigen Preise 🎁</b><small>Gewinnst du heute, gehört dir alles, was noch im Topf ist.</small>`
      : `<span class="k">Heute im Topf</span><b>${prizeStr(stake[0])}</b><small>Verlierst du, wandert er weiter und du bekommst einen Trostpreis.</small>`;
    $('#btn-start').onclick = () => start(day, test);
    show('intro');
  }

  function start(day, test) {
    if (!test) { state.results[day] = { status: 'started', ts: Date.now() }; save(); }
    show('game');
    document.getElementById('hud-l').textContent = ''; document.getElementById('hud-r').textContent = '';
    document.getElementById('hud-t').textContent = GAMES[day].title;
    document.documentElement.classList.add('playing');
    countdown(() => requestAnimationFrame(() => {
      const api = makeApi(document.getElementById('stage'), (win, msg) => {
        document.documentElement.classList.remove('playing');
        const r = test ? fakeResult(day, win, msg) : finalize(day, win, msg);
        showResult(day, r, true);
      });
      GAMES[day].play(api);
    }));
  }
  function fakeResult(day, win, msg) {
    return win ? { win, msg, kind: 'main', prizes: currentStake(day) } : { win, msg, kind: 'cons', cons: nextConsolation(), missed: currentStake(day) };
  }

  function showResult(day, r, fresh) {
    $('#res-photo').style.backgroundImage = `url(${photoFor(day + 2)})`;
    $('#res-emoji').textContent = r.win ? '🏆' : '🫶';
    $('#s-result').classList.toggle('is-win', !!r.win); $('#s-result').classList.toggle('is-lose', !r.win);
    $('#res-title').textContent = r.win ? 'Gewonnen!' : 'Knapp daneben!';
    $('#res-msg').textContent = r.win ? `Türchen ${day} gehört dir, ${C.herName}!` : (r.msg ? r.msg + '. ' : '') + 'Aber leer gehst du nicht aus:';
    const pb = $('#res-prize');
    if (r.win) { pb.className = 'prize-box'; pb.innerHTML = `<small>Dein Gewinn</small>${r.prizes.map(prizeStr).join('<br>')}`; }
    else { pb.className = 'prize-box cons'; pb.innerHTML = `<small>Dein Trostpreis</small>🍬 ${r.cons}`; }
    $('#res-hint').textContent = r.win
      ? `Zeig diesen Bildschirm ${C.himName} und hol dir deinen Preis ab.`
      : `Der Preis (${r.missed ? r.missed.map(p => p.t).join(', ') : ''}) wandert weiter – vielleicht klappt's morgen!`;
    show('result');
    if (r.win && fresh) confetti();
  }

  function confetti() {
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#d7263d', '#f6c453', '#2fbf71', '#fff', '#ff8fab'];
    const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height, vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, r: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], s: 4 + Math.random() * 5 }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(p => { p.y += p.vy; p.x += p.vx; p.r += 0.1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 360) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  async function sha256(s) {
    if (!crypto.subtle) return '';
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // ---------- Start ----------
  async function boot() {
    ['#btn-home1', '#btn-home2', '#btn-home3'].forEach(s => $(s).onclick = () => { history.replaceState(null, '', location.pathname); renderHome(); });
    // Schlüssel aus dem Einladungslink (#…) übernehmen und auf dem Gerät merken
    // Link-Format: …/?TOKEN#SCHLÜSSEL  (alte Form ?t=…#k=… geht auch)
    const hraw = location.hash.slice(1);
    const hk = hraw ? (new URLSearchParams(hraw).get('k') || (hraw.includes('=') ? null : hraw)) : null;
    if (hk) { try { localStorage.setItem(KK, hk); } catch (e) {} }
    let key = hk; if (!key) { try { key = localStorage.getItem(KK); } catch (e) {} }
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    // Admin-Modus: ?admin=SCHLÜSSEL
    const ak = params.get('admin');
    if (ak) { const h = await sha256(ak); if (h === C.adminHash) { try { localStorage.setItem(ADM, h); } catch (e) {} } const p2 = new URLSearchParams(location.search); p2.delete('admin'); history.replaceState(null, '', location.pathname + (p2.toString() ? '?' + p2 : '')); }
    try { admin = localStorage.getItem(ADM) === C.adminHash; } catch (e) {}

    const ok = await loadAssets(key);
    document.body.classList.toggle('nokey', !ok);
    const toks = C.tokens || {};
    const tok = params.get('t') || [...params.keys()].find(k => toks[k]);
    const day = tok ? toks[tok] : 0;
    if (!day) return renderHome();
    const r = state.results[day];
    if (r && r.status === 'done' && !admin) return showResult(day, r, false);
    if (!ASSETS.ok) return info('🔗', 'Fast geschafft', 'Öffne einmal den Link aus deiner Einladung, dann funktioniert alles.');
    if (!isOpen(day)) return info('🔒', `Türchen ${day}`, `Na, neugierig? 😏 Dieses Türchen öffnet sich erst am ${day}. Dezember.`);
    intro(day, admin);
  }
  boot();
})();
