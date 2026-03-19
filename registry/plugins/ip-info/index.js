exports.name = "Show IP Info";
exports.description = "Show IP addresses using ifconfig";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "ifconfig | grep inet\n");
    ctx.notify("Showing IP addresses");
  } else {
    ctx.notify("No active terminal");
  }
};
