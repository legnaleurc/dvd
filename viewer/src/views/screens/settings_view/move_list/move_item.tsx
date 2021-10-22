import React from 'react';
import {
  IconButton,
  TextField,
} from '@material-ui/core';
import {
  Delete as DeleteIcon,
  SaveAlt as SaveAltIcon,
} from '@material-ui/icons';

import { useInstance } from '@/lib';


interface IProps {
  index: number;
  destination: string;
  onUpdate: (index: number, destination: string) => void;
  onRemove: (index: number) => void;
}


function useActions (props: IProps) {
  const [destination, setDestination] = React.useState('')

  const onDestinationChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDestination(event.currentTarget.value);
  }, []);

  const self = useInstance(() => ({
    onUpdate () {
      props.onUpdate(props.index, destination);
    },
    onRemove () {
      props.onRemove(props.index);
    },
  }), [
    props.index,
    props.onUpdate,
    props.onRemove,
    destination,
  ]);

  const onUpdate = React.useCallback(() => {
    self.current.onUpdate();
  }, [self]);
  const onRemove = React.useCallback(() => {
    self.current.onRemove();
  }, [self]);

  return {
    destination,
    setDestination,
    onDestinationChange,
    onUpdate,
    onRemove,
  };
}


export function MoveItem (props: IProps) {
  const {
    destination,
    setDestination,
    onDestinationChange,
    onUpdate,
    onRemove,
  } = useActions(props);

  React.useEffect(() => {
    setDestination(props.destination);
  }, [setDestination, props.destination]);

  return (
    <div>
      <TextField
        label="Destination"
        value={destination}
        onChange={onDestinationChange}
      />
      <IconButton onClick={onUpdate}>
        <SaveAltIcon />
      </IconButton>
      <IconButton onClick={onRemove}>
        <DeleteIcon />
      </IconButton>
    </div>
  );
}
