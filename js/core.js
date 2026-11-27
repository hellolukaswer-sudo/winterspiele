// Kalender-Logik: Türchen, Datumssperre, ein Versuch (+ Joker), Geschenke-Warteschlange
(() => {
  const C = CONFIG;
  const $ = s => document.querySelector(s);
  const KEY = 'wk26_state2', ADM = 'wk26_admin', KK = 'wk26_k';
  const params = new URLSearchParams(location.search);
  let admin = false;
  try { admin = localStorage.getItem(ADM) === C.adminHash; } catch (e) {}

  // Steuerungs-Hinweise für die Vorschau
  const CTRL = {
    1: ['👉', 'Wischen', 'Wische in die Richtung, in die Lukas laufen soll.'],
    2: ['👆', 'Tippen', 'Tippe irgendwo, um nach oben zu flattern.'],
    3: ['👆', 'Tippen', 'Tippe zwei Karten nacheinander an.'],
    4: ['👆', 'Tippen', 'Tippe auf Lukas – nicht auf die Kohle.'],
    5: ['✋', 'Ziehen', 'Finger auflegen und nach links/rechts ziehen.'],
    6: ['👆', 'Tippen', 'Tippe, um das Geschenk fallen zu lassen.'],
    7: ['👆', 'Tippen', 'Tippe, sobald Lukas erscheint. Bei Kohle nicht!'],
    8: ['👆', 'Tippen', 'Tippe die Lichter in derselben Reihenfolge nach.'],
    9: ['✋', 'Ziehen', 'Schlitten mit dem Finger ziehen. Tippen schießt ab.'],
    10: ['✋', 'Ziehen', 'Finger halten und bewegen – du schwebst darüber.'],
    11: ['👆', 'Tippen', 'Tippe ein Teil neben der Lücke an.'],
    12: ['👆', 'Tippen', 'Tippe, wenn der Zeiger im grünen Bereich ist.'],
    13: ['👆', 'Tippen', 'Tippe die richtige Antwort.'],
    14: ['👆', 'Tippen', 'Tippen = springen.'],
    15: ['✋', 'Ziehen', 'Dein Paddel unten mit dem Finger ziehen.'],
    16: ['👆', 'Tippen', 'Tippe unten auf den richtigen Namen.'],
    17: ['👆', 'Tippen', 'Tippe Ja oder Nein.'],
    18: ['✋', 'Ziehen', 'Finger nach links/rechts ziehen.'],
    19: ['✂️', 'Durchwischen', 'Mit dem Finger durch die Süßigkeiten wischen.'],
    20: ['👆', 'Tippen', 'Tippe genau auf Lukas.'],
    21: ['✋', 'Ziehen', 'Links/rechts ziehen. Schießen geht automatisch.'],
    22: ['👆', 'Tippen', 'Zahlen von 1 bis 25 antippen.'],
    23: ['👆', 'Tippen', 'Tippe das Symbol, das anders ist.'],
    24: ['👉', 'Wischen', 'Wische – du rutschst bis zur nächsten Abzweigung.'],
  };

  // ---------- Speicher ----------
  const fresh = () => {
    const queue = []; for (let d = 1; d <= 24; d++) if (C.plan[d]) queue.push(C.plan[d]);
    return { v: 2, results: {}, seq: 0, queue, inserted: [], lossIdx: 0, lossOrder: C.lossMessages.map((_, i) => i), extraUsed: 0 };
  };
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 2 ? s : fresh(); } catch (e) { return fresh(); } };
  let state = load();
  // Im Testmodus wird nichts gespeichert (aber alles läuft im Speicher wie echt)
  const save = () => { if (admin) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  // ---------- Geschenke ----------
  const gift = id => C.gifts[id] || C.emptyGift;
  const giftStr = id => `${gift(id).e} ${gift(id).t}`;
  // gleiche Geschenke zusammenfassen: [{id, n}]
  const group = ids => { const m = []; for (const id of ids) { const g = m.find(x => x.id === id); if (g) g.n++; else m.push({ id, n: 1 }); } return m; };
  const groupStr = ids => group(ids).map(({ id, n }) => `${gift(id).e} ${n > 1 ? n + '× ' : ''}${gift(id).t}`);
  const isDone = d => state.results[d] && state.results[d].status === 'done';
  const unplayed = () => { const u = []; for (let d = 1; d <= 24; d++) if (!isDone(d)) u.push(d); return u; };

  // Warteschlange für einen Tag vorbereiten (auf Kopien)
  function stakeFor(day) {
    const q = state.queue.slice(), ins = state.inserted.slice();
    if (C.premium[day] && !ins.includes(day)) { q.unshift(C.premium[day]); ins.push(day); }
    // Mehr Geschenke als Tage übrig? Dann fallen zuerst Riegel weg (von hinten)
    const un = unplayed(); if (!un.includes(day)) un.push(day);
    const pending = un.filter(d => d !== day && C.premium[d] && !ins.includes(d)).length;
    const cap = Math.max(1, un.length - pending);
    const finale = day === 24 && C.finaleTakesAll; // Heiligabend: alles, was noch übrig ist (auch Riegel)
    while (!finale && q.length > cap) {
      let i = -1; for (let k = q.length - 1; k >= 0; k--) if (gift(q[k]).bar) { i = k; break; }
      if (i < 0) break; q.splice(i, 1);
    }
    if (finale) {
      // Heiligabend: alle Geschenke, die sie noch nicht gewonnen hat – auch weggefallene Riegel
      const left = [C.premium[24], ...Object.values(C.premium).filter(id => id !== C.premium[24]), ...Object.keys(C.plan).sort((x, y) => x - y).map(d => C.plan[d])];
      for (const r of Object.values(state.results)) if (r.status === 'done' && r.win) for (const id of r.gifts) { const i = left.indexOf(id); if (i >= 0) left.splice(i, 1); }
      return { ids: left.length ? left : ['__empty'], q: [], ins };
    }
    const last = C.finaleTakesAll && un.length === 1; // letztes offenes Türchen bekommt alles
    const ids = q.length ? (last ? q.slice() : [q[0]]) : ['__empty'];
    return { ids, q, ins };
  }

  // ---------- Verlust: Nachrichten, Joker, Balisto ----------
  function nextLoss(jokerUsedToday) {
    const order = state.lossOrder, M = C.lossMessages;
    if (state.lossIdx < order.length) {
      const i = state.lossIdx;
      if (jokerUsedToday && M[order[i]].joker) {
        const j = order.findIndex((m, k) => k > i && !M[m].joker);
        if (j > 0) [order[i], order[j]] = [order[j], order[i]];
        else return extra();
      }
      state.lossIdx++;
      const m = M[order[i]];
      return m.joker ? { joker: true } : { text: m.text, punch: m.punch || '' };
    }
    return extra();
  }
  function extra() {
    if (state.extraUsed < C.extraBalisto) { state.extraUsed++; return { balisto: true }; }
    return { text: C.lastFallback };
  }

  function finalize(day, win, msg) {
    const prev = state.results[day] || {};
    const { ids, q, ins } = stakeFor(day);
    state.inserted = ins;
    if (win) {
      if (ids[0] !== '__empty') q.splice(0, ids.length);
      if (gift(ids[0]).bar) state.barFails = 0;
      state.queue = q;
      const r = { status: 'done', win: true, gifts: ids, msg: msg || '', ts: Date.now(), seq: ++state.seq, joker: !!prev.jokerUsed };
      state.results[day] = r; save(); return r;
    }
    // Geschenk bleibt vorne in der Schlange -> nächster Tag.
    // Ausnahme: Ein Riegel, der zweimal verpasst wurde, fällt weg und das nächste Geschenk rückt nach.
    let dropped = false;
    if (ids.length === 1 && gift(ids[0]).bar && q[0] === ids[0]) {
      state.barFails = (state.barFails || 0) + 1;
      if (state.barFails >= 2) { q.shift(); state.barFails = 0; dropped = true; }
    }
    state.queue = q;
    // Heiligabend: fester Extra-Joker, zusätzlich zu den verteilten
    if (day === 24 && !prev.finalJoker) {
      state.results[day] = { status: 'joker', jokerUsed: !!prev.jokerUsed, finalJoker: true, ts: Date.now(), msg: msg || '' };
      save(); return { joker: true, msg: msg || '', missed: ids };
    }
    const out = nextLoss(!!prev.jokerUsed);
    if (out.joker) {
      state.results[day] = { status: 'joker', jokerUsed: true, finalJoker: !!prev.finalJoker, ts: Date.now(), msg: msg || '' };
      save(); return { joker: true, msg: msg || '', missed: ids };
    }
    const r = { status: 'done', win: false, loss: out, missed: ids, dropped, msg: msg || '', ts: Date.now(), seq: ++state.seq };
    state.results[day] = r; save(); return r;
  }

  // Ein angefangenes Spiel, das nie beendet wurde (Reload/App verlassen) = verloren
  for (const [d, r] of Object.entries(state.results)) if (r.status === 'started') finalize(+d, false, 'Spiel abgebrochen');

  // ---------- Datum ----------
  const opensAt = day => new Date(C.year, 11, day, 0, 0, 0);
  const isOpen = day => admin || Date.now() >= opensAt(day).getTime();
  const todayDay = () => { const n = new Date(); return (n.getFullYear() === C.year && n.getMonth() === 11) ? n.getDate() : 0; };

  // ---------- Screens ----------
  function show(id) {
    stopPreview();
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    $('#s-' + id).classList.remove('hidden'); window.scrollTo(0, 0);
  }
  const setPhoto = (el, idx) => {
    const n = C.photos.length, i = ((idx % n) + n) % n;
    el.style.backgroundImage = `url(${C.photos[i]})`;
    el.style.backgroundPosition = `center ${(C.photoFocus && C.photoFocus[i]) || '45%'}`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function renderHome() {
    const faces = [C.faces.er[0], C.faces.sie[0]].filter(Boolean);
    $('#home-faces').innerHTML = ASSETS.ok ? faces.map(f => `<img src="${f}" alt="">`).join('') : '<div class="tree">🎄</div>';
    $('#home-name').textContent = C.herName;
    const td = todayDay(), n = new Date();
    const doneList = Object.values(state.results).filter(r => r.status === 'done');
    const wins = doneList.filter(r => r.win).length;
    if (n < opensAt(1) && !admin) {
      const days = Math.ceil((opensAt(1) - n) / 864e5);
      $('#home-sub').textContent = `Noch ${days} ${days === 1 ? 'Tag' : 'Tage'}, dann öffnet sich das erste Türchen.`;
    } else $('#home-sub').textContent = 'Jeden Tag ein Türchen, ein Spiel und ein Geschenk.';
    $('#home-stats').innerHTML = `<span class="chip">${doneList.length}/24 gespielt</span><span class="chip win">✓ ${wins} gewonnen</span><span class="chip lose">✕ ${doneList.length - wins} verloren</span>`;

    const box = $('#doors'); box.innerHTML = '';
    for (let d = 1; d <= 24; d++) {
      const r = state.results[d];
      const b = document.createElement('button');
      b.className = 'door';
      if (r && r.status === 'done') { b.classList.add(r.win ? 'won' : 'lost'); b.innerHTML = `<span class="num">${d}</span><span class="mark">${r.win ? '✓' : '✕'}</span>`; }
      else if (r && r.status === 'joker') { b.classList.add('joker'); b.innerHTML = `<span class="num">${d}</span><span class="lbl">🃏 Joker</span>`; }
      else if (!isOpen(d)) { b.classList.add('locked'); b.innerHTML = `<span class="num">${d}</span><span class="lbl">${C.premium[d] ? '⭐' : '🔒'}</span>`; }
      else { b.classList.add('open'); if (d === td) b.classList.add('today'); b.innerHTML = `<span class="num">${d}</span><span class="lbl">${d === td ? 'Heute' : 'Offen'}</span>`; }
      b.onclick = () => doorClick(d);
      box.appendChild(b);
    }
    const list = Object.entries(state.results).filter(([, r]) => r.status === 'done').sort((a, b) => a[1].seq - b[1].seq);
    const w = $('#wins');
    if (!list.length) w.innerHTML = `<h3>Deine Geschenke</h3><p class="empty">Noch leer. Das erste Türchen wartet auf dich.</p>`;
    else w.innerHTML = '<h3>Deine Geschenke</h3><ul>' + list.map(([d, r]) => {
      const what = r.win ? groupStr(r.gifts).join(' + ') : (r.loss && r.loss.balisto ? '🍫 Trostpreis: Balisto' : '💌 Nachricht von Lukas');
      return `<li><span class="d ${r.win ? 'w' : 'l'}">${d}</span><span>${esc(what)}</span></li>`;
    }).join('') + '</ul>';
    if (admin) {
      const ab = $('#admin-bar'); ab.classList.remove('hidden');
      ab.innerHTML = `🔧 Testmodus: alle Türchen offen, nichts wird gespeichert (Neuladen = Neustart). <button id="adm-off">Testmodus aus</button><button id="adm-reset">Neu anfangen</button>`;
      $('#adm-off').onclick = () => { try { localStorage.removeItem(ADM); } catch (e) {} location.href = location.pathname; };
      $('#adm-reset').onclick = () => { state = fresh(); renderHome(); };
    }
    show('home');
  }

  function doorClick(d) {
    const r = state.results[d];
    if (r && r.status === 'done' && !admin) return showResult(d, r, false);
    if (!isOpen(d)) return info('🔒', `Türchen ${d}`, `Geduld! Dieses Türchen öffnet sich am ${d}. Dezember.`);
    if (!ASSETS.ok) return info('🔗', 'Fast geschafft', 'Öffne einmal den Link aus deiner Einladung, dann funktioniert alles.');
    if (r && r.status === 'joker') return showJoker(d, { missed: stakeFor(d).ids });
    intro(d);
  }

  function info(emoji, title, msg) {
    $('#info-emoji').textContent = emoji; $('#info-title').textContent = title; $('#info-msg').textContent = msg; show('info');
  }

  // ---------- Intro + Vorschau ----------
  let pv = null, pvTimer = 0;
  function startPreview(day) {
    stopPreview();
    const st = $('#pv-stage');
    const run = () => {
      pv = makeApi(st, () => { pvTimer = setTimeout(run, 700); }, { demo: true, w: 360, h: 667 });
      try { GAMES[day].play(pv); } catch (e) {}
    };
    run();
  }
  function stopPreview() { clearTimeout(pvTimer); if (pv) { pv.kill(); pv = null; } }

  function intro(day) {
    const g = GAMES[day];
    if (!g) return info('🛠️', 'Ups', 'Dieses Spiel fehlt noch.');
    setPhoto($('#intro-photo'), day - 1);
    $('#intro-day').textContent = `${day}. Dezember${C.premium[day] ? ' ⭐' : ''}`;
    $('#intro-emoji').textContent = g.emoji;
    $('#intro-title').textContent = g.title;
    $('#intro-rules').textContent = g.rules;
    $('#intro-goal').innerHTML = `<span>Ziel</span>${esc(g.goal)}`;
    const c = CTRL[day] || ['👆', 'Tippen', ''];
    $('#intro-ctrl-ic').textContent = c[0]; $('#intro-ctrl').textContent = c[1]; $('#intro-ctrl-txt').textContent = c[2];
    const { ids } = stakeFor(day);
    const big = C.premium[day] ? '<span class="k">⭐ Großer Tag</span>' : '<span class="k">Heute im Topf</span>';
    $('#intro-stake').innerHTML = ids.length > 1
      ? `<span class="k">Großes Finale</span><b>${groupStr(ids).map(esc).join('<br>')}</b><small>Gewinnst du heute, gehört dir alles davon.${day === 24 && !(state.results[24] || {}).finalJoker ? ' Und keine Sorge: Heute hast du auf jeden Fall einen Joker.' : ''}</small>`
      : `${big}<b>${esc(giftStr(ids[0]))}</b><small>Schaffst du es nicht, bekommst du eine Nachricht von mir – und das Geschenk wartet beim nächsten Türchen nochmal auf dich.</small>`;
    $('#btn-start').onclick = () => start(day);
    show('intro');
    startPreview(day);
  }

  function start(day) {
    const prev = state.results[day] || {};
    state.results[day] = { status: 'started', jokerUsed: !!prev.jokerUsed, finalJoker: !!prev.finalJoker, ts: Date.now() }; save();
    show('game');
    $('#hud-l').textContent = ''; $('#hud-r').textContent = ''; $('#hud-t').textContent = GAMES[day].title;
    document.documentElement.classList.add('playing');
    countdown(() => requestAnimationFrame(() => {
      const api = makeApi($('#stage'), (win, msg) => {
        document.documentElement.classList.remove('playing');
        const r = finalize(day, win, msg);
        if (r.joker) showJoker(day, r); else showResult(day, r, true);
      });
      GAMES[day].play(api);
    }));
  }

  // ---------- Ergebnis ----------
  function waLink(text) {
    const base = C.whatsapp ? `https://wa.me/${C.whatsapp}` : 'https://wa.me/';
    return `${base}?text=${encodeURIComponent(text)}`;
  }
  function shareBtn(text, label) {
    return `<a class="btn wa" href="${waLink(text)}" target="_blank" rel="noopener">${label}</a>`;
  }

  function showResult(day, r, freshWin) {
    setPhoto($('#res-photo'), day + 4);
    const s = $('#s-result'); s.classList.toggle('is-win', !!r.win); s.classList.toggle('is-lose', !r.win);
    const body = $('#res-body');
    if (r.win) {
      $('#res-emoji').textContent = '🏆';
      $('#res-title').textContent = 'Gewonnen!';
      $('#res-msg').textContent = `Türchen ${day} gehört dir, ${C.herName}!`;
      const vouchers = r.gifts.filter(id => gift(id).voucher);
      const names = group(r.gifts).map(({ id, n }) => (n > 1 ? n + '× ' : '') + gift(id).t).join(', ');
      body.innerHTML =
        `<div class="gift-list">${group(r.gifts).map(({ id, n }) => `<div class="gift"><span class="ge">${gift(id).e}</span><span>${n > 1 ? n + '× ' : ''}${esc(gift(id).t)}</span></div>`).join('')}</div>` +
        vouchers.map((id, k) => voucherHtml(id, day, k)).join('') +
        shareBtn(`🎁 Türchen ${day} geschafft! Ich habe gewonnen: ${names}. Bitte bereitstellen ❤️`, '🎁 Gewinn an Lukas schicken') +
        vouchers.map(id => (gift(id).wallet ? `<a class="btn wallet" href="${gift(id).wallet}"> Zu Apple Wallet hinzufügen</a>` : '') +
          `<button class="btn gold" data-v="${id}">💾 ${esc(gift(id).t.replace('Gutschein: ', ''))}-Gutschein als Bild speichern</button>`).join('');
      body.querySelectorAll('[data-v]').forEach(b => b.onclick = () => saveVoucher(b.dataset.v, day));
      if (freshWin) confetti();
    } else {
      const L = r.loss || {};
      const next = (r.missed || []).filter(id => id !== '__empty').map(id => gift(id).t).join(', ');
      const movedTxt = !next ? '' : r.dropped
        ? `<p class="moved">Der ${esc(next)} ist jetzt weg – beim nächsten Türchen wartet dafür ein neues Geschenk auf dich.</p>`
        : `<p class="moved">Dein Geschenk (${esc(next)}) wartet beim nächsten Türchen nochmal auf dich.</p>`;
      $('#res-emoji').textContent = L.balisto ? '🍫' : '💌';
      $('#res-title').textContent = 'Knapp daneben!';
      $('#res-msg').textContent = r.msg ? r.msg + '.' : '';
      if (L.balisto) {
        body.innerHTML = `<div class="gift-list"><div class="gift"><span class="ge">🍫</span><span>Trostpreis: Balisto</span></div></div>` + movedTxt +
          shareBtn(`🍫 Türchen ${day}: Heute gab's einen Balisto-Trostpreis für mich. Bitte bereitstellen ❤️`, '🍫 Lukas Bescheid geben');
      } else {
        body.innerHTML = `<div class="letter"><div class="from"><img src="${C.faces.er[0]}" alt="">Nachricht von ${esc(C.himName)}</div><p>${esc(L.text || '')}</p>` +
          (L.punch ? `<button class="btn soft" id="punch-btn">Auflösung zeigen 🥁</button><div class="punch hidden" id="punch">${esc(L.punch)}</div>` : '') + `</div>` + movedTxt;
        const pb = $('#punch-btn'); if (pb) pb.onclick = () => { pb.remove(); $('#punch').classList.remove('hidden'); };
      }
    }
    show('result');
  }

  function showJoker(day, r) {
    setPhoto($('#res-photo'), day + 4);
    const s = $('#s-result'); s.classList.add('is-win'); s.classList.remove('is-lose');
    $('#res-emoji').textContent = '🃏';
    $('#res-title').textContent = 'JOKER-Karte!';
    $('#res-msg').textContent = day === 24 && !(state.results[day] || {}).jokerUsed
      ? 'Heiligabend-Joker! 🎄 An Heiligabend lasse ich dich nicht hängen – du darfst nochmal. Alles, was noch im Topf ist, wartet auf dich!'
      : 'Weißt du was? WUHUUU – du darfst nochmal probieren. Diesmal aber richtig anstrengen!';
    $('#res-body').innerHTML = `<div class="joker"><div class="c tl">J<br>🃏</div><div class="hat">🎅</div><img src="${C.faces.er[1] || C.faces.er[0]}" alt=""><div class="t">JOKER</div><div class="c br">J<br>🃏</div></div>
      <button class="btn big" id="joker-go">Nochmal spielen</button>`;
    $('#joker-go').onclick = () => intro(day);
    show('result');
  }

  // ---------- Gutscheine ----------
  function voucherHtml(id, day, k) {
    const g = gift(id);
    return `<div class="voucher ${k % 2 ? 'v2' : ''}"><div class="ve">${g.e}</div><div class="vk">Gutschein</div><div class="vt">${esc(g.t.replace('Gutschein: ', ''))}</div>
      <div>für ${esc(C.herName)} 💛</div><div class="vf">Einlösbar bei ${esc(C.himName)} · gewonnen am ${day}. Dezember ${C.year}</div></div>`;
  }
  async function saveVoucher(id, day) {
    const g = gift(id), W = 1080, H = 1350;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const grad = x.createLinearGradient(0, 0, W, H); grad.addColorStop(0, id === 'chayviet' ? '#b42d35' : '#16774a'); grad.addColorStop(1, id === 'chayviet' ? '#4a0f15' : '#0a2e1e');
    x.fillStyle = grad; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 90; i++) { x.beginPath(); x.arc((i * 137) % W, (i * 271) % H, 3 + (i % 4), 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.setLineDash([18, 14]); x.lineWidth = 4; x.strokeRect(50, 50, W - 100, H - 100); x.setLineDash([]);
    x.textAlign = 'center'; x.fillStyle = '#f2b84b'; x.font = '700 40px "Plus Jakarta Sans", sans-serif'; x.fillText('G U T S C H E I N', W / 2, 200);
    x.font = '230px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.fillText(g.e, W / 2, 520);
    x.fillStyle = '#fff'; x.font = '800 92px "Bricolage Grotesque", sans-serif';
    const title = g.t.replace('Gutschein: ', ''); const words = title.split(' '); let line = '', y = 700;
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > W - 200) { x.fillText(line, W / 2, y); y += 100; line = wd; } else line = t; }
    x.fillText(line, W / 2, y);
    x.font = '600 52px "Plus Jakarta Sans", sans-serif'; x.fillText(`für ${C.herName} 💛`, W / 2, y + 120);
    x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '500 36px "Plus Jakarta Sans", sans-serif';
    x.fillText(`Einlösbar bei ${C.himName}`, W / 2, H - 200); x.fillText(`Gewonnen am ${day}. Dezember ${C.year}`, W / 2, H - 145);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    const file = new File([blob], `gutschein-${id}.png`, { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `Gutschein ${title}` }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  }

  function confetti() {
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#e5484d', '#f2b84b', '#22a35a', '#fff', '#ff8fab'];
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
    const hraw = location.hash.slice(1);
    const hk = hraw ? (new URLSearchParams(hraw).get('k') || (hraw.includes('=') ? null : hraw)) : null;
    if (hk) { try { localStorage.setItem(KK, hk); } catch (e) {} }
    let key = hk; if (!key) { try { key = localStorage.getItem(KK); } catch (e) {} }
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    // Testmodus: ?admin=SCHLÜSSEL
    const ak = params.get('admin');
    if (ak) {
      const h = await sha256(ak);
      if (h === C.adminHash) { try { localStorage.setItem(ADM, h); } catch (e) {} admin = true; state = fresh(); }
      history.replaceState(null, '', location.pathname);
    }
    await loadAssets(key);
    if (admin) window.__wk = { finalize, stakeFor, fresh, get state() { return state; }, set state(s) { state = s; }, showResult, showJoker, renderHome };
    renderHome();
  }
  boot();
})();
