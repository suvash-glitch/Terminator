exports.activate = function (ctx) {
  var panelId = "regex-tester-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Regex Tester</h3>',
    '<button class="side-panel-close" id="rx-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Pattern</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<input id="rx-pattern" type="text" placeholder="e.g. \\d+" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;outline:none;">',
    '<input id="rx-flags" type="text" value="gi" style="width:40px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;text-align:center;outline:none;">',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Test String</label>',
    '<textarea id="rx-test" style="width:100%;height:100px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Enter test string..."></textarea>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Result</label>',
    '<div id="rx-result" style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;min-height:60px;margin-top:4px;overflow:auto;max-height:calc(100vh - 420px);word-break:break-all;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#rx-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#rx-pattern").addEventListener("input", testRegex);
    panelEl.querySelector("#rx-flags").addEventListener("input", testRegex);
    panelEl.querySelector("#rx-test").addEventListener("input", testRegex);
  }

  function testRegex() {
    var pattern = panelEl.querySelector("#rx-pattern").value;
    var flags = panelEl.querySelector("#rx-flags").value;
    var test = panelEl.querySelector("#rx-test").value;
    var result = panelEl.querySelector("#rx-result");
    if (!pattern) { result.innerHTML = '<span style="opacity:0.4;">Enter a pattern</span>'; return; }
    try {
      var re = new RegExp(pattern, flags);
      var matches = test.match(re);
      var highlighted = esc(test).replace(new RegExp(pattern, flags.replace("g", "") + "g"), function (m) {
        return '<span style="background:#c792ea44;color:#c792ea;border-radius:2px;padding:0 1px;">' + esc(m) + '</span>';
      });
      var info = matches ? matches.length + " match(es)" : "No matches";
      result.innerHTML = '<div style="margin-bottom:6px;color:var(--t-fg);opacity:0.5;font-size:10px;">' + info + '</div>' + highlighted;
    } catch (e) {
      result.innerHTML = '<span style="color:#ff5370;">' + esc(e.message) + '</span>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.addToolbarButton({
    id: "regex-tester-btn",
    title: "Regex Tester",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3v10"/><path d="M12.5 8 17 3l4.5 5"/><path d="M7 21v-10"/><path d="M11.5 16 7 21l-4.5-5"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
