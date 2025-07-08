const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 200,
    height: 180,
    minWidth: 120,
    minHeight: 100,
    x: width - 220,
    y: 100,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'icon.png'),
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    resizable: true, // 允许用户手动调整
    skipTaskbar: false, // 在任务栏显示（macOS Dock）
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // 加载HTML文件
  mainWindow.loadFile('index.html');

  // 开发时打开开发者工具（可选）
  // mainWindow.webContents.openDevTools();

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理窗口关闭
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 处理应用退出
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();
  
  // 设置Dock菜单（macOS）
  if (process.platform === 'darwin') {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
            }
          }
        }
      },
      {
        label: '退出',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 处理窗口拖拽
ipcMain.on('window-drag', (event, { x, y }) => {
  if (mainWindow) {
    mainWindow.setPosition(x, y);
  }
});

// 处理应用退出
ipcMain.on('quit-app', () => {
  app.isQuiting = true;
  app.quit();
});

// 处理应用退出（确保完全退出）
app.on('before-quit', () => {
  app.isQuiting = true;
});

app.on('window-all-closed', () => {
  app.quit();
});

// 处理窗口最小化
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// 处理窗口显示/隐藏
ipcMain.on('toggle-window', () => {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  }
});

// 处理窗口高度自适应调整
ipcMain.on('resize-window-height', (event, { height }) => {
  if (mainWindow) {
    const currentBounds = mainWindow.getBounds();
    mainWindow.setSize(currentBounds.width, height);
  }
}); 