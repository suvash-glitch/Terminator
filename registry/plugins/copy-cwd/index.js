exports.name = "Copy Working Directory";
exports.description = "Copy the current working directory to clipboard";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "pwd | pbcopy\n");
    ctx.notify("Working directory copied to clipboard");
  } else {
    ctx.notify("No active terminal");
  }
};
