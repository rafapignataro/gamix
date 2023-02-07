window.GameObject = class GameObject {
  id;

  position;

  velocity;

  size;

  geometry;

  colliders;

  group;

  children;

  movement;

  constructor({
    id,
    position,
    size,
    velocity,
    geometry = 'BOX',
    group = undefined,
  }) {
    this.id = id;

    this.position = position;

    this.velocity = velocity;

    this.size = size;

    this.geometry = geometry;

    this.group = group;
  }

  update(game) { }
}