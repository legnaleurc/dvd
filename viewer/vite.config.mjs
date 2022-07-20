import { sveltekit } from "@sveltejs/kit/vite";
import { splitVendorChunkPlugin } from "vite";

/**
 * @param {Record<string, string>} map
 * @returns {import('vite').PluginOption}
 */
const redirect = (map) => ({
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

/** @type {import('vite').UserConfig} */
export default {
  server: {
    proxy: {
      "/api": process.env.BACKEND_BASE_URL,
    },
  },
  plugins: [sveltekit(), redirect({ "/": "/files" }), splitVendorChunkPlugin()],
};
