import type { Game, GameState } from "./Game"

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: string) => void
  nextTurn: (players: string[]) => void
}

export class TicTacToe implements Game {

  private gameState: GameState<TTTState, PlayerState> = {
    config: {
      timeout: 10
    },
    state: {
      round: 0,
      nextTurn: '',
      board: [
        null, null, null,
        null, null, null,
        null, null, null
      ]
    },
    players: {},
  }
  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']
  private nextTurn: ControlFuntions['nextTurn']

  constructor(controlFn: ControlFuntions, players: PlayerInfo[]) {
    this.finishGame = controlFn.finishGame
    this.showCountdown = controlFn.showCountdown
    this.nextTurn = controlFn.nextTurn
    this.gameState.players[players[0].id] = {
      symbol: 'circle',
      username: players[0].username
    }
    this.gameState.players[players[1].id] = {
      symbol: 'cross',
      username: players[1].username
    }
  }

  startGameLoop(): void {
    if (this.isGameOver()) {
      this.finishGame("to-do")
      return
    }
    const turn = this.gameState.state.nextTurn
    this.nextTurn([turn])
    this.showCountdown(this.gameState.config.timeout, () => {
      
      this.startGameLoop()
    }, () => {
      return turn !== this.gameState.state.nextTurn
    })
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

type TTTState = {
  nextTurn: string,
  round: number,
  board: {
    0: null|string, 1: null|string, 2: null|string,
    3: null|string, 4: null|string, 5: null|string,
    6: null|string, 7: null|string, 8: null|string,
  }
}

type PlayerState = {
  symbol: BoardSymbol,
  username: string,
}

type BoardSymbol = 'circle' | 'cross'

type PlayerInfo = {
  id: string
  username: string
}