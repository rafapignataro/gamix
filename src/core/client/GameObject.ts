import { Collider, Movement, Position, Size, Velocity } from "../types";
import { Game } from "./Game";

export type GameObjectProps = {
  id: string;
  position: Position;
  size: Size;
  velocity: Velocity;
  geometry: 'BOX' | 'CIRCLE';
  colliders?: Record<string, Collider>;
  group?: string;
  movement?: Movement;
}

export class GameObject {
  id;

  position;

  velocity;

  size;

  geometry;

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
    this.id = id;

    this.position = position;

    this.velocity = velocity;

    this.size = size;

    this.geometry = geometry;

    this.group = group;

    if (movement) this.movement = movement;

  }

  update(game: Game) { }
}