const storageKey = "milk_mist_love_phone_config_v1";

const defaultConfig = {
  personaName: "未命名关系",
  lockTitle: "今晚的风比昨天轻一点",
  lockCopy: "把想说的话先留在这里，等你慢慢写满。",
  lockNoticeTitle: "消息",
  lockNoticeBody: "有人在想你，要不要把第一句写得温柔一点。",
  primaryWidgetTitle: "今天想记住",
  primaryWidgetBody: "傍晚五点十七分，云有一点粉。",
  mediaWidgetLabel: "为你做的",
  mediaWidgetBody: "这里可以放一张图，或者一句只想给某个人看的话。",
  mediaWidgetImage: "",
  threadName: "新消息",
  threadPreview: "晚一点回也没关系，我还在。",
  threadBadge: "1",
  chatTitle: "新对话",
  chatSubtitle: "在线",
  incomingBubble: "刚刚看到一家很好看的面包店。",
  outgoingBubble: "下次路过的时候，拍给我看看。"
};

const textKeys = Object.keys(defaultConfig);

const state = {
  config: loadConfig(),
  unlocked: false,
  activeApp: null,
  messagePage: "list"
};

const phoneFrame = document.getElementById("phoneFrame");
const lockScreen = document.getElementById("lockScreen");
const lockTime = document.getElementById("lockTime");
const lockDate = document.getElementById("lockDate");
const unlockZone = document.getElementById("unlockZone");
const unlockHandle = document.getElementById("unlockHandle");
const lockNotification = document.getElementById("lockNotification");
const messagesShell = document.getElementById("messagesShell");
const settingsShell = document.getElementById("settingsShell");
const openThreadButton = document.getElementById("openThreadButton");
const threadBackButton = document.getElementById("threadBackButton");
const messagesCloseButton = document.getElementById("messagesCloseButton");
const messagesHomePill = document.getElementById("messagesHomePill");
const settingsHomePill = document.getElementById("settingsHomePill");
const settingsDoneButton = document.getElementById("settingsDoneButton");
const configForm = document.getElementById("configForm");
const jsonPayload = document.getElementById("jsonPayload");
const jsonFileInput = document.getElementById("jsonFileInput");
const importJsonButton = document.getElementById("importJsonButton");
const exportJsonButton = document.getElementById("exportJsonButton");
const resetConfigButton = document.getElementById("resetConfigButton");
const settingsFeedback = document.getElementById("settingsFeedback");
const threadBadge = document.getElementById("threadBadge");
const mediaThumb = document.getElementById("mediaThumb");
const mediaThumbImage = document.getElementById("mediaThumbImage");
const messagesWindow = messagesShell.querySelector(".messages-window");
const appShellMap = {
  messages: messagesShell,
  settings: settingsShell
};

let dragStartY = 0;
let dragDistance = 0;
let draggingLock = false;
let threadSwipeActive = false;
let threadSwipePointerId = null;
let threadSwipeStartX = 0;
let threadSwipeDistance = 0;

renderConfig();
syncForm();
updateClock();
window.setInterval(updateClock, 30000);

bindEvents();

