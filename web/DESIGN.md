# FinResearch — Design System v3: SOLARIUM

> **Identity:** _Solarium — a sunlit glass observatory where the analysis is a model you orbit._
> **Thesis:** FinResearchAI is not a screen you read; it is a **bright, spatial workspace you
> lean into.** The multi-agent pipeline is a physical model resting on a daylight light-table —
> you orbit it, the light rakes across it, cards lift toward your cursor, and the verdict rises
> up out of the table. **Depth is built from light, shadow, and parallax — never from darkness
> or a border.**
> **Bright / daylight-first.** (Light IS the theme; see §2.7 for why no dark inversion.)

This document REPLACES both the v2 "Glass-SaaS × Terminal" system and the interim v3 dark
"Machined Light" draft (dark direction preserved in agent memory + git history if an A/B is
ever wanted). It is the implementation contract for the **bright, interactive, 3D-immersive**
reimagine. Tokens land in `src/styles/index.css` under Tailwind v4 `@theme` (skeleton in §11);
every treatment in §8 is precise enough to build without asking. Migration map in §12. Never
use raw hex/oklch in components — token names only. All contrast ratios in §3 were **computed**
(OKLCH→linear-sRGB→WCAG), not guessed.

Sources: NotebookLM "Advanced UI Design and Animation Resources" (Stage Geometry
`perspective:1200px` + `preserve-3d` for WebGL-free depth; Daylight-Glass materials;
Light-Driven Depth via `feDiffuseLighting`; Magnetic Tactility; parallax scroll-scrub;
reduced-motion → flatten Z to 0 + opacity crossfade); Motion v12 via Context7 (`spring()` →
CSS `linear()`, pointer parallax via `useMotionValue`/`useTransform`/`useSpring`, §6.1);
current-world spatial-computing references (Apple visionOS glass depth; family.co soft-3D;
Vercel/Linear for data crispness); 21st.dev component sourcing (§14).

---

## 1. The One Rule

> **The analysis is a physical model on a light-table. Depth comes from light, shadow, and
> parallax; color is state; motion is you moving around the model.**

Four testable clauses:

1. **Every surface floats on its own Z-plane.** Elevation is expressed as `translateZ` +
   a layered daylight shadow (§5) — never a border, never a darker fill. If two things are at
   different importance, they are at different heights.
2. **Light is declared and it moves.** One sun, upper-left (§2.4). Highlights on top edges,
   contact-shadows below. When you orbit/hover, the specular sheen and shadows shift with the
   geometry — light responds to interaction, because that is physics, not decoration.
3. **Color is state.** Chroma is reserved for market/run/system semantics (BUY/SELL/HOLD,
   bull/bear, persona, judge, health, quota, phase). The interaction accent (`--beam`) is the
   ONE non-semantic hue, and it only appears on things you can touch. Everything else is ink on
   daylight paper.
4. **Immersion frames; data stays flat.** The 3D is the theater — the room, the tilt, the
   orbit, the parallax, the hero reveals. The actual numbers live on cards that are **crisp,
   axis-aligned, and legible** on their own plane. Never tilt a table, a chart, or running text
   past the point of comfortable reading. Wow in the frame; trust in the data.

**Chroma budget:** at rest, <8% of any viewport's pixels are chromatic (higher than a dark
theme's 3% — daylight tolerates more color, and the signal chips/candles/scatter must still
win by saturation + placement, not area). Guard it (Von Restorff).

**Onion-Peel disclosure survives:** editorial summaries by default; raw metadata (deltas,
hashes, event payloads) revealed on demand via a lifted pane that rises in Z (§8.16).

---

## 2. The spatial system (the new pillar — read before anything)

### 2.1 Stage Geometry (WebFree 3D core)

The entire immersion is delivered with **CSS 3D + Motion + the existing xyflow/charts** — zero
new dependencies (dependency decision in §2.8). The recipe (NLM):

- **Stage root** (`.stage`, one per immersive region): `perspective: 1200px;
  perspective-origin: 50% 38%;` — the camera sits slightly above, looking down at the table.
- **Spatial children** carry `transform-style: preserve-3d;` and live at declared depths via a
  `--z` token scale (§5). `backface-visibility: hidden;` on anything that rotates.
- **Only `transform`/`opacity`/`filter` animate.** `will-change: transform` is applied ONLY to
  actively-orbiting/lifting elements and removed at rest (never blanket).
- Nested perspective is banned (one stage per region) — it multiplies distortion and cost.

### 2.2 The four depth planes

Everything on an immersive page belongs to exactly one plane (this is what makes it read as a
room, not a pile of cards):

| Plane | `--z` | Contents | Parallax factor |
| --- | --- | --- | --- |
| **Backdrop** | `-240px` | Daylight field + horizon + soft light-shafts (§2.6) | 0.15 (barely moves) |
| **Table** | `-40px` | The pipeline model / chart specimen / the page's primary spatial object | 0.5 |
| **Cards** | `0` | Data panels, streams, tables, the reading surface | 1.0 (reference) |
| **Lifted** | `+64px` | Hovered card, decision reveal, lifted pane, tooltips | 1.4 (leads the eye) |

Parallax factor = how far the plane translates per unit of pointer/scroll movement. The spread
(0.15 → 1.4) is the entire illusion of depth; keep these ratios.

### 2.3 Orbit & parallax (pointer interaction)

- **Scene orbit:** on pointer move over a `.stage`, the Table plane rotates toward the cursor —
  `rotateY` ∈ [−5°, +5°], `rotateX` ∈ [+4°, −4°] (inverted: cursor-up tips the far edge down).
  Driven by Motion: `useMotionValue(px,py)` → `useTransform` to degrees → `useSpring`
  (`{stiffness: 120, damping: 18, mass: 0.4}` — heavier than the UI spring; a table has mass).
  Max 5° — past that, text on the table shears and legibility dies (clause 4).
- **Card magnetism (Magnetic Tactility, NLM):** on hover, a Card lifts to `--z-hover` + tilts
  ≤3° toward the cursor; a specular highlight (a radial white gradient at 12% following the
  pointer) crosses its top. Uses the same spring. Pointer-leave settles home.
- **Idle drift:** with no pointer for >4s, the stage performs a 12s sine breath of ±1.2°
  `rotateY` so the room feels alive (disabled under reduced motion; §6.4).
- **Touch/coarse pointers:** device-tilt is NOT used (privacy/robustness); touch gets
  scroll-parallax only + tap-to-lift. `@media (hover:none)` disables pointer-orbit entirely and
  flattens the Table to a fixed 8° recede.

### 2.4 Declared light

One sun: **upper-left, ~35° elevation** (SVG `feDistantLight azimuth="315" elevation="55"` for
the grain; the same direction governs every hand-authored shadow and edge-light). Top edges
get a 1px white inner highlight (`--edge-light`); every shadow falls down-and-right. A card
lifted in Z casts a LARGER, softer, more-offset shadow — the physics of getting closer to the
lamp. This shadow-scaling is the primary elevation cue on daylight (§5).

### 2.5 Scroll as camera dolly

