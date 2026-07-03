# Assay — Design System v3: MACHINED LIGHT

> **Identity:** _Machined Light — a tungsten-lit graphite instrument._
> **Thesis:** Assay is a precision instrument milled from graphite and lit by a
> single tungsten lamp. **Every trace of chroma is a market or state signal. Every glow
> is live computation. Everything else speaks in luminance.**
> **Dark-only. No light theme** (justification in §2.7).

This document REPLACES the v2 "Glass-SaaS shell × Terminal data surfaces" system.
It is the implementation contract for the v3 reimagine: tokens land in
`src/styles/index.css` under Tailwind v4 `@theme` (reference block in §11), and every
component treatment in §8 is precise enough to build without asking. A migration map
from v2 tokens/classes is in §12. Never use raw hex/oklch in components — token names only.

Sources behind this direction: NotebookLM "Advanced UI Design and Animation Resources"
(Programmatic Instrument Slate; Diffuse Surface Mapping; Luminous Signal Rationing —
high-chroma accents restricted to <3% of screen area read as *light emission from
precision instrumentation*, not pigment); Motion v12 docs via Context7 (`spring()` →
CSS `linear()` compilation, §6.1); 2026 dark-first patterns (borderless elevation via
luminance steps; type tuned for dark; single-metric calm); 21st.dev component
sourcing (curated map + access-path status in §14). All contrast ratios in §3 were
**computed** (OKLCH→linear-sRGB→WCAG), not guessed.

---

## 1. The One Rule

> **Color is state. Light is interaction. Everything else is graphite.**

Every design decision is testable against three clauses:

1. **Is this element chromatic?** Then it MUST encode market/run/system state
   (BUY/SELL/HOLD, bull/bear, persona, judge preference, health, quota, phase). If it
   doesn't, strip the hue.
2. **Does this element glow, brighten, or emit?** Then it MUST be interactive or live
   (focused, hovered, pressed, streaming, running). Emission is never decoration.
3. **Everything else** — chrome, containers, labels, dividers, canvas — is rendered in
   graphite and warm-ivory luminance steps under one consistent light source.

Corollary — **the chroma budget**: at rest, less than 3% of any viewport's pixels are
chromatic. This is what makes the verdict chip, the candles, and the scatter points
*land*. Guard it jealously (Von Restorff: isolation only works if the field is quiet).

**The light source** is declared once: **above the composition, 10° left of vertical**
(SVG `feDistantLight azimuth="250" elevation="62"`). All edge-lights sit on TOP edges;
all key shadows fall DOWN. No element receives light from nowhere.

**Onion-Peel disclosure survives from v2**: editorial summaries by default; raw
metadata (deltas, hashes, event payloads) on demand via lifted panes. Recruiters stay
oriented; engineers who dig get rewarded.

---

## 2. Materials & Surfaces

### 2.1 The material metaphor

Surfaces are **machined graphite** — matte, milled, slightly warm under the lamp —
not glass. The v2 glass language (backdrop-blur, translucent fills, aurora blobs) is
retired. Depth is expressed the way a physical instrument expresses it:

- **Elevation = luminance.** Each raised step is a lighter graphite (§3.1), never a
  border. Borders-as-containment ("prison cells") are abolished app-wide.
- **The milled edge.** Every raised surface carries a 1px inset top edge-light
  (`--edge-light`) — the lamp catching the milled rim — plus a layered ambient+key
  shadow (§5). This pair, not a border, is what makes a panel read as a panel.
- **Wells are sunken.** Inputs and recessed tracks sit BELOW their panel: darker fill
  (`--color-well`) + inset top shadow (shadow inverts because the light comes from above).

### 2.2 Backdrop-blur budget: ONE

Exactly one `backdrop-filter` surface is permitted in the entire app: the **Lifted
Pane** (modal/drawer overlay scrim, §8.16), `blur(20px)`, existing only while open.
Nav, cards, tooltips, tiles: opaque. This is both the GPU budget and the material
story — instruments don't have frosted parts.

### 2.3 Atmosphere layers (bottom → top)

| Layer | What | Cost |
| --- | --- | --- |
| 0 | `--color-bench` page fill | free |
| 1 | **Bench light** — one fixed radial field: `background: radial-gradient(120% 90% at 50% -10%, oklch(96% 0.02 90 / 5%), transparent 55%)` on a fixed, pointer-events-none div. Static. This replaces `AuroraBackground` (delete the blobs). | one composited layer |
| 2 | **Live emission field** — only when a run is live (`[data-live="true"]` on the shell): a second radial field behind the cockpit region, `radial-gradient(80% 60% at 50% 30%, oklch(97% 0.01 90 / 4%), transparent 60%)`, opacity animated 0→1 over 600ms on ignition (§6.3-1). | one composited layer, run-time only |
| 3 | Content | — |
| 4 | **Machined grain** — the upgraded `#fin-grain` SVG filter (§7), fixed pseudo-element, ~3.5% opacity, `mix-blend-mode: overlay`, `z-index` top, pointer-events none. STATIC — never animated. | GPU-cached once |

### 2.4 What replaces "glass"

