import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
    alias: {
      $mocks: "mocks",
      $actions: "src/lib/actions",
      $stores: "src/lib/stores",
      $tools: "src/lib/tools",
      $types: "src/lib/types",
      $atoms: "src/lib/components/atoms",
      $molecules: "src/lib/components/molecules",
      $organisms: "src/lib/components/organisms",
    },
  },
};
