import React from 'react';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles';


const gTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});


export function ThemeProvider_ (props: React.PropsWithChildren<{}>) {
  return (
    <ThemeProvider theme={gTheme}>
      {props.children}
    </ThemeProvider>
  );
}
