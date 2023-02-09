import { Socket } from "socket.io";
import { Player, PlayerProps } from "./Player";

export class Players {
  private players: Record<string, Player> = {};

  constructor() { }

  public add(data: PlayerProps) {
    const player = new Player(data);

    this.players[player.id] = player;
  }

  public find(id: string) {
    return this.players[id];
  }

  public findAll() {
    return this.players;
  }

  public remove(id: string) {
    const players = this.find(id);

    if (!players) return;

    delete this.players[players.id];
  }

  public reset() {
    this.players = {};
  }

  public size() {
    return Object.keys(this.players).length;
  }

  public getClientData() {
    const data: Record<string, Player> = {};

    for (const playerId in this.players) {
      const player = this.players[playerId];

      const { socket, getClientData, setStatus, setUsername, ...playerData } = player;

      data[playerId] = playerData as Player;
    }

    return data;
  }
}