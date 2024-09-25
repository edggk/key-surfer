# Key surfer

Key Surfer is a lightweight keyboard event-handling library that helps you manage key presses and shortcuts in your web applications.

## Features

- Handles common key events, including space and tab
- Customizable key aliases. For example, you can set the leader key to `space` and then use it in your commands. `leader c` would be `space c`
- Key press sequences. For example, you can use `ctrl-a b`, this would require the user to press `ctrl+a` followed by `b`.
- Customizable key sequence timeout. Per KeySurfer instance or per command.
- You can add a custom parser to change the syntax of the key definition.

## Installation

TBD

## Usage

```typescript
const keySurfer = createKeySurfer({
  timeoutMs: 300,
});

// User has to click ctrl + a first and then b
keySurfer.register('ctrl-a b', (e: KeyboardEvent) => {
  // do something
});

// User has to click ctrl + a first and then ctrl + alt + b and then c
keySurfer.register('ctrl-a ctr-alt-b c', (e: KeyboardEvent) => {
  // do something
});

keySurfer.alias('leader', 'space');

// User has to click space and then c, because we have aliased leader to space
keySurfer.register('leader c', (e: KeyboardEvent) => {
  // do something
});

document.addEventListener('keydown', keySurfer.onHandle);
```

## TODO

The following items are currently on our roadmap:

- [x] Handle space and tab keys (using aliases)
  - Tab key is represented by the code 'Tab'
- [ ] Implement repeated key press detection and handling
- [ ] Create a public repository
- [ ] add license
- [ ] finish readme
- [ ] Publish to npm

