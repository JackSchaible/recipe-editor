import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
} from "@mui/material";
import type { Item, Recipe } from "../types";
import "./TodoTab.css";

export default function TodoTab({
    items,
    recipes,
}: {
    items: Item[];
    recipes: Recipe[];
}) {
    // Find items that are not marked as base and have no recipes where they're an output
    const unconfiguredItems = items.filter((item) => {
        // Skip if it's marked as a base item
        if (item.IsBase) return false;

        // Check if this item appears as an output in any recipe
        const hasRecipe = recipes.some((recipe) =>
            recipe.Outputs.some((output) => output.ItemID === item.ItemID)
        );

        // Include if it has no recipe
        return !hasRecipe;
    });

    return (
        <Box className="todo-tab">
            <div className="todo-tab__header">
                <Typography
                    variant="h5"
                    className="todo-tab__title"
                    color="primary.main"
                >
                    📋 Todo: Unconfigured Items
                </Typography>
                <Typography
                    variant="body2"
                    className="todo-tab__subtitle"
                    color="text.secondary"
                >
                    Items that are not marked as "base" and have no recipes
                    producing them
                </Typography>
            </div>

            <Box className="todo-tab__content">
                {unconfiguredItems.length === 0 ? (
                    <Box className="todo-tab__empty-state">
                        <Typography variant="h6" color="success.main">
                            🎉 All items are configured!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Every item is either marked as a base item or has at
                            least one recipe that produces it.
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" className="todo-tab__count">
                            {unconfiguredItems.length} item
                            {unconfiguredItems.length !== 1 ? "s" : ""} need
                            {unconfiguredItems.length === 1 ? "s" : ""}{" "}
                            attention:
                        </Typography>
                        <List className="todo-tab__list">
                            {unconfiguredItems.map((item) => (
                                <ListItem
                                    key={item.ItemID}
                                    className="todo-tab__list-item"
                                    sx={{
                                        backgroundColor:
                                            "rgba(255, 193, 7, 0.1)",
                                        border: "1px solid rgba(255, 193, 7, 0.3)",
                                        borderRadius: "8px",
                                        marginBottom: "8px",
                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(255, 193, 7, 0.2)",
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    component="span"
                                                >
                                                    {item.ItemName}
                                                </Typography>
                                                <Chip
                                                    label="Needs Recipe"
                                                    size="small"
                                                    color="warning"
                                                    sx={{
                                                        fontSize: "0.7rem",
                                                        height: "20px",
                                                    }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {item.ItemDescription ||
                                                        "No description"}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="warning.main"
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    ⚠️ This item needs either:
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ ml: 2 }}
                                                >
                                                    • A recipe that produces it,
                                                    OR
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ ml: 2 }}
                                                >
                                                    • Mark it as a "Base Item"
                                                    if it requires no inputs
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
