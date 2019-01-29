import React from 'react';
import { connect } from 'react-redux';


import FileExplorer from './file_explorer';
import FileSystemActionBar from './file_system_action_bar';
import SortActionBar from './sort_action_bar';

import './tree_view.scss';


class TreeView extends React.PureComponent {

  constructor (props) {
    super(props);

    this.state = {
      two: false,
    };
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
            <SortActionBar />
          </div>
        </div>
        <div className="tail">
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

}


function mapStateToProps (state) {
  return {
    rootId: state.fileSystem.rootId,
  };
}


export default connect(mapStateToProps)(TreeView);
