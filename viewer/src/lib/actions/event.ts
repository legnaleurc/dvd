import { makeAction } from "$tools/fp";

type KeyboardEventHandler = (event: KeyboardEvent) => void;

export const enterpress = makeAction(
  (node: EventTarget, handler: KeyboardEventHandler) => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      handler(event);
    }
    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
    };
  },
);
