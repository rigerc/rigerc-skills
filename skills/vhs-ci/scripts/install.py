#!/usr/bin/env python3
"""Install a project-specific VHS GitHub workflow. Does not run supplied commands."""
import argparse
import json
import re
import sys
from pathlib import Path


ASSETS = Path(__file__).resolve().parents[1] / "assets"


def render(args):
    binary = args.binary.strip()
    command = args.demo_command.strip()
    marker = args.wait_for.strip()
    install = args.install_command.strip()
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.-]*", binary):
        raise ValueError("--binary must name an executable on PATH")
    if not command or any(c in command for c in "\n\r\x00"):
        raise ValueError("--demo-command must be one nonempty line")
    if not marker or any(c in marker for c in "/\n\r\x00"):
        raise ValueError("--wait-for must be a nonempty literal without '/' or newlines")
    if marker in command:
        raise ValueError("--wait-for occurs in the typed command (false-positive wait)")
    if not install or any(c in install for c in "\r\x00"):
        raise ValueError("--install-command must contain shell text without CR or NUL")

    workflow = (ASSETS / "vhs.yml").read_text(encoding="utf-8")
    tape = (ASSETS / "demo.tape").read_text(encoding="utf-8")
    if workflow.count("__INSTALL_COMMAND__") != 1:
        raise ValueError("invalid workflow template")
    indented = "\n".join("          " + line for line in install.splitlines())
    workflow = workflow.replace("          __INSTALL_COMMAND__", indented)
    escaped_marker = "".join("\\" + c if c in r"\.^$*+?{}[]|()" else c for c in marker)
    for token, value in {
        "__BINARY__": binary,
        "__DEMO_COMMAND__": json.dumps(command, ensure_ascii=False),
        "__WAIT_PATTERN__": escaped_marker,
    }.items():
        if tape.count(token) != 1:
            raise ValueError(f"invalid tape template: {token}")
        tape = tape.replace(token, value)
    return workflow, tape


def install_into(args):
    root = args.repo.expanduser().resolve(strict=True)
    if not root.is_dir() or not (root / ".git").exists():
        raise ValueError("--repo must be a Git repository root")
    workflow, tape = render(args)
    files = {
        ".github/workflows/vhs.yml": workflow,
        "demos/vhs/demo.tape": tape,
        "demos/vhs/.gitignore": "outputs/\n",
    }
    # Reject all existing targets or symlinked ancestors before the first write.
    for relative in files:
        cursor = root
        for part in Path(relative).parts:
            cursor = cursor / part
            if cursor.is_symlink():
                raise ValueError(f"refusing symlink: {cursor}")
        if cursor.exists():
            raise ValueError(f"refusing to overwrite: {cursor}")
    for relative, contents in files.items():
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(contents, encoding="utf-8")
        print(f"created {relative}")
    print("Review the install step, marker and outputs before enabling CI.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--binary", required=True)
    parser.add_argument("--install-command", required=True)
    parser.add_argument("--demo-command", required=True)
    parser.add_argument("--wait-for", required=True)
    args = parser.parse_args()
    try:
        install_into(args)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"vhs-ci: {exc}\n")


if __name__ == "__main__":
    sys.exit(main())
