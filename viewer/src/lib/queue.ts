import { Future, Event_ } from './common';


export class Queue<T> {

  private _unfinishedCount: number;
  private _queue: T[];
  private _getterList: Future<null>[];
  private _finished: Event_;

  constructor () {
    this._unfinishedCount = 0;
    this._queue = [];
    this._getterList = [];
    this._finished = new Event_();
    this._finished.set();
  }

  get isEmpty () {
    return this._queue.length <= 0;
  }

  get isFull () {
    return false;
  }

  async put (task: T) {
    this._queue.push(task);
    this._unfinishedCount += 1;
    this._finished.clear();
    wakeUp(this._getterList);
  }

  async get () {
    while (this.isEmpty) {
      const getter = new Future<null>();
      this._getterList.push(getter);
      await getter.promise;
    }
    const top = this._queue[0];
    this._queue.shift();
    return top;
  }

  taskDone () {
    if (this._unfinishedCount <= 0) {
      throw new Error('taskDone() called too many times');
    }
    this._unfinishedCount -= 1;
    if (this._unfinishedCount === 0) {
      this._finished.set();
    }
  }

  async join () {
    if (this._unfinishedCount > 0) {
      await this._finished.wait();
    }
  }

}


function wakeUp (waiterList: Future<null>[]) {
  while (waiterList.length > 0) {
    const waiter = waiterList[0];
    waiterList.shift()
    waiter.resolve(null);
    break;
  }
}
