let SCREEN_STATE = 'INITIAL';

const formContainer = document.getElementById('form-container');
const enterForm = document.getElementById('enter-form');
const usernameInput = document.getElementById('username');
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

const getTileColor = (tile) => {
  if (tile === 0) return '#6ab04c';
  if (tile === 1) return '#f6e58d';
  if (tile === 2) return '#4834d4';

  return 'black';
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

const text = ({ context, x, y, text, color, font }) => {
  context.fillStyle = color ?? 'black';
  context.font = `${font ?? '12'}px Silkscreen`;
  context.fillText(
    text,
    x,
    y
  );
}

class Map {
  tiles = [[]];

  tileSize = 0;

  size = 0;

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

class Camera {
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

class GameClient {
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

  constructor({ socket, canvas }) {
    this.socket = socket;

    this.canvas = canvas;

    this.context = canvas.getContext('2d');

    this.proportion = (() => {
      const p = window.innerHeight / 960;

      if (p < 0.75) return 6;

      if (p >= 0.75 && p < 1) return 8;

      return 12;
    })();

    this.status = 'CONNECTING';
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
    const { canvas, socket } = this;

    const rect = canvas.getBoundingClientRect()

    const mouseX = clickX - rect.x;
    const mouseY = clickY - rect.y;

    socket.emit('USER_FIRE', {
      playerId: socket.id,
      mousePosition: {
        x: mouseX,
        y: mouseY
      }
    })
  }

  update() {
    const { context, camera, socket, map, players, shots, proportion } = this;

    for (let y = 0; y < map.tilesY; y++) {
      for (let x = 0; x < map.tilesX; x++) {
        const tile = map.tiles[y][x];

        rect({
          context,
          x: x * map.tileSize - camera.position.x,
          y: y * map.tileSize - camera.position.y,
          width: map.tileSize,
          height: map.tileSize,
          color: getTileColor(tile)
        });

        // context.beginPath();
        // context.lineWidth = '1';
        // context.strokeStyle = '#fff';
        // context.rect(
        //   (x * map.tileSize) - camera.position.x,
        //   (y * map.tileSize) - camera.position.y,
        //   map.tileSize,
        //   map.tileSize,
        // );
        // context.stroke();
      }
    }

    if (this.player && players[this.player.id]) camera.follow(players[this.player.id]);

    let startY = 50;
    // Draw Players
    for (const player of Object.values(players)) {
      if (socket.id === player.id) this.player = player;
      // Player Body
      rect({
        context,
        x: (player.position.x * this.proportion) - camera.position.x,
        y: (player.position.y * this.proportion) - camera.position.y,
        width: player.size.width * proportion,
        height: player.size.height * proportion,
        color: socket.id === player.id ? '#eb4d4b' : '#130f40'
      });

      text({
        context,
        text: player.username,
        x: (player.position.x * this.proportion) - camera.position.x,
        y: (player.position.y * this.proportion) - 10 - camera.position.y,
        font: 16,
        color: socket.id === player.id ? '#eb4d4b' : '#130f40'
      });

      text({
        context,
        text: player.username,
        x: 25,
        y: startY,
        font: 24,
        color: socket.id === player.id ? '#eb4d4b' : '#130f40'
      });

      startY += 50;
    }

    // Draw Shots
    for (const shot of Object.values(shots)) {
      circle({
        context,
        x: (shot.position.x * this.proportion) - camera.position.x,
        y: (shot.position.y * this.proportion) - camera.position.y,
        radius: shot.radius * proportion,
        color: 'black'
      })
    }

    if (this.player && players[this.player.id]) {
      const player = players[this.player.id];

      text({
        context,
        text: `X: ${player.position.x}`,
        x: camera.size.width - 125,
        y: 50,
        font: 24,
        color: 'white'
      });

      text({
        context,
        text: `Y: ${player.position.y}`,
        x: camera.size.width - 125,
        y: 75,
        font: 24,
        color: 'white'
      });

    }

    // // Draw Y Axis
    // context.beginPath();
    // context.moveTo(camera.size.width / 2, 0);
    // context.lineTo(camera.size.width / 2, camera.size.height);
    // context.stroke();

    // // Draw X Axis
    // context.beginPath();
    // context.moveTo(0, camera.size.height / 2);
    // context.lineTo(camera.size.width, camera.size.height / 2);
    // context.stroke();
  }

  render() {
    if (this.status !== 'CONNECTED') return;

    this.update();

    window.requestAnimationFrame(this.render.bind(this));
  }
}

isTypingMessage = false;

window.onload = () => {
  const socket = io('http://localhost:4444');

  const canvas = document.getElementById('canvas');

  const game = new GameClient({
    socket,
    canvas,
  });

  socket.on('connect', (connection) => {
    enterForm.onsubmit = (event) => {
      event.preventDefault();

      if (usernameInput.value === '') return;

      if (!game.status === 'CONNECTED') return;

      socket.emit('JOIN_GAME', {
        id: socket.id,
        username: usernameInput.value,
        screen: {
          size: game.map.size,
        }
      });

      formContainer.style.display = 'none'
    }

    chatForm.onsubmit = (event) => {
      event.preventDefault();

      socket.emit('USER_SENT_MESSAGE', {
        player: {
          id: game.player.id,
          username: game.player.username,
        },
        text: chatInput.value
      });
      chatInput.value = '';
    }

    window.onkeydown = (event) => {
      if (isTypingMessage) return;

      game.movePlayer(event.key, 'down');
    }

    window.onkeyup = (event) => {
      if (isTypingMessage) return;

      game.movePlayer(event.key, 'up');
    }

    window.onmousedown = (event) => {
      if (isTypingMessage) return;

      game.playerShot(event.clientX, event.clientY)
    }

    socket.on('GAME_MAP', map => {
      game.start(map);
    })

    socket.on('GAME_STATE', (state) => {
      game.updateState(JSON.parse(state))
    });

    socket.on('JOINED_GAME', (player) => {
      game.addPlayer(player)
    });

    socket.on('NEW_MESSAGE', (message) => {
      const playerId = message.player.id;
      const username = message.player.username;
      const text = message.text;
      const timestamp = new Date(message.timestamp);

      const chatMessage = document.createElement('div');
      chatMessage.className = 'chat-message';

      const messageContent = document.createElement('div');
      messageContent.className = playerId === game.player.id ? 'user-message' : 'enemy-message';

      const chatMessageHeader = document.createElement('div');
      chatMessageHeader.className = 'chat-message-header';

      const chatMessageBody = document.createElement('div');
      chatMessageBody.className = 'chat-message-body';

      const messageUsername = document.createElement('p');
      messageUsername.className = 'chat-message-username';
      messageUsername.innerText = username;

      const messageText = document.createElement('p');
      messageText.className = 'chat-message-text';
      messageText.innerText = text;

      const messageTimestamp = document.createElement('p');
      messageTimestamp.className = 'chat-message-timestamp';
      messageTimestamp.innerText = `${timestamp.getHours()}:${timestamp.getMinutes()}`;

      chatMessageHeader.appendChild(messageUsername);
      chatMessageHeader.appendChild(messageTimestamp);
      chatMessageBody.appendChild(messageText);

      messageContent.appendChild(chatMessageHeader);
      messageContent.appendChild(chatMessageBody);

      chatMessage.appendChild(messageContent);

      messagesContainer.appendChild(chatMessage);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    socket.on('disconnect', () => {
      game.reset();
      SCREEN_STATE = 'INITIAL';
      formContainer.style.display = 'flex'
    })
  })
}

chatInput.onfocus = () => isTypingMessage = true;
chatInput.onblur = () => isTypingMessage = false;