// Non-standard property in Fierfox:
// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/mozUserCancelled
interface DataTransfer {
  mozUserCancelled: boolean;
}

// Partial type to fix this:
// https://github.com/v1ack/svelte-virtual-scroll-list/pull/2
declare module "svelte-virtual-scroll-list" {
  import { SvelteComponentTyped } from "svelte";

  export interface VirtualScrollProps<T extends Record<string, unknown>> {
    data?: T[];
    estimateSize?: number;
  }

  export default class VirtualScroll<
    T extends Record<string, unknown>,
  > extends SvelteComponentTyped<
    VirtualScrollProps<T>,
    Record<string, never>,
    {
      default: { data: T };
      footer: Record<string, never>;
      header: Record<string, never>;
    }
  > {}
}
