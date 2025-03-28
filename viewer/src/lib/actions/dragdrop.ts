import { makeAction } from "$tools/fp";

type DragActionParams = {
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
};

export const drag = makeAction(
  (node: HTMLElement, params?: DragActionParams) => {
    function handleDragStart(event: DragEvent) {
      event.stopPropagation();
      if (!event.dataTransfer) {
        return;
      }
      const el = event.currentTarget as Element;
      el.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      params?.onDragStart?.(event);
    }

    function handleDragEnd(event: DragEvent) {
      event.stopPropagation();
      if (!event.dataTransfer) {
        return;
      }
      const el = event.currentTarget as Element;
      el.classList.remove("dragging");
      const data = event.dataTransfer;
      if (data.dropEffect === "none" || data.mozUserCancelled) {
        // User canceled.
        return;
      }
      params?.onDragEnd?.(event);
    }

    node.addEventListener("dragstart", handleDragStart);
    node.addEventListener("dragend", handleDragEnd);

    return () => {
      node.removeEventListener("dragstart", handleDragStart);
      node.removeEventListener("dragend", handleDragEnd);
    };
  },
);

type DropActionParams = {
  onDragEnter?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
};

export const drop = makeAction(
  (node: HTMLElement, params?: DropActionParams) => {
    let dragCounter = 0;

    function handleDragEnter(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.dataTransfer) {
        return;
      }
      const el = event.currentTarget as Element;
      if (dragCounter === 0) {
        el.classList.add("drag-over");
        event.dataTransfer.dropEffect = "move";
        params?.onDragEnter?.(event);
      }
      dragCounter += 1;
    }
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
    }
    function handleDragLeave(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.dataTransfer) {
        return;
      }
      const el = event.currentTarget as Element;
      dragCounter -= 1;
      if (dragCounter === 0) {
        el.classList.remove("drag-over");
        event.dataTransfer.dropEffect = "none";
      }
    }
    function handleDrop(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
      const el = event.currentTarget as Element;
      dragCounter = 0;
      el.classList.remove("drag-over");
      params?.onDrop?.(event);
    }

    node.addEventListener("dragenter", handleDragEnter);
    node.addEventListener("dragover", handleDragOver);
    node.addEventListener("dragleave", handleDragLeave);
    node.addEventListener("drop", handleDrop);

    return () => {
      node.removeEventListener("dragenter", handleDragEnter);
      node.removeEventListener("dragover", handleDragOver);
      node.removeEventListener("dragleave", handleDragLeave);
      node.removeEventListener("drop", handleDrop);
    };
  },
);
