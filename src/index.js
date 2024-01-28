let id = 0;

let createClass = (obj) => {
  if ("" + obj === obj) return obj;

  let out = "";

  if (Array.isArray(obj)) {
    obj.forEach((tmp) => {
      if ((tmp = createClass(tmp))) {
        out += (out && " ") + tmp;
      }
    });
  } else {
    for (let k in obj) {
      if (obj[k]) out += (out && " ") + k;
    }
  }

  return out;
};

export const html = (s, ...values) => {
  let startId = id;

  values = values.map((obj) => (Array.isArray(obj) ? obj : [obj]));

  let [out, ...strings] = s;

  strings.forEach((str, idx) => {
    values[idx].forEach((val) => {
      let dataId = `data-id="${id++}"`;

      // everything except plain objects creates a slot
      if (!val || Object.getPrototypeOf(val) !== Object.prototype) {
        dataId = `<slot ${dataId}></slot>`;
      }

      out += dataId;
    });
    out += str;
  });

  strings = document.createElement("template");
  strings.innerHTML = out;
  strings = strings.content;

  values.flat().forEach((val) => {
    let el = strings.querySelector(`[data-id="${startId++}"]`);

    if (val === false || val == null) {
    } else if (typeof val == "function") {
      el.r = reaction(() => {
        let unmount = (el) => {
          Array.from(el.children).forEach((child) => {
            unmount(child);
            child.r && child.r();
            child.unmount && child.unmount();
          });
        };
        unmount(el);
        el.replaceChildren(val(el));
      });
      el.mount && el.mount();
    } else if (Object.getPrototypeOf(val) !== Object.prototype) {
      el.replaceChildren(val);
    } else {
      for (let prop in val) {
        let value = val[prop];

        if (prop.slice(0, 2) == "on") {
          el.addEventListener(prop.slice(2), value);
        } else if (prop == "ref") {
          value(el);
        } else {
          el.r = reaction(() => {
            let newValue = typeof value == "function" ? value() : value;

            if (prop == "style") {
              el[prop].cssText = "";

              for (let key in newValue) {
                if (key[0] == "-") {
                  el[prop].setProperty(key, newValue[key]);
                } else {
                  el[prop][key] = newValue[key];
                }
              }
            } else {
              if (prop == "class") {
                newValue = createClass(newValue);
              }

              el.removeAttribute(prop);

              newValue === false ||
                newValue == null ||
                el.setAttribute(prop, newValue);
            }
          });
        }
      }
    }
  });

  return strings;
};

let subscriber;
let cache = new WeakMap();
let unwrapMap = new WeakMap();
let queue = new Set();

const schedule = (fn) => {
  !queue.size &&
    Promise.resolve().then(() => {
      queue.forEach((fn) => fn());
      queue.clear();
    });

  queue.add(fn);
};

export const createStore = (state) => {
  if (Object(state) !== state) return state;

  state = unwrapMap.get(state) || state;

  let p = cache.get(state);
  if (p) return p;

  let m = new Map();

  p = new Proxy(state, {
    get(target, prop) {
      let value = target[prop];

      if (prop === "prototype" || typeof value === "function") {
        return value;
      }

      if (subscriber) {
        let subs = m.get(prop) || new Set();
        m.set(prop, subs.add(subscriber(subs)));
      }

      return createStore(value);
    },
    set(target, prop, value) {
      if (Array.isArray(target) && prop === "length") {
        let key = value;
        while (key < target.length) {
          m.delete("" + key++);
        }
      }

      target[prop] = createStore(value);
      let subs = m.get(prop);
      subs && subs.forEach((sub) => schedule(sub));
      return true;
    },
    deleteProperty(target, prop) {
      m.delete(prop);
      delete target[prop];
      return true;
    },
  });

  cache.set(state, p);
  unwrapMap.set(p, state);

  return p;
};

const reaction = (body) => {
  let subscriptions = [];
  let destroy = () => {
    subscriptions.forEach((subs) => {
      subs.delete(run);
    });
    subscriptions = [];
  };
  let run = () => {
    destroy();
    let old = subscriber;
    subscriber = (subs) => {
      subscriptions.push(subs);
      return run;
    };
    body();
    subscriber = old;
  };
  run();
  return destroy;
};
