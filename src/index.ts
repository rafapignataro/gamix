import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';

import { Game } from './game/core/classes/Game';
import { Chat } from './game/server/classes/Chat';

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
});

const chat = new Chat({ websocket: io });

io.on('connection', (socket) => {
  if (!game.getPlayersCount()) game.start();

  socket.emit('GAME_MAP', { tiles: game.map.tiles, tileSize: game.map.tileSize });

  socket.on('JOIN_GAME', (player) => {
    game.addPlayer(player);

    io.to(socket.id).emit('JOINED_SUCCESSFULLY', game.players[player.id]);
    io.emit('PLAYER_JOINED', game.players[player.id]);
  });

  socket.on('PLAYER_MOVE', (player) => {
    game.movePlayer(player);
  });

  socket.on('PLAYER_FIRE', ({ playerId }) => {
    game.addShot({
      playerId,
    })
  });

  socket.on('PLAYER_AIM', ({ playerId, mousePosition, cameraPosition }) => {
    game.playerAim({
      playerId,
      mousePosition,
      cameraPosition
    })
  })

  socket.on('SEND_MESSAGE', ({ player, text }) => {
    chat.addMessage({
      player,
      text
    });
  });

  socket.on('disconnect', () => {
    const disconnectedPlayer = game.players[socket.id];

    if (!disconnectedPlayer) return;

    game.removePlayer(disconnectedPlayer.id);

    socket.broadcast.emit('PLAYER_LEFT', disconnectedPlayer);
  });
});

app.use(cors({
  origin: '*',
}))

app.get('/', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, 'client')));

server.listen(4444, '127.0.0.1', () => {
  console.log('ON: *:4444');
});