# htm-ally ![brotli size](https://flat-badgen.vercel.app/badgesize/brotli/https:/unpkg.com/htm-ally/dist/htm-ally.modern.mjs)

**500 bytes** full-featured micro-framework with a syntax you already know

- Just HTML, nothing new to learn
- No need for transpiler or compiler
- Components, mount, unmount, and update hooks
- Element refs, event handlers, attributes, and styles
- Class helper
- Fragments and arrays
- XSS safe

## Install

```sh
npm install --save htm-ally

yarn add htm-ally
```

and then:

```js
import { html } from "htm-ally";

// or directly from unpkg

import { html } from "https://unpkg.com/htm-ally?module";
```

## Usage

The output of `html` is just an HTMLFragment, so you can use it anywhere you can use a fragment:

```js
const fragment = html`<div>hello</div>`;

document.getElementById("app").append(fragment);
```

Nesting fragments (or arrays of fragments) are supported:

```js
const makeNested = (number) => html`
  <h1>hello</h1>
  <div>
    <p>${number}</p>
  </div>
`;

const nested = makeNested(100);

const fragment = html`
  <div>
    ${nested}
    ${[1, 2, 3].map(makeNested)}
  </div>
`;
```

Just insert interpolation with an object to define attributes and event handlers.
Other attributes of the element are preserved:

```js
const onclick = () => alert("clicked");

const fragment = html`
  <button id="button" ${{ onclick, class: "btn", disabled: false }}>
    Click me
  </button>
`;
```

Classes can also be defined as arrays or objects:

```js
const primary = true;
const isDisabled = false;

const classNames = ["btn", primary && "primary", { disabled: isDisabled }];

const fragment = html`
  <button ${{ class: classNames }}>Click</button>
`;
```

Styles are defined as an object (with camelCase):

```js
const fragment = html`
  <button ${{ style: { color: "red", fontWeight: "bold" } }}>Click</button>
`;
```

Refs can be defined with a function:

```js
const inputRef = (el) => (inputRef.el = el);

const onChange = () => {
  console.log(inputRef.el.value);
};

const fragment = html`
  <input type="text" ${{ ref: inputRef, onchange: onChange }} />
`;
```

Components are just functions that return a fragment

```js
const Component = () => html`<div>hello</div>`;

const fragment = html`<div>${Component}</div>`;
```

Components have access to an element it's mounted to (a `slot` element).
The element contains `update`, `mount`, and `unmount` functions:

```js
let count = 0;

const Counter = (parent) => {
  const onClick = () => {
    count += 1;
    parent.update();
  };

  return html`<button ${{ onclick: onClick }}>Count: ${count}</button>`;
};

document.getElementById("app").append(html`${Counter}`);
```

For the `mount` and `unmount` hooks, see the [Timer](#timer) example.

Note: text input components cannot be updated with the `parent.update()` as the cursor position will be reset.

Components can have a local state in a closure or on the parent node:

```js

const Counter = (initialValue) => {
  let count = initialValue;

  return (parent) => {
    const onClick = () => {
      count += 1;
      parent.update();
    };

    return html`<button ${{ onclick: onClick }}>Count: ${count}</button>`;
  }
};

document.getElementById("app").append(html`${Counter(100)}`);
```

The state isn't preserved when the parent component updates (as there is no reconciliation), 
so it's recommended to use a global state to store states for each component.

## Examples

All examples can be found in the CodeSandbox: [link](https://codesandbox.io/p/sandbox/htm-ally-examples-tws6cm)

### Counter

Shows event handlers, attributes, component update

```js
import { html } from "htm-ally";

let count = 0;

const Counter = (parent) => {
  const inc = () => {
    count += 1;
    parent.update();
  };

  const dec = () => {
    count -= 1;
    parent.update();
  };

  return html`
    <button ${{ onclick: dec, disabled: count <= 0 }}>-</button>
    ${count}
    <button ${{ onclick: inc, disabled: count >= 10 }}>+</button>
  `;
};

document.getElementById("app").append(html`${Counter}`);
```

### Todo list

Shows ref usage, array map, and component update.

```js
let todos = [];

const TodoList = () => {
  let inputRef = (el) => (inputRef.el = el);

  return (parent) => {
    const addTodo = () => {
      const text = inputRef.el.value;
      inputRef.el.value = "";
      todos.push(text);
      parent.update();
    };

    return html`
      <input type="text" ${{ ref: inputRef }} />
      <button ${{ onclick: addTodo }}>Add</button>
      <ul>
        ${todos.map((text) => html`<li>${text}</li>`)}
      </ul>
    `;
  };
};

document.getElementById("app").append(html`${TodoList()}`);
```

### Timer

Shows mount and unmount hooks

```js
let show = false;

const TimerToggle = (parent) => {
  const toggleShow = () => {
    show = !show;
    parent.update();
  };

  return html`
    <button ${{ onclick: toggleShow }}>${show ? "Hide" : "Show"}</button>
    ${showTimer && Timer}
  `;
};

let interval;
let time = 0;

const Timer = (parent) => {
  // start timer on mount
  parent.mount = () => {
    interval = setInterval(() => {
      time += 1;
      parent.update();
    }, 1000);

    time = 0;
    parent.update();
  };

  // stop timer on unmount
  parent.unmount = () => {
    clearInterval(interval);
  };

  return html`Timer: ${time}s`;
};

document.getElementById("app").append(html`${TimerToggle}`);
```

### Advanced Todo list

See the [CodeSanbox](https://codesandbox.io/p/sandbox/htm-ally-examples-tws6cm?file=%2Fsrc%2F4-todo-list-advanced.ts%3A86%2C18)

## Author

Eugene Daragan

## License

MIT
