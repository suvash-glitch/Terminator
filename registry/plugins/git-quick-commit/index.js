exports.name = "Git Quick Commit";
exports.description = "Git add all and commit with a quick message";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    ctx.sendInput(pane.id, 'git add -A && git commit -m "quick commit"\n');
    ctx.notify("Running git add + commit");
  } else {
    ctx.notify("No active terminal");
  }
};
