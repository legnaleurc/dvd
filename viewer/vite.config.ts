import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    proxy: { "^/api(/|$)": process.env.BACKEND_BASE_URL ?? "" },
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: "index.html" }),
    }),
  ],
  test: {
    // Node.js 25+ enables Web Storage by default, which shadows jsdom's
    // localStorage with one that is undefined without --localstorage-file.
    execArgv: ["--no-experimental-webstorage"],
  },
});
