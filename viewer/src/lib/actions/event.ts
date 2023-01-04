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

type ClickHandler = (event: KeyboardEvent | MouseEvent) => void;

export const click = makeAction((node: EventTarget, handler: ClickHandler) => {
  function keyDownHandler(event: KeyboardEvent) {
    if (event.key !== " ") {
      return;
    }
    event.preventDefault();
    handler(event);
  }
  node.addEventListener("click", handler);
  node.addEventListener("keydown", keyDownHandler);
  return () => {
    node.removeEventListener("keydown", keyDownHandler);
    node.removeEventListener("click", handler);
  };
});

export const dblclick = makeAction(
  (node: EventTarget, handler: ClickHandler) => {
    function keyDownHandler(event: KeyboardEvent) {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      handler(event);
    }
    node.addEventListener("dblclick", handler);
    node.addEventListener("keydown", keyDownHandler);
    return () => {
      node.removeEventListener("keydown", keyDownHandler);
      node.removeEventListener("dblclick", handler);
    };
  },
);
