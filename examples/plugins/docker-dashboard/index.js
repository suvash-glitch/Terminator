/**
 * Docker Dashboard — Extension plugin for Shellfire
 *
 * Container management side panel with live status, action buttons,
 * and command palette integration for common Docker operations.
 */

exports.activate = function (ctx) {
  var panelId = "docker-dash-panel";
  var panelEl = null;
  var panelVisible = false;
  var autoRefresh = true;
  var refreshTimer = null;
  var containers = [];

  ctx.addToolbarButton({
    id: "docker-dash-btn",
    title: "Docker Dashboard",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="6" width="13" height="7" rx="1.5"/><rect x="3.5" y="8" width="2" height="2" rx="0.4"/><rect x="7" y="8" width="2" height="2" rx="0.4"/><rect x="10.5" y="8" width="2" height="2" rx="0.4"/><path d="M5 6V4a3 3 0 0 1 6 0v2"/></svg>',
    onClick: function () { togglePanel(); },
  });

  var panelHtml = [
    '<div class="side-panel-header">',
    '  <h3>Docker</h3>',
    '  <div style="display:flex;gap:6px;align-items:center;">',
    '    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:10px;color:var(--t-fg);opacity:0.5;">',
    '      <input type="checkbox" id="dk-auto" checked style="accent-color:var(--t-accent);"> Auto</label>',
    '    <button id="dk-refresh" style="background:none;border:1px solid var(--t-border);',
    '      color:var(--t-fg);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;opacity:0.7;">Refresh</button>',
    '    <button class="side-panel-close" id="dk-close">',
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '    </button>',
    '  </div>',
    '</div>',
    '<div class="side-panel-body" id="dk-content" style="padding:8px 12px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;">',
    '  <div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">Loading containers...</div>',
    '</div>',
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.querySelector("#dk-refresh").addEventListener("click", function () { refreshData(); });
    panelEl.querySelector("#dk-close").addEventListener("click", function () { closePanel(); });
    var autoChk = panelEl.querySelector("#dk-auto");
    autoChk.addEventListener("change", function () {
      autoRefresh = this.checked;
      if (autoRefresh && panelVisible) startAutoRefresh(); else stopAutoRefresh();
    });
  }

  document.getElementById("grid").addEventListener("mousedown", function () {
    if (panelVisible) closePanel();
  });

  function togglePanel() { if (panelVisible) closePanel(); else openPanel(); }
  function openPanel() {
    panelVisible = true;
    if (panelEl) panelEl.classList.add("visible");
    refreshData();
    if (autoRefresh) startAutoRefresh();
  }
  function closePanel() {
    panelVisible = false;
    if (panelEl) panelEl.classList.remove("visible");
    stopAutoRefresh();
  }

  function startAutoRefresh() { stopAutoRefresh(); refreshTimer = setInterval(refreshData, 10000); }
  function stopAutoRefresh() { if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; } }

  function refreshData() {
    var contentEl = panelEl ? panelEl.querySelector("#dk-content") : null;
    if (!contentEl) return;
    Promise.resolve()
      .then(function () { return ctx.ipc.dockerPs(); })
      .then(function (data) { containers = Array.isArray(data) ? data : []; renderContainers(contentEl); })
      .catch(function () {
        containers = [];
        contentEl.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">Docker not available or not running.</div>';
      });
  }

  function renderContainers(el) {
    if (containers.length === 0) {
      el.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">No containers running.</div>';
      return;
    }
    var html = '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">' +
      containers.length + " container" + (containers.length !== 1 ? "s" : "") + '</div>';

    containers.forEach(function (c, i) {
      var isRunning = c.State === "running" || (c.Status && c.Status.indexOf("Up") >= 0);
      var statusColor = isRunning ? "#73c991" : "#e06c75";
      var statusDot = isRunning ? "\u25CF" : "\u25CB";
      html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;margin-bottom:6px;">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      html += '<div style="font-weight:600;color:var(--t-accent);font-size:12px;">' + esc(c.Names || c.Name || "unnamed") + '</div>';
      html += '<span style="color:' + statusColor + ';font-size:11px;">' + statusDot + ' ' + esc(c.State || "unknown") + '</span>';
      html += '</div>';
      html += '<div style="color:var(--t-fg);opacity:0.5;font-size:11px;margin-bottom:4px;">Image: ' + esc(c.Image || "\u2014") + '</div>';
      if (c.Ports) html += '<div style="color:var(--t-fg);opacity:0.4;font-size:10px;margin-bottom:6px;">Ports: ' + esc(c.Ports) + '</div>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
      if (isRunning) {
        html += actionBtn(i, "stop", "Stop", "#e06c75");
        html += actionBtn(i, "restart", "Restart", "#e2c08d");
        html += actionBtn(i, "logs", "Logs", "#82aaff");
        html += actionBtn(i, "exec", "Shell", "#c792ea");
      } else {
        html += actionBtn(i, "start", "Start", "#73c991");
        html += actionBtn(i, "rm", "Remove", "#e06c75");
      }
      html += '</div></div>';
    });
    el.innerHTML = html;
    el.querySelectorAll("[data-dk-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleAction(parseInt(this.getAttribute("data-dk-idx"), 10), this.getAttribute("data-dk-action"));
      });
    });
  }

  function actionBtn(idx, action, label, color) {
    return '<button data-dk-idx="' + idx + '" data-dk-action="' + action +
      '" style="background:' + color + '18;border:1px solid ' + color + '44;color:' + color +
      ';border-radius:3px;padding:3px 8px;cursor:pointer;font-size:10px;font-family:inherit;">' + label + '</button>';
  }

  function handleAction(idx, action) {
    var c = containers[idx];
    if (!c || !ctx.activeId) { ctx.showToast("No active terminal"); return; }
    var name = c.Names || c.Name || c.ID || "";
    var cmd = "";
    switch (action) {
      case "stop": cmd = "docker stop " + name; break;
      case "start": cmd = "docker start " + name; break;
      case "restart": cmd = "docker restart " + name; break;
      case "logs": cmd = "docker logs --tail 50 -f " + name; break;
      case "exec": cmd = "docker exec -it " + name + " /bin/sh"; break;
      case "rm": cmd = "docker rm " + name; break;
      default: return;
    }
    ctx.sendInput(ctx.activeId, cmd + "\n");
    ctx.showToast("Running: " + cmd);
    if (action !== "logs" && action !== "exec") setTimeout(refreshData, 2000);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand({ label: "Docker: List Containers", category: "Docker", action: function () { if (ctx.activeId) ctx.sendInput(ctx.activeId, "docker ps -a\n"); } });
  ctx.registerCommand({ label: "Docker: Stop All", category: "Docker", action: function () { if (ctx.activeId) { ctx.sendInput(ctx.activeId, "docker stop $(docker ps -q) 2>/dev/null && echo 'All stopped' || echo 'None running'\n"); ctx.showToast("Stopping all..."); } } });
  ctx.registerCommand({ label: "Docker: Open Dashboard", category: "Docker", action: function () { if (!panelVisible) togglePanel(); } });
};
