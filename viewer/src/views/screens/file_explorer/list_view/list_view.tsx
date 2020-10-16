import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { SELECTION_COLOR, getMixins } from '@/lib';
import { SimpleSelectable } from '@/views/hooks/simple_selectable';
import { LayoutCacheProvider } from './layout_cache';
import { ItemCacheProvider } from './item_cache';
import { RootList } from './root_list';
import { ToolBar } from './tool_bar';


const TOOLBAR_HEIGHT = 56;


const useStyles = makeStyles((theme) => ({
  listView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
      'vbox',
    ]),
  },
  head: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
      'vbox',
    ]),
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
    '& .MuiListItem-secondaryAction': {
      paddingRight: 64,
    },
  },
  tail: {
    ...getMixins([
      'w-100',
      'hbox',
    ]),
    position: 'fixed',
    height: TOOLBAR_HEIGHT,
    bottom: 0,
    backgroundColor: theme.palette.background.paper,
    boxSizing: 'border-box',
    padding: '0.25rem',
    justifyContent: 'space-between',
  },
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
  fakeToolBar: {
    // Safari need more space
    height: TOOLBAR_HEIGHT,
  },
  virtualList: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
    ]),
  },
}));


interface IProps {
  rootId: string | null;
}
export function ListView (props: IProps) {
  const classes = useStyles();
  const [nodeId, setNodeId] = React.useState(props.rootId);

  React.useEffect(() => {
    setNodeId(props.rootId);
  }, [props.rootId, setNodeId]);

  return (
    <LayoutCacheProvider
      fixedWidth={true}
      minHeight={50}
      defaultHeight={50}
    >
      <SimpleSelectable>
        <ItemCacheProvider setRootId={setNodeId}>
          <div className={classes.listView}>
            <div className={classes.head}>
              <div className={classes.virtualList}>
                <RootList rootId={nodeId} />
              </div>
              <div className={classes.fakeToolBar} />
            </div>
            <div className={classes.tail}>
              <ToolBar rootId={nodeId} />
            </div>
          </div>
        </ItemCacheProvider>
      </SimpleSelectable>
    </LayoutCacheProvider>
  );
}
