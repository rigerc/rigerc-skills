---
name: pastel-cli
description: Use the `pastel` command-line tool (sharkdp/pastel) to generate, convert, analyze and manipulate colors. Use this skill whenever the user wants to convert colors between formats (hex, rgb, hsl, hsv, Lab, LCh, OkLab, OkLCh, CMYK, ANSI), lighten/darken/saturate/rotate a color, mix colors or build gradients, generate palettes, shades or visually distinct colors, pick readable text colors, check WCAG contrast, simulate colorblindness, name or sort colors, or print colored terminal text, even if they never mention "pastel". Also use it when the user mentions pastel, pastel-cli or color pipelines in a shell, or when exact color math is needed instead of guessing hex values. For palette, theme, dark-mode or accessibility design questions, it also provides optional design guidelines backed by pastel commands.
compatibility: Requires the `pastel` binary (v0.12.0 tested). `pastel pick` additionally needs a GUI color picker and a display, so it won't work in headless sandboxes.
---

# pastel-cli

`pastel` is a Rust CLI for color work. Use it instead of computing color math by hand: it does conversions in proper color spaces (Lab, LCh, OkLab) and gives reproducible results.

## 1. Make sure it's installed

```bash
command -v pastel || echo missing
```

If missing, try in this order:

```bash
# Prebuilt binary (works in sandboxes that allow github.com; tested with v0.12.0)
cd /tmp && curl -sL -o pastel.tgz \
  https://github.com/sharkdp/pastel/releases/download/v0.12.0/pastel-v0.12.0-x86_64-unknown-linux-musl.tar.gz \
  && tar xzf pastel.tgz && install -m755 "$(find . -name pastel -type f | head -1)" /usr/local/bin/pastel

# Or package managers
brew install pastel          # macOS
sudo apt install pastel      # Debian/Ubuntu (may be an older version)
cargo install pastel         # from source (Rust 1.83+)
scoop install pastel         # Windows (also: winget install sharkdp.pastel)
```

If `/usr/local/bin` isn't writable, install to `~/.local/bin` or just call the binary by path. Other architectures: see the releases page at https://github.com/sharkdp/pastel/releases.

## 2. The mental model (read this, it prevents most mistakes)

**Input.** Every color-taking command accepts colors as arguments *or* on stdin (one per line). `-` means "read one color from stdin" in a specific argument slot. Accepted syntaxes:

```
lightslategray   '#778899'   778899   789   'rgb(119,136,153)'   '119,136,153'
'hsl(210,14.3%,53.3%)'   '#77889980'   'rgba(119,136,153,0.5)'   'hsla(210,14.3%,53.3%,50%)'   'gray(0.5)'
```

Quote anything with `#`, spaces or parentheses so the shell leaves it alone.

**Output when not on a TTY is `hsl(...)` text, not hex.** Commands like `lighten`, `mix`, `rotate`, `textcolor` print a color; when their output is piped or captured (always the case in a sandbox), that color is printed as an `hsl(h,s%,l%)` string. That is fine for chaining into another `pastel` command, but **always end a pipeline with `pastel format <type>`** when you need a usable value:

```bash
pastel lighten 0.1 orchid | pastel format hex      # -> #d58ad1-style hex, not hsl text
```

**Chaining.** Commands compose through pipes, which is the main way to build anything non-trivial:

```bash
pastel random | pastel mix red | pastel lighten 0.2 | pastel format hex
```

**Multiple colors in = multiple colors out**, one per line, in order. So `pastel lighten 0.2 a b c` and `printf '%s\n' a b c | pastel lighten 0.2` are equivalent.

**Exit codes.** An unparseable color prints `[pastel error]: Could not parse color '...'` to stderr and exits 1. Check `$?` in scripts.

## 3. Task → command

