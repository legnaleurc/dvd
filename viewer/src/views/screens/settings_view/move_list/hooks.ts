import React from 'react';

import { loadMoveList, saveMoveList, useInstance } from '@/lib';


export function useActions () {
  const [newDestination, setNewDestination] = React.useState('');
  const [moveList, setMoveList] = React.useState<string[]>([]);

  const onDestinationChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewDestination(event.currentTarget.value);
  }, [setNewDestination]);

  const self = useInstance(() => ({
    addDestination () {
      const newMoveList = [...moveList, newDestination];
      setMoveList(newMoveList);
      saveMoveList(newMoveList);
    },
    removeDestination (index: number) {
      if (index < 0 || index >= moveList.length) {
        return;
      }
      const newMoveList = [...moveList.slice(0, index), ...moveList.slice(index + 1)];
      setMoveList(newMoveList);
      saveMoveList(newMoveList);
    },
    updateDestination (index: number, destination: string) {
      if (index < 0 || index >= moveList.length) {
        return;
      }
      const newMoveList = [...moveList];
      newMoveList[index] = destination;
      setMoveList(newMoveList);
      saveMoveList(newMoveList);
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

  React.useEffect(() => {
    const rv = loadMoveList();
    setMoveList(rv);
  }, []);

  return {
    newDestination,
    onDestinationChange,
    addDestination,
    moveList,
    updateDestination,
    removeDestination,
  };
}
