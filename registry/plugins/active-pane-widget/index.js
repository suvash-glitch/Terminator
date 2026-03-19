exports.name = "Active Pane";

exports.render = function (ctx) {
  var label = "none";
  if (ctx.activePane) {
    label = ctx.activePane.title || ctx.activePane.process || ("pane:" + ctx.activePane.id);
    if (label.length > 20) label = label.substring(0, 20) + "...";
  }
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#ffcb6b;">' +
    escHtml(label) + '</span>';
};

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
