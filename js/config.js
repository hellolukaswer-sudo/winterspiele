// ============================================================
//  EINSTELLUNGEN – hier kannst du alles anpassen
// ============================================================
const CONFIG = {
  year: 2026,             // Dezember dieses Jahres
  herName: 'Reiskorn',    // wie sie im Spiel angesprochen wird
  himName: 'Lukas',

  // SHA-256 des Admin-Schlüssels (der Schlüssel selbst steht NICHT im Repo)
  adminHash: '0e9784c2631b8b316e47d4cfd8c1b86df9e14cf557ac612b5e4b5da081459e0e',

  // Hauptpreise in Reihenfolge. Gewinnt sie, bekommt sie den vordersten.
  // Verliert sie, bleibt er im Topf und wandert auf den nächsten Tag.
  prizes: [
    { e: '🎀', t: 'dm-Überraschung: Haargummis' },
    { e: '🍫', t: 'Feine Schokolade' },
    { e: '🍜', t: 'Buldak-Instantnudeln' },
    { e: '🧋', t: 'Boba-Gutschein' },
    { e: '🎀', t: 'dm-Überraschung' },
    { e: '🍫', t: 'Feine Schokolade' },
    { e: '🎄', t: 'Weihnachtsmarkt – Lukas zahlt alles' },
    { e: '🍜', t: 'Buldak-Instantnudeln' },
    { e: '🎀', t: 'dm-Überraschung' },
    { e: '🍫', t: 'Feine Schokolade' },
    { e: '🍲', t: 'Essen gehen bei Chay Viet' },
  ],
  // Wenn der Topf leer ist und sie trotzdem gewinnt:
  bonusPrize: { e: '💝', t: 'Bonus: Süßes + ein Wunsch frei' },

  // Trostpreise in Reihenfolge (6 Bueno + 12 Balisto)
  consolation: [
    'Kinder Bueno', 'Balisto', 'Balisto', 'Kinder Bueno', 'Balisto', 'Balisto',
    'Kinder Bueno', 'Balisto', 'Balisto', 'Kinder Bueno', 'Balisto', 'Balisto',
    'Kinder Bueno', 'Balisto', 'Balisto', 'Kinder Bueno', 'Balisto', 'Balisto',
  ],
  consolationFallback: 'Eine extralange Umarmung',

  // Am 24. gibt's bei Sieg ALLE Preise, die noch im Topf liegen
  finaleTakesAll: true,

  // QR-Token -> Tag  (jedes Türchen hat seinen eigenen, nicht erratbaren Link)
  tokens: {"WqQ7BQXF": 1, "GFyoD8BQ": 2, "nzLmu2D3": 3, "94F9uyav": 4, "jvYTwU84": 5, "SWsBtbqv": 6, "76QJxq50": 7, "23BJqLoh": 8, "TxsuTkVr": 9, "83xBpkId": 10, "nBDWwMEs": 11, "Mp69SLuK": 12, "Ql5zCwRn": 13, "JMFtUPhF": 14, "pxxZggX0": 15, "x8InlYxy": 16, "Jy2x7wKP": 17, "AHXsIzL8": 18, "1w2rboUt": 19, "y2FZSqz3": 20, "pDON5pfv": 21, "yCdENKAv": 22, "BIupCoIi": 23, "8w423KbV": 24},

  // Fotos liegen nur VERSCHLÜSSELT im Repo (AES-256). Der Schlüssel steckt im QR-Code (#k=…)
  faces: {
    er:  ['img/enc/er1.bin', 'img/enc/er2.bin'],
    sie: ['img/enc/sie1.bin', 'img/enc/sie2.bin', 'img/enc/sie3.bin', 'img/enc/sie4.bin'],
  },
  photos: ['img/enc/foto1.bin', 'img/enc/foto2.bin', 'img/enc/foto3.bin', 'img/enc/foto4.bin', 'img/enc/foto5.bin'],
};
