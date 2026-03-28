const LOCAL_KEY = "mindweaver-dialogue-studio-v2";
const AUTH_TOKEN_KEY = "mindweaver-auth-token";
const API_BASE = "/api";

const PRESETS = {
  cbt_training: {
    label: "CBT 训练回路",
    systemPrompt: "你是对话游戏策划与心理训练内容编辑。输出必须是结构化 JSON，对话要克制、具体、可交互，避免说教。优先生成有限状态收束结构，而不是指数级分支树。节点要服务训练目标：区分事实、想法、情绪和推断。",
    brief: "生成一段 6 到 8 个节点的训练型对话，包含误判、精灵提示、纠偏和一个收束结尾。"
  },
  family_conflict: {
    label: "家庭冲突章节",
    systemPrompt: "你在设计家庭冲突场景的剧情对话。情绪要真实但不过度刺激。每个节点兼顾训练目的和叙事推进，优先使用观察、感受、需求表达。",
    brief: "生成第一章家庭客厅冲突对话，主角在父母争执中学习把推断和事实分开。"
  },
  tutorial_branch: {
    label: "新手教学分支",
    systemPrompt: "你在写游戏教学分支。文案应短、清楚、可执行。每条分支反馈玩家行为，并一步一步引导上手。",
    brief: "设计一段 2 分钟内完成的新手引导对话，包含一次错误后回正。"
  },
  side_quest: {
    label: "支线角色任务",
    systemPrompt: "你在设计可复用的支线任务对话。节点之间要有轻量分歧，但结果收束到少数结局。突出角色个性与可回放性。",
    brief: "围绕同学误会事件设计一个带有信任值变化的支线对话。"
  }
};

const ROLE_TYPES = {
  protagonist: "主角",
  npc: "NPC",
  narrator: "旁白",
  spirit: "精灵",
  mask: "人格面具"
};

const DEFAULT_METRICS = [
  { id: "stress", label: "压力", min: 0, max: 100, initial: 48, color: "#a33c2f" },
  { id: "clarity", label: "清晰度", min: 0, max: 100, initial: 36, color: "#587164" },
  { id: "trust", label: "信任", min: 0, max: 100, initial: 42, color: "#b18b54" }
];

const SAMPLE_PROJECT = {
  id: "sample_local",
  title: "第一章：家里的风暴",
  projectGoal: "让玩家在家庭冲突里练习区分事实与想法",
  worldNotes: "场景为家庭客厅。母亲和父亲刚发生争执，精灵只有主角能看见，会在关键节点提示。",
  worldBook: "世界规则：家庭客厅冲突场景；精灵只有主角能看见；旁白只写可观察到的环境与动作；人格面具用于主角内在自动想法。",
  characterBook: "人物关系：母亲焦躁但并非恶意；精灵负责提醒而不是替玩家做决定；人格面具会放大风险感但不直接改变外部对话。",
  plotBrief: "晚餐前的家庭冲突升级，主角需要从情绪裹挟里退一步，重新组织表达。",
  characters: [
    { id: "char_protagonist", name: "林澈", roleType: "protagonist", narrativeRole: "高一学生，冲突中的观察者", traits: "敏感，习惯先猜别人的态度，遇压会退缩", goal: "先稳住局面，再尝试表达自己的感受", context: "主视角角色，玩家主要代入对象。" },
    { id: "char_mother", name: "母亲", roleType: "npc", narrativeRole: "家庭冲突中的施压方", traits: "焦躁、委屈、说话容易带判断", goal: "希望家里的事被认真对待", context: "容易把失望直接说成态度判断。" },
    { id: "char_spirit", name: "精灵", roleType: "spirit", narrativeRole: "训练引导者", traits: "克制、明确、不说教", goal: "帮助主角区分事实、想法和情绪", context: "只被主角看见，负责轻量纠偏。" },
    { id: "char_narrator", name: "旁白", roleType: "narrator", narrativeRole: "环境与动作说明", traits: "客观、克制、不解释内心", goal: "提供场景信息", context: "不直接替角色做心理判断。" },
    { id: "char_mask", name: "内心面具", roleType: "mask", narrativeRole: "主角内在自我攻击/防御化声音", traits: "尖锐、放大风险、像自动念头", goal: "保护主角不再受伤", context: "用于内心独白或自动化想法。" }
  ],
  protagonist: {
    name: "林澈",
    role: "高一学生，冲突中的观察者",
    traits: "敏感，习惯先猜别人的态度，遇压会退缩",
    goal: "先稳住局面，再尝试表达自己的感受"
  },
  preset: "cbt_training",
  systemPrompt: PRESETS.cbt_training.systemPrompt,
  generationBrief: PRESETS.cbt_training.brief,
  provider: { kind: "openai", baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4.1-mini" },
  metrics: structuredClone(DEFAULT_METRICS),
  derivedFormulas: "balance = clarity - stress\nreadiness = trust + clarity - stress / 2",
  chapters: [
    {
      id: "ch01",
      title: "第一章：家里的风暴",
      slug: "ch01_home_storm",
      notes: "第一章训练目标：在高压家庭冲突中拆分事实、想法和需求。",
      chapterBook: "本章必须从误判进入，再由精灵提示，最后回到主角决定是否重构表达。负向结局保留，但不能喧宾夺主。",
      nodes: [
        {
          id: "n1",
          title: "晚餐前的空气",
          characterId: "char_mother",
          speakerRoleType: "npc",
          speaker: "母亲",
          kind: "start",
          text: "你爸刚才又把答应的事忘了。你看，他根本就不在乎这个家。",
          tags: ["conflict", "thought"],
          notes: "用明显的推断开场。",
          position: { x: 64, y: 90 },
          effects: { stress: 8, clarity: -2 },
          choices: [
            { id: "c1", label: "先顺着母亲说：他确实不在乎", targetId: "n2", intent: "附和", note: "进入误判路线", effects: { stress: 5, trust: -2 } },
            { id: "c2", label: "先问：具体忘了哪件事？", targetId: "n3", intent: "求证", note: "进入求证路线", effects: { clarity: 6, trust: 3 } }
          ]
        },
        {
          id: "n2",
          title: "精灵打断",
          characterId: "char_spirit",
          speakerRoleType: "spirit",
          speaker: "精灵",
          kind: "training",
          text: "等等，'他根本不在乎' 是能直接看到的事实，还是你们根据情绪做出的推断？",
          tags: ["cbt", "correction"],
          notes: "训练节点。",
          position: { x: 380, y: 60 },
          effects: { clarity: 8, stress: -3 },
          choices: [{ id: "c3", label: "承认这是推断，再回到具体事件", targetId: "n3", intent: "纠偏", note: "", effects: { clarity: 8 } }]
        },
        {
          id: "n3",
          title: "回到可验证信息",
          characterId: "char_protagonist",
          speakerRoleType: "protagonist",
          speaker: "主角",
          kind: "dialogue",
          text: "我先确认一下，今天具体发生了什么？是约好的买药忘了，还是别的事情？",
          tags: ["fact", "de-escalation"],
          notes: "把训练目标转成自然表达。",
          position: { x: 378, y: 238 },
          effects: { stress: -6, clarity: 7, trust: 2 },
          choices: [{ id: "c4", label: "母亲说：是买药忘了", targetId: "n4", intent: "事实展开", note: "", effects: { clarity: 4 } }]
        },
        {
          id: "n4",
          title: "第二次分辨",
          characterId: "char_spirit",
          speakerRoleType: "spirit",
          speaker: "精灵",
          kind: "reflection",
          text: "很好。'忘了买药' 是事实，'他不在乎' 是想法。下一步，你可以怎么表达自己，而不是替别人下结论？",
          tags: ["reflection", "cbt"],
          notes: "反思节点。",
          position: { x: 710, y: 140 },
          effects: { clarity: 10, stress: -4 },
          choices: [
            { id: "c5", label: "说出观察 + 感受 + 需求", targetId: "n5", intent: "重构表达", note: "", effects: { trust: 8, stress: -6 } },
            { id: "c6", label: "继续评价父亲态度", targetId: "n6", intent: "回到指责", note: "保留一个低质量结局", effects: { stress: 8, trust: -4 } }
          ]
        },
        {
          id: "n5",
          title: "关系缓和",
          characterId: "char_protagonist",
          speakerRoleType: "protagonist",
          speaker: "主角",
          kind: "ending",
          text: "今天忘了买药这件事让我很紧张，我需要的是先把药的问题解决，而不是继续猜彼此的态度。",
          tags: ["ending", "good"],
          notes: "正向收束。",
          position: { x: 1042, y: 70 },
          effects: { stress: -12, clarity: 10, trust: 12 },
          choices: []
        },
        {
          id: "n6",
          title: "冲突升级",
          characterId: "char_mother",
          speakerRoleType: "npc",
          speaker: "母亲",
          kind: "ending",
          text: "你看，连你也只会替他说话。算了，没人会真的理解我。",
          tags: ["ending", "bad"],
          notes: "负向收束。",
          position: { x: 1045, y: 250 },
          effects: { stress: 10, trust: -10 },
          choices: []
        }
      ]
    }
  ]
};

const state = {
  backendOnline: false,
  projects: [],
  versions: [],
  invites: [],
  project: loadLocalProject(),
  selectedChapterId: null,
  selectedNodeId: null,
  selectedCharacterId: null,
  authToken: localStorage.getItem(AUTH_TOKEN_KEY) || "",
  currentUser: null,
  aiConfig: { kind: "openai", baseUrl: "", model: "", hasApiKey: false, apiKeyMasked: "", apiKeyInput: "", updatedAt: null, updatedBy: null },
  versionCompare: null,
  logicAudit: null,
  nodeAiResult: "",
  activeGlobalTab: "prompt",
  activeEditorTab: "chapter-node",
  zoom: 1,
  exportMode: "project"
};

const els = {
  backendStatus: document.getElementById("backend-status"),
  authStatus: document.getElementById("auth-status"),
  authUserSummary: document.getElementById("auth-user-summary"),
  authUserName: document.getElementById("auth-user-name"),
  loginLink: document.getElementById("login-link"),
  invitePanel: document.getElementById("invite-panel"),
  inviteList: document.getElementById("invite-list"),
  projectList: document.getElementById("project-list"),
  chapterList: document.getElementById("chapter-list"),
  characterList: document.getElementById("character-list"),
  versionList: document.getElementById("version-list"),
  versionCompare: document.getElementById("version-compare"),
  projectTitle: document.getElementById("project-title"),
  projectGoal: document.getElementById("project-goal"),
  worldBook: document.getElementById("world-book"),
  characterBook: document.getElementById("character-book"),
  chapterBook: document.getElementById("chapter-book"),
  plotBrief: document.getElementById("plot-brief"),
  presetSelect: document.getElementById("preset-select"),
  systemPrompt: document.getElementById("system-prompt"),
  generationBrief: document.getElementById("generation-brief"),
  providerKind: document.getElementById("provider-kind"),
  apiBaseUrl: document.getElementById("api-base-url"),
  apiKey: document.getElementById("api-key"),
  modelName: document.getElementById("model-name"),
  chapterTitle: document.getElementById("chapter-title"),
  chapterNotes: document.getElementById("chapter-notes"),
  selectedNodeTitle: document.getElementById("selected-node-title"),
  nodeTitle: document.getElementById("node-title"),
  nodeCharacterId: document.getElementById("node-character-id"),
  nodeRoleType: document.getElementById("node-role-type"),
  nodeSpeaker: document.getElementById("node-speaker"),
  nodeKind: document.getElementById("node-kind"),
  nodeText: document.getElementById("node-text"),
  nodeTags: document.getElementById("node-tags"),
  nodeNotes: document.getElementById("node-notes"),
  nodeEffects: document.getElementById("node-effects"),
  choiceList: document.getElementById("choice-list"),
  metricList: document.getElementById("metric-list"),
  derivedFormulas: document.getElementById("derived-formulas"),
  graphViewport: document.getElementById("graph-viewport"),
  graphLayer: document.getElementById("graph-layer"),
  edgeLayer: document.getElementById("edge-layer"),
  simulationSummary: document.getElementById("simulation-summary"),
  simulationLog: document.getElementById("simulation-log"),
  exportPreview: document.getElementById("export-preview"),
  aiStatus: document.getElementById("ai-status"),
  aiAdminNote: document.getElementById("ai-admin-note"),
  logicAuditBrief: document.getElementById("logic-audit-brief"),
  logicAuditResult: document.getElementById("logic-audit-result"),
  nodeGenerateBrief: document.getElementById("node-generate-brief"),
  rewriteFollowingBrief: document.getElementById("rewrite-following-brief"),
  nodeAiResult: document.getElementById("node-ai-result"),
  statNodeCount: document.getElementById("stat-node-count"),
  statEdgeCount: document.getElementById("stat-edge-count"),
  statEndingCount: document.getElementById("stat-ending-count"),
  refineInstruction: document.getElementById("refine-instruction"),
  nodeTemplate: document.getElementById("graph-node-template"),
  choiceTemplate: document.getElementById("choice-item-template")
};

const interaction = {
  panning: null,
  edgeDrag: null
};

bootstrap();

async function bootstrap() {
  if (!state.authToken) {
    window.location.href = "/login";
    return;
  }
  populatePresetOptions();
  bindProjectFields();
  bindActions();
  bindTabs();
  ensureSelection();
  renderAll();
  await syncBackendState();
}

function bindTabs() {
  document.querySelectorAll("[data-tab-group][data-tab-target]").forEach(button => {
    button.addEventListener("click", () => {
      const group = button.dataset.tabGroup;
      const target = button.dataset.tabTarget;
      if (group === "global") state.activeGlobalTab = target;
      if (group === "editor") state.activeEditorTab = target;
      renderTabs();
    });
  });
}

function loadLocalProject() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? normalizeProject(JSON.parse(raw)) : normalizeProject(structuredClone(SAMPLE_PROJECT));
  } catch {
    return normalizeProject(structuredClone(SAMPLE_PROJECT));
  }
}

