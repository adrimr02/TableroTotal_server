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

const moveActionParser = z.object({ numberType: z.union([z.literal('evens'), z.literal('nones')]), number: z.number().int() })

export class EvensAndNones implements Game {
  public static MaxPlayers = 10
  public static MaxRound = 10
  public static PointsPerWin = 3

  //Estado inicial de la partida
  private game: GameState<EANState, PlayerState> = {
    config: {
      timeout: 30,
      maxPlayers: 10
    },
    state: {
      round: 1,
      chart: new Map<string, number>(),
      infoRound: new Map(),
      isGameOver: false,
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
    const round = this.game.state.round

    this.game.state.infoRound.clear()

    // Primera ronda
    if (this.game.state.round == 1) { 
      this.showInitialInfo({round})
    }

    this.showCountdown(this.game.config.timeout,

      () => {
        this.calculatePoints()

        this.showResults({
          round: round+1,
          chart: Object.entries(this.game.state.chart).map(x => {
            return {
              points: x[1],
              playerId: x[0],
              username: this.game.players[x[0]].username
            }
          }).sort((x, y) => {
            return x.points - y.points
          })
        })

        this.isGameOver()

        if (this.game.state.isGameOver) {
          this.finishGame(this.game.state.winner)
          return
        }

        this.game.state.round++

        this.startGameLoop()
      },

      () => {
        return Object.keys (this.game.state.infoRound).length == Object.keys(this.game.players).length
      })    
  }

  calculatePoints(){
    var sum = 0;
    var value;

    for(var values of Object.values(this.game.state.infoRound)){
      sum += values.number
    }

    for(var entries of Object.entries(this.game.state.infoRound)){
      if(sum%2 == 0){
        if(entries[1].numberType == 'evens'){
          //this.game.state.chart[entries[0]] += EvensAndNones.PointsPerWin;
          value = this.game.state.chart.get(entries[0]) || 0
          this.game.state.chart.set(entries[0], value + EvensAndNones.PointsPerWin);
        }        
      } else {
        if(entries[1].numberType == 'nones'){
          //this.game.state.chart[entries[0]] += EvensAndNones.PointsPerWin;
          value = this.game.state.chart.get(entries[0]) || 0
          this.game.state.chart.set(entries[0], value + EvensAndNones.PointsPerWin);
        }
      }
    }

  }

  addPlayer(playerInfo: PlayerInfo): boolean {
    //añadimos jugador si hay menos de 10
    if (Object.keys(this.game.players).length === this.game.config.maxPlayers)
      return false

    this.game.players[playerInfo.id] = { ...playerInfo}

    //this.game.state.chart[playerInfo.id] = 0
    this.game.state.chart.set(playerInfo.id, 0)

    return true
  }

  playerLeave(_playerId: string): void {
  }

  move(playerId: string, action: unknown): void {
    var obj = moveActionParser.parse(action)
    this.game.state.infoRound.set(playerId, {number: obj.number, typeNumber: obj.numberType})
  }

  isGameOver(): void {
    //Si se han completado todas las rondas
    if(this.game.state.round == EvensAndNones.MaxRound){
      this.game.state.isGameOver = true

        //Dame el jugador con más puntos
        this.game.state.winner = {
          winner: this.game.players[this.getWinner()[0]].username,
          points: this.getWinner()[1]
        }
    }      
  } 

  getWinner(): [string, number] {
    var winner = ""
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
  chart: Map<string, number>
  infoRound: Map<string, {number: number, typeNumber: NumberType}>
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