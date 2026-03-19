exports.activate = function (ctx) {
  var panelId = "file-browser-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>File Browser</h3>',
    '<button class="side-panel-close" id="fb-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="display:flex;gap:4px;margin-bottom:10px;">',
    '<input id="fb-path" type="text" placeholder="Enter directory path..." style="flex:1;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;outline:none;">',
    '<button id="fb-go" style="background:var(--t-accent);color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:12px;">Go</button>',
    '</div>',
    '<div id="fb-tree" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#fb-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#fb-go").addEventListener("click", browse);
    panelEl.querySelector("#fb-path").addEventListener("keydown", function (e) {
      if (e.key === "Enter") browse();
    });
  }

  function browse() {
    var pathInput = panelEl.querySelector("#fb-path");
    var dir = pathInput.value.trim();
    var tree = panelEl.querySelector("#fb-tree");
    if (!dir) {
      tree.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">Enter a path to browse</div>';
      return;
    }
    tree.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:10px;">Loading...</div>';
    try {
      var fs = require("fs");
      var path = require("path");
      var entries = fs.readdirSync(dir);
      var h = "";
      entries.sort().forEach(function (entry) {
        var full = path.join(dir, entry);
        var isDir = false;
        try { isDir = fs.statSync(full).isDirectory(); } catch (e) { /* skip */ }
        var icon = isDir ? "📁" : "📄";
        h += '<div class="fb-entry" data-path="' + esc(full) + '" data-dir="' + isDir + '" style="padding:4px 6px;cursor:pointer;color:var(--t-fg);border-radius:3px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.background=\'var(--t-surface)\'" onmouseout="this.style.background=\'transparent\'">';
        h += '<span>' + icon + '</span><span style="' + (isDir ? 'color:var(--t-accent);' : '') + '">' + esc(entry) + '</span>';
        h += '</div>';
      });
      tree.innerHTML = h || '<div style="color:var(--t-fg);opacity:0.4;padding:10px;">Empty directory</div>';
      var items = tree.querySelectorAll(".fb-entry");
      for (var i = 0; i < items.length; i++) {
        items[i].addEventListener("click", function () {
          var p = this.getAttribute("data-path");
          var d = this.getAttribute("data-dir") === "true";
          if (d) {
            pathInput.value = p;
            browse();
          } else {
            ctx.showToast("File: " + p);
          }
        });
      }
    } catch (e) {
      tree.innerHTML = '<div style="color:#ff5370;padding:10px;">' + esc(e.message) + '</div>';
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("file-browser:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "file-browser-btn",
    title: "File Browser",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
