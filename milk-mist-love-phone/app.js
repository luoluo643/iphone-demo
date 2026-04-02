const screens = [...document.querySelectorAll(".screen")];
const statusTime = document.getElementById("statusTime");
const lockTime = document.getElementById("lockTime");
const configOverlay = document.getElementById("configOverlay");

const storageKey = "milk_mist_love_phone_config_v1";

const defaultConfig = {
  personaName: "未命名人设",
  lockTitle: "奶雾恋聊机",
  lockCopy: "空白人设可导入，聊天内容后续填充。",
  lockNoticeTitle: "聊天列表占位入口",
  lockNoticeBody: "后续导入人设和对话后，这里显示第一条暧昧通知。",
  primaryWidgetTitle: "空白可编辑",
  primaryWidgetBody: "用于放一句暧昧便签、心情碎片或关系提示。",
  mediaWidgetLabel: "可换图",
  mediaWidgetBody: "支持图片、便签图或“为你做”的展示位。",
  mediaWidgetImage: "",
  threadName: "未命名对话",
  threadPreview: "导入人设后显示最近一条消息预览。",
  threadBadge: "1",
  chatTitle: "未命名会话",
  chatSubtitle: "空白人设",
  incomingBubble: "导入对话后，这里显示对方的第一条消息。",
  outgoingBubble: "用户编写或导入的人设内容也会从这里开始填充。",
};

let config = loadConfig();

const textTargets = {
  personaName: document.getElementById("personaNameText"),
  lockTitle: document.getElementById("lockCardTitle"),
  lockCopy: document.getElementById("lockCardCopy"),
  lockNoticeTitle: document.getElementById("lockNoticeTitle"),
  lockNoticeBody: document.getElementById("lockNoticeBody"),
  primaryWidgetTitle: document.getElementById("primaryWidgetTitle"),
  primaryWidgetBody: document.getElementById("primaryWidgetBody"),
  mediaWidgetLabel: document.getElementById("mediaWidgetLabel"),
  mediaWidgetBody: document.getElementById("mediaWidgetBody"),
  threadName: document.getElementById("threadName"),
  threadPreview: document.getElementById("threadPreview"),
  threadBadge: document.getElementById("threadBadge"),
  chatTitle: document.getElementById("chatTitle"),
  chatSubtitle: document.getElementById("chatSubtitle"),
  incomingBubble: document.getElementById("incomingBubble"),
  outgoingBubble: document.getElementById("outgoingBubble"),
};

const mediaPreview = document.getElementById("mediaWidgetPreview");
const configStatus = document.getElementById("configStatus");

const fieldBindings = {
  personaName: "personaNameInput",
  lockTitle: "lockTitleInput",
  lockCopy: "lockCopyInput",
  lockNoticeTitle: "lockNoticeTitleInput",
  lockNoticeBody: "lockNoticeBodyInput",
  primaryWidgetTitle: "primaryWidgetTitleInput",
  primaryWidgetBody: "primaryWidgetBodyInput",
  mediaWidgetLabel: "mediaWidgetLabelInput",
  mediaWidgetBody: "mediaWidgetBodyInput",
  mediaWidgetImage: "mediaWidgetImageInput",
  threadName: "threadNameInput",
  threadPreview: "threadPreviewInput",
  threadBadge: "threadBadgeInput",
  chatTitle: "chatTitleInput",
  chatSubtitle: "chatSubtitleInput",
  incomingBubble: "incomingBubbleInput",
  outgoingBubble: "outgoingBubbleInput",
};

const inputs = Object.fromEntries(
  Object.entries(fieldBindings).map(([key, id]) => [key, document.getElementById(id)]),
);

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function loadConfig() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { ...defaultConfig };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...defaultConfig };
    return sanitizeConfig(parsed);
  } catch (_error) {
    return { ...defaultConfig };
  }
}

function sanitizeConfig(source) {
  const next = { ...defaultConfig };
  Object.keys(defaultConfig).forEach((key) => {
    const value = source[key];
    if (value === undefined || value === null) return;
    next[key] = String(value);
  });
  return next;
}

function saveConfig() {
  window.localStorage.setItem(storageKey, JSON.stringify(config, null, 2));
}

