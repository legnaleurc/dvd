import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

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
