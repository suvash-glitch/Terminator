exports.name = "Open in Finder";
exports.description = "Open the current directory in Finder";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "open .\n");
    ctx.notify("Opening directory in Finder");
  } else {
    ctx.notify("No active terminal");
  }
};
