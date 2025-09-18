import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // En build, buscar el index.html relativo al ejecutable empaquetado
    const prodIndex = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
    const fs = require('fs');
    if (fs.existsSync(prodIndex)) {
      win.loadFile(prodIndex);
    } else {
      win.loadURL('data:text/html,<h2 style="color:red">No se encontró el frontend en:<br>' + prodIndex + '</h2>');
    }
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
