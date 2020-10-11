import React from 'react';
import {
  Box,
  IconButton,
  TextField,
} from '@material-ui/core';
import {
  Delete as DeleteIcon,
  SaveAlt as SaveAltIcon,
} from '@material-ui/icons';

import { useInstance } from '@/lib';


type IClasses = Record<(
  | 'actionRow'
), string>;
interface IProps {
  classes: IClasses;
  category: string;
  command: string;
  onUpdate: (category: string, command: string) => void;
  onRemove: (category: string) => void;
}


function useActions (props: IProps) {
  const [category, setCategory] = React.useState(props.category);
  const [command, setCommand] = React.useState(props.command);

  const onCategoryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCategory(event.currentTarget.value);
  }, [setCategory]);
  const onCommandChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCommand(event.currentTarget.value);
  }, [setCommand]);

  const self = useInstance(() => ({
    onUpdate () {
      props.onUpdate(category, command);
    },
    onRemove () {
      props.onRemove(category);
    },
  }), [
    props.onUpdate,
    category,
    command,
  ]);

  const onUpdate = React.useCallback(() => {
    self.current.onUpdate();
  }, [self]);
  const onRemove = React.useCallback(() => {
    self.current.onRemove();
  }, [self]);

  return {
    category,
    command,
    setCommand,
    onCategoryChange,
    onCommandChange,
    onUpdate,
    onRemove,
  };
}


export function ActionItem (props: IProps) {
  const {
    category,
    command,
    setCommand,
    onCategoryChange,
    onCommandChange,
    onUpdate,
    onRemove,
  } = useActions(props);

  React.useEffect(() => {
    setCommand(props.command);
  }, [setCommand, props.command]);

  return (
    <Box className={props.classes.actionRow}>
      <TextField
        label="Category"
        value={category}
        onChange={onCategoryChange}
      />
      <TextField
        label="Command"
        value={command}
        onChange={onCommandChange}
      />
      <IconButton onClick={onUpdate}>
        <SaveAltIcon />
      </IconButton>
      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}
