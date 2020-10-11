import React from 'react';
import {
  Box,
  Divider,
  FormGroup,
  IconButton,
  TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@material-ui/icons';

import {
  getActionList,
  getMixins,
  setActionList,
  useInstance,
} from '@/lib';
import { ActionItem } from './action_item';


const useStyles = makeStyles((theme) => ({
  settingsView: {
    ...getMixins([
      'size-grow',
    ]),
  },
  actionForm: {
    margin: '1rem',
  },
  actionRow: {
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
}));


function useActions () {
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
      setActionList(newActionDict);
    },
    removeAction (category: string) {
      delete actionDict[category];
      const newActionDict = {
        ...actionDict,
      };
      setActionDict(newActionDict);
      setActionList(newActionDict);
    },
    updateAction (category: string, command: string) {
      const newActionDict = {
        ...actionDict,
        [category]: command,
      };
      setActionDict(newActionDict);
      setActionList(newActionDict);
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

  return {
    newCategory,
    newCommand,
    actionDict,
    setActionDict,
    onCategoryChange,
    onCommandChange,
    addAction,
    removeAction,
    updateAction,
  };
}


interface IPropsType {}
export function SettingsView (props: IPropsType) {
  const classes = useStyles();
  const {
    newCategory,
    newCommand,
    actionDict,
    setActionDict,
    onCategoryChange,
    onCommandChange,
    addAction,
    removeAction,
    updateAction,
  } = useActions();

  React.useEffect(() => {
    const actionDict = getActionList();
    if (actionDict) {
      setActionDict(actionDict);
    }
  }, []);

  return (
    <div className={classes.settingsView}>
      <FormGroup className={classes.actionForm}>
        <Box className={classes.actionRow}>
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
          <IconButton onClick={addAction}>
            <AddIcon />
          </IconButton>
        </Box>
        <Divider />
        {Object.entries(actionDict).map(([category, command]) => (
          <ActionItem
            key={category}
            classes={classes}
            category={category}
            command={command}
            onRemove={removeAction}
            onUpdate={updateAction}
          />
        ))}
      </FormGroup>
    </div>
  );
}


export { SettingsIcon as SettingsViewIcon };
