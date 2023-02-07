// Forms
const joinForm = document.getElementById('join-form');
const sendMessageForm = document.getElementById('send-message-form');

// Inputs
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');

window.onload = () => {
  const socket = io('http://127.0.0.1:4444');

  // Game
  new Game({
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
    },
    setup,
    update,
  });

  function setup(game) {
    // UI
    const playerListUI = new UIController('player-list');
    const chatUI = new UIController('chat-list');

    // States
    const playerState = new StateController();
    const chatState = new StateController();

    // Handle States
    playerState.on('update', (players) => {
      playerListUI.renderList(players, (player) => {
        const playerConnected = document.createElement('div');
        playerConnected.className = 'connected-player';

        // playerConnected.innerText = player.username;
        playerConnected.innerText = player.id;


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
    // game.inputs.on('mousedown', ({ clientX, clientY }) => game.playerShot(clientX, clientY));
    // game.inputs.on('mousemove', ({ clientX, clientY }) => game.playerAim(clientX, clientY));

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
        game.gameObjects.add(player);
        if (Object.keys(game.gameObjects).length) playerState.set(game.gameObjects);

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
        const newPlayerState = game.gameObjects;

        delete newPlayerState[player.id];

        playerState.set(newPlayerState);
      })

      socket.on('disconnect', () => {
        game.reset();

        game.screens.change('join');
      })
    })
  }

  function update(game) {
    const { context, camera, socket, player, map, gameObjects, proportion, images } = game;

    for (let y = 0; y < map.tilesY; y++) {
      for (let x = 0; x < map.tilesX; x++) {
        const tile = map.tiles[y][x];

        if (tile < 110) {
          context.drawImage(
            images['grassTileset'].img,
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

    if (player && gameObjects[player.id]) camera.follow(gameObjects[player.id]);

    // Draw Players
    for (const player of Object.values(gameObjects)) {
      if (socket.id === player.id) game.setPlayer(player);
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

      // context.save();
      // context.translate(
      //   ((player.position.x + (player.size.width / 2)) * proportion) - camera.position.x,
      //   ((player.position.y + (player.size.height / 2)) * proportion) - camera.position.y
      // );
      // context.rotate(player.weapon.rotation * Math.PI / 180);
      // rect({
      //   context,
      //   x: 0,
      //   y: 0,
      //   width: 10 * proportion,
      //   height: 1 * proportion,
      //   color: 'black'
      // });
      // context.restore();

      // text({
      //   context,
      //   text: player.username,
      //   x: (player.position.x * proportion) - camera.position.x,
      //   y: (player.position.y * proportion) - 10 - camera.position.y,
      //   font: 16,
      //   color: socket.id === player.id ? '#130f40' : '#eb4d4b'
      // });
    }

    // Draw Shots
    // for (const shot of Object.values(shots)) {
    //   circle({
    //     context,
    //     x: (shot.position.x * proportion) - camera.position.x,
    //     y: (shot.position.y * proportion) - camera.position.y,
    //     radius: shot.size.width * proportion,
    //     color: 'black'
    //   })
    // }

    if (player && gameObjects[player.id]) {
      const currentPlayer = gameObjects[player.id];

      text({
        context,
        text: `X: ${currentPlayer.position.x} | Y: ${currentPlayer.position.y}`,
        x: 25,
        y: 50,
        font: 24,
        color: 'white'
      });
    }
  }
}