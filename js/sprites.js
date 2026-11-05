/* ==========================================================================
   Familiar — procedural pixel-ghost renderer
   The ghost is drawn pixel-by-pixel on a tiny offscreen canvas, then
   scaled up with smoothing off for a crisp Tamagotchi look.
   ========================================================================== */

(function () {
  'use strict';

  const PALETTES = {
    violet: { body: '#c9b6ff', shade: '#a48af0', deep: '#7a5cd6', eye: '#241640', glow: '#a78bfa' },
    mint:   { body: '#b5f2dc', shade: '#7fe3c3', deep: '#4cc9a4', eye: '#0f3529', glow: '#6ee7b7' },
    ember:  { body: '#ffd9ad', shade: '#ffbe82', deep: '#f68d3c', eye: '#3a1d0a', glow: '#fb923c' },
  };

  const STAGES = [
    { name: 'Wisp',           w: 24, h: 22, scale: 7, headR: 9.5,  amp: 0.9, aura: 22 },
    { name: 'Spirit',         w: 28, h: 27, scale: 7, headR: 11,   amp: 1.1, aura: 30, antenna: true },
    { name: 'Phantom',        w: 32, h: 30, scale: 6, headR: 12.5, amp: 2.0, aura: 38, antenna: true, brows: true },
    { name: 'Wraith Monarch', w: 36, h: 34, scale: 6, headR: 13.5, amp: 2.2, aura: 46, brows: true, crown: true },
  ];

  const GOLD = '#fbbf24';
  const GOLD_D = '#d99a12';

  function centerOf(st) {
    return {
      cx: st.w / 2,
      cy: st.headR + (st.crown ? 6.5 : st.antenna ? 4 : 1.5),
    };
  }

  function waveAt(st, x, t) {
    return st.amp * (Math.sin(x * 0.85 + t * 2.1) + 0.6 * Math.sin(x * 0.33 - t * 1.3) + 0.9);
  }

  function insideGhost(st, x, y, t) {
    const { cx, cy } = centerOf(st);
    const r = st.headR;
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    // head
    if (dx * dx + dy * dy <= r * r) return true;
    // body with a wavy, tattered skirt
    if (y + 0.5 >= cy - 1) {
      const half = r - Math.max(0, y + 0.5 - cy) * 0.12;
      if (Math.abs(dx) <= half && y + 0.5 <= st.h - 1 - waveAt(st, x, t)) return true;
    }
    return false;
  }

  function pixelColor(st, x, y, t, pal) {
    const { cx, cy } = centerOf(st);
    const bottom = st.h - 1 - waveAt(st, x, t);
    if (y + 0.5 > bottom - 0.9) return pal.deep;                        // hem
    if (y + 0.5 > bottom - 2.2) return pal.shade;                       // under-shade
    // right-lower body shade, kept below the face so it never seams the eyes
    if (y + 0.5 > cy + st.headR * 0.55 && x + 0.5 > cx + st.headR * 0.25) return pal.shade;
    return pal.body;
  }

  function px(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), w || 1, h || 1);
  }

  /* face: { blink: bool, mouth: 'smile'|'o'|'open'|'flat' } */
  function drawSprite(g, st, pal, t, face) {
    g.clearRect(0, 0, st.w, st.h);
    const { cx, cy } = centerOf(st);
    const r = st.headR;

    for (let y = 0; y < st.h; y++) {
      for (let x = 0; x < st.w; x++) {
        if (insideGhost(st, x, y, t)) px(g, x, y, 1, 1, pixelColor(st, x, y, t, pal));
      }
    }

    // antenna wisp (Spirit +)
    if (st.antenna) {
      px(g, cx, cy - r - 2, 1, 2, pal.shade);
      px(g, cx, cy - r - 3, 1, 1, pal.glow);
    }

    // crown (Wraith Monarch)
    if (st.crown) {
      const baseY = Math.round(cy - r - 3);
      px(g, cx - 5, baseY, 11, 2, GOLD);
      for (const sx of [-4, 0, 4]) px(g, cx + sx, baseY - 3, 1, 3, GOLD);
      px(g, cx, baseY - 1, 1, 1, GOLD_D);
    }

    // eyes — they follow the keeper's cursor
    const gx = (face.gaze && face.gaze.x) || 0;
    const gy = (face.gaze && face.gaze.y) || 0;
    const eyeY = Math.round(cy + r * 0.12);
    const eyeDX = Math.round(r * 0.45);
    const lx = Math.round(cx - eyeDX) + gx;
    const rx = Math.round(cx + eyeDX) - 1 + gx;
    const eyeRows = face.blink ? [eyeY + 1 + gy] : [eyeY + gy, eyeY + 1 + gy, eyeY + 2 + gy];
    for (const ey of eyeRows) {
      px(g, lx, ey, 2, 1, pal.eye);
      px(g, rx, ey, 2, 1, pal.eye);
    }
    if (!face.blink) {
      px(g, lx, eyeY + gy, 1, 1, 'rgba(255,255,255,.85)');
      px(g, rx, eyeY + gy, 1, 1, 'rgba(255,255,255,.85)');
    }

    // brows (Phantom +) — a mischievous slant
    if (st.brows && !face.blink) {
      px(g, lx, eyeY - 2 + gy, 2, 1, pal.eye);
      px(g, rx, eyeY - 2 + gy, 2, 1, pal.eye);
    }

    // cheeks
    px(g, lx - 1, eyeY + 2, 1, 1, pal.shade);
    px(g, rx + 2, eyeY + 2, 1, 1, pal.shade);

    // mouth
    const my = Math.round(cy + r * 0.52);
    switch (face.mouth) {
      case 'smile':
        px(g, cx - 2, my - 1, 1, 1, pal.eye);
        px(g, cx - 1, my, 2, 1, pal.eye);
        px(g, cx + 1, my, 1, 1, pal.eye);
        px(g, cx + 2, my - 1, 1, 1, pal.eye);
        break;
      case 'open':
        px(g, cx - 1, my, 2, 1, pal.eye);
        px(g, cx - 2, my + 1, 4, 2, pal.eye);
        px(g, cx - 1, my + 2, 2, 1, pal.deep);
        break;
      case 'flat':
        px(g, cx - 2, my, 4, 1, pal.eye);
        break;
      case 'o':
      default:
        px(g, cx - 1, my, 2, 2, pal.eye);
        break;
    }
  }

  /* ---------------- Animated actor ---------------- */

  class GhostActor {
    /**
     * hooks: { stage():number, variant():string, health():number, dead():boolean }
     */
    constructor(canvas, hooks, opts) {
      this.cv = canvas;
      this.g = canvas.getContext('2d');
      this.hooks = hooks;
      this.opts = opts || {};

      this.t = Math.random() * 20;
      this.last = performance.now();
      this.nextBlink = performance.now() + 2200 + Math.random() * 2600;
      this.blinkEnd = 0;
      this.feedUntil = 0;
      this.gazeX = 0;
      this.gazeY = 0;
      this.squishUntil = 0;
      this.danceUntil = 0;
      this.dying = false;
      this.hidden = false;
      this.alpha = 1;
      this.rise = 0;
      this.onGone = null;
      this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.off = document.createElement('canvas');
      this.og = this.off.getContext('2d');
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    stage() { return STAGES[Math.max(0, Math.min(STAGES.length - 1, this.hooks.stage() | 0))]; }

    resize() {
      const st = this.stage();
      this.pad = 46;
      this.cv.width = st.w * st.scale + this.pad * 2;
      this.cv.height = st.h * st.scale + this.pad * 2 + 16;
      this.cv.style.width = this.cv.width + 'px';
      this.cv.style.height = this.cv.height + 'px';
    }

    feedPulse() { this.feedUntil = performance.now() + 650; }

    pet() { this.squishUntil = performance.now() + 450; }

    dance(ms) { this.danceUntil = performance.now() + (ms || 1200); }

    die() { this.dying = true; }

    revive() { this.hidden = false; this.dying = false; this.alpha = 1; this.rise = 0; }

    skipOut() { this.hidden = true; this.alpha = 0; }

    mouth(now) {
      const h = this.hooks.health();
      if (now < this.feedUntil) return 'open';
      if ((this.hooks.dead && this.hooks.dead()) || h <= 22) return 'flat';
      if (h >= 75) return 'smile';
      return 'o';
    }

    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.t += dt * (this.reduced ? 0.4 : 1);

      if (now >= this.nextBlink) {
        this.blinkEnd = now + 150;
        this.nextBlink = now + 2400 + Math.random() * 3200;
      }
      if (this.dying) {
        this.alpha = Math.max(0, this.alpha - dt / 1.5);
        this.rise += dt * 42;
        if (this.alpha <= 0) {
          this.dying = false;
          this.hidden = true;
          if (this.onGone) this.onGone();
        }
      }
      this.draw(now);
      requestAnimationFrame(this.loop);
    }

    draw(now) {
      const st = this.stage();
      const pal = PALETTES[this.hooks.variant()] || PALETTES.violet;
      if (this.hidden) { this.g.clearRect(0, 0, this.cv.width, this.cv.height); return; }

      this.off.width = st.w;
      this.off.height = st.h;
      drawSprite(this.og, st, pal, this.t, {
        blink: now < this.blinkEnd,
        mouth: this.mouth(now),
        gaze: { x: this.gazeX, y: this.gazeY },
      });

      const g = this.g;
      g.clearRect(0, 0, this.cv.width, this.cv.height);

      const feed = now < this.feedUntil;
      const dancing = now < this.danceUntil;
      const squishing = now < this.squishUntil;

      let bob = this.reduced ? 1.5 : Math.sin(this.t * 1.7) * 5;
      if (dancing && !this.reduced) bob = Math.sin(this.t * 9) * 10;
      const sway = dancing && !this.reduced ? Math.sin(this.t * 4.5) * 14 : 0;
      const rot = dancing && !this.reduced ? Math.sin(this.t * 9) * 0.06 : 0;

      let sx = 1, sy = 1;
      if (feed) {
        const k = 1 + 0.07 * Math.sin(Math.min(1, (this.feedUntil - now) / 650) * Math.PI);
        sx *= k; sy *= k;
      }
      if (squishing) {
        const k = Math.max(0, (this.squishUntil - now) / 450);
        sx *= 1 + 0.16 * k;
        sy *= 1 - 0.13 * k;
      }

      const w = st.w * st.scale;
      const h = st.h * st.scale;
      const hp = this.hooks.health();
      const starving = !this.hooks.dead() && hp <= 22;
      const flicker = starving ? 0.6 + 0.22 * Math.sin(this.t * 3.4) : 1;

      g.save();
      g.globalAlpha = this.alpha * flicker;
      g.imageSmoothingEnabled = false;
      if (typeof g.filter === 'string') {
        g.filter = starving ? 'saturate(.55) brightness(.92)' : 'none';
      }
      g.shadowColor = pal.glow;
      g.shadowBlur = st.aura;
      g.translate(this.cv.width / 2 + sway, this.cv.height - this.pad - h / 2 + bob + this.rise);
      g.rotate(rot);
      g.scale(sx, sy);
      g.drawImage(this.off, 0, 0, st.w, st.h, -w / 2, -h / 2, w, h);
      g.restore();
    }
  }

  /* Static single-frame render (for onboarding previews). */
  function renderGhostIcon(canvas, stageIdx, variantKey) {
    const st = STAGES[Math.max(0, Math.min(STAGES.length - 1, stageIdx))];
    const pal = PALETTES[variantKey] || PALETTES.violet;
    const s = 3, pad = 8;
    canvas.width = st.w * s + pad * 2;
    canvas.height = st.h * s + pad * 2;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    const off = document.createElement('canvas');
    off.width = st.w;
    off.height = st.h;
    drawSprite(off.getContext('2d'), st, pal, 1.3, { blink: false, mouth: 'smile' });
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.shadowColor = pal.glow;
    g.shadowBlur = 10;
    g.drawImage(off, 0, 0, st.w, st.h, pad, pad, st.w * s, st.h * s);
  }

  window.FamiliarSprites = { PALETTES, STAGES, GhostActor, renderGhostIcon };
})();
