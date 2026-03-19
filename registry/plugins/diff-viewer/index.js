exports.activate = function (ctx) {
  var panelId = "diff-viewer-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Diff Viewer</h3>',
    '<button class="side-panel-close" id="dv-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Original</label>',
    '<textarea id="dv-left" style="width:100%;height:120px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Paste original text..."></textarea>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Modified</label>',
    '<textarea id="dv-right" style="width:100%;height:120px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Paste modified text..."></textarea>',
    '<button id="dv-compare" style="width:100%;background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:8px;cursor:pointer;font-size:12px;margin-bottom:10px;">Compare</button>',
    '<div id="dv-result" style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;min-height:60px;overflow:auto;max-height:calc(100vh - 560px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#dv-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#dv-compare").addEventListener("click", compare);
  }

  function compare() {
    var left = panelEl.querySelector("#dv-left").value.split("\n");
    var right = panelEl.querySelector("#dv-right").value.split("\n");
    var result = panelEl.querySelector("#dv-result");
    var maxLen = Math.max(left.length, right.length);
    var h = "";
    for (var i = 0; i < maxLen; i++) {
      var l = left[i] || "";
      var r = right[i] || "";
      var lineNum = String(i + 1);
      if (l === r) {
        h += '<div style="padding:1px 4px;color:var(--t-fg);opacity:0.7;"><span style="opacity:0.4;margin-right:8px;">' + lineNum + '</span>' + esc(l) + '</div>';
      } else {
        if (l) h += '<div style="padding:1px 4px;background:#ff537022;color:#ff5370;"><span style="opacity:0.4;margin-right:8px;">' + lineNum + '</span>- ' + esc(l) + '</div>';
        if (r) h += '<div style="padding:1px 4px;background:#c3e88d22;color:#c3e88d;"><span style="opacity:0.4;margin-right:8px;">' + lineNum + '</span>+ ' + esc(r) + '</div>';
      }
    }
    result.innerHTML = h || '<span style="opacity:0.4;">No differences found</span>';
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("diff-viewer:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "diff-viewer-btn",
    title: "Diff Viewer",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18"/><path d="M3 12h18"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
