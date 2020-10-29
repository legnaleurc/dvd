import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import { ThemeProvider, Theme } from '@material-ui/core/styles';

import { FileSystem } from '@/lib';
import { FullScreenProvider } from '@/views/hooks/fullscreen';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { ComicProvider } from '@/views/hooks/comic';
import { Application } from './application';


interface IProps {
  fileSystem: FileSystem;
  theme: Theme;
}
function ShellApplication (props: IProps) {
  return (
    <GlobalProvider fileSystem={props.fileSystem}>
      <ThemeProvider theme={props.theme}>
        <FileSystemProvider>
          <QueueProvider>
            <ComicProvider>
              <FullScreenProvider>
                <BrowserRouter>
                  <Switch>
                    <Redirect exact from="/" to="/files" />
                    <Route
                      path="/:tabId"
                      component={Application}
                    />
                  </Switch>
                </BrowserRouter>
              </FullScreenProvider>
            </ComicProvider>
          </QueueProvider>
        </FileSystemProvider>
      </ThemeProvider>
    </GlobalProvider>
  );
}


export const HotApplication = hot(React.memo(ShellApplication));
