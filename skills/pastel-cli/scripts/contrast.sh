#!/usr/bin/env bash
# WCAG 2.x contrast ratio between two colors, using pastel for parsing + luminance.
# Usage: contrast.sh <fg> <bg>      e.g. contrast.sh "#767676" white
# Prints the ratio and AA/AAA verdicts. Requires: pastel, awk.
set -euo pipefail
[ $# -eq 2 ] || { echo "usage: $0 <color1> <color2>" >&2; exit 2; }
l1=$(pastel format luminance "$1")
l2=$(pastel format luminance "$2")
awk -v a="$l1" -v b="$l2" 'BEGIN {
  hi = (a > b) ? a : b; lo = (a > b) ? b : a;
  r = (hi + 0.05) / (lo + 0.05);
  printf "contrast %.2f:1\n", r;
  printf "AA  normal text (4.5): %s\n", (r >= 4.5) ? "pass" : "fail";
  printf "AA  large text  (3.0): %s\n", (r >= 3.0) ? "pass" : "fail";
  printf "AAA normal text (7.0): %s\n", (r >= 7.0) ? "pass" : "fail";
}'
