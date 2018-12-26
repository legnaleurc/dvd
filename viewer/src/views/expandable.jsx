import React from 'react';


const Context = React.createContext();


class Provider extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      expanded: {},
    };

    this._toggle = this._toggle.bind(this);
  }

  render () {
    return (
      <Context.Provider
        value={{
          expanded: this.state.expanded,
          toggle: this._toggle,
        }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }

  _toggle (id) {
    const { expanded } = this.state;
    if (expanded[id]) {
      delete expanded[id];
    } else {
      expanded[id] = true;
    }
    this.setState({
      expanded: Object.assign({}, expanded),
    });
  }

}


export default {
  Provider,
  Consumer: Context.Consumer,
};