function saveLocalDraft() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state.project));
}

function normalizeProject(project) {
  const metrics = Array.isArray(project.metrics) && project.metrics.length ? project.metrics : structuredClone(DEFAULT_METRICS);
  const characters = normalizeCharacters(project);
  const protagonist = getPrimaryCharacter(characters, "protagonist");
  return {
    id: project.id || `local_${Date.now().toString(36)}`,
    title: project.title || project.projectTitle || "未命名项目",
    projectGoal: project.projectGoal || "",
    worldNotes: project.worldNotes || project.worldBook || "",
    worldBook: project.worldBook || project.worldNotes || "",
    characterBook: project.characterBook || "",
    plotBrief: project.plotBrief || "",
    characters,
    protagonist: protagonist ? {
      name: protagonist.name,
      role: protagonist.narrativeRole,
      traits: protagonist.traits,
      goal: protagonist.goal
    } : { name: "", role: "", traits: "", goal: "" },
    preset: project.preset || "cbt_training",
    systemPrompt: project.systemPrompt || PRESETS.cbt_training.systemPrompt,
    generationBrief: project.generationBrief || PRESETS.cbt_training.brief,
    provider: {
      kind: project.provider?.kind || "openai",
      baseUrl: project.provider?.baseUrl || "https://api.openai.com/v1",
      apiKey: project.provider?.apiKey || "",
      model: project.provider?.model || "gpt-4.1-mini"
    },
    metrics,
    derivedFormulas: project.derivedFormulas || "",
    chapters: Array.isArray(project.chapters) && project.chapters.length ? project.chapters.map(chapter => normalizeChapter(chapter, metrics, characters)) : [makeChapter("第一章：新章节", characters)],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString()
  };
}

function normalizeCharacters(project) {
  const fromProject = Array.isArray(project.characters) && project.characters.length
    ? project.characters
    : buildCharactersFromLegacyProject(project);
  const characters = fromProject.map((character, index) => normalizeCharacter(character, index));
  const narrator = getPrimaryCharacter(characters, "narrator");
  if (!narrator) characters.push(normalizeCharacter({ roleType: "narrator", name: "旁白" }, characters.length));
  return characters;
}

function buildCharactersFromLegacyProject(project) {
  const legacy = [];
  if (project.protagonist?.name || project.protagonist?.role || project.protagonist?.traits || project.protagonist?.goal) {
    legacy.push({
      id: "char_protagonist",
      name: project.protagonist?.name || "主角",
      roleType: "protagonist",
      narrativeRole: project.protagonist?.role || "",
      traits: project.protagonist?.traits || "",
      goal: project.protagonist?.goal || "",
      context: ""
    });
  }
  const seen = new Set(legacy.map(item => item.name));
  (project.chapters || []).forEach(chapter => {
    (chapter.nodes || []).forEach(node => {
      const name = String(node.speaker || "").trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      legacy.push({
        id: `char_${slugify(name) || legacy.length + 1}`,
        name,
        roleType: inferRoleTypeFromSpeaker(name),
        narrativeRole: "",
        traits: "",
        goal: "",
        context: ""
      });
    });
  });
  return legacy.length ? legacy : [normalizeCharacter({ name: "主角", roleType: "protagonist" }, 0)];
}

function normalizeCharacter(character, index = 0) {
  return {
    id: character.id || `char_${Date.now().toString(36)}_${index + 1}`,
    name: character.name || defaultCharacterName(character.roleType),
    roleType: normalizeRoleType(character.roleType),
    narrativeRole: character.narrativeRole || character.role || "",
    traits: character.traits || "",
    goal: character.goal || "",
    context: character.context || character.notes || ""
  };
}

function normalizeChapter(chapter, metrics = DEFAULT_METRICS, characters = currentProject?.()?.characters || []) {
  return {
    id: chapter.id || `ch_${Date.now().toString(36)}`,
    title: chapter.title || "未命名章节",
    slug: chapter.slug || slugify(chapter.title || "chapter"),
    notes: chapter.notes || "",
    chapterBook: chapter.chapterBook || chapter.notes || "",
    nodes: Array.isArray(chapter.nodes) && chapter.nodes.length ? chapter.nodes.map((node, index) => normalizeNode(node, index, metrics, characters)) : [makeNode("n1", "开场", "旁白", "start", characters)]
  };
}

function normalizeNode(node, index = 0, metrics = currentProject?.()?.metrics || DEFAULT_METRICS, characters = currentProject?.()?.characters || []) {
  const nodeEffects = normalizeEffects(
    node.effects ??
    node.metric_effects ??
    node.metrics ??
    node.deltas ??
    node.effect_text ??
    node.notes,
    metrics
  );
  const speakerRoleType = normalizeRoleType(node.speakerRoleType || node.speaker_role_type || inferRoleTypeFromSpeaker(node.speaker));
  const matchedCharacter = findCharacterById(node.characterId || node.character_id, characters) || findCharacterByName(node.speaker, characters);
  const characterId = matchedCharacter?.id || node.characterId || node.character_id || "";
  const speaker = matchedCharacter?.name || node.speaker || defaultCharacterName(speakerRoleType);
  return {
    id: node.id || `n${index + 1}`,
    title: node.title || `节点 ${index + 1}`,
    characterId,
    speakerRoleType,
    speaker,
    kind: ["start", "dialogue", "training", "reflection", "ending"].includes(node.kind || node.type) ? (node.kind || node.type) : "dialogue",
    text: node.text || "",
    tags: Array.isArray(node.tags) ? node.tags : splitTags(node.tags || ""),
    notes: node.notes || "",
    position: node.position || node.editor_position || { x: 64 + index * 240, y: 96 + (index % 2) * 160 },
    effects: nodeEffects,
    choices: Array.isArray(node.choices) ? node.choices.map((choice, idx) => ({
      id: choice.id || `c_${index + 1}_${idx + 1}`,
      label: choice.label || choice.text || `选项 ${idx + 1}`,
      targetId: choice.targetId || choice.target || "",
      intent: choice.intent || "",
      note: choice.note || "",
      effects: normalizeEffects(
        choice.effects ??
        choice.metric_effects ??
        choice.metrics ??
        choice.deltas ??
        choice.note ??
        choice.text,
        metrics
      )
    })) : []
  };
}

function makeChapter(title, characters = currentProject?.()?.characters || []) {
  return normalizeChapter({ title, nodes: [makeNode("n1", "开场", "旁白", "start", characters)] }, currentProject?.()?.metrics || DEFAULT_METRICS, characters);
}

function makeNode(id, title, speaker, kind, characters = currentProject?.()?.characters || []) {
  const matchedCharacter = findCharacterByName(speaker, characters) || getPrimaryCharacter(characters, "protagonist") || getPrimaryCharacter(characters, "narrator");
  const roleType = matchedCharacter?.roleType || inferRoleTypeFromSpeaker(speaker);
  return {
    id,
    characterId: matchedCharacter?.id || "",
    speakerRoleType: roleType,
    title,
    speaker: matchedCharacter?.name || speaker,
    kind,
    text: "输入新节点文案",
    tags: ["draft"],
    notes: "",
    position: { x: 72, y: 96 },
    effects: {},
    choices: []
  };
}

function ensureSelection() {
  state.selectedChapterId = state.selectedChapterId && currentProject().chapters.some(ch => ch.id === state.selectedChapterId)
    ? state.selectedChapterId
    : currentProject().chapters[0]?.id ?? null;
  state.selectedNodeId = state.selectedNodeId && currentChapter()?.nodes.some(node => node.id === state.selectedNodeId)
    ? state.selectedNodeId
    : currentChapter()?.nodes[0]?.id ?? null;
  state.selectedCharacterId = state.selectedCharacterId && currentProject().characters.some(character => character.id === state.selectedCharacterId)
    ? state.selectedCharacterId
    : currentProject().characters[0]?.id ?? null;
}

function currentProject() {
  return state.project;
}

function currentChapter() {
  return currentProject().chapters.find(chapter => chapter.id === state.selectedChapterId) ?? null;
}

function currentNode() {
  return currentChapter()?.nodes.find(node => node.id === state.selectedNodeId) ?? null;
}

function currentCharacter() {
  return currentProject().characters.find(character => character.id === state.selectedCharacterId) ?? null;
}

function normalizeRoleType(value) {
  return Object.keys(ROLE_TYPES).includes(value) ? value : inferRoleTypeFromSpeaker(value);
}

function inferRoleTypeFromSpeaker(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "npc";
  if (/(主角|protagonist)/.test(raw)) return "protagonist";
  if (/(旁白|narrat)/.test(raw)) return "narrator";
  if (/(精灵|spirit|guide|fairy)/.test(raw)) return "spirit";
  if (/(人格面具|面具|内心|mask)/.test(raw)) return "mask";
  return "npc";
}

function defaultCharacterName(roleType) {
  return {
    protagonist: "主角",
    npc: "新角色",
    narrator: "旁白",
    spirit: "精灵",
    mask: "人格面具"
  }[normalizeRoleType(roleType)] || "新角色";
}

function getPrimaryCharacter(characters, roleType) {
  return (characters || []).find(character => character.roleType === roleType) ?? null;
}

function findCharacterById(id, characters = currentProject()?.characters || []) {
  return (characters || []).find(character => character.id === id) ?? null;
}

function findCharacterByName(name, characters = currentProject()?.characters || []) {
  const normalized = String(name || "").trim();
  if (!normalized) return null;
  return (characters || []).find(character => character.name === normalized) ?? null;
}

function roleTypeLabel(roleType) {
  return ROLE_TYPES[normalizeRoleType(roleType)] || ROLE_TYPES.npc;
}

function syncLegacyProtagonist() {
  const protagonist = getPrimaryCharacter(currentProject().characters, "protagonist");
  currentProject().protagonist = protagonist ? {
    name: protagonist.name,
    role: protagonist.narrativeRole,
    traits: protagonist.traits,
    goal: protagonist.goal
  } : { name: "", role: "", traits: "", goal: "" };
}

function syncNodeSpeakersFromCharacter(characterId) {
  const character = findCharacterById(characterId);
  if (!character) return;
  currentProject().chapters.forEach(chapter => {
    chapter.nodes.forEach(node => {
      if (node.characterId === characterId) {
        node.speaker = character.name;
        node.speakerRoleType = character.roleType;
      }
    });
  });
}

function populatePresetOptions() {
  els.presetSelect.innerHTML = "";
  Object.entries(PRESETS).forEach(([value, preset]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = preset.label;
    els.presetSelect.append(option);
  });
}

function bindProjectFields() {
  const bindings = [
    [els.projectTitle, value => currentProject().title = value],
    [els.projectGoal, value => currentProject().projectGoal = value],
    [els.worldBook, value => currentProject().worldBook = value],
    [els.characterBook, value => currentProject().characterBook = value],
    [els.plotBrief, value => currentProject().plotBrief = value],
    [els.systemPrompt, value => currentProject().systemPrompt = value],
    [els.generationBrief, value => currentProject().generationBrief = value],
    [els.providerKind, value => state.aiConfig.kind = value],
    [els.apiBaseUrl, value => state.aiConfig.baseUrl = value],
    [els.apiKey, value => state.aiConfig.apiKeyInput = value],
    [els.modelName, value => state.aiConfig.model = value],
    [els.derivedFormulas, value => currentProject().derivedFormulas = value],
    [els.chapterTitle, value => { const chapter = currentChapter(); if (chapter) { chapter.title = value; chapter.slug = slugify(value); } }],
    [els.chapterNotes, value => { const chapter = currentChapter(); if (chapter) chapter.notes = value; }],
    [els.chapterBook, value => { const chapter = currentChapter(); if (chapter) chapter.chapterBook = value; }]
  ];

  bindings.forEach(([element, setter]) => {
    element.addEventListener("input", event => {
      setter(event.target.value);
      persistDraftAndRender();
    });
  });

  els.presetSelect.addEventListener("change", event => {
    currentProject().preset = event.target.value;
    currentProject().systemPrompt = PRESETS[event.target.value]?.systemPrompt ?? PRESETS.cbt_training.systemPrompt;
    currentProject().generationBrief = PRESETS[event.target.value]?.brief ?? PRESETS.cbt_training.brief;
    persistDraftAndRender();
  });
}

