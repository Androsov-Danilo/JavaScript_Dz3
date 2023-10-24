const { Telegraf } = require('telegraf')
const sqlite3 = require('sqlite3').verbose()

const bot = new Telegraf('6373366804:AAE5_alofKpDkRmufoFt3XjEIhcOJufKUgM')

const db = new sqlite3.Database('db.sqlite3')



function createUserTable(){
    const query = `CREATE TABLE Users(
        id INTEGER PRIMARY KEY,
        status varchar(255),
        friend int
    );`
    db.run(query)
}// создание базы даных
// createUserTable()

function addUser(id){
    const query = `INSERT INTO Users (id, status) VALUES(?,?)`
    db.run(query, [id,"in_search"])
}//Функция добавления пользователя в базу даных

function getUser(id, callback){
    const query = `SELECT status, friend FROM Users WHERE id = ${id}`
    db.get(query, (err, res) => {
        callback(res)
    } )
}//Функция получения пользователя

function updateStatus(id, status){
    const query = `UPDATE Users SET status = '${status}' WHERE id = ${id}`
    db.run(query)
}// Функция обновления статуса

function updateFriend(id, friend){
    const query = `UPDATE Users SET friend = ${friend} WHERE id = ${id}`
    db.run(query)
}// Функция обновления людей с которыми мы сейчас говорим

function getInSearchUsers(id, callback){
    const query = `SELECT id FROM Users WHERE status = 'in_search' AND id <> ${id}`
    db.all(query, (err, res) => {
        callback(res)
    })
}// Функция получения id всех пользователей со статусом В поиске кроме своего


function findFriend(id){
    getInSearchUsers(id,(res)=>{
        if (res.length > 0){
            const index = Math.floor(Math.random()*res.length)
            const randomUser = res[index]
            updateStatus(id, 'meet')
            updateStatus(randomUser.id, 'meet')
            updateFriend(id, randomUser.id)
            updateFriend(randomUser.id, id)
            bot.telegram.sendMessage(randomUser.id,"Співрозмовника знайдено. Можете спілкуватись")
            bot.telegram.sendMessage(id,"Співрозмовника знайдено. Можете спілкуватись")
        }
    })
}// Функция в которой мы принемаем всех пользователей со статусом in_search и рандомным образом добавляем из в Friend

bot.start((ctx) =>{
    getUser(ctx.from.id, (res) => {
        if (res){
            if(res.status == "standart"){
                updateStatus(ctx.from.id, "in_search");
                ctx.reply('Шукаємо співрозмовника')
                findFriend(ctx.from.id)
            } else if(res.status == "in_search"){
                ctx.reply('Ми вже шукаємо співрозмовника')
            } else if(res.status == "meet"){
                ctx.reply('У вас вже є співрозмовник напишіть /stop щоб зупинити бесіду')
            }
        } else{
            addUser(ctx.from.id)
            ctx.reply('Шукаємо співрозмовника')
            findFriend(ctx.from.id)
        }
    })
})// Функция старт которая проверяет является ли наш статус in_search если да то вызываем функцию findFriend / Функция распределяющая ожидающих людей по чатам

bot.command("stop", (ctx)=>{
    getUser(ctx.from.id, (res)=>{
        if (res){
            if (res.status == "meet"){
                updateStatus(ctx.from.id, "standart")
                updateFriend(ctx.from.id, null)
                updateStatus(res.friend, 'standart')
                updateFriend(res.friend, null)
                ctx.reply('Розмову закінчено.')
                bot.telegram.sendMessage(res.friend,'Співрозмовник завершив бесіду.')
            } else{
                ctx.reply("У вас немає співрозмовника.")
            }
        }
    })
})// Функция для остановки переписки с рандомными людьми 

bot.on('text',(ctx)=>{
    getUser(ctx.from.id,(res)=>{
        if (res){
            if (res.status == 'meet'){
                bot.telegram.sendMessage(res.friend,ctx.message.text)
            } else {
                ctx.reply('З ким ви спілкуєтесь?')
            }
        } else {
            ctx.reply('Напишіть /start щоб знайти співрозмовника.')
        }
    })
})// Функция которая отправляет сообщения другому пользователю

bot.launch()  

