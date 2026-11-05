# Familiar — Design

## Architecture

Zero-build vanilla web app. Four modules, no dependencies, no image assets.

```
index.html        — shell: header, terrarium scene, rituals panel, onboarding modal
css/style.css     — design tokens + all component styles & keyframes
js/sprites.js     — procedural pixel-ghost renderer + GhostActor animation loop
js/sounds.js      — Web Audio synth (chimes, drone, wind bed)
js/storage.js     — localStorage schema (familiar.save.v1)
js/app.js         — game logic, state transitions, FX orchestration
```

## Data model

```ts
interface SaveState {
  v: 1;
  name: string;            // familiar name
  variant: 'violet' | 'mint' | 'ember';
  health: number;          // essence 0..100
  souls: number;           // lifetime completed rituals
  stage: number;           // 0..3, derived from souls on change
  dead: boolean;
  deathDate: string;       // 'YYYY-MM-DD'
  bonusDate: string;       // last date the all-complete feast bonus fired
  streakWipeDate: string;  // streaks stop counting at dates <= this (set on revival)
  lastOpen: string;        // last local date the app was opened
  soundOn: boolean;
  rituals: Ritual[];
}
interface Ritual {
  id: string;
  icon: string;            // emoji
  name: string;
  createdAt: string;
  history: string[];       // 'YYYY-MM-DD' completion dates
}
```

Streak = consecutive days ending today (or yesterday if today not yet done),
walking backwards through `history`, stopping at `streakWipeDate`.

## Ghost rendering

- `STAGES` defines per-stage pixel canvas size, scale, head radius, skirt
  wave amplitude, and feature flags (antenna, brows, crown).
- Silhouette = head circle ∪ tapered body clipped by a two-sine wavy hem
  animated over time `t`. Shading: hem darkens to `deep`→`shade`, right-lower
  body to `shade`.
- Face layers: eyes (blink = 1px line), white highlight pixel, brows (stage 3+),
  cheeks, mouth per mood (`smile` >75 essence, `o` 23–74, `flat` ≤22 or dead,
  `open` for 650ms after feeding).
- Rendered each frame to a tiny offscreen canvas, composited with
  `imageSmoothingEnabled = false`, glow via `shadowBlur`, bob via sine of `t`.
- Death: alpha decays over ~1.5s while rising; `onGone` shows the tombstone.

## Key flows

- **Complete ritual** → push today into `history`, souls++, health += 12 →
  orb flight (WAAPI, bezier-ish keyframes) → arrival: mouth-open pulse +
  spark burst + chime → `checkEvolve()` → `checkAllDone()`.
- **Day rollover** (load / visibilitychange / 60s tick): decay 10 × missed
  rituals × elapsed days (cap 60), possible death.
- **Death** → `Sounds.death()`, ghost fade-rise, tombstone overlay with
  epitaph.
- **Séance** → health 40, stage 0, `streakWipeDate = today`, overlay hides,
  ghost re-materializes.

## Constraints

- No frameworks, no build step, no network calls (only Google Fonts, with
  system fallbacks).
- All animations respect `prefers-reduced-motion`.
- localStorage only; no accounts, no tracking.
