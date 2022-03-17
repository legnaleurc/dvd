import React from 'react';

import { useInstance } from '@/lib';
import { useMoveListAction, useMoveListState } from '@/views/hooks/move_list';


export function useActions () {
  const { setMoveList } = useMoveListAction();
  const { moveList } = useMoveListState();
  const [newDestination, setNewDestination] = React.useState('');

  const onDestinationChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewDestination(event.currentTarget.value);
  }, [setNewDestination]);

  const self = useInstance(() => ({
    addDestination () {
      const newMoveList = [...moveList, newDestination];
      setMoveList(newMoveList);
    },
    removeDestination (index: number) {
      if (index < 0 || index >= moveList.length) {
        return;
      }
      const newMoveList = [...moveList.slice(0, index), ...moveList.slice(index + 1)];
      setMoveList(newMoveList);
    },
    updateDestination (index: number, destination: string) {
      if (index < 0 || index >= moveList.length) {
        return;
      }
      const newMoveList = [...moveList];
      newMoveList[index] = destination;
      setMoveList(newMoveList);
    },
  }), [
    moveList,
    newDestination,
  ]);

  const addDestination = React.useCallback(() => {
    self.current.addDestination();
  }, [self]);
  const updateDestination = React.useCallback((index: number, destination: string) => {
    self.current.updateDestination(index, destination);
  }, [self]);
  const removeDestination = React.useCallback((index: number) => {
    self.current.removeDestination(index);
  }, [self]);

  return {
    newDestination,
    onDestinationChange,
    addDestination,
    moveList,
    updateDestination,
    removeDestination,
  };
}
