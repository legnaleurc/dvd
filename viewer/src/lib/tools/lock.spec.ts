import { Future, Event_ } from "./lock";

describe("lock", () => {
  describe("Future", () => {
    it("can be resolved", async () => {
      const future = new Future<null>();
      future.resolve(null);
      await expect(future.promise).resolves.toBeNull();
    });

    it("can be rejected", async () => {
      const future = new Future<null>();
      const e = new Error("test");
      future.reject(e);
      await expect(future.promise).rejects.toEqual(e);
    });
  });

  describe("Event_", () => {
    it("can be waited by many Promises", async () => {
      const event = new Event_();
      const blocker = Promise.all([
        (async () => {
          await event.wait();
          return 1;
        })(),
        (async () => {
          await event.wait();
          return 2;
        })(),
      ]);
      event.set();
      await expect(blocker).resolves.toEqual([1, 2]);
    });

    it("can be set multiple times", async () => {
      const event = new Event_();
      event.set();
      expect(() => {
        event.set();
      }).not.toThrow();
    });
  });
});
