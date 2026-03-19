exports.name = "Kill Process";
exports.description = "Send Ctrl+C to the active pane";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "\x03");
    ctx.notify("Sent Ctrl+C to active pane");
  } else {
    ctx.notify("No active terminal");
  }
};
