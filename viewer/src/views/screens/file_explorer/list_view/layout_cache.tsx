import React from 'react';
import { CellMeasurerCache, CellMeasurerCacheParams} from 'react-virtualized';


interface IContext {
  cache: CellMeasurerCache;
}
const Context = React.createContext<IContext | null>(null);


export const LayoutCacheProvider: React.FC<CellMeasurerCacheParams> = (props) => {
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
};


export function useLayoutCache () {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error('LayoutCache is not ready');
  }
  return context;
}
