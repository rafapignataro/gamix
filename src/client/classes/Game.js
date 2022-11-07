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

  player = null;

  players = {};

  shots = {};

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

  constructor({ socket, canvas, screens }) {
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
    this.players = {};
    this.shots = {};
  }

  updateState({ players, shots }) {
    this.players = players;
    this.shots = shots;
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
        socket.emit('PLAYER_MOVE', player)
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

    socket.emit('PLAYER_MOVE', player)
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

  update() {
    const { context, camera, socket, map, players, shots, proportion } = this;

    if (Object.values(this.images).some(image => !image.loaded)) return;

    for (let y = 0; y < map.tilesY; y++) {
      for (let x = 0; x < map.tilesX; x++) {
        const tile = map.tiles[y][x];

        if (tile < 110) {
          context.drawImage(
            this.images['grassTileset'].img,
            0, 0,
            128, 128,
            x * map.tileSize - camera.position.x, y * map.tileSize - camera.position.y,
            map.tileSize, map.tileSize
          )
        } else if (tile >= 110 && tile < 145) {
          rect({
            context,
            x: x * map.tileSize - camera.position.x,
            y: y * map.tileSize - camera.position.y,
            width: map.tileSize,
            height: map.tileSize,
            color: getTileColor(tile)
          });
        } else {
          rect({
            context,
            x: x * map.tileSize - camera.position.x,
            y: y * map.tileSize - camera.position.y,
            width: map.tileSize,
            height: map.tileSize,
            color: getTileColor(tile)
          });
        }
      }
    }

    if (this.player && players[this.player.id]) camera.follow(players[this.player.id]);

    // Draw Players
    for (const player of Object.values(players)) {
      if (socket.id === player.id) this.player = player;
      // Player Body
      rect({
        context,
        x: (player.position.x * proportion) - camera.position.x,
        y: (player.position.y * proportion) - camera.position.y,
        width: player.size.width * proportion,
        height: player.size.height * proportion,
        color: socket.id === player.id ? '#130f40' : '#eb4d4b'
      });

      rect({
        context,
        x: (player.position.x * proportion) - camera.position.x + (2 * proportion),
        y: (player.position.y * proportion) - camera.position.y + (2 * proportion),
        width: 1 * proportion,
        height: 2 * proportion,
        color: '#fff'
      });

      rect({
        context,
        x: (player.position.x * proportion) - camera.position.x + (5 * proportion),
        y: (player.position.y * proportion) - camera.position.y + (2 * proportion),
        width: 1 * proportion,
        height: 2 * proportion,
        color: '#fff'
      });

      context.save();
      context.translate(
        ((player.position.x + (player.size.width / 2)) * proportion) - camera.position.x,
        ((player.position.y + (player.size.height / 2)) * proportion) - camera.position.y
      );
      context.rotate(player.weapon.rotation * Math.PI / 180);
      rect({
        context,
        x: 0,
        y: 0,
        width: 10 * proportion,
        height: 1 * proportion,
        color: 'black'
      });
      context.restore();

      text({
        context,
        text: player.username,
        x: (player.position.x * proportion) - camera.position.x,
        y: (player.position.y * proportion) - 10 - camera.position.y,
        font: 16,
        color: socket.id === player.id ? '#130f40' : '#eb4d4b'
      });
    }

    // Draw Shots
    for (const shot of Object.values(shots)) {
      circle({
        context,
        x: (shot.position.x * this.proportion) - camera.position.x,
        y: (shot.position.y * this.proportion) - camera.position.y,
        radius: shot.size.width * proportion,
        color: 'black'
      })
    }

    if (this.player && players[this.player.id]) {
      const player = players[this.player.id];

      text({
        context,
        text: `X: ${player.position.x} | Y: ${player.position.y}`,
        x: 25,
        y: 50,
        font: 24,
        color: 'white'
      });
    }
  }

  render() {
    if (this.status !== 'CONNECTED') return;

    this.update();

    window.requestAnimationFrame(this.render.bind(this));
  }
}