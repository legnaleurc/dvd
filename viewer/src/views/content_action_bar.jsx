import React from 'react';
import { connect } from 'react-redux';

import Button from './button';
import { loadMultiPageViewer } from '../states/multipage/actions';
import {
  copyStream,
  downloadStream,
} from '../states/file_system/actions';



class ContentActionBar extends React.PureComponent {

  constructor (props) {
    super(props);

    this._mpv = this._mpv.bind(this);
    this._copy = this._copy.bind(this);
    this._download = this._download.bind(this);
  }

  render () {
    const { unpacking } = this.props;
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

}


function mapStateToProps (state) {
  return {
    unpacking: state.mpv.unpacking,
  };
}


function mapDispatchToProps (dispatch) {
  return {
    mpv (list, done) {
      dispatch(loadMultiPageViewer(list, done));
    },
    copy (list) {
      dispatch(copyStream(list));
    },
    download (list) {
      dispatch(downloadStream(list));
    },
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(ContentActionBar);