The `.glass` / `.glass-strong` utilities are replaced by `.panel` / `.panel-raised`
(§11). `GlassCard` is re-skinned as **Panel** (keep the file, swap the classes; rename
to `panel.tsx` at the implementer's discretion — update imports atomically if so).

### 2.5 Hairline policy

Hairlines (`--color-line`) are RULES, not boxes: horizontal section rules, table row
separators, the nav rail's bottom rule, the PageHeader bench rule. The only closed
1px outlines permitted: form inputs (functional affordance), the `rail` button
variant, and dashed outlines on skipped/cached pipeline dies.

### 2.6 Dot grid (pipeline canvas only)

The xyflow canvas gets a milled registration grid: 1px dots, 24px gap,
`oklch(96% 0.02 90 / 3%)`. Nowhere else.

### 2.7 No light theme — decided

This is a monitoring instrument whose identity is emission and luminance rationing;
inverting it halves the craft budget and destroys the metaphor (emission on white is
just… ink). Demo/recruiter contexts are screen-based and dark-friendly.
`color-scheme: dark` stays; the `.dark` variant scoping stays for forward-compat, but
no light tokens exist. Print/report export, if ever needed, is a separate concern —
do not attempt it by inverting tokens.

---

## 3. Color — OKLCH, computed contrast

All values OKLCH (perceptually uniform emission across luminance steps). Ratios below
are computed WCAG ratios, stated honestly. Targets: **AAA (7:1) on primary data
values**, AA (4.5:1) minimum on all text, 3:1 on non-text affordances.

### 3.1 Graphite surfaces (warm cast, hue 75)

The warm cast (hue 75, chroma 0.006–0.009) is the tungsten lamp on graphite — it is
what separates this system from every blue-black dev tool. Do not drift it cooler.

| Token | Value | Use |
| --- | --- | --- |
| `--color-bench` | `oklch(11% 0.006 75)` | Page background (the bench) |
| `--color-surface-1` | `oklch(14.5% 0.007 75)` | Resting panel |
| `--color-surface-2` | `oklch(18% 0.008 75)` | Raised panel, hover rows, dies |
| `--color-surface-3` | `oklch(22.5% 0.009 75)` | Overlay panes, tooltips, active rows |
| `--color-well` | `oklch(9% 0.005 75)` | Sunken inputs, recessed tracks |
| `--color-line` | `oklch(96% 0.02 90 / 7%)` | Hairline rules |
| `--color-line-strong` | `oklch(96% 0.02 90 / 13%)` | Emphasized rules, scrollbar thumb, rail buttons |
| `--edge-light` | `oklch(96% 0.02 90 / 8%)` | The 1px inset top rim on raised surfaces |

Adjacent surface steps are ~3.5 OKLCH-L points apart — perceptually clear on dark
without borders; the edge-light + shadow pair does the rest.

### 3.2 Text (warm ivory — tuned for dark)

| Token | Value | Ratio (base / surface-1 / surface-2) | Use |
| --- | --- | --- | --- |
| `--color-fg` | `oklch(94.5% 0.012 90)` | 17.4 / 16.9 / 16.0 — AAA | Primary text, ALL primary data values |
| `--color-fg-muted` | `oklch(76% 0.014 90)` | 9.5 / 9.2 / 8.8 — AAA | Secondary, body prose, streams |
| `--color-fg-subtle` | `oklch(62% 0.012 90)` | 5.6 / 5.4 — **AA, not AAA** | Kickers, metadata, disabled. Never for data values. |

**Type-tuned-for-dark:** on these surfaces text blooms; body weight is **450** (not
500), display **600–620** (never 700+). See §4.

### 3.3 The Beam (interaction light — achromatic)

There is **no chromatic interaction accent**. The v2 azure is retired (§12). All
interaction speaks in tungsten light:

| Token | Value | Ratio | Use |
| --- | --- | --- | --- |
| `--color-beam` | `oklch(97% 0.01 90)` | 18.8:1 on base | Focus rings, caret, playhead, live LEDs, key-button fill, crosshair, filament underlines |
| `--color-key-fg` | `oklch(14.5% 0.01 75)` | 18.2:1 on beam | Text/icons on beam fills |
| `--color-beam-dim` | `oklch(97% 0.01 90 / 20%)` | — | Selection background, subtle live tints |

Affordance rules that replace azure: links are `--color-fg` with a 1px underline at
`--color-line-strong`, hover → underline becomes beam; primary actions are beam-filled
**key** buttons (§8.3); focused anything gets the beam ring (§9.1). Interactive is
always discoverable by light + underline + shape — never by hue.

### 3.4 Signal colors — the ONLY chroma

Semantics identical to v2 (frozen contract): always glyph + word + color, never color
alone. All pass **AAA (≥7:1)** as text on base/surface-1/surface-2 — computed.

| Token | Value | Ratio (surface-1) | Meaning |
| --- | --- | --- | --- |
| `--color-bull` | `oklch(74% 0.16 150)` | 9.1:1 | BUY · bull · positive · healthy · done |
| `--color-bear` | `oklch(72% 0.17 25)` | 7.4:1 | SELL · bear · negative · error |
| `--color-hold` | `oklch(80% 0.14 80)` | 10.5:1 | HOLD · warn · degraded · replay-only |
| `--color-conservative` | `oklch(72% 0.09 235)` | 8.1:1 | Conservative risk persona (cool, measured) |
| `--color-aggressive` | `oklch(73% 0.14 55)` | 8.0:1 | Aggressive risk persona (hot, risk-on) |

Notes: bear was brightened from v2 (64%→72% L) specifically to reach AAA — do not
darken it back for "richness"; use `--color-bear-dim` fills for richness instead.
Bear (hue 25) vs aggressive (hue 55) are 30° + chroma-separated AND never appear
without persona/verdict labels. Conservative (235) is intentionally the only cool hue
on screen — it reads instantly against the warm field.

**Dim fills** (badge/chip/underglow backgrounds — fills only, never text):
`--color-bull-dim: oklch(74% 0.16 150 / 12%)` · `--color-bear-dim: oklch(72% 0.17 25 / 13%)`
· `--color-hold-dim: oklch(80% 0.14 80 / 12%)` · `--color-conservative-dim: oklch(72% 0.09 235 / 12%)`
· `--color-aggressive-dim: oklch(73% 0.14 55 / 12%)`.

**Emission glows** (box-shadows for live/complete states — §5):
`--glow-beam`, `--glow-bull`, `--glow-bear`, `--glow-hold` (definitions in §11).

### 3.5 Judge colors (Eval)

Debate-ON preferred = `--color-bull` (the thesis earns its keep); debate-OFF preferred
= `--color-conservative` (the ablation wins — informative, NOT negative; never bear);
tie = `--color-fg-subtle`; unjudged = hollow point, 1px `--color-line-strong` stroke,
no fill. Functional Signal Inversion for deltas survives exactly as shipped: sign
colored by OUTCOME UTILITY (score↑ green / score↓ amber; cost·latency↑ amber / ↓
green), always paired with a directional arrow glyph.

### 3.6 System-state colors

Health, quota, and run status reuse signal hues (rule 1 permits state semantics):
healthy/room = bull · degraded/exhausted/replay = hold · down/error = bear ·
unmetered/neutral = fg-subtle · admin/live = beam. Always with a word.

---

## 4. Typography

### 4.1 Families

| Role | Family | Package (self-hosted, pinned) |
| --- | --- | --- |
| UI + display | **Instrument Sans Variable** (wght axis) | `@fontsource-variable/instrument-sans` (verified: v5.2.8 on npm) |
| Data + code | **JetBrains Mono Variable** (kept from v2 — it is the best data mono; churn buys nothing) | `@fontsource-variable/jetbrains-mono` |

Inter is removed (`@fontsource-variable/inter` uninstalled). Instrument Sans is the
single biggest visible change of v3: a grotesque with machined-but-human details, and
the name is the identity. No serif anywhere — authority comes from restraint, not costume.

### 4.2 Weights — tuned for dark

| Context | Weight |
| --- | --- |
| Body / descriptions | **450** |
| Labels, nav, buttons | 500 |
| Panel titles | 550 |
| Display / page titles / verdict word | 600–620 |
| Mono data (all) | 440; giant score numerals 560 |

Never 700+ on these surfaces (halation). Never below 400.

### 4.3 Scale — 1.25 Major Third + display extension

Existing ladder survives; two display steps are ADDED for the exaggerated-minimal
hero moments:

| Token | px / line-height | Use |
| --- | --- | --- |
| `--text-2xs` | 11 / 16 | Kickers, dense terminal labels (floor — never smaller) |
| `--text-xs` | 12 / 17.6 | Metadata, captions, table cells |
| `--text-sm` | 14 / 22.4 | UI default, nav |
| `--text-base` | 16 / 24.8 | Body floor |
| `--text-lg` | 20 / 27 | Panel titles |
| `--text-xl` | 25 / 30.4 | Section titles |
| `--text-2xl` | 31.25 / 36 | Sub-hero |
| `--text-3xl` | 39 / 41.6 | Page titles |
| `--text-4xl` | 48.8 / 49.6 | Large display |
| `--text-5xl` **new** | 61 / 61 | Hero display, dossier price |
| `--text-6xl` **new** | 76 / 76 | The decision score numeral. Nothing else. |

### 4.4 Rules

- **Display treatment:** Instrument Sans 600, `letter-spacing: -0.03em`, and the ONE
  permitted gradient: a vertical *luminance* mask (`background: linear-gradient(180deg,
  var(--color-fg), oklch(76% 0.014 90)); background-clip: text`) — "lit from above."
  Hue gradients on text are banned.
- **All numerics are mono + tabular** — `font-variant-numeric: tabular-nums`,
  `font-feature-settings: "tnum","zero"` set globally on `.font-mono, code, kbd, samp`.
  No exceptions, including inside prose.
- **Mono tracking is always 0** (tracking breaks tabular alignment).
- **Kicker pattern** (the recurring instrument label): mono, `--text-2xs`, uppercase,
  `tracking-[0.18em]`, `--color-fg-subtle`; when it labels a LIVE region it may be
  `--color-beam`. Kickers introduce every panel and page.
- Body floor 16px; report-prose line-height 1.65 (as shipped).

---

## 5. Spacing · Radius · Elevation · Z-index

**Spacing:** Tailwind 4px scale. Panel padding `p-5 sm:p-6`; bento gap `gap-2` (8px —
tiles read as one milled block with routing channels between); section rhythm
`space-y-10`; page gutter `px-6`; content `max-w-7xl`.

**Radius — machined, tighter than v2:** `--radius-xs: 2px` · `--radius-sm: 4px` ·
`--radius-md: 8px` (buttons, inputs, dies, chips) · `--radius-lg: 12px` (panels) ·
`--radius-xl: 16px` (page-level hero panels, lifted panes) · pills `999px` (LED
lozenges only: QuotaPill, HealthDot housing). **`--radius-2xl` (1.75rem) is deleted**
— the soft-glass silhouette is gone.

**Elevation (light from above — every shadow is ambient + key + rim, never a single
flat line, never pure black at high opacity):**

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-panel` | `inset 0 1px 0 0 var(--edge-light), 0 1px 2px oklch(0% 0 0 / 28%), 0 10px 28px -14px oklch(0% 0 0 / 50%)` | Resting/raised panels, dies |
| `--shadow-lifted` | `inset 0 1px 0 0 var(--edge-light), 0 2px 4px oklch(0% 0 0 / 32%), 0 24px 56px -20px oklch(0% 0 0 / 60%)` | Lifted panes, tooltips, popovers |
| `--shadow-well` | `inset 0 1px 3px oklch(0% 0 0 / 40%), inset 0 0 0 1px var(--color-line)` | Sunken inputs, recessed tracks |
| `--glow-beam` | `0 0 0 1px oklch(97% 0.01 90 / 30%), 0 0 20px -4px oklch(97% 0.01 90 / 30%)` | Focus, live emphasis, key-button hover |
| `--glow-bull` / `--glow-bear` / `--glow-hold` | same recipe with the signal color at 35% / 35% / 30% | Completed dies, verdict bloom, error emphasis |

**Z-index scale (tokenized, no ad-hoc values):** content `0` · sticky rail `40` ·
lifted pane scrim `50` · lifted pane `51` · toast/announcer visuals `60` · grain `9999`.

---

## 6. Motion — one physics, literal and shared

### 6.1 Springs (Motion v12, verified API)

One spring language shared by JS and CSS. In JS use the modern API
`{ type: "spring", visualDuration, bounce }`; in CSS use the **literal `linear()`
strings below, generated from the repo's own `motion@12` `spring()`** (regenerate with
`String(spring(visualDuration, bounce))` if retuned — never hand-edit):

| Token | Physics | JS | CSS (generated) |
| --- | --- | --- | --- |
| `--spring-press` | visualDuration 0.18s, bounce 0 | `{type:"spring", visualDuration:0.18, bounce:0}` | `400ms linear(0, 0.2531, 0.5773, 0.7868, 0.8991, 0.9541, 0.9797, 0.9912, 0.9963, 0.9984, 0.9993, 1, 1)` |
| `--spring-settle` | 0.45s, bounce 0.15 | `{type:"spring", visualDuration:0.45, bounce:0.15}` | `800ms linear(0, 0.0523, 0.1708, 0.314, 0.4571, 0.5866, 0.6963, 0.7848, 0.8534, 0.9047, 0.9416, 0.9673, 0.9843, 0.9951, 1.0014, 1.0047, 1.0061, 1.0062, 1.0057, 1.0049, 1.004, 1.0031, 1.0023, 1.0017, 1.0012, 1.0008, 1)` |
| `--spring-reveal` | 0.7s, bounce 0.28 | `{type:"spring", visualDuration:0.7, bounce:0.28}` | `1150ms linear(0, 0.0241, 0.086, 0.1721, 0.2716, 0.376, 0.4793, 0.577, 0.6662, 0.7454, 0.8136, 0.871, 0.9179, 0.9552, 0.984, 1.0053, 1.0203, 1.0301, 1.0358, 1.0382, 1.0381, 1.0364, 1.0334, 1.0298, 1.0259, 1.0219, 1.018, 1.0144, 1.0112, 1.0083, 1.0059, 1.004, 1.0024, 1.0011, 1.0001, 0.9995, 0.999, 1)` |

(The ms figure is the spring's total tail; the *perceived* duration is the
visualDuration. Both are < Doherty for their class of interaction.)

Usage split: **springs animate transforms** (scale, translate, layout); plain eases
animate opacity/color: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` with
`--duration-micro: 100ms` (hover/press feedback) · `--duration-fast: 180ms` (LED/
filament changes) · `--duration-base: 280ms` (page/panel fades) · `--duration-slow:
520ms` (emission ramps, trace cooling). **Never `linear` easing on organic motion**
(the `linear()` spring strings are physics, not linear). Doherty holds: feedback
<50ms, any interaction animation <400ms perceived.

**Nav filament exception** (kept from v2 muscle memory): the shared-layout filament
uses `{stiffness: 380, damping: 32, mass: 0.8}` — tuned for high-frequency tab flicks.

### 6.2 Stagger rules

Panel children: 40ms/child, max 6 then batch the rest as one. List rows (Library,
tables): 24ms/row, max 8. Staggers only on ENTRY, never on exit or data update.

### 6.3 Signature interactions (named — implement exactly)

1. **POWER-UP** (run ignition — the page has light behavior). On `start`:
   T+0 the form acknowledges (<50ms: input rim → beam, submit key presses);
   T+80 the live emission field (§2.3-L2) ramps opacity 0→1 over 600ms `--ease-out`;
   simultaneously nav LEDs brighten (`--duration-fast`), the Wordmark cursor (§8.1)
   begins blinking, and the first die starts breathing. The instrument audibly-in-
   pixels "turns on."
2. **PHOSPHOR TRACE** (data arrival — v2's traveling signal, re-skinned; NLM timing
   kept): T+0 upstream die completes; T+50 a white-hot beam dot travels the edge via
   `offset-path` while the target die anticipates with a dip to `scale(0.97)`
   (`--spring-press`); T+250 collision — die pulses `scale(1.06)` (`--spring-settle`)
   and its signal-tinted underglow ignites; T+250→850 the trace itself **cools**:
   edge stroke fades from beam to the phase tint at 35% over `--duration-slow`.
   Fire on every `node_complete`; the cost ticker increments ONLY at collisions
   (causality, never a timer).
3. **FIRST LIGHT** (decision reveal — the Peak; total < 1.6s):
   T+0 every non-cockpit surface dims 6% luminance for the duration (the lamp
   concentrates — apply via a `[data-revealing]` filter `brightness(.94)` on
   sibling regions, transform/opacity/filter only);
   T+120 SignalBadge springs in (`--spring-reveal`, scale 0.92→1);
   T+280 ConvictionGauge sweep (stroke-dashoffset, 700ms, `--spring-settle`);
   T+420 score count-up (rAF, 700ms, existing `useCountUp`);
   at count-end the score's glow (`--glow-{signal}`) blooms 0→24px→settles at 8px
   (`--spring-settle`) and the dimming releases. This is the app's largest chroma
   moment; nothing else on screen may animate during it.
4. **LAMP PASS** (page transition): 240ms fade + 6px lift on `--spring-press`, keyed
   on pathname (existing `PageTransition`, retimed).
5. **BREATHING** (the live element): scale 1→1.04, opacity 0.85→1, 2600ms
   `--ease-in-out` infinite — exactly one breathing element per region (the running
   die, the live LED). Hero tiles keep the shipped scale-only `fin-breathe-tile`
   (1→1.012, 3200ms) so content stays legible.
6. **SHIMMER** (skeletons): the shipped luminance sweep (`fin-shimmer`) at
   `oklch(96% 0.02 90 / 6%)` — never opacity-pulse.

### 6.4 Reduced-motion contract (meaningful degradation, not "off")

Global unwind (as shipped) PLUS per-signature intent:

| Signature | Reduced variant |
| --- | --- |
| Power-Up | Emission field appears instantly at 60% strength; LEDs switch states with no ramp |
| Phosphor Trace | No flight, no pulse: die switches to complete state instantly; edge takes its cooled tint instantly; cost ticker still updates on the same events |
| First Light | Final composed state rendered immediately (badge+gauge+score at rest, glow at settled 8px); no dimming pass |
| Lamp Pass | Instant route swap, no fade |
| Breathing / Shimmer / edge-flow / caret blink | None — replaced by static state styling (running die = beam rim at rest; skeleton = flat `surface-2`) |

`useReducedMotion()` gates all JS springs; the CSS `@media (prefers-reduced-motion:
reduce)` block force-finishes reveals into final state (opacity 1, transform none).
Verify BOTH paths in the rendered app, not just in source.

---

## 7. Texture — the machined skin

Replace the v2 `#fin-grain` filter in `index.html` with the **Diffuse Surface Map**
(NLM): noise passed through a lighting pass so the grain reads as a milled bump map
under the declared lamp, not as static:

```svg
<filter id="fin-grain">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
  <feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="1.6" result="lit">
    <feDistantLight azimuth="250" elevation="62"/>
  </feDiffuseLighting>
  <feComposite in="lit" in2="SourceGraphic" operator="in"/>
</filter>
```

Applied exactly as v2's `.grain::after` (fixed, inset 0, `opacity: 0.035`,
`mix-blend-mode: overlay`, pointer-events none, defined once, never in the React
tree, NEVER animated). At 3.5% it reads as matte tooth; if it reads as visible static
on a retina screenshot, lower to 0.025 — do not raise `baseFrequency` above 1.

