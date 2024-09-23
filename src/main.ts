import { KeyParser } from './KeyParser';
import { KeySurfer, KeySurferConfig } from './KeySurfer';
import { generateFingerprint } from './generateFingerprint';

export function createKeySurfer(config: Partial<KeySurferConfig> = {}){
  return new KeySurfer(
    config,
    generateFingerprint,
    new KeyParser(generateFingerprint),
  );
}

