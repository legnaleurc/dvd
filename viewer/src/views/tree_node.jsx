import React from 'react';
import { connect } from 'react-redux';

import { classNameFromObject } from '../lib';
import {
  getList,
  moveNodes,
  openStreamUrl,
} from '../states/file_system/actions';
import DragDrop from './dragdrop';
import Selectable from './selectable';

import './tree_node.scss';


class TreeNode extends React.PureComponent {

  constructor (props) {
    super(props);

    this._onDragStart = this._onDragStart.bind(this);
    this._onDrop = this._onDrop.bind(this);

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
            <Selectable.Area nodeId={node.id}>
              <div className="head">
                {this._renderIndicator()}
                <div
                  className={classNameFromObject({
                    shift: !node.children,
                  })}
                  onDoubleClick={event => {
                    event.preventDefault();
                    this._openFile();
                  }}
                >
                  <Selectable.Trigger nodeId={node.id}>
                    {node.name}
                  </Selectable.Trigger>
                </div>
              </div>
            </Selectable.Area>
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
        onClick={event => {
          event.preventDefault();
          this._toggle();
        }}
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

  _onDragStart (event) {
    const { getSelectionList } = this.props;
    const list = getSelectionList();
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(list));
  }

  _onDrop (event) {
    const { node, moveNodes } = this.props;
    let list = event.dataTransfer.getData('text/plain');
    list = JSON.parse(list);
    if (node.children) {
      moveNodes(list, node.id);
    } else {
      moveNodes(list, node.parentId);
    }
  }

}


function Indicator (props) {
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


function mapStateToProps (state, ownProps) {
  const { fileSystem } = state;
  const { nodeId } = ownProps;

  return {
    node: fileSystem.nodes[nodeId],
  };
}


function mapDispatchToProps (dispatch) {
  return {
    getChildren (id) {
      dispatch(getList(id));
    },
    openFileUrl (id) {
      dispatch(openStreamUrl(id));
    },
    moveNodes (nodeList, id) {
      dispatch(moveNodes(nodeList, id));
    },
  };
}


const ConnectedTreeNode = (Component => {
  let decorator = connect(mapStateToProps, mapDispatchToProps);
  Component = decorator(Component);
  decorator = Selectable.connect((value, ownProps) => ({
    selected: value.selected[ownProps.nodeId],
    getSelectionList: value.getList,
  }));
  Component = decorator(Component);
  return Component;
})(TreeNode);
export default ConnectedTreeNode;
