import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || "";

  return {
    plugins: [react()],
    server: {
      host: "localhost",
      port: 4173,
      proxy: {
        "/api/groq": {
          target: "https://api.groq.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/groq/, ""),
          headers: groqKey ? { Authorization: `Bearer ${groqKey}` } : undefined,
        },
      },
    },
  };
});
