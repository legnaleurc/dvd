import { Dict, chunksOf } from './common';


const MAX_TASK_COUNT = 6;


export class FileSystem {

  private _baseURL: string;

  constructor () {
    const { protocol, host } = location;
    this._baseURL = `${protocol}//${host}`;
  }

  async root () {
    const r = await this._get('/api/v1/nodes/root');
    const rv: NodeResponse = await r.json();
    return rv;
  }

  async list (id: string) {
    const r = await this._get(`/api/v1/nodes/${id}/children`);
    const rv: NodeResponse[] = await r.json();
    return rv;
  }

  async searchByName (name: string) {
    const r = await this._get('/api/v1/nodes', {
      name,
    });
    const rv: SearchResponse[] = await r.json();
    return rv;
  }

  async move (srcList: string[], id: string) {
    for (const chunk of chunksOf(srcList, MAX_TASK_COUNT)) {
      const requestList = chunk.map(async src => {
        try {
          const rv = await this._patch(`/api/v1/nodes/${src}`, {
            parent_id: id,
          });
          return rv;
        } catch (e) {
          console.warn(e);
        }
      });
      await Promise.all(requestList);
    }
  }

  async trash (srcList: string[]) {
    for (const chunk of chunksOf(srcList, MAX_TASK_COUNT)) {
      const requestList = chunk.map(src => this._delete(`/api/v1/nodes/${src}`));
      await Promise.all(requestList);
    }
  }

  async imageList (id: string) {
    const r = await this._get(`/api/v1/nodes/${id}/images`);
    const rv: ImageResponse[] = await r.json();
    return rv;
  }

  stream (id: string, name: string) {
    return `${this._baseURL}/api/v1/nodes/${id}/stream/${encodeURI(name)}`;
  }

  download (id: string) {
    return `${this._baseURL}/api/v1/nodes/${id}/download`;
  }

  image (id: string, imageId: number) {
    return `${this._baseURL}/api/v1/nodes/${id}/images/${imageId}`;
  }

  async apply (command: string, kwargs: object ) {
    await this._post('/api/v1/apply', {
      command,
      kwargs,
    });
  }

  async sync () {
    const r = await this._post('/api/v1/changes');
    const rv: ChangeResponse[] = await r.json();
    return rv;
  }

  private async _get (path: string, params?: Dict<any>) {
    return await this._ajax('GET', path, params);
  }

  private async _post (path: string, params?: Dict<any>) {
    return await this._ajax('POST', path, params);
  }

  private async _patch (path: string, params?: Dict<any>) {
    return await this._ajax('PATCH', path, params);
  }

  private async _delete (path: string, params?: Dict<any>) {
    return await this._ajax('DELETE', path, params);
  }

  private async _ajax (method: string, path: string, params?: Dict<any>) {
    const url = new URL(`${this._baseURL}${path}`);
    let body = null;
    if (params) {
      if (method === 'GET') {
        Object.keys(params).forEach(k => {
          url.searchParams.append(k, params[k].toString());
        });
      } else {
        body = JSON.stringify(params);
      }
    }
    const rqst = new Request(url.toString(), {
      method,
      cache: 'no-cache',
      body,
      mode: 'cors',
    });
    return await fetch(rqst);
  }

}


export interface NodeResponse {
  id: string;
  name: string;
  parent_list: string[];
  modified: string;
  mime_type: string;
  is_folder: boolean;
  trashed: boolean;
}


export interface ChangeResponse {
  removed: boolean;
}


export interface RemovedChangeResponse extends ChangeResponse {
  id: string;
}


export interface UpsertChangeResponse extends ChangeResponse {
  node: NodeResponse;
}


export interface SearchResponse {
  id: string;
  name: string;
  hash: string;
  size: number;
  mime_type: string;
  path: string;
}


export interface ImageResponse {
  width: number;
  height: number;
}