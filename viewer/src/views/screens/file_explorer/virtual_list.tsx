import React from 'react';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  CellMeasurerCacheParams,
  List,
} from 'react-virtualized';


const Context = React.createContext({
  cache: new CellMeasurerCache({
    fixedHeight: true,
    fixedWidth: true,
  }),
});


type ILayoutCacheProviderProps = React.PropsWithChildren<CellMeasurerCacheParams>;
export function LayoutCacheProvider (props: ILayoutCacheProviderProps) {
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


interface IChildProps {
  index: number;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
}


interface IVirtualListProps {
  count: number;
  renderer: (props: IChildProps) => React.ReactNode;
}
export function VirtualList (props: IVirtualListProps) {
  const { count, renderer } = props;

  const { cache } = useLayoutCache();

  return (
    <AutoSizer>
      {({ width, height }) => (
        <>
          <List
            width={width}
            height={height}
            rowCount={count}
            rowHeight={cache.rowHeight}
            deferredMeasurementCache={cache}
            rowRenderer={({ index, style, key, parent }) => (
              <CellMeasurer
                cache={cache}
                key={key}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
              >
                {({ measure, registerChild }) => (
                  <VirtualChild
                    index={index}
                    style={style}
                    measure={measure}
                    registerChild={registerChild}
                    renderer={renderer}
                  />
                )}
              </CellMeasurer>
            )}
          />
          <CacheValidator
            width={width}
            height={height}
            cache={cache}
          />
        </>
      )}
    </AutoSizer>
  );
}


interface ICacheValidatorProps {
  width: number;
  height: number;
  cache: CellMeasurerCache;
}
function CacheValidator (props: ICacheValidatorProps) {
  const { width, height, cache } = props;
  React.useEffect(() => {
    cache.clearAll();
  }, [width, height, cache]);
  return <React.Fragment />;
}


interface IVirtualChildProps {
  index: number;
  style: React.CSSProperties;
  measure: () => void;
  registerChild?: (element: Element) => void;
  renderer: (props: IChildProps) => React.ReactNode;
}
function VirtualChild (props: IVirtualChildProps) {
  const { index, style, measure, registerChild, renderer } = props;

  React.useEffect(() => {
    measure();
  }, [measure]);

  const itemRef = React.useCallback((element: Element | null) => {
    if (registerChild && element) {
      registerChild(element);
    }
  }, [registerChild]);

  return (
    <>
      {renderer({
        index,
        style,
        itemRef,
      })}
    </>
  );
}