function bindActions() {
  document.getElementById("logout-btn").addEventListener("click", logoutUser);
  document.getElementById("load-sample-btn").addEventListener("click", () => {
    state.project = normalizeProject(structuredClone(SAMPLE_PROJECT));
    ensureSelection();
    persistDraftAndRender();
  });
  document.getElementById("save-local-btn").addEventListener("click", () => {
    saveLocalDraft();
    flashStatus("草稿已保存");
  });
  document.getElementById("refresh-projects-btn").addEventListener("click", syncBackendState);
  document.getElementById("refresh-versions-btn").addEventListener("click", loadVersions);
  document.getElementById("refresh-invites-btn").addEventListener("click", loadInvites);
  document.getElementById("generate-invite-btn").addEventListener("click", generateInviteCodeFromAdmin);
  document.getElementById("new-project-btn").addEventListener("click", createProjectOnServer);
  document.getElementById("save-server-btn").addEventListener("click", saveProjectToServer);
  document.getElementById("create-version-btn").addEventListener("click", createVersionOnServer);
  document.getElementById("new-chapter-btn").addEventListener("click", () => {
    const title = `第${currentProject().chapters.length + 1}章：新章节`;
    const chapter = makeChapter(title, currentProject().characters);
    currentProject().chapters.push(chapter);
    state.selectedChapterId = chapter.id;
    state.selectedNodeId = chapter.nodes[0].id;
    persistDraftAndRender();
  });
  document.getElementById("new-character-btn").addEventListener("click", () => {
    const roleType = currentProject().characters.some(character => character.roleType === "protagonist") ? "npc" : "protagonist";
    const character = normalizeCharacter({ roleType, name: defaultCharacterName(roleType) }, currentProject().characters.length);
    currentProject().characters.push(character);
    state.selectedCharacterId = character.id;
    persistDraftAndRender();
  });
  document.getElementById("reset-system-prompt-btn").addEventListener("click", () => {
    currentProject().systemPrompt = PRESETS[currentProject().preset]?.systemPrompt ?? PRESETS.cbt_training.systemPrompt;
    persistDraftAndRender();
  });
  document.getElementById("auto-layout-btn").addEventListener("click", () => {
    autoLayoutChapter(currentChapter());
    persistDraftAndRender();
  });
  document.getElementById("export-json-btn").addEventListener("click", () => {
    downloadFile(`${slugify(currentProject().title)}.json`, JSON.stringify(exportProjectArtifact(), null, 2), "application/json");
  });
  document.getElementById("export-markdown-btn").addEventListener("click", () => {
    downloadFile(`${slugify(currentProject().title)}.md`, exportMarkdown(), "text/markdown");
  });
  document.getElementById("export-godot-btn").addEventListener("click", exportGodotPack);
  document.getElementById("copy-export-btn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.exportPreview.value);
    flashStatus("导出内容已复制");
  });
  document.getElementById("import-json-input").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.project = normalizeProject(JSON.parse(await file.text()));
      ensureSelection();
      persistDraftAndRender();
    } catch {
      flashStatus("导入失败：JSON 无法解析", true);
    }
    event.target.value = "";
  });
  document.getElementById("add-node-btn").addEventListener("click", addNode);
  document.getElementById("duplicate-node-btn").addEventListener("click", duplicateNode);
  document.getElementById("delete-node-btn").addEventListener("click", deleteNode);
  document.getElementById("new-choice-btn").addEventListener("click", addChoice);
  document.getElementById("smart-links-btn").addEventListener("click", smartLinkChoices);
  document.getElementById("reset-node-effects-btn").addEventListener("click", () => {
    const node = currentNode();
    if (!node) return;
    node.effects = {};
    persistDraftAndRender();
  });
  document.getElementById("add-metric-btn").addEventListener("click", () => {
    currentProject().metrics.push({ id: `metric_${currentProject().metrics.length + 1}`, label: `指标 ${currentProject().metrics.length + 1}`, min: 0, max: 100, initial: 0, color: "#6f7d8c" });
    persistDraftAndRender();
  });
  document.getElementById("simulate-btn").addEventListener("click", renderSimulation);
  document.getElementById("generate-graph-btn").addEventListener("click", generateWithAi);
  document.getElementById("audit-logic-btn").addEventListener("click", auditLogicWithAi);
  document.getElementById("generate-node-btn").addEventListener("click", generateNodeWithAi);
  document.getElementById("refine-node-btn").addEventListener("click", refineNodeWithAi);
  document.getElementById("rewrite-following-btn").addEventListener("click", rewriteFollowingWithAi);
  document.getElementById("zoom-in-btn").addEventListener("click", () => adjustZoom(0.1));
  document.getElementById("zoom-out-btn").addEventListener("click", () => adjustZoom(-0.1));
  document.getElementById("zoom-reset-btn").addEventListener("click", () => { state.zoom = 1; renderGraph(); });
  bindCanvasInteractions();
}

function persistDraftAndRender() {
  syncLegacyProtagonist();
  currentProject().updatedAt = new Date().toISOString();
  ensureSelection();
  saveLocalDraft();
  renderAll();
}

function renderAll() {
  renderBackendStatus();
  renderAuthState();
  renderProjectFields();
  renderTabs();
  renderInvitePanel();
  renderProjectList();
  renderChapterList();
  renderCharacterList();
  renderVersionList();
  renderMetrics();
  renderGraph();
  renderNodeEditor();
  renderSimulation();
  renderStats();
  renderExportPreview();
  renderAiStatus();
  renderAiPanels();
}

