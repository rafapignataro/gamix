import { Position, Size } from "../types";
import { GameObject } from "./GameObject";

type CameraProps = {
  context: CanvasRenderingContext2D;
  size: Size;
  position?: Position;
  mapBoundaries: Size;
  proportion: number;
}

export class Camera {
  context;

  size: Size;

  position: Position;

  proportion = 1;

  mapBoundaries;

  constructor({ context, size, position, mapBoundaries, proportion }: CameraProps) {
    this.context = context;

    this.size = size;

    this.context.canvas.width = this.size.width;
    this.context.canvas.height = this.size.height;

    this.position = position || { x: 0, y: 0 };

    this.mapBoundaries = mapBoundaries;

    this.proportion = proportion;
  }

  follow(gameObject: GameObject) {
    this.position.x = (gameObject.position.x * this.proportion) - (this.size.width / 2) + (gameObject.size.width * (this.proportion / 2));
    this.position.y = (gameObject.position.y * this.proportion) - (this.size.height / 2) + (gameObject.size.height * (this.proportion / 2));

    if (this.position.x - this.size.width < -this.size.width) {
      this.position.x = 0;
    }

    if (this.position.x + this.size.width > this.mapBoundaries.width + 1) {
      this.position.x = this.mapBoundaries.width - this.size.width;
    }


    if (this.position.y - this.size.height < -this.size.height) {
      this.position.y = 0;
    }

    if (this.position.y + this.size.height > this.mapBoundaries.height) {
      this.position.y = this.mapBoundaries.height - this.size.height;
    }
  }

  getEdges() {
    return {
      left: this.position.x + (this.size.width * 0.25),
      right: this.position.x + (this.size.width * 0.75),
      top: this.position.y + (this.size.height * 0.25),
      bottom: this.position.y + (this.size.height * 0.75)
    }
  }
}