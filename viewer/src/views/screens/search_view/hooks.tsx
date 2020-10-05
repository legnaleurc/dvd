import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { makeStyles } from '@material-ui/core/styles';

import { useInstance, SELECTION_COLOR } from '@/lib';
import { IGlobalStateType } from '@/states/reducers';
import { getSearchName } from '@/states/search/actions';
import { Selectable } from '@/views/hooks/selectable';


const Context = React.createContext({
  search: (name: string) => {},
});


const useStyles = makeStyles((theme) => ({
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
}));


function useActions (props: IContextProviderProps) {
  const [revision, setRevision] = React.useState(0);

  const self = useInstance(() => ({
    search (text: string) {
      const { searchName } = props;
      setRevision(revision + 1);
      searchName(text);
    },
  }), [
    props.searchName,
    revision,
    setRevision,
  ]);

  const getResultList = React.useCallback((id: string) => {
    return props.list;
  }, [props.list]);

  const search = React.useCallback((text: string) => {
    self.current.search(text);
  }, [self]);

  return {
    revision,
    getResultList,
    search,
  };
}


export function useContext () {
  return React.useContext(Context);
}


interface IContextProviderProps {
  globalRevision: number;
  searchName: (name: string) => void;
  list: string[];
}
export function ContextProvider (
  props: React.PropsWithChildren<IContextProviderProps>
) {
  const classes = useStyles();
  const { globalRevision } = props;
  const {
    revision,
    getResultList,
    search,
  } = useActions(props);
  return (
    <Selectable
      getSourceList={getResultList}
      revision={revision + globalRevision}
      classes={classes}
    >
      <Context.Provider value={{
        search,
      }}>
        {props.children}
      </Context.Provider>
    </Selectable>
  );
}
const ConnectedContextProvider = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    const { fileSystem, search } = state;
    return {
      loading: search.loading,
      dict: search.dict,
      list: search.list,
      history: search.history,
      diff: search.diff,
      globalRevision: fileSystem.revision,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      searchName (name: string) {
        dispatch(getSearchName(name));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(ContextProvider);
})();
export { ConnectedContextProvider as SearchViewContextProvider };