---

## 8. Component vocabulary (build-ready)

Global: every interactive target ≥44×44px (visual size may be smaller with an
expanded hit area via `::after`); every state change that carries meaning is
announced via the existing aria-live patterns; icons are lucide only, 16px default,
`stroke-width: 1.75`, always accompanied by text or an aria-label. No emoji, ever.

### 8.1 Shell — AppShell · TopNav · Footer · Wordmark

- **AppShell:** base fill + bench light (L1) + grain (L4); `data-live` attribute
  driven by the analysis stream phase (powers §2.3-L2 and the Wordmark cursor).
- **TopNav — "the rail":** full-width, opaque `--color-bench`, single bottom hairline
  `--color-line`; h-14; NOT floating, NOT blurred, NOT pill-shaped. On scroll >0:
  fill shifts to `--color-surface-1` and the hairline to `--color-line-strong`
  (180ms). Left: Wordmark. Center-left: tabs. Right: LED cluster (HealthDot,
  QuotaPill).
  **Tabs:** Instrument Sans 500 `--text-sm`, `--color-fg-muted`; hover → `--color-fg`
  (100ms); active → `--color-fg` + the **filament**: a 2px beam underline sliding
  between tabs via the existing Motion `layoutId="nav-active-pill"` (rename to
  `nav-filament`), spring per §6.1 exception. The v2 pill fill is gone.
