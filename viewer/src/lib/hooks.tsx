import React from 'react';


type Connector<O, N> = (component: React.ComponentType<O & N>) => React.ComponentType<O>;
export type MapFunction<C, O, N> = (value: C, props: O) => N;

export function connectConsumer<ValueType, OldPropsType, NewPropsType> (
  Consumer: React.Consumer<ValueType>,
  mapValueToProps: MapFunction<ValueType, OldPropsType, NewPropsType>,
): Connector<OldPropsType, NewPropsType> {
  return Component => (
    props => (
      <Consumer>
        {(value) => {
          const newProps = mapValueToProps(value, props);
          return <Component {...props} {...newProps} />;
        }}
      </Consumer>
    )
  );
}


export function useInstance<T> (fn: () => T, dependeincies: ReadonlyArray<any> ) {
  const self = React.useRef(fn());

  React.useEffect(() => {
    self.current = fn();
  }, [fn, ...dependeincies]);

  return self;
}
