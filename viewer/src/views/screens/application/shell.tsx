import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';

import { FileSystem } from '@/lib';
import { FullScreenProvider } from '@/views/hooks/fullscreen';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { ComicProvider } from '@/views/hooks/comic';

const ThemeProvider = React.lazy(() => import('./lazy/theme_provider'));
const Application = React.lazy(() => import('./lazy/application'));


interface IProps {
  fileSystem: FileSystem;
}
function ShellApplication (props: IProps) {
  return (
    <GlobalProvider fileSystem={props.fileSystem}>
      <React.Suspense fallback={<LoadingBlock />}>
        <ThemeProvider>
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
      </React.Suspense>
    </GlobalProvider>
  );
}


export const HotApplication = hot(React.memo(ShellApplication));


function LoadingBlock (props: {}) {
  return (
    <h1>Loading...</h1>
  );
}
