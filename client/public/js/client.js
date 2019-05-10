function initWebSocket(token) {
    window.WebSocket = window.WebSocket || window.MozWebSocket
    const socket = new WebSocket(`ws://127.0.0.1:3000?token=${token}`)

    const send = document.querySelector('#send')
    const field = document.querySelector('#field')
    const messages = document.querySelector('#messages')
    const admin = document.querySelector('#admin-menu')

    socket.post = (data) => {
        data = JSON.stringify(data)
        socket.send(data)
    }

    //Open admin panel
    document.addEventListener('click', () => {
        admin.style.display = 'none'
    }, true)

    const users = document.querySelector('#users')
    users.addEventListener('click', ({target, clientX, clientY}) => {
        if (target.className == 'nick') {
            const token = target.dataset.token
            
            admin.style.display = 'block'
            admin.style.left = clientX + 'px'
            admin.style.top = clientY + 'px'
            document.querySelector('#admin').onclick = () => {
                socket.post({
                    type: 'admin',
                    token: token
                })
            }
            document.querySelector('#ban').onclick = () => {
                socket.post({
                    type: 'ban',
                    token: token
                })
            }
            document.querySelector('#mute').onclick = () => {
                socket.post({
                    type: 'mute',
                    token: token
                })
            }
        }
    })

    messages.scroll(0, 100000)
    
    socket.onmessage = message => {
        const data = JSON.parse(message.data)
        //Принимаем список пользователей
        if (data.type == 'users') {
            users.innerHTML = ''
            for (let user of data.data) {
                let kind = ''
                if (user.kind == 'github') {
                    kind = `<div class="kind"><img src="img/github.svg"></div>`
                }
                users.innerHTML += `
                <div class="user ${user.admin ? 'admin' : ''}">
                    ${kind}
                    <div class="nick" data-token="${user.token}">${user.nickname}</div>
                    <div class='status ${user.status || 'online'}'>${user.status || 'Online'}</div>
                </div>`
            }
        //Принимаем сообщение
        } else if (data.type == 'message') {
            let kind = ''
            if (data.data.kind == 'github') {
                kind = `<div class="kind"><img src="img/github.svg"></div>`
            }
            const message = document.querySelectorAll('.message')
            let nick = false
            for (let i = message.length - 1; i > 0; i--) {
                const lastMessage = message[i]
                const title = lastMessage.children[0].children
                if (title.length) {
                    nick = title[title.length - 2].innerHTML
                    break
                }
            }
            const sender = `
                ${kind}
                <div class="sender" style="color: ${data.data.color}">${data.data.user}</div>
                <div class="date">${data.data.date}</div>`
            messages.innerHTML += `
                <div class="message ${data.data.token == token ? 'right' : ''}">
                    <div class="title">
                        ${nick != data.data.user ? sender : ''}
                    </div>
                    <div class="text" style="color: ${data.data.color}">${data.data.text}</div>
                </div>`
        //Сообщение подключился/отключился
        } else if (data.type == 'info') {
            messages.innerHTML += `
                <div class="message info">
                    <div class="text">${data.text}</div>
                </div>`
        //Выводим ошибку
        } else if (data.type == 'error') {
            alert(data.text)
        }
    }

    socket.onclose = () => {
        window.location.href = '/logout'
    }


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

    send.addEventListener('click', () => {
        sendMessage()
    })

    field.addEventListener('keydown', (e) => {
        if (e.keyCode == 13) {
            sendMessage()
        }
    })

    const sendMessage = () => {
        let msg = field.value
        msg = clearMsg(msg)
        if (msg == '') {
            return
        }
        field.value = ''
        socket.post({
            type: 'message',
            text: msg
        })
    }
}