import { Queue } from "./queue";

describe("queue", () => {
  describe("Queue", () => {
    it("should not be full", () => {
      const queue = new Queue<number>();
      expect(queue.isFull).toBeFalsy();
    });

    it("should throw an error if put-taskDone not match", () => {
      const queue = new Queue<number>();
      expect(() => {
        queue.taskDone();
      }).toThrow();
    });

    it("can be used in producer-consumer", async () => {
      const queue = new Queue<number>();
      const rv: number[] = [];

      async function producer(q: Queue<number>) {
        for (let i = 0; i < 10; ++i) {
          await q.put(i);
        }
        q.put(-1);
        q.put(-1);
        q.put(-1);
        await q.join();
      }

      async function consumer(q: Queue<number>, rv: number[]) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const item = await q.get();
          try {
            if (item < 0) {
              return;
            }
            rv.push(item);
          } finally {
            q.taskDone();
          }
        }
      }

      await Promise.all([
        producer(queue),
        consumer(queue, rv),
        consumer(queue, rv),
        consumer(queue, rv),
      ]);
      expect(rv.length).toEqual(10);
    });
  });
});
