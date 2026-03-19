/**
 * AI Assistant Plugin for Terminator
 * Provides a side-panel AI chat UI with multi-provider support.
 */

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic Claude', defaultModel: 'claude-sonnet-4-20250514' },
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o' },
  { id: 'google', name: 'Google Gemini', defaultModel: 'gemini-2.0-flash' },
  { id: 'ollama', name: 'Ollama (Local)', defaultModel: 'llama3.2' }
];

function injectStyles() {
  if (document.getElementById('ai-assistant-styles')) return;
  const style = document.createElement('style');
  style.id = 'ai-assistant-styles';
  style.textContent = `
    /* ── AI Settings strip ─────────────────────────────── */
    .ai-settings-strip {
      padding: 10px 16px;
      border-bottom: 1px solid var(--t-border);
      display: flex; flex-direction: column; gap: 6px;
      flex-shrink: 0;
    }
    .ai-settings-row {
      display: flex; gap: 8px; align-items: center;
    }
    .ai-settings-row label {
      font-size: 10px; color: var(--t-fg); opacity: 0.5;
      width: 50px; flex-shrink: 0; text-transform: uppercase;
      letter-spacing: 0.3px; font-weight: 600;
    }
    .ai-settings-row select,
    .ai-settings-row input {
      flex: 1; background: var(--t-bg); color: var(--t-fg);
      border: 1px solid var(--t-border); border-radius: 5px;
      padding: 5px 8px; font-size: 11px; outline: none;
      font-family: inherit; transition: border-color 0.15s;
    }
    .ai-settings-row select:focus,
    .ai-settings-row input:focus {
      border-color: var(--t-accent);
    }
    .ai-settings-row select {
      cursor: pointer; -webkit-appearance: none; appearance: none;
      padding-right: 20px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23888'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 6px center;
    }
    /* Fix select option colors for all themes */
    .ai-settings-row select option {
      background: var(--t-ui); color: var(--t-fg);
    }

    /* ── Messages area ─────────────────────────────────── */
    .ai-messages {
      flex: 1; overflow-y: auto; padding: 12px 16px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    .ai-messages::-webkit-scrollbar { width: 5px; }
    .ai-messages::-webkit-scrollbar-track { background: transparent; }
    .ai-messages::-webkit-scrollbar-thumb { background: var(--t-border); border-radius: 3px; }

    /* ── Message bubbles ───────────────────────────────── */
    .ai-msg {
      max-width: 90%; padding: 8px 12px; border-radius: 10px;
      font-size: 12px; line-height: 1.5; word-wrap: break-word;
      animation: ai-fade-in 0.2s ease;
    }
    @keyframes ai-fade-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ai-msg.user {
      align-self: flex-end;
      background: color-mix(in srgb, var(--t-accent) 20%, transparent);
      color: var(--t-fg); border: 1px solid color-mix(in srgb, var(--t-accent) 30%, transparent);
      border-bottom-right-radius: 3px;
    }
    .ai-msg.assistant {
      align-self: flex-start;
      background: var(--t-bg); color: var(--t-fg);
      border: 1px solid var(--t-border);
      border-bottom-left-radius: 3px;
    }
    .ai-msg.error-msg {
      align-self: center; background: transparent;
      color: #ff453a; font-size: 11px;
      border: 1px solid rgba(255,69,58,0.3); border-radius: 6px;
      text-align: center; padding: 6px 12px;
    }

    /* ── Markdown inside messages ───────────────────────── */
    .ai-msg code {
      font-family: 'SF Mono', Menlo, monospace; font-size: 11px;
      background: color-mix(in srgb, var(--t-fg) 10%, transparent);
      padding: 1px 4px; border-radius: 3px;
    }
    .ai-msg pre {
      margin: 6px 0 2px; padding: 8px 10px;
      background: var(--t-bg); border: 1px solid var(--t-border);
      border-radius: 6px; overflow-x: auto;
      font-size: 11px; line-height: 1.4;
    }
    .ai-msg pre code {
      background: none; padding: 0; font-size: inherit;
    }
    .ai-msg strong { font-weight: 600; }

    /* ── Loading dots ──────────────────────────────────── */
    .ai-loading {
      align-self: flex-start; display: flex; gap: 4px;
      padding: 10px 16px; background: var(--t-bg);
      border: 1px solid var(--t-border);
      border-radius: 10px; border-bottom-left-radius: 3px;
      animation: ai-fade-in 0.2s ease;
    }
    .ai-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--t-fg); opacity: 0.3;
      animation: ai-pulse 1.2s infinite ease-in-out;
    }
    .ai-dot:nth-child(2) { animation-delay: 0.15s; }
    .ai-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes ai-pulse {
      0%, 60%, 100% { opacity: 0.15; transform: scale(0.85); }
      30%            { opacity: 0.7; transform: scale(1.1); }
    }

    /* ── Welcome ───────────────────────────────────────── */
    .ai-welcome {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px; opacity: 0.4; padding: 24px; text-align: center;
    }
    .ai-welcome svg { margin-bottom: 4px; }
    .ai-welcome-title { font-size: 13px; font-weight: 600; }
    .ai-welcome-sub { font-size: 11px; line-height: 1.5; }

    /* ── Input footer ──────────────────────────────────── */
    .ai-input-wrap {
      padding: 10px 16px; border-top: 1px solid var(--t-border);
      flex-shrink: 0; display: flex; gap: 8px; align-items: flex-end;
    }
    .ai-input-wrap textarea {
      flex: 1; background: var(--t-bg); color: var(--t-fg);
      border: 1px solid var(--t-border); border-radius: 8px;
      padding: 8px 10px; font-size: 12px; font-family: inherit;
      line-height: 1.4; resize: none; outline: none;
      max-height: 100px; min-height: 34px;
      transition: border-color 0.15s;
    }
    .ai-input-wrap textarea:focus { border-color: var(--t-accent); }
    .ai-input-wrap textarea::placeholder { color: var(--t-fg); opacity: 0.3; }
    .ai-send-btn {
      width: 34px; height: 34px; border-radius: 8px; border: none;
      background: color-mix(in srgb, var(--t-accent) 15%, transparent);
      color: var(--t-accent); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all 0.15s;
      border: 1px solid color-mix(in srgb, var(--t-accent) 30%, transparent);
    }
    .ai-send-btn:hover { background: color-mix(in srgb, var(--t-accent) 25%, transparent); }
    .ai-send-btn:active { transform: scale(0.93); }
    .ai-send-btn:disabled { opacity: 0.3; cursor: default; transform: none; }
    .ai-send-btn svg { width: 14px; height: 14px; }

    /* ── Error suggestion ──────────────────────────────── */
    .ai-error-suggest {
      align-self: center; padding: 6px 12px; border-radius: 6px;
      border: 1px solid color-mix(in srgb, var(--t-accent) 30%, transparent);
      color: var(--t-accent); font-size: 11px; cursor: pointer;
      text-align: center; transition: background 0.15s;
      animation: ai-fade-in 0.2s ease;
    }
    .ai-error-suggest:hover {
      background: color-mix(in srgb, var(--t-accent) 10%, transparent);
    }
  `;
  document.head.appendChild(style);
}

function renderMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    '<pre><code>' + code.trim() + '</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) =>
    '<pre><code>' + code.replace(/<br>/g, '\n') + '</code></pre>');
  return html;
}

exports.activate = function (ctx) {
  injectStyles();

  const history = [];
  let loading = false;
  let panelVisible = false;

  const provider = ctx.settings.aiProvider || 'anthropic';
  const apiKey = ctx.settings.aiApiKey || '';
  const model = ctx.settings.aiModel || '';

  // Build the panel HTML using the app's native side-panel structure
  const panelHtml = `
    <div class="side-panel-header">
      <h3>AI Assistant</h3>
      <div style="display:flex;gap:4px;align-items:center">
        <button class="side-panel-close" id="ai-clear-btn" title="Clear chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
        <button class="side-panel-close" id="ai-close-btn" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="ai-settings-strip">
      <div class="ai-settings-row">
        <label>Provider</label>
        <select id="ai-provider">
          ${PROVIDERS.map(p => `<option value="${p.id}" ${p.id === provider ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="ai-settings-row">
        <label>Key</label>
        <input type="password" id="ai-key" placeholder="API key..." value="${apiKey}">
      </div>
      <div class="ai-settings-row">
        <label>Model</label>
        <input type="text" id="ai-model" placeholder="Default" value="${model}">
      </div>
    </div>
    <div class="ai-messages" id="ai-messages">
      <div class="ai-welcome">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <div class="ai-welcome-title">AI Assistant</div>
        <div class="ai-welcome-sub">Ask about commands, errors, or code.<br>Configure provider above to get started.</div>
      </div>
    </div>
    <div class="ai-input-wrap">
      <textarea id="ai-input" rows="1" placeholder="Ask something..."></textarea>
      <button class="ai-send-btn" id="ai-send" title="Send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  `;

  // Use the app's addSidePanel API
  ctx.addSidePanel('ai-assistant', panelHtml);

  // Get references to the panel the app created
  const panel = document.getElementById('ai-assistant');
  if (!panel) return;

  // Wire up header buttons
  const clearBtn = panel.querySelector('#ai-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      history.length = 0;
      messagesEl.innerHTML = welcomeHtml;
    });
  }

  const messagesEl = panel.querySelector('#ai-messages');
  const inputEl = panel.querySelector('#ai-input');
  const sendBtn = panel.querySelector('#ai-send');
  const providerEl = panel.querySelector('#ai-provider');
  const keyEl = panel.querySelector('#ai-key');
  const modelEl = panel.querySelector('#ai-model');

  const welcomeHtml = messagesEl.innerHTML;

  // Toggle function
  function togglePanel() {
    panelVisible = !panelVisible;
    if (panelVisible) {
      panel.classList.add('visible');
      setTimeout(() => inputEl.focus(), 200);
    } else {
      panel.classList.remove('visible');
    }
  }

  function closePanel() {
    panelVisible = false;
    panel.classList.remove('visible');
  }

  // Close button
  const closeBtnEl = panel.querySelector('#ai-close-btn');
  if (closeBtnEl) {
    closeBtnEl.addEventListener('click', () => closePanel());
  }

  // Toolbar button
  ctx.addToolbarButton({
    id: 'ai-chat',
    title: 'AI Assistant',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    onClick: togglePanel
  });

  ctx.registerCommand({ label: 'AI Assistant', action: togglePanel, category: 'Tools' });

  // Settings persistence
  providerEl.addEventListener('change', () => {
    ctx.settings.aiProvider = providerEl.value;
    ctx.saveSettings();
  });
  keyEl.addEventListener('change', () => {
    ctx.settings.aiApiKey = keyEl.value.trim();
    ctx.saveSettings();
  });
  modelEl.addEventListener('change', () => {
    ctx.settings.aiModel = modelEl.value.trim();
    ctx.saveSettings();
  });

  // Message helpers
  function clearWelcome() {
    const w = messagesEl.querySelector('.ai-welcome');
    if (w) w.remove();
  }

  function addMsg(role, text) {
    clearWelcome();
    const el = document.createElement('div');
    el.className = 'ai-msg ' + role;
    el.innerHTML = role === 'error-msg' ? text : renderMarkdown(text);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function showLoading() {
    clearWelcome();
    const el = document.createElement('div');
    el.className = 'ai-loading';
    el.id = 'ai-loading';
    el.innerHTML = '<div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideLoading() {
    const el = messagesEl.querySelector('#ai-loading');
    if (el) el.remove();
  }

  // Send message
  async function send(text) {
    if (!text.trim() || loading) return;

    const pid = providerEl.value;
    const pDef = PROVIDERS.find(p => p.id === pid);
    const key = keyEl.value.trim();
    const mod = modelEl.value.trim() || pDef.defaultModel;

    if (pid !== 'ollama' && !key) {
      addMsg('error-msg', 'Enter an API key for ' + pDef.name);
      return;
    }

    addMsg('user', text);
    history.push({ role: 'user', content: text });
    inputEl.value = '';
    inputEl.style.height = 'auto';
    loading = true;
    sendBtn.disabled = true;
    showLoading();

    try {
      const res = await ctx.ipc.aiChat({
        provider: pid, model: mod, apiKey: key, messages: history
      });
      hideLoading();
      if (res.error) {
        addMsg('error-msg', res.error);
      } else {
        const txt = res.text || res.content || '';
        history.push({ role: 'assistant', content: txt });
        addMsg('assistant', txt);
      }
    } catch (err) {
      hideLoading();
      addMsg('error-msg', 'Error: ' + (err.message || err));
    } finally {
      loading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // Input handling
  sendBtn.addEventListener('click', () => send(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inputEl.value); }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });

  // Error detection hook
  ctx.on('errorDetected', (paneId, snippet) => {
    clearWelcome();
    const el = document.createElement('div');
    el.className = 'ai-error-suggest';
    el.textContent = 'Error: "' + snippet.slice(0, 60) + (snippet.length > 60 ? '...' : '') + '" — click to ask AI';
    el.addEventListener('click', () => {
      el.remove();
      if (!panelVisible) togglePanel();
      send('I got this error in my terminal. Explain and fix it:\n\n```\n' + snippet + '\n```');
    });
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    ctx.showToast('Error detected — open AI Assistant for help');
  });
};
