const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3030;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data_store");
const PROJECTS_DIR = path.join(DATA_DIR, "projects");

ensureDir(PROJECTS_DIR);

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
  console.log(`MindWeaver server running at http://localhost:${PORT}`);
});

async function handleApi(req, res, url) {
  const method = req.method.toUpperCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && url.pathname === "/api/projects") {
    sendJson(res, 200, { projects: listProjects() });
    return;
  }

  if (method === "POST" && url.pathname === "/api/projects") {
    const body = await readJsonBody(req);
    const project = createProject(body?.title || "未命名项目");
    writeProject(project, "initial");
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
        updatedAt: new Date().toISOString()
      });
      writeProject(project, "autosave");
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
      const version = createVersion(projectId, project, body?.label || "manual");
      sendJson(res, 201, { version });
      return;
    }

    if (method === "POST" && parts[3] === "restore" && parts.length === 4) {
      const body = await readJsonBody(req);
      const version = readVersion(projectId, body?.versionId);
      const project = normalizeProject({
        ...version.snapshot,
        id: projectId,
        updatedAt: new Date().toISOString()
      });
      writeProject(project, `restore-${body?.versionId || "unknown"}`);
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
  if (req.method !== "GET" && req.method !== "HEAD") {
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

function createProject(title) {
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
    provider: { kind: "openai", baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4.1-mini" },
    metrics: [
      { id: "stress", label: "压力", min: 0, max: 100, initial: 48, color: "#a33c2f" },
      { id: "clarity", label: "清晰度", min: 0, max: 100, initial: 36, color: "#587164" },
      { id: "trust", label: "信任", min: 0, max: 100, initial: 42, color: "#b18b54" }
    ],
    derivedFormulas: "balance = clarity - stress",
    chapters: [createChapter("第一章：新章节")],
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

function createChapter(title) {
  return {
    id: `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    slug: slugify(title),
    notes: "",
    nodes: [
      {
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
      }
    ]
  };
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
    provider: {
      kind: project.provider?.kind || "openai",
      baseUrl: project.provider?.baseUrl || "https://api.openai.com/v1",
      apiKey: project.provider?.apiKey || "",
      model: project.provider?.model || "gpt-4.1-mini"
    },
    metrics: Array.isArray(project.metrics) ? project.metrics : [],
    derivedFormulas: project.derivedFormulas || "",
    chapters: Array.isArray(project.chapters) && project.chapters.length ? project.chapters.map(normalizeChapter) : [createChapter("第一章：新章节")],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString()
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
    const pathName = `data/dialogue/${safeProject}/dlg_${safeProject}_${safeChapter}_v1.json`;
    return {
      path: pathName,
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
        createdAt: project.createdAt
      };
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function readProject(projectId) {
  const filePath = path.join(projectDir(projectId), "project.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return normalizeProject(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function writeProject(project, reason) {
  const dir = projectDir(project.id);
  ensureDir(dir);
  ensureDir(path.join(dir, "versions"));
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(normalizeProject(project), null, 2), "utf8");
  createVersion(project.id, project, reason);
}

function createVersion(projectId, snapshot, label) {
  const versionId = `${Date.now()}_${slugify(label || "version")}`;
  const payload = {
    id: versionId,
    label: label || "version",
    createdAt: new Date().toISOString(),
    snapshot: normalizeProject(snapshot)
  };
  ensureDir(path.join(projectDir(projectId), "versions"));
  fs.writeFileSync(path.join(projectDir(projectId), "versions", `${versionId}.json`), JSON.stringify(payload, null, 2), "utf8");
  return { id: payload.id, label: payload.label, createdAt: payload.createdAt };
}

function listVersions(projectId) {
  const dir = path.join(projectDir(projectId), "versions");
  ensureDir(dir);
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(".json"))
    .map(name => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")))
    .map(version => ({ id: version.id, label: version.label, createdAt: version.createdAt }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function readVersion(projectId, versionId) {
  if (!versionId) throw new Error("Missing versionId");
  const filePath = path.join(projectDir(projectId), "versions", `${versionId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Version not found: ${versionId}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function projectDir(projectId) {
  return path.join(PROJECTS_DIR, projectId);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "item";
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
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
