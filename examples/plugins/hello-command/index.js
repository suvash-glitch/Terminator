exports.name = "Say Hello";
exports.description = "Sends a hello message to the active terminal";
exports.shortcut = "";
exports.execute = function (context) {
  var pane = context.activePane;
  if (pane) {
    context.sendInput(pane.id, "echo 'Hello from Shellfire plugin!'\n");
    context.notify("Hello plugin executed!");
  } else {
    context.notify("No active terminal");
  }
};
