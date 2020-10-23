import React from 'react';


export function useInstance<T> (fn: () => T, dependeincies: ReadonlyArray<any> ) {
  const self = React.useRef(fn());

  React.useEffect(() => {
    self.current = fn();
  }, [fn, ...dependeincies]);

  return self;
}
