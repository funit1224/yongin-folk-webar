import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        webar: resolve(__dirname, "webar.html"),
        placementPreview: resolve(__dirname, "placement-preview.html"),
        assetInspector: resolve(__dirname, "asset-inspector.html"),
      },
    },
  },
});

