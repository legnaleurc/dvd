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

type ButtonClickHandler = (event: KeyboardEvent | MouseEvent) => void;

export const onButtonClick: Action<HTMLElement, ButtonClickHandler> = (
  node,
  handler,
) => {
  function keyDownHandler(event: KeyboardEvent) {
    if (event.key !== " ") {
      return;
    }
    event.preventDefault();
    handler(event);
  }

  node.addEventListener("click", handler);
  node.addEventListener("keydown", keyDownHandler);
  return {
    destroy() {
      node.removeEventListener("keydown", keyDownHandler);
      node.removeEventListener("click", handler);
    },
  };
};

export const onButtonDoubleClick: Action<HTMLElement, ButtonClickHandler> = (
  node,
  handler,
) => {
  function keyDownHandler(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    handler(event);
  }

  node.addEventListener("dblclick", handler);
  node.addEventListener("keydown", keyDownHandler);
  return {
    destroy() {
      node.removeEventListener("keydown", keyDownHandler);
      node.removeEventListener("dblclick", handler);
    },
  };
};
