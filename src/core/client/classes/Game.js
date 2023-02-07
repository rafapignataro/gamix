const getTileColor = (tile) => {
  if (tile < 120) return '#6ab04c';
  if (tile >= 120 && tile < 140) return '#f6e58d';
  if (tile >= 140) return '#4834d4';
}

const circle = ({ context, x, y, radius, color }) => {
  context.beginPath();
  context.arc(
    x,
    y,
    radius,
    0,
    2 * Math.PI,
    false
  );
  context.fillStyle = color ?? 'black';
  context.fill();
};

const rect = ({ context, x, y, width, height, color }) => {
  context.fillStyle = color ?? 'black';
  context.fillRect(x, y, width, height);
};

const text = ({ context, x, y, text, color = 'black', font = 12, textAlign = 'start' }) => {
  context.fillStyle = color;
  context.font = `${font}px Silkscreen`;
  context.textAlign = textAlign;
  context.fillText(
    text,
    x,
    y
  );
}

window.Game = class Game {
  socket;

  canvas;

  context;

  gameObjects = new GameObjects();

  isPressingKey = false;

  camera;

  map = {
    tileSize: 0,
    tilesX: 0,
    tilesY: 0,
    width: 0,
    height: 0,
    tiles: [[]]
  };

  proportion = 2;

  status = '';

  images = {};

  inputs;

  screens;

  update;

  player = null;

  constructor({ socket, canvas, screens, setup, update }) {
    this.socket = socket;

    this.canvas = canvas;

    this.context = canvas.getContext('2d');

    this.proportion = (() => {
      const p = window.innerHeight / 960;

      if (p < 0.75) return 6;

      if (p >= 0.75 && p < 1) return 6;

      return 8;
    })();

    this.status = 'CONNECTING';

    this.inputs = new InputController();

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

  start(map) {
    this.status = 'CONNECTED';
    this.map = new Map(map, this.proportion);
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
    this.player = null;
    this.gameObjects.reset();
  }

  updateState({ players, shots }) {
    this.players = players;
    this.shots = shots;
  }

  setPlayer(player) {
    this.player = player;
  }

  addPlayer({ id, username, position, size }) {
    this.player = {
      id,
      username,
      move: {
        up: false,
        down: false,
        left: false,
        right: false,
      },
      size: {
        x: size
      },
      position: {
        x: position.x,
        y: position.y,
      }
    }
  }

  movePlayer(key, type) {
    const { player, socket } = this;

    if (!player) return;

    if (type !== 'down' && type !== 'up') return;
    if (key !== 'w' && key !== 's' && key !== 'a' && key !== 'd') return;

    if (type === 'down') {
      if (key === 'w') {
        if (!player.move.up) this.isPressingKey = true;
        player.move.up = true;
      }
      if (key === 's') {
        if (!player.move.up) this.isPressingKey = true;
        player.move.down = true;
      }
      if (key === 'a') {
        if (!player.move.up) this.isPressingKey = true;
        player.move.left = true;
      }
      if (key === 'd') {
        if (!player.move.up) this.isPressingKey = true;
        player.move.right = true;
      }

      if (this.isPressingKey) {
        socket.emit('PLAYER_MOVE', { id: player.id, input: player.move })
        this.isPressingKey = false;
      }

      return;
    }

    if (key === 'w') {
      player.move.up = false;
    }
    if (key === 's') {
      player.move.down = false;
    }
    if (key === 'a') {
      player.move.left = false;
    }
    if (key === 'd') {
      player.move.right = false;
    }

    socket.emit('PLAYER_MOVE', { id: player.id, input: player.move })
  }

  playerShot(clickX, clickY) {
    const { socket } = this;
    socket.emit('PLAYER_FIRE', {
      playerId: socket.id,
      mousePosition: {
        x: clickX,
        y: clickY
      }
    })
  }

  playerAim(clickX, clickY) {
    const { socket } = this;

    socket.emit('PLAYER_AIM', {
      playerId: socket.id,
      mousePosition: {
        x: clickX,
        y: clickY
      },
      cameraPosition: this.camera.position
    })
  }

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