- **Wordmark:** "Assay" Instrument Sans 600 tight + a trailing 2×14px block
  cursor in `--color-beam` — solid at rest, **blinking (1.1s steps(2)) only while
  `data-live`** (brand ties to liveness; static under reduced motion).
- **Footer:** top hairline; mono `--text-2xs` `--color-fg-subtle` colophon (version,
  source link underlined, model tiers); right-aligned mirror of the health LED.

### 8.2 Panel (was GlassCard)

`--color-surface-1` fill (raised contexts: `surface-2`), `--radius-lg`,
`--shadow-panel`, NO border. Padding `p-5 sm:p-6`. Header slot = kicker +
`--text-lg` 550 title. Optional `variant="hero"`: `--radius-xl` + `surface-2` +
`animate-breathe-tile` when live. Panels never nest more than 2 deep — the third
level is a well or a table, not another panel.

### 8.3 Buttons (variant map from v2)

All: `--radius-md`, Instrument Sans 500 `--text-sm`, h-11 (44px) default / h-9 dense
(with expanded hit area), press = `scale(0.97)` on `--spring-press`, focus = §9.1 ring.

| v3 variant | was | Treatment |
| --- | --- | --- |
| **key** | primary | `--color-beam` fill, `--color-key-fg` text, edge-light inset; hover: `filter: brightness(1.04)` + `--glow-beam` (150ms); the ONLY filled-bright element at rest — one key per view maximum |
| **panel** | glass | `--color-surface-2` fill + `--shadow-panel`; hover → `surface-3` |
| **rail** | outline | transparent, 1px `--color-line-strong`; hover → `surface-1` fill |
| **ghost** | ghost | text-only `--color-fg-muted` → `--color-fg`, no fill; underline on hover if inline |

