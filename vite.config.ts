import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "z.ico",
        "AppImages/fiado.png",
        "AppImages/fiadofriendly.png"
      ],
      manifest: {
        name: "FIADO",
        short_name: "FIADO",
        description: "App de gestión de fiados (créditos de confianza) para tiendas",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          { src: "AppImages/android/android-launchericon-48-48.png",  sizes: "48x48",  type: "image/png", purpose: "any maskable" },
          { src: "AppImages/android/android-launchericon-72-72.png",  sizes: "72x72",  type: "image/png", purpose: "any maskable" },
          { src: "AppImages/android/android-launchericon-96-96.png",  sizes: "96x96",  type: "image/png", purpose: "any maskable" },
          { src: "AppImages/android/android-launchericon-144-144.png", sizes: "144x144", type: "image/png", purpose: "any maskable" },
          { src: "AppImages/android/android-launchericon-192-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "AppImages/android/android-launchericon-512-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "/",
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
