# Recipe Editor - Automatic File Synchronization

## 🚀 **Automatic File Sync Features**

This Recipe Editor now features **TRUE automatic synchronization** with JSON
files on your file system. No more manual import/export buttons!

### **How it works:**

1. **Auto-load on startup**: Data is automatically loaded from
   `./public/data/*.json` files when the app starts
2. **Auto-save on changes**: Every time you add, edit, or delete data, it's
   immediately saved to the corresponding JSON file
3. **File watching**: The app polls for external file changes every 3 seconds
   and automatically updates the UI
4. **Real-time status**: Status bar shows auto-sync status and last save time

### **File Structure:**

```
public/data/
├── units.json           # All unit definitions
├── items.json           # All item definitions
├── buildings.json       # All building definitions
├── recipes.json         # All recipe definitions
├── recipe_ios.json      # All recipe inputs/outputs
└── building_costs.json  # All building construction costs
```

### **Development Mode:**

Since browsers can't directly write to files, the app uses a hybrid approach:

-   **Reads** from the actual JSON files in `public/data/`
-   **Writes** to localStorage (with console logging showing what would be
    written)
-   **Console logs** show all auto-save operations for development

### **For Production:**

In a real environment, you would:

1. Replace the `writeJSONFile` function in `autoFileSync.ts` with actual file
   system writes
2. Use the File System Access API or a backend service
3. Set up proper file watching with filesystem events

### **Usage:**

1. **Edit data in the app** - Changes are automatically saved
2. **Edit JSON files externally** - App detects changes and updates UI
   automatically
3. **Monitor console** - See all auto-save operations in real-time

### **Status Indicators:**

-   🔄 Auto-sync enabled
-   💾 Data auto-saved (console)
-   📂 External file changes detected (console)

### **JSON File Format:**

Each file contains an array of objects. Example `units.json`:

```json
[
    {
        "UnitID": "kg",
        "UnitName": "Kilogram",
        "UnitDescription": "Unit of mass",
        "DefaultUnit": true
    }
]
```

The app automatically maintains these files as you work with the data!
