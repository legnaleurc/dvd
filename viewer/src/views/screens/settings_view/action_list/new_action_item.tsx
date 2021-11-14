import React from 'react';
import { TextField, IconButton } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';


interface INewActionItem {
  newCategory: string;
  onCategoryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  newCommand: string;
  onCommandChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addAction: () => void;
}
export function NewActionItem (props: INewActionItem) {
  const {
    newCategory,
    onCategoryChange,
    newCommand,
    onCommandChange,
    addAction,
  } = props;
  return (
    <div>
      <TextField
        label="Category"
        value={newCategory}
        onChange={onCategoryChange}
      />
      <TextField
        label="Command"
        value={newCommand}
        onChange={onCommandChange}
      />
      <IconButton
        disabled={!newCategory}
        onClick={addAction}
      >
        <AddIcon />
      </IconButton>
    </div>
  );
}
