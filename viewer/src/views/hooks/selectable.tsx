import React from 'react';
import clsx from 'clsx';

import { connectConsumer, MapFunction } from '@/lib';


type Selection = Record<string, boolean>;
type ISelectionClasses = Record<'selected', string>;


export interface ISelectionStateType {
  selected: Selection;
  count: number;
  classes: ISelectionClasses;
  toggle: (id: string) => void;
  selectFromLast: (id: string) => void;
  getList: () => string[];
  clear: () => void;
}


const Context = React.createContext<ISelectionStateType>({
  selected: {},
  count: 0,
  classes: { selected: '' },
  toggle: (id: string) => {},
  selectFromLast: (id: string) => {},
  getList: () => ([]),
  clear: () => {},
});


interface IPropsType {
  revision: number;
  getSourceList: (id: string) => string[] | null;
  classes: ISelectionClasses;
}


interface IStateType {
  selected: Selection;
  count: number;
  last: string | null;
}


export class Selectable extends React.PureComponent<IPropsType, IStateType> {

  constructor (props: IPropsType) {
    super(props);

    this.state = {
      selected: {},
      count: 0,
      last: null,
    };

    this._toggle = this._toggle.bind(this);
    this._selectFromLast = this._selectFromLast.bind(this);
    this._getList = this._getList.bind(this);
    this._clear = this._clear.bind(this);
  }

  componentDidUpdate (prevProps: IPropsType) {
    if (this.props.revision !== prevProps.revision) {
      this._clear();
    }
  }

  render () {
    return (
      <Context.Provider
        value={{
          classes: this.props.classes,
          selected: this.state.selected,
          count: this.state.count,
          toggle: this._toggle,
          selectFromLast: this._selectFromLast,
          getList: this._getList,
          clear: this._clear,
        }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }

  _toggle (id: string) {
    const { selected } = this.state;
    let last = null;
    let count = this.state.count;
    if (selected[id]) {
      delete selected[id];
      --count;
    } else {
      selected[id] = true;
      last = id;
      ++count;
    }
    this.setState({
      selected: { ...selected },
      count,
      last,
    });
  }

  _selectFromLast (id: string) {
    const { getSourceList } = this.props;
    const { selected, last } = this.state;

    if (!last) {
      return;
    }

    let list = getSourceList(id);
    if (!list) {
      return;
    }
    let toIndex = list.indexOf(id);
    if (toIndex < 0) {
      return;
    }
    let fromIndex = list.indexOf(last);
    if (fromIndex < 0) {
      return;
    }
    if (toIndex < fromIndex) {
      [fromIndex, toIndex] = [toIndex, fromIndex];
    }

    let count = this.state.count;
    list = list.slice(fromIndex, toIndex + 1);
    for (const id of list) {
      if (!selected[id]) {
        ++count;
      }
      selected[id] = true;
    }

    this.setState({
      selected: { ...selected },
      count,
      last: id,
    });
  }

  _getList () {
    const { selected } = this.state;
    return Object.keys(selected);
  }

  _clear () {
    this.setState({
      selected: {},
      count: 0,
      last: null,
    });
  }

}


export function connectSelection<O, N> (mapValueToProps: MapFunction<ISelectionStateType, O, N>) {
  return connectConsumer(Context.Consumer, mapValueToProps);
}


interface IAreaPropsType {
  nodeId: string;
}
interface IAreaPrivatePropsType {
  selected: boolean;
  classes: ISelectionClasses;
}


class Area extends React.PureComponent<IAreaPropsType & IAreaPrivatePropsType> {

  render () {
    const { children, selected, classes } = this.props;
    return (
      <div className={clsx('selectable-area', {
        [classes.selected]: selected,
      })}>
        {children}
      </div>
    );
  }

}


const ConnectedArea = connectSelection((value: ISelectionStateType, ownProps: IAreaPropsType) => {
  const { selected, classes } = value;
  const { nodeId } = ownProps;
  return {
    selected: !!selected[nodeId],
    classes,
  };
})(Area);
export { ConnectedArea as SelectableArea };


interface ITriggerPropsType {
  nodeId: string;
}
interface ITriggerPrivatePropsType {
  toggle: (id: string) => void;
  selectFromLast: (id: string) => void;
}


class Trigger extends React.PureComponent<ITriggerPropsType & ITriggerPrivatePropsType> {

  private _clickTimer: number;

  constructor (props: ITriggerPropsType & ITriggerPrivatePropsType) {
    super(props);

    this._onClick = this._onClick.bind(this);

    this._clickTimer = 0;
  }

  render () {
    const { children } = this.props;
    return (
      <div
        className="selectable-trigger"
        onClick={this._onClick}
      >
        {children}
      </div>
    );
  }

  _onClick (event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    const count = event.detail;
    const hasShiftKey = event.shiftKey;
    window.clearTimeout(this._clickTimer);
    this._clickTimer = window.setTimeout(() => {
      if (count > 1) {
        return;
      }
      if (hasShiftKey) {
        this._multiSelect();
      } else {
        this._toggle();
      }
    }, 200);
  }

  _toggle () {
    const { nodeId, toggle } = this.props;
    toggle(nodeId);
  }

  _multiSelect () {
    const { nodeId, selectFromLast } = this.props;
    selectFromLast(nodeId);
  }

};


const ConnectedTrigger = connectSelection((
  value: ISelectionStateType,
  _ownProps: ITriggerPropsType,
) => {
  const { toggle, selectFromLast } = value;
  return {
    toggle,
    selectFromLast,
  };
})(Trigger);
export { ConnectedTrigger as SelectableTrigger };
