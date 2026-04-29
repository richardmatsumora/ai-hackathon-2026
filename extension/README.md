# Meet is Murder — Chrome Extension

A Manifest V3 Chrome Extension that injects a **"✦ New Smart Meeting"** button into Google Calendar. Clicking it opens a side panel running the full Meet is Murder interrogation flow, then creates the event via the Google Calendar API.

---

## File structure

```
extension/
├── manifest.json      # MV3 manifest
├── background.js      # Service worker — opens side panel
├── content.js         # Injected into calendar.google.com
├── panel.html         # Side panel shell
├── panel.js           # Full Interceptor UI (vanilla JS)
├── api.js             # Google Calendar API + OAuth handler
├── styles.css         # Noir design system (matches web prototype)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png     ← you must provide these
```

---

## Setup

### 1. Google Cloud Console — OAuth Client

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or reuse one)
3. Enable the **Google Calendar API**:
   - APIs & Services → Library → "Google Calendar API" → Enable
4. Create OAuth 2.0 credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Chrome Extension**
   - Add your extension's ID (you get this after loading it unpacked — see step 2 below)
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`)
6. Open `manifest.json` and replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your real Client ID

### 2. Add icons

Place three PNG icons in `extension/icons/`:
- `icon16.png` — 16×16
- `icon48.png` — 48×48
- `icon128.png` — 128×128

Any noir-style icon works. You can use a simple yellow-on-black skull or calendar badge.

### 3. Load the extension in Chrome

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Note the **Extension ID** shown on the card (e.g. `abcdefghijklmnopqrstuvwxyz123456`)
6. Go back to Google Cloud Console and add this ID to your OAuth credentials

### 4. Authorize on first use

1. Navigate to [calendar.google.com](https://calendar.google.com)
2. You should see a **"✦ New Smart Meeting"** button appear near the existing "+ New" button
3. Click it — the side panel opens
4. Fill in the brief and click through to the verdict
5. On first submission Chrome will prompt you to authorize Google Calendar access

---

## How it works

| File | Responsibility |
|------|---------------|
| `content.js` | MutationObserver watches for GCal's toolbar to render across SPA navigations, injects the button with a debounced 400ms delay |
| `background.js` | Service worker opens the side panel when the button is clicked, passes selected date/time context via `chrome.storage.session` |
| `panel.js` | Three-step form: **Brief** (title, date/time, attendees) → **Interrogate** (goal, outcome) → **Verdict** (computed recommendation) |
| `api.js` | Calls `chrome.identity.getAuthToken`, builds the Google Calendar Event resource, handles 401 token expiry with one retry |

### Verdict logic

| Condition | Verdict |
|-----------|---------|
| Goal = update AND attendees > 3 | `async` — send an email instead |
| No clear outcome AND goal ≠ brainstorm | `kill` — no justification |
| Attendees > 7 OR cost > £500 | `trim` — reduce headcount & duration |
| Otherwise | `keep` — survives interrogation |

When verdict is `kill` or `async` and the user accepts, no calendar event is created. If they choose "Schedule anyway", the event is created with the original details.

---

## Development notes

- No build step required — plain HTML/CSS/JS, loaded directly as an unpacked extension
- The panel UI is self-contained and does not depend on the React prototype's build output
- Style changes: edit `styles.css` only — it uses CSS custom properties matching the web prototype's design tokens
- To update the verdict algorithm: edit the `computeVerdict()` function in `panel.js`
