"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = 3000;
const FILE = path.join(process.cwd(), "tasks.json");

// ── File helpers ───────────────────────────────────────────────────────────────

function loadTasks() {
  if (!fs.existsSync(FILE)) return [];
  const raw = fs.readFileSync(FILE, "utf8");
  return JSON.parse(raw); // throws on corrupt JSON — caught by requestHandler
}

function saveTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2), "utf8");
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString();
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function serveHTML(res) {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

// ── Route handlers ─────────────────────────────────────────────────────────────

function getTasks(req, res, parsedUrl) {
  const q = (parsedUrl.searchParams.get("q") || "").toLowerCase().trim();
  const filter = (parsedUrl.searchParams.get("filter") || "").trim();
  const STATUS_SET = new Set(["to-visit", "visiting", "visited"]);

  let tasks = loadTasks();

  if (q) {
    tasks = tasks.filter(
      (t) =>
        t.url.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (filter) {
    if (STATUS_SET.has(filter)) {
      tasks = tasks.filter((t) => t.status === filter);
    } else {
      tasks = tasks.filter((t) => (t.tags || []).includes(filter));
    }
  }

  send(res, 200, tasks);
}

async function createTask(req, res) {
  const body = await readBody(req);
  const { url, name } = body;

  if (!url) return send(res, 400, { error: "url is required" });

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return send(res, 400, { error: `Invalid URL: ${url}` });
  }

  const tasks = loadTasks();
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
  const now = new Date().toISOString();

  const task = {
    id,
    url,
    name: (name || "").trim() || hostname,
    status: "to-visit",
    tags: [],
    notes: "",
    lastVisited: null,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(task);
  saveTasks(tasks);
  send(res, 201, task);
}

async function updateTask(req, res, id) {
  const body = await readBody(req);
  const { name } = body;

  if (!name || !name.trim()) return send(res, 400, { error: "name is required" });

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return send(res, 404, { error: `No site with id ${id}` });

  task.name = name.trim();
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  send(res, 200, task);
}

function deleteTask(res, id) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return send(res, 404, { error: `No site with id ${id}` });

  tasks.splice(index, 1);
  saveTasks(tasks);
  send(res, 200, { deleted: id });
}

async function setStatus(req, res, id) {
  const body = await readBody(req);
  const { status } = body;
  const VALID = new Set(["to-visit", "visiting", "visited"]);

  if (!status || !VALID.has(status))
    return send(res, 400, { error: "status must be to-visit | visiting | visited" });

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return send(res, 404, { error: `No site with id ${id}` });

  const now = new Date().toISOString();
  task.status = status;
  task.updatedAt = now;
  if (status === "visited") task.lastVisited = now;
  saveTasks(tasks);
  send(res, 200, task);
}

async function setNote(req, res, id) {
  const body = await readBody(req);
  const { notes } = body;

  if (notes === undefined) return send(res, 400, { error: "notes is required" });

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return send(res, 404, { error: `No site with id ${id}` });

  task.notes = notes;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  send(res, 200, task);
}

async function addTag(req, res, id) {
  const body = await readBody(req);
  const rawTag = (body.tag || "").trim().toLowerCase();

  if (!rawTag) return send(res, 400, { error: "tag is required" });

  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return send(res, 404, { error: `No site with id ${id}` });

  if (task.tags.includes(rawTag))
    return send(res, 409, { error: `Tag "${rawTag}" already exists` });

  task.tags.push(rawTag);
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  send(res, 200, task);
}

function removeTag(res, id, tagName) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return send(res, 404, { error: `No site with id ${id}` });

  const before = task.tags.length;
  task.tags = task.tags.filter((t) => t !== tagName);
  if (task.tags.length === before)
    return send(res, 404, { error: `Tag "${tagName}" not found` });

  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  send(res, 200, task);
}

// ── Request dispatcher ─────────────────────────────────────────────────────────

async function requestHandler(req, res) {
  // CORS for local dev convenience
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    // segments: [] | ["api","tasks"] | ["api","tasks",":id"] | ["api","tasks",":id","status"] …

    const method = req.method;

    // GET /
    if (method === "GET" && parsedUrl.pathname === "/") {
      return serveHTML(res);
    }

    // /api/tasks …
    if (segments[0] === "api" && segments[1] === "tasks") {
      const rawId = segments[2];
      const id = rawId ? parseInt(rawId, 10) : null;
      const sub = segments[3]; // "status" | "note" | "tag"
      const tagName = sub === "tag" ? decodeURIComponent(segments[4] || "") : null;

      // GET /api/tasks
      if (method === "GET" && !rawId) return getTasks(req, res, parsedUrl);

      // POST /api/tasks
      if (method === "POST" && !rawId) return await createTask(req, res);

      if (rawId && isNaN(id)) return send(res, 400, { error: "id must be an integer" });

      // PUT /api/tasks/:id
      if (method === "PUT" && id && !sub) return await updateTask(req, res, id);

      // DELETE /api/tasks/:id
      if (method === "DELETE" && id && !sub) return deleteTask(res, id);

      // POST /api/tasks/:id/status
      if (method === "POST" && id && sub === "status") return await setStatus(req, res, id);

      // POST /api/tasks/:id/note
      if (method === "POST" && id && sub === "note") return await setNote(req, res, id);

      // POST /api/tasks/:id/tag
      if (method === "POST" && id && sub === "tag") return await addTag(req, res, id);

      // DELETE /api/tasks/:id/tag/:tag
      if (method === "DELETE" && id && sub === "tag" && tagName)
        return removeTag(res, id, tagName);
    }

    send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err.message || "Internal server error" });
  }
}

// ── Start ──────────────────────────────────────────────────────────────────────

http.createServer(requestHandler).listen(PORT, () => {
  console.log(`Website Tracker running at http://localhost:${PORT}`);
});
