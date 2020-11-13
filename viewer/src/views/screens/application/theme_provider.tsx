import React from 'react';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles';


const gTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});


export const ThemeProvider_: React.FC<{}> = (props) => {
  return (
    <ThemeProvider theme={gTheme}>
      {props.children}
    </ThemeProvider>
  );
};
