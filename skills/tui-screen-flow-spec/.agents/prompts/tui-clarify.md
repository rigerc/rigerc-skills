# Clarify gaps before generating TUI contracts

Use the `tui-screen-flow-spec` skill to prepare **[INSERT FEATURE OR EXISTING TUI]** for specification.

If this is a new feature, read the brief and separate explicit requirements from open questions. If this is an existing TUI, **inspect the repository first**. Optionally run the read-only heuristic inventory:

```
node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>
```

Inspect actual source lines before making any implementation claims; an inventory signal is not evidence. Identify decisions about feature boundaries, input/output data, component semantics, keyboard navigation, state transitions, error/retry behavior, data persistence, validation, and dynamic or plugin surfaces. Ask me all **material** unresolved questions, preferably with structured choices where appropriate, but don't force an arbitrary question count. Recheck gaps after each answer. Do **not** generate specs/contracts, mark `ready`, or invent assumptions until I answer or explicitly delegate unresolved choices.

After clarification, return a brief normalized design/extraction brief and decision log summary, then offer to proceed with the appropriate design or extraction workflow. When generating after approval, store all artifacts under `docs/plans/generated/tui/<feature-slug>/` at repository root.
