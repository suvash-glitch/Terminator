exports.name = "Show Weather";
exports.description = "Show current weather using wttr.in";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, "curl -s wttr.in/?format=3\n");
    ctx.notify("Fetching weather");
  } else {
    ctx.notify("No active terminal");
  }
};
