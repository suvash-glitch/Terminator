exports.activate = function (ctx) {
  var panelId = "json-viewer-panel";
  var panelEl = null;
  var visible = false;

  var styleEl = document.createElement("style");
  styleEl.textContent = [
    ".jv-key { color:#c792ea; }",
    ".jv-string { color:#c3e88d; }",
    ".jv-number { color:#f78c6c; }",
    ".jv-boolean { color:#ff5370; }",
    ".jv-null { color:#546e7a; }",
    ".jv-brace { color:#89ddff; }"
  ].join("\n");
  document.head.appendChild(styleEl);

  var html = [
    '<div class="side-panel-header"><h3>JSON Viewer</h3>',
    '<button class="side-panel-close" id="jv-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<textarea id="jv-input" style="width:100%;height:120px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;resize:vertical;outline:none;" placeholder="Paste JSON here..."></textarea>',
    '<div style="margin:8px 0;display:flex;gap:4px;">',
    '<button id="jv-format" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-accent);color:#fff;cursor:pointer;font-size:11px;">Format</button>',
    '<button id="jv-minify" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-bg);color:var(--t-fg);cursor:pointer;font-size:11px;">Minify</button>',
    '</div>',
    '<pre id="jv-output" style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;overflow:auto;max-height:calc(100vh - 320px);white-space:pre-wrap;word-break:break-all;"></pre>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#jv-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#jv-format").addEventListener("click", function () { formatJson(); });
    panelEl.querySelector("#jv-minify").addEventListener("click", function () { minifyJson(); });
  }

  function formatJson() {
    var input = panelEl.querySelector("#jv-input");
    var output = panelEl.querySelector("#jv-output");
    try {
      var obj = JSON.parse(input.value);
      var formatted = JSON.stringify(obj, null, 2);
      input.value = formatted;
      output.innerHTML = highlight(formatted);
    } catch (e) {
      output.innerHTML = '<span style="color:#ff5370;">Error: ' + esc(e.message) + '</span>';
    }
  }

  function minifyJson() {
    var input = panelEl.querySelector("#jv-input");
    var output = panelEl.querySelector("#jv-output");
    try {
      var obj = JSON.parse(input.value);
      var minified = JSON.stringify(obj);
      input.value = minified;
      output.innerHTML = highlight(minified);
    } catch (e) {
      output.innerHTML = '<span style="color:#ff5370;">Error: ' + esc(e.message) + '</span>';
    }
  }

  function highlight(json) {
    return esc(json).replace(/"([^"]+)":/g, '<span class="jv-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="jv-string">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="jv-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="jv-boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="jv-null">$1</span>');
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.addToolbarButton({
    id: "json-viewer-btn",
    title: "JSON Viewer",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/></svg>',
    onClick: function () { toggle(); }
  });

  ctx.registerCommand({ label: "JSON Viewer", category: "Tools", action: function () { if (!visible) toggle(); } });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
