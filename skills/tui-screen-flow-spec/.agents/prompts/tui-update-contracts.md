# Update or rescan TUI contracts

Use `tui-screen-flow-spec` to update `docs/plans/generated/tui/[INSERT FEATURE SLUG]/` in this repository for **[INSERT CHANGE OR CODE REVISION]**.

1. Read the existing manifest, decision log, canonical JSON, and evidence (if any). Locate source files referenced by provenance. Inspect changed application code and tests read-only for existing-app work; never run project code without consent.
2. **When new material choices are unresolved, ask structured questions first** about change scope, compatibility and behavior (options plus Other/unsure; skip settled facts). Do not modify artifacts. For Go targets, distinguish Bubble Tea v1/v2 and TUIWeave before proposing component changes.
3. **After initial answers**, show a provisional change plan (v0) with affected contracts/IDs, observed source changes, proposed changes, and potential breakage. Continue interviewing about remaining material unknowns; after subsequent replies present revised plans (v1, v2, …) and deltas. Do not silently repurpose stable IDs or substitute assumptions for source evidence.
4. Ask me to **approve the final change plan**. Repeat step 3 if I request edits. Do not update generated files before I explicitly approve and material blockers are resolved/delegated.
5. Update `CONTRACTS.md` and `contracts.json`, plus screen trees, machine, flows, decisions, and evidence where applicable. Record plan review, approval, breaking changes and assumptions in `DECISIONS.md`. Keep `draft` until blockers are closed.
6. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`; resolve consistency errors, reopen the interactive viewer, and summarize what changed.

Never move generated artifacts outside the existing feature folder.
