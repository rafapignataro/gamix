import crypto from 'crypto';

import { Size, Position, Velocity, Movement, Collider } from "../types";
import { Game } from './Game';

export type GameObjectProps = {
  id?: string;
  position: Position;
  size: Size;
  velocity: Velocity;
  geometry?: 'BOX' | 'CIRCLE';
  colliders?: Record<string, Collider>;
  group?: string;
  movement?: Movement;
}

export type CreateGameObject = GameObjectProps

export type UpdateGameObject = Partial<GameObjectProps>;

export class GameObject {
  id: string;

  position: Position;

  velocity: Velocity;

  size: Size;

  geometry: 'BOX' | 'CIRCLE' = 'BOX';

  colliders: Record<string, Collider> = {};

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
    movement = undefined
  }: GameObjectProps) {
    this.id = id ?? crypto.randomUUID();

    this.position = position;

    this.velocity = velocity;

    this.size = size;

    this.geometry = geometry;

    this.group = group;

    if (movement) this.movement = movement;
  }

  addCollider(collider: Collider) {
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

  update(game: Game) {
    const { position, velocity, size, movement } = this;

    if (movement) {
      if (movement.up && position.y > 0) {
        position.y = position.y -= velocity.y;
      }
      if (movement.down && position.y + size.height + velocity.y <= game.map.size.height) {
        position.y = position.y += velocity.y;
      }
      if (movement.right && position.x + size.width + velocity.x <= game.map.size.width) {
        position.x = position.x += velocity.x;
      }
      if (movement.left && position.x > 0) {
        position.x = position.x -= velocity.x;
      }
    }

  }
}