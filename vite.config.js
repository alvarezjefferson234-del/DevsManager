import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        servicios: resolve(import.meta.dirname, "servicios.html"),
        proceso: resolve(import.meta.dirname, "proceso.html"),
        sobreMi: resolve(import.meta.dirname, "sobre-mi.html"),
        contacto: resolve(import.meta.dirname, "contacto.html"),
      },
      output: {
        manualChunks: {
          three: ["three", "three/addons/loaders/GLTFLoader.js", "three/addons/controls/OrbitControls.js"],
        },
      },
    },
  },
});
