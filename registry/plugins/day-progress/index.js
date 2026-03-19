exports.name = "Day Progress";

exports.render = function (ctx) {
  var now = new Date();
  var totalMinutes = now.getHours() * 60 + now.getMinutes();
  var percent = Math.floor((totalMinutes / 1440) * 100);
  var barWidth = 60;
  var filled = Math.round((percent / 100) * barWidth);

  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;display:inline-flex;align-items:center;gap:4px;">' +
    '<span style="display:inline-block;width:' + barWidth + 'px;height:6px;background:#1e1e1e;border-radius:3px;overflow:hidden;">' +
    '<span style="display:block;width:' + filled + 'px;height:100%;background:linear-gradient(90deg,#82aaff,#c792ea);border-radius:3px;"></span>' +
    '</span>' +
    '<span style="color:#82aaff;">' + percent + '%</span>' +
    '</span>';
};
