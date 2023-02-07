import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';

import { Game } from './core/server/Game';
import { Chat } from './core/server/Chat';
import { CreateGameObject } from './core/server/GameObject';
import { Movement } from './core/types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  },
});

const game = new Game({
  websocket: io,
  map: {
    tilesX: 128,
    tilesY: 128,
    tileSize: 8
  },
  setup: (game: Game) => { },
  update: (game: Game) => { },
});

const chat = new Chat({ websocket: io });

io.on('connection', (socket) => {
  if (!Object.keys(game.gameObjects).length) game.start();

  socket.emit('GAME_MAP', { tiles: game.map.tiles, tileSize: game.map.tileSize });

  socket.on('JOIN_GAME', (player: CreateGameObject) => {
    game.gameObjects.add(player);

    const gameObject = game.gameObjects.find(String(player.id));

    io.to(socket.id).emit('JOINED_SUCCESSFULLY', gameObject);
    io.emit('PLAYER_JOINED', gameObject);
  });

  socket.on('PLAYER_MOVE', (data: { id: string, input: Movement }) => {
    const gameObject = game.gameObjects.find(data.id);

    gameObject.setMovement(data.input);
  });

  socket.on('PLAYER_FIRE', ({ playerId }) => {
    // game.addShot({
    //   playerId,
    // })
  });

  socket.on('PLAYER_AIM', ({ playerId, mousePosition, cameraPosition }) => {
    // game.playerAim({
    //   playerId,
    //   mousePosition,
    //   cameraPosition
    // })
  })

  socket.on('SEND_MESSAGE', ({ player, text }) => {
    chat.addMessage({
      player,
      text
    });
  });

  socket.on('disconnect', () => {
    const gameObject = game.gameObjects.find(socket.id);

    if (!gameObject) return;

    game.gameObjects.remove(gameObject.id);

    socket.broadcast.emit('PLAYER_LEFT', gameObject);
  });
});

app.use(cors({ origin: '*' }))

app.get('/', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'core', 'client', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, 'core', 'client')));

server.listen(4444, '127.0.0.1', () => console.log('ON: *:4444'));