import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import {
  getSearchName,
  compare,
  openStreamUrl,
} from '../states/search/actions';
import { IGlobalStateType } from '../states/reducers';
import { CompareResult, EntryDict } from '../states/search/types';
import { Input } from './input';
import { Button } from './button';
import {
  Selectable,
  SelectableArea,
  SelectableTrigger,
  connectSelection,
  ISelectionStateType,
} from './selectable';
import { FileSystemActionBar } from './file_system_action_bar';
import { ContentActionBar } from './content_action_bar';

import './search_view.scss';


interface IPropsType {
  loading: boolean;
  diff: CompareResult[] | null;
  history: string[];
  fsRevision: number;
  list: string[];
  dict: EntryDict;

  searchName: (name: string) => void;
  openFileUrl: (id: string) => void;
  compare: (idList: string[]) => void;
}


interface IStateType {
  revision: number;
}


class SearchView extends React.PureComponent<IPropsType, IStateType> {

  constructor (props: IPropsType) {
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
        <Selectable
          getSourceList={this._getResultList}
          revision={revision + fsRevision}
        >
          <div className="head">
            <div className="input-group">
              <Input
                type="text"
                onKeyPress={event => {
                  if (event.key !== 'Enter') {
                    return;
                  }
                  event.preventDefault();
                  this._search(event.currentTarget.value);
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
        <SelectableArea nodeId={id}>
          <SelectableTrigger nodeId={id}>
            <code>{dict[id].path}</code>
          </SelectableTrigger>
        </SelectableArea>
      </div>
    ));
  }

  _search (text: string) {
    const { searchName } = this.props;
    this.setState({
      revision: this.state.revision + 1,
    });
    searchName(text);
  }

  _openFile (nodeId: string) {
    const { openFileUrl } = this.props;
    openFileUrl(nodeId);
  }

  _getResultList (id: string) {
    const { list } = this.props;
    return list;
  }

  _compare (list: string[]) {
    const { compare } = this.props;
    compare(list);
  }

}


function LoadingBlock (props: {}) {
  return <div className="loading-block">SEARCHING</div>;
}


function EmptyBlock (props: {}) {
  return (
    <div className="empty-block">EMPTY</div>
  );
}


interface ISearchActionBarPropsType {
  compare: (list: string[]) => void;
}
interface ISearchActionBarPrivatePropsType {
  getSelection: () => string[];
}


function SearchActionBar (props: ISearchActionBarPropsType & ISearchActionBarPrivatePropsType) {
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
const ConnectedSearchActionBar = connectSelection((
  value: ISelectionStateType,
  _ownProps: ISearchActionBarPropsType,
) => ({
  getSelection: value.getList,
}))(SearchActionBar);


function CompareList (props: { diff: CompareResult[] | null }) {
  return (
    <div className="compare-list">
      <InnerCompareList diff={props.diff} />
    </div>
  );
}


function InnerCompareList (props: { diff: CompareResult[] | null }): JSX.Element {
  if (!props.diff) {
    return <React.Fragment />;
  }
  if (props.diff.length <= 0) {
    return <>OK</>;
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


interface IHistoryListPropsType {
  history: string[];
  search: (name: string) => void;
}


function HistoryList (props: IHistoryListPropsType) {
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


interface IHistoryEntryPropsType {
  name: string;
  search: (name: string) => void;
}


function HistoryEntry (props: IHistoryEntryPropsType) {
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


function mapStateToProps (state: IGlobalStateType) {
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


function mapDispatchToProps (dispatch: Dispatch) {
  return {
    searchName (name: string) {
      dispatch(getSearchName(name));
    },
    openFileUrl (id: string) {
      dispatch(openStreamUrl(id));
    },
    compare (idList: string[]) {
      dispatch(compare(idList));
    },
  };
}


const ConnectedSearchView = connect(mapStateToProps, mapDispatchToProps)(SearchView);
export { ConnectedSearchView as SearchView };
