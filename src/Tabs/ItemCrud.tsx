import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    InputAdornment,
} from "@mui/material";
import type { Item, Unit } from "../types";
import { generateId, getExistingIds } from "../utils";
import KeyboardIndicator from "../components/KeyboardIndicator";
import DataGrid, {
    type GridColumn,
    type GridAction,
} from "../components/DataGrid";
import "./ItemCrud.css";

export default function ItemCrud({
    items,
    setItems,
    units,
}: {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    units: Unit[];
}) {
    const [form, setForm] = useState<Omit<Item, "ItemID">>({
        ItemName: "",
        ItemDescription: "",
        UnitID: 0,
        IsBase: false,
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [searchFilter, setSearchFilter] = useState("");
    const firstInputRef = useRef<HTMLInputElement>(null); // Name
    const secondInputRef = useRef<HTMLSelectElement>(null); // Unit
    const thirdInputRef = useRef<HTMLInputElement>(null); // Base checkbox
    const fourthInputRef = useRef<HTMLTextAreaElement>(null); // Description
    const searchInputRef = useRef<HTMLInputElement>(null); // Search
    const formRef = useRef<HTMLFormElement>(null);

    // Track which form field is currently focused
    const [focusedFieldIndex, setFocusedFieldIndex] = useState<number | null>(
        null
    );

    // Track if any form field is focused (for showing down arrow indicator)
    const [isFormFocused, setIsFormFocused] = useState(false);

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchFilter.trim()) return items;

        const query = searchFilter.toLowerCase();
        return items.filter((item) => {
            const name = item.ItemName.toLowerCase();
            const description = item.ItemDescription.toLowerCase();
            const unit = units.find((u) => u.UnitID === item.UnitID);
            const unitName = unit?.UnitName.toLowerCase() || "";

            return (
                name.includes(query) ||
                description.includes(query) ||
                unitName.includes(query)
            );
        });
    }, [items, searchFilter, units]);

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
            setItems((items) => items.filter((_, i) => i !== idx));
            if (editIndex === idx) setEditIndex(null);
            if (selectedIndex === idx) setSelectedIndex(null);
        },
        [editIndex, selectedIndex, setItems]
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab navigation through form fields
            if (e.key === "Tab") {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT" ||
                    activeElement?.tagName === "TEXTAREA";

                if (isInForm) {
                    e.preventDefault();
                    if (activeElement === firstInputRef.current) {
                        secondInputRef.current?.focus();
                        setFocusedFieldIndex(1);
                    } else if (activeElement === secondInputRef.current) {
                        thirdInputRef.current?.focus();
                        setFocusedFieldIndex(2);
                    } else if (activeElement === thirdInputRef.current) {
                        fourthInputRef.current?.focus();
                        setFocusedFieldIndex(3);
                    } else if (activeElement === fourthInputRef.current) {
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
                filteredItems.length > 0
            ) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT" ||
                    activeElement?.tagName === "TEXTAREA";

                // Check if we're in a select with dropdown open
                const isSelectWithDropdown =
                    activeElement?.tagName === "SELECT" &&
                    (activeElement as HTMLSelectElement).size > 1;

                if (isSelectWithDropdown) {
                    // Let the select handle its own navigation
                    return;
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
                            : Math.min(prev + 1, filteredItems.length - 1)
                    );
                }
            } else if (e.key === "ArrowUp" && !e.ctrlKey && !e.shiftKey) {
                const activeElement = document.activeElement as HTMLElement;
                const isInForm =
                    activeElement?.tagName === "INPUT" ||
                    activeElement?.tagName === "SELECT" ||
                    activeElement?.tagName === "TEXTAREA";

                // Check if we're in a select with dropdown open
                const isSelectWithDropdown =
                    activeElement?.tagName === "SELECT" &&
                    (activeElement as HTMLSelectElement).size > 1;

                if (isSelectWithDropdown) {
                    // Let the select handle its own navigation
                    return;
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
                } else if (!isInForm && filteredItems.length > 0) {
                    // If in list, navigate through list
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev === null
                            ? filteredItems.length - 1
                            : Math.max(prev - 1, 0)
                    );
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, filteredItems.length, handleDelete]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setForm((f) => ({
            ...f,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "UnitID"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ItemName || form.UnitID === 0) return;
        if (editIndex !== null) {
            setItems((items) =>
                items.map((u, i) =>
                    i === editIndex
                        ? { ...form, ItemID: items[editIndex].ItemID }
                        : u
                )
            );
            setEditIndex(null);
        } else {
            const existingIds = getExistingIds(items, "ItemID");
            const newId = generateId(form.ItemName, existingIds);
            setItems((items) => [...items, { ...form, ItemID: newId }]);
        }
        setForm({
            ItemName: "",
            ItemDescription: "",
            UnitID: 0,
            IsBase: false,
        });
        setSelectedIndex(null);
        setFocusedFieldIndex(0);
        setIsFormFocused(true);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const handleEdit = (idx: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ItemID, ...formData } = items[idx];
        setForm(formData);
        setEditIndex(idx);
        setSelectedIndex(idx);
    };

    const handleCancel = () => {
        setForm({
            ItemName: "",
            ItemDescription: "",
            UnitID: 0,
            IsBase: false,
        });
        setEditIndex(null);
        setSelectedIndex(null);
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    };

    const gridColumns: GridColumn<Item>[] = [
        {
            key: "ItemName",
            label: "Name",
            className: "dark-list-text item-crud__item-name",
        },
        {
            key: "ItemDescription",
            label: "Description",
            className: "dark-list-secondary item-crud__item-description",
            isSecondary: true,
            showWhenEmpty: true,
            emptyText: "No description",
            render: (item) => (
                <span
                    className={
                        !item.ItemDescription
                            ? "item-crud__item-description--empty"
                            : ""
                    }
                >
                    {item.ItemDescription || "No description"}
                </span>
            ),
        },
        {
            key: "UnitID",
            label: "Unit",
            className: "dark-list-secondary item-crud__item-unit",
            isSecondary: true,
            render: (item) =>
                units.find((unit) => unit.UnitID === item.UnitID)?.UnitName ||
                item.UnitID,
        },
        {
            key: "IsBase",
            label: "Base",
            className: "dark-list-secondary item-crud__item-base",
            isSecondary: true,
            render: (item) => (
                <span
                    style={{
                        color: item.IsBase ? "#4caf50" : "#757575",
                        fontWeight: item.IsBase ? "600" : "normal",
                    }}
                >
                    {item.IsBase ? "✓ Base" : "Recipe"}
                </span>
            ),
        },
    ];

    const gridActions: GridAction<Item>[] = [
        {
            label: "Edit",
            icon: "✏️",
            onClick: (item) => {
                // Find the actual index in the original items array
                const actualIndex = items.findIndex(
                    (i) => i.ItemID === item.ItemID
                );
                if (actualIndex !== -1) {
                    handleEdit(actualIndex);
                }
            },
            className: "item-crud__edit-button",
            stopPropagation: true,
            keyboardShortcut: ["Enter"],
        },
        {
            label: "Delete",
            icon: "🗑️",
            onClick: (item) => {
                // Find the actual index in the original items array
                const actualIndex = items.findIndex(
                    (i) => i.ItemID === item.ItemID
                );
                if (actualIndex !== -1) {
                    handleDelete(actualIndex);
                }
            },
            className: "item-crud__delete-button",
            stopPropagation: true,
            keyboardShortcut: ["Del"],
        },
    ];

    return (
        <Box className="item-crud crud-layout">
            <div className="crud-layout__header">
                <Typography
                    variant="h5"
                    className="item-crud__title"
                    color="primary.main"
                >
                    📦 Item Management
                </Typography>
            </div>

            {/* Item Form */}
            <div className="crud-layout__form">
                <div className="form-container">
                    <Typography variant="h6" className="item-crud__form-title">
                        {editIndex !== null ? "✏️ Edit Item" : "➕ Add Item"}
                    </Typography>
                    <form
                        onSubmit={handleSubmit}
                        className="dark-form item-crud__form form-layout"
                        ref={formRef}
                    >
                        {/* Form Fields Container */}
                        <div
                            className="form-layout__fields"
                            style={{ width: "auto" }}
                        >
                            {/* First Row: Name, Unit, Base */}
                            <div className="form-layout__row">
                                <Box
                                    sx={{ position: "relative" }}
                                    className="form-field-3-5"
                                >
                                    <input
                                        name="ItemName"
                                        placeholder="Name"
                                        value={form.ItemName}
                                        onChange={handleChange}
                                        onFocus={() => handleFieldFocus(0)}
                                        onBlur={handleFieldBlur}
                                        required
                                        className="dark-input item-crud__name-input"
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
                                    className="form-field-1-5"
                                >
                                    <select
                                        name="UnitID"
                                        value={form.UnitID}
                                        onChange={handleChange}
                                        onFocus={(e) => {
                                            handleFieldFocus(1);
                                            // Open the dropdown on focus
                                            const target =
                                                e.target as HTMLSelectElement;
                                            if (
                                                "showPicker" in target &&
                                                typeof target.showPicker ===
                                                    "function"
                                            ) {
                                                target.showPicker();
                                            } else {
                                                // Fallback for browsers that don't support showPicker
                                                target.size = Math.min(
                                                    units.length + 1,
                                                    10
                                                );
                                                setTimeout(() => {
                                                    target.size = 1;
                                                }, 100);
                                            }
                                        }}
                                        onBlur={handleFieldBlur}
                                        onKeyDown={(e) => {
                                            const target =
                                                e.target as HTMLSelectElement;
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                // Close dropdown and move to next field or submit
                                                if (target.size > 1) {
                                                    target.size = 1;
                                                }
                                                // If a valid unit is selected, move to next field
                                                if (form.UnitID !== 0) {
                                                    thirdInputRef.current?.focus();
                                                    setFocusedFieldIndex(2);
                                                }
                                            } else if (
                                                e.key === "ArrowDown" ||
                                                e.key === "ArrowUp"
                                            ) {
                                                // Allow default dropdown navigation, prevent grid navigation
                                                e.stopPropagation();
                                            } else if (e.key === "Escape") {
                                                // Close dropdown
                                                e.preventDefault();
                                                if (target.size > 1) {
                                                    target.size = 1;
                                                }
                                                target.blur();
                                            }
                                        }}
                                        required
                                        className="dark-select item-crud__unit-select"
                                        ref={secondInputRef}
                                    >
                                        <option value={0}>Select Unit</option>
                                        {units.map((u) => (
                                            <option
                                                key={u.UnitID}
                                                value={u.UnitID}
                                            >
                                                {u.UnitName}
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

                                <Box
                                    sx={{ position: "relative" }}
                                    className="form-field-1-5"
                                >
                                    <label className="dark-checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="IsBase"
                                            checked={form.IsBase}
                                            onChange={handleChange}
                                            onFocus={() => handleFieldFocus(2)}
                                            onBlur={handleFieldBlur}
                                            className="dark-checkbox item-crud__base-checkbox"
                                            ref={thirdInputRef}
                                        />
                                        <span className="dark-checkbox-text">
                                            Base Item (no inputs required)
                                        </span>
                                    </label>
                                    {focusedFieldIndex === 2 && (
                                        <KeyboardIndicator
                                            keys={["Tab"]}
                                            position="top-right"
                                        />
                                    )}
                                </Box>
                            </div>

                            {/* Second Row: Description */}
                            <div className="form-layout__row">
                                <Box
                                    sx={{ position: "relative" }}
                                    className="form-field-full"
                                >
                                    <textarea
                                        name="ItemDescription"
                                        placeholder="Description"
                                        value={form.ItemDescription}
                                        onChange={handleChange}
                                        onFocus={() => handleFieldFocus(3)}
                                        onBlur={handleFieldBlur}
                                        className="dark-textarea item-crud__description-input"
                                        ref={fourthInputRef}
                                        rows={3}
                                    />
                                    {focusedFieldIndex === 3 && (
                                        <KeyboardIndicator
                                            keys={["Tab"]}
                                            position="top-right"
                                        />
                                    )}
                                </Box>
                            </div>
                        </div>

                        {/* Submit Button Container */}
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
                                    className="item-crud__submit-button"
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
                                <Box>
                                    <KeyboardIndicator
                                        keys={["Ctrl", "Enter"]}
                                        position="bottom-center"
                                    />
                                </Box>
                                {editIndex !== null && (
                                    <Button
                                        onClick={handleCancel}
                                        variant="outlined"
                                        size="small"
                                        className="item-crud__cancel-button"
                                        sx={{ mt: 1 }}
                                    >
                                        ❌ Cancel
                                    </Button>
                                )}
                            </Box>
                        </div>

                        {/* Down arrow indicator when form is focused and there are items in the list */}
                        {isFormFocused && filteredItems.length > 0 && (
                            <KeyboardIndicator
                                keys={["↓"]}
                                position="bottom-right"
                            />
                        )}
                    </form>
                </div>
            </div>

            {/* Search Filter */}
            <div className="crud-layout__search">
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        marginBottom: 2,
                        padding: "0 16px",
                    }}
                >
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search items by name, description, or unit..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        ref={searchInputRef}
                        sx={{
                            flex: 1,
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                color: "white",
                                "& fieldset": {
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "rgba(255, 255, 255, 0.3)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "primary.main",
                                },
                            },
                            "& .MuiInputBase-input": {
                                color: "white",
                                "&::placeholder": {
                                    color: "rgba(255, 255, 255, 0.6)",
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <span
                                        style={{
                                            color: "rgba(255, 255, 255, 0.6)",
                                        }}
                                    >
                                        🔍
                                    </span>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {searchFilter && (
                        <Box
                            sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "0.875rem",
                            }}
                        >
                            {filteredItems.length} of {items.length} items
                        </Box>
                    )}
                </Box>
            </div>

            {/* Items list with scrolling container */}
            <div className="crud-layout__list">
                <DataGrid
                    data={filteredItems}
                    columns={gridColumns}
                    actions={gridActions}
                    selectedIndex={selectedIndex}
                    onSelectionChange={setSelectedIndex}
                    onEnterEdit={(filteredIndex) => {
                        // Find the actual index in the original items array
                        const item = filteredItems[filteredIndex];
                        if (item) {
                            const actualIndex = items.findIndex(
                                (i) => i.ItemID === item.ItemID
                            );
                            if (actualIndex !== -1) {
                                handleEdit(actualIndex);
                            }
                        }
                    }}
                    emptyStateConfig={{
                        icon: "📦",
                        title: searchFilter
                            ? "No items match your search"
                            : "No items defined yet",
                        subtitle: searchFilter
                            ? "Try adjusting your search terms"
                            : "Add your first item using the form above",
                    }}
                    className="item-crud__items-list"
                    itemClassName="item-crud__item-item"
                    selectedItemClassName="item-crud__item-item--selected"
                    idField="ItemID"
                />
            </div>
        </Box>
    );
}
