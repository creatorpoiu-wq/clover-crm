const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "EPIC Management CRM",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURI('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f9fafb;"><h1>Starting CRM... Please wait.</h1></body></html>'));

  const checkServer = () => {
    http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadURL('http://localhost:3000/dashboard');
      } else {
        setTimeout(checkServer, 1000);
      }
    }).on('error', () => {
      setTimeout(checkServer, 1000);
    });
  };

  checkServer();
}

app.whenReady().then(() => {
  const isDev = !app.isPackaged;
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'crm_pipeline.db');

  if (isDev) {
    nextProcess = spawn('npm', ['run', 'dev'], { 
      env: { ...process.env, DB_PATH: dbPath },
      shell: true, 
      stdio: 'inherit' 
    });
  } else {
    // In production, run the standalone server
    const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
    if (fs.existsSync(serverPath)) {
      nextProcess = spawn(process.execPath, [serverPath], { 
        env: { ...process.env, PORT: 3000, NODE_ENV: 'production', DB_PATH: dbPath },
        stdio: 'inherit'
      });
    } else {
      dialog.showErrorBox("Error", "Could not find Next.js server.js at " + serverPath);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) nextProcess.kill();
});
