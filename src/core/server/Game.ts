import { Server } from "socket.io";
import { Size } from "../types";
import { Chat } from "./Chat";

import { GameObjects } from "./GameObjects";
import { Map } from "./Map";
import { Players } from "./Players";

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

  players: Players;

  chat: Chat;

  setup: (game: Game) => void = () => { };

  update: (game: Game) => void = () => { };

  constructor(config: GameProps) {
    this.websocket = config.websocket;
    this.map = new Map(config.map);
    this.fps = config.fps || 1000 / 30;
    this.players = new Players();
    this.chat = new Chat({ websocket: this.websocket });

    if (config.setup) this.setup = config.setup;
    if (config.update) this.update = config.update;

    this.webSocketEvents();
  }

  webSocketEvents() {
    const { websocket, players, gameObjects, map } = this;

    this.websocket.on('connection', (socket) => {
      if (!this.players.size()) this.start();

      this.players.add({
        id: socket.id,
        connectedAt: new Date(),
        socket,
        disconnected: false
      });

      socket.emit('START_GAME', { tiles: map.tiles, tileSize: map.tileSize });

      socket.on('JOIN_GAME', (p: { id: string, username: string, screen: { size: Size }, proportion: number }) => {
        const player = this.players.find(p.id);

        player.setStatus('PLAYING');
        player.setUsername(p.username);

        gameObjects.add({
          ...p,
          velocity: {
            x: 2,
            y: 2,
          },
          size: {
            width: 8,
            height: 16,
          },
          position: {
            x: 100,
            y: 100
          },
          movement: {
            up: false,
            down: false,
            left: false,
            right: false,
          }
        });

        const gameObject = gameObjects.find(player.id);

        const clientPlayer = player.getClientData();

        websocket.to(socket.id).emit('JOINED_SUCCESSFULLY', { player: clientPlayer, gameObject })
        websocket.sockets.emit('PLAYER_JOINED', { player: clientPlayer, gameObject });
      });

      socket.on('PLAYER_MOVE', data => {
        const gameObject = gameObjects.find(data.id);

        if (!data.movement) return;

        gameObject.setMovement(data.movement);
      });

      socket.on('PLAYER_FIRE', ({ playerId }) => {
        // game.addShot({
        //   playerId,
        // })
      });

      socket.on('PLAYER_AIM', ({ playerId, mousePosition, cameraPosition }) => {
        // game.playerAim({
        //   playerId,
        //   mousePosition,
        //   cameraPosition
        // })
      })

      socket.on('SEND_MESSAGE', ({ player, text }) => {
        this.chat.addMessage({
          player,
          text
        });
      });

      socket.on('disconnect', () => {
        players.remove(socket.id);

        const gameObject = gameObjects.find(socket.id);

        if (!gameObject) return;

        gameObjects.remove(gameObject.id);

        if (!gameObjects.size()) return this.stop();

        socket.broadcast.emit('PLAYER_LEFT', { player: { id: socket.id }, gameObject });
      });
    });
  }

  start() {
    this.status = 'RUNNING';

    this._setup();

    this.gameLoop = setInterval(() => {
      this._update();

      const syncData = {
        players: this.players.getClientData(),
        gameObjects: this.gameObjects.findAll(),
      }

      this.websocket.sockets.emit('SYNC', syncData)
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
    const gameObjects = this.gameObjects.findAll();

    Object.keys(gameObjects).forEach(gameObjectId => {
      const gameObject = gameObjects[gameObjectId];

      if (!gameObject) return;

      gameObject.update(this);
    });

    this.update(this);
  }
}