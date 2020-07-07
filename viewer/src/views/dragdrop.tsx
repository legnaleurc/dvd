import React from 'react';

import { classNameFromObject } from '../lib';

import './dragdrop.scss';


interface IDragablePropsType {
  enabled: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}


class Dragable extends React.Component<IDragablePropsType> {

  constructor (props: IDragablePropsType) {
    super(props);

    this._onDragStart = this._onDragStart.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
  }

  render() {
    const {
      enabled,
      children,
    } = this.props;
    return (
      <div
        className="dragable"
        draggable={enabled}
        onDragStart={this._onDragStart}
        onDragEnd={this._onDragEnd}
      >
        {children}
      </div>
    );
  }

  _onDragStart (event: React.DragEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.classList.add('dragging');
    const { onDragStart } = this.props;
    if (onDragStart) {
      onDragStart(event);
    }
  }

  _onDragEnd (event: React.DragEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.classList.remove('dragging');
    const { onDragEnd } = this.props;
    if (onDragEnd) {
      onDragEnd(event);
    }
  }

}


interface IDropablePropsType {
  onDrop: React.DragEventHandler<HTMLDivElement>;
}


interface IDropableStateType {
  dragOver: boolean;
}


class Dropable extends React.Component<IDropablePropsType, IDropableStateType> {

  private _dragCounter: number;

  constructor (props: IDropablePropsType) {
    super(props);

    this.state = {
      dragOver: false,
    };

    this._dragCounter = 0;

    this._onDragEnter = this._onDragEnter.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDragLeave = this._onDragLeave.bind(this);
    this._onDrop = this._onDrop.bind(this);
  }

  render() {
    const { children } = this.props;
    const { dragOver } = this.state;
    return (
      <div
        className={classNameFromObject({
          'dropable': true,
          'drag-over': dragOver,
        })}
        onDragEnter={this._onDragEnter}
        onDragOver={this._onDragOver}
        onDragLeave={this._onDragLeave}
        onDrop={this._onDrop}
      >
        {children}
      </div>
    );
  }

  _onDragEnter (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (this._dragCounter === 0) {
      this.setState({
        dragOver: true,
      });
    }
    this._dragCounter += 1;
  }

  _onDragLeave (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    this._dragCounter -= 1;
    if (this._dragCounter === 0) {
      this.setState({
        dragOver: false,
      });
    }
  }

  _onDragOver (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  _onDrop (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    this._dragCounter = 0;
    this.setState({
      dragOver: false,
    });
    const { onDrop } = this.props;
    onDrop(event);
  }

}


export default { Dragable, Dropable };
