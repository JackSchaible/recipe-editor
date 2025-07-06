import { Box } from "@mui/material";

interface KeyboardIndicatorProps {
    keys: string[];
    position?:
        | "top-right"
        | "bottom-right"
        | "top-left"
        | "bottom-left"
        | "bottom-center";
    size?: "small" | "medium";
}

export default function KeyboardIndicator({
    keys,
    position = "bottom-right",
    size = "small",
}: KeyboardIndicatorProps) {
    const getPositionStyles = () => {
        const baseStyles = {
            position: "absolute" as const,
            zIndex: 10,
            display: "flex",
            gap: "2px",
        };

        switch (position) {
            case "top-right":
                return { ...baseStyles, top: 4, right: 4 };
            case "bottom-right":
                return { ...baseStyles, bottom: 4, right: 4 };
            case "top-left":
                return { ...baseStyles, top: 4, left: 4 };
            case "bottom-left":
                return { ...baseStyles, bottom: 4, left: 4 };
            case "bottom-center":
                return {
                    ...baseStyles,
                    bottom: 4,
                    transform: "translateX(-50%)",
                };
            default:
                return { ...baseStyles, bottom: 4, right: 4 };
        }
    };

    const getKeyStyles = () => {
        const sizeClass = size === "medium" ? "keyboard-chiclet--large" : "";
        return `keyboard-chiclet keyboard-chiclet--inline ${sizeClass}`.trim();
    };

    return (
        <Box sx={getPositionStyles()}>
            {keys.map((key, index) => (
                <Box key={index} className={getKeyStyles()}>
                    {key.toUpperCase()}
                </Box>
            ))}
        </Box>
    );
}
