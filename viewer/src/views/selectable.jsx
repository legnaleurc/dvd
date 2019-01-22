import React from 'react';
import _ from 'lodash';

import { classNameFromObject, connectConsumer } from '../lib';


const Context = React.createContext();


class Selectable extends React.PureComponent {

  constructor (props) {
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

  componentDidUpdate (prevProps) {
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

  _toggle (id) {
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

  _selectFromLast (id) {
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


Selectable.connect = _.partial(connectConsumer, Context.Consumer);


Selectable.Area = class Area extends React.PureComponent {

  constructor (props) {
    super(props);
  }

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

};
Selectable.Area = Selectable.connect((value, ownProps) => {
  const { selected } = value;
  const { nodeId } = ownProps;
  return {
    selected: !!selected[nodeId],
  };
})(Selectable.Area);


Selectable.Trigger = class Trigger extends React.PureComponent {

  constructor (props) {
    super(props);
  }

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
Selectable.Trigger = Selectable.connect(value => {
  const { toggle, selectFromLast } = value;
  return {
    toggle,
    selectFromLast,
  };
})(Selectable.Trigger);


export default Selectable;
