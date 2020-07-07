import React from 'react';
import { connect } from 'react-redux';

import { IGlobalStateType } from '../states/reducers';
import { FileExplorer } from './file_explorer';
import { FileSystemActionBar } from './file_system_action_bar';
import { SortActionBar } from './sort_action_bar';
import { Button } from './button';
import { classNameFromObject } from '../lib';

import './tree_view.scss';


interface IPropsType {
  rootId: string | null;
}


interface IStateType {
  two: boolean;
}


class TreeView extends React.PureComponent<IPropsType, IStateType> {

  constructor (props: IPropsType) {
    super(props);

    this.state = {
      two: false,
    };

    this._toggle = this._toggle.bind(this);
  }

  render () {
    return (
      <div className="tree-view">
        <div className="head">
          <div className="group">
            <FileSystemActionBar />
          </div>
          <div className="expand"></div>
          <div className="group">
            <TreeViewActionBar two={this.state.two} toggle={this._toggle} />
          </div>
          <div className="expand"></div>
          <div className="group">
            <SortActionBar />
          </div>
        </div>
        <div
          className={classNameFromObject({
            tail: true,
            even: this.state.two,
          })}
        >
          <div className="group">
            <FileExplorer rootId={this.props.rootId} />
          </div>
          {this._renderSecond()}
        </div>
      </div>
    );
  }

  _renderSecond () {
    if (!this.state.two) {
      return null;
    }
    return (
      <div className="group">
        <FileExplorer rootId={this.props.rootId} />
      </div>
    );
  }

  _toggle () {
    this.setState({
      two: !this.state.two,
    });
  }

}


interface IActionBarPropsType {
  two: boolean;
  toggle: () => void;
}


function TreeViewActionBar (props: IActionBarPropsType) {
  return (
    <div className="trew-view-action-bar">
      <Button
        onClick={props.toggle}
      >
        {props.two ? 'ONE' : 'TWO'}
      </Button>
    </div>
  );
}


function mapStateToProps (state: IGlobalStateType) {
  return {
    rootId: state.fileSystem.rootId,
  };
}


const ConnectedTreeView = connect(mapStateToProps)(TreeView);
export { ConnectedTreeView as TreeView };