function renderTabs() {
  const activeMap = {
    global: state.activeGlobalTab,
    editor: state.activeEditorTab
  };

  document.querySelectorAll("[data-tab-group][data-tab-target]").forEach(button => {
    const active = activeMap[button.dataset.tabGroup] === button.dataset.tabTarget;
    button.classList.toggle("is-active", active);
  });

  document.querySelectorAll("[data-tab-group][data-tab-panel]").forEach(panel => {
    const active = activeMap[panel.dataset.tabGroup] === panel.dataset.tabPanel;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

function renderBackendStatus() {
  els.backendStatus.textContent = state.backendOnline ? "在线" : "离线";
  els.backendStatus.style.background = state.backendOnline ? "rgba(88,113,100,.15)" : "rgba(143,45,34,.12)";
  els.backendStatus.style.color = state.backendOnline ? "#587164" : "#8f2d22";
}

function renderAuthState() {
  const user = state.currentUser;
  els.authStatus.textContent = user ? `${user.role === "admin" ? "管理员" : "已登录"}` : "未登录";
  els.authStatus.style.background = user ? "rgba(88,113,100,.15)" : "rgba(143,45,34,.12)";
  els.authStatus.style.color = user ? "#587164" : "#8f2d22";
  els.authUserName.textContent = user ? `${user.displayName} (@${user.username})` : "未登录";
  els.authUserSummary.textContent = user
    ? `${user.role === "admin" ? "管理员可维护 AI 配置、生成邀请码与协作项目。" : "当前可编辑项目、版本和分支节点。"}`
    : "登录后可进入协作空间。";
  els.loginLink.hidden = Boolean(user);
  document.getElementById("logout-btn").disabled = !user;
}

function renderProjectFields() {
  els.projectTitle.value = currentProject().title;
  els.projectGoal.value = currentProject().projectGoal;
  els.worldBook.value = currentProject().worldBook || "";
  els.characterBook.value = currentProject().characterBook || "";
  els.plotBrief.value = currentProject().plotBrief || "";
  els.presetSelect.value = currentProject().preset;
  els.systemPrompt.value = currentProject().systemPrompt;
  els.generationBrief.value = currentProject().generationBrief;
  els.providerKind.value = state.aiConfig.kind || "openai";
  els.apiBaseUrl.value = state.aiConfig.baseUrl || "";
  els.apiKey.value = state.currentUser?.role === "admin" ? state.aiConfig.apiKeyInput || "" : "";
  els.apiKey.placeholder = state.currentUser?.role === "admin"
    ? (state.aiConfig.apiKeyMasked ? `已配置 ${state.aiConfig.apiKeyMasked}` : "输入新的 API Key")
    : "仅管理员可修改";
  els.modelName.value = state.aiConfig.model || "";
  els.derivedFormulas.value = currentProject().derivedFormulas;
  els.chapterTitle.value = currentChapter()?.title ?? "";
  els.chapterNotes.value = currentChapter()?.notes ?? "";
  els.chapterBook.value = currentChapter()?.chapterBook ?? "";
  const adminEditable = state.currentUser?.role === "admin";
  [els.providerKind, els.apiBaseUrl, els.apiKey, els.modelName].forEach(input => input.disabled = !adminEditable);
  els.aiAdminNote.textContent = adminEditable
    ? "管理员可在这里维护 AI 接口格式、Base URL、模型和密钥。保存后所有协作者共用。"
    : "AI 接口配置由管理员统一维护。普通用户可直接使用已配置模型发起生成。";
}

function renderInvitePanel() {
  const isAdmin = state.currentUser?.role === "admin";
  els.invitePanel.hidden = !isAdmin;
  if (!isAdmin) return;
  els.inviteList.innerHTML = "";
  if (!state.invites.length) {
    els.inviteList.innerHTML = `<div class="tip">暂无邀请码。生成后可发给新用户注册。</div>`;
    return;
  }
  state.invites.slice(0, 8).forEach(invite => {
    const item = document.createElement("article");
    item.className = "choice-item";
    item.innerHTML = `
      <strong>${escapeHtml(invite.code)}</strong>
      <p>${invite.usedAt ? "已使用" : "未使用"} · 创建于 ${formatDate(invite.createdAt)}</p>
      <p>${invite.usedBy && invite.usedBy !== "pending" ? `使用者：${escapeHtml(invite.usedBy)}` : "可直接复制给新用户"}</p>`;
    item.addEventListener("click", async () => {
      await navigator.clipboard.writeText(invite.code);
      flashStatus(`邀请码 ${invite.code} 已复制`);
    });
    els.inviteList.append(item);
  });
}

function renderProjectList() {
  els.projectList.innerHTML = "";
  if (!state.currentUser) {
    els.projectList.innerHTML = `<div class="tip">登录后可查看后端项目库。</div>`;
    return;
  }
  state.projects.forEach(project => {
    const article = document.createElement("article");
    article.className = "choice-item";
    if (project.id === currentProject().id) article.style.outline = "2px solid rgba(143,45,34,.22)";
    article.innerHTML = `
      <strong>${escapeHtml(project.title)}</strong>
      <p>${project.chapters} 章节 · ${formatDate(project.updatedAt)}</p>
      <p>最后修改：${escapeHtml(project.lastEditedBy?.displayName || project.lastEditedBy?.username || "未知")}</p>`;
    article.addEventListener("click", async () => {
      try {
        const result = await apiFetch(`/projects/${project.id}`);
        state.project = normalizeProject(result.project);
        ensureSelection();
        await loadVersions();
        persistDraftAndRender();
      } catch (error) {
        flashStatus(`加载项目失败：${error.message}`, true);
      }
    });
    els.projectList.append(article);
  });
}

function renderChapterList() {
  els.chapterList.innerHTML = "";
  currentProject().chapters.forEach(chapter => {
    const article = document.createElement("article");
    article.className = "choice-item";
    article.style.cursor = "pointer";
    article.innerHTML = `<strong>${escapeHtml(chapter.title)}</strong><p>${chapter.nodes.length} 节点 · ${chapter.slug}</p>`;
    if (chapter.id === state.selectedChapterId) article.style.outline = "2px solid rgba(143,45,34,.22)";
    article.addEventListener("click", () => {
      state.selectedChapterId = chapter.id;
      state.selectedNodeId = chapter.nodes[0]?.id ?? null;
      renderAll();
    });
    els.chapterList.append(article);
  });
}

function renderCharacterList() {
  els.characterList.innerHTML = "";
  currentProject().characters.forEach(character => {
    const article = document.createElement("article");
    article.className = `character-card${character.id === state.selectedCharacterId ? " is-active" : ""}`;
    article.innerHTML = `
      <div class="character-card-header">
        <strong>${escapeHtml(character.name || "未命名角色")}</strong>
        <span class="character-chip">${escapeHtml(roleTypeLabel(character.roleType))}</span>
      </div>
      <div class="character-grid">
        <label>角色名<input data-field="name" value="${escapeHtml(character.name)}"></label>
        <label>角色类型
          <select data-field="roleType">
            ${Object.entries(ROLE_TYPES).map(([value, label]) => `<option value="${value}" ${character.roleType === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>叙事定位<input data-field="narrativeRole" value="${escapeHtml(character.narrativeRole)}"></label>
        <label>目标<input data-field="goal" value="${escapeHtml(character.goal)}"></label>
        <label class="span-2">特质<textarea data-field="traits" rows="2">${escapeHtml(character.traits)}</textarea></label>
        <label class="span-2">上下文 / 限制<textarea data-field="context" rows="2">${escapeHtml(character.context)}</textarea></label>
      </div>
      <div class="button-row compact">
        <button class="ghost character-focus" type="button">用于当前节点</button>
        <button class="ghost character-delete" type="button">删除角色卡</button>
      </div>`;
    article.addEventListener("click", () => {
      state.selectedCharacterId = character.id;
      renderCharacterList();
    });
    article.querySelectorAll("[data-field]").forEach(input => {
      input.addEventListener("input", event => {
        const field = event.target.dataset.field;
        character[field] = field === "roleType" ? normalizeRoleType(event.target.value) : event.target.value;
        syncLegacyProtagonist();
        syncNodeSpeakersFromCharacter(character.id);
        persistDraftAndRender();
      });
    });
    article.querySelector(".character-focus").addEventListener("click", event => {
      event.stopPropagation();
      state.selectedCharacterId = character.id;
      const node = currentNode();
      if (node) {
        node.characterId = character.id;
        node.speakerRoleType = character.roleType;
        node.speaker = character.name;
      }
      persistDraftAndRender();
    });
    article.querySelector(".character-delete").addEventListener("click", event => {
      event.stopPropagation();
      if (currentProject().characters.length <= 1) {
        flashStatus("至少保留一张角色卡", true);
        return;
      }
      currentProject().characters = currentProject().characters.filter(item => item.id !== character.id);
      currentProject().chapters.forEach(chapter => {
        chapter.nodes.forEach(node => {
          if (node.characterId === character.id) {
            node.characterId = "";
          }
        });
      });
      syncLegacyProtagonist();
      ensureSelection();
      persistDraftAndRender();
    });
    els.characterList.append(article);
  });
}

function renderVersionList() {
  els.versionList.innerHTML = "";
  if (!state.currentUser) {
    els.versionList.innerHTML = `<div class="tip">登录后可查看版本历史与协作记录。</div>`;
    els.versionCompare.textContent = "选择版本后可查看不同用户修改版本的对照。";
    return;
  }
  if (!state.versions.length) {
    els.versionList.innerHTML = `<div class="tip">当前项目暂无后端版本记录。</div>`;
    els.versionCompare.textContent = "选择版本后可查看不同用户修改版本的对照。";
    return;
  }
  state.versions.slice(0, 8).forEach(version => {
    const article = document.createElement("article");
    article.className = "choice-item";
    article.style.cursor = "pointer";
    article.innerHTML = `
      <strong>${escapeHtml(version.label)}</strong>
      <p>${formatDate(version.createdAt)}</p>
      <p>修改人：${escapeHtml(version.actor?.displayName || version.actor?.username || "系统")}</p>`;
    const button = document.createElement("button");
    button.className = "ghost";
    button.textContent = "恢复";
    button.addEventListener("click", async event => {
      event.stopPropagation();
      try {
        const result = await apiFetch(`/projects/${currentProject().id}/restore`, {
          method: "POST",
          body: JSON.stringify({ versionId: version.id })
        });
        state.project = normalizeProject(result.project);
        ensureSelection();
        await loadVersions();
        persistDraftAndRender();
        flashStatus("已恢复到选中版本");
      } catch (error) {
        flashStatus(`恢复失败：${error.message}`, true);
      }
    });
    article.addEventListener("click", () => compareVersionWithPrevious(version.id));
    article.append(button);
    els.versionList.append(article);
  });
  if (!state.versionCompare && state.versions.length >= 2) {
    compareVersionWithPrevious(state.versions[0].id, true);
  } else {
    renderVersionCompare();
  }
}

function renderMetrics() {
  els.metricList.innerHTML = "";
  currentProject().metrics.forEach(metric => {
    const article = document.createElement("article");
    article.className = "metric-item";
    article.innerHTML = `
      <div class="section-heading">
        <div style="display:flex;align-items:center;gap:.55rem;">
          <span class="swatch" style="background:${metric.color}"></span>
          <strong>${metric.label}</strong>
        </div>
        <button class="text-button">删除</button>
      </div>
      <div class="metric-grid">
        <label>键名<input data-field="id" value="${escapeHtml(metric.id)}"></label>
        <label>显示名<input data-field="label" value="${escapeHtml(metric.label)}"></label>
        <label>最小值<input data-field="min" type="number" value="${metric.min}"></label>
        <label>最大值<input data-field="max" type="number" value="${metric.max}"></label>
        <label>初始值<input data-field="initial" type="number" value="${metric.initial}"></label>
        <label>颜色<input data-field="color" type="color" value="${metric.color}"></label>
      </div>`;
    article.querySelector(".text-button").addEventListener("click", () => {
      currentProject().metrics = currentProject().metrics.filter(item => item.id !== metric.id);
      persistDraftAndRender();
    });
    article.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", event => {
        const field = event.target.dataset.field;
        metric[field] = ["min", "max", "initial"].includes(field) ? Number(event.target.value) : event.target.value;
        persistDraftAndRender();
      });
    });
    els.metricList.append(article);
  });
}

function renderGraph() {
  const chapter = currentChapter();
  const nodes = chapter?.nodes ?? [];
  const width = Math.max(...nodes.map(node => node.position?.x ?? 0), 900) + 420;
  const height = Math.max(...nodes.map(node => node.position?.y ?? 0), 500) + 260;
  els.graphLayer.innerHTML = "";
  els.edgeLayer.innerHTML = "";
  els.graphLayer.style.width = `${width}px`;
  els.graphLayer.style.height = `${height}px`;
  els.graphLayer.style.transform = `scale(${state.zoom})`;
  els.edgeLayer.setAttribute("width", width * state.zoom);
  els.edgeLayer.setAttribute("height", height * state.zoom);
  els.edgeLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);

  nodes.forEach(node => {
    const fragment = els.nodeTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".graph-node");
    button.classList.add(kindClass(node.kind));
    if (node.id === state.selectedNodeId) button.classList.add("active");
    button.style.left = `${node.position?.x ?? 0}px`;
    button.style.top = `${node.position?.y ?? 0}px`;
    button.querySelector(".node-kind-badge").textContent = kindLabel(node.kind);
    button.querySelector(".node-name").textContent = node.title;
    button.querySelector(".node-speaker").textContent = `${node.speaker || "未命名说话者"} · ${roleTypeLabel(node.speakerRoleType)}`;
    button.querySelector(".node-excerpt").textContent = truncate(node.text, 84);
    button.querySelector(".node-choice-count").textContent = `${node.choices.length} 条选项`;
    button.querySelector(".node-tags").textContent = (node.tags ?? []).slice(0, 3).join(" · ");
    button.addEventListener("click", () => {
      state.selectedNodeId = node.id;
      renderAll();
    });
    makeDraggable(button, node);
    els.graphLayer.append(button);
  });

  nodes.forEach(node => {
    node.choices.forEach(choice => {
      const target = nodes.find(item => item.id === choice.targetId);
      if (!target) return;
      const startX = (node.position?.x ?? 0) + 240;
      const startY = (node.position?.y ?? 0) + 92;
      const endX = target.position?.x ?? 0;
      const endY = (target.position?.y ?? 0) + 92;
      const midX = (startX + endX) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "edge-path");
      path.setAttribute("d", `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
      els.edgeLayer.append(path);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "edge-label");
      label.setAttribute("x", String(midX));
      label.setAttribute("y", String((startY + endY) / 2 - 8));
      label.textContent = truncate(choice.label, 14);
      els.edgeLayer.append(label);

      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.setAttribute("class", "edge-handle");
      handle.setAttribute("cx", String(endX));
      handle.setAttribute("cy", String(endY));
      handle.setAttribute("r", "9");
      handle.dataset.nodeId = node.id;
      handle.dataset.choiceId = choice.id;
      handle.addEventListener("pointerdown", event => startEdgeDrag(event, node.id, choice.id));
      els.edgeLayer.append(handle);
    });
  });
}

function bindCanvasInteractions() {
  els.graphViewport.addEventListener("pointerdown", event => {
    if (event.target.closest(".graph-node") || event.target.closest(".edge-handle")) return;
    if (event.button !== 0) return;
    interaction.panning = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: els.graphViewport.scrollLeft,
      scrollTop: els.graphViewport.scrollTop
    };
    els.graphViewport.classList.add("is-panning");
  });

  window.addEventListener("pointermove", event => {
    if (!interaction.panning) return;
    const dx = event.clientX - interaction.panning.startX;
    const dy = event.clientY - interaction.panning.startY;
    els.graphViewport.scrollLeft = interaction.panning.scrollLeft - dx;
    els.graphViewport.scrollTop = interaction.panning.scrollTop - dy;
  });

  const stopPan = () => {
    if (!interaction.panning) return;
    interaction.panning = null;
    els.graphViewport.classList.remove("is-panning");
  };

  window.addEventListener("pointerup", stopPan);
  window.addEventListener("pointercancel", stopPan);

  window.addEventListener("pointermove", event => {
    if (!interaction.edgeDrag) return;
    updateEdgeDrag(event.clientX, event.clientY);
  });

  window.addEventListener("pointerup", event => {
    if (!interaction.edgeDrag) return;
    finishEdgeDrag(event.clientX, event.clientY);
  });
}

function renderNodeEditor() {
  const node = currentNode();
  els.selectedNodeTitle.textContent = node ? `${currentChapter()?.title ?? ""} / ${node.title}` : "未选择节点";
  if (!node) {
    [els.nodeTitle, els.nodeSpeaker, els.nodeText, els.nodeTags, els.nodeNotes].forEach(input => input.value = "");
    els.nodeCharacterId.innerHTML = "";
    els.choiceList.innerHTML = "";
    els.nodeEffects.innerHTML = "";
    return;
  }

  els.nodeCharacterId.innerHTML = `<option value="">不绑定角色卡</option>`;
  currentProject().characters.forEach(character => {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = `${character.name} · ${roleTypeLabel(character.roleType)}`;
    if (character.id === node.characterId) option.selected = true;
    els.nodeCharacterId.append(option);
  });
  els.nodeTitle.value = node.title;
  els.nodeCharacterId.value = node.characterId || "";
  els.nodeRoleType.value = normalizeRoleType(node.speakerRoleType);
  els.nodeSpeaker.value = node.speaker;
  els.nodeKind.value = node.kind;
  els.nodeText.value = node.text;
  els.nodeTags.value = node.tags.join(", ");
  els.nodeNotes.value = node.notes;
  bindNodeField(els.nodeTitle, value => node.title = value);
  bindNodeField(els.nodeCharacterId, value => {
    node.characterId = value;
    const character = findCharacterById(value);
    if (character) {
      node.speaker = character.name;
      node.speakerRoleType = character.roleType;
      els.nodeSpeaker.value = character.name;
      els.nodeRoleType.value = character.roleType;
    }
  }, "change");
  bindNodeField(els.nodeRoleType, value => node.speakerRoleType = normalizeRoleType(value), "change");
  bindNodeField(els.nodeSpeaker, value => node.speaker = value);
  bindNodeField(els.nodeKind, value => node.kind = value);
  bindNodeField(els.nodeText, value => node.text = value);
  bindNodeField(els.nodeTags, value => node.tags = splitTags(value));
  bindNodeField(els.nodeNotes, value => node.notes = value);

  els.nodeEffects.innerHTML = "";
  currentProject().metrics.forEach(metric => {
    const row = document.createElement("label");
    row.className = "effects-row";
    row.innerHTML = `<span>${metric.label}</span><input type="number" value="${node.effects?.[metric.id] ?? 0}">`;
    row.querySelector("input").addEventListener("input", event => {
      node.effects[metric.id] = Number(event.target.value);
      if (node.effects[metric.id] === 0) delete node.effects[metric.id];
      persistDraftAndRender();
    });
    els.nodeEffects.append(row);
  });
  renderChoiceEditor(node);
}

function bindNodeField(element, setter, eventName = "input") {
  element[`on${eventName}`] = event => {
    if (!currentNode()) return;
    setter(event.target.value);
    persistDraftAndRender();
  };
}

function renderChoiceEditor(node) {
  els.choiceList.innerHTML = "";
  node.choices.forEach(choice => {
    const fragment = els.choiceTemplate.content.cloneNode(true);
    const labelInput = fragment.querySelector(".choice-label");
    const targetSelect = fragment.querySelector(".choice-target");
    const intentInput = fragment.querySelector(".choice-intent");
    const noteInput = fragment.querySelector(".choice-note");
    const effectsRoot = fragment.querySelector(".choice-effects");
    labelInput.value = choice.label;
    intentInput.value = choice.intent ?? "";
    noteInput.value = choice.note ?? "";
    currentChapter().nodes.forEach(candidate => {
      const option = document.createElement("option");
      option.value = candidate.id;
      option.textContent = candidate.title;
      if (candidate.id === choice.targetId) option.selected = true;
      targetSelect.append(option);
    });
    labelInput.addEventListener("input", event => { choice.label = event.target.value; persistDraftAndRender(); });
    targetSelect.addEventListener("change", event => { choice.targetId = event.target.value; persistDraftAndRender(); });
    intentInput.addEventListener("input", event => { choice.intent = event.target.value; persistDraftAndRender(); });
    noteInput.addEventListener("input", event => { choice.note = event.target.value; persistDraftAndRender(); });
    currentProject().metrics.forEach(metric => {
      const row = document.createElement("label");
      row.className = "effects-row";
      row.innerHTML = `<span>${metric.label}</span><input type="number" value="${choice.effects?.[metric.id] ?? 0}">`;
      row.querySelector("input").addEventListener("input", event => {
        choice.effects[metric.id] = Number(event.target.value);
        if (choice.effects[metric.id] === 0) delete choice.effects[metric.id];
        persistDraftAndRender();
      });
      effectsRoot.append(row);
    });
    fragment.querySelector(".choice-delete").addEventListener("click", () => {
      node.choices = node.choices.filter(item => item.id !== choice.id);
      persistDraftAndRender();
    });
    els.choiceList.append(fragment);
  });
}

