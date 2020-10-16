import React from 'react';
import { CellMeasurerCache, CellMeasurerCacheParams} from 'react-virtualized';


const Context = React.createContext({
  cache: new CellMeasurerCache({
    fixedHeight: true,
    fixedWidth: true,
  }),
});


type IProps = React.PropsWithChildren<CellMeasurerCacheParams>;
export function LayoutCacheProvider (props: IProps) {
  const { children, ...params } = props;

  const cache = React.useRef(new CellMeasurerCache(params));

  return (
    <Context.Provider
      value={{
        cache: cache.current,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}


export function useLayoutCache () {
  return React.useContext(Context);
}
