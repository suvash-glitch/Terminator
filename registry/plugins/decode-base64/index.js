exports.name = "Decode Base64";
exports.description = "Decode base64 content from clipboard";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "pbpaste | base64 -d\n");
    ctx.notify("Decoding base64 from clipboard");
  } else {
    ctx.notify("No active terminal");
  }
};
