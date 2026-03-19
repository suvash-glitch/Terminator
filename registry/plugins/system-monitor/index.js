/**
 * System Monitor — Statusbar plugin for Terminator
 *
 * Displays active pane count, current time, and active pane ID
 * in a compact monospace widget in the bottom status bar.
 */

exports.name = "System Monitor";

exports.render = function (context) {
  var paneCount = 0;
  if (context.allPanes && Array.isArray(context.allPanes)) {
    paneCount = context.allPanes.length;
  }

  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var timeStr =
    (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;

  var activeLabel = "";
  if (context.activePane) {
    var proc = context.activePane.process || context.activePane.title || "";
    if (proc) {
      // Truncate long process names
      activeLabel = proc.length > 18 ? proc.substring(0, 18) + "\u2026" : proc;
    } else {
      activeLabel = "pid:" + (context.activePane.id || "?");
    }
  }

  var parts = [];

  // Pane count
  parts.push(
    '<span style="color:#82aaff;">\u2B21 ' +
      paneCount +
      " pane" +
      (paneCount !== 1 ? "s" : "") +
      "</span>"
  );

  // Separator
  parts.push('<span style="color:#333;margin:0 6px;">\u2502</span>');

  // Active process
  if (activeLabel) {
    parts.push(
      '<span style="color:#c792ea;">' +
        escHtml(activeLabel) +
        "</span>"
    );
    parts.push('<span style="color:#333;margin:0 6px;">\u2502</span>');
  }

  // Time
  parts.push('<span style="color:#7fdbca;">' + timeStr + "</span>");

  var wrapper =
    '<span style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;' +
    'display:inline-flex;align-items:center;gap:0;padding:0 4px;">' +
    parts.join("") +
    "</span>";

  return wrapper;
};

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
