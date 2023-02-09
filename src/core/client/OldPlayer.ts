import { Movement, Position, Size } from "../types";
import { Game } from "./Game";
import { GameObject } from "./GameObject";


export type PlayerWeapon = {
  rotation: number;
  dx: number;
  dy: number;
  position: Position;
  size: Size;
}

export type PlayerScreen = {
  size: Size;
  proportion: number;
}

export type PlayerProps = {
  id: string;
  username: string;
  screen: PlayerScreen;
}

export class Player extends GameObject {
  username: string;

  movement: Movement;

  screen: PlayerScreen;

  // weapon: PlayerWeapon;

  constructor({ id, username, screen }: PlayerProps) {
    super({
      id,
      velocity: {
        x: 2,
        y: 2,
      },
      size: {
        width: 8,
        height: 16,
      },
      position: {
        x: 100,
        y: 100
      },
      group: 'players',
      geometry: 'BOX'
    });

    this.username = username;

    this.screen = screen;

    this.movement = {
      up: false,
      down: false,
      left: false,
      right: false,
    }

    // this.weapon = {
    //   rotation: 0,
    //   dx: 0,
    //   dy: 0,
    //   position: {
    //     x: 100 + 10 / 2,
    //     y: 100 + 16 / 2,
    //   },
    //   size: {
    //     width: 1,
    //     height: 5
    //   }
    // }
  }

  update({ map }: Game) {
    if (!map) return;

    if (this.movement.up && this.position.y > 0) {
      this.position.y = this.position.y -= this.velocity.y;
    }
    if (this.movement.down && this.position.y + this.size.height + this.velocity.y <= map.size.height) {
      this.position.y = this.position.y += this.velocity.y;
    }
    if (this.movement.right && this.position.x + this.size.width + this.velocity.x <= map.size.width) {
      this.position.x = this.position.x += this.velocity.x;
    }
    if (this.movement.left && this.position.x > 0) {
      this.position.x = this.position.x -= this.velocity.x;
    }

    // this.weapon.position = {
    //   x: this.position.x + this.size.width / 2,
    //   y: this.position.y + this.size.height / 2,
    // }
  }

  // updateAim({ cameraPosition, mousePosition }: { cameraPosition: Position, mousePosition: Position }) {
  //   const startPosition = {
  //     x: this.position.x + (this.size.width / 2),
  //     y: this.position.y + (this.size.height / 2),
  //   };

  //   const endPosition = {
  //     x: Math.round((cameraPosition.x + mousePosition.x) / this.screen.proportion),
  //     y: Math.round((cameraPosition.y + mousePosition.y) / this.screen.proportion),
  //   };

  //   const xDistance = endPosition.x - startPosition.x;
  //   const yDistance = endPosition.y - startPosition.y;
  //   const directDistance = Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));

  //   let rotation = Math.atan2(yDistance, xDistance) * 180 / Math.PI;

  //   if (rotation < 0) rotation = 180 + (180 - Math.abs(rotation))

  //   const dx = xDistance / directDistance;
  //   const dy = yDistance / directDistance;

  //   this.weapon = {
  //     ...this.weapon,
  //     rotation,
  //     dx,
  //     dy,
  //   }
  // }
}