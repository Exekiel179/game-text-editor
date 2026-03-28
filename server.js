const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3030);
const ROOT = __dirname;
const STORAGE_DIR = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(ROOT, "data_store");
const PROJECTS_DIR = path.join(STORAGE_DIR, "projects");
const USERS_FILE = path.join(STORAGE_DIR, "users.json");
const SESSIONS_FILE = path.join(STORAGE_DIR, "sessions.json");
const AI_CONFIG_FILE = path.join(STORAGE_DIR, "ai_config.json");
const ADMIN_BOOTSTRAP_FILE = path.join(STORAGE_DIR, "admin_bootstrap.json");

const DEFAULT_AI_CONFIG = {
  kind: "openai",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  updatedAt: null,
  updatedBy: null
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

bootstrapStorage();

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await handleStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: { message: error.message } });
  }
}).listen(PORT, () => {
  console.log(`Game Text Editor server running at http://localhost:${PORT}`);
  console.log(`Persistent storage: ${STORAGE_DIR}`);
});

async function handleApi(req, res, url) {
  const method = req.method.toUpperCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const user = authenticate(req);

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      storageDir: STORAGE_DIR,
      authenticated: Boolean(user),
      user: user ? sanitizeUser(user) : null
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJsonBody(req);
    const registered = registerUser(body);
    sendJson(res, 201, { user: sanitizeUser(registered) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJsonBody(req);
    const session = loginUser(body);
    sendJson(res, 200, session);
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/logout") {
    requireAuth(user);
    logoutUser(req);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && url.pathname === "/api/auth/me") {
    requireAuth(user);
    sendJson(res, 200, { user: sanitizeUser(user) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/admin/ai-config") {
    requireAdmin(user);
    sendJson(res, 200, { config: maskAiConfig(readAiConfig(), true) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/ai/config") {
    requireAuth(user);
    sendJson(res, 200, { config: maskAiConfig(readAiConfig(), user.role === "admin") });
    return;
  }

  if (method === "PUT" && url.pathname === "/api/admin/ai-config") {
    requireAdmin(user);
    const body = await readJsonBody(req);
    const config = updateAiConfig(body, user);
    sendJson(res, 200, { config: maskAiConfig(config, true) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/ai/generate-graph") {
    requireAuth(user);
    const body = await readJsonBody(req);
    const result = await requestAiProxy(body);
    sendJson(res, 200, result);
    return;
  }

  if (method === "POST" && url.pathname === "/api/ai/refine-node") {
    requireAuth(user);
    const body = await readJsonBody(req);
    const result = await requestAiProxy(body);
    sendJson(res, 200, result);
    return;
  }

  requireAuth(user);

  if (method === "GET" && url.pathname === "/api/projects") {
    sendJson(res, 200, { projects: listProjects() });
    return;
  }

  if (method === "POST" && url.pathname === "/api/projects") {
    const body = await readJsonBody(req);
    const project = createProject(body?.title || "未命名项目", user);
    writeProject(project, "initial", user);
    sendJson(res, 201, { project });
    return;
  }

  if (parts[1] === "projects" && parts[2]) {
    const projectId = parts[2];

    if (method === "GET" && parts.length === 3) {
      sendJson(res, 200, { project: readProject(projectId) });
      return;
    }

    if (method === "PUT" && parts.length === 3) {
      const body = await readJsonBody(req);
      const existing = readProject(projectId);
      const project = normalizeProject({
        ...existing,
        ...body,
        id: projectId,
        provider: existing.provider,
        updatedAt: new Date().toISOString(),
        lastEditedBy: { id: user.id, displayName: user.displayName, username: user.username }
      });
      writeProject(project, "autosave", user);
      sendJson(res, 200, { project });
      return;
    }

    if (method === "GET" && parts[3] === "versions" && parts.length === 4) {
      sendJson(res, 200, { versions: listVersions(projectId) });
      return;
    }

    if (method === "POST" && parts[3] === "versions" && parts.length === 4) {
      const body = await readJsonBody(req);
      const project = readProject(projectId);
      const version = createVersion(projectId, project, body?.label || "manual", user);
      sendJson(res, 201, { version });
      return;
    }

    if (method === "GET" && parts[3] === "versions" && parts[4] === "compare") {
      const fromId = url.searchParams.get("from");
      const toId = url.searchParams.get("to");
      const result = compareVersions(projectId, fromId, toId);
      sendJson(res, 200, result);
      return;
    }

    if (method === "POST" && parts[3] === "restore" && parts.length === 4) {
      const body = await readJsonBody(req);
      const version = readVersion(projectId, body?.versionId);
      const project = normalizeProject({
        ...version.snapshot,
        id: projectId,
        updatedAt: new Date().toISOString(),
        lastEditedBy: { id: user.id, displayName: user.displayName, username: user.username }
      });
      writeProject(project, `restore-${body?.versionId || "unknown"}`, user);
      sendJson(res, 200, { project });
      return;
    }

    if (method === "GET" && parts[3] === "export" && parts[4] === "godot") {
      const project = readProject(projectId);
      sendJson(res, 200, { export: buildGodotExport(project) });
      return;
    }
  }

  sendJson(res, 404, { error: { message: "API not found" } });
}

async function handleStatic(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  const relativePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

function bootstrapStorage() {
  ensureDir(STORAGE_DIR);
  ensureDir(PROJECTS_DIR);
  ensureJsonFile(USERS_FILE, []);
  ensureJsonFile(SESSIONS_FILE, []);
  ensureJsonFile(AI_CONFIG_FILE, DEFAULT_AI_CONFIG);
  ensureAdminUser();
}

function ensureAdminUser() {
  const users = readUsers();
  if (users.some(user => user.role === "admin")) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "Administrator";
  const password = process.env.ADMIN_PASSWORD || generateBootstrapPassword();
  const passwordHash = hashPassword(password);
  users.push({
    id: `user_${Date.now().toString(36)}`,
    username,
    displayName,
    role: "admin",
    passwordHash,
    createdAt: new Date().toISOString()
  });
  writeJson(USERS_FILE, users);
  if (!process.env.ADMIN_PASSWORD) {
    writeJson(ADMIN_BOOTSTRAP_FILE, {
      username,
      displayName,
      password,
      generatedAt: new Date().toISOString(),
      note: "Delete or secure this file after the first successful admin login."
    });
    console.log(`Admin bootstrap credentials written to ${ADMIN_BOOTSTRAP_FILE}`);
  }
}

function authenticate(req) {
  const token = readBearerToken(req);
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions.find(item => item.token === token);
  if (!session) return null;
  return readUsers().find(user => user.id === session.userId) || null;
}

function requireAuth(user) {
  if (!user) throw new Error("需要登录");
}

function requireAdmin(user) {
  requireAuth(user);
  if (user.role !== "admin") throw new Error("仅管理员可执行此操作");
}

function registerUser(body) {
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "").trim();
  const displayName = String(body?.displayName || username).trim();
  if (!username || !password) throw new Error("用户名和密码必填");
  const users = readUsers();
  if (users.some(user => user.username === username)) throw new Error("用户名已存在");
  const user = {
    id: `user_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    username,
    displayName,
    role: "user",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  return user;
}

function loginUser(body) {
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "").trim();
  const user = readUsers().find(item => item.username === username);
  if (!user || !verifyPassword(password, user.passwordHash)) throw new Error("用户名或密码错误");
  const sessions = readSessions();
  const token = crypto.randomBytes(24).toString("hex");
  sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeJson(SESSIONS_FILE, sessions);
  return { token, user: sanitizeUser(user) };
}

function logoutUser(req) {
  const token = readBearerToken(req);
  if (!token) return;
  writeJson(SESSIONS_FILE, readSessions().filter(item => item.token !== token));
}

function readBearerToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers["x-auth-token"] || null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt
  };
}

function readUsers() {
  return readJson(USERS_FILE, []);
}

function readSessions() {
  return readJson(SESSIONS_FILE, []);
}

function readAiConfig() {
  return { ...DEFAULT_AI_CONFIG, ...readJson(AI_CONFIG_FILE, DEFAULT_AI_CONFIG) };
}

function updateAiConfig(body, user) {
  const current = readAiConfig();
  const next = {
    kind: ["openai", "anthropic"].includes(body?.kind) ? body.kind : current.kind,
    baseUrl: String(body?.baseUrl || current.baseUrl || "").trim(),
    apiKey: String(body?.apiKey ?? current.apiKey ?? "").trim(),
    model: String(body?.model || current.model || "").trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: { id: user.id, displayName: user.displayName, username: user.username }
  };
  writeJson(AI_CONFIG_FILE, next);
  return next;
}

function maskAiConfig(config, includeKey = false) {
  return {
    kind: config.kind,
    baseUrl: config.baseUrl,
    model: config.model,
    hasApiKey: Boolean(config.apiKey),
    apiKeyMasked: includeKey && config.apiKey ? `${"*".repeat(Math.max(config.apiKey.length - 4, 0))}${config.apiKey.slice(-4)}` : "",
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy || null
  };
}

async function requestAiProxy(body) {
  const config = readAiConfig();
  if (!config.apiKey || !config.baseUrl || !config.model) {
    throw new Error("管理员尚未配置 AI 接口");
  }
  const systemPrompt = String(body?.systemPrompt || "");
  const userPrompt = String(body?.userPrompt || "");
  const temperature = Number(body?.temperature ?? 0.7);

  const url = config.kind === "anthropic"
    ? normalizeAnthropicUrl(config.baseUrl)
    : normalizeOpenAiUrl(config.baseUrl);

  const payload = config.kind === "anthropic"
    ? {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2400,
          temperature,
          system: `${systemPrompt}\n仅输出 JSON，不要加解释文本。`,
          messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }]
        })
      }
    : {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          temperature,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]
        })
      };

  const response = await fetch(url, payload);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? data.error?.type ?? "AI 请求失败");
  }
  return {
    provider: config.kind,
    text: config.kind === "anthropic"
      ? (data.content || []).filter(item => item.type === "text").map(item => item.text).join("\n")
      : (data.choices?.[0]?.message?.content || "")
  };
}

function createProject(title, user) {
  const id = `proj_${Date.now().toString(36)}`;
  const timestamp = new Date().toISOString();
  return normalizeProject({
    id,
    title,
    projectGoal: "",
    worldNotes: "",
    protagonist: { name: "", role: "", traits: "", goal: "" },
    preset: "cbt_training",
    systemPrompt: "",
    generationBrief: "",
    metrics: defaultMetrics(),
    derivedFormulas: "balance = clarity - stress",
    chapters: [createChapter("第一章：新章节")],
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: { id: user.id, displayName: user.displayName, username: user.username },
    lastEditedBy: { id: user.id, displayName: user.displayName, username: user.username }
  });
}

function createChapter(title) {
  return {
    id: `ch_${Date.now().toString(36)}_${crypto.randomBytes(2).toString("hex")}`,
    title,
    slug: slugify(title),
    notes: "",
    nodes: [{
      id: "n1",
      title: "开场",
      speaker: "旁白",
      kind: "start",
      text: "在这里开始你的章节。",
      tags: ["draft"],
      notes: "",
      position: { x: 64, y: 96 },
      effects: {},
      choices: []
    }]
  };
}

function defaultMetrics() {
  return [
    { id: "stress", label: "压力", min: 0, max: 100, initial: 48, color: "#a33c2f" },
    { id: "clarity", label: "清晰度", min: 0, max: 100, initial: 36, color: "#587164" },
    { id: "trust", label: "信任", min: 0, max: 100, initial: 42, color: "#b18b54" }
  ];
}

function normalizeProject(project) {
  return {
    id: project.id,
    title: project.title || project.projectTitle || "未命名项目",
    projectGoal: project.projectGoal || "",
    worldNotes: project.worldNotes || "",
    protagonist: project.protagonist || { name: "", role: "", traits: "", goal: "" },
    preset: project.preset || "cbt_training",
    systemPrompt: project.systemPrompt || "",
    generationBrief: project.generationBrief || "",
    metrics: Array.isArray(project.metrics) ? project.metrics : defaultMetrics(),
    derivedFormulas: project.derivedFormulas || "",
    chapters: Array.isArray(project.chapters) && project.chapters.length ? project.chapters.map(normalizeChapter) : [createChapter("第一章：新章节")],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
    createdBy: project.createdBy || null,
    lastEditedBy: project.lastEditedBy || null
  };
}

function normalizeChapter(chapter) {
  return {
    id: chapter.id || `ch_${Date.now().toString(36)}`,
    title: chapter.title || "未命名章节",
    slug: slugify(chapter.slug || chapter.title || "chapter"),
    notes: chapter.notes || "",
    nodes: Array.isArray(chapter.nodes) ? chapter.nodes : []
  };
}

function buildGodotExport(project) {
  const files = project.chapters.map((chapter, index) => {
    const safeProject = slugify(project.id || project.title);
    const safeChapter = slugify(chapter.slug || chapter.title || `ch${index + 1}`);
    return {
      path: `data/dialogue/${safeProject}/dlg_${safeProject}_${safeChapter}_v1.json`,
      content: {
        project_id: project.id,
        project_title: project.title,
        chapter_id: chapter.id,
        chapter_title: chapter.title,
        chapter_slug: chapter.slug,
        metrics: project.metrics,
        derived_formulas: project.derivedFormulas,
        nodes: chapter.nodes.map(node => ({
          id: node.id,
          speaker: node.speaker,
          title: node.title,
          type: node.kind,
          text: node.text,
          tags: node.tags || [],
          notes: node.notes || "",
          effects: node.effects || {},
          choices: (node.choices || []).map(choice => ({
            id: choice.id,
            text: choice.label,
            intent: choice.intent || "",
            note: choice.note || "",
            target: choice.targetId || "",
            effects: choice.effects || {}
          })),
          editor_position: node.position || { x: 0, y: 0 }
        }))
      }
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    projectTitle: project.title,
    files
  };
}

function listProjects() {
  return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const project = readProject(entry.name);
      return {
        id: project.id,
        title: project.title,
        chapters: project.chapters.length,
        updatedAt: project.updatedAt,
        createdAt: project.createdAt,
        lastEditedBy: project.lastEditedBy || null
      };
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function readProject(projectId) {
  const filePath = path.join(projectDir(projectId), "project.json");
  if (!fs.existsSync(filePath)) throw new Error(`Project not found: ${projectId}`);
  return normalizeProject(readJson(filePath, {}));
}

function writeProject(project, reason, user) {
  const dir = projectDir(project.id);
  ensureDir(dir);
  ensureDir(path.join(dir, "versions"));
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(normalizeProject(project), null, 2), "utf8");
  createVersion(project.id, project, reason, user);
}

function createVersion(projectId, snapshot, label, user) {
  const versionId = `${Date.now()}_${slugify(label || "version")}`;
  const payload = {
    id: versionId,
    label: label || "version",
    createdAt: new Date().toISOString(),
    actor: user ? { id: user.id, displayName: user.displayName, username: user.username } : null,
    snapshot: normalizeProject(snapshot)
  };
  ensureDir(path.join(projectDir(projectId), "versions"));
  fs.writeFileSync(path.join(projectDir(projectId), "versions", `${versionId}.json`), JSON.stringify(payload, null, 2), "utf8");
  return { id: payload.id, label: payload.label, createdAt: payload.createdAt, actor: payload.actor };
}

function listVersions(projectId) {
  const dir = path.join(projectDir(projectId), "versions");
  ensureDir(dir);
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(".json"))
    .map(name => readJson(path.join(dir, name), {}))
    .map(version => ({ id: version.id, label: version.label, createdAt: version.createdAt, actor: version.actor || null }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function readVersion(projectId, versionId) {
  if (!versionId) throw new Error("Missing versionId");
  const filePath = path.join(projectDir(projectId), "versions", `${versionId}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Version not found: ${versionId}`);
  return readJson(filePath, {});
}

function compareVersions(projectId, fromId, toId) {
  const from = readVersion(projectId, fromId);
  const to = readVersion(projectId, toId);
  const fromProject = normalizeProject(from.snapshot);
  const toProject = normalizeProject(to.snapshot);

  const fromNodes = flattenNodes(fromProject);
  const toNodes = flattenNodes(toProject);
  const fromKeys = new Set(fromNodes.map(node => node.key));
  const toKeys = new Set(toNodes.map(node => node.key));

  let changedText = 0;
  let changedChoices = 0;
  let changedEffects = 0;

  fromNodes.forEach(node => {
    const target = toNodes.find(item => item.key === node.key);
    if (!target) return;
    if (node.text !== target.text) changedText += 1;
    if (JSON.stringify(node.choices) !== JSON.stringify(target.choices)) changedChoices += 1;
    if (JSON.stringify(node.effects) !== JSON.stringify(target.effects)) changedEffects += 1;
  });

  return {
    from: { id: from.id, label: from.label, createdAt: from.createdAt, actor: from.actor || null },
    to: { id: to.id, label: to.label, createdAt: to.createdAt, actor: to.actor || null },
    summary: {
      chapterDelta: toProject.chapters.length - fromProject.chapters.length,
      nodeDelta: toNodes.length - fromNodes.length,
      addedNodes: [...toKeys].filter(key => !fromKeys.has(key)).length,
      removedNodes: [...fromKeys].filter(key => !toKeys.has(key)).length,
      changedText,
      changedChoices,
      changedEffects
    }
  };
}

function flattenNodes(project) {
  return project.chapters.flatMap(chapter =>
    chapter.nodes.map(node => ({
      key: `${chapter.id}:${node.id}`,
      text: node.text,
      effects: node.effects || {},
      choices: node.choices || []
    }))
  );
}

function projectDir(projectId) {
  return path.join(PROJECTS_DIR, projectId);
}

function normalizeOpenAiUrl(baseUrl) {
  const cleaned = String(baseUrl).replace(/\/+$/, "");
  return cleaned.endsWith("/chat/completions") ? cleaned : `${cleaned}/chat/completions`;
}

function normalizeAnthropicUrl(baseUrl) {
  const cleaned = String(baseUrl).replace(/\/+$/, "");
  if (cleaned.endsWith("/messages")) return cleaned;
  if (cleaned.endsWith("/v1")) return `${cleaned}/messages`;
  return `${cleaned}/v1/messages`;
}

function generateBootstrapPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored?.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) writeJson(filePath, defaultValue);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, "_").replace(/^_+|_+$/g, "") || "item";
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => raw += chunk);
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
