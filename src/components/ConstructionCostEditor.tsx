import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import type { BuildingConstructionCost, Item } from "../types";
import "./ConstructionCostEditor.css";

interface ConstructionCostEditorProps {
    costs: BuildingConstructionCost[];
    onCostAdd: (cost: BuildingConstructionCost) => void;
    onCostUpdate: (index: number, cost: BuildingConstructionCost) => void;
    onCostDelete: (index: number) => void;
    items: Item[];
    title?: string;
    showTitle?: boolean;
}

export default function ConstructionCostEditor({
    costs,
    onCostAdd,
    onCostUpdate,
    onCostDelete,
    items,
    title = "💰 Construction Costs",
    showTitle = true,
}: ConstructionCostEditorProps) {
    const [costForm, setCostForm] = useState<BuildingConstructionCost>({
        ItemID: 0,
        Amount: 0,
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    // Use costs directly since they're already filtered for this building
    const buildingCosts = costs;

    const handleCostChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setCostForm((prev) => ({
            ...prev,
            [name]:
                name === "Amount"
                    ? Number(value)
                    : name === "ItemID"
                    ? Number(value)
                    : value,
        }));
    };

    const handleCostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (costForm.ItemID === 0) return;

        if (editIndex !== null) {
            onCostUpdate(editIndex, costForm);
            setEditIndex(null);
        } else {
            onCostAdd(costForm);
        }

        setCostForm({
            ItemID: 0,
            Amount: 0,
        });
    };

    const handleCostEdit = (localIndex: number) => {
        const cost = buildingCosts[localIndex];
        setCostForm(cost);
        setEditIndex(localIndex);
    };

    const handleCostDelete = (localIndex: number) => {
        onCostDelete(localIndex);

        if (editIndex === localIndex) {
            setEditIndex(null);
            setCostForm({
                ItemID: 0,
                Amount: 0,
            });
        }
    };

    const handleCancel = () => {
        setEditIndex(null);
        setCostForm({
            ItemID: 0,
            Amount: 0,
        });
    };

    return (
        <Box className="construction-cost-editor">
            {showTitle && (
                <Typography
                    variant="h6"
                    className="construction-cost-editor__title"
                >
                    {title}
                </Typography>
            )}

            {/* Construction cost form */}
            <form
                onSubmit={handleCostSubmit}
                className="dark-form construction-cost-editor__form"
            >
                <select
                    name="ItemID"
                    value={costForm.ItemID}
                    onChange={handleCostChange}
                    required
                    className="dark-select form-field-large construction-cost-editor__item-select"
                >
                    <option value={0}>Select Item</option>
                    {items.map((item) => (
                        <option key={item.ItemID} value={item.ItemID}>
                            {item.ItemName}
                        </option>
                    ))}
                </select>
                <input
                    name="Amount"
                    type="number"
                    placeholder="Amount"
                    value={costForm.Amount || ""}
                    onChange={handleCostChange}
                    className="dark-input form-field-small construction-cost-editor__amount-input"
                />
                <button
                    type="submit"
                    className="dark-button dark-button-primary construction-cost-editor__submit-button"
                >
                    {editIndex !== null ? "🔄 Update" : "➕ Add Cost"}
                </button>
                {editIndex !== null && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="dark-button dark-button-secondary construction-cost-editor__cancel-button"
                    >
                        ❌ Cancel
                    </button>
                )}
            </form>

            {/* Construction costs list */}
            <Box className="construction-cost-editor__list">
                {buildingCosts.length === 0 && (
                    <Typography className="construction-cost-editor__empty-state">
                        No construction costs defined
                    </Typography>
                )}
                {buildingCosts.map((cost, costIndex) => (
                    <div
                        key={`${cost.ItemID}-${costIndex}`}
                        className="dark-list-item construction-cost-editor__list-item"
                    >
                        <Typography className="dark-list-text construction-cost-editor__item-name">
                            {items.find((item) => item.ItemID === cost.ItemID)
                                ?.ItemName || cost.ItemID}
                        </Typography>
                        <Typography className="dark-list-secondary construction-cost-editor__amount-display">
                            Amount: {cost.Amount}
                        </Typography>
                        <div className="dark-list-buttons">
                            <Button
                                onClick={() => handleCostEdit(costIndex)}
                                variant="contained"
                                size="small"
                                className="construction-cost-editor__edit-button"
                            >
                                ✏️ Edit
                            </Button>
                            <Button
                                onClick={() => handleCostDelete(costIndex)}
                                variant="contained"
                                size="small"
                                className="construction-cost-editor__delete-button"
                            >
                                🗑️ Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </Box>
        </Box>
    );
}
