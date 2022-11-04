import { Position, Size } from "../types";
import { GameObject, GameObjectProps } from "./GameObject";

export type PlayerMovement = {
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
}

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

type PlayerProps = {
  id: string;
  username: string;
  screen: PlayerScreen;
}

export class Player extends GameObject {
  username: string;

  move: PlayerMovement;

  screen: PlayerScreen;

  weapon: PlayerWeapon;

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
    });

    this.username = username;

    this.screen = screen;

    this.move = {
      up: false,
      down: false,
      left: false,
      right: false,
    }

    this.weapon = {
      rotation: 0,
      dx: 0,
      dy: 0,
      position: {
        x: 100 + 10 / 2,
        y: 100 + 16 / 2,
      },
      size: {
        width: 1,
        height: 5
      }
    }
  }
}