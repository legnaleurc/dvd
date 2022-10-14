/// @vitest-environment jsdom

import { describe, expect, it, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Button from "./Button.svelte";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("can trigger click event", async () => {
    const handler = vi.fn();
    const { getByRole, component } = render(Button, {
      label: "",
      icon: "",
    });
    component.$on("click", handler);
    const button = getByRole("button");
    await fireEvent.click(button);
    expect(handler).toBeCalled();
  });
});
