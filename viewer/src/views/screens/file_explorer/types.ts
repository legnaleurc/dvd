import {
  SORT_BY_NAME_ASC,
  SORT_BY_MTIME_ASC,
  SORT_BY_MTIME_DES,
  SortKey,
} from '@/views/hooks/file_system';


export const SORT_MENU_LIST: { name: string, value: SortKey }[] = [
  {
    name: 'Sort By Name Asc',
    value: SORT_BY_NAME_ASC,
  },
  {
    name: 'Sort By Modified Time Asc',
    value: SORT_BY_MTIME_ASC,
  },
  {
    name: 'Sort By Modified Time Des',
    value: SORT_BY_MTIME_DES,
  },
];
