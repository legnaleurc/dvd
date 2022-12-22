import type { Action } from "svelte/action";

type ObserveIntersectionParams = {
  viewport: HTMLElement;
  isActive: boolean;
  onIntersect: (isIntersecting: boolean) => void;
};

export const observeIntersection: Action<
  HTMLElement,
  ObserveIntersectionParams
> = (node, params) => {
  let observer = setIntersectionObserver(node, params);
  return {
    update(newParams) {
      clearIntersectionObserver(observer);
      observer = setIntersectionObserver(node, newParams);
    },
    destroy() {
      clearIntersectionObserver(observer);
    },
  };
};

function setIntersectionObserver(
  node: HTMLElement,
  params: ObserveIntersectionParams,
): IntersectionObserver | null {
  const { isActive, viewport, onIntersect } = params;
  if (!isActive) {
    return null;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => onIntersect(entry.isIntersecting)),
    {
      root: viewport,
      rootMargin: "100% 0px 100% 0px",
      threshold: 0,
    },
  );
  observer.observe(node);
  return observer;
}

function clearIntersectionObserver(
  observer: IntersectionObserver | null,
): void {
  if (!observer) {
    return;
  }
  observer.disconnect();
}
