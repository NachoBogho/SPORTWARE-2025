// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer funcionalidades protegidas a la ventana del navegador
contextBridge.exposeInMainWorld('electron', {
  activateSoftware: (licenseKey) => ipcRenderer.invoke('activate-software', licenseKey),
  checkActivation: () => ipcRenderer.invoke('check-activation'),
  receive: (channel, func) => {
    const validChannels = ['activation-status'];
    if (validChannels.includes(channel)) {
      // Eliminar el listener anterior para evitar duplicados
      ipcRenderer.removeAllListeners(channel);
      // Añadir un nuevo listener
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});