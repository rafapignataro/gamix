import { Server } from "socket.io";
import crypto from 'crypto';

import { Position } from "../types";
import { Map } from "./Map";
import { GameObject } from "./GameObject";
import { Player, PlayerScreen } from "./Player";
import { Shot } from "./Shot";

export type AddPlayerProps = {
  id: string;
  username: string;
  screen: PlayerScreen;
}

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
    this.fps = config.fps || 1000 / 30;
    this.players = {};
    this.shots = {};
  }

  start() {
    this.status = 'RUNNING';

    this.gameLoop = setInterval(() => {
      this.update();

      this.websocket.sockets.emit('GAME_STATE', this.getGameState())
    }, this.fps);
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
    const player = new Player({
      id,
      username,
      screen
    });

    this.players[player.id] = player;
  }

  movePlayer({ id: playerId, move }: Player) {
    const player = this.players[playerId];

    if (!player) return;

    this.players[playerId].move = move;
  }

  removePlayer(playerId: string) {
    delete this.players[playerId];

    if (!this.getPlayersCount() && this.gameLoop) this.stop();
  }

  getPlayersCount() {
    return Object.keys(this.players).length;
  }

  playerAim({ playerId, mousePosition, cameraPosition }: { playerId: string, mousePosition: Position, cameraPosition: Position }) {
    const player = this.players[playerId];

    if (!player) return;

    player.updateAim({
      cameraPosition,
      mousePosition
    });
  }

  // Shots
  addShot({ playerId }: { playerId: string }) {
    if (!this.players[playerId]) return;

    const player = this.players[playerId];
    const playerShots = this.getShots().filter(shot => shot.playerId === player.id);

    if (playerShots.length) {
      const lastShot = playerShots[playerShots.length - 1];
      const now = new Date().getTime();
      const lastShotTime = new Date(lastShot.createdAt).getTime();

      if (now - lastShotTime < 250) return;
    }

    const shot = new Shot({
      playerId,
      position: {
        x: player.weapon.position.x,
        y: player.weapon.position.y,
      },
      velocity: {
        x: player.weapon.dx * 10,
        y: player.weapon.dy * 10
      },
    });

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
      player.update({
        map: this.map
      })
    });

    this.getShots().forEach(shot => {
      const { velocity } = shot;

      this.shots[shot.id].position.x = shot.position.x += velocity.x;
      this.shots[shot.id].position.y = shot.position.y += velocity.y;

      if (
        this.shots[shot.id].position.x > this.map.size.width ||
        this.shots[shot.id].position.y > this.map.size.height
      ) {
        delete this.shots[shot.id];
      }
    });
  }
}