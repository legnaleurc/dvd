import type { PluginOption, UserConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

const redirect = (map: Record<string, string>): PluginOption => ({
  name: "redirect",
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      const url = req.originalUrl;
      if (url && map[url]) {
        res.statusCode = 302;
        res.setHeader("Location", map[url]);
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
      "/api": process.env.BACKEND_BASE_URL ?? "",
    },
  },
  plugins: [tailwindcss(), sveltekit(), redirect({ "/": "/files" })],
};

export default config;
