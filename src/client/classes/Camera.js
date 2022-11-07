window.Camera = class Camera {
  context;

  size = {
    width: 0,
    height: 0,
  };

  position = {
    x: 0,
    y: 0,
  };

  proportion = 1;

  mapBoundaries;

  proportion;

  constructor({ context, size, position, mapBoundaries, proportion }) {
    this.context = context;

    this.size = size;

    this.context.canvas.width = this.size.width;
    this.context.canvas.height = this.size.height;

    this.position = position || { x: 0, y: 0 };

    this.mapBoundaries = mapBoundaries;

    this.proportion = proportion;
  }

  follow(player) {
    this.position.x = (player.position.x * this.proportion) - (this.size.width / 2) + (player.size.width * (this.proportion / 2));
    this.position.y = (player.position.y * this.proportion) - (this.size.height / 2) + (player.size.height * (this.proportion / 2));

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
      left: this.x + (this.width * 0.25),
      right: this.x + (this.width * 0.75),
      top: this.y + (this.height * 0.25),
      bottom: this.y + (this.height * 0.75)
    }
  }
}