Long pages (Analyze-live, Dossier) use scroll as a **dolly through the model**, not a document
scroll: as you scroll, the Table plane translates in `translateZ` toward the camera and the
active pipeline stage brightens/rises (Parallax Storytelling, NLM). Implement with native CSS
`animation-timeline: view()`/`scroll()` where supported (compositor-thread, zero JS), single
rAF+IntersectionObserver fallback otherwise. NEVER scroll-jack the whole document; the dolly is
a subtle Z + brightness shift layered on native scroll. Reserve one pinned scroll moment max
per page (the Analyze pipeline fly-through).

### 2.6 Daylight backdrop (replaces v2 aurora)

Backdrop plane, fixed, pointer-events-none, three static layers:
1. Sky wash: `linear-gradient(180deg, oklch(98% 0.012 85), var(--color-room))` — warm daylight
   falling from above.
2. Light shafts: two very soft, low-opacity white cones (~12° from vertical, blur baked into
   the gradient stops, 6% opacity) raking from upper-left — the sun through glass. STATIC.
3. Horizon: a single faint warm line at 62% viewport height (`--color-line`) grounding the
   room. On orbit, layers 1–2 parallax at factor 0.15.

### 2.7 No dark theme — decided

Solarium's identity is daylight and spatial depth built FROM light; a dark inversion destroys
the "sunlit observatory" metaphor and halves the craft budget (shadows-on-dark don't read;
the light-table conceit collapses). `color-scheme: light`. This is a deliberate, owned choice —
the opposite of the v2 "no light theme" stance, made because the whole point is the light.
A future "dusk" variant (warm low-sun, deeper shadows) is the sanctioned way to add a second
mood if ever needed — NOT a flat dark inversion.

### 2.8 Dependency decision (explicit — needs sign-off before Phase 2)

- **Phase 1 (this spec, ships zero-dep):** the full Solarium — daylight, planes, orbit,
  parallax, magnetic cards, verdict rise, scroll-dolly — is delivered with **CSS 3D + Motion
  v12 + xyflow + lightweight-charts + recharts**, all already in `package.json`. This is the
  contract implementers build to. It is genuinely immersive and holds 60fps.
- **Phase 2 (OPTIONAL, gated):** a single, lazy, route-scoped WebGL "atrium" for the Analyze
  hero — volumetric light, a true orbitable 3D pipeline, glass refraction — would require
  `three` + `@react-three/fiber` (+ maybe `drei`), ≈150KB gz and a heavyweight dep. This
  **violates the frozen "no new heavyweight deps" constraint** and is therefore NOT authorized
  here. It is written up as a proposal to hand to **systems-architect / the user** for a bundle
  + perf sign-off. If approved, it must be: its own dynamic chunk, never in the entry graph;
  behind a capability + `prefers-reduced-motion` + `deviceMemory`/`hardwareConcurrency` gate;
  and it must degrade to the Phase-1 CSS-3D scene, which remains the canonical fallback. **Do
  not add it silently.** Phase 1 must stand on its own as award-grade.

---

## 3. Color — OKLCH, daylight, computed contrast

Dark ink on warm daylight paper. Warm cast (hue 60–85) = sunlight, not clinical white — this is
what separates Solarium from a generic white SaaS. Targets: **AAA (7:1) on primary data values**
(they sit on `paper-1`/`paper-2` cards, where all signals below hit AAA), AA (4.5:1) on all
text, 3:1 on non-text affordances.

### 3.1 Daylight surfaces (elevation = brighter + higher, hue 85)

On daylight, higher surfaces catch more light → they are WHITER (inverse of the dark system).
Elevation is `whiter fill + bigger shadow + more translateZ` — never a border.

| Token | Value | Use |
| --- | --- | --- |
| `--color-room` | `oklch(95.5% 0.010 85)` | Page canvas (the sunlit room floor) |
| `--color-paper-1` | `oklch(98.5% 0.005 85)` | Resting card / panel |
| `--color-paper-2` | `oklch(99.8% 0.003 85)` | Lifted card, hero shelf, decision reveal |
| `--color-sink` | `oklch(93% 0.012 85)` | Recessed wells, tracks, input troughs |
| `--color-line` | `oklch(28% 0.02 60 / 10%)` | Hairline rules (ink at low alpha, not grey) |
| `--color-line-strong` | `oklch(28% 0.02 60 / 18%)` | Emphasized rules, sort filaments |
| `--edge-light` | `oklch(100% 0 0 / 85%)` | 1px inner top highlight on lifted surfaces |

Never pure `#fff` for a surface (glare + no headroom for `paper-2` to read brighter); never
cool the hue toward blue-white (kills the sunlight).

### 3.2 Ink (warm near-black — tuned for light)

| Token | Value | Ratio (room / paper-1 / paper-2) | Use |
| --- | --- | --- | --- |
| `--color-ink` | `oklch(25.5% 0.02 60)` | 13.9 / 15.2 / 15.7 — AAA | Primary text, ALL primary data values |
| `--color-ink-muted` | `oklch(43% 0.02 60)` | 7.2 / 7.8 / 8.1 — AAA | Secondary, body prose, streams |
| `--color-ink-faint` | `oklch(48% 0.018 60)` | 5.8 / 6.3 — AA | Kickers, metadata, disabled. Never data values. |

Light-legibility: UI font uses `font-variation-settings: 'opsz' 16` and weight floor 460 to
keep hairlines from thinning out on bright paper (NLM). Body max-width `65ch`.

### 3.3 The Beam (interaction accent — the ONE non-semantic hue)

A daylight sky-azure. It is the only non-state color; it appears exclusively on interactive
things (focus, links, primary key button, caret, playhead, sort filament, live-edge light).

| Token | Value | Ratio | Use |
| --- | --- | --- | --- |
| `--color-beam` | `oklch(47% 0.185 255)` | 6.0 room / 6.6 paper-1 — AA | Focus ring, links (underline), caret, playhead, active states |
| `--color-beam-soft` | `oklch(47% 0.185 255 / 12%)` | — | Selection bg, live tints, focus halo fill |
| `--color-beam-fg` | `oklch(99% 0.003 85)` | 6.4:1 on beam | Text/icons on beam fills |

Links = `--color-ink` + a `--color-beam` underline; hover thickens the underline. Interactive is
discoverable by the beam + underline + lift + shape — the beam is never used decoratively.

### 3.4 Signal colors — the ONLY semantic chroma

Semantics frozen (glyph + word + color, always). All darkened for daylight; all hit **AAA
(≥7:1) as text on `paper-1`** (where data values live) and strong AA (~6.8) on the bare room —
computed, honest.

| Token | Value | Ratio (paper-1) | Meaning |
| --- | --- | --- | --- |
| `--color-bull` | `oklch(42% 0.155 150)` | 7.3:1 | BUY · bull · positive · healthy · done |
| `--color-bear` | `oklch(44.5% 0.205 25)` | 7.5:1 | SELL · bear · negative · error |
| `--color-hold` | `oklch(44.5% 0.125 66)` | 7.5:1 | HOLD · warn · degraded · replay-only |
| `--color-conservative` | `oklch(44% 0.135 255)` | 7.5:1 | Conservative risk persona (cool) |
| `--color-aggressive` | `oklch(45.5% 0.195 32)` | 7.5:1 | Aggressive risk persona (hot) |

