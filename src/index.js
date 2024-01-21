let id = 0;

let createClass = (obj) => {
  if (typeof obj === "string") return obj;

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

export const html = (strings_, ...values) => {
  let startId = id;

  values = values.map((obj) => (Array.isArray(obj) ? obj : [obj]));

  let [out, ...strings] = [...strings_];

  strings.forEach((str, idx) => {
    values[idx].forEach((val) => {
      let dataId = `data-id="${id++}"`;

      if (val instanceof Node || typeof val != "object") {
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
      el.r = reaction(
        (el.update = () => {
          let unmount = (el) => {
            Array.from(el.children).forEach((child) => {
              unmount(child);
              child.r && child.r();
              child.unmount && child.unmount();
            });
          };
          unmount(el);
          el.replaceChildren(val(el));
        })
      );
      el.mount && el.mount();
    } else if (val instanceof Node || typeof val != "object") {
      el.replaceChildren(val);
    } else {
      for (let prop in val) {
        let value = val[prop];

        if (prop == "class") {
          value = createClass(value);
        }

        if (prop[0] == "o" && prop[1] == "n") {
          el.addEventListener(prop.slice(2), value);
        } else if (prop == "style") {
          for (let key in value) {
            if (key[0] == "-") {
              el[prop].setProperty(key, value[key]);
            } else {
              el[prop][key] = value[key];
            }
          }
        } else if (prop == "ref") {
          value(el);
        } else {
          value === false || value == null || el.setAttribute(prop, value);
        }
      }
    }
  });

  return strings;
};

let subscriber;

export const ref = (val) => {
  const subs = new Set();

  return {
    get value() {
      subscriber && subs.add(subscriber(subs));
      return val;
    },
    set value(newVal) {
      subs.forEach((sub) => sub());
      val = newVal;
    },
  };
};

export const reaction = (body) => {
  let reactionSubs = [];
  let destroy = () => {
    reactionSubs.forEach((subs) => {
      subs.delete(exec);
    });
    reactionSubs = [];
  };
  let exec = () => {
    destroy();
    let old = subscriber;
    subscriber = (subs) => {
      reactionSubs.push(subs);
      return exec;
    };
    body();
    subscriber = old;
  };

  exec();

  return destroy;
};
