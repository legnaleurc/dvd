import React from 'react';
import { connect } from 'react-redux';


import FileExplorer from './file_explorer';
import FileSystemActionBar from './file_system_action_bar';
import SortActionBar from './sort_action_bar';

import './tree_view.scss';


function TreeView (props) {
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
        <FileExplorer rootId={props.rootId} />
      </div>
    </div>
  );
}


function mapStateToProps (state) {
  return {
    rootId: state.fileSystem.rootId,
  };
}


export default connect(mapStateToProps)(TreeView);
