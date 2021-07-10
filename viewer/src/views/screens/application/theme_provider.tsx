import React from 'react';
import { createTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles';

import { FONT_FAMILY } from '@/lib';


const gTheme = createTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    fontFamily: FONT_FAMILY,
  },
});


export const ThemeProvider_: React.FC<{}> = (props) => {
  return (
    <ThemeProvider theme={gTheme}>
      {props.children}
    </ThemeProvider>
  );
};
