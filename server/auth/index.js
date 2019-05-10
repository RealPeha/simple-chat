const passport = require('passport'),
      User = require('../models/user')

const LocalStrategy = require('passport-local').Strategy
const GitHubStrategy = require('passport-github').Strategy

const init = () => {

    passport.serializeUser(function(user, done) {
        done(null, user.nickname + '||' + user.kind)
    })

    passport.deserializeUser(function(nickname, done) {
        const data = nickname.split('||')
        User.findOne({lowercasenick: data[0].toLowerCase(), kind: data[1]}, function(err, user) {
            done(err, user)
        })
    })

    //Local Strategy
    passport.use(new LocalStrategy({
        passwordField: 'password',
        usernameField: 'nickname',
        passReqToCallback : true,
        failureFlash: true
    }, async (req, nickname, password, done) => {
            User.findOne({lowercasenick: nickname.toLowerCase(), kind: 'local'}, async (err, user) => {
                    if (err) return done(err)
                    if(!user) {
                        const flash = []
                        const reg = /^[a-z][a-z0-9]*?([-_][a-z0-9]+){0,2}$/i
                        if (nickname.length < 3) {
                            flash.push(req.flash('error', 'Длинна ника должна быть больше 2 символов'))
                        }
                        if (!reg.test(nickname)) {
                            flash.push(req.flash('error', 'Нельзя использовать спец. символы кроме - и _ в качестве никнейма'))
                        }
                        if (password.length < 6) {
                            flash.push(req.flash('error', 'Длинна пароля должна быть больше 5 символов'))
                        }
                        if (flash.length) {
                            return done(null, false, flash)
                        }
                        user = new User({
                            lowercasenick: nickname.toLowerCase(),
                            nickname: nickname,
                            password: password
                        })
                        await user.save()
                        return done(null, user)
                    } else {
                        user.validatePassword(password, (err, res) => {
                            if (err) return done(err)
                            if (!res) return done(null, false, {message: 'Неверный пароль'})
                            return done(null, user)
                        })
                    }
            })
        }
    ))

    //Github Strategy
    passport.use(
        new GitHubStrategy({
            clientID: 'cf8ace18ae559c8dfe57',
            clientSecret: '1c55b8433638e1bafe52482bc0bad853841f947c',
            callbackURL: 'http://localhost:3000/login/github/callback'
        },
        function(accessToken, refreshToken, profile, done) {
            const gituser = {
                nickname: profile.username
            }
            User.findOne({lowercasenick: gituser.nickname.toLowerCase(), kind: 'github'}, async (err, user) => {
                if (err) return done(err)
                if(!user) {
                    user = new User({
                        lowercasenick: gituser.nickname.toLowerCase(),
                        nickname: gituser.nickname,
                        kind: 'github'
                    })
                    await user.save()
                }
                return done(null, user)
            })
        }
    ))

    return passport
}

module.exports = init()