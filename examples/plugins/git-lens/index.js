/**
 * Git Lens — Extension plugin for Terminator
 *
 * Provides a side panel with git branch info, modified files, recent commits,
 * and command palette entries for common git operations.
 */

exports.activate = function (ctx) {
  var panelId = "git-lens-panel";
  var refreshTimer = null;
  var panelEl = null;
  var panelVisible = false;

  // ── Toolbar Button ──────────────────────────────────────────────────────
  ctx.addToolbarButton({
    id: "git-lens-btn",
    title: "Git Lens",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3.5"/><path d="M13.5 13.5 9 9"/><path d="M6 4v4"/><path d="M4 6h4"/></svg>',
    onClick: function () {
      togglePanel();
    },
  });

  // ── Side Panel ──────────────────────────────────────────────────────────
  var panelHtml = [
    '<div id="gl-root" style="',
    "font-family:'SF Mono',Monaco,Consolas,monospace;",
    "font-size:12px;color:#ccc;background:#111;",
    "height:100%;display:flex;flex-direction:column;",
    'overflow:hidden;">',
    '  <div style="padding:10px 12px;background:#0d0d0d;border-bottom:1px solid #222;',
    '    display:flex;align-items:center;justify-content:space-between;">',
    '    <span style="font-size:13px;font-weight:600;color:#7fdbca;">',
    '      <span style="margin-right:6px;">&#9699;</span>Git Lens</span>',
    '    <button id="gl-refresh" style="background:none;border:1px solid #333;',
    '      color:#888;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">',
    "      Refresh</button>",
    "  </div>",
    '  <div id="gl-content" style="flex:1;overflow-y:auto;padding:10px 12px;">',
    '    <div style="color:#555;text-align:center;padding:30px 0;">Loading...</div>',
    "  </div>",
    "</div>",
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.style.display = "none";
    var refreshBtn = panelEl.querySelector("#gl-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        refreshData();
      });
    }
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelEl) {
      panelEl.style.display = panelVisible ? "" : "none";
    }
    if (panelVisible) {
      refreshData();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(refreshData, 8000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ── Data Fetching ───────────────────────────────────────────────────────
  function refreshData() {
    var contentEl = panelEl ? panelEl.querySelector("#gl-content") : null;
    if (!contentEl) return;

    var paneId = ctx.activeId;
    if (!paneId) {
      contentEl.innerHTML =
        '<div style="color:#555;text-align:center;padding:30px 0;">No active terminal</div>';
      return;
    }

    var branch = "";
    var status = "";
    var cwd = "";

    Promise.resolve()
      .then(function () {
        return ctx.ipc.getCwd(paneId);
      })
      .then(function (result) {
        cwd = result || "~";
        return ctx.ipc.getGitBranch(cwd);
      })
      .then(function (result) {
        branch = result || "";
        return ctx.ipc.getGitStatus(cwd);
      })
      .then(function (result) {
        status = result || "";
        renderPanel(contentEl, cwd, branch, status);
      })
      .catch(function () {
        contentEl.innerHTML =
          '<div style="color:#555;text-align:center;padding:30px 0;">Not a git repository</div>';
      });
  }

  function renderPanel(el, cwd, branch, status) {
    var lines = status.split("\n").filter(function (l) {
      return l.trim() !== "";
    });

    var staged = [];
    var modified = [];
    var untracked = [];

    lines.forEach(function (line) {
      var code = line.substring(0, 2);
      var file = line.substring(3).trim();
      if (!file) return;
      if (code.charAt(0) !== " " && code.charAt(0) !== "?") {
        staged.push({ code: code, file: file });
      }
      if (code.charAt(1) === "M" || code.charAt(1) === "D") {
        modified.push({ code: code, file: file });
      }
      if (code === "??") {
        untracked.push({ code: code, file: file });
      }
    });

    var totalChanges = staged.length + modified.length + untracked.length;
    var branchColor = branch ? "#7fdbca" : "#555";

    var html = "";

    // Branch section
    html += '<div style="margin-bottom:14px;">';
    html +=
      '<div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Branch</div>';
    html +=
      '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:8px 10px;">';
    html +=
      '<span style="color:' +
      branchColor +
      ';font-weight:600;">' +
      escHtml(branch || "detached") +
      "</span>";
    html += "</div></div>";

    // CWD section
    html += '<div style="margin-bottom:14px;">';
    html +=
      '<div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Directory</div>';
    html +=
      '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:8px 10px;';
    html +=
      'word-break:break-all;color:#888;">' + escHtml(cwd) + "</div></div>";

    // Summary
    html += '<div style="margin-bottom:14px;">';
    html +=
      '<div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Changes</div>';
    if (totalChanges === 0) {
      html +=
        '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:12px 10px;text-align:center;color:#555;">Working tree clean</div>';
    } else {
      html +=
        '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:8px 0;">';

      if (staged.length > 0) {
        html +=
          '<div style="padding:4px 10px;color:#73c991;font-size:11px;font-weight:600;">Staged (' +
          staged.length +
          ")</div>";
        staged.forEach(function (f) {
          html +=
            '<div style="padding:2px 10px 2px 18px;color:#73c991;font-size:11px;">' +
            escHtml(f.file) +
            "</div>";
        });
      }

      if (modified.length > 0) {
        html +=
          '<div style="padding:4px 10px;color:#e2c08d;font-size:11px;font-weight:600;">Modified (' +
          modified.length +
          ")</div>";
        modified.forEach(function (f) {
          html +=
            '<div style="padding:2px 10px 2px 18px;color:#e2c08d;font-size:11px;">' +
            escHtml(f.file) +
            "</div>";
        });
      }

      if (untracked.length > 0) {
        html +=
          '<div style="padding:4px 10px;color:#888;font-size:11px;font-weight:600;">Untracked (' +
          untracked.length +
          ")</div>";
        untracked.forEach(function (f) {
          html +=
            '<div style="padding:2px 10px 2px 18px;color:#666;font-size:11px;">' +
            escHtml(f.file) +
            "</div>";
        });
      }

      html += "</div>";
    }
    html += "</div>";

    // Quick actions
    html += '<div style="margin-bottom:14px;">';
    html +=
      '<div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Quick Actions</div>';
    html +=
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">';

    var actions = [
      { label: "Pull", cmd: "git pull" },
      { label: "Push", cmd: "git push" },
      { label: "Stash", cmd: "git stash" },
      { label: "Log", cmd: "git log --oneline -10" },
    ];

    actions.forEach(function (a) {
      html +=
        '<button data-gl-cmd="' +
        escHtml(a.cmd) +
        '" style="background:#1a1a1a;border:1px solid #333;color:#7fdbca;';
      html +=
        'border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;';
      html +=
        'font-family:inherit;">' +
        escHtml(a.label) +
        "</button>";
    });

    html += "</div></div>";

    el.innerHTML = html;

    // Attach action button handlers
    var btns = el.querySelectorAll("[data-gl-cmd]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var cmd = this.getAttribute("data-gl-cmd");
        if (ctx.activeId) {
          ctx.sendInput(ctx.activeId, cmd + "\n");
          ctx.showToast("Running: " + cmd);
        }
      });
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
    label: "Git: Show Status",
    category: "Git",
    action: function () {
      if (ctx.activeId) {
        ctx.sendInput(ctx.activeId, "git status\n");
      }
    },
  });

  ctx.registerCommand({
    label: "Git: Pull",
    category: "Git",
    action: function () {
      if (ctx.activeId) {
        ctx.sendInput(ctx.activeId, "git pull\n");
        ctx.showToast("Pulling latest changes...");
      }
    },
  });

  ctx.registerCommand({
    label: "Git: Push",
    category: "Git",
    action: function () {
      if (ctx.activeId) {
        ctx.sendInput(ctx.activeId, "git push\n");
        ctx.showToast("Pushing changes...");
      }
    },
  });
};
