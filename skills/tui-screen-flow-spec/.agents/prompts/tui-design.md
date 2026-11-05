# Design TUI screens and flows (greenfield)

Use the `tui-screen-flow-spec` skill for this feature: **[INSERT FEATURE BRIEF]**.

1. Read `SKILL.md` and `references/elicitation.md`. Resolve the Git repository root (or ask for it before writing files).
2. **Start by asking me a small set of structured design questions**, using options plus Other/unsure: fullscreen vs inline vs hybrid; target stack (framework-neutral, Bubble Tea v1/v2 or Bubble Tea v2 + TUIWeave); key tasks; terminal/input constraints; and material data/IO boundaries. Skip fields already covered by my brief. See `references/go-frameworks.md` for Go-specific mapping.
3. **After my initial answers, show a provisional plan (v0)**: scope, screens, entry/exit, interactions, state/IO and terminal assumptions. Then interview in focused rounds; after later replies show a **revised plan (v1, v2, …)** and its delta. Ask only remaining material questions; never assume I approved defaults.
4. Show the consolidated plan and ask me to **approve or request changes**. Iterate again if I change it. **Do not scaffold or write artifacts until I explicitly say proceed and all blockers are resolved/delegated.**
5. After approval, choose a stable feature slug. Scaffold with `node <skill-root>/scripts/tui.mjs scaffold --repo-root <repo-root> --feature <slug> --mode greenfield`.
6. Replace every placeholder and generate structured screen trees, event-driven state machines, and UI/state/events/commands/data/validation contracts. Synchronize Markdown and JSON; log plan iterations, answers, assumptions, and approval in `DECISIONS.md`.
7. Run `node <skill-root>/scripts/tui.mjs build --repo-root <repo-root> --feature <slug> --strict`, fix errors, and confirm `contracts-viewer.html` renders.
8. Report actual generated files, decisions and validation result; do not claim that any TUI application was implemented.

All generated files MUST be inside `<repo-root>/docs/plans/generated/tui/<slug>/`.

For **inline CLI** requests, read `references/inline-cli.md`. Specify `screen.presentation="inline"`, `screen.cli` interaction/stdin metadata, command/prompt/stdout/stderr/progress nodes, and terminal `exit_code`; never apply a fullscreen frame or anchored help footer. Clarify argument grammar, pipe/TTY behavior and signals before final approval. Keep default fullscreen behavior for existing TUI designs.
