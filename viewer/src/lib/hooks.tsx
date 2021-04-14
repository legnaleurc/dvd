import React from 'react';


export function useInstance<T, U extends readonly unknown[]> (fn: () => T, dependeincies: readonly [...U]) {
  const self = React.useRef(fn());

  React.useEffect(() => {
    self.current = fn();
  }, [fn, ...dependeincies]);

  return self;
}


export function debounce<T extends readonly unknown[]> (fn: (...args: readonly [...T]) => void, delay: number) {
  let handle: ReturnType<typeof setTimeout>;
  return (...args: readonly [...T]) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
}
