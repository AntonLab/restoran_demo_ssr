// One Node process, so an in-memory lock is enough.
// tail never rejects, so a failed task does not stall the queue behind it.
export function createMutex() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.then(task);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}
