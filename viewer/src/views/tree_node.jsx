import React from 'react';
import { connect } from 'react-redux';

import { classNameFromObject } from '../lib';
import { getList, getStreamUrl } from '../states/file_system/actions';
import {
  moveSelectedNodesTo,
  selectSiblingList,
} from '../states/selection/actions';
import DragDrop from './dragdrop';
import Selectable from './selectable';
import Expandable from './expandable';

import './tree_node.scss';


class TreeNode extends React.Component {

  constructor (props) {
    super(props);

    this._onDragStart = this._onDragStart.bind(this);
    this._onDrop = this._onDrop.bind(this);
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
    const { node, expanded } = this.props;

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
    const { node, expanded } = this.props;
    const { children } = node;

    if (!children || children.length <= 0) {
      return null;
    }

    return (
      <div className={classNameFromObject({
        tail: true,
        hidden: !expanded,
      })}>
        {children.map((nodeId, index) => (
          <React.Fragment key={index}>
            <ConnectedTreeNode nodeId={nodeId} />
          </React.Fragment>
        ))}
      </div>
    );
  }

  _toggle () {
    const { node, getChildren, toggle } = this.props;
    if (!node.fetched) {
      getChildren(node.id);
    }

    toggle(node.id);
  }

  _openFile () {
    const { getFileUrl, node } = this.props;
    getFileUrl(node.id, openUrl);
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


function openUrl (url) {
  function onCopy (event) {
    event.preventDefault();
    event.clipboardData.setData('text/plain', url);
    document.removeEventListener('copy', onCopy);
  }
  document.addEventListener('copy', onCopy);
  document.execCommand('copy');
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
    getFileUrl (id, done) {
      dispatch(getStreamUrl(id, done));
    },
    moveSelectedNodesTo (id) {
      dispatch(moveSelectedNodesTo(id));
    },
    selectSiblingList (id) {
      dispatch(selectSiblingList(id));
    },
  };
}


function mapConsumerToProps (value, ownProps) {
  const { expanded, toggle } = value;
  const { nodeId } = ownProps;
  return {
    expanded: expanded[nodeId],
    toggle,
  };
}


function connectConsumer (Consumer, mapConsumerToProps) {
  return Component => (
    props => (
      <Consumer>
        {value => {
          const newProps = mapConsumerToProps(value, props);
          return (
            <Component {...newProps} {...props} />
          );
        }}
      </Consumer>
    )
  );
}


const ConnectedTreeNode = (Component => {
  let decorator = connect(mapStateToProps, mapDispatchToProps);
  Component = decorator(Component);
  decorator = connectConsumer(Expandable.Consumer, mapConsumerToProps);
  Component = decorator(Component);
  return Component;
})(TreeNode);
export default ConnectedTreeNode;
