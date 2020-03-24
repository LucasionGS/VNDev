const Electron = require("electron");
let obj = JSON.parse(localStorage.getItem("_tmpObjectString"));
window.onload = function() {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      addValue(key, value);
    }
  }
}

function addValue(key = "", value = "", focus = false) {
  const div = document.createElement("div");
    const remove = document.createElement("button");
    const name = document.createElement("input");
    const inp = document.createElement("input");

    remove.innerText = "X";
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

    inp.className = "valueInp";
    inp.placeholder = "value";
    inp.value = value;

    div.appendChild(remove);
    div.appendChild(name);
    div.appendChild(inp);
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    document.getElementById("objedit").appendChild(div);

    if (focus == true) {
      name.focus();
    }
}

function exit(index) {
  if (index == 0) {
    let names = document.getElementsByClassName("keyInp");
    let values = document.getElementsByClassName("valueInp");
    let objString = (function() {
      let newObj = {};
      for (let i = 0; i < names.length; i++) {
        
        const name = names[i].value;
        const value = values[i].value;
        newObj[name] = value;
      }
      
      return JSON.stringify(newObj);
    })();
    
    localStorage.setItem("_tmpObjectString", objString);
  }
  Electron.remote.getCurrentWindow().close();
}

