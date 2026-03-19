exports.name = "Top Processes";
exports.description = "Show top processes by CPU usage";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "top -l 1 -n 10 -s 0 | head -20\n");
    ctx.notify("Showing top processes");
  } else {
    ctx.notify("No active terminal");
  }
};
