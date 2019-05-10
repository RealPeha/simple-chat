const app = require('./server'),
      socket = require('./server/socket'),
      config = require('./config'),
      http = require('http')

const PORT = process.env.PORT || config.port

const server = http.createServer(app)
server.listen(PORT)
//Web socket
socket.create(server)