function renderSimulation() {
  const summary = simulateCurrentChapter();
  els.simulationSummary.innerHTML = "";
  Object.entries(summary.metrics).forEach(([key, value]) => {
    const metric = currentProject().metrics.find(item => item.id === key);
    const chip = document.createElement("span");
    chip.className = "metric-chip";
    chip.innerHTML = `<span class="swatch" style="background:${metric?.color ?? "#777"}"></span>${metric?.label ?? key}: <strong>${round(value)}</strong>`;
    els.simulationSummary.append(chip);
  });
  Object.entries(summary.derived).forEach(([key, value]) => {
    const chip = document.createElement("span");
    chip.className = "metric-chip";
    chip.textContent = `${key}: ${round(value)}`;
    els.simulationSummary.append(chip);
  });
  els.simulationLog.innerHTML = "";
  summary.steps.forEach(step => {
    const article = document.createElement("article");
    article.className = "simulation-step";
    article.innerHTML = `<strong>${step.title}</strong><p>${escapeHtml(step.summary)}</p>`;
    els.simulationLog.append(article);
  });
}

function simulateCurrentChapter() {
  const metrics = Object.fromEntries(currentProject().metrics.map(metric => [metric.id, Number(metric.initial) || 0]));
  const steps = [];
  const nodes = currentChapter()?.nodes ?? [];
  const visited = new Set();
  let current = nodes.find(node => node.kind === "start") ?? nodes[0];
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    applyDelta(metrics, current.effects);
    const chosen = chooseBestChoice(current);
    steps.push({ title: current.title, summary: `${current.speaker}: ${truncate(current.text, 100)}${chosen ? ` → 选择「${chosen.label}」` : ""}` });
    if (!chosen) break;
    applyDelta(metrics, chosen.effects);
    current = nodes.find(node => node.id === chosen.targetId);
  }
  return { metrics, derived: evaluateDerived(metrics), steps };
}

function chooseBestChoice(node) {
  if (!node.choices.length) return null;
  return [...node.choices].sort((a, b) => scoreChoice(b) - scoreChoice(a))[0];
}

function scoreChoice(choice) {
  return Object.values(choice.effects ?? {}).reduce((sum, value) => sum + Number(value), 0) + (String(choice.intent).includes("纠偏") ? 3 : 0);
}

function renderStats() {
  const nodes = currentChapter()?.nodes ?? [];
  els.statNodeCount.textContent = String(nodes.length);
  els.statEdgeCount.textContent = String(nodes.reduce((sum, node) => sum + node.choices.length, 0));
  els.statEndingCount.textContent = String(nodes.filter(node => node.kind === "ending" || node.choices.length === 0).length);
}

function renderExportPreview() {
  els.exportPreview.value = JSON.stringify(buildCurrentGodotPreview(), null, 2);
}

function renderAiStatus() {
  const ready = Boolean(state.currentUser && state.aiConfig.hasApiKey && state.aiConfig.baseUrl && state.aiConfig.model);
  els.aiStatus.textContent = !state.currentUser ? "请先登录" : ready ? "可调用 AI" : "待管理员配置";
  els.aiStatus.style.color = ready ? "#587164" : "#4b5754";
  els.aiStatus.style.background = ready ? "rgba(88,113,100,.15)" : "rgba(31,38,36,.08)";
}

function renderAiPanels() {
  if (state.logicAudit?.summary) {
    const issues = (state.logicAudit.issues || []).map(issue =>
      `<article class="ai-issue-card">
        <strong>${escapeHtml(issue.title || issue.scope || "检查项")}</strong>
        <p>${escapeHtml(issue.detail || "")}</p>
        <p>建议：${escapeHtml(issue.suggestion || "无")}</p>
      </article>`
    ).join("");
    els.logicAuditResult.innerHTML = `
      <strong>${escapeHtml(state.logicAudit.summary)}</strong>
      <div class="ai-issue-list">${issues || "<p>没有发现明显冲突。</p>"}</div>`;
  } else {
    els.logicAuditResult.textContent = "AI 会在这里检查：系统提示词层次是否完整、五类角色说话方式是否越界、主分支是否由主角做决定。";
  }

  els.nodeAiResult.textContent = state.nodeAiResult || "这里会显示当前节点生成、改写和后续节点调整的摘要。";
}

function renderVersionCompare() {
  if (!state.versionCompare) {
    els.versionCompare.textContent = "选择版本后可查看不同用户修改版本的对照。";
    return;
  }
  const { from, to, summary } = state.versionCompare;
  els.versionCompare.innerHTML = `
    <strong>${escapeHtml(to.label)}</strong>
    <p>对照 ${escapeHtml(from.label)} · ${escapeHtml(to.actor?.displayName || to.actor?.username || "系统")} vs ${escapeHtml(from.actor?.displayName || from.actor?.username || "系统")}</p>
    <p>章节变化 ${summary.chapterDelta >= 0 ? "+" : ""}${summary.chapterDelta} · 节点变化 ${summary.nodeDelta >= 0 ? "+" : ""}${summary.nodeDelta}</p>
    <p>新增节点 ${summary.addedNodes} · 删除节点 ${summary.removedNodes} · 改文案 ${summary.changedText} · 改分支 ${summary.changedChoices} · 改指标 ${summary.changedEffects}</p>`;
}

function canUseAiProxy() {
  return Boolean(state.backendOnline && state.currentUser && state.aiConfig.hasApiKey && state.aiConfig.baseUrl && state.aiConfig.model);
}

function ensureLoggedIn() {
  if (state.currentUser) return true;
  flashStatus("请先登录后再操作后端协作功能", true);
  return false;
}

async function loadCurrentUser() {
  try {
    const result = await apiFetch("/auth/me");
    state.currentUser = result.user;
  } catch {
    clearAuthState();
    window.location.href = "/login";
    throw new Error("登录状态已失效，请重新登录");
  }
}

function rolePromptRules() {
  return [
    "角色规则：",
    "1. protagonist（主角）只能说主角会说的话，主分支选择必须由主角节点承担；如果节点存在多个玩家可选项，该节点必须是 protagonist。",
    "2. npc 必须表现为对话对象，说话前后要有明显对话承接感，不能像旁白或系统说明。",
    "3. spirit 只能在玩家触发按键、或达到判定标准后出现，承担引导与提醒功能，但不能替玩家做决定，也不能直接改写外部对话走向。",
    "4. narrator 不能有对话感，只负责简洁说明背景、动作、环境和可观察信息。",
    "5. mask 通常与 spirit 同场出现，走主角内心对话线，表达自动想法、恐惧或自我辩护，不直接代替外部角色发言。"
  ].join("\n");
}

function enforceNarrativeRules(node) {
  const protagonist = getPrimaryCharacter(currentProject().characters, "protagonist");
  const matchedCharacter = findCharacterById(node.characterId) || findCharacterByName(node.speaker);
  const roleType = normalizeRoleType(node.speakerRoleType || matchedCharacter?.roleType);
  const next = structuredClone(node);

  next.speakerRoleType = roleType;

  if (matchedCharacter) {
    next.characterId = matchedCharacter.id;
    next.speaker = matchedCharacter.name;
  }

  if (next.choices?.length > 1 && roleType !== "protagonist") {
    next.speakerRoleType = "protagonist";
    next.characterId = protagonist?.id || next.characterId || "";
    next.speaker = protagonist?.name || "主角";
    next.notes = `${next.notes || ""}\n规则修正：多选主分支已强制归到主角节点。`.trim();
  }

  if (next.speakerRoleType === "spirit" && !["training", "reflection"].includes(next.kind)) {
    next.kind = "training";
  }

  if (next.speakerRoleType === "narrator") {
    next.characterId = getPrimaryCharacter(currentProject().characters, "narrator")?.id || next.characterId || "";
    next.speaker = getPrimaryCharacter(currentProject().characters, "narrator")?.name || next.speaker || "旁白";
  }

  if (next.speakerRoleType === "protagonist") {
    next.characterId = protagonist?.id || next.characterId || "";
    next.speaker = protagonist?.name || next.speaker || "主角";
  }

  return next;
}

