import build from "@hono/vite-build/cloudflare-workers";
import devServer from "@hono/vite-dev-server";
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
    if (mode === "client")
    return {
      esbuild: {
        jsxImportSource: "hono/jsx/dom",
      },
      build: {
        rollupOptions: {
          input: "./src/client.tsx",
          output: {
            entryFileNames: "static/client.js",
          },
        },
      },
    };
    return {
    plugins: [
      build({
        entry: "src/index.tsx",
      }),
      devServer({
        entry: "src/index.tsx",
      }),
    ],
  };
})
