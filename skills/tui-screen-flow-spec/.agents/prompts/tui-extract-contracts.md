# Extract contracts from an existing TUI

Use the `tui-screen-flow-spec` skill to describe **observed current implementation behavior** of **[INSERT APP/SURFACE]**.

1. Identify repository root. Optionally run `node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>` for read-only candidate source locations (not implementation evidence). Inspect application code **read-only**: entrypoints, rendering, views, focus and shortcuts, handlers, state, IO, data, validation and tests. Never run untrusted project code without my permission.
2. Build an evidence inventory with repository-relative paths and precise line ranges. Separate observed code from test assertions, documentation, inferences, and proposals.
3. Ask me every material unresolved question **after inspection and before writing artifacts**, especially boundaries, dynamic or plugin behavior, and desired scope. Do not invent an implementation.
4. Create `contracts-only` via `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode existing` after questions are resolved.
5. Author UI/state/events/commands/data/validation `contracts.json`, human contract documentation, evidence.json and EVIDENCE.md. Ensure evidence covers each material entity; mark inferred/proposed behavior and readiness appropriately.
6. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`. Inspect any drift or missing provenance errors; repair them or leave draft with explicitly noted open questions.

Do not generate screen trees or state machines unless I request full reconstruction. Store artifacts ONLY under `<repo-root>/docs/plans/generated/tui/<slug>/`.
