import { META_KEYS } from './src/KeySurfer';
import { createKeySurfer } from './src/main';

const keySurfer = createKeySurfer({
  timeoutMs: 300,
});

const keys = [
  'Tab a',
  'space c d',
  'leader t',
  `${META_KEYS.ALT}-a`,
  `${META_KEYS.ALT}-b c d`,
  `${META_KEYS.ALT}-${META_KEYS.CTRL}-w`,
];

keySurfer.alias('leader', 'l');

for(const key of keys){
  console.log(key);
  keySurfer.register(key, () => {
    alert(key);
  }, undefined);
}

window.keySurfer = keySurfer;

document.addEventListener('keydown', keySurfer.onHandle);

