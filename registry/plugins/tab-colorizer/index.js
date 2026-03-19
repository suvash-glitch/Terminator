exports.activate = function (ctx) {
  var colors = ["#ff5370", "#c3e88d", "#82aaff", "#c792ea", "#ffcb6b", "#f78c6c", "#89ddff", "#ff9cac"];
  var menuEl = null;

  var styleEl = document.createElement("style");
  styleEl.textContent = [
    ".tab-color-menu { position:fixed; background:var(--t-surface,#1e1e1e); border:1px solid var(--t-border,#333);",
    "  border-radius:8px; padding:8px; display:flex; gap:4px; z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.4); }",
    ".tab-color-swatch { width:20px; height:20px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:transform 0.1s; }",
    ".tab-color-swatch:hover { transform:scale(1.2); border-color:#fff; }",
    ".tab-color-clear { width:20px; height:20px; border-radius:50%; cursor:pointer; border:2px dashed #666; background:transparent; font-size:10px;",
    "  display:flex;align-items:center;justify-content:center;color:#666; }"
  ].join("\n");
  document.head.appendChild(styleEl);

  document.addEventListener("contextmenu", function (e) {
    var header = e.target.closest(".pane-header");
    if (!header) return;
    e.preventDefault();
    removeMenu();
    var paneId = header.getAttribute("data-pane-id") || header.closest("[data-pane-id]");
    if (!paneId && header.parentElement) {
      paneId = header.parentElement.getAttribute("data-pane-id");
    }
    menuEl = document.createElement("div");
    menuEl.className = "tab-color-menu";
    menuEl.style.left = e.clientX + "px";
    menuEl.style.top = e.clientY + "px";

    colors.forEach(function (c) {
      var swatch = document.createElement("div");
      swatch.className = "tab-color-swatch";
      swatch.style.background = c;
      swatch.addEventListener("click", function () {
        header.style.borderTop = "2px solid " + c;
        header.style.background = c + "22";
        removeMenu();
      });
      menuEl.appendChild(swatch);
    });

    var clearBtn = document.createElement("div");
    clearBtn.className = "tab-color-clear";
    clearBtn.textContent = "X";
    clearBtn.addEventListener("click", function () {
      header.style.borderTop = "";
      header.style.background = "";
      removeMenu();
    });
    menuEl.appendChild(clearBtn);
    document.body.appendChild(menuEl);
  });

  document.addEventListener("click", function () { removeMenu(); });

  function removeMenu() {
    if (menuEl && menuEl.parentNode) {
      menuEl.parentNode.removeChild(menuEl);
      menuEl = null;
    }
  }
};
