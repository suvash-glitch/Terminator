exports.activate = function (ctx) {
  var panelId = "vim-keybindings-panel";
  var panelEl = null;
  var visible = false;

  var bindings = [
    { key: "h / j / k / l", desc: "Move left / down / up / right", cat: "Movement" },
    { key: "w / b", desc: "Jump forward / backward by word", cat: "Movement" },
    { key: "0 / $", desc: "Go to start / end of line", cat: "Movement" },
    { key: "gg / G", desc: "Go to first / last line", cat: "Movement" },
    { key: "i / a", desc: "Insert before / after cursor", cat: "Insert" },
    { key: "I / A", desc: "Insert at start / end of line", cat: "Insert" },
    { key: "o / O", desc: "Open line below / above", cat: "Insert" },
    { key: "dd", desc: "Delete current line", cat: "Edit" },
    { key: "yy", desc: "Yank (copy) current line", cat: "Edit" },
    { key: "p / P", desc: "Paste after / before cursor", cat: "Edit" },
    { key: "u / Ctrl+r", desc: "Undo / redo", cat: "Edit" },
    { key: "/ + pattern", desc: "Search forward", cat: "Search" },
    { key: "? + pattern", desc: "Search backward", cat: "Search" },
    { key: "n / N", desc: "Next / previous match", cat: "Search" },
    { key: ":w / :q / :wq", desc: "Write / quit / write and quit", cat: "Command" },
    { key: ":s/old/new/g", desc: "Substitute in line", cat: "Command" },
    { key: ":%s/old/new/g", desc: "Substitute in file", cat: "Command" },
    { key: "v / V / Ctrl+v", desc: "Visual / line / block mode", cat: "Visual" }
  ];

  var html = [
    '<div class="side-panel-header"><h3>Vim Keybindings</h3>',
    '<button class="side-panel-close" id="vk-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<input id="vk-filter" type="text" placeholder="Filter keybindings..." style="width:100%;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:8px;font-size:12px;outline:none;margin-bottom:10px;box-sizing:border-box;">',
    '<div id="vk-list" style="font-family:monospace;font-size:12px;overflow:auto;max-height:calc(100vh - 200px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#vk-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#vk-filter").addEventListener("input", render);
  }

  function render() {
    var filter = (panelEl.querySelector("#vk-filter").value || "").toLowerCase();
    var list = panelEl.querySelector("#vk-list");
    var h = "";
    var lastCat = "";
    bindings.forEach(function (b) {
      if (filter && b.key.toLowerCase().indexOf(filter) === -1 && b.desc.toLowerCase().indexOf(filter) === -1) return;
      if (b.cat !== lastCat) {
        lastCat = b.cat;
        h += '<div style="color:var(--t-accent);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px;margin-top:4px;border-bottom:1px solid var(--t-border);">' + esc(b.cat) + '</div>';
      }
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;">';
      h += '<code style="color:#c792ea;background:var(--t-surface);padding:2px 6px;border-radius:3px;font-size:11px;">' + esc(b.key) + '</code>';
      h += '<span style="color:var(--t-fg);opacity:0.7;font-size:11px;text-align:right;margin-left:10px;">' + esc(b.desc) + '</span>';
      h += '</div>';
    });
    list.innerHTML = h || '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No matching keybindings</div>';
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand({ label: "Vim Keybindings", action: function () { toggle(); }, category: "Tools" });

  ctx.addToolbarButton({
    id: "vim-keybindings-btn",
    title: "Vim Keybindings",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
