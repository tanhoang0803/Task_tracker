#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const FILE = path.join(process.cwd(), "tasks.json");

// ── File helpers ──────────────────────────────────────────────────────────────

function loadTasks() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    console.error("Error: tasks.json is corrupted.");
    process.exit(1);
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2), "utf8");
}

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error(`Error opening browser: ${err.message}`);
  });
}

// ── Commands ──────────────────────────────────────────────────────────────────

function add(url, name) {
  if (!url) return console.error("Usage: task-cli add <url> [name]");

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return console.error(`Error: Invalid URL "${url}".`);
  }

  const tasks = loadTasks();
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const now = new Date().toISOString();

  tasks.push({
    id,
    url,
    name: name || hostname,
    status: "to-visit",
    tags: [],
    notes: "",
    lastVisited: null,
    createdAt: now,
    updatedAt: now,
  });
  saveTasks(tasks);
  console.log(`Site added (id: ${id})`);
}

function update(id, name) {
  if (!id || !name)
    return console.error("Usage: task-cli update <id> <name>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  task.name = name;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  console.log(`Site ${id} updated.`);
}

function del(id) {
  if (!id) return console.error("Usage: task-cli delete <id>");

  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === Number(id));
  if (index === -1) return console.error(`Error: No site with id ${id}.`);

  tasks.splice(index, 1);
  saveTasks(tasks);
  console.log(`Site ${id} deleted.`);
}

function markStatus(id, status) {
  if (!id) return console.error(`Usage: task-cli mark-${status} <id>`);

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  const now = new Date().toISOString();
  task.status = status;
  task.updatedAt = now;
  if (status === "visited") task.lastVisited = now;
  saveTasks(tasks);
  console.log(`Site ${id} marked as ${status}.`);
}

function note(id, text) {
  if (!id || !text)
    return console.error("Usage: task-cli note <id> <text>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  task.notes = text;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  console.log(`Note set on site ${id}.`);
}

function tag(id, tagName) {
  if (!id || !tagName)
    return console.error("Usage: task-cli tag <id> <tag>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  if (!task.tags.includes(tagName)) {
    task.tags.push(tagName);
    task.updatedAt = new Date().toISOString();
    saveTasks(tasks);
    console.log(`Tag "${tagName}" added to site ${id}.`);
  } else {
    console.log(`Tag "${tagName}" already exists on site ${id}.`);
  }
}

function untag(id, tagName) {
  if (!id || !tagName)
    return console.error("Usage: task-cli untag <id> <tag>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  const before = task.tags.length;
  task.tags = task.tags.filter((t) => t !== tagName);
  if (task.tags.length === before)
    return console.log(`Tag "${tagName}" not found on site ${id}.`);

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  console.log(`Tag "${tagName}" removed from site ${id}.`);
}

function openSite(id) {
  if (!id) return console.error("Usage: task-cli open <id>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No site with id ${id}.`);

  console.log(`Opening ${task.url} ...`);
  openBrowser(task.url);
}

function search(keyword) {
  if (!keyword) return console.error("Usage: task-cli search <keyword>");

  const lower = keyword.toLowerCase();
  const tasks = loadTasks();
  const results = tasks.filter(
    (t) =>
      t.url.toLowerCase().includes(lower) ||
      t.name.toLowerCase().includes(lower) ||
      t.notes.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );

  if (results.length === 0) {
    console.log(`No sites matching "${keyword}".`);
    return;
  }
  printTasks(results);
}

const STATUS_ICON = {
  "to-visit": "[ ]",
  visiting: "[~]",
  visited: "[x]",
};

function printTasks(tasks) {
  tasks.forEach((t) => {
    const icon = STATUS_ICON[t.status] ?? "[ ]";
    const tags = t.tags.length ? `[${t.tags.join(", ")}]` : "";
    const notes = t.notes.length > 40 ? t.notes.slice(0, 40) + "…" : t.notes;
    const parts = [icon, `#${t.id}`, t.name, t.url];
    if (tags) parts.push(tags);
    if (notes) parts.push(`"${notes}"`);
    console.log(parts.join(" | "));
  });
}

function list(filter) {
  const tasks = loadTasks();
  const STATUS_FILTERS = new Set(["to-visit", "visiting", "visited"]);

  let filtered;
  if (!filter) {
    filtered = tasks;
  } else if (STATUS_FILTERS.has(filter)) {
    filtered = tasks.filter((t) => t.status === filter);
  } else {
    // treat filter as a tag name
    filtered = tasks.filter((t) => t.tags.includes(filter));
  }

  if (filtered.length === 0) {
    console.log("No sites found.");
    return;
  }
  printTasks(filtered);
}

// ── Router ────────────────────────────────────────────────────────────────────

const [, , command, arg1, ...rest] = process.argv;
// arg2 may contain spaces if passed as a single quoted argument — join rest
const arg2 = rest.join(" ") || undefined;

switch (command) {
  case "add":
    add(arg1, arg2);
    break;
  case "update":
    update(arg1, arg2);
    break;
  case "delete":
    del(arg1);
    break;
  case "mark-visiting":
    markStatus(arg1, "visiting");
    break;
  case "mark-visited":
    markStatus(arg1, "visited");
    break;
  case "note":
    note(arg1, arg2);
    break;
  case "tag":
    tag(arg1, arg2);
    break;
  case "untag":
    untag(arg1, arg2);
    break;
  case "open":
    openSite(arg1);
    break;
  case "search":
    search(arg1);
    break;
  case "list":
    list(arg1);
    break;
  default:
    console.log(`Website Tracker CLI

Usage:
  task-cli add <url> [name]
  task-cli update <id> <name>
  task-cli delete <id>
  task-cli mark-visiting <id>
  task-cli mark-visited <id>
  task-cli note <id> <text>
  task-cli tag <id> <tag>
  task-cli untag <id> <tag>
  task-cli open <id>
  task-cli search <keyword>
  task-cli list
  task-cli list to-visit
  task-cli list visiting
  task-cli list visited
  task-cli list <tag>`);
}
