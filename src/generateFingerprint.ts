import { MetaKeys } from "./KeySurfer";

export function generateFingerprint(data: MetaKeys): number {
  return (data.altKey? 8 : 0) | (data.ctrlKey ? 4 : 0) | (data.metaKey ? 2 : 0) | (data.shiftKey ? 1 : 0);
}
