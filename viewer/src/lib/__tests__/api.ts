import { enableFetchMocks } from 'jest-fetch-mock';

import {
  FileSystem,
  NodeResponse,
  SearchResponse,
  ImageResponse,
  ChangeResponse,
} from '@/lib/api';


enableFetchMocks();


describe('api', () => {

  describe('FileSystem', () => {

    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it('root', async () => {
      const expected = {
        id: '1',
      };
      fetchMock.mockOnce(async () => {
        return makeJsonResponse(expected);
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.root();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual('http://localhost/api/v1/nodes/root');
      expect(rv).toEqual(expected);
    });

    it('list', async () => {
      const id = '1';
      const expected: NodeResponse[] = [];
      fetchMock.mockOnce(async () => {
        return makeJsonResponse(expected);
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.list(id);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${id}/children`);
      expect(rv).toEqual(expected);
    });

    it('searchByName', async () => {
      const name = 'abc';
      const expected: SearchResponse[] = [];
      fetchMock.mockOnce(async () => {
        return makeJsonResponse(expected);
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.searchByName(name);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes?name=${name}`);
      expect(rv).toEqual(expected);
    });

    it('move', async () => {
      const src = '1';
      const dst = '2';
      const expected = {
        parent_id: dst,
      };
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.move(src, dst);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('PATCH');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${src}`);
      const args = await request.json();
      expect(args).toEqual(expected);
    });

    it('rename', async () => {
      const id = '1';
      const name = 'test';
      const expected = {
        name,
      };
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.rename(id, name);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('PATCH');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${id}`);
      const args = await request.json();
      expect(args).toEqual(expected);
    });

    it('mkdir', async () => {
      const parentId = '1';
      const name = 'test';
      const expected = {
        name,
        parent_id: parentId,
      };
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.mkdir(name, parentId);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('POST');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes`);
      const args = await request.json();
      expect(args).toEqual(expected);
    });

    it('trash', async () => {
      const id = '1';
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.trash(id);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('DELETE');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${id}`);
    });

    it('imageList', async () => {
      const id = '1';
      const expected: ImageResponse[] = [];
      fetchMock.mockOnce(async () => {
        return makeJsonResponse(expected);
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.imageList(id);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${id}/images`);
      expect(rv).toEqual(expected);
    });

    it('imageList (error)', async () => {
      const id = '1';
      const expected = 'unknown error';
      fetchMock.mockOnce(async () => {
        return makeJsonErrorResponse(503, {
          type: 'UnknownError',
          message: expected,
        });
      });

      const fileSystem = new FileSystem();
      expect(async () => {
        await fileSystem.imageList(id);
      }).rejects.toThrow(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(`http://localhost/api/v1/nodes/${id}/images`);
    });

    it('image', () => {
      const id = '1';
      const imageId = 0;
      const expected = `http://localhost/api/v1/nodes/${id}/images/${imageId}`;

      const fileSystem = new FileSystem();
      const rv = fileSystem.image(id, imageId);
      expect(rv).toEqual(expected);
    });

    it('stream', () => {
      const id = '1';
      const name = 'test.txt';
      const expected = `http://localhost/api/v1/nodes/${id}/stream/${encodeURI(name)}`;

      const fileSystem = new FileSystem();
      const rv = fileSystem.stream(id, name);
      expect(rv).toEqual(expected);
    });

    it('download', () => {
      const id = '1';
      const expected = `http://localhost/api/v1/nodes/${id}/download`;

      const fileSystem = new FileSystem();
      const rv = fileSystem.download(id);
      expect(rv).toEqual(expected);
    });

    it('sync', async () => {
      const expected: ChangeResponse[] = [];
      fetchMock.mockOnce(async () => {
        return makeJsonResponse(expected);
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.sync();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('POST');
      expect(request.url).toEqual(`http://localhost/api/v1/changes`);
      expect(rv).toEqual(expected);
    });

    it('apply', async () => {
      const command = 'echo';
      const kwargs = {};
      const expected = {
        command,
        kwargs,
      };
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.apply(command, kwargs);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('POST');
      expect(request.url).toEqual(`http://localhost/api/v1/apply`);
      const args = await request.json();
      expect(args).toEqual(expected);
    });

    it('fetchCache', async () => {
      fetchMock.mockOnce(async () => {
        return '[]';
      });

      const fileSystem = new FileSystem();
      const rv = await fileSystem.fetchCache();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(`http://localhost/api/v1/cache`);
    });

    it('clearCache', async () => {
      fetchMock.mockOnce(async () => {
        return '';
      });

      const fileSystem = new FileSystem();
      await fileSystem.clearCache();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toEqual('DELETE');
      expect(request.url).toEqual(`http://localhost/api/v1/cache`);
    });

  });

});


function makeJsonResponse (expected: any) {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expected),
  };
}


function makeJsonErrorResponse (status: number, expected: any) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(expected),
  };
}
