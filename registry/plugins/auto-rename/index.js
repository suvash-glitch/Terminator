exports.activate = function (ctx) {
  ctx.on("terminalInput", function (data) {
    if (!data || !data.paneId || !data.input) return;
    var input = data.input.trim();

    var cdMatch = input.match(/^cd\s+(.+)/);
    if (cdMatch) {
      var dir = cdMatch[1].replace(/^~/, "HOME").replace(/\/+$/, "");
      var parts = dir.split("/");
      var shortName = parts[parts.length - 1] || dir;
      if (shortName.length > 20) shortName = shortName.substring(0, 20) + "...";
      var pane = ctx.getPane(data.paneId);
      if (pane && pane.setTitle) {
        pane.setTitle(shortName);
      }
      var header = document.querySelector('[data-pane-id="' + data.paneId + '"] .pane-title');
      if (header) header.textContent = shortName;
    }

    var sshMatch = input.match(/^ssh\s+(?:[\w-]+@)?([\w.-]+)/);
    if (sshMatch) {
      var host = sshMatch[1];
      if (host.length > 20) host = host.substring(0, 20) + "...";
      var header2 = document.querySelector('[data-pane-id="' + data.paneId + '"] .pane-title');
      if (header2) header2.textContent = "ssh:" + host;
    }
  });
};
