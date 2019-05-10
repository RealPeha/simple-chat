const mongoose = require('../mongo'),
      moment = require('moment')

const Schema = mongoose.Schema

const MsgSchema = new Schema(
    {
        date: {
            type: String,
            default: moment().format('DD.MM.YYYY, HH:mm')
        },
        user: String,
        text: String,
        color: {
            type: String,
            default: 'white'
        },
        kind: {
            type: String,
            default: 'local'
        }
    }, {
        versionKey: false
    }
)

module.exports = mongoose.model('Message', MsgSchema)