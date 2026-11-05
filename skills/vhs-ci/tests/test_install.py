"""No-VHS installer tests."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "install.py"


class InstallTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        (self.repo / ".git").mkdir()

    def run_install(self, *extra):
        return subprocess.run(
            [sys.executable, str(SCRIPT),
             "--repo", str(self.repo),
             "--binary", "mycli",
             "--install-command", 'echo "$PWD/bin" >> "$GITHUB_PATH"',
             "--demo-command", "mycli --help",
             "--wait-for", "Usage:", *extra],
            capture_output=True, text=True,
        )

    def test_generates_workflow_and_all_artifacts(self):
        result = self.run_install()
        self.assertEqual(result.returncode, 0, result.stderr)
        workflow = (self.repo / ".github/workflows/vhs.yml").read_text()
        tape = (self.repo / "demos/vhs/demo.tape").read_text()
        self.assertIn("on:\n  pull_request:", workflow)
        self.assertIn("permissions:\n  contents: read", workflow)
        self.assertIn("charmbracelet/vhs-action@v2.1.1", workflow)
        self.assertIn('echo "$PWD/bin" >> "$GITHUB_PATH"', workflow)
        self.assertIn("actions/upload-artifact@v4", workflow)
        for line in ("Output outputs/demo.gif", "Output outputs/demo.mp4",
                     "Screenshot outputs/screens/01-demo.png", "Wait+Screen /Usage:/"):
            self.assertIn(line, tape)
        self.assertIn('Type "mycli --help"', tape)
        self.assertEqual((self.repo / "demos/vhs/.gitignore").read_text(), "outputs/\n")
        self.assertNotIn("__INSTALL_COMMAND__", workflow)

    def test_refuses_overwrite(self):
        self.assertEqual(self.run_install().returncode, 0)
        result = self.run_install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("refusing to overwrite", result.stderr)

    def test_rejects_marker_in_command(self):
        result = self.run_install("--wait-for", "--help")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("false-positive wait", result.stderr)
        self.assertFalse((self.repo / "demos").exists())

    def test_rejects_symlinked_path(self):
        (self.repo / ".github").symlink_to(self.repo / ".git", target_is_directory=True)
        result = self.run_install()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("refusing symlink", result.stderr)
        self.assertFalse((self.repo / "demos").exists())


if __name__ == "__main__":
    unittest.main()
