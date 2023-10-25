import type { Namespace, Socket } from 'socket.io'
export interface ServerToClientEvents {}

export interface ClientToServerEvents {
  create: (
    username: string,
    gameOptions: GameOptions,
    callback: ({
      status,
      roomCode,
      gameOptions,
    }:
      | { status: 'ok'; roomCode: string; gameOptions: GameOptions }
      | { status: 'error'; roomCode: never; gameOptions: never }) => void,
  ) => void

  join: (
    username: string,
    code: string,
    callback: ({
      status,
      gameOptions,
    }: { status: 'ok'; gameOptions: GameOptions } | { status: 'error'; gameOptions: never }) => void,
  ) => void
}

export interface SocketData {
  username: string
}

const games = ['rock_paper_scissors', 'tic_tac_toe', 'even_odd'] as const

type Game = (typeof games)[number]

export type GameNamespace = Namespace<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export type GameOptions = {
  game: Game
  maxPlayers: number
  rounds: number
  timeout?: number
}