function renderTime() {
  const value = formatTime(new Date());
  if (statusTime) statusTime.textContent = value;
  if (lockTime) lockTime.textContent = value;
}

function setScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.toggle(
      "is-active",
      screen.dataset.screen === screenName,
    );
  });
}

function renderConfig() {
  Object.entries(textTargets).forEach(([key, element]) => {
    if (element) element.textContent = config[key];
  });

  if (mediaPreview) {
    const image = config.mediaWidgetImage.trim();
    if (image) {
      mediaPreview.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url("${image}")`;
      mediaPreview.style.backgroundSize = "cover";
      mediaPreview.style.backgroundPosition = "center";
      mediaPreview.style.color = "#ffffff";
    } else {
      mediaPreview.style.backgroundImage =
        "linear-gradient(135deg, rgba(248, 224, 225, 0.9), rgba(255, 255, 255, 0.9))";
      mediaPreview.style.backgroundSize = "";
      mediaPreview.style.backgroundPosition = "";
      mediaPreview.style.color = "";
    }
  }

  if (textTargets.threadBadge) {
    const badge = config.threadBadge.trim();
    const normalized = Number.parseInt(badge || "0", 10);
    if (!badge || Number.isNaN(normalized) || normalized <= 0) {
      textTargets.threadBadge.hidden = true;
    } else {
      textTargets.threadBadge.hidden = false;
      textTargets.threadBadge.textContent = String(Math.min(normalized, 99));
    }
  }
}

function syncForm() {
  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    input.value = config[key];
  });
}

function setStatus(message) {
  if (configStatus) configStatus.textContent = message;
}

function openConfigPanel() {
  syncForm();
  if (configOverlay) configOverlay.hidden = false;
  document.body.classList.add("config-open");
}

function closeConfigPanel() {
  if (configOverlay) configOverlay.hidden = true;
  document.body.classList.remove("config-open");
}

function applyImportedConfig(source, message) {
  config = sanitizeConfig(source);
  saveConfig();
  renderConfig();
  syncForm();
  setStatus(message);
}

function exportConfig() {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "milk-mist-love-phone-persona.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("已导出当前人设配置 JSON。");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-open-screen]");
  if (!target) return;
  const nextScreen = target.getAttribute("data-open-screen");
  if (nextScreen) setScreen(nextScreen);
});

document.getElementById("openConfigPanel")?.addEventListener("click", openConfigPanel);
document.getElementById("closeConfigPanel")?.addEventListener("click", closeConfigPanel);

configOverlay?.addEventListener("click", (event) => {
  if (event.target === configOverlay) closeConfigPanel();
});

Object.entries(inputs).forEach(([key, input]) => {
  if (!input) return;
  input.addEventListener("input", () => {
    config[key] = input.value;
    saveConfig();
    renderConfig();
    setStatus("表单内容已实时保存到本地。");
  });
});

document.getElementById("importJsonBtn")?.addEventListener("click", () => {
  const textarea = document.getElementById("jsonConfigInput");
  if (!textarea || !textarea.value.trim()) {
    setStatus("请先粘贴 JSON 内容。");
    return;
  }
  try {
    const parsed = JSON.parse(textarea.value);
    applyImportedConfig(parsed, "JSON 文本导入成功。");
  } catch (_error) {
    setStatus("JSON 解析失败，请检查格式。");
  }
});

document.getElementById("importFileBtn")?.addEventListener("click", () => {
  document.getElementById("jsonFileInput")?.click();
});

document.getElementById("jsonFileInput")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    applyImportedConfig(parsed, "JSON 文件导入成功。");
  } catch (_error) {
    setStatus("文件读取或 JSON 解析失败。");
  }
  event.target.value = "";
});

document.getElementById("exportJsonBtn")?.addEventListener("click", exportConfig);

document.getElementById("resetConfigBtn")?.addEventListener("click", () => {
  if (!window.confirm("确定恢复为默认人设配置吗？")) return;
  config = { ...defaultConfig };
  saveConfig();
  renderConfig();
  syncForm();
  setStatus("已恢复默认配置。");
});

renderConfig();
syncForm();
renderTime();
setInterval(renderTime, 30000);
