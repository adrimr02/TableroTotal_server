import type { PlayerInfo } from "../sockets/types"
import { TicTacToe } from "./TicTacToeGame"
import {RockPaperScissors} from "./RPS"

interface Game {
  /**
   * Function called to start the game. It should include the main loop of the game
   */
  startGameLoop(): void

  /**
   * Function called when a player leaves the game.
   * 
   * @param playerId Id of the player that left
   */
  playerLeave(playerId: string): void

  /**
   * Function called when a new player joins the game.
   * 
   * @param playerInfo Includes all the information of the new player.
   */
  addPlayer(playerInfo: PlayerInfo): boolean

  /**
   * Function called when one of the players makes their move. 
   * This function is independent from the main loop and may be called at any time.
   * It should only update the game state.
   * 
   * @param playerId Id of the player that made the move
   * @param action Information about the movement made. Each game can have its own
   */
  move(playerId: string, action: unknown): void
}

type GameState<TGameState, TPlayerState> = {
  config: {
    timeout: number,
    maxPlayers: number
    //TODO rondas
  },
  state: TGameState,
  players: Record<string, TPlayerState>
}

export {
  Game,
  GameState,
  TicTacToe,
  RockPaperScissors
}
