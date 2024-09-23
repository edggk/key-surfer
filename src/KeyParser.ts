import { GenerateFingerprint, KEY_TO_META_KEY, KeySeq, META_KEYS, MetaKeys } from "./KeySurfer";

export interface KeyParserInterface {
  parse(keyString: string, aliases: Map<string, string>): KeySeq[],
  parsePart(keyString: string, aliases: Map<string, string>): KeySeq,
}

export class KeyParser implements KeyParserInterface {
  constructor(private generateFingerprint: GenerateFingerprint){}

  parse(keyString: string, aliases: Map<string, string>): KeySeq[] {
    keyString = keyString.trim();

    if(keyString === ''){
      throw `invalid key combination: ${keyString}`;
    }

    return keyString.split(' ')
      .map(part => this.parsePart(part, aliases));
  }

  parsePart(keyString: string, aliases: Map<string, string>): KeySeq {
    let key: string|null = null;
    const metaKeys: MetaKeys = {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    };

    const parts = keyString.trim().split('-');
    
    // 4 metakeys + 1 alphaNum key, yes all 4 meta keys would be interesting
    if(parts.length > 5){
      throw `invalid key combination: ${keyString}`;
    }

    for(let part of parts){
      part = part.trim();
      part = aliases.get(part) ?? part;

      if(part in KEY_TO_META_KEY){
        metaKeys[KEY_TO_META_KEY[
          (part as typeof META_KEYS[keyof typeof META_KEYS])
        ]] = true;
      }
      // Tab is a special case
      else if(part === 'Tab'){
        key = 'Tab';
      }
      // if it's not a meta key then we accept only single chars
      else if(part.length !== 1){
        throw `invalid key combination: ${keyString}`;
      }
      else{
        if(key){
          throw `invalid key combination: ${keyString}`;
        }

        key = part;

        /*
         * If upper case then we need to add shiftKey to meta.
         *
         * TODO: Check if there is a better way to do this for multi lang ?
         */
        if(!metaKeys.shiftKey && key !== ' ' && key.toUpperCase() === key){
          metaKeys.shiftKey = true;
        }
      }
    }

    // if shift was set in meta keys then key should be uppercased
    if(key && metaKeys.shiftKey && key !== 'Tab'){
      key = key.toUpperCase();
    }

    if(!key){
      throw `invalid key combination: ${keyString}`;
    }

    return {
      key,
      metaFingerPrint: this.generateFingerprint(metaKeys),
    }
  }
}
