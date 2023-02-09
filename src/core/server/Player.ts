import { Socket } from "socket.io";

export type PlayerProps = {
  id: string;
  socket: Socket;
  connectedAt: Date;
  disconnected: boolean;
}

export class Player {
  id: string;

  socket: Socket;

  disconnected: boolean = false;

  connectedAt: Date;

  status: 'IDLE' | 'PLAYING' = 'IDLE';

  username?: string;

  constructor({
    id,
    socket,
    connectedAt,
    disconnected,
  }: PlayerProps) {
    this.id = id;

    this.socket = socket;

    this.connectedAt = connectedAt;

    this.disconnected = disconnected;
  }

  setStatus(status: 'IDLE' | 'PLAYING') {
    this.status = status;
  }

  setUsername(username: string) {
    this.username = username;
  }

  getClientData() {
    const { socket, getClientData, setStatus, setUsername, ...player } = this;

    return player;
  }
}