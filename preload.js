// Preload script for Electron
// This script runs in a privileged context and can expose APIs to the renderer process

const { ipcRenderer } = require("electron");

console.log("Preload script loaded");

// Expose the directory dialog function to the renderer process
window.electronAPI = {
    showDirectoryDialog: () => ipcRenderer.invoke("show-directory-dialog"),
};

// Since nodeIntegration is true and contextIsolation is false,
// the renderer process already has access to Node.js APIs
// This file can be used to expose additional APIs if needed in the future
