# Game Text Editor

`Game Text Editor` is a branching dialogue editor for narrative games and training dialogue systems. It combines a visual node canvas, chapter-based content editing, AI-assisted drafting, multi-user collaboration, version attribution, and local filesystem persistence.

Version: `v0.2`

## Core Capabilities

- Visual dialogue graph editing with node drag, edge retarget, zoom, and path simulation
- Project -> chapter -> node -> choice workflow
- AI graph generation and AI node refinement through a server-side AI proxy
- Admin-only AI provider configuration
- User registration, login, and multi-user collaborative editing
- Version snapshots with actor attribution and version comparison summary
- Export to JSON, Markdown, and Godot-style `dlg_*.json`
- Single-container deployment with a persistent storage directory

## Roles

### Admin

- Can modify:
  - AI provider format
  - Base URL
  - Model name
  - API key
- Can use all normal collaboration features

### Normal User

- Can register and log in
- Can load, edit, save, version, restore, and export projects
- Cannot change global AI access configuration

## Storage Layout

Runtime data is stored under the directory configured by `STORAGE_DIR`.

Default local path:

```text
data_store/
```

Main files:

```text
data_store/
  ai_config.json
  users.json
  sessions.json
  projects/
    <project-id>/
      project.json
      versions/
        <timestamp>_<label>.json
```

## Local Run

Requirements:

- Node.js 18+

Start:

```bash
npm start
```

Open:

```text
http://localhost:3030
```

## Default Admin Account

If no admin exists yet, the server bootstraps one automatically.

Username and display name still default to:

```text
username: admin
display name: Administrator
```

Password behavior:

- If `ADMIN_PASSWORD` is provided, that value is used
- If `ADMIN_PASSWORD` is not provided, the server generates a one-time random password and writes it only to:

```text
<STORAGE_DIR>/admin_bootstrap.json
```

- Secure or delete that file after the first successful admin login

Override them with environment variables:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password
ADMIN_DISPLAY_NAME=Administrator
```

## Environment Variables

- `PORT`
  - default: `3030`
- `STORAGE_DIR`
  - default: `<project-root>/data_store`
- `ADMIN_USERNAME`
  - default: `admin`
- `ADMIN_PASSWORD`
  - default: no fixed default; random bootstrap password is generated if omitted
- `ADMIN_DISPLAY_NAME`
  - default: `Administrator`

## AI Provider Management

AI credentials are now managed on the server and are shared by all collaborators.

Supported provider formats:

- `openai`
  - normalized to `POST /chat/completions`
- `anthropic`
  - normalized to `POST /v1/messages`

Frontend users no longer store shared provider credentials inside project data. The admin updates the provider once, and all authenticated users can use the configured AI generation tools.

## Collaboration and Versioning

Each project save records:

- `lastEditedBy`
- `updatedAt`

Each version snapshot records:

- `actor`
- `createdAt`
- `label`

The UI can compare adjacent versions and summarize:

- chapter delta
- node delta
- added nodes
- removed nodes
- text changes
- choice changes
- metric/effect changes

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin AI Config

- `GET /api/admin/ai-config`
- `PUT /api/admin/ai-config`

### Authenticated AI Access

- `GET /api/ai/config`
- `POST /api/ai/generate-graph`
- `POST /api/ai/refine-node`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `GET /api/projects/:id/versions`
- `POST /api/projects/:id/versions`
- `GET /api/projects/:id/versions/compare?from=<id>&to=<id>`
- `POST /api/projects/:id/restore`
- `GET /api/projects/:id/export/godot`

## Container Deployment

Build:

```bash
docker build -t game-text-editor:v0.2 .
```

Run with persistent storage:

```bash
docker run -d ^
  --name game-text-editor ^
  -p 3030:3030 ^
  -e STORAGE_DIR=/app/data ^
  -e ADMIN_USERNAME=admin ^
  -e ADMIN_PASSWORD=change-me ^
  -e ADMIN_DISPLAY_NAME=Administrator ^
  -v %cd%\\game-text-editor-data:/app/data ^
  game-text-editor:v0.2
```

Linux/macOS equivalent:

```bash
docker run -d \
  --name game-text-editor \
  -p 3030:3030 \
  -e STORAGE_DIR=/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=change-me \
  -e ADMIN_DISPLAY_NAME=Administrator \
  -v "$(pwd)/game-text-editor-data:/app/data" \
  game-text-editor:v0.2
```

The container writes all persistent runtime state into `/app/data`.

## Main Files

- `index.html`
- `styles.css`
- `app.js`
- `server.js`
- `Dockerfile`
- `.dockerignore`

## Validation

Validated locally with:

- `node --check app.js`
- `node --check server.js`
- live API checks for:
  - admin AI config update
  - user registration/login
  - collaborative project save
  - version comparison
