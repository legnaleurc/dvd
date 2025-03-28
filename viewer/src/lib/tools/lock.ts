export class Future<T> {
  private _promise: Promise<T>;
  private _resolve: (rv: T) => void;
  private _reject: (e: unknown) => void;

  constructor() {
    this._resolve = () => {};
    this._reject = () => {};
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get promise() {
    return this._promise;
  }

  resolve(rv: T) {
    this._resolve(rv);
  }

  reject(reason: unknown) {
    this._reject(reason);
  }
}

export class Event_ {
  private _waiterList: Set<Future<null>>;
  private _value: boolean;

  constructor() {
    this._waiterList = new Set<Future<null>>();
    this._value = false;
  }

  get isSet() {
    return this._value;
  }

  set() {
    if (this.isSet) {
      return;
    }
    this._value = true;
    for (const future of this._waiterList) {
      future.resolve(null);
    }
  }

  clear() {
    this._value = false;
  }

  async wait() {
    if (this.isSet) {
      return true;
    }

    const future = new Future<null>();
    this._waiterList.add(future);
    try {
      await future.promise;
      return true;
    } finally {
      this._waiterList.delete(future);
    }
  }
}
