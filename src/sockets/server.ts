import { Server } from 'socket.io'
import type { HttpServer } from '../server'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types'
import { genRoomCode } from '../util'

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer)

  const gameIo = io.of('/play')
  // const friendsIo = io.of('/friends')

  gameIo.on('connection', (socket) => {
    console.log('a user connected')
    socket.on('create', (username, options, callback) => {
      console.log('create', username, options)
      socket.data.username = username

      let roomCode = genRoomCode()
      while (gameIo.adapter.rooms.get(roomCode)) {
        roomCode = genRoomCode()
      }

      // Create room
      // Save room data

      callback({
        status: 'ok',
        roomCode,
        gameOptions: options,
      })
    })
    socket.on('join', (code, username, callback) => {
      console.log('join', code, username)
      socket.data.username = username

      // Check if room exists
      // Get room data

      callback({
        status: 'ok',
        gameOptions: {
          game: 'rock_paper_scissors',
          maxPlayers: 2,
          rounds: 3,
          timeout: 10,
        },
      })
    })
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
}
