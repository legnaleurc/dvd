import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Button } from './button';
import { connectSelection, ISelectionStateType } from './selectable';
import { loadMultiPageViewer } from '../states/multipage/actions';
import {
  copyStream,
  downloadStream,
  trashNodes,
} from '../states/file_system/actions';
import { IGlobalStateType } from '../states/reducers';

import './content_action_bar.scss';


interface IPropsType {
}
interface IPrivatePropsType {
  unpacking: boolean;
  updating: boolean;
  mpv: (list: string[], done: () => void) => void;
  copy: (list: string[]) => void;
  download: (list: string[]) => void;
  trash: (list: string[]) => void;
  getSelectionList: () => string[];
  clearSelection: () => void;
}


class ContentActionBar extends React.PureComponent<IPropsType & IPrivatePropsType> {

  constructor (props: IPropsType & IPrivatePropsType) {
    super(props);

    this._mpv = this._mpv.bind(this);
    this._copy = this._copy.bind(this);
    this._download = this._download.bind(this);
    this._trash = this._trash.bind(this);
  }

  render () {
    const { unpacking, updating } = this.props;
    return (
      <div className="content-action-bar">
        <div className="group">
          <Button disabled={unpacking} onClick={this._mpv}>MPV</Button>
        </div>
        <div className="expand" />
        <div className="group">
          <Button onClick={this._copy}>COPY_URL</Button>
          <Button onClick={this._download}>DOWNLOAD</Button>
        </div>
        <div className="expand" />
        <div className="group">
          <Button disabled={updating} onClick={this._trash}>TRASH</Button>
        </div>
      </div>
    );
  }

  _mpv () {
    const { getSelectionList, clearSelection, mpv } = this.props;
    const list = getSelectionList();
    mpv(list, clearSelection);
  }

  _copy () {
    const { getSelectionList, copy } = this.props;
    const list = getSelectionList();
    copy(list);
  }

  _download () {
    const { getSelectionList, download } = this.props;
    const list = getSelectionList();
    download(list);
  }

  _trash () {
    const { getSelectionList, trash } = this.props;
    const list = getSelectionList();
    trash(list);
  }

}


function mapStateToProps (state: IGlobalStateType) {
  return {
    updating: state.fileSystem.updating,
    unpacking: state.mpv.unpacking,
  };
}


function mapDispatchToProps (dispatch: Dispatch) {
  return {
    mpv (list: string[], done: () => void) {
      dispatch(loadMultiPageViewer(list, done));
    },
    copy (list: string[]) {
      dispatch(copyStream(list));
    },
    download (list: string[]) {
      dispatch(downloadStream(list));
    },
    trash (list: string[]) {
      dispatch(trashNodes(list));
    },
  };
}


const ConnectedContentActionBar = (Component => {
  const GlobalComponent = connect(mapStateToProps, mapDispatchToProps)(Component)
  const SelectionComponent = connectSelection((value: ISelectionStateType, _ownProps: IPropsType) => ({
    getSelectionList: value.getList,
    clearSelection: value.clear,
  }))(GlobalComponent);
  return SelectionComponent;
})(ContentActionBar);
export { ConnectedContentActionBar as ContentActionBar };
