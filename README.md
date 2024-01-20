# htm-ally

**500 bytes** HTML templates with a syntax you already know

- Just HTML, nothing new to learn
- Components, mount, unmount, and update hooks
- Element refs, event handlers, attributes, and styles
- Class helper
- Fragments and arrays

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
Other attributes on the element are preserved:

```js
const onClick = () => alert("clicked");

const fragment = html`
  <button id="button" ${{ onclick, onClick, class: "btn", disabled: false }}>
    Click me
  </button>
`;
```

Classes can also be defined as array or object:

```js
const primary = true;
const isDisabled = false;

const classNames = ["btn", primary && "primary", { disabled: isDisabled }];

const fragment = html`
  <button ${{ class: classNames }}>Click</button>
`;
```

Styles are be defined as an object (with camelCase):

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

For `mount` and `unmount` example, see the [Timer](#timer) example.

Components can have local state in a closure or on the parent node:

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

The state isn't preserved when parent component updates (as there is no reconciliation), 
so it's recommended to use global state to store states for each component.

## Examples

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

const TodoList = (parent) => {
  let inputRef = (el) => (inputRef.el = el);

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

document.getElementById("app").append(html`${TodoList}`);
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

  return html` Timer: ${time}s `;
};

document.getElementById("app").append(html`${TimerToggle}`);
```

## Author

Eugene Daragan

## License

MIT