Destructive confirmation actions use `panel` + `--color-bear` text + glyph (never a
red fill — chroma stays rationed).

### 8.4 Form inputs — "milled wells"

`--color-well` fill, `--shadow-well`, 1px `--color-line` border, `--radius-md`, h-11;
text `--color-fg`, placeholder `--color-fg-subtle`; label = kicker above. Focus:
border → `--color-beam` + `--glow-beam` at 60% (180ms), caret `--color-beam`.
Ticker/command inputs (AnalyzeForm, ExplorerSearch) are mono, uppercase-transformed
display, h-14 for heroes. **Segmented controls** (investor mode, Library status):
a well containing key-shaped segments; selected segment = `surface-3` fill +
edge-light + `--color-fg` (a pressed machined key); moves via shared-layout spring.
Radios/selects follow the same well + key language.

### 8.5 SignalBadge & chips — "engraved chips"

`--radius-sm`, dim fill (`--color-{signal}-dim`), signal-colored glyph + WORD
(TrendingUp/TrendingDown/Minus), mono `--text-2xs` uppercase tracking 0.14em,
NO border. Score suffix in `--color-fg`. Status/debate/exchange chips: same anatomy
in graphite (`surface-2` fill, `fg-muted` text) unless state-bearing.

### 8.6 QuotaPill & HealthDot — "LED lozenges"

Pill 999px, `surface-1` fill, mono `--text-2xs`; leading 6px LED dot with a 40%
glow of its state color. States (semantics from the API contract, frozen):
admin → beam LED "admin · unlimited"; metered+room → bull LED "N live runs left";
exhausted → hold LED "replay-only"; unmetered → fg-subtle LED "unmetered demo".
HealthDot: 8px LED — healthy bull + breathing; degraded hold; down bear; always
paired with an sr-only status word. Reduced motion: static, no breathing.

### 8.7 PageHeader — with the "bench rule"

Kicker (mono, per §4.4) → display title (`--text-3xl`, 600, -0.03em, luminance-mask
permitted) → optional `--color-fg-muted` lede. Beneath: the **bench rule** — a
full-width hairline carrying a 24px `--color-beam` lit segment aligned to the content
left edge. This lit tick is the v3 signature detail; it appears on every page header
and nowhere else.

### 8.8 EmptyState — outcome-oriented, unlit

