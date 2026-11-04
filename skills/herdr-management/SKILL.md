---
name: herdr-management
description: "Install, configure, operate, and troubleshoot Herdr, the terminal workspace manager for AI coding agents. Use when the user explicitly asks about Herdr setup, config.toml, keybindings, themes, notifications, sessions, panes, workspaces, integrations, saved SSH machines, CLI automation, or agent coordination. Do not activate for generic terminal, tmux, or delegation tasks that do not mention Herdr."
compatibility: "Herdr CLI for installation, native config validation, and operations. Live pane/agent control requires HERDR_ENV=1."
metadata:
  version: "1.0.1"
  upstream: "https://github.com/herdrdev/herdr"
---

# Herdr management

Help the user operate and configure **Herdr**, a terminal multiplexer with persistent sessions, workspaces, tabs, panes, and detected coding agents. Support two different contexts: **administration/configuration** (possible outside a Herdr pane) and **live pane/agent automation** (allowed only inside a Herdr-managed pane).

## Scope

This skill is **only for Herdr itself**. Do not conflate it with the unrelated, optional third-party plugin named "Herdr Workbench". External plugins are not required for any workflow here. The `herdr integration ...` commands refer to Herdr’s supported coding-agent integrations, not optional third-party UI plugins.

## Source of truth and discovery

Treat the installed version as authoritative; Herdr evolves quickly. Before providing executable syntax or changing settings:

