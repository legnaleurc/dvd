import React from 'react';
import { Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Settings as SettingsIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
import { ActionList } from './action_list';
import { TokenField } from './token_field';
import { MoveList } from './move_list';


const useStyles = makeStyles((theme) => ({
  settingsView: {
    ...getMixins([
      'size-grow',
      'y-scroll',
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


interface IPropsType {}
export function SettingsView (props: IPropsType) {
  const classes = useStyles();

  return (
    <div className={classes.settingsView}>
      <div className={classes.actionForm}>
        <TokenField />
      </div>
      <Divider />
      <div className={classes.actionForm}>
        <ActionList />
      </div>
      <Divider />
      <div className={classes.actionForm}>
        <MoveList />
      </div>
    </div>
  );
}


export { SettingsIcon as SettingsViewIcon };
