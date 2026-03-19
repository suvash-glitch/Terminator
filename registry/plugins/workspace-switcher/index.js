exports.activate = function (ctx) {
  var panelId = "workspace-switcher-panel";
  var panelEl = null;
  var visible = false;
  var workspaces = {};

  var html = [
    '<div class="side-panel-header"><h3>Workspace Switcher</h3>',
    '<button class="side-panel-close" id="ws-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">New Workspace</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 6px;">',
    '<input id="ws-name" type="text" placeholder="Workspace name" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '</div>',
    '<div style="display:flex;gap:4px;margin-bottom:10px;">',
    '<input id="ws-dir" type="text" placeholder="Working directory" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:monospace;font-size:12px;outline:none;">',
    '<button id="ws-add" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Add</button>',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Workspaces</label>',
    '<div id="ws-list" style="font-family:monospace;font-size:12px;margin-top:4px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#ws-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#ws-add").addEventListener("click", addWorkspace);
    panelEl.querySelector("#ws-name").addEventListener("keydown", function (e) {
      if (e.key === "Enter") addWorkspace();
    });
  }

  function addWorkspace() {
    var name = panelEl.querySelector("#ws-name").value.trim();
    var dir = panelEl.querySelector("#ws-dir").value.trim();
    if (!name) return;
    workspaces[name] = { directory: dir || "~", createdAt: new Date().toLocaleString() };
    panelEl.querySelector("#ws-name").value = "";
    panelEl.querySelector("#ws-dir").value = "";
    render();
  }

  function render() {
    var list = panelEl.querySelector("#ws-list");
    var names = Object.keys(workspaces);
    var h = "";
    if (names.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No workspaces defined</div>';
    }
    names.forEach(function (name) {
      var w = workspaces[name];
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<div style="flex:1;overflow:hidden;">';
      h += '<div style="color:var(--t-fg);">' + esc(name) + '</div>';
      h += '<div style="color:var(--t-accent);opacity:0.6;font-size:10px;">' + esc(w.directory) + '</div>';
      h += '</div>';
      h += '<div style="display:flex;gap:4px;">';
      h += '<button class="ws-switch" data-name="' + esc(name) + '" style="background:var(--t-accent);color:#fff;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:10px;">Switch</button>';
      h += '<button class="ws-remove" data-name="' + esc(name) + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div></div>';
    });
    list.innerHTML = h;
    var switchBtns = list.querySelectorAll(".ws-switch");
    for (var i = 0; i < switchBtns.length; i++) {
      switchBtns[i].addEventListener("click", function () {
        ctx.showToast("Switching to workspace: " + this.getAttribute("data-name"));
      });
    }
    var removeBtns = list.querySelectorAll(".ws-remove");
    for (var j = 0; j < removeBtns.length; j++) {
      removeBtns[j].addEventListener("click", function () {
        delete workspaces[this.getAttribute("data-name")];
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("workspace-switcher:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "workspace-switcher-btn",
    title: "Workspace Switcher",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
