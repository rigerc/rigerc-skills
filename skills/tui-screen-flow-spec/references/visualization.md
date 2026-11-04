# Offline contract viewer and automation

`node scripts/generate-html.mjs --repo-root <root> --feature <slug>` reads `manifest.json` and `contracts.json` (required), plus optional `screens.json`, `machine.json`, `evidence.json`, and `validation-report.json`. It produces `contracts-viewer.html` in that feature's fixed output directory.

`node scripts/tui.mjs build --repo-root <root> --feature <slug>` first runs the bundled Python validator with `--write-report`, then renders the viewer. It renders draft/invalid artifacts too, for inspection; add `--strict` for CI enforcement. `--all` iterates feature folders; `watch --all` checks canonical JSON for changes roughly once per second, rerunning validation and rendering. No application source is executed by these tools.

Interactive viewer areas: overview, screens with expandable nested layouts/focus/keybindings, flows with clickable state graph/transition details, UI components, state fields/invariants, events, commands, data, validation rules, source evidence. Search filters by content, references link among categories, theme toggle, copy JSON, and export embedded JSON. Viewer HTML is static and fully self-contained (no CDNs, fonts or network fetches).

The viewer is **documentation**, not an executable TUI prototype or simulator. Source evidence includes paths/line numbers but cannot fetch application source. Missing optional screen/flow files are supported in contracts-only mode. JSON string payloads are script-safe escaped and rendered via text nodes; never change implementation to insert raw source strings into `innerHTML`.

Scaffolding is a **draft automation only**: ask the user material questions before creating feature output files. `scaffold` does not extract contracts or answer open questions and must not be treated as design completion. The agent must replace placeholders, maintain `manifest.files`, synchronize Markdown, and respect readiness/provenance requirements. The generator adds the output HTML to `manifest.files` if absent.

Output path is rigidly fixed under `<repo-root>/docs/plans/generated/tui/<slug>/`. The CLI accepts only a basename for the HTML output, never an arbitrary path. This prevents easy accidental output outside the repository's generated design tree.
