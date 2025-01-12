export function extractCircleAndAuthor(name: string): string {
  const rv = name.match(/\[(.*?)\]/);
  return rv ? rv[1] : "";
}
