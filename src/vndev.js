// Requirements
const fs = require("fs");
const Electron = require("electron");
// Pull modules from Electron.
const {
  remote: {
    dialog,
    BrowserWindow,
    Menu
  },
} = Electron;
/**
 * Main Window
 */
const win = Electron.remote.getCurrentWindow();

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
   * @param {Game.Memory["settings"]} settings 
   */
  static initializeProject(projectName, settings = {}) {
    if (!fs.existsSync(Game.projectsDir)) {
      fs.mkdirSync(Game.projectsDir);
    }

    if (!fs.existsSync(Game.projectsDir + "/" + projectName)) {
      fs.mkdirSync(Game.projectsDir + "/" + projectName);
    }
    else {
      if (
            dialog.showMessageBoxSync(
            win,
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
    if (typeOf(settings) == "object")
    fs.writeFileSync(Game.projectsDir + "/" + projectName + "/general/settings.json", JSON.stringify(settings, null, 2));
  }

  /**
   * Create a new scene in this project.
   * @param {string} sceneName 
   */
  static newScene(sceneName = "Scene") {
    // Create files
    let otherScenes = Game.getScenes();
    let sceneAlt = 0;
    let finalSceneName = sceneName;
    while (fs.existsSync(Game.projectsDir + "/" + Game.projectName + `/scenes/${finalSceneName}.json`)) {
      sceneAlt++;
      finalSceneName = sceneName + sceneAlt;
    }

    let data = new Scene({"name": finalSceneName});

    data.index = otherScenes.length;
    fs.writeFileSync(Game.projectsDir + "/" + Game.projectName + `/scenes/${finalSceneName}.json`, JSON.stringify(data, null, 2));
    Game.loadProjectScenes();
  }

  /**
   * Name of the current scene.
   * @type {string}
   */
  static get sceneName() {
    return Game.Memory.sceneName;
  }

  static set sceneName(value) {
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
      "width": 1280,
      "height": 768,
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
      hoverOverMenuJSON(li, actor);
      ul.appendChild(li);
    }
    scene.appendChild(ul);
    scene.scrollIntoView();
  }

  static saveScene() {
    const s = document.querySelector("label[originalname='"+Game.Memory.sceneName+"']");
    if (s.getAttribute("originalname") != s.getAttribute("name")) {
      fs.renameSync(
        Game.projectsDir + "/" + Game.projectName + "/scenes/" + s.getAttribute("originalname") + ".json",
        Game.projectsDir + "/" + Game.projectName + "/scenes/" + s.getAttribute("name") + ".json"
      );
      s.setAttribute("originalname", s.getAttribute("name"));
      Game.Memory.sceneName = s.getAttribute("name");
    }
    fs.writeFileSync(Game.projectsDir + "/" + Game.projectName + "/scenes/" + Game.Memory.sceneName + ".json", JSON.stringify(Game.Memory.scene, null, 2));
    console.log(Game.Memory.sceneName + " saved");
  };

  static loadScene(sceneName, skipCheck = false) {
    if (skipCheck != true && sceneName == Game.Memory.sceneName) {
      // Game.Memory.scene.displayProperties();
      return;
    }
    
    if (skipCheck != true && JSON.stringify(Game.getSceneData()) != JSON.stringify(Game.Memory.scene)) {
      let res = dialog.showMessageBoxSync(
        win,
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
    // Game.resetPropertyList();
    Game.Memory.sceneName = sceneName;
    Game.Memory.scene = Game.getSceneData(sceneName);
    // Game.Memory.scene.displayProperties();

    Game.resetPropertyList();

    // Load the objects on the screen
    Game.loadSceneObjects();

    Game.displayObjectLists();    
  };

  static loadSceneObjects() {
    const s = Game.Memory.scene;
  }

  static resetPropertyList() {
    document.getElementById("propertiesList").innerHTML = "";
  }

  /**
   * Get a scene's data.
   * @param {string} sceneName A specific scene name to get data from. Leave blank for current scene.
   * @returns {Game.formats["scene"]}
   */
  static getSceneData(sceneName = Game.Memory.sceneName) {
    return new Scene(JSON.parse(fs.readFileSync(Game.projectsDir + "/" + Game.projectName + "/scenes/" + sceneName + ".json", "utf8")));
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
      lbl.setAttribute("originalname", scene);
      if (i == 0) {
        firstSceneName = scene;
      }

      lbl.onclick = function() {
        Game.loadScene(lbl.getAttribute("originalname"));
      };
      

      lbl.oncontextmenu = function(e) {
        Game.loadScene(lbl.getAttribute("originalname"));
        new Menu.buildFromTemplate([
          {
            "label": "Scene: " + lbl.getAttribute("originalname"),
            "enabled": false
          },
          {
            "type": "separator"
          },
          {
            "label": "Properties",
            /**
             * 
             * @param {Electron.MenuItem} menuItem
             * @param {Electron.BrowserWindow} brwsWin
             * @param {KeyboardEvent} e
             */
            "click": function() {
              Game.getSceneData(lbl.getAttribute("originalname")).displayProperties();
            }
          }
        ]).popup();
      }
      scenesPanel.appendChild(lbl);
    }
    if (scenes.length == 0) {
      Game.newScene("Scene1");
      firstSceneName = "Scene1";
    }

    Game.loadScene(firstSceneName, true);
  }

  static loadProjectSettings() {
    let _settings = {};
    try {
      _settings = JSON.parse(fs.readFileSync(Game.projectsDir+"/"+Game.projectName+"/general/settings.json"));
    } catch (error) {
      console.error("Failed parsing ./general/settings.json file.");
    }
    
    for (const key in _settings) {
      if (_settings.hasOwnProperty(key)) {
        const _set = _settings[key];
        Game.Memory.settings[key] = _set;
      }
    }
    
    
    /**
     * @type {HTMLDivElement}
     */
    let canvas = document.getElementById("canvas");
    canvas.style.width = Game.Memory.settings.width + "px";
    canvas.style.height = Game.Memory.settings.height + "px";
  }

  /**
   * Format Definitions
   */
  static formats = {
    /**
     * @type {Scene}
     */
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

const menus = {
  "file": new Menu.buildFromTemplate([
    {
      "label": "New Scene",
      "click": function() {
        Game.newScene();
      }
    }
  ]),
  "new": new Menu.buildFromTemplate([
    {
      "label": "New Actor",
      "click": function() {
        new Actor("Actor");
      }
    }
  ]),
}

// Things to do on start up.
window.onload = function () {
  document.getElementById("menu_File").addEventListener("click", function() {
    menus.file.popup();
  });
  document.getElementById("menu_New").addEventListener("click", function() {
    menus.new.popup();
  });
  // document.getElementById("menu_Edit").addEventListener("click", function() {
  //   menus;
  // });
  // document.getElementById("menu_View").addEventListener("click", function() {
  //   menus;
  // });
  // document.getElementById("menu_Insert").addEventListener("click", function() {
  //   menus;
  // });
  // document.getElementById("menu_Run").addEventListener("click", function() {
  //   menus;
  // });
  // document.getElementById("menu_Help").addEventListener("click", function() {
  //   menus;
  // });

  Game.loadProjectSettings();
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
     * @param {string} name Name of the value.
     * @param {any} value Value
     * @param {(newValue) => void} onchange
     * @param {Alterable} ref Reference required for objects.
     */
    function makeProperty(name, value, onchange = function(){}, ref) {
      const nameFormat = name.substring(0, 1).toUpperCase() + name.substring(1).replace(/[A-Z]/g," $&");
      const label = document.createElement("label");
      label.setAttribute("for", "propertyItem_" + name);
      label.innerText = nameFormat;
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
        inp.type = "button";
        inp.value = "Manage Values";
        inp.onclick = function() {
          let _val = JSON.stringify(ref[name]);
          localStorage.setItem("_tmpObjectString", _val);
          onchange(_val);
        };

        hoverOverMenuJSON(inp, ref[name]);
        // return;
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
      div.appendChild(document.createElement("br"));
      div.appendChild(document.createElement("br"));
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
      propertyList = this;

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
        if (!key.startsWith("_") && propertyList.hasOwnProperty(key)) {
          const itemValue = propertyList[key];
          let elm = makeProperty(key, itemValue, function(value) {
            if (typeof itemValue == "object") {
              let editObject = new BrowserWindow({
                "parent": win,
                "modal": true,
                "title": "Edit Object: "+ actor.identity+"."+key,
                "minWidth": 640,
                "minHeight": 480,
                "maxWidth": 640,
                "maxHeight": 480,
                "width": 640,
                "height": 480,
                "minimizable": false,
                "maximizable": false,
                "autoHideMenuBar": true,
                "webPreferences": {
                  "nodeIntegration": true
                }
              }).on("closed", function() {
                actor[key] = JSON.parse(localStorage.getItem("_tmpObjectString"));
              });
              editObject.loadFile("editObject.html");
            }
            else {
              actor[key] = value;
            }
  
  
            if (key == "identity") {
              gameObject.innerText = value;
            }
          }, actor);
          
          if (elm != null) panel.appendChild(elm);
        }
      }
    }
    else if (this instanceof Scene) {
      propertyList = {
        "name": this.name,
      };
      /**
       * @type {Scene}
       */
      let scene = Game.Memory.scene;

      /**
       * @type {HTMLLabelElement}
       */
      let sceneElement = null;
      
      const sceneElements = document.querySelectorAll("div#scenes label");
      for (let i = 0; i < sceneElements.length; i++) {
        const _sceneElement = sceneElements[i];
        if (_sceneElement.getAttribute("name") == scene.name) {
          sceneElement = _sceneElement;
          break;
        }
      }

      for (const key in propertyList) {
        if (!key.startsWith("_") && propertyList.hasOwnProperty(key)) {
          const itemValue = propertyList[key];
          let elm = makeProperty(key, itemValue, function(value) {
            if (typeof itemValue == "object") {
              let editObject = new BrowserWindow({
                "parent": win,
                "modal": true,
                "title": "Edit Object: "+ scene.name+"."+key,
                "minWidth": 640,
                "minHeight": 480,
                "maxWidth": 640,
                "maxHeight": 480,
                "width": 640,
                "height": 480,
                "minimizable": false,
                "maximizable": false,
                "autoHideMenuBar": true,
                "webPreferences": {
                  "nodeIntegration": true
                }
              }).on("closed", function() {
                scene[key] = JSON.parse(localStorage.getItem("_tmpObjectString"));
              });
              editObject.loadFile("editObject.html");
            }
            else {
              scene[key] = value;
            }
  
            if (scene.name != sceneElement.getAttribute("name")) {
              scene.name = sceneElement.getAttribute("name");
            }
  
            if (key == "name") {
              sceneElement.innerText = value;
              sceneElement.setAttribute("name", value);
              scene.name = value;
              // Game.displayObjectLists();
            }
          }, scene);
          
          if (elm != null) panel.appendChild(elm);
        }
      }
    }
  }
}

class Scene extends Alterable{
  /**
   * @param {Scene} data 
   */
  constructor(data) {
    super();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const elm = data[key];
        this[key] = elm;
      }
    }

    // Parse Actor objects
    let newActors = [];
    for (let i = 0; i < this.actors.length; i++) {
      const actor = this.actors[i];
      newActors.push(new Actor(actor, false));
    }
    this.actors = newActors;
  }
  name = "";
  index = 0;
  /**
   * Array of Actors.
   * @type {Actor[]}
   */
  actors = [];
  /**
   * Full HTML code for this scene.
   * @type {string}
   */
  // html = "";
}

class Actor extends Alterable {
  /**
   * The Identifying name of this actor.  
   * This must be unique in a single scene.
   */
  identity = "";
  name = "";
  /**
   * Custom values that can be changed along the way.
   */
  customValues = {};

  

  /**
   * Create a new Actor.
   * @param {Actor} data
   */
  constructor(data, attach = true) {
    super();
    if (typeof data == "string") {
      this.identity = data;
    }
    else if (typeOf(data) == "object") {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const elm = data[key];
          this[key] = elm;
        }
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
    let origId = this.identity
    let altId = 0;
    while (this.identityExists())
    {
      altId++;
      this.identity = origId + "-" + altId;
    }
    Game.Memory.scene.actors.push(this);
    Game.displayObjectLists();
  }

  identityExists() {
    for (let i = 0; i < Game.Memory.scene.actors.length; i++) {
      const _actor = Game.Memory.scene.actors[i];
      if (_actor.identity == this.identity) {
        return true;
      }
    }
    return false;
  }
}