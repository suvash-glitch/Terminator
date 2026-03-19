exports.name = "List NPM Scripts";
exports.description = "List npm scripts from package.json";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, 'cat package.json | grep -A 50 scripts\n');
    ctx.notify("Listing npm scripts");
  } else {
    ctx.notify("No active terminal");
  }
};
