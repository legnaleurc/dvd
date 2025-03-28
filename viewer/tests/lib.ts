import { expect } from "vitest";

export function expectNotNull<T>(value: T | null): asserts value is T {
  expect(value).not.toBeNull();
}
