import { Dict } from './common';


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

  async move (src: string, dst: string) {
    await this._patch(`/api/v1/nodes/${src}`, {
      parent_id: dst,
    });
  }

  async rename (id: string, name: string) {
    await this._patch(`/api/v1/nodes/${id}`, {
      name,
    });
  }

  async mkdir (name: string, parent_id: string) {
    await this._post(`/api/v1/nodes`, {
      name,
      parent_id,
    });
  }

  async trash (id: string) {
    await this._delete(`/api/v1/nodes/${id}`);
  }

  async imageList (id: string) {
    const r = await this._get(`/api/v1/nodes/${id}/images`);
    if (r.status !== 200) {
      const rv: ImageListError = await r.json();
      throw new Error(rv.message);
    }
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

  async apply (command: string, kwargs: object) {
    await this._post('/api/v1/apply', {
      command,
      kwargs,
    });
  }

  async fetchCache () {
    const r = await this._get('/api/v1/cache');
    const rv: CacheResponse[] = await r.json();
    return rv;
  }

  async clearCache () {
    await this._delete('/api/v1/cache');
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


export interface RemovedChangeResponse {
  removed: true;
  id: string;
}


export interface UpsertChangeResponse {
  removed: false;
  node: NodeResponse;
}


export type ChangeResponse = RemovedChangeResponse | UpsertChangeResponse;


export interface SearchResponse extends NodeResponse {
  size: number;
  hash: string;
  path: string;
}


export interface ImageListError {
  type: string;
  message: string;
}


export interface ImageResponse {
  width: number;
  height: number;
}


export interface CacheResponse {
  id: string;
  name: string;
  image_list: ImageResponse[];
}
