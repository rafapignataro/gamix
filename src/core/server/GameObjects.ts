import { CreateGameObject, GameObject, UpdateGameObject } from './GameObject';

export class GameObjects {
  private gameObjects: Record<string, GameObject> = {};

  constructor() { }

  public add(data: CreateGameObject) {
    const gameObject = new GameObject(data);

    this.gameObjects[gameObject.id] = gameObject;
  }

  public find(id: string) {
    return this.gameObjects[id];
  }
  public remove(id: string) {
    const gameObject = this.find(id);

    if (!gameObject) return;

    delete this.gameObjects[gameObject.id];
  }

  public reset() {
    this.gameObjects = {};
  }
}