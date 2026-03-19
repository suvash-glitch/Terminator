exports.name = "Clear All Panes";
exports.description = "Clear all terminal pane buffers";
exports.shortcut = "";
exports.execute = function (ctx) {
  var panes = ctx.allPanes;
  if (panes && panes.length > 0) {
    for (var i = 0; i < panes.length; i++) {
      ctx.sendInput(panes[i].id, "clear\n");
    }
    ctx.notify("Cleared " + panes.length + " pane(s)");
  } else {
    ctx.notify("No panes to clear");
  }
};
