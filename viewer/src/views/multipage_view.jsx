import React from 'react';
import { connect } from 'react-redux';

import ImageView from './image_view';

import './multipage_view.scss';


class MultiPageView extends React.Component {

  constructor (props) {
    super(props);

    this._handleIntersect = this._handleIntersect.bind(this);
    this._root = React.createRef();
    this._dirty = false;
  }

  componentDidMount () {
    const options = {
      root: document.body,
      rootMargin: '0px 0px 0px 0px',
      threshold: 0,
    };
    this._observer = new IntersectionObserver(this._handleIntersect, options);
    this._observer.observe(this._root.current);
  }

  componentWillUnmount () {
    this._observer.disconnect();
  }

  componentDidUpdate (prevProps) {
    if (this.props.imageList !== prevProps.imageList) {
      this._dirty = true;
    }
  }

  render () {
    return (
      <div className="multipage-view" ref={this._root}>
        {this.props.imageList.map((d, index) => (
          <React.Fragment key={index}>
            <ImageView
              rootRef={this._root}
              width={d.width}
              height={d.height}
              url={d.url}
            />
          </React.Fragment>
        ))}
      </div>
    );
  }

  _handleIntersect (entries) {
    entries.forEach(entry => {
      if (this._dirty && entry.isIntersecting) {
        this._root.current.scrollTop = 0;
        this._dirty = false;
      }
    });
  }

}


function mapStateToProps (state) {
  const { imageList } = state.mpv;
  return {
    imageList,
  };
}


export default connect(mapStateToProps)(MultiPageView);
