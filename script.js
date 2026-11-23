/**
 * AqlCharx — Miya va Tafakkur Platformasi (28 ta o'yin)
 * Bo'limlar:
 *  1. Store    — localStorage rekordlari va ovoz sozlamasi
 *  2. Sound    — Web Audio API sintezlangan ovozlar
 *  3. Effects  — Konfetti, silkinish, impuls, toast
 *  4. Catalog  — 4 yosh guruhi x 7 o'yin = 28 o'yin
 *  5. Platform — Navigatsiya, boshlash/natija ekranlari, o'yin registratsiyasi
 *  6. Games    — 5–7, 7–13, 13–19 va 19+ yosh o'yinlari (jami 28 ta)
 */

/* ==========================================================================
   1. STORE MODULI
   ========================================================================== */
const Store = (() => {
  const KEY = 'aqlcharx_full_v1';

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { scores: {}, sound: true };
      const data = JSON.parse(raw);
      return {
        scores: data.scores && typeof data.scores === 'object' ? data.scores : {},
        sound: typeof data.sound === 'boolean' ? data.sound : true
      };
    } catch {
      return { scores: {}, sound: true };
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  }

  return {
    getBest(gameId) {
      return Number(read().scores[gameId] || 0);
    },
    saveBest(gameId, score) {
      const data = read();
      const prev = Number(data.scores[gameId] || 0);
      if (score > prev) {
        data.scores[gameId] = score;
        write(data);
        return true;
      }
      return false;
    },
    getTotalBest() {
      const scores = read().scores;
      return Object.values(scores).reduce((sum, v) => sum + Number(v || 0), 0);
    },
    isSoundOn() {
      return read().sound;
    },
    setSoundOn(val) {
      const data = read();
      data.sound = Boolean(val);
      write(data);
    }
  };
})();

/* ==========================================================================
   2. SOUND MODULI (Web Audio API)
   ========================================================================== */
const Sound = (() => {
  let ctx = null;

  function ensureCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, type = 'sine', dur = 0.14, delay = 0, vol = 0.16) {
    if (!Store.isSoundOn()) return;
    const c = ensureCtx();
    if (!c) return;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);

    gain.gain.setValueAtTime(vol, c.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + dur);
  }

  return {
    click() { tone(540, 'sine', 0.08, 0, 0.12); },
    correct() {
      tone(523.25, 'triangle', 0.13, 0, 0.16);
      tone(659.25, 'triangle', 0.16, 0.08, 0.18);
    },
    wrong() {
      tone(220, 'sawtooth', 0.15, 0, 0.13);
      tone(170, 'sawtooth', 0.2, 0.11, 0.13);
    },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 'triangle', 0.2, i * 0.09, 0.18));
    },
    lose() {
      [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, 'sine', 0.22, i * 0.12, 0.15));
    },
    playFreq(f, type = 'sine', dur = 0.2, delay = 0) {
      tone(f, type, dur, delay, 0.18);
    }
  };
})();

/* ==========================================================================
   3. EFFECTS MODULI
   ========================================================================== */
const Effects = (() => {
  let tId = null;

  function confetti(n = 40) {
    const host = document.getElementById('confetti-container');
    if (!host) return;
    const palette = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];

    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = `${Math.random() * 100}%`;
      el.style.backgroundColor = palette[Math.floor(Math.random() * palette.length)];
      el.style.animationDuration = `${1.3 + Math.random() * 1.3}s`;
      el.style.animationDelay = `${Math.random() * 0.2}s`;
      host.appendChild(el);
      setTimeout(() => el.remove(), 2900);
    }
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove('shake-error');
    void el.offsetWidth;
    el.classList.add('shake-error');
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove('pulse-success');
    void el.offsetWidth;
    el.classList.add('pulse-success');
  }

  function toast(msg) {
    const el = document.getElementById('app-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(tId);
    tId = setTimeout(() => el.classList.remove('show'), 2200);
  }

  return { confetti, shake, pulse, toast };
})();

/* Yordamchi funksiyalar */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ==========================================================================
   4. KATALOG (4 GURUH x 7 O'YIN = 28 O'YIN)
   ========================================================================== */
const AGE_GROUPS = [
  {
    id: '5-7',
    title: '5–7 yosh',
    badge: 'Kichkintoylar',
    emoji: '🧸',
    cardClass: 'age-card-5-7',
    themeClass: 'theme-age-5-7',
    desc: 'Ranglar, shakllar, hayvonlar, sanash, harflar, labirint va sodda pazl o‘yinlari.',
    games: [
      { id: 'g_5_7_1', title: 'Rang va Shakl', icon: '🔺', desc: 'Ko‘rsatilgan rang va shakldagi belgini toping.', diff: '3 daraja' },
      { id: 'g_5_7_2', title: 'Hayvonlar Tovushi', icon: '🦁', desc: 'Tovush va tavsifga mos hayvonni aniqlang.', diff: '3 daraja' },
      { id: 'g_5_7_3', title: 'Quvnoq Sanash (1–10)', icon: '🍎', desc: 'Ekrandagi narsalarni sanab, raqamini bosing.', diff: '3 daraja' },
      { id: 'g_5_7_4', title: 'Kichik Xotira', icon: '🃏', desc: 'Juft rasmlarni topib, barcha kartalarni oching.', diff: '3 daraja' },
      { id: 'g_5_7_5', title: 'Harfni Top!', icon: '🔤', desc: 'Berilgan harf yoki bosh harfga mos harfni tanlang.', diff: '3 daraja' },
      { id: 'g_5_7_6', title: 'Quyoncha Labirinti', icon: '🐇', desc: 'Quyonchani sabziga olib boring.', diff: '3 daraja' },
      { id: 'g_5_7_7', title: 'Rasmni Yig‘', icon: '🧩', desc: 'Aralash bo‘laklarni to‘g‘ri ketma-ketlikka keltiring.', diff: '3 daraja' }
    ]
  },
  {
    id: '7-13',
    title: '7–13 yosh',
    badge: 'Maktab o‘quvchilari',
    emoji: '🚀',
    cardClass: 'age-card-7-13',
    themeClass: 'theme-age-7-13',
    desc: 'Katta xotira to‘ri, tez matematika, so‘z topish, Simon, 4×4 Sudoku, naqsh va pazl.',
    games: [
      { id: 'g_7_13_1', title: 'Super Xotira To‘ri', icon: '🧠', desc: 'Kattaroq jadvalda barcha juftliklarni toping.', diff: '3 daraja' },
      { id: 'g_7_13_2', title: 'Tez Matematika', icon: '⚡', desc: 'Vaqt ichida imkon boricha ko‘p misol yeching.', diff: '3 daraja' },
      { id: 'g_7_13_3', title: 'So‘z Topish', icon: '🔎', desc: 'Harflar orasidan yashiringan so‘zni toping.', diff: '3 daraja' },
      { id: 'g_7_13_4', title: 'Simon Ketma-ketligi', icon: '🎛️', desc: 'Rang va ohang ketma-ketligini xato qilmay qaytaring.', diff: '3 daraja' },
      { id: 'g_7_13_5', title: 'Sudoku 4×4', icon: '🔢', desc: 'Har qator va ustunda 1–4 raqamlarini takrorlamay qo‘ying.', diff: '3 daraja' },
      { id: 'g_7_13_6', title: 'Naqshni Davom Ettir', icon: '💠', desc: 'Mantiqiy ketma-ketlikdagi keyingi belgini toping.', diff: '3 daraja' },
      { id: 'g_7_13_7', title: 'Sirpanuvchi Pazl', icon: '🖼️', desc: 'Raqamlarni 1 dan boshlab tartib bilan joylashtiring.', diff: '3 daraja' }
    ]
  },
  {
    id: '13-19',
    title: '13–19 yosh',
    badge: 'O‘smirlar',
    emoji: '🎯',
    cardClass: 'age-card-13-19',
    themeClass: 'theme-age-13-19',
    desc: '6×6 Sudoku, 2048, mantiqiy jumboqlar, anagramma, zehn hisobi, reaksiya va Hanoi.',
    games: [
      { id: 'g_13_19_1', title: 'Sudoku 6×6', icon: '📐', desc: '6×6 jadvalda 1–6 raqamlarini qoidalarga mos joylang.', diff: '3 daraja' },
      { id: 'g_13_19_2', title: '2048 Raqamlar', icon: '🎲', desc: 'Bir xil sonlarni qo‘shib katta qiymatlarga yeting.', diff: '3 daraja' },
      { id: 'g_13_19_3', title: 'Mantiqiy Jumboqlar', icon: '💡', desc: 'Fikrni charxlovchi mantiqiy savollarga javob bering.', diff: '3 daraja' },
      { id: 'g_13_19_4', title: 'Anagramma Ustasi', icon: '🔠', desc: 'Aralash harflardan to‘g‘ri so‘zni yig‘ing.', diff: '3 daraja' },
      { id: 'g_13_19_5', title: 'Tezkor Zehn Hisobi', icon: '🧮', desc: 'Ikki bosqichli arifmetik ifodalarni tez hisoblang.', diff: '3 daraja' },
      { id: 'g_13_19_6', title: 'Reaksiya Testi', icon: '⏱️', desc: 'Yashil signal yonganda eng tez bosing.', diff: '3 daraja' },
      { id: 'g_13_19_7', title: 'Hanoi Minorasi', icon: '🗼', desc: 'Halqalarni 3-ustunga qoida asosida o‘tkazing.', diff: '3 daraja' }
    ]
  },
  {
    id: '19-plus',
    title: '19+ yosh',
    badge: 'Kattalar va Pro',
    emoji: '♟️',
    cardClass: 'age-card-19-plus',
    themeClass: 'theme-age-19-plus',
    desc: '9×9 Sudoku, N-Back xotira, Stroop testi, shifr, ketma-ketlik, blits hisob va chiroqlar.',
    games: [
      { id: 'g_19_plus_1', title: 'Pro Sudoku 9×9', icon: '📊', desc: 'Klassik 9×9 mantiqiy jadvalni to‘ldiring.', diff: '3 daraja' },
      { id: 'g_19_plus_2', title: 'N-Back Xotira', icon: '🧬', desc: 'N qadam oldingi belgi bilan mosligini aniqlang.', diff: '3 daraja' },
      { id: 'g_19_plus_3', title: 'Stroop Diqqat Testi', icon: '🎨', desc: 'So‘zning yozilgan rangini toping, ma’nosiga chalg‘imang.', diff: '3 daraja' },
      { id: 'g_19_plus_4', title: 'Shifrni Yechish', icon: '🔐', desc: 'Siljish (Sezar) shifridan yashiringan so‘zni o‘qing.', diff: '3 daraja' },
      { id: 'g_19_plus_5', title: 'Mantiqiy Ketma-ketlik', icon: '📈', desc: 'Sonlar qatoridagi keyingi sonni hisoblang.', diff: '3 daraja' },
      { id: 'g_19_plus_6', title: 'Vaqtga Qarshi Hisob', icon: '⏳', desc: 'Murakkabroq hisob-kitoblarni vaqtga qarshi bajaring.', diff: '3 daraja' },
      { id: 'g_19_plus_7', title: 'Strategik Chiroqlar', icon: '♟️', desc: 'Barcha yoniq kataklarni o‘chirib maydonni tozalang.', diff: '3 daraja' }
    ]
  }
];

