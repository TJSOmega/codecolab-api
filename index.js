const express = require('express');
require('dotenv').config();
const cors = require('cors')
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io')

let users = [];
let rooms = [];


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codecolab';
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };

const port = process.env.PORT || 3333

const v1Routes = require('./src/routes/v1.js');

const errorHandler = require('./src/error-handlers/500.js');

const notFound = require('./src/error-handlers/404.js');

const logger = require('./src/middleware/logger.js');


const app = express()
const server = http.createServer(app)

const corsOption = {
  cors: true,
  origin: "*",
  methods: ["GET", "PUT"]
}
const io = socketio(server, corsOption)

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(logger)
app.use(v1Routes);
app.use(notFound);
app.use(errorHandler);

io.on('connection', socket => {
  console.log('CLIENT CONNECTED', socket.id)

  io.emit('room-data', rooms)

  socket.on('user-signup', payload => {
    let user = {
      user_name: payload,
      user_id: socket.id
    }
    console.log('USERNAME SET')
    console.log(user)

    users.push(user)
    console.log(users)
  })



  socket.on('question', payload => {
    console.log(payload)
    console.log('RECEIVED EMIT')
    let roomName = ''
    let roomObj = {}

    users.forEach(u => {
      if (u.user_id === socket.id) {
        roomName = `${payload.question._id}${u.user_id}`

        roomObj = {
          name: payload.question.name,
          room_id: roomName
        }
      }
    })

    rooms = rooms.filter(room => {
      if (!socket.rooms.has(room.room_id)) {
        return room
      }
      socket.leave(room.room_id)
    })

    socket.join(roomName)
    rooms.push(roomObj)

    console.log('SOCKET ROOMS', socket.rooms)
    console.log('IO MANAGER ROOMS', io.sockets.adapter.rooms)

    io.emit('room-data', rooms)
  });


  socket.on('join-room', payload => {

    rooms = rooms.filter(room => {
      if (!socket.rooms.has(room.room_id)) {
        return room
      }
    })
    
    socket.join(payload)

    console.log('SOCKET ROOMS', socket.rooms)
    console.log('IO MANAGER ROOMS', io.sockets.adapter.rooms)
  })

  socket.on('disconnect', () => {
    console.log('CLIENT DISCONNECTED')

    users = users.filter(u => u.user_id !== socket.id)

    rooms = rooms.filter(room => {
      if (!socket.rooms.has(room.room_id)) {
        return room
      }
    })

    console.log(users)
    console.log(rooms)
  })
})



mongoose.connect(MONGODB_URI, options)
  .then(
    server.listen(port, () => console.log(`Now listening on port ${port}.`))
  )
