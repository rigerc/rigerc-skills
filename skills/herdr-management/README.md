# Herdr Management — agent skill

A portable agent skill for **Herdr itself**: installing, configuring, using its CLI, coordinating coding agents, managing saved SSH machines, and diagnosing problems. It is based on [official Herdr documentation](https://herdr.dev/docs/) and complements the [upstream in-pane Herdr skill](https://github.com/herdrdev/herdr/blob/master/skills/herdr/SKILL.md).

It has **no relationship to or dependency on the external Herdr Workbench plugin**. This package does not install or call that plugin.

## Install the skill

Copy this `herdr-management/` directory into your agent's supported skill directory, e.g. `.agents/skills/herdr-management/`. Keep the `references/` subdirectory. Reload the agent's skill discovery if necessary. Paths vary by agent.

## Usage

Use for requests explicitly about Herdr installation, `config.toml`, terminal defaults, keybindings, themes, notifications, workspace/tab/pane layout, built-in coding-agent integrations, SSH machines, and troubleshooting.

Configuration and setup guidance work outside Herdr. **Live pane and agent control only runs from a Herdr-managed pane with `HERDR_ENV=1`.** The installed CLI and current official docs take precedence over this package's static examples.

Use `herdr config check` to validate configuration with Herdr’s own parser before reloading it. The command returns `0` for a clean configuration, `1` for configuration issues, and `2` for invalid command usage. To validate a different file, set `HERDR_CONFIG_PATH` for the check.
