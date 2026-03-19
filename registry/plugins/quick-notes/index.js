exports.activate = function (ctx) {
  var panelId = "quick-notes-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header">',
    '  <h3>Quick Notes</h3>',
    '  <button class="side-panel-close" id="qn-close">',
    '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '  </button>',
    '</div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '  <textarea id="qn-textarea" style="width:100%;height:calc(100vh - 140px);background:var(--t-bg,#0d0d0d);',
    '    color:var(--t-fg,#ccc);border:1px solid var(--t-border,#333);border-radius:6px;padding:10px;',
    '    font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;resize:none;outline:none;"',
    '    placeholder="Type your notes here..."></textarea>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#qn-close").addEventListener("click", function () { toggle(); });
    var textarea = panelEl.querySelector("#qn-textarea");
    if (ctx.settings && ctx.settings.quickNotes) {
      textarea.value = ctx.settings.quickNotes;
    }
    textarea.addEventListener("input", function () {
      if (!ctx.settings) ctx.settings = {};
      ctx.settings.quickNotes = textarea.value;
      ctx.saveSettings();
    });
  }

  ctx.addToolbarButton({
    id: "quick-notes-btn",
    title: "Quick Notes",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
