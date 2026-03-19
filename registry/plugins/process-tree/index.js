exports.activate = function (ctx) {
  var panelId = "process-tree-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Process Tree</h3>',
    '<button class="side-panel-close" id="pt-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="display:flex;gap:4px;margin-bottom:10px;">',
    '<input id="pt-filter" type="text" placeholder="Filter processes..." style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '<button id="pt-refresh" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Refresh</button>',
    '</div>',
    '<div id="pt-list" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#pt-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#pt-refresh").addEventListener("click", refresh);
    panelEl.querySelector("#pt-filter").addEventListener("input", refresh);
  }

  function refresh() {
    var filter = panelEl.querySelector("#pt-filter").value.toLowerCase();
    var list = panelEl.querySelector("#pt-list");
    list.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:10px;">Loading...</div>';
    try {
      var exec = require("child_process").execSync;
      var cmd = process.platform === "win32" ? "tasklist /fo csv /nh" : "ps aux --sort=-%mem 2>/dev/null || ps aux";
      var output = exec(cmd, { encoding: "utf8", timeout: 5000 });
      var lines = output.trim().split("\n");
      var h = "";
      var count = 0;
      lines.forEach(function (line) {
        if (filter && line.toLowerCase().indexOf(filter) === -1) return;
        if (count >= 100) return;
        count++;
        var parts = line.trim().split(/\s+/);
        var user = parts[0] || "";
        var pid = parts[1] || "";
        var cpu = parts[2] || "";
        var mem = parts[3] || "";
        var cmd = parts.slice(10).join(" ") || parts.slice(4).join(" ");
        h += '<div style="padding:4px 0;border-bottom:1px solid var(--t-border,#111);display:flex;gap:8px;">';
        h += '<span style="color:#ffcb6b;min-width:50px;">' + esc(pid) + '</span>';
        h += '<span style="color:#82aaff;min-width:40px;">' + esc(cpu) + '%</span>';
        h += '<span style="color:#c3e88d;min-width:40px;">' + esc(mem) + '%</span>';
        h += '<span style="color:var(--t-fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(cmd) + '</span>';
        h += '</div>';
      });
      list.innerHTML = h || '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No processes match filter</div>';
    } catch (e) {
      list.innerHTML = '<div style="color:#ff5370;padding:10px;">' + esc(e.message) + '</div>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("process-tree:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "process-tree-btn",
    title: "Process Tree",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="6" height="5" rx="1"/><rect x="16" y="3" width="6" height="5" rx="1"/><rect x="9" y="16" width="6" height="5" rx="1"/><path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8"/><path d="M12 13v3"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
