/**
 * Calculates a formular into a number.
 * @param {string} formular A formular to calculate;
 * @returns {Number | undefined}
 */
function calculate(formular, algebra = {}) {
  if (typeof formular != "string") {
    formular = formular.toString();
  }

  // Algebra
  formular = formular.replace(/(?<!\d)[A-Za-z$][$\w.]*(?!\d)/g, function(a) {
    for (const key in algebra) {
      if (algebra.hasOwnProperty(key)) {
        if (key == a) {
          return algebra[key];
        }
      }
    }
  });
  
  while(/\([^()]*?\)/g.test(formular)) {
    formular = formular.replace(/\([^()]*?\)/g, function(f) {
      let n = f.substring(1, f.length - 1);
      return calculate(n, algebra);
    });
  }

  while(/-?[\d.]+\s*\^\s*-?[\d.]+/g.test(formular)) {
    formular = formular.replace(/-?[\d.]+\s*\^\s*-?[\d.]+/g, function(f) {
      let p = f.split("^");
      
      let v1 = +p[0];
      let v2 = +p[1];
      return Math.pow(v1, v2);
    });
  }

  while(/-?[\d.]+\s*\*\s*-?[\d.]+/g.test(formular)) {
    formular = formular.replace(/-?[\d.]+\s*\*\s*-?[\d.]+/g, function(f) {
      let p = f.split("*");
      
      let v1 = +p[0];
      let v2 = +p[1];
      return v1 * v2;
    });
  }

  while(/-?[\d.]+\s*\/\s*-?[\d.]+/.test(formular)) {
    formular = formular.replace(/-?[\d.]+\s*\/\s*-?[\d.]+/, function(f) {
      let p = f.split("/");
      
      let v1 = +p[0];
      let v2 = +p[1];
      
      return v1 / v2;
    });
  }

  while (/-?[\d.]+\s*\-\s*-?[\d.]+/.test(formular)) {
    formular = formular.replace(/-?[\d.]+\s*\-\s*-?[\d.]+/, function(f) {
      f.trim();
  
      let i = 0;
      if (f[i] == "-" && i == 0) {
        i++;
      }
  
      while (f[i] != "-") {
        i++;
      }
  
      let p = [0, 0];
      p[0] = f.slice(0, i);
      p[1] = f.slice(i + 1, f.length);
      
      let v1 = +p[0];
      let v2 = +p[1];
      
      return v1 - v2;
    });
  }

  while (/-?[\d.]+\s*\+\s*-?[\d.]+/g.test(formular)) {
    formular = formular.replace(/-?[\d.]+\s*\+\s*-?[\d.]+/g, function(f) {
      let p = f.split("+");
      
      let v1 = +p[0];
      let v2 = +p[1];
      
      return v1 + v2;
    });
  }

  if (isNaN(formular)) {
    // formular = calculate(formular);
    formular = false
  }
  else {
    formular = +formular;
  }
  return formular;
}

/**
 * 
 * @param {string} con Condition string to parse.
 * @returns {boolean}
 */
function condition(con, algebra = {}) {
  if (con == "") return false;
  // Algebra
  con = con.replace(/(?<!\d)[A-Za-z$][$\w.]*(?!\d)/g, function(a) {
    if (a == "true") {
      return true;
    }
    if (a == "false") {
      return false;
    }
    for (const key in algebra) {
      if (algebra.hasOwnProperty(key)) {
        if (key == a) {
          if (algebra[key] === undefined) {
            return false;
          }
          return algebra[key];
        }
      }
    }
    return false;
  });

  while(/\([^()]*?\)/g.test(con)) {
    con = con.replace(/\([^()]*?\)/g, function(c) {
      let n = c.substring(1, c.length - 1);
      return condition(n, algebra);
    });
  }

  while(/\{[^{}]*?\}/g.test(con)) {
    con = con.replace(/\{[^{}]*?\}/g, function(c) {
      let n = c.substring(1, c.length - 1);
      return calculate(n, algebra);
    });
  }

  while(/([\d.]+|true|false)\s*!=\s*([\d.]+|true|false)/g.test(con)) {
    con = con.replace(/([\d.]+|true|false)\s*!=\s*([\d.]+|true|false)/g, function(c) {
      let p = c.split("!=");

      let v1 = p[0].trim();
      let v2 = p[1].trim();

      console.log(c);
      return v1 !== v2;
    });
  }

  while(/([\d.]+|true|false)\s*==\s*([\d.]+|true|false)/g.test(con)) {
    con = con.replace(/([\d.]+|true|false)\s*==\s*([\d.]+|true|false)/g, function(c) {
      let p = c.split("==");

      let v1 = p[0].trim();
      let v2 = p[1].trim();

      console.log(c);
      return v1 === v2;
    });
  }

  while(/[\d.]+\s*<=\s*[\d.]+/g.test(con)) {
    con = con.replace(/[\d.]+\s*<=\s*[\d.]+/g, function(c) {
      let p = c.split("<=");

      let v1 = +p[0];
      let v2 = +p[1];

      console.log(c);
      return v1 <= v2;
    });
  }

  while(/[\d.]+\s*>=\s*[\d.]+/g.test(con)) {
    con = con.replace(/[\d.]+\s*>=\s*[\d.]+/g, function(c) {
      let p = c.split(">=");

      let v1 = +p[0];
      let v2 = +p[1];
      return v1 >= v2;
    });
  }

  while(/[\d.]+\s*<\s*[\d.]+/g.test(con)) {
    con = con.replace(/[\d.]+\s*<\s*[\d.]+/g, function(c) {
      let p = c.split("<");

      let v1 = +p[0];
      let v2 = +p[1];

      console.log(c);
      return v1 < v2;
    });
  }

  while(/[\d.]+\s*>\s*[\d.]+/g.test(con)) {
    con = con.replace(/[\d.]+\s*>\s*[\d.]+/g, function(c) {
      let p = c.split(">");

      let v1 = +p[0];
      let v2 = +p[1];

      console.log(c);
      return v1 > v2;
    });
  }
  
  let finalBool = false;
  let orParts = con.split("||");
  for (let i = 0; i < orParts.length; i++) {
    const part = orParts[i].trim();
    let andParts = part.split("&&");
    let res = false;
    for (let i2 = 0; i2 < andParts.length; i2++) {
      const bool = andParts[i2].trim();
      if (bool === "true") {
        res = true;
      }
      if (bool === "false") {
        res = false;
        break;
      }
    }
    
    if (res === true) {
      finalBool = true;
      break;
    }
  }

  return finalBool;
}

