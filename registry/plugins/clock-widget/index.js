exports.name = "Clock";

exports.render = function (ctx) {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  var s = now.getSeconds();
  var time = (h < 10 ? "0" : "") + h + ":" +
             (m < 10 ? "0" : "") + m + ":" +
             (s < 10 ? "0" : "") + s;
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#7fdbca;">' + time + '</span>';
};
