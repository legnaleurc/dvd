import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button } from './button';
import { postSync } from '../states/file_system/actions';
import { IGlobalStateType } from '../states/reducers';

import './file_system_action_bar.scss';


interface IPropsType {
  updating: boolean;
  sync: () => void;
}


class FileSystemActionBar extends React.Component<IPropsType> {

  constructor (props: IPropsType) {
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


function mapStateToProps (state: IGlobalStateType) {
  return {
    updating: state.fileSystem.updating,
  };
}


function mapDispatchToProps (dispatch: Dispatch) {
  return {
    sync () {
      dispatch(postSync());
    },
  };
}


const ConnectedFileSystemActionBar = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FileSystemActionBar);
export { ConnectedFileSystemActionBar as FileSystemActionBar };
