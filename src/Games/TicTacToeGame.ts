import { z } from 'zod'
import type { Game, GameState } from "./Game"

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: unknown) => void
  nextTurn: (players: string[]) => void
  showResults: (results: unknown) => void
}

const moveActionParser = z.object({ cell: z.number().int().min(0).max(8) })

export class TicTacToe implements Game {
  public static MaxPlayers = 2

  private game: GameState<TTTState, PlayerState> = {
    config: {
      timeout: 10
    },
    state: {
      round: 0,
      nextTurn: '',
      moveAllowed: false,
      board: [
        null, null, null,
        null, null, null,
        null, null, null
      ],
      isGameOver: false,
      results: {},
    },
    players: {},
  }

  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']
  private nextTurn: ControlFuntions['nextTurn']
  private showResults: ControlFuntions['showResults']

  constructor(controlFn: ControlFuntions, players: PlayerInfo[]) {
    this.finishGame = controlFn.finishGame
    this.showCountdown = controlFn.showCountdown
    this.nextTurn = controlFn.nextTurn
    this.showResults = controlFn.showResults

    this.game.players[players[0].id] = {
      symbol: 'circle',
      username: players[0].username
    }
    this.game.players[players[1].id] = {
      symbol: 'cross',
      username: players[1].username
    }
    this.game.state.nextTurn = players[0].id
  }

  startGameLoop(): void {
    this.isGameOver()
    if (this.game.state.isGameOver) {
      this.finishGame(this.game.state.results) // TODO
      return
    }
    const turn = this.game.state.nextTurn
    this.nextTurn([turn])
    this.game.state.moveAllowed = true
    this.showCountdown(this.game.config.timeout, () => {
      this.game.state.moveAllowed = false
      if (turn === this.game.state.nextTurn) { // The player missed their turn -> Lose game
        this.game.state.isGameOver = true
        this.game.state.results = {
          type: 'timeout',
          winner: this.getOtherPlayer(turn)
        }
      } else {
        this.showResults({ board: this.game.state.board })
        this.startGameLoop()
      }
    }, () => {
      return turn !== this.game.state.nextTurn // If the player has already moved -> cancel the countdown
    })
  }

  getOtherPlayer(player: string) : string {
    for (const otherPlayer of Object.keys(this.game.players)) {
      if (player !== otherPlayer)
        return otherPlayer
    }
    return 'no_player'
  }

  playerLeave(playerId: string): void {
    this.game.state.isGameOver = true
    this.game.state.results = {
      type: 'resignation',
      winner: this.getOtherPlayer(playerId)
    }
  }

  move(playerId: string, action: unknown): void {
    if (playerId !== this.game.state.nextTurn || !this.game.state.moveAllowed)
      return // Not their turn

    try {
      const { cell } = moveActionParser.parse(action)
      // Zod will verify the number is between 0 and 8
      if (this.game.state.board[cell] != null)
        return // Cell is already taken

      this.game.state.board[cell] = playerId

      // Gives turn to next player
      for (const player of Object.keys(this.game.players)) {
        if (player !== playerId)
          this.game.state.nextTurn = player
      }
    } catch (error) {}
  }

  isGameOver(): void {
    const winningCombinations: number[][] = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6],             // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination
      if (this.game.state.board[a] !== null && this.game.state.board[a] === this.game.state.board[b] && this.game.state.board[a] === this.game.state.board[c]) {
        this.game.state.isGameOver = true
        this.game.state.results = {
          type: 'winner',
          winner: this.game.state.board[a]!
        }
        return
      }
    }
  
    // Check if the board is full (draw)
    if (!this.game.state.board.includes(null)) {
      this.game.state.isGameOver = true
      if (this.game.state.isGameOver) // Needed for TS to detect gameover properties
        this.game.state.results = {
          type: 'draw',
          winner: Object.keys(this.game.players)
        }
      return
    }
  
    // The game is not over
    return
  }
  
}

type TTTState = {
  nextTurn: string,
  round: number,
  board: BoardCell[],
  moveAllowed: boolean,
} & ({
  isGameOver: false
  results: Record<string, never>
} | {
  isGameOver: true
  results: GameResults
})

type GameResults = {
  type: 'draw'
  winner:  string[]
} | {
  type: 'winner'
  winner: string
} | {
  type: 'timeout'
  winner: string
} | {
  type: 'resignation'
  winner: string
}

type BoardCell = null|string

type PlayerState = {
  symbol: BoardSymbol,
  username: string,
}

type BoardSymbol = 'circle' | 'cross'

type PlayerInfo = {
  id: string
  username: string
}