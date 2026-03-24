/**
 * Quick SSH — Extension plugin for Shellfire
 *
 * SSH connection manager with saved profiles, one-click connect,
 * and a side panel for managing connections.
 */

exports.activate = function (ctx) {
  var panelId = "quick-ssh-panel";
  var panelEl = null;
  var panelVisible = false;
  var connections = [];
  var editingIndex = -1;

  ctx.addToolbarButton({
    id: "quick-ssh-btn",
    title: "SSH Connections",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="14" height="9" rx="1.5"/><path d="M4 7.5h2"/><path d="M4 10h4"/><circle cx="12" cy="8.5" r="1.2"/></svg>',
    onClick: function () { togglePanel(); },
  });

  var panelHtml = [
    '<div class="side-panel-header">',
    '  <h3>SSH Manager</h3>',
    '  <div style="display:flex;gap:6px;align-items:center;">',
    '    <button id="ssh-add-btn" style="background:var(--t-accent);background:color-mix(in srgb, var(--t-accent) 15%, transparent);border:1px solid color-mix(in srgb, var(--t-accent) 30%, transparent);',
    '      color:var(--t-accent);border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">+ Add</button>',
    '    <button class="side-panel-close" id="ssh-close">',
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '    </button>',
    '  </div>',
    '</div>',
    '<div id="ssh-form" style="display:none;padding:10px 12px;border-bottom:1px solid var(--t-border);">',
    '  <div style="margin-bottom:6px;">',
    '    <input id="ssh-label" placeholder="Label (e.g. Production)" style="',
    '      width:100%;box-sizing:border-box;background:var(--t-bg);border:1px solid var(--t-border);',
    '      color:var(--t-fg);border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '  </div>',
    '  <div style="display:flex;gap:6px;margin-bottom:6px;">',
    '    <input id="ssh-user" placeholder="User" style="flex:1;background:var(--t-bg);',
    '      border:1px solid var(--t-border);color:var(--t-fg);border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '    <input id="ssh-host" placeholder="Host / IP" style="flex:2;background:var(--t-bg);',
    '      border:1px solid var(--t-border);color:var(--t-fg);border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '  </div>',
    '  <div style="display:flex;gap:6px;margin-bottom:8px;">',
    '    <input id="ssh-port" placeholder="Port (22)" type="number" style="flex:1;',
    '      background:var(--t-bg);border:1px solid var(--t-border);color:var(--t-fg);border-radius:4px;',
    '      padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '    <input id="ssh-key" placeholder="Key path (optional)" style="flex:2;',
    '      background:var(--t-bg);border:1px solid var(--t-border);color:var(--t-fg);border-radius:4px;',
    '      padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '  </div>',
    '  <div style="display:flex;gap:6px;">',
    '    <button id="ssh-save" style="flex:1;background:rgba(0,212,230,0.12);border:1px solid rgba(0,212,230,0.3);',
    '      color:var(--t-accent);border-radius:4px;padding:5px 0;cursor:pointer;font-size:11px;font-family:inherit;">Save</button>',
    '    <button id="ssh-cancel" style="flex:1;background:var(--t-bg);border:1px solid var(--t-border);',
    '      color:var(--t-fg);opacity:0.6;border-radius:4px;padding:5px 0;cursor:pointer;font-size:11px;font-family:inherit;">Cancel</button>',
    '  </div>',
    '</div>',
    '<div class="side-panel-body" id="ssh-list" style="padding:8px 12px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;">',
    '  <div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">Loading connections...</div>',
    '</div>',
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.querySelector("#ssh-close").addEventListener("click", function () { closePanel(); });
    setupFormHandlers();
  }

  document.getElementById("grid").addEventListener("mousedown", function () {
    if (panelVisible) closePanel();
  });

  function togglePanel() { if (panelVisible) closePanel(); else openPanel(); }
  function openPanel() {
    panelVisible = true;
    if (panelEl) panelEl.classList.add("visible");
    loadConnections();
  }
  function closePanel() {
    panelVisible = false;
    if (panelEl) panelEl.classList.remove("visible");
  }

  function setupFormHandlers() {
    var addBtn = panelEl.querySelector("#ssh-add-btn");
    var saveBtn = panelEl.querySelector("#ssh-save");
    var cancelBtn = panelEl.querySelector("#ssh-cancel");
    var form = panelEl.querySelector("#ssh-form");
    addBtn.addEventListener("click", function () { editingIndex = -1; clearForm(); form.style.display = ""; });
    cancelBtn.addEventListener("click", function () { form.style.display = "none"; clearForm(); });
    saveBtn.addEventListener("click", function () {
      var label = panelEl.querySelector("#ssh-label").value.trim();
      var user = panelEl.querySelector("#ssh-user").value.trim();
      var host = panelEl.querySelector("#ssh-host").value.trim();
      var port = parseInt(panelEl.querySelector("#ssh-port").value, 10) || 22;
      var key = panelEl.querySelector("#ssh-key").value.trim();
      if (!host) { ctx.showToast("Host is required"); return; }
      if (!user) { ctx.showToast("User is required"); return; }
      var conn = { label: label || user + "@" + host, user: user, host: host, port: port, key: key };
      if (editingIndex >= 0 && editingIndex < connections.length) connections[editingIndex] = conn;
      else connections.push(conn);
      saveConnections();
      form.style.display = "none";
      clearForm();
      renderList();
    });
  }

  function clearForm() {
    if (!panelEl) return;
    ["ssh-label","ssh-user","ssh-host","ssh-port","ssh-key"].forEach(function(id) { panelEl.querySelector("#" + id).value = ""; });
    editingIndex = -1;
  }

  function loadConnections() {
    Promise.resolve().then(function () { return ctx.ipc.loadSsh(); })
      .then(function (data) { connections = Array.isArray(data) ? data : []; renderList(); })
      .catch(function () { connections = []; renderList(); });
  }
  function saveConnections() { try { ctx.ipc.saveSsh(connections); } catch (e) {} }

  function renderList() {
    var listEl = panelEl ? panelEl.querySelector("#ssh-list") : null;
    if (!listEl) return;
    if (connections.length === 0) {
      listEl.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;text-align:center;padding:30px 0;">No saved connections.<br><span style="font-size:11px;">Click + Add to create one.</span></div>';
      return;
    }
    var html = "";
    connections.forEach(function (c, i) {
      var portStr = c.port && c.port !== 22 ? ":" + c.port : "";
      html += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:6px;padding:10px;margin-bottom:6px;">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
      html += '<div><div style="color:var(--t-accent);font-weight:600;font-size:12px;margin-bottom:2px;">' + esc(c.label || "Unnamed") + '</div>';
      html += '<div style="color:var(--t-fg);opacity:0.5;font-size:11px;">' + esc(c.user + "@" + c.host + portStr) + '</div></div>';
      html += '<div style="display:flex;gap:4px;">';
      html += '<button data-ssh-connect="' + i + '" style="background:rgba(0,212,230,0.12);border:1px solid rgba(0,212,230,0.3);color:var(--t-accent);border-radius:3px;padding:3px 8px;cursor:pointer;font-size:10px;font-family:inherit;">Connect</button>';
      html += '<button data-ssh-edit="' + i + '" style="background:none;border:1px solid var(--t-border);color:var(--t-fg);opacity:0.5;border-radius:3px;padding:3px 6px;cursor:pointer;font-size:10px;font-family:inherit;">Edit</button>';
      html += '<button data-ssh-del="' + i + '" style="background:none;border:1px solid var(--t-border);color:var(--t-fg);opacity:0.4;border-radius:3px;padding:3px 6px;cursor:pointer;font-size:10px;font-family:inherit;">Del</button>';
      html += '</div></div></div>';
    });
    listEl.innerHTML = html;
    listEl.querySelectorAll("[data-ssh-connect]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.stopPropagation(); connectTo(parseInt(this.getAttribute("data-ssh-connect"), 10)); });
    });
    listEl.querySelectorAll("[data-ssh-edit]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.stopPropagation(); editConnection(parseInt(this.getAttribute("data-ssh-edit"), 10)); });
    });
    listEl.querySelectorAll("[data-ssh-del]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.stopPropagation(); var idx = parseInt(this.getAttribute("data-ssh-del"), 10); connections.splice(idx, 1); saveConnections(); renderList(); });
    });
  }

  function connectTo(idx) {
    var c = connections[idx];
    if (!c || !ctx.activeId) { ctx.showToast("No active terminal"); return; }
    var cmd = "ssh " + c.user + "@" + c.host;
    if (c.port && c.port !== 22) cmd += " -p " + c.port;
    if (c.key) cmd += " -i " + c.key;
    ctx.sendInput(ctx.activeId, cmd + "\n");
    ctx.showToast("Connecting to " + c.label + "...");
  }

  function editConnection(idx) {
    var c = connections[idx];
    if (!c || !panelEl) return;
    editingIndex = idx;
    panelEl.querySelector("#ssh-label").value = c.label || "";
    panelEl.querySelector("#ssh-user").value = c.user || "";
    panelEl.querySelector("#ssh-host").value = c.host || "";
    panelEl.querySelector("#ssh-port").value = c.port || 22;
    panelEl.querySelector("#ssh-key").value = c.key || "";
    panelEl.querySelector("#ssh-form").style.display = "";
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand({ label: "SSH: Open Connection Manager", category: "SSH", action: function () { if (!panelVisible) togglePanel(); } });
};
