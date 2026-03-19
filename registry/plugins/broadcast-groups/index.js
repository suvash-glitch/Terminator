exports.activate = function (ctx) {
  var panelId = "broadcast-groups-panel";
  var panelEl = null;
  var visible = false;
  var groups = {};

  var html = [
    '<div class="side-panel-header"><h3>Broadcast Groups</h3>',
    '<button class="side-panel-close" id="bg-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Group Name</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="bg-name" type="text" placeholder="e.g. servers" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;outline:none;">',
    '<button id="bg-add" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Add</button>',
    '</div>',
    '<div id="bg-list" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#bg-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#bg-add").addEventListener("click", addGroup);
    panelEl.querySelector("#bg-name").addEventListener("keydown", function (e) {
      if (e.key === "Enter") addGroup();
    });
  }

  function addGroup() {
    var name = panelEl.querySelector("#bg-name").value.trim();
    if (!name) return;
    if (!groups[name]) groups[name] = { active: false, panes: [] };
    panelEl.querySelector("#bg-name").value = "";
    render();
  }

  function render() {
    var list = panelEl.querySelector("#bg-list");
    var h = "";
    var names = Object.keys(groups);
    if (names.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No groups defined</div>';
    }
    names.forEach(function (name) {
      var g = groups[name];
      var statusColor = g.active ? "#c3e88d" : "#ff5370";
      var statusText = g.active ? "ON" : "OFF";
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<span style="color:var(--t-fg);">' + esc(name) + '</span>';
      h += '<div style="display:flex;gap:6px;align-items:center;">';
      h += '<span style="color:' + statusColor + ';font-size:10px;">' + statusText + '</span>';
      h += '<button class="bg-toggle" data-name="' + esc(name) + '" style="background:var(--t-surface);color:var(--t-fg);border:1px solid var(--t-border);border-radius:3px;padding:2px 8px;cursor:pointer;font-size:10px;">Toggle</button>';
      h += '<button class="bg-remove" data-name="' + esc(name) + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div></div>';
    });
    list.innerHTML = h;
    var toggleBtns = list.querySelectorAll(".bg-toggle");
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener("click", function () {
        var n = this.getAttribute("data-name");
        groups[n].active = !groups[n].active;
        render();
      });
    }
    var removeBtns = list.querySelectorAll(".bg-remove");
    for (var j = 0; j < removeBtns.length; j++) {
      removeBtns[j].addEventListener("click", function () {
        var n = this.getAttribute("data-name");
        delete groups[n];
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("broadcast-groups:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "broadcast-groups-btn",
    title: "Broadcast Groups",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
