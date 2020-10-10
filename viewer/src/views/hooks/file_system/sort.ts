import { Node, SortKey } from './types';


function sortByName (a: Node, b: Node) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}


function sortByDate (a: Node, b: Node) {
  if (a.modified < b.modified) {
    return -1;
  }
  if (a.modified > b.modified) {
    return 1;
  }
  return 0;
}


const TABLE: Record<SortKey, (a: Node, b: Node) => number> = {
  SORT_BY_NAME_ASC: sortByName,
  SORT_BY_MTIME_ASC: sortByDate,
  SORT_BY_MTIME_DES: (a: Node, b: Node) => (-1 * sortByDate(a, b)),
};


export function getCompareFunction (key: SortKey) {
  const fn = TABLE[key];
  if (!fn) {
    return sortByName;
  }
  return fn;
}
