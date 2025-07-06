import { useState, useEffect } from "react";
import {
    AppBar,
    Tabs,
    Tab,
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    Snackbar,
    Alert,
    Fab,
    Modal,
    IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";

import UnitCrud from "./Tabs/UnitCrud";
import ItemCrud from "./Tabs/ItemCrud";
import BuildingCrud from "./Tabs/BuildingCrud";
import RecipeCrud from "./Tabs/RecipeCrud";
import RecipeChainVisualizer from "./Tabs/RecipeChainVisualizer";
import TodoTab from "./Tabs/TodoTab";
import {
    loadGameData,
    saveUnits,
    saveItems,
    saveBuildings,
    saveRecipes,
    getLastSaveTime,
    startAutoFileWatcher,
    getCurrentDataDirectory,
    type GameData,
} from "./autoFileSync";
import type { Unit, Item, Building, Recipe } from "./types";
import "./App.css";

function App() {
    const [tab, setTab] = useState(0);
    const [units, setUnits] = useState<Unit[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

    const [currentDataDirectory, setCurrentDataDirectory] =
        useState<string>("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [syncModalOpen, setSyncModalOpen] = useState(false);

    // Load data on startup and start auto-sync
    useEffect(() => {
        const initializeData = async () => {
            const data = await loadGameData();
            setUnits(data.units);
            setItems(data.items);
            setBuildings(data.buildings);
            setRecipes(data.recipes);
            setLastSaveTime(getLastSaveTime());
            setCurrentDataDirectory(getCurrentDataDirectory());
            console.log("📂 Data loaded automatically from files");
        };

        initializeData();

        // Start automatic file watching
        const stopWatching = startAutoFileWatcher((newData: GameData) => {
            console.log("📂 External file changes detected, updating UI...");
            setUnits(newData.units);
            setItems(newData.items);
            setBuildings(newData.buildings);
            setRecipes(newData.recipes);
            setLastSaveTime(getLastSaveTime());
        });

        // Cleanup on unmount
        return stopWatching;
    }, []);

    // Keyboard shortcuts for tab navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "F1":
                    e.preventDefault();
                    setTab(0);
                    break;
                case "F2":
                    e.preventDefault();
                    setTab(1);
                    break;
                case "F3":
                    e.preventDefault();
                    setTab(2);
                    break;
                case "F4":
                    e.preventDefault();
                    setTab(3);
                    break;
                case "F5":
                    e.preventDefault();
                    setTab(4);
                    break;
                case "F6":
                    e.preventDefault();
                    setTab(5);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Auto-save functions that immediately persist to files
    const setUnitsWithSave = (
        newUnits: Unit[] | ((prev: Unit[]) => Unit[])
    ) => {
        setUnits((prev) => {
            const updated =
                typeof newUnits === "function" ? newUnits(prev) : newUnits;
            saveUnits(updated);
            setLastSaveTime(new Date());
            console.log("💾 Units auto-saved");
            return updated;
        });
    };

    const setItemsWithSave = (
        newItems: Item[] | ((prev: Item[]) => Item[])
    ) => {
        setItems((prev) => {
            const updated =
                typeof newItems === "function" ? newItems(prev) : newItems;
            saveItems(updated);
            setLastSaveTime(new Date());
            console.log("💾 Items auto-saved");
            return updated;
        });
    };

    const setBuildingsWithSave = (
        newBuildings: Building[] | ((prev: Building[]) => Building[])
    ) => {
        setBuildings((prev) => {
            const updated =
                typeof newBuildings === "function"
                    ? newBuildings(prev)
                    : newBuildings;
            saveBuildings(updated);
            setLastSaveTime(new Date());
            console.log("💾 Buildings auto-saved");
            return updated;
        });
    };

    const setRecipesWithSave = (
        newRecipes: Recipe[] | ((prev: Recipe[]) => Recipe[])
    ) => {
        setRecipes((prev) => {
            const updated =
                typeof newRecipes === "function"
                    ? newRecipes(prev)
                    : newRecipes;
            saveRecipes(updated);
            setLastSaveTime(new Date());
            console.log("💾 Recipes auto-saved");
            return updated;
        });
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                py: 2,
                px: 3,
                width: "100%",
                maxWidth: "none",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
            }}
        >
            {/* Title and Subtitle */}
            <Box
                sx={{
                    textAlign: "center",
                    mb: 4,
                    p: 3,
                    background:
                        "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                    borderRadius: 2,
                    color: "white",
                    boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                }}
            >
                <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                        fontWeight: "bold",
                        mb: 1,
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                >
                    🪐 Saturn Recipe Editor
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        opacity: 0.9,
                        fontWeight: 300,
                    }}
                >
                    Manage game data with automatic synchronization
                </Typography>
            </Box>

            <AppBar
                position="static"
                sx={{
                    mb: 2,
                    borderRadius: 1,
                    background:
                        "linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)",
                    boxShadow: "0 3px 5px 2px rgba(255, 107, 107, .3)",
                }}
            >
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="fullWidth"
                    sx={{
                        "& .MuiTab-root": {
                            color: "rgba(255, 255, 255, 0.8)",
                            fontWeight: "bold",
                            flex: 1,
                            minWidth: "auto",
                            "&.Mui-selected": {
                                color: "white",
                            },
                        },
                        "& .MuiTabs-indicator": {
                            backgroundColor: "white",
                            height: 3,
                        },
                        "& .MuiTabs-flexContainer": {
                            justifyContent: "space-between",
                            width: "100%",
                        },
                    }}
                >
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                📏 Units
                                <Box className="keyboard-chiclet">F1</Box>
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                🌭 Items
                                <Box className="keyboard-chiclet">F2</Box>
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                🏭 Buildings
                                <Box className="keyboard-chiclet">F3</Box>
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                ⚗️ Recipes
                                <Box className="keyboard-chiclet">F4</Box>
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                🔗 Recipe Chain
                                <Box className="keyboard-chiclet">F5</Box>
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box
                                className="tab-label-container"
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                📋 Todo
                                <Box className="keyboard-chiclet">F6</Box>
                            </Box>
                        }
                    />
                </Tabs>
            </AppBar>

            {/* Content area with responsive height */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: "500px",
                    height: "100%",
                    overflow: "auto",
                    border: "2px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {tab === 0 && (
                    <UnitCrud
                        key={`units-${tab}`}
                        units={units}
                        setUnits={setUnitsWithSave}
                    />
                )}
                {tab === 1 && (
                    <ItemCrud
                        key={`items-${tab}`}
                        items={items}
                        setItems={setItemsWithSave}
                        units={units}
                    />
                )}
                {tab === 2 && (
                    <BuildingCrud
                        key={`buildings-${tab}`}
                        buildings={buildings}
                        setBuildings={setBuildingsWithSave}
                        items={items}
                        units={units}
                    />
                )}
                {tab === 3 && (
                    <RecipeCrud
                        key={`recipes-${tab}`}
                        recipes={recipes}
                        setRecipes={setRecipesWithSave}
                        buildings={buildings}
                        items={items}
                        units={units}
                    />
                )}
                {tab === 4 && (
                    <RecipeChainVisualizer
                        key={`visualizer-${tab}`}
                        recipes={recipes}
                        buildings={buildings}
                        items={items}
                        units={units}
                    />
                )}
                {tab === 5 && (
                    <TodoTab
                        key={`todo-${tab}`}
                        items={items}
                        recipes={recipes}
                    />
                )}
            </Box>

            {/* Floating Sync Info Button */}
            <Fab
                color="primary"
                size="small"
                onClick={() => setSyncModalOpen(true)}
                sx={{
                    position: "fixed",
                    top: 16,
                    right: 16,
                    zIndex: 1000,
                    bgcolor: "rgba(76, 205, 196, 0.9)",
                    "&:hover": {
                        bgcolor: "rgba(76, 205, 196, 1)",
                    },
                }}
            >
                <InfoIcon />
            </Fab>

            {/* Sync Status Modal */}
            <Modal
                open={syncModalOpen}
                onClose={() => setSyncModalOpen(false)}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Paper
                    sx={{
                        p: 3,
                        minWidth: 400,
                        maxWidth: 600,
                        bgcolor: "rgba(40, 40, 40, 0.95)",
                        color: "white",
                        borderRadius: 2,
                        border: "1px solid rgba(76, 205, 196, 0.3)",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{ color: "rgba(76, 205, 196, 1)" }}
                        >
                            🔄 Auto-Sync Status
                        </Typography>
                        <IconButton
                            onClick={() => setSyncModalOpen(false)}
                            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                            >
                                Data Directory:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontFamily: "monospace" }}
                            >
                                📁 {currentDataDirectory || "./data"}/*.json
                            </Typography>
                        </Box>

                        <Box>
                            <Typography
                                variant="body2"
                                sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                            >
                                Last Save:
                            </Typography>
                            <Typography variant="body1">
                                {lastSaveTime
                                    ? `💾 ${lastSaveTime.toLocaleString()}`
                                    : "✅ Ready for auto-save"}
                            </Typography>
                        </Box>

                        <Chip
                            label="Auto-sync Active"
                            sx={{
                                bgcolor: "rgba(76, 205, 196, 0.2)",
                                color: "rgba(76, 205, 196, 1)",
                                fontWeight: "bold",
                                alignSelf: "flex-start",
                            }}
                        />
                    </Box>
                </Paper>
            </Modal>

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity="success"
                    variant="filled"
                >
                    Data saved successfully!
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default App;
