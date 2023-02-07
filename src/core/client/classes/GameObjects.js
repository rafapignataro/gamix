window.GameObjects = class GameObjects {
  gameObjects = {};

  constructor() { }

  add(data) {
    const gameObject = new GameObject(data);

    this.gameObjects[gameObject.id] = gameObject;
  }

  find(id) {
    return this.gameObjects[id];
  }

  remove(id) {
    const gameObject = this.find(id);

    if (!gameObject) return;

    delete this.gameObjects[gameObject.id];
  }

  reset() {
    this.gameObjects = {};
  }
}