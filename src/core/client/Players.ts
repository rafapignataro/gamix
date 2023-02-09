import { Socket } from "socket.io";
import { Player, PlayerProps } from "./OldPlayer";

export class Players {
  private players: Record<string, Player> = {};

  constructor() { }

  public set(players: Record<string, Player>) {
    this.players = players;
  }

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
}