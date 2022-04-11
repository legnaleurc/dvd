import type { SvelteComponentTyped } from "svelte";

export type SvelteComponentConstructor<
  Props extends Record<string, any> = any,
  Events extends Record<string, any> = any,
  Slots extends Record<string, any> = any,
> = new (...args: unknown[]) => SvelteComponentTyped<Props, Events, Slots>;

export type SvelteCustomEvents<Events extends Record<string, any>> = {
  [key in keyof Events]: CustomEvent<Events[key]>;
};

export type SvelteEventDispatcher<Events extends Record<string, any>> = <
  K extends keyof Events,
>(
  type: K,
  detail?: Events[K],
) => void;
