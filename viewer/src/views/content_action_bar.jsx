import React from 'react';
import { connect } from 'react-redux';

import Button from './button';
import { loadMultiPageViewer } from '../states/multipage/actions';


class ContentActionBar extends React.Component {

  constructor (props) {
    super(props);

    this._mpv = this._mpv.bind(this);
  }

  render () {
    const { unpacking } = this.props;
    return (
      <div className="content-action-bar">
        <div className="group">
          <Button disabled={unpacking} onClick={this._mpv}>MPV</Button>
        </div>
      </div>
    );
  }

  _mpv () {
    const { mpv } = this.props;
    mpv();
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
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(ContentActionBar);
