import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import type { Unit } from "../types";
import { generateId, getExistingIds } from "../utils";
import KeyboardIndicator from "../components/KeyboardIndicator";
import DataGrid, {
    type GridColumn,
    type GridAction,
} from "../components/DataGrid";
import "./UnitCrud.css";

export default function UnitCrud({
    units,
    setUnits,
}: {
    units: Unit[];
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
}) {
    const [form, setForm] = useState<Omit<Unit, "UnitID">>({
        UnitName: "",
        UnitDescription: "",
        DefaultUnit: "",
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const secondInputRef = useRef<HTMLInputElement>(null);
    const thirdInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

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
            setUnits((units) => units.filter((_, i) => i !== idx));
            if (editIndex === idx) setEditIndex(null);
            if (selectedIndex === idx) setSelectedIndex(null);
        },
        [editIndex, selectedIndex, setUnits]
    );

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
                        secondInputRef.current?.focus();
                        setFocusedFieldIndex(1);
                    } else if (activeElement === secondInputRef.current) {
                        thirdInputRef.current?.focus();
                        setFocusedFieldIndex(2);
                    } else if (activeElement === thirdInputRef.current) {
                        firstInputRef.current?.focus();
                        setFocusedFieldIndex(0);
                    }
                    setIsFormFocused(true);
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
                units.length > 0
            ) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

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
                        prev === null ? 0 : Math.min(prev + 1, units.length - 1)
                    );
                }
            } else if (e.key === "ArrowUp" && !e.ctrlKey && !e.shiftKey) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT";

                if (!isInForm && selectedIndex === 0) {
                    // If on first list item, move to form
                    e.preventDefault();
                    setSelectedIndex(null);
                    setIsFormFocused(true);
                    setFocusedFieldIndex(0);
                    if (firstInputRef.current) {
                        firstInputRef.current.focus();
                    }
                } else if (!isInForm && units.length > 0) {
                    // If in list, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev === null ? units.length - 1 : Math.max(prev - 1, 0)
                    );
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, units.length, handleDelete]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.UnitName) return;
        if (editIndex !== null) {
            setUnits((units) =>
                units.map((u, i) =>
                    i === editIndex
                        ? { ...form, UnitID: units[editIndex].UnitID }
                        : u
                )
            );
            setEditIndex(null);
        } else {
            const existingIds = getExistingIds(units, "UnitID");
            const newId = generateId(form.UnitName, existingIds);
            setUnits((units) => [...units, { ...form, UnitID: newId }]);
        }
        setForm({ UnitName: "", UnitDescription: "", DefaultUnit: "" });
        setSelectedIndex(null);
        setFocusedFieldIndex(0);
        setIsFormFocused(true);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const handleEdit = (idx: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { UnitID, ...formData } = units[idx];
        setForm(formData);
        setEditIndex(idx);
        setSelectedIndex(idx);
    };

    const gridColumns: GridColumn<Unit>[] = [
        {
            key: "UnitName",
            label: "Name",
            className: "dark-list-text unit-crud__unit-name",
        },
        {
            key: "UnitDescription",
            label: "Description",
            className: "dark-list-secondary unit-crud__unit-description",
            isSecondary: true,
            showWhenEmpty: true,
            emptyText: "No description",
            render: (unit) => (
                <span
                    className={
                        !unit.UnitDescription
                            ? "unit-crud__unit-description--empty"
                            : ""
                    }
                >
                    {unit.UnitDescription || "No description"}
                </span>
            ),
        },
        {
            key: "DefaultUnit",
            label: "Default Unit",
            className: "dark-list-secondary unit-crud__unit-default",
            isSecondary: true,
            render: (unit) => unit.DefaultUnit || "N/A",
        },
    ];

    const gridActions: GridAction<Unit>[] = [
        {
            label: "Edit",
            icon: "✏️",
            onClick: (_, index) => handleEdit(index),
            className: "unit-crud__edit-button",
            stopPropagation: true,
            keyboardShortcut: ["Enter"],
        },
        {
            label: "Delete",
            icon: "🗑️",
            onClick: (_, index) => handleDelete(index),
            className: "unit-crud__delete-button",
            stopPropagation: true,
            keyboardShortcut: ["Del"],
        },
    ];

    const handleCancel = () => {
        setForm({ UnitName: "", UnitDescription: "", DefaultUnit: "" });
        setEditIndex(null);
        setSelectedIndex(null);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    return (
        <Box className="unit-crud crud-layout">
            <div className="crud-layout__header">
                <Typography
                    variant="h5"
                    className="unit-crud__title"
                    color="primary.main"
                >
                    📏 Unit Management
                </Typography>
            </div>

            {/* Unit Form */}
            <div className="crud-layout__form">
                <div className="form-container">
                    <Typography variant="h6" className="unit-crud__form-title">
                        {editIndex !== null ? "✏️ Edit Unit" : "➕ Add Unit"}
                    </Typography>
                    <form
                        onSubmit={handleSubmit}
                        className="dark-form unit-crud__form form-layout"
                        ref={formRef}
                    >
                        <div className="form-layout__fields">
                            <div className="form-layout__row">
                                <Box
                                    sx={{ position: "relative" }}
                                    className="form-field-1-4"
                                >
                                    <input
                                        name="UnitName"
                                        placeholder="Name"
                                        value={form.UnitName}
                                        onChange={handleChange}
                                        onFocus={() => handleFieldFocus(0)}
                                        onBlur={handleFieldBlur}
                                        required
                                        className="dark-input unit-crud__name-input"
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
                                    className="form-field-1-2"
                                >
                                    <input
                                        name="UnitDescription"
                                        placeholder="Description"
                                        value={form.UnitDescription}
                                        onChange={handleChange}
                                        onFocus={() => handleFieldFocus(1)}
                                        onBlur={handleFieldBlur}
                                        className="dark-input unit-crud__description-input"
                                        ref={secondInputRef}
                                    />
                                    {focusedFieldIndex === 1 && (
                                        <KeyboardIndicator
                                            keys={["Tab"]}
                                            position="top-right"
                                        />
                                    )}
                                </Box>
                                <Box
                                    sx={{ position: "relative" }}
                                    className="form-field-1-4"
                                >
                                    <input
                                        name="DefaultUnit"
                                        placeholder="Default Unit"
                                        value={form.DefaultUnit}
                                        onChange={handleChange}
                                        onFocus={() => handleFieldFocus(2)}
                                        onBlur={handleFieldBlur}
                                        className="dark-input unit-crud__default-input"
                                        ref={thirdInputRef}
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
                        <div className="form-layout__submit">
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <IconButton
                                    type="submit"
                                    size="large"
                                    className="unit-crud__submit-button"
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
                                <Box sx={{ mt: 1 }}>
                                    <KeyboardIndicator
                                        keys={["Ctrl", "Enter"]}
                                        position="bottom-center"
                                    />
                                </Box>
                                {editIndex !== null && (
                                    <Button
                                        onClick={handleCancel}
                                        variant="outlined"
                                        size="medium"
                                        className="unit-crud__cancel-button"
                                    >
                                        ❌ Cancel
                                    </Button>
                                )}
                            </Box>
                        </div>
                        {/* Down arrow indicator when form is focused and there are items in the list */}
                        {isFormFocused && units.length > 0 && (
                            <KeyboardIndicator
                                keys={["↓"]}
                                position="bottom-right"
                            />
                        )}
                    </form>
                </div>
            </div>

            <div className="crud-layout__list">
                <DataGrid
                    data={units}
                    columns={gridColumns}
                    actions={gridActions}
                    selectedIndex={selectedIndex}
                    onSelectionChange={setSelectedIndex}
                    onEnterEdit={handleEdit}
                    emptyStateConfig={{
                        icon: "📏",
                        title: "No units defined yet",
                        subtitle: "Add your first unit using the form above",
                    }}
                    className="unit-crud__units-list"
                    itemClassName="unit-crud__unit-item"
                    selectedItemClassName="unit-crud__unit-item--selected"
                    idField="UnitID"
                />
            </div>
        </Box>
    );
}
