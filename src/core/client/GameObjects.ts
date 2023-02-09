import { GameObject, GameObjectProps } from "./GameObject";

export class GameObjects {
  private gameObjects: Record<string, GameObject> = {};

  constructor() { }

  public add(data: GameObjectProps) {
    const gameObject = new GameObject(data);
    this.gameObjects[gameObject.id] = gameObject;
  }

  public set(gameObjects: Record<string, GameObject>) {
    this.gameObjects = gameObjects;
  }

  public find(id: string) {
    return this.gameObjects[id];
  }

  public findAll() {
    return this.gameObjects;
  }

  public remove(id: string) {
    const gameObject = this.find(id);

    if (!gameObject) return;

    delete this.gameObjects[gameObject.id];
  }

  public reset() {
    this.gameObjects = {};
  }

  public size() {
    return Object.keys(this.gameObjects).length;
  }
}