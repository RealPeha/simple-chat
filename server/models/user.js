const mongoose = require('../mongo'),
      bcrypt = require('bcrypt'),
      crypto = require('crypto')

const Schema = mongoose.Schema

const UserSchema = new Schema(
    {
        nickname: String,
        lowercasenick: String,
        password: {
            type: String,
            default: ''
        },
        admin: {
            type: Boolean,
            default: false
        },
        token: String,
        kind: {
            type: String,
            default: 'local'
        },
        ban: {
            type: Boolean,
            default: false
        },
        mute: {
            type: Boolean,
            default: false
        }
    }, {
        versionKey: false
    }
)

UserSchema.pre('save', async function(next) {
    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(this.password, salt)
        this.password = hash
        this.token = crypto.randomBytes(16).toString('hex')
        return next()
    } catch (err) {
        return next(err)
    }
})

UserSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, (err, res) => {
        if (err) callback(err)
        callback(null, res)
    })
}

module.exports = mongoose.model('User', UserSchema)