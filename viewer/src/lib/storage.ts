import { Dict } from './common';


export function getActionList (): Dict<string> | null {
  const actionList = localStorage.getItem('actionList');
  if (!actionList) {
    return null;
  }
  return JSON.parse(actionList);
}


export function setActionList (actionList: Dict<string>) {
  const rv = JSON.stringify(actionList);
  localStorage.setItem('actionList', rv);
}


export function getToken (): string {
  const token = localStorage.getItem('token');
  if (!token) {
    return '';
  }
  return token;
}


export function setToken (token: string) {
  localStorage.setItem('token', token);
}
