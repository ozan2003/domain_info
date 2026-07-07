import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:6633", // 6633 is the port of the backend server.
                changeOrigin: true,
            },
        },
    },
});
