import { KeyParserInterface } from "./KeyParser";

export type KeySurferCallback =  (e: KeyboardEvent, keySeq: Command) => void;

export type KeySurferConfig = {
  preventDefault: boolean,
  stopPropagation: boolean,
  stopImmediatePropagation: boolean,
  timeoutMs: number;
}

type unixTimestamp = number;

export type Command = {
  timeout: number,
  keyString: string,
  id: string | null,
  sequences: KeySeq[],
  callback: KeySurferCallback,
}

export type OngoingCombo = {
  expires: unixTimestamp,
  command: Command, 
  step: number, // index of key sequence array
}

export type MetaFingerPrint = string | number;
export type GenerateFingerprint = (metaKeys: MetaKeys) => MetaFingerPrint;

export type CommandStore = {
  aliases: Map<string, string>,
  commands: Map<string, Command>,
  byFingerPrintKey: Map<MetaFingerPrint, Map<string, Command[]>>,
  byId: Map<string, Command>,
  ongoing: OngoingCombo[],
}

export type KeySeq = {
  metaFingerPrint: string | number,
  key: string,
}

export type MetaKeys = {
  altKey : boolean,
  ctrlKey : boolean,
  metaKey : boolean,
  shiftKey : boolean,
}

export const META_KEYS = {
  CTRL: 'ctrl',
  ALT: 'alt',
  META: 'meta',
  SHIFT: 'shift',
} as const;

export const KEY_TO_META_KEY: Record<typeof META_KEYS[keyof typeof META_KEYS], keyof MetaKeys> = {
  'ctrl': 'ctrlKey',
  'alt': 'altKey',
  'meta': 'metaKey',
  'shift': 'shiftKey',
} as const;

const defaultConfig: KeySurferConfig = {
  timeoutMs: 150,
  preventDefault: true,
  stopPropagation: false,
  stopImmediatePropagation: false,
}

export class KeySurfer {
  private store: CommandStore;
  private config: KeySurferConfig;

  constructor(
    config: Partial<KeySurferConfig> = {},
    
    private generateFingerprint: GenerateFingerprint,
    private parser: KeyParserInterface,
  ){
    this.config = { ...defaultConfig, ...config }

    this.store = {
      aliases: new Map([['space', ' ']]),
      commands: new Map(),
      byFingerPrintKey: new Map(),
      byId: new Map(),
      ongoing: [],
    }
  }

  aliases(){
    return this.store.aliases;
  }

  commands(){
    return this.store.commands;
  }

  getCommandById(id: string): Command | undefined {
    return this.store.byId.get(id);
  }

  getCommandByKeyString(keyString: string): Command | undefined {
    return this.store.commands.get(keyString);
  }

  ongoing(){
    return this.store.ongoing;
  }

  register(keyString: string, callback: KeySurferCallback, id?: string, timeoutMs?: number): this {
    const sequences = this.parser.parse(keyString, this.store.aliases); const command: Command = {
      timeout: timeoutMs ?? this.config.timeoutMs,
      keyString,
      id: id ?? null,
      sequences,
      callback
    }

    this.store.commands.set(keyString, command);
    if(!this.store.byFingerPrintKey.has(command.sequences[0].metaFingerPrint)){
      this.store.byFingerPrintKey.set(command.sequences[0].metaFingerPrint, new Map());
    }
    
    const group = this.store.byFingerPrintKey.get(command.sequences[0].metaFingerPrint)!;
    if(!group.has(command.sequences[0].key)) {
      group.set(command.sequences[0].key, []);
    }

    // @ts-ignore we check and set it above
    group.get(command.sequences[0].key).push(command);

    if(id !== undefined){
      this.store.byId.set(id, command);
    }

    return this;
  }

  unregister(keyString: string) {
    this.store.commands.delete(keyString);
  }

  unregisterById(id: string){
    const target = this.store.byId.get(id);

    if(!target){
      return;
    }

    this.store.commands.delete(target.keyString);
    const commands = this.store.byFingerPrintKey.get(target.sequences[0].metaFingerPrint)
      ?.get(target.sequences[0].key);

    if(commands){
      const index = commands.findIndex(command => command.callback === target.callback);
      if (index !== -1){
        commands.splice(index, 1);
      }
    }
  }

  alias(from: string, to: string){
    this.store.aliases.set(from, to);
  }

  match(metaFingerPrint: MetaFingerPrint, key: string): Command[] {
    return this.store.byFingerPrintKey.get(metaFingerPrint)
      ?.get(key) ?? [];
  }

  matchOngoing(nowTimestamp: number, metaFingerPrint: MetaFingerPrint, key: string): OngoingCombo[] {
    // every key sequecnce that is missed needs to be removed from ongoing
    this.store.ongoing = this.store.ongoing.filter( ongoing => {
        return ongoing.command.sequences[ongoing.step].metaFingerPrint === metaFingerPrint
          && ongoing.command.sequences[ongoing.step].key === key
          && ongoing.expires > nowTimestamp; 
    });

    return this.store.ongoing;
  }

  advanceOrRun(event: KeyboardEvent, ongoingCombo: OngoingCombo, timestamp: number): boolean {
    ongoingCombo.expires = timestamp + ongoingCombo.command.timeout;
    ongoingCombo.step++;

    if(ongoingCombo.step >= ongoingCombo.command.sequences.length){
      ongoingCombo.command.callback(event, ongoingCombo.command);

      this.store.ongoing = this.store.ongoing.filter(ongoing => {
        return ongoing.command !== ongoingCombo.command; 
      });

      return true;
    }

    // if first step we need to add to ongoing
    if(ongoingCombo.step === 1){
      this.store.ongoing.push(ongoingCombo);
    }

    return false;
  }

  handle(event: KeyboardEvent): string[] | null {
    const calledIds: string[] = [];
    const timestamp = Date.now();

    const metaFingerPrint = this.generateFingerprint({
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });

    const ongoing = this.matchOngoing(timestamp, metaFingerPrint, event.key)
    const commands = this.match(metaFingerPrint, event.key)
    
    if(ongoing.length > 0 || commands.length > 0){
      this.handleEventBubbling(event);
    }

    ongoing.forEach(ongoingCombo => {
        const run = this.advanceOrRun(event, ongoingCombo, timestamp);

        if(run && ongoingCombo.command.id){
          calledIds.push(ongoingCombo.command.id);
        }
      })
    
    commands.forEach(command => {
        const run = this.advanceOrRun(event, {
          expires: 0,
          step: 0,
          command,
        }, timestamp)

        if(run && command.id){
          calledIds.push(command.id);
        }
      })

    return calledIds.length > 0? calledIds: null;
  }

  handleEventBubbling(event: KeyboardEvent){
    if(this.config.preventDefault){
      event.preventDefault();
    }

    if(this.config.stopImmediatePropagation){
      event.stopImmediatePropagation();
    }

    if(this.config.stopPropagation){
      event.stopPropagation();
    }
  }

  /** use arrow method to bind this */
  onHandle = (event: KeyboardEvent) => {
    if(!(event instanceof KeyboardEvent)){
      return;
    }

    this.handle(event);
  }
}
