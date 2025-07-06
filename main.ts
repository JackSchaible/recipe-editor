import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Saturn Recipe Editor",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true, // this gives your frontend access to Node APIs
            contextIsolation: false,
        },
    });

    // Load your Vite build (you'll build your app with `vite build`)
    win.loadFile("dist/index.html");

    // Open DevTools for debugging
    //win.webContents.openDevTools();

    // Log when page finishes loading
    win.webContents.on("did-finish-load", () => {
        console.log("Page finished loading");
    });

    // Log any console messages from the renderer
    win.webContents.on("console-message", (event, level, message) => {
        console.log(`Renderer console [${level}]:`, message);
    });

    return win;
}

// IPC handler for directory selection
ipcMain.handle("show-directory-dialog", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Choose Data Directory",
        message: "Select a folder to save/load your recipe data",
    });

    return result;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
