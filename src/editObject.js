const Electron = require("electron");
let obj = JSON.parse(localStorage.getItem("_tmpObjectString"));
let isArray = (Array.isArray(obj));
if (isArray) {
  console.log("This is array!");
  
}
window.onload = function() {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      addValue(key, value);
    }
  }
}

function getValues() {
  let names = document.getElementsByClassName("keyInp");
    let values = document.getElementsByClassName("valueInp");
    let newObj = {};
    for (let i = 0; i < names.length; i++) { 
      const name = names[i].value;
      let value = values[i].value;
      newObj[name] = value;
    }
    return objectStrings(newObj, "$", true);
}

function addValue(key = "", value = "", focus = false) {
  if (isArray === true) {
    key = +key;
  }
  const div = document.createElement("div");
  const remove = document.createElement("button");
  const name = document.createElement("input");
  const inp = document.createElement("input");
  const type = document.createElement("input");

  remove.innerText = "X";
  remove.style.color = "red";
  remove.tabIndex = -1;
  remove.onclick = function() {
    let res = Electron.remote.dialog.showMessageBoxSync(Electron.remote.getCurrentWindow(), {
      "title": "Confirmation",
      "message": "Are you sure you want to delete this value?",
      "buttons": [
        "Delete",
        "Cancel"
      ]
    });
    if (res == 0) {
      div.parentElement.removeChild(div);
    }
  }

  name.className = "keyInp";
  name.placeholder = "key";
  name.value = key;

  if (isArray === true) {
    name.type = "hidden";
  }

  name.addEventListener("input", function(e) {
    name.style.color = "";
    name.style.backgroundColor = "";

    let elmsValue = document.querySelectorAll("input.valueInp");
    let elmsType = document.querySelectorAll("input.typeInp");
    for (let i = 0; i < elmsValue.length; i++) {
      const _inp = elmsValue[i];
      const _type = elmsType[i];
      colorInput(_inp, _type, onDone);
    }
  });

  inp.className = "valueInp";
  inp.placeholder = "value";
  if (value == null) {
    value = "null";
  }
  inp.value = value;

  type.innerText = "Type";
  type.className = "typeInp";
  type.disabled = true;
  type.tabIndex = -1;

  /**
   * @param {HTMLInputElement} inp
   * @param {HTMLInputElement} type
   * @param {string[]} types
   */
  function onDone(inp, type, types) {
    let vals = getValues();
    let res = calculate(inp.value, vals);
    if (res != false) {
      types.push("Number("+res+")");
      inp.style.color = "orange";
    }
    else {
      let bool = condition(inp.value, vals);
      types.push(bool);
      if (types.length == 1 && bool == true) {
        inp.style.color = "blue";
      }
    }
    type.value = types.join(" | ");
  }

  inp.addEventListener("input", function() {
    let elmsValue = document.querySelectorAll("input.valueInp");
    let elmsType = document.querySelectorAll("input.typeInp");
    for (let i = 0; i < elmsValue.length; i++) {
      const _inp = elmsValue[i];
      const _type = elmsType[i];
      colorInput(_inp, _type, onDone);
    }
  });

  div.appendChild(remove);
  div.appendChild(name);
  if (isArray !== true) {
    div.appendChild((function() {
      let s = document.createElement("span");
      s.innerText = ": ";
      return s;
    })());
  }
  div.appendChild(inp);
  div.appendChild(type);
  div.appendChild(document.createElement("br"));
  div.appendChild(document.createElement("br"));

  document.getElementById("objedit").appendChild(div);

  if (focus == true) {
    name.focus();
  }

  colorInput(inp, type, onDone);
}

/**
 * @param {HTMLInputElement} inp 
 * @param {HTMLInputElement} type 
 * @param {(inp: HTMLInputElement, type: HTMLInputElement, types: string[]) => void} onDone 
 */
function colorInput(inp, type, onDone = function(){}) {
  let types = [];
  if (!isNaN(inp.value)) {
    inp.style.color = "orange";
    types.push("Number");
  }
  if (inp.value == "true" || inp.value == "false" || inp.value == "null") {
    inp.style.color = "blue";
    if (inp.value == "true") {
      types.push("Boolean");
    }
  }
  else {
    inp.style.color = "black";
    types.push("String");
  }

  onDone(inp, type, types);
  return inp;
}

function exit(index) {
  if (index == 0) {
    let names = document.getElementsByClassName("keyInp");
    let values = document.getElementsByClassName("valueInp");
    let objString = (function() {
      let newObj = {};
      if (isArray === true) {
        newObj = [];
      }
      for (let i = 0; i < names.length; i++) {
        
        let name = names[i].value;
        if (isArray === true) {
          name = i;
        }
        let value = values[i].value;
        console.log(name + " - " + value);
        
        if (value === "true") {
          value = true;
        }
        else if (value === "false") {
          value = false;
        }
        else if (value === "null") {
          value = null;
        }
        else if (!isNaN(value)) {
          value = +value;
        }
        console.log(name + " - " + value);

        if (name === "") {
          Electron.remote.dialog.showErrorBox(
            "Missing key name",
            "A value is missing a key name."
          );
          names[i].style.backgroundColor = "red";
          names[i].scrollIntoView();
          names[i].focus();
          return false;
        }

        if (!newObj.hasOwnProperty(name)) {
          newObj[name] = value;
        }
        else {
          Electron.remote.dialog.showErrorBox(
            "Conflicting values",
            "There is a duplicate of the key \""+ name + "\"."
          );
          names[i].style.color = "red";
          names[i].scrollIntoView();
          names[i].focus();
          return false;
        }
      }
      return JSON.stringify(newObj);
    })();

    if (objString == false) return;
    
    localStorage.setItem("_tmpObjectString", objString);
  }
  Electron.remote.getCurrentWindow().close();
}