| The user wants… | Use |
|---|---|
| Convert to hex / rgb / hsl / hsv / lab / lch / oklab / oklch / cmyk | `pastel format <type> <color>...` (default type is `hex`) |
| One channel only (e.g. HSL hue, luminance, red byte) | `pastel format hsl-hue\|lch-chroma\|rgb-r\|luminance\|brightness ...` |
| Nearest CSS/X11 color name | `pastel format name <color>` (nearest match, not exact) |
| Lighter / darker (HSL lightness, 0–1) | `pastel lighten 0.1 c` / `pastel darken 0.1 c` |
| More / less saturated (HSL, 0–1) | `pastel saturate 0.2 c` / `pastel desaturate 0.2 c`, `pastel to-gray c` |
| Hue shift, complement | `pastel rotate 30 c` (degrees, may be negative), `pastel complement c` |
| Set an exact property | `pastel set <property> <value> c` (see gotchas for units) |
| Mix two colors | `pastel mix -f 0.3 base other` (`-s` colorspace, default Lab) |
| Gradient / color scale | `pastel gradient -n 9 -s OkLab c1 c2 [c3...]` |
| Readable text for a background | `pastel textcolor <bg>` → black or white |
| WCAG contrast ratio | `scripts/contrast.sh <c1> <c2>` (bundled; pastel has no built-in contrast command) |
| N visually distinct colors | `pastel distinct N [seed colors...]` |
| Random colors | `pastel random -n 10 -s vivid\|rgb\|gray\|lch_hue` |
| Gray from lightness | `pastel gray 0.5` |
| Sort colors | `pastel sort-by hue\|luminance\|brightness\|chroma\|random [-r] [-u]` |
| Colorblind simulation | `pastel colorblind prot\|deuter\|trit <color>...` |
| All named colors | `pastel list [-s hue\|luminance\|...]` |
| Colored terminal text | `pastel paint <fg> [--on <bg>] [-b -i -u -n] "text"` |
| Human-readable color report | `pastel color <color>...` (designed for a terminal; for data use `format`) |
| Interactive screen picker | `pastel pick` (needs GUI + external picker tool; unavailable headless) |

Full flag details for every subcommand (read when you need an option or type not shown here): `references/commands.md`. Use `pastel <cmd> --help` for the authoritative text for the installed version.

## 4. Gotchas

- **Negative numbers need `--`.** `pastel lighten -0.1 red` fails (the parser sees a flag). Write `pastel lighten -- -0.1 red`. Often simpler: use `darken 0.1` instead of `lighten -0.1`.
- **Which color space an operation uses matters.**
  - `lighten`, `darken`, `saturate`, `desaturate`, `rotate`, `complement`: **HSL** (amount 0–1, hue in degrees).
  - `mix`, `gradient`: **Lab** by default. Prefer `-s OkLab` or `-s LCh` for smoother perceptual results; `-s RGB` reproduces what CSS/graphics tools usually do.
  - `set`: property decides the space. `lightness`, `hue`, `chroma` are CIELCh (lightness 0–100, hue in degrees, chroma ≈ 0–130); `oklab-l` is 0–1; `red/green/blue` are 0–255; `hsl-*` follow HSL; `alpha` is 0–1. Results are clipped to the sRGB gamut, so reading the property back can differ from what you set (e.g. `set hue 120` on red reads back as LCh hue ≈131, `set lightness 50` as ≈50.9), especially for high-chroma colors. Check with `pastel format lch-hue` / `lch-lightness` etc. when precision matters.
- **`mix base other...`** mixes `base` with *each* following color separately and prints one result per color; it does not blend all of them together. For a multi-stop blend use `gradient`. `-f` is the fraction taken from the base color (default 0.5).
- **`textcolor` only returns black or white** (as `hsl` text, so pipe to `format hex`). It also works in reverse to pick a background for a given text color.
- **`paint` drops its colors when stdout isn't a TTY** and prints plain text. Force escape codes with `pastel -m 24bit paint ...` (or `-f`). The global options `-m/--color-mode` (`24bit`, `8bit`, `off`, auto) and `-f` go *before* the subcommand.
- **`format ansi-*-escapecode`** emits raw escape bytes, and `ansi-8bit`/`ansi-24bit` emit the literal escape-sequence text. Only use these when the user asks for ANSI output.
- **`format name` is a nearest-neighbour lookup** over the CSS/X11 names; say "closest named color" when reporting it.
- **`distinct`** is stochastic (simulated annealing) and gets slow/unstable beyond ~20 colors; `-m CIEDE2000` is more accurate but slower. Pass seed colors after the count to keep them in the set. Results differ run to run, so save the output if it must be reproducible. `random` is likewise non-deterministic.
- **Alpha** is parsed (`#rrggbbaa`, `rgba()`, `hsla()`) and survives `format hex` (as 8 digits) but most manipulations ignore it. Strip or re-add it with `set alpha` when needed.
- **Don't invent subcommands.** pastel has no `contrast`, `harmony`, `palette`, `shade` or `tint` commands; build those from the recipes below.

## 5. Color design guidance (optional, only when the task is about design choices)

Most requests are plain tool use (convert, adjust, mix, generate, check). Just do them and don't add design opinions.

