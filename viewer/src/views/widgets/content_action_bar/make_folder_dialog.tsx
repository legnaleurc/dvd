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
  makeFolderDialog: {},
}));


interface IProps {
  open: boolean;
  onClose: () => void;
  name: string;
  mkdir: (name: string) => Promise<void>;
}
export function MakeFolderDialog (props: IProps) {
  const classes = useStyles();

  const [name, setName] = React.useState('');
  const self = useInstance(() => ({
    async mkdir () {
      await props.mkdir(name);
      props.onClose();
    },
  }), [name, props.onClose, props.mkdir]);

  const onChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value);
  }, [setName]);
  const onMkdir = React.useCallback(async () => {
    await self.current.mkdir();
  }, [self]);
  const onKeyPress = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    await self.current.mkdir();
  }, [self]);

  React.useEffect(() => {
    setName('');
  }, [props.open]);

  return (
    <Dialog
      className={classes.makeFolderDialog}
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>Create New Folder</DialogTitle>
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
            onClick={onMkdir}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
