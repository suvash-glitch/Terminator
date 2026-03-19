exports.activate = function (ctx) {
  var panelId = "terminal-recorder-panel";
  var panelEl = null;
  var visible = false;
  var recording = false;
  var recordings = [];
  var startTime = 0;

  var html = [
    '<div class="side-panel-header"><h3>Terminal Recorder</h3>',
    '<button class="side-panel-close" id="tr-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>',
    '<div class="side-panel-body" style="padding:10px;">',
    '<div style="display:flex;gap:8px;margin-bottom:12px;">',
    '<button id="tr-record" style="flex:1;background:#ff5370;color:#fff;border:none;border-radius:4px;padding:8px;cursor:pointer;font-size:12px;">Start Recording</button>',
    '<button id="tr-stop" style="flex:1;background:var(--t-surface);color:var(--t-fg);border:1px solid var(--t-border);border-radius:4px;padding:8px;cursor:pointer;font-size:12px;" disabled>Stop</button>',
    '</div>',
    '<div id="tr-status" style="text-align:center;padding:8px;margin-bottom:10px;font-size:12px;color:var(--t-fg);opacity:0.5;">Ready to record</div>',
    '<label style="color:var(--t-fg);opacity:0.6;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Recordings</label>',
    '<div id="tr-list" style="font-family:monospace;font-size:12px;margin-top:4px;overflow:auto;max-height:calc(100vh - 300px);"></div>',
    '</div>'
  ].join("\n");

  panelEl = ctx.addSidePanel(panelId, html);
  if (panelEl) {
    panelEl.querySelector("#tr-close").addEventListener("click", function () { toggle(); });
    panelEl.querySelector("#tr-record").addEventListener("click", startRecording);
    panelEl.querySelector("#tr-stop").addEventListener("click", stopRecording);
  }

  function startRecording() {
    recording = true;
    startTime = Date.now();
    panelEl.querySelector("#tr-record").disabled = true;
    panelEl.querySelector("#tr-record").style.opacity = "0.5";
    panelEl.querySelector("#tr-stop").disabled = false;
    panelEl.querySelector("#tr-status").innerHTML = '<span style="color:#ff5370;">Recording...</span>';
  }

  function stopRecording() {
    recording = false;
    var duration = ((Date.now() - startTime) / 1000).toFixed(1);
    recordings.push({
      name: "Recording " + recordings.length,
      duration: duration + "s",
      time: new Date().toLocaleTimeString()
    });
    panelEl.querySelector("#tr-record").disabled = false;
    panelEl.querySelector("#tr-record").style.opacity = "1";
    panelEl.querySelector("#tr-stop").disabled = true;
    panelEl.querySelector("#tr-status").innerHTML = 'Saved recording (' + duration + 's)';
    render();
  }

  function render() {
    var list = panelEl.querySelector("#tr-list");
    var h = "";
    if (recordings.length === 0) {
      h = '<div style="color:var(--t-fg);opacity:0.4;padding:20px;text-align:center;">No recordings yet</div>';
    }
    recordings.forEach(function (r, i) {
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--t-border,#222);">';
      h += '<div>';
      h += '<div style="color:var(--t-fg);">' + esc(r.name) + '</div>';
      h += '<div style="color:var(--t-fg);opacity:0.4;font-size:10px;">' + r.duration + ' at ' + r.time + '</div>';
      h += '</div>';
      h += '<button class="tr-remove" data-idx="' + i + '" style="background:transparent;color:#ff5370;border:1px solid #ff5370;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:10px;">X</button>';
      h += '</div>';
    });
    list.innerHTML = h;
    var btns = list.querySelectorAll(".tr-remove");
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener("click", function () {
        recordings.splice(parseInt(this.getAttribute("data-idx")), 1);
        render();
      });
    }
  }

  render();

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  ctx.registerCommand("terminal-recorder:toggle", function () { toggle(); });

  ctx.addToolbarButton({
    id: "terminal-recorder-btn",
    title: "Terminal Recorder",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
