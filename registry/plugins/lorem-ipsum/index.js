exports.name = "Lorem Ipsum";
exports.description = "Paste lorem ipsum placeholder text into terminal";
exports.shortcut = "";
exports.execute = function (ctx) {
  var pane = ctx.activePane;
  if (pane) {
    var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    ctx.sendInput(pane.id, "echo '" + lorem + "'\n");
    ctx.notify("Lorem ipsum pasted");
  } else {
    ctx.notify("No active terminal");
  }
};