function validateNarrativeRuleIssues(nodes = currentChapter()?.nodes || []) {
  const issues = [];
  nodes.forEach(node => {
    const roleType = normalizeRoleType(node.speakerRoleType);
    if (node.choices.length > 1 && roleType !== "protagonist") {
      issues.push({
        scope: node.title,
        severity: "high",
        title: "主分支不在主角节点",
        detail: "存在多选主分支，但当前节点不是主角类型。",
        suggestion: "把该节点改成主角节点，或把它改成自动过渡节点。"
      });
    }
    if (roleType === "spirit" && !["training", "reflection"].includes(node.kind)) {
      issues.push({
        scope: node.title,
        severity: "medium",
        title: "精灵节点类型不合适",
        detail: "精灵节点应主要用于训练/反思触发，而不是常规对话推进。",
        suggestion: "改为 training 或 reflection，并让它只承担提醒。"
      });
    }
    if (roleType === "narrator" && /[“”"'？?！!]/.test(node.text)) {
      issues.push({
        scope: node.title,
        severity: "medium",
        title: "旁白出现对话感",
        detail: "旁白文本里出现了明显对话或情绪化表达痕迹。",
        suggestion: "收回到背景、动作、环境和可观察信息。"
      });
    }
  });
  return issues;
}

async function loadAiConfig() {
  if (!state.currentUser) return;
  const endpoint = state.currentUser.role === "admin" ? "/admin/ai-config" : "/ai/config";
  const result = await apiFetch(endpoint);
  state.aiConfig = {
    kind: result.config.kind || "openai",
    baseUrl: result.config.baseUrl || "",
    model: result.config.model || "",
    hasApiKey: Boolean(result.config.hasApiKey),
    apiKeyMasked: result.config.apiKeyMasked || "",
    apiKeyInput: "",
    updatedAt: result.config.updatedAt || null,
    updatedBy: result.config.updatedBy || null
  };
}

async function saveAiConfigIfAdmin() {
  if (state.currentUser?.role !== "admin") return;
  const payload = {
    kind: state.aiConfig.kind,
    baseUrl: state.aiConfig.baseUrl,
    model: state.aiConfig.model
  };
  if (state.aiConfig.apiKeyInput?.trim()) payload.apiKey = state.aiConfig.apiKeyInput.trim();
  const result = await apiFetch("/admin/ai-config", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  state.aiConfig = {
    kind: result.config.kind || "openai",
    baseUrl: result.config.baseUrl || "",
    model: result.config.model || "",
    hasApiKey: Boolean(result.config.hasApiKey),
    apiKeyMasked: result.config.apiKeyMasked || "",
    apiKeyInput: "",
    updatedAt: result.config.updatedAt || null,
    updatedBy: result.config.updatedBy || null
  };
}

async function loginUser() {
  window.location.href = "/login";
}

async function registerUser() {
  window.location.href = "/login";
}

async function logoutUser() {
  try {
    if (state.authToken) {
      await apiFetch("/auth/logout", { method: "POST" });
    }
  } catch {
    // Ignore server logout failures and clear client state anyway.
  }
  clearAuthState();
  window.location.href = "/login";
}

function clearAuthState() {
  state.authToken = "";
  state.currentUser = null;
  state.projects = [];
  state.versions = [];
  state.invites = [];
  state.versionCompare = null;
  state.aiConfig = { kind: "openai", baseUrl: "", model: "", hasApiKey: false, apiKeyMasked: "", apiKeyInput: "", updatedAt: null, updatedBy: null };
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function compareVersionWithPrevious(versionId, rerender = true) {
  if (!state.currentUser || state.versions.length < 2) {
    state.versionCompare = null;
    if (rerender) renderVersionCompare();
    return;
  }
  const currentIndex = state.versions.findIndex(version => version.id === versionId);
  const compareIndex = currentIndex >= 0 && currentIndex < state.versions.length - 1 ? currentIndex + 1 : currentIndex - 1;
  const baseVersion = state.versions[compareIndex];
  const targetVersion = state.versions[currentIndex];
  if (!baseVersion || !targetVersion) {
    state.versionCompare = null;
    if (rerender) renderVersionCompare();
    return;
  }
  try {
    const result = await apiFetch(`/projects/${currentProject().id}/versions/compare?from=${encodeURIComponent(baseVersion.id)}&to=${encodeURIComponent(targetVersion.id)}`);
    state.versionCompare = result;
  } catch (error) {
    state.versionCompare = null;
    flashStatus(`版本对照失败：${error.message}`, true);
  }
  if (rerender) renderVersionCompare();
}

async function syncBackendState() {
  try {
    const result = await apiFetch("/health");
    state.backendOnline = Boolean(result.ok);
    try {
      if (state.authToken) {
        await loadCurrentUser();
      } else {
        state.currentUser = null;
      }
      if (state.currentUser) {
        await loadAiConfig();
        await loadInvites();
        const projects = await apiFetch("/projects");
        state.projects = projects.projects;
        await loadVersions();
      } else {
        state.projects = [];
        state.versions = [];
        state.invites = [];
        state.versionCompare = null;
        state.aiConfig = { kind: "openai", baseUrl: "", model: "", hasApiKey: false, apiKeyMasked: "", apiKeyInput: "", updatedAt: null, updatedBy: null };
      }
    } catch {
      state.currentUser = null;
      state.projects = [];
      state.versions = [];
      state.invites = [];
      state.versionCompare = null;
      state.aiConfig = { kind: "openai", baseUrl: "", model: "", hasApiKey: false, apiKeyMasked: "", apiKeyInput: "", updatedAt: null, updatedBy: null };
    }
  } catch {
    state.backendOnline = false;
    state.currentUser = null;
    state.projects = [];
    state.versions = [];
    state.invites = [];
    state.versionCompare = null;
  }
  renderAll();
}

async function loadVersions() {
  if (!state.backendOnline || !state.currentUser || !currentProject().id || currentProject().id === "sample_local") {
    state.versions = [];
    state.versionCompare = null;
    return;
  }
  try {
    const result = await apiFetch(`/projects/${currentProject().id}/versions`);
    state.versions = result.versions;
  } catch {
    state.versions = [];
  }
}

async function createProjectOnServer() {
  try {
    if (!ensureLoggedIn()) return;
    const title = `项目 ${new Date().toLocaleDateString("zh-CN")}`;
    const result = await apiFetch("/projects", { method: "POST", body: JSON.stringify({ title }) });
    state.project = normalizeProject(result.project);
    ensureSelection();
    await syncBackendState();
    flashStatus("已创建新项目");
  } catch (error) {
    flashStatus(`新建失败：${error.message}`, true);
  }
}

async function saveProjectToServer() {
  try {
    if (!state.backendOnline) {
      flashStatus("后端未启动，请先运行 npm start", true);
      return;
    }
    if (!ensureLoggedIn()) return;
    await saveAiConfigIfAdmin();
    const endpoint = state.projects.some(item => item.id === currentProject().id)
      ? `/projects/${currentProject().id}`
      : "/projects";
    const method = endpoint === "/projects" ? "POST" : "PUT";
    const body = endpoint === "/projects"
      ? JSON.stringify({ title: currentProject().title })
      : JSON.stringify(exportProjectData());
    const result = await apiFetch(endpoint, { method, body });
    if (endpoint === "/projects") {
      currentProject().id = result.project.id;
      await apiFetch(`/projects/${currentProject().id}`, { method: "PUT", body: JSON.stringify(exportProjectData()) });
    } else {
      state.project = normalizeProject(result.project);
    }
    await syncBackendState();
    flashStatus("项目已保存到后端");
  } catch (error) {
    flashStatus(`保存失败：${error.message}`, true);
  }
}

async function createVersionOnServer() {
  try {
    if (!ensureLoggedIn()) return;
    if (!state.backendOnline || !state.projects.some(item => item.id === currentProject().id)) {
      flashStatus("请先把项目保存到后端", true);
      return;
    }
    await apiFetch(`/projects/${currentProject().id}/versions`, {
      method: "POST",
      body: JSON.stringify({ label: `manual-${formatDate(new Date().toISOString(), true)}` })
    });
    await loadVersions();
    renderVersionList();
    flashStatus("版本已创建");
  } catch (error) {
    flashStatus(`创建版本失败：${error.message}`, true);
  }
}

async function exportGodotPack() {
  try {
    let exportPack;
    if (state.backendOnline && state.projects.some(item => item.id === currentProject().id)) {
      const result = await apiFetch(`/projects/${currentProject().id}/export/godot`);
      exportPack = result.export;
    } else {
      exportPack = buildGodotExportLocal();
    }
    downloadFile(`${slugify(currentProject().title)}_godot_manifest.json`, JSON.stringify(exportPack, null, 2), "application/json");
    exportPack.files.forEach(file => {
      downloadFile(file.path.split("/").pop(), JSON.stringify(file.content, null, 2), "application/json");
    });
    flashStatus("Godot 导出已生成");
  } catch (error) {
    flashStatus(`导出失败：${error.message}`, true);
  }
}

async function generateWithAi() {
  setBusy("generate-graph-btn", true);
  try {
    const graph = await requestGraphFromModel();
    const chapter = currentChapter();
    chapter.nodes = graph.nodes;
    autoLayoutChapter(chapter);
    state.selectedNodeId = chapter.nodes[0]?.id ?? null;
    persistDraftAndRender();
    flashStatus("已生成章节分支草案");
  } catch (error) {
    flashStatus(`生成失败：${error.message}`, true);
  } finally {
    setBusy("generate-graph-btn", false);
  }
}

async function auditLogicWithAi() {
  setBusy("audit-logic-btn", true);
  try {
    state.activeGlobalTab = "prompt";
    const result = await requestLogicAuditFromModel(els.logicAuditBrief.value.trim());
    state.logicAudit = result;
    renderAll();
    flashStatus("全局逻辑检查已完成");
  } catch (error) {
    flashStatus(`逻辑检查失败：${error.message}`, true);
  } finally {
    setBusy("audit-logic-btn", false);
  }
}

async function generateNodeWithAi() {
  const node = currentNode();
  if (!node) return;
  setBusy("generate-node-btn", true);
  try {
    const updated = await requestNodeGenerateFromModel(node, els.nodeGenerateBrief.value.trim());
    Object.assign(node, updated, { id: node.id, position: node.position });
    state.nodeAiResult = `已按“${node.speaker || "未命名角色"}”口吻生成当前节点，并保留当前分支结构。`;
    persistDraftAndRender();
    flashStatus("当前节点台词已生成");
  } catch (error) {
    flashStatus(`节点生成失败：${error.message}`, true);
  } finally {
    setBusy("generate-node-btn", false);
  }
}

async function refineNodeWithAi() {
  const node = currentNode();
  if (!node) return;
  setBusy("refine-node-btn", true);
  try {
    const updated = await requestNodeRefineFromModel(node, els.refineInstruction.value.trim());
    Object.assign(node, updated, { id: node.id, position: node.position });
    state.nodeAiResult = `已根据附加要求调整当前节点“${node.title}”。`;
    persistDraftAndRender();
    flashStatus("当前节点已调整");
  } catch (error) {
    flashStatus(`调整失败：${error.message}`, true);
  } finally {
    setBusy("refine-node-btn", false);
  }
}

async function rewriteFollowingWithAi() {
  const node = currentNode();
  if (!node) return;
  setBusy("rewrite-following-btn", true);
  try {
    const updatedNodes = await requestRewriteFollowingFromModel(node, els.rewriteFollowingBrief.value.trim());
    const nodeMap = new Map(currentChapter().nodes.map(item => [item.id, item]));
    updatedNodes.forEach(updated => {
      const target = nodeMap.get(updated.id);
      if (!target) return;
      Object.assign(target, updated, { id: target.id, position: target.position });
    });
    state.nodeAiResult = `已根据当前节点的新要求联动改写 ${updatedNodes.length} 个后续节点。`;
    persistDraftAndRender();
    flashStatus("后续相关节点已改写");
  } catch (error) {
    flashStatus(`后续改写失败：${error.message}`, true);
  } finally {
    setBusy("rewrite-following-btn", false);
  }
}

async function requestGraphFromModel() {
  if (!canUseAiProxy()) return fallbackGenerateGraph();
  try {
    const prompt =
      `${buildAiContextBlock()}\n情节描述：${currentProject().plotBrief || "无"}\n节点及后续描述：${currentProject().generationBrief || "无"}\n${rolePromptRules()}\n` +
      "要求：1. 所有节点都必须输出 speaker_role_type，可选 protagonist、npc、narrator、spirit、mask。2. 有明确角色卡时尽量输出 character_id。3. 主分支节点必须由 protagonist 承担；非主角节点如需跳转，只能做单出口过渡。4. spirit 出现必须像玩家触发后的提醒，不直接改写外部对话。5. narrator 只写背景、动作、状态，不带对话感。6. mask 用于内心对话线，通常与 spirit 相邻或呼应。\n" +
      "输出 JSON：{\"nodes\":[{id,title,character_id,speaker_role_type,speaker,kind,text,tags,notes,effects,choices:[{id,label,targetId,intent,note,effects}]}]}。";
    const data = await requestAiJson("/ai/generate-graph", currentProject().systemPrompt, prompt, 0.8);
    return normalizeGraphPayload(extractJson(extractAiText(data)));
  } catch {
    return fallbackGenerateGraph();
  }
}

async function requestNodeRefineFromModel(node, instruction) {
  if (!canUseAiProxy()) return fallbackRefineNode(node, instruction);
  try {
    const prompt =
      `${buildAiContextBlock()}\n${rolePromptRules()}\n当前节点：${JSON.stringify(node)}\n` +
      `调整要求：${instruction || "让节点更自然，同时保留训练目标。"}\n` +
      "要求：保持当前节点的 speaker_role_type 清晰有效；如果绑定了角色卡，speaker 应与角色卡一致；主分支选择不能从非主角节点发起。\n输出 JSON：{title,character_id,speaker_role_type,speaker,kind,text,tags,notes,effects,choices}";
    const data = await requestAiJson("/ai/refine-node", currentProject().systemPrompt, prompt, 0.7);
    return normalizeNodePayload(extractJson(extractAiText(data)));
  } catch {
    return fallbackRefineNode(node, instruction);
  }
}

async function requestLogicAuditFromModel(instruction) {
  if (!canUseAiProxy()) return fallbackLogicAudit(instruction);
  try {
    const prompt =
      `${buildAiContextBlock()}\n${rolePromptRules()}\n章节摘要：${summarizeCurrentChapterForAi()}\n` +
      `审查重点：${instruction || "检查人物语言是否和性格冲突，是否违背世界规则，是否偏离游戏整体设定。"}\n` +
      "输出 JSON：{summary,issues:[{scope,severity,title,detail,suggestion}]}。";
    const data = await requestAiJson("/ai/generate-graph", currentProject().systemPrompt, prompt, 0.4);
    return normalizeLogicAuditPayload(extractJson(extractAiText(data)));
  } catch {
    return fallbackLogicAudit(instruction);
  }
}

async function requestNodeGenerateFromModel(node, instruction) {
  if (!canUseAiProxy()) return fallbackGenerateNode(node, instruction);
  try {
    const prompt =
      `${buildAiContextBlock()}\n${rolePromptRules()}\n当前节点骨架：${JSON.stringify({
        id: node.id,
        character_id: node.characterId,
        speaker_role_type: node.speakerRoleType,
        title: node.title,
        speaker: node.speaker,
        kind: node.kind,
        tags: node.tags,
        notes: node.notes,
        effects: node.effects,
        choices: node.choices
      })}\n` +
      `情节描述：${currentProject().plotBrief || "无"}\n节点及后续描述：${instruction || "无"}\n` +
      "要求：如果 speaker_role_type 是 narrator，只写动作/环境/状态；如果是 spirit，要像玩家触发后的引导提示，不直接替玩家说话；如果是 protagonist、npc 或 mask，要贴合角色卡。输出 JSON：{title,character_id,speaker_role_type,speaker,kind,text,tags,notes,effects,choices}";
    const data = await requestAiJson("/ai/refine-node", currentProject().systemPrompt, prompt, 0.75);
    return normalizeNodePayload(extractJson(extractAiText(data)));
  } catch {
    return fallbackGenerateNode(node, instruction);
  }
}

async function requestRewriteFollowingFromModel(node, instruction) {
  const downstream = collectDownstreamNodes(node.id).map(item => ({
    id: item.id,
    character_id: item.characterId,
    speaker_role_type: item.speakerRoleType,
    title: item.title,
    speaker: item.speaker,
    kind: item.kind,
    text: item.text,
    tags: item.tags,
    notes: item.notes,
    effects: item.effects,
    choices: item.choices
  }));
  if (!downstream.length) return [];
  if (!canUseAiProxy()) return fallbackRewriteFollowing(downstream, instruction);
  try {
    const prompt =
      `${buildAiContextBlock()}\n${rolePromptRules()}\n触发节点：${JSON.stringify(node)}\n待联动改写节点：${JSON.stringify(downstream)}\n` +
      `联动改写要求：${instruction || "根据当前节点的新方向，联动收敛后续相关对话。"}\n` +
      "要求：保持节点 id 不变；按原路径语义改写；明确输出 speaker_role_type；不要删除 choices。输出 JSON：{nodes:[{id,title,character_id,speaker_role_type,speaker,kind,text,tags,notes,effects,choices}]}";
    const data = await requestAiJson("/ai/generate-graph", currentProject().systemPrompt, prompt, 0.72);
    const payload = extractJson(extractAiText(data));
    return (payload.nodes || []).map(item => normalizeNodePayload(item));
  } catch {
    return fallbackRewriteFollowing(downstream, instruction);
  }
}

async function requestAiJson(pathname, systemPrompt, userPrompt, temperature) {
  return apiFetch(pathname, {
    method: "POST",
    body: JSON.stringify({ systemPrompt, userPrompt, temperature })
  });
}

function extractAiText(data) {
  return data?.text ?? "";
}

function fallbackGenerateGraph() {
  const hero = getPrimaryCharacter(currentProject().characters, "protagonist")?.name || "主角";
  return normalizeGraphPayload({
    nodes: [
      { id: "n1", title: "触发场景", speaker: "NPC", speakerRoleType: "npc", kind: "start", text: `${hero}刚进入冲突现场，空气明显紧绷，第一句话带着判断和情绪。`, tags: ["draft", "conflict"], notes: "开场抛出问题。", effects: { stress: 6 }, choices: [
        { id: "c1", label: "先求证具体发生了什么", targetId: "n2", intent: "求证", note: "", effects: { clarity: 5 } },
        { id: "c2", label: "直接评价对方态度", targetId: "n3", intent: "指责", note: "", effects: { stress: 6 } }
      ] },
      { id: "n2", title: "事实浮现", speaker: hero, speakerRoleType: "protagonist", kind: "dialogue", text: "我先不下结论，你能告诉我今天具体发生了什么吗？", tags: ["fact"], notes: "", effects: { clarity: 6, stress: -3 }, choices: [
        { id: "c3", label: "让精灵帮助拆分事实与想法", targetId: "n4", intent: "训练", note: "", effects: { clarity: 6 } }
      ] },
      { id: "n3", title: "误判升级", speaker: "精灵", speakerRoleType: "spirit", kind: "training", text: "你刚才补上的是态度推断，不是你亲眼确认过的事实。", tags: ["correction"], notes: "", effects: { clarity: 8, stress: -2 }, choices: [
        { id: "c4", label: "回到具体事件", targetId: "n2", intent: "纠偏", note: "", effects: { clarity: 5 } }
      ] },
      { id: "n4", title: "重构表达", speaker: "精灵", speakerRoleType: "spirit", kind: "reflection", text: "如果你只说观察、感受和需求，你会怎么讲？", tags: ["reflection"], notes: "", effects: { clarity: 7, trust: 3 }, choices: [
        { id: "c5", label: "说出观察与需求", targetId: "n5", intent: "重构表达", note: "", effects: { trust: 8, stress: -5 } },
        { id: "c6", label: "继续控诉对方", targetId: "n6", intent: "指责", note: "", effects: { stress: 7, trust: -6 } }
      ] },
      { id: "n5", title: "温和收束", speaker: hero, speakerRoleType: "protagonist", kind: "ending", text: "我现在更想先解决眼前这件事，然后再谈彼此为什么会这么生气。", tags: ["ending", "good"], notes: "", effects: { clarity: 10, stress: -8, trust: 10 }, choices: [] },
      { id: "n6", title: "关系冻结", speaker: "NPC", speakerRoleType: "npc", kind: "ending", text: "如果现在只剩下指责，这段对话就没法继续了。", tags: ["ending", "bad"], notes: "", effects: { stress: 10, trust: -8 }, choices: [] }
    ]
  });
}

function fallbackLogicAudit(instruction) {
  const issues = validateNarrativeRuleIssues();
  currentChapter().nodes.forEach(node => {
    if ((node.speaker || "").includes("精灵") && !/(提示|纠偏|观察|事实|想法)/.test(node.text)) {
      issues.push({
        scope: node.title,
        severity: "medium",
        title: "精灵台词训练功能不足",
        detail: "精灵节点没有明显承担提示或纠偏职责。",
        suggestion: "让精灵更明确地区分事实、想法、情绪或下一步行动。"
      });
    }
    if ((node.speaker || "").includes("旁白") && /我觉得|她一定|他肯定/.test(node.text)) {
      issues.push({
        scope: node.title,
        severity: "medium",
        title: "旁白越界解释人物内心",
        detail: "旁白出现了主观结论，容易和人物台词边界混淆。",
        suggestion: "改成动作、表情、停顿或环境变化描述。"
      });
    }
  });
  return {
    summary: instruction ? `已按“${instruction}”做快速一致性检查，并核对五类角色说话规则。` : "已做快速一致性检查，并核对五类角色说话规则。",
    issues
  };
}

async function loadInvites() {
  if (state.currentUser?.role !== "admin") {
    state.invites = [];
    return;
  }
  try {
    const result = await apiFetch("/admin/invite-codes");
    state.invites = result.invites || [];
  } catch {
    state.invites = [];
  }
}

async function generateInviteCodeFromAdmin() {
  try {
    if (state.currentUser?.role !== "admin") return;
    const result = await apiFetch("/admin/invite-codes", { method: "POST" });
    state.invites.unshift(result.invite);
    renderInvitePanel();
    await navigator.clipboard.writeText(result.invite.code);
    flashStatus(`邀请码 ${result.invite.code} 已生成并复制`);
  } catch (error) {
    flashStatus(`生成邀请码失败：${error.message}`, true);
  }
}

function fallbackGenerateNode(node, instruction) {
  const updated = structuredClone(node);
  const speaker = normalizeRoleType(node.speakerRoleType);
  if (speaker === "narrator") {
    updated.text = "空气短暂地停住了，客厅里只有杯沿轻轻碰到桌面的声音。";
  } else if (speaker === "spirit") {
    updated.text = "先别急着替别人下结论。你能确认的，是刚刚发生的事，还是你脑子里自动冒出来的解释？";
  } else {
    updated.text = `${getPrimaryCharacter(currentProject().characters, "protagonist")?.name || "主角"}吸了一口气，先把话压慢了一点：“我想先弄清楚刚刚具体发生了什么。”`;
  }
  updated.notes = `${updated.notes || ""}\nAI生成：${instruction || "按世界规则和人物设定生成当前节点。"} `.trim();
  updated.tags = Array.from(new Set([...(updated.tags || []), "ai-generated"]));
  return updated;
}

function fallbackRefineNode(node, instruction) {
  const refined = structuredClone(node);
  const direction = instruction || "更自然，减少判断";
  refined.text = `${node.text.replace(/。?$/, "")}。${direction.includes("精灵") ? "精灵的提示更轻一些，但仍明确指出训练重点。" : "这句表达更具体，少一点下定义，多一点观察。"}`;
  refined.notes = `${node.notes ?? ""}\nAI调整：${direction}`.trim();
  refined.tags = Array.from(new Set([...(node.tags ?? []), "ai-refined"]));
  return refined;
}

function fallbackRewriteFollowing(nodes, instruction) {
  return nodes.map(node => {
    const updated = structuredClone(node);
    const speaker = normalizeRoleType(node.speakerRoleType);
    if (speaker === "narrator") {
      updated.text = `${updated.text.replace(/。?$/, "")}。场面因此比之前更收一点。`;
    } else if (speaker === "spirit") {
      updated.text = `${updated.text.replace(/。?$/, "")}。记得只提醒，不要替玩家下结论。`;
    } else {
      updated.text = `${updated.text.replace(/。?$/, "")}。这次表达比之前更克制，也更贴近人物本来的性格。`;
    }
    updated.notes = `${updated.notes || ""}\n后续联动改写：${instruction || "顺着当前节点方向统一语气。"} `.trim();
    return updated;
  });
}

function addNode() {
  const chapter = currentChapter();
  const id = createNodeId();
  const protagonist = getPrimaryCharacter(currentProject().characters, "protagonist");
  chapter.nodes.push({
    id,
    characterId: protagonist?.id || "",
    speakerRoleType: protagonist?.roleType || "protagonist",
    title: `新节点 ${chapter.nodes.length + 1}`,
    speaker: protagonist?.name || "主角",
    kind: "dialogue",
    text: "输入新节点文案",
    tags: ["draft"],
    notes: "",
    position: { x: 100 + chapter.nodes.length * 36, y: 120 + chapter.nodes.length * 28 },
    effects: {},
    choices: []
  });
  state.selectedNodeId = id;
  persistDraftAndRender();
}

function duplicateNode() {
  const node = currentNode();
  if (!node) return;
  const clone = structuredClone(node);
  clone.id = createNodeId();
  clone.title = `${node.title} 副本`;
  clone.position = { x: node.position.x + 28, y: node.position.y + 28 };
  clone.choices = clone.choices.map((choice, index) => ({ ...choice, id: `c_${clone.id}_${index + 1}` }));
  currentChapter().nodes.push(clone);
  state.selectedNodeId = clone.id;
  persistDraftAndRender();
}

function deleteNode() {
  const chapter = currentChapter();
  if (!chapter || chapter.nodes.length <= 1) return;
  chapter.nodes = chapter.nodes.filter(node => node.id !== state.selectedNodeId);
  chapter.nodes.forEach(node => { node.choices = node.choices.filter(choice => choice.targetId !== state.selectedNodeId); });
  state.selectedNodeId = chapter.nodes[0]?.id ?? null;
  persistDraftAndRender();
}

function addChoice() {
  const node = currentNode();
  const target = currentChapter()?.nodes.find(candidate => candidate.id !== node?.id);
  if (!node || !target) return;
  node.choices.push({ id: `c_${node.id}_${node.choices.length + 1}`, label: `新选项 ${node.choices.length + 1}`, targetId: target.id, intent: "", note: "", effects: {} });
  persistDraftAndRender();
}

function smartLinkChoices() {
  const node = currentNode();
  if (!node) return;
  const candidates = currentChapter().nodes.filter(candidate => candidate.id !== node.id);
  node.choices.forEach((choice, index) => {
    if (!choice.targetId || !currentChapter().nodes.some(item => item.id === choice.targetId)) {
      choice.targetId = candidates[index % Math.max(candidates.length, 1)]?.id ?? "";
    }
  });
  persistDraftAndRender();
}

function autoLayoutChapter(chapter) {
  if (!chapter?.nodes.length) return;
  const start = chapter.nodes.find(node => node.kind === "start") ?? chapter.nodes[0];
  const levels = new Map([[start.id, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    const level = levels.get(current.id) ?? 0;
    current.choices.forEach(choice => {
      const target = chapter.nodes.find(node => node.id === choice.targetId);
      if (target && !levels.has(target.id)) {
        levels.set(target.id, level + 1);
        queue.push(target);
      }
    });
  }
  chapter.nodes.forEach(node => { if (!levels.has(node.id)) levels.set(node.id, levels.size); });
  const grouped = new Map();
  chapter.nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level).push(node);
  });
  [...grouped.entries()].forEach(([level, nodes]) => {
    nodes.forEach((node, index) => {
      node.position = { x: 56 + level * 320, y: 72 + index * 180 };
    });
  });
}

function buildCurrentGodotPreview() {
  const chapter = currentChapter();
  return {
    path: `dlg_${slugify(currentProject().id)}_${slugify(chapter?.slug || "chapter")}_v1.json`,
    content: buildGodotExportLocal().files.find(file => file.content.chapter_id === chapter?.id)?.content ?? {}
  };
}

function buildGodotExportLocal() {
  return {
    generatedAt: new Date().toISOString(),
    projectId: currentProject().id,
    projectTitle: currentProject().title,
    characters: currentProject().characters,
    files: currentProject().chapters.map(chapter => ({
      path: `data/dialogue/${slugify(currentProject().id)}/dlg_${slugify(currentProject().id)}_${slugify(chapter.slug)}_v1.json`,
      content: {
        project_id: currentProject().id,
        project_title: currentProject().title,
        chapter_id: chapter.id,
        chapter_title: chapter.title,
        chapter_slug: chapter.slug,
        characters: currentProject().characters,
        metrics: currentProject().metrics,
        derived_formulas: currentProject().derivedFormulas,
        nodes: chapter.nodes.map(node => ({
          id: node.id,
          character_id: node.characterId || "",
          speaker_role_type: node.speakerRoleType || inferRoleTypeFromSpeaker(node.speaker),
          speaker: node.speaker,
          title: node.title,
          type: node.kind,
          text: node.text,
          tags: node.tags,
          notes: node.notes,
          effects: node.effects,
          choices: node.choices.map(choice => ({ id: choice.id, text: choice.label, intent: choice.intent, note: choice.note, target: choice.targetId, effects: choice.effects })),
          editor_position: node.position
        }))
      }
    }))
  };
}

function exportMarkdown() {
  const lines = [
    `# ${currentProject().title}`,
    "",
    "## 训练目标",
    currentProject().projectGoal,
    "",
    "## 角色卡",
    ...currentProject().characters.flatMap(character => [
      `- ${character.name} [${roleTypeLabel(character.roleType)}]`,
      `  - 叙事定位：${character.narrativeRole || "未填写"}`,
      `  - 特质：${character.traits || "未填写"}`,
      `  - 目标：${character.goal || "未填写"}`,
      `  - 上下文：${character.context || "未填写"}`
    ]),
    ""
  ];
  currentProject().chapters.forEach(chapter => {
    lines.push(`## ${chapter.title}`);
    lines.push(chapter.notes || "");
    lines.push("");
    chapter.nodes.forEach(node => {
      lines.push(`### ${node.title} (${kindLabel(node.kind)})`);
      lines.push(`- 说话者：${node.speaker}`);
      lines.push(`- 角色类型：${roleTypeLabel(node.speakerRoleType)}`);
      lines.push(`- 标签：${node.tags.join(", ") || "无"}`);
      lines.push(`- 效果：${JSON.stringify(node.effects || {})}`);
      lines.push(node.text);
      if (node.choices.length) {
        lines.push("选项：");
        node.choices.forEach(choice => {
          const target = chapter.nodes.find(item => item.id === choice.targetId);
          lines.push(`- ${choice.label} -> ${target?.title || choice.targetId}`);
        });
      }
      lines.push("");
    });
  });
  return lines.join("\n");
}

function exportProjectArtifact() {
  return {
    id: currentProject().id,
    title: currentProject().title,
    projectGoal: currentProject().projectGoal,
    characters: currentProject().characters,
    metrics: currentProject().metrics,
    derivedFormulas: currentProject().derivedFormulas,
    chapters: currentProject().chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      slug: chapter.slug,
      notes: chapter.notes,
      nodes: chapter.nodes.map(node => ({
        id: node.id,
        characterId: node.characterId || "",
        speakerRoleType: node.speakerRoleType || "",
        speaker: node.speaker,
        title: node.title,
        kind: node.kind,
        text: node.text,
        tags: node.tags,
        notes: node.notes,
        effects: node.effects,
        choices: node.choices,
        position: node.position
      }))
    }))
  };
}

