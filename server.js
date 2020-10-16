//Module
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat Bot';

//Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id,username, room)
     

        socket.join(user.room);

    //Welcome current user
    socket.emit('message', formatMessage(botName, 'Benvenuto su Just Chatting!'));

    //Broadcast when a user connection
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} è entrato nella stanza`));

    //Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });
    });
    

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
    
        io.to(user.room).emit('message', formatMessage(user.username, msg));
      });
    
    //Keypress
    socket.on('typing', msg => {
        const user = getCurrentUser(socket.id);

        socket.broadcast.to(user.room).emit('tiping', msg)
    })

    

     //Runs whwn client disconnects
     socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} ha lasciato la stanza`));
            
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));