import process from "process";

import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { splitVendorChunkPlugin } from "vite";

/**
 * @param {Record<string, string>} map
 * @returns {import('vite').PluginOption}
 */
const redirect = (map) => ({
  name: "redirect",
  configureServer: (server) => () => {
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

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
    vite: {
      server: {
        proxy: {
          "/api": process.env.BACKEND_BASE_URL,
        },
      },
      plugins: [redirect({ "/": "/files" }), splitVendorChunkPlugin()],
    },
  },
};

export default config;
