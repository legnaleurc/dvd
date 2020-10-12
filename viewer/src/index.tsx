import React from 'react';
import ReactDOM from 'react-dom';

import { FileSystem } from '@/lib';
import { Application } from '@/views/screens/application';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { ComicProvider } from '@/views/hooks/comic';

import './index.css';


const fileSystem = new FileSystem();

ReactDOM.render(
  (
    <GlobalProvider fileSystem={fileSystem}>
      <FileSystemProvider>
        <ComicProvider>
          <Application />
        </ComicProvider>
      </FileSystemProvider>
    </GlobalProvider>
  ),
  document.querySelector('body > .body'),
);
