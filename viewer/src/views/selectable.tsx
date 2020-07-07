import React from 'react';

import { classNameFromObject, connectConsumer, MapFunction } from '../lib';


type Selection = { [id: string]: boolean };


export interface ISelectionStateType {
  selected: Selection;
  toggle: (id: string) => void;
  selectFromLast: (id: string) => void;
  getList: () => string[];
  clear: () => void;
}


const Context = React.createContext<ISelectionStateType>({
  selected: {},
  toggle: (id: string) => {},
  selectFromLast: (id: string) => {},
  getList: () => ([]),
  clear: () => {},
});


interface IPropsType {
  revision: number;
  getSourceList: (id: string) => string[] | null;
}


interface IStateType {
  selected: Selection;
  last: string | null;
}


export class Selectable extends React.PureComponent<IPropsType, IStateType> {

  constructor (props: IPropsType) {
    super(props);

    this.state = {
      selected: {},
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
          selected: this.state.selected,
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
    if (selected[id]) {
      delete selected[id];
    } else {
      selected[id] = true;
      last = id;
    }
    this.setState({
      selected: Object.assign({}, selected),
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

    list = list.slice(fromIndex, toIndex + 1);
    for (const id of list) {
      selected[id] = true;
    }

    this.setState({
      selected: Object.assign({}, selected),
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
}


class Area extends React.PureComponent<IAreaPropsType & IAreaPrivatePropsType> {

  render () {
    const { children, selected } = this.props;
    return (
      <div className={classNameFromObject({
        'selectable-area': true,
        selected,
      })}>
        {children}
      </div>
    );
  }

}


const ConnectedArea = connectSelection((value: ISelectionStateType, ownProps: IAreaPropsType) => {
  const { selected } = value;
  const { nodeId } = ownProps;
  return {
    selected: !!selected[nodeId],
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

  render () {
    const { children } = this.props;
    return (
      <div
        className="selectable-trigger"
        onClick={event => {
          event.preventDefault();
          if (event.shiftKey) {
            this._multiSelect();
          } else {
            this._toggle();
          }
        }}
      >
        {children}
      </div>
    );
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
