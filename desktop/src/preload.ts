import { contextBridge } from 'electron';

// Exponer APIs seguras aquí si se necesitan en el futuro
contextBridge.exposeInMainWorld('api', {
  // ejemplo: ping: () => ipcRenderer.invoke('ping')
});
