import React from 'react';
import {
  Box,
  Divider,
  FormGroup,
  IconButton,
  Portal,
  TextField,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  SaveAlt as SaveAltIcon,
  Settings as SettingsIcon,
} from '@material-ui/icons';

import {
  getActionList,
  getMixins,
  setActionList,
  useInstance,
} from '@/lib';


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
type Classes = ReturnType<typeof useStyles>;


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


interface IActionItemProps {
  classes: Classes;
  category: string;
  command: string;
  onUpdate: (category: string, command: string) => void;
  onRemove: (category: string) => void;
}


function useActionItemActions (props: IActionItemProps) {
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


function ActionItem (props: IActionItemProps) {
  const {
    category,
    command,
    setCommand,
    onCategoryChange,
    onCommandChange,
    onUpdate,
    onRemove,
  } = useActionItemActions(props);

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


const useToolBarStyles = makeStyles((theme) => ({
  multiPageViewToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  group: {
    ...getMixins([
      'size-shrink',
      'hbox',
    ]),
    alignItems: 'center',
  },
}));
interface IToolBarProps {
  anchorEl?: HTMLDivElement;
}
function ToolBar (props: IToolBarProps) {
  const classes = useToolBarStyles();
  if (!props.anchorEl) {
    return null;
  }
  return (
    <Portal container={props.anchorEl}>
      <div className={classes.multiPageViewToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            Settings
          </Typography>
        </div>
      </div>
    </Portal>
  );
}
export { ToolBar as SettingsViewToolBar };


export { SettingsIcon as SettingsViewIcon };
