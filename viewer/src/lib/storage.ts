import { Dict } from './common';


export function loadActionList (): Dict<string> | null {
  const actionList = localStorage.getItem('actionList');
  if (!actionList) {
    return null;
  }
  return JSON.parse(actionList);
}


export function saveActionList (actionList: Dict<string>) {
  const rv = JSON.stringify(actionList);
  localStorage.setItem('actionList', rv);
}


export function loadToken (): string {
  const token = localStorage.getItem('token');
  if (!token) {
    return '';
  }
  return token;
}


export function saveToken (token: string) {
  localStorage.setItem('token', token);
}


export function loadMoveList (): string[] {
  const moveList = localStorage.getItem('moveList');
  if (!moveList) {
    return [];
  }
  return JSON.parse(moveList);
}


export function saveMoveList (moveList: string[]) {
  const rv = JSON.stringify(moveList);
  localStorage.setItem('moveList', rv);
}
