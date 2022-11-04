import { Size, Position } from "../types";

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

type GameObjectProps = {
  position: Position;
  size: Size;
  geometry: 'BOX' | 'CIRCLE';
  colliders?: Record<string, BoxCollider | CircleCollider>;
  group?: string;
}

export class GameObject {
  id: string;

  position: Position;

  size: Size;

  geometry: 'BOX' | 'CIRCLE' = 'BOX';

  colliders: Record<string, BoxCollider | CircleCollider> = {};

  group?: string;

  constructor({ position, size, geometry = 'BOX', group = undefined }: GameObjectProps) {
    this.id = crypto.randomUUID();

    this.position = position;

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