Read `references/color-guidelines.md` only when the user is *deciding* something about color: building or reviewing a palette or theme, dark mode, accessibility or contrast compliance, chart colors, or "which color should I use". It covers a process (audit, strategy, roles, verify), WCAG thresholds, scales, neutrals, dark mode, semantic colors, gradients, data viz and terminal colors, each with the pastel command to apply it. The two rules worth remembering even without reading it:

- Verify contrast with `scripts/contrast.sh` instead of judging by eye (body text 4.5:1, large text and UI parts 3:1).
- Don't let color alone carry meaning; check with `pastel colorblind` and `pastel to-gray`.

If the user's request conflicts with a guideline, do what they asked where it's their call, mention which guideline is affected, and offer the nearest compliant alternative computed with pastel.

## 6. Recipes

**Convert a color to everything a dev might want**
```bash
c="#ff8000"
for t in hex rgb hsl hsv lab lch oklch cmyk name; do printf '%-6s %s\n' "$t" "$(pastel format $t "$c")"; done
```

**Tints and shades (10 steps from white → color → black)**
```bash
pastel gradient -n 5 -s OkLab white "#3b82f6" | pastel format hex
pastel gradient -n 5 -s OkLab "#3b82f6" black | pastel format hex
# Or a full scale in one call (white, base, black):
pastel gradient -n 11 -s OkLab white "#3b82f6" black | pastel format hex
```

**Color-harmony palettes from a base (HSL rotation)**
```bash
b="#3b82f6"
echo "complementary: $(pastel complement $b | pastel format hex)"
for d in 120 240;  do echo "triadic $d:    $(pastel rotate $d $b | pastel format hex)"; done
for d in -30 30;   do echo "analogous $d:  $(pastel rotate -- $d $b | pastel format hex)"; done
for d in 150 210;  do echo "split-comp $d:  $(pastel rotate $d $b | pastel format hex)"; done
```

**Readable text over a set of backgrounds**
```bash
for bg in "#1e293b" "#fde68a" hotpink; do
  fg=$(pastel textcolor "$bg" | pastel format hex)
  echo "$bg -> text $fg  ($(scripts/contrast.sh "$fg" "$bg" | head -1))"
done
```

**Check contrast and fix it by darkening until AA passes**
```bash
fg="#6b7bff"; bg="#ffffff"
while ! scripts/contrast.sh "$fg" "$bg" | grep -q 'normal text (4.5): pass'; do
  fg=$(pastel darken 0.02 "$fg" | pastel format hex)
done; echo "$fg"
```
(`scripts/contrast.sh` is relative to this skill's directory; use its full path when calling from elsewhere.)

**Ensure a categorical palette is colorblind-safe-ish**
```bash
pastel distinct 6 | tee /tmp/p.txt | pastel format hex
for t in prot deuter trit; do echo "-- $t"; pastel colorblind $t < /tmp/p.txt | pastel format hex; done
```
Compare the simulated results; colors that collapse to near-identical values are risky. Mention that this is a simulation, not a substitute for testing with users.

**Sort a palette by hue and dedupe**
```bash
printf '%s\n' "#ff0000" "#00ff00" "#0000ff" "#ff0000" | pastel sort-by hue -u | pastel format hex
```

**Emit CSS custom properties**
```bash
i=1; pastel gradient -n 5 -s OkLab "#e0f2fe" "#0c4a6e" | pastel format hex | while read -r h; do
  echo "  --brand-$((i*100)): $h;"; i=$((i+1))
done
```

**Colored terminal output in a script**
```bash
bg=hotpink; fg=$(pastel textcolor "$bg")
pastel paint "$fg" --on "$bg" "well readable text"
pastel paint -n black --on red --bold "  ERROR  "; echo " something broke"
```
When stdout is captured (not a terminal), add `-m 24bit` before `paint` if the user actually wants escape codes.

## 7. How to report results

- Show the exact commands you ran and the resulting values, in the format the user asked for (hex unless told otherwise).
- When producing a palette for a design/theme, give hex values in a copy-pasteable block, and, if swatches would help, offer to render them (for example as an HTML or SVG preview) rather than describing colors in words.
- If you can't run `pastel` (not installed, no network), say so, then either give the commands for the user to run or compute with another method and label it as such. Don't pretend pastel produced numbers it didn't.
- State assumptions about color space when it affects the answer (e.g. "mixed in OkLab; RGB mixing would give a muddier midpoint").
