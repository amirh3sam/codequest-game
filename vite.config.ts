import { defineConfig } from "vite";

export default defineConfig({
  // Phaser alone is ~1.3 MB minified; that's expected for a game bundle.
  build: { chunkSizeWarningLimit: 1600 },
});
