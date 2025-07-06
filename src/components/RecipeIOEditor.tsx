import React, { useState } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Item } from "../types";
// Note: This component is deprecated and replaced with inline forms
type RecipeIO = {
    ItemID: number;
    Amount: number;
    type: "input" | "output";
    RecipeID: number;
};
import "./RecipeIOEditor.css";

interface RecipeIOEditorProps {
    recipeId: number;
    ioList: RecipeIO[];
    onIOAdd: (io: RecipeIO) => void;
    onIOUpdate: (index: number, io: RecipeIO) => void;
    onIODelete: (index: number) => void;
    items: Item[];
    title?: string;
    showTitle?: boolean;
}

export default function RecipeIOEditor({
    recipeId,
    ioList,
    onIOAdd,
    onIOUpdate,
    onIODelete,
    items,
    title = "🔄 Recipe Inputs & Outputs",
    showTitle = true,
}: RecipeIOEditorProps) {
    const [ioForm, setIOForm] = useState<RecipeIO>({
        RecipeID: recipeId,
        ItemID: 0,
        Amount: 0,
        type: "input",
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleIOChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setIOForm((prev: RecipeIO) => ({
            ...prev,
            [name]:
                name === "Amount"
                    ? Number(value)
                    : name === "ItemID"
                    ? Number(value)
                    : value,
        }));
    };

    const handleIOSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ioForm.ItemID) return;

        if (editIndex !== null) {
            onIOUpdate(editIndex, ioForm);
            setEditIndex(null);
        } else {
            onIOAdd(ioForm);
        }

        setIOForm({
            RecipeID: recipeId,
            ItemID: 0,
            Amount: 0,
            type: "input",
        });
    };

    const handleIOEdit = (localIndex: number) => {
        const io = ioList[localIndex];
        setIOForm(io);
        setEditIndex(localIndex);
    };

    const handleIODelete = (localIndex: number) => {
        onIODelete(localIndex);

        if (editIndex === localIndex) {
            setEditIndex(null);
            setIOForm({
                RecipeID: recipeId,
                ItemID: 0,
                Amount: 0,
                type: "input",
            });
        }
    };

    const handleCancel = () => {
        setEditIndex(null);
        setIOForm({
            RecipeID: recipeId,
            ItemID: 0,
            Amount: 0,
            type: "input",
        });
    };

    // Split inputs and outputs
    const recipeInputs = ioList.filter((io) => io.type === "input");
    const recipeOutputs = ioList.filter((io) => io.type === "output");

    return (
        <Box className="recipe-io-editor">
            {showTitle && (
                <Typography variant="h6" className="recipe-io-editor__title">
                    {title}
                </Typography>
            )}

            {/* Recipe I/O form */}
            <form
                onSubmit={handleIOSubmit}
                className="dark-form recipe-io-editor__form"
            >
                <select
                    name="ItemID"
                    value={ioForm.ItemID}
                    onChange={handleIOChange}
                    required
                    className="dark-select form-field-medium recipe-io-editor__item-select"
                >
                    <option value="">Select Item</option>
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
                    value={ioForm.Amount || ""}
                    onChange={handleIOChange}
                    className="dark-input form-field-small recipe-io-editor__amount-input"
                />
                <select
                    name="type"
                    value={ioForm.type}
                    onChange={handleIOChange}
                    className="dark-select form-field-small recipe-io-editor__type-select"
                >
                    <option value="input">Input</option>
                    <option value="output">Output</option>
                </select>
                <button
                    type="submit"
                    className="dark-button dark-button-primary recipe-io-editor__submit-button"
                >
                    {editIndex !== null ? "🔄 Update" : "➕ Add I/O"}
                </button>
                {editIndex !== null && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="dark-button dark-button-secondary recipe-io-editor__cancel-button"
                    >
                        ❌ Cancel
                    </button>
                )}
            </form>

            {/* Recipe I/O lists */}
            <Box className="recipe-io-editor__lists">
                {/* Inputs */}
                <Box className="recipe-io-editor__list">
                    <Typography
                        variant="subtitle2"
                        className="recipe-io-editor__list-title recipe-io-editor__list-title--inputs"
                    >
                        Inputs
                    </Typography>
                    {recipeInputs.length === 0 ? (
                        <Typography
                            variant="body2"
                            className="recipe-io-editor__list-empty"
                        >
                            No inputs defined
                        </Typography>
                    ) : (
                        recipeInputs.map((io, ioIndex) => {
                            const listIndex = ioList.findIndex(
                                (listIO) =>
                                    listIO.ItemID === io.ItemID &&
                                    listIO.type === io.type &&
                                    listIO.Amount === io.Amount
                            );
                            return (
                                <Box
                                    key={ioIndex}
                                    className="recipe-io-editor__item recipe-io-editor__item--input"
                                >
                                    <Typography
                                        variant="body2"
                                        className="recipe-io-editor__item-name"
                                    >
                                        {items.find(
                                            (item) => item.ItemID === io.ItemID
                                        )?.ItemName || io.ItemID}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        className="recipe-io-editor__item-amount"
                                    >
                                        × {io.Amount}
                                    </Typography>
                                    <Box className="recipe-io-editor__item-actions">
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                handleIOEdit(listIndex)
                                            }
                                            className="recipe-io-editor__edit-button"
                                        >
                                            Edit
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleIODelete(listIndex)
                                            }
                                            color="error"
                                            className="recipe-io-editor__delete-button"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>

                {/* Outputs */}
                <Box className="recipe-io-editor__list">
                    <Typography
                        variant="subtitle2"
                        className="recipe-io-editor__list-title recipe-io-editor__list-title--outputs"
                    >
                        Outputs
                    </Typography>
                    {recipeOutputs.length === 0 ? (
                        <Typography
                            variant="body2"
                            className="recipe-io-editor__list-empty"
                        >
                            No outputs defined
                        </Typography>
                    ) : (
                        recipeOutputs.map((io, ioIndex) => {
                            const listIndex = ioList.findIndex(
                                (listIO) =>
                                    listIO.ItemID === io.ItemID &&
                                    listIO.type === io.type &&
                                    listIO.Amount === io.Amount
                            );
                            return (
                                <Box
                                    key={ioIndex}
                                    className="recipe-io-editor__item recipe-io-editor__item--output"
                                >
                                    <Typography
                                        variant="body2"
                                        className="recipe-io-editor__item-name"
                                    >
                                        {items.find(
                                            (item) => item.ItemID === io.ItemID
                                        )?.ItemName || io.ItemID}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        className="recipe-io-editor__item-amount"
                                    >
                                        × {io.Amount}
                                    </Typography>
                                    <Box className="recipe-io-editor__item-actions">
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                handleIOEdit(listIndex)
                                            }
                                            className="recipe-io-editor__edit-button"
                                        >
                                            Edit
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleIODelete(listIndex)
                                            }
                                            color="error"
                                            className="recipe-io-editor__delete-button"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>
        </Box>
    );
}
