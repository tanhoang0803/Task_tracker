# Website Tracker

[![CI](https://github.com/tanhoang0803/Task_tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tanhoang0803/Task_tracker/actions/workflows/ci.yml)

> GitHub: https://github.com/tanhoang0803/Task_tracker
> Project: https://roadmap.sh/projects/task-tracker

A CLI + web UI tool for tracking websites you want to visit, are visiting, or have visited. No external dependencies — data is stored locally in `tasks.json`.

## Web UI

**Source:** [`index.html`](https://github.com/tanhoang0803/Task_tracker/blob/master/index.html)

```bash
npm run serve
# open http://localhost:3000
```

- Card grid with status badges: **To Visit** (gray) · **Visiting** (amber) · **Visited** (green)
- Click **Open** or the site name → marks visiting, opens the URL, auto-marks visited when you close the tab
- Inline tag pills, click-to-edit notes, live search, filter by status or tag

## CLI

```bash
# Add a site (name is optional, defaults to hostname)
node task-cli.js add <url> [name]

# Rename a site
node task-cli.js update <id> <name>

# Delete a site
node task-cli.js delete <id>

# Change status
node task-cli.js mark-visiting <id>
node task-cli.js mark-visited <id>

# Notes & tags
node task-cli.js note <id> <text>
node task-cli.js tag <id> <tag>
node task-cli.js untag <id> <tag>

# Open in browser
node task-cli.js open <id>

# Search (url, name, notes, tags)
node task-cli.js search <keyword>

# List (no filter, or by status / tag name)
node task-cli.js list
node task-cli.js list to-visit
node task-cli.js list visiting
node task-cli.js list visited
node task-cli.js list <tag>
```

## Schema (`tasks.json`)

| Field         | Description                                    |
|---------------|------------------------------------------------|
| `id`          | Auto-incremented integer                       |
| `url`         | Full URL of the site                           |
| `name`        | Display name (defaults to hostname)            |
| `status`      | `to-visit` · `visiting` · `visited`            |
| `tags`        | Array of strings                               |
| `notes`       | Free-text notes                                |
| `lastVisited` | ISO timestamp, set when marked visited         |
| `createdAt`   | ISO timestamp                                  |
| `updatedAt`   | ISO timestamp                                  |

## Constraints

- No external libraries or frameworks
- Native `fs`, `http`, `path`, `url`, `child_process` modules only
- `tasks.json` shared between CLI and web UI — changes are immediately visible in both
