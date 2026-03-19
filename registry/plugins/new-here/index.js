exports.name = "New Terminal Here";
exports.description = "Open a new terminal at the same directory";
exports.shortcut = "";
exports.execute = function (ctx) {
  ctx.createTerminal();
  ctx.notify("New terminal created");
};
