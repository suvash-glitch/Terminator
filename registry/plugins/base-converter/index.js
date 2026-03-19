exports.activate = function (ctx) {
  var panelId = "base-converter-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Base Converter</h3>',
    '<button class="side-panel-close" id="bc-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Decimal</label>',
    '<input id="bc-dec" type="text" placeholder="255" style="width:100%;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;outline:none;margin:4px 0 10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Hexadecimal</label>',
    '<input id="bc-hex" type="text" placeholder="FF" style="width:100%;background:var(--t-bg);color:#82aaff;border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;outline:none;margin:4px 0 10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Binary</label>',
    '<input id="bc-bin" type="text" placeholder="11111111" style="width:100%;background:var(--t-bg);color:#c3e88d;border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;outline:none;margin:4px 0 10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Octal</label>',
    '<input id="bc-oct" type="text" placeholder="377" style="width:100%;background:var(--t-bg);color:#f78c6c;border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;font-family:inherit;font-size:12px;outline:none;margin:4px 0 10px;">',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#bc-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#bc-dec").addEventListener("input", function () { fromDec(); });
    panelEl.querySelector("#bc-hex").addEventListener("input", function () { fromHex(); });
    panelEl.querySelector("#bc-bin").addEventListener("input", function () { fromBin(); });
    panelEl.querySelector("#bc-oct").addEventListener("input", function () { fromOct(); });
  }

  function updateAll(num, source) {
    if (isNaN(num) || num < 0) return;
    num = Math.floor(num);
    if (source !== "dec") panelEl.querySelector("#bc-dec").value = num.toString(10);
    if (source !== "hex") panelEl.querySelector("#bc-hex").value = num.toString(16).toUpperCase();
    if (source !== "bin") panelEl.querySelector("#bc-bin").value = num.toString(2);
    if (source !== "oct") panelEl.querySelector("#bc-oct").value = num.toString(8);
  }

  function fromDec() { var v = parseInt(panelEl.querySelector("#bc-dec").value, 10); if (!isNaN(v)) updateAll(v, "dec"); }
  function fromHex() { var v = parseInt(panelEl.querySelector("#bc-hex").value, 16); if (!isNaN(v)) updateAll(v, "hex"); }
  function fromBin() { var v = parseInt(panelEl.querySelector("#bc-bin").value, 2); if (!isNaN(v)) updateAll(v, "bin"); }
  function fromOct() { var v = parseInt(panelEl.querySelector("#bc-oct").value, 8); if (!isNaN(v)) updateAll(v, "oct"); }

  ctx.addToolbarButton({
    id: "base-converter-btn",
    title: "Base Converter",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
