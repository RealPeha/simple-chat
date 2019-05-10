const WebSocket = require('ws'),
      Message = require('./models/message' ),
      User = require('./models/user')

const clients = new Set()
const online = new Set()

const clearMsg = (msg) => {
    msg = msg.replace(/<!--(.*?)[-][-][>]/g, '')
    msg = msg.replace(/&nbsp;/g, ' ')
    msg = msg.replace(/[\t]/g, ' ')
    msg = msg.replace(/[ ]{2,}/g, ' ')
    msg = msg.replace(/[\s]+([\r\n])/g, '\r\n')
    msg = msg.replace(/([\r\n])[\s]+/g, '\r\n')
    msg = msg.replace(/[\r\n]{2,}/g, '\r\n')
    return msg
}

const colors = ['#FFF542', '#BFE3BA', '#D4D9DB', '#E89CB5', '#E3B838', 'cyan', 'khaki', 'tan']

const create = (server) => {
    const wsServer = new WebSocket.Server({
        server: server,
        clientTracking: false
    })
    
    //Рассылка сообщений
    wsServer.broadcast = async (data, socket = false) => {
        const transferData = data
        for (let client of clients) {
            data = transferData
            if (client.readyState === WebSocket.OPEN) {
                if (socket) {
                    if (client !== socket) {
                        data = JSON.stringify(data)
                        client.send(data)
                    }
                } else {
                    if (data.type == 'users') {
                        const onlineUsers = Array.from(online)
                        if (client.user.admin) {
                            const allUsers = await User.find({})
                            const users = []
                            for (i in allUsers) {
                                let status = 'offline'
                                for (j in onlineUsers) {
                                    if (allUsers[i].nickname == onlineUsers[j].nickname && allUsers[i].kind == onlineUsers[j].kind) {
                                        status = 'online'
                                    }
                                }
                                const user = {
                                    nickname: allUsers[i].nickname,
                                    status: status,
                                    kind: allUsers[i].kind,
                                    token: allUsers[i].token
                                }
                                if (status == 'online') {
                                    users.unshift(user)
                                } else {
                                    users.push(user)
                                }
                            }
                            data.data = users
                        } else {
                            const users = []
                            for (i in onlineUsers) {
                                const user = {
                                    nickname: onlineUsers[i].nickname,
                                    status: 'online',
                                    kind: onlineUsers[i].kind,
                                    token: ''
                                }
                                users.unshift(user)
                            }
                            data.data = users
                        }
                    }
                    data = JSON.stringify(data)
                    client.send(data)
                }
            }
        }
    }
    wsServer.on('connection', async (socket, req) => {
        //Воспомогательный метод отправки сообщения
        socket.post = (data) => {
            data = JSON.stringify(data)
            socket.send(data)
        }

        const token = req.url.split('=')[1]

        let spam = false

        let user = await User.findOne({token: token})
        user = user.toObject()

        //Пользователь не найден либо нет токена
        if (!user || !token) {
            socket.close()
            return false
        }

        //Если пользователь уже забанен
        if (user.ban) {
            socket.post({
                type: 'error',
                text: 'Вы были забанены администратором'
            })
            socket.close()
            return false
        }
        
        //Берем цвета ника и текста
        const color = colors.shift() || 'white'

        socket.user = user

        //Client tracking
        clients.add(socket)
        online.add(user)

         //Рассылаем что мы подключились
         wsServer.broadcast({
            type: 'info',
            text: `${user.nickname} вошел в чат`
        }, socket)
        //Рассылаем список пользователей
        wsServer.broadcast({
            type: 'users',
            data: Array.from(online)
        })

        socket.on('message', async (message) => {
            try {
                message = JSON.parse(message)
            } catch (err) {
                return false
            }
            //Команда забанить пользователя
            if (message.type == 'ban') {
                if (user.admin) {
                    const ban = (await User.findOne({token: message.token})).ban
                    await User.updateOne({token: message.token}, { $set: {ban: !ban}})
                    if (!ban) {
                        clients.forEach(client => {
                            if (client.user.token == message.token) {
                                client.close()
                            }
                        })
                    }
                } else {
                    socket.post({
                        type:'error',
                        text: 'У вас нет прав'
                    })
                }
            //Замутить пользователя
            } else if (message.type == 'mute') {
                if (user.admin) {
                    const mute = (await User.findOne({token: message.token})).mute
                    await User.updateOne({token: message.token}, { $set: {mute: !mute}})
                } else {
                    socket.post({
                        type:'error',
                        text: 'У вас нет прав'
                    })
                }
            //Делаем админом
            } else if (message.type == 'admin') {
                if (user.admin) {
                    const admin = (await User.findOne({token: message.token})).admin
                    await User.updateOne({token: message.token}, { $set: {admin: !admin}})
                } else {
                    socket.post({
                        type:'error',
                        text: 'У вас нет прав'
                    })
                }
            //Принимаем сообщение
            } else if (message.type == 'message') {
                message.text = clearMsg(message.text)
                //user = await User.findOne({token: token})
                if (user.mute) {
                    return socket.post({
                        type: 'error',
                        text: 'Вы не можете отправлять сообщения'
                    })
                }
                if (spam) {
                    return socket.post({
                        type: 'error',
                        text: 'Нельзя отправлять сообщения так часто. Интервал 15 сек.'
                    })
                }
                if (message.text.length > 200) {
                    return socket.post({
                        type: 'error',
                        text: 'Сообщение не должно превышать 200 символов'
                    })
                }
                spam = true
                setTimeout(() => spam = false, 15000)
                const msg = new Message({
                    user: user.nickname,
                    text: message.text,
                    kind: user.kind,
                    color: color
                })
                let outputMsg = await msg.save()
                outputMsg = outputMsg.toObject()
                outputMsg.token = user.token

                //Рассылаем сообщение всем пользователям
                wsServer.broadcast({
                    type: 'message',
                    data: outputMsg
                })
            }
        })
      
        socket.on('close', async () => {
            clients.delete(socket)
            online.delete(user)

            //Возвращаем цвета
            colors.push(color)

            //Рассылаем остальным что мы отключились
            wsServer.broadcast({
                type: 'info',
                text: `${user.nickname} покинул чат`
            }, socket)

            //Рассылаем список пользователей
            wsServer.broadcast({
                type: 'users',
                data: Array.from(online)
            })
        })
    })
}

module.exports = {
    create: create
}