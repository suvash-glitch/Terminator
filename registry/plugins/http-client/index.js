exports.activate = function (ctx) {
  var panelId = "http-client-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>HTTP Client</h3>',
    '<button class="side-panel-close" id="hc-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Method & URL</label>',
    '<div style="display:flex;gap:4px;margin:4px 0 10px;">',
    '<select id="hc-method" style="background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;font-size:12px;outline:none;"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>',
    '<input id="hc-url" type="text" placeholder="https://api.example.com" style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:monospace;font-size:12px;outline:none;">',
    '</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Headers (JSON)</label>',
    '<textarea id="hc-headers" style="width:100%;height:50px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;"></textarea>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Body</label>',
    '<textarea id="hc-body" style="width:100%;height:60px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Request body..."></textarea>',
    '<button id="hc-send" style="width:100%;background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:8px;cursor:pointer;font-size:12px;margin-bottom:10px;">Send Request</button>',
    '<div id="hc-result" style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;font-family:monospace;font-size:11px;min-height:60px;overflow:auto;max-height:calc(100vh - 520px);word-break:break-all;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#hc-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#hc-send").addEventListener("click", sendRequest);
  }

  function sendRequest() {
    var method = panelEl.querySelector("#hc-method").value;
    var url = panelEl.querySelector("#hc-url").value.trim();
    var headersStr = panelEl.querySelector("#hc-headers").value.trim();
    var body = panelEl.querySelector("#hc-body").value;
    var result = panelEl.querySelector("#hc-result");

    if (!url) { result.innerHTML = '<span style="color:#ff5370;">Enter a URL</span>'; return; }

    var headers = {};
    if (headersStr) {
      try { headers = JSON.parse(headersStr); } catch (e) {
        result.innerHTML = '<span style="color:#ff5370;">Invalid headers JSON: ' + esc(e.message) + '</span>';
        return;
      }
    }

    result.innerHTML = '<span style="opacity:0.4;">Sending...</span>';

    var opts = { method: method, headers: headers };
    if (method !== "GET" && body) opts.body = body;

    fetch(url, opts).then(function (res) {
      return res.text().then(function (text) {
        var statusColor = res.ok ? "#c3e88d" : "#ff5370";
        var h = '<div style="margin-bottom:8px;"><span style="color:' + statusColor + ';font-weight:bold;">' + res.status + ' ' + res.statusText + '</span></div>';
        try {
          var json = JSON.parse(text);
          h += '<pre style="margin:0;white-space:pre-wrap;color:var(--t-fg);">' + esc(JSON.stringify(json, null, 2)) + '</pre>';
        } catch (e) {
          h += '<pre style="margin:0;white-space:pre-wrap;color:var(--t-fg);">' + esc(text) + '</pre>';
        }
        result.innerHTML = h;
      });
    }).catch(function (err) {
      result.innerHTML = '<span style="color:#ff5370;">' + esc(err.message) + '</span>';
    });
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("http-client:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "http-client-btn",
    title: "HTTP Client",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
