exports.activate = function (ctx) {
  var panelId = "todo-scanner-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>TODO Scanner</h3>',
    '<button class="side-panel-close" id="td-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="display:flex;gap:4px;margin-bottom:10px;">',
    '<input id="td-path" type="text" placeholder="Directory to scan..." style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '<button id="td-scan" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Scan</button>',
    '</div>',
    '<div id="td-results" style="font-family:monospace;font-size:11px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#td-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#td-scan").addEventListener("click", scan);
    panelEl.querySelector("#td-path").addEventListener("keydown", function (e) {
      if (e.key === "Enter") scan();
    });
  }

  function scan() {
    var dir = panelEl.querySelector("#td-path").value.trim();
    var results = panelEl.querySelector("#td-results");
    if (!dir) { results.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">Enter a directory path</div>'; return; }
    results.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:10px;">Scanning...</div>';
    try {
      var exec = require("child_process").execSync;
      var cmd = "grep -rn \"TODO\\|FIXME\\|HACK\\|XXX\" " + JSON.stringify(dir) + " --include=\"*.js\" --include=\"*.ts\" --include=\"*.py\" --include=\"*.go\" --include=\"*.java\" 2>/dev/null || true";
      var output = exec(cmd, { encoding: "utf8", timeout: 10000 });
      var lines = output.trim().split("\n").filter(function (l) { return l.length > 0; });
      var h = "";
      if (lines.length === 0) {
        h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No TODOs found</div>';
      }
      var shown = Math.min(lines.length, 200);
      for (var i = 0; i < shown; i++) {
        var line = lines[i];
        var tag = "TODO";
        var tagColor = "#ffcb6b";
        if (line.indexOf("FIXME") !== -1) { tag = "FIXME"; tagColor = "#ff5370"; }
        else if (line.indexOf("HACK") !== -1) { tag = "HACK"; tagColor = "#f78c6c"; }
        else if (line.indexOf("XXX") !== -1) { tag = "XXX"; tagColor = "#c792ea"; }
        h += '<div style="padding:4px 0;border-bottom:1px solid var(--t-border,#111);">';
        h += '<span style="color:' + tagColor + ';font-size:10px;font-weight:bold;margin-right:6px;">' + tag + '</span>';
        h += '<span style="color:var(--t-fg);opacity:0.8;word-break:break-all;">' + esc(line) + '</span>';
        h += '</div>';
      }
      if (lines.length > shown) {
        h += '<div style="color:var(--t-fg);opacity:0.4;padding:8px;text-align:center;">...and ' + (lines.length - shown) + ' more</div>';
      }
      results.innerHTML = h;
    } catch (e) {
      results.innerHTML = '<div style="color:#ff5370;padding:10px;">' + esc(e.message) + '</div>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("todo-scanner:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "todo-scanner-btn",
    title: "TODO Scanner",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
