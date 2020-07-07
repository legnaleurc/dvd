import React from 'react';

import { classNameFromObject } from '../lib/index';

import './image_view.scss';


interface IPropsType {
  rootRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  url: string;
}


interface IStateType {
  url: string;
  loaded: boolean;
}


export class ImageView extends React.Component<IPropsType, IStateType> {

  private _root: React.RefObject<HTMLDivElement>;
  private _observer: IntersectionObserver;

  constructor (props: IPropsType) {
    super(props);

    this.state = {
      url: createDummyImage(props.width, props.height, 'gray'),
      loaded: false,
    };

    this._handleIntersect = this._handleIntersect.bind(this);
    this._setImageUrl = this._setImageUrl.bind(this);

    this._root = React.createRef();
    const options = {
      root: props.rootRef.current,
      rootMargin: '400% 0px 400% 0px',
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

  render () {
    const { width, height } = this.props;
    const { url, loaded } = this.state;
    return (
      <div
        className="image-view"
        ref={this._root}
      >
        <img
          className={classNameFromObject({
            image: true,
            loaded,
          })}
          src={url}
          width={width}
          height={height}
        />
      </div>
    );
  }

  _setImageUrl (url: string) {
    this.setState({
      url,
      loaded: true,
    });
  }

  _handleIntersect (entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this._setImageUrl(this.props.url);
      }
    });
  }

}


function createDummyImage (width: number, height: number, color: string) {
  const svg = [
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      `<rect width="100%" height="100%" fill="${color}" />`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
