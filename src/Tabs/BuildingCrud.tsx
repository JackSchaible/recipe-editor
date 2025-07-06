import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import type { Building, BuildingConstructionCost, Item, Unit } from "../types";
import { generateId, getExistingIds } from "../utils";
import KeyboardIndicator from "../components/KeyboardIndicator";
import ItemSelector from "../components/ItemSelector";
import "./BuildingCrud.css";

export default function BuildingCrud({
    buildings,
    setBuildings,
    items,
    units,
}: {
    buildings: Building[];
    setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
    items: Item[];
    units: Unit[];
}) {
    // Building form state (removed BuildingID since it's auto-generated)
    const [buildingForm, setBuildingForm] = useState<
        Omit<Building, "BuildingID">
    >({
        BuildingName: "",
        BuildingDescription: "",
        CrewRequirement: 0,
        ConstructionCosts: [],
    });
    const [buildingEditIndex, setBuildingEditIndex] = useState<number | null>(
        null
    );
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const secondInputRef = useRef<HTMLTextAreaElement>(null);
    const thirdInputRef = useRef<HTMLInputElement>(null);
    const fourthInputRef = useRef<HTMLInputElement>(null); // Construction cost item selector
    const fifthInputRef = useRef<HTMLInputElement>(null); // Construction cost amount
    const formRef = useRef<HTMLFormElement>(null);

    // Temporary costs for the building being created/edited
    const [tempCosts, setTempCosts] = useState<BuildingConstructionCost[]>([]);

    // Construction cost form state
    const [costForm, setCostForm] = useState<BuildingConstructionCost>({
        ItemID: 0,
        Amount: 0,
    });

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

    const handleBuildingDelete = useCallback(
        (idx: number) => {
            setBuildings((buildings) => buildings.filter((_, i) => i !== idx));
            if (buildingEditIndex === idx) setBuildingEditIndex(null);
            if (selectedIndex === idx) setSelectedIndex(null);
        },
        [buildingEditIndex, selectedIndex, setBuildings]
    );

    const addCost = useCallback(() => {
        if (costForm.ItemID === 0 || costForm.Amount <= 0) return;

        // Check if this item already exists in tempCosts
        const existingCostIndex = tempCosts.findIndex(
            (cost) => cost.ItemID === costForm.ItemID
        );

        if (existingCostIndex >= 0) {
            // Update existing cost by replacing the amount
            setTempCosts((costs) =>
                costs.map((cost, index) =>
                    index === existingCostIndex
                        ? { ...cost, Amount: costForm.Amount }
                        : cost
                )
            );
        } else {
            // Add new cost
            setTempCosts((costs) => [...costs, { ...costForm }]);
        }

        // Reset form and focus back to item select for next cost
        setCostForm({ ItemID: 0, Amount: 0 });
        fourthInputRef.current?.focus();
        setFocusedFieldIndex(3);
    }, [costForm, tempCosts]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab navigation through form fields
            if (e.key === "Tab") {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

                if (isInForm) {
                    e.preventDefault();
                    if (activeElement === firstInputRef.current) {
                        thirdInputRef.current?.focus();
                        setFocusedFieldIndex(2);
                    } else if (activeElement === thirdInputRef.current) {
                        secondInputRef.current?.focus();
                        setFocusedFieldIndex(1);
                    } else if (activeElement === secondInputRef.current) {
                        // After description field, go to construction cost item select
                        fourthInputRef.current?.focus();
                        setFocusedFieldIndex(3);
                    } else if (activeElement === fourthInputRef.current) {
                        // After item select, go to amount
                        fifthInputRef.current?.focus();
                        setFocusedFieldIndex(4);
                    } else if (activeElement === fifthInputRef.current) {
                        // After amount, loop back to item select to add more costs
                        fourthInputRef.current?.focus();
                        setFocusedFieldIndex(3);
                    }
                    setIsFormFocused(true);
                }
            }
            // Shift+Enter to add construction cost when in cost form fields
            else if (e.shiftKey && e.key === "Enter") {
                const activeElement = document.activeElement as HTMLElement;
                const isInCostForm =
                    activeElement === fourthInputRef.current ||
                    activeElement === fifthInputRef.current;

                if (
                    isInCostForm &&
                    costForm.ItemID !== 0 &&
                    costForm.Amount > 0
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    addCost();
                    return; // Ensure no further processing
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
                handleBuildingDelete(selectedIndex);
            }
            // Arrow keys for navigation through list entries and form
            else if (
                e.key === "ArrowDown" &&
                !e.ctrlKey &&
                !e.shiftKey &&
                buildings.length > 0
            ) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

                // Don't interfere with autocomplete dropdown navigation
                if (activeElement?.getAttribute("role") === "combobox") {
                    return; // Let the autocomplete handle its own arrow key navigation
                }

                if (isInForm) {
                    // If in form, move to first list item
                    e.preventDefault();
                    setSelectedIndex(0);
                    setIsFormFocused(false);
                    setFocusedFieldIndex(null);
                    activeElement.blur(); // Remove focus from form element
                } else {
                    // If in list or outside form, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev === null
                            ? 0
                            : Math.min(prev + 1, buildings.length - 1)
                    );
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

                if (!isInForm && selectedIndex === 0) {
                    // If on first list item, move to form
                    e.preventDefault();
                    setSelectedIndex(null);
                    setIsFormFocused(true);
                    setFocusedFieldIndex(0);
                    if (firstInputRef.current) {
                        firstInputRef.current.focus();
                    }
                } else if (!isInForm && buildings.length > 0) {
                    // If in list, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev === null
                            ? buildings.length - 1
                            : Math.max(prev - 1, 0)
                    );
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        selectedIndex,
        buildings.length,
        handleBuildingDelete,
        addCost,
        costForm.ItemID,
        costForm.Amount,
    ]);

    // Building form handlers
    const handleBuildingChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setBuildingForm((f) => ({
            ...f,
            [name]: name === "CrewRequirement" ? Number(value) : value,
        }));
    };

    // Construction cost form handlers
    const handleCostAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setCostForm((prev) => ({
            ...prev,
            Amount: value,
        }));
    };

    const removeCost = (index: number, shouldRefocus = true) => {
        setTempCosts((costs) => costs.filter((_, i) => i !== index));
        // Refocus on item select after removal only if requested
        if (shouldRefocus) {
            setTimeout(() => {
                fourthInputRef.current?.focus();
                setFocusedFieldIndex(3);
            }, 0);
        }
    };

    const handleBuildingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!buildingForm.BuildingName) return;

        if (buildingEditIndex !== null) {
            // Editing existing building
            const existingBuildingId = buildings[buildingEditIndex].BuildingID;

            setBuildings((buildings) =>
                buildings.map((b, i) =>
                    i === buildingEditIndex
                        ? {
                              ...buildingForm,
                              BuildingID: existingBuildingId,
                              ConstructionCosts: tempCosts,
                          }
                        : b
                )
            );

            setBuildingEditIndex(null);
        } else {
            // Adding new building - generate ID
            const existingIds = getExistingIds(buildings, "BuildingID");
            const newId = generateId(buildingForm.BuildingName, existingIds);

            setBuildings((buildings) => [
                ...buildings,
                {
                    ...buildingForm,
                    BuildingID: newId,
                    ConstructionCosts: tempCosts,
                },
            ]);
        }

        // Reset form and temporary costs
        setBuildingForm({
            BuildingName: "",
            BuildingDescription: "",
            CrewRequirement: 0,
            ConstructionCosts: [],
        });
        setTempCosts([]);
        setCostForm({ ItemID: 0, Amount: 0 }); // Reset cost form too
        setSelectedIndex(null);
        setFocusedFieldIndex(0);
        setIsFormFocused(true);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const handleBuildingEdit = (idx: number) => {
        const { ...formData } = buildings[idx];
        setBuildingForm(formData);
        setBuildingEditIndex(idx);

        // Load existing costs for this building into temporary costs
        setTempCosts([...buildings[idx].ConstructionCosts]);
        setCostForm({ ItemID: 0, Amount: 0 }); // Reset cost form
        setSelectedIndex(idx);
    };

    const handleCancel = () => {
        setBuildingForm({
            BuildingName: "",
            BuildingDescription: "",
            CrewRequirement: 0,
            ConstructionCosts: [],
        });
        setBuildingEditIndex(null);
        setTempCosts([]);
        setCostForm({ ItemID: 0, Amount: 0 }); // Reset cost form too
    };

    return (
        <Box className="building-crud crud-layout">
            <div className="crud-layout__header">
                <Typography
                    variant="h5"
                    className="building-crud__title"
                    color="primary.main"
                >
                    🏭 Building Management
                </Typography>
            </div>

            {/* Building Form */}
            <div className="crud-layout__form">
                <div className="form-container">
                    <Typography
                        variant="h6"
                        className="building-crud__form-title"
                    >
                        {buildingEditIndex !== null
                            ? "✏️ Edit Building"
                            : "➕ Add Building"}
                    </Typography>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "24px",
                        }}
                    >
                        <form
                            id="building-form"
                            onSubmit={handleBuildingSubmit}
                            className="dark-form building-crud__form"
                            ref={formRef}
                            style={{
                                position: "relative",
                                flex: 1,
                                display: "block",
                            }}
                        >
                            <div className="form-section">
                                <div className="form-layout__row">
                                    <Box
                                        sx={{
                                            padding: 0,
                                            position: "relative",
                                        }}
                                        className="form-field-2-3"
                                    >
                                        <input
                                            name="BuildingName"
                                            placeholder="Name"
                                            value={buildingForm.BuildingName}
                                            onChange={handleBuildingChange}
                                            onFocus={() => handleFieldFocus(0)}
                                            onBlur={handleFieldBlur}
                                            required
                                            className="dark-input form-field-full building-crud__name-input"
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
                                        sx={{
                                            padding: 0,
                                            position: "relative",
                                        }}
                                        className="form-field-1-3"
                                    >
                                        <input
                                            name="CrewRequirement"
                                            type="number"
                                            placeholder="Crew"
                                            value={
                                                buildingForm.CrewRequirement ||
                                                ""
                                            }
                                            onChange={handleBuildingChange}
                                            onFocus={() => handleFieldFocus(1)}
                                            onBlur={handleFieldBlur}
                                            className="dark-input form-field-small building-crud__crew-input"
                                            ref={thirdInputRef}
                                        />
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
                                            flexGrow: 1,
                                            paddingLeft: 0,
                                            paddingRight: 0,
                                            position: "relative",
                                        }}
                                    >
                                        <textarea
                                            name="BuildingDescription"
                                            placeholder="Description"
                                            value={
                                                buildingForm.BuildingDescription
                                            }
                                            onChange={handleBuildingChange}
                                            onFocus={() => handleFieldFocus(2)}
                                            onBlur={handleFieldBlur}
                                            className="dark-textarea form-field-full building-crud__description-input"
                                            ref={secondInputRef}
                                            rows={3}
                                            style={{
                                                width: "100%",
                                                resize: "vertical",
                                            }}
                                        />
                                        {focusedFieldIndex === 2 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>
                                </div>
                            </div>

                            {/* Construction Costs Section */}
                            <div className="form-section">
                                <div className="form-section-title form-layout__row">
                                    💰 Construction Costs
                                </div>

                                {/* Construction Cost Form */}
                                <div className="form-layout__row">
                                    {/* Form Fields Container */}
                                    <Box
                                        sx={{
                                            position: "relative",
                                            padding: "0 8px",
                                        }}
                                        className="form-field-3-5"
                                    >
                                        <ItemSelector
                                            items={items}
                                            value={costForm.ItemID}
                                            onChange={(itemId) =>
                                                setCostForm((prev) => ({
                                                    ...prev,
                                                    ItemID: itemId,
                                                }))
                                            }
                                            placeholder="Select Item..."
                                            onFocus={() => handleFieldFocus(3)}
                                            onBlur={handleFieldBlur}
                                            onKeyDown={(e) => {
                                                if (
                                                    (e.key === "Enter" ||
                                                        (e.shiftKey &&
                                                            e.key ===
                                                                "Enter")) &&
                                                    costForm.ItemID !== 0 &&
                                                    costForm.Amount > 0
                                                ) {
                                                    e.preventDefault();
                                                    addCost();
                                                }
                                            }}
                                            ref={fourthInputRef}
                                        />
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
                                            padding: "0 8px",
                                        }}
                                        className="form-field-1-5"
                                    >
                                        <input
                                            name="Amount"
                                            type="number"
                                            placeholder="Amount"
                                            value={costForm.Amount || ""}
                                            onChange={handleCostAmountChange}
                                            onFocus={() => handleFieldFocus(4)}
                                            onBlur={handleFieldBlur}
                                            onKeyDown={(e) => {
                                                if (
                                                    (e.key === "Enter" ||
                                                        (e.shiftKey &&
                                                            e.key ===
                                                                "Enter")) &&
                                                    costForm.ItemID !== 0 &&
                                                    costForm.Amount > 0
                                                ) {
                                                    e.preventDefault();
                                                    addCost();
                                                }
                                            }}
                                            className="dark-input form-field-small building-crud__cost-amount-input"
                                            ref={fifthInputRef}
                                            style={{ flex: 1 }}
                                        />
                                        {/* Unit display */}
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                color: "rgba(255, 255, 255, 0.7)",
                                                minWidth: "40px",
                                                textAlign: "left",
                                            }}
                                        >
                                            {costForm.ItemID !== 0
                                                ? (() => {
                                                      const selectedItem =
                                                          items.find(
                                                              (item) =>
                                                                  item.ItemID ===
                                                                  costForm.ItemID
                                                          );
                                                      const unit = units.find(
                                                          (unit) =>
                                                              unit.UnitID ===
                                                              selectedItem?.UnitID
                                                      );
                                                      return (
                                                          unit?.DefaultUnit ||
                                                          "units"
                                                      );
                                                  })()
                                                : ""}
                                        </span>
                                        {focusedFieldIndex === 4 && (
                                            <KeyboardIndicator
                                                keys={["Tab"]}
                                                position="top-right"
                                            />
                                        )}
                                    </Box>

                                    {/* Add Button */}
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
                                            type="button"
                                            onClick={addCost}
                                            disabled={
                                                costForm.ItemID === 0 ||
                                                costForm.Amount <= 0
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
                                        <Box sx={{ mt: 0.5 }}>
                                            <KeyboardIndicator
                                                keys={["Shift", "↵"]}
                                                position="bottom-center"
                                            />
                                        </Box>
                                    </Box>
                                </div>

                                {/* Construction Costs List */}
                                {tempCosts.length > 0 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1,
                                            mt: 1,
                                        }}
                                    >
                                        {tempCosts.map((cost, i) => {
                                            const item = items.find(
                                                (item) =>
                                                    item.ItemID === cost.ItemID
                                            );
                                            const unit = units.find(
                                                (unit) =>
                                                    unit.UnitID === item?.UnitID
                                            );
                                            return (
                                                <Box
                                                    key={i}
                                                    onClick={() => {
                                                        // Load the cost into the form for editing
                                                        setCostForm({
                                                            ItemID: cost.ItemID,
                                                            Amount: cost.Amount,
                                                        });
                                                        // Focus on the item select to show it's ready for editing
                                                        setTimeout(() => {
                                                            fourthInputRef.current?.focus();
                                                            setFocusedFieldIndex(
                                                                3
                                                            );
                                                        }, 0);
                                                    }}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                        backgroundColor:
                                                            "rgba(76, 205, 196, 0.1)",
                                                        border: "1px solid rgba(76, 205, 196, 0.3)",
                                                        borderRadius: "16px",
                                                        padding: "4px 8px",
                                                        fontSize: "0.875rem",
                                                        color: "rgba(76, 205, 196, 1)",
                                                        cursor: "pointer",
                                                        transition:
                                                            "all 0.2s ease",
                                                        "&:hover": {
                                                            backgroundColor:
                                                                "rgba(76, 205, 196, 0.2)",
                                                            borderColor:
                                                                "rgba(76, 205, 196, 0.5)",
                                                            transform:
                                                                "translateY(-1px)",
                                                        },
                                                    }}
                                                >
                                                    <span>
                                                        {item?.ItemName ||
                                                            `Item ${cost.ItemID}`}{" "}
                                                        {cost.Amount}{" "}
                                                        {unit?.DefaultUnit ||
                                                            "units"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent chip click
                                                            removeCost(i, true);
                                                        }}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            padding: "0",
                                                            fontSize: "0.75rem",
                                                            color: "rgba(220, 38, 127, 0.8)",
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </div>

                            {/* Down arrow indicator when form is focused and there are items in the list */}
                            {isFormFocused && buildings.length > 0 && (
                                <KeyboardIndicator
                                    keys={["↓"]}
                                    position="bottom-right"
                                />
                            )}
                        </form>

                        {/* Submit and Cancel Buttons - positioned inside form panel but outside form element */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "16px",
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
                                    form="building-form"
                                    size="large"
                                    className="building-crud__submit-button"
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
                                    {buildingEditIndex !== null ? "🔄" : "➕"}
                                </IconButton>
                                <Box sx={{ mt: 1 }}>
                                    <KeyboardIndicator
                                        keys={["Ctrl", "Enter"]}
                                        position="bottom-center"
                                    />
                                </Box>
                            </Box>
                            {buildingEditIndex !== null && (
                                <Button
                                    onClick={handleCancel}
                                    variant="outlined"
                                    size="medium"
                                    className="building-crud__cancel-button"
                                >
                                    ❌ Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buildings list with scrolling container */}
            <div className="crud-layout__list">
                <div className="building-crud__buildings-list">
                    {buildings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">🏭</div>
                            <div className="empty-state__title">
                                No buildings defined yet
                            </div>
                            <div className="empty-state__subtitle">
                                Add your first building using the form above
                            </div>
                        </div>
                    ) : (
                        buildings.map((building, index) => (
                            <div
                                key={building.BuildingID}
                                className={`building-crud__building-item ${
                                    selectedIndex === index ? "selected" : ""
                                }`}
                                onClick={() => setSelectedIndex(index)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleBuildingEdit(index);
                                    } else if (e.key === "Delete") {
                                        handleBuildingDelete(index);
                                    }
                                }}
                                tabIndex={0}
                                style={{ position: "relative" }}
                            >
                                <div className="building-crud__building-content">
                                    <div className="building-crud__building-info">
                                        <div className="building-crud__building-name">
                                            {building.BuildingName}
                                        </div>
                                        <div className="building-crud__building-details">
                                            <div className="building-crud__building-description">
                                                {building.BuildingDescription || (
                                                    <span className="building-crud__building-description--empty">
                                                        No description
                                                    </span>
                                                )}
                                            </div>
                                            <div className="building-crud__building-crew">
                                                Crew: {building.CrewRequirement}
                                            </div>
                                        </div>
                                        {building.ConstructionCosts.length >
                                            0 && (
                                            <div className="building-crud__building-costs">
                                                {building.ConstructionCosts.map(
                                                    (cost, i) => {
                                                        const item = items.find(
                                                            (item) =>
                                                                item.ItemID ===
                                                                cost.ItemID
                                                        );
                                                        const unit = units.find(
                                                            (unit) =>
                                                                unit.UnitID ===
                                                                item?.UnitID
                                                        );
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="building-crud__cost-pill"
                                                            >
                                                                {item?.ItemName ||
                                                                    `Item ${cost.ItemID}`}{" "}
                                                                {cost.Amount}{" "}
                                                                {unit?.DefaultUnit ||
                                                                    "units"}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="building-crud__building-actions">
                                        <Box
                                            sx={{
                                                position: "relative",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBuildingEdit(index);
                                                }}
                                                title="Edit building"
                                                sx={{
                                                    color: "rgba(76, 205, 196, 1)",
                                                    backgroundColor:
                                                        "rgba(76, 205, 196, 0.1)",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "rgba(76, 205, 196, 0.2)",
                                                    },
                                                }}
                                            >
                                                ✏️
                                            </IconButton>
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    top: "100%",
                                                    mt: 0.5,
                                                }}
                                            >
                                                <KeyboardIndicator
                                                    keys={["Enter"]}
                                                    position="bottom-center"
                                                />
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                position: "relative",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBuildingDelete(index);
                                                }}
                                                title="Delete building"
                                                sx={{
                                                    color: "rgba(220, 38, 127, 1)",
                                                    backgroundColor:
                                                        "rgba(220, 38, 127, 0.1)",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "rgba(220, 38, 127, 0.2)",
                                                    },
                                                }}
                                            >
                                                🗑️
                                            </IconButton>
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    top: "100%",
                                                    mt: 0.5,
                                                }}
                                            >
                                                <KeyboardIndicator
                                                    keys={["Del"]}
                                                    position="bottom-center"
                                                />
                                            </Box>
                                        </Box>
                                    </div>
                                </div>

                                {/* Navigation indicators for selected item */}
                                {selectedIndex === index && (
                                    <>
                                        {index > 0 && (
                                            <KeyboardIndicator
                                                keys={["↑"]}
                                                position="top-left"
                                            />
                                        )}
                                        {index < buildings.length - 1 && (
                                            <KeyboardIndicator
                                                keys={["↓"]}
                                                position="bottom-left"
                                            />
                                        )}
                                        {index === 0 && (
                                            <KeyboardIndicator
                                                keys={["↑"]}
                                                position="top-left"
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Box>
    );
}
