# Install, integrations, and SSH machines

Authoritative: [install](https://herdr.dev/docs/install/), [integrations](https://herdr.dev/docs/integrations/), [connecting machines](https://herdr.dev/docs/connecting-machines/), [CLI reference](https://herdr.dev/docs/cli-reference/).

## Installation and updating

Check platform and installation provenance before suggesting a command. Prefer the user's existing package manager over the direct updater if Herdr came from a package manager.

Documented install commands:

Linux/macOS direct installer:

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

Homebrew on supported platforms:

```sh
brew install herdr
```

Check install and runtime:

```sh
herdr --version
herdr status
```

A new CLI binary does **not** mean the running server was replaced. `herdr update` applies to direct installations; do not use it to overwrite a package-manager installation. Never run `herdr server stop` to activate an update without explicit permission: it terminates pane processes. Experimental `--handoff` is opt-in; do not assume it is safe or supported without checking local documentation.

## Built-in coding-agent integrations

Herdr detects many coding agents without a separate integration. Install the matching integration only when the user needs native session restore or enhanced lifecycle state, and after inspecting what agent settings it changes.

```sh
herdr integration status
herdr integration install claude
herdr integration install codex
```

Other documented names include `pi`, `omp`, `copilot`, `devin`, `droid`, `kimi`, `opencode`, `kilo`, `hermes`, `qodercli`, `qwen`, `letta`, `cursor`, `mastracode`, `antigravity-cli`, and `grok`. The installed CLI and [Integrations](https://herdr.dev/docs/integrations/) page determine exact support; do not assume all integrations provide state reporting. Some provide resume identity only. The install may update agent-specific hook/config files and sometimes requires the agent's configuration directory to exist. For example, Claude uses its `settings.json` and hook, while Codex uses `hooks.json` and enables hooks in `config.toml`.

Native restore can be disabled in Herdr configuration:

```toml
[session]
resume_agents_on_restore = false
```

This is a Herdr-managed coding-agent integration workflow, **not** installation of an optional third-party Herdr plugin.

## Saved SSH machines

Check ordinary SSH access first, then interactive machine setup:

```sh
ssh workbox
herdr machine add workbox
herdr machine list
herdr machine status workbox --json
```

`machine add` can offer to install/update or replace the remote server. Replacement kills the remote server's pane processes; require explicit human approval. Interactive prompts, such as SSH authentication, belong in the user's own terminal. A saved machine targets one remote session and may use a label separate from its SSH host. Noninteractive setup defaults to remote `default` unless `--remote-session` is provided. To attach interactively, use `herdr --remote workbox` rather than assuming a saved profile implies an active TUI.

For **live** agent control on a saved remote machine, still apply the in-pane operation gate in `operations.md`. Remote commands use a consistent `--machine <saved-label-or-id>` prefix, discover remote IDs, and must not mix local IDs with remote IDs:

```sh
herdr --machine workbox agent list
herdr --machine workbox pane list
```

Client theme/keybindings ordinarily remain local; shell defaults, agent integrations, and custom commands execute on the target server. Herdr does not transfer local config or secrets automatically.

## No third-party Workbench requirement

Nothing in this skill requires the external `herdr-workbench` plugin. Do not install, invoke, configure, or troubleshoot third-party UI plugins unless the user explicitly asks about them.
