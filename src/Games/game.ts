import { TicTacToe } from "./TicTacToeGame"

interface Game {
  startGameLoop(): void
  playerLeave(playerId: string): void

  // TODO Decidir tipos de la accion movimiento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  move(playerId: string, action: any): void
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
