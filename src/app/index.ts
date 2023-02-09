import { Game, Utils, StateController, UIController } from '@gamix/client';

const main = () => {
  //@ts-ignore
  const socket = io('http://127.0.0.1:4444');

  // Canvas
  const canvasElement = document.getElementsByTagName('canvas')[0];

  // Screens
  const joinScreenElement = document.getElementById('join-screen');
  const gameScreenElement = document.getElementById('game-screen');

  // Forms
  const joinForm = document.getElementById('join-form') as HTMLFormElement;
  const sendMessageForm = document.getElementById('send-message-form') as HTMLFormElement;

  // Inputs
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const messageInput = document.getElementById('message') as HTMLInputElement;

  if (
    !canvasElement ||
    !joinScreenElement ||
    !gameScreenElement ||
    !joinForm ||
    !sendMessageForm ||
    !usernameInput ||
    !messageInput
  ) {
    return;
  }

  // Game
  const game = new Game({
    socket,
    canvas: canvasElement,
    screens: {
      join: {
        active: true,
        type: 'flex',
        element: joinScreenElement
      },
      game: {
        active: false,
        type: 'block',
        element: gameScreenElement
      }
    },
    setup,
    update,
  });

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

      playerConnected.innerText = player.username;


      return playerConnected;
    });
  });

  chatState.on('update', (messages) => {
    const player = game.gameObjects.find(socket.id);

    if (!player) return;

    chatUI.renderList(messages, message => {
      const playerId = message.player.id;
      const username = message.player.username;
      const text = message.text;
      const timestamp = new Date(message.timestamp);

      const chatMessage = document.createElement('div');
      chatMessage.className = 'chat-message';

      const messageContent = document.createElement('div');
      messageContent.className = playerId === player.id ? 'user-message' : 'enemy-message';

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
  });

  socket.on('connect', () => {
    socket.on('START_GAME', map => game.start(map))

    socket.on('SYNC', ({ gameObjects, players }) => {
      game.gameObjects.set(gameObjects);
      game.players.set(players);
    });

    socket.on('JOINED_SUCCESSFULLY', ({ player, gameObject }) => {
      game.players.add(player);
      game.gameObjects.add(gameObject);

      playerState.set(game.players.findAll());

      game.screens.change('game');

      game.inputs.enable();
    });

    socket.on('NEW_MESSAGE', (message) => {
      chatState.set({ ...chatState.get(), [message.id]: message })
    });

    socket.on('PLAYER_JOINED', ({ player, gameObject }) => {
      game.players.add(player);
      game.gameObjects.add(gameObject);

      playerState.set(game.players.findAll());
    });

    socket.on('PLAYER_LEFT', ({ player, gameObject }) => {
      game.gameObjects.remove(player.id);
      game.players.remove(player.id);

      playerState.set(game.players.findAll())
    })

    socket.on('disconnect', () => {
      game.reset();

      game.screens.change('join');
    })
  })

  joinForm.onsubmit = (event) => {
    event.preventDefault();

    if (usernameInput.value === '') return;


    game.socket.emit('JOIN_GAME', {
      id: socket.id,
      username: usernameInput.value,
      screen: {
        size: game.camera?.size,
        proportion: game.camera?.proportion
      }
    });
  }

  sendMessageForm.onsubmit = (event) => {
    event.preventDefault();

    const player = game.gameObjects.find(game.socket.id);

    if (!player) return;

    game.socket.emit('SEND_MESSAGE', {
      player: {
        id: player.id,
        // username: player.username,
        username: 'player.username',
      },
      text: messageInput.value
    });

    messageInput.value = '';
  }

  game.inputs.on('keydown', (key) => {
    const player = game.gameObjects.find(socket.id);

    if (!player || !player.movement) return;

    const nextMove = Utils.keyToMovement({ key, type: 'down', current: player.movement });

    socket.emit('PLAYER_MOVE', { id: player.id, movement: nextMove });
  });

  game.inputs.on('keyup', (key) => {
    const player = game.gameObjects.find(socket.id);

    if (!player || !player.movement) return;

    const nextMove = Utils.keyToMovement({ key, type: 'up', current: player.movement });

    socket.emit('PLAYER_MOVE', { id: player.id, movement: nextMove });
  });
  // game.inputs.on('mousedown', ({ clientX, clientY }) => game.playerShot(clientX, clientY));
  // game.inputs.on('mousemove', ({ clientX, clientY }) => game.playerAim(clientX, clientY));

  game.inputs.disable();

  messageInput.onfocus = () => game.inputs.disable();
  messageInput.onblur = () => game.inputs.enable();

  function setup(game: Game) { }

  function update(game: Game) {
    const { context, camera, socket, map, gameObjects, proportion, images, players } = game;

    if (!map) return;
    if (!camera) return;

    const player = gameObjects.find(socket.id);

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
          Utils.rect({
            context,
            x: x * map.tileSize - camera.position.x,
            y: y * map.tileSize - camera.position.y,
            width: map.tileSize,
            height: map.tileSize,
            color: Utils.getTileColor(tile)
          });
        } else {
          Utils.rect({
            context,
            x: x * map.tileSize - camera.position.x,
            y: y * map.tileSize - camera.position.y,
            width: map.tileSize,
            height: map.tileSize,
            color: Utils.getTileColor(tile)
          });
        }
      }
    }

    if (player) {
      camera.follow(player);

      Utils.text({
        context,
        text: `X: ${player.position.x} | Y: ${player.position.y}`,
        x: 25,
        y: 50,
        font: 24,
        color: 'white'
      });
    };

    if (gameObjects.size()) {
      // Draw Players
      for (const gameObject of Object.values(gameObjects.findAll())) {
        // Player Body
        Utils.rect({
          context,
          x: (gameObject.position.x * proportion) - camera.position.x,
          y: (gameObject.position.y * proportion) - camera.position.y,
          width: gameObject.size.width * proportion,
          height: gameObject.size.height * proportion,
          color: socket.id === gameObject.id ? '#130f40' : '#eb4d4b'
        });

        Utils.rect({
          context,
          x: (gameObject.position.x * proportion) - camera.position.x + (2 * proportion),
          y: (gameObject.position.y * proportion) - camera.position.y + (2 * proportion),
          width: 1 * proportion,
          height: 2 * proportion,
          color: '#fff'
        });

        Utils.rect({
          context,
          x: (gameObject.position.x * proportion) - camera.position.x + (5 * proportion),
          y: (gameObject.position.y * proportion) - camera.position.y + (2 * proportion),
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
    }

    // for (const shot of Object.values(shots)) {
    //   circle({
    //     context,
    //     x: (shot.position.x * proportion) - camera.position.x,
    //     y: (shot.position.y * proportion) - camera.position.y,
    //     radius: shot.size.width * proportion,
    //     color: 'black'
    //   })
    // }
  }
}

window.onload = main;