1. Determine the user's task and platform. Check `command -v herdr` (or `Get-Command herdr` in PowerShell), `herdr --version`, and `herdr --help` if available.
2. For any config key, look it up in `herdr --default-config` and the [configuration guide](https://herdr.dev/docs/configuration/) / [config reference](https://herdr.dev/docs/config-reference/). Do not invent TOML settings, enum values, command flags, or undocumented defaults.
3. For CLI operations, inspect `herdr <group>` or `herdr <group> --help`, for example `herdr pane`, `herdr agent`, `herdr integration`, `herdr machine`. The exact CLI installed on the machine wins over examples in this skill.
4. Do **not** run bare `herdr` merely to discover commands: it launches/attaches a UI. Do **not** probe a potentially mutating nested command by omitting flags; for example `herdr workspace create` runs with defaults.
5. When docs conflict, explain the version discrepancy and prefer the installed command and safe read-only inspection. See [source links](references/sources.md).

Route only to the reference needed:
- [Configuration and safe editing](references/configuration.md) — config paths, reload scope, validated TOML recipes.
- [CLI, panes, and agent coordination](references/operations.md) — identifying targets, safe read/run/wait workflows.
- [Installation, integrations, remote machines, plugins](references/setup-and-integrations.md).
- [Troubleshooting and state preservation](references/troubleshooting.md).

## Task classification and initial checks

- **Explain/plan:** Give the user's shortest viable path and cite the relevant official doc; don't change the environment.
- **Install/update:** Check OS, installation method, existing binary, package-manager ownership, and whether the request authorizes installation. Never replace a running server or update agents by implication.
- **Configure:** Read the existing config and defaults, make the smallest requested TOML change, validate, reload if safe, and verify the observed result.
- **Operate Herdr:** Gate all live pane/agent control on `HERDR_ENV=1`, then inspect live IDs/state before creating or touching anything.
- **Diagnose:** Prefer version/status/log and read-only inspections. Never try destructive restarts as a first fix.

Herdr persists pane processes when clients detach; **stopping the server is not equivalent to detaching**. Treat server shutdown, pane closure, worktree removal, forced termination, and plugin execution as potentially destructive.

## Configuration workflow

1. Locate the actual config: `HERDR_CONFIG_PATH` if set; otherwise `~/.config/herdr/config.toml` (Linux/macOS) or `%APPDATA%\herdr\config.toml` (Windows). `herdr --help` reports the resolved path. Missing config is normal; Herdr uses defaults.
2. Identify whether the requested setting is **client-local** (e.g. theme, local keys, sidebar presentation) or **server-side** (e.g. pane defaults, worktrees, integrations, custom commands). On SSH, edit the correct machine; remote attach does not automatically copy config or commands.
3. Inspect only relevant portions of existing config. Preserve unrelated keys, comments, table structure, and any user secrets. Fetch the default config read-only with `herdr --default-config`. **Never redirect it onto an existing config** as a convenience.
4. For an edit, take a timestamped backup first; create the parent directory only if necessary. Apply a **minimal** change, not a generated full-file replacement. If a new config is required, prefer only the desired table and key(s).
5. **Validate with Herdr itself**: run `herdr config check` after every edit, before reload. It validates the effective `config.toml` through Herdr’s configuration loader and prints diagnostics. Exit code `0` and `config: ok` indicate no issues; exit code `1` means issues; `2` indicates CLI usage error. Use `HERDR_CONFIG_PATH=/absolute/path/to/config.toml herdr config check` on Unix or `$env:HERDR_CONFIG_PATH = ...; herdr config check` on Windows to validate a non-default file. Do not apply a config that fails validation. Check the before/after diff and consult defaults/reference for recognized keys and types.
6. Only **after** `herdr config check` passes, and with authorization and a running server, run `herdr server reload-config` (or global menu > reload config). Many UI options reload; some startup-only settings require a restart. Never restart a server just to make a setting take effect without warning that active pane processes may be lost.
7. Verify the specific behavior or warning; if it fails, restore the backup and reload, without wiping other edits.

Example **new** file (do not copy over an existing file):

```toml
[keys]
prefix = "ctrl+b"

[theme]
name = "catppuccin"

[terminal]
new_cwd = "follow"
```

Further examples: [configuration reference](references/configuration.md). Key names and values above are documented, but confirm against the installed binary.

## Live pane and agent control: strict gate

Before **every live control workflow**, run inside the calling agent's shell:

```bash
test "${HERDR_ENV:-}" = 1
```

If the check fails, **do not inspect or manipulate a focused Herdr session from outside Herdr**. You can still help with files, installation, config, docs, or instruct the user how to enter a Herdr pane. Do not launch nested `herdr` from inside Herdr.

When the check passes:

```bash
herdr workspace list
herdr agent list
herdr pane current --current
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
```

Use CLI JSON response IDs, not example IDs or sidebar ordering. Caller context (`HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, `HERDR_PANE_ID`) is safer than whichever pane the user's UI currently focuses. Prefer `--current` or explicit live targets and `--no-focus` for background work. See [operations](references/operations.md) for the full guarded procedure.

For a task requiring a separate command pane, preserve the working directory and focus:

```bash
herdr pane split --current --direction right --cwd "$PWD" --no-focus
# Parse .result.pane.pane_id from the JSON; substitute it below.
herdr pane run <returned-pane-id> "just test"
herdr pane read <returned-pane-id> --source recent-unwrapped --lines 120
```

For agent coordination, create/select a **real available shell pane** first; `herdr agent start` does not create one. Confirm kind/name, inspect the agent's state, then use `herdr agent prompt <live-name> "..." --wait --timeout 120000` when appropriate. If blocked, inspect the dialog and require user approval before responding; never automatically approve permissions. A timeout is not proof an action failed to submit: inspect before retrying.

## Integrations and SSH machines

- `herdr integration status` to inspect installed hooks/plugins; use `herdr integration install <documented-name>` only when requested. Installation may edit another agent's settings and hooks; discuss this first.
- `herdr machine list` displays saved SSH profiles. Verify plain SSH independently before `herdr machine add <ssh-target>`. `machine add` may offer remote installation/replacement; require explicit approval before replacing a server. Background reconnect never installs or replaces it.
- Remote CLI targeting requires `herdr --machine <saved-label-or-id> ...`, **not** a raw hostname; discover IDs on that machine and carry the prefix through every subsequent command. Never combine `--machine` with `--remote` or `--session`.
- External third-party Herdr plugins (including Herdr Workbench) are out of scope. Do not recommend, install, configure, or invoke them unless the user separately requests one.

## Safety and reporting

- Never issue `herdr server stop`, force-close an unknown pane, delete a Git worktree, approve a security prompt, or change SSH trust/configuration without an explicit user request. Even a normal `server stop` kills pane processes.
- Treat a successful queued command or prompt submission as **acknowledgement**, not evidence the process completed. Use read/wait methods and report actual state.
- Preserve users' existing integrations, keys, config comments, agent sessions, and workspace layout. Do not assume two servers share pane IDs or agent names.
- Report: config path/machine, exact setting or command applied, backup location, validation performed, any startup-only caveat, and observed result. Never claim that a reload fixed a problem without verifying it.
