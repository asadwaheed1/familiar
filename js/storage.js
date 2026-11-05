/* ==========================================================================
   Familiar — save state (localStorage)
   ========================================================================== */

(function () {
  'use strict';

  const KEY = 'familiar.save.v1';

  const Store = {
    KEY,

    defaults() {
      return {
        v: 1,
        name: 'Boo',
        variant: 'violet',
        health: 70,
        souls: 0,
        stage: 0,
        dead: false,
        deathDate: null,
        bonusDate: '',
        streakWipeDate: '',
        lastOpen: null,
        soundOn: true,
        rituals: [], // { id, icon, name, createdAt, history: ['YYYY-MM-DD', ...] }
      };
    },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || s.v !== 1) return null;
        return s;
      } catch (e) {
        return null;
      }
    },

    save(s) {
      try {
        localStorage.setItem(KEY, JSON.stringify(s));
      } catch (e) { /* storage full / private mode — the haunting continues in memory */ }
    },

    clear() {
      try {
        localStorage.removeItem(KEY);
      } catch (e) { /* noop */ }
    },
  };

  window.Store = Store;
})();
