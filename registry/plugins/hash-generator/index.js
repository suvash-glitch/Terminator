exports.activate = function (ctx) {
  var panelId = "hash-generator-panel";
  var panelEl = null;
  var visible = false;

  var html = [
    '<div class="side-panel-header"><h3>Hash Generator</h3>',
    '<button class="side-panel-close" id="hg-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Input Text</label>',
    '<textarea id="hg-input" style="width:100%;height:80px;background:var(--t-bg);color:var(--t-fg);border:1px solid var(--t-border);border-radius:6px;padding:8px;font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:12px;resize:vertical;outline:none;margin:4px 0 10px;" placeholder="Type text to hash..."></textarea>',
    '<div id="hg-results" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#hg-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#hg-input").addEventListener("input", computeHashes);
  }

  function computeHashes() {
    var text = panelEl.querySelector("#hg-input").value;
    var results = panelEl.querySelector("#hg-results");
    if (!text) { results.innerHTML = '<span style="opacity:0.4;">Enter text above</span>'; return; }

    var encoder = new TextEncoder();
    var data = encoder.encode(text);
    var algos = [
      { name: "SHA-1", algo: "SHA-1" },
      { name: "SHA-256", algo: "SHA-256" },
      { name: "SHA-384", algo: "SHA-384" },
      { name: "SHA-512", algo: "SHA-512" }
    ];

    results.innerHTML = '<span style="opacity:0.4;">Computing...</span>';
    var output = {};
    var done = 0;

    algos.forEach(function (a) {
      crypto.subtle.digest(a.algo, data).then(function (buf) {
        var arr = new Uint8Array(buf);
        var hex = "";
        for (var i = 0; i < arr.length; i++) {
          hex += (arr[i] < 16 ? "0" : "") + arr[i].toString(16);
        }
        output[a.name] = hex;
        done++;
        if (done === algos.length) renderResults(output);
      });
    });
  }

  function renderResults(output) {
    var results = panelEl.querySelector("#hg-results");
    var h = '';
    var keys = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    keys.forEach(function (k) {
      if (!output[k]) return;
      h += '<div style="margin-bottom:10px;">';
      h += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">' + k + '</div>';
      h += '<div style="background:var(--t-bg);border:1px solid var(--t-border);border-radius:4px;padding:6px 8px;word-break:break-all;color:var(--t-accent);cursor:pointer;" class="hg-hash" data-val="' + output[k] + '">' + output[k] + '</div>';
      h += '</div>';
    });
    results.innerHTML = h;
    var hashEls = results.querySelectorAll(".hg-hash");
    for (var i = 0; i < hashEls.length; i++) {
      hashEls[i].addEventListener("click", function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(this.getAttribute("data-val"));
          ctx.showToast("Hash copied");
        }
      });
    }
  }

  ctx.addToolbarButton({
    id: "hash-generator-btn",
    title: "Hash Generator",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
