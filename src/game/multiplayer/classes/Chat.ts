import { Server } from "socket.io";

type ChatMessage = {
  player: {
    id: string;
    username: string;
  }
  text: string;
  timestamp: string;
}

type ChatProps = {
  websocket: Server;
}

export class Chat {
  websocket: Server;

  messages: ChatMessage[];

  constructor({ websocket }: ChatProps) {
    this.websocket = websocket;
    this.messages = [];
  }

  addMessage({ player, text }: { player: { username: string, id: string }, text: string }) {
    const message = {
      player,
      text,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);

    this.websocket.sockets.emit('NEW_MESSAGE', message);
  }
}