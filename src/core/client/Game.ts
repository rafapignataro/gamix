import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Camera } from "./Camera";
import { GameMap } from "./GameMap";
import { GameObjects } from "./GameObjects";
import { InputController } from "./InputController";
import { Players } from "./Players";
import { GameScreen, ScreenController } from "./ScreenController";



type GameImage = {
  img: HTMLImageElement
  loaded: boolean;
}

type GameProps = {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  canvas: HTMLCanvasElement;
  screens: Record<string, GameScreen>;
  setup: (game: Game) => void;
  update: (game: Game) => void;
}

export class Game {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;

  canvas: HTMLCanvasElement;

  context: CanvasRenderingContext2D;

  gameObjects = new GameObjects();

  players = new Players();

  isPressingKey = false;

  camera?: Camera;

  map?: GameMap;

  proportion = 2;

  status = 'CONNECTING';

  images: Record<string, GameImage> = {};

  inputs = new InputController();

  screens;

  update;

  constructor({ socket, canvas, screens, setup, update }: GameProps) {
    this.socket = socket;

    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) throw new Error('Canvas context not found');

    this.context = context;

    this.proportion = (() => {
      const p = window.innerHeight / 960;

      if (p < 0.75) return 6;

      if (p >= 0.75 && p < 1) return 6;

      return 8;
    })();

    this.screens = new ScreenController(screens);

    this.images = {
      grassTileset: (() => {
        const img = new Image();
        img.src = 'img/grass-tileset.png';
        return {
          img,
          loaded: false
        };
      })(),
    }

    Object.keys(this.images).forEach(imageKey => {
      const image = this.images[imageKey];
      image.img.onload = () => image.loaded = true;
    });

    setup(this);

    this.update = update;
  }

  start(map: GameMap) {
    this.status = 'CONNECTED';
    this.map = new GameMap(map, this.proportion);
    this.camera = new Camera({
      context: this.context,
      size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      mapBoundaries: this.map.size,
      proportion: this.proportion
    });

    window.requestAnimationFrame(this.render.bind(this));
  }

  reset() {
    this.gameObjects.reset();
  }

  // addPlayer({ id, username, position, size }) {
  //   this.player = {
  //     id,
  //     username,
  //     move: {
  //       up: false,
  //       down: false,
  //       left: false,
  //       right: false,
  //     },
  //     size: {
  //       x: size
  //     },
  //     position: {
  //       x: position.x,
  //       y: position.y,
  //     }
  //   }
  // }

  // movePlayer(key, type) {
  //   const { player, socket } = this;

  //   if (!player) return;

  //   if (type !== 'down' && type !== 'up') return;
  //   if (key !== 'w' && key !== 's' && key !== 'a' && key !== 'd') return;

  //   if (type === 'down') {
  //     if (key === 'w') {
  //       if (!player.move.up) this.isPressingKey = true;
  //       player.move.up = true;
  //     }
  //     if (key === 's') {
  //       if (!player.move.up) this.isPressingKey = true;
  //       player.move.down = true;
  //     }
  //     if (key === 'a') {
  //       if (!player.move.up) this.isPressingKey = true;
  //       player.move.left = true;
  //     }
  //     if (key === 'd') {
  //       if (!player.move.up) this.isPressingKey = true;
  //       player.move.right = true;
  //     }

  //     if (this.isPressingKey) {
  //       socket.emit('PLAYER_MOVE', { id: player.id, input: player.move })
  //       this.isPressingKey = false;
  //     }

  //     return;
  //   }

  //   if (key === 'w') {
  //     player.move.up = false;
  //   }
  //   if (key === 's') {
  //     player.move.down = false;
  //   }
  //   if (key === 'a') {
  //     player.move.left = false;
  //   }
  //   if (key === 'd') {
  //     player.move.right = false;
  //   }

  //   socket.emit('PLAYER_MOVE', { id: player.id, input: player.move })
  // }

  // playerShot(clickX, clickY) {
  //   const { socket } = this;
  //   socket.emit('PLAYER_FIRE', {
  //     playerId: socket.id,
  //     mousePosition: {
  //       x: clickX,
  //       y: clickY
  //     }
  //   })
  // }

  // playerAim(clickX, clickY) {
  //   const { socket } = this;

  //   socket.emit('PLAYER_AIM', {
  //     playerId: socket.id,
  //     mousePosition: {
  //       x: clickX,
  //       y: clickY
  //     },
  //     cameraPosition: this.camera.position
  //   })
  // }

  _update() {
    if (Object.values(this.images).some(image => !image.loaded)) return;

    this.update(this);
  }

  render() {
    if (this.status !== 'CONNECTED') return;

    this._update();

    window.requestAnimationFrame(this.render.bind(this));
  }
}