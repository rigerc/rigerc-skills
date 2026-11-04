# Changelog

## 1.2.1

Validator fixes
- Keybinding duplicates no longer fold case: `g` and `G` are distinct; `Ctrl+S`/`ctrl+s` and `Shift+g`/`G` are the same binding.
- `TODO`/`TBD` placeholder detection is upper-case only, ignores code fences and spans, and is skipped for JSON (template `{{tokens}}` are still caught everywhere), so a `todo` task status or a cited `// TODO` no longer blocks `ready`.
- `user-confirmed` evidence must cite `Q-<n>` IDs that all exist in `DECISIONS.md` (previously `Q-1` matched `Q-12`). Legacy `Q1` is still read; templates and the example now use `Q-1`.
- Malformed JSON values (for example a list where an ID is expected) produce validation errors instead of a Python traceback; any unexpected exception becomes a failing report.
- `validation-report.json` is written atomically and never through a symlink; the Python validator now rejects symlinks in the feature path and symlinked input files, and `tui.mjs validate` applies the same path check as `build`.

New checks
- Nondeterministic or ambiguous transitions (same `from` + `event` with an unguarded or repeated guard) are errors.
- Warnings for declared-but-unused events, `command`/`system` events nothing handles, and node-scoped keys that shadow screen keys.
- Evidence: `observed` claims need a non-documentation source, cannot cite `docs/plans/generated/`, and need `sha256` on every source when `ready`; optional `kind` field added to the evidence schema; full-mode reconstructions need claims for `screens.*`, `machine.states.*`, `machine.transitions.*` (error when `ready`, warning when `draft`).

CLI and tooling
- Argument errors print a one-line message instead of a stack trace; free-text values beginning with `--` are accepted.
- `test` honours the `PYTHON` environment variable; removed an unused import.
- `install --minimal` omits `examples/` and `tests/`.
- `inventory` recognises more frameworks (`curses`, `tcell`, `cursive`, `FTXUI`, `notcurses`, `asciimatics`, ...), caps generic keyword scores so a framework import outranks noise, and halves the score of test files (`is_test: true`).

Docs
- Contracts reference documents key normalization, determinism rules, evidence rules and a recommended type vocabulary.

Not changed: the two validators still implement overlapping checks independently, and the JSON Schemas are documentation only (not enforced by the validator). No LICENSE file is bundled; choose one before redistributing.
