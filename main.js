// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    // This gives it a premium, seamless borderless feel on Mac/Windows
    titleBarStyle: 'hiddenInset', 
    backgroundColor: '#050505',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // If we are in development mode, load the local Vite server
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    // Uncomment the next line if you want the dev tools to open automatically
    // win.webContents.openDevTools();
  } else {
    // In production, load the static built files
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});