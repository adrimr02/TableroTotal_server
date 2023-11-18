import { TicTacToe } from "./TicTacToeGame"

interface Game {
  startGameLoop(): void
  playerLeave(playerId: string): void

  // TODO Decidir tipos de la accion movimiento
  move(playerId: string, action: unknown): void
}

type GameState<TGameState, TPlayerState> = {
  config: {
    timeout: number,
  },
  state: TGameState,
  players: Record<string, TPlayerState>
}

export {
  Game,
  GameState,
  TicTacToe,
}
