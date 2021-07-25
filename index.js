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

const getUser = (id) => users.find((user) => user.id === id);
const getUsersInRoom = (room) => users.filter((user) => user.room === room);

io.on('connection', socket => {
  let user = {}
  let roomObj = {}
  console.log('CLIENT CONNECTED', socket.id)

  io.emit('room-data', rooms)

  socket.on('user-signup', payload => {
    user = {
      user_name: payload,
      user_id: socket.id,
      room: ''
    }

    console.log('USERNAME SET')
    console.log(user)

    users.push(user)
    console.log(users)

    io.emit('user-return', user)
  })



  socket.on('question', payload => {
    console.log(payload)
    console.log('RECEIVED EMIT')
    let roomName = ''


    users.forEach(u => {
      if (u.user_id === socket.id) {
        roomName = `${payload.question._id}${u.user_id}`

        u.room = roomName

        roomObj = {
          name: payload.question.name,
          room_id: roomName,
          activeUsers: 0
        }
      }
    })


    for (const el of socket.rooms) {
      if (socket.rooms.has(el) && el !== socket.id) {
        socket.leave(el)

        rooms.forEach(room => {
          if (el === room.room_id) {
            room.activeUsers = room.activeUsers - 1

          }
        })
      }

    }
    rooms.push(roomObj)
    console.log(rooms)
    socket.join(roomName)

    socket.on('sendMessage', (message, callback) => {
      console.log('MESSAGE', message)

      users.forEach(u => {
        if (u.user_id === socket.id) {
          console.log("USER ROOM", u.room)
          io.to(u.room).emit('message', { user: u.user_name, text: message });
        }
      })
      callback();
    });

    socket.join(payload)
    rooms.forEach(room => {
      if (payload === room.room_id) {
        room.activeUsers += 1
      }
    })


    rooms.forEach(room => {
      if (roomName === room.room_id) {
        room.activeUsers += 1
      }
    })
    rooms = rooms.filter(room => {
      if (room.activeUsers > 0) {
        return room
      }
    })





    console.log('SOCKET ROOMS', socket.rooms)
    console.log('IO MANAGER ROOMS', io.sockets.adapter.rooms)

    io.emit('room-data', rooms)
  });


  socket.on('join-room', payload => {

    for (const el of socket.rooms) {
      if (socket.rooms.has(el) && el !== socket.id) {
        socket.leave(el)



        rooms.forEach(room => {
          if (el === room.room_id) {
            room.activeUsers = room.activeUsers - 1
          }
        })

      }
    }

    users.forEach(u => {
      if (u.user_id === socket.id) {
        u.room = payload

        socket.emit('message', { user: 'admin', text: `${u.user_name}, welcome!` });
        socket.broadcast.to(u.room).emit('message', { user: 'admin', text: `${u.user_name} has joined!` });
      }
    })

    socket.on('sendMessage', (message, callback) => {
      console.log('MESSAGE', message)

      users.forEach(u => {
        if (u.user_id === socket.id) {
          console.log("USER ROOM", u.room)
          io.to(u.room).emit('message', { user: u.user_name, text: message });
        }
      })
      callback();
    });

    socket.join(payload)
    rooms.forEach(room => {
      if (payload === room.room_id) {
        room.activeUsers += 1
      }
    })

    rooms = rooms.filter(room => {
      if (room.activeUsers > 0) {
        return room
      }
    })



    console.log('SOCKET ROOMS', socket.rooms)
    console.log('IO MANAGER ROOMS', io.sockets.adapter.rooms)
    console.log(rooms)
  })



  socket.on('disconnect', () => {
    console.log('CLIENT DISCONNECTED')


    users.forEach(u => {
      if (u.user_id === socket.id) {
        io.to(user.room).emit('roomData', { room: user.room, users: u.user_name })
      }
    })

    console.log('SOCKET ROOMS IN DISCONNECT', socket.rooms)

    console.log(users)
    users = users.filter(u => u.user_id !== socket.id)

    users.forEach(user => {
      if(user._id === socket.id) {
        rooms.forEach(room => {
          if(user.room === room.room_id){
            room.activeUsers = room.activeUsers - 1
          }
        })
      }
    })
    // for (const el of socket.rooms) {
    //   if (socket.rooms.has(el) && el !== socket.id) {
    //     socket.leave(el)

    //     rooms.forEach(room => {
    //       if (room.room_id.includes()) {
    //         room.activeUsers = room.activeUsers - 1

    //       }
    //     })
    //   }

    // }
    // rooms = rooms.filter(room => {
    //   if (room.activeUsers > 0) {
    //     return room
    //   }
    // })
    console.log(users)
    console.log(rooms)
  })



  // })
})



mongoose.connect(MONGODB_URI, options)
  .then(
    server.listen(port, () => console.log(`Now listening on port ${port}.`))
  )
