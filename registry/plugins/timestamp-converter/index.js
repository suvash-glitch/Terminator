exports.activate = function (ctx) {
  var panelId = "timestamp-converter-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Timestamp Converter</h3>',
    '<button class="side-panel-close" id="tc-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Input</label>',
    '<input id="tc-input" type="text" placeholder="Unix timestamp or date string..." style="width:100%;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:8px;font-family:monospace;font-size:12px;outline:none;margin:4px 0 8px;box-sizing:border-box;">',
    '<button id="tc-now" style="width:100%;background:var(--t-surface);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px;cursor:pointer;font-size:12px;margin-bottom:10px;">Use Current Time</button>',
    '<div id="tc-result" style="font-family:monospace;font-size:12px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#tc-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#tc-input").addEventListener("input", convert);
    panelEl.querySelector("#tc-now").addEventListener("click", function () {
      panelEl.querySelector("#tc-input").value = Math.floor(Date.now() / 1000);
      convert();
    });
  }

  function convert() {
    var input = panelEl.querySelector("#tc-input").value.trim();
    var result = panelEl.querySelector("#tc-result");
    if (!input) { result.innerHTML = '<div style="color:var(--t-fg);opacity:0.4;padding:10px;text-align:center;">Enter a timestamp or date</div>'; return; }

    var date = null;
    if (/^\d{10}$/.test(input)) {
      date = new Date(parseInt(input) * 1000);
    } else if (/^\d{13}$/.test(input)) {
      date = new Date(parseInt(input));
    } else {
      date = new Date(input);
    }

    if (!date || isNaN(date.getTime())) {
      result.innerHTML = '<div style="color:#ff5370;padding:10px;">Could not parse input as a date</div>';
      return;
    }

    var formats = [
      { label: "Unix (seconds)", value: Math.floor(date.getTime() / 1000).toString() },
      { label: "Unix (ms)", value: date.getTime().toString() },
      { label: "ISO 8601", value: date.toISOString() },
      { label: "UTC", value: date.toUTCString() },
      { label: "Local", value: date.toLocaleString() },
      { label: "Relative", value: relativeTime(date) }
    ];

    var h = "";
    formats.forEach(function (f) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--t-border,#222);cursor:pointer;" class="tc-row" data-val="' + esc(f.value) + '">';
      h += '<span style="color:var(--t-fg);opacity:0.5;font-size:10px;">' + f.label + '</span>';
      h += '<span style="color:var(--t-accent);font-size:11px;">' + esc(f.value) + '</span>';
      h += '</div>';
    });
    result.innerHTML = h;
    var rows = result.querySelectorAll(".tc-row");
    for (var i = 0; i < rows.length; i++) {
      rows[i].addEventListener("click", function () {
        var val = this.getAttribute("data-val");
        if (navigator.clipboard) {
          navigator.clipboard.writeText(val);
          ctx.showToast("Copied: " + val);
        }
      });
    }
  }

  function relativeTime(date) {
    var diff = Date.now() - date.getTime();
    var abs = Math.abs(diff);
    var suffix = diff > 0 ? " ago" : " from now";
    if (abs < 60000) return Math.round(abs / 1000) + "s" + suffix;
    if (abs < 3600000) return Math.round(abs / 60000) + "m" + suffix;
    if (abs < 86400000) return Math.round(abs / 3600000) + "h" + suffix;
    return Math.round(abs / 86400000) + "d" + suffix;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.registerCommand("timestamp-converter:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "timestamp-converter-btn",
    title: "Timestamp Converter",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
