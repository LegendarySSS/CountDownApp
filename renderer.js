const { ipcRenderer } = require("electron");

const timeDisplay = document.getElementById("timeDisplay");
const timeInput = document.getElementById("timeInput");
const inputContainer = document.getElementById("inputContainer");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const closeBtn = document.getElementById("closeBtn");

let timeLeft = 0;
let isRunning = false;
let intervalId = null;

timeInput.value = "8";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(timeLeft);
  
  if (isRunning || timeLeft > 0) {
    inputContainer.classList.add('hidden');
    // 自适应窗口高度 - 隐藏输入框时缩小
    setTimeout(() => {
      const container = document.querySelector('.container');
      const containerHeight = container.scrollHeight;
      ipcRenderer.send('resize-window-height', { height: containerHeight + 20 }); // +20 为padding
    }, 10);
  } else {
    inputContainer.classList.remove('hidden');
    // 自适应窗口高度 - 显示输入框时恢复
    setTimeout(() => {
      const container = document.querySelector('.container');
      const containerHeight = container.scrollHeight;
      ipcRenderer.send('resize-window-height', { height: containerHeight + 20 }); // +20 为padding
    }, 10);
  }
  
  if (isRunning) {
    startBtn.textContent = '⏸';
    startBtn.className = 'btn pause-btn';
  } else {
    startBtn.textContent = '▶';
    startBtn.className = 'btn start-btn';
  }
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  // 先清理之前的定时器，防止内存泄漏
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  if (timeLeft === 0) {
    const minutes = parseInt(timeInput.value);
    if (isNaN(minutes) || minutes <= 0) {
      alert("请输入有效的时间");
      return;
    }
    timeLeft = minutes * 60;
  }

  isRunning = true;
  updateDisplay();

  intervalId = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      isRunning = false;
      updateDisplay();

      showNotification();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(intervalId);
  intervalId = null;
  updateDisplay();
}

function resetTimer() {
  isRunning = false;
  timeLeft = 0;
  clearInterval(intervalId);
  intervalId = null;
  updateDisplay();
}

function showNotification() {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("倒计时结束！", {
      body: "时间到了！",
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234CAF50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    });
  }

  playNotificationSound();

  flashWindow();
}

function playNotificationSound() {
  const audio = new Audio(
    "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
  );
  audio.play().catch(() => {
    // 忽略错误，某些环境可能不支持音频播放
  });
}

function flashWindow() {
  // 通过IPC发送闪烁信号到主进程
  ipcRenderer.send("flash-window");
}

startBtn.addEventListener("click", toggleTimer);
resetBtn.addEventListener("click", resetTimer);
minimizeBtn.addEventListener("click", () => {
  ipcRenderer.send("minimize-window");
});
closeBtn.addEventListener("click", () => {
  ipcRenderer.send("quit-app");
});

// 请求通知权限
if ("Notification" in window) {
  Notification.requestPermission();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ":
      e.preventDefault();
      toggleTimer();
      break;
    case "r":
    case "R":
      resetTimer();
      break;
    case "Escape":
      ipcRenderer.send("minimize-window");
      break;
  }
});

updateDisplay();
