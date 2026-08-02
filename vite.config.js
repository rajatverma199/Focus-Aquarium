import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin.js";

export default defineConfig({
  plugins: [
    sites(),
    cloudflare({
      config: {
        name: "server",
        main: "./worker/index.js",
        compatibility_date: "2026-05-22",
        assets: {
          binding: "ASSETS",
          not_found_handling: "single-page-application",
          run_worker_first: true,
        },
      },
    }),
  ],
});
