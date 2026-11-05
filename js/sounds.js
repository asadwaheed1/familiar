/* ==========================================================================
   Familiar — synthesized sound effects (Web Audio, zero external assets)
   ========================================================================== */

(function () {
  'use strict';

  const Sounds = {
    ctx: null,
    master: null,
    enabled: true,

    ensure() {
      if (this.ctx) return true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        this.startWind();
      } catch (e) {
        return false;
      }
      return true;
    },

    tone(f, { dur = 0.18, type = 'sine', vol = 0.2, delay = 0, slide = null } = {}) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    },

    feed() {
      this.tone(520, { dur: 0.12, vol: 0.14 });
      this.tone(780, { dur: 0.16, vol: 0.14, delay: 0.07 });
      this.tone(1040, { dur: 0.2, type: 'triangle', vol: 0.07, delay: 0.14 });
    },

    allDone() {
      [523, 659, 784, 1046].forEach((f, i) =>
        this.tone(f, { dur: 0.22, type: 'triangle', vol: 0.11, delay: i * 0.09 }));
    },

    evolve() {
      [392, 523, 659, 784, 1174].forEach((f, i) =>
        this.tone(f, { dur: 0.3, type: 'triangle', vol: 0.13, delay: i * 0.11 }));
      this.tone(1568, { dur: 0.6, vol: 0.05, delay: 0.55 });
    },

    death() {
      this.tone(220, { dur: 1.6, type: 'sawtooth', vol: 0.1, slide: 55 });
      this.tone(440, { dur: 2.2, vol: 0.08, delay: 0.15, slide: 437 });
    },

    revive() {
      [261, 329, 392].forEach((f, i) =>
        this.tone(f, { dur: 0.9, vol: 0.08, delay: i * 0.05 }));
    },

    giggle() {
      this.tone(920, { dur: 0.09, vol: 0.1 });
      this.tone(1180, { dur: 0.1, vol: 0.1, delay: 0.08 });
      this.tone(880, { dur: 0.12, vol: 0.08, delay: 0.17 });
    },

    catchSoul(golden) {
      if (golden) {
        [784, 988, 1319].forEach((f, i) =>
          this.tone(f, { dur: 0.2, type: 'triangle', vol: 0.11, delay: i * 0.07 }));
        this.tone(1976, { dur: 0.4, vol: 0.05, delay: 0.24 });
      } else {
        this.tone(640, { dur: 0.1, vol: 0.12, slide: 240 });
        this.tone(1240, { dur: 0.14, type: 'triangle', vol: 0.08, delay: 0.07 });
      }
    },

    whimper() {
      this.tone(392, { dur: 0.28, vol: 0.07, slide: 330 });
      this.tone(330, { dur: 0.32, vol: 0.07, delay: 0.27, slide: 262 });
    },

    /* Constant graveyard-wind bed, gently breathing. */
    startWind() {
      try {
        const c = this.ctx;
        const len = c.sampleRate * 2;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 320;
        const g = c.createGain();
        g.gain.value = 0.03;
        const lfo = c.createOscillator();
        lfo.frequency.value = 0.07;
        const lg = c.createGain();
        lg.gain.value = 0.015;
        lfo.connect(lg);
        lg.connect(g.gain);
        src.connect(f);
        f.connect(g);
        g.connect(this.master);
        src.start();
        lfo.start();
      } catch (e) { /* wind is optional */ }
    },
  };

  window.Sounds = Sounds;
})();
