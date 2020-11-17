import { FileSystem, INodeLike, Queue } from '@/lib';
import { Dispatch, MAX_TASK_COUNT } from './types';


type Task = ((consumerId: number) => Promise<void>) | null;


export class ActionQueue {

  private _fs: FileSystem;
  private _s: () => Promise<void>;
  private _d: Dispatch;
  private _q: Queue<Task>;

  constructor (fileSystem: FileSystem, sync: () => Promise<void>, dispatch: Dispatch) {
    this._fs = fileSystem;
    this._s = sync;
    this._d = dispatch;
    this._q = new Queue<Task>();
  }

  async moveNodes (srcList: INodeLike[], dst: INodeLike) {
    this._d({
      type: 'ADD_PENDING',
      value: srcList.length,
    });
    for (const src of srcList) {
      await this._q.put(async (consumerId) => {
        this._d({
          type: 'SET_PROGRESS',
          value: {
            consumerId,
            name: src.name,
          },
        });
        try {
          await this._fs.move(src.id, dst.id);
          this._d({
            type: 'RESOLVE',
            value: consumerId,
          });
        } catch (e) {
          this._d({
            type: 'REJECT',
            value: consumerId,
          });
          throw e;
        }
      });
    }
    await this._q.join();
    await this._s();
  }

  async trashNodes (nodeList: INodeLike[]) {
    this._d({
      type: 'ADD_PENDING',
      value: nodeList.length,
    });
    for (const node of nodeList) {
      await this._q.put(async (consumerId) => {
        this._d({
          type: 'SET_PROGRESS',
          value: {
            consumerId,
            name: node.name,
          },
        });
        try {
          await this._fs.trash(node.id);
          this._d({
            type: 'RESOLVE',
            value: consumerId,
          });
        } catch (e) {
          this._d({
            type: 'REJECT',
            value: consumerId,
          });
          throw e;
        }
      });
    }
    await this._q.join();
    await this._s();
  }

  start () {
    for (let i = 0; i < MAX_TASK_COUNT; ++i) {
      this._consume(i);
    }
  }

  async stop () {
    for (let i = 0; i < MAX_TASK_COUNT; ++i) {
      this._q.put(null);
    }
    await this._q.join();
  }

  private async _consume (id: number) {
    while (true) {
      const task = await this._q.get();
      if (!task) {
        break;
      }
      try {
        await task(id);
      } catch (e) {
        console.warn(e);
      } finally {
        this._q.taskDone();
      }
    }
  }

}
