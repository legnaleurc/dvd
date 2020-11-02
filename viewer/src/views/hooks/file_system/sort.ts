import { Node_, SortKey, SortFunction } from './types';


function sortByName (a: Node_, b: Node_) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}


function sortByDate (a: Node_, b: Node_) {
  if (a.modified < b.modified) {
    return -1;
  }
  if (a.modified > b.modified) {
    return 1;
  }
  return 0;
}


const TABLE: Record<SortKey, SortFunction> = {
  SORT_BY_NAME_ASC: sortByName,
  SORT_BY_MTIME_ASC: sortByDate,
  SORT_BY_MTIME_DES: (a: Node_, b: Node_) => (-1 * sortByDate(a, b)),
};


export function getCompareFunction (key: SortKey) {
  const fn = TABLE[key];
  if (!fn) {
    return sortByName;
  }
  return fn;
}
