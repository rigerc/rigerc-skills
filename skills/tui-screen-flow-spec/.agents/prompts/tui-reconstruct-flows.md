# Reconstruct existing TUI screens and state transitions

Use `tui-screen-flow-spec` for the existing application **[INSERT APPLICATION OR FEATURE]** with mode `existing-full`.

Inspect code and tests read-only, trace screens, component trees, keyboard/focus behavior, event dispatch, state transitions, IO effects, failure paths and restart paths. Distinguish reliable code evidence from inferred state boundaries; ask the user about every material ambiguity before creating files. If runtime observation is necessary, request permission rather than executing project code silently.

After clarification, scaffold with `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode existing-full`. Author complete `screens.json`, `machine.json`, `contracts.json` and source evidence in `evidence.json`, as well as matching Markdown specs/flows/contracts/decisions. Preserve stable IDs and accurately label reconstructed versus observed information. Keep inferred behavior in draft.

Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict` and review the resulting `contracts-viewer.html` state diagram and screen trees. Keep all generated artifacts inside `docs/plans/generated/tui/<slug>/` at the repository root.
