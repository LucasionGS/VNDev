class Eventable {
  constructor() {}

  /**
   * @type {{"eventName": (() => void)[]}}
   */
  _event_events = {}

  /**
   * Listen for an event.
   * @param {string} eventName Event Name 
   * @param {(this: this, ...args) => void} cb Callback
   */
  on(eventName, cb) {
    if (!this._event_events.hasOwnProperty(eventName)) {
      this._event_events[eventName] = [];
    this._event_events[eventName].push(cb);
    }
  }

  /**
   * 
   * @param {string} eventName 
   * @param {any[]} parameters 
   */
  emit(eventName, parameters) {
    if (this._event_events.hasOwnProperty(eventName)) {
      let cbs = this._event_events[eventName]
      for (let i = 0; i < cbs.length; i++) {
        /**
         * @type {() => void}
         */
        const cb = cbs[i];
        try {
          cb.apply(this, parameters);
        } catch {
          try {
            console.error("Unable to execute event function at index "+i+" of "+eventName);
          } catch {
            console.error("Unable to execute event function");
          }
        }
      }
    }
  }
}

class Game {
  constructor(width = 640, height = 480) {
    this.width = width;
    this.height = height;
  }

  newObject(x = 0, y = 0, width = null, height = null) {
    return new GameObject(this, x, y, width, height)
  }

  /**
   * @type {HTMLCanvasElement}
   */
  _canvas;
  get canvas() {
    return this._canvas;
  };

  set canvas(value) {
    this._canvas = value;
    this._canvas.width = this.width;
    this._canvas.height = this.height;
    if (this.ctx == null) {
      this.ctx = this._canvas.getContext("2d");
    }
  };

  /**
   * @private
   */
  _width = 640;
  /**
   * @private
   */
  _height = 480;
  /**
   * @private
   */
  _scale = 100;

  set width(value) {
    if (this.canvas && this.canvas.width != undefined) {
      this.canvas.width = value
    }
    this._width = value;
  }
  get width() {
    return this._width;
  }
  set height(value) {
    if (this.canvas && this.canvas.height != undefined) {
      this.canvas.height = value
    }
    this._height = value;
  }
  get height() {
    return this._height;
  }
  set scale(value) {
    if (this.canvas) {
      this.canvas.style.width = (value - 2)+"%";
      // this.canvas.style.transformOrigin = "50% 50%";
    }
    this._scale = value;
  }
  get scale() {
    return this._scale;
  }

  /**
   * @type {CanvasRenderingContext2D}
   */
  ctx = null;

  running = false;
  
  /**
   * @type {GameObject[]}
   */
  drawableObjects = [ ];

  /**
   * @type {((deltaTime: number, gameTime: number) => void)[]}
   */
  toExecuteBeforeDraw = [ ];

  /**
   * @type {((deltaTime: number, gameTime: number) => void)[]}
   */
  toExecuteAfterDraw = [ ];

  time = 0;

  start(drawableObjects = this.drawableObjects, toExecuteBeforeDraw = this.toExecuteBeforeDraw, toExecuteAfterDraw = this.toExecuteAfterDraw) {
    if (drawableObjects == null) {
      drawableObjects = this.drawableObjects;
    }
    if (toExecuteBeforeDraw == null) {
      toExecuteBeforeDraw = this.toExecuteBeforeDraw;
    }
    if (toExecuteAfterDraw == null) {
      toExecuteAfterDraw = this.toExecuteAfterDraw;
    }
    this.drawableObjects = drawableObjects;
    this.toExecuteBeforeDraw = toExecuteBeforeDraw;
    this.toExecuteAfterDraw = toExecuteAfterDraw;
    this.running = true;
    let game = this;
    _update();
    /**
     * @param {number} timestamp 
     */
    function _update(timestamp)
    {
      let deltaTime = timestamp - game.time;
      game.time = timestamp;
      game.clearScreen();
      for (let i = 0; i < game.toExecuteBeforeDraw.length; i++) {
        game.toExecuteBeforeDraw[i](deltaTime, game.time);
      }
      for (let i = 0; i < game.drawableObjects.length; i++) {
        const obj = game.drawableObjects[i];
        if (obj.visible) obj.draw();
        obj.moveX();
        obj.moveY();
      }
      for (let i = 0; i < game.toExecuteAfterDraw.length; i++) {
        game.toExecuteAfterDraw[i](deltaTime, game.time);
      }
      if (game.running === true) {
        requestAnimationFrame(_update);
      }
    }
  }

  stop() {
    this.running = false;
  }

