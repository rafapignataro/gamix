import { Server } from "socket.io";

import { GameObjects } from "./GameObjects";
import { Map } from "./Map";

export type GameProps = {
  map: {
    tilesX: number;
    tilesY: number;
    tileSize: number;
  };
  websocket: Server;
  fps?: number;
  setup?: (game: Game) => void;
  update?: (game: Game) => void;
}

export class Game {
  status: 'STOPPED' | 'RUNNING' = 'STOPPED';

  gameLoop?: NodeJS.Timer;

  gameObjects = new GameObjects();

  map: Map;

  websocket: Server;

  fps: number;

  setup: (game: Game) => void = () => { };

  update: (game: Game) => void = () => { };

  constructor(config: GameProps) {
    this.websocket = config.websocket;
    this.map = new Map(config.map);
    this.fps = config.fps || 1000 / 30;

    if (config.setup) this.setup = config.setup;
    if (config.update) this.update = config.update;
  }

  start() {
    this.status = 'RUNNING';

    this._setup();

    this.gameLoop = setInterval(() => {
      this._update();

      this.websocket.sockets.emit('GAME_STATE', JSON.stringify(this.gameObjects))
    }, this.fps);
  }

  stop() {
    clearInterval(this.gameLoop);
    this.gameLoop = undefined;
    this.status = 'STOPPED';
    this.gameObjects.reset();
  }

  private _setup() {
    this.setup(this);
  }

  private _update() {
    const gameObjects = this.gameObjects;

    Object.keys(gameObjects).forEach(gameObjectId => {
      const gameObject = gameObjects.find(gameObjectId);

      if (!gameObject) return;

      gameObject.update(this);
    });

    this.update(this);
  }
}