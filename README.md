# Clue

Clue is a cool overlay to make life easier.



https://github.com/user-attachments/assets/731d656b-5d1f-4493-b2b5-d90a6ddfbe44




https://github.com/user-attachments/assets/27a90636-a1a5-4993-bfdb-0ebf08e0a7d7



- Not detectable by Zoom, Meet, Teams.
- JSON Config:
  ```json
  {
    "aiModel": "gemini-2.5-pro",
    "apiKey": "",
    "theme": "dark",
    "opacity": 100,
    "selectedModeId": "focus",
    "modes": [
      {
        "id": "focus",
        "name": "Focus",
        "icon": "🧘",
        "prompt": "Help me focus on what's important on this screen...",
        "category": "productivity",
        "isCustom": true
      },
      {
        "id": "explain",
        "name": "Explain",
        "icon": "⚡",
        "prompt": "Explain what I'm looking at in simple terms...",
        "category": "help",
        "isCustom": true
      }, ... // add custom modes
    ]
  }
  ```
- Move panel around screen using `Ctrl or ⌘ + ↑ ↓ ← →`
- Uses shortcuts to interact:
  - `Ctrl or ⌘ + \` Show/Hide
  - `Ctrl or ⌘ + ↵` Send
  - `Ctrl or ⌘ + M` Start listening
- Settings panel to customize theme, modes, AI model, panel opacity and open config file.

### Install

TODO: add builds for user convenience.

```bash
bun install
```

### Development

```bash
bun dev
```

### Build

```bash
# For windows
bun build:win

# For macOS
bun build:mac

# For Linux
bun build:linux
```
