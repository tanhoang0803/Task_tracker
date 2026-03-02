#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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

// ── Commands ──────────────────────────────────────────────────────────────────

function add(description) {
  if (!description) return console.error("Usage: task-cli add <description>");

  const tasks = loadTasks();
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const now = new Date().toISOString();

  tasks.push({ id, description, status: "todo", createdAt: now, updatedAt: now });
  saveTasks(tasks);
  console.log(`Task added (id: ${id})`);
}

function update(id, description) {
  if (!id || !description)
    return console.error("Usage: task-cli update <id> <description>");

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No task with id ${id}.`);

  task.description = description;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  console.log(`Task ${id} updated.`);
}

function del(id) {
  if (!id) return console.error("Usage: task-cli delete <id>");

  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === Number(id));
  if (index === -1) return console.error(`Error: No task with id ${id}.`);

  tasks.splice(index, 1);
  saveTasks(tasks);
  console.log(`Task ${id} deleted.`);
}

function markStatus(id, status) {
  if (!id) return console.error(`Usage: task-cli mark-${status} <id>`);

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return console.error(`Error: No task with id ${id}.`);

  task.status = status;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  console.log(`Task ${id} marked as ${status}.`);
}

function list(filter) {
  const tasks = loadTasks();

  const filtered =
    filter === "done"
      ? tasks.filter((t) => t.status === "done")
      : filter === "not-done"
      ? tasks.filter((t) => t.status === "todo")
      : filter === "in-progress"
      ? tasks.filter((t) => t.status === "in-progress")
      : tasks;

  if (filtered.length === 0) {
    console.log("No tasks found.");
    return;
  }

  const STATUS_LABEL = { todo: "[ ]", "in-progress": "[~]", done: "[x]" };

  filtered.forEach((t) => {
    console.log(
      `${STATUS_LABEL[t.status] ?? "[ ]"} #${t.id} ${t.description}`
    );
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

const [, , command, arg1, arg2] = process.argv;

switch (command) {
  case "add":
    add(arg1);
    break;
  case "update":
    update(arg1, arg2);
    break;
  case "delete":
    del(arg1);
    break;
  case "mark-in-progress":
    markStatus(arg1, "in-progress");
    break;
  case "mark-done":
    markStatus(arg1, "done");
    break;
  case "list":
    list(arg1);
    break;
  default:
    console.log(`Task Tracker CLI

Usage:
  task-cli add <description>
  task-cli update <id> <description>
  task-cli delete <id>
  task-cli mark-in-progress <id>
  task-cli mark-done <id>
  task-cli list
  task-cli list done
  task-cli list not-done
  task-cli list in-progress`);
}
