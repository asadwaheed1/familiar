/* ==========================================================================
   Familiar — game logic
   Rituals feed a ghost. Missed days drain its essence. At zero, it dies —
   and only a séance brings it back.
   ========================================================================== */

(function () {
  'use strict';

  const { STAGES, GhostActor, renderGhostIcon } = window.FamiliarSprites;

  /* ---------------- Tuning ---------------- */

  const FEED_HEAL = 12;        // essence gained per completed ritual
  const MISS_DECAY = 10;       // essence lost per ritual per missed day
  const MAX_HEALTH = 100;
  const CATCHUP_CAP = 60;      // mercy cap on multi-day decay
  const STAGE_SOULS = [0, 12, 30, 60];
  const ALL_DONE_BONUS = 5;

  /* ---------------- Copy ---------------- */

  const LINES = {
    happy: [
      'The night is kind, keeper.',
      'Fed and floating. Lovely.',
      'I feel deliciously wicked tonight.',
      'Another soul, another shiver.',
    ],
    ok: [
      'A little hungry, but I linger.',
      'Keep the rituals, keeper.',
      'The candles still burn for me.',
      'I drift. I wait. I believe.',
    ],
    hungry: [
      'I grow thin as fog…',
      'One ritual. That is all I ask.',
      'The veil pulls at my hem.',
      'Your promises taste of dust.',
    ],
    dying: [
      'So cold in here…',
      'I can see the graveyard gate…',
      'Keeper… do not forget me…',
    ],
  };

  const EPITAPHS = [
    '“A promise unkept is a candle unlit.”',
    '“Fed on intentions, starved on follow-through.”',
    '“Gone where unfinished rituals go.”',
    '“It waited. It faded. It forgives.”',
  ];

  const SEED_RITUALS = [
    { icon: '🕯️', name: 'Light a candle' },
    { icon: '📖', name: 'Read 10 pages' },
    { icon: '🦴', name: 'Move your bones' },
  ];

  /* ---------------- State ---------------- */

  let state = null;
  let ghost = null;
  let toastTimer = null;

  const $ = (s) => document.querySelector(s);

  /* ---------------- Date helpers ---------------- */

  function todayStr(d = new Date()) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function shiftDay(str, n) {
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return todayStr(dt);
  }

  function diffDays(a, b) {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);
    return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000);
  }

  function prettyDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---------------- Save ---------------- */

  function save() { window.Store.save(state); }

  /* ---------------- Streaks ---------------- */

  function completedToday(r) { return r.history.includes(todayStr()); }

  function streakOf(r) {
    const set = new Set(r.history);
    let d = todayStr();
    if (!set.has(d)) {
      const y = shiftDay(d, -1);
      if (!set.has(y)) return 0;
      d = y;
    }
    let n = 0;
    while (set.has(d) && !(state.streakWipeDate && d <= state.streakWipeDate)) {
      n++;
      d = shiftDay(d, -1);
    }
    return n;
  }

  /* ---------------- Daily decay ---------------- */

  function rollover() {
    const today = todayStr();
    if (!state.lastOpen) { state.lastOpen = today; return; }
    const gap = diffDays(state.lastOpen, today);
    if (gap <= 0) return;

    let decay = 0;
    const days = Math.min(gap, 30);
    for (let i = 1; i <= days; i++) {
      const day = shiftDay(today, -i);
      for (const r of state.rituals) {
        if (!r.history.includes(day)) decay += MISS_DECAY;
      }
    }
    decay = Math.min(decay, CATCHUP_CAP);
    if (decay > 0 && !state.dead) {
      state.health = Math.max(0, state.health - decay);
      toast(`The haunted days took their toll… −${decay} essence`);
      if (state.health <= 0) killGhost();
    }
    state.lastOpen = today;
  }

  /* ---------------- Death & revival ---------------- */

  function killGhost() {
    if (state.dead) return;
    state.dead = true;
    state.deathDate = todayStr();
    save();
    window.Sounds.death();
    if (ghost) ghost.die();
    say('…', true);
  }

  function showGrave() {
    $('#tombName').textContent = state.name;
    $('#tombDates').textContent = 'd. ' + prettyDate(state.deathDate || todayStr());
    $('#tombEpitaph').textContent = EPITAPHS[Math.floor(Math.random() * EPITAPHS.length)];
    $('#graveOverlay').hidden = false;
  }

  function revive() {
    state.dead = false;
    state.health = 40;
    state.stage = 0;
    state.streakWipeDate = todayStr();
    save();
    $('#graveOverlay').hidden = true;
    ghost.revive();
    ghost.resize();
    window.Sounds.revive();
    toast('The séance holds — your familiar returns.');
    updateHeader();
    updateEssence();
    renderRituals();
    say('Back from beyond… feed me better this time.');
  }

  /* ---------------- Evolution ---------------- */

  function stageIndexFor(souls) {
    let idx = 0;
    for (let i = 0; i < STAGE_SOULS.length; i++) {
      if (souls >= STAGE_SOULS[i]) idx = i;
    }
    return idx;
  }

  function checkEvolve() {
    const idx = stageIndexFor(state.souls);
    if (idx > state.stage) {
      state.stage = idx;
      save();
      ghost.resize();
      window.Sounds.evolve();
      toast(`✨ Evolution — your familiar is now a ${STAGES[idx].name}!`);
      burstAtGhost(14, ['#a78bfa', '#fbbf24', '#6ee7b7']);
      say('I feel… more.');
      updateHeader();
    }
  }

  function checkAllDone() {
    if (!state.rituals.length || state.dead) return;
    const today = todayStr();
    if (state.bonusDate === today) return;
    if (state.rituals.every(completedToday)) {
      state.bonusDate = today;
      state.health = Math.min(MAX_HEALTH, state.health + ALL_DONE_BONUS);
      save();
      window.Sounds.allDone();
      toast('🕯️ All rituals complete — your familiar feasts tonight!');
      burstAtGhost(10);
      ghost.dance(1400);
      updateEssence();
      say('A feast! A feast in my honor!');
    }
  }

  /* ---------------- Ritual actions ---------------- */

  function completeRitual(r, btnEl) {
    r.history.push(todayStr());
    state.souls++;
    state.health = Math.min(MAX_HEALTH, state.health + FEED_HEAL);
    save();
    flyOrb(btnEl, () => {
      ghost.feedPulse();
      burstAtGhost(6);
    });
    window.Sounds.feed();
    updateEssence();
    renderRituals();
    updateHeader();
    checkEvolve();
    checkAllDone();
    if (Math.random() < 0.35) say(pick(LINES.happy));
  }

  function uncompleteRitual(r) {
    const t = todayStr();
    const i = r.history.lastIndexOf(t);
    if (i >= 0) r.history.splice(i, 1);
    state.souls = Math.max(0, state.souls - 1);
    state.health = Math.max(1, state.health - FEED_HEAL);
    save();
    updateEssence();
    renderRituals();
    updateHeader();
    toast('Ritual undone — your familiar pines.');
  }

  function addRitual(name, icon) {
    state.rituals.push({
      id: 'r' + Date.now() + Math.floor(Math.random() * 999),
      icon,
      name,
      createdAt: todayStr(),
      history: [],
    });
    save();
    renderRituals();
    toast('Ritual summoned.');
    if (state.rituals.length === 1) say('A ritual! I shall watch you keep it.');
  }

  function removeRitual(r) {
    state.rituals = state.rituals.filter((x) => x.id !== r.id);
    save();
    renderRituals();
    toast('Ritual banished.');
  }

  /* ---------------- Rendering ---------------- */

  let lastHealth = null;

  function updateEssence() {
    const h = state.health;
    const fill = $('#essenceFill');
    fill.style.width = h + '%';
    fill.classList.toggle('mid', h <= 55 && h > 25);
    fill.classList.toggle('low', h <= 25);
    $('#essenceNum').textContent = h;
    if (lastHealth !== null && lastHealth > 25 && h <= 25 && !state.dead) {
      window.Sounds.whimper();
      say(pick(LINES.hungry));
    }
    lastHealth = h;
  }

  function renderPumpkins() {
    const patch = $('#pumpkins');
    if (!patch) return;
    patch.innerHTML = '';
    const total = Math.floor(state.souls / 10);
    const shown = Math.min(8, total);
    for (let i = 0; i < shown; i++) {
      const p = document.createElement('span');
      p.textContent = '🎃';
      p.style.fontSize = (14 + (i % 3) * 3) + 'px';
      p.style.transform = `rotate(${((i % 5) - 2) * 7}deg) translateY(${(i % 2) * 3}px)`;
      patch.appendChild(p);
    }
    if (total > 8) {
      const more = document.createElement('span');
      more.className = 'pumpkin-more';
      more.textContent = `+${total - 8}`;
      patch.appendChild(more);
    }
  }

  function updateHeader() {
    $('#soulCount').textContent = state.souls;
    $('#stageBadge').textContent = STAGES[state.stage].name;
    document.querySelector('.souls-pill .stat-suffix').textContent =
      state.souls === 1 ? 'soul' : 'souls';
    const nameEl = $('#ghostName');
    nameEl.hidden = false;
    nameEl.innerHTML = `<b></b> · <span class="stage-name"></span>`;
    nameEl.querySelector('b').textContent = state.name;
    nameEl.querySelector('.stage-name').textContent = STAGES[state.stage].name;
    const progress = $('#stageProgress');
    if (state.stage < STAGES.length - 1) {
      progress.textContent = `${state.souls}/${STAGE_SOULS[state.stage + 1]} souls → ${STAGES[state.stage + 1].name}`;
    } else {
      progress.textContent = 'MAX EVOLUTION 👑';
    }
    renderPumpkins();
  }

  function renderRituals() {
    const list = $('#ritualList');
    list.innerHTML = '';
    const dead = state.dead;

    for (const r of state.rituals) {
      const done = completedToday(r);
      const streak = streakOf(r);

      const li = document.createElement('li');
      li.className = 'ritual' + (done ? ' done' : '') + (dead ? ' is-dead' : '');

      const icon = document.createElement('span');
      icon.className = 'r-icon';
      icon.textContent = r.icon;

      const body = document.createElement('div');
      body.className = 'r-body';
      const name = document.createElement('span');
      name.className = 'r-name';
      name.textContent = r.name;
      const meta = document.createElement('span');
      meta.className = 'r-meta';
      const streakTxt = streak === 0 ? 'no streak yet' : `🔥 <b>${streak}</b>-day streak`;
      meta.innerHTML = done
        ? `fed tonight · ${streakTxt}`
        : `+${FEED_HEAL} essence · ${streakTxt}`;
      body.append(name, meta);

      const check = document.createElement('button');
      check.className = 'r-check';
      check.type = 'button';
      check.textContent = done ? '✓' : '○';
      check.setAttribute('aria-label', done ? `Undo ritual: ${r.name}` : `Complete ritual: ${r.name}`);
      check.dataset.action = 'toggle';
      check.dataset.id = r.id;

      const del = document.createElement('button');
      del.className = 'r-del';
      del.type = 'button';
      del.textContent = '✕';
      del.setAttribute('aria-label', `Banish ritual: ${r.name}`);
      del.dataset.action = 'del';
      del.dataset.id = r.id;

      li.append(icon, body, check, del);
      list.appendChild(li);
    }

    $('#emptyState').hidden = state.rituals.length > 0;
  }

  function renderAll() {
    updateHeader();
    updateEssence();
    renderRituals();
  }

  /* ---------------- Speech ---------------- */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function moodLines() {
    if (state.dead) return null;
    if (state.health <= 22) return LINES.dying;
    if (state.health <= 50) return LINES.hungry;
    if (state.health >= 75) return LINES.happy;
    return LINES.ok;
  }

  function say(text, force) {
    if (!text) return;
    if (!state && !force) return;
    const el = $('#speech');
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth; // restart animation
    el.classList.add('pop');
  }

  function sayMood() {
    if (state && state.dead) return;
    const lines = moodLines();
    if (lines) say(pick(lines));
  }

  /* ---------------- FX: orb flight + sparks ---------------- */

  function flyOrb(fromEl, onArrive) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onArrive && onArrive();
      return;
    }
    const from = fromEl.getBoundingClientRect();
    const to = $('#ghostCanvas').getBoundingClientRect();
    const x0 = from.left + from.width / 2 - 7;
    const y0 = from.top + from.height / 2 - 7;
    const x1 = to.left + to.width / 2 - 7;
    const y1 = to.top + to.height / 2 - 7;

    const orb = document.createElement('div');
    orb.className = 'soul-orb';
    orb.style.left = '0';
    orb.style.top = '0';
    document.body.appendChild(orb);

    const midX = (x0 + x1) / 2;
    const midY = Math.min(y0, y1) - 90;
    const dur = 620 + Math.random() * 180;

    orb.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1)`, offset: 0 },
        { transform: `translate(${midX}px, ${midY}px) scale(1.25)`, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.45)`, offset: 1 },
      ],
      { duration: dur, easing: 'cubic-bezier(.4,.1,.5,1)' }
    ).onfinish = () => {
      orb.remove();
      onArrive && onArrive();
    };
  }

  function burstAt(x, y, n, colors) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const palette = colors || ['#6ee7b7', '#a78bfa'];
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('div');
      sp.className = 'spark';
      sp.style.setProperty('--sp-color', palette[i % palette.length]);
      sp.style.left = x + 'px';
      sp.style.top = y + 'px';
      document.body.appendChild(sp);
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 70;
      sp.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist - 30}px) scale(.2)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.1,.6,.4,1)' }
      ).onfinish = () => sp.remove();
    }
  }

  function burstAtGhost(n, colors) {
    const rect = $('#ghostCanvas').getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height * 0.55, n, colors);
  }

  function floatHearts(x, y, n) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const kinds = ['💜', '💚', '🩵'];
    for (let i = 0; i < n; i++) {
      const h = document.createElement('div');
      h.className = 'heart-float';
      h.textContent = kinds[i % kinds.length];
      h.style.left = (x - 8 + (Math.random() * 30 - 15)) + 'px';
      h.style.top = (y - 12) + 'px';
      document.body.appendChild(h);
      h.animate(
        [
          { transform: 'translate(0,0) scale(.6)', opacity: 0 },
          { transform: `translate(${Math.random() * 24 - 12}px, -18px) scale(1.1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.random() * 36 - 18}px, -52px) scale(.9)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 300, easing: 'ease-out' }
      ).onfinish = () => h.remove();
    }
  }

  /* ---------------- Wandering souls (catchable mini-game) ---------------- */

  function spawnWanderingSoul() {
    const terr = $('#terrarium');
    if (!terr || !state || state.dead) return;
    if (terr.querySelector('.w-soul')) return;
    if (document.visibilityState !== 'visible') return;

    const golden = Math.random() < 0.22;
    const soul = document.createElement('div');
    soul.className = 'w-soul' + (golden ? ' golden' : '');
    soul.textContent = golden ? '✨' : '👻';
    soul.title = 'Catch the wandering soul!';
    soul.style.top = (28 + Math.random() * 30) + '%';
    terr.appendChild(soul);

    const w = terr.clientWidth;
    const wob = 26 + Math.random() * 26;
    const anim = soul.animate(
      [
        { transform: 'translateX(-40px)' },
        { transform: `translateX(${w * 0.25}px) translateY(${-wob}px)`, offset: 0.25 },
        { transform: `translateX(${w * 0.5}px) translateY(${wob * 0.4}px)`, offset: 0.5 },
        { transform: `translateX(${w * 0.75}px) translateY(${-wob * 0.7}px)`, offset: 0.75 },
        { transform: `translateX(${w + 40}px) translateY(0)` },
      ],
      { duration: 8000 + Math.random() * 3000, easing: 'linear' }
    );
    anim.onfinish = () => soul.remove();

    soul.addEventListener('click', () => {
      const rect = soul.getBoundingClientRect();
      anim.cancel();
      soul.remove();
      const essenceGain = golden ? 12 : 6;
      const soulGain = golden ? 2 : 1;
      state.health = Math.min(MAX_HEALTH, state.health + essenceGain);
      state.souls += soulGain;
      save();
      window.Sounds.catchSoul(golden);
      burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, golden ? 12 : 7,
        golden ? ['#fbbf24', '#fb923c'] : ['#6ee7b7', '#a78bfa']);
      toast(golden
        ? `✨ Golden soul! +${essenceGain} essence, +${soulGain} souls`
        : `👻 Wandering soul caught! +${essenceGain} essence`);
      updateEssence();
      updateHeader();
      checkEvolve();
      say(golden ? 'A GOLDEN one! Feast!' : 'A tasty wanderer!');
    });
  }

  /* ---------------- Toast ---------------- */

  function toast(msg, ms = 2800) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /* ---------------- Ambience: stars, motes, bats ---------------- */

  function buildStars() {
    const holder = $('#stars');
    const n = 80;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      const size = Math.random() < 0.85 ? 1.5 : 2.5;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 62 + '%';
      s.style.setProperty('--tw-dur', (2 + Math.random() * 4).toFixed(1) + 's');
      s.style.setProperty('--tw-delay', (Math.random() * 4).toFixed(1) + 's');
      holder.appendChild(s);
    }
  }

  function buildMotes() {
    const holder = $('#motes');
    const colors = ['#6ee7b7', '#a78bfa', '#fb923c'];
    for (let i = 0; i < 9; i++) {
      const m = document.createElement('span');
      m.style.left = (6 + Math.random() * 88) + '%';
      m.style.setProperty('--m-dx', ((Math.random() * 60) - 30).toFixed(0) + 'px');
      m.style.setProperty('--m-dur', (7 + Math.random() * 7).toFixed(1) + 's');
      m.style.setProperty('--m-delay', (Math.random() * 9).toFixed(1) + 's');
      m.style.setProperty('--m-color', colors[i % colors.length]);
      holder.appendChild(m);
    }
  }

  function scheduleBats() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const spawn = () => {
      if (Math.random() < 0.4) {
        const bat = document.createElement('div');
        bat.className = 'bat';
        bat.textContent = '🦇';
        bat.style.top = (5 + Math.random() * 28) + '%';
        bat.style.setProperty('--bat-dur', (7 + Math.random() * 5).toFixed(1) + 's');
        bat.addEventListener('animationend', () => bat.remove());
        $('#terrarium').appendChild(bat);
      }
    };
    setInterval(spawn, 9000);
    setTimeout(spawn, 3500);
  }

  function scheduleShootingStars() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const spawn = () => {
      const terr = $('#terrarium');
      if (!terr) return;
      const s = document.createElement('div');
      s.className = 'shooting-star';
      s.style.setProperty('--ss-top', (6 + Math.random() * 22) + '%');
      s.style.setProperty('--ss-dur', (0.9 + Math.random() * 0.5).toFixed(2) + 's');
      s.addEventListener('animationend', () => s.remove());
      terr.appendChild(s);
    };
    setInterval(() => { if (Math.random() < 0.55) spawn(); }, 14000);
    setTimeout(spawn, 5000);
  }

  /* ---------------- Onboarding ---------------- */

  function showOnboard() {
    const modal = $('#onboard');
    modal.hidden = false;
    document.querySelectorAll('.variant-preview').forEach((cv) => {
      renderGhostIcon(cv, 0, cv.dataset.variant);
    });
  }

  function beginPact() {
    const name = ($('#ghostNameInput').value || '').trim() || 'Boo';
    const variant = document.querySelector('input[name="variant"]:checked').value;
    state = window.Store.defaults();
    state.name = name;
    state.variant = variant;
    state.lastOpen = todayStr();
    state.rituals = SEED_RITUALS.map((s, i) => ({
      id: 'r' + Date.now() + i,
      icon: s.icon,
      name: s.name,
      createdAt: todayStr(),
      history: [],
    }));
    save();
    $('#onboard').hidden = true;
    bootGhost();
    renderAll();
    window.Sounds.ensure();
    window.Sounds.revive();
    toast('The pact is sealed. Keep your rituals — it is watching.');
    say('I am yours, keeper. Do not forget me.');
  }

  /* ---------------- Boot ---------------- */

  function bootGhost() {
    ghost = new GhostActor($('#ghostCanvas'), {
      stage: () => state.stage,
      variant: () => state.variant,
      health: () => state.health,
      dead: () => state.dead,
    });
    ghost.onGone = showGrave;
    if (state.dead) {
      ghost.skipOut();
      showGrave();
    }
  }

  function wireEvents() {
    // sound unlock on first interaction
    const unlock = () => {
      window.Sounds.ensure();
      window.Sounds.enabled = state ? state.soundOn : true;
      document.removeEventListener('pointerdown', unlock);
    };
    document.addEventListener('pointerdown', unlock);

    // ritual list (delegated)
    $('#ritualList').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const r = state.rituals.find((x) => x.id === btn.dataset.id);
      if (!r || state.dead) return;
      if (btn.dataset.action === 'toggle') {
        completedToday(r) ? uncompleteRitual(r) : completeRitual(r, btn);
      } else if (btn.dataset.action === 'del') {
        if (btn.classList.contains('armed')) {
          removeRitual(r);
        } else {
          btn.classList.add('armed');
          btn.textContent = 'sure?';
          setTimeout(() => {
            btn.classList.remove('armed');
            btn.textContent = '✕';
          }, 2500);
        }
      }
    });

    // add ritual
    $('#ritualForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nameEl = $('#ritualName');
      const name = nameEl.value.trim();
      if (!name || !state) return;
      addRitual(name, $('#ritualIcon').value);
      nameEl.value = '';
      nameEl.focus();
    });

    // pet the familiar — squish, hearts, giggle
    $('#ghostCanvas').addEventListener('click', (e) => {
      if (!ghost || !state || state.dead) return;
      ghost.pet();
      window.Sounds.giggle();
      floatHearts(e.clientX, e.clientY, 3);
    });

    // the familiar watches your cursor
    const terr = $('#terrarium');
    terr.addEventListener('mousemove', (e) => {
      if (!ghost) return;
      const rect = $('#ghostCanvas').getBoundingClientRect();
      const gx0 = rect.left + rect.width / 2;
      const gy0 = rect.top + rect.height * 0.4;
      ghost.gazeX = Math.abs(e.clientX - gx0) < 20 ? 0 : (e.clientX > gx0 ? 1 : -1);
      ghost.gazeY = Math.abs(e.clientY - gy0) < 30 ? 0 : (e.clientY > gy0 ? 1 : -1);
    });
    terr.addEventListener('mouseleave', () => {
      if (ghost) { ghost.gazeX = 0; ghost.gazeY = 0; }
    });

    // wandering souls drift by now and then
    setInterval(() => { if (Math.random() < 0.45) spawnWanderingSoul(); }, 15000);

    // séance
    $('#seanceBtn').addEventListener('click', revive);

    // onboarding
    $('#beginBtn').addEventListener('click', beginPact);
    $('#ghostNameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') beginPact();
    });

    // sound toggle
    $('#soundToggle').addEventListener('click', () => {
      window.Sounds.ensure();
      window.Sounds.enabled = !window.Sounds.enabled;
      if (state) {
        state.soundOn = window.Sounds.enabled;
        save();
      }
      $('#soundToggle').textContent = window.Sounds.enabled ? '🔊' : '🔇';
      if (window.Sounds.enabled) window.Sounds.feed();
    });

    // ambient speech rotation
    setInterval(sayMood, 12000);

    // midnight rollover + tab-focus rollover
    setInterval(() => {
      if (state && todayStr() !== state.lastOpen) {
        rollover();
        renderAll();
      }
    }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state && todayStr() !== state.lastOpen) {
        rollover();
        renderAll();
      }
    });
  }

  function init() {
    buildStars();
    buildMotes();
    scheduleBats();
    scheduleShootingStars();
    wireEvents();

    // demo/testing hook: window.FamiliarDebug.summonSoul()
    window.FamiliarDebug = { summonSoul: spawnWanderingSoul };

    state = window.Store.load();
    if (!state) {
      showOnboard();
      window.Sounds.enabled = true;
    } else {
      window.Sounds.enabled = state.soundOn !== false;
      $('#soundToggle').textContent = window.Sounds.enabled ? '🔊' : '🔇';
      bootGhost();     // ghost must exist before rollover can kill it
      rollover();
      save();
      renderAll();
      sayMood();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
