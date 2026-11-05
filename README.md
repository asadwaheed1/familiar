# 👻 Familiar

**A haunted habit tracker.** Adopt a pixel-ghost familiar whose life depends
on your real-world habits. Complete daily rituals to feed it essence. Skip
them, and it starves, fades — and dies. Then you get to attend the funeral.

> *Built for [Kiroween 2026](https://kiroween.devpost.com/) · Costume Contest*

**▶ Play it live:** [asadwaheed1.github.io/familiar](https://asadwaheed1.github.io/familiar/)

https://github.com/user-attachments/assets/replace-with-your-demo

## The loop

1. **Begin the pact** — name your familiar, choose its hue (Violet / Spectral / Ember).
2. **Summon rituals** — the small daily habits you want to keep (🕯️ light a candle, 📖 read 10 pages, 🦴 move your bones…).
3. **Feed your familiar** — every ritual completed launches a soul orb into its mouth: +12 essence, +1 soul, streak +1.
4. **Evolve** — at 12 / 30 / 60 souls it grows from a Wisp into a Spirit, a Phantom, and finally a crowned Wraith Monarch.
5. **Neglect it** — every ritual missed on a missed day drains 10 essence. At zero, it rises from its body… and you get a tombstone with an epitaph.
6. **Perform the séance** — it comes back at 40 essence, but its streaks are severed. Souls are forever; streaks are not.

## Features

- 👻 **Procedural pixel-art ghost** — rendered pixel-by-pixel on canvas, no image assets: bobbing, blinking, mood faces, feeding animations
- 🫶 **It's alive** — pet it (squish + hearts + giggle), and its eyes follow your cursor around the graveyard
- 👻 **Wandering souls** — stray spirits drift through the scene; click to catch them (+6 essence, rare ✨ golden ones give +12 essence and +2 souls)
- 🎃 **Pumpkin patch** — a jack-o-lantern is carved into the graveyard for every 10 souls you earn
- ✨ **4 evolution stages** with antenna, brows, and a crown — with a visible "souls → next stage" progress line
- 🔥 **Streaks with teeth** — a severed streak on death makes every day count
- 🌙 **Haunted terrarium** — twinkling stars, glowing moon, shooting stars, drifting fog, floating soul motes, bats across the moon
- 💃 **A familiar with moods** — happy dance when you complete everything, hungry whims at low essence, translucent flicker as it starves
- 🔊 **Fully synthesized sound** — Web Audio chimes, evolution fanfare, death drone, séance chord, giggles, ambient graveyard wind; mutable
- 📦 **Zero build, zero dependencies** — open `index.html` and it haunts

## Run it

```bash
# Option 1: just open it
open index.html

# Option 2: any static server
npx serve .
python3 -m http.server 8000
```

Then visit the printed URL. Everything runs client-side and persists in `localStorage`.

## Tech

Vanilla HTML/CSS/JS. No frameworks, no bundler, no network calls (only
Google Fonts, with graceful fallbacks). The ghost is drawn procedurally —
a silhouette function (head circle ∪ tapered body with an animated wavy hem)
rasterized onto a tiny offscreen canvas and scaled up with smoothing off.

## Kiroween submission notes

- **Category:** Costume Contest — a usable habit tracker wearing a fully
  committed spooky costume.
- **`/.kiro` directory:** contains the steering docs
  (`steering/product.md`, `steering/design.md`) and the spec
  (`specs/familiar/requirements.md`, `design.md`, `tasks.md`) that shaped
  the build.
- **How Kiro was used:** the theming system, game rules (essence decay,
  evolution thresholds, streak severing), and the death/revival flow were
  all spec-driven: requirements and design were drafted first in
  `.kiro/specs/familiar/`, then implemented to spec. *(Expand this section
  with your actual Kiro session details before submitting.)*

## License

MIT — see [LICENSE](LICENSE).
