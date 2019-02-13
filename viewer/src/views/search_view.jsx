import React from 'react';
import { connect } from 'react-redux';

import {
  getSearchName,
  compare,
  openStreamUrl,
} from '../states/search/actions';
import Input from './input';
import Button from './button';
import Selectable from './selectable';
import FileSystemActionBar from './file_system_action_bar';
import ContentActionBar from './content_action_bar';

import './search_view.scss';


class SearchView extends React.PureComponent {

  constructor (props) {
    super(props);

    this._search = this._search.bind(this);
    this._getResultList = this._getResultList.bind(this);
    this._compare = this._compare.bind(this);

    this.state = {
      revision: 0,
    };
  }

  render () {
    const { diff, history, fsRevision } = this.props;
    const { revision } = this.state;
    return (
      <div className="search-list">
        <Selectable getSourceList={this._getResultList} revision={revision + fsRevision}>
          <div className="head">
            <div className="input-group">
              <Input
                type="text"
                onKeyPress={event => {
                  if (event.key !== 'Enter') {
                    return;
                  }
                  event.preventDefault();
                  this._search(event.target.value);
                }}
              />
            </div>
            <div className="action-group">
              <div className="action">
                <FileSystemActionBar />
              </div>
              <div className="action">
                <ConnectedSearchActionBar compare={this._compare} />
              </div>
              <div className="action">
                <ContentActionBar />
              </div>
            </div>
          </div>
          <div className="tail">
            <div className="tool-group">
              <CompareList diff={diff} />
              <HistoryList history={history} search={this._search} />
            </div>
            <div className="search-result">
              {this._renderList()}
            </div>
          </div>
        </Selectable>
      </div>
    );
  }

  _renderList () {
    const { loading } = this.props;
    if (loading) {
      return <LoadingBlock />;
    }

    const { list, dict } = this.props;
    if (!list || list.length <= 0) {
      return <EmptyBlock />;
    }

    return list.map(id => (
      <div
        key={id}
        onDoubleClick={event => {
          event.preventDefault();
          this._openFile(id);
        }}
      >
        <Selectable.Area nodeId={id}>
          <Selectable.Trigger nodeId={id}>
            <code>{dict[id].path}</code>
          </Selectable.Trigger>
        </Selectable.Area>
      </div>
    ));
  }

  _search (text) {
    const { searchName } = this.props;
    this.setState({
      revision: this.state.revision + 1,
    });
    searchName(text);
  }

  _openFile (nodeId) {
    const { openFileUrl } = this.props;
    openFileUrl(nodeId);
  }

  _getResultList (id) {
    const { list } = this.props;
    return list;
  }

  _compare (list) {
    const { compare } = this.props;
    compare(list);
  }

}


function LoadingBlock (props) {
  return <div className="loading-block">SEARCHING</div>;
}


function EmptyBlock (props) {
  return (
    <div className="empty-block">EMPTY</div>
  );
}


function SearchActionBar (props) {
  return (
    <>
      <Button
        onClick={event => {
          const list = props.getSelection();
          props.compare(list);
        }}
      >
        COMPARE
      </Button>
    </>
  );
}
const ConnectedSearchActionBar = Selectable.connect(value => ({
  getSelection: value.getList,
}))(SearchActionBar);


function CompareList (props) {
  return (
    <div className="compare-list">
      <InnerCompareList diff={props.diff} />
    </div>
  );
}


function InnerCompareList (props) {
  if (!props.diff) {
    return null;
  }
  if (props.diff.length <= 0) {
    return 'OK';
  }
  return (
    <>
      {props.diff.map(({path, size}, i) => (
        <pre key={i}>
          {`${size}: ${path}`}
        </pre>
      ))}
    </>
  );
}


function HistoryList (props) {
  return (
    <div className="history-list">
      {props.history.map((name, i) => (
        <HistoryEntry
          key={i}
          name={name}
          search={props.search}
        />
      ))}
    </div>
  );
}


function HistoryEntry (props) {
  return (
    <pre
      className="history-entry"
      onClick={event => {
        props.search(props.name);
      }}
    >
      {props.name}
    </pre>
  );
}


function mapStateToProps (state) {
  const { fileSystem, search } = state;
  return {
    loading: search.loading,
    dict: search.dict,
    list: search.list,
    history: search.history,
    diff: search.diff,
    fsRevision: fileSystem.revision,
  };
}


function mapDispatchToProps (dispatch) {
  return {
    searchName (name) {
      dispatch(getSearchName(name));
    },
    openFileUrl (id) {
      dispatch(openStreamUrl(id));
    },
    compare (idList) {
      dispatch(compare(idList));
    },
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(SearchView);
