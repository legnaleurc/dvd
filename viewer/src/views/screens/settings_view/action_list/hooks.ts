import React from 'react';

import { loadActionList, saveActionList, useInstance } from '@/lib';


export function useActions () {
  const [newCategory, setNewCategory] = React.useState('');
  const [newCommand, setNewCommand] = React.useState('');
  const [actionDict, setActionDict] = React.useState<Record<string, string>>({});

  const onCategoryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewCategory(event.currentTarget.value);
  }, [setNewCategory]);
  const onCommandChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewCommand(event.currentTarget.value);
  }, [setNewCommand]);

  const self = useInstance(() => ({
    addAction () {
      const newActionDict = {
        ...actionDict,
        [newCategory]: newCommand,
      };
      setActionDict(newActionDict);
      saveActionList(newActionDict);
    },
    removeAction (category: string) {
      delete actionDict[category];
      const newActionDict = {
        ...actionDict,
      };
      setActionDict(newActionDict);
      saveActionList(newActionDict);
    },
    updateAction (category: string, command: string) {
      const newActionDict = {
        ...actionDict,
        [category]: command,
      };
      setActionDict(newActionDict);
      saveActionList(newActionDict);
    },
  }), [
    actionDict,
    setActionDict,
    newCategory,
    newCommand,
  ]);

  const addAction = React.useCallback(() => {
    self.current.addAction();
  }, [self]);
  const removeAction = React.useCallback((category: string) => {
    self.current.removeAction(category);
  }, [self]);
  const updateAction = React.useCallback((category: string, command: string) => {
    self.current.updateAction(category, command);
  }, [self]);

  React.useEffect(() => {
    const actionDict = loadActionList();
    if (actionDict) {
      setActionDict(actionDict);
    }
  }, []);

  return {
    newCategory,
    newCommand,
    actionDict,
    onCategoryChange,
    onCommandChange,
    addAction,
    removeAction,
    updateAction,
  };
}
