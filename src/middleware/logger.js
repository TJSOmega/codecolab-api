'use strict';

// ROUTE LEVEL THIS PROJECT
function logger (req, res, next) {
  console.log('request info', req.path, req.method);
  next()
}


module.exports = logger