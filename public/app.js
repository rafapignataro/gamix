let SCREEN_STATE = 'INITIAL';

const formContainer = document.getElementById('form-container');
const enterForm = document.getElementById('enter-form');
const usernameInput = document.getElementById('username');
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

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
    if (this.position.x - this.size.width > 0 || this.position.x + this.size.width < this.mapBoundaries.x) {
      this.position.x = player.position.x - (this.size.width / 2) + (player.size.width * (this.proportion / 2));
    }

    if (this.position.x - this.size.width < -this.size.width) {
      this.position.x = 0;
    }

    if (this.position.y - this.size.height > 0 || this.position.y + this.size.height < this.mapBoundaries.y) {
      this.position.y = player.position.y - (this.size.height / 2) + (player.size.height * (this.proportion / 2));
    }

    if (this.position.y - this.size.height < -this.size.height) {
      this.position.y = 0;
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
    height: 0
  };

  proportion = 1;

  constructor({ socket, canvas, map }) {
    this.socket = socket;

    this.canvas = canvas;

    this.context = canvas.getContext('2d');

    this.proportion = (() => {
      const p = window.innerHeight / 960;

      if (p < 0.75) return 6;

      if (p >= 0.75 && p < 1) return 6

      if (p >= 1 && p < 1.5) return 12;

      return 16;
    })();

    this.map = {
      ...map,
      tileSize: map.tileSize * this.proportion,
      width: map.tileSize * map.tilesX * this.proportion,
      height: map.tileSize * map.tilesY * this.proportion,
    };

    this.camera = new Camera({
      context: this.context,
      size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      mapBoundaries: {
        x: this.map.width,
        y: this.map.height
      },
      proportion: this.proportion
    });
  }

  start() {
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
        const color = y === 0 || x === 0 || y === map.tilesY - 1 || x === map.tilesX - 1 ? 'darkgreen' : 'lightgreen';

        rect({
          context,
          x: x * map.tileSize - camera.position.x,
          y: y * map.tileSize - camera.position.y,
          width: map.tileSize,
          height: map.tileSize,
          color
        });

        context.beginPath();
        context.lineWidth = '1';
        context.strokeStyle = '#27ae60';
        context.rect(
          (x * map.tileSize) - camera.position.x,
          (y * map.tileSize) - camera.position.y,
          map.tileSize,
          map.tileSize,
        );
        context.stroke();
      }
    }

    if (this.player && players[this.player.id]) camera.follow(players[this.player.id]);

    let startY = 50;
    // Draw Players
    for (const player of Object.values(players)) {
      // Player Body
      rect({
        context,
        x: player.position.x - camera.position.x,
        y: player.position.y - camera.position.y,
        width: player.size.width * proportion,
        height: player.size.height * proportion,
        color: socket.id === player.id ? 'red' : 'blue'
      });

      const { width: usernameWidth } = context.measureText(player.username);

      text({
        context,
        text: player.username,
        x: (player.position.x - (usernameWidth / 2)) - camera.position.x,
        y: (player.position.y - 10) - camera.position.y,
        font: 16,
        color: socket.id === player.id ? 'red' : 'blue'
      });

      text({
        context,
        text: player.username,
        x: 25,
        y: startY,
        font: 24,
        color: socket.id === player.id ? 'red' : 'blue'
      });

      startY += 50;
    }

    // Draw Shots
    for (const shot of Object.values(shots)) {
      circle({
        context,
        x: shot.position.x - camera.position.x,
        y: shot.position.y - camera.position.y,
        radius: shot.radius * proportion,
        color: 'black'
      })
    }

    if (this.player && players[this.player.id]) {
      const player = players[this.player.id];

      text({
        context,
        text: `X: ${player.position.x * proportion}`,
        x: camera.size.width - 125,
        y: 50,
        font: 24,
        color: 'white'
      });

      text({
        context,
        text: `Y: ${player.position.y * proportion}`,
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
    map: {
      tileSize: 32,
      tilesX: 30,
      tilesY: 30,
    }
  });

  socket.on('connect', (connection) => {
    game.start();

    enterForm.onsubmit = (event) => {
      event.preventDefault();

      if (usernameInput.value === '') return;

      socket.emit('JOIN_GAME', {
        id: socket.id,
        username: usernameInput.value
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