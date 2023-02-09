type Input = {
  disabled: boolean;
  cb: (data?: any) => any;
}

export class InputController {
  _pressed: Record<KeyboardEvent['key'], boolean> = {};

  _releaseTime: Record<KeyboardEvent['key'], number> = {};

  _maxKeyDelay = 50;

  inputs: Record<string, Input> = {};

  constructor() {
    window.onkeydown = (e) => this._keydown(e);
    window.onkeyup = (e) => this._keyup(e);
    window.onmousedown = (e) => this._mousedown(e);
    window.onmousemove = (e) => this._mousemove(e);
  }

  on(name: string, cb: (data?: any) => any, opts?: { disabled: boolean }) {
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

  _keydown(event: KeyboardEvent) {
    const input = this.inputs['keydown'];

    if (!input) return;
    if (input.disabled) return;

    const time = new Date().getTime();

    if (
      this._releaseTime[event.key] &&
      time < this._releaseTime[event.key] + this._maxKeyDelay
    ) {
      return;
    }

    this._pressed[event.key] = true;

    input.cb(event.key);
  }

  _keyup(event: KeyboardEvent) {
    const input = this.inputs['keyup'];

    if (!input) return;
    if (input.disabled) return;

    delete this._pressed[event.key];

    this._releaseTime[event.key] = new Date().getTime();

    input.cb(event.key);
  }

  _mousedown(event: MouseEvent) {
    const input = this.inputs['mousedown'];

    if (!input) return;
    if (input.disabled) return;

    input.cb(event);
  }

  _mousemove(event: MouseEvent) {
    const input = this.inputs['mousemove'];

    if (!input) return;
    if (input.disabled) return;

    input.cb(event);
  }
};