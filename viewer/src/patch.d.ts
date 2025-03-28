// Non-standard property in Fierfox:
// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/mozUserCancelled
interface DataTransfer {
  mozUserCancelled: boolean;
}

// Custom event for intersection observer
interface ElementEventMap {
  "dv.intersect": CustomEvent<boolean>;
}
