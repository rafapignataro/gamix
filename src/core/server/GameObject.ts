import crypto from 'crypto';

import { Size, Position, Velocity, Movement } from "../types";
import { Game } from './Game';

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

export type CreateGameObject = GameObjectProps

export type UpdateGameObject = Partial<GameObjectProps>;

export class GameObject {
  id: string;

  position: Position;

  velocity: Velocity;

  size: Size;

  geometry: 'BOX' | 'CIRCLE' = 'BOX';

  colliders: Record<string, BoxCollider | CircleCollider> = {};

  group?: string;

  children: Record<string, GameObject> = {};

  movement?: Movement;

  constructor({
    id,
    position,
    size,
    velocity,
    geometry = 'BOX',
    group = undefined,
  }: GameObjectProps) {
    this.id = id ?? crypto.randomUUID();

    this.position = position;

    this.velocity = velocity;

    this.size = size;

    this.geometry = geometry;

    this.group = group;

  }

  addCollider(collider: CircleCollider | BoxCollider) {
    this.colliders[collider.name] = collider;
  }

  setPosition(position: Position) {
    this.position = position;
  }

  setSize(size: Size) {
    this.size = size;
  }

  setVelocity(velocity: Velocity) {
    this.velocity = velocity;
  }

  setMovement(movement: Movement) {
    this.movement = movement;
  }

  update(game: Game) { }
}