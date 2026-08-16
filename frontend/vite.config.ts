// frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * The app's own version, stamped into the bundle at build time.
 *
 * More reads `import.meta.env.VITE_APP_VERSION` to render its version
 * line. Nothing had ever set it — no `.env`, no `define`, no CI step —
 * so a repo-wide search found the variable in exactly one file: the one
 * reading it. The value was always "" and the line never rendered, which
 * left an app shipping through three stores with no answer in the
 * interface to "which version am I running".
 *
 * Sourced from package.json rather than written twice.
 * `version_stamp.test.mjs` asserts this define still exists, because
 * removing it would put the line back to silently rendering nothing.
 */
const appVersion = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf8")
).version;

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/app",
      filename: "app-sw.ts",
      injectRegister: false,
      includeAssets: ["icons/*"],
      manifest: {
        name: "ScoreGenius",
        short_name: "ScoreGenius",
        description:
          "ScoreGenius: Powerful predictive stats for passionate fans",
        scope: "/app",
        start_url: "/app",
        theme_color: "#1F2937",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["fullscreen", "standalone", "minimal-ui"],
        //splash_pages: ["splash_screen.html"],
        icons: [
          {
            src: "/icons/football-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/football-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/football-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  publicDir: "public",

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      lodash: "lodash-es",
    },
  },

  server: {
    open: "/app",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        // Points at production so the app runs with real data straight after
        // `npm install && npm run dev`, with no backend to stand up. The API
        // is the same one the published PWA calls from the browser.
        target: "https://scoregenius.io",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "public/index.html"),
        app: resolve(__dirname, "app.html"),
      },
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const pkg = id.split("node_modules/")[1].split("/")[0];
            return `vendor-${pkg.replace("@", "")}`;
          }
        },
      },
    },
  },

  preview: {
    port: 3000,
  },
});
