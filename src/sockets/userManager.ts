class UserManager {

  private players: Record<string, { room: string | null }> = {}

  addPlayer(id: string) {
    if (this.players[id])
      return

    this.players[id] = { room: null }
  }

  removePlayer(id: string) {
    if (this.players[id])
      delete this.players[id]

  }

  playerJoins(playerId: string, room: string): boolean {
    if (!this.players[playerId] || this.players[playerId].room)
      return false

    this.players[playerId].room = room
    return true
  }

  playerLeaves(playerId: string, room: string): boolean {
    if (this.players[playerId] && this.players[playerId].room === room) {
      this.players[playerId].room = null
      return true
    }
    return false
  }

  getPlayer(id: string) {
    if (!this.players[id])
      return null
    return this.players[id]
  }
}
const userManager = new UserManager()

export default userManager