Kicker + `--text-xl` 550 headline + `fg-muted` body + ONE `key` CTA. Decoration: a
single row of three 4px unlit LEDs (`fg-subtle` at 30%) above the kicker — the
instrument waiting. Copy stays outcome-oriented ("Analyze NVDA to backfill this
chart"), never "No data."

### 8.9 Pipeline canvas — dies & traces (xyflow)

Canvas: transparent over the bench, dot grid per §2.6, `aria-hidden` (the announcer
transcript remains the semantic spine), pan/zoom/drag locked, nodes pre-positioned
(zero CLS — sizes from `pipeline.ts` unchanged).
**FinNode = "die":** `surface-2` fill, `--radius-md`, `--shadow-panel`, mono
`--text-2xs` label, 6px status LED left of the label. States:
idle → label `fg-subtle`, LED unlit (`fg-subtle` 30%);
running → LED beam + breathing (§6.3-5), edge-light doubles (`--edge-light` at 16%),
label `fg`;
complete → LED in phase tint, 2px bottom **filament** in phase tint, check glyph,
underglow `--glow-{phase}` at rest 6px;
error → bear filament + LED + X glyph;
cached/skipped → 1px dashed `--color-line-strong` outline, no fill change.
Phase tints: analysts `--color-conservative` (cool intake) · debate `--color-hold`
(heat of argument) · trade/risk `--color-aggressive` · reporter/verdict = the final
action's signal color. (Phase tint is state — allowed chroma.)
**FinEdge:** dormant 1px `oklch(96% 0.02 90 / 8%)`, `vector-effect:
non-scaling-stroke`; live edge (upstream complete ∧ downstream running) = beam
dash-flow (`fin-edge-flow`) + the Phosphor Trace dot (§6.3-2); completed = solid at
the phase tint 35%.

### 8.10 Debate stream panels (DebateTheater · AnalystTrio · TradeRisk)

Panel base + a 2px top **persona filament** (bull / bear / conservative /
aggressive — semantic chroma) + persona-colored kicker. Streams: mono `--text-xs`
`fg-muted`, the shipped top fade mask (`token-stream`), auto-scroll. The
verdict-bridge column gains a beam edge-light when the facilitator completes.
Analyst tiles get their filament only on completion (the trio visibly "checks in").

### 8.11 DecisionReveal — First Light

Hero panel (`variant="hero"`, full-width). Left: SignalBadge (large: 20px glyph) +
action word in Instrument Sans 620 uppercase `--text-2xl` tracking 0.08em in the
signal color. Center: ConvictionGauge — 120px ring, track `--color-line`, stroke
signal color 6px, butt caps. Right: **the score** — JetBrains Mono 560 `--text-6xl`
tabular, `--color-fg`, with the signal-colored glow bloom per §6.3-3; below it a mono
kicker "SCORE / 100". Rationale renders in `report-prose` beneath a hairline.
Choreography exactly §6.3-3. This panel is the only place `--text-6xl` exists.

### 8.12 CostTicker — "meter strip"

A horizontal mono strip in a well: groups of kicker-label + tabular value (tokens ·
cost · latency · nodes), separated by hairline verticals (rules, not boxes). A 6px
live LED leads the strip (beam, breathing while streaming; unlit at done). Value
increments happen ONLY at trace collisions (§6.3-2) and flash the changed group's
value to `--color-beam` for 150ms before settling to `fg`. At `done` the strip
freezes with one final flash. Numbers never reflow (tabular + fixed-width groups).

### 8.13 Transport bar & scrubber — "tape transport"

Container: panel footer strip. Keys: `panel`-variant icon buttons ≥44px
(play/pause/restart) + a mono speed key cycling ×1/×2/×4/×8 (default ×4, the
recruiter cut). Track: recessed channel (well, h-2, radius 999, `--shadow-well`);
elapsed fill = beam gradient (`oklch(97% 0.01 90 / 90%)` → 60%); **node ticks** = 2px
phase-tinted marks at each `node_complete` (the scrubber IS the pipeline timeline —
kept from WP-8); playhead = 12px beam caret with `--glow-beam`, scale 1.15 while
scrubbing. Keyboard: existing slider semantics (arrows/Home/End) unchanged; time
readout mono tabular "mm:ss / mm:ss". Seek remains pure re-reduce (never interpolate).

### 8.14 Tables (PairTable, report-prose tables, metric tapes)

Borderless: row hairlines only (`--color-line`), NO vertical rules, NO cell boxes.
`th` = kicker style, left-aligned (numeric columns right-aligned), h-9. Rows h-11;
hover → `surface-1`→`surface-2` lift (150ms); active/selected row → `surface-3`.
Numerics: mono tabular right-aligned. Sortable headers are real buttons; the sorted
column carries a 2px beam filament under its header + an arrow glyph. Delta cells
follow Functional Signal Inversion (§3.5) with arrow glyphs.

### 8.15 Chart theming

**Candlesticks (lightweight-charts v4)** — MUST route colors through the existing
`cssVar()` rgb-probe (v4 cannot parse OKLCH; passing tokens raw crashes the chart —
learned live):
up `--color-bull` / down `--color-bear`; `borderVisible: false`; wicks = same hues
via `withAlpha(…, 0.8)`; background transparent over a panel; grid: horizontal lines
only at ivory 4%, vertical OFF; crosshair: 1px beam dashed, labels on `surface-3`;
volume histogram: signal-tinted via `withAlpha(…, 0.2)`, ~20% pane height, pinned to
the time axis; range pills = segmented keys (§8.4); floating OHLC legend = a
`surface-3` chip (mono, top-left, no blur). The candles are the Market page's chroma
budget — nothing else on the page may be chromatic except signal chips.
**recharts (Eval)** — SVG, so OKLCH vars work directly: axis ticks mono 11px
`fg-subtle`; grid ivory 4% `strokeDasharray="2 4"`; quadrant `ReferenceArea` fills =
bull/bear at 5%; the (0,0) ablation crosshair = two `ReferenceLine`s at
`--color-line-strong`; points = judge colors (§3.5), hollow for unjudged;
`isAnimationActive={false}`; tooltip = opaque `surface-3` panel + `--shadow-lifted`
(no blur).

### 8.16 Lifted Pane (drawers/modals — the onion peel)

Scrim: `oklch(0% 0 0 / 55%)` + the app's single permitted `backdrop-filter:
blur(20px)`. Pane: `surface-2`, `--radius-xl`, `--shadow-lifted`, slides 12px +
fades in on `--spring-settle`. Focus trapped; Escape closes; focus returns to the
invoker. Raw-metadata reveals (deltas, event payloads) render as mono `--text-xs` in
a well with a copy `rail` button.

### 8.17 Search (ExplorerSearch + semantic search)

"The lens": hero milled well h-14, mono, lucide Search icon `fg-subtle`, blinking
beam block caret (steps(2), static under reduced motion). Semantic mode: a graphite
chip "semantic · pgvector"; keyword fallback: hold LED chip "keyword mode · semantic
search needs Postgres" (honesty pattern kept). Results in mirror lanes (§9-Market).

---

## 9. Accessibility & performance contracts

### 9.1 Focus

`:focus-visible` = 2px solid `--color-beam`, offset 2px, `--radius-xs`, plus
`--glow-beam` — focus reads as illumination. Never remove; never color-shift it per
component. Tab order: form → transcript → results → footer; canvas non-focusable.

### 9.2 Non-negotiables (verified in the RENDERED app)

AA everywhere / AAA on primary data values (§3 ratios are the proof obligations);
glyph+word+color on every signal; aria-live announcer + `<details>` transcript kept
as the canvas's semantic spine; 44px targets; tabular numerics; reduced-motion per
§6.4; `prefers-contrast: more` bumps `--color-line` to 13% and `fg-subtle` to
`oklch(70% 0.012 90)`.

### 9.3 GPU / perf budget

One backdrop-filter (lifted pane, while open). Two fixed gradient layers + one grain
layer. Animations: transform/opacity/filter-brightness only; `will-change` only on
dies and the playhead; static SVG filters only (grain never animates). Charts stay
in their lazy route chunks (never `manualChunks` them into vendor — regression
verified by the existing grep guards). CLS: dies pre-positioned; panels never resize
on data arrival (reserve heights for streams).

---

## 10. Per-page art direction

### Analyze — "the bench" (the showpiece)

Two lighting states. **At rest (armed):** a centered command bench — kicker
("EQUITY RESEARCH PIPELINE"), display headline, the hero ticker well (§8.17 lens
pattern) with segmented mode keys and ONE key button ("Run analysis"); below it the
full pipeline canvas rendered UNLIT (idle dies, dormant edges) — the recruiter sees
the whole machine before it wakes, and the empty state IS the product diagram.
**Live:** POWER-UP fires (§6.3-1); the Trading-Floor architecture survives — canvas
as the causal spine (full-width, ~340px), organs beneath in the asymmetric bento:
AnalystTrio (3×4col) → DebateTheater (8col) + TradeRisk (4col, subgrid rows) →
DecisionReveal (12col) → CostTicker strip pinned under the canvas. Memorable moments:
the machine waking, traces crawling the graph, First Light. Quota-blocked state:
hold LED banner + the replay `key` CTA (the bench never dead-ends).

### Library — "the ledger"

PageHeader ("RESEARCH LIBRARY" / count in mono). Controls: mono ticker well +
segmented status keys. Rows (h-14, whole-row links): verdict chip (fixed 96px col) |
ticker mono 500 | conviction meter (3px track, signal fill — the row's only other
chroma) | metrics tape (mono `fg-subtle`: nodes · cost · latency) | relative time
right. Hover lift + 24ms stagger on load. The verdict chips stacking down the page
form a colored spine on an otherwise graphite ledger — that IS the composition.
**Replay theater (RunDossier):** outcome-up-front header (badge + score + "Run
ticker live" rail button), cockpit in replay, tape transport (§8.13). Memorable:
scrubbing re-lights the machine node by node.

### Market — "the observatory"

Explorer: the lens hero + mirror-binary lanes (coverage | research, split 1fr 1fr,
shared mono DNA); keyword-fallback honesty chip; coverage strip in mono. **Dossier:**
asymmetric bento — chart panel 8col×2rows (the lit specimen: candles carry the whole
page's chroma; price in `--text-5xl` mono in the header with signed change in signal
color), fundamentals tape 4col (Functional-Inversion-tinted growth/margins), news
feed 4col below. Range keys top-right of the chart panel; range switch animates
400ms `--ease-out`. Backfill empty state: §8.8 with "Analyze {ticker} to backfill".

### Eval — "the lab report"

One reading axis kept: VERDICT → EVIDENCE → RECEIPTS. VerdictBand: asymmetric bento
with the hero delta as a giant mono figure (`--text-4xl`) tinted by Functional
Inversion + arrow, breathing tile while fresh; judge tiles honest ("n/a" when
unjudged — never fake 0%). MethodologyTape: re-toned from azure to graphite — a
hairline-framed strip, mono kicker "JUDGE-PROXY · METHODOLOGY", `fg-muted` body,
beam lit-tick left (confident paper, not warning). Scatter (§8.15): quadrant tints +
the (0,0) ablation crosshair are the page's argument; RunRail = segmented keys
(?label= deep-links kept). PairTable per §8.14. Memorable: a monochrome lab sheet
where only the evidence is colored.

---

## 11. Reference `@theme` (paste-ready skeleton)

```css
@import "tailwindcss";
@import "@fontsource-variable/instrument-sans";
@import "@fontsource-variable/jetbrains-mono";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, "SF Mono", monospace;

  /* type scale: §4.3 (2xs..4xl as v2; NEW display steps) */
  --text-5xl: 3.8125rem;  --text-5xl--line-height: 3.8125rem;
  --text-6xl: 4.75rem;    --text-6xl--line-height: 4.75rem;

  /* graphite surfaces §3.1 */
  --color-bench: oklch(11% 0.006 75);
  --color-surface-1: oklch(14.5% 0.007 75);
  --color-surface-2: oklch(18% 0.008 75);
  --color-surface-3: oklch(22.5% 0.009 75);
  --color-well: oklch(9% 0.005 75);
  --color-line: oklch(96% 0.02 90 / 7%);
  --color-line-strong: oklch(96% 0.02 90 / 13%);
  --edge-light: oklch(96% 0.02 90 / 8%);

  /* text §3.2 */
  --color-fg: oklch(94.5% 0.012 90);
  --color-fg-muted: oklch(76% 0.014 90);
  --color-fg-subtle: oklch(62% 0.012 90);

  /* the beam §3.3 */
  --color-beam: oklch(97% 0.01 90);
  --color-beam-dim: oklch(97% 0.01 90 / 20%);
  --color-key-fg: oklch(14.5% 0.01 75);

  /* signals §3.4 (+ -dim alpha fills) */
  --color-bull: oklch(74% 0.16 150);         --color-bull-dim: oklch(74% 0.16 150 / 12%);
  --color-bear: oklch(72% 0.17 25);          --color-bear-dim: oklch(72% 0.17 25 / 13%);
  --color-hold: oklch(80% 0.14 80);          --color-hold-dim: oklch(80% 0.14 80 / 12%);
  --color-conservative: oklch(72% 0.09 235); --color-conservative-dim: oklch(72% 0.09 235 / 12%);
  --color-aggressive: oklch(73% 0.14 55);    --color-aggressive-dim: oklch(73% 0.14 55 / 12%);

  /* radius §5 (2xl deleted) */
  --radius-xs: 2px; --radius-sm: 4px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px;

  /* elevation §5 */
  --shadow-panel: inset 0 1px 0 0 oklch(96% 0.02 90 / 8%),
    0 1px 2px oklch(0% 0 0 / 28%), 0 10px 28px -14px oklch(0% 0 0 / 50%);
  --shadow-lifted: inset 0 1px 0 0 oklch(96% 0.02 90 / 8%),
    0 2px 4px oklch(0% 0 0 / 32%), 0 24px 56px -20px oklch(0% 0 0 / 60%);
  --shadow-well: inset 0 1px 3px oklch(0% 0 0 / 40%),
    inset 0 0 0 1px oklch(96% 0.02 90 / 7%);
  --shadow-glow-beam: 0 0 0 1px oklch(97% 0.01 90 / 30%),
    0 0 20px -4px oklch(97% 0.01 90 / 30%);
  /* + --shadow-glow-bull / -bear / -hold: same recipe, signal hue at 35/35/30% */

  /* motion §6 (springs are the literal generated strings in §6.1) */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-micro: 100ms; --duration-fast: 180ms;
  --duration-base: 280ms;  --duration-slow: 520ms;
}
```

Component utilities to (re)define in `@layer components`: `.panel`, `.panel-raised`,
`.well`, `.bench-rule`, `.kicker`, `.token-stream` (kept), `.report-prose` (kept,
re-tokened), `.grain` (kept, new filter §7). Keyframes kept/retuned: `fin-breathe`
(1→1.04), `fin-breathe-tile`, `fin-collide` (was accent-flash: 0.97→1.06→1),
`fin-signal-travel`, `fin-edge-flow`, `fin-verdict-in`, `fin-rise-in`, `fin-shimmer`,
new `fin-caret-blink`. The reduced-motion unwind block survives verbatim, extended
with the new animation classes.

---

## 12. Migration map (v2 → v3)

| v2 | v3 |
| --- | --- |
| `--color-accent` (azure) | **deleted.** Focus/caret/live → `--color-beam`; links → underline rule (§3.3); "confident info" chrome (MethodologyTape) → graphite + beam tick |
| `--color-accent-strong` / `--color-accent-fg` | deleted / `--color-key-fg` |
| `--color-glass*`, `--blur-glass*`, `.glass`, `.glass-strong` | deleted → `.panel` / `.panel-raised` (§8.2); the single blur lives only in the Lifted Pane |
| `AuroraBackground` | deleted → bench light + live emission field (§2.3) |
| `--shadow-glass` / `--shadow-raised` / `--shadow-glow-accent` | `--shadow-panel` / `--shadow-lifted` / `--shadow-glow-beam` |
| `--radius-2xl` | deleted (max `--radius-xl`) |
| Inter Variable | Instrument Sans Variable (uninstall `@fontsource-variable/inter`) |
| Button `primary/glass/outline/ghost` | `key/panel/rail/ghost` (§8.3) |
| nav active pill (fill) | nav filament (2px beam underline), same `layoutId` mechanism |
| `fin-accent-flash` | `fin-collide` (0.97→1.06→1) |
| Surfaces hue 260 / text 96%-blue | hue 75 graphite / warm ivory (§3.1–3.2) |
| Signal values | retuned per §3.4 (bear brightened to AAA; aggressive re-hued 35→55) |

Frozen through the migration: all DTO/API semantics, `analysisReducer`/`eventPlayer`
seams, node topology counts, the announcer patterns, chunking discipline, and the
`cssVar()` rgb-probe for lightweight-charts.

---

## 13. Anti-patterns — implementers must NOT

1. Reintroduce a chromatic interaction accent (azure, cyan, violet, gold). If it's
   colored, it's state; if it's interactive, it's light.
2. Use `backdrop-filter` anywhere but the Lifted Pane, or blur over data.
3. Use borders for containment/elevation. Panels are luminance + edge-light + shadow.
4. Use pure `#000`/`#fff`, or cool the surface hue back toward blue-black.
5. Aurora blobs, mesh gradients, hue-gradient text, glow on static decoration.
6. `linear` easing on transforms; springs on opacity; animation during First Light
   other than the reveal itself.
