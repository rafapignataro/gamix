window.Map = class Map {
  tiles = [[]];

  tileSize = 0;

  size = {
    x: 0,
    y: 0
  };

  tilesX = 0;

  tilesY = 0;


  constructor({ tiles, tileSize }, proportion) {
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