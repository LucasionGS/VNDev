// Requirements
const fs = require("fs");
const Electron = require("electron");
const {dialog, BrowserWindow} = Electron.remote;

/**
 * Core of the editor.
 */
class Game {
  /**
   * Project folders are stored here.
   * @type {string}
   */
  static projectsDir = "./projects/";

  /**
   * Current project name.  
   * Stored in `localStorage`.
   * @type {string}
   */
  static get projectName() {
    return localStorage.getItem("projectName");
  };

  static set projectName(value) {
    localStorage.setItem("projectName", value);
  };

  /**
   * @param {string} projectName 
   */
  static initializeProject(projectName) {
    if (!fs.existsSync(Game.projectsDir)) {
      fs.mkdirSync(Game.projectsDir);
    }

    if (!fs.existsSync(Game.projectsDir + "/" + projectName)) {
      fs.mkdirSync(Game.projectsDir + "/" + projectName);
    }
    else {
      if (
            dialog.showMessageBoxSync(
            BrowserWindow.getFocusedWindow(),
            {
              "title": "This project already exists.",
              "message": "Do you want to overwrite it?\nThis cannot be undone.",
              "buttons": ["Yes, overwrite", "Cancel"],
              "noLink": true
            }) === 0
          ) {
        fs.rmdirSync(Game.projectsDir + "/" + projectName, {
          recursive: true
        });
        fs.mkdirSync(Game.projectsDir + "/" + projectName);
      }
      else {
        return;
      }
    }

    Game.projectName = projectName;

    // Create folders
    fs.mkdirSync(Game.projectsDir + "/" + projectName + "/audio");
    fs.mkdirSync(Game.projectsDir + "/" + projectName + "/general");
    fs.mkdirSync(Game.projectsDir + "/" + projectName + "/sprites");
    fs.mkdirSync(Game.projectsDir + "/" + projectName + "/scenes");

    // Create Files
    Game.newScene("Scene1");
  }

  /**
   * Create a new scene in this project.
   * @param {string} sceneName 
   */
  static newScene(sceneName) {
    // Create files
    let data = JSON.parse(JSON.stringify(Game.formats.scene));
    let otherScenes = Game.getScenes();

    data.index = otherScenes.length;
    fs.writeFileSync(Game.projectsDir + "/" + Game.projectName + `/scenes/${sceneName}.json`, JSON.stringify(data));
  }

  /**
   * Name of the current scene.
   * @type {string}
   */
  get sceneName() {
    return Game.Memory.sceneName;
  }

  set sceneName(value) {
    Game.Memory.sceneName = value;
    Game.displayObjectLists();
  }

  static Memory = {
    "sceneName": "",

    /**
     * Current scene's data.
     * @type {Game.formats["scene"]}
     */
    "scene": {
      "index": 0,
      "actors": [],
      "html": 0,
    },

    "settings": {

    }
  }

  /**
   * Refreshes the objects list under the current scene.
   */
  static displayObjectLists() {
    let scene = document.querySelector("div#scenes label[name='" + Game.Memory.sceneName + "']");
    if (scene == null) return;

    let allScenes = document.querySelectorAll("div#scenes label");
    for (let i = 0; i < allScenes.length; i++) {
      const _scene = allScenes[i];
      _scene.innerText = _scene.getAttribute("name");
    }
    const ul = document.createElement("ul");
    ul.id = "objectList";
    for (let i = 0; i < Game.Memory.scene.actors.length; i++) {
      const actor = Game.Memory.scene.actors[i];
      const li = document.createElement("li");
      li.innerText = actor.identity;
      li.className = "gameObject";
      li.onclick = function() {
        actor.displayProperties();
      }
      ul.appendChild(li);
    }
    scene.appendChild(ul)
  }

  static saveScene() {
    fs.writeFileSync(Game.projectsDir + "/" + Game.projectName + "/scenes/" + Game.Memory.sceneName + ".json", JSON.stringify(Game.Memory.scene));
    console.log(Game.Memory.sceneName + " saved");
  };

  static loadScene(sceneName, skipCheck = false) {
    if (skipCheck != true && sceneName == Game.Memory.sceneName) {
      return;
    }
    
    if (skipCheck != true && JSON.stringify(Game.getSceneData()) != JSON.stringify(Game.Memory.scene)) {
      let res = dialog.showMessageBoxSync(
        BrowserWindow.getFocusedWindow(),
        {
          "title": Game.Memory.sceneName + " has not been saved yet.",
          "message": "Do you want to save or disband changes to the scene?",
          "buttons": ["Save and continue", "Disband changes to scene", "Cancel"],
          "noLink": true
        });
      if (res == 0) {
        Game.saveScene();
      }
      if (res == 2) {
        return;
      }
    }
    Game.Memory.sceneName = sceneName;
    Game.Memory.scene = Game.getSceneData(sceneName);
    let newActors = [];
    // Parse Actor objects
    for (let i = 0; i < Game.Memory.scene.actors.length; i++) {
      const actor = Game.Memory.scene.actors[i];
      newActors.push(new Actor(actor, false));
    }
    Game.Memory.scene.actors = newActors;

    Game.displayObjectLists();    
  };

  /**
   * Get a scene's data.
   * @param {string} sceneName A specific scene name to get data from. Leave blank for current scene.
   * @returns {Game.formats["scene"]}
   */
  static getSceneData(sceneName = Game.Memory.sceneName) {
    return JSON.parse(fs.readFileSync(Game.projectsDir + "/" + Game.projectName + "/scenes/" + sceneName + ".json", "utf8"));
  }

