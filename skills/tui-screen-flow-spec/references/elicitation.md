# Structured-first intake, plan revision and approval gate

## Principle

**Ask structured, high-impact questions at the beginning, then propose the first plan.** Read the feature brief first. For an existing TUI/CLI, **inspect code and tests read-only before asking** so users are not asked to restate observed facts. The first response should be a small, answerable intake batch, not a speculative v0 plan. Prefer the host's native structured-question/AskTool when it genuinely supports the choices; otherwise use numbered chat questions with explicit options, **Other / specify**, and space for free-form corrections. Do not fabricate question-tool calls. Ask only unanswered, material questions; never force an irrelevant questionnaire.

**Once initial answers arrive**, show a concise provisional v0 plan, clearly separating supplied/observed facts, proposed behavior, assumptions and remaining decisions. Plans are conversation drafts, **not generated spec/contract files**. Continue interviewing in rounds; after every response show the revised plan and a change summary. The user can rewrite the plan rather than accept preset choices. Obtain explicit sign-off before creating or scaffolding deliverables.

**Delegation is not approval.** “Choose sensible defaults,” “you decide,” or equivalent delegates the named choices, not necessarily all unknowns or the full plan. Record the defaults and delegation. “Approved,” “go ahead,” “proceed with this plan” or equivalent signs off the plan; silence or partial answers do not. If the user requests a shorter process, omit nonmaterial questions but retain a clear proposed plan and approval checkpoint.

## Opening structured question batch

Offer **2–5 high-impact questions** at the outset, tailored to the brief or inspected source. Ask multiple-choice only for truly bounded options, label a proposed default as a **suggestion**, allow **Other / specify**, and offer “not sure—recommend” where delegation is appropriate. Group related decisions; avoid multiple pages of low-impact forms. For example:

| Intake field | Choices to offer when unresolved |
| --- | --- |
| Workflow | New TUI / existing app contracts / existing app full reconstruction / modification of a previous spec |
| Terminal surface | Fullscreen / inline CLI / hybrid / unsure |
| Framework | Agnostic / Bubble Tea v1 / Bubble Tea v2 / Bubble Tea v2 + TUIWeave / another framework / inspect existing project |
| Primary job | User-provided task description and top user action; ask who operates it only if it affects flows |
| Interaction and constraints | Keyboard only / keyboard + mouse; known minimum terminal size / responsive; local / API / other IO; constraints or permissions |

For existing applications, **inspect first** and ask only about scope/evidence gaps the source cannot establish. When Bubble Tea or TUIWeave is selected, follow [Go framework guidance](go-frameworks.md); do not confuse TUIWeave with a standalone runtime. If the brief already settles a field, skip it.

## What the initial plan must contain

- **Goal and boundaries:** target user and jobs, included/excluded capabilities, and (for existing apps) inspected source surface and intended scope (`contracts-only` or `full`).
- **Workflow sketch:** likely screens and entry/exit/navigation paths for greenfield; code surfaces, contract categories and provenance approach for existing apps. Include major states, effects, errors, and constraints where known.
- **Confidence markers:** separate **given/observed** facts from **provisional suggestions** and **open decisions**. For existing apps, never call a speculative screen or transition observed.
- **Next decisions:** remaining blockers and optional alternatives after the initial intake; invite free-form edits (e.g. “What would you change about this plan?”).

Keep v0 short enough for a person to review. Do **not** exhaustively design every component or presuppose answers in the plan. If intake answers still leave insufficient implementation semantics, present a scope/process plan with explicit unknowns and ask focused follow-up questions rather than inventing behavior.

## Materiality test

Ask if different plausible answers would change screen count/purpose, layout tree, navigation, keybindings/focus, guards or states, data shape/source, async boundaries, commands/effects, form validation, confirmations, authorization/privacy, output location, terminal capabilities, or acceptance criteria. Skip trivia that will not change artifacts. Existing-app questions concern *unknown* behavior, not observed facts already established from source.

## Interview and revision loop

