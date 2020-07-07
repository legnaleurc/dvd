import React from 'react';
import { connect } from 'react-redux';

import { ImageView } from './image_view';
import { ImageData } from '../states/multipage/types';
import { IGlobalStateType } from '../states/reducers';

import './multipage_view.scss';


interface IPropsType {
  imageList: ImageData[];
}


class MultiPageView extends React.Component<IPropsType> {

  private _root: React.RefObject<HTMLDivElement>;
  private _observer: IntersectionObserver;
  private _dirty: boolean;

  constructor (props: IPropsType) {
    super(props);

    this._handleIntersect = this._handleIntersect.bind(this);
    this._root = React.createRef();
    this._dirty = false;

    const options = {
      root: document.body,
      rootMargin: '0px 0px 0px 0px',
      threshold: 0,
    };
    this._observer = new IntersectionObserver(this._handleIntersect, options);
  }

  componentDidMount () {
    if (!this._root.current) {
      return;
    }
    this._observer.observe(this._root.current);
  }

  componentWillUnmount () {
    this._observer.disconnect();
  }

  componentDidUpdate (prevProps: IPropsType) {
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

  _handleIntersect (entries: IntersectionObserverEntry[]) {
    if (!this._root.current) {
      return;
    }
    const root = this._root.current;
    entries.forEach(entry => {
      if (this._dirty && entry.isIntersecting) {
        root.scrollTop = 0;
        this._dirty = false;
      }
    });
  }

}


function mapStateToProps (state: IGlobalStateType) {
  const { imageList } = state.mpv;
  return {
    imageList,
  };
}


const ConnectedMultiPageView = connect(mapStateToProps)(MultiPageView);
export { ConnectedMultiPageView as MultiPageView };