function bindEvents() {
  document.querySelectorAll("[data-open-app]").forEach((button) => {
    button.addEventListener("click", () => {
      const appName = button.dataset.openApp;
      if (!appName) {
        return;
      }
      openApp(appName, { originEl: button });
    });
  });

  lockNotification.addEventListener("click", () => {
    unlockTo(() => {
      openApp("messages", { page: "thread", originEl: lockNotification });
    });
  });

  unlockZone.addEventListener("pointerdown", startUnlockDrag);
  unlockZone.addEventListener("click", (event) => {
    if (event.target === unlockHandle) {
      return;
    }
    if (!state.unlocked) {
      unlockTo();
    }
  });
  unlockHandle.addEventListener("click", () => {
    if (!state.unlocked) {
      unlockTo();
    }
  });

  messagesWindow.addEventListener("pointerdown", startThreadSwipe);

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerEnd);
  window.addEventListener("pointercancel", handlePointerEnd);

  openThreadButton.addEventListener("click", () => {
    setMessagePage("thread");
  });

  threadBackButton.addEventListener("click", () => {
    setMessagePage("list");
  });

  messagesCloseButton.addEventListener("click", () => {
    closeApp("messages");
  });

  messagesHomePill.addEventListener("click", () => {
    closeApp("messages");
  });

  settingsHomePill.addEventListener("click", () => {
    closeApp("settings");
  });

  settingsDoneButton.addEventListener("click", () => {
    closeApp("settings");
  });

  configForm.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!target.name || !textKeys.includes(target.name)) {
      return;
    }
    state.config[target.name] = cleanValue(target.value);
    renderConfig();
    saveConfig(state.config);
    setFeedback("已保存到当前浏览器。", false);
  });

  importJsonButton.addEventListener("click", () => {
    if (!jsonPayload.value.trim()) {
      setFeedback("先贴一段 JSON 配置，再导入。", true);
      return;
    }
    try {
      const parsed = JSON.parse(jsonPayload.value);
      applyImportedConfig(parsed, "已从粘贴内容导入。");
    } catch (error) {
      setFeedback("这段 JSON 读不出来，检查一下逗号和引号。", true);
    }
  });

  jsonFileInput.addEventListener("change", async () => {
    const file = jsonFileInput.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      applyImportedConfig(parsed, "已从文件导入。", text);
    } catch (error) {
      setFeedback("这个文件不是可用的 JSON 配置。", true);
    } finally {
      jsonFileInput.value = "";
    }
  });

  exportJsonButton.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.config, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "milk-mist-love-phone-config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("当前配置已经导出。", false);
  });

  resetConfigButton.addEventListener("click", () => {
    state.config = sanitizeConfig(defaultConfig);
    renderConfig();
    syncForm();
    saveConfig(state.config);
    jsonPayload.value = JSON.stringify(state.config, null, 2);
    setFeedback("已经恢复到默认壳。", false);
  });
}

function unlockTo(afterUnlock) {
  if (state.unlocked) {
    if (typeof afterUnlock === "function") {
      afterUnlock();
    }
    return;
  }

  state.unlocked = true;
  phoneFrame.classList.remove("is-dragging-lock");
  phoneFrame.classList.add("is-unlocked");
  resetLockDrag();

  if (typeof afterUnlock === "function") {
    window.setTimeout(afterUnlock, 420);
  }
}

function handlePointerMove(event) {
  moveUnlockDrag(event);
  moveThreadSwipe(event);
}

function handlePointerEnd(event) {
  endUnlockDrag();
  endThreadSwipe(event);
}

function startUnlockDrag(event) {
  if (state.unlocked) {
    return;
  }
  draggingLock = true;
  dragStartY = event.clientY;
  dragDistance = 0;
  phoneFrame.classList.add("is-dragging-lock");
}

function moveUnlockDrag(event) {
  if (!draggingLock || state.unlocked) {
    return;
  }
  dragDistance = Math.max(0, dragStartY - event.clientY);
  const capped = Math.min(dragDistance, 220);
  const opacity = Math.max(0.18, 1 - capped / 200);
  phoneFrame.style.setProperty("--lock-slide", `${-capped}px`);
  phoneFrame.style.setProperty("--lock-opacity", `${opacity}`);
}

function endUnlockDrag() {
  if (!draggingLock) {
    return;
  }
  draggingLock = false;
  phoneFrame.classList.remove("is-dragging-lock");
  if (dragDistance > 110) {
    unlockTo();
    return;
  }
  resetLockDrag();
}

function resetLockDrag() {
  dragDistance = 0;
  phoneFrame.style.setProperty("--lock-slide", "0px");
  phoneFrame.style.setProperty("--lock-opacity", "1");
}

function startThreadSwipe(event) {
  if (state.activeApp !== "messages" || state.messagePage !== "thread") {
    return;
  }

  const rect = messagesWindow.getBoundingClientRect();
  if (event.clientX - rect.left > 32) {
    return;
  }

  threadSwipeActive = true;
  threadSwipePointerId = event.pointerId;
  threadSwipeStartX = event.clientX;
  threadSwipeDistance = 0;
  messagesShell.classList.add("is-edge-swiping");
}

function moveThreadSwipe(event) {
  if (!threadSwipeActive || event.pointerId !== threadSwipePointerId) {
    return;
  }

  threadSwipeDistance = Math.max(0, Math.min(event.clientX - threadSwipeStartX, 180));
  messagesShell.style.setProperty("--thread-peek", `${threadSwipeDistance}px`);
}

function endThreadSwipe(event) {
  if (!threadSwipeActive) {
    return;
  }

  if (event && event.pointerId !== undefined && event.pointerId !== threadSwipePointerId) {
    return;
  }

  const shouldGoBack = threadSwipeDistance > 92;
  resetThreadSwipe();
  if (shouldGoBack) {
    setMessagePage("list");
  }
}

