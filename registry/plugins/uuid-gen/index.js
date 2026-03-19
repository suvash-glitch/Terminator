exports.name = "Generate UUID";
exports.description = "Generate a UUID using uuidgen";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "uuidgen\n");
    ctx.notify("Generating UUID");
  } else {
    ctx.notify("No active terminal");
  }
};
