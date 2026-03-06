export const MOCK_WINDOWS = [
  {
    id: 1,
    focused: true,
    state: 'normal',
    tabs: [
      {
        id: 101, windowId: 1, index: 0,
        title: 'GitHub - tabpilot/extension: Chrome Tab Manager',
        url: 'https://github.com/tabpilot/extension',
        active: false, pinned: true,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 102, windowId: 1, index: 1,
        title: 'Stack Overflow - How to use React hooks effectively',
        url: 'https://stackoverflow.com/questions/12345/how-to-use-react-hooks',
        active: true, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 103, windowId: 1, index: 2,
        title: 'Jira Board - Sprint 42',
        url: 'https://mycompany.atlassian.net/jira/board/42',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: 1
      },
      {
        id: 104, windowId: 1, index: 3,
        title: 'Confluence - Sprint Notes & Retrospective',
        url: 'https://mycompany.atlassian.net/wiki/spaces/DEV/sprint-notes',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: 1
      },
      {
        id: 105, windowId: 1, index: 4,
        title: 'Slack - #engineering channel',
        url: 'https://mycompany.slack.com/channels/engineering',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: 1
      },
      {
        id: 106, windowId: 1, index: 5,
        title: 'ChatGPT - AI Assistant',
        url: 'https://chat.openai.com/',
        active: false, pinned: false,
        audible: true, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 107, windowId: 1, index: 6,
        title: 'Google Docs - Q4 Meeting Notes',
        url: 'https://docs.google.com/document/d/abc123/edit',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
    ]
  },
  {
    id: 2,
    focused: false,
    state: 'normal',
    tabs: [
      {
        id: 201, windowId: 2, index: 0,
        title: 'YouTube - Lo-fi Hip Hop Radio',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        active: true, pinned: false,
        audible: true, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 202, windowId: 2, index: 1,
        title: 'Reddit - r/programming - Top Posts',
        url: 'https://www.reddit.com/r/programming/',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 203, windowId: 2, index: 2,
        title: 'Gmail - Inbox (3)',
        url: 'https://mail.google.com/mail/u/0/#inbox',
        active: false, pinned: true,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
    ]
  },
  {
    id: 3,
    focused: false,
    state: 'normal',
    tabs: [
      {
        id: 301, windowId: 3, index: 0,
        title: 'Amazon.com - Shopping Cart',
        url: 'https://www.amazon.com/gp/cart/view.html',
        active: true, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 302, windowId: 3, index: 1,
        title: 'Stack Overflow - How to use React hooks effectively',
        url: 'https://stackoverflow.com/questions/12345/how-to-use-react-hooks',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 303, windowId: 3, index: 2,
        title: 'X (Twitter) - Home Feed',
        url: 'https://x.com/home',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'complete', groupId: -1
      },
      {
        id: 304, windowId: 3, index: 3,
        title: 'Netflix - Browse',
        url: 'https://www.netflix.com/browse',
        active: false, pinned: false,
        audible: false, mutedInfo: { muted: false },
        status: 'loading', groupId: -1
      },
    ]
  }
];

export const MOCK_TAB_GROUPS = [
  { id: 1, title: 'Work', color: 'blue', collapsed: false, windowId: 1 }
];

export const TAB_GROUP_COLORS = {
  grey: { bg: '#9aa0a6', text: '#ffffff' },
  blue: { bg: '#8ab4f8', text: '#202124' },
  red: { bg: '#f28b82', text: '#202124' },
  yellow: { bg: '#fdd663', text: '#202124' },
  green: { bg: '#81c995', text: '#202124' },
  pink: { bg: '#ff8bcb', text: '#202124' },
  purple: { bg: '#c58af9', text: '#202124' },
  cyan: { bg: '#78d9ec', text: '#202124' },
};

// Simulated per-tab metrics
export const TAB_METRICS = {
  101: { memory: 145, cpu: 2, visitCount: 47 },
  102: { memory: 210, cpu: 5, visitCount: 156 },
  103: { memory: 98, cpu: 1, visitCount: 32 },
  104: { memory: 112, cpu: 1, visitCount: 28 },
  105: { memory: 320, cpu: 8, visitCount: 89 },
  106: { memory: 285, cpu: 12, visitCount: 203 },
  107: { memory: 78, cpu: 1, visitCount: 15 },
  201: { memory: 410, cpu: 14, visitCount: 312 },
  202: { memory: 165, cpu: 3, visitCount: 67 },
  203: { memory: 130, cpu: 2, visitCount: 184 },
  301: { memory: 195, cpu: 4, visitCount: 23 },
  302: { memory: 180, cpu: 3, visitCount: 41 },
  303: { memory: 225, cpu: 6, visitCount: 95 },
  304: { memory: 55, cpu: 1, visitCount: 8 },
};

