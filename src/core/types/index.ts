export type Position = {
  x: number;
  y: number;
}

export type Velocity = {
  x: number;
  y: number;
}

export type Size = {
  width: number;
  height: number;
}

export type Shot = {
  id: string;
  playerId: string;
  position: Position;
  radius: number;
  velocity: Position;
  createdAt: string;
}

export type Map = {
  tiles: number[][];
  width: number;
  height: number;
  tilesX: number;
  tilesY: number;
  tileSize: number;
}

export type Screen = {
  size: Size;
  proportion: number;
}

export type Movement = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type BoxCollider = {
  name: string;
  type: 'BOX',
  size: Size;
  position: Position;
};

export type CircleCollider = {
  name: string;
  type: 'CIRCLE',
  radius: Number;
  position: Position;
}

export type Collider = BoxCollider | CircleCollider;