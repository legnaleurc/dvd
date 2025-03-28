import type { Action } from "svelte/action";

export function debounce<T extends readonly unknown[]>(
  fn: (...args: readonly [...T]) => void,
  delay: number,
) {
  let handle: ReturnType<typeof setTimeout>;
  return (...args: readonly [...T]) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
}

type EffectFunction<N, P> = (node: N, params: P) => () => void;

export function makeAction<N, P>(
  setEffect: EffectFunction<N, P>,
): Action<N, P> {
  return (node: N, params?: P) => {
    if (!params) {
      throw new Error("No params provided");
    }
    let clear = setEffect(node, params);
    return {
      update(newParams: P) {
        clear();
        clear = setEffect(node, newParams);
      },
      destroy() {
        clear();
      },
    };
  };
}
