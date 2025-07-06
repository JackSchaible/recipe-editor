import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { Item } from "../types";
import "./ItemSelector.css";

interface ItemSelectorProps {
    items: Item[];
    value: number; // ItemID
    onChange: (itemId: number) => void;
    placeholder?: string;
    className?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    disabled?: boolean;
}

const ItemSelector = React.forwardRef<HTMLInputElement, ItemSelectorProps>(
    (
        {
            items,
            value,
            onChange,
            placeholder = "Select Item...",
            className,
            onFocus,
            onBlur,
            onKeyDown,
            disabled = false,
        },
        ref
    ) => {
        // Sort items alphabetically by name
        const sortedItems = [...items].sort((a, b) =>
            a.ItemName.localeCompare(b.ItemName)
        );

        // Find the selected item
        const selectedItem =
            sortedItems.find((item) => item.ItemID === value) || null;

        return (
            <Autocomplete
                className="item-selector"
                options={sortedItems}
                getOptionLabel={(option) => option.ItemName}
                value={selectedItem}
                onChange={(_, newValue) => {
                    onChange(newValue ? newValue.ItemID : 0);
                }}
                disabled={disabled}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        className={className}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                        inputRef={ref}
                        sx={{
                            "& .MuiInputBase-root": {
                                backgroundColor: "#2d3748",
                                border: "1px solid #4a5568",
                                borderRadius: "6px",
                                color: "#e2e8f0",
                                fontSize: "0.875rem",
                                height: "48px",
                                "&:hover": {
                                    borderColor: "#63b3ed",
                                },
                                "&.Mui-focused": {
                                    borderColor: "#4cd9c4",
                                    boxShadow:
                                        "0 0 0 2px rgba(76, 217, 196, 0.2)",
                                },
                            },
                            "& .MuiInputBase-input": {
                                padding: "12px 14px",
                                color: "#e2e8f0",
                                "&::placeholder": {
                                    color: "#a0aec0",
                                    opacity: 1,
                                },
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                border: "none",
                            },
                            "& .MuiAutocomplete-endAdornment": {
                                "& .MuiSvgIcon-root": {
                                    color: "#a0aec0",
                                },
                            },
                        }}
                    />
                )}
                sx={{
                    "& .MuiPaper-root": {
                        backgroundColor: "#2d3748",
                        border: "1px solid #4a5568",
                        borderRadius: "6px",
                        maxHeight: "200px",
                    },
                    "& .MuiAutocomplete-option": {
                        color: "#e2e8f0",
                        padding: "8px 12px",
                        "&:hover": {
                            backgroundColor: "rgba(99, 179, 237, 0.1)",
                        },
                        "&.Mui-focused": {
                            backgroundColor: "rgba(76, 217, 196, 0.1)",
                        },
                    },
                    "& .MuiAutocomplete-noOptions": {
                        color: "#a0aec0",
                        padding: "8px 12px",
                    },
                }}
            />
        );
    }
);

ItemSelector.displayName = "ItemSelector";

export default ItemSelector;
