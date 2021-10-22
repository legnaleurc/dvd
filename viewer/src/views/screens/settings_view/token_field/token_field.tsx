import React from 'react';
import { TextField, IconButton } from '@material-ui/core';
import { SaveAlt as SaveIcon } from '@material-ui/icons';

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
  };
}


export function TokenField (props: {}) {
  const {
    newToken,
    onTokenChange,
    updateToken,
  } = useActions();
  return (
    <div>
      <TextField
        type="password"
        autoComplete="off"
        label="Token"
        value={newToken}
        onChange={onTokenChange}
      />
      <IconButton onClick={updateToken}>
        <SaveIcon />
      </IconButton>
    </div>
  );
}
