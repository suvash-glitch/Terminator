/**
 * Snippet Runner — Extension plugin for Terminator
 *
 * Command snippet manager with categories, search, one-click execution,
 * and a side panel for organizing saved command snippets.
 */

exports.activate = function (ctx) {
  var panelId = "snippet-runner-panel";
  var panelEl = null;
  var panelVisible = false;
  var snippets = [];
  var filterText = "";
  var filterCategory = "";
  var editingIndex = -1;

  // ── Toolbar Button ──────────────────────────────────────────────────────
  ctx.addToolbarButton({
    id: "snippet-runner-btn",
    title: "Snippets",
    icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-2.5"/><path d="M5 4l2.5 2.5L5 9"/><path d="M8.5 9H12"/></svg>',
    onClick: function () {
      togglePanel();
    },
  });

  // ── Side Panel ──────────────────────────────────────────────────────────
  var panelHtml = [
    '<div id="sn-root" style="',
    "font-family:'SF Mono',Monaco,Consolas,monospace;",
    "font-size:12px;color:#ccc;background:#111;",
    "height:100%;display:flex;flex-direction:column;overflow:hidden;",
    '">',
    // Header
    '<div style="padding:10px 12px;background:#0d0d0d;border-bottom:1px solid #222;',
    '  display:flex;align-items:center;justify-content:space-between;">',
    '  <span style="font-size:13px;font-weight:600;color:#f78c6c;">',
    '    <span style="margin-right:6px;">&#9655;</span>Snippets</span>',
    '  <button id="sn-add-btn" style="background:#f78c6c22;border:1px solid #f78c6c44;',
    '    color:#f78c6c;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">',
    "    + Add</button>",
    "</div>",
    // Search bar
    '<div style="padding:8px 12px;background:#0d0d0d;border-bottom:1px solid #222;">',
    '  <input id="sn-search" placeholder="Search snippets..." style="',
    "    width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;",
    '    color:#ccc;border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;" />',
    '  <div id="sn-cats" style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;"></div>',
    "</div>",
    // Form (hidden)
    '<div id="sn-form" style="display:none;padding:10px 12px;background:#0a0a0a;border-bottom:1px solid #222;">',
    '  <div style="margin-bottom:6px;">',
    '    <input id="sn-name" placeholder="Snippet name" style="width:100%;box-sizing:border-box;',
    '      background:#1a1a1a;border:1px solid #333;color:#ccc;border-radius:4px;padding:6px 8px;',
    '      font-size:11px;font-family:inherit;" />',
    "  </div>",
    '  <div style="margin-bottom:6px;">',
    '    <textarea id="sn-cmd" placeholder="Command (supports multi-line)" rows="3" style="',
    "      width:100%;box-sizing:border-box;background:#1a1a1a;border:1px solid #333;color:#ccc;",
    '      border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;resize:vertical;" ></textarea>',
    "  </div>",
    '  <div style="margin-bottom:8px;">',
    '    <input id="sn-cat" placeholder="Category (e.g. git, docker, deploy)" style="width:100%;',
    "      box-sizing:border-box;background:#1a1a1a;border:1px solid #333;color:#ccc;",
    '      border-radius:4px;padding:6px 8px;font-size:11px;font-family:inherit;" />',
    "  </div>",
    '  <div style="display:flex;gap:6px;">',
    '    <button id="sn-save" style="flex:1;background:#f78c6c33;border:1px solid #f78c6c55;',
    '      color:#f78c6c;border-radius:4px;padding:5px 0;cursor:pointer;font-size:11px;',
    '      font-family:inherit;">Save</button>',
    '    <button id="sn-cancel" style="flex:1;background:#1a1a1a;border:1px solid #333;',
    '      color:#888;border-radius:4px;padding:5px 0;cursor:pointer;font-size:11px;',
    '      font-family:inherit;">Cancel</button>',
    "  </div>",
    "</div>",
    // List
    '<div id="sn-list" style="flex:1;overflow-y:auto;padding:8px 12px;"></div>',
    "</div>",
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, panelHtml);
  if (panelEl) {
    panelEl.style.display = "none";
    setupHandlers();
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelEl) {
      panelEl.style.display = panelVisible ? "" : "none";
    }
    if (panelVisible) loadSnippets();
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  function setupHandlers() {
    var addBtn = panelEl.querySelector("#sn-add-btn");
    var saveBtn = panelEl.querySelector("#sn-save");
    var cancelBtn = panelEl.querySelector("#sn-cancel");
    var searchInput = panelEl.querySelector("#sn-search");
    var form = panelEl.querySelector("#sn-form");

    addBtn.addEventListener("click", function () {
      editingIndex = -1;
      clearForm();
      form.style.display = "";
    });

    cancelBtn.addEventListener("click", function () {
      form.style.display = "none";
      clearForm();
    });

    saveBtn.addEventListener("click", function () {
      var name = panelEl.querySelector("#sn-name").value.trim();
      var cmd = panelEl.querySelector("#sn-cmd").value.trim();
      var cat = panelEl.querySelector("#sn-cat").value.trim() || "general";

      if (!name) {
        ctx.showToast("Name is required");
        return;
      }
      if (!cmd) {
        ctx.showToast("Command is required");
        return;
      }

      var snippet = { name: name, command: cmd, category: cat };

      if (editingIndex >= 0 && editingIndex < snippets.length) {
        snippets[editingIndex] = snippet;
      } else {
        snippets.push(snippet);
      }

      saveSnippets();
      form.style.display = "none";
      clearForm();
      renderAll();
    });

    searchInput.addEventListener("input", function () {
      filterText = this.value.toLowerCase();
      renderList();
    });
  }

  function clearForm() {
    if (!panelEl) return;
    panelEl.querySelector("#sn-name").value = "";
    panelEl.querySelector("#sn-cmd").value = "";
    panelEl.querySelector("#sn-cat").value = "";
    editingIndex = -1;
  }

  // ── Data ────────────────────────────────────────────────────────────────
  function loadSnippets() {
    Promise.resolve()
      .then(function () {
        return ctx.ipc.loadSnippets();
      })
      .then(function (data) {
        snippets = Array.isArray(data) ? data : [];
        renderAll();
      })
      .catch(function () {
        snippets = [];
        renderAll();
      });
  }

  function saveSnippets() {
    try {
      ctx.ipc.saveSnippets(snippets);
    } catch (e) {
      // silent
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function renderAll() {
    renderCategories();
    renderList();
  }

  function getCategories() {
    var cats = {};
    snippets.forEach(function (s) {
      var c = s.category || "general";
      cats[c] = (cats[c] || 0) + 1;
    });
    return cats;
  }

  function renderCategories() {
    var catsEl = panelEl ? panelEl.querySelector("#sn-cats") : null;
    if (!catsEl) return;

    var cats = getCategories();
    var keys = Object.keys(cats).sort();

    if (keys.length === 0) {
      catsEl.innerHTML = "";
      return;
    }

    var html =
      '<button data-sn-cat="" style="' +
      catBtnStyle(!filterCategory) +
      '">All (' +
      snippets.length +
      ")</button>";

    keys.forEach(function (k) {
      html +=
        '<button data-sn-cat="' +
        escHtml(k) +
        '" style="' +
        catBtnStyle(filterCategory === k) +
        '">' +
        escHtml(k) +
        " (" +
        cats[k] +
        ")</button>";
    });

    catsEl.innerHTML = html;

    catsEl.querySelectorAll("[data-sn-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterCategory = this.getAttribute("data-sn-cat");
        renderAll();
      });
    });
  }

  function catBtnStyle(active) {
    if (active) {
      return (
        "background:#f78c6c33;border:1px solid #f78c6c55;color:#f78c6c;" +
        "border-radius:3px;padding:2px 8px;cursor:pointer;font-size:10px;font-family:inherit;"
      );
    }
    return (
      "background:#1a1a1a;border:1px solid #333;color:#666;" +
      "border-radius:3px;padding:2px 8px;cursor:pointer;font-size:10px;font-family:inherit;"
    );
  }

  function renderList() {
    var listEl = panelEl ? panelEl.querySelector("#sn-list") : null;
    if (!listEl) return;

    var filtered = snippets.filter(function (s, i) {
      if (filterCategory && (s.category || "general") !== filterCategory) return false;
      if (filterText) {
        var haystack = (s.name + " " + s.command + " " + s.category).toLowerCase();
        if (haystack.indexOf(filterText) < 0) return false;
      }
      return true;
    });

    if (snippets.length === 0) {
      listEl.innerHTML =
        '<div style="color:#555;text-align:center;padding:30px 0;">' +
        "No snippets yet.<br>" +
        '<span style="font-size:11px;color:#444;">Click + Add to create one.</span></div>';
      return;
    }

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div style="color:#555;text-align:center;padding:20px 0;">No matching snippets.</div>';
      return;
    }

    var html = "";
    filtered.forEach(function (s) {
      var originalIdx = snippets.indexOf(s);
      var cmdPreview = s.command.length > 80 ? s.command.substring(0, 80) + "\u2026" : s.command;

      html +=
        '<div style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:10px;margin-bottom:6px;">';

      // Header row
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
      html +=
        '<div style="font-weight:600;color:#f78c6c;font-size:12px;">' +
        escHtml(s.name) +
        "</div>";
      html +=
        '<span style="background:#222;color:#666;border-radius:3px;padding:1px 6px;font-size:9px;">' +
        escHtml(s.category || "general") +
        "</span>";
      html += "</div>";

      // Command preview
      html +=
        '<div style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:4px;padding:6px 8px;' +
        'color:#888;font-size:11px;margin-bottom:8px;word-break:break-all;white-space:pre-wrap;">' +
        escHtml(cmdPreview) +
        "</div>";

      // Action buttons
      html += '<div style="display:flex;gap:4px;">';
      html +=
        '<button data-sn-run="' +
        originalIdx +
        '" style="flex:1;background:#f78c6c22;border:1px solid #f78c6c44;' +
        'color:#f78c6c;border-radius:3px;padding:4px 0;cursor:pointer;font-size:10px;font-family:inherit;">' +
        "Run</button>";
      html +=
        '<button data-sn-edit="' +
        originalIdx +
        '" style="background:none;border:1px solid #333;' +
        'color:#666;border-radius:3px;padding:4px 8px;cursor:pointer;font-size:10px;font-family:inherit;">' +
        "Edit</button>";
      html +=
        '<button data-sn-del="' +
        originalIdx +
        '" style="background:none;border:1px solid #333;' +
        'color:#555;border-radius:3px;padding:4px 8px;cursor:pointer;font-size:10px;font-family:inherit;">' +
        "Del</button>";
      html += "</div></div>";
    });

    listEl.innerHTML = html;

    // Attach handlers
    listEl.querySelectorAll("[data-sn-run]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-sn-run"), 10);
        runSnippet(idx);
      });
    });

    listEl.querySelectorAll("[data-sn-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-sn-edit"), 10);
        editSnippet(idx);
      });
    });

    listEl.querySelectorAll("[data-sn-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-sn-del"), 10);
        snippets.splice(idx, 1);
        saveSnippets();
        renderAll();
      });
    });
  }

  function runSnippet(idx) {
    var s = snippets[idx];
    if (!s) return;
    if (!ctx.activeId) {
      ctx.showToast("No active terminal");
      return;
    }

    // Handle multi-line commands: send each line with delay
    var lines = s.command.split("\n").filter(function (l) { return l.trim(); });
    lines.forEach(function (line, i) {
      setTimeout(function () {
        ctx.sendInput(ctx.activeId, line + "\n");
      }, i * 300);
    });

    ctx.showToast("Running: " + s.name);
  }

  function editSnippet(idx) {
    var s = snippets[idx];
    if (!s || !panelEl) return;
    editingIndex = idx;
    panelEl.querySelector("#sn-name").value = s.name || "";
    panelEl.querySelector("#sn-cmd").value = s.command || "";
    panelEl.querySelector("#sn-cat").value = s.category || "";
    panelEl.querySelector("#sn-form").style.display = "";
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Command Palette ─────────────────────────────────────────────────────
  ctx.registerCommand({
    label: "Snippets: Open Panel",
    category: "Snippets",
    action: function () {
      if (!panelVisible) togglePanel();
    },
  });
};
