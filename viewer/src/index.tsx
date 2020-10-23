import React from 'react';
import ReactDOM from 'react-dom';
import { createMuiTheme } from '@material-ui/core/styles';

import { FileSystem } from '@/lib';
import { Application } from '@/views/screens/application';

import './index.css';


const gFileSystem = new FileSystem();
const gTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

ReactDOM.render(
  (
    <Application
      fileSystem={gFileSystem}
      theme={gTheme}
    />
  ),
  document.querySelector('body > .body'),
);
