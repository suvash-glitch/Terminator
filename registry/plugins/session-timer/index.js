exports.name = "Session Timer";

var _sessionStart = Date.now();

exports.render = function (ctx) {
  var elapsed = Math.floor((Date.now() - _sessionStart) / 1000);
  var h = Math.floor(elapsed / 3600);
  var m = Math.floor((elapsed % 3600) / 60);
  var s = elapsed % 60;
  var str = (h < 10 ? "0" : "") + h + ":" +
            (m < 10 ? "0" : "") + m + ":" +
            (s < 10 ? "0" : "") + s;
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#89ddff;">Session: ' + str + '</span>';
};
