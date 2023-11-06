export interface Game {
  nextRound(): void
  playerLeave(playerId: string): void

  // TODO Decidir tipos de la accion movimiento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  move(playerId: string, action: any): void
  nextRound(): void
  showResults(): void
  finishGame(): void
  showTime(): void
}
