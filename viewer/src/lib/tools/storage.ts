export function saveToken(token: string) {
  window.localStorage.setItem("token", token);
}

export function loadToken() {
  const token = window.localStorage.getItem("token");
  return token ?? "";
}

export function saveShortcutList(shortcutList: string[]) {
  window.localStorage.setItem("shortcutList", JSON.stringify(shortcutList));
}

export function loadShortcutList() {
  const rv = window.localStorage.getItem("shortcutList");
  if (!rv) {
    return [];
  }
  const shortcutList: string[] = JSON.parse(rv);
  return shortcutList;
}

export function saveActionMap(actionMap: Record<string, string>) {
  window.localStorage.setItem("actionMap", JSON.stringify(actionMap));
}

export function loadActionMap() {
  const rv = window.localStorage.getItem("actionMap");
  if (!rv) {
    return {};
  }
  const actionMap: Record<string, string> = JSON.parse(rv);
  return actionMap;
}

export function saveMaxSize(maxSize: number) {
  window.localStorage.setItem("maxSize", maxSize.toString());
}

export function loadMaxSize(): number {
  const maxSize = window.localStorage.getItem("maxSize");
  return maxSize ? parseInt(maxSize, 10) : 0;
}
