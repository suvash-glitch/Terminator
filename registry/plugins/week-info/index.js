exports.name = "Week Info";

exports.render = function (ctx) {
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var now = new Date();
  var dayName = days[now.getDay()];

  var start = new Date(now.getFullYear(), 0, 1);
  var diff = now - start;
  var oneWeek = 604800000;
  var weekNum = Math.ceil((diff / oneWeek) + 1);

  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#ffcb6b;">' +
    dayName + ' | W' + weekNum + '</span>';
};
