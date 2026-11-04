# Clarification and question gate

## Principle

Natural-language briefs and existing codebases can both omit semantics needed for deterministic contracts. For existing applications, **inspect the code and tests first** and ask only what inspection cannot establish; treat observed implementation as evidence, not a request for speculative design. Before authoring files, actively look for *any unanswered question that could change the interface*. Use a native structured-question/AskTool capability if available. If the host lacks one, ask concise multiple-choice or direct-answer questions in chat. Do not fabricate calls to nonexistent tools.

**A user response of “choose sensible defaults,” “you decide,” or equivalent is permission to decide.** Record the chosen value and the delegation in `DECISIONS.md`, and the decision in the appropriate design files. If no delegation was given and the question is material, continue elicitation.

## Materiality test

Ask if different plausible answers would change any of: screen count/purpose, layout tree, navigation, keybindings/focus, guard, state, data shape/source, async boundary, effect/command, form validation, confirmation behavior, security/privacy, output location, terminal capabilities, or test acceptance. Do not ask questions for trivia that cannot change artifacts.

## Question bank (select relevant questions; do not ask all by rote)

| Area | Clarify when missing | Useful answer options |
| --- | --- | --- |
| User and goal | Who performs which primary tasks? | end user / operator / administrator |
| Entry/exit | Which view opens first and what marks task completion? | list / dashboard / wizard; save / submit / close |
| Screen navigation | Which screens and Back/Escape behavior? | stack / direct navigation / cancel dialog |
| Terminal footprint | Minimum width/height and narrow-terminal behavior? | fixed minimum / collapse / vertical stack |
| Input and focus | Keyboard-only, mouse optional, focus wrap, shortcuts? | keyboard only / both; wrap / stop |
| Data source | Live service, local file, in-memory, demo? | API / file / local store / TBD (blocker) |
| Data semantics | Identifiers, required fields, sort, filters, pagination? | choose from product domain |
| Async/error | What happens on pending, failure, retry, timeout? | blocking overlay / inline status / retry |
| Persistence/effects | Are operations reversible, persisted, or destructive? | persisted / ephemeral; undo / confirmation |
| Validation | Required fields, allowed values, duplicate policy? | explicit domain rule choices |
| Roles/safety | Authorization, sensitive data, destructive actions? | roles; confirm / deny / log |
| Completion | Acceptance behavior and important failure scenarios? | product-specific expected outcomes |

## Asking protocol

1. Extract known decisions first; do not ask what the brief already answers.
2. Group questions by dependency, putting blockers first. Multiple-choice when a bounded set of choices is suitable; free text otherwise.
3. Ask every *currently known* material open question. For complex projects, batch by coherent topic rather than an overwhelming single prompt.
4. After each answer, inspect for new dependent gaps; ask again if needed.
5. Before generating, show a short resolved-decision summary and confirm internally that no non-delegated material gaps remain. No additional approval round is needed if the user has answered.
6. Write a trace in `DECISIONS.md`: question ID, question, answer, source (`user` or `delegated`), and impact on the contract. Mark any deliberately out-of-scope questions; do not claim they were answered.
7. If the user refuses to resolve required semantics, stop at the question stage. Do not generate misleading pseudo-complete artifacts. You may explain exactly what blocks progress.

## Example

Brief: “Design a TUI to delete projects.” Before writing, ask whether deletion requires confirmation, whether it is reversible, and what errors the storage backend can return. Do not make these decisions silently. Once the user answers or delegates defaults, specify the confirmation dialog tree, guard/transition rules, `project.delete` command, and success/failure events consistently.

## Existing-application clarification rules

Before asking, enumerate observed UI screens/components, events, effects, state, data, and validation from source. Do not ask users questions whose answers are clearly established by inspectable code. Ask for: target application/feature boundaries, documentation of current vs desired behavior, configuration-dependent behavior, unknown runtime/plugin branches, side-effect assumptions, and any disagreement between tests/docs/code.

If important behavior cannot be verified, ask one or more specific questions. The user can provide runtime traces, tests, or delegated assumptions. Keep unverified/inferred material assertions out of `ready` contracts, even if plausible. Logging the question is not enough: mark baseline `draft` until answered, verified or explicitly removed from the described scope.
