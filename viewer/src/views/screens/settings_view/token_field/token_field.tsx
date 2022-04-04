import React from 'react';
import { TextField, IconButton } from '@material-ui/core';
import {
  Refresh as RefreshIcon,
  SaveAlt as SaveIcon,
} from '@material-ui/icons';

import { loadToken, saveToken, useInstance } from '@/lib';


function useActions () {
  const [newToken, setNewToken] = React.useState('');

  const onTokenChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewToken(event.currentTarget.value);
  }, [setNewToken]);

  const self = useInstance(() => ({
    updateToken () {
      saveToken(newToken);
    },
  }), [
    newToken,
  ]);

  const updateToken = React.useCallback(() => {
    self.current.updateToken();
  }, [self]);

  const reloadWindow = React.useCallback(() => {
    location.reload();
  }, []);

  React.useEffect(() => {
    const token = loadToken();
    if (token) {
      setNewToken(token);
    }
  }, []);

  return {
    newToken,
    onTokenChange,
    updateToken,
    reloadWindow,
  };
}


export function TokenField (props: {}) {
  const {
    newToken,
    onTokenChange,
    updateToken,
    reloadWindow,
  } = useActions();
  return (
    <div>
      <TextField
        aria-autocomplete="none"
        type="password"
        autoComplete="off"
        label="Token"
        name="token"
        value={newToken}
        onChange={onTokenChange}
      />
      <IconButton onClick={updateToken}>
        <SaveIcon />
      </IconButton>
      <IconButton onClick={reloadWindow}>
        <RefreshIcon />
      </IconButton>
    </div>
  );
}
