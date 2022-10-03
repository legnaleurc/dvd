import type { PluginOption, UserConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

const redirect = (map: Record<string, string>): PluginOption => ({
  name: "redirect",
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      if (map[req.url]) {
        res.statusCode = 302;
        res.setHeader("Location", map[req.url]);
        res.setHeader("Content-Length", "0");
        res.end();
      } else {
        next();
      }
    });
  },
});

const config: UserConfig = {
  server: {
    proxy: {
      "/api": process.env.BACKEND_BASE_URL,
    },
  },
  plugins: [sveltekit(), redirect({ "/": "/files" })],
  test: {
    deps: {
      inline: ["msw"],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
};

export default config;
