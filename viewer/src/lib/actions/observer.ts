import type { Action } from "svelte/action";

import { makeAction } from "$tools/fp";

const INTERSECT_EVENT = "dv.intersect";
const OBSERVE_INTERSECTION_EVENT = "dv.observeintersection";
const UNOBSERVE_INTERSECTION_EVENT = "dv.unobserveintersection";

export const publishIntersection: Action<Element> = (node) => {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        const event = new CustomEvent(INTERSECT_EVENT, {
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
    observer.observe(event.target as Element);
  }

  function handleUnobserveIntersection(event: Event) {
    event.stopPropagation();
    observer.unobserve(event.target as Element);
  }

  node.addEventListener(OBSERVE_INTERSECTION_EVENT, handleObserveIntersection);
  node.addEventListener(
    UNOBSERVE_INTERSECTION_EVENT,
    handleUnobserveIntersection,
  );

  return {
    destroy() {
      node.removeEventListener(
        OBSERVE_INTERSECTION_EVENT,
        handleObserveIntersection,
      );
      node.removeEventListener(
        UNOBSERVE_INTERSECTION_EVENT,
        handleUnobserveIntersection,
      );
      observer.disconnect();
    },
  };
};

type SubscribeIntersectionParams = {
  isActive: boolean;
  onIntersect: (isIntersecting: boolean) => void;
};

export const subscribeIntersection = makeAction(
  (node: Element, params: SubscribeIntersectionParams) => {
    const { onIntersect, isActive } = params;

    function handleIntersect(event: CustomEvent<boolean>) {
      onIntersect(event.detail);
    }

    if (isActive) {
      node.addEventListener(INTERSECT_EVENT, handleIntersect);
    }

    fireEvent(
      node,
      isActive ? OBSERVE_INTERSECTION_EVENT : UNOBSERVE_INTERSECTION_EVENT,
    );

    return () => {
      if (isActive) {
        node.removeEventListener(INTERSECT_EVENT, handleIntersect);
      }
    };
  },
);

function fireEvent(target: EventTarget, type: string) {
  const event = new Event(type, {
    bubbles: true,
  });
  target.dispatchEvent(event);
}
