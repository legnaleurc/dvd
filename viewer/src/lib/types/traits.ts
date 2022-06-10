import type { SvelteComponentTyped } from "svelte";

export type SvelteComponentConstructor<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
  Slots extends Record<string, unknown> = Record<string, unknown>,
> = new (...args: unknown[]) => SvelteComponentTyped<Props, Events, Slots>;

export type SvelteComponentModule<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
  Slots extends Record<string, unknown> = Record<string, unknown>,
> = {
  default: SvelteComponentConstructor<Props, Events, Slots>;
};

export type SvelteCustomEvents<Events extends Record<string, unknown>> = {
  [key in keyof Events]: CustomEvent<Events[key]>;
};

export type SvelteEventDispatcher<Events extends Record<string, unknown>> = <
  K extends keyof Events,
>(
  type: K,
  detail?: Events[K],
) => void;
