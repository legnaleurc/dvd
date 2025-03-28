import type { Component } from "svelte";

export type NeverRecord = Record<string, never>;
export type UnknownRecord = Record<string, unknown>;

export type SvelteComponentModule<Props extends UnknownRecord = UnknownRecord> =
  {
    default: Component<Props>;
  };

export type SvelteCustomEvents<Events extends UnknownRecord> = {
  [key in keyof Events]: CustomEvent<Events[key]>;
};
