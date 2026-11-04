# Common color guidelines (with the pastel command for each)

Optional design reference. Read it when the user is choosing, building, or reviewing colors for UI, theming, charts, branding, documents, or terminal output, or when accessibility comes up. Don't apply it to plain conversion or manipulation requests. The thresholds below are WCAG 2.x (the standard most teams and laws reference). Rules of thumb are labelled as such.

Contents: 0 Process · 1 Contrast · 2 Don't rely on color alone · 3 Palette structure · 4 Building scales · 5 Neutrals · 6 Dark mode · 7 Semantic colors · 8 Mixing and gradients · 9 Data visualization · 10 Interactive states · 11 Terminal colors · 12 Review checklist

## 0. Process: audit, strategy, roles, apply, verify

Use this when the task is "add color to", "improve", "rebrand" or "build a palette for" something. (Adapted from the colorize guidance in pbakaus/impeccable.)

**Principle:** color carries hierarchy, meaning and atmosphere. Decoration with no link to hierarchy, state, content or the product's identity is not a color strategy. Preserve confirmed brand and semantic colors; "colorizing" is not a license to replace the visual identity.

**Match the intensity to the visitor's job.**
- *Persuade / experience* (landing pages, marketing, editorial, games): color may carry the voice and own large regions.
- *Operate / read* (dashboards, tools, docs, forms): color mainly encodes action, selection, status, wayfinding and reading hierarchy. Rarity is what gives an accent its force.

**Step 1: Audit before choosing.** Look at the existing tokens, themes, assets and key states, and note:
- which colors are confirmed brand commitments (keep these);
- the current surface, text, action and semantic roles;
- where grayscale hides hierarchy or state;
- contrast failures and color-only communication;
- light/dark and data-visualization needs;
- whether the user wants *more color* or a *new identity*. Only ask a question when a binding brand decision can't be inferred from what's there.

**Step 2: Choose a strategy, in words, before editing.** State the emotional temperature, the dominant color relationship, the contrast range and the color dosage (restrained or immersive). The strategy follows the brief, not a fixed percentage rule.

**Step 3: Build roles, not a bag of swatches.** Define each of:
- canvas and elevated surfaces
- primary and secondary text
- action, focus and selection
- borders and separators
- success, warning, error, info
- data categories or scales, if charts exist

If the project has tokens, define primitive values (`blue-600`) and semantic tokens (`action`, `text-secondary`) so a theme change remaps roles and nothing else. Use the project's existing color space; for a new web palette prefer OKLCH, where lightness and chroma adjust predictably. Pick hues from product meaning and visual direction, never from a default category association ("finance = blue", "eco = green").

**Step 4: Apply at system scale.**
- Let the strongest color own a deliberate region or role; don't scatter tiny accents everywhere.
- Keep the primary action easy to find; don't spend its color on decoration.
- Check that attention lands on the intended action, content or state.

**Step 5: Verify** (also see the checklist in section 12): every color has a stable role; the palette holds up in quiet, dense, interactive, error and empty states; light and dark are each composed on purpose; contrast and non-color cues pass in every state; the result still looks like *this* product rather than a generic "colorful" treatment.

## 1. Contrast

| Element | Minimum ratio (WCAG AA) | Enhanced (AAA) |
|---|---|---|
| Body text | 4.5 : 1 | 7 : 1 |
| Large text (≥ 24px, or ≥ 18.66px bold) | 3 : 1 | 4.5 : 1 |
| UI components & graphics needed to understand content (borders of inputs, icons, chart marks, focus rings) | 3 : 1 against adjacent colors | n/a |

- Placeholder text, helper text and text over images or gradients count too; test the worst spot, not the average.
- Disabled controls and pure decoration are exempt from the minimum, but don't make them invisible.
- Semi-transparent text or overlays: contrast then depends on whatever sits underneath. Prefer explicit opaque colors over chains of translucent layers; if alpha is unavoidable, compute the resulting color over the real background and test that (e.g. flatten black at 60% on white with `pastel mix -s RGB -f 0.6 black white`, which gives `#666666`).
- Check more than the default state: hover/active/focus, disabled, overlays, text on images, error/empty states, and both themes.
- Check with `scripts/contrast.sh <fg> <bg>` (path relative to this skill). It uses pastel's WCAG relative luminance.
- Fix a failing pair by moving lightness only, which keeps the hue: `pastel darken 0.02 <fg>` (or `lighten` on dark backgrounds) in a loop until it passes (see the recipe in SKILL.md).
- Mid-tones are the hardest: no single text color works well on every mid-tone background; pick black or white per background with `pastel textcolor <bg>`, then still verify the ratio.

## 2. Don't rely on color alone

