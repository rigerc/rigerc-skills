# Design TUI screens and flows (greenfield)

Use the `tui-screen-flow-spec` skill for this feature: **[INSERT FEATURE BRIEF]**.

1. Resolve the Git repository root (or ask me for it) and read `SKILL.md` plus `references/elicitation.md`.
2. Identify all material missing product rules, data constraints, navigation expectations, error handling, and terminal-size behavior. **Ask me open questions before producing any design artifacts.** Use the agent's structured question tool if available. Never assume I approved defaults.
3. After clarification, choose a stable feature slug. Scaffold with `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode greenfield`.
4. Replace every placeholder and generate structured screen trees, full event-driven state machines, and UI/state/events/commands/data/validation contracts. Keep JSON authoritative and Markdown synchronized.
5. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`, fix errors, and confirm `contracts-viewer.html` renders.
6. Report actual generated files, decisions and validation result; do not claim that any TUI application was implemented.

All generated files MUST be inside `<repo-root>/docs/plans/generated/tui/<slug>/`.
