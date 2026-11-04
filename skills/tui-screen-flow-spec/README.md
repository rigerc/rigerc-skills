# TUI Screen & Flow Contract Skill

A **standalone, framework-agnostic Agent Skills package** that produces screen specifications, state machines, and typed contracts for both new and existing terminal applications. It includes a **dependency-free Node.js HTML generator** for exploring contracts offline, a Python validator, reusable templates and JSON Schemas, agent workflow prompts, and runnable examples.

No application code is generated or executed. The agent authors the contracts after clarifying material unknowns; the scripts automate preparation, validation, visualization, and packaging tasks.

## Requirements

- An [Agent Skills](https://agentskills.io/specification)-compatible agent with repository access, or a human following `SKILL.md`.
- Node.js **18+** to install, scaffold, and create an interactive HTML viewer. **No npm install or third-party dependencies.**
- Python **3.9+** to validate generated contracts (standard library only).
- Git is optional if you provide `--repo-root` explicitly.

## Package layout

```text
tui-screen-flow-spec/
├── SKILL.md                     # Portable Agent Skills definition
├── README.md                    # This file
├── package.json                 # Optional npm command aliases
├── .agents/prompts/             # Installable prompts for distinct workflows
│   ├── tui-clarify.md
│   ├── tui-design.md
│   ├── tui-extract-contracts.md
│   ├── tui-reconstruct-flows.md
│   ├── tui-update-contracts.md
│   └── tui-validate-visualize.md
├── scripts/
│   ├── tui.mjs                  # Install / scaffold / validate / build / watch
│   ├── inventory.mjs            # Read-only source entrypoint discovery hints
│   ├── generate-html.mjs        # Standalone interactive HTML generator
│   ├── validate.py              # Structural and cross-reference checks
│   └── validate_existing.py
├── assets/
│   ├── templates/               # JSON/Markdown starter files
│   ├── schemas/                 # Canonical contract schemas
│   └── viewer/index.html        # Offline, responsive interactive UI
├── references/                  # Question, existing-app, workflow, contract guidance
├── examples/                    # Complete full + contracts-only examples
└── tests/                       # Python + Node regression tests
```

## Install into your repository

You can put this entire directory anywhere initially and install from it:

```bash
node /path/to/tui-screen-flow-spec/scripts/tui.mjs install --repo-root /path/to/repository
```

The installer copies the skill to `.agents/skills/tui-screen-flow-spec/` and the workflow prompts to `.agents/prompts/`. To replace existing package files during an upgrade, add `--force`. Add `--minimal` to leave `examples/` and `tests/` out of the installed copy (`demo` and `test` are then unavailable there). The package remains usable **without installing** when you invoke its scripts directly with `--repo-root`.

Agent products vary in skill and prompt discovery. If `.agents/skills/` or `.agents/prompts/` is not supported, point your agent at `SKILL.md` and the prompt files manually or adapt their discovery locations. The skill itself follows the portable Agent Skills directory convention; agent-specific prompt discovery is not standardized.

## Use the skill

**New TUI:**

> Use the `tui-screen-flow-spec` skill to design a new terminal UI for [brief]. Ask every material open question before creating artifacts, then produce structured screens, a complete state machine, and UI/state/event/command/data/validation contracts. Validate and generate a standalone contract viewer.

**Existing TUI:**

> Use `tui-screen-flow-spec` to inspect this repository read-only, extract source-backed contracts of current behavior, ask about remaining ambiguities, and produce a contracts-only baseline with provenance. Validate and generate the interactive HTML viewer.

The agent **must ask about gaps before authoring**, distinguishing source-backed observations from user confirmations, inferences, and proposed behavior. Scripts cannot substitute for judgment or infer business rules from a vague description. For existing code, do not execute application scripts or tests without permission.

## Generated artifact layout

Every feature is kept in the actual target repository, not in the installed skill:

```text
<repo-root>/docs/plans/generated/tui/<feature-slug>/
├── manifest.json
├── contracts.json
├── CONTRACTS.md
├── DECISIONS.md
├── validation-report.json
├── contracts-viewer.html       # Offline interactive explorer
├── screens.json                # Full mode
├── machine.json                # Full mode
├── SPEC.md                     # Full mode
├── FLOWS.md                    # Full mode
├── evidence.json               # Existing-app mode
└── EVIDENCE.md                 # Existing-app mode
```

### Common commands

Run commands from the standalone skill directory; use an explicit repo root when not already inside a Git worktree.

```bash
# Create a draft after the agent has resolved the question gate
node scripts/tui.mjs scaffold --repo-root /path/to/repo --feature task-editor --mode greenfield --title 'Task Editor'

# Read-only discovery of likely TUI entrypoints and behavior (heuristic)
node scripts/tui.mjs inventory --repo-root /path/to/repo

# Extract contracts from an existing app (default: contracts-only)
node scripts/tui.mjs scaffold --repo-root /path/to/repo --feature task-browser --mode existing

# Existing app with reconstructed screens and flows
node scripts/tui.mjs scaffold --repo-root /path/to/repo --feature task-browser-full --mode existing-full

# After the agent has replaced draft placeholders with real contracts:
node scripts/tui.mjs build --repo-root /path/to/repo --feature task-editor

# Validate/render every feature folder under docs/plans/generated/tui/
node scripts/tui.mjs build --repo-root /path/to/repo --all

# Auto-revalidate and refresh HTML on JSON changes; Ctrl+C to stop
node scripts/tui.mjs watch --repo-root /path/to/repo --all

# Only render (even if the feature is still draft)
node scripts/generate-html.mjs --repo-root /path/to/repo --feature task-editor

# Optional: install two bundled examples into target repository's generated output tree
node scripts/tui.mjs demo --repo-root /path/to/repo
```

The `inventory` command performs a bounded, read-only scan of code files and prints likely TUI entrypoints, keyboard handlers, navigation, state, and data/validation source line references. **It is not proof of behavior or automatic contract extraction.** The agent must inspect the actual implementation and ask material questions.

`build` runs the Python consistency validator and writes an HTML snapshot containing the validation status; it **also renders if validation fails** so draft contracts are inspectable. Add `--strict` for a failing exit status when errors are detected (suitable for CI). `validate` alone returns a failure status on invalid contracts. `watch` observes canonical JSON inputs, not application source; rerun extraction when source code changes.

The command line does not perform automatic source extraction or use an LLM. Source analysis and clarification are the **agent workflow**, not a heuristic source-code parser. The `scaffold` command always leaves the output at `draft` with unresolved work; it does not assert that a usable design exists.

## Interactive HTML viewer

Open `docs/plans/generated/tui/<feature-slug>/contracts-viewer.html` directly in a browser. **No server or internet is needed.** The viewer supports:

- Searchable categories for screens, flows, UI, state, events, commands, data, validation and provenance.
- An expandable hierarchy of screen layout trees, component bindings and keyboard shortcuts.
- A clickable state-transition graph with state details and links to event and command contracts.
- Source-line provenance for existing-application contracts, plus unresolved questions and validation results.
- Responsive layout, dark/light themes, raw contract JSON export, and copy-to-clipboard.

All JSON data is embedded in the HTML at generation time and rendered using DOM text nodes rather than injecting unsanitized contract strings as markup. This is a **static documentation viewer**, not an executable TUI simulator. It does not fetch external assets or evaluate application code. To reflect updated JSON, rerun `build` or use `watch`.

## Validation

```bash
node scripts/tui.mjs validate --repo-root /path/to/repo --feature task-editor
node scripts/tui.mjs test
# Optional metadata validator: skills-ref validate /path/to/tui-screen-flow-spec
```

The validator checks structural consistency, IDs, event and state references, contract relationships, provenance line ranges, unresolved questions, and optional source SHA-256 drift. It does **not** prove application runtime behavior, accessibility, or full JSON Schema compliance. Machine-readable templates and schemas are under `assets/`.

## Workflow prompts

These are ready for use individually after installation into `.agents/prompts/`. Their names are descriptive; prompt invocation syntax depends on the host agent.

| File | Use |
| --- | --- |
| `tui-clarify.md` | Elicit unresolved requirements or source-code gaps before writing |
| `tui-design.md` | New TUI screens, flows, typed contracts |
| `tui-extract-contracts.md` | Existing-app, contracts-only extraction |
| `tui-reconstruct-flows.md` | Existing-app full screen and state reconstruction |
| `tui-update-contracts.md` | Evolve or rescan previously generated artifacts |
| `tui-validate-visualize.md` | Cross-check outputs, build HTML, inspect readiness |

## Example workflows and tests

`examples/example-task-tracker/` illustrates a completed greenfield flow. `examples/example-existing-app/` illustrates evidence-backed extraction from `tests/fixtures/existing_app.py`. To validate the latter, first install the skill in a target repository, so the fixture appears at its expected repository-relative path, then copy the example using `demo`. These are bundled reference assets; generated work always goes into `docs/plans/generated/tui/<feature-slug>/` in a target repository.

```bash
node scripts/tui.mjs test
```

The Node suite tests HTML generation, unsafe payload escaping, isolated client-script execution, CLI packaging and path safeguards. The Python suite tests the original cross-file validator and existing-app evidence handling.

## Boundaries

- `ready` means **internally consistent and appropriately source-backed**, not proven semantically correct at runtime.
- Do not label inferred/proposed behavior as observed, and do not invent guards, navigation, or data-source behavior.
- The scripts can scaffold, validate, render, and watch; they cannot decide missing product requirements or author contracts without the agent/human.
- Generated files are always inside `docs/plans/generated/tui/<feature-slug>/` in the intended repository root.
