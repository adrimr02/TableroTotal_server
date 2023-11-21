import type { Namespace, Socket } from 'socket.io'
export interface ServerToClientEvents {
  // General events
  error: (params: { msg?: string, code: string }) => void
  
  // Room events
  show_time: (params: { counter: number }) => void

  show_players_waiting: (params : { players: PlayerList }) => void

  start_game: () => void
  
  // Game events
  show_initial_info: (params: unknown) => void

  next_turn: (params: { players: PlayerInfo[] }) => void
  
  show_turn_results: (results : unknown) => void

  finish_game: (results: unknown) => void
}

export interface ClientToServerEvents {
  // General events
  create: (
    username: string,
    gameOptions: GameOptions,
    callback: (
      params: { status: 'ok'; roomCode: string; gameOptions: GameOptions } | { status: 'error'; errorMessage: string },
    ) => void,
  ) => void

  join: (
    username: string,
    code: string,
    callback: (params: { status: 'ok'; gameOptions: GameOptions } | { status: 'error'; errorMessage: string }) => void,
  ) => void

  // Room events
  mark_as_ready: (callback: (newState: ReadyState) => void) => void

  // Game events
  move: (action: unknown) => void
}

export interface SocketData {
  username: string
}

const games = ['rock_paper_scissors', 'tic_tac_toe', 'even_odd'] as const

type Game = (typeof games)[number]

type PlayerList = {
  username: string,
  readyState: ReadyState
}[]

export type PlayerInfo = {
  id: string
  username: string
}

export type GameNamespace = Namespace<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export type GameOptions = {
  game: Game
  maxPlayers: number
  rounds: number
  timeout?: number
}

export type ReadyState = 'ready' | 'not_ready'
