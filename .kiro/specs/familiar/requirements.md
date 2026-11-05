# Familiar — Requirements

## Overview
A habit tracker where a virtual ghost familiar lives or dies by the user's
daily habits. Category: Costume Contest (Kiroween 2026) — judged on a
polished, spooky user interface.

## Requirements

### R1 — Familiar (the ghost)
- R1.1: On first run, the user names their familiar and picks one of three
  hue variants (Violet, Spectral, Ember).
- R1.2: The familiar is a procedural pixel-art ghost that idles with a bob,
  random blinks, and a mood-driven face (smile / neutral / flat / feeding).
- R1.3: The familiar has 4 evolution stages — Wisp → Spirit → Phantom →
  Wraith Monarch — unlocked at 0 / 12 / 30 / 60 lifetime souls.

### R2 — Rituals (habits)
- R2.1: Users can summon (add), banish (delete, with two-click confirm), and
  complete/un-complete rituals. Each ritual has an emoji icon, a name, and a
  daily completion history.
- R2.2: Completing a ritual heals the familiar +12 essence (cap 100), adds 1
  soul, and plays a soul-orb flight animation into the ghost.
- R2.3: Each ritual shows its current consecutive-day streak.
- R2.4: First-time users start with 3 seeded example rituals.

### R3 — Essence (health) & death
- R3.1: Essence is 0–100, persisted, starts at 70.
- R3.2: On the first open of a new day, each ritual missed on each elapsed
  day drains 10 essence (total decay capped at 60 per catch-up).
- R3.3: Completing every ritual on a day grants a one-time +5 essence feast
  bonus for that day.
- R3.4: At essence 0 the familiar dies: it rises and fades, a tombstone
  appears with name, death date, and a random epitaph.
- R3.5: A séance revives the familiar at 40 essence, stage 1, with streaks
  severed (streak calculation stops at the revival date). Souls are retained.
- R3.6: The essence bar shows green (>55), ember (26–55), or pulsing red
  (≤25) and the number value.

### R4 — Spooky presentation (Costume Contest)
- R4.1: Night graveyard scene: stars, glowing moon, gravestones, drifting
  fog, floating soul motes, occasional bats.
- R4.2: All sound is synthesized via Web Audio (no copyrighted assets) with
  a persistent mute toggle: feed chime, feast arpeggio, evolution fanfare,
  death drone, séance chord, ambient wind.
- R4.3: The familiar "speaks" via a speech bubble whose lines depend on its
  essence mood, rotating every ~12s and on events.
- R4.4: Everything runs client-side with zero build step; state persists in
  localStorage.
- R4.5: The familiar reacts to affection: clicking it squishes it with
  floating hearts and a giggle sound; its eyes follow the cursor across the
  scene.
- R4.6: Wandering souls drift through the graveyard every ~15–45s; catching
  one grants +6 essence and +1 soul (22% golden variant: +12 essence, +2
  souls). Missed souls drift off-screen.
- R4.7: Visible progression: one jack-o-lantern per 10 lifetime souls, a
  "souls → next stage" progress line under the familiar, a happy dance on
  the all-complete feast bonus, and a translucent flicker when essence ≤ 22.

### R5 — Submission (Kiroween)
- R5.1: Runnable by opening `index.html` or any static server.
- R5.2: MIT-licensed, documented README, `/.kiro` directory present at repo
  root describing specs and steering.
