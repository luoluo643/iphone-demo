const appCatalog = {
  messages: {
    title: "消息",
    description: "这里可以放会话列表、联系人入口，或者接成客服 / IM / 团队聊天页面。",
    actions: ["查看最新会话", "进入联系人", "新建消息"],
  },
  music: {
    title: "音乐",
    description: "适合替换成播放器界面、音频直播页，或者你的内容推荐流。",
    actions: ["继续播放", "查看歌单", "打开播放页"],
  },
  camera: {
    title: "相机",
    description: "可以继续扩展成拍照预览、扫码识别或视频录制的界面容器。",
    actions: ["打开拍摄", "扫一扫", "最近照片"],
  },
  maps: {
    title: "地图",
    description: "这里适合作为导航、门店分布、行程规划等地理相关功能的入口。",
    actions: ["开始导航", "附近地点", "收藏地址"],
  },
  notes: {
    title: "便签",
    description: "能承接草稿、待办、富文本记录，也很适合做灵感收集页。",
    actions: ["新建便签", "查看草稿", "今日待办"],
  },
  fitness: {
    title: "健康",
    description: "可以放运动概览、打卡数据、身体指标或者任务进度。",
    actions: ["查看步数", "开启训练", "每周报告"],
  },
  mail: {
    title: "邮箱",
    description: "适合作为收件箱、审批中心或商务通知聚合面板。",
    actions: ["收件箱", "写邮件", "待处理"],
  },
  gallery: {
    title: "相册",
    description: "能很自然地接入图片瀑布流、作品集或内容管理页面。",
    actions: ["最近项目", "精选相册", "批量管理"],
  },
  phone: {
    title: "电话",
    description: "可作为拨号盘、热线入口、语音客服或联系人快捷功能。",
    actions: ["拨号盘", "最近通话", "联系人"],
  },
  browser: {
    title: "浏览器",
    description: "适合嵌入 WebView 容器、资讯首页或业务工作台跳转入口。",
    actions: ["常用站点", "继续浏览", "打开工作台"],
  },
};

const phoneShell = document.querySelector(".phone-shell");
const appModal = document.querySelector(".app-modal");
const appTitle = document.querySelector(".app-title");
const appDescription = document.querySelector(".app-description");
const appActions = document.querySelector(".app-actions");
const logList = document.querySelector(".log-list");
const notificationPanel = document.querySelector(".overlay-notifications");
const controlPanel = document.querySelector(".overlay-controls");
const pages = [...document.querySelectorAll(".app-page")];
const navPills = [...document.querySelectorAll(".nav-pill")];
const modeButtons = [...document.querySelectorAll("[data-os-mode]")];
const unlockButton = document.querySelector("[data-action='unlock']");
const lockTime = document.querySelector(".lock-time");
const statusTime = document.querySelector(".status-time");
const clearLogButton = document.querySelector(".clear-log");

let currentPage = "home";

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
});

function addLog(title, detail) {
  const item = document.createElement("article");
  item.className = "log-item";
  item.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  logList.prepend(item);
}

function refreshClock() {
  const now = timeFormatter.format(new Date());
  lockTime.textContent = now;
  statusTime.textContent = now;
}

function closePanels() {
  notificationPanel.hidden = true;
  controlPanel.hidden = true;
}

function closeApp() {
  appModal.hidden = true;
}

function setLockState(isLocked) {
  phoneShell.dataset.locked = isLocked ? "true" : "false";
}

function setMode(mode) {
  phoneShell.dataset.os = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.osMode === mode);
  });

  if (mode === "android" && currentPage === "search") {
    switchPage("drawer", false);
  }

  if (mode === "ios" && currentPage === "drawer") {
    switchPage("home", false);
  }

  closePanels();
  closeApp();
  addLog("系统模式", `已切换到 ${mode === "ios" ? "iPhone" : "Android"} 风格 · ${timeFormatter.format(new Date())}`);
}

function openApp(appKey, sourceLabel = "桌面") {
  const app = appCatalog[appKey];
  if (!app) return;

  setLockState(false);
  closePanels();
  appTitle.textContent = app.title;
  appDescription.textContent = app.description;
  appActions.innerHTML = "";

  app.actions.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-action";
    button.textContent = label;
    button.addEventListener("click", () => {
      addLog(app.title, `触发动作: ${label} · ${timeFormatter.format(new Date())}`);
    });
    appActions.append(button);
  });

  appModal.hidden = false;
  addLog(app.title, `从${sourceLabel}打开 · ${timeFormatter.format(new Date())}`);
}

