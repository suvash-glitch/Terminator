exports.activate = function (ctx) {
  var panelId = "jwt-decoder-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>JWT Decoder</h3>',
    '<button class="side-panel-close" id="jwt-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">JWT Token</label>',
    '<textarea id="jwt-input" style="width:100%;height:80px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Paste JWT token..."></textarea>',
    '<button id="jwt-decode" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-accent);color:#fff;cursor:pointer;font-size:11px;margin-bottom:10px;">Decode</button>',
    '<div id="jwt-output" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#jwt-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#jwt-decode").addEventListener("click", decodeJwt);
  }

  function decodeJwt() {
    var token = panelEl.querySelector("#jwt-input").value.trim();
    var output = panelEl.querySelector("#jwt-output");
    if (!token) { output.innerHTML = '<span style="opacity:0.4;">Paste a JWT above</span>'; return; }
    var parts = token.split(".");
    if (parts.length < 2) { output.innerHTML = '<span style="color:#ff5370;">Invalid JWT format</span>'; return; }
    try {
      var header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
      var payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      var h = '';
      h += '<div style="margin-bottom:12px;">';
      h += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Header</div>';
      h += '<pre style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:8px;color:#c792ea;white-space:pre-wrap;word-break:break-all;">' + esc(JSON.stringify(header, null, 2)) + '</pre>';
      h += '</div>';
      h += '<div style="margin-bottom:12px;">';
      h += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Payload</div>';
      h += '<pre style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:8px;color:#c3e88d;white-space:pre-wrap;word-break:break-all;">' + esc(JSON.stringify(payload, null, 2)) + '</pre>';
      h += '</div>';
      if (payload.exp) {
        var expDate = new Date(payload.exp * 1000);
        var isExpired = expDate < new Date();
        h += '<div style="color:' + (isExpired ? '#ff5370' : '#c3e88d') + ';font-size:11px;">';
        h += (isExpired ? 'Expired' : 'Expires') + ': ' + esc(expDate.toISOString());
        h += '</div>';
      }
      output.innerHTML = h;
    } catch (e) {
      output.innerHTML = '<span style="color:#ff5370;">Decode error: ' + esc(e.message) + '</span>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.addToolbarButton({
    id: "jwt-decoder-btn",
    title: "JWT Decoder",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
