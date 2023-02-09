import { Size } from "../types";

export class GameMap {
  tiles: number[][];

  tileSize: number;

  size: Size;

  tilesX = 0;

  tilesY = 0;


  constructor({ tiles, tileSize }: { tiles: number[][]; tileSize: number }, proportion: number) {
    this.tiles = tiles;

    this.tileSize = tileSize * proportion;

    this.tilesX = tiles[0].length;

    this.tilesY = tiles.length;

    this.size = {
      width: this.tilesX * this.tileSize,
      height: this.tilesY * this.tileSize,
    };
  }
}