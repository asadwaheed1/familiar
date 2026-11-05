# Design System: Familiar

## Theme

"Midnight graveyard" — a Tamagotchi living in a haunted cemetery.

## Color tokens

| Token        | Value     | Use                                  |
|--------------|-----------|--------------------------------------|
| `--bg-0`     | `#0b0716` | Page background (deep night)         |
| `--bg-1`     | `#150d29` | Background gradient top              |
| `--panel`    | `#1a1132` | Panel base                           |
| `--panel-2`  | `#241745` | Cards, inputs, pills                 |
| `--line`     | `#3b2a63` | Strong borders                       |
| `--line-soft`| `#2c1e4d` | Soft borders                         |
| `--text`     | `#efe9fb` | Primary text (lavender-white)        |
| `--text-dim` | `#a99cc9` | Secondary text                       |
| `--text-faint`| `#6f619a`| Tertiary text                        |
| `--purple`   | `#a78bfa` | Primary accent (spectral violet)     |
| `--orange`   | `#fb923c` | Secondary accent (pumpkin ember)     |
| `--green`    | `#6ee7b7` | Success / ectoplasm                  |
| `--red`      | `#f87171` | Danger / decay                       |
| `--gold`     | `#fbbf24` | Evolution / crown                    |

## Typography

- Display: **Creepster** — logo, panel titles, tombstone. Always with a soft
  glow shadow, never for body copy.
- Body: **Outfit** (400–700) — everything readable.
- Pixel accents: **Press Start 2P**, 8px only — ESSENCE label, stage badge.

## Motion principles

1. The ghost is the heartbeat: it bobs, blinks, and reacts to every action.
2. Rewards fly: completing a ritual launches a soul orb that arcs into the
   ghost's mouth, then sparks burst. Never skip the orb.
3. Ambient life never stops: fog drifts, stars twinkle, soul motes float,
   bats cross the moon at random.
4. Death is theatrical: ghost rises and fades, tombstone rises with an
   epitaph, low drone plays.
5. All motion respects `prefers-reduced-motion`.

## Do

- Keep the palette to the tokens above; purple for interactive, orange for
  ritual/reward, green for success, red only for decay and death.
- Use emoji for ritual icons and micro-copy (🕯️ 🦇 👻) — zero image assets.
- Keep every sound synthesized (Web Audio) and mutable.

## Don't

- No gore, no jump scares, no red-dominant screens.
- No wall-of-text; the scene speaks first.
- Never block the ghost with UI; it is the protagonist.
