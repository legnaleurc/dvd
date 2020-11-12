import React from 'react';
import ReactDOM from 'react-dom';

import { FileSystem } from '@/lib';
import { Application } from '@/views/screens/application';

import './index.css';


const gFileSystem = new FileSystem();

ReactDOM.render(
  (
    <Application
      fileSystem={gFileSystem}
    />
  ),
  document.querySelector('body > .body'),
);
