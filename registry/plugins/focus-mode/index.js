exports.activate = function (ctx) {
  var active = false;
  var styleEl = document.createElement("style");
  styleEl.textContent = [
    ".focus-mode-active #titlebar { display: none !important; }",
    ".focus-mode-active #bottombar { display: none !important; }",
    ".focus-mode-active .pane-header { display: none !important; }",
    ".focus-mode-active #grid { top: 0 !important; bottom: 0 !important; }"
  ].join("\n");
  document.head.appendChild(styleEl);

  ctx.addToolbarButton({
    id: "focus-mode-btn",
    title: "Focus Mode",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    onClick: function () {
      active = !active;
      if (active) {
        document.body.classList.add("focus-mode-active");
        ctx.showToast("Focus mode ON");
      } else {
        document.body.classList.remove("focus-mode-active");
        ctx.showToast("Focus mode OFF");
      }
    }
  });

  ctx.registerCommand({
    label: "Toggle Focus Mode",
    category: "View",
    action: function () {
      active = !active;
      if (active) {
        document.body.classList.add("focus-mode-active");
        ctx.showToast("Focus mode ON");
      } else {
        document.body.classList.remove("focus-mode-active");
        ctx.showToast("Focus mode OFF");
      }
    }
  });
};
