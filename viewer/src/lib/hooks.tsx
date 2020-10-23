import React from 'react';


export function useInstance<T, U extends readonly unknown[]> (fn: () => T, dependeincies: readonly [...U]) {
  const self = React.useRef(fn());

  React.useEffect(() => {
    self.current = fn();
  }, [fn, ...dependeincies]);

  return self;
}
