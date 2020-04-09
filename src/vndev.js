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
 * Global Game Canvas
 * @type {HTMLCanvasElement}
 */
const canvas = document.querySelector("canvas#gameCanvas");
const ctx = canvas.getContext("2d");

// Things to do on start up.
window.onload = function () {

};

// Scene management
class Scene {
  /**
   * @type {Scene}
   */
  static current;

  static load(sceneName) {
    throw "Not implemented";
  }

  /**
   * @param {string} identifier
   * @param {Actor[]} actorArray Defaults to this.actors
   * 
   * @returns {Actor}
   */
  getActor(identifier, actorArray = this.actors) {
    for (let i = 0; i < actorArray.length; i++) {
      const actor = actorArray[i];
      
      if (actor.identifier == identifier) {
        return actor;
      }
      let res = this.getActor(identifier, actor.children);
      if (res != null) {
        return res;
      }
    }
    return null;
  }

  /**
   * @param {Scene} args 
   */
  constructor(args) {
    if (typeof args != "object") {
      args = {};
      args.sceneName = null;
      args.actors = [];
    }
    const {
      sceneName,
      actors
    } = args;
    this.sceneName = sceneName;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      
      actors[i] = new Actor(actor);
    }
    this.actors = actors;
  }
  /**
   * @type {string}
   */
  sceneName = null;
  /**
   * @type {Actor[]}
   */
  actors = [];
}

function saveObject(actor) {
  fs.writeFileSync("./actor.json", JSON.stringify(actor, null, 2));
}

class Actor {
  /**
   * @param {Actor} args 
   */
  constructor(args) {
    let { _transformable, children, width, height, x, y, identifier, rotation, scale } = args;
    if(identifier !== undefined) this.identifier = identifier;

    if (_transformable === undefined) {
      _transformable = { };
    }

    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        children[i] = new Actor(children[i]);
        children[i].parent = this.identifier;
      }
    }
    else {
      children = [];
    }
    this.children = children;
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (width !== undefined) this.width = width;
    if (height !== undefined) this.height = height;
    if (scale !== undefined) this.scale = scale;
    if (rotation !== undefined) this.rotation = rotation;
    for (const key in _transformable) {
      if (_transformable.hasOwnProperty(key)) {
        const value = _transformable[key];
        this._transformable[key] = _transformable[key];
      }
    }
  }

  /**
   * @type {string}
   */
  identifier = null;

  setIdentifier(newIdentifier) {
    this.identifier = newIdentifier;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      child.parent = newIdentifier;
    }
  }

  /**
   * Never read/write to this directly except for in getters and setters internally.
   */
  _transformable = {
    /**
     * X Position <Int>
     * @type {number}
     */
    x: 0,
    /**
     * Y Position <Int>
     * @type {number}
     */
    y: 0,
    /**
     * Width <Int>
     * @type {number}
     */
    w: 0,
    /**
     * Height <Int>
     * @type {number}
     */
    h: 0,
    /**
     * Rotation <Int>
     * @type {number}
     */
    r: 0,
    /**
     * Scale <Float>
     * @type {number}
     */
    s: 1,
    /**
     * Parent Object's identifier <String>
     * @type {string}
     */
    parent: null,
  }

  // X Position
  set x(value) {
    this._transformable.x = value;
  }
  get x() {
    return this._transformable.x;
  }
  // Y Position
  set y(value) {
    this._transformable.y = value;
  }
  get y() {
    return this._transformable.y;
  }

  // Width
  set width(value) {
    this._transformable.w = value;
  }
  get width() {
    return this._transformable.w;
  }
  // Y Position
  set height(value) {
    this._transformable.h = value;
  }
  get height() {
    return this._transformable.h;
  }

  // Rotation
  set rotation(value) {
    this._transformable.r = value;
  }
  get rotation() {
    return this._transformable.r;
  }

  // Scale
  set scale(value) {
    this._transformable.s = value;
  }
  get scale() {
    return this._transformable.s;
  }

  // Parent element
  set parent(value) {
    if (value instanceof Actor) {
      this._transformable.parent = value.identifier;
    }
    else if (typeof value == "string") {
      this._transformable.parent = value;
    }
  };
  get parent() {
    return this._transformable.parent;
  };
  
  /**
   * Child Objects
   * @type {Actor[]}
   */
  children = [];

  /**
   * @param {Actor} child 
   */
  addChild(child) {
    let c;
    if ((c = Scene.current.getActor(child.identifier)) != null) {
      let p;
      if ((p = c.getParent()) != null) {
        p.removeChild(child.identifier);
      }
    }
    this.children.push(child);
    child.parent = this.identifier;
  }

  /**
   * @param {Actor} child 
   */
  removeChild(child) {
    let removedChild = this.children.splice((() => {
      for (let i = 0; i < this.children.length; i++) {
        const _child = this.children[i];
        if (_child == child) {
          return i;
        }
      }
    })(), 1)[0];

    removedChild.parent = null;
    return removedChild;
  }

  getParent() {
    return Scene.current.getActor(this.parent);
  }

  getAbsolutePosition(startX = 0, startY = 0) {
    let pos = {
      x: startX + this.x,
      y: startY + this.y
    }
    let p;
    if((p = this.getParent()) != null) {
      // pos.x += p.x;
      // pos.y += p.y;
      pos = p.getAbsolutePosition(pos.x, pos.y);
    }

    return pos;
  }

  draw() {
    let pos = this.getAbsolutePosition();
    let x = pos.x;
    let y = pos.y;
    let width = this.width;
    let height = this.height;
    
    ctx.fillRect(x, y, width, height);

    if (this.children.length > 0) {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.draw();
      }
    }
  }
}


// Gameloop
let lastTime = 0;
/**
 * @param {Number} time 
 */
function gameloop(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  let deltaTime = time - lastTime;
  lastTime = time;

  // Drawing
  for (let i = 0; i < Scene.current.actors.length; i++) {
    const actor = Scene.current.actors[i];
    actor.draw();
  }

  requestAnimationFrame(gameloop);
}

Scene.current = new Scene({
  "sceneName": "A scene name",
  "actors": [
    new Actor({
      "x" : 32,
      "y" : 32,
      "width" : 32,
      "height" : 32,
      "identifier": "n word",
      "children":[
        new Actor({
          "identifier": "A child element",
          "x": 32,
          "y": 32,
          "width": 32,
          "height": 32,
          "children": [
            {
              "identifier": "What a moment",
              "x": 32,
              "y": 32,
              "width" : 32,
              "height" : 32,
            }
          ]
        })
      ]
    }),
    {
      "x" : 32,
      "y" : 128,
      "width" : 32,
      "height" : 32,
      "identifier": "another one",
      "children":[
        {
          "identifier": "A child element no. 2",
          "x": 32,
          "y": 32,
          "width": 32,
          "height": 32
        }
      ]
    }
  ]
});

gameloop();
