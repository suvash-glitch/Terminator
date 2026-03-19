exports.name = "Greeting";

exports.render = function (ctx) {
  var hour = new Date().getHours();
  var greeting;
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#c792ea;">' +
    greeting + '</span>';
};
