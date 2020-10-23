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

  React.useEffect(() => {
    setName(props.name);
  }, [props.open]);

  return (
    <Dialog
      className={classes.renameDialog}
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>Rename</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.name}
        </DialogContentText>
        <TextField
          autoFocus={true}
          fullWidth={true}
          value={name}
          onChange={onChange}
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
