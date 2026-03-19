exports.activate = function (ctx) {
  var panelId = "env-manager-panel";
  var panelEl = null;
  var visible = false;
  var profiles = { Default: {} };
  var activeProfile = "Default";

  var html = [
    '<div class="side-panel-header"><h3>Env Manager</h3>',
    '<button class="side-panel-close" id="em-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Profile</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<select id="em-profile" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-size:12px;outline:none;"></select>',
    '<input id="em-new-name" type="text" placeholder="New profile" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-size:12px;outline:none;">',
    '<button id="em-add-profile" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;">+</button>',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Add Variable</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="em-key" type="text" placeholder="KEY" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-family:monospace;font-size:12px;outline:none;">',
    '<input id="em-val" type="text" placeholder="value" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-family:monospace;font-size:12px;outline:none;">',
    '<button id="em-add-var" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;">Add</button>',
    '</div>',
    '<div id="em-vars" style="font-family:monospace;font-size:12px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#em-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#em-add-profile").addEventListener("click", addProfile);
    panelEl.querySelector("#em-add-var").addEventListener("click", addVar);
    panelEl.querySelector("#em-profile").addEventListener("change", function () {
      activeProfile = this.value;
      render();
    });
  }

  function addProfile() {
    var name = panelEl.querySelector("#em-new-name").value.trim();
    if (!name || profiles[name]) return;
    profiles[name] = {};
    activeProfile = name;
    panelEl.querySelector("#em-new-name").value = "";
    render();
  }

  function addVar() {
    var key = panelEl.querySelector("#em-key").value.trim();
    var val = panelEl.querySelector("#em-val").value;
    if (!key) return;
    profiles[activeProfile][key] = val;
    panelEl.querySelector("#em-key").value = "";
    panelEl.querySelector("#em-val").value = "";
    render();
  }

  function render() {
    var sel = panelEl.querySelector("#em-profile");
    sel.innerHTML = "";
    Object.keys(profiles).forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (name === activeProfile) opt.selected = true;
      sel.appendChild(opt);
    });
    var vars = panelEl.querySelector("#em-vars");
    var env = profiles[activeProfile] || {};
    var keys = Object.keys(env);
    var h = "";
    if (keys.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No variables in this profile</div>';
    }
    keys.forEach(function (k) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<span style="color:var(--t-accent);">' + esc(k) + '</span>';
      h += '<span style="color:var(--t-fg);opacity:0.7;">' + esc(env[k]) + '</span>';
      h += '<button class="em-remove" data-key="' + esc(k) + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div>';
    });
    vars.innerHTML = h;
    var btns = vars.querySelectorAll(".em-remove");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        delete profiles[activeProfile][this.getAttribute("data-key")];
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("env-manager:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "env-manager-btn",
    title: "Env Manager",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
