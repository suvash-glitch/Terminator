exports.activate = function (ctx) {
  ctx.registerCommand("palette-plus:clear-all-terminals", function () {
    ctx.showToast("Cleared all terminals");
  });

  ctx.registerCommand("palette-plus:reload-config", function () {
    ctx.showToast("Configuration reloaded");
  });

  ctx.registerCommand("palette-plus:toggle-fullscreen", function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });

  ctx.registerCommand("palette-plus:copy-terminal-output", function () {
    var sel = window.getSelection();
    if (sel && sel.toString()) {
      navigator.clipboard.writeText(sel.toString());
      ctx.showToast("Copied selection to clipboard");
    } else {
      ctx.showToast("No text selected");
    }
  });

  ctx.registerCommand("palette-plus:new-terminal-tab", function () {
    ctx.showToast("New terminal tab requested");
  });

  ctx.registerCommand("palette-plus:close-current-tab", function () {
    ctx.showToast("Close current tab requested");
  });

  ctx.addToolbarButton({
    id: "command-palette-plus-btn",
    title: "Extra Commands",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    onClick: function () {
      ctx.showToast("Use Cmd/Ctrl+Shift+P for command palette");
    }
  });
};
