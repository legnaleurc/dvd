import React from 'react';
import { connect } from 'react-redux';

import Button from './button';
import { postSync } from '../states/file_system/actions';

import './file_system_action_bar.scss';


class FileSystemActionBar extends React.Component {

  constructor (props) {
    super(props);

    this._sync = this._sync.bind(this);
  }

  render () {
    const { updating } = this.props;
    return (
      <div className="file-system-action-bar">
        <div className="group">
          <Button disabled={updating} onClick={this._sync}>SYNC</Button>
        </div>
      </div>
    );
  }

  _sync () {
    const { sync } = this.props;
    sync();
  }

}


function mapStateToProps (state) {
  return {
    updating: state.fileSystem.updating,
  };
}


function mapDispatchToProps (dispatch) {
  return {
    sync () {
      dispatch(postSync());
    },
  };
}


export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FileSystemActionBar);
