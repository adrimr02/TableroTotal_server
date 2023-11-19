import { TicTacToe } from "./TicTacToeGame"

interface Game {
  startGameLoop(): void
  playerLeave(playerId: string): void
  addPlayer(playerInfo: PlayerInfo): boolean
  move(playerId: string, action: unknown): void
}

type GameState<TGameState, TPlayerState> = {
  config: {
    timeout: number,
    maxPlayers: number
  },
  state: TGameState,
  players: Record<string, TPlayerState>
}

type PlayerInfo = {
  id: string
  username: string
}

export {
  Game,
  GameState,
  TicTacToe,
  PlayerInfo
}