Separation on daylight: bear (hue 25) vs aggressive (hue 32) are close in hue but chroma- and
context-separated (personas/verdicts always labelled); conservative (255) is the only cool
signal → instant read against the warm room. Hold (66) sits between — the amber had to go deep
(ochre) to survive on white, which is correct.

**Tint fills** (chip/underglow/candle-volume backgrounds — fills only, never text): each signal
at `/ 14%` alpha, e.g. `--color-bull-tint: oklch(42% 0.155 150 / 14%)`. On daylight these read
as a soft colored wash under white glass.

**Lift shadows** (colored contact-shadow for a completed/live element — the light picks up the
signal): `--shadow-bull` etc. = the standard lift shadow (§5) with the signal hue mixed into the
key layer at 22%. Subtle; it tints the shadow, it does not glow.

### 3.5 Judge colors (Eval) & 3.6 System-state — unchanged semantics

Judge: ON-preferred = `--color-bull`; OFF-preferred = `--color-conservative` (ablation wins =
informative, never bear); tie = `--color-ink-faint`; unjudged = hollow chip (1px
`--color-line-strong`, no fill). Functional Signal Inversion on deltas survives exactly (sign
colored by OUTCOME UTILITY, always with an arrow glyph). System state reuses signal hues +
always a word (healthy/room = bull · degraded/exhausted = hold · down/error = bear · unmetered =
ink-faint · admin/live = beam).

---

## 4. Typography

| Role | Family | Package (self-hosted, pinned) |
| --- | --- | --- |
| UI + display | **Instrument Sans Variable** (opsz + wght) | `@fontsource-variable/instrument-sans` (verified v5.2.8) |
| Data + code | **JetBrains Mono Variable** | `@fontsource-variable/jetbrains-mono` |

Inter removed. Weights **tuned for light** (text looks *thinner* on bright, opposite of dark):
body **460**, labels/nav 500, panel titles 560, display 620–680, mono data 450 / hero numerals
600. `font-variation-settings: 'opsz' 16` on all UI text; never below 440.

**Scale** — the v2 1.25 ladder + two display steps for spatial hero moments:
`--text-2xs` 11 · `--text-xs` 12 · `--text-sm` 14 · `--text-base` 16 · `--text-lg` 20 ·
`--text-xl` 25 · `--text-2xl` 31 · `--text-3xl` 39 · `--text-4xl` 49 · **`--text-5xl` 61 (new)** ·
**`--text-6xl` 76 (new — the decision score numeral ONLY)**. Line-heights per §11.

Rules: display = Instrument Sans 640, `letter-spacing: -0.03em`; the ONE permitted text gradient
is a subtle top-lit **luminance** mask (ink → ink-muted, "sun from above"), never a hue gradient.
ALL numerics mono + `tabular-nums` + `"tnum","zero"` (globally on `.font-mono`), tracking 0.
Kicker pattern: mono `--text-2xs` uppercase `tracking-[0.18em]` `--color-ink-faint` (→
`--color-beam` when labelling a live region). Body floor 16px, prose line-height 1.65, max 65ch.

---

## 5. Spacing · Radius · Elevation · Depth · Z-index

**Spacing:** Tailwind 4px scale. Card padding `p-5 sm:p-6`; bento gap `gap-3` (12px — cards are
separate floating objects, they need air between planes); section rhythm `space-y-10`; gutter
`px-6`; content `max-w-7xl`.

**Radius — soft daylight objects (rounder than the dark draft):** `--radius-xs 4px` ·
`--radius-sm 8px` · `--radius-md 12px` (buttons, inputs, chips) · `--radius-lg 18px` (cards) ·
`--radius-xl 26px` (hero shelves, lifted pane) · pills `999px`.

**Depth scale (`--z`, the translateZ tokens from §2.2):** `--z-backdrop -240px` ·
`--z-table -40px` · `--z-card 0` · `--z-hover 24px` · `--z-lifted 64px`. Hover is a mid-lift;
Lifted is for the reveal/pane.

