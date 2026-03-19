exports.activate = function (ctx) {
  var panelId = "k8s-status-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>K8s Status</h3>',
    '<button class="side-panel-close" id="k8s-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="display:flex;gap:4px;margin-bottom:10px;">',
    '<input id="k8s-ns" type="text" value="default" placeholder="Namespace" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;outline:none;">',
    '<button id="k8s-refresh" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Refresh</button>',
    '</div>',
    '<div id="k8s-pods" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#k8s-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#k8s-refresh").addEventListener("click", refresh);
  }

  function refresh() {
    var ns = panelEl.querySelector("#k8s-ns").value.trim() || "default";
    var pods = panelEl.querySelector("#k8s-pods");
    pods.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:10px;">Loading pods...</div>';
    try {
      var exec = require("child_process").execSync;
      var output = exec("kubectl get pods -n " + ns + " -o json 2>&1", { encoding: "utf8", timeout: 10000 });
      var data = JSON.parse(output);
      var items = data.items || [];
      var h = "";
      if (items.length === 0) {
        h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No pods found in ' + esc(ns) + '</div>';
      }
      items.forEach(function (pod) {
        var name = pod.metadata.name;
        var phase = pod.status.phase;
        var color = phase === "Running" ? "#c3e88d" : phase === "Pending" ? "#ffcb6b" : "#ff5370";
        var ready = "0/0";
        if (pod.status.containerStatuses) {
          var rdy = pod.status.containerStatuses.filter(function (c) { return c.ready; }).length;
          ready = rdy + "/" + pod.status.containerStatuses.length;
        }
        h += '<div style="padding:6px 0;border-bottom:1px solid var(--t-border,#222);">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        h += '<span style="color:var(--t-fg);word-break:break-all;">' + esc(name) + '</span>';
        h += '<span style="color:' + color + ';font-size:10px;white-space:nowrap;margin-left:8px;">' + esc(phase) + ' (' + ready + ')</span>';
        h += '</div></div>';
      });
      pods.innerHTML = h;
    } catch (e) {
      pods.innerHTML = '<div style="color:#ff5370;padding:10px;">' + esc(e.message || String(e)) + '</div>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("k8s-status:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "k8s-status-btn",
    title: "K8s Status",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
