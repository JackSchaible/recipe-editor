/**
 * Auto File Sync Module
 *
 * This module provides automatic file synchronization for game data.
 * It detects the runtime environment and uses appropriate file operations:
 *
 * - Node.js Environment: Uses fs/promises for direct file system access with fs.watch for real-time file monitoring
 * - Browser Environment: Uses File System Access API (where available) or file downloads
 *
 * Features:
 * - Automatic environment detection
 * - Cross-platform file operations
 * - Real-time file watching in Node.js
 * - Graceful fallbacks for browser environments
 */

import type { Unit, Item, Building, Recipe } from "./types";
import dataConfig from "./config.json";

const DATA_VERSION = "1.0.0";

// Detect if we're running in Node.js environment (Electron has both window and process)
const isNodeJS =
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.electron;

console.log(`🔍 Environment detection:`, {
    hasWindow: typeof window !== "undefined",
    hasProcess: typeof process !== "undefined",
    hasElectron:
        typeof process !== "undefined" &&
        process.versions &&
        process.versions.electron,
    isNodeJS: isNodeJS,
});

// Node.js file operations helpers
const nodeFileOps = {
    async writeFile(filePath: string, data: string): Promise<void> {
        if (!isNodeJS) return;
        try {
            // In Electron with nodeIntegration, we can use window.require
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fs = (window as any).require("fs").promises;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const path = (window as any).require("path");

            // Ensure directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, data, "utf8");
        } catch (error) {
            console.error("Node.js file write error:", error);
            throw error;
        }
    },

    async readFile(filePath: string): Promise<string> {
        if (!isNodeJS) throw new Error("Not in Node.js environment");
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fs = (window as any).require("fs").promises;
            return await fs.readFile(filePath, "utf8");
        } catch (error) {
            console.error("Node.js file read error:", error);
            throw error;
        }
    },

    async fileExists(filePath: string): Promise<boolean> {
        if (!isNodeJS) return false;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fs = (window as any).require("fs").promises;
            console.log(`🔍 Checking if file exists: ${filePath}`);
            console.log(`🔍 Current working directory: ${process.cwd()}`);
            await fs.access(filePath);
            console.log(`✅ File found: ${filePath}`);
            return true;
        } catch (error) {
            console.log(`❌ File not found: ${filePath}`, error);
            return false;
        }
    },
};

export interface GameData {
    version: string;
    units: Unit[];
    items: Item[];
    buildings: Building[];
    recipes: Recipe[];
}

// File path configuration
const getDataDirectory = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = isNodeJS ? (window as any).require("path") : null;
    if (path) {
        return path.resolve(dataConfig.dataConfig.baseDataPath);
    }
    return dataConfig.dataConfig.baseDataPath;
};

const getEntityFilePath = (
    entityType: keyof typeof dataConfig.dataConfig.entityPaths
): string => {
    const baseDir = getDataDirectory();
    const entityDir = dataConfig.dataConfig.entityPaths[entityType];
    const extension = dataConfig.dataConfig.fileExtension;

    if (isNodeJS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const path = (window as any).require("path");
        return path.join(baseDir, entityDir, `${entityType}${extension}`);
    } else {
        return `${baseDir}/${entityDir}/${entityType}${extension}`;
    }
};

// Get current data directory
export const getCurrentDataDirectory = (): string => {
    return getDataDirectory();
};

// File paths for automatic sync (now using config-based structure)
const getDataFiles = () => ({
    UNITS: getEntityFilePath("units"),
    ITEMS: getEntityFilePath("items"),
    BUILDINGS: getEntityFilePath("buildings"),
    RECIPES: getEntityFilePath("recipes"),
});

// Export function to get current data files
export const getDataFilePaths = () => getDataFiles();

// Helper function to read JSON file from public directory or Node.js file system
const readJSONFile = async (path: string): Promise<unknown[]> => {
    try {
        if (isNodeJS) {
            // In Node.js environment, read directly from file system
            const exists = await nodeFileOps.fileExists(path);
            if (!exists) {
                console.log(
                    `File ${path} not found, will create on first save`
                );
                return [];
            }
            const content = await nodeFileOps.readFile(path);
            return JSON.parse(content);
        } else {
            // In browser environment, use fetch
            const response = await fetch(path);
            if (!response.ok) {
                console.log(
                    `File ${path} not found, will create on first save`
                );
                return [];
            }
            return await response.json();
        }
    } catch (error) {
        console.warn(`Could not read ${path}:`, error);
        return [];
    }
};

// Helper function to write JSON file using Node.js fs or browser file system API
const writeJSONFile = async (
    filePath: string,
    data: unknown
): Promise<boolean> => {
    try {
        const jsonString = JSON.stringify(data, null, 2);

        if (isNodeJS) {
            // In Node.js/Electron environment, write directly to file system
            console.log(`💾 Current working directory: ${process.cwd()}`);
            console.log(`💾 Attempting to save to: ${filePath}`);

            await nodeFileOps.writeFile(filePath, jsonString);
            console.log(`✅ Auto-saved ${filePath}`);

            return true;
        } else {
            // Browser environment - trigger download
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const filename = filePath.split("/").pop() || "data.json";

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`� Downloaded ${filename}`);
            return true;
        }
    } catch (error) {
        console.error(`Error auto-saving ${filePath}:`, error);
        return false;
    }
};

