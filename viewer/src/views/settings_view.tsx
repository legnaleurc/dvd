import React from 'react';

import { getActionList, setActionList } from '../lib';
import { Input } from './input';
import { Button } from './button';


interface IPropsType {}


interface IStateType {
  actionList: { [key: string]: string };
  newCategory: string;
  newCommand: string;
}


export class SettingsView extends React.PureComponent<IPropsType, IStateType> {

  constructor (props: IPropsType) {
    super(props);

    this.state = {
      actionList: {},
      newCategory: '',
      newCommand: '',
    };

    this._addAction = this._addAction.bind(this);
    this._removeAction = this._removeAction.bind(this);
    this._updateAction = this._updateAction.bind(this);
  }

  componentDidMount () {
    const actionList = getActionList();
    if (actionList) {
      this.setState({
        actionList,
      });
    }
  }

  render () {
    const { newCategory, newCommand, actionList } = this.state;
    return (
      <div>
        <div>
          <Input
            value={newCategory}
            onChange={event => (this.setState({
              newCategory: event.target.value,
            }))}
          />
          <Input
            value={newCommand}
            onChange={event => (this.setState({
              newCommand: event.target.value,
            }))}
          />
          <Button onClick={this._addAction}>ADD</Button>
        </div>
        {Object.entries(actionList).map(([command, category]) => (
          <ActionItem
            key={category}
            category={category}
            command={command}
            onRemove={this._removeAction}
            onUpdate={this._updateAction}
          />
        ))}
      </div>
    );
  }

  _addAction () {
    const { newCategory, newCommand, actionList } = this.state;
    const newActionList = Object.assign({}, actionList, {
      [newCategory]: newCommand,
    });
    this.setState({
      actionList: newActionList,
    });
    setActionList(newActionList);
  }

  _removeAction (category: string) {
    const { actionList } = this.state;
    delete actionList[category];
    const newActionList = Object.assign({}, actionList);
    this.setState({
      actionList: newActionList,
    });
    setActionList(newActionList);
  }

  _updateAction (category: string, command: string) {
    const { actionList } = this.state;
    const newActionList = Object.assign({}, actionList, {
      [category]: command,
    });
    this.setState({
      actionList: newActionList,
    });
    setActionList(newActionList);
  }

}


interface IActionItemPropsType {
  category: string;
  command: string;
  onUpdate: (category: string, command: string) => void;
  onRemove: (category: string) => void;
}


interface IActionItemStateType {
  category: string;
  command: string;
}


class ActionItem extends React.PureComponent<IActionItemPropsType, IActionItemStateType> {

  constructor (props: IActionItemPropsType) {
    super(props);

    this.state = {
      category: props.category,
      command: props.command,
    };
  }

  componentDidUpdate (prevProps: IActionItemPropsType) {
    if (prevProps.command !== this.props.command) {
      this.setState({
        command: this.props.command,
      });
    }
  }

  render () {
    const { category, command } = this.state;
    return (
      <div>
        <Input
          value={category}
          onChange={event => (this.setState({
            category: event.target.value,
          }))}
        />
        <Input
          value={command}
          onChange={event => (this.setState({
            command: event.target.value,
          }))}
        />
        <Button
          onClick={event => {
            this.props.onUpdate(category, command);
          }}
        >
          UPDATE
        </Button>
        <Button
          onClick={event => {
            this.props.onRemove(category);
          }}
        >
          REMOVE
        </Button>
      </div>
    );
  }

}
