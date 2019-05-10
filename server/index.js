const express = require('express'),
      app = express(),
      session = require('express-session'),
      flash = require('connect-flash'),
      MongoStore = require('connect-mongo')(session),
      bodyParser = require('body-parser'),
      passport = require('./auth'),
      path = require('path')

const indexRoute = require('./routes/index'),
      loginRoute = require('./routes/login')

//MongoDB
const mongoose = require('./mongo')

app.set('views', path.join(__dirname, '../client/views'))
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, '../client/public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: 'SecretKey',
    resave: false,
    cookie: {
        maxAge: 60000
    },
    saveUninitialized: true,
    //store: new MongoStore({ mongooseConnection: mongoose.connection })
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//Routes
app.use('/', indexRoute)
app.use('/login', loginRoute)
//app.use('/logout', logoutRoute)

module.exports = app