**Elevation — daylight shadows scale with Z (light from upper-left; every shadow = ambient +
key + contact, never a single flat line, never pure black):**

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-rest` | `inset 0 1px 0 0 var(--edge-light), 0 1px 2px oklch(28% 0.02 60 / 6%), 0 8px 20px -8px oklch(28% 0.02 60 / 12%)` | Resting cards (`--z-card`) |
| `--shadow-hover` | `inset 0 1px 0 0 var(--edge-light), 0 2px 4px oklch(28% 0.02 60 / 8%), 0 20px 40px -12px oklch(28% 0.02 60 / 18%)` | Hover-lifted cards (`--z-hover`) |
| `--shadow-lifted` | `inset 0 1px 0 0 var(--edge-light), 0 4px 8px oklch(28% 0.02 60 / 10%), 0 40px 80px -20px oklch(28% 0.02 60 / 26%)` | Lifted pane, decision reveal (`--z-lifted`) |
| `--shadow-well` | `inset 0 2px 4px oklch(28% 0.02 60 / 12%), inset 0 0 0 1px var(--color-line)` | Sunken inputs/tracks (light from above → shadow at top-inside) |
| `--shadow-beam` | `0 0 0 3px var(--color-beam-soft)` | Focus/live emphasis (a soft daylight halo, not a glow) |

The shadow GROWS and OFFSETS more as an element rises — that scaling IS the depth cue. Shadows
are ink-tinted (hue 60), never neutral grey, never black.

**Z-index (paint order, distinct from `--z` depth):** content `0` · sticky rail `40` ·
lifted-pane scrim `50` · lifted pane `51` · toast/announcer `60` · grain `9999`.

---

## 6. Motion — one physics, spatial signatures

### 6.1 Springs (Motion v12, verified — literal CSS `linear()` generated from repo's motion@12)

| Token | Physics (JS) | CSS `linear()` (generated) |
| --- | --- | --- |
| `--spring-press` | `{type:"spring",visualDuration:0.18,bounce:0}` | `400ms linear(0, 0.2531, 0.5773, 0.7868, 0.8991, 0.9541, 0.9797, 0.9912, 0.9963, 0.9984, 0.9993, 1, 1)` |
| `--spring-settle` | `{type:"spring",visualDuration:0.45,bounce:0.15}` | `800ms linear(0, 0.0523, 0.1708, 0.314, 0.4571, 0.5866, 0.6963, 0.7848, 0.8534, 0.9047, 0.9416, 0.9673, 0.9843, 0.9951, 1.0014, 1.0047, 1.0061, 1.0062, 1.0057, 1.0049, 1.004, 1.0031, 1.0023, 1.0017, 1.0012, 1.0008, 1)` |
| `--spring-reveal` | `{type:"spring",visualDuration:0.7,bounce:0.28}` | `1150ms linear(0, 0.0241, 0.086, 0.1721, 0.2716, 0.376, 0.4793, 0.577, 0.6662, 0.7454, 0.8136, 0.871, 0.9179, 0.9552, 0.984, 1.0053, 1.0203, 1.0301, 1.0358, 1.0382, 1.0381, 1.0364, 1.0334, 1.0298, 1.0259, 1.0219, 1.018, 1.0144, 1.0112, 1.0083, 1.0059, 1.004, 1.0024, 1.0011, 1.0001, 0.9995, 0.999, 1)` |

Regenerate with `String(spring(visualDuration, bounce))` from `motion@12` if retuned — never
hand-edit. **Orbit/parallax springs are heavier** (a table has mass): `--spring-orbit
{stiffness:120, damping:18, mass:0.4}` (JS only). Springs animate transforms; plain eases animate
opacity/color/filter: `--ease-out cubic-bezier(0.22,1,0.36,1)` ·
`--ease-in-out cubic-bezier(0.65,0,0.35,1)`; durations `--duration-micro 100ms` ·
`--duration-fast 180ms` · `--duration-base 280ms` · `--duration-slow 520ms`. Doherty holds
(feedback <50ms, interaction anims <400ms perceived). Nav filament exception:
`{stiffness:380, damping:32, mass:0.8}`.

### 6.2 Stagger

Panel children 40ms/child (max 6, batch rest). List rows 24ms/row (max 8). Plane entrances
stagger back-to-front (Backdrop → Table → Cards → Lifted, 60ms between planes) so the room
"assembles in depth." Entry only, never on data update/exit.

### 6.3 Signature interactions (named — implement exactly)

1. **ROOM ASSEMBLE** (first paint / route enter): planes fade+dolly in from `translateZ -30px`
   back-to-front (§6.2), 520ms `--spring-settle`; the sun-shafts fade in last. The page "builds
   itself in space."
2. **ORBIT & LIFT** (ambient interaction, §2.3): pointer orbits the Table; cards magnetically
   lift to `--z-hover` + tilt ≤3° + a pointer-tracked specular highlight crosses the top. The
   defining tactile signature — every card is touchable.
3. **PHOSPHOR TRACE** (data arrival — the WP-7 traveling signal, re-lit for daylight; NLM timing
   kept): T+0 upstream node completes; T+50 a **beam** dot travels the edge via `offset-path`
   while the target chip anticipates by dropping `translateZ` slightly (pressed into the table);
   T+250 arrival — chip springs UP to `--z-hover` (`--spring-settle`), its contact-shadow blooms
   and picks up the phase tint (`--shadow-{phase}`); T+250→800 the trace cools from beam to the
   phase tint at 45%. Cost ticker increments ONLY at collisions.
4. **VERDICT RISE** (decision reveal — the Peak, <1.8s): the reveal card rises from the Table
   plane up to `--z-lifted` on `--spring-reveal` as the room around it dims 5% (a
   `[data-revealing]` `filter: brightness(.95)` on siblings) and a soft sun-spot brightens
   beneath it. Then T+120 SignalBadge springs in, T+300 ConvictionGauge sweep, T+440 score
   count-up (existing `useCountUp`), and on count-end the card settles from `--z-lifted` to
   `--z-hover` with its signal-tinted contact-shadow resolving. The one moment the whole model
   reorganizes around a single object. Nothing else animates during it.
5. **DOLLY** (scroll, §2.5): Table translates in Z toward camera + active stage brightens as it
   enters view. Native `animation-timeline` where possible; one pinned moment max/page.
6. **BREATHING** (the live element): the running chip breathes scale 1→1.03 + a ±0.4° `rotateZ`
   sway, 2600ms — exactly one per region. Hero tiles use scale-only 1→1.012.
7. **PAGE TRANSITION:** View Transitions API where supported (outgoing page recedes in Z,
   incoming rises) with a 240ms fade+lift fallback keyed on pathname; `--spring-press`.
8. **SHIMMER** (skeletons): a soft daylight sweep across the paper (`fin-shimmer`), never
   opacity-pulse.

### 6.4 Reduced-motion contract (CRITICAL for 3D — meaningful, not "off")

The whole spatial layer must collapse safely. Global unwind PLUS:

| Signature | Reduced variant |
| --- | --- |
| **All 3D** | **Flatten every `translateZ`/`rotateX`/`rotateY` to 0** (NLM) and set `.stage { perspective: none }`. The page becomes a clean, flat, bright daylight layout — fully designed, not broken. The single most important reduced-motion rule in Solarium. |
| Room Assemble / Page transition | 200ms linear opacity crossfade, no dolly |
| Orbit & Lift | No orbit, no tilt; hover = a flat `--shadow-hover` swap + 1px beam ring; specular off |
| Verdict Rise | Final composed reveal rendered instantly at rest (no rise, no dim); badge+gauge+score at final values |
| Phosphor Trace | No flight/rise; chip switches to complete state instantly; edge takes cooled tint instantly; ticker still updates on the same events |
| Dolly / Breathing / Shimmer / caret | None — static state styling (running chip = beam ring at rest) |

`useReducedMotion()` gates all JS springs AND the pointer-orbit listeners (don't even attach
them). CSS `@media (prefers-reduced-motion: reduce)` force-finishes reveals to final state.
**Verify the flattened layout is a first-class design in the rendered app** — a reduced-motion
user must get a beautiful flat bright dashboard, not a pile of mis-stacked cards.

---

## 7. Texture — daylight tooth

Replace the v2 grain filter in `index.html` with a **light-driven bump** (NLM) so paper has
tactile tooth under the declared sun, not visible static:

```svg
<filter id="fin-grain">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
  <feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="1.4" result="lit">
    <feDistantLight azimuth="315" elevation="55"/>
  </feDiffuseLighting>
  <feComposite in="lit" in2="SourceGraphic" operator="in"/>
