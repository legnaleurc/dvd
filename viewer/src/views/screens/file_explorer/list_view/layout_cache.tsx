import React from 'react';
import { CellMeasurerCache, CellMeasurerCacheParams} from 'react-virtualized';


interface IContext {
  cache: CellMeasurerCache;
  updateIdList: (idList: string[]) => void;
}
const Context = React.createContext<IContext | null>(null);


export const LayoutCacheProvider: React.FC<CellMeasurerCacheParams> = (props) => {
  const { children, ...params } = props;

  const idList = React.useRef<string[]>([]);
  const updateIdList = React.useCallback((newIdList: string[]) => {
    idList.current = newIdList;
  }, []);
  const keyMapper = React.useCallback((rowIndex: number, columnIndex: number) => {
    return idList.current[rowIndex];
  }, []);
  const cache = React.useRef(new CellMeasurerCache({
    ...params,
    keyMapper,
  }));

  return (
    <Context.Provider
      value={{
        cache: cache.current,
        updateIdList,
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
