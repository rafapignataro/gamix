import crypto from 'crypto';

import { Size, Position, Velocity } from "../types";

type BoxCollider = {
  name: string;
  type: 'BOX',
  size: Size;
  position: Position;
};

type CircleCollider = {
  name: string;
  type: 'CIRCLE',
  radius: Number;
  position: Position;
}

export type GameObjectProps = {
  id?: string;
  position: Position;
  size: Size;
  velocity: Velocity;
  geometry?: 'BOX' | 'CIRCLE';
  colliders?: Record<string, BoxCollider | CircleCollider>;
  group?: string;
}

export class GameObject {
  id: string;

  position: Position;

  velocity: Velocity;

  size: Size;

  geometry: 'BOX' | 'CIRCLE' = 'BOX';

  colliders: Record<string, BoxCollider | CircleCollider> = {};

  group?: string;

  children: Record<string, GameObject> = {};

  constructor({
    id,
    position,
    size,
    velocity,
    geometry = 'BOX',
    group = undefined
  }: GameObjectProps) {
    this.id = id ?? crypto.randomUUID();

    this.position = position;

    this.velocity = velocity;

    this.size = size;

    this.geometry = geometry;

    this.group = group;
  }

  updatePosition(position: Position) {
    this.position = position;
  }

  addCollider(collider: CircleCollider | BoxCollider) {
    this.colliders[collider.name] = collider;
  }
}