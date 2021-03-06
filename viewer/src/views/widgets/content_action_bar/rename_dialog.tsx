import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useInstance } from '@/lib';


const useStyles = makeStyles((theme) => ({
  renameDialog: {},
}));


interface IProps {
  open: boolean;
  onClose: () => void;
  name: string;
  rename: (name: string) => Promise<void>;
}
export function RenameDialog (props: IProps) {
  const classes = useStyles();

  const [name, setName] = React.useState('');
  const self = useInstance(() => ({
    async rename () {
      await props.rename(name);
      props.onClose();
    },
  }), [name, props.onClose, props.rename]);

  const onChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value);
  }, [setName]);
  const onRename = React.useCallback(async () => {
    await self.current.rename();
  }, [self]);
  const onKeyPress = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    await self.current.rename();
  }, [self]);

  React.useEffect(() => {
    setName(props.name);
  }, [props.open]);

  return (
    <Dialog
      id="rename-dialog"
      aria-labelledby="rename-dialog-title"
      className={classes.renameDialog}
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle id="rename-dialog-title">Rename</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.name}
        </DialogContentText>
        <TextField
          autoFocus={true}
          fullWidth={true}
          value={name}
          onChange={onChange}
          onKeyPress={onKeyPress}
        />
        <DialogActions>
          <Button
            onClick={props.onClose}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={onRename}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
