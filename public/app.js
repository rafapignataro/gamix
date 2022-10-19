const WIDTH = 800;
const HEIGHT = 800;

const createPlayer = ({ id, username }) => {
  const INITIAL_POSITION = { x: WIDTH / 2, y: HEIGHT / 2 };

  return {
    id,
    username,
    move: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    size: {
      width: 25,
      height: 25,
    },
    position: {
      x: INITIAL_POSITION.x - 25,
      y: INITIAL_POSITION.y - 25,
    }
  }
}

let GAME = null;
let SCREEN_STATE = 'INITIAL';
let USER_SOCKET_ID;
let USERNAME = '';
let CONNECTED = false;

const formContainer = document.getElementById('form-container');
const enterForm = document.getElementById('enter-form');
const usernameInput = document.getElementById('username');
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

class GameClient {
  socket;

  canvas;

  context;

  player;

  players;

  shots;

  isPressingKey = false;

  constructor({ socket, canvas, context }) {
    this.socket = socket;

    this.canvas = canvas;

    this.context = context;

    this.player = null;

    this.players = {};

    this.shots = {};
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

  addPlayer({ id, username: string }) {
    this.player = createPlayer({ id, username: string });
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

  update() {
    Object.keys(this.players).forEach(playerId => {
      const enemy = this.players[playerId];
      // console.log(this.player, this.player?.id === playerId)
      if (this.socket.id === playerId) {
        this.context.fillStyle = 'red';
      } else {
        this.context.fillStyle = 'blue';
      }

      this.context.fillRect(enemy.position.x, enemy.position.y, enemy.size.width, enemy.size.height);
      this.context.font = '12px Arial';
      const { width: usernameWidth } = this.context.measureText(enemy.username);
      this.context.fillText(enemy.username, enemy.position.x - (usernameWidth / 2), enemy.position.y - 10);
    });

    Object.keys(this.shots).forEach(shotId => {
      const shot = this.shots[shotId];

      this.context.beginPath();
      this.context.arc(shot.position.x, shot.position.y, shot.radius, 0, 2 * Math.PI, false);
      this.context.fillStyle = 'black';
      this.context.fill();
    });

    let startY = 25;
    const startX = 10;

    Object.keys(this.players).forEach(playerId => {
      const p = this.players[playerId];
      if (this.socket.id === playerId) {
        this.context.font = '12px Arial';
        this.context.fillStyle = 'red';
        this.context.fillText(p.username, startX, startY);
      } else {
        this.context.font = '12px Arial';
        this.context.fillStyle = 'black';
        this.context.fillText(p.username, startX, startY);
      }

      startY += 25;
    });
  }

  clearGame() {
    this.context.fillStyle = '#ecf0f1';
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  render() {
    this.clearGame();

    this.update();

    window.requestAnimationFrame(this.render.bind(this));
  }
}

isTypingMessage = false;

window.onload = (event) => {
  const socket = io('http://localhost:4444');

  const canvas = document.getElementById('canvas');

  const context = canvas.getContext('2d');

  const game = new GameClient({ socket, canvas, context });

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