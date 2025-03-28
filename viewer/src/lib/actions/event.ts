import { makeAction } from "$tools/fp";

type EventHandler<E> = (event: E) => void;

export const enterpress = makeAction(
  (node: HTMLElement, handler: EventHandler<KeyboardEvent>) => {
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

export const mouseclick = makeAction(
  (node: HTMLElement, handler: EventHandler<MouseEvent>) => {
    let lastTarget: EventTarget | null = null;

    function handleMouseDown(event: MouseEvent) {
      lastTarget = null;
      if (event.target !== event.currentTarget) {
        return;
      }
      lastTarget = event.target;
    }

    function handleMouseUp(event: MouseEvent) {
      const isIdentical = lastTarget === event.target;
      lastTarget = null;
      if (event.target !== event.currentTarget) {
        return;
      }
      if (!isIdentical) {
        return;
      }
      handler(event);
    }

    node.addEventListener("mousedown", handleMouseDown);
    node.addEventListener("mouseup", handleMouseUp);
    return () => {
      node.removeEventListener("mouseup", handleMouseUp);
      node.removeEventListener("mousedown", handleMouseDown);
    };
  },
);
