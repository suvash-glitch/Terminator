exports.activate = function (ctx) {
  var panelId = "split-layout-manager-panel";
  var panelEl = null;
  var visible = false;
  var layouts = {};

  var html = [
    '<div class="side-panel-header"><h3>Layout Manager</h3>',
    '<button class="side-panel-close" id="sl-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Save Current Layout</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="sl-name" type="text" placeholder="Layout name..." style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '<button id="sl-save" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Save</button>',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Saved Layouts</label>',
    '<div id="sl-list" style="font-family:monospace;font-size:12px;margin-top:4px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#sl-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#sl-save").addEventListener("click", saveLayout);
    panelEl.querySelector("#sl-name").addEventListener("keydown", function (e) {
      if (e.key === "Enter") saveLayout();
    });
  }

  function saveLayout() {
    var name = panelEl.querySelector("#sl-name").value.trim();
    if (!name) return;
    layouts[name] = { savedAt: new Date().toISOString(), panes: document.querySelectorAll(".terminal-pane").length || 1 };
    panelEl.querySelector("#sl-name").value = "";
    render();
    ctx.showToast("Layout '" + name + "' saved");
  }

  function render() {
    var list = panelEl.querySelector("#sl-list");
    var names = Object.keys(layouts);
    var h = "";
    if (names.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No saved layouts</div>';
    }
    names.forEach(function (name) {
      var l = layouts[name];
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<div>';
      h += '<div style="color:var(--t-fg);">' + esc(name) + '</div>';
      h += '<div style="color:var(--t-fg);opacity:0.4;font-size:10px;">' + l.panes + ' pane(s)</div>';
      h += '</div>';
      h += '<div style="display:flex;gap:4px;">';
      h += '<button class="sl-restore" data-name="' + esc(name) + '" style="background:var(--t-accent);color:#fff;border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:10px;">Restore</button>';
      h += '<button class="sl-remove" data-name="' + esc(name) + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div></div>';
    });
    list.innerHTML = h;
    var restoreBtns = list.querySelectorAll(".sl-restore");
    for (var i = 0; i < restoreBtns.length; i++) {
      restoreBtns[i].addEventListener("click", function () {
        ctx.showToast("Restoring layout: " + this.getAttribute("data-name"));
      });
    }
    var removeBtns = list.querySelectorAll(".sl-remove");
    for (var j = 0; j < removeBtns.length; j++) {
      removeBtns[j].addEventListener("click", function () {
        delete layouts[this.getAttribute("data-name")];
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("split-layout-manager:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "split-layout-manager-btn",
    title: "Layout Manager",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="12" y2="12"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