</filter>
```

Applied as `.grain::after` (fixed, inset 0, pointer-events none, defined once, NEVER animated,
NEVER in the React tree). On daylight use `mix-blend-mode: multiply` at **~2.5%** opacity (lower
than dark — bright paper shows grain more readily). If it reads as noise on a retina screenshot,
drop to 0.02; never raise `baseFrequency` above 1.

---

## 8. Component vocabulary (build-ready)

Global: interactive targets ≥44×44px (expand hit-area via `::after` if visually smaller);
meaningful state changes announced via existing aria-live patterns; lucide icons only, 16px,
`stroke-width: 1.75`, always with text/aria-label; no emoji ever.

### 8.1 Shell — AppShell · TopNav · Footer · Wordmark

- **AppShell:** `--color-room` + daylight backdrop (§2.6) + grain (§7); hosts the `.stage`
  context for immersive routes; `data-live` drives the sun-spot brightening + Wordmark cursor.
- **TopNav — "the rail":** opaque `--color-paper-1`, full width, single bottom hairline
  `--color-line`, h-14, NOT floating/blurred/pill. On scroll >0: a `--shadow-rest` appears
  beneath it (the rail lifts off the room). Left: Wordmark. Center: tabs. Right: LED cluster
  (HealthDot, QuotaPill). Tabs: Instrument Sans 500 `--text-sm` `--color-ink-muted` → hover
  `--color-ink`; active `--color-ink` + a 2px `--color-beam` **filament** underline sliding via
  the existing Motion `layoutId` (rename `nav-filament`), filament spring.
- **Wordmark:** "FinResearch" 640 tight + a trailing 2×14px beam block cursor — solid at rest,
  blinking (1.1s steps(2)) only while `data-live`; static under reduced motion.
- **Footer:** top hairline; mono `--text-2xs` `--color-ink-faint` colophon (version, source link
  underlined, model tiers); right-aligned health LED mirror.

### 8.2 Card (was GlassCard) — the floating daylight object

`--color-paper-1` fill, `--radius-lg`, `--shadow-rest`, NO border, sits at `--z-card` inside a
stage. Hover (§6.3-2): lifts to `--z-hover` + `--shadow-hover` + ≤3° tilt + specular. Padding
`p-5 sm:p-6`. Header slot = kicker + `--text-lg` 560 title. `variant="hero"`: `paper-2` +
`--radius-xl` + rests at `--z-hover`. Cards never nest >2 deep (3rd level is a well or table).
**Daylight-glass sub-variant** (`variant="glass"`, hero shelves only — the ONE blur budget,
§9.3): `rgba(255,255,255,0.5)` + `backdrop-filter: blur(24px) saturate(1.2)` + `--edge-light`
rim — a frosted glass shelf you see the backdrop light through.

### 8.3 Buttons

All: `--radius-md`, Instrument Sans 500 `--text-sm`, h-11 (44px) / h-9 dense, press =
`scale(0.97)` + drop to `translateZ(-4px)` (pushed into the table) on `--spring-press`, focus §9.1.

| v3 variant | was | Treatment |
| --- | --- | --- |
| **key** | primary | `--color-beam` fill, `--color-beam-fg` text, edge-light, rests at `--z-hover` with `--shadow-hover`; hover lifts to `--z-lifted` + `--shadow-lifted`. The one raised bright object — max one key per view |
| **paper** | glass | `--color-paper-2` fill + `--shadow-rest`; hover → lifts + `--shadow-hover` |
| **rail** | outline | transparent, 1px `--color-line-strong`; hover → `paper-1` fill + faint lift |
| **ghost** | ghost | text-only `--color-ink-muted` → `--color-ink`; underline on hover if inline |

Destructive = `paper` + `--color-bear` text + glyph (never a red fill — chroma stays semantic).

### 8.4 Form inputs — "light-table wells"

`--color-sink` fill, `--shadow-well` (recessed into the paper), 1px `--color-line`, `--radius-md`,
h-11; text `--color-ink`, placeholder `--color-ink-faint`; kicker label above. Focus: border →
`--color-beam` + `--shadow-beam` halo + beam caret (180ms). Ticker/command inputs (AnalyzeForm,
ExplorerSearch): mono, uppercase display, h-14 hero. **Segmented controls**: a sink containing
key-shaped segments; selected = `paper-2` fill + edge-light + lifts to `translateZ(2px)` (a
pressed key popping up) + `--color-ink`; slides via shared-layout spring. Radios/selects follow
the same well+key language.

### 8.5 SignalBadge & chips — "enamel chips"

`--radius-sm`, signal tint fill (`--color-{signal}-tint`), signal-colored glyph + WORD
(TrendingUp/Down/Minus), mono `--text-2xs` uppercase tracking 0.14em, NO border, a faint
`--edge-light` top rim (enamel catching sun). Score suffix `--color-ink`. Status/debate/exchange
chips: same anatomy in ink (`paper-2` fill, `ink-muted` text) unless state-bearing.

### 8.6 QuotaPill & HealthDot — "LED lozenges"

Pill 999px, `paper-1` fill, `--shadow-rest`, mono `--text-2xs`; leading 6px LED dot in its state
color with a soft halo of that hue. States per the frozen API contract: admin→beam "admin ·
unlimited"; metered+room→bull "N live runs left"; exhausted→hold "replay-only"; unmetered→
ink-faint "unmetered demo". HealthDot: 8px LED, healthy bull + breathing, degraded hold, down
bear; always an sr-only status word; static under reduced motion.

### 8.7 PageHeader — with the "sun-line"

Kicker → display title (`--text-3xl` 640, -0.03em, luminance-mask permitted) → optional
`--color-ink-muted` lede. Beneath: the **sun-line** — a full-width hairline carrying a 24px
`--color-beam` lit segment at the content-left edge (the daylight signature detail; this page
header and nowhere else). Header sits at `--z-card`; parallaxes at 1.0.

### 8.8 EmptyState — outcome-oriented, sunlit

Kicker + `--text-xl` 560 headline + `ink-muted` body + ONE `key` CTA. Decoration: three 4px unlit
LEDs (`ink-faint` at 40%) above the kicker — the instrument at rest, waiting for sun. Copy
outcome-oriented ("Analyze NVDA to backfill this chart"), never "No data."

### 8.9 Pipeline canvas — the model on the table (xyflow)

The canvas is the **Table plane's primary object**: the xyflow viewport container is tilted into
the stage (`rotateX(18deg)` at rest on desktop, reduced by orbit; a fixed recede on touch; 0
under reduced motion), giving the pipeline the read of a physical circuit board you look down at.
`aria-hidden` (announcer transcript is the semantic spine); pan/zoom/drag locked; nodes
pre-positioned (zero CLS, sizes from `pipeline.ts` unchanged); a registration dot-grid
(`oklch(28% 0.02 60 / 5%)`, 24px) on the board.
**FinNode = "chip":** `paper-2` fill, `--radius-md`, `--shadow-rest`, mono `--text-2xs` label,
6px status LED. States: idle → label `ink-faint`, LED unlit, flat on board; running → LED beam +
breathing, lifts to `translateZ(10px)` casting a bigger shadow, label `ink`; complete → LED phase
tint, 2px bottom filament in phase tint, check glyph, rests at `translateZ(6px)` with
`--shadow-{phase}`; error → bear filament + LED + X; cached/skipped → 1px dashed
`--color-line-strong`, sits pressed. Phase tints (state chroma): analysts `--color-conservative`
· debate `--color-hold` · trade/risk `--color-aggressive` · reporter/verdict = final action's
signal. **FinEdge:** dormant 1px `--color-line-strong`, `vector-effect: non-scaling-stroke`; live
edge = beam dash-flow + the Phosphor Trace dot; done = solid phase tint at 45%. Edges are grooves
in the board (a 1px `--edge-light` highlight beside them sells the channel).

### 8.10 Debate stream panels (DebateTheater · AnalystTrio · TradeRisk)

Cards with a 2px top **persona filament** (bull/bear/conservative/aggressive) + persona kicker.
Streams: mono `--text-xs` `ink-muted`, top fade mask (`token-stream`, kept), auto-scroll. On a
stage these sit at `--z-card` and lift on hover; the verdict-bridge column gains a beam edge-light
+ a small Z-lift when the facilitator completes. Analyst tiles get their filament on completion
(the trio visibly checks in). Keep running text axis-aligned (clause 4) — panels do NOT tilt with
orbit; only the Table/pipeline tilts. Panels parallax at 1.0.

### 8.11 DecisionReveal — Verdict Rise

Hero card (`variant="hero"`, full width), the Peak. Left: large SignalBadge (20px glyph) + action
word Instrument Sans 680 uppercase `--text-2xl` tracking 0.08em in the signal color. Center:
ConvictionGauge — 120px ring, track `--color-line`, stroke signal color 6px, butt caps. Right:
**the score** — JetBrains Mono 600 `--text-6xl` tabular `--color-ink`, with a signal
luminance-mask (top-lit); mono kicker "SCORE / 100" below. Rationale in `report-prose` under a
hairline. Choreography = Verdict Rise (§6.3-4): the card physically rises out of the table to
`--z-lifted` and settles. The only `--text-6xl` in the app and the largest chroma moment.

### 8.12 CostTicker — "meter strip"

Mono strip in a `--color-sink` well: kicker-label + tabular value groups (tokens · cost · latency
· nodes) separated by 1px vertical rules (not boxes). A 6px beam LED leads (breathing while
streaming, unlit at done). Increments ONLY at trace collisions (§6.3-3); the changed group
flashes to `--color-beam` for 150ms then settles to `ink`. Freezes with one final flash at done.
Numbers never reflow (tabular + fixed-width groups).

### 8.13 Transport bar & scrubber — "tape transport"

Card-footer strip. Keys: `paper`-variant icon buttons ≥44px (play/pause/restart) + a mono speed
key cycling ×1/×2/×4/×8 (default ×4). Track: recessed `--color-sink` channel (h-2, radius 999,
`--shadow-well`); elapsed fill = beam gradient (`--color-beam` → 60%); **node ticks** = 2px
phase-tinted marks at each `node_complete` (the scrubber IS the timeline — kept); playhead = 12px
beam caret with `--shadow-beam`, scale 1.15 + tiny Z-lift while scrubbing. Keyboard slider
semantics unchanged (arrows/Home/End); mono tabular "mm:ss / mm:ss". Seek = pure re-reduce.

### 8.14 Tables (PairTable, prose tables, metric tapes)

Borderless: row hairlines only, NO vertical rules/cell boxes. `th` = kicker style (numeric cols
right-aligned), h-9. Rows h-11; hover → `paper-1`→`paper-2` + faint lift (150ms); selected →
`paper-2` + `--shadow-hover`. Numerics mono tabular right-aligned. Sortable headers = real
buttons; sorted column carries a 2px beam filament + arrow glyph. Delta cells = Functional
Inversion (§3.5) + arrow glyph. Tables live on Cards, axis-aligned, never tilted.

### 8.15 Chart theming

**Candlesticks (lightweight-charts v4)** — MUST route colors through the existing `cssVar()`
rgb-probe (v4 can't parse OKLCH; passing tokens raw crashes it — learned live): up `--color-bull`
/ down `--color-bear`; `borderVisible:false`; wicks same hues via `withAlpha(…,0.8)`; background
transparent over the card; grid: horizontal lines only at ink 6%, vertical OFF; crosshair 1px
beam dashed, labels on `paper-2`; volume histogram signal-tinted via `withAlpha(…,0.18)`, ~20%
pane height, pinned to time axis; range pills = segmented keys (§8.4); floating OHLC legend = a
`paper-2` chip (mono, top-left, `--shadow-rest`, no blur). The chart is the Dossier's Table-plane
specimen — it may sit on a slightly-tilted glass shelf, but the plot area itself stays
flat/axis-aligned (clause 4). Candles carry the page's chroma.
**recharts (Eval)** — SVG, OKLCH vars work directly: axis ticks mono 11px `ink-faint`; grid ink
6% `strokeDasharray="2 4"`; quadrant `ReferenceArea` fills = bull/bear at 6%; the (0,0) ablation
crosshair = two `ReferenceLine`s at `--color-line-strong`; points = judge colors (§3.5), hollow
for unjudged; `isAnimationActive={false}`; tooltip = `paper-2` + `--shadow-lifted`, no blur.

### 8.16 Lifted Pane (drawers/modals — onion peel, rises in Z)

Scrim: `oklch(28% 0.02 60 / 28%)` (ink-tinted daylight dim) + the app's single permitted
`backdrop-filter: blur(20px)`. Pane: `paper-2`, `--radius-xl`, `--shadow-lifted`, enters by
rising from `translateZ(0)` + translateY(12px) to `--z-lifted` on `--spring-settle`. Focus
trapped; Escape closes; focus returns to invoker. Raw-metadata reveals = mono `--text-xs` in a
`--color-sink` well + copy `rail` button.

### 8.17 Search (ExplorerSearch + semantic) — "the loupe"

Hero `--color-sink` well h-14, mono, lucide Search icon `ink-faint`, blinking beam block caret.
Semantic mode: an ink chip "semantic · pgvector"; keyword fallback: hold LED chip "keyword mode ·
semantic search needs Postgres" (honesty pattern kept). Results in mirror lanes (§10-Market).

---

## 9. Accessibility & performance contracts

### 9.1 Focus
`:focus-visible` = 2px solid `--color-beam`, offset 2px, `--radius-xs`, + `--shadow-beam` halo.
Never removed, never color-shifted per component. Tab order: form → transcript → results →
footer; canvas non-focusable. 3D tilt must NOT change tab/reading order (DOM order is truth).

### 9.2 Non-negotiables (verified in the RENDERED app)
AA everywhere / AAA on primary data values (§3 ratios are the proof obligations); glyph + word +
color on every signal; aria-live announcer + `<details>` transcript kept as the canvas spine;
44px targets; tabular numerics; **reduced-motion flattens all 3D to a first-class flat layout
(§6.4)**; `prefers-contrast: more` bumps `--color-line` to 18% and `ink-faint` to
`oklch(40% 0.018 60)`; `hover:none`/coarse pointers disable orbit (§2.3). Motion sickness: max 5°
orbit, heavy spring, idle-drift off under reduced motion.

### 9.3 GPU / perf budget
ONE `backdrop-filter` context: the Lifted Pane (while open) + the optional `variant="glass"` hero
shelf — budget for at most **one glass shelf visible at a time per route** (never a grid of
blurred cards). Backdrop = 3 static layers + grain. Animate transform/opacity/filter only;
`will-change: transform` only on orbiting/lifting elements, removed at rest. `perspective` on one
`.stage` per region (no nested perspective). Charts stay in their lazy route chunks (never
`manualChunks` into vendor — existing grep guards). CLS: chips pre-positioned; panels reserve
stream heights. Target 60fps on the orbit — if a mid-tier laptop drops frames, reduce Card count
on the Table plane before reducing the spread.

---

## 10. Per-page art direction

### Analyze — "the light-table" (the showpiece)
Two states inside one `.stage`. **Armed:** a bright command bench — kicker ("EQUITY RESEARCH
PIPELINE"), display headline, the hero loupe well (§8.17) with segmented mode keys + one `key`
button ("Run analysis"); below, the full pipeline model tilted on the Table plane, UNLIT (idle
chips flat, dormant grooves) — the recruiter sees the whole machine as a physical object before
it wakes; the empty state IS the product diagram, in 3D. **Live:** ROOM stays; the Trading-Floor
causality survives — the tilted pipeline board is the spine, organs on Cards beneath in the
asymmetric bento (AnalystTrio 3×4col → DebateTheater 8col + TradeRisk 4col subgrid →
DecisionReveal 12col → CostTicker strip under the board). Scroll dollies through the stages
(§2.5). Hero moments: the room assembling in depth, traces lifting chips off the board, the
Verdict rising out of the table. Quota-blocked: hold LED banner + replay `key` (never dead-ends).

### Library — "the ledger table"
PageHeader ("RESEARCH LIBRARY" / mono count). Controls: mono ticker well + segmented status keys.
Rows (h-14, whole-row links) as cards laid on the table: verdict chip (96px col) | ticker mono 500
| conviction meter (3px track, signal fill) | metrics tape (mono ink-faint) | relative time.
Hover lifts the row card toward you (§6.3-2) with a bigger shadow; 24ms stagger on load. The
verdict chips stacking down the page form a colored spine on a bright ledger. **RunDossier
replay:** outcome-up-front header (badge + score + "Run ticker live" rail) + cockpit in replay +
tape transport (§8.13). Memorable: scrubbing re-lights and re-lifts the pipeline chips.

### Market — "the observatory"
Explorer: the loupe hero + mirror-binary lanes (coverage | research, 1fr 1fr, shared mono DNA) +
keyword-fallback honesty chip + mono coverage strip. **Dossier:** asymmetric bento on a stage —
the candlestick chart is the lit **specimen on a glass shelf** (8col×2rows, slightly tilted shelf,
flat plot area), price in `--text-5xl` mono in the header with signed change in signal color;
fundamentals tape 4col (Functional-Inversion tints), news feed 4col below. Range keys top-right;
range switch 400ms `--ease-out`. Backfill empty state: §8.8 "Analyze {ticker} to backfill".
Memorable: the chart floating on daylight glass, wicks catching the light.

### Eval — "the lab bench"
Reading axis kept: VERDICT → EVIDENCE → RECEIPTS. VerdictBand: asymmetric bento, hero delta as a
giant mono figure (`--text-4xl`) tinted by Functional Inversion + arrow, breathing tile while
fresh; judge tiles honest ("n/a" when unjudged, never fake 0%). MethodologyTape: a bright
hairline-framed strip, mono kicker "JUDGE-PROXY · METHODOLOGY", `ink-muted` body, beam sun-line
(confident paper, not a warning). Scatter (§8.15): quadrant tints + the (0,0) ablation crosshair
are the argument; RunRail = segmented keys (?label= deep-links kept). PairTable §8.14. Memorable:
a bright lab sheet where only the evidence is colored, points settling in from the origin.

---

## 11. Reference `@theme` (paste-ready skeleton)

```css
@import "tailwindcss";
@import "@fontsource-variable/instrument-sans";
@import "@fontsource-variable/jetbrains-mono";

