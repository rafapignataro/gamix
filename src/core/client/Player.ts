import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export type PlayerProps = {
  id: string;
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  connectedAt: Date;
  disconnected: boolean;
  username: string;
}

export class Player {
  id: string;

  socket: Socket;

  disconnected: boolean = false;

  connectedAt: Date;

  status: 'IDLE' | 'PLAYING' = 'IDLE';

  username: string;

  constructor({
    id,
    socket,
    connectedAt,
    disconnected,
    username
  }: PlayerProps) {
    this.id = id;

    this.socket = socket;

    this.connectedAt = connectedAt;

    this.disconnected = disconnected;

    this.username = username;
  }
}