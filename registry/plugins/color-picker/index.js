exports.activate = function (ctx) {
  var panelId = "color-picker-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Color Picker</h3>',
    '<button class="side-panel-close" id="cp-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="text-align:center;margin-bottom:12px;">',
    '<input id="cp-color" type="color" value="#c792ea" style="width:80px;height:80px;border:none;cursor:pointer;background:transparent;">',
    '</div>',
    '<div id="cp-preview" style="width:100%;height:40px;border-radius:6px;border:1px solid var(--t-border);margin-bottom:12px;background:#c792ea;"></div>',
    '<div id="cp-values" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#cp-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#cp-color").addEventListener("input", updateColor);
    updateColor();
  }

  function updateColor() {
    var hex = panelEl.querySelector("#cp-color").value;
    panelEl.querySelector("#cp-preview").style.background = hex;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var hsl = rgbToHsl(r, g, b);

    var vals = [
      { label: "HEX", value: hex.toUpperCase() },
      { label: "RGB", value: "rgb(" + r + ", " + g + ", " + b + ")" },
      { label: "HSL", value: "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)" }
    ];

    var h = '';
    vals.forEach(function (v) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--t-border,#222);cursor:pointer;" class="cp-val" data-val="' + esc(v.value) + '">';
      h += '<span style="color:var(--t-fg);opacity:0.5;font-size:10px;">' + v.label + '</span>';
      h += '<span style="color:var(--t-accent);">' + esc(v.value) + '</span>';
      h += '</div>';
    });
    panelEl.querySelector("#cp-values").innerHTML = h;
    var rows = panelEl.querySelectorAll(".cp-val");
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

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.addToolbarButton({
    id: "color-picker-btn",
    title: "Color Picker",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
