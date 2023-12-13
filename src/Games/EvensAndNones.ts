import {z} from 'zod'
import type { Game, GameState } from "./Game"
import type { PlayerInfo } from '../sockets/types'

type ControlFuntions = {
  showCountdown: (timeout: number, callback: () => void, isDone?: (counter: number) => boolean) => NodeJS.Timeout
  finishGame: (results: unknown) => void
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
      maxPlayers: 10,
      rounds: EvensAndNones.MaxRound
    },
    state: {
      round: 1,
      isMoveAllowed: false,
      chart: new Map<string, number>(),
      infoRound: new Map(),
      isGameOver: false,
      winner: {}
    },
    players: {},
  }

  private showCountdown: ControlFuntions['showCountdown']
  private finishGame: ControlFuntions['finishGame']
  private showResults: ControlFuntions['showResults']
  private showInitialInfo: ControlFuntions['showInitialInfo']

  constructor(controlFn: ControlFuntions, rounds: number) {
    this.finishGame = controlFn.finishGame
    this.game.config.rounds = rounds
    this.showCountdown = controlFn.showCountdown
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

    this.game.state.isMoveAllowed = true
    this.showCountdown(this.game.config.timeout,
      () => {
        this.game.state.isMoveAllowed = false
        this.calculatePoints()
        this.showResults({
          round: round+1,
          chart: Array.from(this.game.state.chart.entries()).map(x => {
            return {
              points: x[1],
              playerId: x[0],
              username: this.game.players[x[0]].username
            }
          }).sort((x, y) => {
            return y.points - x.points
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
        return Array.from(this.game.state.infoRound.keys()).length == Object.keys(this.game.players).length
      })    
  }

  calculatePoints(){
    let sum = 0;
    let value;

    for(const values of this.game.state.infoRound.values()){
      sum += values.number
    }

    for(const entry of this.game.state.infoRound.entries()){
      if(sum%2 == 0){
        if(entry[1].typeNumber == 'evens'){
          //this.game.state.chart[entries[0]] += EvensAndNones.PointsPerWin;
          value = this.game.state.chart.get(entry[0]) || 0
          this.game.state.chart.set(entry[0], value + EvensAndNones.PointsPerWin);
        }        
      } else {
        if(entry[1].typeNumber == 'nones'){
          //this.game.state.chart[entries[0]] += EvensAndNones.PointsPerWin;
          value = this.game.state.chart.get(entry[0]) || 0
          this.game.state.chart.set(entry[0], value + EvensAndNones.PointsPerWin);
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
    if (!this.game.state.isMoveAllowed) return
    //TODO TRY CATCH
    try {
      const obj = moveActionParser.parse(action)
      this.game.state.infoRound.set(playerId, {number: obj.number, typeNumber: obj.numberType})
    } catch(e) {}
  }

  isGameOver(): void {
    //Si se han completado todas las rondas
    if(this.game.state.round == this.game.config.rounds){
      this.game.state.isGameOver = true

        //Dame el jugador con más puntos
        this.game.state.winner = {
          winner: this.game.players[this.getWinner()[0]].username,
          points: this.getWinner()[1]
        }
    }      
  } 

  getWinner(): [string, number] {
    let winner = ""
    let points = 0

    for (const [clave, valor] of this.game.state.chart) {
      if(valor > points) {
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
  infoRound: Map<string, {number: number, typeNumber: NumberType}>,
  isMoveAllowed: boolean
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