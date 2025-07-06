import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./", // Use relative paths for Electron
    build: {
        outDir: "dist",
        assetsDir: "assets",
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        rollupOptions: {
            external: ["fs", "path", "os"], // Externalize Node.js modules
            output: {
                manualChunks: {
                    // Split vendor libraries into separate chunks
                    "react-vendor": ["react", "react-dom"],
                    "mui-vendor": [
                        "@mui/material",
                        "@mui/icons-material",
                        "@emotion/react",
                        "@emotion/styled",
                    ],
                    "d3-vendor": ["d3"],
                },
            },
        },
    },
    define: {
        // Define globals for better tree shaking
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
    },
    optimizeDeps: {
        // Pre-bundle these dependencies
        include: ["react", "react-dom", "@mui/material", "d3"],
        exclude: ["fs", "path", "os"], // Exclude Node.js modules from optimization
    },
});
