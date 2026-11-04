# CLI operations and agent coordination

Canonical: [CLI reference](https://herdr.dev/docs/cli-reference/), [agent automation](https://herdr.dev/docs/agent-automation/), [upstream in-pane skill](https://github.com/herdrdev/herdr/blob/master/skills/herdr/SKILL.md), [socket API](https://herdr.dev/docs/socket-api/).

## Execution precondition

Live agent/pane automation from this skill is **inside an active Herdr pane only**:

```sh
test "${HERDR_ENV:-}" = 1
```

Without that context, do not inspect/control an arbitrary focused Herdr session from outside Herdr. Configuration, installation guidance, and documentation support can still be provided outside. Never run bare `herdr` from a managed pane (nested launches are not the operational workflow).

## State and identity

Herdr's hierarchy:

- **Session**: persistent background server namespace.
- **Workspace**: project container for tabs, panes and agents.
- **Tab**: arrangement of panes in a workspace.
- **Pane**: real terminal process/screen, whether or not an agent is present.
- **Agent**: recognized current pane occupant with lifecycle state (`working`, `blocked`, `done`, `idle`, `unknown`).

IDs are opaque handles, resembling `w1` / `w1:t1` / `w1:p1`; they are **not** derived from display order and can change after moves. Agent names are unique among live agents and must match `[a-z][a-z0-9_-]{0,31}`. A name follows the occupying agent, not the pane forever.

Get current context first:

```sh
printf 'workspace=%s tab=%s pane=%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
herdr status
herdr workspace list
herdr tab list --workspace "$HERDR_WORKSPACE_ID"
herdr pane current --current
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr agent list
```

`herdr status` helps identify incompatible client/server versions. Most control commands return JSON; parse their `result` fields with a real JSON parser such as `jq`, not regex or invented IDs. Never assume the current focused pane is yours: other attached clients can focus other panes.

## Live shell commands

Prefer a sibling pane in the same tab and the current working directory. First inspect geometry with `herdr pane layout --pane "$HERDR_PANE_ID"`; split wide panes right or narrower ones down. Preserve user focus:

```sh
split=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus)
pane_id=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')
herdr pane run "$pane_id" "just test"
herdr pane wait-output "$pane_id" --match "test result" --timeout 120000
herdr pane read "$pane_id" --source recent-unwrapped --lines 120
```

`pane run` **queues** a command and Enter, not a verified completion. `pane wait-output` matches an existing substring if already present and does not guarantee exit code or test pass. Inspect output and shell prompt/process state as appropriate. Prefer `--match` for literal strings or `--regex` for a Rust regular expression.

Read sources:

- `visible`: current viewport.
- `recent`: recent rendered screen text including soft wraps.
- `recent-unwrapped`: joins soft wraps, generally best for transcripts/logs.
- `detection`: agent detector's bottom-buffer text.

`--format ansi` is useful when text styles matter; otherwise use text. A terminal's alternate screen may not be in host scrollback. Avoid repeatedly dumping sensitive output into chat.

## Start and coordinate a coding agent

`herdr agent start` needs an **existing, available interactive shell pane**; it never creates layout. Do not overwrite a busy pane/editor/foreground process. Give a unique live name:

```sh
herdr agent start reviewer --kind codex --pane "$pane_id"
herdr agent get reviewer
herdr agent prompt reviewer "Review the current diff and report actionable findings." --wait --timeout 120000
herdr agent read reviewer --source recent-unwrapped --lines 120
```

Use the specific installed agent kind requested by the user; inspect `herdr agent` for supported kinds and options. Agent-native arguments go after `--` (e.g. `herdr agent start reviewer --kind codex --pane "$pane_id" -- <native-args>`). A successful start waits for detection and readiness; a blocked startup may return `agent_not_ready` while leaving the name available for inspection.

`agent prompt` sends text plus Enter in one ordered submission. With `--wait`, Herdr waits for settled `idle`, `done`, or `blocked` after observing activity; state is a lifecycle signal, not proof of an individual turn's completion. `agent_prompt_stalled` and timeouts do **not** prove the prompt was never delivered. Read `agent get` / `agent read` before considering a retry.

To wait specifically for an approval/question UI:

```sh
herdr agent wait reviewer --until blocked --timeout 120000
```

When blocked, **inspect** then ask the user before sending input. Use `herdr agent send-keys reviewer esc` to dismiss if explicitly requested; never blindly press Enter to approve. An `idle` or `done` state means ready for input but does not prove a hidden subagent task is complete. `unknown` does not prove completion either.

## Layout and worktrees

A workspace create also returns its initial tab/root pane; tab create returns its root pane; a split returns its new pane. Useful response fields:

- `workspace create`: `.result.workspace`, `.result.tab`, `.result.root_pane`.
- `tab create`: `.result.tab`, `.result.root_pane`.
- `pane split`: `.result.pane`.
- `pane move`: new pane ID in `.result.move_result.pane.pane_id` and prior ID in `.result.move_result.previous_pane_id`.

Only create a new workspace, tab, or worktree if the user asked for that topology or it is necessary to satisfy their stated goal. `pane swap` changes layout within a tab, while `pane move` can change workspace-qualified IDs. `workspace close --group` closes a whole linked group; never use it to bypass a group-close safety error.

Use Git worktree creation/removal only for repositories the user controls/trusts. A `--trust-repository` flag overrides a Git trust safeguard and must not be a routine error-retry measure. Removing worktrees can destroy changes and requires explicit permission.

## Multiple machines

`herdr machine list` returns saved **profiles**, not pane inventory. To automate a saved remote profile, keep the selector on **every** call:

```sh
herdr --machine <profile-label-or-id> agent list
herdr --machine <profile-label-or-id> pane list
herdr --machine <profile-label-or-id> agent prompt <remote-agent-name> "Report current status." --wait --timeout 120000
```

The selector must be an enabled saved profile ID or unambiguous case-sensitive label; **not** an arbitrary SSH host string. Never mix `--machine` with `--session` or `--remote`. Remote pane IDs/agent names are server-local and may match local ones; discover them there. The remote server must already be running and API-compatible. A connection failure after a mutating request does not prove it was not applied: re-inspect state before retrying.

No implicit restart, installation, remote profile modification, or termination is allowed. A UI switch to a remote machine does **not** retarget CLI commands launched in an existing pane. CLI remote control is not the same as interactive `herdr --remote <host>` attachment.

## Socket API for bespoke tooling

Prefer CLI wrappers for scripts and portable Windows behavior. If a custom client needs event subscriptions, introspection, or fine-grained control, consult [socket API](https://herdr.dev/docs/socket-api/) and inspect `herdr api schema --json` for the installed binary's schema. Socket paths and capabilities vary by session/platform; prefer inherited `HERDR_SOCKET_PATH` or the documented socket discovery procedure. Treat protocol errors or missing server capabilities as incompatibility, not permission to stop/replace a live server.
