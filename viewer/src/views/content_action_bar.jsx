import React from 'react';
import { connect } from 'react-redux';

import Button from './button';
import { loadMultiPageViewer } from '../states/multipage/actions';
import { copySelected, downloadSelected } from '../states/selection/actions';


class ContentActionBar extends React.Component {

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
          <Button onClick={this._copy}>COPY</Button>
          <Button onClick={this._download}>DOWNLOAD</Button>
          <Button disabled={unpacking} onClick={this._mpv}>MPV</Button>
        </div>
      </div>
    );
  }

  _mpv () {
    const { mpv } = this.props;
    mpv();
  }

  _copy () {
    const { copy } = this.props;
    copy();
  }

  _download () {
    const { download } = this.props;
    download();
  }

}


function mapStateToProps (state) {
  return {
    unpacking: state.mpv.unpacking,
  };
}


function mapDispatchToProps (dispatch) {
  return {
    mpv () {
      dispatch(loadMultiPageViewer());
    },
    copy () {
      dispatch(copySelected());
    },
    download () {
      dispatch(downloadSelected());
    },
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(ContentActionBar);