7. Opacity-pulse skeletons (shimmer only); breathing on more than one element per region.
8. Serif or a third typeface; weights ≥700 or <400; tracking on mono; proportional numerals anywhere.
9. Color-only signals (glyph + word always); persona hues on non-persona chrome.
10. Raw oklch/hex in components (tokens only); passing OKLCH tokens into
    lightweight-charts without the `cssVar()` probe.
11. Dropping the aria-live transcript, focus ring, 44px targets, or the reduced-motion
    variants — a11y regressions are design regressions.
12. A light theme, "for completeness."
13. Two `key` buttons in one view; kickers in signal colors; `--text-6xl` outside
    DecisionReveal.
14. Shipping any of this without looking at it rendered (Playwright at 1440/834/390,
    plus a forced `prefers-reduced-motion` pass and a keyboard-only pass).

---

## 14. Sourcing kit — 21st.dev (accelerant, not authority)

21st.dev is the approved component-reference library for the build phase. Status of
the access paths, verified 2026-07-03:

- **Configured MCP (`magic` in `~/.claude.json`, `@21st-dev/magic@0.0.46`):** the
  server boots and lists 4 tools, but both data tools currently fail —
  `21st_magic_component_inspiration` crashes server-side with MCP `-32602`
  ("Invalid tools/call result": upstream API returns content items missing
  `type`/`text`), and `21st_magic_component_builder` hangs >120s. **Try the MCP
  first each session** (it may be fixed upstream; the failure signature above tells
  you in one call whether it still is). Do not burn more than one probe call.
