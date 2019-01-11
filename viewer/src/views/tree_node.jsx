import React from 'react';
import { connect } from 'react-redux';

import { classNameFromObject } from '../lib';
import { getList, openStreamUrl } from '../states/file_system/actions';
import {
  moveSelectedNodesTo,
  selectSiblingList,
} from '../states/selection/actions';
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
    const { node, selected, selectSiblingList } = this.props;
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
                  <Selectable.Trigger
                    nodeId={node.id}
                    onMultiSelect={selectSiblingList}
                  >
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
    const { node } = this.props;
    event.dataTransfer.dropEffect = 'copy';
    event.dataTransfer.setData('text/plain', node.id);
  }

  _onDrop (event) {
    const { node, moveSelectedNodesTo } = this.props;
    if (node.children) {
      moveSelectedNodesTo(node.id);
    } else {
      moveSelectedNodesTo(node.parentId);
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
  const { fileSystem, selection } = state;
  const { nodeId } = ownProps;

  return {
    node: fileSystem.nodes[nodeId],
    selected: !!selection.table[nodeId],
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
    moveSelectedNodesTo (id) {
      dispatch(moveSelectedNodesTo(id));
    },
    selectSiblingList (id) {
      dispatch(selectSiblingList(id));
    },
  };
}


const ConnectedTreeNode = (Component => {
  let decorator = connect(mapStateToProps, mapDispatchToProps);
  Component = decorator(Component);
  return Component;
})(TreeNode);
export default ConnectedTreeNode;
