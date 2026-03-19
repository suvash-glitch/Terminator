exports.name = "Repeat Last Command";
exports.description = "Repeat the last command in the active terminal";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "!!\n");
    ctx.notify("Repeating last command");
  } else {
    ctx.notify("No active terminal");
  }
};
