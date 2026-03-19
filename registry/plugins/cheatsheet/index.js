exports.activate = function (ctx) {
  var panelId = "cheatsheet-panel";
  var panelEl = null;
  var visible = false;

  var sheets = {
    git: [
      ["git init", "Initialize a new repo"],
      ["git clone <url>", "Clone a repository"],
      ["git status", "Show working tree status"],
      ["git add .", "Stage all changes"],
      ["git commit -m 'msg'", "Commit staged changes"],
      ["git push", "Push to remote"],
      ["git pull", "Pull from remote"],
      ["git branch", "List branches"],
      ["git checkout -b <name>", "Create and switch branch"],
      ["git merge <branch>", "Merge a branch"],
      ["git log --oneline", "Show compact log"],
      ["git stash", "Stash changes"],
      ["git stash pop", "Apply stashed changes"],
      ["git diff", "Show unstaged changes"],
      ["git reset HEAD~1", "Undo last commit"]
    ],
    docker: [
      ["docker ps", "List running containers"],
      ["docker ps -a", "List all containers"],
      ["docker images", "List images"],
      ["docker build -t <name> .", "Build an image"],
      ["docker run -d <image>", "Run container detached"],
      ["docker stop <id>", "Stop a container"],
      ["docker rm <id>", "Remove a container"],
      ["docker rmi <image>", "Remove an image"],
      ["docker logs <id>", "View container logs"],
      ["docker exec -it <id> sh", "Shell into container"],
      ["docker-compose up", "Start services"],
      ["docker-compose down", "Stop services"],
      ["docker system prune", "Clean up resources"]
    ],
    npm: [
      ["npm init", "Initialize package.json"],
      ["npm install", "Install dependencies"],
      ["npm install <pkg>", "Install a package"],
      ["npm install -D <pkg>", "Install dev dependency"],
      ["npm uninstall <pkg>", "Remove a package"],
      ["npm run <script>", "Run a script"],
      ["npm start", "Run start script"],
      ["npm test", "Run tests"],
      ["npm outdated", "Check outdated packages"],
      ["npm update", "Update packages"],
      ["npm audit", "Security audit"],
      ["npm publish", "Publish package"],
      ["npx <cmd>", "Run package binary"]
    ]
  };

  function buildHtml() {
    var h = '';
    h += '<div class="side-panel-header"><h3>Cheatsheet</h3>';
    h += '<button class="side-panel-close" id="cs-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    h += '<div class="side-panel-body" style="padding:10px;">';
    h += '<div id="cs-tabs" style="display:flex;gap:4px;margin-bottom:10px;">';
    h += '<button class="cs-tab" data-tab="git" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-accent);color:#fff;cursor:pointer;font-size:11px;">Git</button>';
    h += '<button class="cs-tab" data-tab="docker" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-bg);color:var(--t-fg);cursor:pointer;font-size:11px;">Docker</button>';
    h += '<button class="cs-tab" data-tab="npm" style="padding:4px 12px;border-radius:4px;border:1px solid var(--t-border);background:var(--t-bg);color:var(--t-fg);cursor:pointer;font-size:11px;">NPM</button>';
    h += '</div>';
    h += '<div id="cs-content" style="font-family:\'SF Mono\',Monaco,Consolas,monospace;font-size:11px;"></div>';
    h += '</div>';
    return h;
  }

  panelEl = ctx.addSidePanel(panelId, buildHtml());
  if (panelEl) {
    panelEl.querySelector("#cs-close").addEventListener("click", function () { toggle(); });
    var tabs = panelEl.querySelectorAll(".cs-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () { showTab(this.getAttribute("data-tab")); });
    }
    showTab("git");
  }

  function showTab(name) {
    if (!panelEl) return;
    var tabs = panelEl.querySelectorAll(".cs-tab");
    for (var i = 0; i < tabs.length; i++) {
      var isActive = tabs[i].getAttribute("data-tab") === name;
      tabs[i].style.background = isActive ? "var(--t-accent)" : "var(--t-bg)";
      tabs[i].style.color = isActive ? "#fff" : "var(--t-fg)";
    }
    var content = panelEl.querySelector("#cs-content");
    if (!content) return;
    var rows = sheets[name] || [];
    var h = '';
    rows.forEach(function (row) {
      h += '<div style="padding:6px 0;border-bottom:1px solid var(--t-border,#222);cursor:pointer;" class="cs-row" data-cmd="' + esc(row[0]) + '">';
      h += '<div style="color:var(--t-accent);">' + esc(row[0]) + '</div>';
      h += '<div style="color:var(--t-fg);opacity:0.5;font-size:10px;">' + esc(row[1]) + '</div>';
      h += '</div>';
    });
    content.innerHTML = h;
    var cmdRows = content.querySelectorAll(".cs-row");
    for (var j = 0; j < cmdRows.length; j++) {
      cmdRows[j].addEventListener("click", function () {
        var cmd = this.getAttribute("data-cmd");
        if (ctx.activeId) { ctx.sendInput(ctx.activeId, cmd + "\n"); ctx.showToast("Sent: " + cmd); }
      });
    }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  ctx.addToolbarButton({
    id: "cheatsheet-btn",
    title: "Cheatsheet",
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    onClick: function () { toggle(); }
  });

  function toggle() {
    visible = !visible;
    if (panelEl) panelEl.classList.toggle("visible", visible);
  }
};
