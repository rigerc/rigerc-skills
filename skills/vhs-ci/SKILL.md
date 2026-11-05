---
name: vhs-ci
description: Add VHS recording CI to a CLI or TUI project with GitHub Actions. Use when asked to automate terminal screenshots, GIFs or MP4 demos on pushes or pull requests, produce downloadable CLI recording artifacts, or set up vhs-action workflows.
---

# VHS CI

Install a recording workflow in the **target CLI repository**. Read the sibling **vhs-cli** SKILL.md and references/ci-integration.md first when available; reuse its tape-writing guidance rather than duplicating it here. Tape preflight, actual rendering, and human visual review are distinct states. A successful CI run does not prove visual correctness.

## Inspect the project first

1. Find the target Git repository, default branch, build/install instructions, executable, representative safe demo, existing tapes, and GitHub Actions conventions.
2. Run the CLI command outside VHS to identify a deterministic, visible completion marker (e.g. Usage:). The marker must not appear in the typed command. Use sample fixtures; never expose secrets, production data, or live customer accounts.
3. Decide how the executable will be on PATH in **subsequent** GitHub Actions steps. A built binary inside the repository is not automatically on PATH. Use the runner environment file GITHUB_PATH or an appropriate package setup.
4. Choose stable dimensions, theme, font, locale, dependency versions and fixtures.

## Add the workflow

Run from the installed vhs-ci skill directory:

~~~sh
python3 scripts/install.py \
  --repo /path/to/target-cli \
  --binary mycli \
  --install-command 'go build -o "$RUNNER_TEMP/mycli" ./cmd/mycli && echo "$RUNNER_TEMP" >> "$GITHUB_PATH"' \
  --demo-command 'mycli --help' \
  --wait-for 'Usage:'
~~~

Replace all values with the **actual project's** build command, binary, safe demo command and observed marker. The example installation command is for a Go CLI; add any required language/toolchain setup to the generated workflow. The installer writes files but never runs the supplied commands; it refuses existing files and symlinked destinations.

Generated target-repository files:

- .github/workflows/vhs.yml: checkout, project install, pin VHS via charmbracelet/vhs-action@v2.1.1 and VHS v0.12.1, render, basic artifact checks, upload artifact on success or failure.
- demos/vhs/demo.tape: GIF, MP4, a named PNG Screenshot, Require, Wait+Screen and post-screenshot settling delay.
- demos/vhs/.gitignore: excludes the generated outputs/ directory from commits.

Templates live in assets/vhs.yml and assets/demo.tape. If the target already has a VHS workflow, extend it rather than installing a competing workflow.

## Verification contract

1. Review the actual shell commands, workflow event triggers, action permissions and version pins. Do not trust arbitrary downloaded scripts or place sensitive secrets in demos.
2. Run the demo outside VHS with disposable fixtures. If vhs-cli is installed, optionally run its scripts/run_workflow.py in simple mode as a *heuristic* tape preflight; that alone does not render.
3. If VHS, ttyd and ffmpeg are available, run from the target project:

~~~sh
cd demos/vhs
mkdir -p outputs/screens
vhs demo.tape
test -s outputs/demo.gif
test -s outputs/demo.mp4
test -s outputs/screens/01-demo.png
~~~

4. **Open and inspect** the PNG, and beginning/middle/end of the GIF/MP4. Confirm readable fonts, no clipping, no secrets, real app content, proper waits and sensible timing. If no rendering or visual inspection occurred, explicitly state so.
5. Commit the workflow, tape and .gitignore, run GitHub Actions on a PR, download the vhs-cli-demo artifact and inspect the actual CI recording. Test -s, ffprobe and file MIME checks are smoke checks, not full decoding or visual approval.

## Adaptation and safety

For TUIs, use state-specific Wait+Screen patterns, keyboard navigation and multiple named screenshots. Add corresponding output verification for every artifact. For multiple tapes, isolate output paths to prevent collisions. VHS outputs resolve from the working directory where VHS runs; keep the workflow's cd demos/vhs. The VHS action only installs the recording tool; the target CLI must be built separately. Prefer GitHub artifact uploads, read-only contents permissions and Git-ignored output; do not auto-commit generated binaries or enable privileged production operations.

References: https://github.com/charmbracelet/vhs and https://github.com/charmbracelet/vhs-action
