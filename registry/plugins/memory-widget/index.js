exports.name = "Memory";

exports.render = function (ctx) {
  var memStr = "Mem: --";
  if (typeof performance !== "undefined" && performance.memory) {
    var used = performance.memory.usedJSHeapSize;
    var mb = (used / 1048576).toFixed(1);
    memStr = "Mem: " + mb + "MB";
  }
  return '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;color:#f78c6c;">' + memStr + '</span>';
};
