type Callbacks<T> = {
  update: (data: T) => void;
  create: (data: T, num: number) => string;
}

type UpdateEventCallbacks<T> = Record<string, Callbacks<T>['update']>;
type CreateEventCallbacks<T> = Record<string, Callbacks<T>['create']>;

type Events<T> = {
  update: UpdateEventCallbacks<T>;
  create: CreateEventCallbacks<T>;
};

export class StateController<T = any> {
  state?: T;

  type;

  events: Events<T> = {
    create: {},
    update: {},
  };

  constructor(initialValue?: T) {
    if (initialValue) {
      this.state = initialValue;
      this.type = typeof this.state;
    }
  }

  public get(): T | undefined {
    return this.state;
  }

  public set(value: T) {
    if (this.type && typeof value !== this.type) {
      throw new Error(`StateController: Wrong type for state (expect: ${this.type}, received: ${typeof value})`);
    }

    this.state = value;

    this.runCallbacks('update');
  }

  public on<K extends keyof Events<T>>(eventName: K, cb: Callbacks<T>[K]) {
    const event = this.events[eventName];

    if (!event) {
      throw new Error(`StateController: event ${eventName} does not exist.`);
    }

    const eventCallbackId = new Date().getTime().toString();

    event[eventCallbackId] = cb;
  }

  private runCallbacks(eventName: keyof Events<T>) {
    const event = this.events[eventName];

    if (!event) return;

    if (eventName === 'update') {
      for (const cbKey in event) {
        const cb = event[cbKey] as Callbacks<T>['update'];

        cb(this.state as T);
      }
    }
  }
}