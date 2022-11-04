import { Server } from "socket.io";
import crypto from 'crypto';

import { AddPlayerProps, Player, Position, Shot } from "../types";
import { Map } from "./Map";

export type GameProps = {
  map: {
    tilesX: number;
    tilesY: number;
    tileSize: number;
  };
  websocket: Server;
  fps?: number;
}

export class Game {
  map: Map;

  players: Record<Player['id'], Player>;

  shots: Record<Player['id'], Shot>

  gameLoop?: NodeJS.Timer;

  websocket: Server;

  fps: number;

  status: 'STOPPED' | 'RUNNING' = 'STOPPED';

  constructor(config: GameProps) {
    this.websocket = config.websocket;
    this.map = new Map(config.map);
    this.fps = config.fps || 1000 / 60;
    this.players = {};
    this.shots = {};
  }

  start() {
    this.status = 'RUNNING';

    this.gameLoop = setInterval(() => {
      this.update();

      this.websocket.sockets.emit('GAME_STATE', this.getGameState())
    }, 1000 / 30);
  }

  stop() {
    clearInterval(this.gameLoop);
    this.gameLoop = undefined;
    this.status = 'STOPPED';
    this.players = {};
    this.shots = {};
  }

  private getPlayers() {
    return Object.values(this.players);
  }

  addPlayer({ id, username, screen }: AddPlayerProps) {
    this.players[id] = {
      id,
      username,
      move: {
        up: false,
        down: false,
        left: false,
        right: false,
      },
      velocity: 2,
      size: {
        width: 8,
        height: 16,
      },
      position: {
        x: 100,
        y: 100
      },
      screen,
      weapon: {
        rotation: 0,
        dx: 0,
        dy: 0,
        position: {
          x: 100 + 10 / 2,
          y: 100 + 16 / 2,
        },
        size: {
          width: 1,
          height: 5
        }
      }
    }
  }

  movePlayer(player: Player) {
    if (!this.players[player.id]) return;
    this.players[player.id].move = player.move;
  }

  removePlayer(playerId: string) {
    delete this.players[playerId];

    if (!this.getPlayersCount() && this.gameLoop) this.stop();
  }

  getPlayersCount() {
    return Object.keys(this.players).length;
  }

  playerAim({ playerId, mousePosition, cameraPosition }: { playerId: string, mousePosition: Position, cameraPosition: Position }) {
    if (!this.players[playerId]) return;

    const player = this.players[playerId];

    const startPosition = {
      x: player.position.x + (player.size.width / 2),
      y: player.position.y + (player.size.height / 2),
    };

    const endPosition = {
      x: Math.round((cameraPosition.x + mousePosition.x) / player.screen.proportion),
      y: Math.round((cameraPosition.y + mousePosition.y) / player.screen.proportion),
    };

    const xDistance = endPosition.x - startPosition.x;
    const yDistance = endPosition.y - startPosition.y;
    const directDistance = Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));

    let rotation = Math.atan2(yDistance, xDistance) * 180 / Math.PI;

    if (rotation < 0) rotation = 180 + (180 - Math.abs(rotation))

    const dx = xDistance / directDistance;
    const dy = yDistance / directDistance;

    this.players[player.id].weapon = {
      ...player.weapon,
      rotation,
      dx,
      dy,
    }
  }

  // Shots
  addShot({ playerId, mousePosition }: { playerId: string, mousePosition: Position }) {
    if (!this.players[playerId]) return;

    const player = this.players[playerId];
    const playerShots = this.getShots().filter(shot => shot.playerId === player.id);

    if (playerShots.length) {
      const lastShot = playerShots[playerShots.length - 1];
      const now = new Date().getTime();
      const lastShotTime = new Date(lastShot.createdAt).getTime();

      if (now - lastShotTime < 250) return;
    }

    const shot = {
      id: crypto.randomUUID(),
      playerId,
      radius: 0.3,
      position: {
        x: player.weapon.position.x,
        y: player.weapon.position.y,
      },
      velocity: {
        x: player.weapon.dx * 10,
        y: player.weapon.dy * 10
      },
      createdAt: new Date().toISOString()
    };

    this.shots[shot.id] = shot;
  }

  private getShots() {
    return Object.values(this.shots);
  }

  private getGameState() {
    return JSON.stringify({
      players: this.players,
      shots: this.shots
    })
  }

  private update() {
    this.getPlayers().forEach(player => {
      if (player.move.up && player.position.y > 0) {
        this.players[player.id].position.y = player.position.y -= player.velocity;
      }
      if (player.move.down && player.position.y + player.size.height + player.velocity <= this.map.size.height) {
        this.players[player.id].position.y = player.position.y += player.velocity;
      }
      if (player.move.right && player.position.x + player.size.width + player.velocity <= this.map.size.width) {
        this.players[player.id].position.x = player.position.x += player.velocity;
      }
      if (player.move.left && player.position.x > 0) {
        this.players[player.id].position.x = player.position.x -= player.velocity;
      }

      this.players[player.id].weapon.position = {
        x: this.players[player.id].position.x + this.players[player.id].size.width / 2,
        y: this.players[player.id].position.y + this.players[player.id].size.height / 2,
      }
    });

    this.getShots().forEach(shot => {
      const { velocity } = shot;

      this.shots[shot.id].position.x = shot.position.x += velocity.x;
      this.shots[shot.id].position.y = shot.position.y += velocity.y;
    })
  }
}