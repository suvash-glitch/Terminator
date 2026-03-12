/**
 * Docker Dashboard — Extension plugin for Terminator
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

  // ── Toolbar Button ──────────────────────────────────────────────────────
  ctx.addToolbarButton({
    id: "docker-dash-btn",
    title: "Docker Dashboard",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="6" width="13" height="7" rx="1.5"/><rect x="3.5" y="8" width="2" height="2" rx="0.4"/><rect x="7" y="8" width="2" height="2" rx="0.4"/><rect x="10.5" y="8" width="2" height="2" rx="0.4"/><path d="M5 6V4a3 3 0 0 1 6 0v2"/></svg>',
    onClick: function () {
      togglePanel();
    },
  });

  // ── Side Panel ──────────────────────────────────────────────────────────
  var panelHtml = [
    '<div id="dk-root" style="',
    "font-family:'SF Mono',Monaco,Consolas,monospace;",
    "font-size:12px;color:#ccc;background:#111;",
    "height:100%;display:flex;flex-direction:column;overflow:hidden;",
    '">',
    // Header
    '<div style="padding:10px 12px;background:#0d0d0d;border-bottom:1px solid #222;',
    '  display:flex;align-items:center;justify-content:space-between;">',
    '  <span style="font-size:13px;font-weight:600;color:#82aaff;">',
    '    <span style="margin-right:6px;">&#9638;</span>Docker</span>',
    '  <div style="display:flex;gap:6px;align-items:center;">',
    '    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:10px;color:#666;">',
    '      <input type="checkbox" id="dk-auto" checked style="accent-color:#82aaff;"> Auto</label>',
    '    <button id="dk-refresh" style="background:none;border:1px solid #333;',
    '      color:#888;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">',
    "      Refresh</button>",
    "  </div>",
    "</div>",
    // Content
    '<div id="dk-content" style="flex:1;overflow-y:auto;padding:8px 12px;">',
    '  <div style="color:#555;text-align:center;padding:30px 0;">Loading containers...</div>',
    "</div>",
    "</div>",
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.style.display = "none";

    panelEl.querySelector("#dk-refresh").addEventListener("click", function () {
      refreshData();
    });

    var autoChk = panelEl.querySelector("#dk-auto");
    autoChk.addEventListener("change", function () {
      autoRefresh = this.checked;
      if (autoRefresh && panelVisible) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelEl) {
      panelEl.style.display = panelVisible ? "" : "none";
    }
    if (panelVisible) {
      refreshData();
      if (autoRefresh) startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(refreshData, 10000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ── Data ────────────────────────────────────────────────────────────────
  function refreshData() {
    var contentEl = panelEl ? panelEl.querySelector("#dk-content") : null;
    if (!contentEl) return;

    Promise.resolve()
      .then(function () {
        return ctx.ipc.dockerPs();
      })
      .then(function (data) {
        containers = Array.isArray(data) ? data : [];
        renderContainers(contentEl);
      })
      .catch(function () {
        containers = [];
        contentEl.innerHTML =
          '<div style="color:#555;text-align:center;padding:30px 0;">' +
          "Docker not available or not running.<br>" +
          '<span style="font-size:11px;color:#444;">Make sure Docker Desktop is running.</span></div>';
      });
  }

  function renderContainers(el) {
    if (containers.length === 0) {
      el.innerHTML =
        '<div style="color:#555;text-align:center;padding:30px 0;">' +
        "No containers running.<br>" +
        '<span style="font-size:11px;color:#444;">Start a container to see it here.</span></div>';
      return;
    }

    var html =
      '<div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">' +
      containers.length +
      " container" +
      (containers.length !== 1 ? "s" : "") +
      "</div>";

    containers.forEach(function (c, i) {
      var isRunning =
        c.State === "running" || (c.Status && c.Status.indexOf("Up") >= 0);
      var statusColor = isRunning ? "#73c991" : "#e06c75";
      var statusDot = isRunning ? "\u25CF" : "\u25CB";

      html +=
        '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:10px;margin-bottom:6px;">';

      // Name and status
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      html +=
        '<div style="font-weight:600;color:#82aaff;font-size:12px;">' +
        escHtml(c.Names || c.Name || "unnamed") +
        "</div>";
      html +=
        '<span style="color:' +
        statusColor +
        ';font-size:11px;">' +
        statusDot +
        " " +
        escHtml(c.State || "unknown") +
        "</span>";
      html += "</div>";

      // Image
      html +=
        '<div style="color:#666;font-size:11px;margin-bottom:4px;">Image: ' +
        escHtml(c.Image || "—") +
        "</div>";

      // Ports
      if (c.Ports) {
        html +=
          '<div style="color:#555;font-size:10px;margin-bottom:6px;">Ports: ' +
          escHtml(c.Ports) +
          "</div>";
      }

      // Action buttons
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

      html += "</div></div>";
    });

    el.innerHTML = html;

    // Attach action handlers
    el.querySelectorAll("[data-dk-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-dk-idx"), 10);
        var action = this.getAttribute("data-dk-action");
        handleAction(idx, action);
      });
    });
  }

  function actionBtn(idx, action, label, color) {
    return (
      '<button data-dk-idx="' +
      idx +
      '" data-dk-action="' +
      action +
      '" style="' +
      "background:" +
      color +
      "18;border:1px solid " +
      color +
      "44;color:" +
      color +
      ";" +
      'border-radius:3px;padding:3px 8px;cursor:pointer;font-size:10px;font-family:inherit;">' +
      label +
      "</button>"
    );
  }

  function handleAction(idx, action) {
    var c = containers[idx];
    if (!c) return;
    if (!ctx.activeId) {
      ctx.showToast("No active terminal");
      return;
    }

    var name = c.Names || c.Name || c.ID || "";
    var cmd = "";

    switch (action) {
      case "stop":
        cmd = "docker stop " + name;
        break;
      case "start":
        cmd = "docker start " + name;
        break;
      case "restart":
        cmd = "docker restart " + name;
        break;
      case "logs":
        cmd = "docker logs --tail 50 -f " + name;
        break;
      case "exec":
        cmd = "docker exec -it " + name + " /bin/sh";
        break;
      case "rm":
        cmd = "docker rm " + name;
        break;
      default:
        return;
    }

    ctx.sendInput(ctx.activeId, cmd + "\n");
    ctx.showToast("Running: " + cmd);

    // Refresh after state-changing actions
    if (action !== "logs" && action !== "exec") {
      setTimeout(refreshData, 2000);
    }
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Command Palette ─────────────────────────────────────────────────────
  ctx.registerCommand({
    label: "Docker: List Containers",
    category: "Docker",
    action: function () {
      if (ctx.activeId) {
        ctx.sendInput(ctx.activeId, "docker ps -a\n");
      }
    },
  });

  ctx.registerCommand({
    label: "Docker: Stop All",
    category: "Docker",
    action: function () {
      if (ctx.activeId) {
        ctx.sendInput(
          ctx.activeId,
          "docker stop $(docker ps -q) 2>/dev/null && echo 'All containers stopped' || echo 'No running containers'\n"
        );
        ctx.showToast("Stopping all containers...");
      }
    },
  });

  ctx.registerCommand({
    label: "Docker: Open Dashboard",
    category: "Docker",
    action: function () {
      if (!panelVisible) togglePanel();
    },
  });
};
