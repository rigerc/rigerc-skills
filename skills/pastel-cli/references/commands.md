# pastel command reference (v0.12.0)

Table of contents: Global options · Color argument syntax · Manipulation · Mixing & generation · Analysis & conversion · Terminal output · Misc

All commands that take `[color]...` accept colors as arguments, from stdin (one per line, when no color args are given), or `-` for a single color from stdin. The special identifier `pick` runs the external color picker. Pass `pastel <cmd> --help` for the installed version's exact text.

## Global options (go BEFORE the subcommand)

| Flag | Meaning |
|---|---|
| `-m, --color-mode <24bit\|8bit\|off\|auto>` | Terminal color mode for output (default auto-detect) |
| `-f, --force-color` | Alias for `--color-mode=24bit` (keeps ANSI colors when piped/captured) |
| `--color-picker <tool>` | Picker for `pick`: gpick, xcolor, wcolor, grabc, colorpicker, chameleon, kcolorchooser, zenity, yad, hyprpicker, gdbus |
| `-h, --help`, `-V, --version` | |

## Color argument syntax

`name` (CSS/X11, e.g. `lightslategray`), `#RRGGBB`, `RRGGBB`, `#RGB`/`RGB`, `'rgb(r, g, b)'`, `'r,g,b'`, `'hsl(h, s%, l%)'`, `'gray(x)'`. Alpha: `#RRGGBBAA`, `'rgba(r,g,b,a)'`, `'hsla(h,s%,l%,a%)'`.

## Manipulation (HSL-based)

| Command | Usage | Notes |
|---|---|---|
| `lighten` | `pastel lighten <amount> [color]...` | adds to HSL lightness; amount 0–1; negative darkens (needs `--`) |
| `darken` | `pastel darken <amount> [color]...` | subtracts from HSL lightness |
| `saturate` | `pastel saturate <amount> [color]...` | adds to HSL saturation |
| `desaturate` | `pastel desaturate <amount> [color]...` | subtracts from HSL saturation |
| `rotate` | `pastel rotate <degrees> [color]...` | hue rotation, negative allowed (needs `--`); 360 = identity |
| `complement` | `pastel complement [color]...` | hue + 180° |
| `to-gray` | `pastel to-gray [color]...` | removes saturation, preserves WCAG luminance |
| `gray` | `pastel gray <lightness>` | gray tone from lightness 0–1 (no color input) |
| `set` | `pastel set <property> <value> [color]...` | properties: `lightness, hue, chroma, lab-a, lab-b, oklab-l, oklab-a, oklab-b, red, green, blue, hsl-hue, hsl-saturation, hsl-lightness, alpha`. Gamut-clipped to sRGB. |

## Mixing & generation

| Command | Usage | Options |
|---|---|---|
| `mix` | `pastel mix [opts] <base> [color]...` | `-s/--colorspace Lab\|LCh\|RGB\|HSL\|OkLab` (default Lab); `-f/--fraction 0–1` taken from base (default 0.5). One output per extra color. |
| `gradient` | `pastel gradient [opts] <color>...` | `-n/--number N` (default 10); `-s/--colorspace` (default Lab). Two or more stops. |
| `distinct` | `pastel distinct [opts] [count] [color]...` | count default 10; `-m/--metric CIE76\|CIEDE2000` (default CIE76, CIEDE2000 slower/more accurate); `-v/--verbose` prints optimizer progress to stderr. Seed colors given after count are kept. Fine up to ~10–20 colors. |
| `random` | `pastel random [opts]` | `-n/--number N` (default 10); `-s/--strategy vivid\|rgb\|gray\|lch_hue` (default vivid) |

## Analysis & conversion

**`format`**: `pastel format [type] [color]...` (type default `hex`). Types:

- Whole-color: `hex, rgb, rgb-float, hsl, hsv, lab, lch, oklab, oklch, cmyk, name, ansi-8bit, ansi-24bit, ansi-8bit-escapecode, ansi-24bit-escapecode, ansi-8bit-value`
- Single channel: `rgb-r, rgb-g, rgb-b, hsl-hue, hsl-saturation, hsl-lightness, hsv-hue, hsv-saturation, hsv-value, lch-lightness, lch-chroma, lch-hue, oklch-lightness, oklch-chroma, oklch-hue, lab-a, lab-b, oklab-l, oklab-a, oklab-b`
- Scalars: `luminance` (WCAG relative luminance, 0–1), `brightness`

Sample outputs for `ff8000`: `hex #ff8000`, `rgb rgb(255, 128, 0)`, `hsl hsl(30, 100.0%, 50.0%)`, `lab Lab(67, 43, 74)`, `lch LCh(67, 86, 60)`, `oklch OkLCh(0.7319, 0.1858, 52.9741)`, `cmyk cmyk(0, 50, 100, 0)`, `luminance 0.367`, `brightness 0.594`, `rgb-float rgb(1.000, 0.502, 0.000)`.

**`color`**: `pastel color [color]...` terminal-oriented color report with swatch; for scripts prefer `format`.

**`textcolor`**: `pastel textcolor [color]...` black or white readable against the given color (also usable inverted).

**`colorblind`**: `pastel colorblind <prot|deuter|trit> [color]...` simulate protanopia / deuteranopia / tritanopia.

**`sort-by`**: `pastel sort-by [opts] [brightness|luminance|hue|chroma|random] [color]...` (default hue); `-r/--reverse`, `-u/--unique` (dedupe by RGB).

**`list`**: `pastel list [-s brightness|luminance|hue|chroma|random]` all named colors (default sorted by hue); one name per line when piped.

## Terminal output

**`paint`**: `pastel paint [opts] <fg-color> [text]...`

`-o/--on <bg>`, `-b/--bold`, `-i/--italic`, `-u/--underline`, `-n/--no-newline`. If no text args, reads text from stdin. Use `-` as the color to read it from stdin. Emits ANSI escapes only when stdout is a terminal or `-f`/`-m 24bit` is given.

**`colorcheck`**: `pastel colorcheck` shows 8-bit and 24-bit test patterns to see what the terminal supports.

## Misc

**`pick`**: `pastel pick [count]` interactive screen picker (default 1). Requires an external tool (see `--color-picker`) and a display.

**`help`**: `pastel help <subcommand>` ≡ `pastel <subcommand> -h`.

## Source & docs

https://github.com/sharkdp/pastel (README, CHANGELOG, MIT/Apache-2.0).
