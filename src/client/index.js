// Forms
const joinForm = document.getElementById('join-form');
const sendMessageForm = document.getElementById('send-message-form');

// Inputs
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');


window.onload = () => {
  const socket = io('http://127.0.0.1:4444');

  const game = new Game({
    socket,
    canvas: document.getElementById('canvas'),
    screens: {
      join: {
        active: true,
        type: 'flex',
        element: document.getElementById('join-screen')
      },
      game: {
        active: false,
        type: 'block',
        element: document.getElementById('game-screen')
      }
    }
  });

  // UI
  const playerListUI = new UIController('player-list');
  const chatUI = new UIController('chat-list');

  // States
  const playerState = new StateController();
  const chatState = new StateController();

  playerState.on('update', (players) => {
    playerListUI.renderList(players, (player) => {
      const playerConnected = document.createElement('div');
      playerConnected.className = 'connected-player';

      playerConnected.innerText = player.username;

      return playerConnected;
    });
  });

  chatState.on('update', (messages) => {
    chatUI.renderList(messages, message => {
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

      return chatMessage
    });

    chatUI.element.scrollTop = chatUI.element.scrollHeight;
  })

  game.inputs.on('keydown', (key) => game.movePlayer(key, 'down'));
  game.inputs.on('keyup', (key) => game.movePlayer(key, 'up'));
  game.inputs.on('mousedown', ({ clientX, clientY }) => game.playerShot(clientX, clientY));
  game.inputs.on('mousemove', ({ clientX, clientY }) => game.playerAim(clientX, clientY));

  game.inputs.disable();

  joinForm.onsubmit = (event) => {
    event.preventDefault();

    if (usernameInput.value === '') return;

    game.socket.emit('JOIN_GAME', {
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

    game.socket.emit('SEND_MESSAGE', {
      player: {
        id: game.player.id,
        username: game.player.username,
      },
      text: messageInput.value
    });
    messageInput.value = '';
  }

  messageInput.onfocus = () => game.inputs.disable();
  messageInput.onblur = () => game.inputs.enable();

  socket.on('connect', (connection) => {
    socket.on('GAME_MAP', map => {
      game.start(map);
    })

    socket.on('GAME_STATE', (state) => {
      game.updateState(JSON.parse(state))
    });

    socket.on('JOINED_SUCCESSFULLY', (player) => {
      game.addPlayer(player);
      if (Object.keys(game.players).length) playerState.set(game.players);

      game.screens.change('game');

      game.inputs.enable();
    });

    socket.on('NEW_MESSAGE', (message) => {
      chatState.set({ ...chatState.get(), [message.id]: message })
    });

    socket.on('PLAYER_JOINED', player => {
      playerState.set({ ...playerState.get(), [player.id]: player });
    });

    socket.on('PLAYER_LEFT', player => {
      const newPlayerState = game.players;

      delete newPlayerState[player.id];

      playerState.set(newPlayerState);
    })

    socket.on('disconnect', () => {
      game.reset();

      game.screens.change('join');
    })
  })
}