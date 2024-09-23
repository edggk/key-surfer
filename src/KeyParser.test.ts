import { it, expect, describe } from 'vitest';
import { KeySeq, META_KEYS, MetaFingerPrint, MetaKeys } from './KeySurfer';
import { KeyParser } from './KeyParser';

const generateFingerprint = (metaKeys: MetaKeys): MetaFingerPrint => {
  const id = `${metaKeys.altKey ? 'a' : ''}${metaKeys.ctrlKey ? 'c' : ''}${metaKeys.metaKey ? 'm' : ''}${metaKeys.shiftKey ? 's' : ''}`;

  return id === '' ?  'n': id;
}

describe('KeyParser parse part', () => {
  const cases: [string, string, KeySeq][] = [
    ['a', 'should parse single lowercase key a', { metaFingerPrint: 'n', key: 'a' }],
    ['b', 'should parse single lowercase key b', { metaFingerPrint: 'n', key: 'b' }],
    ['A', 'should parse single uppercase key A', { metaFingerPrint: 's', key: 'A' }],
    ['B', 'should parse single uppercase key B', { metaFingerPrint: 's', key: 'B' }],

    [`${META_KEYS.CTRL}-c`, 'should parse keycombo lowercase ctrl-c', { metaFingerPrint: 'c', key: 'c' }],
    [`${META_KEYS.CTRL}-C`, 'should parse keycombo uppercase ctrl-C', { metaFingerPrint: 'cs', key: 'C' }],
    
    [`${META_KEYS.SHIFT}-c`, 'should parse lowercase with shift should produce uppercase', { metaFingerPrint: 's', key: 'C' }],
    
    [`${META_KEYS.CTRL}-${META_KEYS.ALT}-c`, 'should parse keycombo with alt ctrl-alt-c', { metaFingerPrint: 'ac', key: 'c' }],
    [`${META_KEYS.CTRL}-${META_KEYS.ALT}-${META_KEYS.META}-c`, 'should parse keycombo with meta ctrl-alt-meta-c', { metaFingerPrint: 'acm', key: 'c' }],
    [`${META_KEYS.CTRL}-${META_KEYS.ALT}-${META_KEYS.META}-${META_KEYS.SHIFT}-c`, 'should parse keycombo with shift ctrl-alt-shift-c', { metaFingerPrint: 'acms', key: 'C' }],
  ];

  for(const c of cases) {
    const [key, msg, expected] = c;
    
    it(msg, () => {
      const parser = new KeyParser(generateFingerprint);
      const actual = parser.parsePart(key, new Map());

      expect(actual).toStrictEqual(expected);
    })
  }

  it('should fail if combo is longer than 5 items', () => {
    const parser = new KeyParser(generateFingerprint);

    expect(() => parser.parsePart('a-b-c-d-e-f', new Map()))
      .toThrow('invalid key combination: a-b-c-d-e-f');
  })

  it('should fail if unknown meta key', () => {
    const parser = new KeyParser(generateFingerprint);

    expect(() => parser.parsePart('random-a', new Map()))
      .toThrow('invalid key combination: random-a');
  })

  it('should fail if multichar key', () => {
    const parser = new KeyParser(generateFingerprint);

    expect(() => parser.parsePart('ad', new Map()))
      .toThrow('invalid key combination: ad');
  })

  it('should respect aliases as metakey', () => {
    const parser = new KeyParser(generateFingerprint);
 
    expect(parser.parsePart('leader-w', new Map([['leader', META_KEYS.CTRL]]) ))
      .toStrictEqual({ metaFingerPrint: 'c', key: 'w' });
  })

  it('should respect aliases as single chars', () => {
    const parser = new KeyParser(generateFingerprint);

    expect(parser.parsePart(`${META_KEYS.CTRL}-leader`, new Map([['leader', 'w']]) ))
      .toStrictEqual({ metaFingerPrint: 'c', key: 'w' });
  })

  it('should support Tab key', () => {
    const parser = new KeyParser(generateFingerprint);
 
    expect(parser.parsePart(`${META_KEYS.ALT}-Tab`, new Map()))
      .toStrictEqual({ metaFingerPrint: 'a', key: 'Tab' });
  })
})

