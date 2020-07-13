import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { classNameFromObject } from '../lib';
import {
  getList,
  moveNodes,
  openStreamUrl,
} from '../states/file_system/actions';
import { IGlobalStateType } from '../states/reducers';
import { Node } from '../states/file_system/types';
import DragDrop from './dragdrop';
import {
  SelectableArea,
  SelectableTrigger,
  connectSelection,
  ISelectionStateType,
} from './selectable';

import './tree_node.scss';


interface IPropsType {
  nodeId: string;
}
interface IPrivatePropsType {
  node: Node;
  selected: boolean;

  getSelectionList: () => string[];
  getChildren: (id: string) => void;
  moveNodes: (srcList: string[], dst: string) => void;
  openFileUrl: (id: string) => void;
}


interface IStateType {
  expanded: boolean;
}


class TreeNode extends React.PureComponent<IPropsType & IPrivatePropsType, IStateType> {

  constructor (props: IPropsType & IPrivatePropsType) {
    super(props);

    this._onDragStart = this._onDragStart.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._onDoubleClick = this._onDoubleClick.bind(this);
    this._onClickIndicator = this._onClickIndicator.bind(this);

    this.state = {
      expanded: false,
    };
  }

  render () {
    const { node, selected } = this.props;
    return (
      <div className="tree-node">
        <DragDrop.Dragable
          enabled={selected}
          onDragStart={this._onDragStart}
        >
          <DragDrop.Dropable
            onDrop={this._onDrop}
          >
            <SelectableArea nodeId={node.id}>
              <div className="head">
                {this._renderIndicator()}
                <div
                  className={classNameFromObject({
                    shift: !node.children,
                  })}
                  onDoubleClick={this._onDoubleClick}
                >
                  <SelectableTrigger nodeId={node.id}>
                    {node.name}
                  </SelectableTrigger>
                </div>
              </div>
            </SelectableArea>
            {this._renderChildren()}
          </DragDrop.Dropable>
        </DragDrop.Dragable>
      </div>
    );
  }

  _renderIndicator () {
    const { node } = this.props;
    const { expanded } = this.state;

    if (!node.children) {
      return null;
    }
    return (
      <Indicator
        expanded={expanded}
        onClick={this._onClickIndicator}
      />
    );
  }

  _renderChildren () {
    const { node } = this.props;
    const { expanded } = this.state;
    const { children } = node;

    if (!children || children.length <= 0) {
      return null;
    }

    return (
      <div className={classNameFromObject({
        tail: true,
        hidden: !expanded,
      })}>
        {children.map(nodeId => (
          <ConnectedTreeNode key={nodeId} nodeId={nodeId} />
        ))}
      </div>
    );
  }

  _toggle () {
    const { node, getChildren } = this.props;
    if (!node.fetched) {
      getChildren(node.id);
    }

    const { expanded } = this.state;
    this.setState({
      expanded: !expanded,
    });
  }

  _openFile () {
    const { openFileUrl, node } = this.props;
    openFileUrl(node.id);
  }

  _onDragStart (event: React.DragEvent<HTMLDivElement>) {
    const { getSelectionList } = this.props;
    const list = getSelectionList();
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(list));
  }

  _onDrop (event: React.DragEvent<HTMLDivElement>) {
    const { node, moveNodes } = this.props;
    const raw = event.dataTransfer.getData('text/plain');
    const list: string[] = JSON.parse(raw);
    if (node.children) {
      moveNodes(list, node.id);
    } else {
      if (!node.parentId) {
        return;
      }
      moveNodes(list, node.parentId);
    }
  }

  _onDoubleClick (event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    this._openFile();
  }

  _onClickIndicator (event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    this._toggle();
  }

}


interface IIndicatorPropsType {
  expanded: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}


function Indicator (props: IIndicatorPropsType) {
  return (
    <div
      className={classNameFromObject({
        indicator: true,
        expanded: props.expanded,
      })}
      onClick={props.onClick}
    />
  );
}


function mapStateToProps (state: IGlobalStateType, ownProps: IPropsType) {
  const { fileSystem } = state;
  const { nodeId } = ownProps;

  return {
    node: fileSystem.nodes[nodeId],
  };
}


function mapDispatchToProps (dispatch: Dispatch) {
  return {
    getChildren (id: string) {
      dispatch(getList(id));
    },
    openFileUrl (id: string) {
      dispatch(openStreamUrl(id));
    },
    moveNodes (nodeList: string[], id: string) {
      dispatch(moveNodes(nodeList, id));
    },
  };
}


const ConnectedTreeNode = (Component => {
  const globalDecorator = connect(mapStateToProps, mapDispatchToProps);
  const GlobalComponent = globalDecorator(Component);

  const selectionDecorator = connectSelection((value: ISelectionStateType, ownProps: IPropsType) => ({
    selected: value.selected[ownProps.nodeId],
    getSelectionList: value.getList,
  }));
  const ConnectedComponent = selectionDecorator(GlobalComponent);

  return ConnectedComponent;
})(TreeNode);
export { ConnectedTreeNode as TreeNode };
