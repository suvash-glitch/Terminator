exports.name = "Date";

exports.render = function (ctx) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var now = new Date();
  var month = months[now.getMonth()];
  var day = now.getDate();
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#c792ea;">' + month + " " + day + '</span>';
};