1. **Initial intake:** read the brief or inspect source/tests read-only. Ask 2–5 structured material questions before v0; omit settled facts, label choices explicitly and allow custom answers/delegation.
2. **Prepare v0 from answers:** summarize settled decisions, likely approach, alternatives and open decisions. Present a provisional plan in chat; the user may revise scope or reject assumptions.
3. **Apply feedback visibly:** after each response, show updated plan (v1, v2, …), decisions made/delegated, and what changed. Note contradictions and newly uncovered gaps rather than silently choosing a side.
4. **Repeat selectively:** ask the next coherent batch for remaining blockers or dependencies. Do not repeat settled questions. If the user revises an answer, supersede it explicitly in the plan/decision history.
5. **Approval checkpoint:** when material decisions are answered, delegated or excluded, show a consolidated plan and outstanding **nonblocking** assumptions; ask **“Approve this plan so I can generate the artifacts, or what should change?”** Require an affirmative go-ahead. On scope changes, revise again; with blockers, keep interviewing.
6. **Author only after approval:** scaffold/generate files, log initial intake Q-IDs, answers, plan revisions, delegated assumptions and the approving user response in `DECISIONS.md`. No approval means no artifacts or `ready` status.
7. **Re-enter for revisions:** for a material change to an existing specification, use an opening structured delta question where scope is not already clear, then show a proposed change plan and obtain approval before editing semantic contracts.

A complete brief may require only a brief confirmation of a material choice, not a rote list. One approval checkpoint after plan review is enough.

## Question bank (select relevant questions, never use as a rote list)

| Area | Clarify when missing | Useful answer options |
| --- | --- | --- |
| User and goal | Who performs which primary tasks? | end user / operator / administrator |
| Entry/exit | Which view opens first and what marks task completion? | list / dashboard / wizard; save / submit / close |
| Screen navigation | Which screens and Back/Escape behavior? | stack / direct navigation / cancel dialog |
| Terminal footprint | Minimum width/height and narrow-terminal behavior? | fixed minimum / collapse / vertical stack |
| Input and focus | Keyboard-only, mouse optional, focus wrap, shortcuts? | keyboard only / both; wrap / stop |
| Data source | Live service, local file, in-memory, demo? | API / file / local store / unresolved blocker |
| Data semantics | Identifiers, required fields, sort, filters, pagination? | choose from product domain |
| Async/error | What happens on pending, failure, retry, timeout? | blocking overlay / inline status / retry |
| Persistence/effects | Are operations reversible, persisted, or destructive? | persisted / ephemeral; undo / confirmation |
| Validation | Required fields, allowed values, duplicate policy? | explicit domain rule choices |
| Roles/safety | Authorization, sensitive data, destructive actions? | roles; confirm / deny / log |
| Completion | Acceptance behavior and important failure scenarios? | product-specific expected outcomes |

For **inline CLIs**, additionally establish invocation/flag syntax, output channel separation (stdout vs stderr), machine-readable modes, redirected streams, TTY detection, noninteractive fallback, exit codes, Ctrl+C/EOF and progress/spinner cleanup. See [inline CLI guidance](inline-cli.md). These are material contract decisions, not visual styling.

## Decision record

Write the conversation's **substantive** evolution in `DECISIONS.md` when generation begins:

- Stable question IDs `Q-<number>`, question, answer/delegation, source (`user` or `delegated`), and affected contract IDs.
- A plan-review history (v0 → v1 → …), with each revision's feedback and meaningful scope/flow changes; final version and the user's explicit sign-off.
- Any superseded choices, out-of-scope items, and remaining nonblocking assumptions. No unresolved material blockers are compatible with `ready`.

Do not imply that mere presentation of v0 constituted approval. If the user refuses required decisions and does not delegate or reduce scope, stop at the interview stage; explain which decisions block generation.

## Example

Brief: “Design a TUI to delete projects.” Start with structured questions about who may delete, whether deletion is reversible, what confirmation is required and how storage failures should be handled. Then show a **v0 plan** from those answers: project list → select project → confirmation dialog (if required) → deletion result, with remaining uncertainties marked provisional. After each answer, show an updated flow and what changed. On completion, ask for plan approval before specifying the component tree, guard/transitions and `project.delete` command. Do not silently select irreversible deletion.

## Existing-application interview rules

Inspect and enumerate observed screens/components, events, effects, state, data and validation **before the structured intake and extraction plan**. State what has code/test evidence and what remains an inference. Ask about target feature boundaries, current behavior vs desired change, configuration-dependent behavior, runtime/plugin branches, and conflicts between tests/docs/code. Never ask users to decide how already-observed code works.

If behavior cannot be verified, request runtime traces, additional source, permission to run code/tests, or an explicit scope exclusion; record user assertions as `user-confirmed` rather than `observed`. A plausible inference or a user-approved *proposed* enhancement is still not source-observed. Keep an existing-app baseline `draft` if material inferred/proposed behavior remains within its claimed current-behavior scope.
