export class TileMapGenerator {
  private gradients: Record<string, { x: number, y: number }>;

  private memory: Record<string, number>;

  tiles: number[][];

  constructor(tilesX: number, tilesY: number) {
    this.gradients = {};
    this.memory = {};

    let tiles: number[][] = [];
    const COLOR_SCALE = 254;

    for (let y = 0; y < tilesY; y += 1) {
      tiles[y] = [];

      for (let x = 0; x < tilesX; x += 1) {
        let v = Math.floor(this.get(x / 10, y / 10) * COLOR_SCALE);

        if (v < 0) {
          v = Math.abs(v / 2)
        } else if (v >= 0) {
          v = (COLOR_SCALE / 2) + (v / 2)
        }

        tiles[y][x] = v;
      }
    }

    this.tiles = tiles;
  }

  rand_vect() {
    let theta = Math.random() * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  }

  dot_prod_grid(x: number, y: number, vx: number, vy: number) {
    let g_vect;
    let d_vect = { x: x - vx, y: y - vy };
    if (this.gradients[`[${vx}, ${vy}]`]) {
      g_vect = this.gradients[`[${vx}, ${vy}]`];
    } else {
      g_vect = this.rand_vect();
      this.gradients[`[${vx}, ${vy}]`] = g_vect;
    }
    return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
  }

  smootherstep(x: number) {
    return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  }

  interp(x: number, a: number, b: number) {
    return a + this.smootherstep(x) * (b - a);
  }

  get(x: number, y: number) {
    if (this.memory.hasOwnProperty(`[${x}, ${y}]`)) return this.memory[`[${x}, ${y}]`];

    let xf = Math.floor(x);
    let yf = Math.floor(y);
    //interpolate
    let tl = this.dot_prod_grid(x, y, xf, yf);
    let tr = this.dot_prod_grid(x, y, xf + 1, yf);
    let bl = this.dot_prod_grid(x, y, xf, yf + 1);
    let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
    let xt = this.interp(x - xf, tl, tr);
    let xb = this.interp(x - xf, bl, br);
    let v = this.interp(y - yf, xt, xb);
    this.memory[`[${x}, ${y}]`] = v;
    return v;
  }
}