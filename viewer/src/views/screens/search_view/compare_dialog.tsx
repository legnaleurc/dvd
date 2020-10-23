import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from '@material-ui/core';

import { useContext } from './context';


interface IProps {
  open: boolean;
  onClose: () => void;
}
export function CompareDialog (props: IProps) {
  const { open, onClose } = props;
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Compare Result</DialogTitle>
      <DialogContent>
        <InnerCompareList />
      </DialogContent>
    </Dialog>
  );
}


function InnerCompareList (props: {}): JSX.Element {
  const { dict, compareList, identical } = useContext();

  if (compareList.length <= 0) {
    return <React.Fragment />;
  }
  if (identical) {
    return (
      <DialogContentText>
        OK
      </DialogContentText>
    );
  }
  return (
    <>
      {compareList.map((id) => (
        <pre key={id}>
          {`${dict[id].size}: ${dict[id].path}`}
        </pre>
      ))}
    </>
  );
}
