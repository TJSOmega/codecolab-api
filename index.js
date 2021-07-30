const express = require('express');
require('dotenv').config();
const cors = require('cors')
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const axios = require('axios');




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

//From the chat application not currently in use

// const getUser = (id) => users.find((user) => user.id === id);
// const getUsersInRoom = (room) => users.filter((user) => user.room === room);

let users = [];
let rooms = [];

async function board() {
  const response = await axios.get('https://www.groupboard.com/mp/freegbbutton.cgi')
  const cookies = response.headers['set-cookie'];


  let index = cookies[0]


  let items = index.split(';');


  let fullCookie = items[0];


  let splitCookie = fullCookie.split('=')

  let cookieKey = splitCookie[1];

  return cookieKey;
}

// Connection to Socket.io
io.on('connection', socket => {

  let user = {}
  let roomObj = {}

  console.log('CLIENT CONNECTED', socket.id)

  if (rooms) {
    io.emit('room-data', rooms)
  }


  socket.on('user-signup', payload => {

    if (socket.id !== user.user_id) {
      user = {
        user_name: payload,
        user_id: socket.id,
        room: ''
      }
    }

    console.log('USERNAME SET')
    console.log(user)

    users.push(user)

    io.emit('user-return', user)
  })



  socket.on('question', async payload => {
    let roomName

    let boardKey = await board();



    users.forEach(u => {



      if (u.user_id === socket.id) {
        roomName = payload.room

        u.room = roomName

        roomObj = {
          question: payload.question,
          room_id: roomName,
          activeUsers: 0,
          board: boardKey
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

    // socket.join(roomObj.room)


    // socket.on('sendMessage', (message, callback) => {
    //   console.log('MESSAGE', message)

    //   users.forEach(u => {
    //     console.log('users', u)
    //     if (u.user_id === socket.id) {
    //       console.log("USER ROOM", u.room)
    //       io.to(u.room).emit('message', { user: u.user_name, text: message });

    //       callback();
    //     }

    //   })

    // });

    socket.join(payload.room)
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


    users.forEach(user => {
      if(socket.id === user.user_id){
        user.room = payload
      }
    })
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


    io.emit('room-data', rooms)

    console.log('SOCKET ROOMS', socket.rooms)
    console.log('IO MANAGER ROOMS', io.sockets.adapter.rooms)
  })

  socket.on('leave-room', payload => {

    users.forEach(user => {
      if (user.user_id === socket.id) {
        rooms.forEach(room => {

          if (user.room === room.room_id) {
            socket.leave(user.room)
            room.activeUsers = room.activeUsers - 1
          }
        })
      }
    })

    rooms = rooms.filter(room => {
      if (room.activeUsers > 0) {
        return room
      }
    })


    io.emit('room-data', rooms)
  })


  users.forEach(u => {
    console.log('USERS', u)
    if (u.user_id === socket.id) {

      socket.emit('message', { user: 'admin', text: `${u.user_name}, welcome!` });
      socket.broadcast.to(u.room).emit('message', { user: 'admin', text: `${u.user_name} has joined!` });
    }
  })

  'SOCKET RECEIVE', socket.on('sendMessage', (message, callback) => {
    console.log('MESSAGE', message)

    users.forEach(u => {
      if (u.user_id === socket.id) {
        console.log('MESSAGE USER', u)
        io.to(u.room).emit('message', { user: u.user_name, text: message })

        callback();
      }

    })

  });

  socket.on('disconnect', () => {
    console.log('CLIENT DISCONNECTED')


    users.forEach(u => {
      if (u.user_id === socket.id) {
        io.to(user.room).emit('chat-data', { room: user.room, users: u.user_name })
      }
    })

    console.log('SOCKET ROOMS IN DISCONNECT', socket.rooms)
    users.forEach(user => {
      if (user.user_id === socket.id) {
        rooms.forEach(room => {
          console.log(room.room_id)
          if (user.room === room.room_id) {
            room.activeUsers = room.activeUsers - 1
          }
        })
      }
    })

    rooms = rooms.filter(room => {
      if (room.activeUsers > 0) {
        return room
      }
    })

    users = users.filter(u => u.user_id !== socket.id)

    io.emit('room-data', rooms)

    console.log('ACTIVE USERS', users)
    console.log('ACTIVE ROOMS', rooms)
  })



  // })
})



mongoose.connect(MONGODB_URI, options)
  .then(
    server.listen(port, () => console.log(`Now listening on port ${port}.`))
  )
