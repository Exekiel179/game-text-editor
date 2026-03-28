# Game Text Editor

`Game Text Editor` is a local-first branching dialogue editor for narrative games, training dialogue systems, and node-based interactive scripts.

It now covers the full `1 / 2 / 3` feature set:

1. Local backend persistence and version history
2. Project library and multi-chapter management
3. Godot-friendly `dlg_*.json` export

## Version

- Current release: `v0.1`
- Package version: `0.1.0`

## Features

- Project library with local backend API
- Multi-chapter dialogue organization
- Visual node graph editor
- Branch and choice editing
- AI branch generation
- AI node refinement
- OpenAI-compatible API format
- Anthropic Messages API format
- System prompt presets
- Protagonist setup and world notes
- Gameplay metric effects and derived formulas
- Version snapshot creation and restore
- Export to JSON, Markdown, and Godot dialogue files

## Tech Stack

- Frontend: plain HTML, CSS, JavaScript
- Backend: local Node.js HTTP server
- Storage: filesystem JSON under `data_store/projects`

## Run Locally

Requirements:

- Node.js 18+ recommended

Install and start:

```bash
npm start
```

Open:

```text
http://localhost:3030
```

If you open `index.html` directly, the editor UI still works, but backend-backed project library, version history, and Godot export API flow are disabled.

## Implemented 1 / 2 / 3

### 1. Backend persistence and versioning

- `server.js` exposes local APIs for health check, project listing, project save/load, version listing, version creation, version restore, and Godot export.
- Every server save writes project JSON plus a version snapshot.
- Version data is stored under:

```text
data_store/projects/<project-id>/
```

### 2. Project library and multi-chapter management

- The editor state is now structured as:

```text
Project -> Chapters -> Nodes -> Choices
```

- Left panel includes:
  - project list
  - chapter list
  - version list
- You can:
  - create a new project
  - switch between stored projects
  - add chapters
  - edit chapter title and notes
  - edit nodes inside the selected chapter

### 3. Godot export

- The editor exports chapter files in a Godot-oriented format:

```text
data/dialogue/<project>/dlg_<project>_<chapter>_v1.json
```

- Exported data includes:
  - project metadata
  - chapter metadata
  - metrics
  - derived formulas
  - nodes
  - choices
  - editor positions

## AI Provider Support

The editor supports two API request formats.

### OpenAI Compatible

- Typical base URL:

```text
https://api.openai.com/v1
```

- Request endpoint:

```text
/chat/completions
```

### Anthropic Messages

- Typical base URL:

```text
https://api.anthropic.com
```

- The app normalizes it to:

```text
/v1/messages
```

## Project Files

- `index.html`: main UI layout
- `styles.css`: visual design and responsive styling
- `app.js`: frontend state, graph editing, backend integration, AI calls, export logic
- `server.js`: local backend API and filesystem persistence
- `package.json`: package metadata and start script
- `.gitignore`: ignored runtime files

## API Overview

Local API routes:

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `GET /api/projects/:id/versions`
- `POST /api/projects/:id/versions`
- `POST /api/projects/:id/restore`
- `GET /api/projects/:id/export/godot`

## Notes

- Runtime data in `data_store/` is ignored from git.
- API keys are stored in browser state for local usage and are not written into repository files by default.
- The current release is intended as an MVP editor baseline for narrative tooling and Godot pipeline integration.
