import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@hooks": "/src/hooks",
      "@components": "/src/components",
      "@icons": "/src/icons",
      "@store": "/src/store",
      "@helpers": "/src/helpers",
      "@drawing-tools": "/src/drawing-tools",
      "@config": "/src/config",
      "@pages": "/src/pages",
    },
  },
});
