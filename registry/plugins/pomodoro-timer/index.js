exports.activate = function (ctx) {
  var running = false;
  var remaining = 0;
  var interval = null;
  var DURATION = 25 * 60;

  var styleEl = document.createElement("style");
  styleEl.textContent = [
    "#pomodoro-display { position:fixed; top:8px; right:80px; background:var(--t-surface,#1e1e1e);",
    "  border:1px solid var(--t-border,#333); border-radius:6px; padding:4px 10px; z-index:9999;",
    "  font-family:'SF Mono',Monaco,Consolas,monospace; font-size:12px; color:#ff5370;",
    "  display:none; cursor:pointer; }"
  ].join("\n");
  document.head.appendChild(styleEl);

  var display = document.createElement("div");
  display.id = "pomodoro-display";
  document.body.appendChild(display);
  display.addEventListener("click", function () { stopTimer(); });

  ctx.addToolbarButton({
    id: "pomodoro-btn",
    title: "Pomodoro Timer",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    onClick: function () {
      if (running) {
        stopTimer();
      } else {
        startTimer();
      }
    }
  });

  function startTimer() {
    running = true;
    remaining = DURATION;
    display.style.display = "block";
    updateDisplay();
    interval = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        stopTimer();
        ctx.showToast("Pomodoro complete! Time for a break.");
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Pomodoro Complete", { body: "Time for a break!" });
        }
      } else {
        updateDisplay();
      }
    }, 1000);
    ctx.showToast("Pomodoro started: 25 minutes");
  }

  function stopTimer() {
    running = false;
    if (interval) { clearInterval(interval); interval = null; }
    display.style.display = "none";
  }

  function updateDisplay() {
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;
    display.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  ctx.registerCommand({
    label: "Start/Stop Pomodoro",
    category: "Tools",
    action: function () {
      if (running) stopTimer();
      else startTimer();
    }
  });
};
