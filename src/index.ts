import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';

import { Game } from '@gamix/server';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  },
});

new Game({
  websocket: io,
  map: {
    tilesX: 128,
    tilesY: 128,
    tileSize: 8
  },
  setup: (game: Game) => { },
  update: (game: Game) => { },
});

app.use(cors({ origin: '*' }))

app.get('/', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'app', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, 'app')));

server.listen(4444, '127.0.0.1', () => console.log('ON: *:4444'));