exports.activate = function (ctx) {
  var panelId = "tab-search-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Tab Search</h3>',
    '<button class="side-panel-close" id="ts-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<input id="ts-query" type="text" placeholder="Search tabs..." style="width:100%;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:8px;font-size:13px;outline:none;margin-bottom:10px;box-sizing:border-box;">',
    '<div id="ts-results" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#ts-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#ts-query").addEventListener("input", search);
  }

  function search() {
    var query = panelEl.querySelector("#ts-query").value.toLowerCase();
    var results = panelEl.querySelector("#ts-results");
    var tabs = document.querySelectorAll(".tab-item, .tab, [data-tab-id]");
    var h = "";
    var count = 0;

    if (!query) {
      tabs.forEach(function (tab) {
        var title = tab.textContent.trim() || tab.getAttribute("title") || "Untitled";
        h += renderTab(title, count);
        count++;
      });
    } else {
      tabs.forEach(function (tab) {
        var title = tab.textContent.trim() || tab.getAttribute("title") || "Untitled";
        if (fuzzyMatch(title.toLowerCase(), query)) {
          h += renderTab(title, count);
          count++;
        }
      });
    }

    if (count === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">' + (query ? "No matching tabs" : "No tabs found") + '</div>';
    }
    results.innerHTML = h;
  }

  function renderTab(title, idx) {
    return '<div class="ts-item" data-idx="' + idx + '" style="padding:8px;cursor:pointer;color:var(--t-fg);border-radius:4px;border-bottom:1px solid var(--t-border,#222);display:flex;align-items:center;gap:8px;" onmouseover="this.style.background=\'var(--t-surface)\'" onmouseout="this.style.background=\'transparent\'">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="opacity:0.4;flex-shrink:0;"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(title) + '</span></div>';
  }

  function fuzzyMatch(str, query) {
    var qi = 0;
    for (var i = 0; i < str.length && qi < query.length; i++) {
      if (str[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("tab-search:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "tab-search-btn",
    title: "Tab Search",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
    if (visible && panelEl) {
      panelEl.querySelector("#ts-query").focus();
      search();
    }
  }
};
