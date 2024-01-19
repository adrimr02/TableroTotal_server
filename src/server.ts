import express from 'express'
import { createServer } from 'http'
import { initSocketServer } from './sockets/server'
import 'dotenv/config'

const app = express()
const httpServer = createServer(app)
app.set('port', process.env.PORT || 3000)

app.get('/', (_req, res) => {
  res.send('Hello World!')
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

initSocketServer(httpServer)

httpServer.listen(app.get('port'), () => {
  return console.log(`Express is listening at http://localhost:${app.get('port')}`)
})

export type HttpServer = typeof httpServer