  /**
   * @param {boolean} withExt Set to `true` if you want to have the name and `.json` extension.
   */
  static getScenes(withExt = false) {
    let scenes = fs.readdirSync(Game.projectsDir + "/" + Game.projectName + "/scenes");

    /**
     * @type {Game.Memory["scene"][]}
     */
    let sorted = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const scenePath = Game.projectsDir + "/" + Game.projectName + "/scenes/" + scene;
      let sceneData;
      try {
        sceneData = JSON.parse(fs.readFileSync(scenePath, "utf8"));
        sceneData.scenePath = scene;
        sorted.push(sceneData);
      } catch (error) {
        dialog.showErrorBox(
          "Something went wrong trying to load a scene.\n" +
          `"${scenePath}" could not be parsed.`
        );
        continue;
      }
    }
    sorted.sort(function (a, b) {
      return a.index - b.index;
    });

    for (let i = 0; i < scenes.length; i++) {
      scenes[i] = sorted[i].scenePath;
    }


    if (withExt !== true) {
      for (let i = 0; i < scenes.length; i++) {
        scenes[i] = scenes[i].substring(0, scenes[i].length - 5);
      }
    }
    return scenes;
  }

  static loadProjectScenes() {
    // Load the stored project name and it's scenes.
    let scenesPanel = document.getElementById("scenes");
    scenesPanel.innerHTML = "";
    let scenes = Game.getScenes();
    let firstSceneName = "";
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];

      const lbl = document.createElement("label");
      lbl.innerText = scene;
      lbl.setAttribute("name", scene);
      if (i == 0) {
        firstSceneName = scene;
      }

      lbl.onclick = function() {
        Game.loadScene(scene);
      };
      scenesPanel.appendChild(lbl);
    }
    if (scenes.length == 0) {
      Game.newScene("Scene1");
      firstSceneName = "Scene1";
    }

    Game.loadScene(firstSceneName, true);
  }

  /**
   * Format Definitions
   */
  static formats = {
    "scene": {
      "index": 0,
      /**
       * Array of Actors.
       * @type {Actor[]}
       */
      "actors": [],
      /**
       * Full HTML code for this scene.
       * @type {string}
       */
      "html": ""
    }
  }
}

// Things to do on start up.
window.onload = function () {
  Game.loadProjectScenes();
};

// Shortcuts and keypresses
window.addEventListener("keydown", function(e) {
  let key = e.key.toLowerCase();
  if (key == "s" && e.ctrlKey) {
    Game.saveScene();
  }
});

/**
 * Class for an alterable object.
 */
class Alterable {
  constructor() { }

  /**
   * Display the specific object's properties.
   */
  displayProperties() {
    /**
     * @param {string} name Used as a Label.
     * @param {string | number | boolean} value 
     * @param {(newValue) => void} onchange
     */
    function makeProperty(name, value, onchange = function(){}) {
      const label = document.createElement("label");
      label.setAttribute("for", "propertyItem_" + name);
      label.innerText = name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
      const inp = document.createElement("input");
      inp.setAttribute("name", "propertyItem_" + name);

      if (typeof value == "boolean") {
        inp.type = "checkbox";
        inp.checked = value;
        inp.value = value;

        inp.onclick = function() {
          onchange(inp.checked);
        };
      }
      else if (typeof value == "number") {
        inp.type = "number";
        inp.value = value;
        inp.oninput = function() {
          onchange(inp.value);
        };
      }
      else if (typeof value == "object") {
        return
      }
      else {
        inp.type = "text";
        inp.value = value;
        inp.oninput = function() {
          onchange(inp.value);
        };
      }

      const div = document.createElement("div");
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
      div.appendChild(inp);
      div.className = "propertyElement";

      return div;
    }

    /**
     * @type {{name: any}}
     */
    let propertyList = {};

    /**
     * @type {HTMLDivElement}
     */
    let panel = document.getElementById("propertiesList");
    // Clear panel
    panel.innerHTML = "";

    // Specific Properties
    if (this instanceof Actor) {
      propertyList = {
        "identity": this.identity,
      };
      propertyList = this;
    }

    /**
     * @type {Actor}
     */
    let actor = this;
    /**
     * @type {HTMLLabelElement}
     */
    let gameObject = null;
    
    const gameObjects = document.querySelectorAll("li.gameObject");
    for (let i = 0; i < gameObjects.length; i++) {
      const _gameObject = gameObjects[i];
      if (_gameObject.innerText == actor.identity) {
        gameObject = _gameObject;
        break;
      }
    }
    for (const key in propertyList) {
      if (propertyList.hasOwnProperty(key)) {
        const itemValue = propertyList[key];
        let elm = makeProperty(key, itemValue, function(value) {
          actor[key] = value;

          if (key == "identity") {
            gameObject.innerText = value;
          }
        });
        
        if (elm != null) panel.appendChild(elm);
      }
    }
  }
}

class Actor extends Alterable {
  /**
   * The Identifying name of this actor.  
   * This must be unique in a single scene.
   */
  identity = "";
  /**
   * Custom values that can be changed along the way.
   */
  customValues = {};

  active = false;

  /**
   * Create a new Actor.
   * @param {Actor} data
   */
  constructor(data, attach = true) {
    super();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const elm = data[key];
        this[key] = elm;
      }
    }
    if (attach == true) {
      this.attachToScene();   
    }
  }

  attachToScene() {
    if (typeof Game.Memory.scene.actors == "undefined") {
      Game.Memory.scene.actors = [];
    }
    Game.Memory.scene.actors.push(this);
    Game.displayObjectLists();
  }
}

let actor = new Actor({
  "identity": "Len"
});