const express = require('express'),
      router = express.Router()
      passport = require('passport')

const User = require('../models/user')

router.get('/', (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
  }, (req, res) => {
    res.render('login', {
      errors: req.flash('error')
    })
  })

router.post('/', (req, res, next) => {
  if (req.body.nickname == '' || req.body.password == '') {
    req.flash('error', 'Заполните все поля')
    return res.render('login', {
      errors: req.flash('error')
    })
  }
  next()
}, passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true}))

router.get('/github', passport.authenticate('github'))
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/')
})

module.exports = router