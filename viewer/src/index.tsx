import React from 'react';
import ReactDOM from 'react-dom';

import { Application } from '@/views/application';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import { ComicProvider } from '@/views/hooks/comic';
import { FileSystem } from '@/lib';

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
