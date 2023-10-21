import express from 'express'
import { initSocketServer } from './sockets/server'
import 'dotenv/config'

const app = express()
app.set('port', process.env.PORT || 3000)

app.get('/', (_req, res) => {
  res.send('Hello World!')
})

const httpServer = app.listen(app.get('port'), () => {
  return console.log(`Express is listening at http://localhost:${app.get('port')}`)
})

export type HttpServer = typeof httpServer

initSocketServer(httpServer)
