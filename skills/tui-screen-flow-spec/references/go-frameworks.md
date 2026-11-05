# Bubble Tea and TUIWeave adaptation

The canonical output remains **framework-neutral** (`screens.json`, `machine.json`, `contracts.json`); this guide helps elicit and inspect Go implementations without inventing implementation evidence. Neither framework is required to run the spec generator.

## Ask at initial intake

When Go is in scope, offer structured choices and allow **Other / unsure**:

1. **Target:** (a) framework-neutral handoff, (b) Bubble Tea only, (c) Bubble Tea + TUIWeave, (d) another stack.
2. **Version / baseline:** (a) existing source and `go.mod` dictate it, (b) Bubble Tea v1, (c) Bubble Tea v2, (d) undecided. **TUIWeave requires Bubble Tea v2**; confirm the actual compatible module versions from the repository.
3. **Surface and input:** fullscreen / inline / hybrid; keyboard-only / keyboard + mouse; minimum terminal dimensions and resize/fallback behavior.
4. **Composition:** required views/components, nested focus and modal routing, data/async effects, and whether deterministic screen/interaction tests are desired.

Skip answers already present in the brief or source. These questions precede the provisional plan; do not turn the intake into an implementation commitment. Record answered, delegated and open choices in the decision log. TUIWeave is a **composable component library** for Bubble Tea v2; it does not own the app's state machine, top-level router, persistence or side effects.

## Bubble Tea v1 and v2

- Inspect `go.mod`, imports, entrypoint, model initialization, update/message handling, view rendering and tests. Do not assume a v1 API is valid in v2, or the reverse; use the project's actual dependency versions and documentation.
- Map **application state** to canonical state contracts, **messages** (`tea.Msg` including user, window-size and async result messages) to event contracts, **update decisions** to guarded machine transitions, and **commands** (`tea.Cmd`) to effect contracts with possible success/failure result events. Commands are effects, not direct mutations to model state.
- Model each screen/view with semantic nodes; document navigation and focus ownership, keymap precedence, user-visible errors and terminal-size bounds. Define how size messages reflow or collapse views, how cancellation works, and which state is retained between views.
- Keep domain events distinct from low-level key presses. Define accessible keyboard routes (and mouse interaction if requested), loading/error/empty states, and any inline-vs-fullscreen terminal lifecycle requirements.
- For existing apps, cite file paths and lines for the actual handlers, event mapping, layout and data effects. A dependency import alone is **not** proof of a flow.

## TUIWeave on Bubble Tea v2

- Identify exact `github.com/ishan5ain/tuiweave` package imports and version before suggesting components. Candidate domain-neutral packages include `layout`, `frame`, `tabs`, `menu`, `viewport`, `textinput`, `textarea`, and `statusbar`; use only those available in the installed version. Optional `agentic/` packages are a separate decision.
- Preserve **application-owned** routing, visibility, model state, focus arbitration and side effects. Component focus, explicit sizes and themed display are inputs to UI contracts; do not move domain state or authorization decisions into a component by assumption.
- For nested components, specify which messages reach which focused component, how model updates and returned commands are composed, and how keyboard/mouse events are routed. Hit testing belongs to application layout, including scrollable components and overlays.
- When relevant, document TUIWeave's semantic `inspect` nodes/actions, stable IDs, visible/disclosure-safe tree, disabled-action rejection and dispatch ownership as a **proposed** interaction/test contract, not an automatic capability of every app.
- For verification, consider `snaptest` scenarios for deterministic layout, Unicode, theme-role and focus/interaction behavior. Enumerate test cases and expected outputs in acceptance criteria; generated mockups are not snaptest results.

## Preview and validation boundaries

The `inventory` command recognizes Bubble Tea / Lip Gloss / Bubbles and TUIWeave imports as **heuristic leads**, not observed contracts. Reconstruct real behavior only from inspected source and tests.

`termcn-import` consumes **Ink/OpenTUI TypeScript registry items only**. It does not import Bubble Tea or TUIWeave Go components or generate executable Go bindings. Canonical semantic mockups and HTML storyboards can still illustrate Go-targeted designs, but they are **not** faithful screenshots or runtime renders. State the chosen implementation mapping in `SPEC.md`/`CONTRACTS.md` and record any unverified visual assumptions. Do not claim Bubble Tea or TUIWeave testing passed unless the user authorized the actual execution and its results were observed.

Upstream references: [Bubble Tea](https://github.com/charmbracelet/bubbletea), [TUIWeave](https://github.com/ishan5ain/tuiweave), [TUIWeave API docs](https://pkg.go.dev/github.com/ishan5ain/tuiweave).
