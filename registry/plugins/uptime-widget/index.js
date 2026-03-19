exports.name = "Uptime";

var _startTime = Date.now();

exports.render = function (ctx) {
  var elapsed = Math.floor((Date.now() - _startTime) / 1000);
  var hours = Math.floor(elapsed / 3600);
  var minutes = Math.floor((elapsed % 3600) / 60);
  var seconds = elapsed % 60;
  var parts = [];
  if (hours > 0) parts.push(hours + "h");
  parts.push(minutes + "m");
  parts.push(seconds + "s");
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#c3e88d;">' +
    parts.join(" ") + '</span>';
};
