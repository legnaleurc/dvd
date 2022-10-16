import type { Action } from "svelte/action";

type KeyboardEventHandler = (event: KeyboardEvent) => void;

export const onEnterPress: Action<HTMLElement, KeyboardEventHandler> = (
  node,
  handler,
) => {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    handler(event);
  }
  node.addEventListener("keydown", handleKeyDown);
  return {
    destroy() {
      node.removeEventListener("keydown", handleKeyDown);
    },
  };
};
