/**
 * ChromePilot Focus Mode — Content Script
 * Renders a page-level notification when focus mode blocks an action.
 * Injected into all pages so the user sees it even if the sidebar is closed.
 */

let notifEl = null;
let hideTimer = null;

const MESSAGES = {
  'new-tab': 'New tabs are blocked in Focus Mode',
  'new-window': 'New windows are blocked in Focus Mode',
  'switch-tab': 'This tab is not in your focus set',
};

function showNotification(reason) {
  // Throttle — don't stack multiple
  if (notifEl && notifEl.dataset.visible === 'true') return;

  if (!notifEl) {
    notifEl = document.createElement('div');
    notifEl.id = 'tabpilot-focus-notif';
    const shadow = notifEl.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%) translateY(-120%);
        z-index: 2147483647;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, sans-serif;
      }
      :host(.visible) {
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }
      .notif {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: #1a1a2e;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
        backdrop-filter: blur(16px);
        transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
        max-width: 420px;
      }
      .icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(99, 102, 241, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .icon svg {
        width: 16px;
        height: 16px;
        color: #818cf8;
      }
      .text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        line-height: 1.3;
        white-space: nowrap;
      }
      .desc {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.3;
      }
    `;

    const container = document.createElement('div');
    container.className = 'notif';
    container.innerHTML = `
      <div class="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="text">
        <div class="title"></div>
        <div class="desc">Exit Focus Mode to access other tabs</div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.documentElement.appendChild(notifEl);

    // Store references
    notifEl._title = container.querySelector('.title');
    notifEl._shadow = shadow;
  }

  // Update text
  notifEl._title.textContent = MESSAGES[reason] || 'Action blocked — Focus Mode is active';
  notifEl.dataset.visible = 'true';

  // Animate in
  requestAnimationFrame(() => {
    notifEl.shadowRoot.host.classList.add('visible');
  });

  // Auto-hide after 3s
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    notifEl.shadowRoot.host.classList.remove('visible');
    notifEl.dataset.visible = 'false';
  }, 3000);
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.action === 'focus-blocked-page') {
    showNotification(msg.reason);
  }
});
