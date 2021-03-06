import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { FileSystem } from '@/lib';
import { FullScreenProvider } from '@/views/hooks/fullscreen';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { ComicProvider } from '@/views/hooks/comic';
import { RootRoute } from '@/views/hooks/router';

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
                    <RootRoute component={Application} />
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


export const HotApplication = React.memo(ShellApplication);


function LoadingBlock (props: {}) {
  return (
    <h1>Loading...</h1>
  );
}
