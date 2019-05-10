const mongoose = require('mongoose'),
      config = require('../../config')

const mongoDB = config.db || 'mongodb://localhost:27017/'

mongoose.connect(mongoDB, { useNewUrlParser: true })
.catch((err) => console.log(err))

module.exports = mongoose