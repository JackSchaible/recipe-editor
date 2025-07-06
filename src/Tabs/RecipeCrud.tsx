import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, Button, Paper, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Recipe, Building, Item, Unit } from "../types";
import { generateId, getExistingIds } from "../utils";
import KeyboardIndicator from "../components/KeyboardIndicator";
import ItemSelector from "../components/ItemSelector";
import DataGrid from "../components/DataGrid";
import "./RecipeCrud.css";

export default function RecipeCrud({
    recipes,
    setRecipes,
    buildings,
    items,
    units,
}: {
    recipes: Recipe[];
    setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
    buildings: Building[];
    items: Item[];
    units: Unit[];
}) {
    const [form, setForm] = useState<Omit<Recipe, "RecipeID">>({
        RecipeName: "",
        RecipeDescription: "",
        Power: 0,
        Water: 0,
        Time: 0,
        BuildingID: 0,
        Inputs: [],
        Outputs: [],
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const secondInputRef = useRef<HTMLTextAreaElement>(null);
    const thirdInputRef = useRef<HTMLInputElement>(null);
    const fourthInputRef = useRef<HTMLInputElement>(null);
    const fifthInputRef = useRef<HTMLInputElement>(null);
    const sixthInputRef = useRef<HTMLSelectElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Refs for input/output form controls
    const inputItemSelectorRef = useRef<HTMLInputElement>(null);
    const inputAmountRef = useRef<HTMLInputElement>(null);
    const outputItemSelectorRef = useRef<HTMLInputElement>(null);
    const outputAmountRef = useRef<HTMLInputElement>(null);

    // Temporary I/O for the recipe being created/edited
    const [tempInputs, setTempInputs] = useState<Recipe["Inputs"]>([]);
    const [tempOutputs, setTempOutputs] = useState<Recipe["Outputs"]>([]);
    const [expandedRecipe, setExpandedRecipe] = useState<number | false>(false);

    // Track which form field is currently focused
    const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(
        null
    );

    // Track if any form field is focused (for showing down arrow indicator)
    const [isFormFocused, setIsFormFocused] = useState(false);

    // Auto-focus first field when component mounts or tab changes
    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
            setFocusedFieldIndex(0);
            setIsFormFocused(true);
        }
    }, []);

    // Track focus and blur events for form fields
    const handleFieldFocus = (index: number) => {
        setFocusedFieldIndex(index);
        setIsFormFocused(true);
    };

    const handleFieldBlur = () => {
        setFocusedFieldIndex(null);
        setIsFormFocused(false);
    };

    const handleDelete = useCallback(
        (idx: number) => {
            setRecipes((recipes) => recipes.filter((_, i) => i !== idx));
            if (editIndex === idx) setEditIndex(null);
            if (selectedIndex === idx) setSelectedIndex(null);
        },
        [editIndex, selectedIndex, setRecipes]
    );

    // Input/Output form states
    const [inputForm, setInputForm] = useState({
        ItemID: 0,
        Amount: 0,
    });
    const [outputForm, setOutputForm] = useState({
        ItemID: 0,
        Amount: 0,
    });

    // State for time input display
    const [timeInputDisplay, setTimeInputDisplay] = useState("");

    const addInput = useCallback(() => {
        if (inputForm.ItemID === 0 || inputForm.Amount <= 0) return;

        // Check for duplicate item
        const isDuplicate = tempInputs.some(
            (input) => input.ItemID === inputForm.ItemID
        );
        if (isDuplicate) {
            return; // Don't add duplicate items
        }

        setTempInputs((inputs) => [...inputs, { ...inputForm }]);
        setInputForm({ ItemID: 0, Amount: 0 });
        // Auto-focus the input item selector after adding
        setTimeout(() => {
            if (inputItemSelectorRef.current) {
                inputItemSelectorRef.current.focus();
            }
        }, 0);
    }, [inputForm, tempInputs, setTempInputs, setInputForm]);

    const addOutput = useCallback(() => {
        if (outputForm.ItemID === 0 || outputForm.Amount <= 0) return;

        // Check for duplicate item
        const isDuplicate = tempOutputs.some(
            (output) => output.ItemID === outputForm.ItemID
        );
        if (isDuplicate) {
            return; // Don't add duplicate items
        }

        setTempOutputs((outputs) => [...outputs, { ...outputForm }]);
        setOutputForm({ ItemID: 0, Amount: 0 });
        // Auto-focus the output item selector after adding
        setTimeout(() => {
            if (outputItemSelectorRef.current) {
                outputItemSelectorRef.current.focus();
            }
        }, 0);
    }, [outputForm, tempOutputs, setTempOutputs, setOutputForm]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab navigation through form fields
            if (e.key === "Tab" && !e.shiftKey) {
                const activeElement = document.activeElement as HTMLElement;
                const isInMainForm =
                    activeElement === firstInputRef.current ||
                    activeElement === secondInputRef.current ||
                    activeElement === thirdInputRef.current ||
                    activeElement === fourthInputRef.current ||
                    activeElement === fifthInputRef.current ||
                    activeElement === sixthInputRef.current;

                const isInInputForm =
                    activeElement === inputItemSelectorRef.current ||
                    activeElement === inputAmountRef.current;

                const isInOutputForm =
                    activeElement === outputItemSelectorRef.current ||
                    activeElement === outputAmountRef.current;

                if (isInMainForm || isInInputForm || isInOutputForm) {
                    e.preventDefault();
                    // Main form tab order: Name -> Building -> Power -> Water -> Time -> Description -> Input Item
                    if (activeElement === firstInputRef.current) {
                        sixthInputRef.current?.focus();
                        setFocusedFieldIndex(1);
                    } else if (activeElement === sixthInputRef.current) {
                        thirdInputRef.current?.focus();
                        setFocusedFieldIndex(2);
                    } else if (activeElement === thirdInputRef.current) {
                        fourthInputRef.current?.focus();
                        setFocusedFieldIndex(3);
                    } else if (activeElement === fourthInputRef.current) {
                        fifthInputRef.current?.focus();
                        setFocusedFieldIndex(4);
                    } else if (activeElement === fifthInputRef.current) {
                        secondInputRef.current?.focus();
                        setFocusedFieldIndex(5);
                    } else if (activeElement === secondInputRef.current) {
                        // Move from Description to Input Item Selector
                        inputItemSelectorRef.current?.focus();
                        setFocusedFieldIndex(null);
                        setIsFormFocused(false);
                    } else if (activeElement === inputItemSelectorRef.current) {
                        // Input Item -> Input Amount
                        inputAmountRef.current?.focus();
                    } else if (activeElement === inputAmountRef.current) {
                        // Input Amount -> Output Item
                        outputItemSelectorRef.current?.focus();
                    } else if (
                        activeElement === outputItemSelectorRef.current
                    ) {
                        // Output Item -> Output Amount
                        outputAmountRef.current?.focus();
                    } else if (activeElement === outputAmountRef.current) {
                        // Output Amount -> back to Input Item (cycle)
                        inputItemSelectorRef.current?.focus();
                    }

                    if (isInMainForm) {
                        setIsFormFocused(true);
                    }
                }
            }
            // Shift+Enter to submit input/output
            else if (e.shiftKey && e.key === "Enter") {
                const activeElement = document.activeElement as HTMLElement;
                if (
                    activeElement === inputItemSelectorRef.current ||
                    activeElement === inputAmountRef.current
                ) {
                    e.preventDefault();
                    addInput();
                } else if (
                    activeElement === outputItemSelectorRef.current ||
                    activeElement === outputAmountRef.current
                ) {
                    e.preventDefault();
                    addOutput();
                }
            }
            // Ctrl+Enter to submit form
            else if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                if (formRef.current) {
                    formRef.current.requestSubmit();
                }
            }
            // Delete key to delete selected row
            else if (e.key === "Delete" && selectedIndex !== null) {
                e.preventDefault();
                handleDelete(selectedIndex);
            }
            // Arrow keys for navigation through list entries and form
            else if (
                e.key === "ArrowDown" &&
                !e.ctrlKey &&
                !e.shiftKey &&
                recipes.length > 0
            ) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

                // Don't interfere with autocomplete dropdown navigation
                if (activeElement?.getAttribute("role") === "combobox") {
                    return; // Let the autocomplete handle its own arrow key navigation
                }

                // Don't interfere with native select dropdown navigation
                if (activeElement?.tagName === "SELECT") {
                    return; // Let the select handle its own arrow key navigation
                }

                // Check if any autocomplete dropdown is open
                const hasOpenDropdown =
                    document.querySelector('[role="listbox"]') !== null;
                if (hasOpenDropdown) {
                    return; // Don't navigate away if a dropdown is open
                }

                if (isInForm) {
                    // If in form, move to first list item
                    e.preventDefault();
                    setSelectedIndex(0);
                    setExpandedRecipe(0);
                    setIsFormFocused(false);
                    setFocusedFieldIndex(null);
                    activeElement.blur(); // Remove focus from form element
                } else {
                    // If in list or outside form, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const newIndex =
                            prev === null
                                ? 0
                                : Math.min(prev + 1, recipes.length - 1);
                        setExpandedRecipe(newIndex);
                        return newIndex;
                    });
                }
            } else if (e.key === "ArrowUp" && !e.ctrlKey && !e.shiftKey) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

                // Don't interfere with autocomplete dropdown navigation
                if (activeElement?.getAttribute("role") === "combobox") {
                    return; // Let the autocomplete handle its own arrow key navigation
                }

                // Don't interfere with native select dropdown navigation
                if (activeElement?.tagName === "SELECT") {
                    return; // Let the select handle its own arrow key navigation
                }

                // Check if any autocomplete dropdown is open
                const hasOpenDropdown =
                    document.querySelector('[role="listbox"]') !== null;
                if (hasOpenDropdown) {
                    return; // Don't navigate away if a dropdown is open
                }

                if (!isInForm && selectedIndex === 0) {
                    // If on first list item, move to form
                    e.preventDefault();
                    setSelectedIndex(null);
                    setExpandedRecipe(false);
                    setIsFormFocused(true);
                    setFocusedFieldIndex(0);
                    if (firstInputRef.current) {
                        firstInputRef.current.focus();
                    }
                } else if (!isInForm && recipes.length > 0) {
                    // If in list, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) => {
                        const newIndex =
                            prev === null
                                ? recipes.length - 1
                                : Math.max(prev - 1, 0);
                        setExpandedRecipe(newIndex);
                        return newIndex;
                    });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, recipes.length, handleDelete, addInput, addOutput]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({
            ...f,
            [name]: ["Power", "Water", "BuildingID"].includes(name)
                ? Number(value)
                : value,
        }));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setTimeInputDisplay(value);

        // Convert the time string to seconds and update the form
        const seconds = parseTimeString(value);
        setForm((f) => ({
            ...f,
            Time: seconds,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.RecipeName || form.BuildingID === 0) return;

        if (editIndex !== null) {
            // Editing existing recipe
            const existingRecipeId = recipes[editIndex].RecipeID;
            setRecipes((recipes) =>
                recipes.map((r, i) =>
                    i === editIndex
                        ? {
                              ...form,
                              RecipeID: existingRecipeId,
                              Inputs: tempInputs,
                              Outputs: tempOutputs,
                          }
                        : r
                )
            );
            setEditIndex(null);
        } else {
            // Adding new recipe
            const existingIds = getExistingIds(recipes, "RecipeID");
            const newId = generateId(form.RecipeName, existingIds);
            setRecipes((recipes) => [
                ...recipes,
                {
                    ...form,
                    RecipeID: newId,
                    Inputs: tempInputs,
                    Outputs: tempOutputs,
                },
            ]);
        }

        // Reset form and temporary I/O
        setForm({
            RecipeName: "",
            RecipeDescription: "",
            Power: 0,
            Water: 0,
            Time: 0,
            BuildingID: 0,
            Inputs: [],
            Outputs: [],
        });
        setTempInputs([]);
        setTempOutputs([]);
        setTimeInputDisplay("");
        setSelectedIndex(null);
        setExpandedRecipe(false);
        setFocusedFieldIndex(0);
        setIsFormFocused(true);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const handleEdit = (idx: number) => {
        const { ...formData } = recipes[idx];
        setForm(formData);
        setEditIndex(idx);
        setTempInputs([...recipes[idx].Inputs]);
        setTempOutputs([...recipes[idx].Outputs]);
        setTimeInputDisplay(formatTimeForDisplay(recipes[idx].Time));
        setSelectedIndex(idx);
        setExpandedRecipe(idx);
    };

    const handleCancel = () => {
        setForm({
            RecipeName: "",
            RecipeDescription: "",
            Power: 0,
            Water: 0,
            Time: 0,
            BuildingID: 0,
            Inputs: [],
            Outputs: [],
        });
        setEditIndex(null);
        setTempInputs([]);
        setTempOutputs([]);
        setTimeInputDisplay("");
    };

    const removeInput = (index: number) => {
        setTempInputs((inputs) => inputs.filter((_, i) => i !== index));
    };

    const removeOutput = (index: number) => {
        setTempOutputs((outputs) => outputs.filter((_, i) => i !== index));
    };

    // Helper function to get unit name for an item
    const getUnitForItem = (itemId: number): string => {
        const item = items.find((item) => item.ItemID === itemId);
        const unit = units.find((unit) => unit.UnitID === item?.UnitID);
        return unit?.DefaultUnit || "units";
    };

    // Helper functions for time conversion
    const parseTimeString = (timeStr: string): number => {
        if (!timeStr.trim()) return 0;

        // If it's just a number, treat as seconds
        if (/^\d+$/.test(timeStr.trim())) {
            return parseInt(timeStr.trim());
        }

        const units = { s: 1, m: 60, h: 3600, d: 86400 };
        let totalSeconds = 0;

        // Match patterns like "1h", "30m", "45s", "2d"
        const matches = timeStr.match(/(\d+)\s*([smhd])/gi);
        if (matches) {
            matches.forEach((match) => {
                const [, value, unit] = match.match(/(\d+)\s*([smhd])/i) || [];
                if (value && unit) {
                    totalSeconds +=
                        parseInt(value) *
                        (units[unit.toLowerCase() as keyof typeof units] || 1);
                }
            });
        }

        return totalSeconds;
    };

    const formatTimeForDisplay = (seconds: number): string => {
        if (seconds === 0) return "";

        const units = [
            { name: "d", value: 86400 },
            { name: "h", value: 3600 },
            { name: "m", value: 60 },
            { name: "s", value: 1 },
        ];

        const parts: string[] = [];
        let remaining = seconds;

        for (const unit of units) {
            if (remaining >= unit.value) {
                const count = Math.floor(remaining / unit.value);
                parts.push(`${count}${unit.name}`);
                remaining %= unit.value;
            }
        }

        return parts.join(" ") || "0s";
    };

    return (
        <Box className="recipe-crud crud-layout">
            <div className="crud-layout__header">
                <Typography
                    variant="h5"
                    className="recipe-crud__title"
                    color="primary.main"
                >
                    🧪 Recipe Management
                </Typography>
            </div>

            {/* Recipe Form */}
            <div className="crud-layout__form">
                <div className="form-container">
                    <Typography
                        variant="h6"
                        className="recipe-crud__form-title"
                    >
                        {editIndex !== null
                            ? "✏️ Edit Recipe"
                            : "➕ Add Recipe"}
                    </Typography>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "16px",
                        }}
                    >
                        <form
                            id="recipe-form"
                            onSubmit={handleSubmit}
                            className="dark-form recipe-crud__form"
                            ref={formRef}
                            style={{
                                position: "relative",
                                flex: 1,
                                display: "block",
                            }}
                        >
                            <div className="primary-form-section">
                                <div className="form-layout__row">
                                    <Box
                                        sx={{
                                            position: "relative",
                                        }}
                                        className="form-field-2-3"
                                    >
                                        <input
                                            name="RecipeName"
                                            placeholder="Name"
                                            value={form.RecipeName}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(0)}
                                            onBlur={handleFieldBlur}
                                            required
                                            className="dark-input form-field-full recipe-crud__name-input"
                                            ref={firstInputRef}
                                        />
                                        {focusedFieldIndex === 0 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>

                                    <Box
                                        sx={{ position: "relative" }}
                                        className="form-field-1-3"
                                    >
                                        <select
                                            name="BuildingID"
                                            value={form.BuildingID}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(1)}
                                            onBlur={handleFieldBlur}
                                            required
                                            className="dark-select form-field-full recipe-crud__building-select"
                                            ref={sixthInputRef}
                                        >
                                            <option value={0}>
                                                Select Building
                                            </option>
                                            {[...buildings]
                                                .sort((a, b) =>
                                                    a.BuildingName.localeCompare(
                                                        b.BuildingName
                                                    )
                                                )
                                                .map((b) => (
                                                    <option
                                                        key={b.BuildingID}
                                                        value={b.BuildingID}
                                                    >
                                                        {b.BuildingName}
                                                    </option>
                                                ))}
                                        </select>
                                        {focusedFieldIndex === 1 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>
                                </div>

                                <div className="form-layout__row">
                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                        className="form-field-1-3"
                                    >
                                        <input
                                            name="Power"
                                            type="number"
                                            placeholder="Power"
                                            value={form.Power || ""}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(2)}
                                            onBlur={handleFieldBlur}
                                            className="dark-input form-field-small recipe-crud__power-input"
                                            ref={thirdInputRef}
                                            style={{ flex: 1 }}
                                        />
                                        <Typography
                                            sx={{
                                                color: "#a0aec0",
                                                fontSize: "12px",
                                                fontWeight: 500,
                                                minWidth: "24px",
                                            }}
                                        >
                                            Wh
                                        </Typography>
                                        {focusedFieldIndex === 2 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>

                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                        className="form-field-1-3"
                                    >
                                        <input
                                            name="Water"
                                            type="number"
                                            placeholder="Water"
                                            value={form.Water || ""}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(3)}
                                            onBlur={handleFieldBlur}
                                            className="dark-input form-field-small recipe-crud__water-input"
                                            ref={fourthInputRef}
                                            style={{ flex: 1 }}
                                        />
                                        <Typography
                                            sx={{
                                                color: "#a0aec0",
                                                fontSize: "12px",
                                                fontWeight: 500,
                                                minWidth: "16px",
                                            }}
                                        >
                                            L
                                        </Typography>
                                        {focusedFieldIndex === 3 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>

                                    <Box
                                        sx={{
                                            position: "relative",
                                        }}
                                        className="form-field-1-3"
                                    >
                                        <input
                                            name="Time"
                                            type="text"
                                            placeholder="Time (ie., 1h 30m)"
                                            value={timeInputDisplay}
                                            onChange={handleTimeChange}
                                            onFocus={() => handleFieldFocus(4)}
                                            onBlur={handleFieldBlur}
                                            className="dark-input form-field-full recipe-crud__time-input"
                                            ref={fifthInputRef}
                                            style={{ flex: 2 }}
                                        />
                                        {focusedFieldIndex === 4 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>
                                </div>

                                <div className="form-layout__row">
                                    <Box
                                        sx={{
                                            position: "relative",
                                        }}
                                        className="form-field-full"
                                    >
                                        <textarea
                                            name="RecipeDescription"
                                            placeholder="Description"
                                            value={form.RecipeDescription}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(5)}
                                            onBlur={handleFieldBlur}
                                            className="dark-textarea form-field-full recipe-crud__description-input"
                                            ref={secondInputRef}
                                            rows={3}
                                            style={{
                                                width: "100%",
                                                resize: "vertical",
                                            }}
                                        />
                                        {focusedFieldIndex === 5 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>
                                </div>
                            </div>

                            {/* Down arrow indicator when form is focused and there are items in the list */}
                            {isFormFocused && recipes.length > 0 && (
                                <KeyboardIndicator
                                    keys={["↓"]}
                                    position="bottom-right"
                                />
                            )}
                        </form>

                        {/* Submit and Cancel Buttons - positioned beside the form */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    position: "relative",
                                }}
                            >
                                <IconButton
                                    type="submit"
                                    form="recipe-form"
                                    size="large"
                                    className="recipe-crud__submit-button"
                                    sx={{
                                        backgroundColor:
                                            "rgba(76, 205, 196, 0.8)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: 48,
                                        height: 48,
                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(76, 205, 196, 1)",
                                        },
                                    }}
                                >
                                    {editIndex !== null ? "🔄" : "➕"}
                                </IconButton>
                                <Box sx={{ mt: 0.5 }}>
                                    <KeyboardIndicator
                                        keys={["Ctrl", "Enter"]}
                                        position="bottom-center"
                                    />
                                </Box>
                            </Box>
                            {editIndex !== null && (
                                <Button
                                    onClick={handleCancel}
                                    variant="outlined"
                                    size="medium"
                                    className="recipe-crud__cancel-button"
                                >
                                    ❌ Cancel
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Inputs/Outputs Section - Side by Side */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1.5,
                            mt: 1.5,
                            justifyContent: "space-between",
                            padding: 0,
                        }}
                    >
                        {/* Inputs Panel */}
                        <Paper
                            sx={{
                                flex: 1,
                                p: 1.5,
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 107, 107, 0.3)",
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    color: "#ff6b6b",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                }}
                            >
                                📥 Recipe Inputs
                            </Typography>

                            {/* Input Form */}
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.75,
                                    mb: 1.5,
                                    alignItems: "center",
                                    position: "relative",
                                    padding: 0,
                                }}
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        padding: 0,
                                    }}
                                    className="form-field-3-5"
                                >
                                    <ItemSelector
                                        items={items}
                                        value={inputForm.ItemID}
                                        onChange={(itemId) =>
                                            setInputForm((f) => ({
                                                ...f,
                                                ItemID: itemId,
                                            }))
                                        }
                                        placeholder="Select Item"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        onFocus={() => setIsFormFocused(false)}
                                        ref={inputItemSelectorRef}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        position: "relative",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                    className="form-field-1-5"
                                >
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={inputForm.Amount || ""}
                                        onChange={(e) => {
                                            e.preventDefault();
                                            setInputForm((f) => ({
                                                ...f,
                                                Amount: Number(e.target.value),
                                            }));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addInput();
                                            }
                                        }}
                                        onFocus={() => setIsFormFocused(false)}
                                        className="dark-input"
                                        ref={inputAmountRef}
                                        style={{ width: "100%" }}
                                    />
                                    {inputForm.ItemID !== 0 && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#a0aec0",
                                                fontSize: "11px",
                                                minWidth: "40px",
                                            }}
                                        >
                                            {getUnitForItem(inputForm.ItemID)}
                                        </Typography>
                                    )}
                                </Box>

                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                    className="form-field-1-5"
                                >
                                    <IconButton
                                        onClick={addInput}
                                        disabled={
                                            inputForm.ItemID === 0 ||
                                            inputForm.Amount <= 0
                                        }
                                        size="small"
                                        sx={{
                                            backgroundColor:
                                                "rgba(76, 205, 196, 0.8)",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 32,
                                            height: 32,
                                            "&:hover": {
                                                backgroundColor:
                                                    "rgba(76, 205, 196, 1)",
                                            },
                                            "&:disabled": {
                                                backgroundColor:
                                                    "rgba(120, 120, 120, 0.5)",
                                                color: "rgba(255, 255, 255, 0.5)",
                                            },
                                        }}
                                    >
                                        ➕
                                    </IconButton>
                                    {/* Shift+Enter indicator for input form */}
                                    <Box
                                        sx={{
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <KeyboardIndicator
                                            keys={["Shift", "Enter"]}
                                            position="bottom-center"
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* Inputs List */}
                            <Box>
                                {tempInputs.length === 0 ? (
                                    <Typography
                                        color="#a0aec0"
                                        sx={{ fontStyle: "italic" }}
                                    >
                                        No inputs defined
                                    </Typography>
                                ) : (
                                    tempInputs.map((input, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                py: 0.25,
                                                px: 0.5,
                                                borderRadius: 1,
                                                mb: 0.25,
                                                backgroundColor:
                                                    "rgba(255, 107, 107, 0.1)",
                                                borderBottom:
                                                    i < tempInputs.length - 1
                                                        ? "1px solid rgba(255,255,255,0.1)"
                                                        : "none",
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontSize: "13px" }}
                                            >
                                                {items.find(
                                                    (item) =>
                                                        item.ItemID ===
                                                        input.ItemID
                                                )?.ItemName || input.ItemID}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight: "bold",
                                                        color: "#ff6b6b",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    × {input.Amount}{" "}
                                                    {getUnitForItem(
                                                        input.ItemID
                                                    )}
                                                </Typography>
                                                <IconButton
                                                    onClick={() =>
                                                        removeInput(i)
                                                    }
                                                    size="small"
                                                    sx={{
                                                        color: "#ff6b6b",
                                                        width: "20px",
                                                        height: "20px",
                                                    }}
                                                >
                                                    <DeleteIcon
                                                        sx={{
                                                            fontSize: "14px",
                                                        }}
                                                    />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>

                        {/* Outputs Panel */}
                        <Paper
                            sx={{
                                flex: 1,
                                p: 1.5,
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(72, 187, 120, 0.3)",
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    color: "#48bb78",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                }}
                            >
                                📤 Recipe Outputs
                            </Typography>

                            {/* Output Form */}
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.75,
                                    mb: 1.5,
                                    alignItems: "center",
                                    position: "relative",
                                    padding: 0,
                                }}
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        padding: 0,
                                    }}
                                    className="form-field-3-5"
                                >
                                    <ItemSelector
                                        items={items}
                                        value={outputForm.ItemID}
                                        onChange={(itemId) =>
                                            setOutputForm((f) => ({
                                                ...f,
                                                ItemID: itemId,
                                            }))
                                        }
                                        placeholder="Select Item"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        onFocus={() => setIsFormFocused(false)}
                                        ref={outputItemSelectorRef}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        position: "relative",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                    className="form-field-1-5"
                                >
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={outputForm.Amount || ""}
                                        onChange={(e) => {
                                            e.preventDefault();
                                            setOutputForm((f) => ({
                                                ...f,
                                                Amount: Number(e.target.value),
                                            }));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addOutput();
                                            }
                                        }}
                                        onFocus={() => setIsFormFocused(false)}
                                        className="dark-input"
                                        ref={outputAmountRef}
                                        style={{ width: "100%" }}
                                    />
                                    {outputForm.ItemID !== 0 && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#a0aec0",
                                                fontSize: "11px",
                                                minWidth: "40px",
                                            }}
                                        >
                                            {getUnitForItem(outputForm.ItemID)}
                                        </Typography>
                                    )}
                                </Box>

                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                    className="form-field-1-5"
                                >
                                    <IconButton
                                        onClick={addOutput}
                                        disabled={
                                            outputForm.ItemID === 0 ||
                                            outputForm.Amount <= 0
                                        }
                                        size="small"
                                        sx={{
                                            backgroundColor:
                                                "rgba(76, 205, 196, 0.8)",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 32,
                                            height: 32,
                                            "&:hover": {
                                                backgroundColor:
                                                    "rgba(76, 205, 196, 1)",
                                            },
                                            "&:disabled": {
                                                backgroundColor:
                                                    "rgba(120, 120, 120, 0.5)",
                                                color: "rgba(255, 255, 255, 0.5)",
                                            },
                                        }}
                                    >
                                        ➕
                                    </IconButton>
                                    {/* Shift+Enter indicator for output form */}
                                    <Box
                                        sx={{
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <KeyboardIndicator
                                            keys={["Shift", "Enter"]}
                                            position="bottom-center"
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* Outputs List */}
                            <Box>
                                {tempOutputs.length === 0 ? (
                                    <Typography
                                        color="#a0aec0"
                                        sx={{ fontStyle: "italic" }}
                                    >
                                        No outputs defined
                                    </Typography>
                                ) : (
                                    tempOutputs.map((output, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                py: 0.25,
                                                px: 0.5,
                                                borderRadius: 1,
                                                mb: 0.25,
                                                backgroundColor:
                                                    "rgba(72, 187, 120, 0.1)",
                                                borderBottom:
                                                    i < tempOutputs.length - 1
                                                        ? "1px solid rgba(255,255,255,0.1)"
                                                        : "none",
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontSize: "13px" }}
                                            >
                                                {items.find(
                                                    (item) =>
                                                        item.ItemID ===
                                                        output.ItemID
                                                )?.ItemName || output.ItemID}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight: "bold",
                                                        color: "#48bb78",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    × {output.Amount}{" "}
                                                    {getUnitForItem(
                                                        output.ItemID
                                                    )}
                                                </Typography>
                                                <IconButton
                                                    onClick={() =>
                                                        removeOutput(i)
                                                    }
                                                    size="small"
                                                    sx={{
                                                        color: "#48bb78",
                                                        width: "20px",
                                                        height: "20px",
                                                    }}
                                                >
                                                    <DeleteIcon
                                                        sx={{
                                                            fontSize: "14px",
                                                        }}
                                                    />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </div>
            </div>

            {/* Recipes list */}
            <div className="crud-layout__list">
                <DataGrid
                    data={recipes}
                    idField="RecipeID"
                    selectedIndex={selectedIndex}
                    onSelectionChange={setSelectedIndex}
                    onEnterEdit={handleEdit}
                    useAccordion={true}
                    expandedIndex={expandedRecipe}
                    onAccordionChange={setExpandedRecipe}
                    className="recipe-crud__recipes-list"
                    itemClassName="recipe-crud__accordion"
                    columns={[
                        {
                            key: "RecipeName",
                            label: "Name",
                            className:
                                "dark-list-text recipe-crud__recipe-name",
                        },
                        {
                            key: "RecipeDescription",
                            label: "Description",
                            className:
                                "dark-list-secondary recipe-crud__recipe-description",
                            isSecondary: true,
                            showWhenEmpty: true,
                            emptyText: "No description",
                        },
                        {
                            key: "BuildingID",
                            label: "Building",
                            className:
                                "dark-list-secondary recipe-crud__recipe-building",
                            isSecondary: true,
                            render: (recipe: Recipe) =>
                                `Building: ${
                                    buildings.find(
                                        (b) =>
                                            b.BuildingID === recipe.BuildingID
                                    )?.BuildingName || recipe.BuildingID
                                }`,
                        },
                    ]}
                    actions={[
                        {
                            label: "Edit",
                            icon: "✏️",
                            onClick: (_, index) => handleEdit(index),
                            className: "recipe-crud__edit-button",
                            stopPropagation: true,
                            keyboardShortcut: ["Enter"],
                        },
                        {
                            label: "Delete",
                            icon: "🗑️",
                            onClick: (_, index) => handleDelete(index),
                            className: "recipe-crud__delete-button",
                            stopPropagation: true,
                            keyboardShortcut: ["Del"],
                        },
                    ]}
                    emptyStateConfig={{
                        icon: "🧪",
                        title: "No recipes defined yet",
                        subtitle: "Add your first recipe using the form above",
                    }}
                    renderAccordionDetails={(recipe: Recipe) => (
                        <Box className="recipe-crud__recipe-details">
                            <Typography sx={{ mb: 2 }}>
                                ⚡ Power: {recipe.Power} | 💧 Water:{" "}
                                {recipe.Water} | ⏱️ Time:{" "}
                                {formatTimeForDisplay(recipe.Time)}
                            </Typography>

                            <Box sx={{ display: "flex", gap: 2 }}>
                                {/* Inputs Panel */}
                                <Paper
                                    sx={{
                                        flex: 1,
                                        p: 2,
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 107, 107, 0.3)",
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 1,
                                            color: "#ff6b6b",
                                            fontWeight: 600,
                                        }}
                                    >
                                        📥 Inputs
                                    </Typography>
                                    {recipe.Inputs.length === 0 ? (
                                        <Typography
                                            color="#a0aec0"
                                            sx={{ fontStyle: "italic" }}
                                        >
                                            No inputs defined
                                        </Typography>
                                    ) : (
                                        <Box>
                                            {recipe.Inputs.map((input, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        py: 0.5,
                                                        borderBottom:
                                                            idx <
                                                            recipe.Inputs
                                                                .length -
                                                                1
                                                                ? "1px solid rgba(255,255,255,0.1)"
                                                                : "none",
                                                    }}
                                                >
                                                    <Typography className="recipe-crud__io-item">
                                                        {items.find(
                                                            (item) =>
                                                                item.ItemID ===
                                                                input.ItemID
                                                        )?.ItemName ||
                                                            input.ItemID}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: "bold",
                                                            color: "#ff6b6b",
                                                        }}
                                                    >
                                                        × {input.Amount}{" "}
                                                        {getUnitForItem(
                                                            input.ItemID
                                                        )}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Paper>

                                {/* Outputs Panel */}
                                <Paper
                                    sx={{
                                        flex: 1,
                                        p: 2,
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(72, 187, 120, 0.3)",
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 1,
                                            color: "#48bb78",
                                            fontWeight: 600,
                                        }}
                                    >
                                        📤 Outputs
                                    </Typography>
                                    {recipe.Outputs.length === 0 ? (
                                        <Typography
                                            color="#a0aec0"
                                            sx={{ fontStyle: "italic" }}
                                        >
                                            No outputs defined
                                        </Typography>
                                    ) : (
                                        <Box>
                                            {recipe.Outputs.map(
                                                (output, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                            py: 0.5,
                                                            borderBottom:
                                                                idx <
                                                                recipe.Outputs
                                                                    .length -
                                                                    1
                                                                    ? "1px solid rgba(255,255,255,0.1)"
                                                                    : "none",
                                                        }}
                                                    >
                                                        <Typography className="recipe-crud__io-item">
                                                            {items.find(
                                                                (item) =>
                                                                    item.ItemID ===
                                                                    output.ItemID
                                                            )?.ItemName ||
                                                                output.ItemID}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontWeight:
                                                                    "bold",
                                                                color: "#48bb78",
                                                            }}
                                                        >
                                                            × {output.Amount}{" "}
                                                            {getUnitForItem(
                                                                output.ItemID
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                )
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </Box>
                    )}
                />
            </div>
        </Box>
    );
}