function switchPage(targetPage, shouldLog = true) {
  currentPage = targetPage;

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === targetPage);
  });

  navPills.forEach((pill) => {
    const isActive = pill.dataset.targetPage === targetPage;
    pill.classList.toggle("is-active", isActive);
  });

  closePanels();
  closeApp();

  if (shouldLog) {
    addLog("页面切换", `当前页: ${targetPage} · ${timeFormatter.format(new Date())}`);
  }
}

document.querySelectorAll("[data-app]").forEach((button) => {
  button.addEventListener("click", () => {
    const appKey = button.dataset.app;
    const sourceLabel = button.closest(".dock")
      ? "底部停靠栏"
      : button.closest(".app-page[data-page='drawer']")
        ? "应用抽屉"
        : "界面入口";
    openApp(appKey, sourceLabel);
  });
});

document.querySelectorAll("[data-target-page]").forEach((button) => {
  button.addEventListener("click", () => {
    setLockState(false);
    switchPage(button.dataset.targetPage);
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "unlock") {
      setLockState(false);
      addLog("锁屏", `设备已解锁 · ${timeFormatter.format(new Date())}`);
      return;
    }

    if (action === "notifications") {
      setLockState(false);
      closeApp();
      const nextState = !notificationPanel.hidden;
      closePanels();
      notificationPanel.hidden = nextState;
      addLog("通知中心", `${nextState ? "已关闭" : "已展开"} · ${timeFormatter.format(new Date())}`);
      return;
    }

    if (action === "controls") {
      setLockState(false);
      closeApp();
      const nextState = !controlPanel.hidden;
      closePanels();
      controlPanel.hidden = nextState;
      addLog("控制中心", `${nextState ? "已关闭" : "已展开"} · ${timeFormatter.format(new Date())}`);
      return;
    }

    if (action === "theme") {
      const nextTheme = phoneShell.dataset.theme === "aurora" ? "midnight" : "aurora";
      phoneShell.dataset.theme = nextTheme;
      addLog("主题切换", `当前主题: ${nextTheme} · ${timeFormatter.format(new Date())}`);
      return;
    }

    if (action === "android-back") {
      if (!appModal.hidden) {
        closeApp();
        addLog("Android 返回", `关闭当前应用窗口 · ${timeFormatter.format(new Date())}`);
        return;
      }

      if (!controlPanel.hidden || !notificationPanel.hidden) {
        closePanels();
        addLog("Android 返回", `收起系统面板 · ${timeFormatter.format(new Date())}`);
        return;
      }

      switchPage("home");
    }
  });
});

document.querySelectorAll("[data-close-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    closePanels();
    addLog("面板关闭", `浮层已收起 · ${timeFormatter.format(new Date())}`);
  });
});

document.querySelector("[data-close-app]").addEventListener("click", () => {
  closeApp();
  addLog("应用窗口", `已退出当前应用 · ${timeFormatter.format(new Date())}`);
});

document.querySelectorAll(".control-tile").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("is-on");
    addLog(
      "快捷开关",
      `${button.textContent.trim()} 已${button.classList.contains("is-on") ? "开启" : "关闭"} · ${timeFormatter.format(new Date())}`
    );
  });
});

document.querySelectorAll(".slider-block input").forEach((input) => {
  input.addEventListener("input", () => {
    const label = input.closest(".slider-block").querySelector("span").textContent;
    addLog(label, `调整到 ${input.value}% · ${timeFormatter.format(new Date())}`);
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.osMode);
  });
});

clearLogButton.addEventListener("click", () => {
  logList.innerHTML = "";
  addLog("日志", `记录已清空 · ${timeFormatter.format(new Date())}`);
});

unlockButton.addEventListener("dblclick", () => {
  setLockState(true);
  closePanels();
  closeApp();
  addLog("锁屏", `设备已重新锁定 · ${timeFormatter.format(new Date())}`);
});

refreshClock();
setInterval(refreshClock, 30000);
setMode("ios");
switchPage("home", false);
addLog("原型已升级", "当前支持 iPhone / Android 双模式、锁屏解锁与系统级交互");
