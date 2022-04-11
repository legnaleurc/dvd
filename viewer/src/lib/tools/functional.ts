export function debounce<T extends readonly unknown[]>(
  fn: (...args: readonly [...T]) => void,
  delay: number,
) {
  let handle: ReturnType<typeof setTimeout>;
  return (...args: readonly [...T]) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
}
