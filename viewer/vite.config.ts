import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
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

export default defineConfig({
  server: { proxy: { "/api": process.env.BACKEND_BASE_URL ?? "" } },
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: "index.html" }),
      alias: {
        $mocks: "mocks",
        $tests: "tests",
        $actions: "src/lib/actions",
        $stores: "src/lib/stores",
        $tools: "src/lib/tools",
        $types: "src/lib/types",
        $atoms: "src/lib/components/atoms",
        $molecules: "src/lib/components/molecules",
        $organisms: "src/lib/components/organisms",
      },
    }),
    redirect({ "/": "/files" }),
  ],
  test: {
    // Node.js 25+ enables Web Storage by default, which shadows jsdom's
    // localStorage with one that is undefined without --localstorage-file.
    execArgv: ["--no-experimental-webstorage"],
  },
});
