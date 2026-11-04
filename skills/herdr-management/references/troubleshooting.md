# Troubleshooting without disrupting live sessions

Canonical: [troubleshooting](https://herdr.dev/docs/troubleshooting/), [session restore](https://herdr.dev/docs/session-state/), [configuration](https://herdr.dev/docs/configuration/), [connecting machines](https://herdr.dev/docs/connecting-machines/).

## Safe initial checks

First identify the symptom and platform. Prefer non-mutating status and configuration inspection:

```sh
herdr --version
herdr status
herdr --default-config
herdr integration status
```

Check the relevant log file in `~/.config/herdr/`: `herdr.log`, `herdr-client.log`, or `herdr-server.log`. Logs rotate; collect relevant rotated files when filing a bug. Increase filtering with `HERDR_LOG=herdr=debug` only when diagnosing and when acceptable for sensitive log content. Avoid exposing private paths, tokens, or agent output publicly.

## Common diagnoses

- **CLI updated but server unchanged:** Updating binary does not automatically replace an already compatible server. Check `herdr status`; avoid server shutdown unless user accepts that it terminates pane processes.
- **Config appears ignored:** Verify `HERDR_CONFIG_PATH`, the correct client/server machine, key spelling against `herdr --default-config`, and the result of `herdr server reload-config`. Some settings apply only to new panes or at startup. A TOML parse is only a syntax check.
- **Keybinding does nothing:** The operating system or outer terminal may capture the chord. Verify active binding with Herdr's `prefix+?` panel and test a safe prefix-first alternative.
- **Agent not detected or restore fails:** Compare `herdr agent list`, `herdr integration status`, installed agent version and integration capabilities. Do not treat `idle`, `done`, or `unknown` as definitive proof a process finished.
- **SSH profile fails:** Verify ordinary SSH, inspect `herdr machine status <label> --json`, distinguish authentication from server compatibility. Reconnect in a human-operated terminal when a passphrase or host-key prompt is needed. Background reconnect does not install or replace a remote server.
- **Pane output appears incomplete:** Try `recent-unwrapped` with more lines. Alternate-screen application history may not be in terminal scrollback; see [agent automation](https://herdr.dev/docs/agent-automation/).

## Persistent process safety

Detaching/closing the Herdr client preserves server-held pane processes. `herdr server stop` does not: it ends the server and pane processes. Do not conflate detaching, updating a CLI binary, restarting an agent, reloading config, and stopping a session. Never force a destructive recovery action on speculation; confirm scope and user intent first.

## Reporting

Include the exact command/setting checked, Herdr CLI/server versions when available, machine/session context, sanitized error messages, whether config was reloaded, and remaining uncertainty. Do not claim a fix succeeded solely because a command returned zero.
