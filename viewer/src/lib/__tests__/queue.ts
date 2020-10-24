import { Queue } from '@/lib/queue';


describe('queue', () => {

  describe('Queue', () => {

    it('can be used in producer-consumer', async () => {
      const queue = new Queue<number>();
      const rv: number[] = [];

      async function producer (q: Queue<number>) {
        for (let i = 0; i < 10; ++i) {
          await q.put(i);
        }
        q.put(-1);
        q.put(-1);
        q.put(-1);
        await q.join();
      }

      async function consumer (q: Queue<number>, rv: number[]) {
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
