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
   */
  getActor(identifier) {
    for (let i = 0; i < this.actors.length; i++) {
      const actor = this.actors[i];
      if (actor.identifier == identifier) {
        return actor;
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

class Actor {
  /**
   * @param {Actor} args 
   */
  constructor(args) {
    let { _transformable, width, height, x, y, identifier, rotation, scale } = args;
    if(identifier !== undefined) this.identifier = identifier;
    // if (parent !== undefined && !parent instanceof Actor) parent = new Actor(parent);
    // this.parent = parent;

    if (_transformable === undefined) {
      _transformable = { };
    }

    if (Array.isArray(_transformable.children)) {
      for (let i = 0; i < _transformable.children.length; i++) {
        _transformable.children[i] = new Actor( _transformable.children[i]);
      }
    }

    
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (width !== undefined) this.width = width;
    if (height !== undefined) this.height = height;
    if (scale !== undefined) this.scale = scale;
    if (rotation !== undefined) this.rotation = rotation;
    this._transformable = _transformable
  }

  /**
   * @type {string}
   */
  identifier = null;

  /**
   * Never read/write to this directly except for in getters and setters internally.
   */
  _transformable = {
    /**
     * X Position
     * @type {number}
     */
    x: 0,
    /**
     * Y Position
     * @type {number}
     */
    y: 0,
    /**
     * Width
     * @type {number}
     */
    w: 0,
    /**
     * Height
     * @type {number}
     */
    h: 0,
    /**
     * Rotation
     * @type {number}
     */
    r: 0,
    /**
     * Scale
     * @type {number}
     */
    s: 1,
    /**
     * Parent Object
     * @type {Actor}
     */
    parent: null,
    /**
     * Child Objects
     * @type {Actor[]}
     */
    children: [],
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
    this._transformable.parent = value;
  };
  get parent() {
    return this._transformable.parent;
  };
  
  getChildren() {
    return this._transformable.children;
  };

  /**
   * @param {Actor} child 
   */
  addChild(child) {
    this._transformable.children.push(child);
  }

  /**
   * @param {Actor} child 
   */
  removeChild(child) {
    let removedChild = this._transformable.children.splice((() => {
      for (let i = 0; i < this._transformable.children.length; i++) {
        const _child = this._transformable.children[i];
        if (_child == child) {
          return i;
        }
      }
    })(), 1)[0];

    removedChild.parent = null;
    return removedChild;
  }

  draw() {
    let x = this.x;
    let y = this.y;
    let width = this.width;
    let height = this.height;
    if (this.parent instanceof Actor) {
      this.parent.draw();
      x += this.parent.x;
      y += this.parent.y;
    }

    ctx.fillRect(x, y, width, height);
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
      "x" : 30,
      "y" : 30,
      "width" : 30,
      "height" : 30,
      "identifier": "n word",
      "_transformable": {
        "children":[
          new Actor({
            "identifier": "A child element",
            "x": 30
          })
        ]
      }
    }),
    {
      "x" : 30,
      "y" : 69,
      "width" : 30,
      "height" : 30,
      "identifier": "another one",
      "_transformable": {
        "children":[
          {
            "identifier": "A child element no. 2",
            "x": 30
          }
        ]
      }
    }
  ]
});

gameloop();