import { Size } from "../types";

import { TileMapGenerator } from "./TileMapGenerator";

type MapProps = {
  tilesX: number;
  tilesY: number;
  tileSize: number
}

export class Map {
  tiles: number[][];

  tileSize: number;

  size: Size;

  tilesX: number;

  tilesY: number;

  constructor({ tilesX, tilesY, tileSize }: MapProps) {
    const mapGenerator = new TileMapGenerator(tilesX, tilesY);

    this.tiles = mapGenerator.tiles;

    this.tileSize = tileSize;

    this.tilesX = this.tiles[0].length;

    this.tilesY = this.tiles.length;

    this.size = {
      width: this.tilesX * tileSize,
      height: this.tilesY * tileSize,
    };
  }
}