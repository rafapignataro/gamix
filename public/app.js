const PROPORTION = 2.5;
const TILES_X = 30;
const TILES_Y = 30;
const TILE_SIZE = 32 * 2 * 2;
const MAP_WIDTH = TILES_X * TILE_SIZE;
const MAP_HEIGHT = TILES_Y * TILE_SIZE;
const CAMERA_SIZES = [
  { width: 640, height: 360 },
  { width: 960, height: 540 },
  { width: 1280, height: 720 },
];

let SCREEN_STATE = 'INITIAL';

const formContainer = document.getElementById('form-container');
const enterForm = document.getElementById('enter-form');
const usernameInput = document.getElementById('username');
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

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

  constructor({ context, size, position }) {
    this.context = context;

    this.size = size;

    this.context.canvas.width = 960;
    this.context.canvas.height = 960;

    this.position = position || { x: 0, y: 0 }
  }

  follow(player) {
    if (this.position.x - this.size.width > 0 || this.position.x + this.size.width < MAP_WIDTH) {
      this.position.x = player.position.x - (this.size.width / 2) - (player.size.width / 2);
    }

    if (this.position.x - this.size.width < -960) {
      this.position.x = 0;
    }

    if (this.position.y - this.size.height > 0 || this.position.y + this.size.height < MAP_HEIGHT) {
      this.position.y = player.position.y - (this.size.height / 2) - (player.size.height / 2);
    }

    if (this.position.y - this.size.height < -960) {
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

  map;

  constructor({ socket, canvas }) {
    this.socket = socket;

    this.canvas = canvas;

    this.context = canvas.getContext('2d');



    this.camera = new Camera({
      context: this.context,
      size: {
        width: 960,
        height: 960
      }
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
    const { player } = this;

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
        this.socket.emit('PLAYER_MOVE', player)
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

    this.socket.emit('PLAYER_MOVE', player)
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

  positionByCamera() {

  }

  sizeByProportion() {

  }

  update() {
    for (let y = 0; y < TILES_Y; y++) {
      for (let x = 0; x < TILES_X; x++) {
        if (y === 0 || x === 0 || y === TILES_Y - 1 || x === TILES_X - 1) {
          this.context.fillStyle = 'darkgreen';
        } else {
          this.context.fillStyle = 'lightgreen';
        }
        this.context.fillRect(x * TILE_SIZE - this.camera.position.x, y * TILE_SIZE - this.camera.position.y, TILE_SIZE, TILE_SIZE);
      }
    }

    if (this.player && this.players[this.player.id]) this.camera.follow(this.players[this.player.id]);

    let startY = 50;
    // Draw Players
    for (const player of Object.values(this.players)) {
      // Player Body
      this.context.fillStyle = this.socket.id === player.id ? 'red' : 'blue';
      this.context.fillRect(player.position.x - this.camera.position.x, player.position.y - this.camera.position.y, player.size.width * 2, player.size.height * 2);

      // Player Name
      this.context.font = '16px Silkscreen';
      const { width: usernameWidth } = this.context.measureText(player.username);
      this.context.fillText(player.username, (player.position.x - (usernameWidth / 2)) - this.camera.position.x, (player.position.y - 10) - this.camera.position.y);

      // Player Name in Player List
      this.context.fillStyle = this.socket.id === player.id ? 'red' : 'black';
      this.context.font = '24px Silkscreen';
      this.context.fillText(player.username, 25, startY);

      startY += 50;
    }

    // Draw Shots
    for (const shot of Object.values(this.shots)) {
      this.context.beginPath();
      this.context.arc(shot.position.x - this.camera.position.x, shot.position.y - this.camera.position.y, shot.radius, 0, 2 * Math.PI, false);
      this.context.fillStyle = 'black';
      this.context.fill();
    }

    if (this.player && this.players[this.player.id]) {
      const player = this.players[this.player.id];
      // Draw Player Coordinates
      this.context.fillStyle = 'white'
      this.context.font = '24px Silkscreen';
      this.context.fillText(`X: ${player.position.x}`, this.camera.size.width - 125, 50);

      this.context.fillStyle = 'white';
      this.context.font = '24px Silkscreen';
      this.context.fillText(`Y: ${player.position.y}`, this.camera.size.width - 125, 75);
    }
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

  const game = new GameClient({ socket, canvas });

  socket.on('connect', (connection) => {
    game.start();

    enterForm.onsubmit = (event) => {
      event.preventDefault();

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