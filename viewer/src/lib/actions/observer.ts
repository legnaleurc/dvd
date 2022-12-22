import type { Action } from "svelte/action";

export const observeIntersectionParent: Action<HTMLElement> = (node) => {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        const event = new CustomEvent("intersect", {
          detail: entry.isIntersecting,
        });
        entry.target.dispatchEvent(event);
      }),
    {
      root: node,
      rootMargin: "100% 0px 100% 0px",
      threshold: 0,
    },
  );

  function handleObserveIntersection(event: Event) {
    event.stopPropagation();
    observer.observe(event.target as HTMLElement);
  }

  function handleUnobserveIntersection(event: Event) {
    event.stopPropagation();
    observer.unobserve(event.target as HTMLElement);
  }

  node.addEventListener("observeintersection", handleObserveIntersection);
  node.addEventListener("unobserveintersection", handleUnobserveIntersection);

  return {
    destroy() {
      node.removeEventListener(
        "observeintersection",
        handleObserveIntersection,
      );
      node.removeEventListener(
        "unobserveintersection",
        handleUnobserveIntersection,
      );
      observer.disconnect();
    },
  };
};

type ObserveIntersectionChildParams = {
  isActive: boolean;
  onIntersect: (isIntersecting: boolean) => void;
};

export const observeIntersectionChild: Action<
  HTMLElement,
  ObserveIntersectionChildParams
> = (node, params) => {
  let clear = setIntersectionChild(node, params);
  return {
    update(newParams) {
      clear();
      clear = setIntersectionChild(node, newParams);
    },
    destroy() {
      clear();
      fireEvent(node, "unobserveintersection");
    },
  };
};

function setIntersectionChild(
  node: HTMLElement,
  params: ObserveIntersectionChildParams,
) {
  const { onIntersect, isActive } = params;

  function handleIntersect(event: CustomEvent<boolean>) {
    onIntersect(event.detail);
  }

  if (isActive) {
    node.addEventListener("intersect", handleIntersect);
  }

  fireEvent(node, isActive ? "observeintersection" : "unobserveintersection");

  return () => {
    if (isActive) {
      node.removeEventListener("intersect", handleIntersect);
    }
  };
}

function fireEvent(target: EventTarget, type: string) {
  const event = new Event(type, {
    bubbles: true,
  });
  target.dispatchEvent(event);
}
