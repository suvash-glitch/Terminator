exports.name = "Insert Timestamp";
exports.description = "Insert current ISO timestamp into the active terminal";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    var now = new Date().toISOString();
    ctx.sendInput(pane.id, now);
    ctx.notify("Timestamp inserted: " + now);
  } else {
    ctx.notify("No active terminal");
  }
};