  clearScreen() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

class GameObject extends Eventable {
  /**
   * @param {Game} game 
   * @param {Number} x 
   * @param {Number} y 
   * @param {Number} width 
   * @param {Number} height 
   */
  constructor(game, x = 0, y = 0, width, height) {
    super();
    this.game = game;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * 
   * @param {Game} game 
   * @param {GameObject} data 
   */
  static createFromObject(game, data) {
    let g = new GameObject(game);
    for (const key in data) {
      if (!key.startsWith("_") && key != "game" && data.hasOwnProperty(key)) {
        const elm = data[key];
        g[key] = elm;
      }
    }
    return g;
  }

  /**
   * @param { "outofscreen" } eventName
   * @param {(this: GameObject, ...args) => void} cb
   */
  on(eventName, cb) {
    if (eventName == "outofscreen") {
      /**
       * @type {string}
       */
      cb;
    }
    super.on.apply(this, [eventName, cb])
  };

  /**
   * @param {HTMLImageElement | string} image 
   */
  setImage(image) {
    if (image == undefined) console.error("Not an IMG object or string");
    if (typeof image == "string") {
      let _image = document.createElement("img");
      _image.src = image;
      _image.toggleAttribute("noshow", true);
      image = _image;
    }
    this.image = image;
  }

  /**
   * @param {number} width 
   * @param {number} height 
   */
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set the direction so speed towards
   * @param {number} x
   * @param {number} y
   */
  setDirection(x, y) {
    this.xSpeed = x;
    this.ySpeed = y;
  }

  /**
   * @type {HTMLImageElement}
   */
  image = null
  
  visible = true

  /**
   * @type {Game}
   */
  game = null;
  get x() {
    return this._p.x;
  }
  set x(value) {
    this._p.x = value;
    this.checkAfterMovement();
  }
  get y() {
    return this._p.y;
  }
  set y(value) {
    this._p.y = value;
    this.checkAfterMovement();
  }

  get direction() {
    return new Vector(this.xSpeed, this.ySpeed);
  }

  set direction(vector) {
    this.setDirection(vector.x, vector.y);
  }

  get width() {
    return this._p.width;
  }
  set width(value) {
    this._p.width = value;
    this.checkAfterMovement();
  }
  get height() {
    return this._p.height;
  }
  set height(value) {
    this._p.height = value;
    this.checkAfterMovement();
  }

  /**
   * @type {{object: GameObject, callback: (gameObject: GameObject) => void}[]}
   */
  _collidables = [];

  /**
   * Add Collision detection
   * @param {GameObject} gameObject 
   * @param { "Bounce" | ((this: GameObject, gameObject: GameObject) => void)} callback 
   */
  addCollision(gameObject, callback) {
    let ball = this;
    if (callback == "Bounce") {
      callback = function(go) {
        let v = go.direction;
        if (v.x == 0 && v.y == 0) {
          let box1 = this.getBoundingBox();
          let box2 = go.getBoundingBox();
        }
        else {
        }
        this.direction = Vector.add(this.direction, v);
        if (go.direction.x == 0 && go.direction.y == 0) {
          this.bounceX();
        }
        if (go.direction.x != 0 && go.direction.y == 0) {
          this.bounceY();
        }
        // setInterval(() => {
        //   ball.x = 5;
        //   ball.y = 5;
        // }, 10);
      }
    }
    
    this._collidables.push({
      "gameObject": gameObject,
      "callback": callback
    });
  }

  checkCollisions() {
    function hasHit(box1, box2) {
      // if(box2.right >= box1.left && box1.right >= box2.left && box2.bottom >= box1.top && box1.bottom >= box2.top)
      if(
        (box1.left < box2.right) && (box1.right > box2.left) && (box1.top < box2.bottom) && (box1.bottom > box2.top)
      )
      {        
        return true;
      }
      else
      {
        return false
      }
    }
    
    for (let i = 0; i < this._collidables.length; i++) {
      const col = this._collidables[i];
      
      let o = col.gameObject;
      let cb = col.callback;
      let thisBox = this.getBoundingBox();
      let oBox = o.getBoundingBox();
      // Make this collision work correctly.
      // Check for bounding box overlaps
      if (hasHit(thisBox, oBox)) {
        cb.apply(this, [o]);
      }
    }
  }

  xSpeed = 0;
  xSpeedMax = 5;
  ySpeed = 0;
  ySpeedMax = 5;

  moveX(acceleration = Tools.signedValue(this.xSpeed)) {
    if (this.xSpeed != 0) {
      this.x += this.xSpeed;
      if (Math.abs(this.xSpeed) > this.xSpeedMax) {
        this.xSpeed = this.xSpeedMax * Tools.signedValue(this.xSpeed);
      }
      if (Math.abs(this.xSpeed) < this.xSpeedMax) {
        this.xSpeed += acceleration;
      }
    }
  }

  moveY(acceleration = Tools.signedValue(this.ySpeed)) {
    if (this.ySpeed != 0) {
      this.y += this.ySpeed;
      if (Math.abs(this.ySpeed) > this.ySpeedMax) {
        this.ySpeed = this.ySpeedMax * Tools.signedValue(this.ySpeed);
      }
      if (Math.abs(this.ySpeed) < this.ySpeedMax) {
        this.ySpeed += acceleration;
      }
    }
  }

  stopX() {
    this.xSpeed = 0;
  }

  stopY() {
    this.ySpeed = 0;
  }

  getBoundingBox() {
    return {
      "left": this.x,
      "top": this.y,
      "right": this.x + this.width,
      "bottom": this.y + this.height
    }
  }

  checkAfterMovement() {
    if (this.x < 0 || this.y < 0 || this.x > this.game.width - this.width || this.y > this.game.height - this.height) {
      if (this.isOffScreen == false) {
        this.emit("outofscreen")
      }
      this.isOffScreen = true;
      if (this.keepInBound == true) {
        this.forceInBound();
      }
    }
    else {
      this.isOffScreen = false;
    }

    this.checkCollisions();
  }

  forceInBound(boundingBox = this.getBoundingBox()) {
    if (boundingBox.left < 0) {
      this.x = 0;
    }
    if (boundingBox.right > this.game.width) {
      this.x = this.game.width - this.width;
    }
    if (boundingBox.top < 0) {
      this.y = 0;
    }
    if (boundingBox.bottom > this.game.height) {
      this.y = this.game.height - this.height;
    }
  }

  /**
   * @param {boolean} bounceX Set `true` to bounce `X`, otherwise `false`.
   * @param {boolean} bounceY Set `true` to bounce `Y`, otherwise `false`.
   */
  bounce(bounceX, bounceY) {
    if (bounceX == true) {
      this.bounceX();
    }
    if (bounceY == true) {
      this.bounceY();
    }
  }

  bounceX() {
    this.xSpeed *= -1;
  }

  bounceY() {
    this.ySpeed *= -1;
  }

  /**
   * Internal Values
   */
  _p = {
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0
  }

  isOffScreen = false

  /**
   * Restricts the object to always stay within the bounds of the screen.  
   * The object will be automatically pushed back inside of it comes out on the wrong side.
   */
  keepInBound = false;

  draw(x = this.x, y = this.y, width = this.width, height = this.height) {
    if (this.image == undefined) {
      this.game.ctx.fillRect(x, y, width, height);
    }
    else {
      try {
        this.game.ctx.drawImage(this.image, x, y, width, height);
      } catch (error) {
        
      }
    }
  }
};

class InputHandler {
  /**
   * @param {Document | HTMLElement} element 
   * @param {"mousedown" | "keydown" | "keyup" | "mouseup" | "contextmenu"} type 
   * @param {(this: HTMLElement, ev: KeyboardEvent | MouseEvent)} handler
   */
  constructor(element, type, handler) {
    if (!element) {
      element = document;
    }

    if(typeof type == "string" && typeof handler == "function") element.addEventListener(type, handler);
    if (InputHandler._recordingKeyStates != true) {
      InputHandler.recordKeyStates();
    }
  }

