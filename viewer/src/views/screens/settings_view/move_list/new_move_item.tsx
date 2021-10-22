import React from 'react';
import { TextField, IconButton } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';


interface INewMoveItem {
  newDestination: string;
  onDestinationChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addDestination: () => void;
}
export function NewMoveItem (props: INewMoveItem) {
  const {
    newDestination,
    onDestinationChange,
    addDestination,
  } = props;
  return (
    <div>
      <TextField
        label="Destination"
        value={newDestination}
        onChange={onDestinationChange}
      />
      <IconButton
        disabled={!newDestination}
        onClick={addDestination}
      >
        <AddIcon />
      </IconButton>
    </div>
  );
}
