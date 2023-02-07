import { Server, Socket } from "socket.io";

import { Game } from "./Game";

type MultiplayerControllerProps = {
  game: Game;
  server: Server;
  connection: Socket;
}

export class MultiplayerController {
  game: Game;

  server: Server;

  connection: Socket;

  constructor({ game, server, connection }: MultiplayerControllerProps) {
    this.game = game;

    this.server = server;

    this.connection = connection;
  }
}