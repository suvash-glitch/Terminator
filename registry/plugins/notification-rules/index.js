exports.activate = function (ctx) {
  var panelId = "notification-rules-panel";
  var panelEl = null;
  var visible = false;
  var rules = [];

  var html = [
    '<div class="side-panel-header"><h3>Notification Rules</h3>',
    '<button class="side-panel-close" id="nr-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Pattern (regex)</label>',
    '<input id="nr-pattern" type="text" placeholder="e.g. error|fail|exception" style="width:100%;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;outline:none;margin:4px 0 8px;box-sizing:border-box;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Label</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="nr-label" type="text" placeholder="Rule name" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '<button id="nr-add" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Add</button>',
    '</div>',
    '<div id="nr-list" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#nr-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#nr-add").addEventListener("click", addRule);
  }

  function addRule() {
    var pattern = panelEl.querySelector("#nr-pattern").value.trim();
    var label = panelEl.querySelector("#nr-label").value.trim() || pattern;
    if (!pattern) return;
    try {
      new RegExp(pattern, "i");
    } catch (e) {
      ctx.showToast("Invalid regex: " + e.message);
      return;
    }
    rules.push({ pattern: pattern, label: label, enabled: true });
    panelEl.querySelector("#nr-pattern").value = "";
    panelEl.querySelector("#nr-label").value = "";
    render();
  }

  function render() {
    var list = panelEl.querySelector("#nr-list");
    var h = "";
    if (rules.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No notification rules defined</div>';
    }
    rules.forEach(function (r, i) {
      var statusColor = r.enabled ? "#c3e88d" : "#ff5370";
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<div style="flex:1;overflow:hidden;">';
      h += '<div style="color:var(--t-fg);">' + esc(r.label) + '</div>';
      h += '<div style="color:var(--t-accent);opacity:0.6;font-size:10px;">/' + esc(r.pattern) + '/i</div>';
      h += '</div>';
      h += '<div style="display:flex;gap:4px;">';
      h += '<button class="nr-toggle" data-idx="' + i + '" style="background:transparent;color:' + statusColor + ';border:1px solid ' + statusColor + ';border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">' + (r.enabled ? "ON" : "OFF") + '</button>';
      h += '<button class="nr-remove" data-idx="' + i + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div></div>';
    });
    list.innerHTML = h;
    var toggleBtns = list.querySelectorAll(".nr-toggle");
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-idx"));
        rules[idx].enabled = !rules[idx].enabled;
        render();
      });
    }
    var removeBtns = list.querySelectorAll(".nr-remove");
    for (var j = 0; j < removeBtns.length; j++) {
      removeBtns[j].addEventListener("click", function () {
        rules.splice(parseInt(this.getAttribute("data-idx")), 1);
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("notification-rules:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "notification-rules-btn",
    title: "Notification Rules",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
