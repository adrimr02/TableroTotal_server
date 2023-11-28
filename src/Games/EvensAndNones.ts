import { number, string, z } from 'zod'
import type { Game, GameState } from "./Game"
import type { PlayerInfo } from '../sockets/types'

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: unknown) => void
  round: (round: number) => void
  showResults: (results: unknown) => void
  showInitialInfo: (info: unknown) => void
}

const moveActionParser = z.object({ cell: z.number().int().min(0).max(8) })

export class EvensAndNones implements Game {
  public static MaxPlayers = 10
  public static MaxRound = 10

  //Estado inicial de la partida
  private game: GameState<EANState, PlayerState> = {
    config: {
      timeout: 30,
      maxPlayers: 10
    },
    state: {
      round: 0,
      chart: new Map<String, number>(),
      isGameOver: false,
      number: 0,
      winner: {}
    },
    players: {},
  }

  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']
  private getRound: ControlFuntions['round']
  private showResults: ControlFuntions['showResults']
  private showInitialInfo: ControlFuntions['showInitialInfo']

  constructor(controlFn: ControlFuntions) {
    this.finishGame = controlFn.finishGame
    this.showCountdown = controlFn.showCountdown
    this.getRound = controlFn.round
    this.showResults = controlFn.showResults
    this.showInitialInfo = controlFn.showInitialInfo
  }

  startGameLoop(): void {
    // Primera ronda
    if (this.game.state.round == 0) { 
      //this.game.state.round = Object.keys(this.game.players)[Math.floor(Math.random() * Object.keys(this.game.players).length)] // First turn is random
      this.showInitialInfo({})
    }

    this.isGameOver()

    if (this.game.state.isGameOver) {
      this.finishGame(this.game.state.winner)
      return
    }

    const round = this.game.state.round
    this.getRound(round)
    this.showCountdown(this.game.config.timeout,

      () => {
        //TODO hacer que calcule las puntuaciones una vez terminado el tiempo
        //this.showResults({ board: this.game.state.board })
        this.startGameLoop()
      },

      () => {
        //TODO comprobar si todos han respondido y pasar a la fase de comprobación
        return false
      })
  }

  getOtherPlayer(player: string) : string {
    /*for (const otherPlayer of Object.keys(this.game.players)) {
      if (player !== otherPlayer)
        return otherPlayer
    }
    return 'no_player'*/

    return ''
  }

  addPlayer(playerInfo: PlayerInfo): boolean {
    //añadimos jugador si hay menos de 10
    if (Object.keys(this.game.players).length === this.game.config.maxPlayers)
      return false
    this.game.players[playerInfo.id] = { ...playerInfo}
    return true
  }

  playerLeave(playerId: string): void {
    /*this.game.state.isGameOver = true
    this.game.state.results = {
      type: 'resignation',
      winner: this.getOtherPlayer(playerId)
    }*/
  }

  //TODO este método se encargará de actualizar la tabla de puntuaciones
  //y pasar a la siguiente ronda
  move(playerId: string, action: unknown): void {
    /*if (playerId !== this.game.state.round)
      return // Not their turn

    try {

      // Gives turn to next player
      for (const player of Object.keys(this.game.players)) {
        if (player !== playerId)
          this.game.state.round = player
      }
    } catch (error) {} */
  }

  isGameOver(): void {
    //Si se han completado todas las rondas
    if(this.game.state.round > EvensAndNones.MaxRound){
      this.game.state.isGameOver = true

        //Dame el jugador con más puntos
        this.game.state.winner = {
          winner: this.getWinner()[0],
          points: this.getWinner()[1]
        }
    }      
  } 

  getWinner(): [string, number] {
    var winner
    var points = 0

    for (let [clave, valor] of this.game.state.chart) {
      console.log(`Clave: ${clave}, Valor: ${valor}`);
      if(valor > points){
        winner = clave
        points = valor
      }
    }

    return [winner, points]
  }

}

type EANState = {
  round: number
  chart: Map<String, number>
  number: number
} & ({
  isGameOver: false
  winner: Record<string, never>
} | {
  isGameOver: true
  winner: GameResults
})

type GameResults = {
  winner: string
  points: number
}

type PlayerState = {
  username: string
}

type NumberType = 'evens' | 'nones'