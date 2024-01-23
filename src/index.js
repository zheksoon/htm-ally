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
      el.update = () => {
        let unmount = (el) => {
          Array.from(el.children).forEach((child) => {
            unmount(child);
            child.unmount && child.unmount();
          });
        };
        unmount(el);
        el.replaceChildren(val(el));
      };
      el.update();
      el.mount && el.mount();
    } else if (Object.getPrototypeOf(val) !== Object.prototype) {
      el.replaceChildren(val);
    } else {
      for (let prop in val) {
        let value = val[prop];

        if (prop == "class") {
          value = createClass(value);
        }

        if (prop.slice(0, 2) == "on") {
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
