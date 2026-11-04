# Configuration and safe changes

Authoritative: [configuration](https://herdr.dev/docs/configuration/) · [config reference](https://herdr.dev/docs/config-reference/). The complete commented defaults come from **this installed version**:

```sh
herdr --default-config
```

Never assume the reference snippets below are exhaustive. Use the generated defaults to check names, types, allowed values, and version discrepancies.

## Config locations and precedence

| Platform | Default file |
| --- | --- |
| Linux/macOS | `~/.config/herdr/config.toml` |
| Windows | `%APPDATA%\herdr\config.toml` |

`HERDR_CONFIG_PATH` overrides the default. `herdr --help` shows the resolved path. Herdr needs no config file to work. If a setting is invalid, Herdr may warn and fall back to a safe default. Run `herdr config check` for native validation, not just generic TOML syntax parsing.

For a **first-time** config, create the directory, then write only the requested settings. For an **existing** config, first back it up and insert/modify the relevant key in its existing table; never add a second `[keys]` or `[ui]` section when one already exists. Check for an existing `[[keys.command]]` array of tables when adding commands. Do not blindly paste several independent snippets that duplicate tables.

### Backup and validation

Unix example (replace the config path if overridden):

```sh
config="${HERDR_CONFIG_PATH:-$HOME/.config/herdr/config.toml}"
[ ! -f "$config" ] || cp -p -- "$config" "$config.bak.$(date +%Y%m%d-%H%M%S)"
# Make a minimal edit with the user's chosen editor or a controlled patch.
herdr config check                         # native validation; must exit 0
herdr server reload-config                 # only after a passing check, when authorized
```

Windows PowerShell example:

```powershell
$path = if ($env:HERDR_CONFIG_PATH) { $env:HERDR_CONFIG_PATH } else { Join-Path $env:APPDATA 'herdr\config.toml' }
if (Test-Path -LiteralPath $path) {
  Copy-Item -LiteralPath $path -Destination ("$path.bak." + (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
# Apply a focused edit, preserving all unrelated keys.
herdr config check                          # native validation; must exit 0
herdr server reload-config                  # only after a passing check, when authorized
```

`herdr config check` prints `config: ok` and exits `0` on success; it prints `config: issues found` with diagnostics and exits `1` on a configuration issue; bad arguments exit `2`. It validates the file resolved by `HERDR_CONFIG_PATH` or Herdr’s default config location, without needing a running server. To check a candidate file without touching the active config, set `HERDR_CONFIG_PATH` to that candidate path for the check command. Do not reload when validation fails. Do not run the reload when no server is running solely to avoid an error. Herdr supports reload via the global menu as well. Some startup-only options need a restart (see below); never restart without discussing impact on live pane processes. After each change, inspect startup warnings and verify observed behavior.

## Client-local versus server settings

Herdr's documentation draws a key remote boundary:

| Scope | Typical options | Where to edit |
| --- | --- | --- |
| Client presentation | `[theme]`, sidebar/UI layout, copy behavior, local keybindings, toast presentation | machine running the UI, including when viewing a saved SSH machine |
| Server runtime | new-pane terminal defaults, worktrees, integrations, custom command bindings | machine that owns the panes/server |
| Agent config | hooks/plugins installed by `herdr integration install` | the agent's own config on the machine where it runs |

Herdr's UI `reload config` reloads the local client and selected server. The `--remote-keybindings server` launch option explicitly opts into the server's keybindings; otherwise local keys are used. Server-side config can be reloaded with `herdr server reload-config`. Treat remote client and server as separate configs; do not synchronize their secrets.

## Common recipes

Each fenced snippet is **independent**, not a complete `config.toml`. Merge into any existing table and verify against the active version.

### Keybindings

```toml
[keys]
prefix = "ctrl+b"
new_tab = "prefix+c"
next_tab = "prefix+n"
previous_tab = "prefix+p"
split_horizontal = "prefix+minus"
```

`prefix+...` is a two-step chord (default `ctrl+b`, then action). `keys.prefix` may also be an array (`["ctrl+space", "ctrl+s"]`). A binding may map to more than one chord, such as `next_tab = ["prefix+n", "ctrl+alt+]"]`. Direct chords can be intercepted by the outer terminal or OS; prefix-first bindings avoid stealing ordinary application input. The in-app `prefix+?` displays effective bindings. Check the [keyboard guide](https://herdr.dev/docs/keyboard/) before making the keymap prefix-free.

### Named shell, shell startup, and new working directory

```toml
[terminal]
default_shell = "nu"
shell_mode = "auto"
new_cwd = "follow"
```

`default_shell` expects an executable, **not** a shell command with arguments. `shell_mode`: `auto`, `login`, `non_login`. `new_cwd`: `follow`, `home`, `current`, or an explicit path such as `~/Projects`. An explicit CLI `--cwd` wins over `new_cwd`. Changing the default shell affects **new** panes, not shells already running.

### Theme and automatic switching

```toml
[theme]
name = "catppuccin"
auto_switch = true
light_name = "catppuccin-latte"
dark_name = "catppuccin"

[theme.custom]
accent = "#89b4fa"
```

Use the filterable config reference for supported theme names and color keys. `auto_switch` requires the outer terminal's appearance reporting for automatic switching. Herdr also supports `[theme.custom.light]` and `[theme.custom.dark]` sub-tables. `terminal` as a theme name follows the host ANSI palette.

### UI presentation and borders

```toml
[ui]
pane_borders = "auto"
tab_bar_position = "bottom"
```

`ui.pane_borders` accepts `auto`, `always`, `off`; some old boolean configurations still work. A single-pane frame also needs `ui.pane_outer_borders = true`. Check `ui.` in the config reference for sidebar width, collapsed-mode, mouse, and Agent panel layout settings.

### Toast notifications

```toml
[ui.toast]
delivery = "herdr"
delay_seconds = 1

[ui.toast.herdr]
position = "bottom-right"
```

Delivery: `herdr` (in-app), `terminal` (outer-terminal, including SSH), `system` (OS service), or `off`. Herdr suppresses popups for the active tab. On macOS system delivery can use `terminal-notifier` and falls back to `osascript`; on Windows system delivery uses Notification Center.

### Worktree storage

```toml
[worktrees]
directory = "~/.herdr/worktrees"
```

Created worktrees go beneath `<directory>/<repo>/<branch-slug>`. Closing a Herdr worktree workspace does not delete its checkout or branch; deletion is a separate operation. Only delete worktree checkouts on explicit request and check for modified/untracked files first.

### Agent restore and startup pacing

```toml
[session]
resume_agents_on_restore = true
startup_per_agent_delay_ms = 100
```

Native resume only works for supported agents with valid integration session references. It is not equivalent to keeping the original process alive, and some restart paths stop active terminal processes. These settings are startup-related; refer to the [session state guide](https://herdr.dev/docs/session-state/) and restart policy before applying them.

### Headless terminal dimensions

```toml
[server]
headless_cols = 160
headless_rows = 50
```

Headless defaults apply when no client is attached; with clients attached, pane sizes follow client focus rules. Check whether this needs server restart in the installed version.

### Custom commands

```toml
[[keys.command]]
key = "prefix+alt+g"
type = "popup"
command = "lazygit"
description = "open lazygit"
width = "80%"
height = "80%"
```

Documented types include `popup`, `pane`, `shell`, `plugin_action`. Custom commands execute as the Herdr user and **on the server that owns the panes**. Do not put untrusted shell text or third-party executables in keybindings without review. Unix shell syntax and Windows `cmd.exe /d /c` syntax are different; use PowerShell explicitly on Windows if needed. Relevant context variables can include `HERDR_SOCKET_PATH`, `HERDR_BIN_PATH`, `HERDR_ACTIVE_WORKSPACE_ID`, `HERDR_ACTIVE_TAB_ID`, `HERDR_ACTIVE_PANE_ID`, and `HERDR_ACTIVE_PANE_CWD`.

## Environment overrides and debugging

| Variable | Function |
| --- | --- |
| `HERDR_CONFIG_PATH` | Read config from a different file |
| `HERDR_SESSION` | Select named CLI session |
| `HERDR_SOCKET_PATH` | Low-level socket override |
| `HERDR_PROCESS_DETECTION` | Linux detection strategy (`native` by default; `child-groups` opt-in) |
| `HERDR_LOG` | Logging filter (e.g. `HERDR_LOG=herdr=debug`) |
| `HERDR_DISABLE_SOUND` | Prevent sound playback even when enabled in config |

The default log directory on Linux/macOS is `~/.config/herdr/`; typical files include `herdr.log`, `herdr-client.log`, and `herdr-server.log`. Include rotated siblings when diagnosing. Avoid printing log secrets or user content unnecessarily.
