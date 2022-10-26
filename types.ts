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
  size: {
    width: number,
    height: number,
  },
  position: {
    x: number,
    y: number,
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
    width: number;
    height: number;
  }
  ioServer: Server;
  fps?: number;
}

export type Map = {
  width: number;
  height: number;
}

export type AddPlayerProps = {
  id: string;
  username: string;
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