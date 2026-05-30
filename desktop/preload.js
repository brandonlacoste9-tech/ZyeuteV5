/**
 * ZYEUTÉ DESKTOP - Preload Script
 * Safe bridge between main and renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Video upload
  selectVideo: () => ipcRenderer.invoke('select-video'),
  selectMultipleVideos: () => ipcRenderer.invoke('select-multiple-videos'),
  getVideoInfo: (filePath) => ipcRenderer.invoke('get-video-info', filePath),
  
  // Menu events
  onMenuUploadVideo: (callback) => ipcRenderer.on('menu-upload-video', callback),
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

// Expose app info
contextBridge.exposeInMainWorld('appInfo', {
  version: '1.0.0',
  platform: process.platform,
});
