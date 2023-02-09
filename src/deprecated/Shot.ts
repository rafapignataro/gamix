import crypto from 'crypto';
import { GameObject } from '../core/server/GameObject';
import { Position, Velocity } from '../core/types';

type ShotProps = {
  playerId: string;
  position: Position;
  velocity: Velocity;
}

export class Shot extends GameObject {
  playerId: string;

  createdAt: number;

  constructor({ playerId, position, velocity }: ShotProps) {
    super({
      id: crypto.randomUUID(),
      geometry: 'CIRCLE',
      size: {
        width: 0.3,
        height: 0.3,
      },
      position,
      velocity,
      group: 'shots',
    });

    this.playerId = playerId;

    this.createdAt = new Date().getTime();
  }

  update() {
    this.position.x = this.position.x += this.velocity.x;
    this.position.y = this.position.y += this.velocity.y;
  }
}