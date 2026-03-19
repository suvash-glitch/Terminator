exports.name = "Word Clock";

exports.render = function (ctx) {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();

  var nums = ["twelve", "one", "two", "three", "four", "five", "six",
              "seven", "eight", "nine", "ten", "eleven", "twelve"];
  var hour12 = h % 12;
  var nextHour = (hour12 + 1) % 12;
  var timeWords;

  if (m === 0) {
    timeWords = nums[hour12] + " o'clock";
  } else if (m === 15) {
    timeWords = "quarter past " + nums[hour12];
  } else if (m === 30) {
    timeWords = "half past " + nums[hour12];
  } else if (m === 45) {
    timeWords = "quarter to " + nums[nextHour];
  } else if (m < 30) {
    timeWords = m + " past " + nums[hour12];
  } else {
    timeWords = (60 - m) + " to " + nums[nextHour];
  }

  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#f07178;font-style:italic;">' +
    timeWords + '</span>';
};
