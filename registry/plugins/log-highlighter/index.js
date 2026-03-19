exports.activate = function (ctx) {
  var panelId = "log-highlighter-panel";
  var panelEl = null;
  var visible = false;
  var rules = [
    { pattern: "ERROR", color: "#ff5370", bg: "#ff537022" },
    { pattern: "WARN", color: "#ffcb6b", bg: "#ffcb6b22" },
    { pattern: "INFO", color: "#82aaff", bg: "#82aaff22" },
    { pattern: "DEBUG", color: "#c3e88d", bg: "#c3e88d22" }
  ];

  var html = [
    '<div class="side-panel-header"><h3>Log Highlighter</h3>',
    '<button class="side-panel-close" id="lh-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Add Pattern</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="lh-pattern" type="text" placeholder="Pattern..." style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-size:12px;outline:none;">',
    '<input id="lh-color" type="color" value="#c792ea" style="width:32px;height:32px;border:none;cursor:pointer;background:transparent;">',
    '<button id="lh-add" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;">Add</button>',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Active Rules</label>',
    '<div id="lh-rules" style="font-family:monospace;font-size:12px;margin-top:4px;"></div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:14px;display:block;">Test Log</label>',
    '<textarea id="lh-test" style="width:100%;height:100px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Paste log text to preview highlighting..."></textarea>',
    '<div id="lh-preview" style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;font-family:monospace;font-size:11px;min-height:60px;overflow:auto;max-height:200px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#lh-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#lh-add").addEventListener("click", addRule);
    panelEl.querySelector("#lh-test").addEventListener("input", preview);
  }

  function addRule() {
    var pat = panelEl.querySelector("#lh-pattern").value.trim();
    var col = panelEl.querySelector("#lh-color").value;
    if (!pat) return;
    rules.push({ pattern: pat, color: col, bg: col + "22" });
    panelEl.querySelector("#lh-pattern").value = "";
    render();
    preview();
  }

  function render() {
    var el = panelEl.querySelector("#lh-rules");
    var h = "";
    rules.forEach(function (r, i) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<span style="color:' + r.color + ';">' + esc(r.pattern) + '</span>';
      h += '<button class="lh-remove" data-idx="' + i + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div>';
    });
    el.innerHTML = h;
    var btns = el.querySelectorAll(".lh-remove");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        rules.splice(parseInt(this.getAttribute("data-idx")), 1);
        render();
        preview();
      });
    }
  }

  function preview() {
    var text = panelEl.querySelector("#lh-test").value;
    var el = panelEl.querySelector("#lh-preview");
    if (!text) { el.innerHTML = '<span style="opacity:0.4;">Paste log text above</span>'; return; }
    var lines = text.split("\n");
    var h = "";
    lines.forEach(function (line) {
      var style = "color:var(--t-fg);padding:1px 4px;";
      rules.forEach(function (r) {
        if (line.indexOf(r.pattern) !== -1) {
          style = "color:" + r.color + ";background:" + r.bg + ";padding:1px 4px;border-radius:2px;";
        }
      });
      h += '<div style="' + style + '">' + esc(line) + '</div>';
    });
    el.innerHTML = h;
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("log-highlighter:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "log-highlighter-btn",
    title: "Log Highlighter",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h12"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
