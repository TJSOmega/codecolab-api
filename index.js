require('dotenv').config();
const mongoose = require('mongoose');
const io = require('socket.io')(3005)


const server = require('./src/server.js')


const PORT = process.env.PORT || 3333;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codecolab';
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };


io.on("connection", () => {
  console.log('App connected')
});

mongoose.connect(MONGODB_URI, options)
  .then(
    server.start(PORT)

  )

 
  