- **Web fallback (works, no auth):** every component page exposes full source in the
  `Usage.tsx` / `Component.tsx` tabs — capture via Playwright. The site's
  "Copy prompt" button is auth-gated (Clerk sign-in) — if the user is signed in, use
  it; otherwise the integration prompt template below replaces it.

### Curated map (captured from the live site — start here, don't browse blind)

| v3 component | 21st.dev reference(s) | Take / adapt |
| --- | --- | --- |
| PipelineCanvas dies & traces (§8.9) | `/@svg-ui/components/cpu-architecture` (primary — animated SVG traces feeding a CPU die: our exact metaphor); `/@aliimam/components/network-animation`, `/@xordev/components/nucleus` | Take the SVG path + trace-animation technique; REPLACE its gradient strokes with beam/phase tokens; keep xyflow as the layout engine (theirs is decorative-only) |
| The lens — AnalyzeForm / ExplorerSearch (§8.17) | `/@kokonutd/components/animated-ai-input`, `/@suraj-xd/components/claude-style-ai-input`, `/@kokonutd/components/v0-ai-chat` | Take focus/expansion ergonomics + textarea mechanics; strip their gradients/blur; re-skin as milled well + beam caret |
| Score count-up / CostTicker digits (§8.11–12) | `/@hextaui/components/animated-counter` | Reference only — we keep `useCountUp`; steal digit-roll polish if it beats rAF count-up under reduced-motion rules |
| Display text reveal (page titles) | `/@danielpetho/components/vertical-cut-reveal`, `/components/letter-swap` | Entry-only, ≤ once per page, spring tokens §6.1; never on data |
| Canvas dot grid (§2.6) | `/@magicui/components/grid-pattern` | Take the SVG pattern technique; our tokens, 3% ivory |
| Emission field look (§2.3-L2) | `/@kokonutd/components/beams-background` | LOOK reference only — theirs is an animated canvas; ours stays a static CSS radial (GPU budget §9.3) |

### Integration prompt (pre-filled replacement for their "Copy prompt")

When pulling any 21st.dev component, wrap its source in this prompt for the
implementing agent:

> You are given a reference React component from 21st.dev. Integrate its
> TECHNIQUE — not its skin — into Assay (`web/`, React 19 + Tailwind v4 +
> Motion v12). Re-tokenize completely to `web/DESIGN.md` v3 "Machined Light":
> tokens §3 only (no raw colors), type §4 (Instrument Sans / JetBrains Mono), motion
> §6 springs, One Rule §1 (chroma = state, glow = interaction, else graphite).
> Delete: gradients on chrome, backdrop-blur, borders-as-elevation, any dependency
> not already in package.json. Add reduced-motion variants per §6.4 and pass the
> anti-pattern list §13. The component must be indistinguishable from a native v3
> component when done.

Hard rule: nothing from 21st.dev lands verbatim. It is scaffolding for craft speed;
the One Rule always wins a conflict.
