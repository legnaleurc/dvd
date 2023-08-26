import type { SvelteComponent } from "svelte";

export type SvelteComponentConstructor<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
  Slots extends Record<string, unknown> = Record<string, unknown>,
> = new (...args: unknown[]) => SvelteComponent<Props, Events, Slots>;

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
