import { jest } from "@jest/globals";
import { render, fireEvent } from "@testing-library/svelte";
import IconButton from "./IconButton.svelte";

describe("Button", () => {
  it("can trigger click event", async () => {
    const handler = jest.fn();
    const { getByRole, component } = render(IconButton);
    component.$on("click", handler);
    const button = getByRole("button");
    await fireEvent.click(button);
    expect(handler).toBeCalled();
  });
});
