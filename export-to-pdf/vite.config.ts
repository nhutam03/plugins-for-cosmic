import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    build: {
        target: "node16",
        outDir: "dist",
        rollupOptions: {
            input: path.resolve(__dirname, "src/index.ts"),
            output: {
                format: "cjs",
                entryFileNames: "index.js",
            },
            external: ["electron", "fs", "path", "pdfkit", "net"],
        },
    },
    assetsInclude: ["fonts/*.ttf", "fonts/*.TTF"],
});