function resetThreadSwipe() {
  threadSwipeActive = false;
  threadSwipePointerId = null;
  threadSwipeStartX = 0;
  threadSwipeDistance = 0;
  messagesShell.classList.remove("is-edge-swiping");
  messagesShell.style.setProperty("--thread-peek", "0px");
}

function openApp(appName, options = {}) {
  unlockTo(() => {
    const shell = appShellMap[appName];
    if (!shell) {
      return;
    }

    if (state.activeApp && state.activeApp !== appName) {
      const previousShell = appShellMap[state.activeApp];
      previousShell?.classList.remove("is-open");
      previousShell?.setAttribute("aria-hidden", "true");
    }

    if (options.originEl instanceof HTMLElement) {
      setOriginFromElement(shell, options.originEl);
    }

    state.activeApp = appName;
    phoneFrame.classList.add("has-open-app");
    shell.classList.add("is-open");
    shell.setAttribute("aria-hidden", "false");

    if (appName === "messages") {
      setMessagePage(options.page || "list");
    }
  });
}

function closeApp(appName) {
  const targetApp = appName || state.activeApp;
  const shell = appShellMap[targetApp];
  if (!shell) {
    return;
  }

  shell.classList.remove("is-open");
  shell.setAttribute("aria-hidden", "true");

  if (targetApp === "messages") {
    setMessagePage("list");
    resetThreadSwipe();
  }

  if (state.activeApp === targetApp) {
    state.activeApp = null;
  }

  phoneFrame.classList.toggle("has-open-app", Boolean(state.activeApp));
}

function setMessagePage(page) {
  state.messagePage = page;
  messagesShell.dataset.page = page;
}

function setOriginFromElement(shell, element) {
  const shellRect = phoneFrame.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - shellRect.left;
  const y = rect.top + rect.height / 2 - shellRect.top;
  shell.style.setProperty("--origin-x", `${x}px`);
  shell.style.setProperty("--origin-y", `${y}px`);
}

function updateClock() {
  const now = new Date();
  const timeText = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const dateText = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  lockTime.textContent = timeText;
  lockDate.textContent = dateText;
  document.querySelectorAll("[data-clock]").forEach((node) => {
    node.textContent = timeText;
  });
}

function renderConfig() {
  document.querySelectorAll("[data-bind]").forEach((node) => {
    const key = node.dataset.bind;
    if (!key) {
      return;
    }
    node.textContent = state.config[key] || "";
  });

  const badgeValue = cleanValue(state.config.threadBadge);
  threadBadge.textContent = badgeValue;
  threadBadge.classList.toggle("is-hidden", badgeValue.length === 0);

  const avatarSource = cleanValue(state.config.threadName) || cleanValue(state.config.personaName) || "聊";
  const avatarLetter = avatarSource.charAt(0);
  document.querySelectorAll("[data-avatar-letter]").forEach((node) => {
    node.textContent = avatarLetter;
  });

  const imageUrl = cleanValue(state.config.mediaWidgetImage);
  if (imageUrl) {
    mediaThumb.classList.add("has-image");
    mediaThumbImage.src = imageUrl;
  } else {
    mediaThumb.classList.remove("has-image");
    mediaThumbImage.removeAttribute("src");
  }
}

function syncForm() {
  Array.from(configForm.elements).forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!field.name || !textKeys.includes(field.name)) {
      return;
    }
    field.value = state.config[field.name] || "";
  });

  jsonPayload.value = JSON.stringify(state.config, null, 2);
}

function applyImportedConfig(rawConfig, feedbackText, rawText) {
  state.config = sanitizeConfig(rawConfig);
  renderConfig();
  syncForm();
  saveConfig(state.config);
  if (typeof rawText === "string") {
    jsonPayload.value = rawText;
  }
  setFeedback(feedbackText, false);
}

function sanitizeConfig(rawConfig) {
  const nextConfig = {};
  textKeys.forEach((key) => {
    const value = rawConfig && typeof rawConfig === "object" ? rawConfig[key] : defaultConfig[key];
    nextConfig[key] = cleanValue(value || defaultConfig[key]);
  });
  return nextConfig;
}

function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function saveConfig(config) {
  window.localStorage.setItem(storageKey, JSON.stringify(config));
}

function loadConfig() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return sanitizeConfig(defaultConfig);
    }
    return sanitizeConfig(JSON.parse(saved));
  } catch (error) {
    return sanitizeConfig(defaultConfig);
  }
}

function setFeedback(message, isError) {
  settingsFeedback.textContent = message;
  settingsFeedback.style.color = isError ? "#d93025" : "rgba(33, 24, 29, 0.62)";
}
