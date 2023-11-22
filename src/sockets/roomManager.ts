import { type Game, TicTacToe, RockPaperScissors } from '../Games/Game'
import type { GameNamespace, GameSocket, GameOptions, ReadyState, PlayerInfo } from './types'
import userManager from './userManager'

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
      const room = new Room(this.io, roomCode, gameOptions, () => this.deleteRoom(roomCode))
      this.rooms[roomCode] = room
      return room
    } catch (e: unknown) {
      console.error(e)
      return null
    }
  }

  public deleteRoom(roomCode: string) {
    delete this.rooms[roomCode]
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
  private clientsReady: Record<string, boolean> = {}
  private closeRoom: () => void

  constructor(io: GameNamespace, roomCode: string, gameOptions: GameOptions, closeRoom: () => void) {
    this.io = io
    this.roomCode = roomCode
    this.gameOptions = gameOptions
    this.closeRoom = closeRoom
    switch (this.gameOptions.game) {
      case 'rock_paper_scissors':
        this.game = new RockPaperScissors({
          finishGame: this.finishGame.bind(this),
          showCountdown: this.showCountdown.bind(this),
          showResults: this.showResults.bind(this)
        }, gameOptions.rounds)
        this.gameOptions.maxPlayers = RockPaperScissors.MaxPlayers
        break

      case 'even_odd':
        throw new Error(`Game ${this.gameOptions.game} not yet implemented`)

      case 'tic_tac_toe':
        this.game = new TicTacToe({
          finishGame: this.finishGame.bind(this),
          showCountdown: this.showCountdown.bind(this),
          nextTurn: this.nextTurn.bind(this),
          showResults: this.showResults.bind(this),
          showInitialInfo: this.showInitialInfo.bind(this),
        })
        this.gameOptions.maxPlayers = TicTacToe.MaxPlayers
        break
      default:
        throw new Error('Invalid game')
    }
  }

  public init() {
    // Start waiting time
    console.log('init')
    this.showCountdown(120, this.startGame.bind(this), () => {
      this.showPlayers()
      if (this.players.length === 0)
        return true
      for (const playerState of Object.values(this.waitingState)) {
        if (playerState === 'not_ready') return false
      }

      return this.players.length >= 2
    })
  }

  public join(newPlayer: GameSocket): boolean {
    if (this.players.length == this.gameOptions.maxPlayers) {
      return false
    }
    
    userManager.playerJoins(newPlayer.id, this.roomCode)
    
    this.players.push(newPlayer)
    newPlayer.join(this.roomCode)
    this.waitingState[newPlayer.id] = 'not_ready'
    this.clientsReady[newPlayer.id] = false
    this.initListeners(newPlayer)
    this.showPlayers()
    
    if (!this.game.addPlayer({ id: newPlayer.id, username: newPlayer.data.username }))
      return false

    console.log('player join')

    newPlayer.on('disconnect', () => {
      newPlayer.leave(this.roomCode)
      userManager.playerLeaves(newPlayer.id, this.roomCode)
      this.players = this.players.filter((player) => player.id !== newPlayer.id)
      this.game.playerLeave(newPlayer.id)
      console.log('player leave')
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
      console.log(player.data.username, this.waitingState[player.id])
      callback(this.waitingState[player.id])
    })

    player.on('move', (action) => {
      this.game.move(player.id, action)
    })

    player.on('client_ready', () => {
      this.clientsReady[player.id] = true
    })
  }

  private showCountdown(timeout: number, callback: () => void, isDone?: (counter: number) => boolean) {
    console.log(`countdown of ${timeout} seconds`)
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
    console.log('starting game')
    if (this.players.length < 2) {
      console.log('not enough players')
      this.io.to(this.roomCode).emit("error", { code: "not_enough_players" })
      this.closeRoom()
      return
    }
    this.io.to(this.roomCode).emit("start_game")

    const checkClients = () => {
      console.log("Waiting for clients ready")
      if (Object.values(this.clientsReady).includes(false)) {
        setTimeout(() => checkClients(), 200)
      } else {
        this.game.startGameLoop()
      }
    }

    checkClients()
  }

  private showInitialInfo(info: unknown) {
    this.io.to(this.roomCode).emit("show_initial_info", info)
  }

  private nextTurn(players: string[]) {
    console.log('next turn')
    // Anounces the players that will have the turn on the next round
    const playersInfo: PlayerInfo[] = this.players.filter(s => players.some(p => s.id === p)).map(p => ({ id: p.id, username: p.data.username }))
    this.io.to(this.roomCode).emit('next_turn', { players: playersInfo })
  }

  private showResults(results: unknown) {
    this.io.to(this.roomCode).emit("show_turn_results", results)
  }

  private finishGame(results: unknown) {
    for (const player of this.players)
      userManager.playerLeaves(player.id, this.roomCode)
    this.io.to(this.roomCode).emit("finish_game", results)
    this.closeRoom()
  }
}