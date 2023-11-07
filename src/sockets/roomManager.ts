import { type Game, TicTacToe } from '../Games/Game'
import type { GameNamespace, GameSocket, GameOptions, ReadyState } from './types'

export class RoomManager {
  private io: GameNamespace
  private rooms: Record<string, Room>
  constructor(io: GameNamespace) {
    this.io = io
    this.rooms = {}
  }

  public getRoom(code: string): Room | null {
    return this.rooms[code] ?? null
  }

  public createRoom(roomCode: string, gameOptions: GameOptions): Room | null {
    try {
      const room = new Room(this.io, roomCode, gameOptions)
      return room
    } catch (e: unknown) {
      return null
    }
  }
}

export const Rooms: Record<string, Room> = {}

class Room {
  private io: GameNamespace
  private players: GameSocket[] = []
  private gameOptions: GameOptions
  private roomCode: string
  private game: Game | null // TODO eliminar null al tener todos los juegos
  private waitingState: Record<string, ReadyState> = {}

  constructor(io: GameNamespace, roomCode: string, gameOptions: GameOptions) {
    this.io = io
    this.roomCode = roomCode
    this.gameOptions = gameOptions
    switch (this.gameOptions.game) {
      case 'rock_paper_scissors':
        this.game = null
        break
      case 'even_odd':
        this.game = null
        break
      case 'tic_tac_toe':
        this.game = new TicTacToe({
          finishGame: this.finishGame,
          showCountdown: this.showCountdown
        })
        break
      default:
        throw new Error('Invalid game')
    }
  }

  public init() {
    // Start waiting time
    this.showCountdown(30, this.startGame, () => {
      for (const playerState of Object.values(this.waitingState)) {
        if (playerState === 'not_ready') return false
      }
      return true
    })
    // Initializing player ready listener
    for (const player of this.players) {
      this.initMarkAsReadyListener(player)
    }
  }

  public join(newPlayer: GameSocket) {
    this.players.push(newPlayer)
    newPlayer.join(this.roomCode)
    this.waitingState[newPlayer.id] = 'not_ready'
    this.showPlayers()
    newPlayer.on('disconnect', () => {
      this.players = this.players.filter((player) => player.id !== newPlayer.id)
      if (this.players.length === 0) {
        this.io.adapter.rooms.delete(this.roomCode)
      } else {
        this.showPlayers()
      }
    })
  }

  private showPlayers() {
    this.io.to(this.roomCode).emit("show_players_waiting", { 
      players: this.players.map(p => ({ 
        username: p.data.username, readyState: this.waitingState[p.id] 
      }))
    })
  }

  private finishGame(results: string) {
    results
  }

  private showCountdown(timeout: number, callback: () => void, isDone?: (counter: number) => boolean) {
    let counter = timeout
    const countDownInterval = setInterval(() => {
      this.io.to(this.roomCode).emit('show_time', { counter })
      counter--
      if (counter === 0 || isDone?.(counter)) {
        clearInterval(countDownInterval)
        callback()
      }
    }, 1000)
    return countDownInterval
  }

  private startGame() {
    // start game logic
    this.game //...
  }

  private initMarkAsReadyListener(player: GameSocket) {
    player.on('mark_as_ready', (callback) => {
      if (this.waitingState[player.id] === 'ready') this.waitingState[player.id] = 'not_ready'
      else if (this.waitingState[player.id] === 'not_ready') this.waitingState[player.id] = 'ready'
      this.showPlayers()
      callback(this.waitingState[player.id])
    })
  }
}
