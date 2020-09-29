export type Dict<T> = Record<string, T>;


export function * chunksOf<T> (array: T[], size: number) {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}