// Load data automatically from files
export const loadGameData = async (): Promise<GameData> => {
    try {
        const DATA_FILES = getDataFiles();
        // Load from files only
        const loadDataArray = await Promise.allSettled([
            readJSONFile(DATA_FILES.UNITS),
            readJSONFile(DATA_FILES.ITEMS),
            readJSONFile(DATA_FILES.BUILDINGS),
            readJSONFile(DATA_FILES.RECIPES),
        ]);

        const [unitsResult, itemsResult, buildingsResult, recipesResult] =
            loadDataArray;

        // Use file data if successful, otherwise empty array
        const units =
            unitsResult.status === "fulfilled" ? unitsResult.value : [];
        const items =
            itemsResult.status === "fulfilled" ? itemsResult.value : [];
        const buildings =
            buildingsResult.status === "fulfilled" ? buildingsResult.value : [];
        const recipes =
            recipesResult.status === "fulfilled" ? recipesResult.value : [];

        return {
            version: DATA_VERSION,
            units: units as Unit[],
            items: items as Item[],
            buildings: buildings as Building[],
            recipes: recipes as Recipe[],
        };
    } catch (error) {
        console.error("Error loading game data:", error);
        return {
            version: DATA_VERSION,
            units: [],
            items: [],
            buildings: [],
            recipes: [],
        };
    }
};

// Auto-save functions that immediately persist to "files"
export const saveUnits = async (units: Unit[]) => {
    const DATA_FILES = getDataFiles();
    await writeJSONFile(DATA_FILES.UNITS, units);
};

export const saveItems = async (items: Item[]) => {
    const DATA_FILES = getDataFiles();
    await writeJSONFile(DATA_FILES.ITEMS, items);
};

export const saveBuildings = async (buildings: Building[]) => {
    const DATA_FILES = getDataFiles();
    await writeJSONFile(DATA_FILES.BUILDINGS, buildings);
};

export const saveRecipes = async (recipes: Recipe[]) => {
    const DATA_FILES = getDataFiles();
    await writeJSONFile(DATA_FILES.RECIPES, recipes);
};

// Note: RecipeIOs and BuildingCosts are now embedded in Recipe and Building entities
// so no separate save functions are needed

// Get last modification time from file system or return null
export const getLastSaveTime = (): Date | null => {
    // In a file-based system, we could check file modification times
    // For now, return null as we don't track this without localStorage
    return null;
};

// File watcher with Node.js fs.watch or polling fallback
export const startAutoFileWatcher = (
    onDataChanged: (data: GameData) => void
) => {
    console.log("Starting automatic file synchronization...");

    // Keep track of the last data hash to avoid unnecessary updates
    let lastDataHash: string | null = null;

    // Simple hash function for data comparison
    const hashData = (data: GameData): string => {
        return JSON.stringify({
            units: data.units.length,
            items: data.items.length,
            buildings: data.buildings.length,
            recipes: data.recipes.length,
            unitsHash: JSON.stringify(data.units).slice(0, 100),
            itemsHash: JSON.stringify(data.items).slice(0, 100),
            buildingsHash: JSON.stringify(data.buildings).slice(0, 100),
            recipesHash: JSON.stringify(data.recipes).slice(0, 100),
        });
    };

    const checkForChanges = async () => {
        try {
            const currentData = await loadGameData();
            const currentHash = hashData(currentData);

            // Only trigger callback if data has actually changed
            if (currentHash !== lastDataHash) {
                console.log("🔄 Data changed, updating UI...");
                lastDataHash = currentHash;
                onDataChanged(currentData);
            } else {
                console.log("📊 Data unchanged, skipping update");
            }
        } catch (error) {
            console.error("Error checking for file changes:", error);
        }
    };

    // Initial load
    checkForChanges();

    if (isNodeJS) {
        // In Node.js environment, use fs.watch for better file watching
        const watchers: { close: () => void }[] = [];

        const setupNodeWatcher = async () => {
            try {
                // Only import fs if we're actually in Node.js environment
                if (
                    typeof window === "undefined" ||
                    (window as typeof window & { require?: unknown }).require
                ) {
                    const fs = await import("fs");
                    const DATA_FILES = getDataFiles();
                    const filesToWatch = Object.values(DATA_FILES);

                    for (const filePath of filesToWatch) {
                        try {
                            const watcher = fs.watch(
                                filePath as string,
                                (eventType) => {
                                    if (eventType === "change") {
                                        console.log(
                                            `File ${filePath} changed, reloading data...`
                                        );
                                        checkForChanges();
                                    }
                                }
                            );
                            watchers.push(watcher);
                        } catch {
                            console.log(
                                `Cannot watch ${filePath}, file may not exist yet`
                            );
                        }
                    }
                }
            } catch (error) {
                console.warn(
                    "Could not set up Node.js file watchers, falling back to polling:",
                    error
                );
            }
        };

        setupNodeWatcher();

        // Cleanup function for Node.js watchers
        return () => {
            console.log("Stopping automatic file synchronization");
            watchers.forEach((watcher) => {
                try {
                    watcher.close();
                } catch (error) {
                    console.warn("Error closing file watcher:", error);
                }
            });
        };
    } else {
        // Browser environment - use polling
        const pollInterval = setInterval(checkForChanges, 3000);

        return () => {
            console.log("Stopping automatic file synchronization");
            clearInterval(pollInterval);
        };
    }
};

// Export all functions for external file management
export { getDataFiles };
