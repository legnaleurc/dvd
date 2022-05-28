type DragActionParams = {
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
};
export function drag(node: HTMLElement, params?: DragActionParams) {
  function handleDragStart(event: DragEvent) {
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    el.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    if (params?.onDragStart) {
      params.onDragStart(event);
    }
  }

  function handleDragEnd(event: DragEvent) {
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    el.classList.remove("dragging");
    const data = event.dataTransfer;
    if (data.dropEffect === "none" || data.mozUserCancelled) {
      // User canceled.
      return;
    }
    if (params?.onDragEnd) {
      params.onDragEnd(event);
    }
  }

  node.addEventListener("dragstart", handleDragStart);
  node.addEventListener("dragend", handleDragEnd);
  return {
    destroy() {
      node.removeEventListener("dragstart", handleDragStart);
      node.removeEventListener("dragend", handleDragEnd);
    },
  };
}

type DropActionParams = {
  onDragEnter?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
};
export function drop(node: HTMLElement, params?: DropActionParams) {
  let dragCounter = 0;

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    if (dragCounter === 0) {
      el.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
      if (params?.onDragEnter) {
        params.onDragEnter(event);
      }
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
    const el = event.currentTarget as HTMLElement;
    dragCounter -= 1;
    if (dragCounter === 0) {
      el.classList.remove("drag-over");
      event.dataTransfer.dropEffect = "none";
    }
  }
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    dragCounter = 0;
    el.classList.remove("drag-over");
    if (params?.onDrop) {
      params.onDrop(event);
    }
  }

  node.addEventListener("dragenter", handleDragEnter);
  node.addEventListener("dragover", handleDragOver);
  node.addEventListener("dragleave", handleDragLeave);
  node.addEventListener("drop", handleDrop);
  return {
    destroy() {
      node.removeEventListener("dragenter", handleDragEnter);
      node.removeEventListener("dragover", handleDragOver);
      node.removeEventListener("dragleave", handleDragLeave);
      node.removeEventListener("drop", handleDrop);
    },
  };
}
