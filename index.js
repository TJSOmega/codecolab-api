const express = require('express');
require('dotenv').config();
const cors = require('cors')
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io')


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
  origin: "https://example.com",
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
  console.log(socket.id)
  console.log('CLIENT CONNECTED!')
  socket.send('Hello and welcome to Code Co Lab!')
})

mongoose.connect(MONGODB_URI, options)
  .then(
    server.listen(port, () => console.log(`Now listening on port ${port}.`))
  )
