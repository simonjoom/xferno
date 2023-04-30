# xferno 2

React hooks for [infernojs](https://infernojs.org/).

Refactored and deeply tested with inferno7

Added UseLayouteffect,Usereducer,Usememo 
code patched for opt

for installation, you need to use webpack aliases to help him to go to xferno instead of inferno, i do not use personaly babel for resolving the dependencies



Status: experimental. See the "How it works" note at the bottom of this readme.
## Quick example

```js
import { useState } from 'React';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>{count}</button>
  );
}
```

## Installation

```
npm install --save xferno
```

## Configuration
see https://github.com/simonjoom/xferno/commit/37a216f76646b2dccc3659b18c4fb7c0ce3e1d8e

## Usage

The following "primitive" hooks are built into xferno. Custom hooks can be composed from these.

- useState
- useEffect
- useMemo
- useDisposable
- useSelector
- useDispatch

These each work similarly to the React equivalents. (Some of these have no React equivalents, though, so... keep reading.)

### useState

```js
import { useState } from 'xferno';

function Password() {
  // state can be a primitive for an object, etc. setState can be called
  // with a callback setState((s) => s) or with the new value for state
  // setState({ password: 'hoi' })
  const [state, setState] = useState({ password: '' });

  return (
    <input
      type="password"
      value={state.password}
      onInput={(e) => setState((s) => ({ ...s, password: e.target.value }))}
    />
  );
}
```

### useEffect

`useEffect` can be called with no arguments, in which case it will be invoked only once
for the entire life of the component. If it is given a second argument, the effect function
will be invoked any time the second argument changes. If the effect function returns a
function, that function will be invoked when the component is disposed or before the
effect re-runs, which ever comes first.

```js
import { useState, useEffect } from 'xferno';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let timeout = setTimeout(function tick() {
      setTime(new Date());
      timeout = setTimeout(tick, 1000);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [setTime]);

  return (
    <h1>{time.toString()}</h1>
  );
}
```

### useMemo

`useMemo` is used to memoize an expensive operation. If no second argument is passed,
it will only run once (when the component first initializes) otherwise, it will re-evaluate
any time the second argument changes.


```js
import { useMemo } from 'xferno';

function Fanci(props) {
  const name = useMemo(() => {
    return reallyExpensiveCalculationFor(props.name);
  }, props.name);

  return (
    <h1>{name}</h1>
  );
}
```

### useDisposable

`useDisposable` is like a combination of useEffect and useMemo. It allows the caller to return
a value which can be consumed by the component, but also which is cleaned up any time the first
argument is re-invoked or whenever the component is destroyed.

The first argument is a function which must return an object with a value property and a dispose function.

```js
import { useDisposable } from 'xferno';

function Video(props) {
  const url = useDisposable(() => {
    const value = URL.createObjectURL(props.file);
    return {
      value,
      dispose: () => URL.revokeObjectURL(value),
    };
  }, props.file);

  return (
    <video src={url}></video>
  );
}
```

### useSelector

`useSelector` provides a convenient mechanism for extracting a subset of Redux state for your component.

It is used in conjunction with Redux or a similarly shaped state store.

It is expected that `context.store` is a Redux (or similar) store, with `dispatch`, `subscribe`, and `getState` methods.

You can create your own component which provides this context, or you can use `ReduxStoreProvider`to provide it (as detailed further down).

```js
import { useSelector } from 'xferno';

function Hello() {
  // Assuming we have Redux state that looks something like { name: 'World' }
  const name = useSelector((s) => s.name);

  return (
    <h1>Hello, {name}</h1>
  );
}
```

### useDispatch

`useDispatch` provides the Redux dispatch function to your component.

This has the same requirements regarding Redux / store as `useSelector`.

```js
import { useSelector, useDispatch } from 'xferno';

function ReduxCounter() {
  // Assuming we have Redux state that looks something like { count: 0 }
  const count = useSelector((s) => s.count);
  const dispatch = useDispatch();

  return (
    <button
      onClick={() => dispatch({ type: 'INC' })}
    >
      {count}
    </button>
  );
}
```

## ReduxStoreProvider

If you want to use Redux (or something similar), you need to provide the Redux store to the useSelector and useDispatch hooks.

To do this, you can use `ReduxStoreProvider` somewhere near the root of your application.

```jsx
import { ReduxStoreProvider } from 'xferno';

// ... reducer, initial state, etc omitted for brevity...

const store = createStore(reducer, initialValue);

function Main() {
  return (
    <ReduxStoreProvider store={store}>
      <OtherComponentsHere />
    </ReduxStoreProvider>
  );
}
```

## How it works

This overrides inferno's `createComponentVNode` function and wraps *all* functional components in a hook-aware wrapper. The overriding of a core inferno function is what makes this an experimental library. This also modifies a global hook context in order to track hook state correctly across components. The level of hackery here means that more time and production-grade vetting is required before the experimental classification is removed.

Things that could use improving / adding:

- TypeScript definitions
- Better minification
- More intelligent hook state tracking 
  - Right now, we wrap all functional components, but it would be far prefrable to somehow detect only those components that actually use hooks, and only wrap those.

## License

MIT
