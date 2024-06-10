/// @vitest-environment jsdom

import { describe, expect, it, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import RoundedButton from "$atoms/RoundedButton.svelte";

describe("RoundedButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("can trigger click event", async () => {
    const handler = vi.fn();
    const { getByRole, component } = render(RoundedButton);
    component.$on("click", handler);
    const button = getByRole("button");
    await fireEvent.click(button);
    expect(handler).toBeCalled();
  });
});