- Roughly 1 in 12 men and 1 in 200 women have a color vision deficiency; red/green confusion is the most common.
- Never encode meaning (error, status, chart series, required fields) by hue alone. Add an icon, text label, pattern, position or line style.
- Simulate: `pastel colorblind prot|deuter|trit <colors>`; if two meaningful colors collapse to near-identical output, change their lightness, not just their hue.
- Grayscale test (also covers print and low-contrast screens): `pastel to-gray <colors> | pastel format hex`. If two colors that must differ become the same gray, separate them by lightness.

## 3. Palette structure

- Start from **one primary (brand) hue + a neutral ramp + a small set of semantic colors** (success, warning, danger, info). Add a secondary accent only if there is a clear job for it.
- "60-30-10" (dominant/secondary/accent) is only a starting heuristic. The right dosage comes from the brief and the visitor's job (see section 0): a tool UI may be 95% neutral with a rare accent, while a marketing page may let one color own whole sections. Don't force a ratio.
- Keep the number of distinct hues low (about 3–5 in a product UI). More hues means more contrast pairs to verify and less clarity about what's important.
- Reserve your most saturated color for the single most important action on a screen.
- Derive related colors from the base with pastel rather than eyeballing: `pastel rotate 30|-30 <base>` (analogous), `pastel rotate 120|240 <base>` (triadic), `pastel complement <base>`. Rotation is in HSL, so also check that the results have comparable *perceived* lightness (see 4).

## 4. Building scales (tints and shades)

- Use 9–11 steps (e.g. 50, 100 … 900, 950). Lightness should step evenly in a perceptual space, not in raw RGB or HSL.
- Generate in OkLab or LCh: `pastel gradient -n 11 -s OkLab white <base> black | pastel format hex`. Check evenness: `pastel format lch-lightness <steps>` should decrease by roughly constant amounts.
- **HSL lightness is not perceptual.** Yellow at HSL 50% looks far lighter than blue at HSL 50%. To compare or equalize hues, use LCh lightness or luminance:
  `pastel set lightness 60 <color> | pastel format hex` for each hue gives a set of similar visual weight (results are clipped to sRGB, so readbacks differ a little for vivid colors; `lch(L, C, h)` is also accepted as input).
- Document which steps are safe: e.g. "step 600+ passes AA on white; step 300− passes AA on step 900". Verify each claim with `scripts/contrast.sh` instead of assuming.
- **Reduce chroma near white and black.** Don't hold high chroma at extreme lightness just to make the math uniform; it looks garish and often falls outside sRGB. An OkLab gradient `white → base → black` does this naturally. Verify: `pastel gradient -n 9 -s OkLab white "#3b82f6" black | pastel format oklch-chroma` goes about 0 → 0.19 → 0, and `oklch-lightness` goes 1.0 → 0.0.
- pastel can read and write OKLCH: `pastel format oklch <c>` and `pastel format hex "oklch(0.7 0.15 250)"` (decimal L in 0–1; the percent form is not accepted).

## 5. Neutrals

- Tint neutrals only when the brand hue genuinely creates cohesion; plain neutral gray is valid when it suits the product. When you do tint:
  `pastel set hsl-saturation 0.08 <brand> | pastel set hsl-lightness 0.97 | pastel format hex` (surface),
  and use `hsl-lightness 0.10` instead of `0.97` for the dark text color. For "#3b82f6" these yield roughly `#f7f7f8` (surface) and `#17191c` (text).
- Rule of thumb: avoid pure `#000` text on pure `#fff` for long reading; a near-black on an off-white is easier on the eyes. Accessibility-wise pure black on white is fine, so don't change an existing design just for this.
- **Secondary text on any surface (including colored ones): derive it from the surface instead of using generic gray.** Mix the readable foreground toward the surface in OkLab and keep the lightest step that still passes 4.5 : 1:
  ```bash
  surf="#1e3a8a"; fg=$(pastel textcolor "$surf" | pastel format hex); sec=$fg
  for f in 0.9 0.8 0.7 0.6 0.5; do
    c=$(pastel mix -s OkLab -f $f "$fg" "$surf" | pastel format hex)   # -f = share of the first color
    scripts/contrast.sh "$c" "$surf" | grep -q 'normal text (4.5): pass' && sec=$c || break
  done; echo "$sec"      # e.g. #9eaed2 on #1e3a8a (4.67:1); #47453f on #fdf6e3 (8.85:1)
  ```
  The result carries the surface's hue, so it looks intentional rather than washed out.
- Build 3 background levels, 2–3 border levels and 2–3 text levels from the neutral ramp; check every text level against every background it appears on.

## 6. Dark mode

