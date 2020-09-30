export type Selection = Record<string, boolean>;
export type ISelectionClasses = Record<'selected', string>;


interface IAction<T, V> {
  type: T;
  value: V;
}


interface ISelectFromLast {
  id: string;
  sourceList: string[] | null;
}


export type ActionType = (
  | IAction<'TOGGLE', string>
  | IAction<'CLEAR', null>
  | IAction<'SELECT_FROM_LAST', ISelectFromLast>
);
