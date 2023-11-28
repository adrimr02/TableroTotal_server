import { z } from 'zod'
import type { Game, GameState } from "./Game"
import type { PlayerInfo } from '../sockets/types'

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: unknown) => void
  nextTurn: (players: string[]) => void
  showResults: (results: unknown) => void
  showInitialInfo: (info: unknown) => void
}

const moveActionParser = z.object({ cell: z.number().int().min(0).max(8) })

export class EvensAndNones implements Game {
  public static MaxPlayers = 2

  private game: GameState<EANState, PlayerState> = {
    config: {
      timeout: 10,
      maxPlayers: 2
    },
    state: {
      round: 0,
      nextTurn: '',
      isGameOver: false,
      type: 'evens',
      number: 0,
      results: {},
    },
    players: {},
  }

  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']
  private nextTurn: ControlFuntions['nextTurn']
  private showResults: ControlFuntions['showResults']
  private showInitialInfo: ControlFuntions['showInitialInfo']

  constructor(controlFn: ControlFuntions) {
    this.finishGame = controlFn.finishGame
    this.showCountdown = controlFn.showCountdown
    this.nextTurn = controlFn.nextTurn
    this.showResults = controlFn.showResults
    this.showInitialInfo = controlFn.showInitialInfo
  }

  startGameLoop(): void {
    if (this.game.state.nextTurn.length === 0) { // First loop
      this.game.state.nextTurn = Object.keys(this.game.players)[Math.floor(Math.random() * Object.keys(this.game.players).length)] // First turn is random
      this.showInitialInfo({})
    }

    this.isGameOver()
    if (this.game.state.isGameOver) {
      this.finishGame(this.game.state.results)
      return
    }

    const turn = this.game.state.nextTurn
    this.nextTurn([turn])
    this.showCountdown(this.game.config.timeout, () => {
      if (turn === this.game.state.nextTurn) { // The player missed their turn -> Lose game
        this.game.state.isGameOver = true
        this.game.state.results = {
          type: 'timeout',
          winner: this.getOtherPlayer(turn)
        }
      } else {
        //this.showResults({ board: this.game.state.board })
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

  addPlayer(playerInfo: PlayerInfo): boolean {
    if (Object.keys(this.game.players).length === this.game.config.maxPlayers)
      return false
    this.game.players[playerInfo.id] = { ...playerInfo}
    return true
  }

  move(playerId: string, action: unknown): void {
    if (playerId !== this.game.state.nextTurn)
      return // Not their turn

    try {

      // Gives turn to next player
      for (const player of Object.keys(this.game.players)) {
        if (player !== playerId)
          this.game.state.nextTurn = player
      }
    } catch (error) {}
  }

  isGameOver(): void {

    //if...
        this.game.state.isGameOver = true
        this.game.state.results = {
          type: 'winner',
          winner: ''
        }
        return
      
  } 
}

type EANState = {
  nextTurn: string,
  round: number,
  type: NumberType,
  number: number,
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

type PlayerState = {
  username: string,
}

type NumberType = 'evens' | 'nones'