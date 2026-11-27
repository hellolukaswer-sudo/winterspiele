// ============================================================
//  EINSTELLUNGEN – hier kannst du alles anpassen
// ============================================================
const CONFIG = {
  year: 2026,             // Dezember dieses Jahres
  herName: 'Boo',         // wie sie im Spiel angesprochen wird
  himName: 'Lukas',
  whatsapp: '',           // optional: deine Nummer im Format 4917612345678 – dann geht "Gewinn teilen" direkt an dich

  // SHA-256 des Admin-Schlüssels (der Schlüssel selbst steht NICHT im Repo)
  adminHash: 'b9ee750309021521aac7857f8706973ea03c6dfd6b7771db80ae0073c193c419',

  // ---------- Alle Geschenke ----------
  // bar: true = Riegel, die als Erstes wegfallen dürfen, wenn sich zu viel verschiebt
  // voucher: true = Gutschein (bekommt eine eigene Karte zum Speichern)
  gifts: {
    bueno:     { e: '🍫', t: 'Kinder Bueno White', bar: true },
    balisto:   { e: '🍫', t: 'Balisto', bar: true },
    haar:      { e: '🎀', t: 'Haargummis' },
    nose:      { e: '👃', t: 'Nose Strips' },
    maske:     { e: '🧖‍♀️', t: 'Mikrobiom-Tuchmaske' },
    pferd:     { e: '🐴', t: 'Pferdemark' },
    badesalz:  { e: '🫧', t: '„Für dich“-Badesalz' },
    dinkel:    { e: '🍪', t: 'Dinkel-Doppelkekse' },
    reis:      { e: '🍘', t: 'Mini Schoko-Reiswaffeln' },
    eukalyptus:{ e: '🛁', t: 'Eukalyptus-Kräuterbad' },
    buldak:    { e: '🌶️', t: 'Buldak Spicy Ramen' },
    spekulatius:{ e: '🧇', t: 'Premium Spekulatius-Waffeln' },
    edelschoko:{ e: '🍫', t: 'Edel Bio Bitterschokolade' },
    bubbletea: { e: '🧋', t: 'Gutschein: Bubble Tea', voucher: true, wallet: 'wallet/f743f1d6a3490000.pkpass' },
    chayviet:  { e: '🍲', t: 'Gutschein: Essen bei Bödhi', voucher: true, wallet: 'wallet/2dfa6ab1e59650ad.pkpass' },
  },

  // Große Tage (Nikolaus + 2./3./4. Advent + Heiligabend) – fest gebucht
  premium: { 6: 'spekulatius', 13: 'edelschoko', 20: 'bubbletea', 24: 'chayviet' },

  // Alle anderen Tage der Reihe nach. Verliert sie, wandert das Geschenk auf
  // den nächsten Tag und der Rest rutscht nach.
  plan: {
    1: 'bueno', 2: 'haar', 3: 'balisto', 4: 'reis', 5: 'bueno',
    7: 'nose', 8: 'balisto', 9: 'bueno', 10: 'eukalyptus', 11: 'balisto', 12: 'maske',
    14: 'bueno', 15: 'pferd', 16: 'balisto', 17: 'buldak', 18: 'bueno', 19: 'badesalz',
    21: 'balisto', 22: 'dinkel', 23: 'bueno',
  },

  // Am 24. gibt's bei Sieg zusätzlich alles, was noch im Topf liegt
  finaleTakesAll: true,
  emptyGift: { e: '💝', t: 'Überraschung von Lukas' },

  // ---------- Wenn sie verliert ----------
  // Reihenfolge der Nachrichten. { joker: true } = zweiter Versuch mit Joker-Karte.
  lossMessages: [
    { text: 'Onjo, leider hat es heute nicht geklappt – aber dein Gewinner wartet trotzdem mit einem Küsschen auf dich, hihi ❤️' },
    { text: 'Morgen wird es bestimmt besser! Hab heute trotzdem einen wunderschönen Tag. Ich denke ganz doll an dich und hab dich lieb! 💛' },
    { joker: true },
    { text: 'Das war aber auch echt ein schweres Spiel – keine Sorge, morgen hast du nochmal die Chance, etwas zu gewinnen. Ich strenge mich auch jeden Tag an, dich für mich zu gewinnen, weil du mir extrem wichtig bist!!! Ich hoffe, du hast Spaß an deinem kleinen Kalender :)' },
    { text: 'Ein Gedicht:\nDraußen ist es kalt,\nwir versuchen zu sneep,\nkuscheln unter der Decke –\nich hab dich so lieb! 🥰' },
    { joker: true },
    { text: 'Heute mal ein Witz: Wo wohnt der Weihnachtsmann, wenn er in den Urlaub fährt?', punch: 'In einem Ho-Ho-Ho-tel! 🎅' },
    { joker: true },
  ],
  // Danach gibt's Balisto als Trostpreis (so viele hast du übrig)
  extraBalisto: 4,
  lastFallback: 'Heute gibt’s eine extralange Umarmung von Lukas 🤗',

  // ---------- Bilder (verschlüsselt, Schlüssel steckt im Einladungslink) ----------
  faces: {
    er:  ['er1', 'er2', 'er3', 'er4', 'er5', 'er6', 'er7', 'er8'].map(n => `img/enc/${n}.bin`),
    sie: ['sie1', 'sie2', 'sie3', 'sie4', 'sie5', 'sie6', 'sie7', 'sie8', 'sie9', 'sie10'].map(n => `img/enc/${n}.bin`),
  },
  photos: ['foto6', 'foto7', 'foto1', 'foto10', 'foto8', 'foto2', 'foto11', 'foto9', 'foto4', 'foto3', 'foto5'].map(n => `img/enc/${n}.bin`),
  // Bildausschnitt (vertikal) pro Foto, gleiche Reihenfolge wie oben
  photoFocus: ['35%', '28%', '45%', '42%', '30%', '50%', '48%', '40%', '50%', '40%', '45%'],
};
