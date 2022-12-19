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
  const { viewport, isActive, onIntersect } = params;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        onIntersect(entry.isIntersecting);
      });
    },
    {
      root: viewport,
      rootMargin: "100% 0px 100% 0px",
      threshold: 0,
    },
  );

  if (isActive) {
    observer.observe(node);
  }

  return {
    update(params) {
      if (params.isActive) {
        observer.observe(node);
      } else {
        observer.disconnect();
      }
    },
    destroy() {
      observer.disconnect();
    },
  };
};