@custom-variant dark (&:where(.dark, .dark *)); /* forward-compat only; no dark tokens */

@theme {
  --font-sans: "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, "SF Mono", monospace;

  /* type: 2xs..4xl as v2 + display steps §4 */
  --text-5xl: 3.8125rem; --text-5xl--line-height: 4rem;
  --text-6xl: 4.75rem;   --text-6xl--line-height: 4.75rem;

  /* daylight surfaces §3.1 */
  --color-room: oklch(95.5% 0.010 85);
  --color-paper-1: oklch(98.5% 0.005 85);
  --color-paper-2: oklch(99.8% 0.003 85);
  --color-sink: oklch(93% 0.012 85);
  --color-line: oklch(28% 0.02 60 / 10%);
  --color-line-strong: oklch(28% 0.02 60 / 18%);
  --edge-light: oklch(100% 0 0 / 85%);

  /* ink §3.2 */
  --color-ink: oklch(25.5% 0.02 60);
  --color-ink-muted: oklch(43% 0.02 60);
  --color-ink-faint: oklch(48% 0.018 60);

  /* beam §3.3 */
  --color-beam: oklch(47% 0.185 255);
  --color-beam-soft: oklch(47% 0.185 255 / 12%);
  --color-beam-fg: oklch(99% 0.003 85);

  /* signals §3.4 (+ -tint /14% fills) */
  --color-bull: oklch(42% 0.155 150);        --color-bull-tint: oklch(42% 0.155 150 / 14%);
  --color-bear: oklch(44.5% 0.205 25);       --color-bear-tint: oklch(44.5% 0.205 25 / 14%);
  --color-hold: oklch(44.5% 0.125 66);       --color-hold-tint: oklch(44.5% 0.125 66 / 14%);
  --color-conservative: oklch(44% 0.135 255);--color-conservative-tint: oklch(44% 0.135 255 / 14%);
  --color-aggressive: oklch(45.5% 0.195 32); --color-aggressive-tint: oklch(45.5% 0.195 32 / 14%);

  /* radius §5 */
  --radius-xs: 4px; --radius-sm: 8px; --radius-md: 12px; --radius-lg: 18px; --radius-xl: 26px;

  /* depth (translateZ) §5 */
  --z-backdrop: -240px; --z-table: -40px; --z-card: 0px; --z-hover: 24px; --z-lifted: 64px;

  /* daylight elevation §5 (shadows ink-tinted hue 60, scale with Z) */
  --shadow-rest: inset 0 1px 0 0 oklch(100% 0 0 / 85%),
    0 1px 2px oklch(28% 0.02 60 / 6%), 0 8px 20px -8px oklch(28% 0.02 60 / 12%);
  --shadow-hover: inset 0 1px 0 0 oklch(100% 0 0 / 85%),
    0 2px 4px oklch(28% 0.02 60 / 8%), 0 20px 40px -12px oklch(28% 0.02 60 / 18%);
  --shadow-lifted: inset 0 1px 0 0 oklch(100% 0 0 / 85%),
    0 4px 8px oklch(28% 0.02 60 / 10%), 0 40px 80px -20px oklch(28% 0.02 60 / 26%);
  --shadow-well: inset 0 2px 4px oklch(28% 0.02 60 / 12%),
    inset 0 0 0 1px oklch(28% 0.02 60 / 10%);
  --shadow-beam: 0 0 0 3px oklch(47% 0.185 255 / 12%);
  /* + --shadow-bull/-bear/-hold: --shadow-rest with the signal hue mixed into the key layer @22% */

  /* motion §6 (springs are the literal linear() strings in §6.1) */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-micro: 100ms; --duration-fast: 180ms; --duration-base: 280ms; --duration-slow: 520ms;
}