function exportProjectData() {
  return structuredClone(currentProject());
}

function evaluateDerived(metrics) {
  const derived = {};
  currentProject().derivedFormulas.split("\n").map(line => line.trim()).filter(Boolean).forEach(line => {
    const [name, expr] = line.split("=");
    if (!name || !expr) return;
    try {
      const fn = new Function(...Object.keys(metrics), `return ${expr.trim()};`);
      derived[name.trim()] = Number(fn(...Object.values(metrics)));
    } catch {
      derived[name.trim()] = NaN;
    }
  });
  return derived;
}

function applyDelta(metrics, delta = {}) {
  currentProject().metrics.forEach(metric => {
    const next = (metrics[metric.id] ?? 0) + Number(delta[metric.id] ?? 0);
    metrics[metric.id] = clamp(next, metric.min, metric.max);
  });
}

function createNodeId() {
  let index = currentChapter().nodes.length + 1;
  while (currentChapter().nodes.some(node => node.id === `n${index}`)) index += 1;
  return `n${index}`;
}

function normalizeGraphPayload(payload) {
  return {
    nodes: (payload.nodes || [])
      .map((node, index) => normalizeNode(node, index, currentProject().metrics))
      .map(node => enforceNarrativeRules(node))
  };
}

function normalizeNodePayload(node) {
  return enforceNarrativeRules(normalizeNode(node, 0, currentProject().metrics));
}

