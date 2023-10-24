import type { GameNamespace, GameOptions, GameSocket } from './types'

export class Room {
  private io: GameNamespace
  private socket: GameSocket
  private players: string[]
  private gameOptions: GameOptions
  private roomCode: string

  constructor(options: { io: GameNamespace; socket: GameSocket; roomCode: string; gameOptions: GameOptions }) {
    this.io = options.io
    this.socket = options.socket
    this.roomCode = options.roomCode
    this.gameOptions = options.gameOptions
    this.players = [this.socket.id]
  }

  public init() {
    this.socket.join(this.roomCode)
    this.socket.on('disconnect', () => {
      this.players = this.players.filter((id) => id !== this.socket.id)
      if (this.players.length === 0) {
        this.io.adapter.rooms.delete(this.roomCode)
      }

      switch (this.gameOptions.game) {
        case 'rock_paper_scissors':
          break
        case 'even_odd':
          break
        case 'tic_tac_toe':
          break
      }
    })
  }
}
