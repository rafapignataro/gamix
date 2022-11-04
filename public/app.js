// Screens
const joinScreen = document.getElementById('join-screen');
const gameScreen = document.getElementById('game-screen');

// List States
const playerList = document.getElementById('player-list');
const chatList = document.getElementById('chat-list');

// Forms
const joinForm = document.getElementById('join-form');
const sendMessageForm = document.getElementById('send-message-form');

// Inputs
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');

class PlayerListController {
  elementId;

  element;

  players = {};

  constructor(elementId) {
    this.elementId = elementId;

    this.element = document.getElementById(this.elementId);
  }

  addPlayer(player) {
    this.players[player.id] = player;
    this.renderPlayers();
  }

  removePlayer(player) {
    delete this.players[player.id];

    this.renderPlayers();
  }

  addInitialPlayers(players) {
    this.players = players;

    this.renderPlayers();
  }

  renderPlayers() {
    playerList.innerHTML = '';

    Object.values(this.players).forEach(player => {
      const playerConnected = document.createElement('div');
      playerConnected.className = 'connected-player';

      playerConnected.innerText = player.username;

      this.element.appendChild(playerConnected);
    })
  }
}

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

class Map {
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

  images = {};

  constructor({ socket, canvas }) {
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
    })

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

isTypingMessage = false;

window.onload = () => {
  const socket = io('http://127.0.0.1:4444');

  const canvas = document.getElementById('canvas');

  const game = new GameClient({
    socket,
    canvas,
  });

  joinScreen.style.display = 'flex';
  gameScreen.style.display = 'none';

  socket.on('connect', (connection) => {
    const playerListController = new PlayerListController('player-list');

    joinForm.onsubmit = (event) => {
      event.preventDefault();

      if (usernameInput.value === '') return;

      socket.emit('JOIN_GAME', {
        id: socket.id,
        username: usernameInput.value,
        screen: {
          size: game.camera.size,
          proportion: game.camera.proportion
        }
      });
    }

    sendMessageForm.onsubmit = (event) => {
      event.preventDefault();

      socket.emit('SEND_MESSAGE', {
        player: {
          id: game.player.id,
          username: game.player.username,
        },
        text: messageInput.value
      });
      messageInput.value = '';
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

    window.onmousemove = (event) => {
      if (isTypingMessage) return;

      game.playerAim(event.clientX, event.clientY)
    }

    socket.on('GAME_MAP', map => {
      game.start(map);
    })

    socket.on('GAME_STATE', (state) => {
      game.updateState(JSON.parse(state))
    });

    socket.on('JOINED_SUCCESSFULLY', (player) => {
      game.addPlayer(player);
      if (Object.keys(game.players).length) {
        playerListController.addInitialPlayers(game.players);
      }

      joinScreen.style.display = 'none';
      gameScreen.style.display = 'block';
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

      chatList.appendChild(chatMessage);

      chatList.scrollTop = chatList.scrollHeight;
    });

    socket.on('PLAYER_JOINED', player => {
      playerListController.addPlayer(player);
    });

    socket.on('PLAYER_LEFT', player => {
      playerListController.removePlayer(player);
    })

    socket.on('disconnect', () => {
      game.reset();
      joinScreen.style.display = 'flex';
      gameScreen.style.display = 'none';
    })
  })
}

messageInput.onfocus = () => isTypingMessage = true;
messageInput.onblur = () => isTypingMessage = false;