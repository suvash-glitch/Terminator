exports.name = "Git Status";
exports.description = "Run git status in the active terminal";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "git status\n");
    ctx.notify("Running git status");
  } else {
    ctx.notify("No active terminal");
  }
};