  /**
   * Starts recording all key- and mouse inputs.  
   * Will be stored in `InputHandler.keyAvailable` as a `boolean` value.  
   * Fetch a key by using:
   * ```js
   * InputHandler.isKeyDown("key"); // Returns boolean
   * ```
   */
  static recordKeyStates() {
    if (InputHandler._recordingKeyStates != true) {
      document.addEventListener("keydown", function(e) {
        InputHandler.keyAvailable[e.key] = true;
      }, false);
      document.addEventListener("keyup", function(e) {
        InputHandler.keyAvailable[e.key] = false;
      }, false);
      document.addEventListener("mousedown", function(e) {
        InputHandler.keyAvailable["mouse"+e.button] = true;
      }, false);
      document.addEventListener("mouseup", function(e) {
        InputHandler.keyAvailable["mouse"+e.button] = false;
      }, false);
      InputHandler._recordingKeyStates = true;
    }
    else {
      console.error("Key States are already being recorded.");
    }
  }

  static _recordingKeyStates = false;

  /**
   * 
   * @param {
    "mouse0" |
    "mouse1" |
    "mouse2" |
    "ArrowLeft" |
    "ArrowRight" |
    "ArrowUp" |
    "ArrowDown"
    } key
   * @param {boolean} caseSensitive Works only for alphanumeric symbols.
   */
  static isKeyDown(key, caseSensitive = true) {
    if (caseSensitive == false && key.length == 1) {
      if (InputHandler.keyAvailable[key.toUpperCase()] === true || InputHandler.keyAvailable[key.toLowerCase()]) {
        return true
      }
      else {
        return false;
      }
    }
    else {
      let v = InputHandler.keyAvailable[key];
      if (v === true) {
        return true
      }
      else {
        return false;
      }
    }
  }

  static keyAvailable = {};


}

class Tools {
  /**
   * Figure out whether a number is positive or negative.  
   * Returns `1` if positive, `-1` if negative, and `0` if 0.
   * @param {number} x
   */
  static signedValue(x) {
    if (x > 0) {
      return 1;
    }
    else if (x < 0) {
      return -1;
    }
    else {
      return 0;
    }
  }
}

class Vector {
  /**
   * Create a new Vector
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  x = 0;
  y = 0;

  /**
   * Add 2 vectors together
   * @param {Vector} vector1
   * @param {Vector} vector2
   */
  static add(vector1, vector2) {
    return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
  }

  /**
   * Subtract 2 vectors fromm each other.
   * @param {Vector} vector1
   * @param {Vector} vector2
   */
  static sub(vector1, vector2) {
    return new Vector(vector1.x - vector2.x, vector1.y - vector2.y);
  }
}