import React from 'react';
import ReactDOM from 'react-dom';

import { FileSystem } from '@/lib';
import { Application } from '@/views/screens/application';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { ComicProvider } from '@/views/hooks/comic';

import './index.css';


const fileSystem = new FileSystem();

ReactDOM.render(
  (
    <GlobalProvider fileSystem={fileSystem}>
      <FileSystemProvider>
        <QueueProvider>
          <ComicProvider>
            <Application />
          </ComicProvider>
        </QueueProvider>
      </FileSystemProvider>
    </GlobalProvider>
  ),
  document.querySelector('body > .body'),
);
