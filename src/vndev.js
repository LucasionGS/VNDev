// Requirements
const fs = require("fs");

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
   * @type {string}
   */
  static projectName = null;

  /**
   * @param {string} projectName 
   */
  static initializeProject(projectName) {
    if (!fs.existsSync(Game.projectsDir)) {
      fs.mkdirSync(Game.projectsDir);
    }

    if (!fs.existsSync(Game.projectsDir+"/"+projectName)) {
      fs.mkdirSync(Game.projectsDir+"/"+projectName);
    }
    else {
      if (confirm("This project already exists.\nDo you want to overwrite it?\nThis cannot be undone.")) {
        fs.rmdirSync(Game.projectsDir+"/"+projectName, {
          recursive: true
        });
        fs.mkdirSync(Game.projectsDir+"/"+projectName);
      }
      else {
        return;
      }
    }

    Game.projectName = projectName;

    // Create folders
    fs.mkdirSync(Game.projectsDir+"/"+projectName+"/audio");
    fs.mkdirSync(Game.projectsDir+"/"+projectName+"/general");
    fs.mkdirSync(Game.projectsDir+"/"+projectName+"/sprites");
    fs.mkdirSync(Game.projectsDir+"/"+projectName+"/scenes");

    // Create Files
    Game.newScene("scene1");
  }
  
  /**
   * Create a new scene in this project.
   * @param {string} sceneName 
   */
  static newScene(sceneName) {
    // Create files
    fs.writeFileSync(Game.projectsDir+"/"+Game.projectName+`/scenes/${sceneName}.json`, JSON.stringify(Game.formats.scene));
  }
  static Memory = {
    /**
     * Name of the current scene.
     * @type {string}
     */
    "sceneName": "",

    /**
     * Current scene's data.
     * @type {Game.formats["scene"]}
     */
    "scene": {}
  }
  /**
   * Format Definitions
   */
  static formats = {
    "scene": {
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

window.onload = function() {

};

class Alterable {
  constructor() { }

  /**
   * Display the specific object's properties.
   */
  displayProperties() {
    /**
     * @param {string} name Used as a Label.
     * @param {string | number | boolean} value 
     */
    function makeProperty(name, value) {
      const label = document.createElement("label");
      label.setAttribute("for", "propertyItem_"+name);
      label.innerText = name.substring(0,1).toUpperCase() + name.substring(1).toLowerCase();
      const inp = document.createElement("input");
      inp.setAttribute("name", "propertyItem_"+name);

      if (typeof value == "boolean") {
        inp.type = "checkbox";
        inp.checked = value;
        inp.value = value;
      }
      else if (typeof value == "number") {
        inp.type = "number";
        inp.value = value;
      }
      else {
        inp.type = "text";
        inp.value = value;
      }

      const div = document.createElement("div");
      div.appendChild(label);
      div.appendChild(document.createElement("br"));
      div.appendChild(inp);
      div.className = "propertyElement";
      console.log(div);
      
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
    }
    for (const key in propertyList) {
      if (propertyList.hasOwnProperty(key)) {
        const item = propertyList[key];
        panel.appendChild(makeProperty(key, item));

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
  customValues = { };

  /**
   * Create a new Actor.
   * @param {string} identity 
   */
  constructor(identity) {
    super();
    this.identity = identity;
  }

  attachToScene() {
    let actor = this;
    Game.Memory.scene = function(){
      let scene = Game.Memory.scene;
      scene.actors.push(actor);
      return scene;
    }();
  }
}

let actor = new Actor("Len");