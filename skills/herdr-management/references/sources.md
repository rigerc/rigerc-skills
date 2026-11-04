# Authoritative Herdr sources

Use the **installed binary** for current command shape (`herdr --help`, command-group help) and generated defaults (`herdr --default-config`). These official sources supply the rest:

- Documentation index: https://herdr.dev/docs/
- Repository documentation tree (requested source): https://github.com/herdrdev/herdr/tree/master/docs/next/website/src/content/docs
- Configuration: https://herdr.dev/docs/configuration/
- Filterable config reference: https://herdr.dev/docs/config-reference/
- CLI reference: https://herdr.dev/docs/cli-reference/
- Agent automation: https://herdr.dev/docs/agent-automation/
- Socket API: https://herdr.dev/docs/socket-api/
- Quick start: https://herdr.dev/docs/quick-start/
- Installation: https://herdr.dev/docs/install/
- Keybindings: https://herdr.dev/docs/keyboard/
- Integrations: https://herdr.dev/docs/integrations/
- Detected agents: https://herdr.dev/docs/agents/
- SSH machine federation: https://herdr.dev/docs/connecting-machines/
- Remote sessions: https://herdr.dev/docs/persistence-remote/
- Session restore and pane history: https://herdr.dev/docs/session-state/
- Troubleshooting: https://herdr.dev/docs/troubleshooting/
- Upstream in-pane skill: https://github.com/herdrdev/herdr/blob/master/skills/herdr/SKILL.md
- Human-facing agent guide: https://herdr.dev/agent-guide.md

## Upstream precedence

This skill is **not** a copy of the upstream Herdr skill. If the upstream in-pane skill contains a newer behavior, prefer it after confirming the installed CLI. For settings, prefer the generated config reference and the configuration guide, not inference from an unrelated Rust source field.

This skill was drafted against the `master` documentation retrieved November 4, 2026. Recheck upstream before relying on version-dependent details.
