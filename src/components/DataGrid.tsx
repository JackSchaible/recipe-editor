import React, { useEffect } from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardIndicator from "./KeyboardIndicator";

export interface GridColumn<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
    isSecondary?: boolean;
    showWhenEmpty?: boolean;
    emptyText?: string;
}

export interface GridAction<T> {
    label: string;
    icon?: string; // Emoji icon
    onClick: (item: T, index: number) => void;
    className?: string;
    stopPropagation?: boolean;
    keyboardShortcut?: string[]; // Keys for the keyboard indicator
}

export interface DataGridProps<T> {
    data: T[];
    columns: GridColumn<T>[];
    actions?: GridAction<T>[];
    selectedIndex: number | null;
    onSelectionChange: (index: number | null) => void;
    emptyStateConfig: {
        icon: string;
        title: string;
        subtitle: string;
    };
    className?: string;
    itemClassName?: string;
    selectedItemClassName?: string;

    // For accordion-style grids
    useAccordion?: boolean;
    expandedIndex?: number | false;
    onAccordionChange?: (index: number | false) => void;
    renderAccordionDetails?: (item: T, index: number) => React.ReactNode;

    // ID field for keys
    idField: keyof T;

    // Enter key handler for editing
    onEnterEdit?: (index: number) => void;
}

