import type { SvelteEventDispatcher } from "$lib/types/traits";

type Events = {
  enterpressed: null;
};
type InputEventsActionParams = {
  dispatch: SvelteEventDispatcher<Events>;
};
export function inputEvents(
  node: HTMLInputElement,
  params: InputEventsActionParams,
) {
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    params.dispatch("enterpressed");
  }
  node.addEventListener("keypress", handleKeyPress);
  return {
    destroy() {
      node.removeEventListener("keypress", handleKeyPress);
    },
  };
}
