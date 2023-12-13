import { RoomManager } from './roomManager'
import { Server } from 'socket.io'
import type { HttpServer } from '../server'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types'
import { genRoomCode } from '../util'
import userManager from './userManager'

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer)
  const gameIo = io.of('/play')

  const roomManager = new RoomManager(gameIo)

  gameIo.on('connection', (socket) => {
    userManager.addPlayer(socket.id)
    socket.on('create', (username, options, callback) => {
      socket.data.username = username
      
      let roomCode = genRoomCode()
      while (gameIo.adapter.rooms.get(roomCode)) {
        roomCode = genRoomCode()
      }

      if (!userManager.playerJoins(socket.id, roomCode)) {
        return // User already in a room
      }

      const room = roomManager.createRoom(roomCode, options)

      if (!room) {
        return callback({
          status: 'error',
          errorMessage: 'cannot_create_room',
        })
      }

      room.init()
      if (!room.join(socket)) {
        return callback({
          status: 'error',
          errorMessage: 'cannot_join_room',
        })
      }

      callback({
        status: 'ok',
        roomCode,
        gameOptions: room.gameOptions,
      })
    })
    socket.on('join', (username, code, callback) => {
      socket.data.username = username
      const room = roomManager.getRoom(code.toUpperCase())
      if (!room) {
        return callback({
          status: 'error',
          errorMessage: 'room_not_found',
        })
      }

      if (!userManager.playerJoins(socket.id, code)) {
        return // User already in a room
      }

      if (!room.join(socket)) {
        return callback({
          status: 'error',
          errorMessage: 'cannot_join_room',
        })
      }

      callback({
        status: 'ok',
        gameOptions: room.gameOptions,
      })
    })
    socket.on('disconnect', () => {
      userManager.removePlayer(socket.id)
    })
  })
}