export default function DataGrid<T>({
    data,
    columns,
    actions = [],
    selectedIndex,
    onSelectionChange,
    emptyStateConfig,
    className = "",
    itemClassName = "",
    selectedItemClassName = "",
    useAccordion = false,
    expandedIndex = false,
    onAccordionChange,
    renderAccordionDetails,
    idField,
    onEnterEdit,
}: DataGridProps<T>) {
    // Handle Enter key for editing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && selectedIndex !== null && onEnterEdit) {
                e.preventDefault();
                onEnterEdit(selectedIndex);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, onEnterEdit]);

    const renderNavigationIndicators = (index: number) => {
        if (selectedIndex !== index) return null;

        return (
            <>
                {index === 0 && data.length > 1 && (
                    <>
                        <KeyboardIndicator keys={["↑"]} position="top-right" />
                        <KeyboardIndicator
                            keys={["↓"]}
                            position="bottom-right"
                        />
                    </>
                )}
                {index === 0 && data.length === 1 && (
                    <KeyboardIndicator keys={["↑"]} position="top-right" />
                )}
                {index > 0 && index < data.length - 1 && (
                    <>
                        <KeyboardIndicator keys={["↑"]} position="top-right" />
                        <KeyboardIndicator
                            keys={["↓"]}
                            position="bottom-right"
                        />
                    </>
                )}
                {index === data.length - 1 && index > 0 && (
                    <KeyboardIndicator keys={["↑"]} position="top-right" />
                )}
            </>
        );
    };

    const renderItem = (item: T, index: number) => {
        const isSelected = selectedIndex === index;
        const itemKey = String(item[idField]);

        const itemStyle = {
            cursor: "pointer",
            backgroundColor: isSelected
                ? "rgba(255, 255, 255, 0.1)"
                : "transparent",
            border: isSelected ? "2px solid #4ECDC4" : "2px solid transparent",
            position: "relative" as const,
        };

        const renderContent = () => (
            <Box className={`data-grid__item-content ${itemClassName}`}>
                {columns.map((column, colIndex) => {
                    let content: React.ReactNode;

                    if (column.render) {
                        content = column.render(item, index);
                    } else {
                        const value = item[column.key as keyof T];
                        if (!value && column.showWhenEmpty) {
                            content = column.emptyText || "No description";
                        } else {
                            content = String(value || "");
                        }
                    }

                    const columnClass = `${column.className || ""} ${
                        column.isSecondary
                            ? "dark-list-secondary"
                            : colIndex === 0
                            ? "dark-list-text"
                            : "dark-list-secondary"
                    }`;

                    return (
                        <Typography
                            key={String(column.key)}
                            className={columnClass}
                        >
                            {content}
                        </Typography>
                    );
                })}

                {/* Only render actions in non-accordion mode to avoid nested buttons */}
                {!useAccordion && actions.length > 0 && (
                    <Box
                        className="data-grid__item-actions"
                        sx={{
                            display: "flex",
                            gap: 0,
                            alignItems: "flex-start",
                            justifyContent: "flex-end",
                            minWidth: "auto",
                            flexShrink: 0,
                            width: "fit-content",
                            marginLeft: "auto",
                            padding: "0",
                        }}
                    >
                        {actions.map((action, actionIndex) => (
                            <Box
                                key={actionIndex}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    position: "relative",
                                    width: "28px",
                                }}
                            >
                                <IconButton
                                    onClick={(e) => {
                                        if (action.stopPropagation) {
                                            e.stopPropagation();
                                        }
                                        action.onClick(item, index);
                                    }}
                                    size="small"
                                    className={action.className || ""}
                                    sx={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.1)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: 28,
                                        height: 28,
                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(255, 255, 255, 0.2)",
                                        },
                                    }}
                                >
                                    {action.icon || action.label}
                                </IconButton>
                                {action.keyboardShortcut && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            mt: 0.25,
                                        }}
                                    >
                                        <KeyboardIndicator
                                            keys={action.keyboardShortcut}
                                            position="bottom-center"
                                            size="small"
                                        />
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );

        const renderAccordionActions = () =>
            actions.length > 0 && (
                <Box
                    className="data-grid__item-actions"
                    sx={{
                        position: "absolute",
                        top: "16px",
                        right: "48px", // Leave space for expand icon
                        display: "flex",
                        gap: 0,
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        zIndex: 1,
                    }}
                >
                    {actions.map((action, actionIndex) => (
                        <Box
                            key={actionIndex}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                position: "relative",
                                width: "28px",
                            }}
                        >
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation(); // Always stop propagation for accordion actions
                                    action.onClick(item, index);
                                }}
                                size="small"
                                className={action.className || ""}
                                sx={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: 28,
                                    height: 28,
                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.2)",
                                    },
                                }}
                            >
                                {action.icon || action.label}
                            </IconButton>
                            {action.keyboardShortcut && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: "100%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        mt: 0.25,
                                    }}
                                >
                                    <KeyboardIndicator
                                        keys={action.keyboardShortcut}
                                        position="bottom-center"
                                        size="small"
                                    />
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            );

        if (useAccordion) {
            return (
                <Accordion
                    key={itemKey}
                    className={`data-grid__accordion ${className}`}
                    expanded={expandedIndex === index}
                    onChange={() =>
                        onAccordionChange?.(
                            expandedIndex === index ? false : index
                        )
                    }
                    style={itemStyle}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className="data-grid__accordion-summary"
                        onClick={() =>
                            onSelectionChange(
                                selectedIndex === index ? null : index
                            )
                        }
                    >
                        {renderContent()}
                    </AccordionSummary>

                    {/* Render action buttons outside of the summary to avoid nested buttons */}
                    {renderAccordionActions()}

                    {renderNavigationIndicators(index)}

                    {renderAccordionDetails && (
                        <AccordionDetails className="data-grid__accordion-details">
                            {renderAccordionDetails(item, index)}
                        </AccordionDetails>
                    )}
                </Accordion>
            );
        } else {
            return (
                <div
                    key={itemKey}
                    className={`data-grid__item ${itemClassName} ${
                        isSelected
                            ? `data-grid__item--selected ${selectedItemClassName}`
                            : ""
                    }`}
                    onClick={() =>
                        onSelectionChange(
                            selectedIndex === index ? null : index
                        )
                    }
                    style={itemStyle}
                >
                    {renderContent()}
                    {renderNavigationIndicators(index)}
                </div>
            );
        }
    };

    return (
        <Box className={`data-grid ${className}`}>
            {data.length === 0 && (
                <div className="dark-empty-state">
                    <Typography color="#e2e8f0" variant="h6">
                        {emptyStateConfig.icon} {emptyStateConfig.title}
                    </Typography>
                    <Typography color="#a0aec0" variant="body2" sx={{ mt: 1 }}>
                        {emptyStateConfig.subtitle}
                    </Typography>
                </div>
            )}
            {data.map(renderItem)}
        </Box>
    );
}
