import {} from 'socket.io'
export interface ServerToClientEvents {
  create: (username: string, gameOptions: GameOptions) => void
}

export interface ClientToServerEvents {
  join: (
    username: string,
    code: string,
    callback: ({ status, game }: { status: 'ok' | 'error'; game: Game }) => void,
  ) => void
}

export interface SocketData {
  username: string
}

const games = ['rock_paper_scissors', 'tic_tac_toe', 'even_odd'] as const

type Game = (typeof games)[number]

export type GameOptions = {
  game: Game
  players: number
  rounds: number
  timeout?: number
}
