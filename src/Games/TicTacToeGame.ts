import type { Game, GameState } from "./Game"

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: string) => void
}

export class TicTacToe implements Game {

  private gameState: GameState<object, object> = {
    players: {},
    state: []
  }
  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']

  constructor(controlFn: ControlFuntions) {
    this.finishGame = controlFn.finishGame
    this.showCountdown = controlFn.showCountdown
  }

  startGameLoop(): void {
    while (!this.isGameOver()) {
      this.gameState
      this.showCountdown
      this.finishGame
    }
  }

  playerLeave(playerId: string): void {
    playerId
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  move(playerId: string, action: any): void {
    playerId
    action
  }

  isGameOver(): boolean {
    return false
  }
  
}