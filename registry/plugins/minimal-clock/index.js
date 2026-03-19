exports.name = "Minimal Clock";

exports.render = function (ctx) {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  var time = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;color:var(--t-fg);letter-spacing:1px;">' + time + '</span>';
};
