exports.name = "Pane Activity";

exports.render = function (ctx) {
  var panes = ctx.allPanes;
  if (!panes || !Array.isArray(panes) || panes.length === 0) {
    return '<span style="font-size:11px;color:var(--t-fg);opacity:0.4;">No panes</span>';
  }
  var dots = "";
  for (var i = 0; i < panes.length; i++) {
    var isActive = ctx.activePane && panes[i].id === ctx.activePane.id;
    var color = isActive ? "#c3e88d" : "#546e7a";
    dots += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' +
      color + ';margin:0 2px;' + (isActive ? 'box-shadow:0 0 4px ' + color + ';' : '') +
      '"></span>';
  }
  return '<span style="display:inline-flex;align-items:center;gap:1px;">' + dots + '</span>';
};
