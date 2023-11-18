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
  public gameOptions: GameOptions
  private roomCode: string
  private game: Game // TODO eliminar null al tener todos los juegos
  private waitingState: Record<string, ReadyState> = {}

  constructor(io: GameNamespace, roomCode: string, gameOptions: GameOptions) {
    this.io = io
    this.roomCode = roomCode
    this.gameOptions = gameOptions
    switch (this.gameOptions.game) {
      // case 'rock_paper_scissors':
      //   this.game = null
      //   break
      // case 'even_odd':
      //   this.game = null
      //   break
      case 'tic_tac_toe':
        this.game = new TicTacToe({
          finishGame: this.finishGame,
          showCountdown: this.showCountdown,
          nextTurn: this.nextTurn,
          showResults: this.showResults,
        }, this.players.map(p => ({ id: p.id, username: p.data.username })))
        this.gameOptions.maxPlayers = TicTacToe.MaxPlayers
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
      this.initListeners(player)
    }
  }

  public join(newPlayer: GameSocket): boolean {
    if (this.players.length == this.gameOptions.maxPlayers) {
      return false
    }
    this.players.push(newPlayer)
    newPlayer.join(this.roomCode)
    this.waitingState[newPlayer.id] = 'not_ready'
    this.showPlayers()
    newPlayer.on('disconnect', () => {
      this.players = this.players.filter((player) => player.id !== newPlayer.id)
      this.game.playerLeave(newPlayer.id)
      if (this.players.length === 0) {
        this.io.adapter.rooms.delete(this.roomCode)
      } else {
        this.showPlayers()
      }
    })
    return true
  }

  private showPlayers() {
    this.io.to(this.roomCode).emit("show_players_waiting", { 
      players: this.players.map(p => ({ 
        username: p.data.username, readyState: this.waitingState[p.id] 
      }))
    })
  }

  private initListeners(player: GameSocket) {
    player.on('mark_as_ready', (callback) => {
      if (this.waitingState[player.id] === 'ready') this.waitingState[player.id] = 'not_ready'
      else if (this.waitingState[player.id] === 'not_ready') this.waitingState[player.id] = 'ready'
      this.showPlayers()
      callback(this.waitingState[player.id])
    })

    player.on('move', (action) => {
      this.game.move(player.id, action)
    })
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
    if (this.players.length < 2) {
      this.io.to(this.roomCode).emit("error", { code: "not_enough_players" })
      return
    }
    this.io.to(this.roomCode).emit("start_game")
    this.game.startGameLoop()
  }

  private nextTurn(players: string[]) {
    // Anounces the players that will have the turn on the next round
    this.io.to(this.roomCode).emit('next_turn', { players })
  }

  private showResults(results: unknown) {
    this.io.to(this.roomCode).emit("show_turn_results", results)
  }

  private finishGame(results: unknown) {
    this.io.to(this.roomCode).emit("finish_game", results)
  }
}
