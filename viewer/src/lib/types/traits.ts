import type { SvelteComponent } from "svelte";

export type NeverRecord = Record<string, never>;
export type UnknownRecord = Record<string, unknown>;

export type SvelteComponentConstructor<
  Props extends UnknownRecord = UnknownRecord,
  Events extends UnknownRecord = UnknownRecord,
  Slots extends UnknownRecord = UnknownRecord,
> = new (...args: unknown[]) => SvelteComponent<Props, Events, Slots>;

export type SvelteComponentModule<
  Props extends UnknownRecord = UnknownRecord,
  Events extends UnknownRecord = UnknownRecord,
  Slots extends UnknownRecord = UnknownRecord,
> = {
  default: SvelteComponentConstructor<Props, Events, Slots>;
};

export type SvelteCustomEvents<Events extends UnknownRecord> = {
  [key in keyof Events]: CustomEvent<Events[key]>;
};