- Don't just invert. Use very dark gray surfaces (rule of thumb: LCh lightness ~10–15), not `#000`, and raise surfaces **lighter** as they elevate (cards lighter than page).
- Saturated colors vibrate on dark backgrounds: lighten and slightly desaturate accents: `pastel desaturate 0.15 <accent> | pastel lighten 0.15 | pastel format hex` (e.g. `#3b82f6` → `#8eb3f0`).
- Re-run every contrast check; a pair that passes in light mode may fail in dark mode.
- Text: use a slightly dimmed white (not pure `#fff`) for large reading areas to limit glare.
- Design surface elevation and contrast explicitly for each theme; never mechanically invert the light one.
- Provide both themes from the same hue family so the brand stays recognizable, and remap *semantic tokens* between themes rather than editing components.

## 7. Semantic colors

- Keep each semantic meaning consistent across the product, but respect platform and domain conventions instead of assuming fixed hues. Common defaults: red = error/destructive, amber/orange = warning, green = success, blue = info. These are widely understood in Western contexts but not universal (finance, medical and regional conventions differ); always pair with icon and text.
- Red vs green is the classic colorblind trap. Make them differ in lightness too, and use icons (✓ / ✕ / !).
- Give each semantic color a background tint, a border, a text/icon color and a solid fill, and verify the text-on-tint pairs (e.g. dark red text on pale red background ≥ 4.5 : 1).
- Don't reuse the brand hue for errors; if the brand is red, use another cue (icon, position, wording) for error states.

## 8. Mixing and gradients

- Choose the interpolation space deliberately:
  - `RGB`: matches CSS/graphics default but passes through muddy midpoints. `pastel mix -s RGB blue yellow` → `#808080` (flat gray).
  - `OkLab` / `Lab`: perceptually even, keeps lightness steady. `pastel mix -s OkLab blue yellow` → `#6cacc7`.
  - `LCh` / `HSL`: go around the hue wheel, which gives vivid rainbows but can pick up unexpected hues.
- For smooth UI gradients between two hues, prefer OkLab and put a stop at the midpoint if the endpoints are far apart.
- Keep text over gradients legible at *every* point (see 1).

## 9. Data visualization

- **Categorical** (unordered groups): ≤ 6–8 hues; more than that is hard to tell apart and to match to a legend. Generate with `pastel distinct N`, then colorblind-test (2) and consider direct labels instead of a legend.
- **Sequential** (low → high): one hue, varying lightness: `pastel gradient -n 7 -s OkLab <light> <dark>`. Lightness must be monotonic: confirm with `pastel format lch-lightness`.
- **Diverging** (negative ↔ positive around a midpoint): two hues meeting at a light neutral: `pastel gradient -n 9 -s OkLab <hue-a> <neutral> <hue-b>`.
- Don't make color the only code: differentiate by lightness, chroma, shape, label or pattern too.
- Use saturated color for the data you want read, gray for context.
- Colors that must survive print/grayscale need distinct lightness (grayscale test in 2).
- Chart marks and lines need ≥ 3 : 1 against the background.

## 10. Interactive states

- Hover/active: shift lightness by roughly 5–10% in a consistent direction: `pastel darken 0.08 <base>`; keep the shift direction the same across the product.
- Focus: a clearly visible outline with ≥ 3 : 1 contrast against both the element and the surrounding background; don't communicate focus by a subtle color change alone.
- Disabled: lower contrast is acceptable but keep it distinguishable from enabled.
- Link color vs surrounding text needs ≥ 3 : 1 *and* an additional cue (underline) if the link is not otherwise distinguishable.
- After changing a base color, recompute the hover/active/disabled variants so they remain derived from it.

## 11. Terminal colors

- Don't assume 24-bit color: check `pastel colorcheck` in the target terminal; fall back to 8-bit or no color (`pastel -m 8bit`, `-m off`).
- Users have light and dark terminal themes; hard-coded foregrounds can become unreadable. For text on colored badges set **both** foreground and background: `pastel paint "$(pastel textcolor "$bg")" --on "$bg" " WARN "`.
- Don't encode status by color alone in logs; keep the words (ERROR, WARN, OK).
- Make color optional: allow disabling it (e.g. honoring a `--no-color` flag or `NO_COLOR` env var in scripts you write).

## 12. Review checklist before delivering a palette

0. Every color has a stable role (or a deliberate atmospheric purpose); brand and semantic commitments were preserved; attention lands on the main action.
1. Every text/background pair that will appear: ratio ≥ 4.5 (3 for large text) with `scripts/contrast.sh`.
2. Non-text UI (borders, icons, focus, chart marks): ≥ 3 : 1.
3. Meaning never depends on hue alone; colorblind and grayscale checks done.
4. Scale steps are evenly spaced in lightness; unsafe steps documented.
5. Dark-mode variants re-verified, not inverted; works in quiet, dense, interactive, error and empty states.
6. Primitives and semantic tokens defined if the project uses tokens.
7. Hex values given in a copy-pasteable block, with the base color and color space used stated.