/* ==========================================================================
   5. PLATFORM MODULI
   ========================================================================== */
const Platform = (() => {
  const gamesMap = {};
  const state = {
    groupId: null,
    gameId: null,
    score: 0,
    diff: 'easy',
    cleanup: null
  };

  const els = {
    home: document.getElementById('view-home'),
    games: document.getElementById('view-games'),
    arena: document.getElementById('view-arena'),
    groupsGrid: document.getElementById('age-groups-grid'),
    gamesGrid: document.getElementById('games-list-grid'),
    bannerIcon: document.getElementById('group-banner-icon'),
    bannerTitle: document.getElementById('group-banner-title'),
    bannerDesc: document.getElementById('group-banner-desc'),
    groupPill: document.getElementById('group-progress-pill'),
    stage: document.getElementById('game-stage'),
    bestScore: document.getElementById('arena-best-score'),
    currScore: document.getElementById('arena-current-score'),
    totalScore: document.getElementById('global-total-score'),
    soundIcon: document.getElementById('sound-icon')
  };

  function register(id, impl) {
    gamesMap[id] = impl;
  }

  function runCleanup() {
    if (typeof state.cleanup === 'function') {
      state.cleanup();
      state.cleanup = null;
    }
  }

  function refreshHeader() {
    els.totalScore.textContent = Store.getTotalBest();
    els.soundIcon.textContent = Store.isSoundOn() ? '🔊' : '🔇';
  }

  function showView(name) {
    runCleanup();
    els.home.classList.add('d-none');
    els.games.classList.add('d-none');
    els.arena.classList.add('d-none');

    if (name === 'home') {
      document.body.className = 'theme-default';
      renderHome();
      els.home.classList.remove('d-none');
    } else if (name === 'games') {
      els.games.classList.remove('d-none');
    } else if (name === 'arena') {
      els.arena.classList.remove('d-none');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHome() {
    els.groupsGrid.innerHTML = AGE_GROUPS.map(g => {
      const groupBest = g.games.reduce((s, item) => s + Store.getBest(item.id), 0);
      return `
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="age-card ${g.cardClass}" data-gid="${g.id}" role="button" tabindex="0">
            <div>
              <span class="age-card-badge">${g.badge}</span>
              <div class="age-card-emoji">${g.emoji}</div>
              <h2 class="age-card-title">${g.title}</h2>
              <p class="age-card-desc">${g.desc}</p>
            </div>
            <div class="age-card-footer">
              <span>🎮 ${g.games.length} ta o‘yin</span>
              <span>🏆 ${groupBest}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    els.groupsGrid.querySelectorAll('.age-card').forEach(card => {
      card.addEventListener('click', () => {
        Sound.click();
        openGroup(card.dataset.gid);
      });
    });
  }

  function openGroup(groupId) {
    const g = AGE_GROUPS.find(item => item.id === groupId);
    if (!g) return;
    state.groupId = groupId;
    document.body.className = g.themeClass;

    els.bannerIcon.textContent = g.emoji;
    els.bannerTitle.textContent = `${g.title} — ${g.badge}`;
    els.bannerDesc.textContent = g.desc;

    const sumBest = g.games.reduce((s, item) => s + Store.getBest(item.id), 0);
    els.groupPill.textContent = `Guruh rekordi: 🏆 ${sumBest}`;

    els.gamesGrid.innerHTML = g.games.map(game => {
      const b = Store.getBest(game.id);
      return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="game-card" data-game-id="${game.id}" role="button" tabindex="0">
            <div>
              <div class="d-flex justify-content-between align-items-start">
                <div class="game-card-icon">${game.icon}</div>
                <span class="badge-play">O‘ynash</span>
              </div>
              <h3 class="game-card-title">${game.title}</h3>
              <p class="game-card-desc">${game.desc}</p>
            </div>
            <div class="game-card-meta">
              <span class="diff-pill">${game.diff}</span>
              <span>🏆 ${b}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    els.gamesGrid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        Sound.click();
        openGame(card.dataset.gameId);
      });
    });

    showView('games');
  }

  function findGameMeta(gameId) {
    for (const g of AGE_GROUPS) {
      const found = g.games.find(item => item.id === gameId);
      if (found) return found;
    }
    return null;
  }

  function openGame(gameId) {
    const meta = findGameMeta(gameId);
    if (!meta || !gamesMap[gameId]) return;

    state.gameId = gameId;
    state.score = 0;
    state.diff = 'easy';

    els.bestScore.textContent = Store.getBest(gameId);
    els.currScore.textContent = '0';

    renderStart(meta);
    showView('arena');
  }

  function renderStart(meta) {
    runCleanup();
    els.stage.innerHTML = `
      <div class="stage-center-box">
        <div class="stage-big-icon">${meta.icon}</div>
        <h2 class="fw-bold mb-2">${meta.title}</h2>
        <p class="text-muted mb-3">${meta.desc}</p>
        <div class="small fw-bold text-uppercase text-muted">Qiyinlik darajasi:</div>
        <div class="difficulty-selector">
          <button type="button" class="diff-btn active" data-d="easy">🟢 Oson</button>
          <button type="button" class="diff-btn" data-d="medium">🟡 O‘rta</button>
          <button type="button" class="diff-btn" data-d="hard">🔴 Qiyin</button>
        </div>
        <button type="button" id="btn-start-now" class="btn-primary-game">▶️ Boshlash</button>
      </div>
    `;

    els.stage.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        els.stage.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.diff = btn.dataset.d;
      });
    });

    document.getElementById('btn-start-now').addEventListener('click', () => {
      Sound.click();
      startPlay(meta);
    });
  }

  function startPlay(meta) {
    state.score = 0;
    els.currScore.textContent = '0';
    els.stage.innerHTML = '';

    const api = {
      difficulty: state.diff,
      setScore(val) {
        state.score = Math.max(0, Math.round(val));
        els.currScore.textContent = state.score;
      },
      addScore(delta) {
        this.setScore(state.score + delta);
      },
      getScore() {
        return state.score;
      },
      onCleanup(fn) {
        state.cleanup = fn;
      },
      finish({ won = true, title = '', message = '' } = {}) {
        runCleanup();
        const finalScore = state.score;
        const isRecord = Store.saveBest(meta.id, finalScore);
        els.bestScore.textContent = Store.getBest(meta.id);
        refreshHeader();

        if (won) {
          Sound.win();
          Effects.confetti(45);
        } else {
          Sound.lose();
        }

        const heading = title || (won ? 'Barakalla, g‘alaba! 🎉' : 'O‘yin yakunlandi! 💪');
        const bodyMsg = message || (won
          ? 'Siz topshiriqni a’lo darajada bajardingiz!'
          : 'Yana urinib ko‘ring, natijangiz albatta yaxshilanadi!');

        els.stage.innerHTML = `
          <div class="stage-center-box">
            <div class="stage-big-icon">${won ? '🏆' : '🎯'}</div>
            <h2 class="fw-bold mb-2">${heading}</h2>
            <p class="text-muted mb-3">${bodyMsg}</p>
            <div class="d-inline-flex flex-column align-items-center px-4 py-3 rounded-4 mb-4" style="background: var(--accent-soft); border: 2px solid var(--border-color);">
              <span class="small fw-bold text-uppercase text-muted">Yakuniy ball</span>
              <span class="display-5 fw-bold" style="color: var(--accent);">${finalScore}</span>
              ${isRecord ? '<span class="badge bg-warning text-dark mt-1">🌟 YANGI REKORD</span>' : ''}
            </div>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <button type="button" id="btn-retry-game" class="btn-primary-game">🔄 Qayta o‘ynash</button>
              <button type="button" id="btn-back-list" class="btn-outline-game">⬅️ Orqaga</button>
            </div>
          </div>
        `;

        document.getElementById('btn-retry-game').addEventListener('click', () => {
          Sound.click();
          renderStart(meta);
        });
        document.getElementById('btn-back-list').addEventListener('click', () => {
          Sound.click();
          openGroup(state.groupId);
        });
      }
    };

    gamesMap[meta.id].start(els.stage, api);
  }

  function init() {
    refreshHeader();
    renderHome();

    document.getElementById('btn-home-logo').addEventListener('click', () => { Sound.click(); showView('home'); });
    document.getElementById('btn-back-to-home').addEventListener('click', () => { Sound.click(); showView('home'); });
    document.getElementById('btn-back-to-games').addEventListener('click', () => { Sound.click(); openGroup(state.groupId); });
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      const next = !Store.isSoundOn();
      Store.setSoundOn(next);
      refreshHeader();
      if (next) {
        Sound.correct();
        Effects.toast('Ovoz yoqildi 🔊');
      } else {
        Effects.toast('Ovoz o‘chirildi 🔇');
      }
    });
  }

  return { init, register };
})();

document.addEventListener('DOMContentLoaded', () => Platform.init());

/* ==========================================================================
   6. BARCHA 28 TA O'YIN MODULLARI
   ========================================================================== */

/* --- 5–7 YOSH O'YINLARI (7 ta) --- */

// 1. Rang va Shakl
Platform.register('g_5_7_1', {
  start(stage, api) {
    const totalRounds = api.difficulty === 'easy' ? 6 : api.difficulty === 'medium' ? 8 : 10;
    const colors = [
      { name: 'Qizil', hex: '#ef4444' },
      { name: 'Ko‘k', hex: '#3b82f6' },
      { name: 'Yashil', hex: '#10b981' },
      { name: 'Sariq', hex: '#f59e0b' },
      { name: 'Binafsha', hex: '#8b5cf6' }
    ];
    const shapes = [
      { id: 'circle', name: 'Doira', svg: (c) => `<svg width="46" height="46"><circle cx="23" cy="23" r="19" fill="${c}"/></svg>` },
      { id: 'square', name: 'Kvadrat', svg: (c) => `<svg width="46" height="46"><rect x="5" y="5" width="36" height="36" rx="5" fill="${c}"/></svg>` },
      { id: 'triangle', name: 'Uchburchak', svg: (c) => `<svg width="46" height="46"><polygon points="23,4 43,41 3,41" fill="${c}"/></svg>` }
    ];

    let round = 0;
    let target = null;

    function nextRound() {
      if (round >= totalRounds) {
        api.finish({ won: true, message: `Siz ${totalRounds} ta raundni muvaffaqiyatli yakunladingiz!` });
        return;
      }
      round++;
      const tCol = colors[randInt(0, colors.length - 1)];
      const tShp = shapes[randInt(0, shapes.length - 1)];
      target = { col: tCol, shp: tShp };

      const count = api.difficulty === 'easy' ? 4 : api.difficulty === 'medium' ? 6 : 8;
      const options = [target];
      while (options.length < count) {
        const c = colors[randInt(0, colors.length - 1)];
        const s = shapes[randInt(0, shapes.length - 1)];
        if (c.name !== target.col.name || s.id !== target.shp.id) {
          options.push({ col: c, shp: s });
        }
      }

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Raund: ${round}/${totalRounds}</span><span>Ball: ${api.getScore()}</span></div>
          <h3 class="fw-bold mb-3">Toping: <span style="color:${tCol.hex}">${tCol.name} ${tShp.name}</span></h3>
          <div class="row g-3 justify-content-center">
            ${shuffle(options).map((opt, idx) => `
              <div class="col-6 col-sm-3">
                <button type="button" class="choice-btn w-100" data-idx="${idx}">${opt.shp.svg(opt.col.hex)}</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const shuffled = shuffle(options);
      stage.querySelectorAll('.choice-btn').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          const picked = shuffled[idx];
          if (picked.col.name === target.col.name && picked.shp.id === target.shp.id) {
            Sound.correct();
            Effects.pulse(btn);
            api.addScore(15);
            setTimeout(nextRound, 280);
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    nextRound();
  }
});

// 2. Hayvonlar Tovushi
Platform.register('g_5_7_2', {
  start(stage, api) {
    const animals = [
      { name: 'Mushuk', emoji: '🐱', soundText: 'Miyov-miyov!', freq: 660 },
      { name: 'Kuchuk', emoji: '🐶', soundText: 'Vov-vov!', freq: 240 },
      { name: 'Sigir', emoji: '🐮', soundText: 'Muuu!', freq: 140 },
      { name: 'Xo‘roz', emoji: '🐓', soundText: 'Qu-qu-ri-quu!', freq: 780 },
      { name: 'Qurbaqa', emoji: '🐸', soundText: 'Va-qva!', freq: 310 },
      { name: 'Arslon', emoji: '🦁', soundText: 'R-r-r-r!', freq: 110 }
    ];
    const rounds = api.difficulty === 'easy' ? 5 : api.difficulty === 'medium' ? 7 : 9;
    let step = 0;

    function playAnimalVoice(freq) {
      Sound.playFreq(freq, 'triangle', 0.22, 0);
      Sound.playFreq(freq * 1.15, 'triangle', 0.22, 0.24);
    }

    function next() {
      if (step >= rounds) {
        api.finish({ won: true, message: 'Barcha hayvonlarning tovushini topdingiz!' });
        return;
      }
      step++;
      const ans = animals[randInt(0, animals.length - 1)];
      const choices = shuffle([ans, ...shuffle(animals.filter(a => a.name !== ans.name)).slice(0, 3)]);
      playAnimalVoice(ans.freq);

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Savol: ${step}/${rounds}</span><span>Ball: ${api.getScore()}</span></div>
          <p class="fs-5 fw-bold mb-2">Tovush: „${ans.soundText}”</p>
          <button type="button" id="btn-replay-sound" class="btn-outline-game mb-3">🔊 Tovushni yana eshitish</button>
          <div class="row g-3">
            ${choices.map(c => `
              <div class="col-6">
                <button type="button" class="choice-btn w-100 fs-3" data-name="${c.name}">${c.emoji} <span class="fs-5 d-block">${c.name}</span></button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.getElementById('btn-replay-sound').addEventListener('click', () => playAnimalVoice(ans.freq));
      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.name === ans.name) {
            Sound.correct();
            Effects.pulse(btn);
            api.addScore(20);
            setTimeout(next, 320);
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    next();
  }
});

// 3. Quvnoq Sanash (1–10)
Platform.register('g_5_7_3', {
  start(stage, api) {
    const items = ['🍎', '⭐', '🍓', '🎈', '🍪'];
    const maxN = api.difficulty === 'easy' ? 5 : api.difficulty === 'medium' ? 8 : 10;
    const rounds = 6;
    let r = 0;

    function next() {
      if (r >= rounds) {
        api.finish({ won: true, message: 'Sanashda juda chaqqonsiz!' });
        return;
      }
      r++;
      const count = randInt(1, maxN);
      const icon = items[randInt(0, items.length - 1)];
      const nums = new Set([count]);
      while (nums.size < 4) nums.add(randInt(1, maxN));

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Misol: ${r}/${rounds}</span><span>Ball: ${api.getScore()}</span></div>
          <h3 class="fw-bold mb-3">Nechta ${icon} bor?</h3>
          <div class="p-3 rounded-4 mb-4 fs-2" style="background:var(--accent-soft);">${Array(count).fill(icon).join(' ')}</div>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            ${shuffle([...nums]).map(n => `<button type="button" class="choice-btn fs-3 px-4" data-n="${n}">${n}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Number(btn.dataset.n) === count) {
            Sound.correct();
            Effects.pulse(btn);
            api.addScore(15);
            setTimeout(next, 280);
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    next();
  }
});

// 4. Kichik Xotira
Platform.register('g_5_7_4', {
  start(stage, api) {
    const pairsCount = api.difficulty === 'easy' ? 4 : api.difficulty === 'medium' ? 6 : 8;
    const pool = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🐷'].slice(0, pairsCount);
    const deck = shuffle([...pool, ...pool]);
    let open = [];
    let matched = 0;
    let lock = false;

    const cols = pairsCount <= 4 ? 4 : 4;
    stage.innerHTML = `
      <div class="stage-center-box">
        <div class="game-hud"><span>Juftliklar: <strong id="m-pairs">0</strong>/${pairsCount}</span><span>Ball: ${api.getScore()}</span></div>
        <div class="mem-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
          ${deck.map((sym, i) => `<div class="mem-card" data-i="${i}" data-sym="${sym}">?</div>`).join('')}
        </div>
      </div>
    `;

    stage.querySelectorAll('.mem-card').forEach(card => {
      card.addEventListener('click', () => {
        if (lock || card.classList.contains('revealed') || card.classList.contains('matched')) return;
        Sound.click();
        card.classList.add('revealed');
        card.textContent = card.dataset.sym;
        open.push(card);

        if (open.length === 2) {
          lock = true;
          const [a, b] = open;
          if (a.dataset.sym === b.dataset.sym) {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            document.getElementById('m-pairs').textContent = matched;
            api.addScore(20);
            Sound.correct();
            open = [];
            lock = false;
            if (matched === pairsCount) {
              setTimeout(() => api.finish({ won: true, message: 'Barcha juftliklar topildi!' }), 400);
            }
          } else {
            Sound.wrong();
            Effects.shake(a);
            Effects.shake(b);
            setTimeout(() => {
              a.classList.remove('revealed');
              b.classList.remove('revealed');
              a.textContent = '?';
              b.textContent = '?';
              open = [];
              lock = false;
            }, 650);
          }
        }
      });
    });
  }
});

// 5. Harfni Top!
Platform.register('g_5_7_5', {
  start(stage, api) {
    const words = [
      { letter: 'A', word: 'Anor', emoji: '🍎' },
      { letter: 'B', word: 'Bola', emoji: '🧒' },
      { letter: 'K', word: 'Kitob', emoji: '📘' },
      { letter: 'M', word: 'Mushuk', emoji: '🐱' },
      { letter: 'O', word: 'Olma', emoji: '🍏' },
      { letter: 'S', word: 'Soat', emoji: '⏰' },
      { letter: 'U', word: 'Uy', emoji: '🏠' }
    ];
    const rounds = api.difficulty === 'easy' ? 5 : api.difficulty === 'medium' ? 6 : 7;
    let step = 0;

    function next() {
      if (step >= rounds) {
        api.finish({ won: true, message: 'Harflarni juda yaxshi bilasiz!' });
        return;
      }
      step++;
      const item = words[randInt(0, words.length - 1)];
      const opts = new Set([item.letter]);
      while (opts.size < 4) opts.add(words[randInt(0, words.length - 1)].letter);

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Bosqich: ${step}/${rounds}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="fs-1 mb-1">${item.emoji}</div>
          <h3 class="fw-bold mb-3">„${item.word}” so‘zi qaysi harf bilan boshlanadi?</h3>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            ${shuffle([...opts]).map(ch => `<button type="button" class="choice-btn fs-2 px-4" data-ch="${ch}">${ch}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.ch === item.letter) {
            Sound.correct();
            Effects.pulse(btn);
            api.addScore(15);
            setTimeout(next, 280);
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    next();
  }
});

// 6. Quyoncha Labirinti
Platform.register('g_5_7_6', {
  start(stage, api) {
    const size = api.difficulty === 'easy' ? 4 : api.difficulty === 'medium' ? 5 : 6;
    const walls = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
        if (Math.random() < 0.2) walls.add(`${r},${c}`);
      }
    }
    let pr = 0, pc = 0;
    const gr = size - 1, gc = size - 1;

    function draw() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Quyonchani 🥕 ga olib boring</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid mb-3" style="grid-template-columns: repeat(${size}, 1fr); max-width: 340px;">
            ${Array.from({ length: size * size }, (_, idx) => {
              const r = Math.floor(idx / size), c = idx % size;
              let content = '';
              let extra = '';
              if (r === pr && c === pc) content = '🐇';
              else if (r === gr && c === gc) content = '🥕';
              else if (walls.has(`${r},${c}`)) { content = '🌳'; extra = 'fixed'; }
              return `<div class="grid-cell ${extra}">${content}</div>`;
            }).join('')}
          </div>
          <div class="d-flex flex-column align-items-center gap-2">
            <button type="button" class="choice-btn py-2 px-4" data-dir="up">⬆️</button>
            <div class="d-flex gap-2">
              <button type="button" class="choice-btn py-2 px-4" data-dir="left">⬅️</button>
              <button type="button" class="choice-btn py-2 px-4" data-dir="down">⬇️</button>
              <button type="button" class="choice-btn py-2 px-4" data-dir="right">➡️</button>
            </div>
          </div>
        </div>
      `;

      stage.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('click', () => move(btn.dataset.dir));
      });
    }

    function move(dir) {
      let nr = pr, nc = pc;
      if (dir === 'up') nr--;
      if (dir === 'down') nr++;
      if (dir === 'left') nc--;
      if (dir === 'right') nc++;

      if (nr < 0 || nr >= size || nc < 0 || nc >= size || walls.has(`${nr},${nc}`)) {
        Sound.wrong();
        return;
      }
      Sound.click();
      pr = nr; pc = nc;
      api.addScore(5);
      if (pr === gr && pc === gc) {
        api.addScore(50);
        api.finish({ won: true, message: 'Quyoncha mazali sabziga yetib bordi!' });
      } else {
        draw();
      }
    }

    draw();
  }
});

// 7. Rasmni Yig' (3x3 tartiblash)
Platform.register('g_5_7_7', {
  start(stage, api) {
    const pieces = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    let order = shuffle([...pieces]);
    let selected = null;

    function isSolved() {
      return order.every((v, i) => v === pieces[i]);
    }

    function render() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>1 dan 9 gacha tartiblang</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid" style="grid-template-columns: repeat(3, 1fr); max-width: 300px;">
            ${order.map((p, idx) => `
              <div class="grid-cell fs-3 ${selected === idx ? 'selected' : ''}" data-idx="${idx}">${p}</div>
            `).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const idx = Number(cell.dataset.idx);
          Sound.click();
          if (selected === null) {
            selected = idx;
            render();
          } else {
            [order[selected], order[idx]] = [order[idx], order[selected]];
            selected = null;
            api.addScore(5);
            if (isSolved()) {
              api.addScore(60);
              api.finish({ won: true, message: 'Rasm bo‘laklari to‘g‘ri joylashtirildi!' });
            } else {
              render();
            }
          }
        });
      });
    }

    render();
  }
});

/* --- 7–13 YOSH O'YINLARI (7 ta) --- */

// 8. Super Xotira To'ri
Platform.register('g_7_13_1', {
  start(stage, api) {
    const pairs = api.difficulty === 'easy' ? 6 : api.difficulty === 'medium' ? 8 : 10;
    const pool = ['🚀', '🛸', '🌟', '🎸', '⚽', '🦄', '🦖', '🍦', '🎯', '🌈'].slice(0, pairs);
    const cards = shuffle([...pool, ...pool]);
    let first = null, matched = 0, busy = false;

    stage.innerHTML = `
      <div class="stage-center-box">
        <div class="game-hud"><span>Topildi: <strong id="j-m">0</strong>/${pairs}</span><span>Ball: ${api.getScore()}</span></div>
        <div class="mem-grid" style="grid-template-columns: repeat(4, 1fr);">
          ${cards.map((s, i) => `<div class="mem-card" data-i="${i}" data-s="${s}">?</div>`).join('')}
        </div>
      </div>
    `;

    stage.querySelectorAll('.mem-card').forEach(el => {
      el.addEventListener('click', () => {
        if (busy || el.classList.contains('revealed') || el.classList.contains('matched')) return;
        Sound.click();
        el.classList.add('revealed');
        el.textContent = el.dataset.s;
        if (!first) {
          first = el;
        } else {
          busy = true;
          if (first.dataset.s === el.dataset.s) {
            first.classList.add('matched');
            el.classList.add('matched');
            matched++;
            document.getElementById('j-m').textContent = matched;
            api.addScore(25);
            Sound.correct();
            first = null;
            busy = false;
            if (matched === pairs) setTimeout(() => api.finish({ won: true }), 350);
          } else {
            Sound.wrong();
            Effects.shake(first);
            Effects.shake(el);
            const prev = first;
            first = null;
            setTimeout(() => {
              prev.classList.remove('revealed');
              el.classList.remove('revealed');
              prev.textContent = '?';
              el.textContent = '?';
              busy = false;
            }, 600);
          }
        }
      });
    });
  }
});

// 9. Tez Matematika
Platform.register('g_7_13_2', {
  start(stage, api) {
    let timeLeft = api.difficulty === 'easy' ? 35 : api.difficulty === 'medium' ? 30 : 25;
    let currentAns = 0;

    function genProblem() {
      const max = api.difficulty === 'easy' ? 15 : api.difficulty === 'medium' ? 30 : 50;
      const op = ['+', '-', '×'][randInt(0, api.difficulty === 'easy' ? 1 : 2)];
      let a = randInt(2, max), b = randInt(2, max);
      if (op === '×') { a = randInt(2, 10); b = randInt(2, 10); }
      if (op === '-' && b > a) [a, b] = [b, a];
      currentAns = op === '+' ? a + b : op === '-' ? a - b : a * b;
      return `${a} ${op} ${b}`;
    }

    function renderQ() {
      const q = genProblem();
      const opts = new Set([currentAns]);
      while (opts.size < 4) opts.add(currentAns + randInt(-6, 6));

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Vaqt: <strong id="tm-sec">${timeLeft}</strong>s</span><span>Ball: ${api.getScore()}</span></div>
          <div class="display-4 fw-bold mb-4">${q} = ?</div>
          <div class="row g-2">
            ${shuffle([...opts]).map(v => `<div class="col-6"><button type="button" class="choice-btn w-100 fs-4" data-v="${v}">${v}</button></div>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Number(btn.dataset.v) === currentAns) {
            Sound.correct();
            api.addScore(15);
            renderQ();
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    renderQ();
    const timer = setInterval(() => {
      timeLeft--;
      const el = document.getElementById('tm-sec');
      if (el) el.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        api.finish({ won: api.getScore() >= 45, message: `Vaqt tugadi! Siz ${api.getScore()} ball to‘pladingiz.` });
      }
    }, 1000);

    api.onCleanup(() => clearInterval(timer));
  }
});

// 10. So'z Topish
Platform.register('g_7_13_3', {
  start(stage, api) {
    const words = ['KITOB', 'MAKTAB', 'QUYOSH', 'DOST', 'OLMA', 'YULDUZ', 'TABIAT', 'BILIM'];
    const targetWord = words[randInt(0, words.length - 1)];
    const extra = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const letters = shuffle([...targetWord.split(''), ...shuffle(extra).slice(0, 16 - targetWord.length)]);
    let cursor = 0;

    stage.innerHTML = `
      <div class="stage-center-box">
        <div class="game-hud"><span>So‘zni ketma-ket bosing</span><span>Ball: ${api.getScore()}</span></div>
        <h3 class="fw-bold mb-3">Yashiringan so‘z: <span style="color:var(--accent)">${targetWord}</span></h3>
        <div class="mini-grid mb-3" style="grid-template-columns: repeat(4, 1fr); max-width: 280px;">
          ${letters.map(ch => `<button type="button" class="grid-cell" data-ch="${ch}">${ch}</button>`).join('')}
        </div>
      </div>
    `;

    stage.querySelectorAll('.grid-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('fixed')) return;
        if (btn.dataset.ch === targetWord[cursor]) {
          Sound.correct();
          btn.classList.add('fixed');
          api.addScore(15);
          cursor++;
          if (cursor === targetWord.length) {
            api.addScore(40);
            api.finish({ won: true, message: `"${targetWord}" so‘zi topildi!` });
          }
        } else {
          Sound.wrong();
          Effects.shake(btn);
        }
      });
    });
  }
});

// 11. Simon Ketma-ketligi
Platform.register('g_7_13_4', {
  start(stage, api) {
    const pads = [
      { id: 0, label: 'Qizil', color: '#ef4444', freq: 330 },
      { id: 1, label: 'Yashil', color: '#10b981', freq: 392 },
      { id: 2, label: 'Ko‘k', color: '#3b82f6', freq: 494 },
      { id: 3, label: 'Sariq', color: '#f59e0b', freq: 587 }
    ];
    const targetLen = api.difficulty === 'easy' ? 4 : api.difficulty === 'medium' ? 6 : 8;
    let seq = [];
    let userIdx = 0;
    let locked = true;

    stage.innerHTML = `
      <div class="stage-center-box">
        <div class="game-hud"><span id="sim-status">Diqqat bilan kuzating...</span><span>Ball: ${api.getScore()}</span></div>
        <div class="row g-3 justify-content-center" style="max-width:340px;margin:0 auto;">
          ${pads.map(p => `
            <div class="col-6">
              <button type="button" class="choice-btn w-100 py-4 text-white fw-bold" style="background:${p.color};opacity:0.85;" data-pid="${p.id}">${p.label}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    function playSeq() {
      locked = true;
      userIdx = 0;
      seq.push(randInt(0, 3));
      document.getElementById('sim-status').textContent = `Bosqich ${seq.length}/${targetLen}`;

      seq.forEach((pid, i) => {
        setTimeout(() => {
          const btn = stage.querySelector(`[data-pid="${pid}"]`);
          Sound.playFreq(pads[pid].freq, 'sine', 0.22, 0);
          if (btn) btn.style.transform = 'scale(1.07)';
          setTimeout(() => { if (btn) btn.style.transform = ''; }, 240);
        }, i * 520);
      });

      setTimeout(() => {
        locked = false;
        const st = document.getElementById('sim-status');
        if (st) st.textContent = 'Endi siz qaytaring!';
      }, seq.length * 520 + 200);
    }

    stage.querySelectorAll('[data-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (locked) return;
        const pid = Number(btn.dataset.pid);
        Sound.playFreq(pads[pid].freq, 'sine', 0.16, 0);
        if (pid === seq[userIdx]) {
          userIdx++;
          api.addScore(10);
          if (userIdx === seq.length) {
            if (seq.length >= targetLen) {
              api.finish({ won: true, message: 'Xotirangiz juda kuchli!' });
            } else {
              setTimeout(playSeq, 550);
            }
          }
        } else {
          Sound.wrong();
          api.finish({ won: false, message: 'Ketma-ketlikda xato bo‘ldi.' });
        }
      });
    });

    playSeq();
  }
});

// 12. Sudoku 4x4
Platform.register('g_7_13_5', {
  start(stage, api) {
    const solution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ];
    const blanks = api.difficulty === 'easy' ? 4 : api.difficulty === 'medium' ? 6 : 8;
    const board = solution.map(r => [...r]);
    const fixed = Array.from({ length: 4 }, () => Array(4).fill(true));

    let removed = 0;
    while (removed < blanks) {
      const r = randInt(0, 3), c = randInt(0, 3);
      if (board[r][c] !== 0) {
        board[r][c] = 0;
        fixed[r][c] = false;
        removed++;
      }
    }

    let sel = [0, 0];

    function render() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Sudoku 4×4 (1–4)</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid mb-3" style="grid-template-columns: repeat(4, 1fr); max-width: 240px;">
            ${board.map((row, r) => row.map((val, c) => `
              <div class="grid-cell ${fixed[r][c] ? 'fixed' : ''} ${sel[0] === r && sel[1] === c ? 'selected' : ''}" data-r="${r}" data-c="${c}">${val || ''}</div>
            `).join('')).join('')}
          </div>
          <div class="d-flex justify-content-center gap-2">
            ${[1, 2, 3, 4].map(n => `<button type="button" class="choice-btn py-2 px-3 fs-5" data-n="${n}">${n}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          sel = [Number(cell.dataset.r), Number(cell.dataset.c)];
          render();
        });
      });

      stage.querySelectorAll('[data-n]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [r, c] = sel;
          if (fixed[r][c]) return;
          const n = Number(btn.dataset.n);
          board[r][c] = n;
          if (n === solution[r][c]) {
            Sound.correct();
            api.addScore(15);
          } else {
            Sound.wrong();
          }
          const done = board.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
          if (done) {
            api.finish({ won: true, message: '4×4 Sudoku muvaffaqiyatli yechildi!' });
          } else {
            render();
          }
        });
      });
    }

    render();
  }
});

// 13. Naqshni Davom Ettir
Platform.register('g_7_13_6', {
  start(stage, api) {
    const patterns = [
      { seq: ['🔺', '🔵', '🔺', '🔵', '🔺'], ans: '🔵', opts: ['🔵', '🔺', '🟩', '⭐'] },
      { seq: ['1', '3', '5', '7', '9'], ans: '11', opts: ['11', '10', '12', '13'] },
      { seq: ['🌑', '🌒', '🌓', '🌔'], ans: '🌕', opts: ['🌕', '🌑', '☀️', '🌙'] },
      { seq: ['2', '4', '8', '16'], ans: '32', opts: ['32', '24', '20', '64'] }
    ];
    const total = api.difficulty === 'easy' ? 4 : 6;
    let idx = 0;

    function next() {
      if (idx >= total) {
        api.finish({ won: true, message: 'Mantiqiy naqshlarni aniq topdingiz!' });
        return;
      }
      const p = patterns[idx % patterns.length];
      idx++;

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Naqsh: ${idx}/${total}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="fs-2 fw-bold p-3 rounded-4 mb-4" style="background:var(--accent-soft);">${p.seq.join(' → ')} → ❓</div>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            ${shuffle(p.opts).map(o => `<button type="button" class="choice-btn fs-4 px-4" data-o="${o}">${o}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.o === p.ans) {
            Sound.correct();
            api.addScore(20);
            setTimeout(next, 250);
          } else {
            Sound.wrong();
            Effects.shake(btn);
          }
        });
      });
    }

    next();
  }
});

// 14. Sirpanuvchi Pazl (3x3)
Platform.register('g_7_13_7', {
  start(stage, api) {
    let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // Kichik aralashtirish (har doim yechiladigan holat)
    const moves = api.difficulty === 'easy' ? 12 : api.difficulty === 'medium' ? 24 : 40;
    for (let m = 0; m < moves; m++) {
      const zeroIdx = tiles.indexOf(0);
      const r = Math.floor(zeroIdx / 3), c = zeroIdx % 3;
      const adj = [];
      if (r > 0) adj.push(zeroIdx - 3);
      if (r < 2) adj.push(zeroIdx + 3);
      if (c > 0) adj.push(zeroIdx - 1);
      if (c < 2) adj.push(zeroIdx + 1);
      const pick = adj[randInt(0, adj.length - 1)];
      [tiles[zeroIdx], tiles[pick]] = [tiles[pick], tiles[zeroIdx]];
    }

    function solved() {
      return [1, 2, 3, 4, 5, 6, 7, 8, 0].every((v, i) => tiles[i] === v);
    }

    function draw() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>1–8 tartibga keltiring</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid" style="grid-template-columns: repeat(3, 1fr); max-width: 260px;">
            ${tiles.map((t, i) => `
              <div class="grid-cell ${t === 0 ? 'bg-transparent border-0' : ''}" data-i="${i}">${t || ''}</div>
            `).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const i = Number(cell.dataset.i);
          const z = tiles.indexOf(0);
          const dist = Math.abs(Math.floor(i / 3) - Math.floor(z / 3)) + Math.abs((i % 3) - (z % 3));
          if (dist === 1) {
            Sound.click();
            [tiles[i], tiles[z]] = [tiles[z], tiles[i]];
            api.addScore(5);
            if (solved()) {
              api.addScore(50);
              api.finish({ won: true, message: 'Pazl muvaffaqiyatli yig‘ildi!' });
            } else {
              draw();
            }
          }
        });
      });
    }

    draw();
  }
});

/* --- 13–19 YOSH O'YINLARI (7 ta) --- */

// 15. Sudoku 6x6
Platform.register('g_13_19_1', {
  start(stage, api) {
    const sol = [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 3, 1, 2]
    ];
    const hideCount = api.difficulty === 'easy' ? 10 : api.difficulty === 'medium' ? 14 : 18;
    const grid = sol.map(r => [...r]);
    const fixed = Array.from({ length: 6 }, () => Array(6).fill(true));
    let removed = 0;
    while (removed < hideCount) {
      const r = randInt(0, 5), c = randInt(0, 5);
      if (grid[r][c] !== 0) { grid[r][c] = 0; fixed[r][c] = false; removed++; }
    }
    let sel = [0, 0];

    function render() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Sudoku 6×6 (1–6)</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid mb-3" style="grid-template-columns: repeat(6, 1fr); max-width: 320px;">
            ${grid.map((row, r) => row.map((v, c) => `
              <div class="grid-cell ${fixed[r][c] ? 'fixed' : ''} ${sel[0] === r && sel[1] === c ? 'selected' : ''}" data-r="${r}" data-c="${c}">${v || ''}</div>
            `).join('')).join('')}
          </div>
          <div class="d-flex justify-content-center gap-2 flex-wrap">
            ${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="choice-btn py-2 px-3" data-n="${n}">${n}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(el => {
        el.addEventListener('click', () => { sel = [Number(el.dataset.r), Number(el.dataset.c)]; render(); });
      });

      stage.querySelectorAll('[data-n]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [r, c] = sel;
          if (fixed[r][c]) return;
          const n = Number(btn.dataset.n);
          grid[r][c] = n;
          if (n === sol[r][c]) { Sound.correct(); api.addScore(15); } else { Sound.wrong(); }
          if (grid.every((row, ri) => row.every((v, ci) => v === sol[ri][ci]))) {
            api.finish({ won: true, message: '6×6 Sudoku mukammal yakunlandi!' });
          } else {
            render();
          }
        });
      });
    }

    render();
  }
});

// 16. 2048 Raqamlar
Platform.register('g_13_19_2', {
  start(stage, api) {
    const target = api.difficulty === 'easy' ? 128 : api.difficulty === 'medium' ? 256 : 512;
    let b = Array.from({ length: 4 }, () => Array(4).fill(0));

    function spawn() {
      const empty = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c] === 0) empty.push([r, c]);
      if (empty.length) {
        const [r, c] = empty[randInt(0, empty.length - 1)];
        b[r][c] = Math.random() < 0.85 ? 2 : 4;
      }
    }

    function slideRow(row) {
      const nums = row.filter(x => x !== 0);
      const out = [];
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === nums[i + 1]) {
          const merged = nums[i] * 2;
          out.push(merged);
          api.addScore(merged);
          i++;
        } else {
          out.push(nums[i]);
        }
      }
      while (out.length < 4) out.push(0);
      return out;
    }

    function move(dir) {
      const prev = JSON.stringify(b);
      if (dir === 'left') {
        b = b.map(slideRow);
      } else if (dir === 'right') {
        b = b.map(r => slideRow([...r].reverse()).reverse());
      } else if (dir === 'up') {
        for (let c = 0; c < 4; c++) {
          const col = slideRow([b[0][c], b[1][c], b[2][c], b[3][c]]);
          for (let r = 0; r < 4; r++) b[r][c] = col[r];
        }
      } else if (dir === 'down') {
        for (let c = 0; c < 4; c++) {
          const col = slideRow([b[3][c], b[2][c], b[1][c], b[0][c]]).reverse();
          for (let r = 0; r < 4; r++) b[r][c] = col[r];
        }
      }
      if (JSON.stringify(b) !== prev) {
        Sound.click();
        spawn();
        const maxVal = Math.max(...b.flat());
        if (maxVal >= target) {
          api.finish({ won: true, message: `Siz ${target} plitkasiga yetdingiz!` });
          return;
        }
      }
      draw();
    }

    function draw() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Maqsad: ${target}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid mb-3" style="grid-template-columns: repeat(4, 1fr); max-width: 280px;">
            ${b.flat().map(v => `<div class="grid-cell ${v ? 'fixed' : ''}">${v || ''}</div>`).join('')}
          </div>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="choice-btn py-2 px-3" data-m="left">⬅️</button>
            <button type="button" class="choice-btn py-2 px-3" data-m="up">⬆️</button>
            <button type="button" class="choice-btn py-2 px-3" data-m="down">⬇️</button>
            <button type="button" class="choice-btn py-2 px-3" data-m="right">➡️</button>
          </div>
        </div>
      `;
      stage.querySelectorAll('[data-m]').forEach(btn => btn.addEventListener('click', () => move(btn.dataset.m)));
    }

    spawn(); spawn(); draw();
  }
});

// 17. Mantiqiy Jumboqlar
Platform.register('g_13_19_3', {
  start(stage, api) {
    const qs = [
      { q: 'Qaysi oy 28 kunga ega?', a: 'Barcha oylar', opts: ['Fevral', 'Barcha oylar', 'Iyun', 'Avgust'] },
      { q: 'Stolning 4 burchagi bor. 1 burchagi kesilsa, nechta burchak qoladi?', a: '5 ta', opts: ['3 ta', '4 ta', '5 ta', '0 ta'] },
      { q: 'Otish mumkin, lekin yiqilmaydi. Bu nima?', a: 'Kamondan o‘q', opts: ['Tosh', 'Kamondan o‘q', 'Koptok', 'Suv'] },
      { q: '3 ta olma bor edi, 2 tasini oldingiz. Sizda nechta olma bor?', a: '2 ta', opts: ['1 ta', '2 ta', '3 ta', '5 ta'] }
    ];
    let idx = 0;

    function next() {
      if (idx >= qs.length) {
        api.finish({ won: true, message: 'Mantiqiy jumboqlarni zehnin bilan yechdingiz!' });
        return;
      }
      const item = qs[idx++];
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Jumboq: ${idx}/${qs.length}</span><span>Ball: ${api.getScore()}</span></div>
          <h4 class="fw-bold mb-4">${item.q}</h4>
          <div class="row g-2">
            ${shuffle(item.opts).map(o => `<div class="col-6"><button type="button" class="choice-btn w-100" data-a="${o}">${o}</button></div>`).join('')}
          </div>
        </div>
      `;
      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.a === item.a) { Sound.correct(); api.addScore(25); setTimeout(next, 250); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }
    next();
  }
});

// 18. Anagramma Ustasi
Platform.register('g_13_19_4', {
  start(stage, api) {
    const bank = ['MANTIQ', 'TEXNOLOGIYA', 'TAFAKKUR', 'CHUQURLIK', 'KELAJAK', 'ISTIQBOL'];
    const total = api.difficulty === 'easy' ? 4 : 6;
    let step = 0, word = '';

    function next() {
      if (step >= total) {
        api.finish({ won: true, message: 'Anagrammalarni a’lo darajada yechdingiz!' });
        return;
      }
      step++;
      word = bank[randInt(0, bank.length - 1)];
      let mixed = shuffle(word.split('')).join(' • ');
      const opts = shuffle([word, ...shuffle(bank.filter(w => w !== word)).slice(0, 3)]);

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>So‘z: ${step}/${total}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="fs-3 fw-bold p-3 rounded-4 mb-4" style="background:var(--accent-soft);">${mixed}</div>
          <div class="row g-2">
            ${opts.map(o => `<div class="col-6"><button type="button" class="choice-btn w-100" data-w="${o}">${o}</button></div>`).join('')}
          </div>
        </div>
      `;
      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.w === word) { Sound.correct(); api.addScore(20); setTimeout(next, 250); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }
    next();
  }
});

// 19. Tezkor Zehn Hisobi
Platform.register('g_13_19_5', {
  start(stage, api) {
    const total = api.difficulty === 'easy' ? 6 : api.difficulty === 'medium' ? 8 : 10;
    let step = 0, ans = 0;

    function next() {
      if (step >= total) {
        api.finish({ won: true, message: 'Zehn hisobi mashqi yakunlandi!' });
        return;
      }
      step++;
      const a = randInt(3, 12), b = randInt(2, 9), c = randInt(1, 15);
      ans = a * b + c;
      const opts = new Set([ans]);
      while (opts.size < 4) opts.add(ans + randInt(-8, 8));

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Misol: ${step}/${total}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="display-5 fw-bold mb-4">(${a} × ${b}) + ${c} = ?</div>
          <div class="row g-2">
            ${shuffle([...opts]).map(v => `<div class="col-6"><button type="button" class="choice-btn w-100 fs-4" data-v="${v}">${v}</button></div>`).join('')}
          </div>
        </div>
      `;
      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Number(btn.dataset.v) === ans) { Sound.correct(); api.addScore(20); setTimeout(next, 220); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }
    next();
  }
});

// 20. Reaksiya Testi
Platform.register('g_13_19_6', {
  start(stage, api) {
    const trials = api.difficulty === 'easy' ? 3 : api.difficulty === 'medium' ? 4 : 5;
    let cur = 0, greenTime = 0, ready = false, tOut = null;

    function runTrial() {
      if (cur >= trials) {
        api.finish({ won: true, message: 'Reaksiya sinovi muvaffaqiyatli o‘tdi!' });
        return;
      }
      cur++;
      ready = false;
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Urinish: ${cur}/${trials}</span><span>Ball: ${api.getScore()}</span></div>
          <button type="button" id="react-pad" class="w-100 py-5 rounded-4 border-0 text-white fs-3 fw-bold" style="background:#ef4444;">
            Yashil rang yonishini kuting...
          </button>
        </div>
      `;

      tOut = setTimeout(() => {
        ready = true;
        greenTime = performance.now();
        const pad = document.getElementById('react-pad');
        if (pad) {
          pad.style.background = '#10b981';
          pad.textContent = 'HOZIR BOSING! ⚡';
        }
      }, randInt(1200, 2800));

      document.getElementById('react-pad').addEventListener('click', () => {
        if (!ready) {
          clearTimeout(tOut);
          Sound.wrong();
          Effects.toast('Erta bosildi! Qayta urining.');
          cur--;
          setTimeout(runTrial, 500);
          return;
        }
        const ms = Math.round(performance.now() - greenTime);
        Sound.correct();
        const pts = Math.max(10, 60 - Math.floor(ms / 15));
        api.addScore(pts);
        Effects.toast(`Reaksiya: ${ms} ms (+${pts} ball)`);
        setTimeout(runTrial, 650);
      });
    }

    api.onCleanup(() => clearTimeout(tOut));
    runTrial();
  }
});

// 21. Hanoi Minorasi
Platform.register('g_13_19_7', {
  start(stage, api) {
    const n = api.difficulty === 'easy' ? 3 : api.difficulty === 'medium' ? 4 : 5;
    const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
    let selectedPeg = null;
    let moves = 0;

    function draw() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Yurishlar: ${moves}</span><span>Maqsad: 3-ustun</span></div>
          <div class="row g-3">
            ${pegs.map((stack, pIdx) => `
              <div class="col-4">
                <div class="p-3 rounded-4 h-100 d-flex flex-column justify-content-end align-items-center" style="min-height:190px;background:var(--accent-soft);border:2px solid ${selectedPeg === pIdx ? 'var(--accent)' : 'var(--border-color)'};cursor:pointer;" data-peg="${pIdx}">
                  ${[...stack].reverse().map(disk => `
                    <div class="my-1 rounded-pill text-white fw-bold small py-1 text-center" style="width:${36 + disk * 14}px;background:var(--accent);">${disk}</div>
                  `).join('')}
                  <div class="mt-2 fw-bold small">Ustun ${pIdx + 1}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('[data-peg]').forEach(el => {
        el.addEventListener('click', () => {
          const pIdx = Number(el.dataset.peg);
          if (selectedPeg === null) {
            if (pegs[pIdx].length) { selectedPeg = pIdx; Sound.click(); draw(); }
          } else {
            if (selectedPeg === pIdx) { selectedPeg = null; draw(); return; }
            const from = pegs[selectedPeg], to = pegs[pIdx];
            const movingDisk = from[from.length - 1];
            const topTarget = to[to.length - 1];
            if (!topTarget || movingDisk < topTarget) {
              to.push(from.pop());
              moves++;
              api.addScore(10);
              Sound.correct();
            } else {
              Sound.wrong();
              Effects.toast('Katta halqa kichigining ustiga qo‘yilmaydi!');
            }
            selectedPeg = null;
            if (pegs[2].length === n) {
              api.addScore(80);
              api.finish({ won: true, message: `Hanoi minorasi ${moves} yurishda yakunlandi!` });
            } else {
              draw();
            }
          }
        });
      });
    }

    draw();
  }
});

/* --- 19+ YOSH O'YINLARI (7 ta) --- */

// 22. Pro Sudoku 9x9 (boshlang'ich tayyor mantiqiy maydon)
Platform.register('g_19_plus_1', {
  start(stage, api) {
    const base = [
      5,3,4,6,7,8,9,1,2,
      6,7,2,1,9,5,3,4,8,
      1,9,8,3,4,2,5,6,7,
      8,5,9,7,6,1,4,2,3,
      4,2,6,8,5,3,7,9,1,
      7,1,3,9,2,4,8,5,6,
      9,6,1,5,3,7,2,8,4,
      2,8,7,4,1,9,6,3,5,
      3,4,5,2,8,6,1,7,9
    ];
    const hideN = api.difficulty === 'easy' ? 12 : api.difficulty === 'medium' ? 20 : 28;
    const cur = [...base];
    const fixed = Array(81).fill(true);
    let h = 0;
    while (h < hideN) {
      const idx = randInt(0, 80);
      if (cur[idx] !== 0) { cur[idx] = 0; fixed[idx] = false; h++; }
    }
    let selIdx = 0;

    function render() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Sudoku 9×9</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid mb-3" style="grid-template-columns: repeat(9, 1fr); max-width: 360px; gap: 3px;">
            ${cur.map((v, i) => `
              <div class="grid-cell ${fixed[i] ? 'fixed' : ''} ${selIdx === i ? 'selected' : ''}" style="font-size:0.9rem;border-radius:6px;" data-i="${i}">${v || ''}</div>
            `).join('')}
          </div>
          <div class="d-flex justify-content-center gap-1 flex-wrap">
            ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" class="choice-btn py-1 px-3" data-n="${n}">${n}</button>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(el => {
        el.addEventListener('click', () => { selIdx = Number(el.dataset.i); render(); });
      });

      stage.querySelectorAll('[data-n]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (fixed[selIdx]) return;
          const n = Number(btn.dataset.n);
          cur[selIdx] = n;
          if (n === base[selIdx]) { Sound.correct(); api.addScore(15); } else { Sound.wrong(); }
          if (cur.every((v, i) => v === base[i])) {
            api.finish({ won: true, message: '9×9 Sudoku to‘liq yechildi!' });
          } else {
            render();
          }
        });
      });
    }

    render();
  }
});

// 23. N-Back Xotira
Platform.register('g_19_plus_2', {
  start(stage, api) {
    const nBack = api.difficulty === 'easy' ? 1 : api.difficulty === 'medium' ? 2 : 3;
    const totalSteps = 12;
    const syms = ['🔷', '🔶', '🔺', '🟢', '🟣'];
    const seq = Array.from({ length: totalSteps }, () => syms[randInt(0, syms.length - 1)]);
    // Kamida 3 ta moslik hosil qilamiz
    for (let i = nBack; i < totalSteps; i += 3) {
      seq[i] = seq[i - nBack];
    }

    let idx = 0;

    function showStep() {
      if (idx >= totalSteps) {
        api.finish({ won: true, message: `${nBack}-Back mashqi yakunlandi!` });
        return;
      }
      const curSym = seq[idx];
      const isMatch = idx >= nBack && seq[idx] === seq[idx - nBack];

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>${nBack}-Back | Qadam ${idx + 1}/${totalSteps}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="display-2 my-4">${curSym}</div>
          <div class="d-flex justify-content-center gap-3">
            <button type="button" id="btn-match" class="btn-primary-game">✅ Mos keladi (${nBack}-qadam)</button>
            <button type="button" id="btn-nomatch" class="btn-outline-game">❌ Farq qiladi</button>
          </div>
        </div>
      `;

      const answer = (userSaysMatch) => {
        if (idx < nBack) {
          Sound.click();
          idx++;
          showStep();
          return;
        }
        if (userSaysMatch === isMatch) {
          Sound.correct();
          api.addScore(20);
        } else {
          Sound.wrong();
        }
        idx++;
        showStep();
      };

      document.getElementById('btn-match').addEventListener('click', () => answer(true));
      document.getElementById('btn-nomatch').addEventListener('click', () => answer(false));
    }

    showStep();
  }
});

// 24. Stroop Diqqat Testi
Platform.register('g_19_plus_3', {
  start(stage, api) {
    const palette = [
      { label: 'QIZIL', hex: '#ef4444' },
      { label: 'KO‘K', hex: '#2563eb' },
      { label: 'YASHIL', hex: '#16a34a' },
      { label: 'SARIQ', hex: '#eab308' }
    ];
    const total = api.difficulty === 'easy' ? 8 : api.difficulty === 'medium' ? 12 : 16;
    let step = 0;

    function next() {
      if (step >= total) {
        api.finish({ won: true, message: 'Stroop diqqat testini muvaffaqiyatli yakunladingiz!' });
        return;
      }
      step++;
      const wordItem = palette[randInt(0, palette.length - 1)];
      const inkItem = palette[randInt(0, palette.length - 1)];

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Sinov: ${step}/${total}</span><span>Ball: ${api.getScore()}</span></div>
          <p class="text-muted fw-bold">Matnning RANGINI tanlang:</p>
          <div class="display-3 fw-bold my-4" style="color:${inkItem.hex};">${wordItem.label}</div>
          <div class="row g-2">
            ${palette.map(p => `<div class="col-6"><button type="button" class="choice-btn w-100" data-hex="${p.hex}">${p.label}</button></div>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.hex === inkItem.hex) { Sound.correct(); api.addScore(15); setTimeout(next, 200); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }

    next();
  }
});

// 25. Shifrni Yechish
Platform.register('g_19_plus_4', {
  start(stage, api) {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const words = ['OLTIN', 'MAQSAD', 'BILIM', 'YUTUQ', 'KOD', 'SIR'];
    const shift = api.difficulty === 'easy' ? 1 : api.difficulty === 'medium' ? 2 : 3;
    const total = 5;
    let step = 0, plain = '';

    function encode(str, s) {
      return str.split('').map(ch => {
        const idx = alpha.indexOf(ch);
        return idx === -1 ? ch : alpha[(idx + s) % alpha.length];
      }).join('');
    }

    function next() {
      if (step >= total) {
        api.finish({ won: true, message: 'Barcha maxfiy so‘zlar ochildi!' });
        return;
      }
      step++;
      plain = words[randInt(0, words.length - 1)];
      const cipher = encode(plain, shift);
      const opts = shuffle([plain, ...shuffle(words.filter(w => w !== plain)).slice(0, 3)]);

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Siljish: +${shift} | ${step}/${total}</span><span>Ball: ${api.getScore()}</span></div>
          <p class="text-muted">Harflarni ${shift} qadam orqaga surib asl so‘zni toping:</p>
          <div class="display-4 fw-bold p-3 rounded-4 mb-4" style="background:var(--accent-soft);letter-spacing:6px;">${cipher}</div>
          <div class="row g-2">
            ${opts.map(o => `<div class="col-6"><button type="button" class="choice-btn w-100" data-p="${o}">${o}</button></div>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.p === plain) { Sound.correct(); api.addScore(25); setTimeout(next, 250); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }

    next();
  }
});

// 26. Mantiqiy Ketma-ketlik
Platform.register('g_19_plus_5', {
  start(stage, api) {
    const seqs = [
      { arr: [3, 6, 12, 24], ans: 48 },
      { arr: [1, 4, 9, 16], ans: 25 },
      { arr: [2, 5, 10, 17], ans: 26 },
      { arr: [100, 91, 82, 73], ans: 64 },
      { arr: [1, 1, 2, 3, 5], ans: 8 }
    ];
    let idx = 0;

    function next() {
      if (idx >= seqs.length) {
        api.finish({ won: true, message: 'Sonli qatorlar qonuniyatini aniq topdingiz!' });
        return;
      }
      const item = seqs[idx++];
      const opts = new Set([item.ans]);
      while (opts.size < 4) opts.add(item.ans + randInt(-9, 12));

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Qator: ${idx}/${seqs.length}</span><span>Ball: ${api.getScore()}</span></div>
          <div class="fs-2 fw-bold p-3 rounded-4 mb-4" style="background:var(--accent-soft);">${item.arr.join(', ')}, ?</div>
          <div class="row g-2">
            ${shuffle([...opts]).map(v => `<div class="col-6"><button type="button" class="choice-btn w-100 fs-4" data-v="${v}">${v}</button></div>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Number(btn.dataset.v) === item.ans) { Sound.correct(); api.addScore(25); setTimeout(next, 250); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }

    next();
  }
});

// 27. Vaqtga Qarshi Hisob
Platform.register('g_19_plus_6', {
  start(stage, api) {
    let sec = api.difficulty === 'easy' ? 35 : api.difficulty === 'medium' ? 30 : 25;
    let ans = 0;

    function makeTask() {
      const base = randInt(4, 14);
      const mult = randInt(2, 6);
      const add = randInt(5, 25);
      ans = base * mult + add;
      return `${base} × ${mult} + ${add}`;
    }

    function drawQ() {
      const expr = makeTask();
      const opts = new Set([ans]);
      while (opts.size < 4) opts.add(ans + randInt(-10, 10));

      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Vaqt: <strong id="bl-sec">${sec}</strong>s</span><span>Ball: ${api.getScore()}</span></div>
          <div class="display-4 fw-bold mb-4">${expr} = ?</div>
          <div class="row g-2">
            ${shuffle([...opts]).map(v => `<div class="col-6"><button type="button" class="choice-btn w-100 fs-4" data-v="${v}">${v}</button></div>`).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Number(btn.dataset.v) === ans) { Sound.correct(); api.addScore(20); drawQ(); }
          else { Sound.wrong(); Effects.shake(btn); }
        });
      });
    }

    drawQ();
    const iv = setInterval(() => {
      sec--;
      const el = document.getElementById('bl-sec');
      if (el) el.textContent = sec;
      if (sec <= 0) {
        clearInterval(iv);
        api.finish({ won: api.getScore() >= 60, message: `Blits yakunlandi! Ball: ${api.getScore()}` });
      }
    }, 1000);

    api.onCleanup(() => clearInterval(iv));
  }
});

// 28. Strategik Chiroqlar (Lights Out 3x3)
Platform.register('g_19_plus_7', {
  start(stage, api) {
    let lights = Array(9).fill(false);
    const seedClicks = api.difficulty === 'easy' ? 2 : api.difficulty === 'medium' ? 3 : 5;

    function toggle(idx) {
      const r = Math.floor(idx / 3), c = idx % 3;
      const targets = [idx];
      if (r > 0) targets.push(idx - 3);
      if (r < 2) targets.push(idx + 3);
      if (c > 0) targets.push(idx - 1);
      if (c < 2) targets.push(idx + 1);
      targets.forEach(t => { lights[t] = !lights[t]; });
    }

    for (let i = 0; i < seedClicks; i++) toggle(randInt(0, 8));
    if (lights.every(x => !x)) toggle(4);

    function render() {
      stage.innerHTML = `
        <div class="stage-center-box">
          <div class="game-hud"><span>Barcha chiroqlarni o‘chiring</span><span>Ball: ${api.getScore()}</span></div>
          <div class="mini-grid" style="grid-template-columns: repeat(3, 1fr); max-width: 260px;">
            ${lights.map((on, i) => `
              <div class="grid-cell ${on ? 'lit' : ''}" data-i="${i}">${on ? '💡' : '🌑'}</div>
            `).join('')}
          </div>
        </div>
      `;

      stage.querySelectorAll('.grid-cell').forEach(el => {
        el.addEventListener('click', () => {
          Sound.click();
          toggle(Number(el.dataset.i));
          api.addScore(5);
          if (lights.every(x => !x)) {
            api.addScore(75);
            api.finish({ won: true, message: 'Barcha chiroqlar muvaffaqiyatli o‘chirildi!' });
          } else {
            render();
          }
        });
      });
    }

    render();
  }
});