/**
   * @param {{}} object
   */
function objectStrings(object, top = "$", topAsPrefix = false) {
  let elms = {};
  objectToValues(object, top, topAsPrefix);
  return elms;

  /**
   * @param {{}} obj 
   */
  function objectToValues(obj = {}, top = "$", topAsPrefix = false) {
    if (topAsPrefix !== true) {
      top += ".";
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value == "object") {
          objectToValues(value, top + key);
        }
        else {
          elms[top + key] = value;
        }
      }
    }
  }
}

/**
 * More accurately checks which object this type is.
 * @param {{} | []} obj 
 * @returns { "bigint" | "boolean" | "function" | "number" | "object" | "array" | "string" | "symbol" | "undefined" }
 */
function typeOf(obj) {
  if (typeof obj != "object") {
    return typeof obj == "";
  }
  try {
    let len = obj.length;
    if (len === undefined) {
      throw "notArray";
    }
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      console.log(item);
      
      if (item === undefined) {
        throw "notArray";
      }
    }
    return "array";
  } catch (error) {
    return "object";
  }
}

/**
 * @param {HTMLElement} object
 * @param {(div: HTMLDivElement) => string} text Preformatted Text.
 * @param {boolean} HTMLSupport
 */
function hoverOverMenu(object, text, HTMLSupport) {
  const div = document.createElement("div");
  const pre = document.createElement("pre");
  div.appendChild(pre);

  div.style.position = "absolute";
  div.style.pointerEvents = "none";
  div.style.backgroundColor = "#2b2b2b";
  div.style.border = "#1b1b1b solid 1px";
  div.style.borderRadius = "5px";
  div.style.opacity = "0.9";
  div.style.fontWeight = "bold";

  div.className = "__hoverOverMenuPopUp";

  if (typeof text == "function") {
    text = text(div);
  }

  if (HTMLSupport === true) {
    pre.innerHTML = text;
  }
  else {
    pre.innerText = text;
  }

  object.addEventListener("mouseenter", function(e) {
    // div.style.left = e.clientX+"px";
    // div.style.top = e.clientY+"px";
    div.style.left = object.getBoundingClientRect().right+"px";
    div.style.top = object.getBoundingClientRect().top+"px";
    document.body.appendChild(div);
  });

  object.addEventListener("mouseleave", function(e) {
    try {
      div.parentElement.removeChild(div);
    } catch { }
  });
}

/**
 * @param {HTMLElement} object
 * @param {any} json JSON Object.
 */
function hoverOverMenuJSON(object, json) {
  hoverOverMenu(object, function(div) {
    const style = document.createElement("style");
    style.innerText =
    `pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; }
    .string { color: green; }
    .number { color: darkorange; }
    .boolean { color: blue; }
    .null { color: magenta; }
    .key { color: red; }`;

    div.appendChild(style);

    return syntaxHighlight(JSON.stringify(json, null, 2));
  }, true);
}

function closeAllHoverMenus() {
  let a = document.querySelectorAll(".__hoverOverMenuPopUp");
  for (let i = 0; i < a.length; i++) {
    a[i].parentElement.removeChild(a[i]);
  }
}

/**
 * @param {string} json 
 */
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}