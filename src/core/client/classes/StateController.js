window.StateController = class StateController {
  state = undefined;

  type = undefined;

  events = {
    update: {},
  };

  constructor(initialValue) {
    this.state = initialValue ?? undefined;

    if (this.state) this.type = typeof this.state;
  }

  get() {
    return this.state;
  }

  set(value) {
    if (this.type && typeof value !== this.type) {
      throw new Error(`StateController: Wrong type for state (expect: ${this.type}, received: ${typeof value})`);
    }

    this.state = value;

    this._runCallbacks('update');
  }

  on(eventName, cb) {
    const event = this.events[eventName];

    if (!event) {
      throw new Error(`StateController: event ${eventName} does not exist.`);
    }

    const eventCallbackId = new Date().getTime().toString();

    this.events[eventName][eventCallbackId] = cb;
  }

  _runCallbacks(eventName) {
    Object.keys(this.events[eventName]).forEach(key => {
      if (eventName === 'update') {
        this.events[eventName][key](this.state);
      }
    });
  }
}