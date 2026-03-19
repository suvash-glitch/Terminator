exports.name = "Directory Tree";
exports.description = "Show directory tree structure (3 levels deep)";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "find . -maxdepth 3 -not -path '*/.*' | head -50\n");
    ctx.notify("Showing directory tree");
  } else {
    ctx.notify("No active terminal");
  }
};
