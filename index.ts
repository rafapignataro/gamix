import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import crypto from 'crypto';

import { Player, Shot, GameConfig, AddPlayerProps, Position, Message, MessagesConfig, Map } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

import { MAP } from './map';

const TILES_X = MAP.length;
const TILES_Y = MAP[0].length;
const TILE_SIZE = 32;
const MAP_WIDTH = TILES_X * TILE_SIZE;
const MAP_HEIGHT = TILES_Y * TILE_SIZE;

const createPlayer = ({ id, username }: { id: string, username: string }) => {
  return {
    id,
    username,
    move: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    velocity: 10,
    size: {
      width: 10,
      height: 16,
    },
    position: {
      // x: Math.floor(Math.random() * MAP_WIDTH),
      // y: Math.floor(Math.random() * MAP_HEIGHT),
      x: 100,
      y: 100
    }
  }
}

class Game {
  map: Map;

  players: Record<Player['id'], Player>;

  shots: Record<Player['id'], Shot>

  gameLoop?: NodeJS.Timer;

  ioServer: Server;

  fps: number;

  status: 'STOPPED' | 'RUNNING' = 'STOPPED';

  constructor(config: GameConfig) {
    this.ioServer = config.ioServer;
    this.map = config.map;
    this.fps = config.fps || 1000 / 60;
    this.players = {};
    this.shots = {};
  }

  start() {
    this.status = 'RUNNING';

    this.gameLoop = setInterval(() => {
      this.update();

      this.ioServer.sockets.emit('GAME_STATE', this.getGameState())
    }, 1000 / 30);
  }

  stop() {
    clearInterval(this.gameLoop);
    this.gameLoop = undefined;
    this.status = 'STOPPED';
    this.players = {};
    this.shots = {};
  }

  private getPlayers() {
    return Object.values(this.players);
  }

  addPlayer({ id, username }: AddPlayerProps) {
    this.players[id] = createPlayer({ id, username });
  }

  movePlayer(player: Player) {
    if (!this.players[player.id]) return;
    this.players[player.id].move = player.move;
  }

  removePlayer(playerId: string) {
    delete this.players[playerId];

    if (!this.getPlayersCount() && this.gameLoop) this.stop();
  }

  getPlayersCount() {
    return Object.keys(this.players).length;
  }

  // Shots
  addShot({ playerId, mousePosition }: { playerId: string, mousePosition: Position }) {
    if (!this.players[playerId]) return;

    const player = this.players[playerId];
    const playerShots = this.getShots().filter(shot => shot.playerId === player.id);

    if (playerShots.length) {
      const lastShot = playerShots[playerShots.length - 1];
      const now = new Date().getTime();
      const lastShotTime = new Date(lastShot.createdAt).getTime();

      if (now - lastShotTime < 250) return;
    }

    var vy = mousePosition.y - player.position.y;
    var vx = mousePosition.x - player.position.x;
    const dist = Math.sqrt(vx * vx + vy * vy);
    const dx = vx / dist;
    const dy = vy / dist;

    const shot = {
      id: crypto.randomUUID(),
      playerId,
      radius: 0.3,
      position: {
        x: player.position.x,
        y: player.position.y,
      },
      velocity: {
        x: dx * 75,
        y: dy * 75
      },
      createdAt: new Date().toISOString()
    };

    this.shots[shot.id] = shot;
  }

  private getShots() {
    return Object.values(this.shots);
  }

  private getGameState() {
    return JSON.stringify({
      players: this.players,
      shots: this.shots
    })
  }

  private update() {
    this.getPlayers().forEach(player => {
      if (player.move.up && player.position.y > 0) {
        this.players[player.id].position.y = player.position.y -= player.velocity;
      }
      if (player.move.down && player.position.y + player.size.height + player.velocity <= this.map.height) {
        this.players[player.id].position.y = player.position.y += player.velocity;
      }
      if (player.move.right && player.position.x + player.size.width + player.velocity <= this.map.width) {
        this.players[player.id].position.x = player.position.x += player.velocity;
      }
      if (player.move.left && player.position.x > 0) {
        this.players[player.id].position.x = player.position.x -= player.velocity;
      }
    });

    this.getShots().forEach(shot => {
      const { velocity } = shot;

      this.shots[shot.id].position.x = shot.position.x += velocity.x;
      this.shots[shot.id].position.y = shot.position.y += velocity.y;
    })
  }
}

class Messages {
  ioServer: Server;

  messages: Message[];

  constructor({ ioServer }: MessagesConfig) {
    this.ioServer = ioServer;
    this.messages = [];
  }

  addMessage({ player, text }: { player: { username: string, id: string }, text: string }) {
    const message = {
      player,
      text,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);

    this.ioServer.sockets.emit('NEW_MESSAGE', message);
  }
}

const game = new Game({
  ioServer: io,
  map: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT
  }
});

const messages = new Messages({ ioServer: io });

io.on('connection', (socket) => {
  socket.on('JOIN_GAME', (joinedUser) => {
    if (!game.getPlayersCount()) game.start();

    game.addPlayer(joinedUser);

    io.to(socket.id).emit('JOINED_GAME', game.players[joinedUser.id]);
  });

  socket.on('PLAYER_MOVE', (player) => {
    game.movePlayer(player);
  });

  socket.on('USER_FIRE', ({ playerId, mousePosition }) => {
    game.addShot({
      playerId,
      mousePosition
    })
  })

  socket.on('USER_SENT_MESSAGE', ({ player, text }) => {
    messages.addMessage({
      player,
      text
    });
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
  });
});

app.use(cors({
  origin: '*',
}))

app.use(express.static(__dirname + '/public'));

server.listen(4444, () => {
  console.log('ON: *:4444');
});