window.InputController = class InputController {
  _pressed = {};

  _releaseTime = {};

  _maxKeyDelay = 50;

  inputs = {};

  constructor() {
    window.onkeydown = (e) => this._keydown(e);
    window.onkeyup = (e) => this._keyup(e);
    window.onmousedown = (e) => this._mousedown(e);
    window.onmousemove = (e) => this._mousemove(e);
  }

  on(name, cb, opts) {
    this.inputs[name] = {
      disabled: opts && opts.disabled !== undefined ? opts.disabled : false,
      cb
    };
  }

  enable() {
    Object.keys(this.inputs).forEach(eventKey => this.inputs[eventKey].disabled = false);
  }

  disable() {
    Object.keys(this.inputs).forEach(eventKey => this.inputs[eventKey].disabled = true);
  }

  _keydown(event) {
    const input = this.inputs['keydown'];

    if (!input) return;
    if (input.disabled) return;

    const time = new Date().getTime();

    if (
      this._releaseTime[event.keyCode] &&
      time < this._releaseTime[event.keyCode] + this._maxKeyDelay
    ) {
      return;
    }

    this._pressed[event.keyCode] = true;

    input.cb(event.key);
  }

  _keyup(event) {
    const input = this.inputs['keyup'];

    if (!input) return;
    if (input.disabled) return;

    delete this._pressed[event.keyCode];

    this._releaseTime[event.keyCode] = new Date().getTime();

    input.cb(event.key);
  }

  _mousedown(event) {
    const input = this.inputs['mousedown'];

    if (!input) return;
    if (input.disabled) return;

    input.cb(event);
  }

  _mousemove(event) {
    const input = this.inputs['mousemove'];

    if (!input) return;
    if (input.disabled) return;

    input.cb(event);
  }
};