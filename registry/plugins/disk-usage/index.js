exports.name = "Disk Usage";
exports.description = "Show disk usage summary";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "df -h\n");
    ctx.notify("Showing disk usage");
  } else {
    ctx.notify("No active terminal");
  }
};
