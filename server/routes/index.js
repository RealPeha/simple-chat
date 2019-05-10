const express = require('express'),
      router = express.Router(),
      Message = require('../models/message'),
      User = require('../models/user')

router.get('/', function (req, res, next) {
      if (!req.isAuthenticated()) {
        return res.redirect('/login')
      }
      next()
    }, async (req, res) => {
      const user = req.user
      const messages = await Message.find({})
      res.render('index', {
        messages: messages,
        user: user
      })
})
router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/login')
})

module.exports = router