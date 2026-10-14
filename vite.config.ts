import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" — works on GitHub Pages sub-path and on Cloudflare Pages root alike.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { fs: { allow: [".."] } },
  build: { target: "es2020", sourcemap: false, chunkSizeWarningLimit: 400 },
});
