# Start with structured questions and iterate on a TUI plan

Use the `tui-screen-flow-spec` skill to prepare **[INSERT FEATURE OR EXISTING TUI]** for specification.

For a new feature, read my brief. For an existing TUI, **inspect the repository and tests first** (read-only), optionally using the inventory helper:

```
node <skill-root>/scripts/tui.mjs inventory --repo-root <repo-root>
```

The inventory is a navigation aid, **not** evidence of implemented behavior. Separate observed facts from suggestions and unknowns.

1. **Ask me structured questions first** about unresolved high-impact choices. Use a small batch (typically 2–5), offer concise options plus Other/unsure, and use native question controls if available. Ask about surface, framework (agnostic, Bubble Tea v1/v2, or Bubble Tea v2 + TUIWeave), goals, IO and constraints only when not already established. For existing apps, inspect source before asking and do not restate observed facts.
2. **After my initial answers, show a provisional plan (v0)** with intended scope, screens or source-backed surfaces, flows or extraction approach, assumptions, and open decisions. Mark suggestions as provisional. Invite corrections to the entire plan.
3. **After subsequent replies**, update the visible plan to v1/v2/etc. Say what changed, what I decided or delegated, and what remains unresolved. Ask follow-ups only for material gaps; do not re-ask settled facts.
4. **Show me the consolidated plan and request explicit approval** (or further corrections) before creating or scaffolding any spec/contract artifacts. Do not treat silence or partial answers as approval. A delegation of defaults is not automatically a sign-off.
5. Once approved and material blockers are closed, return the approved plan and decision summary. Continue with the appropriate design or extraction workflow if I have asked you to produce artifacts; otherwise offer that as the next step. When generating, record plan versions, Q-IDs and approval in `DECISIONS.md` and keep all artifacts under `<repo-root>/docs/plans/generated/tui/<feature-slug>/`.

During intake, distinguish a fullscreen TUI from an inline CLI (or a hybrid). For inline commands ask about invocation/flags, TTY vs piped stdin, stdout/stderr, prompts, progress cleanup, and exit statuses; consult `references/inline-cli.md`.
