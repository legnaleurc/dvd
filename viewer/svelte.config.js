import process from "process";

import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { splitVendorChunkPlugin } from "vite";

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
      plugins: [splitVendorChunkPlugin()],
    },
  },
};

export default config;
