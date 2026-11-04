# Update or rescan TUI contracts

Use `tui-screen-flow-spec` to update `docs/plans/generated/tui/[INSERT FEATURE SLUG]/` in this repository for **[INSERT CHANGE OR CODE REVISION]**.

1. Read the existing manifest, decision log, canonical JSON, and evidence (if any). Locate source files referenced by provenance.
2. Inspect changes to application code and tests read-only if source_mode is `existing-app`; identify changed, removed, and newly observed interfaces. Never execute project code without consent.
3. Ask the user only about newly material unknowns or breaking contract decisions. Do not silently repurpose stable IDs; do not overwrite source evidence with guesses.
4. Update `CONTRACTS.md` and `contracts.json`, plus screen trees, machine, flows, decisions, and evidence where applicable. Record breaking changes and assumptions. Keep `draft` until blockers are closed.
5. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`; resolve consistency errors, reopen the interactive viewer, and summarize what changed.

Never move generated artifacts outside the existing feature folder.
