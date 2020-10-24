import React from 'react';
import { Box } from '@material-ui/core';
import clsx from 'clsx';

import { useFullScreenState } from '@/views/hooks/fullscreen';
import { Classes } from './hooks';
import { TabPanel } from './tab_panel';
import { ISiteChunk } from './site_map';


interface IProps {
  classes: Classes;
  siteMap: ISiteChunk[];
  tabIndex: number;
  toolBarEl?: HTMLDivElement;
}
export function Content (props: IProps) {
  const { classes, siteMap, tabIndex, toolBarEl } = props;
  const { fullScreen } = useFullScreenState();
  return (
    <Box className={classes.tail}>
      <div
        className={clsx(classes.fakeToolBar, {
          [classes.hidden]: fullScreen,
        })}
      />
      {siteMap.map((chunk, index) => (
        <TabPanel
          key={chunk.id}
          classes={classes}
          index={index}
          value={tabIndex}
        >
          <chunk.context>
            <chunk.main />
            <chunk.toolBar
              anchorEl={index === tabIndex ? toolBarEl : undefined}
            />
          </chunk.context>
        </TabPanel>
      ))}
    </Box>
  );
}
