import type { Server } from 'socket.io';

export type Position = {
  x: number;
  y: number;
}

export type Size = {
  width: number;
  height: number;
}

export type Player = {
  id: string;
  username: string;
  move: {
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
  },
  velocity: number;
  size: Size;
  position: Position;
  screen: PlayerScreen;
  weapon: {
    rotation: number;
    dx: number;
    dy: number;
    position: Position;
    size: Size;
  }
}

export type CreateShotProps = {
  playerId: string;
  angle: number;
}

export type Shot = {
  id: string;
  playerId: string;
  position: Position;
  radius: number;
  velocity: Position;
  createdAt: string;
}

export type GameConfig = {
  map: {
    tiles: number[][];
    tileSize: number;
  };
  ioServer: Server;
  fps?: number;
}

export type Map = {
  tiles: number[][];
  width: number;
  height: number;
  tilesX: number;
  tilesY: number;
  tileSize: number;
}

export type PlayerScreen = {
  size: Size;
}

export type AddPlayerProps = {
  id: string;
  username: string;
  screen: PlayerScreen;
}

export type Message = {
  player: {
    id: string;
    username: string;
  }
  text: string;
  timestamp: string;
}

export type MessagesConfig = {
  ioServer: Server;
}