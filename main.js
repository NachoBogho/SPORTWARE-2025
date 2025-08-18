const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Mantener una referencia global del objeto window
let mainWindow;

// Variable para almacenar el estado de activación
let isActivated = false;

// Función para verificar si el software está activado
function checkActivation() {
  try {
    // Verificar si existe el archivo de licencia
    const licenseFile = path.join(app.getPath('userData'), 'license.json');
    if (fs.existsSync(licenseFile)) {
      const licenseData = JSON.parse(fs.readFileSync(licenseFile, 'utf8'));
      isActivated = licenseData.activated;
      return isActivated;
    }
    return false;
  } catch (error) {
    console.error('Error al verificar la licencia:', error);
    return false;
  }
}

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  // Verificar si el software está activado
  isActivated = checkActivation();

  // Cargar la URL de la aplicación
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'frontend/dist/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Enviar el estado de activación a la ventana de React
    mainWindow.webContents.send('activation-status', isActivated);
  });

  // Emitido cuando la ventana es cerrada
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  // En macOS es común para las aplicaciones y sus barras de menú
  // que estén activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // En macOS es común volver a crear una ventana en la aplicación cuando el
  // icono del dock es clicado y no hay otras ventanas abiertas.
  if (mainWindow === null) createWindow();
});

// Manejar la activación del software
ipcMain.handle('activate-software', async (event, licenseKey) => {
  // Aquí implementarías la lógica real de validación de licencia
  // Esta es una implementación simple para demostración
  const validKeys = ['SPORTWARE-2025-PREMIUM', 'SPORTWARE-2025-BASIC'];
  
  if (validKeys.includes(licenseKey)) {
    isActivated = true;
    
    // Guardar el estado de activación
    const licenseFile = path.join(app.getPath('userData'), 'license.json');
    fs.writeFileSync(licenseFile, JSON.stringify({ activated: true, key: licenseKey }));
    
    return { success: true, message: 'Software activado correctamente' };
  } else {
    return { success: false, message: 'Clave de licencia inválida' };
  }
});

// Verificar el estado de activación
ipcMain.handle('check-activation', async () => {
  return { activated: isActivated };
});

// Iniciar el servidor backend
require('./backend/server.js');