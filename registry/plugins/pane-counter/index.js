exports.name = "Pane Counter";

exports.render = function (ctx) {
  var count = 0;
  if (ctx.allPanes && Array.isArray(ctx.allPanes)) {
    count = ctx.allPanes.length;
  }
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#82aaff;">' +
    count + " pane" + (count !== 1 ? "s" : "") + '</span>';
};