function normalizeLogicAuditPayload(payload) {
  return {
    summary: payload.summary || "已完成逻辑审查。",
    issues: Array.isArray(payload.issues) ? payload.issues : []
  };
}

function normalizeEffects(input, metrics = currentProject().metrics) {
  const aliases = buildMetricAliases(metrics);
  const out = {};

  if (Array.isArray(input)) {
    input.forEach(item => mergeEffects(out, normalizeEffects(item, metrics)));
    return out;
  }

  if (input && typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      const metricId = aliases.get(normalizeMetricKey(key));
      if (!metricId) return;
      const number = extractNumericDelta(value);
      if (!Number.isNaN(number) && number !== 0) out[metricId] = (out[metricId] || 0) + number;
    });
    return out;
  }

  if (typeof input === "string") {
    return parseMetricEffectsFromText(input, aliases);
  }

  return out;
}

function buildMetricAliases(metrics) {
  const aliases = new Map();
  metrics.forEach(metric => {
    aliases.set(normalizeMetricKey(metric.id), metric.id);
    aliases.set(normalizeMetricKey(metric.label), metric.id);
  });
  aliases.set("压力", "stress");
  aliases.set("stress", "stress");
  aliases.set("清晰度", "clarity");
  aliases.set("clarity", "clarity");
  aliases.set("信任", "trust");
  aliases.set("trust", "trust");
  return aliases;
}

function parseMetricEffectsFromText(text, aliases) {
  const out = {};
  const normalized = String(text)
    .replaceAll("：", ":")
    .replaceAll("，", ",")
    .replaceAll("；", ";");

  const patterns = [
    /([A-Za-z\u4e00-\u9fa5_]+)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/g,
    /([A-Za-z\u4e00-\u9fa5_]+)\s*(增加|提升|上升|提高|减少|下降|降低|扣除|扣)\s*(\d+(?:\.\d+)?)/g
  ];

  patterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      const metricId = aliases.get(normalizeMetricKey(match[1]));
      if (!metricId) continue;
      let delta = 0;
      if (index === 0) {
        delta = Number(match[2]);
      } else {
        const sign = /(减少|下降|降低|扣除|扣)/.test(match[2]) ? -1 : 1;
        delta = sign * Number(match[3]);
      }
      if (!Number.isNaN(delta) && delta !== 0) {
        out[metricId] = (out[metricId] || 0) + delta;
      }
    }
  });

  return out;
}

function mergeEffects(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + Number(value);
  });
}

function normalizeMetricKey(value) {
  return String(value || "").trim().toLowerCase();
}

function extractNumericDelta(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const matched = value.match(/[+-]?\d+(?:\.\d+)?/);
    return matched ? Number(matched[0]) : NaN;
  }
  return NaN;
}

function buildAiContextBlock() {
  return [
    `项目：${currentProject().title}`,
    `项目目标：${currentProject().projectGoal}`,
    `世界规则：${currentProject().worldBook || currentProject().worldNotes}`,
    `世界书：${currentProject().worldBook || "无"}`,
    `人物卡补充：${currentProject().characterBook || "无"}`,
    `角色卡：${currentProject().characters.map(character => `${character.name}[${roleTypeLabel(character.roleType)}] 定位:${character.narrativeRole || "未写"} 特质:${character.traits || "未写"} 目标:${character.goal || "未写"} 上下文:${character.context || "未写"}`).join("；")}`,
    `章节：${currentChapter()?.title ?? ""}`,
    `章节备注：${currentChapter()?.notes ?? ""}`,
    `章节卡：${currentChapter()?.chapterBook ?? "无"}`,
    `指标：${currentProject().metrics.map(metric => `${metric.label}/${metric.id}(${metric.initial}/${metric.min}-${metric.max})`).join("，")}`,
    `预设逻辑：${currentProject().systemPrompt || "无"}`,
    rolePromptRules()
  ].join("\n");
}

function summarizeCurrentChapterForAi() {
  return (currentChapter()?.nodes || []).map(node =>
    `[${node.id}] ${node.title} | ${node.speaker} | ${roleTypeLabel(node.speakerRoleType)} | ${kindLabel(node.kind)} | ${truncate(node.text, 80)}`
  ).join("\n");
}

function collectDownstreamNodes(startId) {
  const chapter = currentChapter();
  if (!chapter) return [];
  const visited = new Set([startId]);
  const queue = [startId];
  const collected = [];
  while (queue.length) {
    const nodeId = queue.shift();
    const node = chapter.nodes.find(item => item.id === nodeId);
    if (!node) continue;
    node.choices.forEach(choice => {
      const target = chapter.nodes.find(item => item.id === choice.targetId);
      if (!target || visited.has(target.id)) return;
      visited.add(target.id);
      queue.push(target.id);
      collected.push(target);
    });
  }
  return collected;
}

function normalizeSpeakerLabel(value) {
  return roleTypeLabel(inferRoleTypeFromSpeaker(value));
}

function applySpeakerPreset(speaker) {
  const node = currentNode();
  if (!node) return;
  if (speaker === "人物") {
    node.speaker = currentProject().protagonist.name || "人物";
  } else {
    node.speaker = speaker;
  }
  persistDraftAndRender();
}

function makeDraggable(element, node) {
  let dragging = false;
  let moved = false;
  let originX = 0;
  let originY = 0;
  let startX = 0;
  let startY = 0;
  element.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.stopPropagation();
    dragging = true;
    moved = false;
    originX = event.clientX;
    originY = event.clientY;
    startX = node.position.x;
    startY = node.position.y;
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener("pointermove", event => {
    if (!dragging) return;
    const nextX = Math.max(0, startX + (event.clientX - originX) / state.zoom);
    const nextY = Math.max(0, startY + (event.clientY - originY) / state.zoom);
    if (Math.abs(nextX - startX) > 2 || Math.abs(nextY - startY) > 2) {
      moved = true;
    }
    node.position = { x: nextX, y: nextY };
    element.style.left = `${nextX}px`;
    element.style.top = `${nextY}px`;
    renderExportPreview();
  });
  element.addEventListener("click", event => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  const stop = event => {
    if (!dragging) return;
    dragging = false;
    if (event.pointerId !== undefined) element.releasePointerCapture(event.pointerId);
    if (moved) {
      renderGraph();
    }
    saveLocalDraft();
  };
  element.addEventListener("pointerup", stop);
  element.addEventListener("pointercancel", stop);
}

function startEdgeDrag(event, sourceNodeId, choiceId) {
  event.preventDefault();
  event.stopPropagation();
  const sourceNode = currentChapter()?.nodes.find(node => node.id === sourceNodeId);
  const choice = sourceNode?.choices.find(item => item.id === choiceId);
  if (!sourceNode || !choice) return;

  const startX = (sourceNode.position?.x ?? 0) + 240;
  const startY = (sourceNode.position?.y ?? 0) + 92;
  const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tempPath.setAttribute("class", "edge-path edge-path-dragging");
  els.edgeLayer.append(tempPath);

  interaction.edgeDrag = {
    sourceNodeId,
    choiceId,
    startX,
    startY,
    tempPath
  };
  updateEdgeDrag(event.clientX, event.clientY);
}

function updateEdgeDrag(clientX, clientY) {
  const drag = interaction.edgeDrag;
  if (!drag) return;
  const point = clientToGraphPoint(clientX, clientY);
  const midX = (drag.startX + point.x) / 2;
  drag.tempPath.setAttribute("d", `M ${drag.startX} ${drag.startY} C ${midX} ${drag.startY}, ${midX} ${point.y}, ${point.x} ${point.y}`);
}

function finishEdgeDrag(clientX, clientY) {
  const drag = interaction.edgeDrag;
  if (!drag) return;
  const sourceNode = currentChapter()?.nodes.find(node => node.id === drag.sourceNodeId);
  const choice = sourceNode?.choices.find(item => item.id === drag.choiceId);
  const targetNode = findClosestNodeFromClientPoint(clientX, clientY, drag.sourceNodeId);
  if (choice && targetNode) {
    choice.targetId = targetNode.id;
    saveLocalDraft();
  }
  drag.tempPath.remove();
  interaction.edgeDrag = null;
  renderAll();
}

function clientToGraphPoint(clientX, clientY) {
  const rect = els.graphViewport.getBoundingClientRect();
  return {
    x: (clientX - rect.left + els.graphViewport.scrollLeft) / state.zoom,
    y: (clientY - rect.top + els.graphViewport.scrollTop) / state.zoom
  };
}

function findClosestNodeFromClientPoint(clientX, clientY, excludeNodeId) {
  const graphPoint = clientToGraphPoint(clientX, clientY);
  const threshold = 180;
  let closest = null;
  for (const node of currentChapter()?.nodes ?? []) {
    if (node.id === excludeNodeId) continue;
    const centerX = (node.position?.x ?? 0) + 120;
    const centerY = (node.position?.y ?? 0) + 92;
    const distance = Math.hypot(centerX - graphPoint.x, centerY - graphPoint.y);
    if (distance <= threshold && (!closest || distance < closest.distance)) {
      closest = { node, distance };
    }
  }
  return closest?.node ?? null;
}

async function apiFetch(pathname, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(state.authToken ? { Authorization: `Bearer ${state.authToken}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE}${pathname}`, {
    headers,
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "请求失败");
  return data;
}

function adjustZoom(delta) {
  state.zoom = clamp(round(state.zoom + delta, 2), 0.6, 1.7);
  renderGraph();
}

function kindLabel(kind) {
  return { start: "开场", dialogue: "对话", training: "训练", reflection: "反思", ending: "结局" }[kind] ?? "对话";
}

function kindClass(kind) {
  return { start: "start", dialogue: "dialogue", training: "training", reflection: "reflection", ending: "ending" }[kind] ?? "dialogue";
}

function protagonistSummary() {
  const protagonist = getPrimaryCharacter(currentProject().characters, "protagonist");
  return protagonist ? `${protagonist.name}，${protagonist.narrativeRole}。特质：${protagonist.traits}。目标：${protagonist.goal}。` : "未设置主角。";
}

function splitTags(value) {
  return String(value).split(/[，,]/).map(tag => tag.trim()).filter(Boolean);
}

function extractJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const matched = String(content).match(/\{[\s\S]*\}/);
    if (!matched) throw new Error("模型返回中没有可解析 JSON");
    return JSON.parse(matched[0]);
  }
}

function normalizeUrl(baseUrl, suffix) {
  return `${String(baseUrl).replace(/\/+$/, "")}${suffix}`;
}

function normalizeAnthropicUrl(baseUrl) {
  const cleaned = String(baseUrl).replace(/\/+$/, "");
  if (cleaned.endsWith("/messages")) return cleaned;
  if (cleaned.endsWith("/v1")) return `${cleaned}/messages`;
  return `${cleaned}/v1/messages`;
}

function flashStatus(message, isError = false) {
  els.aiStatus.textContent = message;
  els.aiStatus.style.color = isError ? "#8f2d22" : "#587164";
  els.aiStatus.style.background = isError ? "rgba(143,45,34,.12)" : "rgba(88,113,100,.15)";
  clearTimeout(flashStatus.timer);
  flashStatus.timer = setTimeout(renderAiStatus, 2600);
}

function setBusy(id, busy) {
  document.getElementById(id).disabled = busy;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, "_").replace(/^_+|_+$/g, "") || "item";
}

function truncate(value, length = 70) {
  return String(value || "").length > length ? `${String(value).slice(0, length)}…` : String(value || "");
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function formatDate(value, compact = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return compact ? date.toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-").replace(", ", "_") : date.toLocaleString("zh-CN", { hour12: false });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}
