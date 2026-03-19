(function () {
  "use strict";

  // ============================================================
  // STATE
  // ============================================================
  var state = {
    type: "theme",
    meta: { id: "", name: "", desc: "", version: "1.0.0", author: "" },
    theme: {
      background: "#1e1e2e", foreground: "#cdd6f4", ui: "#181825", border: "#313244",
      cursor: "#f5e0dc", selection: "rgba(88,91,112,0.35)",
      black: "#45475a", red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af",
      blue: "#89b4fa", magenta: "#f5c2e7", cyan: "#94e2d5", white: "#bac2de",
      brightBlack: "#585b70", brightRed: "#f38ba8", brightGreen: "#a6e3a1",
      brightYellow: "#f9e2af", brightBlue: "#89b4fa", brightMagenta: "#cba6f7",
      brightCyan: "#89dceb", brightWhite: "#a6adc8",
    },
    cmd: { label: "", shortcut: "", terminal: "", notify: "" },
    sb: { name: "", template: "", expr: "" },
    ext: {
      features: { toolbar: true, sidepanel: true, command: false, settings: false, hooks: false, contextmenu: false },
      panelTitle: "", panelHtml: "",
    },
    codeOverride: null, // if user manually edited code
    activeOutputFile: "plugin.json",
  };

  // ============================================================
  // DOM REFS
  // ============================================================
  var $ = function (id) { return document.getElementById(id); };
  var toast = $("toast");

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("visible"); }, 2500);
  }

  // ============================================================
  // TYPE SELECTOR
  // ============================================================
  var typeCards = document.querySelectorAll(".type-card");
  var builders = { theme: $("builder-theme"), command: $("builder-command"), statusbar: $("builder-statusbar"), extension: $("builder-extension") };

  typeCards.forEach(function (card) {
    card.addEventListener("click", function () {
      typeCards.forEach(function (c) { c.classList.remove("active"); });
      card.classList.add("active");
      state.type = card.dataset.type;
      Object.values(builders).forEach(function (b) { b.style.display = "none"; });
      if (builders[state.type]) builders[state.type].style.display = "";
      state.codeOverride = null;
      updateCodeEditor();
      updateOutput();
    });
  });

  // ============================================================
  // TABS
  // ============================================================
  var mainTabs = document.querySelectorAll("#main-tabs .tab");
  var mainPanes = document.querySelectorAll(".tab-pane");

  mainTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      mainTabs.forEach(function (t) { t.classList.remove("active"); });
      mainPanes.forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      $("pane-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "code") updateCodeEditor();
      if (tab.dataset.tab === "output") updateOutput();
    });
  });

  // Output file tabs
  $("output-tabs").addEventListener("click", function (e) {
    var tab = e.target.closest(".output-file-tab");
    if (!tab) return;
    document.querySelectorAll(".output-file-tab").forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");
    state.activeOutputFile = tab.dataset.file;
    updateOutput();
  });

  // ============================================================
  // METADATA BINDINGS
  // ============================================================
  ["meta-id", "meta-name", "meta-desc", "meta-version", "meta-author"].forEach(function (id) {
    var key = id.replace("meta-", "");
    $(id).addEventListener("input", function () {
      state.meta[key] = this.value;
      state.codeOverride = null;
      updateCodeEditor();
    });
  });

  // ============================================================
  // THEME BUILDER
  // ============================================================
  var THEME_COLORS = [
    { group: "Base", colors: [
      { key: "background", label: "Background" }, { key: "foreground", label: "Foreground" },
      { key: "ui", label: "UI Panel" }, { key: "border", label: "Border" },
      { key: "cursor", label: "Cursor" },
    ]},
    { group: "Normal Colors", colors: [
      { key: "black", label: "Black" }, { key: "red", label: "Red" },
      { key: "green", label: "Green" }, { key: "yellow", label: "Yellow" },
      { key: "blue", label: "Blue" }, { key: "magenta", label: "Magenta" },
      { key: "cyan", label: "Cyan" }, { key: "white", label: "White" },
    ]},
    { group: "Bright Colors", colors: [
      { key: "brightBlack", label: "Bright Black" }, { key: "brightRed", label: "Bright Red" },
      { key: "brightGreen", label: "Bright Green" }, { key: "brightYellow", label: "Bright Yellow" },
      { key: "brightBlue", label: "Bright Blue" }, { key: "brightMagenta", label: "Bright Magenta" },
      { key: "brightCyan", label: "Bright Cyan" }, { key: "brightWhite", label: "Bright White" },
    ]},
  ];

  function buildThemeUI() {
    var container = $("theme-colors");
    container.innerHTML = "";
    THEME_COLORS.forEach(function (group) {
      var div = document.createElement("div");
      div.className = "color-group";
      div.innerHTML = '<div class="color-group-title">' + group.group + '</div>';
      group.colors.forEach(function (c) {
        var row = document.createElement("div");
        row.className = "color-row";
        row.innerHTML =
          '<label>' + c.label + '</label>' +
          '<div class="color-swatch" style="background:' + state.theme[c.key] + '">' +
          '<input type="color" value="' + state.theme[c.key] + '" data-key="' + c.key + '">' +
          '</div>' +
          '<input type="text" class="color-hex" value="' + state.theme[c.key] + '" data-key="' + c.key + '">';
        div.appendChild(row);
      });
      container.appendChild(div);
    });
    // Bind color inputs
    container.querySelectorAll("input[type=color]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        state.theme[inp.dataset.key] = inp.value;
        var row = inp.closest(".color-row");
        row.querySelector(".color-swatch").style.background = inp.value;
        row.querySelector(".color-hex").value = inp.value;
        state.codeOverride = null;
        updateThemePreview();
        updateCodeEditor();
      });
    });
    container.querySelectorAll(".color-hex").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var val = inp.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          state.theme[inp.dataset.key] = val;
          var row = inp.closest(".color-row");
          row.querySelector(".color-swatch").style.background = val;
          row.querySelector("input[type=color]").value = val;
          state.codeOverride = null;
          updateThemePreview();
          updateCodeEditor();
        }
      });
    });
  }

  function updateThemePreview() {
    var t = state.theme;
    var titlebar = $("tp-titlebar");
    var body = $("tp-body");
    var term = $("theme-preview-term");
    titlebar.style.background = t.ui;
    titlebar.style.borderBottom = "1px solid " + t.border;
    body.style.background = t.background;
    body.style.color = t.foreground;
    term.style.borderColor = t.border;
    body.innerHTML =
      '<div><span style="color:' + t.green + '">user@host</span>' +
      '<span style="color:' + t.foreground + '">:</span>' +
      '<span style="color:' + t.blue + '">~/projects</span>' +
      '<span style="color:' + t.foreground + '">$ </span>' +
      '<span style="color:' + t.foreground + '">npm run build</span></div>' +
      '<div style="color:' + t.yellow + '">warning: </span><span style="color:' + t.foreground + '">unused variable \'x\'</span></div>' +
      '<div style="color:' + t.red + '">error: </span><span style="color:' + t.foreground + '">module not found</span></div>' +
      '<div style="color:' + t.green + '">Build complete!</span></div>' +
      '<div style="color:' + t.cyan + '">info: </span><span style="color:' + t.foreground + '">3 files compiled</span></div>' +
      '<div><span style="color:' + t.magenta + '">function</span> <span style="color:' + t.blue + '">hello</span>() {</div>' +
      '<div>  <span style="color:' + t.magenta + '">return</span> <span style="color:' + t.yellow + '">"world"</span>;</div>' +
      '<div>}</div>' +
      '<div style="margin-top:8px"><span style="color:' + t.brightBlack + '">// bright colors:</span></div>' +
      '<div><span style="color:' + t.brightRed + '">red</span> ' +
      '<span style="color:' + t.brightGreen + '">green</span> ' +
      '<span style="color:' + t.brightYellow + '">yellow</span> ' +
      '<span style="color:' + t.brightBlue + '">blue</span> ' +
      '<span style="color:' + t.brightMagenta + '">magenta</span> ' +
      '<span style="color:' + t.brightCyan + '">cyan</span></div>' +
      '<div style="margin-top:8px"><span style="color:' + t.green + '">user@host</span>:<span style="color:' + t.blue + '">~</span>$ ' +
      '<span style="display:inline-block;width:8px;height:15px;background:' + t.cursor + ';vertical-align:text-bottom;animation:blink 1s step-end infinite"></span></div>';
  }

  buildThemeUI();
  updateThemePreview();

  // ============================================================
  // COMMAND BUILDER BINDINGS
  // ============================================================
  ["cmd-label", "cmd-shortcut", "cmd-terminal", "cmd-notify"].forEach(function (id) {
    var key = id.replace("cmd-", "");
    $(id).addEventListener("input", function () {
      state.cmd[key] = this.value;
      state.codeOverride = null;
      updateCodeEditor();
    });
  });

  // ============================================================
  // STATUSBAR BUILDER BINDINGS
  // ============================================================
  ["sb-name", "sb-template", "sb-expr"].forEach(function (id) {
    var key = id.replace("sb-", "");
    $(id).addEventListener("input", function () {
      state.sb[key] = this.value;
      state.codeOverride = null;
      updateCodeEditor();
    });
  });

  // ============================================================
  // EXTENSION BUILDER BINDINGS
  // ============================================================
  document.querySelectorAll(".ext-feature input[type=checkbox]").forEach(function (cb) {
    var feature = cb.closest(".ext-feature").dataset.feature;
    cb.addEventListener("change", function () {
      state.ext.features[feature] = cb.checked;
      state.codeOverride = null;
      updateCodeEditor();
    });
  });
  $("ext-panel-title").addEventListener("input", function () { state.ext.panelTitle = this.value; state.codeOverride = null; updateCodeEditor(); });
  $("ext-panel-html").addEventListener("input", function () { state.ext.panelHtml = this.value; state.codeOverride = null; updateCodeEditor(); });

  // ============================================================
  // CODE GENERATION
  // ============================================================
  function generatePluginJson() {
    return JSON.stringify({
      name: state.meta.id || "my-extension",
      version: state.meta.version || "1.0.0",
      description: state.meta.desc || "",
      type: state.type,
      main: "index.js",
      author: state.meta.author || "Custom",
      homepage: "",
    }, null, 2);
  }

  function generateIndexJs() {
    if (state.codeOverride !== null) return state.codeOverride;
    switch (state.type) {
      case "theme": return generateThemeCode();
      case "command": return generateCommandCode();
      case "statusbar": return generateStatusbarCode();
      case "extension": return generateExtensionCode();
    }
    return "// Unknown type\n";
  }

  function esc(s) { return JSON.stringify(s); }

  function generateThemeCode() {
    var t = state.theme;
    var lines = ["exports.theme = {"];
    lines.push('  name: ' + esc(state.meta.name || state.meta.id || "My Theme") + ',');
    lines.push('  background: ' + esc(t.background) + ',');
    lines.push('  foreground: ' + esc(t.foreground) + ',');
    lines.push('  ui: ' + esc(t.ui) + ',');
    lines.push('  border: ' + esc(t.border) + ',');
    lines.push('  cursor: ' + esc(t.cursor) + ',');
    lines.push('  selection: ' + esc(t.selection) + ',');
    var colorKeys = ["black","red","green","yellow","blue","magenta","cyan","white",
      "brightBlack","brightRed","brightGreen","brightYellow","brightBlue","brightMagenta","brightCyan","brightWhite"];
    colorKeys.forEach(function (k) { lines.push('  ' + k + ': ' + esc(t[k]) + ','); });
    lines.push("};");
    return lines.join("\n") + "\n";
  }

  function generateCommandCode() {
    var c = state.cmd;
    var lines = [];
    lines.push('exports.name = ' + esc(c.label || state.meta.name || "My Command") + ';');
    lines.push('exports.description = ' + esc(state.meta.desc || "") + ';');
    lines.push('exports.shortcut = ' + esc(c.shortcut || "") + ';');
    lines.push('exports.execute = function (ctx) {');
    lines.push('  var pane = ctx.activePane;');
    lines.push('  if (!pane) { ctx.notify("No active terminal"); return; }');
    if (c.terminal) {
      lines.push('  ctx.sendInput(pane.id, ' + esc(c.terminal.replace(/\\n/g, "\n") + "\n") + ');');
    }
    if (c.notify) {
      lines.push('  ctx.notify(' + esc(c.notify) + ');');
    }
    lines.push('};');
    return lines.join("\n") + "\n";
  }

  function generateStatusbarCode() {
    var s = state.sb;
    var lines = [];
    lines.push('exports.name = ' + esc(s.name || state.meta.name || "My Widget") + ';');
    lines.push('');
    lines.push('exports.render = function (ctx) {');
    if (s.expr) {
      lines.push('  var dynamic = (function () {');
      lines.push('    ' + s.expr);
      lines.push('  })();');
      if (s.template) {
        lines.push('  return ' + esc(s.template) + '.replace("{{dynamic}}", dynamic);');
      } else {
        lines.push('  return "<span>" + dynamic + "</span>";');
      }
    } else if (s.template) {
      lines.push('  return ' + esc(s.template) + ';');
    } else {
      lines.push('  return "<span>Widget</span>";');
    }
    lines.push('};');
    return lines.join("\n") + "\n";
  }

  function generateExtensionCode() {
    var f = state.ext.features;
    var lines = [];
    lines.push('exports.activate = function (ctx) {');
    var panelId = (state.meta.id || "my-ext") + "-panel";
    var btnId = (state.meta.id || "my-ext") + "-btn";

    // Side panel
    if (f.sidepanel) {
      var title = state.ext.panelTitle || state.meta.name || "My Panel";
      var html = state.ext.panelHtml || "<p>Hello from my extension!</p>";
      lines.push('  var panelVisible = false;');
      lines.push('  var panelEl = ctx.addSidePanel(' + esc(panelId) + ', [');
      lines.push('    \'<div class="side-panel-header"><h3>' + title.replace(/'/g, "\\'") + '</h3>\',');
      lines.push('    \'<button class="side-panel-close" id="' + panelId + '-close">\',');
      lines.push('    \'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\',');
      lines.push('    \'</button></div>\',');
      lines.push('    \'<div class="side-panel-body" style="padding:16px">\',');
      lines.push('    ' + esc(html) + ',');
      lines.push('    \'</div>\'');
      lines.push('  ].join("\\n"));');
      lines.push('');
      lines.push('  function togglePanel() {');
      lines.push('    panelVisible = !panelVisible;');
      lines.push('    if (panelEl) panelEl.classList.toggle("visible", panelVisible);');
      lines.push('  }');
      lines.push('');
      lines.push('  var closeBtn = document.getElementById(' + esc(panelId + "-close") + ');');
      lines.push('  if (closeBtn) closeBtn.addEventListener("click", togglePanel);');
      lines.push('');
    }

    // Toolbar button
    if (f.toolbar) {
      lines.push('  ctx.addToolbarButton({');
      lines.push('    id: ' + esc(btnId) + ',');
      lines.push('    title: ' + esc(state.meta.name || "My Extension") + ',');
      lines.push('    icon: \'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/></svg>\',');
      if (f.sidepanel) {
        lines.push('    onClick: function () { togglePanel(); }');
      } else {
        lines.push('    onClick: function () { ctx.showToast("Extension activated!"); }');
      }
      lines.push('  });');
      lines.push('');
    }

    // Command palette
    if (f.command) {
      lines.push('  ctx.registerCommand({');
      lines.push('    label: ' + esc(state.meta.name || "My Extension") + ',');
      if (f.sidepanel) {
        lines.push('    action: function () { togglePanel(); },');
      } else {
        lines.push('    action: function () { ctx.showToast("Extension command executed!"); },');
      }
      lines.push('    category: "Plugins"');
      lines.push('  });');
      lines.push('');
    }

    // Settings section
    if (f.settings) {
      lines.push('  ctx.addSettingsSection([');
      lines.push('    \'<div class="settings-section">\',');
      lines.push('    \'<div class="settings-section-title">' + (state.meta.name || "My Extension").replace(/'/g, "\\'") + '</div>\',');
      lines.push('    \'<div class="settings-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">\',');
      lines.push('    \'<label>Enabled</label>\',');
      lines.push('    \'<input type="checkbox" id="setting-' + (state.meta.id || "my-ext") + '-enabled" checked style="accent-color:#00f0ff">\',');
      lines.push('    \'</div></div>\'');
      lines.push('  ].join("\\n"));');
      lines.push('');
    }

    // Terminal hooks
    if (f.hooks) {
      lines.push('  ctx.on("terminalInput", function (id, data) {');
      lines.push('    // Process terminal input here');
      lines.push('    // Return true to consume the input');
      lines.push('    return false;');
      lines.push('  });');
      lines.push('');
    }

    // Context menu
    if (f.contextmenu) {
      lines.push('  ctx.on("contextMenu", function (paneId) {');
      lines.push('    return [{');
      lines.push('      label: ' + esc(state.meta.name || "My Extension") + ',');
      if (f.sidepanel) {
        lines.push('      action: function () { togglePanel(); }');
      } else {
        lines.push('      action: function () { ctx.showToast("Context menu action!"); }');
      }
      lines.push('    }];');
      lines.push('  });');
      lines.push('');
    }

    lines.push('  ctx.showToast(' + esc((state.meta.name || "Extension") + " activated") + ');');
    lines.push('};');
    return lines.join("\n") + "\n";
  }

  // ============================================================
  // CODE EDITOR
  // ============================================================
  var codeEditor = $("code-editor");

  function updateCodeEditor() {
    if (state.codeOverride === null) {
      codeEditor.value = generateIndexJs();
    }
  }

  codeEditor.addEventListener("input", function () {
    state.codeOverride = codeEditor.value;
  });

  updateCodeEditor();

  // ============================================================
  // OUTPUT
  // ============================================================
  function updateOutput() {
    var content = $("output-content");
    if (state.activeOutputFile === "plugin.json") {
      content.textContent = generatePluginJson();
    } else {
      content.textContent = state.codeOverride !== null ? state.codeOverride : generateIndexJs();
    }
  }

  // ============================================================
  // PREVIEW (header button — switches to visual tab)
  // ============================================================
  $("btn-preview").addEventListener("click", function () {
    mainTabs.forEach(function (t) { t.classList.remove("active"); });
    mainPanes.forEach(function (p) { p.classList.remove("active"); });
    mainTabs[0].classList.add("active");
    mainPanes[0].classList.add("active");
    if (state.type === "theme") updateThemePreview();
    showToast("Preview updated");
  });

  // ============================================================
  // LIVE PREVIEW (in code editor pane)
  // ============================================================
  function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function runLivePreview() {
    var previewEl = $("code-preview");
    var code = state.codeOverride !== null ? state.codeOverride : generateIndexJs();

    try {
      // Parse the code to determine what it produces
      var pluginExports = {};
      var fn = new Function("exports", code);
      fn(pluginExports);

      var html = "";

      // === THEME PREVIEW ===
      if (pluginExports.theme) {
        var t = pluginExports.theme;
        html += '<div class="sim-section-label">Theme: ' + escHtml(t.name || "Untitled") + '</div>';
        html += '<div class="sim-terminal">';
        html += '<div class="sim-titlebar" style="background:' + (t.ui || t.background || "#1e1e2e") + '">';
        html += '<div class="sim-dot" style="background:#ff5f57"></div>';
        html += '<div class="sim-dot" style="background:#febc2e"></div>';
        html += '<div class="sim-dot" style="background:#28c840"></div>';
        html += '<div class="sim-titlebar-text">Terminal</div></div>';
        html += '<div class="sim-body" style="background:' + (t.background || "#1e1e2e") + ';color:' + (t.foreground || "#ccc") + '">';
        html += '<span style="color:' + (t.green || "#0f0") + '">user@host</span>:<span style="color:' + (t.blue || "#00f") + '">~/project</span>$ npm run dev<br>';
        html += '<span style="color:' + (t.yellow || "#ff0") + '">warning:</span> unused import<br>';
        html += '<span style="color:' + (t.red || "#f00") + '">error:</span> missing semicolon<br>';
        html += '<span style="color:' + (t.green || "#0f0") + '">success:</span> build complete<br>';
        html += '<span style="color:' + (t.cyan || "#0ff") + '">info:</span> 12 files compiled<br>';
        html += '<span style="color:' + (t.magenta || "#f0f") + '">const</span> x = <span style="color:' + (t.yellow || "#ff0") + '">"hello"</span>;<br>';
        html += '<span style="color:' + (t.brightBlack || "#888") + '">// comment</span><br>';
        html += '<br>$ <span style="display:inline-block;width:8px;height:14px;background:' + (t.cursor || "#fff") + ';vertical-align:text-bottom"></span>';
        html += '</div></div>';
        // Color swatches
        html += '<div class="sim-section-label" style="margin-top:16px">Color Palette</div>';
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
        var colorKeys = ["black","red","green","yellow","blue","magenta","cyan","white","brightBlack","brightRed","brightGreen","brightYellow","brightBlue","brightMagenta","brightCyan","brightWhite"];
        colorKeys.forEach(function(k) {
          if (t[k]) html += '<div style="width:28px;height:28px;border-radius:6px;background:' + t[k] + ';border:1px solid rgba(255,255,255,0.1)" title="' + k + '"></div>';
        });
        html += '</div>';
      }

      // === COMMAND PREVIEW ===
      else if (pluginExports.name && pluginExports.execute) {
        html += '<div class="sim-section-label">Command Palette</div>';
        html += '<div class="sim-palette">';
        html += '<div class="sim-palette-input">Type a command...</div>';
        html += '<div class="sim-palette-item active"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21"/></svg> ' + escHtml(pluginExports.name) + '</div>';
        html += '<div class="sim-palette-item" style="opacity:.4">Other Command...</div>';
        html += '<div class="sim-palette-item" style="opacity:.3">Another Command...</div>';
        html += '</div>';
        if (pluginExports.description) {
          html += '<div style="font-size:12px;color:var(--text2);margin-bottom:12px">' + escHtml(pluginExports.description) + '</div>';
        }
        // Simulate execution
        html += '<div class="sim-section-label">Simulated Execution</div>';
        html += '<div class="sim-terminal"><div class="sim-titlebar">';
        html += '<div class="sim-dot" style="background:#ff5f57"></div><div class="sim-dot" style="background:#febc2e"></div><div class="sim-dot" style="background:#28c840"></div>';
        html += '<div class="sim-titlebar-text">Terminal</div></div>';
        html += '<div class="sim-body" style="background:#1e1e2e;color:#cdd6f4">';
        // Run the execute with a mock ctx
        var mockOutput = [];
        var mockCtx = {
          activePane: { id: 1 },
          allPanes: [{ id: 1 }],
          sendInput: function (id, data) { mockOutput.push({ type: "input", data: data }); },
          createTerminal: function () { mockOutput.push({ type: "notify", data: "New terminal created" }); },
          notify: function (msg) { mockOutput.push({ type: "notify", data: msg }); },
        };
        try {
          pluginExports.execute(mockCtx);
          mockOutput.forEach(function (o) {
            if (o.type === "input") {
              html += '<span style="color:#a6e3a1">$</span> ' + escHtml(o.data.replace(/\n$/, "")) + '<br>';
            } else {
              html += '<span style="color:#89b4fa">[toast]</span> ' + escHtml(o.data) + '<br>';
            }
          });
          if (mockOutput.length === 0) html += '<span style="color:#585b70">(no output)</span>';
        } catch (e) {
          html += '<span style="color:#f38ba8">Execution error: ' + escHtml(e.message) + '</span>';
        }
        html += '</div></div>';
      }

      // === STATUSBAR PREVIEW ===
      else if (pluginExports.render) {
        html += '<div class="sim-section-label">Status Bar Widget</div>';
        var mockSbCtx = {
          activePane: { id: 1 },
          allPanes: [{ id: 1 }, { id: 2 }, { id: 3 }],
        };
        var rendered = "";
        try { rendered = pluginExports.render(mockSbCtx); } catch (e) { rendered = '<span style="color:var(--red)">Error: ' + escHtml(e.message) + '</span>'; }
        html += '<div class="sim-statusbar">';
        html += '<span style="color:var(--text3)">zsh</span>';
        html += '<span style="color:var(--text3)">~/project</span>';
        html += '<span style="border-left:1px solid var(--border);padding-left:8px">' + rendered + '</span>';
        html += '<span style="margin-left:auto;color:var(--text3)">3 panes</span>';
        html += '</div>';
        html += '<div class="sim-section-label" style="margin-top:16px">Raw HTML Output</div>';
        html += '<div style="padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);font-family:var(--mono);font-size:11px;color:var(--text2);word-break:break-all">' + escHtml(rendered) + '</div>';
      }

      // === EXTENSION PREVIEW ===
      else if (pluginExports.activate) {
        var mockElems = { toolbar: [], panels: [], commands: [], settings: [] };
        var mockExtCtx = {
          activeId: 1,
          getPane: function () { return { term: null, el: null }; },
          get allPaneIds() { return [1, 2]; },
          fontSize: 13,
          broadcastMode: false,
          skipPermissions: false,
          sendInput: function () {},
          broadcast: function () {},
          showToast: function (msg) { mockElems.toastMsg = msg; },
          get settings() { return {}; },
          saveSettings: function () {},
          get ipc() { return {}; },
          on: function () {},
          off: function () {},
          registerCommand: function (cmd) { mockElems.commands.push(cmd); },
          addToolbarButton: function (opts) { mockElems.toolbar.push(opts); },
          addSidePanel: function (id, panelHtml) {
            mockElems.panels.push({ id: id, html: panelHtml });
            var el = document.createElement("div");
            el.innerHTML = panelHtml;
            return el;
          },
          addSettingsSection: function (settingsHtml) { mockElems.settings.push(settingsHtml); },
        };
        try {
          pluginExports.activate(mockExtCtx);
        } catch (e) {
          html += '<div class="sim-error">Activation error: ' + escHtml(e.message) + '</div>';
        }

        // Show what was registered
        if (mockElems.toolbar.length) {
          html += '<div class="sim-section-label">Toolbar Buttons</div>';
          html += '<div class="sim-toolbar">';
          html += '<div class="sim-toolbar-btn" style="opacity:.4">Split</div><div class="sim-toolbar-btn" style="opacity:.4">Tab</div>';
          mockElems.toolbar.forEach(function (b) {
            html += '<div class="sim-toolbar-btn highlight">' + (b.icon || "") + ' ' + escHtml(b.title || "") + '</div>';
          });
          html += '</div>';
        }
        if (mockElems.panels.length) {
          html += '<div class="sim-section-label">Side Panels</div>';
          mockElems.panels.forEach(function (p) {
            html += '<div class="sim-panel">';
            html += '<div class="sim-panel-header">' + escHtml(p.id) + '</div>';
            html += '<div class="sim-panel-body">' + p.html + '</div>';
            html += '</div>';
          });
        }
        if (mockElems.commands.length) {
          html += '<div class="sim-section-label">Command Palette Entries</div>';
          html += '<div class="sim-palette">';
          html += '<div class="sim-palette-input">Type a command...</div>';
          mockElems.commands.forEach(function (c) {
            html += '<div class="sim-palette-item active">' + escHtml(c.label || "Command") + '</div>';
          });
          html += '</div>';
        }
        if (mockElems.settings.length) {
          html += '<div class="sim-section-label">Settings Section</div>';
          mockElems.settings.forEach(function (s) {
            html += '<div style="padding:12px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);margin-bottom:8px">' + s + '</div>';
          });
        }
        if (mockElems.toastMsg) {
          html += '<div class="sim-section-label">Toast Message</div>';
          html += '<div style="padding:8px 16px;background:var(--accent-dim);border:1px solid var(--border-accent);border-radius:8px;font-size:12px;color:var(--accent);display:inline-block">' + escHtml(mockElems.toastMsg) + '</div>';
        }
        if (!html) html = '<div style="color:var(--text3);padding:20px;text-align:center">Extension registered no UI elements</div>';
      }

      else {
        html = '<div style="color:var(--text3);padding:20px;text-align:center">Could not determine extension type from code.<br>Make sure you export <code>theme</code>, <code>name+execute</code>, <code>render</code>, or <code>activate</code>.</div>';
      }

      previewEl.innerHTML = html;
    } catch (e) {
      previewEl.innerHTML = '<div class="sim-error">Parse Error:\n\n' + escHtml(e.message) + '</div>';
    }
  }

  $("btn-run-preview").addEventListener("click", runLivePreview);

  // Auto-run preview on code change (debounced)
  var _previewDebounce;
  codeEditor.addEventListener("input", function () {
    clearTimeout(_previewDebounce);
    _previewDebounce = setTimeout(function () {
      // Only auto-preview if the preview pane is visible
      if ($("pane-code").classList.contains("active")) runLivePreview();
    }, 800);
  });

  // ============================================================
  // EXPORT .termext
  // ============================================================
  $("btn-export").addEventListener("click", function () {
    var pluginJson = generatePluginJson();
    var indexJs = state.codeOverride !== null ? state.codeOverride : generateIndexJs();

    // Validate
    try { JSON.parse(pluginJson); } catch (e) { showToast("Invalid plugin.json: " + e.message); return; }
    if (!indexJs.trim()) { showToast("index.js is empty"); return; }

    // Build zip using JSZip-compatible manual approach
    // Since we can't use libraries, create a downloadable zip using Blob
    createAndDownloadZip(state.meta.id || "my-extension", {
      "plugin.json": pluginJson,
      "index.js": indexJs,
    });
  });

  // Minimal zip creator (no dependencies)
  function createAndDownloadZip(name, files) {
    var fileEntries = Object.entries(files);
    var localHeaders = [];
    var centralHeaders = [];
    var offset = 0;

    fileEntries.forEach(function (entry) {
      var fileName = entry[0];
      var content = entry[1];
      var encoded = new TextEncoder().encode(content);
      var fnEncoded = new TextEncoder().encode(fileName);

      // CRC32
      var crc = crc32(encoded);

      // Local file header
      var local = new Uint8Array(30 + fnEncoded.length + encoded.length);
      var v = new DataView(local.buffer);
      v.setUint32(0, 0x04034b50, true); // signature
      v.setUint16(4, 20, true); // version needed
      v.setUint16(6, 0, true); // flags
      v.setUint16(8, 0, true); // compression (store)
      v.setUint16(10, 0, true); // mod time
      v.setUint16(12, 0, true); // mod date
      v.setUint32(14, crc, true); // crc32
      v.setUint32(18, encoded.length, true); // compressed size
      v.setUint32(22, encoded.length, true); // uncompressed size
      v.setUint16(26, fnEncoded.length, true); // filename length
      v.setUint16(28, 0, true); // extra field length
      local.set(fnEncoded, 30);
      local.set(encoded, 30 + fnEncoded.length);
      localHeaders.push(local);

      // Central directory entry
      var central = new Uint8Array(46 + fnEncoded.length);
      var cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); // signature
      cv.setUint16(4, 20, true); // version made by
      cv.setUint16(6, 20, true); // version needed
      cv.setUint16(8, 0, true); // flags
      cv.setUint16(10, 0, true); // compression
      cv.setUint16(12, 0, true); // mod time
      cv.setUint16(14, 0, true); // mod date
      cv.setUint32(16, crc, true); // crc32
      cv.setUint32(20, encoded.length, true); // compressed size
      cv.setUint32(24, encoded.length, true); // uncompressed size
      cv.setUint16(28, fnEncoded.length, true); // filename length
      cv.setUint16(30, 0, true); // extra field length
      cv.setUint16(32, 0, true); // comment length
      cv.setUint16(34, 0, true); // disk number
      cv.setUint16(36, 0, true); // internal attributes
      cv.setUint32(38, 0, true); // external attributes
      cv.setUint32(42, offset, true); // relative offset
      central.set(fnEncoded, 46);
      centralHeaders.push(central);

      offset += local.length;
    });

    // End of central directory
    var centralSize = centralHeaders.reduce(function (s, h) { return s + h.length; }, 0);
    var endRecord = new Uint8Array(22);
    var ev = new DataView(endRecord.buffer);
    ev.setUint32(0, 0x06054b50, true); // signature
    ev.setUint16(4, 0, true); // disk number
    ev.setUint16(6, 0, true); // central dir disk
    ev.setUint16(8, fileEntries.length, true); // entries on this disk
    ev.setUint16(10, fileEntries.length, true); // total entries
    ev.setUint32(12, centralSize, true); // central dir size
    ev.setUint32(16, offset, true); // central dir offset
    ev.setUint16(20, 0, true); // comment length

    var parts = localHeaders.concat(centralHeaders, [endRecord]);
    var blob = new Blob(parts, { type: "application/zip" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name + ".termext";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported " + name + ".termext");
  }

  // CRC32 implementation
  function crc32(buf) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
      }
    }
    var crc = 0xffffffff;
    for (var k = 0; k < buf.length; k++) crc = table[(crc ^ buf[k]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  // ============================================================
  // RESET
  // ============================================================
  $("btn-reset").addEventListener("click", function () {
    if (!confirm("Reset all fields? This cannot be undone.")) return;
    state.meta = { id: "", name: "", desc: "", version: "1.0.0", author: "" };
    state.codeOverride = null;
    ["meta-id", "meta-name", "meta-desc", "meta-author"].forEach(function (id) { $(id).value = ""; });
    $("meta-version").value = "1.0.0";
    buildThemeUI();
    updateThemePreview();
    updateCodeEditor();
    showToast("Reset complete");
  });

  // ============================================================
  // INIT
  // ============================================================
  updateCodeEditor();
  updateOutput();
})();
