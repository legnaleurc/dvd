import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';
import { useQueueState } from '@/views/hooks/queue';


const useStyles = makeStyles((theme) => ({
  queueDialog: {},
  body: {
    minWidth: 200,
  },
  info: {
    ...getMixins([
      'hbox',
    ]),
    justifyContent: 'space-around',
  },
  pendingText: {
    color: theme.palette.primary.light,
  },
  resolvedText: {
    color: theme.palette.success.light,
  },
  rejectedText: {
    color: theme.palette.error.light,
  },
}));


interface IProps {
  open: boolean;
  onClose: () => void;
}
export function QueueDialog (props: IProps) {
  const {
    nameList,
    pendingCount,
    resolvedCount,
    rejectedCount,
  } = useQueueState();
  const classes = useStyles();

  return (
    <Dialog
      id="queue-dialog"
      aria-labelledby="queue-dialog-title"
      className={classes.queueDialog}
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle id="queue-dialog-title">Queued Actions</DialogTitle>
      <DialogContent>
        <div className={classes.body}>
          <List>
            {nameList.map((name, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={name}
                />
              </ListItem>
            ))}
          </List>
          <div className={classes.info}>
            <Typography className={classes.pendingText}>
              {pendingCount}
            </Typography>
            <Typography className={classes.rejectedText}>
              {rejectedCount}
            </Typography>
            <Typography className={classes.resolvedText}>
              {resolvedCount}
            </Typography>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
