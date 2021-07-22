const express = require('express');
require('dotenv').config();
const cors = require('cors')

const v1Routes = require('./routes/v1.js');
const errorHandler = require('./error-handlers/500.js');
const notFound = require('./error-handlers/404.js');
const logger = require('./middleware/logger.js')


const app = express()

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(logger)
app.use(v1Routes);
app.use(notFound);
app.use(errorHandler);



module.exports = {
  server: app,
  start: (port) => {
    app.listen(port, () => {
      console.log(`Server and Socket.io up on ${port}`);
    });
  },
};