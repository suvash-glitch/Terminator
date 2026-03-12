/**
 * Git Lens — Extension plugin for Terminator
 *
 * Provides a side panel with git branch info, modified files,
 * and command palette entries for common git operations.
 */

exports.activate = function (ctx) {
  var panelId = "git-lens-panel";
  var refreshTimer = null;
  var panelEl = null;
  var panelVisible = false;

  ctx.addToolbarButton({
    id: "git-lens-btn",
    title: "Git Lens",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3.5"/><path d="M13.5 13.5 9 9"/><path d="M6 4v4"/><path d="M4 6h4"/></svg>',
    onClick: function () { togglePanel(); },
  });

  var panelHtml = [
    '<div class="side-panel-header">',
    '  <h3>Git Lens</h3>',
    '  <div style="display:flex;gap:6px;align-items:center;">',
    '    <button id="gl-refresh" style="background:none;border:1px solid var(--t-border);',
    '      color:var(--t-fg);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;opacity:0.7;">Refresh</button>',
    '    <button class="side-panel-close" id="gl-close">',
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '    </button>',
    '  </div>',
    '</div>',
    '<div class="side-panel-body" id="gl-content" style="padding:10px 12px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;">',
    '  <div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">Loading...</div>',
    '</div>',
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.querySelector("#gl-refresh").addEventListener("click", function () { refreshData(); });
    panelEl.querySelector("#gl-close").addEventListener("click", function () { closePanel(); });
  }

  // Close on click outside (clicking grid/terminal area)
  document.getElementById("grid").addEventListener("mousedown", function () {
    if (panelVisible) closePanel();
  });

  function togglePanel() {
    if (panelVisible) { closePanel(); } else { openPanel(); }
  }
  function openPanel() {
    panelVisible = true;
    if (panelEl) panelEl.classList.add("visible");
    refreshData();
    startAutoRefresh();
  }
  function closePanel() {
    panelVisible = false;
    if (panelEl) panelEl.classList.remove("visible");
    stopAutoRefresh();
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(refreshData, 8000);
  }
  function stopAutoRefresh() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }

  function refreshData() {
    var contentEl = panelEl ? panelEl.querySelector("#gl-content") : null;
    if (!contentEl) return;
    var paneId = ctx.activeId;
    if (!paneId) {
      contentEl.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">No active terminal</div>';
      return;
    }
    var branch = "", status = "", cwd = "";
    Promise.resolve()
      .then(function () { return ctx.ipc.getCwd(paneId); })
      .then(function (r) { cwd = r || "~"; return ctx.ipc.getGitBranch(cwd); })
      .then(function (r) { branch = r || ""; return ctx.ipc.getGitStatus(cwd); })
      .then(function (r) { status = r || ""; renderPanel(contentEl, cwd, branch, status); })
      .catch(function () {
        contentEl.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">Not a git repository</div>';
      });
  }

  function renderPanel(el, cwd, branch, status) {
    var lines = status.split("\n").filter(function (l) { return l.trim() !== ""; });
    var staged = [], modified = [], untracked = [];
    lines.forEach(function (line) {
      var code = line.substring(0, 2);
      var file = line.substring(3).trim();
      if (!file) return;
      if (code.charAt(0) !== " " && code.charAt(0) !== "?") staged.push({ code: code, file: file });
      if (code.charAt(1) === "M" || code.charAt(1) === "D") modified.push({ code: code, file: file });
      if (code === "??") untracked.push({ code: code, file: file });
    });

    var totalChanges = staged.length + modified.length + untracked.length;
    var html = "";

    // Branch
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Branch</div>';
    html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:8px 10px;">';
    html += '<span style="color:var(--t-accent);font-weight:600;">' + esc(branch || "detached") + '</span>';
    html += '</div></div>';

    // CWD
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Directory</div>';
    html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:8px 10px;word-break:break-all;color:var(--t-fg);opacity:0.7;">' + esc(cwd) + '</div></div>';

    // Changes
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Changes</div>';
    if (totalChanges === 0) {
      html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:12px 10px;text-align:center;color:var(--t-fg);opacity:0.4;">Working tree clean</div>';
    } else {
      html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:8px 0;">';
      if (staged.length > 0) {
        html += '<div style="padding:4px 10px;color:#73c991;font-size:11px;font-weight:600;">Staged (' + staged.length + ')</div>';
        staged.forEach(function (f) { html += '<div style="padding:2px 10px 2px 18px;color:#73c991;font-size:11px;">' + esc(f.file) + '</div>'; });
      }
      if (modified.length > 0) {
        html += '<div style="padding:4px 10px;color:#e2c08d;font-size:11px;font-weight:600;">Modified (' + modified.length + ')</div>';
        modified.forEach(function (f) { html += '<div style="padding:2px 10px 2px 18px;color:#e2c08d;font-size:11px;">' + esc(f.file) + '</div>'; });
      }
      if (untracked.length > 0) {
        html += '<div style="padding:4px 10px;color:var(--t-fg);opacity:0.5;font-size:11px;font-weight:600;">Untracked (' + untracked.length + ')</div>';
        untracked.forEach(function (f) { html += '<div style="padding:2px 10px 2px 18px;color:var(--t-fg);opacity:0.4;font-size:11px;">' + esc(f.file) + '</div>'; });
      }
      html += '</div>';
    }
    html += '</div>';

    // Quick actions
    html += '<div style="margin-bottom:14px;">';
    html += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Quick Actions</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    var actions = [
      { label: "Pull", cmd: "git pull" },
      { label: "Push", cmd: "git push" },
      { label: "Stash", cmd: "git stash" },
      { label: "Log", cmd: "git log --oneline -10" },
    ];
    actions.forEach(function (a) {
      html += '<button data-gl-cmd="' + esc(a.cmd) + '" style="background:var(--t-bg);border:1px solid var(--t-border);color:var(--t-accent);border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;font-family:inherit;">' + esc(a.label) + '</button>';
    });
    html += '</div></div>';

    el.innerHTML = html;
    var btns = el.querySelectorAll("[data-gl-cmd]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var cmd = this.getAttribute("data-gl-cmd");
        if (ctx.activeId) { ctx.sendInput(ctx.activeId, cmd + "\n"); ctx.showToast("Running: " + cmd); }
      });
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand({ label: "Git: Show Status", category: "Git", action: function () { if (ctx.activeId) ctx.sendInput(ctx.activeId, "git status\n"); } });
  ctx.registerCommand({ label: "Git: Pull", category: "Git", action: function () { if (ctx.activeId) { ctx.sendInput(ctx.activeId, "git pull\n"); ctx.showToast("Pulling..."); } } });
  ctx.registerCommand({ label: "Git: Push", category: "Git", action: function () { if (ctx.activeId) { ctx.sendInput(ctx.activeId, "git push\n"); ctx.showToast("Pushing..."); } } });
};
