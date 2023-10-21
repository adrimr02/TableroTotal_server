import { Server } from 'socket.io'
import type { HttpServer } from '../server'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types'

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer)

  io.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('join', (code, username, callback) => {
      console.log('join', code, username)
      socket.data.username = username

      // Check if room exists
      // Get room data

      callback({
        status: 'ok',
        game: 'rock_paper_scissors',
      })
    })
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
}
