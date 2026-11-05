# Run from demos/vhs/ so output paths are relative to the tape directory.
Output outputs/demo.gif
Output outputs/demo.mp4

Require __BINARY__
Set Shell bash
Set Width 1100
Set Height 620
Set FontSize 22
Set Theme "Catppuccin Frappe"
Set TypingSpeed 60ms

Type __DEMO_COMMAND__
Enter
Wait+Screen /__WAIT_PATTERN__/
Sleep 300ms
Screenshot outputs/screens/01-demo.png
# VHS queues the screenshot for the next frame.
Sleep 500ms
