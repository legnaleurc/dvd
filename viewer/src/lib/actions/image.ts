import type { Action } from "svelte/action";

export const retry: Action<HTMLImageElement> = (node) => {
  let retry = 0;

  function handleError() {
    if (retry > 3) {
      return;
    }
    const url = new URL(node.src);
    const hash = `${++retry}_${Date.now()}`;
    url.searchParams.set("_retry", hash);
    node.src = url.toString();
  }

  node.addEventListener("error", handleError);

  return {
    destroy() {
      node.removeEventListener("error", handleError);
    },
  };
};