@layer base {
  html { color-scheme: light; }
  body { color: var(--color-ink); background: var(--color-room);
    font-variation-settings: 'opsz' 16; }
}
```

Utilities to (re)define in `@layer components`: `.stage` (perspective + origin), `.plane-*` (the
four depth planes), `.card` / `.card-glass`, `.well`, `.sun-line`, `.kicker`, `.token-stream`
(kept), `.report-prose` (kept, re-tokened), `.grain` (new filter §7). Keyframes: `fin-breathe`
(1→1.03 + ±0.4° rotateZ), `fin-breathe-tile`, `fin-collide` (was accent-flash: Z-dip→Z-lift),
`fin-signal-travel`, `fin-edge-flow`, `fin-verdict-rise` (Z 0→64px), `fin-rise-in`, `fin-shimmer`,
`fin-caret-blink`. The reduced-motion block is EXTENDED to flatten all Z/rotate transforms and set
`.stage { perspective: none }` (§6.4).

---

## 12. Migration map (v2 / dark-draft → v3 Solarium)

| From | To |
| --- | --- |
| Dark asphalt surfaces (hue 260) / glass fills | daylight paper (hue 85), elevation = brighter+shadow+Z (§3.1, §5) |
| `--color-accent` azure / dark "beam" | `--color-beam` daylight sky-azure (§3.3) |
| `AuroraBackground` blobs | daylight backdrop: sky wash + sun-shafts + horizon (§2.6) |
| `.glass`/`.glass-strong` (blur everywhere) | `.card`/`.card-glass`; blur ONLY on the lifted pane + one hero glass shelf (§9.3) |
| Glow-on-dark elevation | daylight shadows that scale with translateZ (§5) |
| Flat 2D layout | Stage Geometry: 4 depth planes, orbit, parallax, scroll-dolly (§2) |
| Inter | Instrument Sans Variable (uninstall `@fontsource-variable/inter`) |
| Signal colors (bright-on-dark) | darkened for AAA-on-daylight (§3.4) |
| Button primary/glass/outline/ghost | key/paper/rail/ghost (§8.3) |
| nav pill / dark filament | beam filament underline, same `layoutId` |
| `--radius-2xl` | `--radius-xl` max (26px) |

Frozen through migration: all DTO/API semantics, `analysisReducer`/`eventPlayer` seams, node
topology counts (12 on / 10 off), announcer patterns, chunking discipline, the `cssVar()`
rgb-probe for lightweight-charts, the recharts `dedupe`/`optimizeDeps` fix.

---

## 13. Anti-patterns — implementers must NOT

1. Ship a flat layout with no depth planes, OR conversely tilt/parallax **reading surfaces**
   (running text, tables, chart plot areas) past comfort — immersion frames, data stays flat
   (One Rule clause 4). Max 5° orbit.
2. Use pure `#fff`/`#000`; cool the daylight hue toward blue-white; make a surface darker to show
   elevation (elevation is brighter + higher + bigger shadow).
