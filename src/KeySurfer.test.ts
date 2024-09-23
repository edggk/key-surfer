import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeyParser } from "./KeyParser";
import { KeySurfer, MetaKeys } from "./KeySurfer";
import { generateFingerprint } from "./generateFingerprint";

function createKeyBoardEvent(key: string, metaKeys: Partial<MetaKeys> = {}): KeyboardEvent {
  return {
    key,
    altKey: metaKeys?.altKey ?? false,
    ctrlKey: metaKeys?.ctrlKey ?? false,
    metaKey: metaKeys?.metaKey ?? false,
    shiftKey: metaKeys?.shiftKey ?? false,
  } as KeyboardEvent;
}

const timeoutMs = 50;

describe('KeySurfer', () => {
  const parser = new KeyParser(generateFingerprint);
  let keySurfer: KeySurfer;

  beforeEach(() => {
    keySurfer = new KeySurfer({ timeoutMs }, generateFingerprint, parser);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // do a loop of possible key combinations
  it('handles key input ctrl-a', () => {
    const callbackMock = vi.fn();
    keySurfer.register('ctrl-a', callbackMock);

    keySurfer.handle(
      createKeyBoardEvent('a', { ctrlKey: true }),
    );

    expect(callbackMock).toHaveBeenCalledOnce();
  })

  // do a loop of possible key combinations
  it('handles key longer sequences ctr-a b', () => {
    const callbackMock = vi.fn();
    keySurfer.register('ctrl-a b', callbackMock);

    keySurfer.handle(
      createKeyBoardEvent('a', { ctrlKey: true }),
    );

    keySurfer.handle(
      createKeyBoardEvent('b'),
    );

    expect(callbackMock).toHaveBeenCalledOnce();
  })

  it('it only calls target commands', () => {
    const callbackMock = vi.fn();
    const otherCallbackMock = vi.fn();
    
    keySurfer.register('ctrl-b', otherCallbackMock);
    keySurfer.register('ctrl-a b D', otherCallbackMock);
    keySurfer.register('ctrl-a b C d', otherCallbackMock);
    
    keySurfer.register('ctrl-a b C alt-d', callbackMock);
    
    keySurfer.handle(createKeyBoardEvent('a', { ctrlKey: true }));
    keySurfer.handle(createKeyBoardEvent('b'));
    keySurfer.handle(createKeyBoardEvent('C', { shiftKey: true }));
    keySurfer.handle(createKeyBoardEvent('d', { altKey: true }));

    expect(callbackMock).toHaveBeenCalledOnce();
    expect(otherCallbackMock).toHaveBeenCalledTimes(0);
  })

  it('should respect default timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    const callbackMock = vi.fn();
    keySurfer.register('ctrl-a b', callbackMock);

    keySurfer.handle(
      createKeyBoardEvent('a', { ctrlKey: true }),
    );

    vi.setSystemTime(Date.now() + timeoutMs + 10);
    keySurfer.handle( createKeyBoardEvent('b'));

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  it('should respect per command timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());

    const callbackMock = vi.fn();
    const otherCallbackMock = vi.fn();
    
    keySurfer.register('ctrl-a b', callbackMock, 'test', 150);
    keySurfer.register('ctrl-a b', callbackMock, 'test');

    keySurfer.handle(
      createKeyBoardEvent('a', { ctrlKey: true }),
    );

    vi.setSystemTime(Date.now() + timeoutMs + 10);
    keySurfer.handle( createKeyBoardEvent('b'));

    expect(callbackMock).toHaveBeenCalledOnce();
    expect(otherCallbackMock).toHaveBeenCalledTimes(0);
  });

  it('has alias for space', () => {
    expect(keySurfer.aliases().get('space')).toBe(' ');
  });

  it('registers alias', () => {
    keySurfer.alias('leader', 'space');

    expect(keySurfer.aliases().get('leader')).toBe('space');
  })

  it('aliases are respected', () => {
    keySurfer.alias('leader', 'b');

    const callbackMock = vi.fn();
    keySurfer.register('leader a', callbackMock);

    keySurfer.handle(createKeyBoardEvent('b'));
    keySurfer.handle(createKeyBoardEvent('a'));

    expect(callbackMock).toHaveBeenCalledOnce();
  })

  it('clears missed ongoing sequences', () => {
    const callbackMock = vi.fn();
    keySurfer.register('ctrl-a b', callbackMock);

    keySurfer.handle(createKeyBoardEvent('a', { ctrlKey: true }));
    keySurfer.handle(createKeyBoardEvent('c'));

    expect(keySurfer.ongoing.length).equal(0);
  })

  it('returns command by id', () => {
    const callbackMock = vi.fn();

    keySurfer.register('ctrl-a b', callbackMock, 'command:id');
    const command = keySurfer.getCommandById('command:id');
    
    expect(command).toBeDefined();
    expect(command?.callback).toBe(callbackMock);
  })

  it('returns command by keyString', () => {
    const callbackMock = vi.fn();

    keySurfer.register('ctrl-a b', callbackMock);
    const command = keySurfer.getCommandByKeyString('ctrl-a b');

    expect(command).toBeDefined();
    expect(command?.callback).toBe(callbackMock);
  })

  // it('handles DOM element event with onHandle', () => {
  //   expect(true).equal(false);
  // })
  //
  // it('respects preventDefault', () => {
  //   const keySurfer = new KeySurfer({ preventDefault: true }, generateFingerprint, parser);
  //   const event = createKeyBoardEvent('a', { ctrlKey: true });
  //
  //   event.preventDefault = vi.fn();
  //   event.stopPropagation = vi.fn();
  //   event.stopImmediatePropagation = vi.fn();
  //
  //   keySurfer.onHandle(event);
  //
  //   expect(event.preventDefault).toHaveBeenCalledOnce();
  //   expect(event.stopPropagation).not.toHaveBeenCalled();
  //   expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
  // });
  //
  // it('respects stopPropagation', () => {
  //   const keySurfer = new KeySurfer({ stopPropagation: true }, generateFingerprint, parser);
  //   const event = createKeyBoardEvent('a', { ctrlKey: true });
  //
  //   event.preventDefault = vi.fn();
  //   event.stopPropagation = vi.fn();
  //   event.stopImmediatePropagation = vi.fn();
  //
  //   keySurfer.onHandle(event);
  //
  //   expect(event.preventDefault).not.toHaveBeenCalled();
  //   expect(event.stopPropagation).toHaveBeenCalledOnce();
  //   expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
  // });
  //
  // it('respects stopImmediatePropagation', () => {
  //   const keySurfer = new KeySurfer({ stopImmediatePropagation: true }, generateFingerprint, parser);
  //   const event = createKeyBoardEvent('a', { ctrlKey: true });
  //
  //   event.preventDefault = vi.fn();
  //   event.stopPropagation = vi.fn();
  //   event.stopImmediatePropagation = vi.fn();
  //
  //   keySurfer.onHandle(event);
  //
  //   expect(event.preventDefault).not.toHaveBeenCalled();
  //   expect(event.stopPropagation).not.toHaveBeenCalled();
  //   expect(event.stopImmediatePropagation).toHaveBeenCalledOnce();
  // });
});
