# Authoring and revision playbook

## New feature

1. Collect the brief and resolve the question gate in `references/elicitation.md`.
2. Derive the repo root using `git rev-parse --show-toplevel` (preferred), or have the user specify the root. Example: `ROOT=$(git rev-parse --show-toplevel)`.
3. Select a feature slug: `[a-z0-9]+(-[a-z0-9]+)*`. **Only after question closure**, optionally run `node <skill-root>/scripts/tui.mjs scaffold --repo-root "$ROOT" --feature "$SLUG" --mode greenfield` to prepare a draft in the required feature directory.
4. Start from the Markdown and JSON templates in `assets/templates/`. Replace every placeholder with domain-specific content. Preserve required filenames, array/object shapes, and version string. Never ship unfilled templates as final output.
5. Author `contracts.json` event IDs and data sources first; author screen nodes and state-machine transitions using those same IDs. Synchronize Markdown last.
6. Run `node <skill-root>/scripts/tui.mjs build --repo-root "$ROOT" --feature "$SLUG" --strict`. Correct all errors; this generates both `validation-report.json` and the offline `contracts-viewer.html`. To rebuild all feature folders use `build --all`, or `watch --all` while editing canonical JSON.
7. Optionally run `skills-ref validate /path/to/tui-screen-flow-spec` when that reference tool is installed, to validate the skill package metadata (separate from output validation).
8. Present exact paths, validation result, and the HTML explorer; include assumptions recorded from delegated choices.

## Update an existing feature

- Read `manifest.json` plus all canonical JSON and the decision log before modifying.
- Re-ask questions triggered by new requirements or formerly delegated assumptions, unless the user explicitly delegates them again.
- Keep stable IDs for unchanged semantics. Treat removed nodes, events, or states as breaking contract changes; document in `DECISIONS.md`.
- Update `SPEC.md`, `FLOWS.md`, `CONTRACTS.md`, and machine-readable files as a single change; rerun the validator and regenerate the HTML viewer.
- Do not overwrite unrelated feature folders; do not write generated artifacts outside `docs/plans/generated/tui/<feature>/`.

## Failure handling

- If repo root cannot be established, ask for the root. Do not use a guessed root.
- If the user cannot answer a material question and has not delegated defaults, stop before writing files and surface the blockers.
- If validator reports errors, leave status `draft`, fix or report the exact errors, and do not claim handoff-ready.
- If Python is unavailable, execute `references/contracts.md` manual checklist and clearly label validation as *manual and unverified by script*.
- If generating output solely as a downloadable starter outside a user's repo, preserve the correct repository-relative layout in the package; disclose that it must be copied into the user's repository. Do not claim it was committed or installed.

## Document contracts for an existing application

1. Follow [existing-app.md](existing-app.md) for the source inspection, evidence table, clarification gate, and security precautions.
2. Set `manifest.source_mode` to `existing-app` and `manifest.artifact_scope` to `contracts-only` (default) or `full` (if screens and complete flows are requested). Set a stable feature slug for the existing surface.
3. Only after the question gate, create `docs/plans/generated/tui/<feature>/`. Do not modify app code or run untrusted code without permission.
4. Start with `assets/templates/manifest.existing-app.template.json` and `assets/templates/evidence.template.json`. Fill `contracts.json` from observed application behavior. Produce `EVIDENCE.md` with the inventory, evidence mapping, limitations, and known gaps.
5. For contracts-only, omit screen tree and machine files entirely; use `CONTRACTS.md`, `DECISIONS.md`, `EVIDENCE.md`, `manifest.json`, `contracts.json`, `evidence.json`, `validation-report.json`, and `contracts-viewer.html`. For full reconstruction, include the same screen/flow artifacts as greenfield and both evidence files.
6. Every top-level contract entity must appear in `evidence.json` claims with exact `ref` and source locations. If a contract is only inferred, identify its uncertainty and keep the manifest in `draft`.
7. Build the interactive viewer, validate, and deliver. Indicate which behavior was derived from source versus user confirmation, plus unverified areas.

## Re-scan for drift

When source changes after contract extraction, rerun the validator and regenerate the HTML viewer. If source hashes were recorded, a mismatch fails validation until citations/contracts are updated. Re-inspect changed handlers, screens and models before bumping the baseline. `ready` means **internally consistent and source-backed at the inspected revision**, not that runtime semantics have been proven.