3. Use borders for containment/elevation; use grey (non-ink-tinted) or black shadows.
4. Add a chromatic accent beyond the ONE beam; use signal hues on non-state chrome; exceed the
   <8% chroma budget at rest.
5. Add `three`/`@react-three/fiber` (or any heavyweight dep) without the §2.8 sign-off; put the
   optional WebGL scene in the entry graph or without a perf/reduced-motion gate.
6. Nested `perspective`; blanket `will-change`; more than one glass-blur surface visible per
   route; `manualChunks` the chart libs into vendor.
7. Ship 3D without the reduced-motion flatten (§6.4) verified as a first-class flat layout, or
   leave orbit attached on `hover:none`/coarse pointers — motion-sickness + touch hazards.
8. `linear` easing on transforms; springs on opacity; animate anything during Verdict Rise but
   the reveal.
9. Serif or a third typeface; weights ≥720 or <440; tracking on mono; proportional numerals.
10. Color-only signals (glyph + word always); raw oklch/hex in components; OKLCH into
    lightweight-charts without the `cssVar()` probe.
11. Drop the aria-live transcript, focus ring, 44px targets, or reduced-motion variants —
    a11y regressions are design regressions.
12. Two `key` buttons in one view; kickers in signal colors; `--text-6xl` outside DecisionReveal.
13. Ship any of this without looking at it rendered (Playwright at 1440/834/390, a forced
    `prefers-reduced-motion` pass, a `hover:none` pass, and a keyboard-only pass).

---

## 14. Sourcing kit — 21st.dev (accelerant, not authority)

Approved component-reference library for the build phase. Access-path status, verified 2026-07-03:

- **Configured MCP (`magic` in `~/.claude.json`, `@21st-dev/magic@0.0.46`):** server boots +
  lists 4 tools, but the two data tools currently fail — `21st_magic_component_inspiration`
  crashes server-side with MCP `-32602` ("Invalid tools/call result": upstream returns content
  items missing `type`/`text`), and `21st_magic_component_builder` hangs >120s. Probe the MCP
  once per session (it may be fixed upstream); don't burn more than one call. Reach it by reading
  `mcpServers.magic` (command/args/env) from `~/.claude.json` at runtime — never hardcode the key
  (the permission classifier denies credential-in-script).
- **Web fallback (works, no auth):** each `21st.dev/@author/components/<name>` page exposes full
  source in `Usage.tsx`/`Component.tsx` tabs (Playwright-capturable). "Copy prompt" is
  Clerk-auth-gated.

### Curated map (captured from the live site — start here)

| v3 component | 21st.dev reference(s) | Take / adapt |
| --- | --- | --- |
| Pipeline model + traces (§8.9) | `/@svg-ui/components/cpu-architecture` (animated SVG traces into a die — our exact metaphor); `/@aliimam/components/network-animation`; `/@xordev/components/nucleus` | Take the SVG trace technique; re-skin strokes to beam/phase tokens; keep xyflow as the layout engine |
| The loupe / AI inputs (§8.17, §8.4) | `/@kokonutd/components/animated-ai-input`; `/@suraj-xd/components/claude-style-ai-input`; `/@kokonutd/components/v0-ai-chat` | Take focus/expansion ergonomics; strip gradients/dark; re-skin as sink well + beam caret |
| CSS-3D depth / parallax cards (§2) | `/@aayush-duhan/components/card-fan-carousel`; `/@thanh/components/sticky-scroll-cards-section`; `/@ui-layouts/components/clip-path-image` | Reference for `preserve-3d` + scroll-scrub mechanics; re-time to §6 springs, flatten under reduced motion |
| Daylight glass shelf (§8.2 glass) | `/@shatlyk1011/components/gradient-borders-button` (edge technique); visionOS refs | Frosted `paper-2` + blur only; obey the one-glass budget §9.3 |
| Score count-up (§8.11) | `/@hextaui/components/animated-counter` | Reference only — keep `useCountUp` |
| Backdrop light field (§2.6) | `/@kokonutd/components/beams-background`; `/@efferd/components/gradient-dots` | LOOK reference only — ours is a STATIC CSS gradient (perf §9.3), not an animated canvas |
| Display text reveal (page titles) | `/@danielpetho/components/vertical-cut-reveal`; `/components/letter-swap` | Entry-only, ≤once/page, spring §6.1, never on data |

### Integration prompt (replaces their "Copy prompt")

> You are given a reference React component from 21st.dev. Integrate its TECHNIQUE — not its
> skin — into FinResearchAI (`web/`, React 19 + Tailwind v4 + Motion v12, ZERO new deps).
> Re-tokenize to `web/DESIGN.md` v3 "Solarium": tokens §3 only (no raw colors), type §4
> (Instrument Sans / JetBrains Mono, opsz 16), motion §6 springs, the depth planes/stage §2,
> One Rule §1 (depth = light+shadow+parallax; color = state; the frame is 3D, the data is flat).
> Delete: dark surfaces, glow-on-dark, borders-as-elevation, backdrop-blur beyond the one budget,
> any dependency not already in package.json. Add the reduced-motion flatten (§6.4) and the
> `hover:none` fallback; pass anti-patterns §13. It must be indistinguishable from a native
> Solarium component when done.

Nothing lands verbatim. 21st.dev is scaffolding for craft speed; the One Rule always wins.
