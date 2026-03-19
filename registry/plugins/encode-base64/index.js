exports.name = "Encode Base64";
exports.description = "Encode clipboard contents to base64";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "pbpaste | base64\n");
    ctx.notify("Encoding clipboard to base64");
  } else {
    ctx.notify("No active terminal");
  }
};
