import React from 'react';

import { useFileSystemState, Node_ } from '@/views/hooks/file_system';
import { useItemCache } from './item_cache';
import { VirtualList } from './virtual_list';
import { ItemView } from './item_view';


interface IPureProps {
  root: Node_;
  changeRoot: (id: string) => Promise<void>;
}
function PureRootList (props: IPureProps) {
  const { root, changeRoot } = props;

  if (!root.children) {
    return null;
  }

  const children = root.children;

  return (
      <VirtualList
        count={children.length}
        renderer={({ index, style, itemRef }) => (
          <ItemView
            nodeId={children[index]}
            changeRoot={changeRoot}
            isLast={index === (children.length - 1)}
            style={style}
            itemRef={itemRef}
          />
        )}
      />
  );
}
const MemorizedPureRootList = React.memo(PureRootList);


interface IProps {
  rootId: string | null;
}
export function RootList (props: IProps) {
  const { rootId } = props;
  const { nodes } = useFileSystemState();
  const { changeRoot } = useItemCache();

  if (!rootId) {
    return null;
  }
  const root = nodes[rootId];
  if (!root) {
    return null;
  }

  return (
    <MemorizedPureRootList
      root={root}
      changeRoot={changeRoot}
    />
  );
}
